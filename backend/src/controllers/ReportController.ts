import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../config/db';

/**
 * Số liệu tổng quan cho trang chủ.
 *
 * Trước đây trang chủ tự dựng số liệu ở phía trình duyệt: gọi
 * `/customers?page=1&limit=500`, kéo cả 500 bản ghi kèm quan hệ owner và
 * company về máy người dùng, rồi duyệt mảng đó năm lượt để ra đúng vài chục con
 * số. Việc đó tốn băng thông cho dữ liệu không ai nhìn, và giới hạn 500 khiến
 * số liệu sai lặng lẽ ngay khi công ty vượt 500 khách hàng.
 *
 * Bản này để PostgreSQL gom nhóm. Kết quả trả về là vài trăm byte và luôn đúng
 * với toàn bộ dữ liệu, không phụ thuộc vào một trần phân trang.
 */

// Số nhóm hiển thị trên biểu đồ hiệu suất
const PERFORMANCE_LIMIT = 6;

const monthsOfCurrentYear = (rows: Array<{ month: number; value: number }>) => {
  const buckets = new Map<number, number>();
  for (let m = 1; m <= 12; m++) buckets.set(m, 0);
  for (const r of rows) buckets.set(Number(r.month), Number(r.value) || 0);
  return Array.from(buckets.entries()).map(([month, value]) => ({ month, value }));
};

export const Summary = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  // Người dùng thường luôn chỉ thấy dữ liệu của mình. Admin xem toàn công ty
  // trừ khi chủ động chọn "Của tôi".
  const isAdmin  = user.role === 'admin';
  const wantsAll = isAdmin && req.query.scope !== 'mine';
  const ownerId  = wantsAll ? null : user.id;

  const where: Prisma.CustomerWhereInput = ownerId === null ? {} : { owner_id: ownerId };

  try {
    const [
      totals,
      signedCount,
      totalCompanies,
      byStatus,
      bySource,
      monthlyRows,
      recent,
    ] = await Promise.all([
      prisma.customer.aggregate({ where, _count: { _all: true }, _sum: { price: true } }),

      prisma.customer.count({
        where: { ...where, status: { in: ['SIGNED', 'CONTRACT_SENT'] } },
      }),

      prisma.company.count(
        ownerId === null
          ? undefined
          : { where: { customers: { some: { owner_id: ownerId } } } }
      ),

      prisma.customer.groupBy({ by: ['status'], where, _count: { _all: true } }),

      prisma.customer.groupBy({ by: ['from_source'], where, _count: { _all: true } }),

      // created_at là TIMESTAMP không kèm múi giờ, nên EXTRACT đọc đúng giá trị
      // đã lưu — không cần (và không được) chuyển đổi múi giờ ở đây.
      ownerId === null
        ? prisma.$queryRaw<Array<{ month: number; value: number }>>`
            SELECT EXTRACT(MONTH FROM created_at)::int AS month,
                   COALESCE(SUM(price), 0)::float8     AS value
            FROM customers
            WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            GROUP BY 1 ORDER BY 1`
        : prisma.$queryRaw<Array<{ month: number; value: number }>>`
            SELECT EXTRACT(MONTH FROM created_at)::int AS month,
                   COALESCE(SUM(price), 0)::float8     AS value
            FROM customers
            WHERE owner_id = ${ownerId}
              AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            GROUP BY 1 ORDER BY 1`,

      prisma.customer.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          price: true,
          created_at: true,
          updated_at: true,
          owner:   { select: { name: true } },
          company: { select: { name: true } },
        },
      }),
    ]);

    // ── Hiệu suất: admin xem toàn công ty thì tách theo nhân viên, còn lại
    //    tách theo lĩnh vực ────────────────────────────────────────────────
    let performance: Array<{ label: string; revenue: number; count: number }>;

    if (wantsAll) {
      const grouped = await prisma.customer.groupBy({
        by: ['owner_id'],
        where,
        _count: { _all: true },
        _sum: { price: true },
      });

      const ownerIds = grouped
        .map((g) => g.owner_id)
        .filter((id): id is number => id !== null);

      // Một truy vấn cho tất cả tên, thay vì mỗi nhóm một lần tra cứu
      const owners = ownerIds.length
        ? await prisma.user.findMany({
            where:  { id: { in: ownerIds } },
            select: { id: true, name: true },
          })
        : [];
      const nameById = new Map(owners.map((o) => [o.id, o.name]));

      performance = grouped.map((g) => ({
        label: (g.owner_id !== null ? nameById.get(g.owner_id) : null) ?? 'Chưa gán',
        revenue: Number(g._sum.price ?? 0),
        count: g._count._all,
      }));
    } else {
      const grouped = await prisma.customer.groupBy({
        by: ['field'],
        where,
        _count: { _all: true },
        _sum: { price: true },
      });

      performance = grouped.map((g) => ({
        label: g.field || 'Khác',
        revenue: Number(g._sum.price ?? 0),
        count: g._count._all,
      }));
    }

    performance.sort((a, b) => b.revenue - a.revenue);
    performance = performance.slice(0, PERFORMANCE_LIMIT);

    const totalCustomers = totals._count._all;

    return res.json({
      scope: wantsAll ? 'all' : 'mine',
      totalCustomers,
      totalPipelineValue: Number(totals._sum.price ?? 0),
      totalCompanies,
      conversionRate:
        totalCustomers > 0 ? Math.round((signedCount / totalCustomers) * 100) : 0,

      // Gom nhóm thô; việc gán nhãn và màu vẫn thuộc về giao diện
      statusCounts: byStatus.map((s) => ({
        status: s.status ?? 'NEW',
        count: s._count._all,
      })),
      sourceCounts: bySource.map((s) => ({
        source: s.from_source ?? '',
        count: s._count._all,
      })),

      monthly: monthsOfCurrentYear(monthlyRows),
      performance,

      recent: recent.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        price: c.price === null ? null : Number(c.price),
        ownerName: c.owner?.name ?? null,
        companyName: c.company?.name ?? null,
        updatedAt: c.updated_at ?? c.created_at,
      })),
    });
  } catch (err) {
    console.error('Lỗi lấy số liệu tổng quan:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy số liệu tổng quan.' });
  }
};

import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../config/db';
import { SimpleCache } from '../helpers/memoryCache';

/**
 * Số liệu tổng quan cho trang chủ.
 *
 * Trước đây trang chủ tự dựng số liệu ở phía trình duyệt: gọi
 * `/customers?page=1&limit=500`, kéo cả 500 bản ghi kèm quan hệ owner và
 * company về máy người dùng, rồi duyệt mảng đó năm lượt để ra đúng vài chục con
 * số. Việc đó tốn băng thông cho dữ liệu không ai nhìn, và giới hạn 500 khiến
 * số liệu sai lặng lẽ ngay khi công ty vượt 500 khách hàng.
 *
 * Bản kế tiếp chuyển việc gom nhóm sang PostgreSQL nhưng tách thành 15 truy vấn
 * Prisma. Cơ sở dữ liệu đặt ở Supabase Singapore, mỗi lượt đi về mất ~225ms, và
 * pool kết nối không chạy hết 15 truy vấn cùng lúc — đo được 1,6 giây cho một
 * công ty chỉ có 54 khách hàng. Thời gian nằm ở số lượt mạng chứ không ở dữ liệu.
 *
 * Bản này gom tất cả vào MỘT câu SQL (CTE + json_build_object): một lượt mạng
 * duy nhất, PostgreSQL quét bảng customers một lần bằng COUNT … FILTER.
 */

// Số liệu còn "tươi" trong 30 giây; sau đó vẫn trả bản cũ ngay lập tức và tính
// lại ở nền (stale-while-revalidate), tối đa 10 phút. Người mở trang chủ không
// còn phải chờ truy vấn chỉ vì bộ đệm vừa hết hạn.
const FRESH_MS = 30_000;
const STALE_MS = 10 * 60_000;
const summaryCache = new SimpleCache<{ data: ReportSummary; at: number }>(STALE_MS, 200);
// Nhiều người mở trang chủ cùng lúc khi bộ đệm trống thì chỉ chạy một truy vấn.
const inFlight = new Map<string, Promise<ReportSummary>>();

// Số nhóm hiển thị trên biểu đồ hiệu suất
const PERFORMANCE_LIMIT = 6;

type Row = Record<string, any>;
type ReportSummary = Record<string, unknown>;

const monthsOfCurrentYear = (rows: Array<{ month: number; value: number; count?: number }>) => {
  const buckets = new Map<number, { value: number; count: number }>();
  for (let m = 1; m <= 12; m++) buckets.set(m, { value: 0, count: 0 });
  for (const r of rows) {
    buckets.set(Number(r.month), {
      value: Number(r.value) || 0,
      count: Number(r.count) || 0,
    });
  }
  return Array.from(buckets.entries()).map(([month, data]) => ({
    month,
    value: data.value,
    count: data.count,
  }));
};

const computeSummary = async (ownerId: number | null, wantsAll: boolean): Promise<ReportSummary> => {
  const now = new Date();
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  currentWeekStart.setHours(0, 0, 0, 0);

  const prevWeekStart = new Date(currentWeekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  // `${ownerId}::int IS NULL` cho phép một câu SQL dùng chung cho cả hai phạm vi.
  const [{ r }] = await prisma.$queryRaw<Array<{ r: Row }>>`
    WITH c AS (
      SELECT id, name, status, price, field, from_source, owner_id, company_id, created_at, updated_at
      FROM customers
      WHERE (${ownerId}::int IS NULL OR owner_id = ${ownerId}::int)
    )
    SELECT json_build_object(
      'totals', (
        SELECT json_build_object(
          'count',            COUNT(*),
          'sum',              COALESCE(SUM(price), 0)::float8,
          'signed',           COUNT(*) FILTER (WHERE status IN ('SIGNED', 'CONTRACT_SENT')),
          'quotedCount',      COUNT(*) FILTER (WHERE status = 'QUOTED'),
          'quotedSum',        COALESCE(SUM(price) FILTER (WHERE status = 'QUOTED'), 0)::float8,
          'inProgress',       COUNT(*) FILTER (WHERE status IN ('NEW', 'CONSULTING', 'DEMO_SENT')),
          'stopped',          COUNT(*) FILTER (WHERE status IN ('REJECTED', 'STOPCONSULTING')),
          'thisWeekCount',    COUNT(*) FILTER (WHERE created_at >= ${currentWeekStart}),
          'thisWeekSum',      COALESCE(SUM(price) FILTER (WHERE created_at >= ${currentWeekStart}), 0)::float8,
          'lastWeekSum',      COALESCE(SUM(price) FILTER (
                                WHERE created_at >= ${prevWeekStart} AND created_at < ${currentWeekStart}
                              ), 0)::float8
        ) FROM c
      ),
      'companies', CASE
        WHEN ${ownerId}::int IS NULL THEN (SELECT COUNT(*) FROM companies)
        ELSE (SELECT COUNT(DISTINCT company_id) FROM c WHERE company_id IS NOT NULL)
      END,
      'byStatus', (
        SELECT COALESCE(json_agg(json_build_object('status', status, 'count', n)), '[]'::json)
        FROM (SELECT status, COUNT(*) AS n FROM c GROUP BY status) s
      ),
      'bySource', (
        SELECT COALESCE(json_agg(json_build_object('source', from_source, 'count', n)), '[]'::json)
        FROM (SELECT from_source, COUNT(*) AS n FROM c GROUP BY from_source) s
      ),
      'byField', (
        SELECT COALESCE(json_agg(json_build_object('field', field, 'value', v, 'count', n)), '[]'::json)
        FROM (SELECT field, COALESCE(SUM(price), 0)::float8 AS v, COUNT(*) AS n FROM c GROUP BY field) s
      ),
      'byOwner', (
        SELECT COALESCE(json_agg(json_build_object('label', label, 'revenue', v, 'count', n)), '[]'::json)
        FROM (
          SELECT u.name AS label, COALESCE(SUM(c.price), 0)::float8 AS v, COUNT(*) AS n
          FROM c LEFT JOIN users u ON u.id = c.owner_id
          GROUP BY c.owner_id, u.name
        ) s
      ),
      'monthly', (
        SELECT COALESCE(json_agg(json_build_object('month', m, 'value', v, 'count', n)), '[]'::json)
        FROM (
          SELECT EXTRACT(MONTH FROM created_at)::int AS m, COALESCE(SUM(price), 0)::float8 AS v, COUNT(*) AS n
          FROM c
          WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
          GROUP BY 1
        ) s
      ),
      'daily', (
        SELECT COALESCE(json_agg(json_build_object('dow', d, 'revenue', v, 'count', n)), '[]'::json)
        FROM (
          SELECT EXTRACT(ISODOW FROM created_at)::int AS d, COALESCE(SUM(price), 0)::float8 AS v, COUNT(*) AS n
          FROM c
          WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY 1
        ) s
      ),
      'recent', (
        SELECT COALESCE(json_agg(t ORDER BY t.created_at DESC, t.id DESC), '[]'::json)
        FROM (
          -- Cột timestamp không kèm múi giờ (lưu UTC): json_agg sẽ in ra chuỗi
          -- không có "Z" và trình duyệt hiểu thành giờ địa phương, lệch 7 tiếng.
          SELECT c.id, c.name, c.status, c.price::float8 AS price, c.created_at,
                 to_char(c.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS updated_at,
                 u.name AS "ownerName", co.name AS "companyName"
          FROM c
          LEFT JOIN users u      ON u.id  = c.owner_id
          LEFT JOIN companies co ON co.id = c.company_id
          ORDER BY c.created_at DESC, c.id DESC
          LIMIT 7
        ) t
      )
    ) AS r`;

  const totals = r.totals;
  const totalCustomers = Number(totals.count);

  const byField: Array<{ field: string | null; value: number; count: number }> = r.byField;

  const performance = (
    wantsAll
      ? (r.byOwner as Array<{ label: string | null; revenue: number; count: number }>).map((g) => ({
          label: g.label ?? 'Chưa gán',
          revenue: Number(g.revenue),
          count: Number(g.count),
        }))
      : byField.map((g) => ({ label: g.field || 'Khác', revenue: Number(g.value), count: Number(g.count) }))
  )
    .sort((a, b) => b.revenue - a.revenue || b.count - a.count)
    .slice(0, PERFORMANCE_LIMIT);

  // Doanh thu theo thứ trong tuần Mon-Sun
  const dailyRows: Array<{ dow: number; revenue: number; count: number }> = r.daily;
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const daysOfWeek = dayLabels.map((day, idx) => {
    const found = dailyRows.find((d) => Number(d.dow) === idx + 1);
    return {
      day,
      revenue: found ? Number(found.revenue) : 0,
      count: found ? Number(found.count) : 0,
    };
  });

  // Top lĩnh vực thực tế: chuẩn hoá chữ hoa/thường, gộp nhóm và tính cả doanh thu + số lượng khách
  const fieldMap = new Map<string, { value: number; count: number }>();
  for (const c of byField) {
    const raw = (c.field ?? '').trim();
    if (!raw || raw.toLowerCase() === 'null' || raw.toLowerCase() === 'undefined' || raw.includes('+84') || /^\d+$/.test(raw)) continue;
    // Chuẩn hoá viết hoa chữ cái đầu (VD: "Giáo Dục" và "Giáo dục" thành "Giáo dục")
    const norm = raw.charAt(0).toUpperCase() + raw.slice(1);
    const existing = fieldMap.get(norm) ?? { value: 0, count: 0 };
    existing.value += Number(c.value) || 0;
    existing.count += Number(c.count) || 0;
    fieldMap.set(norm, existing);
  }

  const topCategories = Array.from(fieldMap.entries())
    .map(([name, stat]) => ({ name, value: stat.value, count: stat.count }))
    .sort((a, b) => (b.value !== a.value ? b.value - a.value : b.count - a.count))
    .slice(0, 6);

  // Chuẩn hoá nguồn khách hàng: gom các nguồn null/rỗng thành 'Trực tiếp / Chưa gán'
  const sourceMap = new Map<string, number>();
  for (const s of (r.bySource as Array<{ source: string | null; count: number }>)) {
    const raw = (s.source ?? '').trim();
    const cleanSource = (!raw || raw.toLowerCase() === 'null' || raw.toLowerCase() === 'undefined')
      ? 'Trực tiếp / Chưa gán'
      : raw;
    sourceMap.set(cleanSource, (sourceMap.get(cleanSource) ?? 0) + Number(s.count));
  }
  const sourceCounts = Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  return {
    scope: wantsAll ? 'all' : 'mine',
    totalCustomers,
    totalPipelineValue: Number(totals.sum),
    totalCompanies: Number(r.companies),
    conversionRate: totalCustomers > 0 ? Math.round((Number(totals.signed) / totalCustomers) * 100) : 0,

    quotedValue: Number(totals.quotedSum),
    quotedCount: Number(totals.quotedCount),
    inProgressCount: Number(totals.inProgress),
    stoppedCount: Number(totals.stopped),

    thisWeekRevenue: Number(totals.thisWeekSum),
    lastWeekRevenue: Number(totals.lastWeekSum),
    thisWeekCount: Number(totals.thisWeekCount),
    daysOfWeek,

    topCategories,

    statusCounts: (r.byStatus as Array<{ status: string | null; count: number }>).map((s) => ({
      status: s.status ?? 'NEW',
      count: Number(s.count),
    })),
    sourceCounts,

    monthly: monthsOfCurrentYear(r.monthly),
    performance,

    recent: (r.recent as Row[]).map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      price: c.price === null ? null : Number(c.price),
      ownerName: c.ownerName ?? null,
      companyName: c.companyName ?? null,
      updatedAt: c.updated_at ?? c.created_at,
    })),
  };
};

const refresh = (key: string, ownerId: number | null, wantsAll: boolean) => {
  let job = inFlight.get(key);
  if (!job) {
    job = computeSummary(ownerId, wantsAll)
      .then((data) => {
        summaryCache.set(key, { data, at: Date.now() });
        return data;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, job);
  }
  return job;
};

export const Summary = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  const isAdmin  = user.role === 'admin';
  const wantsAll = isAdmin && req.query.scope !== 'mine';
  const ownerId  = wantsAll ? null : user.id;
  const cacheKey = `summary_${ownerId ?? 'all'}`;

  const cached = summaryCache.get(cacheKey);
  if (cached) {
    if (Date.now() - cached.at > FRESH_MS) {
      refresh(cacheKey, ownerId, wantsAll).catch((err) => console.error('Lỗi làm mới số liệu tổng quan:', err));
    }
    return res.json(cached.data);
  }

  try {
    return res.json(await refresh(cacheKey, ownerId, wantsAll));
  } catch (err) {
    console.error('Lỗi lấy số liệu tổng quan:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy số liệu tổng quan.' });
  }
};

/* ==========================================================================
   DOANH THU THEO BỘ LỌC — GET /reports/revenue
   --------------------------------------------------------------------------
   "Doanh thu" theo cách công ty dùng = số tiền đã BÁO GIÁ cho khách (cột
   price của khách đã tới bước báo giá), không phải tiền đã thu về. Tính theo
   ngày tạo khách vì hệ thống chưa lưu ngày gửi báo giá. Chia theo ngày / tháng
   / năm, kèm tổng của kỳ liền trước cùng độ dài để so.

     range: 7d | 30d | month | quarter | year | all
     stage: quoted  — mọi báo giá đã gửi (QUOTED, CONTRACT_SENT, SIGNED) — mặc định
            pending — báo giá đang chờ phản hồi (QUOTED)
            won     — báo giá đã chốt (CONTRACT_SENT, SIGNED), cùng định nghĩa với tỷ lệ chốt

   Khách chưa tới bước báo giá không được tính: price của họ chỉ là giá trị dự
   kiến, chưa phải con số đã đưa cho khách.

   Mốc ngày tính theo giờ Việt Nam (UTC+7, không có giờ mùa hè): cột created_at
   lưu UTC, nên 23h ngày 1 giờ VN là 16h UTC — gom theo UTC sẽ dồn sai ngày.
   ========================================================================== */

const VN_OFFSET_MS = 7 * 3600_000;
const DAY_MS = 86_400_000;
const RANGES = ['7d', '30d', 'month', 'quarter', 'year', 'all'] as const;
const STAGES: Record<string, string[] | null> = {
  all: null, // Tất cả dự án
  quoted: ['QUOTED', 'CONTRACT_SENT', 'SIGNED'],
  pending: ['QUOTED'],
  won: ['CONTRACT_SENT', 'SIGNED'],
};
type Range = (typeof RANGES)[number];
type Unit = 'day' | 'month' | 'year';

const revenueCache = new SimpleCache<unknown>(30_000, 500);

// Mốc 0h giờ VN của ngày (y, m, d), đổi về thời điểm UTC tương ứng.
const vnMidnight = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d) - VN_OFFSET_MS);

const rangeWindow = (range: Range, now = new Date()): { start: Date | null; end: Date; unit: Unit } => {
  const vn = new Date(now.getTime() + VN_OFFSET_MS);
  const y = vn.getUTCFullYear();
  const m = vn.getUTCMonth();
  const d = vn.getUTCDate();
  const tomorrow = vnMidnight(y, m, d + 1);

  switch (range) {
    case '7d':
      return { start: vnMidnight(y, m, d - 6), end: tomorrow, unit: 'day' };
    case '30d':
      return { start: vnMidnight(y, m, d - 29), end: tomorrow, unit: 'day' };
    case 'month':
      return { start: vnMidnight(y, m, 1), end: vnMidnight(y, m + 1, 1), unit: 'day' };
    case 'quarter': {
      const q = Math.floor(m / 3) * 3;
      return { start: vnMidnight(y, q, 1), end: vnMidnight(y, q + 3, 1), unit: 'month' };
    }
    case 'year':
      return { start: vnMidnight(y, 0, 1), end: vnMidnight(y + 1, 0, 1), unit: 'month' };
    default:
      return { start: null, end: tomorrow, unit: 'month' };
  }
};

// Danh sách khoá mốc (YYYY-MM-DD theo giờ VN) từ start tới trước end.
const bucketKeys = (start: Date, end: Date, unit: Unit) => {
  const keys: string[] = [];
  const cur = new Date(start.getTime() + VN_OFFSET_MS);
  const stop = end.getTime() + VN_OFFSET_MS;
  while (cur.getTime() < stop && keys.length < 400) {
    keys.push(cur.toISOString().slice(0, 10));
    if (unit === 'day') cur.setUTCDate(cur.getUTCDate() + 1);
    else if (unit === 'month') cur.setUTCMonth(cur.getUTCMonth() + 1);
    else cur.setUTCFullYear(cur.getUTCFullYear() + 1);
  }
  return keys;
};

export const Revenue = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực.' });

  const range: Range = RANGES.includes(req.query.range as Range) ? (req.query.range as Range) : '30d';
  const stage = typeof req.query.stage === 'string' && req.query.stage in STAGES ? req.query.stage : 'all';
  const wantsAll = user.role === 'admin' && req.query.scope !== 'mine';
  const ownerId = wantsAll ? null : user.id;

  const cacheKey = `revenue_${ownerId ?? 'all'}_${range}_${stage}`;
  const cached = revenueCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const statuses = STAGES[stage];
    const statusCondition = statuses && statuses.length > 0
      ? Prisma.sql`AND status = ANY(${statuses}::text[])`
      : Prisma.empty;

    const win = rangeWindow(range);
    const { end } = win;
    let { start, unit } = win;

    // "Toàn thời gian": bắt đầu từ tháng của khách hàng đầu tiên; quá 24 tháng
    // thì gom theo năm để biểu đồ không thành một hàng cột li ti.
    if (!start) {
      const [{ first }] = await prisma.$queryRaw<Array<{ first: Date | null }>>`
        SELECT MIN(created_at) AS first FROM customers
        WHERE (${ownerId}::int IS NULL OR owner_id = ${ownerId}::int)
          ${statusCondition}`;
      const f = new Date((first ?? new Date()).getTime() + VN_OFFSET_MS);
      const months = (end.getTime() - f.getTime()) / (30 * DAY_MS);
      unit = months > 24 ? 'year' : 'month';
      start = unit === 'year' ? vnMidnight(f.getUTCFullYear(), 0, 1) : vnMidnight(f.getUTCFullYear(), f.getUTCMonth(), 1);
    }

    // Kỳ trước: cùng độ dài, nằm ngay trước kỳ này. Với "tháng/quý/năm này" chỉ
    // tính phần đã trôi qua, để giữa tháng không bị so với nguyên tháng trước.
    const today = rangeWindow('7d').end;
    const span = Math.min(end.getTime(), today.getTime()) - start.getTime();
    const prevStart = range === 'all' ? null : new Date(start.getTime() - span);

    const [{ r }] = await prisma.$queryRaw<Array<{ r: Row }>>`
      WITH c AS (
        SELECT price, created_at FROM customers
        WHERE (${ownerId}::int IS NULL OR owner_id = ${ownerId}::int)
          ${statusCondition}
      )
      SELECT json_build_object(
        'total',     (SELECT COALESCE(SUM(price), 0)::float8 FROM c WHERE created_at >= ${start} AND created_at < ${end}),
        'count',     (SELECT COUNT(*) FROM c WHERE created_at >= ${start} AND created_at < ${end}),
        'withPrice', (SELECT COUNT(*) FROM c WHERE created_at >= ${start} AND created_at < ${end} AND price > 0),
        'prevTotal', (SELECT COALESCE(SUM(price), 0)::float8 FROM c WHERE created_at >= ${prevStart} AND created_at < ${start}),
        'prevCount', (SELECT COUNT(*) FROM c WHERE created_at >= ${prevStart} AND created_at < ${start}),
        'buckets', (
          SELECT COALESCE(json_agg(json_build_object('key', k, 'value', v, 'count', n)), '[]'::json)
          FROM (
            SELECT to_char(date_trunc(${unit}::text, created_at + INTERVAL '7 hours'), 'YYYY-MM-DD') AS k,
                   COALESCE(SUM(price), 0)::float8 AS v, COUNT(*)::int AS n
            FROM c WHERE created_at >= ${start} AND created_at < ${end}
            GROUP BY 1
          ) s
        )
      ) AS r`;

    const found = new Map(
      (r.buckets as Array<{ key: string; value: number; count: number }>).map((b) => [b.key, b])
    );
    const data = {
      range,
      stage,
      scope: wantsAll ? 'all' : 'mine',
      unit,
      from: start.toISOString(),
      to: end.toISOString(),
      total: Number(r.total),
      count: Number(r.count),
      withPrice: Number(r.withPrice),
      prevTotal: prevStart ? Number(r.prevTotal) : null,
      prevCount: prevStart ? Number(r.prevCount) : null,
      buckets: bucketKeys(start, end, unit).map((key) => ({
        key,
        value: Number(found.get(key)?.value ?? 0),
        count: Number(found.get(key)?.count ?? 0),
      })),
    };

    revenueCache.set(cacheKey, data);
    return res.json(data);
  } catch (err) {
    console.error('Lỗi lấy số liệu doanh thu:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy số liệu doanh thu.' });
  }
};

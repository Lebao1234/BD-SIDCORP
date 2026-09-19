import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../config/db';
import { parseId } from '../helpers/parseId';
import { canAccessCompany, isAdmin } from '../helpers/permissions';

// Các trường client được phép ghi. Dùng chung cho create/update để tránh
// lệch nhau giữa hai hàm mỗi khi schema thay đổi.
const pickCompanyFields = (body: Record<string, unknown>) => ({
  tax_code:        (body.tax_code        as string) || null,
  email:           (body.email           as string) || null,
  phone:           (body.phone           as string) || null,
  address:         (body.address         as string) || null,
  website:         (body.website         as string) || null,
  field:           (body.field           as string) || null,
  note:            (body.note            as string) || null,
  facebook:        (body.facebook        as string) || null,
  linkedin:        (body.linkedin        as string) || null,
  zalo:            (body.zalo            as string) || null,
  location:        (body.location        as string) || null,
  bank_name:       (body.bank_name       as string) || null,
  bank_account_no: (body.bank_account_no as string) || null,
  bank_branch:     (body.bank_branch     as string) || null,
});

export const createCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { name, status } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Tên công ty là bắt buộc' });
    }

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        status: status || undefined,
        ...pickCompanyFields(req.body)
      }
    });

    res.status(201).json(company);
  } catch (error) {
    console.error('Lỗi khi tạo công ty:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

export const updateCompany = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Chưa xác thực.' });

    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: 'ID doanh nghiệp không hợp lệ.' });
    }

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy công ty' });
    }

    if (!(await canAccessCompany(user, id))) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật doanh nghiệp này.' });
    }

    const { name, status } = req.body;

    const company = await prisma.company.update({
      where: { id },
      data: {
        // Không cho phép xoá trắng tên bằng payload thiếu trường
        name: typeof name === 'string' && name.trim() ? name.trim() : existing.name,
        status,
        ...pickCompanyFields(req.body)
      }
    });

    res.json(company);
  } catch (error) {
    console.error('Lỗi khi cập nhật công ty:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

export const getCompany = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Chưa xác thực.' });

    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: 'ID doanh nghiệp không hợp lệ.' });
    }

    const company = await prisma.company.findUnique({ where: { id } });

    if (!company) {
      return res.status(404).json({ message: 'Không tìm thấy công ty' });
    }

    // Dữ liệu doanh nghiệp có cả thông tin ngân hàng — bắt buộc kiểm tra quyền
    if (!(await canAccessCompany(user, id))) {
      return res.status(403).json({ message: 'Bạn không có quyền xem doanh nghiệp này.' });
    }

    res.json(company);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin công ty:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

export const listCompanies = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Chưa xác thực.' });

    // Mặc định cũ là 200: mọi lần gọi /companies đều trả về 200 doanh nghiệp
    // kèm một subquery đếm khách hàng cho từng dòng, kể cả khi nơi gọi chỉ cần
    // một trang. Nơi nào thực sự cần nhiều hơn thì tự truyền `limit`.
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const skip  = (page - 1) * limit;

    const whereClause = isAdmin(user)
      ? {}
      : { customers: { some: { owner_id: user.id } } };

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where:   whereClause,
        include: { _count: { select: { customers: true } } },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.company.count({ where: whereClause }),
    ]);

    res.json({ data: companies, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách công ty:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

export const deleteCompany = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Chưa xác thực.' });

    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: 'ID doanh nghiệp không hợp lệ.' });
    }

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy công ty.' });
    }

    if (!isAdmin(user) && !(await canAccessCompany(user, id))) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa doanh nghiệp này.' });
    }

    // Gỡ liên kết doanh nghiệp khỏi khách hàng trước khi xóa
    await prisma.customer.updateMany({
      where: { company_id: id },
      data: { company_id: null },
    });

    await prisma.company.delete({ where: { id } });

    res.json({ message: 'Xóa doanh nghiệp thành công.' });
  } catch (error) {
    console.error('Lỗi khi xóa công ty:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi xóa công ty.' });
  }
};

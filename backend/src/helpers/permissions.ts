import { prisma } from '../config/db';

interface AuthUser {
  id:   number;
  role: string;
  name: string;
}

export const isAdmin = (user: { role: string }): boolean => user.role === 'admin';

// Kiểm tra user là admin hoặc chính là owner
export const isAdminOrOwner = (user: AuthUser, ownerId: number): boolean =>
  user.role === 'admin' || user.id === ownerId;

// Một user thường chỉ được xem/sửa doanh nghiệp nếu doanh nghiệp đó gắn với
// ít nhất một khách hàng do họ phụ trách. Admin xem được tất cả.
// Quy tắc này phải khớp với bộ lọc trong CompanyController.listCompanies.
export const canAccessCompany = async (
  user: { id: number; role: string },
  companyId: number
): Promise<boolean> => {
  if (isAdmin(user)) return true;

  const linked = await prisma.customer.findFirst({
    where:  { company_id: companyId, owner_id: user.id },
    select: { id: true }
  });

  return linked !== null;
};

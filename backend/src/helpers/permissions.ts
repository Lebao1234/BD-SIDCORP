interface AuthUser {
  id:   number;
  role: string;
  name: string;
}

// Kiểm tra user là admin hoặc chính là owner
export const isAdminOrOwner = (user: AuthUser, ownerId: number): boolean =>
  user.role === 'admin' || user.id === ownerId;

// Kiểm tra user có thể được @mention trong context 1 customer
// Hiện tại cho phép tag bất kỳ user nào trong team để tiện trao đổi (2 chiều)
export const canBeMentioned = (
  targetUser: { id: number; role: string },
  customerOwnerId: number | null
): boolean => true;
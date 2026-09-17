import { Response } from 'express'
import { prisma } from '../config/db'
import { AuthRequest } from '../middlewares/auth'
import { formatUserId } from '../helpers/parseId'

// Lấy danh sách tất cả users (chỉ dành cho admin — xem routes/authRoute.ts)
//
// Lưu ý: các thao tác quản trị user khác (duyệt, đổi role, xoá, reset mật khẩu)
// nằm trong UserController và đã có kiểm tra quyền đầy đủ. Bản sao cũ của chúng
// ở file này không được gắn route nào và thiếu kiểm tra quyền, nên đã được gỡ bỏ
// để không ai vô tình đem ra dùng.
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id:       true,
        email:    true,
        name:     true,
        role:     true,
        approved: true
      },
      orderBy: { id: 'asc' }
    })

    return res.json({
      data: users.map(u => ({ ...u, displayId: formatUserId(u.id) }))
    })
  } catch (err) {
    console.error('Lỗi lấy danh sách người dùng:', err)
    return res.status(500).json({ error: 'Lỗi hệ thống khi lấy danh sách người dùng.' })
  }
}

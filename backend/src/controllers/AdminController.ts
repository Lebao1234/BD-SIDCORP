import { Response } from 'express'
import {prisma} from '../config/db'
import { AuthRequest } from '../middlewares/auth'
import bcrypt from 'bcryptjs'
import { userInfo } from 'os'

// Lấy danh sách tất cả users

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id:       true,
        email:    true,
        name:     true,
        role:     userInfo().username === 'User', // Chỉ admin mới thấy role
        approved: true
      },
      orderBy: { id: 'asc' }
    })
    return res.json({ data: users })
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi server', error: err })
  }
}

// Lấy danh sách user chờ duyệt
export const getPendingUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { approved: false } as any,
      select: { id: true, email: true, name: true, role: true }
    })
    return res.json({ data: users })
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi server', error: err })
  }
}

// Duyệt user
export const approveUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data:  { approved: true }
    })

    return res.json({
      message: `Đã duyệt tài khoản ${user.email}`,
      data: { id: user.id, email: user.email, approved: user.approved }
    })
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi server', error: err })
  }
}

// Xóa user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    if (Number(id) === req.user!.id) {
      return res.status(400).json({ message: 'Không thể tự xóa chính mình' })
    }

    await prisma.user.delete({ where: { id: Number(id) } })

    return res.json({ message: 'Đã xóa tài khoản thành công' })
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi server', error: err })
  }
}

// Đổi role user
export const changeRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Role không hợp lệ' })
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data:  { role }
    })

    return res.json({
      message: `Đã đổi role thành ${role}`,
      data: { id: user.id, email: user.email, role: user.role }
    })
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi server', error: err })
  }
}

// Reset password user
export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { newPassword } = req.body

    const hashed = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: Number(id) },
      data:  { password: hashed }
    })

    return res.json({ message: 'Đã reset mật khẩu thành công' })
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi server', error: err })
  }
}

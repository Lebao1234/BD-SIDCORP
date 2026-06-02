import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    displayId?: string;
    name: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Từ chối truy cập: Chưa cung cấp token.' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    const decoded = jwt.verify(token, secret) as any;
    
    // Ép kiểu ID an toàn từ JWT (để tương thích ngược với token cũ đang lưu "TK-001")
    const parsedId = typeof decoded.id === 'string' 
      ? parseInt(decoded.id.replace(/^[A-Za-z]+-/, ''), 10) 
      : parseInt(String(decoded.id), 10);

    req.user = {
      ...decoded,
      id: isNaN(parsedId) ? 0 : parsedId // Fallback nếu fail
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

export const authorizeRoles = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if(!req.user || !roles.includes(req.user.role))  {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập tài nguyên này.' });
    }
    next();
  };
}

export const approvedUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if(!user?.approved) {
    return res.status(403).json({ error: 'Tài khoản của bạn đang chờ duyệt. Vui lòng liên hệ quản trị viên.' });
  }
  next();
}
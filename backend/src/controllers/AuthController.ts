import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {prisma} from '../config/db';
import { AuthRequest } from '../middlewares/auth';
import { MSG } from '../constants/messages';

// ─── HELPER: GENERATE JWT TOKEN ───────────────────────────────────────────────

import { formatUserId } from '../helpers/parseId';

// Generate ID theo format TK-001, TK-002, ...

export const generateToken = (user: {
  id:    number;
  name:  string;
  email: string;
  role:  string;
}): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error(MSG.JWT_NOT_CONFIGURED);

  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    secret,
    { expiresIn: '7d' }
  );
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response) => {

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: MSG.MISSING_FIELDS });
  }

  try {
    const existingUser = await prisma.user.findFirst({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ error: MSG.EMAIL_TAKEN });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'user'   // ✅ luôn là 'user' — admin phải do superadmin tạo
      }
    });

    return res.status(201).json({
      message: MSG.REGISTER_SUCCESS,
      user: {
        id:    newUser.id,
        displayId: formatUserId(newUser.id),
        name:  newUser.name,
        email: newUser.email,
        role:  newUser.role
      }
    });
  } catch (err) {
    console.error('Lỗi đăng ký:', err);
    return res.status(500).json({ error: MSG.SYSTEM_ERROR });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response) => {
  // Hỗ trợ cả email lẫn username (backward compatibility)
  const { email, username, password } = req.body;
  const loginIdentifier = email || username; // Nếu email không có, lấy username làm login identifier

  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: MSG.LOGIN_MISSING });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: loginIdentifier
      }
    });

    if (!user) {
      return res.status(400).json({ error: MSG.LOGIN_WRONG });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: MSG.LOGIN_WRONG });
    }

    // ✅ Dùng generateToken thay vì ký thủ công lại
    const token = generateToken({
      id:    user.id,
      name:  user.name  ?? '',
      email: user.email ?? '',
      role:  user.role
    });
    return res.json({
      message: MSG.LOGIN_SUCCESS,
      token,
      user: {
        id:    user.id,
        displayId: formatUserId(user.id),
        name:  user.name,
        email: user.email,
        role:  user.role,
        approved: user.approved
      }
    });
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    return res.status(500).json({ error: MSG.SYSTEM_ERROR });
  }
};

// ─── GET PROFILE (chỉ trả về thông tin của chính mình) ───────────────────────

export const getProfile = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: MSG.UNAUTHORIZED });

  try {
    // ✅ Lấy đúng profile của người đang đăng nhập, không phải tất cả users
    const profile = await prisma.user.findUnique({
      where:  { id: user.id },
      select: { id: true, name: true, email: true, role: true }
    });

    return res.json(profile);
  } catch (err) {
    console.error('Lỗi lấy profile:', err);
    return res.status(500).json({ error: MSG.SYSTEM_ERROR });
  }
};
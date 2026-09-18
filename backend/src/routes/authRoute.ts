import express from 'express';
import { login, register, getProfile } from '../controllers/AuthController';
import { authenticateToken, approvedUser, authorizeRoles } from '../middlewares/auth';
import { getAllUsers } from '../controllers/AdminController';
import { validate } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../schemas/auth';

const router = express.Router();

// Đăng ký
router.post('/register', validate({ body: registerSchema }), register);
// Đăng nhập
router.post('/login', validate({ body: loginSchema }), login);
// Lấy thông tin profile (cần token)
router.get('/profile', authenticateToken, getProfile);

// Liệt kê toàn bộ tài khoản (kèm email) là dữ liệu quản trị -> chỉ admin
router.get('/dashboard', authenticateToken, approvedUser, authorizeRoles(['admin']), getAllUsers);

export default router;
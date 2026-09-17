import express from 'express';
import { login, register, getProfile } from '../controllers/AuthController';
import { authenticateToken, approvedUser, authorizeRoles } from '../middlewares/auth';
import { getAllUsers } from '../controllers/AdminController';


const router = express.Router();

// Đăng ký
router.post('/register', register);
// Đăng nhập
router.post('/login', login);
// Lấy thông tin profile (cần token)
router.get('/profile', authenticateToken, getProfile);

// Liệt kê toàn bộ tài khoản (kèm email) là dữ liệu quản trị -> chỉ admin
router.get('/dashboard', authenticateToken, approvedUser, authorizeRoles(['admin']), getAllUsers);

export default router;
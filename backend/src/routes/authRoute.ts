import express from 'express';
import { login, register, getProfile } from '../controllers/AuthController';
import { authenticateToken } from '../middlewares/auth';


const router = express.Router();

// Đăng ký
router.post('/register', register);
// Đăng nhập
router.post('/login', login);
// Lấy thông tin profile (cần token)
router.get('/profile', authenticateToken, getProfile);

export default router;
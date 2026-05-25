import express from 'express';
import { login, register, getProfile } from '../controllers/AuthController';
import { authenticateToken, approvedUser } from '../middlewares/auth';
import { getAllUsers } from '../controllers/AdminController';


const router = express.Router();

// Đăng ký
router.post('/register', register);
// Đăng nhập
router.post('/login', login);
// Lấy thông tin profile (cần token)
router.get('/profile', authenticateToken, getProfile);

router.get('/dashboard', authenticateToken, approvedUser, getAllUsers);

export default router;
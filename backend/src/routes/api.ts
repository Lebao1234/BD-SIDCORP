import { Router } from 'express';
import * as customerController from '../controllers/CustomerController';
import * as noteController from '../controllers/NoteController';
import * as attachmentController from '../controllers/AttachmentController';
import * as chatController from '../controllers/ChatController';
import * as userController from '../controllers/UserController';
import * as companyController from '../controllers/CompanyController';
import { authenticateToken } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();


// --- USERS ROUTERS (Admin/Manager) ---
router.get('/users', authenticateToken, userController.getUsers);
router.get('/users/pending', authenticateToken, userController.getPendingUsers);
router.post('/users', authenticateToken, userController.createUser);
router.get('/users/:id', authenticateToken, userController.getUserById);
router.put('/users/:id', authenticateToken, userController.updateUser);
router.delete('/users/:id', authenticateToken, userController.deleteUser);

// Shortcut routes cho thao tác quản trị User (Dùng PATCH vì cập nhật một phần dữ liệu)
router.patch('/users/:id/approve', authenticateToken, userController.approveUser);
router.patch('/users/:id/role', authenticateToken, userController.changeRole);
router.patch('/users/:id/reset-password', authenticateToken, userController.resetPassword);

// --- CRM CUSTOMER ROUTERS ---
router.get('/customers', authenticateToken, customerController.GetAll );
router.post('/customers', authenticateToken, customerController.Create);
router.get('/customers/:id', authenticateToken, customerController.GetById);
router.put('/customers/:id', authenticateToken, customerController.Update);
router.delete('/customers/:id', authenticateToken, customerController.Delete);

// --- CRM COMPANY ROUTERS ---
router.get('/companies', authenticateToken, companyController.listCompanies);
router.post('/companies', authenticateToken, companyController.createCompany);
router.get('/companies/:id', authenticateToken, companyController.getCompany);
router.put('/companies/:id', authenticateToken, companyController.updateCompany);

// --- NOTES & MENTIONS ROUTERS (Exchange) ---
router.post('/notes', authenticateToken, noteController.createNote);
router.get('/notes/customer/:customerId', authenticateToken, noteController.getCustomerNotes);
router.put('/notes/:id', authenticateToken, noteController.updateNote);
router.delete('/notes/:id', authenticateToken, noteController.deleteNote);

// --- NOTIFICATIONS ROUTERS ---
router.get('/notifications', authenticateToken, noteController.getNotifications);
router.put('/notifications/read-all', authenticateToken, noteController.markAllAsRead);
router.put('/notifications/:id/read', authenticateToken, noteController.markNotificationAsRead);

// --- ATTACHMENTS ROUTERS ---
router.post('/attachments', authenticateToken, upload.single('file'), attachmentController.uploadAttachment);
router.delete('/attachments/:id', authenticateToken, attachmentController.deleteAttachment);

// --- INTERNAL CHAT ROUTERS ---
router.get('/chat/forum', authenticateToken, chatController.getForumHistory);
router.get('/chat/history/:receiverId', authenticateToken, chatController.getChatHistory);

export default router;

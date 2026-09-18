import { Router } from 'express';
import * as customerController from '../controllers/CustomerController';
import * as noteController from '../controllers/NoteController';
import * as attachmentController from '../controllers/AttachmentController';
import * as chatController from '../controllers/ChatController';
import * as userController from '../controllers/UserController';
import * as companyController from '../controllers/CompanyController';
import * as taskController from '../controllers/TaskController';
import * as assetController from '../controllers/AssetController';
import { authenticateToken, authorizeRoles, approvedUser } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { upload } from '../middlewares/upload';
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
  bulkCreateSchema,
} from '../schemas/customer';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
} from '../schemas/task';
import { resetPasswordSchema } from '../schemas/auth';

const router = Router();

// ─── CỔNG CHẶN CHUNG ──────────────────────────────────────────────────────────
// Mọi route dưới /api đều phải có token hợp lệ VÀ tài khoản đã được duyệt.
// Đặt ở cấp router để không thể quên gắn cho một route mới nào.
router.use(authenticateToken, approvedUser);


// --- USERS ROUTERS (Admin/Manager) ---
// Note: GET /users and GET /users/:id and PUT /users/:id are accessed by normal users too
router.get('/users', userController.getUsers);
router.get('/users/pending', authorizeRoles(['admin']), userController.getPendingUsers);
router.post('/users', authorizeRoles(['admin']), userController.createUser);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.post('/users/:id/avatar', upload.single('avatar'), userController.uploadAvatar);
router.delete('/users/:id', authorizeRoles(['admin']), userController.deleteUser);

// Shortcut routes cho thao tác quản trị User (Dùng PATCH vì cập nhật một phần dữ liệu)
router.patch('/users/:id/approve', authorizeRoles(['admin']), userController.approveUser);
router.patch('/users/:id/role', authorizeRoles(['admin']), userController.changeRole);
router.patch('/users/:id/reset-password', validate({ body: resetPasswordSchema }), userController.resetPassword); // Has its own internal check

// --- CRM CUSTOMER ROUTERS ---
router.get('/customers', validate({ query: listCustomersQuerySchema }), customerController.GetAll);
router.post('/customers', validate({ body: createCustomerSchema }), customerController.Create);
router.post('/customers/bulk', validate({ body: bulkCreateSchema }), customerController.BulkCreate);
router.get('/customers/:id', customerController.GetById);
router.put('/customers/:id', validate({ body: updateCustomerSchema }), customerController.Update);
router.delete('/customers/:id', customerController.Delete);

// --- CRM COMPANY ROUTERS ---
router.get('/companies', companyController.listCompanies);
router.post('/companies', companyController.createCompany);
router.get('/companies/:id', companyController.getCompany);
router.put('/companies/:id', companyController.updateCompany);
router.delete('/companies/:id', companyController.deleteCompany);

// --- CÔNG VIỆC & LỊCH HẸN ---
// Việc là dữ liệu cá nhân: controller khoá cứng theo owner, kể cả với admin.
router.get('/tasks/summary', taskController.Summary);
router.get('/tasks', validate({ query: listTasksQuerySchema }), taskController.GetAll);
router.post('/tasks', validate({ body: createTaskSchema }), taskController.Create);
router.put('/tasks/:id', validate({ body: updateTaskSchema }), taskController.Update);
router.delete('/tasks/:id', taskController.Delete);

// --- NOTES & MENTIONS ROUTERS (Exchange) ---
router.post('/notes', noteController.createNote);
router.get('/notes/customer/:customerId', noteController.getCustomerNotes);
router.get('/notes/mentionable/:customerId', noteController.getMentionableUsers);
router.put('/notes/:id', noteController.updateNote);
router.delete('/notes/:id', noteController.deleteNote);

// --- NOTIFICATIONS ROUTERS ---
router.get('/notifications', noteController.getNotifications);
router.put('/notifications/read-all', noteController.markAllAsRead);
router.put('/notifications/:id/read', noteController.markNotificationAsRead);

// --- ATTACHMENTS ROUTERS ---
router.post('/attachments', upload.single('file'), attachmentController.uploadAttachment);
router.delete('/attachments/:id', attachmentController.deleteAttachment);

// --- INTERNAL CHAT ROUTERS ---
router.get('/chat/conversations', chatController.getConversations);
router.get('/chat/forum', chatController.getForumHistory);
router.get('/chat/history/:receiverId', chatController.getChatHistory);
// --- ASSETS & GOOGLE DRIVE RESOURCES ROUTERS ---
router.get('/assets', assetController.getAssets);
router.post('/assets', assetController.createAsset);
router.post('/assets/bulk', assetController.bulkCreateAssets);
router.put('/assets/:id', assetController.updateAsset);
router.delete('/assets/:id', assetController.deleteAsset);
router.post('/assets/bulk-delete', assetController.bulkDeleteAssets);
router.post('/assets/:id/usage', assetController.recordAssetUsage);

export default router;

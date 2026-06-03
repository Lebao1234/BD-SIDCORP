# QuanLyHTKH - Hệ Thống CRM & Nội Bộ (Internal Chat & CRM)

QuanLyHTKH là một ứng dụng quản lý khách hàng (CRM) kết hợp hệ thống nhắn tin nội bộ thời gian thực. Dự án được thiết kế với kiến trúc hiện đại, phân tách dữ liệu linh hoạt và tối ưu chi phí vận hành cho các đội nhóm kinh doanh.

## 🌟 Tính Năng Nổi Bật

### 1. Quản lý Khách Hàng (CRM)
- Quản lý danh sách khách hàng, trạng thái (Lead, Deal, Lost, Win), nguồn khách và thông tin liên hệ.
- **Timeline Tương Tác**: Ghi chú lại lịch sử làm việc với khách hàng. 
- **Tagging / Mention**: Hỗ trợ gõ `@Tên_nhân_viên` để tag thành viên khác vào ghi chú, hệ thống sẽ tự động gửi thông báo real-time.
- Quản lý file đính kèm/tài liệu liên quan đến khách hàng.

### 2. Trò Chuyện Nội Bộ (Real-time Chat)
- **Direct Message (1-1)**: Nhắn tin riêng tư giữa các thành viên trong nhóm.
- **Diễn Đàn Nhóm (Forum)**: Kênh thảo luận chung cho tất cả thành viên.
- Trạng thái hoạt động (Online/Offline) được cập nhật liên tục theo thời gian thực.
- Nhận thông báo (Push Notification) tức thì khi có tin nhắn hoặc được nhắc tên.

### 3. Hệ thống Phân Quyền (RBAC)
- Xác thực bảo mật với JWT.
- Phân quyền theo Role (`admin`, `user`).
- Quản trị viên (Admin) có quyền duyệt tài khoản mới, quản lý mọi luồng dữ liệu của đội nhóm.

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

Dự án áp dụng kiến trúc **Polyglot Persistence** (sử dụng nhiều loại CSDL cùng lúc) để tối ưu hóa hiệu năng:

**Frontend:**
- React 19 + Vite + TypeScript.
- Tailwind CSS & Material UI (MUI).
- Socket.io-client (Real-time).
- React-mentions (Xử lý tag tên nhân viên).

**Backend:**
- Node.js + Express + TypeScript.
- Socket.io (Xử lý kết nối thời gian thực).
- JWT & Bcryptjs (Xác thực và bảo mật).
- Multer (Xử lý file upload).

**Cơ sở dữ liệu & Lưu trữ (Databases & Storage):**
- **PostgreSQL (Supabase + Prisma)**: Lưu trữ dữ liệu cấu trúc chuẩn (Users, Customers, Roles).
- **MongoDB Atlas (Mongoose)**: Lưu trữ luồng dữ liệu linh hoạt không giới hạn (Lịch sử Chat, Ghi chú khách hàng, Thông báo).
- **Supabase Storage**: Quản lý và lưu trữ file đính kèm.

## 🚀 Hướng Dẫn Cài Đặt

### Yêu cầu hệ thống
- Node.js phiên bản `v22.15.0` (Khuyên dùng [nvm](https://github.com/nvm-sh/nvm)).

### Chạy dự án ở chế độ Development

**1. Khởi chạy Backend:**
Mở terminal và trỏ vào thư mục `backend`:
```bash
cd backend
npm install
npm run prisma:generate  # Khởi tạo Prisma Client
npm run prisma:migrate   # Đồng bộ bảng dữ liệu vào PostgreSQL
npm run dev              # Chạy server ở http://localhost:5000
```

**2. Khởi chạy Frontend:**
Mở thêm một terminal mới và trỏ vào thư mục `frontend`:
```bash
cd frontend
npm install
npm run dev              # Chạy web ở http://localhost:5173
```

### Chế độ Production (Build)

Để build ứng dụng đưa lên server thật:
```bash
# Build Backend
cd backend && npm install && npm run prisma:generate && npm run build
npm start

# Build Frontend
cd ../frontend && npm install && npm run build
```

## 📚 Tài liệu tham khảo
- Vui lòng xem [DATABASE_SETUP.md](./DATABASE_SETUP.md) để biết cách thiết lập tài khoản miễn phí cho MongoDB Atlas và Supabase.

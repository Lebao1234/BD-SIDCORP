# Bộ test case – QuanLyHTKH (CRM + Chat nội bộ)

Phạm vi: backend API (`backend/src`), luồng socket chat, và các luồng chính trên giao diện.
Base URL local: `http://localhost:5000`. Mọi route `/api/*` (trừ `/api/auth/register`, `/api/auth/login`) yêu cầu header `Authorization: Bearer <token>` **và** tài khoản đã được duyệt.

## 0. Chuẩn bị dữ liệu test

| Tài khoản | Vai trò | Trạng thái | Dùng để |
|---|---|---|---|
| `admin@test.local` | admin | đã duyệt | thao tác quản trị |
| `userA@test.local` | user | đã duyệt | chủ sở hữu dữ liệu |
| `userB@test.local` | user | đã duyệt | kiểm tra truy cập chéo (IDOR) |
| `pending@test.local` | user | **chưa duyệt** | kiểm tra chặn tài khoản chờ duyệt |

Mật khẩu mẫu hợp lệ: `Kiemthu#2026x` (≥10 ký tự, có chữ, số, ký tự đặc biệt, không nằm trong danh sách phổ biến, không chứa email/tên).

Ký hiệu độ ưu tiên: **P1** = chặn release, **P2** = quan trọng, **P3** = nên có.

---

## 1. Xác thực – Đăng ký (`POST /api/auth/register`)

| ID | Kịch bản | Dữ liệu / bước | Kết quả mong đợi | Ưu tiên |
|---|---|---|---|---|
| AUTH-01 | Đăng ký hợp lệ | name, email mới, password hợp lệ | 201, tài khoản tạo ở trạng thái `approved=false` | P1 |
| AUTH-02 | Email trùng | email đã tồn tại | 400 `Email đã được sử dụng.` | P1 |
| AUTH-03 | Email sai định dạng | `abc@` | 400, `issues[].field = email` | P2 |
| AUTH-04 | Tên quá ngắn / quá dài | `"A"` / 101 ký tự | 400 | P3 |
| AUTH-05 | Mật khẩu < 10 ký tự | `Ab#12345` | 400 `Mật khẩu phải có ít nhất 10 ký tự.` | P1 |
| AUTH-06 | Mật khẩu thiếu số / chữ / ký tự đặc biệt | `Abcdefghij#`, `1234567890#`, `Abcdefg1234` | 400, liệt kê đủ mọi lỗi trong `issues` | P2 |
| AUTH-07 | Mật khẩu phổ biến | `Password@123` | 400 `...danh sách mật khẩu phổ biến...` | P2 |
| AUTH-08 | Mật khẩu chứa phần trước @ của email | email `nguyenvan@x.com`, pass `nguyenvan#12` | 400 `...không được chứa địa chỉ email...` | P2 |
| AUTH-09 | Mật khẩu > 100 ký tự | 101 ký tự | 400 | P3 |
| AUTH-10 | Rate limit đăng ký | Gửi 6 request đăng ký thành công từ cùng IP trong 1 giờ | Request thứ 6 trả 429 | P2 |
| AUTH-11 | Body không phải JSON | `{"name":` (JSON hỏng) | 400 `Dữ liệu gửi lên không phải JSON hợp lệ.` | P3 |

## 2. Xác thực – Đăng nhập (`POST /api/auth/login`)

| ID | Kịch bản | Dữ liệu / bước | Kết quả mong đợi | Ưu tiên |
|---|---|---|---|---|
| LOGIN-01 | Đăng nhập đúng | email + mật khẩu đúng | 200, có `token`, `user` không chứa `password` | P1 |
| LOGIN-02 | Sai mật khẩu | | 401 `Tài khoản hoặc mật khẩu không chính xác.` | P1 |
| LOGIN-03 | Email không tồn tại | | 401, **cùng thông báo** với LOGIN-02, thời gian phản hồi tương đương (chống dò tài khoản) | P2 |
| LOGIN-04 | Tài khoản chưa duyệt | `pending@test.local` | 403 `...đang chờ quản trị viên duyệt.`, **không** trả token | P1 |
| LOGIN-05 | Thiếu password | `{ "email": "..." }` | 400 | P2 |
| LOGIN-06 | Brute-force | 10 lần sai liên tiếp, lần thứ 11 | 429 `...đợi 15 phút.` | P1 |
| LOGIN-07 | Đăng nhập đúng không bị tính vào rate limit | 9 lần sai + nhiều lần đúng | Lần đúng luôn 200 | P3 |
| LOGIN-08 | Email có khoảng trắng đầu/cuối | `"  userA@test.local "` | 200 (được trim) | P3 |

## 3. Token & phiên đăng nhập

| ID | Kịch bản | Dữ liệu / bước | Kết quả mong đợi | Ưu tiên |
|---|---|---|---|---|
| TOK-01 | Không gửi token | `GET /api/customers` không header | 401 `...Chưa cung cấp token.` | P1 |
| TOK-02 | Token sai chữ ký / bị sửa payload | đổi 1 ký tự trong token | 401 | P1 |
| TOK-03 | Token hết hạn | token có `exp` trong quá khứ | 401 | P2 |
| TOK-04 | **Token ký bằng secret cũ hard-code** | Ký JWT `{id: <adminId>, role: "admin"}` bằng chuỗi `legacySecret` trong `middlewares/auth.ts` | **Mong đợi: 401.** Hiện tại code vẫn chấp nhận → ai đọc được mã nguồn đều giả mạo được token admin. Xem mục 13. | **P1** |
| TOK-05 | Đổi mật khẩu vô hiệu phiên cũ | Login lấy token T1 → đổi mật khẩu → gọi API bằng T1 | 401 `Mật khẩu đã được thay đổi...` | P1 |
| TOK-06 | Hạ quyền có hiệu lực ngay | Admin đổi role user X từ admin→user, X dùng token cũ gọi `GET /api/users/pending` | 403 | P1 |
| TOK-07 | Tài khoản bị xoá | Xoá user X, X gọi API bằng token cũ | 401 `Tài khoản không còn tồn tại...` | P1 |
| TOK-08 | `GET /api/auth/profile` | token hợp lệ | 200, chỉ thông tin của chính mình | P2 |
| TOK-09 | `GET /api/auth/dashboard` với user thường | | 403 | P1 |

## 4. Quản lý người dùng (`/api/users`)

| ID | Kịch bản | Dữ liệu / bước | Kết quả mong đợi | Ưu tiên |
|---|---|---|---|---|
| USR-01 | Admin xem danh sách chờ duyệt | `GET /api/users/pending` | 200, chỉ user `approved=false` | P1 |
| USR-02 | User thường xem danh sách chờ duyệt | | 403 | P1 |
| USR-03 | Admin duyệt tài khoản | `PATCH /api/users/:id/approve` | 200, sau đó user đó đăng nhập được | P1 |
| USR-04 | Admin tạo user với mật khẩu yếu | `POST /api/users` pass `123` | 400 | P1 |
| USR-05 | Admin tạo user email trùng | | 400 | P2 |
| USR-06 | User sửa hồ sơ của chính mình | `PUT /api/users/:selfId` `{name}` | 200 | P2 |
| USR-07 | User sửa hồ sơ người khác | `PUT /api/users/:otherId` | 403 | P1 |
| USR-08 | User tự nâng quyền | `PUT /api/users/:selfId` `{ "role": "admin" }` | 403 | P1 |
| USR-09 | User tự duyệt | `{ "approved": true }` | 403 | P1 |
| USR-10 | Gửi `password` qua PUT | `{ "password": "..." }` | 400 `...trường không được phép: password.` | P1 |
| USR-11 | Đổi email sang email đã có | | 400 | P2 |
| USR-12 | Đổi mật khẩu của mình – thiếu mật khẩu hiện tại | `PATCH /reset-password` `{newPassword}` | 400 `Cần nhập mật khẩu hiện tại` | P1 |
| USR-13 | Đổi mật khẩu – mật khẩu hiện tại sai | | 400 | P1 |
| USR-14 | Đổi mật khẩu – mới trùng cũ | | 400 | P2 |
| USR-15 | Admin đặt lại mật khẩu người khác | không cần currentPassword | 200, phiên cũ của người đó bị 401 | P1 |
| USR-16 | User đặt lại mật khẩu người khác | | 403 | P1 |
| USR-17 | Admin tự xoá mình | `DELETE /api/users/:selfId` | 400 `Không thể tự xóa chính mình.` | P2 |
| USR-18 | Đổi role không hợp lệ | `PATCH /role` `{ "role": "superadmin" }` | 400 | P2 |
| USR-19 | ID không hợp lệ | `/api/users/abc` | 400 | P3 |
| USR-20 | Xoá user không tồn tại | `DELETE /api/users/999999` | **Mong đợi 404.** Hiện tại có thể trả 500 (Prisma ném lỗi) | P3 |
| USR-21 | Upload avatar không phải ảnh | file `.pdf` vào `/avatar` | 400 | P2 |
| USR-22 | Upload avatar cho người khác | | 403 | P1 |
| USR-23 | Danh sách user không lộ password | `GET /api/users` | Không có trường `password` | P1 |

## 5. Khách hàng (`/api/customers`)

| ID | Kịch bản | Dữ liệu / bước | Kết quả mong đợi | Ưu tiên |
|---|---|---|---|---|
| CUS-01 | Tạo khách hàng tối thiểu | `{ "name": "KH Test" }` | 201, có `displayId`, `owner_id` = người tạo | P1 |
| CUS-02 | Thiếu tên | `{}` | 400 | P1 |
| CUS-03 | Trường lạ | `{ "name": "X", "owner_id": 1 }` | 400 (schema `.strict()`) – không gán được chủ sở hữu khác | P1 |
| CUS-04 | Email sai định dạng | | 400 `Email không đúng định dạng.` | P2 |
| CUS-05 | SĐT chứa chữ | `"phone_number": "09abc"` | 400 | P2 |
| CUS-06 | Giá trị hợp đồng âm | `"price": -1` | 400 | P2 |
| CUS-07 | Giá trị dạng chuỗi có dấu phân cách | `"price": "1.500.000"` | 201, lưu đúng số | P3 |
| CUS-08 | Status ngoài danh sách | `"status": "WIN"` | 400 | P2 |
| CUS-09 | Trùng email/SĐT với khách đã có | | 400 thông báo trùng | P2 |
| CUS-10 | Gõ `@tên` trong `note` khi tạo | | Người được tag nhận notification + socket | P2 |
| CUS-11 | Phân trang | `?page=2&limit=5` | `data.length ≤ 5`, `page=2`, `totalPages` đúng | P2 |
| CUS-12 | `limit` vượt trần | `?limit=501` | 400 | P3 |
| CUS-13 | Lọc trạng thái / phân loại | `?status=QUOTED&classified=VIP` | Chỉ bản ghi khớp | P2 |
| CUS-14 | Tìm kiếm | `?search=<tên công ty>` | Trả KH theo tên/email/SĐT/tên công ty, không phân biệt hoa thường | P2 |
| CUS-15 | User thường truyền `owner_id` người khác | `?owner_id=<userB>` | Bị bỏ qua, vẫn chỉ thấy KH của mình | P1 |
| CUS-16 | Admin lọc theo `owner_id` | | Chỉ KH của owner đó | P2 |
| CUS-17 | Xem KH của người khác (IDOR) | userB `GET /api/customers/<id của userA>` | 403 | P1 |
| CUS-18 | Sửa / xoá KH của người khác | userB `PUT`/`DELETE` | 403 | P1 |
| CUS-19 | Cập nhật một phần | `PUT` chỉ `{ "status": "SIGNED" }` | Các trường khác giữ nguyên | P2 |
| CUS-20 | Gửi chuỗi rỗng để xoá giá trị | `{ "email": "" }` | email thành `null` | P3 |
| CUS-21 | KH không tồn tại | `GET /api/customers/999999` | 404 | P2 |
| CUS-22 | Nhập Excel hàng loạt | `POST /bulk` 3 bản ghi | 200/201, trả số bản ghi tạo được | P2 |
| CUS-23 | Bulk rỗng / > 5000 bản ghi | | 400 | P3 |
| CUS-24 | Danh sách không lộ thông tin ngân hàng công ty | `GET /api/customers` | `company` chỉ có id, name, status, field | P2 |
| CUS-25 | Xoá KH | | 200; ghi chú, file đính kèm liên quan được xử lý (không mồ côi) | P2 |

## 6. Doanh nghiệp (`/api/companies`)

| ID | Kịch bản | Dữ liệu / bước | Kết quả mong đợi | Ưu tiên |
|---|---|---|---|---|
| COM-01 | Tạo doanh nghiệp | `{ "name": "Cty Test" }` | 201 | P1 |
| COM-02 | Thiếu tên / tên toàn khoảng trắng | | 400 `Tên công ty là bắt buộc` | P2 |
| COM-03 | User chỉ thấy DN gắn với KH của mình | userB `GET /api/companies` | Không thấy DN chỉ gắn với KH của userA | P1 |
| COM-04 | Xem DN không liên quan | userB `GET /api/companies/:id` | 403 | P1 |
| COM-05 | **User xoá DN dùng chung** | userA và userB cùng có KH gắn DN X; userA `DELETE /api/companies/X` | Cần xác nhận nghiệp vụ: hiện tại **thành công** và gỡ liên kết DN khỏi cả KH của userB | P2 |
| COM-06 | Phân trang | `?limit=500` | Bị ép tối đa 200 | P3 |
| COM-07 | Lỗi trả về dùng khoá `message` thay vì `error` | | Ghi nhận không nhất quán với các module khác (frontend đọc `error`) | P3 |

## 7. Công việc & lịch (`/api/tasks`)

| ID | Kịch bản | Dữ liệu / bước | Kết quả mong đợi | Ưu tiên |
|---|---|---|---|---|
| TSK-01 | Tạo việc tối thiểu | `{ "title": "Gọi KH" }` | 201 | P1 |
| TSK-02 | `end_at` trước `start_at` | | 400 `Thời điểm kết thúc phải sau thời điểm bắt đầu.` | P1 |
| TSK-03 | Type / status / priority ngoài danh sách | `"type": "EMAIL"` | 400 | P2 |
| TSK-04 | Gắn việc vào KH của người khác | `customer_id` của userA, gửi bằng userB | 403 | P1 |
| TSK-05 | Gắn vào KH không tồn tại | | 404 | P2 |
| TSK-06 | Việc là dữ liệu cá nhân – kể cả admin | admin `PUT/DELETE` việc của userA | 403 | P1 |
| TSK-07 | Scope | `?scope=today` / `overdue` / `upcoming` | Đúng tập việc theo giờ VN | P2 |
| TSK-08 | Khoảng lịch | `?from=...&to=...` | Trả việc giao với khoảng | P2 |
| TSK-09 | `remind_before_minutes` > 10080 | | Bị chuyển thành `null` (không nhắc) | P3 |
| TSK-10 | Nhắc lịch | Tạo MEETING `start_at` = now+6', nhắc trước 5' | Nhận notification ~1' sau, chỉ **một** lần | P2 |
| TSK-11 | `GET /api/tasks/summary` | | Số đếm khớp danh sách | P3 |

## 8. Ghi chú, mention & thông báo

| ID | Kịch bản | Dữ liệu / bước | Kết quả mong đợi | Ưu tiên |
|---|---|---|---|---|
| NOTE-01 | Tạo ghi chú | `POST /api/notes` `{customer_id, content}` | 201 | P1 |
| NOTE-02 | Thiếu content / customer_id | | 400 | P2 |
| NOTE-03 | Ghi chú cho KH của người khác | | 403 | P1 |
| NOTE-04 | Xem timeline KH của người khác | `GET /api/notes/customer/:id` | 403 | P1 |
| NOTE-05 | Tag `@user` | | Người được tag nhận bản ghi `GET /api/notifications` + sự kiện socket realtime | P1 |
| NOTE-06 | Sửa / xoá ghi chú của người khác | | 403 | P1 |
| NOTE-07 | Sửa với content rỗng | | 400 | P3 |
| NOTE-08 | Danh sách người có thể mention | `GET /api/notes/mentionable/:customerId` | Không lộ trường nhạy cảm | P3 |
| NOTI-01 | Đánh dấu một thông báo đã đọc | `PUT /api/notifications/:id/read` | 200; không đọc được thông báo của người khác (404) | P2 |
| NOTI-02 | Đánh dấu tất cả | `PUT /api/notifications/read-all` | Badge về 0 | P3 |
| NIMG-01 | Upload ảnh ghi chú > 5MB | | 400 `Dung lượng ảnh tối đa 5MB.` | P3 |
| NIMG-02 | Xoá ảnh của người khác | `DELETE /api/note-images` `{url}` của userA | 403 | P2 |

## 9. Tệp đính kèm & upload

| ID | Kịch bản | Dữ liệu / bước | Kết quả mong đợi | Ưu tiên |
|---|---|---|---|---|
| UP-01 | Upload PDF cho KH của mình | form-data `file`, `customerId` | 201, có URL Supabase | P1 |
| UP-02 | Thiếu `customerId` / thiếu file | | 400 | P2 |
| UP-03 | Upload cho KH của người khác | | 403 | P1 |
| UP-04 | File bị chặn (`.svg`, `.html`, `.exe`) | | **Mong đợi 400.** Hiện tại lỗi của multer rơi vào handler chung → trả **500 `Lỗi hệ thống.`** | P2 |
| UP-05 | File > 10MB | | **Mong đợi 413/400.** Hiện tại có thể trả 500 (cùng nguyên nhân UP-04) | P2 |
| UP-06 | Giả mạo MIME | file `.html` đổi Content-Type thành `image/png` | Không được phục vụ như HTML khi mở link | P2 |
| UP-07 | Xoá đính kèm của người khác | | 403 | P1 |

## 10. Chat nội bộ (REST + Socket.io)

| ID | Kịch bản | Dữ liệu / bước | Kết quả mong đợi | Ưu tiên |
|---|---|---|---|---|
| CHAT-01 | Danh sách hội thoại | `GET /api/chat/conversations` | Chỉ hội thoại có mình tham gia | P1 |
| CHAT-02 | Lịch sử 1-1 | `GET /api/chat/history/:receiverId` | Chỉ tin giữa mình và receiver | P1 |
| CHAT-03 | receiverId không hợp lệ | `/history/abc` | 400 | P3 |
| CHAT-04 | Phân trang lịch sử | `?before=<ISO>` | Trả tin cũ hơn mốc | P3 |
| CHAT-05 | Gửi tin 1-1 qua socket | `send_message` | Người nhận nhận `receive_message`, người gửi nhận `message_sent`, mọi tab của người gửi đồng bộ | P1 |
| CHAT-06 | Tin rỗng / quá dài | | `error_message` | P2 |
| CHAT-07 | Forum | `send_forum_message` | Mọi người nhận `forum_message` | P2 |
| CHAT-08 | Thu hồi tin của người khác | `revoke_message` | `error_message` không có quyền | P1 |
| CHAT-09 | Kết nối socket không token / token sai | | Bị từ chối kết nối | P1 |
| CHAT-10 | Trạng thái online | Đăng nhập 2 tab rồi đóng 1 tab | Vẫn online đến khi đóng hết tab | P3 |
| CHAT-11 | Đánh dấu đã đọc | `POST /api/chat/read` `{peerId}` ; `peerId=0` cho forum | 200, số chưa đọc về 0 | P3 |
| CHAT-12 | Gửi file trong chat | `POST /api/chat/attachments` | 201, trả URL dùng cho `fileUrl` | P2 |

## 11. Kho tài nguyên (`/api/assets`)

| ID | Kịch bản | Dữ liệu / bước | Kết quả mong đợi | Ưu tiên |
|---|---|---|---|---|
| AST-01 | Tạo tài nguyên link | `{ title, file_url }` | 201 | P2 |
| AST-02 | Thiếu tiêu đề | | 400 | P2 |
| AST-03 | Lọc / tìm / phân trang | `?type=DOCUMENT&category=...&search=...&page=1&limit=20` | Đúng tập dữ liệu | P3 |
| AST-04 | Sửa / xoá tài nguyên của người khác | | 403 | P1 |
| AST-05 | Bulk delete có ID của người khác | `{ ids: [mine, others] }` | Chỉ xoá của mình hoặc từ chối toàn bộ | P2 |
| AST-06 | Ghi nhận sử dụng cho KH của người khác | `POST /:id/usage` | 403 | P2 |
| AST-07 | `file_url` dạng `javascript:` | | Bị từ chối hoặc không render thành link click được | P2 |

## 12. Báo cáo / Dashboard

| ID | Kịch bản | Dữ liệu / bước | Kết quả mong đợi | Ưu tiên |
|---|---|---|---|---|
| RPT-01 | Summary user thường | `GET /api/reports/summary` | Chỉ số liệu của mình | P1 |
| RPT-02 | Summary admin | mặc định / `?scope=mine` | Toàn hệ thống / chỉ của admin | P2 |
| RPT-03 | Doanh thu theo khoảng | `?range=7d|30d|month|quarter|year|all` | Số liệu khớp tổng `price` KH tương ứng | P1 |
| RPT-04 | Lọc giai đoạn | `?stage=quoted|pending|won` | `won` = CONTRACT_SENT + SIGNED | P2 |
| RPT-05 | Tham số không hợp lệ | `?range=abc&stage=xyz` | Rơi về mặc định `30d`, `all`, không lỗi | P3 |
| RPT-06 | Cache 30 giây | Tạo KH mới rồi gọi lại ngay | Ghi nhận: số liệu có thể trễ tối đa 30s | P3 |
| RPT-07 | Hiệu năng | Đo thời gian `/reports/summary` | < 1s ở môi trường production | P3 |

## 13. Bảo mật & phi chức năng

| ID | Kịch bản | Kết quả mong đợi | Ưu tiên |
|---|---|---|---|
| SEC-01 | **Secret JWT cũ hard-code trong `backend/src/middlewares/auth.ts`** | Gỡ nhánh fallback `legacySecret`; nếu đã từng dùng chuỗi đó trên production thì cần coi là đã lộ. Test TOK-04 phải trả 401 | **P1** |
| SEC-02 | CORS: gọi từ origin lạ | 403 `Origin không được phép...` | P2 |
| SEC-03 | Header bảo mật (helmet) | Có `X-Content-Type-Options`, `X-Frame-Options`... | P3 |
| SEC-04 | Body > 1MB | 413 | P3 |
| SEC-05 | Rate limit API chung | > 300 request/phút cùng token → 429 | P3 |
| SEC-06 | SQL/NoSQL injection | `?search=' OR 1=1--`, `{"$gt":""}` trong body | Không lỗi 500, không lộ dữ liệu | P2 |
| SEC-07 | XSS trong note/chat/tên KH | `<img src=x onerror=alert(1)>` | Hiển thị dạng text, không thực thi | P1 |
| SEC-08 | Lỗi không lộ stack trace | Gây lỗi 500 | Body chỉ có `{ "error": "Lỗi hệ thống." }` | P2 |
| SEC-09 | Health check | `GET /` → 200 `status: online` | P3 |

## 14. Giao diện (smoke test thủ công)

| ID | Kịch bản | Kết quả mong đợi | Ưu tiên |
|---|---|---|---|
| UI-01 | Đăng ký → chờ duyệt → admin duyệt → đăng nhập | Thông báo rõ ràng ở từng bước | P1 |
| UI-02 | Checklist mật khẩu ở form đăng ký/đổi mật khẩu | Khớp đúng quy tắc backend | P2 |
| UI-03 | Nút hiện/ẩn mật khẩu | Hoạt động trên mọi ô mật khẩu | P3 |
| UI-04 | Bảng khách hàng: tìm, lọc, phân trang, xuất Excel | Dữ liệu khớp API | P1 |
| UI-05 | Nhập Excel sai cột | Báo lỗi theo dòng, không treo trang | P2 |
| UI-06 | Dashboard: KPI, biểu đồ doanh thu, bộ lọc khoảng | Số khớp RPT-03 | P1 |
| UI-07 | Chat realtime giữa 2 trình duyệt | Tin đến < 1s, badge chưa đọc đúng | P1 |
| UI-08 | Chuông thông báo khi được tag | Hiện ngay, click mở đúng KH | P2 |
| UI-09 | Lịch công việc: kéo/thả, tạo nhanh | Giờ hiển thị đúng múi giờ VN | P2 |
| UI-10 | Dark/Light mode | Không có chữ mất tương phản | P3 |
| UI-11 | Responsive 375px | Không tràn ngang, sidebar thu gọn | P2 |
| UI-12 | Token hết hạn khi đang dùng | Tự chuyển về trang đăng nhập, không trắng trang | P2 |

---

## Lỗi phát hiện & trạng thái sửa (2026-10-21)

| # | Case | Lỗi | Trạng thái |
|---|---|---|---|
| 1 | TOK-04 / SEC-01 | `middlewares/auth.ts` thử lại `jwt.verify` bằng secret viết cứng trong code → giả mạo được token | Đã sửa, đã kiểm chứng (trước: 200, sau: 401) |
| 1b | SEC-01 | `JWT_SECRET` trong `backend/.env` **chính là chuỗi đó**, có trong lịch sử git của repo public | **Chưa xử lý — phải đổi secret ở local và trên Render** |
| 2 | UP-04 / UP-05 | Lỗi multer rơi vào handler chung → 500 | Đã sửa, đã kiểm chứng (trước: 500, sau: 400/413) |
| 3 | COM-05 | User thường xoá DN đang gắn KH của người khác | Đã sửa (403), chờ chạy test với DB |
| 4 | USR-20 | Xoá/duyệt/đổi role user không tồn tại → 500 | Đã sửa (404), chờ chạy test với DB |
| 5 | COM-07 | Company trả `message` thay vì `error` | Không phải lỗi: `frontend/src/lib/errors.ts` đọc cả hai |

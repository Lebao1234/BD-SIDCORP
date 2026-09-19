-- Bổ sung các index đã khai báo trong schema.prisma nhưng chưa từng được
-- migrate lên cơ sở dữ liệu thật. PostgreSQL không tự tạo index cho khoá ngoại,
-- nên mọi truy vấn lọc/sắp xếp theo các cột dưới đây đang quét toàn bảng.
--
-- Dùng IF NOT EXISTS để migration chạy được cả trên cơ sở dữ liệu đã có sẵn
-- index (ví dụ ai đó tạo tay bằng psql trước đó).

-- users: middleware approvedUser lọc theo approved trên mọi request
CREATE INDEX IF NOT EXISTS "users_approved_idx" ON "users"("approved");

-- customers: nối khách hàng theo doanh nghiệp
CREATE INDEX IF NOT EXISTS "customers_company_id_idx" ON "customers"("company_id");

-- customer_documents: GetById include documents + orderBy created_at desc
CREATE INDEX IF NOT EXISTS "customer_documents_customer_id_created_at_idx"
  ON "customer_documents"("customer_id", "created_at");
CREATE INDEX IF NOT EXISTS "customer_documents_uploaded_by_idx"
  ON "customer_documents"("uploaded_by");

-- exchanges: GetById include exchanges + orderBy created_at desc
CREATE INDEX IF NOT EXISTS "exchanges_customer_id_created_at_idx"
  ON "exchanges"("customer_id", "created_at");

-- customer_note_mentions: dọn dẹp khi xoá khách hàng, tra cứu mention theo người
CREATE INDEX IF NOT EXISTS "customer_note_mentions_customer_id_idx"
  ON "customer_note_mentions"("customer_id");
CREATE INDEX IF NOT EXISTS "customer_note_mentions_mentioned_user_id_idx"
  ON "customer_note_mentions"("mentioned_user_id");

-- companies: listCompanies sắp xếp theo created_at desc, tra cứu theo tên
CREATE INDEX IF NOT EXISTS "companies_name_idx" ON "companies"("name");
CREATE INDEX IF NOT EXISTS "companies_created_at_idx" ON "companies"("created_at");

-- asset_usages: đếm lượt dùng của mỗi tài nguyên
CREATE INDEX IF NOT EXISTS "asset_usages_asset_id_idx" ON "asset_usages"("asset_id");
CREATE INDEX IF NOT EXISTS "asset_usages_customer_id_idx" ON "asset_usages"("customer_id");

-- tasks: vòng chạy nhắc lịch mỗi 60 giây quét theo reminded_at + start_at,
-- không kèm owner_id nên index [owner_id, status, start_at] sẵn có không dùng được.
CREATE INDEX IF NOT EXISTS "tasks_reminded_at_start_at_idx"
  ON "tasks"("reminded_at", "start_at");

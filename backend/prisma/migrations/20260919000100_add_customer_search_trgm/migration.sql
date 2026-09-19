-- Tìm kiếm khách hàng dùng ILIKE '%từ khoá%' (Prisma: contains + mode insensitive).
-- Wildcard ở đầu chuỗi khiến B-tree index vô dụng, nên mỗi lần gõ phím là một
-- lần quét toàn bảng customers. pg_trgm + GIN xử lý được dạng khớp này.
--
-- Nếu nhà cung cấp cơ sở dữ liệu không cho bật extension, xoá thư mục migration
-- này đi; phần còn lại của hệ thống vẫn chạy bình thường, chỉ là tìm kiếm chậm.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "customers_name_trgm_idx"
  ON "customers" USING gin ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "customers_email_trgm_idx"
  ON "customers" USING gin ("email" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "customers_phone_number_trgm_idx"
  ON "customers" USING gin ("phone_number" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "companies_name_trgm_idx"
  ON "companies" USING gin ("name" gin_trgm_ops);

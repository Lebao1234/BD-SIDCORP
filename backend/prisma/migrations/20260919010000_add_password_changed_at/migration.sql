-- Mốc đổi mật khẩu gần nhất, dùng để vô hiệu hoá những token đã phát hành trước đó.
--
-- Để NULL cho các tài khoản hiện có: nghĩa là "chưa từng đổi kể từ khi có tính
-- năng này", nên token đang dùng của họ vẫn hợp lệ và không ai bị đăng xuất đột
-- ngột lúc triển khai.
ALTER TABLE "users" ADD COLUMN "password_changed_at" TIMESTAMP(3);

/**
 * Mẫu thư đề xuất giải pháp kèm dự toán chi phí triển khai.
 *
 * Email HTML phải dùng bảng và style nội tuyến vì phần lớn trình đọc mail
 * bỏ qua CSS ngoài — vì vậy chuỗi dài và không nên "dọn" cho gọn.
 * Tách khỏi component để trang không còn hơn 200 dòng chuỗi HTML chen giữa
 * phần logic React.
 */
export const TEMPLATE_PROPOSAL = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Thư ngỏ Hợp tác & Báo giá Đặc quyền</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #ffffff; font-family: Arial, sans-serif; color: #27272a;">
  <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 12px; padding: 28px;">
    <h2 style="color: #09090b; font-size: 18px; margin-top: 0;">THƯ NGỎ HỢP TÁC &amp; ĐỀ XUẤT GIẢI PHÁP TƯ VẤN</h2>
    <p style="font-size: 13px; line-height: 1.6; color: #52525b;">Chào Quý đối tác,</p>
    <p style="font-size: 13px; line-height: 1.6; color: #52525b;">
      Sau buổi làm việc sơ bộ về định hướng mở rộng thị trường, chúng tôi đã hoàn thiện bản đề xuất chi tiết giải pháp chuẩn hóa quy trình CRM.
    </p>
    <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="font-size: 12px; margin: 0 0 8px 0; color: #71717a;">GÓI ĐỀ XUẤT:</p>
      <p style="font-size: 15px; font-weight: bold; margin: 0; color: #09090b;">Gói Tư vấn &amp; Triển khai Hệ thống CRM Doanh nghiệp</p>
      <p style="font-size: 12px; margin: 6px 0 0 0; color: #16a34a; font-weight: 600;">✓ Ưu đãi đặc quyền 15% khi xác nhận triển khai trong tháng</p>
    </div>
    <p style="font-size: 13px; line-height: 1.6; color: #52525b;">
      Quý đối tác vui lòng xem chi tiết tài liệu đính kèm bên dưới hoặc phản hồi email này để đặt lịch ký kết hợp đồng.
    </p>
    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
    <p style="font-size: 12px; color: #a1a1aa; margin: 0;">SIDCORP Consulting Solutions · contact@sidcorp.vn</p>
  </div>
</body>
</html>`;

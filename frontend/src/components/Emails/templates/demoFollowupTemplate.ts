/**
 * Mẫu email chăm sóc sau buổi demo, gửi kèm biên bản và tài liệu.
 *
 * Email HTML phải dùng bảng và style nội tuyến vì phần lớn trình đọc mail
 * bỏ qua CSS ngoài — vì vậy chuỗi dài và không nên "dọn" cho gọn.
 * Tách khỏi component để trang không còn hơn 200 dòng chuỗi HTML chen giữa
 * phần logic React.
 */
export const TEMPLATE_DEMO_FOLLOWUP = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Biên bản tóm tắt buổi Demo CRM &amp; Khảo sát nhu cầu</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    <div style="border-bottom: 2px solid #e8732c; padding-bottom: 16px; margin-bottom: 24px;">
      <h2 style="color: #0f172a; margin: 0; font-size: 18px;">CẢM ƠN QUÝ ĐỐI TÁC ĐÃ THAM GIA BUỔI DEMO HỆ THỐNG</h2>
      <p style="color: #64748b; font-size: 13px; margin: 6px 0 0 0;">SIDCORP Solution Consulting &bull; Biên bản tóm tắt sau Demo</p>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #334155;">Kính gửi <strong>Quý Khách hàng</strong>,</p>
    <p style="font-size: 14px; line-height: 1.6; color: #334155;">
      SIDCORP chân thành cảm ơn Quý Anh/Chị đã dành thời gian trao đổi trong buổi Demo hệ thống CRM vừa qua. Chúng tôi xin gửi tóm tắt các điểm trọng tâm đã thảo luận:
    </p>
    <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="font-size: 13px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0;">Các tính năng trọng tâm theo nhu cầu của Doanh nghiệp:</p>
      <ul style="font-size: 13px; color: #475569; margin: 0; padding-left: 20px; line-height: 1.6;">
        <li>Tự động phân bổ khách hàng tiềm năng cho chuyên viên tư vấn</li>
        <li>Báo cáo phễu chuyển đổi doanh số theo thời gian thực (Realtime Dashboard)</li>
        <li>Tích hợp đính kèm hợp đồng Drive và quản lý lịch hẹn thông minh</li>
      </ul>
    </div>
    <p style="font-size: 13px; line-height: 1.6; color: #475569;">
      Tài liệu chi tiết và slide trình bày đã được đính kèm. Quý Anh/Chị vui lòng phản hồi email này nếu cần làm rõ thêm bất kỳ nội dung nào.
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">SIDCORP Consulting Solutions &bull; Hotline: 0931 825 336 &bull; www.sidcorp.co</p>
  </div>
</body>
</html>`;

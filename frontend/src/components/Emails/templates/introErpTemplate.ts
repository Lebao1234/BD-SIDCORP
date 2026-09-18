/**
 * Mẫu thư ngỏ giới thiệu hệ sinh thái SIDCORP (Cold Outreach).
 *
 * Email HTML phải dùng bảng và style nội tuyến vì phần lớn trình đọc mail
 * bỏ qua CSS ngoài — vì vậy chuỗi dài và không nên "dọn" cho gọn.
 * Tách khỏi component để trang không còn hơn 200 dòng chuỗi HTML chen giữa
 * phần logic React.
 */
export const TEMPLATE_INTRO_ERP = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Giới thiệu Hệ sinh thái SIDCORP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e4e4e7;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #18181b; padding: 32px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">SIDCORP SOLUTIONS</h1>
              <p style="color: #a1a1aa; margin: 8px 0 0 0; font-size: 13px;">Giải pháp Quản trị & Tối ưu Quy trình Bán hàng Chuyên sâu</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 30px;">
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Kính gửi <strong>Quý Ban Lãnh đạo Doanh nghiệp</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #3f3f46; margin: 0 0 20px 0;">
                Chúng tôi hiểu rằng việc theo dõi luồng khách hàng từ lúc tiếp cận đến khi ký hợp đồng và triển khai thường gặp nhiều rào cản do thiếu một hệ thống tập trung. 
                <strong>Hệ thống SIDCORP CRM</strong> được xây dựng chuyên biệt để giải quyết bài toán này.
              </p>
              <!-- Features Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px; background-color: #f8fafc; border-radius: 10px; border-left: 4px solid #18181b;">
                    <strong style="font-size: 13px; color: #09090b;">✓ Quản lý Khách hàng & Đầu mối Doanh nghiệp</strong>
                    <p style="font-size: 12px; color: #71717a; margin: 4px 0 0 0;">Lưu vết lịch sử tư vấn, đính kèm hợp đồng, tài liệu và tiến trình chăm sóc.</p>
                  </td>
                </tr>
                <tr><td height="10"></td></tr>
                <tr>
                  <td style="padding: 14px; background-color: #f8fafc; border-radius: 10px; border-left: 4px solid #18181b;">
                    <strong style="font-size: 13px; color: #09090b;">✓ Tích hợp Tài liệu Drive & Báo giá tức thì</strong>
                    <p style="font-size: 12px; color: #71717a; margin: 4px 0 0 0;">Truy cập nhanh bộ hồ sơ năng lực theo ngành nghề chỉ với 1 click.</p>
                  </td>
                </tr>
              </table>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
                <tr>
                  <td align="center">
                    <a href="https://sidcorp.vn/demo" style="background-color: #18181b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; display: inline-block;">
                      Đặt Lịch Demo Hệ Thống (30 Phút)
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 13px; line-height: 1.5; color: #71717a; margin: 20px 0 0 0;">
                Trân trọng,<br>
                <strong>Đội ngũ Tư vấn Cấp cao SIDCORP</strong><br>
                Hotline: 0901 234 567 | Email: contact@sidcorp.vn
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f4f5; padding: 18px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="font-size: 11px; color: #71717a; margin: 0;">© 2026 SIDCORP Corporation. Bảo lưu mọi quyền.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

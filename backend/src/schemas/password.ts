import { z } from 'zod';

/**
 * Chính sách mật khẩu dùng chung cho toàn hệ thống.
 *
 * File này cố ý chỉ import zod, giống schemas/customer.ts, để bản sao ở
 * frontend (src/utils/password.ts) có thể bám theo đúng cùng một bộ quy tắc mà
 * không kéo theo Prisma hay bcrypt.
 *
 * LÝ DO TỒN TẠI: trước đây mỗi nơi tự đặt luật riêng — registerSchema kiểm tra
 * `min(6)`, resetPasswordSchema cũng `min(6)`, còn `POST /users` và
 * `PUT /users/:id` thì không kiểm tra gì cả. Hệ quả là mật khẩu một ký tự vẫn
 * lọt qua nếu đi đúng đường. Gom về một chỗ thì không còn đường nào lọt.
 *
 * GHI CHÚ VỀ LỰA CHỌN: NIST SP 800-63B khuyến cáo KHÔNG nên bắt buộc ký tự đặc
 * biệt, vì quy tắc đó đẩy người dùng tới những mật khẩu kiểu `Matkhau@123` —
 * thoả luật nhưng dễ đoán. Ở đây vẫn giữ yêu cầu thành phần theo yêu cầu nghiệp
 * vụ, nhưng bù lại bằng hai thứ NIST coi trọng hơn: độ dài tối thiểu 10 và một
 * danh sách chặn các mật khẩu phổ biến.
 */

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 100;

// Danh sách chặn ngắn, nhắm vào những chuỗi thực sự hay gặp ở đây. Không thay
// thế được một danh sách rò rỉ đầy đủ, nhưng chặn được lớp mật khẩu tệ nhất mà
// vẫn thoả mọi quy tắc thành phần (ví dụ `Password@123`).
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', 'password@123', 'passw0rd',
  'qwerty', 'qwerty123', 'qwertyuiop', 'asdfghjkl',
  '1234567890', '123456789', '12345678', '11111111', '00000000',
  'iloveyou', 'sunshine', 'princess', 'football', 'baseball',
  'admin', 'admin123', 'admin@123', 'administrator', 'letmein',
  'welcome', 'welcome1', 'welcome@123', 'abc12345', 'abcd1234',
  'matkhau', 'matkhau123', 'matkhau@123', 'khongbiet', 'vietnam',
  'sidcorp', 'sidcorp123', 'sidcorp@123',
]);

const HAS_LETTER  = /\p{L}/u;
const HAS_DIGIT   = /\p{N}/u;
// "Ký tự đặc biệt" = không phải chữ, không phải số, không phải khoảng trắng.
// Khoảng trắng bị loại ra để một cụm từ có dấu cách không tự động được tính là
// đã có ký tự đặc biệt.
const HAS_SYMBOL  = /[^\p{L}\p{N}\s]/u;

export interface PasswordOwner {
  email?: string | null;
  name?: string | null;
}

/**
 * Trả về danh sách lỗi của một mật khẩu. Mảng rỗng nghĩa là hợp lệ.
 *
 * Trả về TẤT CẢ lỗi chứ không dừng ở lỗi đầu tiên, để giao diện hiển thị được
 * đủ các mục còn thiếu thay vì bắt người dùng sửa từng cái một.
 */
export const passwordIssues = (password: string, owner: PasswordOwner = {}): string[] => {
  const issues: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    issues.push(`Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`);
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    issues.push(`Mật khẩu không được vượt quá ${PASSWORD_MAX_LENGTH} ký tự.`);
  }
  if (!HAS_LETTER.test(password)) {
    issues.push('Mật khẩu phải có ít nhất một chữ cái.');
  }
  if (!HAS_DIGIT.test(password)) {
    issues.push('Mật khẩu phải có ít nhất một chữ số.');
  }
  if (!HAS_SYMBOL.test(password)) {
    issues.push('Mật khẩu phải có ít nhất một ký tự đặc biệt (ví dụ: ! @ # $ % & *).');
  }

  const normalized = password.trim().toLowerCase();
  if (COMMON_PASSWORDS.has(normalized)) {
    issues.push('Mật khẩu này nằm trong danh sách mật khẩu phổ biến, rất dễ bị đoán.');
  }

  // Mật khẩu chứa chính email hoặc tên của người dùng thì kẻ tấn công đoán ra
  // đầu tiên, dù nó có thoả mọi quy tắc thành phần.
  const localPart = (owner.email ?? '').split('@')[0]?.trim().toLowerCase();
  if (localPart && localPart.length >= 3 && normalized.includes(localPart)) {
    issues.push('Mật khẩu không được chứa địa chỉ email của bạn.');
  }

  const ownerName = (owner.name ?? '').trim().toLowerCase();
  if (ownerName && ownerName.length >= 3 && normalized.includes(ownerName)) {
    issues.push('Mật khẩu không được chứa tên của bạn.');
  }

  return issues;
};

/** Schema zod cho một trường mật khẩu đứng riêng, không đối chiếu email/tên. */
export const passwordSchema = z.string().superRefine((value, ctx) => {
  for (const message of passwordIssues(value)) {
    ctx.addIssue({ code: 'custom', message });
  }
});

/**
 * Gắn thêm phép đối chiếu mật khẩu với email và tên ở cấp object.
 *
 * Phải làm ở cấp object vì luật này cần đọc các trường anh em, thứ mà một
 * schema chuỗi đứng riêng không nhìn thấy được.
 */
export const refinePasswordAgainstOwner = <T extends z.ZodType<{ password: string; email?: string; name?: string }>>(
  schema: T
) =>
  schema.superRefine((data, ctx) => {
    const issues = passwordIssues(data.password, { email: data.email, name: data.name });
    for (const message of issues) {
      ctx.addIssue({ code: 'custom', path: ['password'], message });
    }
  });

/**
 * Bản sao của chính sách mật khẩu phía máy chủ.
 *
 * NGUỒN SỰ THẬT là `backend/src/schemas/password.ts` — máy chủ mới là nơi thực
 * sự từ chối một mật khẩu yếu. Bản này tồn tại để người dùng thấy được mình còn
 * thiếu điều kiện nào NGAY LÚC ĐANG GÕ, thay vì gõ xong, bấm gửi, rồi nhận về
 * một dòng lỗi.
 *
 * Hai file phải sửa cùng nhau. Nếu chúng lệch nhau thì hậu quả xấu nhất chỉ là
 * biểu mẫu báo hợp lệ rồi máy chủ vẫn từ chối — khó chịu, nhưng không tạo ra lỗ
 * hổng, vì phía máy chủ không bao giờ tin vào bản kiểm tra này.
 */

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 100;

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

const HAS_LETTER = /\p{L}/u;
const HAS_DIGIT  = /\p{N}/u;
const HAS_SYMBOL = /[^\p{L}\p{N}\s]/u;

export interface PasswordOwner {
  email?: string | null;
  name?: string | null;
}

/** Một điều kiện của chính sách, kèm trạng thái đã đạt hay chưa. */
export interface PasswordRule {
  id: string;
  label: string;
  passed: boolean;
}

/**
 * Bộ điều kiện hiển thị dưới ô nhập, cập nhật theo từng ký tự người dùng gõ.
 *
 * Trả về cả điều kiện đã đạt lẫn chưa đạt, vì một danh sách chỉ hiện lỗi sẽ
 * nhảy loạn trong lúc gõ và không cho người dùng thấy còn bao nhiêu bước nữa.
 */
export const passwordRules = (password: string, owner: PasswordOwner = {}): PasswordRule[] => {
  const normalized = password.trim().toLowerCase();
  const localPart = (owner.email ?? '').split('@')[0]?.trim().toLowerCase() ?? '';
  const ownerName = (owner.name ?? '').trim().toLowerCase();

  const containsLocalPart = localPart.length >= 3 && normalized.includes(localPart);
  const containsName = ownerName.length >= 3 && normalized.includes(ownerName);

  return [
    {
      id: 'length',
      label: `Ít nhất ${PASSWORD_MIN_LENGTH} ký tự`,
      passed: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
    },
    { id: 'letter', label: 'Có chữ cái',   passed: HAS_LETTER.test(password) },
    { id: 'digit',  label: 'Có chữ số',    passed: HAS_DIGIT.test(password) },
    {
      id: 'symbol',
      label: 'Có ký tự đặc biệt (! @ # $ % & *)',
      passed: HAS_SYMBOL.test(password),
    },
    {
      id: 'notCommon',
      label: 'Không phải mật khẩu phổ biến',
      passed: password.length > 0 && !COMMON_PASSWORDS.has(normalized),
    },
    {
      id: 'notPersonal',
      label: 'Không chứa email hoặc tên của bạn',
      passed: password.length > 0 && !containsLocalPart && !containsName,
    },
  ];
};

/** Mật khẩu đã thoả toàn bộ chính sách hay chưa. */
export const isPasswordValid = (password: string, owner: PasswordOwner = {}): boolean =>
  passwordRules(password, owner).every((r) => r.passed);

/** Thông báo lỗi đầu tiên chưa đạt, hoặc null nếu hợp lệ. */
export const firstPasswordIssue = (password: string, owner: PasswordOwner = {}): string | null => {
  const failed = passwordRules(password, owner).find((r) => !r.passed);
  return failed ? `Mật khẩu chưa đạt yêu cầu: ${failed.label.toLowerCase()}.` : null;
};

export type PasswordStrength = 'weak' | 'fair' | 'strong';

export interface PasswordStrengthResult {
  level: PasswordStrength;
  label: string;
  /** 0-100, dùng cho thanh hiển thị */
  percent: number;
}

/**
 * Mức độ mạnh để hiển thị.
 *
 * Thoả hết chính sách chỉ là mức tối thiểu chấp nhận được, chưa phải "mạnh".
 * Độ dài là yếu tố đóng góp nhiều nhất vào việc chống dò, nên nó quyết định
 * việc một mật khẩu đã hợp lệ có được gọi là mạnh hay không.
 */
export const passwordStrength = (
  password: string,
  owner: PasswordOwner = {}
): PasswordStrengthResult => {
  if (!isPasswordValid(password, owner)) {
    const passed = passwordRules(password, owner).filter((r) => r.passed).length;
    return {
      level: 'weak',
      label: 'Chưa đạt yêu cầu',
      percent: Math.round((passed / 6) * 55),
    };
  }

  if (password.length >= 16) {
    return { level: 'strong', label: 'Mạnh', percent: 100 };
  }

  return { level: 'fair', label: 'Đạt yêu cầu', percent: 72 };
};

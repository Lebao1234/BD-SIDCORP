import bcrypt from 'bcryptjs';

/**
 * Một chỗ duy nhất để băm và đối chiếu mật khẩu.
 *
 * Trước đây `bcrypt.hash(password, 10)` được viết lại ở bốn nơi khác nhau. Mỗi
 * lần muốn nâng chi phí băm là phải nhớ sửa đủ cả bốn, và chỉ cần bỏ sót một
 * chỗ là có một đường tạo ra hash yếu hơn phần còn lại.
 */

// bcrypt lưu chi phí ngay trong chuỗi hash, nên nâng số này KHÔNG làm hỏng mật
// khẩu cũ: hash cũ vẫn đối chiếu được, chỉ những lần đặt mật khẩu mới dùng chi
// phí mới. 12 là khuyến nghị hiện hành cho phần cứng máy chủ ngày nay.
export const BCRYPT_ROUNDS = 12;

// Hash của một chuỗi vô nghĩa, dùng cho trường hợp email không tồn tại.
// Sinh sẵn lúc nạp module để mỗi lần đăng nhập sai không phải trả thêm chi phí
// băm một lần nữa.
const DUMMY_HASH = bcrypt.hashSync('không-phải-mật-khẩu-của-ai', BCRYPT_ROUNDS);

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, BCRYPT_ROUNDS);

export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

/**
 * Tiêu tốn đúng lượng thời gian của một lần đối chiếu thật, rồi trả về false.
 *
 * Bản cũ của `login` thoát ngay khi không tìm thấy email, nên phản hồi cho một
 * email không tồn tại nhanh hơn hẳn phản hồi cho email có thật nhưng sai mật
 * khẩu. Chênh lệch đó đủ để dò ra tài khoản nào đang tồn tại chỉ bằng cách bấm
 * giờ. Chạy một lần đối chiếu giả làm hai nhánh tốn thời gian như nhau.
 */
export const fakeVerify = async (plain: string): Promise<false> => {
  await bcrypt.compare(plain, DUMMY_HASH);
  return false;
};

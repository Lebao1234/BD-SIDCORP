/**
 * Làm sạch tên file trước khi upload lên Cloud Storage (Supabase, AWS S3...)
 * - Chuyển chữ tiếng Việt có dấu thành không dấu
 * - Xóa các ký tự đặc biệt, thay khoảng trắng bằng dấu gạch dưới (_)
 * - Chống trùng lặp nhiều dấu gạch dưới liên tiếp
 */
export const cleanFileNameForStorage = (fileName: string): string => {
  return fileName
    .normalize('NFD') // Tách dấu ra khỏi chữ (VD: ả -> a + ̉)
    .replace(/[\u0300-\u036f]/g, '') // Xóa hết các dấu
    .replace(/đ/g, 'd').replace(/Đ/g, 'D') // Xử lý chữ Đ
    .replace(/[^a-zA-Z0-9.\-_]/g, '_') // Các ký tự lạ khác (kể cả khoảng trắng) biến thành _
    .replace(/_+/g, '_'); // Chống trường hợp 2 dấu __ đứng cạnh nhau
};

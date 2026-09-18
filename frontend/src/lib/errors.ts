import { AxiosError } from 'axios';

/**
 * Bóc thông điệp lỗi từ một lỗi bất kỳ.
 *
 * Trước đây mỗi handler tự viết lại `err.response?.data?.error || '...'`, và để
 * làm được thế thì phải khai `catch (err: any)` — đó là nguồn gốc của phần lớn
 * `no-explicit-any` trong thư mục pages. Gom về một chỗ thì các trang chỉ còn
 * `catch (err)` với `err: unknown` đúng kiểu, và thông điệp trả về nhất quán.
 *
 * Thứ tự ưu tiên: lỗi nghiệp vụ backend trả về -> lỗi mạng -> thông điệp dự phòng.
 */
export const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof AxiosError) {
    // Backend luôn trả { error: '...' }; một số endpoint cũ dùng { message: '...' }
    const payload = err.response?.data as { error?: string; message?: string } | undefined;
    const serverMessage = payload?.error || payload?.message;
    if (serverMessage) return serverMessage;

    // Không có response nghĩa là request không tới được server
    if (!err.response) {
      return 'Không kết nối được máy chủ. Vui lòng kiểm tra đường truyền và thử lại.';
    }

    if (err.response.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
    if (err.response.status === 404) return 'Không tìm thấy dữ liệu yêu cầu.';
    if (err.response.status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau ít phút.';
  }

  if (err instanceof Error && err.message) return err.message;

  return fallback;
};

/**
 * Bọc một lời gọi API để lỗi ném ra luôn mang thông điệp đọc được.
 *
 * Dùng trong `queryFn` / `mutationFn` của react-query: khi đó `error.message` ở
 * phía component đã là câu tiếng Việt hiển thị được, không cần bóc tách lại nữa.
 */
export const withErrorMessage = async <T>(
  operation: () => Promise<T>,
  fallback: string
): Promise<T> => {
  try {
    return await operation();
  } catch (err) {
    // Giu lai loi goc trong `cause` de console/Sentry van truy duoc stack that
    throw new Error(getErrorMessage(err, fallback), { cause: err });
  }
};

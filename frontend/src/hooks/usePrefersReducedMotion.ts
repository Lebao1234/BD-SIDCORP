import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const read = (): boolean => {
  // matchMedia vắng mặt khi chạy trong môi trường không có DOM (test, dựng tĩnh)
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(QUERY).matches;
};

/**
 * Người dùng có bật "giảm chuyển động" ở cấp hệ điều hành hay không.
 *
 * Đây là một tuỳ chọn trợ năng thật, không phải sở thích trang trí: với người
 * mắc rối loạn tiền đình, chuyển động lớn trên màn hình gây chóng mặt và buồn
 * nôn. Trang chủ của hệ thống này có số đếm chạy lên, bốn biểu đồ mọc dần và
 * các khối hiện ra so le — đúng loại chuyển động mà tuỳ chọn đó muốn tắt.
 *
 * Phần lớn hiệu ứng đã được xử lý bằng một khối `@media (prefers-reduced-motion)`
 * trong index.css. Hook này dành cho những chuyển động mà CSS không với tới
 * được: hiệu ứng chạy số điều khiển bằng requestAnimationFrame, và cổng mở
 * animation của các biểu đồ.
 */
export const usePrefersReducedMotion = (): boolean => {
  const [prefersReduced, setPrefersReduced] = useState(read);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia(QUERY);
    const handleChange = (event: MediaQueryListEvent) => setPrefersReduced(event.matches);

    // Đổi tuỳ chọn trong hệ điều hành phải có hiệu lực ngay, không đợi tải lại trang
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
};

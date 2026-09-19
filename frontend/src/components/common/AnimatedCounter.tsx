import React, { useLayoutEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatter?: (val: number) => string;
}

/**
 * Hiệu ứng chạy số (count-up) khi tải trang hoặc khi số liệu thay đổi.
 *
 * GHI THẲNG VÀO DOM, KHÔNG QUA STATE. Bản cũ gọi `setDisplayValue` trong mỗi
 * khung hình, tức khoảng 57 lần render cho một lần chạy 950ms — nhân với bốn
 * thẻ KPI trên trang chủ là hơn 200 lượt render chỉ để đổi vài chữ số. React
 * không cần biết về những giá trị trung gian đó: chúng chỉ tồn tại vài phần
 * nghìn giây rồi bị thay. Viết trực tiếp vào `textContent` cho kết quả hình ảnh
 * y hệt mà không đụng tới vòng đời của React.
 *
 * `useLayoutEffect` chứ không phải `useEffect`: mốc xuất phát phải nằm trong
 * DOM TRƯỚC khi trình duyệt vẽ, nếu không sẽ thấy một khung hình lóe lên con số
 * cuối rồi mới tụt về đầu.
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 950,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  formatter,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  const nodeRef = useRef<HTMLSpanElement>(null);
  // Con số ĐANG hiển thị. Nhờ nó, một lần chạy bị cắt ngang giữa chừng (đổi bộ
  // lọc, dữ liệu làm mới về sớm) vẫn nối tiếp từ đúng chỗ người dùng đang nhìn
  // chứ không giật về một mốc cũ.
  const shownRef = useRef(0);

  // Giữ các tuỳ chọn định dạng trong ref để chúng không nằm trong mảng phụ
  // thuộc của effect: nơi gọi thường truyền `formatter` dạng hàm inline, và một
  // tham chiếu mới mỗi lần render sẽ khiến animation khởi động lại liên tục.
  const formatOptions = useRef({ decimals, prefix, suffix, formatter });

  // Đồng bộ trong một layout effect KHÔNG có mảng phụ thuộc, khai báo trước
  // effect chạy animation bên dưới: các effect chạy theo thứ tự khai báo, nên
  // ref luôn mang giá trị mới nhất trước khi animation đọc tới. Gán thẳng trong
  // thân hàm render là ghi ref trong lúc render, điều React không cho phép.
  useLayoutEffect(() => {
    formatOptions.current = { decimals, prefix, suffix, formatter };
  });

  const format = (val: number): string => {
    const { decimals: d, prefix: p, suffix: sfx, formatter: fmt } = formatOptions.current;
    const body = fmt
      ? fmt(val)
      : d > 0
      ? val.toFixed(d).replace('.', ',')
      : Math.round(val).toLocaleString('vi-VN');
    return `${p}${body}${sfx}`;
  };

  useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const endValue = Number(value) || 0;
    const startValue = shownRef.current;

    // Giảm chuyển động: nhảy thẳng tới số cuối, không chạy khung hình nào
    if (prefersReducedMotion || startValue === endValue) {
      shownRef.current = endValue;
      node.textContent = format(endValue);
      return;
    }

    // Đặt mốc xuất phát ngay lập tức, trước khi trình duyệt vẽ khung đầu tiên
    node.textContent = format(startValue);

    let startTimestamp: number | null = null;
    let frameId = 0;

    const step = (timestamp: number) => {
      if (startTimestamp === null) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Ease-out cubic: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;

      shownRef.current = current;
      node.textContent = format(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        shownRef.current = endValue;
        node.textContent = format(endValue);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration, prefersReducedMotion]);

  // Không render nội dung từ JSX: toàn bộ phần chữ do effect ở trên quản lý.
  // React không bao giờ đụng tới `textContent` của một phần tử không có children,
  // nên hai bên không giẫm chân nhau.
  return <span ref={nodeRef} className={`inline-block tabular-nums ${className}`} />;
};

export default AnimatedCounter;

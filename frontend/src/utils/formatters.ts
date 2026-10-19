// Một ký hiệu tiền tệ cho toàn ứng dụng: "₫" (trước đây bảng dùng "đ", trang
// chủ dùng "₫").
export const formatCurrency = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null) return '0 ₫';
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) return '0 ₫';
  return numericAmount.toLocaleString('vi-VN') + ' ₫';
};

/** Tách số tiền thành con số rút gọn + đơn vị: 2_540_000_000 → { num: 2.54, unit: 'tỷ ₫' }. */
export const compactVnd = (val: number): { num: number; unit: string; decimals: number } => {
  if (Math.abs(val) >= 1_000_000_000) return { num: Math.round(val / 10_000_000) / 100, unit: 'tỷ ₫', decimals: 2 };
  if (Math.abs(val) >= 1_000_000) return { num: Math.round(val / 1_000_000), unit: 'triệu ₫', decimals: 0 };
  return { num: val, unit: '₫', decimals: 0 };
};

/** Số tiền rút gọn dạng chuỗi, dấu thập phân kiểu Việt: "2,54 tỷ ₫", "638 triệu ₫". */
export const formatVndCompact = (val: number): string => {
  const { num, unit, decimals } = compactVnd(val);
  return `${num.toLocaleString('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${unit}`;
};

/** Nhãn trục rút gọn: 1,5 tỷ · 50 tr · 200 N. */
export const formatAxisVnd = (val: number): string => {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`;
  if (val >= 1_000_000) return `${Math.round(val / 1_000_000)} tr`;
  if (val >= 1_000) return `${Math.round(val / 1_000)} N`;
  return `${val}`;
};

export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

export const formatDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('vi-VN');
};

export const parseId = (raw: string | number | undefined | null): number | null => {
  if (raw === undefined || raw === null) return null;

  const str = String(raw).trim();

  // Bắt định dạng PREFIX-SỐ (VD: TK-001, KH-042)
  const prefixMatch = str.match(/^[A-Za-z]+-(\d+)$/);
  if (prefixMatch) {
    const num = parseInt(prefixMatch[1], 10);
    return isNaN(num) ? null : num;
  }

  // Bắt trường hợp là số thuần tuý
  const num = parseInt(str, 10);
  return isNaN(num) ? null : num;
};

export const formatUserId = (id: number): string => `TK-${String(id).padStart(3, '0')}`;
export const formatCustomerId = (id: number): string => `KH-${String(id).padStart(3, '0')}`;

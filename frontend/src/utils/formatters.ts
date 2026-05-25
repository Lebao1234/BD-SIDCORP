export const formatCurrency = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null) return '0 đ';
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) return '0 đ';
  return numericAmount.toLocaleString('vi-VN') + ' đ';
};

export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

export const formatDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('vi-VN');
};

/**
 * Ghép className, bỏ qua giá trị rỗng/false — tương đương `cn()` của shadcn/ui
 * nhưng không kèm tailwind-merge: dự án có thang chữ riêng (text-2xs, text-md,
 * text-title…) mà tailwind-merge không biết, nó sẽ nhầm `text-md` với màu chữ
 * và xoá mất `text-fg`. Vì vậy không truyền hai class cùng thuộc tính để đè nhau.
 */
export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

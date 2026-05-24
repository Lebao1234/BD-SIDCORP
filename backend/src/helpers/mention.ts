// Parse tất cả ID từ @mention trong nội dung ghi chú (react-mentions)
// Ví dụ: "@[Nguyen Van A](2)" → trả về mảng số [2]
export const parseMentionedIds = (content: string): number[] => {
  const tagRegex = /@\[.*?\]\((\d+)\)/g;
  const ids = new Set<number>();
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(content)) !== null) {
    ids.add(Number(match[1]));
  }

  return [...ids];
};

// Parse dạng gõ tay @Ten_Nhan_Vien
// Ví dụ: "@Nguyen_Van_A" -> "Nguyen Van A"
export const parseMentionedNames = (content: string): string[] => {
  const tagRegex = /@([a-zA-ZÀ-ỹ0-9_]+)/g;
  const names = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(content)) !== null) {
    // Chỉ parse các chuỗi không nằm trong format của react-mentions
    if (!content.includes(`@[${match[1]}`)) {
      names.add(match[1].replace(/_/g, ' '));
    }
  }

  return [...names];
};
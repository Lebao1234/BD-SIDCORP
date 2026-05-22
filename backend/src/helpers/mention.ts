// Parse tất cả @mention từ nội dung ghi chú
// Hỗ trợ Unicode (tiếng Việt có dấu)
// Ví dụ: "@Nguyen_Van_A" → "Nguyen Van A"
export const parseMentionedNames = (content: string): string[] => {
  const tagRegex = /@([\p{L}\p{N}_]+)/gu;
  const names    = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(content)) !== null) {
    names.add(match[1].replace(/_/g, ' '));
  }

  return [...names];
};
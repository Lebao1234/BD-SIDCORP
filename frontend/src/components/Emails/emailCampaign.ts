import { DEFAULT_TEMPLATE_ID, TEMPLATE_SIDPEAK, findTemplate } from './templates';

export type ArchivedEmailStatus = 'sent' | 'draft';

/** Một email đã lưu trữ, ở dạng màn hình dùng trực tiếp. */
export interface ArchivedEmail {
  id: string;
  dbId?: number;
  recipientName: string;
  recipientEmail: string;
  customerCompany?: string;
  subject: string;
  snippet: string;
  templateName: string;
  templateId: string;
  senderName: string;
  status: ArchivedEmailStatus;
  /**
   * Mốc thời gian dạng ISO — KHÔNG phải chuỗi đã định dạng.
   *
   * Bản cũ lưu thẳng `toLocaleString('vi-VN')` vào state, nên dữ liệu và cách
   * hiển thị dính vào nhau: không sắp xếp được theo thời gian, không đổi được
   * định dạng, và mỗi nơi tạo bản ghi lại sinh ra một kiểu chuỗi khác nhau.
   */
  sentAt: string | null;
  htmlContent: string;
}

/** Dữ liệu người dùng nhập ở form soạn thư. */
export interface ComposeEmailInput {
  recipientName: string;
  recipientEmail: string;
  customerCompany: string;
  subject: string;
  templateId: string;
  status: ArchivedEmailStatus;
}

/**
 * Hình dạng bản ghi Asset mà backend trả về.
 *
 * Khai báo tường minh thay vì `any` để chỗ ánh xạ bên dưới được kiểm kiểu, và
 * để thấy ngay trường nào là tuỳ chọn.
 */
export interface EmailAssetRecord {
  id: number;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  status?: string | null;
  created_at?: string | null;
  meta?: Record<string, unknown> | null;
  owner?: { id: number; name?: string | null; email?: string | null } | null;
}

const readString = (
  meta: Record<string, unknown> | null | undefined,
  key: string
): string | undefined => {
  const value = meta?.[key];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed !== '' && trimmed !== '[object Object]') return trimmed;
  }
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.name === 'string' && obj.name.trim() !== '') return obj.name.trim();
    if (typeof obj.email === 'string' && obj.email.trim() !== '') return obj.email.trim();
    if (typeof obj.title === 'string' && obj.title.trim() !== '') return obj.title.trim();
  }
  return undefined;
};

const cleanText = (val: unknown, fallback: string): string => {
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  if (!trimmed || trimmed === '[object Object]') return fallback;
  return trimmed;
};

/** Trạng thái nghiệp vụ -> giá trị enum AssetStatus của Prisma. */
export const toAssetStatus = (status: ArchivedEmailStatus): 'PUBLISHED' | 'DRAFT' =>
  status === 'sent' ? 'PUBLISHED' : 'DRAFT';

/** Các trường nghiệp vụ của email được lưu trữ và bóc tách từ trường meta */
interface ResolvedEmailMeta {
  recipientName: string;
  recipientEmail: string;
  customerCompany?: string;
  subject: string;
  snippet: string;
  templateId: string;
  templateName: string;
  htmlContent: string;
  senderName: string;
  status: ArchivedEmailStatus;
  sentAt: string | null;
}

/**
 * Gom và phân giải toàn bộ thông tin meta & fallback của Asset thành đối tượng chuẩn hóa.
 * Tách biệt rõ ràng 4 nhóm: Người nhận, Nội dung, Mẫu giao diện, và Trạng thái.
 */
const resolveEmailMeta = (asset: EmailAssetRecord): ResolvedEmailMeta => {
  const meta = asset.meta ?? {};

  // 1. Nhóm thông tin người nhận (Recipient)
  const recipientEmail = readString(meta, 'recipientEmail') ?? '';
  const fallbackName = recipientEmail ? recipientEmail.split('@')[0] : 'Khách hàng';
  const recipientName = cleanText(readString(meta, 'recipientName') ?? asset.title, fallbackName);
  const customerCompany = readString(meta, 'customerCompany');

  // 2. Nhóm nội dung thư (Content)
  const subject = cleanText(readString(meta, 'subject') ?? asset.title, '(Không có tiêu đề)');
  const snippet = cleanText(asset.description ?? readString(meta, 'snippet'), '');

  // 3. Nhóm mẫu giao diện (Template)
  const templateId = readString(meta, 'templateId') ?? DEFAULT_TEMPLATE_ID;
  const template = findTemplate(templateId);
  const templateName =
    asset.category ??
    readString(meta, 'templateName') ??
    template?.name ??
    'Mẫu tùy chỉnh';
  const htmlContent =
    readString(meta, 'htmlContent') ??
    readString(meta, 'templateHtml') ??
    template?.htmlContent ??
    TEMPLATE_SIDPEAK;

  // 4. Nhóm người gửi & trạng thái lưu (Audit & Status)
  const isSent = asset.status === 'PUBLISHED' || readString(meta, 'status') === 'sent';
  const senderName = cleanText(readString(meta, 'senderName') ?? asset.owner?.name, 'Nhân viên');
  const sentAt = readString(meta, 'sentAt') ?? asset.created_at ?? null;

  return {
    recipientName,
    recipientEmail,
    customerCompany,
    subject,
    snippet,
    templateId,
    templateName,
    htmlContent,
    senderName,
    status: isSent ? 'sent' : 'draft',
    sentAt,
  };
};

/**
 * Asset (backend) -> ArchivedEmail (giao diện).
 * Gom định danh Asset với gói metadata đã được xử lý gọn gàng.
 */
export const mapAssetToEmail = (asset: EmailAssetRecord): ArchivedEmail => ({
  id: String(asset.id),
  dbId: asset.id,
  ...resolveEmailMeta(asset),
});

/**
 * ArchivedEmail (giao diện) -> phần thân request gửi lên `/assets`.
 *
 * Trước đây khối `meta` này được dựng tay ở hai chỗ — lúc tạo mới và lúc đổi
 * trạng thái — với danh sách trường hơi khác nhau, nên đổi trạng thái một email
 * sẽ làm rơi mất vài trường mà bước tạo đã lưu (ví dụ `templateId`).
 */
export const buildAssetPayload = (email: ArchivedEmail) => ({
  type: 'EMAIL_TEMPLATE' as const,
  title: email.recipientName,
  description: email.snippet,
  category: email.templateName,
  status: toAssetStatus(email.status),
  meta: {
    recipientName: email.recipientName,
    recipientEmail: email.recipientEmail,
    customerCompany: email.customerCompany ?? '',
    subject: email.subject,
    snippet: email.snippet,
    templateName: email.templateName,
    templateId: email.templateId,
    senderName: email.senderName,
    status: email.status,
    sentAt: email.sentAt,
    htmlContent: email.htmlContent,
  },
});

/** Dữ liệu form + người soạn -> bản ghi email hoàn chỉnh (chưa có id từ CSDL). */
export const buildEmailFromInput = (
  input: ComposeEmailInput,
  senderName: string
): Omit<ArchivedEmail, 'id' | 'dbId'> => {
  const template = findTemplate(input.templateId);
  const subject = input.subject.trim();

  return {
    recipientName: input.recipientName.trim(),
    recipientEmail: input.recipientEmail.trim(),
    customerCompany: input.customerCompany.trim() || undefined,
    subject,
    snippet: `Email: ${subject}`,
    templateName: template?.name ?? 'Mẫu tùy chỉnh',
    templateId: input.templateId,
    senderName,
    status: input.status,
    sentAt: new Date().toISOString(),
    htmlContent: template?.htmlContent ?? TEMPLATE_SIDPEAK,
  };
};

/** Một email có khớp từ khoá tìm kiếm không. */
export const matchesSearch = (email: ArchivedEmail, keyword: string): boolean => {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;

  return [
    email.recipientName,
    email.recipientEmail,
    email.subject,
    email.templateName,
    email.customerCompany,
  ].some((field) => field?.toLowerCase().includes(q));
};

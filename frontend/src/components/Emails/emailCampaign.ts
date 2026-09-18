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
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
};

/** Trạng thái nghiệp vụ -> giá trị enum AssetStatus của Prisma. */
export const toAssetStatus = (status: ArchivedEmailStatus): 'PUBLISHED' | 'DRAFT' =>
  status === 'sent' ? 'PUBLISHED' : 'DRAFT';

/**
 * Asset (backend) -> ArchivedEmail (giao diện).
 *
 * Toàn bộ kiến thức về việc "email tiếp thị được lưu như một Asset kiểu
 * EMAIL_TEMPLATE, với chi tiết nằm trong cột meta" gói gọn trong file này.
 */
export const mapAssetToEmail = (asset: EmailAssetRecord): ArchivedEmail => {
  const meta = asset.meta ?? {};
  const isSent = asset.status === 'PUBLISHED' || readString(meta, 'status') === 'sent';
  const templateId = readString(meta, 'templateId') ?? DEFAULT_TEMPLATE_ID;

  return {
    id: String(asset.id),
    dbId: asset.id,
    recipientName: readString(meta, 'recipientName') ?? asset.title ?? 'Khách hàng',
    recipientEmail: readString(meta, 'recipientEmail') ?? '',
    customerCompany: readString(meta, 'customerCompany'),
    subject: readString(meta, 'subject') ?? asset.title ?? '(Không có tiêu đề)',
    snippet: asset.description ?? readString(meta, 'snippet') ?? '',
    templateName:
      asset.category ??
      readString(meta, 'templateName') ??
      findTemplate(templateId)?.name ??
      'Mẫu tùy chỉnh',
    templateId,
    senderName: readString(meta, 'senderName') ?? asset.owner?.name ?? 'Lê Quốc Bảo (Tư vấn)',
    status: isSent ? 'sent' : 'draft',
    sentAt: readString(meta, 'sentAt') ?? asset.created_at ?? null,
    htmlContent:
      readString(meta, 'htmlContent') ??
      readString(meta, 'templateHtml') ??
      findTemplate(templateId)?.htmlContent ??
      TEMPLATE_SIDPEAK,
  };
};

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

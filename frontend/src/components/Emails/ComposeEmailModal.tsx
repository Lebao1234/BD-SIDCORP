import React, { useState } from 'react';
import { Check, ChevronDown, Send, X } from 'lucide-react';
import { Alert } from '../common/Alert';
import { useFeedback } from '../../hooks/useFeedback';
import { useCustomerOptions } from '../../hooks/useCustomerOptions';
import { AVAILABLE_TEMPLATES, findTemplate } from './templates';
import type { ArchivedEmailStatus, ComposeEmailInput } from './emailCampaign';

interface ComposeEmailModalProps {
  initialTemplateId: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: ComposeEmailInput) => Promise<void>;
}

const INPUT_CLASS =
  'w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-zinc-900 dark:focus:border-white transition shadow-2xs';
const LABEL_CLASS = 'text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1';

/**
 * Cửa sổ soạn và lưu trữ email.
 *
 * State của form nằm trọn trong đây. Trang cha trước kia giữ chín biến state chỉ
 * riêng cho form này, và chúng vẫn tồn tại cả khi cửa sổ đã đóng — nên giá trị
 * cũ còn sót lại ở lần mở sau.
 *
 * Trang cha chỉ render component này khi cần mở, nên mỗi lần mở là một lần mount
 * mới và form luôn bắt đầu từ trạng thái sạch.
 */
export const ComposeEmailModal: React.FC<ComposeEmailModalProps> = ({
  initialTemplateId,
  isSaving,
  onClose,
  onSubmit,
}) => {
  const { options: customers, isTruncated, total } = useCustomerOptions();
  const { feedback, showErrorFrom, clear } = useFeedback();

  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [subject, setSubject] = useState(() => findTemplate(initialTemplateId)?.defaultSubject ?? '');
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [status, setStatus] = useState<ArchivedEmailStatus>('sent');

  const handleSelectCustomer = (customerId: string) => {
    const customer = customers.find((c) => String(c.id) === customerId);
    if (!customer) return;

    setRecipientName(customer.name ?? '');
    if (customer.email) setRecipientEmail(customer.email);
    if (customer.company?.name) setCustomerCompany(customer.company.name);
  };

  const handleSelectTemplate = (id: string) => {
    setTemplateId(id);
    // Chỉ điền tiêu đề gợi ý khi người dùng chưa tự gõ, để không ghi đè lên
    // tiêu đề họ vừa soạn.
    if (!subject.trim()) setSubject(findTemplate(id)?.defaultSubject ?? '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clear();

    try {
      await onSubmit({
        recipientName,
        recipientEmail,
        customerCompany,
        subject,
        templateId,
        status,
      });
      onClose();
    } catch (err) {
      // Lỗi hiện ngay trong cửa sổ và KHÔNG đóng form, để người dùng không mất
      // những gì vừa nhập. Bản cũ dùng alert() rồi vẫn giữ form ở trạng thái mơ hồ.
      showErrorFrom(err, 'Không thể lưu trữ email. Vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl z-10 flex flex-col border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-modal-pop max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Soạn &amp; Lưu Trữ Email Tiếp Thị
              </h3>
              <p className="text-[11px] text-zinc-500">
                Lưu lại nội dung và lịch sử email tiếp cận khách hàng trong hệ thống CRM.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ soạn thư"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <Alert feedback={feedback} onDismiss={clear} />

          {customers.length > 0 && (
            <div>
              <label className={LABEL_CLASS}>Chọn nhanh từ Khách hàng CRM</label>
              <div className="relative">
                <select
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  defaultValue=""
                  className={`${INPUT_CLASS} appearance-none`}
                >
                  <option value="">-- Chọn khách hàng trong danh bạ CRM (tùy chọn) --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.email ? `(${c.email})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {isTruncated && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                  Đang hiển thị {customers.length} trong tổng số {total} khách hàng. Nếu không thấy
                  người cần tìm, hãy nhập trực tiếp thông tin bên dưới.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Họ và tên người nhận *</label>
              <input
                type="text"
                required
                placeholder="VD: Anh Hoàng Nam, Chị Lan..."
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Doanh nghiệp / Đơn vị</label>
              <input
                type="text"
                placeholder="VD: Tập đoàn Vinatex..."
                value={customerCompany}
                onChange={(e) => setCustomerCompany(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Địa chỉ Email người nhận *</label>
            <input
              type="email"
              required
              placeholder="VD: nam.hoang@vinatex-group.vn"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Tiêu đề Email *</label>
            <input
              type="text"
              required
              placeholder="VD: [SidPeak] Giải Pháp Quản Trị Nhân Sự..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Mẫu template áp dụng *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTemplate(t.id)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition text-left ${
                    templateId === t.id
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-200 font-semibold'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <span className="truncate pr-2">{t.name}</span>
                  {templateId === t.id && (
                    <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Trạng thái lưu trữ</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="radio"
                  name="emailStatus"
                  checked={status === 'sent'}
                  onChange={() => setStatus('sent')}
                  className="text-zinc-900 focus:ring-zinc-900"
                />
                <span>Đã gửi (ghi nhận đã gửi cho khách)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="radio"
                  name="emailStatus"
                  checked={status === 'draft'}
                  onChange={() => setStatus('draft')}
                  className="text-zinc-900 focus:ring-zinc-900"
                />
                <span>Bản nháp (lưu tạm chuẩn bị)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-xl text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu vào Kho Lưu Trữ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

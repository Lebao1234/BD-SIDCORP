/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Asset } from '../../types';

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    category?: string;
    file_url: string;
    format?: string;
    tags?: string[];
  }) => Promise<void>;
  initialData?: Asset | null;
}

const CATEGORIES = [
  'Hợp đồng',
  'Proposal / Đề xuất',
  'Báo giá',
  'Slide năng lực',
  'Biểu mẫu & Checklist',
  'Quy trình & Framework',
  'Khác',
];

const DRIVE_FORMAT_RULES = [
  { pattern: /docs\.google\.com\/document/i, format: 'docs' },
  { pattern: /docs\.google\.com\/spreadsheets/i, format: 'sheets' },
  { pattern: /docs\.google\.com\/presentation/i, format: 'slides' },
  { pattern: /drive\.google\.com\/drive\/folders/i, format: 'folder' },
  { pattern: /drive\.google\.com\/file|\/file\/d\//i, format: 'drive_file' },
  { pattern: /\.pdf($|\?)/i, format: 'pdf' },
] as const;

const detectFormat = (url: string): string => {
  if (!url) return 'docs';
  const matched = DRIVE_FORMAT_RULES.find((rule) => rule.pattern.test(url));
  return matched ? matched.format : 'docs';
};

const fieldCls =
  'h-8 w-full rounded-md border border-line-input bg-surface px-2.5 text-[13px] text-fg ' +
  'dark:border-[#332f2c] dark:bg-[#232120] focus:border-line-strong focus:outline-none';
const labelCls = 'text-[11px] text-fg-subtle';

export const ResourceModal: React.FC<ResourceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [category, setCategory] = useState('Hợp đồng');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [format, setFormat] = useState('docs');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setFileUrl(initialData.file_url || '');
      setCategory(initialData.category || 'Hợp đồng');
      setDescription(initialData.description || '');
      setTagsInput(Array.isArray(initialData.tags) ? initialData.tags.join(', ') : '');
      setFormat(initialData.format || 'docs');
    } else {
      setTitle('');
      setFileUrl('');
      setCategory('Hợp đồng');
      setDescription('');
      setTagsInput('');
      setFormat('docs');
    }
    setError('');
  }, [initialData, isOpen]);

  // Tự động nhận diện format khi dán link Drive
  const handleUrlChange = (val: string) => {
    setFileUrl(val);
    const detected = detectFormat(val);
    setFormat(detected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên tài liệu.');
      return;
    }
    if (!fileUrl.trim()) {
      setError('Vui lòng nhập đường dẫn Google Drive.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await onSubmit({
        title: title.trim(),
        file_url: fileUrl.trim(),
        category,
        description: description.trim(),
        format,
        tags,
      });
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Lỗi khi lưu tài liệu:', err);
      setError(err?.response?.data?.error || 'Có lỗi xảy ra khi lưu tài liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[#2a2724]/50"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[520px] rounded-lg border border-line-strong bg-surface dark:border-[#3d3934] dark:bg-[#232120] shadow-xl overflow-hidden animate-modal-pop">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-[#332f2c]">
          <h3 className="text-[13px] font-semibold text-fg">
            {initialData ? 'Sửa tài liệu' : 'Thêm tài liệu mới'}
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-fg-subtle transition hover:bg-raised dark:hover:bg-[#2c2a27]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
          {error && (
            <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}

          {/* Tên tài liệu */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Tên tài liệu / Biểu mẫu *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Hợp đồng tư vấn chuyển đổi số mẫu 2026"
              className={fieldCls}
              autoFocus
            />
          </div>

          {/* Đường dẫn Google Drive */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Đường dẫn liên kết Google Drive *</label>
            <div className="relative">
              <input
                type="url"
                required
                value={fileUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://docs.google.com/..."
                className={fieldCls}
              />
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Mở kiểm tra liên kết"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Phân loại & Định dạng */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Danh mục</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={fieldCls}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Định dạng tệp</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className={fieldCls}
              >
                <option value="docs">Google Docs</option>
                <option value="sheets">Google Sheets</option>
                <option value="slides">Google Slides</option>
                <option value="folder">Thư mục Drive</option>
                <option value="pdf">Tệp PDF</option>
              </select>
            </div>
          </div>

          {/* Ghi chú / Hướng dẫn sử dụng */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Ghi chú hướng dẫn sử dụng</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Dùng để gửi sau buổi khảo sát nhu cầu ban đầu…"
              className="w-full rounded-md border border-line-input bg-surface p-2 text-[13px] text-fg placeholder:text-fg-subtle dark:border-[#332f2c] dark:bg-[#232120] focus:border-line-strong focus:outline-none resize-none"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Từ khóa phân loại (cách nhau bởi dấu phẩy)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="VD: Hợp đồng, Chuyển đổi số, Khảo sát"
              className={fieldCls}
            />
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-line pt-3 mt-1 dark:border-[#332f2c]">
            <button
              type="button"
              onClick={onClose}
              className="h-[30px] rounded-md border border-line bg-surface px-3 text-xs font-medium text-fg-muted hover:bg-raised dark:border-[#332f2c] dark:bg-[#232120]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[30px] rounded-md bg-brand px-3.5 text-xs font-medium text-white transition hover:bg-[#d2651f] disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu…' : initialData ? 'Cập nhật' : 'Thêm tài liệu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ExternalLink,
  UploadCloud,
  Link2,
  FileText,
  FileCheck,
  Table as TableIcon,
  Presentation,
  Image as ImageIcon,
  Archive,
} from 'lucide-react';
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
  onUpload?: (formData: FormData) => Promise<void>;
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

const detectDriveFormat = (url: string): string => {
  if (!url) return 'docs';
  const matched = DRIVE_FORMAT_RULES.find((rule) => rule.pattern.test(url));
  return matched ? matched.format : 'docs';
};

const detectUploadedFileFormat = (fileName: string, mimeType?: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['doc', 'docx'].includes(ext) || mimeType?.includes('word')) return 'docs';
  if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType?.includes('spreadsheet') || mimeType?.includes('csv')) return 'sheets';
  if (['ppt', 'pptx'].includes(ext) || mimeType?.includes('presentation')) return 'slides';
  if (['pdf'].includes(ext) || mimeType?.includes('pdf')) return 'pdf';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) || mimeType?.startsWith('image/')) return 'image';
  if (['zip', 'rar', '7z'].includes(ext)) return 'archive';
  return 'other';
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fieldCls =
  'h-8 w-full rounded-md border border-line-input bg-surface px-2.5 text-[13px] text-fg ' +
  'dark:border-[#332f2c] dark:bg-[#232120] focus:border-line-strong focus:outline-none';
const labelCls = 'text-[11px] text-fg-subtle font-medium';

export const ResourceModal: React.FC<ResourceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onUpload,
  initialData,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setActiveTab('link');
      setSelectedFile(null);
    } else {
      setTitle('');
      setFileUrl('');
      setCategory('Hợp đồng');
      setDescription('');
      setTagsInput('');
      setFormat('docs');
      setActiveTab('upload');
      setSelectedFile(null);
    }
    setError('');
  }, [initialData, isOpen]);

  // Xử lý khi chọn file upload
  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('Dung lượng tệp vượt quá giới hạn 10MB.');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Tự động điền tiêu đề nếu chưa có
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setTitle(cleanName);
    }

    // Nhận diện format từ file
    const detected = detectUploadedFileFormat(file.name, file.type);
    setFormat(detected);
  };

  // Tự động nhận diện format khi dán link Drive
  const handleUrlChange = (val: string) => {
    setFileUrl(val);
    const detected = detectDriveFormat(val);
    setFormat(detected);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên tài liệu.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      setIsSubmitting(true);
      setError('');

      if (!initialData && activeTab === 'upload') {
        if (!selectedFile) {
          setError('Vui lòng chọn hoặc kéo thả tệp tin cần tải lên.');
          setIsSubmitting(false);
          return;
        }

        if (!onUpload) {
          setError('Chức năng tải tệp chưa được cấu hình.');
          setIsSubmitting(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', title.trim());
        formData.append('category', category);
        formData.append('description', description.trim());
        formData.append('tags', JSON.stringify(tags));
        formData.append('format', format);

        await onUpload(formData);
      } else {
        if (!fileUrl.trim()) {
          setError('Vui lòng nhập đường dẫn liên kết tài liệu.');
          setIsSubmitting(false);
          return;
        }

        await onSubmit({
          title: title.trim(),
          file_url: fileUrl.trim(),
          category,
          description: description.trim(),
          format,
          tags,
        });
      }

      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Lỗi khi lưu tài liệu:', err);
      setError(err?.response?.data?.error || err?.message || 'Có lỗi xảy ra khi lưu tài liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormatIcon = (fmt: string) => {
    switch (fmt) {
      case 'sheets':
        return <TableIcon className="h-4 w-4 text-ok shrink-0" />;
      case 'slides':
        return <Presentation className="h-4 w-4 text-warn shrink-0" />;
      case 'pdf':
        return <FileCheck className="h-4 w-4 text-danger shrink-0" />;
      case 'image':
        return <ImageIcon className="h-4 w-4 text-purple-500 shrink-0" />;
      case 'archive':
        return <Archive className="h-4 w-4 text-amber-500 shrink-0" />;
      default:
        return <FileText className="h-4 w-4 text-info shrink-0" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#2a2724]/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[540px] rounded-lg border border-line-strong bg-surface dark:border-[#3d3934] dark:bg-[#232120] shadow-xl overflow-hidden animate-modal-pop">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-[#332f2c]">
          <h3 className="text-[13px] font-semibold text-fg">
            {initialData ? 'Sửa thông tin tài liệu' : 'Thêm tài liệu vào kho lưu trữ'}
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-fg-subtle transition hover:bg-raised dark:hover:bg-[#2c2a27]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selection (Chỉ hiện khi thêm mới) */}
        {!initialData && (
          <div className="grid grid-cols-2 border-b border-line bg-raised/50 dark:border-[#332f2c] dark:bg-[#1c1b18]">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition cursor-pointer border-b-2 ${
                activeTab === 'upload'
                  ? 'border-brand text-brand bg-surface dark:bg-[#232120] font-semibold'
                  : 'border-transparent text-fg-muted hover:text-fg'
              }`}
            >
              <UploadCloud className="h-4 w-4" />
              <span>Tải tệp lên trực tiếp</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition cursor-pointer border-b-2 ${
                activeTab === 'link'
                  ? 'border-brand text-brand bg-surface dark:bg-[#232120] font-semibold'
                  : 'border-transparent text-fg-muted hover:text-fg'
              }`}
            >
              <Link2 className="h-4 w-4" />
              <span>Liên kết Google Drive</span>
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
          {error && (
            <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}

          {/* Vùng Tải tệp trực tiếp */}
          {!initialData && activeTab === 'upload' && (
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Tệp tin tải lên (Tối đa 10MB) *</label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.zip,.rar"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 text-center cursor-pointer transition ${
                    isDragging
                      ? 'border-brand bg-brand/5 dark:bg-brand/10'
                      : 'border-line hover:border-line-strong hover:bg-raised/60 dark:border-[#332f2c] dark:hover:bg-[#2c2a27]'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-raised dark:bg-[#2c2a27] text-brand">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs font-medium text-fg">
                      Nhấn để chọn tệp hoặc kéo thả vào đây
                    </p>
                    <p className="text-[11px] text-fg-subtle">
                      Hỗ trợ PDF, Word, Excel, Slide, Ảnh hoặc File nén (tối đa 10MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-line bg-raised/40 p-2.5 dark:border-[#332f2c] dark:bg-[#1e1d1a]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface border border-line dark:border-[#332f2c] dark:bg-[#232120]">
                      {getFormatIcon(format)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="truncate text-xs font-medium text-fg">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-fg-subtle">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded px-2 py-1 text-[11px] font-medium text-brand hover:underline"
                    >
                      Đổi tệp
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="flex h-6 w-6 items-center justify-center rounded text-fg-subtle hover:text-danger"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vùng Dán Link Drive */}
          {(initialData || activeTab === 'link') && (
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Đường dẫn liên kết tài liệu *</label>
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
              autoFocus={Boolean(initialData)}
            />
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
              <label className={labelCls}>Định dạng hiển thị</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className={fieldCls}
              >
                <option value="docs">Google Docs / Word</option>
                <option value="sheets">Google Sheets / Excel</option>
                <option value="slides">Google Slides / PowerPoint</option>
                <option value="folder">Thư mục Drive</option>
                <option value="pdf">Tệp PDF</option>
                <option value="image">Hình ảnh</option>
                <option value="archive">File nén (Zip/Rar)</option>
                <option value="other">Khác</option>
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
              className="h-[30px] rounded-md bg-brand px-3.5 text-xs font-medium text-white transition hover:bg-[#d2651f] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Đang xử lý…</span>
              ) : initialData ? (
                <span>Cập nhật</span>
              ) : activeTab === 'upload' ? (
                <>
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Tải lên tài nguyên</span>
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Lưu liên kết</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ResourceModal;

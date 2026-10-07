/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Trash2, ImagePlus, Upload, Loader2, Link2 } from 'lucide-react';
import { LABELS } from '../../constants/notes';
import type { Note, ChecklistItem, CustomerOption } from '../../types';
import api from '../../services/api';
import { getErrorMessage } from '../../lib/errors';

interface NoteEditorModalProps {
  isOpen: boolean;
  note: Note | null;
  customers: CustomerOption[];
  onClose: () => void;
  onSave: (data: {
    title: string;
    content?: string;
    imageUrl?: string;
    customer_id?: number | null;
    customerName?: string | null;
    labels: string[];
    checklist?: ChecklistItem[];
  }) => void;
  onDelete?: (id: string) => void;
}

const fieldCls =
  'h-8 w-full rounded-md border border-line-input bg-surface px-2.5 text-[13px] text-fg ' +
  'dark:border-[#332f2c] dark:bg-[#232120] focus:border-line-strong focus:outline-none';
const labelCls = 'text-[11px] text-fg-subtle';

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isOpen,
  note,
  customers,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formCustomerId, setFormCustomerId] = useState<number | ''>('');
  const [formLabels, setFormLabels] = useState<string[]>([]);
  const [formChecklist, setFormChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (note) {
        setFormTitle(note.title);
        setFormContent(note.content || '');
        setFormImageUrl(note.imageUrl || '');
        setFormCustomerId(note.customer_id || '');
        setFormLabels(note.labels || []);
        setFormChecklist(note.checklist || []);
      } else {
        setFormTitle('');
        setFormContent('');
        setFormImageUrl('');
        setFormCustomerId('');
        setFormLabels(['Tư vấn']);
        setFormChecklist([]);
      }
      setNewChecklistText('');
    }
  }, [isOpen, note]);

  if (!isOpen) return null;

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setFormChecklist((prev) => [
      ...prev,
      { id: Date.now().toString(), text: newChecklistText.trim(), done: false },
    ]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setFormChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleLabel = (labelName: string) => {
    if (formLabels.includes(labelName)) {
      setFormLabels(formLabels.filter((l) => l !== labelName));
    } else {
      setFormLabels([...formLabels, labelName]);
    }
  };

  const handleProcessImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP, GIF)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Dung lượng ảnh tối đa 5MB');
      return;
    }

    setUploadError(null);
    setIsUploadingImage(true);

    // Không lùi về lưu Base64 khi upload hỏng: ảnh 5MB thành ~6.7MB chuỗi Base64,
    // vượt hạn mức ~5MB của localStorage nên lần lưu ghi chú sau đó sẽ ném lỗi.
    // Upload hỏng thì báo lỗi và giữ nguyên ảnh cũ.
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/chat/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.publicUrl) {
        setFormImageUrl(res.data.publicUrl);
      } else {
        setUploadError('Máy chủ không trả về đường dẫn ảnh. Vui lòng thử lại.');
      }
    } catch (err) {
      setUploadError(getErrorMessage(err, 'Tải ảnh lên thất bại. Vui lòng thử lại.'));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lưu lúc ảnh đang tải lên thì ghi chú giữ ảnh cũ và ảnh mới mất không báo.
    if (!formTitle.trim() || isUploadingImage) return;

    const matchedCust = customers.find((c) => c.id === Number(formCustomerId));

    onSave({
      title: formTitle.trim(),
      content: formContent.trim() || undefined,
      imageUrl: formImageUrl.trim() || undefined,
      customer_id: formCustomerId ? Number(formCustomerId) : null,
      customerName: matchedCust?.name || null,
      labels: formLabels,
      checklist: formChecklist.length > 0 ? formChecklist : undefined,
    });
  };

  const handleDelete = () => {
    if (note && onDelete) {
      if (window.confirm('Xoá ghi chú này?')) {
        onDelete(note.id);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[#2a2724]/50"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="animate-modal-pop relative z-10 flex max-h-[92vh] w-full max-w-[540px] flex-col overflow-hidden rounded-lg border border-line-strong bg-surface dark:border-[#3d3934] dark:bg-[#232120]"
      >
        <div className="flex shrink-0 items-center border-b border-line px-4 py-3 dark:border-[#332f2c]">
          <h3 className="text-[13px] font-semibold text-fg">
            {note ? 'Sửa ghi chú' : 'Thêm ghi chú'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-fg-subtle transition hover:bg-raised dark:hover:bg-[#2c2a27]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto p-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Tiêu đề ghi chú *</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="VD: Biên bản làm việc khảo sát CRM"
              className={fieldCls}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Khách hàng liên quan</label>
            <select
              value={formCustomerId}
              onChange={(e) => setFormCustomerId(e.target.value ? Number(e.target.value) : '')}
              className={fieldCls}
            >
              <option value="">-- Ghi chú nội bộ chung (Không gắn KH) --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || `Khách hàng #${c.id}`} {c.phone_number ? `(${c.phone_number})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Nội dung chi tiết</label>
            <textarea
              rows={3}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Nội dung thảo luận, thỏa thuận, khảo sát…"
              className="w-full rounded-md border border-line-input bg-surface p-2.5 text-[13px] text-fg dark:border-[#332f2c] dark:bg-[#232120] focus:border-line-strong focus:outline-none resize-none"
            />
          </div>

          {/* Checklist Builder */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Mục công việc (Checklist)</label>
            {formChecklist.length > 0 && (
              <div className="flex flex-col gap-1.5 mb-1">
                {formChecklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-fg-subtle shrink-0" />
                    <span className="flex-1 text-fg">{item.text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="text-fg-subtle hover:text-danger transition cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                placeholder="Thêm mục checklist và nhấn Enter…"
                className={fieldCls}
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="h-8 shrink-0 rounded-md border border-line bg-surface px-3 text-xs font-medium text-fg-muted hover:text-fg dark:border-[#332f2c] dark:bg-[#232120] cursor-pointer"
              >
                Thêm
              </button>
            </div>
          </div>

          {/* Phân loại nhãn */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Nhãn phân loại</label>
            <div className="flex flex-wrap gap-1.5">
              {LABELS.map((name: string) => {
                const isSelected = formLabels.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleToggleLabel(name)}
                    className={`h-7 rounded-md border px-2.5 text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'border-line-strong bg-raised font-medium text-fg dark:border-[#3d3934] dark:bg-[#2c2a27]'
                        : 'border-line bg-surface text-fg-muted dark:border-[#332f2c] dark:bg-[#232120]'
                    }`}
                  >
                    <span>{name}</span>
                    {isSelected && <Check className="h-3 w-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ảnh minh họa (Upload file / Preview) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className={labelCls}>Ảnh minh họa</label>
              <button
                type="button"
                onClick={() => setShowUrlInput((v) => !v)}
                className="text-[11px] text-fg-subtle hover:text-brand transition flex items-center gap-1 cursor-pointer"
              >
                <Link2 className="w-3 h-3" />
                <span>{showUrlInput ? 'Ẩn nhập link' : 'Hoặc dán URL'}</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {formImageUrl ? (
              <div className="relative group overflow-hidden rounded-lg border border-line dark:border-[#332f2c] bg-surface-alt dark:bg-[#1d1c19]">
                <img
                  src={formImageUrl}
                  alt="Ảnh minh họa"
                  className="w-full max-h-48 object-cover rounded-md"
                />
                {isUploadingImage ? (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                    <span className="text-xs text-white">Đang tải ảnh lên…</span>
                  </div>
                ) : (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-md bg-white text-zinc-800 text-xs font-medium shadow transition hover:bg-zinc-100 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Thay ảnh
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormImageUrl('')}
                    className="px-2.5 py-1.5 rounded-md bg-rose-600 text-white text-xs font-medium shadow transition hover:bg-rose-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xoá ảnh
                  </button>
                </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleProcessImageFile(file);
                }}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                  isDragging
                    ? 'border-brand bg-brand/5 dark:bg-brand/10'
                    : 'border-line-strong hover:border-brand/70 bg-surface-alt/40 dark:border-[#3d3934] dark:bg-[#232120]/40 hover:bg-surface-alt dark:hover:bg-[#232120]'
                }`}
              >
                {isUploadingImage ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Loader2 className="w-5 h-5 text-brand animate-spin" />
                    <span className="text-xs text-fg-muted">Đang tải ảnh lên…</span>
                  </div>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full bg-raised dark:bg-[#2c2a27] flex items-center justify-center text-fg-subtle">
                      <ImagePlus className="w-4.5 h-4.5 text-brand" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-fg dark:text-[#f2f0ed]">
                        Bấm để chọn ảnh từ máy tính
                      </span>
                      <span className="text-xs text-fg-subtle"> hoặc kéo thả vào đây</span>
                    </div>
                    <span className="text-[11px] text-fg-faint">PNG, JPG, WebP, GIF (tối đa 5MB)</span>
                  </>
                )}
              </div>
            )}

            {uploadError && (
              <span className="text-[11px] text-rose-500">{uploadError}</span>
            )}

            {showUrlInput && (
              <div className="mt-1">
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="Hoặc dán liên kết ảnh: https://…"
                  className={fieldCls}
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between border-t border-line px-4 py-3 dark:border-[#332f2c]">
          {note ? (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1 text-xs text-danger hover:underline cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Xoá ghi chú
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-[30px] rounded-md border border-line bg-surface px-3 text-xs font-medium text-fg-muted hover:bg-raised dark:border-[#332f2c] dark:bg-[#232120] cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isUploadingImage}
              className="h-[30px] rounded-md bg-brand px-3.5 text-xs font-medium text-white transition hover:bg-[#d2651f] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-brand"
            >
              {isUploadingImage ? 'Đang tải ảnh…' : note ? 'Lưu thay đổi' : 'Tạo ghi chú'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};


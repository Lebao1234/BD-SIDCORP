/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { LABELS } from '../../constants/notes';
import type { Note, ChecklistItem, CustomerOption } from '../../types';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

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

          {/* URL ảnh đính kèm */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Ảnh minh họa (URL tùy chọn)</label>
            <input
              type="text"
              value={formImageUrl}
              onChange={(e) => setFormImageUrl(e.target.value)}
              placeholder="https://…"
              className={fieldCls}
            />
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
              className="h-[30px] rounded-md bg-brand px-3.5 text-xs font-medium text-white transition hover:bg-[#d2651f] cursor-pointer"
            >
              {note ? 'Lưu thay đổi' : 'Tạo ghi chú'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};


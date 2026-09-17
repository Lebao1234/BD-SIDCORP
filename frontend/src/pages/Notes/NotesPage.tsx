import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '../../components/Layout/AppLayout';
import api from '../../services/api';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  StickyNote,
  Archive,
  Check,
  X,
  Trash2,
  Briefcase,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import { formatDate } from '../../utils/datetime';

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface Note {
  id: string;
  title: string;
  content?: string;
  imageUrl?: string;
  checklist?: ChecklistItem[];
  labels: string[];
  customer_id?: number | null;
  customerName?: string | null;
  isSyncedToExchange?: boolean;
  archived?: boolean;
  createdAt: string;
}

const LABELS = ['Tư vấn', 'Khách hàng', 'Hợp đồng', 'Báo giá', 'Kế hoạch', 'Nội bộ'];

const INITIAL_NOTES: Note[] = [
  {
    id: '1',
    title: 'Khảo sát nhu cầu chuyển đổi số CRM',
    content: 'Khách hàng mong muốn quản trị tập trung luồng tiếp cận 15 sales rep, tích hợp kho tài liệu Drive và cảnh báo công việc quá hạn trên mobile.',
    labels: ['Tư vấn', 'Khách hàng'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Checklist chuẩn bị hồ sơ thầu & Báo giá',
    checklist: [
      { id: 'c1', text: 'Bản đề xuất giải pháp ERP/CRM hoàn chỉnh', done: true },
      { id: 'c2', text: 'Bảng tính ROI và lộ trình triển khai 4 giai đoạn', done: true },
      { id: 'c3', text: 'Dự thảo hợp đồng dịch vụ và cam kết bảo mật SLA', done: false },
      { id: 'c4', text: 'Hồ sơ năng lực công ty và 3 case studies tương tự', done: true },
      { id: 'c5', text: 'Xác nhận lịch pitching trực tiếp với Ban Giám Đốc', done: false },
    ],
    labels: ['Báo giá', 'Hợp đồng'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Thỏa thuận điều khoản thanh toán hợp đồng',
    content: 'Đề xuất chia 3 đợt thanh toán: Đợt 1 (40% khi ký), Đợt 2 (40% sau khi bàn giao module CRM), Đợt 3 (20% sau nghiệm thu 30 ngày).',
    labels: ['Hợp đồng', 'Tư vấn'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Kế hoạch triển khai quý 4 & Phân bổ nhân sự',
    checklist: [
      { id: 'k1', text: 'Đào tạo nhân sự sử dụng tính năng @mention và nhắc việc', done: true },
      { id: 'k2', text: 'Nhập danh sách 200 khách hàng tiềm năng vào database', done: false },
      { id: 'k3', text: 'Kiểm tra phân quyền Admin vs Nhân viên tư vấn', done: true },
    ],
    labels: ['Kế hoạch', 'Nội bộ'],
    createdAt: new Date().toISOString(),
  },
];

const fieldCls =
  'h-8 w-full rounded-md border border-line-input bg-surface px-2.5 text-[13px] text-fg ' +
  'dark:border-[#332f2c] dark:bg-[#232120] focus:border-line-strong focus:outline-none';
const labelCls = 'text-[11px] text-fg-subtle';

export const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('sidcorp_crm_notes');
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });

  const [customers, setCustomers] = useState<{ id: number; name: string | null; phone_number: string | null }[]>([]);

  useEffect(() => {
    let mounted = true;
    api.get('/customers?limit=100')
      .then(res => {
        if (mounted && res.data?.data) {
          setCustomers(res.data.data);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'notes' | 'archive'>('notes');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formCustomerId, setFormCustomerId] = useState<number | ''>('');
  const [formLabels, setFormLabels] = useState<string[]>([]);
  const [formChecklist, setFormChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('sidcorp_crm_notes', JSON.stringify(notes));
  }, [notes]);

  const handleOpenAddModal = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormImageUrl('');
    setFormCustomerId('');
    setFormLabels(['Tư vấn']);
    setFormChecklist([]);
    setNewChecklistText('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content || '');
    setFormImageUrl(note.imageUrl || '');
    setFormCustomerId(note.customer_id || '');
    setFormLabels(note.labels || []);
    setFormChecklist(note.checklist || []);
    setNewChecklistText('');
    setIsModalOpen(true);
  };

  const handleToggleCheckItem = (noteId: string, itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev =>
      prev.map(note => {
        if (note.id !== noteId || !note.checklist) return note;
        return {
          ...note,
          checklist: note.checklist.map(item =>
            item.id === itemId ? { ...item, done: !item.done } : item
          ),
        };
      })
    );
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setFormChecklist(prev => [
      ...prev,
      { id: Date.now().toString(), text: newChecklistText.trim(), done: false },
    ]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setFormChecklist(prev => prev.filter(item => item.id !== id));
  };

  const handleToggleLabel = (labelName: string) => {
    if (formLabels.includes(labelName)) {
      setFormLabels(formLabels.filter(l => l !== labelName));
    } else {
      setFormLabels([...formLabels, labelName]);
    }
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const matchedCust = customers.find(c => c.id === Number(formCustomerId));

    if (editingNote) {
      setNotes(prev =>
        prev.map(n =>
          n.id === editingNote.id
            ? {
                ...n,
                title: formTitle.trim(),
                content: formContent.trim() || undefined,
                imageUrl: formImageUrl.trim() || undefined,
                customer_id: formCustomerId ? Number(formCustomerId) : null,
                customerName: matchedCust?.name || null,
                labels: formLabels,
                checklist: formChecklist.length > 0 ? formChecklist : undefined,
              }
            : n
        )
      );
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: formTitle.trim(),
        content: formContent.trim() || undefined,
        imageUrl: formImageUrl.trim() || undefined,
        customer_id: formCustomerId ? Number(formCustomerId) : null,
        customerName: matchedCust?.name || null,
        labels: formLabels,
        checklist: formChecklist.length > 0 ? formChecklist : undefined,
        createdAt: new Date().toISOString(),
      };
      setNotes(prev => [newNote, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm('Xoá ghi chú này?')) {
      setNotes(prev => prev.filter(n => n.id !== id));
      setIsModalOpen(false);
    }
  };

  const handleToggleArchive = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev =>
      prev.map(n => (n.id === note.id ? { ...n, archived: !n.archived } : n))
    );
  };

  const handleSyncToCustomerTimeline = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!note.customer_id) return;

    try {
      let fullContent = `[Ghi chú]: ${note.title}\n\n`;
      if (note.content) fullContent += `${note.content}\n`;
      if (note.checklist && note.checklist.length > 0) {
        fullContent += '\nChecklist:\n' + note.checklist.map(c => `${c.done ? '✓' : '□'} ${c.text}`).join('\n');
      }

      await api.post('/notes', {
        customer_id: note.customer_id,
        content: fullContent,
      });

      setNotes(prev =>
        prev.map(n => (n.id === note.id ? { ...n, isSyncedToExchange: true } : n))
      );

      setSyncFeedback('Đã đồng bộ ghi chú vào lịch sử khách hàng.');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err: any) {
      console.error('Lỗi đồng bộ ghi chú:', err);
      alert(err.response?.data?.error || 'Không thể đồng bộ vào dòng thời gian khách hàng.');
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const isArchived = Boolean(note.archived);
      if (activeView === 'notes' && isArchived) return false;
      if (activeView === 'archive' && !isArchived) return false;

      if (selectedLabel && !note.labels.includes(selectedLabel)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = note.title.toLowerCase().includes(q);
        const matchContent = note.content?.toLowerCase().includes(q);
        const matchCustomer = note.customerName?.toLowerCase().includes(q);
        const matchChecklist = note.checklist?.some(c => c.text.toLowerCase().includes(q));
        if (!matchTitle && !matchContent && !matchCustomer && !matchChecklist) return false;
      }

      return true;
    });
  }, [notes, activeView, selectedLabel, searchQuery]);

  return (
    <AppLayout>
      <div className="flex flex-col gap-3.5 pb-8">
        {/* Tiêu đề + hành động chính */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-[19px] font-semibold tracking-[-0.01em]">Ghi chú & Biên bản</h1>
            <p className="text-xs text-fg-subtle">
              {filteredNotes.length} ghi chú {activeView === 'archive' ? 'đã lưu trữ' : 'trong hệ thống'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Chế độ xem: Ghi chú / Lưu trữ */}
            <div className="flex h-[30px] items-stretch rounded-md border border-line bg-raised p-0.5 dark:border-[#332f2c] dark:bg-[#1d1c19]">
              <button
                onClick={() => setActiveView('notes')}
                className={`flex items-center gap-1.5 rounded px-2.5 text-xs transition cursor-pointer ${
                  activeView === 'notes'
                    ? 'border border-line-strong bg-surface font-medium text-fg dark:border-[#3d3934] dark:bg-[#232120]'
                    : 'text-fg-subtle hover:text-fg'
                }`}
              >
                <StickyNote className="h-3.5 w-3.5" /> Ghi chú
              </button>
              <button
                onClick={() => setActiveView('archive')}
                className={`flex items-center gap-1.5 rounded px-2.5 text-xs transition cursor-pointer ${
                  activeView === 'archive'
                    ? 'border border-line-strong bg-surface font-medium text-fg dark:border-[#3d3934] dark:bg-[#232120]'
                    : 'text-fg-subtle hover:text-fg'
                }`}
              >
                <Archive className="h-3.5 w-3.5" /> Lưu trữ
              </button>
            </div>

            {/* Bố cục: Lưới / Danh sách */}
            <div className="flex h-[30px] items-stretch rounded-md border border-line bg-raised p-0.5 dark:border-[#332f2c] dark:bg-[#1d1c19]">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`flex items-center justify-center rounded px-2 text-xs transition cursor-pointer ${
                  layoutMode === 'grid'
                    ? 'border border-line-strong bg-surface font-medium text-fg dark:border-[#3d3934] dark:bg-[#232120]'
                    : 'text-fg-subtle hover:text-fg'
                }`}
                title="Dạng lưới"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setLayoutMode('list')}
                className={`flex items-center justify-center rounded px-2 text-xs transition cursor-pointer ${
                  layoutMode === 'list'
                    ? 'border border-line-strong bg-surface font-medium text-fg dark:border-[#3d3934] dark:bg-[#232120]'
                    : 'text-fg-subtle hover:text-fg'
                }`}
                title="Dạng danh sách"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Nút thêm mới */}
            <button
              onClick={handleOpenAddModal}
              className="flex h-[30px] items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-white transition hover:bg-[#d2651f] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.1} /> Thêm ghi chú
            </button>
          </div>
        </div>

        {/* Thông báo Sync Feedback */}
        {syncFeedback && (
          <div className="flex items-center gap-2 rounded-md border border-ok/30 bg-ok/5 px-3 py-2 text-xs text-ok animate-fade-in">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Thanh công cụ: Tìm kiếm & Nhãn bộ lọc */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề, nội dung, khách hàng…"
              className="h-[30px] w-64 md:w-72 rounded-md border border-line bg-surface pl-8 pr-2.5 text-xs text-fg placeholder:text-fg-subtle dark:border-[#332f2c] dark:bg-[#232120] focus:border-line-strong focus:outline-none"
            />
          </div>

          <div className="hidden sm:block mx-1 h-4 w-px bg-line dark:bg-[#332f2c]" />

          <button
            onClick={() => setSelectedLabel(null)}
            className={`h-[30px] rounded-md border px-2.5 text-xs transition cursor-pointer ${
              selectedLabel === null
                ? 'border-line-strong bg-raised font-medium text-fg dark:border-[#3d3934] dark:bg-[#2c2a27]'
                : 'border-line bg-surface text-fg-muted hover:text-fg dark:border-[#332f2c] dark:bg-[#232120]'
            }`}
          >
            Tất cả
          </button>
          {LABELS.map((name) => {
            const isSelected = selectedLabel === name;
            return (
              <button
                key={name}
                onClick={() => setSelectedLabel(isSelected ? null : name)}
                className={`h-[30px] rounded-md border px-2.5 text-xs transition cursor-pointer ${
                  isSelected
                    ? 'border-line-strong bg-raised font-medium text-fg dark:border-[#3d3934] dark:bg-[#2c2a27]'
                    : 'border-line bg-surface text-fg-muted hover:text-fg dark:border-[#332f2c] dark:bg-[#232120]'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        {/* Nội dung danh sách / lưới */}
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-line bg-surface py-14 text-center dark:border-[#332f2c] dark:bg-[#232120]">
            <p className="text-[13px] font-medium text-fg">
              {activeView === 'archive' ? 'Thư mục lưu trữ trống' : 'Chưa có ghi chú nào'}
            </p>
            <p className="text-xs text-fg-subtle">
              Bấm “Thêm ghi chú” để ghi chép biên bản hoặc danh mục công việc.
            </p>
          </div>
        ) : layoutMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredNotes.map((note) => {
              const completedCount = note.checklist ? note.checklist.filter(c => c.done).length : 0;
              const totalCount = note.checklist ? note.checklist.length : 0;

              return (
                <div
                  key={note.id}
                  onClick={() => handleOpenEditModal(note)}
                  className="flex flex-col justify-between rounded-lg border border-line bg-surface p-3.5 transition duration-150 hover:border-line-strong dark:border-[#332f2c] dark:bg-[#232120] cursor-pointer group"
                >
                  <div className="flex flex-col gap-2">
                    {/* Header: Customer / Sync / Quick Actions */}
                    <div className="flex items-center justify-between gap-2">
                      {note.customerName ? (
                        <span className="inline-flex items-center gap-1 rounded border border-line bg-raised px-1.5 py-0.5 text-[11px] font-medium text-fg-subtle dark:border-[#332f2c] dark:bg-[#1d1c19]">
                          <Briefcase className="h-3 w-3 text-fg-subtle" />
                          <span className="truncate max-w-[170px]">{note.customerName}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-fg-faint font-mono">
                          {formatDate(note.createdAt)}
                        </span>
                      )}

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        {note.customer_id && (
                          <button
                            type="button"
                            onClick={(e) => handleSyncToCustomerTimeline(note, e)}
                            title="Đồng bộ vào lịch sử trao đổi khách hàng"
                            className="flex h-6 w-6 items-center justify-center rounded text-fg-subtle hover:bg-raised hover:text-brand dark:hover:bg-[#2c2a27]"
                          >
                            <Share2 className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleToggleArchive(note, e)}
                          title={note.archived ? 'Bỏ lưu trữ' : 'Lưu trữ'}
                          className="flex h-6 w-6 items-center justify-center rounded text-fg-subtle hover:bg-raised hover:text-fg dark:hover:bg-[#2c2a27]"
                        >
                          <Archive className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Image Attachment (nếu có) */}
                    {note.imageUrl && (
                      <div className="overflow-hidden rounded border border-line dark:border-[#332f2c] max-h-36">
                        <img src={note.imageUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}

                    {/* Tiêu đề */}
                    <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-fg leading-snug">
                      {note.title}
                    </h3>

                    {/* Nội dung snippet */}
                    {note.content && (
                      <p className="text-xs text-fg-body line-clamp-3 leading-relaxed">
                        {note.content}
                      </p>
                    )}

                    {/* Checklist items */}
                    {note.checklist && note.checklist.length > 0 && (
                      <div className="flex flex-col gap-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-fg-subtle">
                          <span>Checklist</span>
                          <span className="tnum font-medium">
                            {completedCount}/{totalCount} đã xong
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          {note.checklist.slice(0, 4).map((item) => (
                            <div
                              key={item.id}
                              onClick={(e) => handleToggleCheckItem(note.id, item.id, e)}
                              className="flex items-center gap-2 text-xs py-0.5 text-fg-body hover:text-fg transition cursor-pointer"
                            >
                              <div
                                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition ${
                                  item.done
                                    ? 'border-ok bg-ok text-white'
                                    : 'border-line-strong hover:border-fg-subtle dark:border-[#3d3934]'
                                }`}
                              >
                                {item.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                              </div>
                              <span
                                className={`truncate text-[12px] ${
                                  item.done ? 'line-through text-fg-faint' : 'text-fg-body'
                                }`}
                              >
                                {item.text}
                              </span>
                            </div>
                          ))}
                          {note.checklist.length > 4 && (
                            <span className="text-[11px] text-fg-subtle italic">
                              +{note.checklist.length - 4} mục khác…
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between gap-2 border-t border-divider dark:border-[#2a2724] pt-2.5 mt-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {note.labels.map((lbl) => (
                        <span
                          key={lbl}
                          className="rounded border border-line bg-raised px-1.5 py-0.5 text-[10px] font-medium text-fg-subtle dark:border-[#332f2c] dark:bg-[#1d1c19]"
                        >
                          {lbl}
                        </span>
                      ))}
                    </div>

                    {note.isSyncedToExchange ? (
                      <span className="text-[10px] text-ok font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Đã sync CRM
                      </span>
                    ) : (
                      <span className="text-[11px] text-fg-subtle tnum">
                        {formatDate(note.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List Mode (Clean Rows) */
          <div className="overflow-hidden rounded-lg border border-line bg-surface dark:border-[#332f2c] dark:bg-[#232120]">
            {filteredNotes.map((note, i) => {
              const completedCount = note.checklist ? note.checklist.filter(c => c.done).length : 0;
              const totalCount = note.checklist ? note.checklist.length : 0;

              return (
                <div
                  key={note.id}
                  onClick={() => handleOpenEditModal(note)}
                  className={`flex items-center gap-3 border-b border-divider px-4 py-2.5 last:border-b-0 cursor-pointer transition hover:bg-raised dark:border-[#2a2724] dark:hover:bg-[#262422] ${
                    i % 2 === 1 ? 'bg-surface-alt dark:bg-[#262422]' : ''
                  }`}
                  style={{ minHeight: 44 }}
                >
                  <StickyNote className="h-4 w-4 text-fg-subtle shrink-0" />

                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-medium text-fg">
                        {note.title}
                      </span>
                      {note.customerName && (
                        <span className="rounded border border-line bg-raised px-1.5 py-0.2 text-[10px] text-fg-subtle dark:border-[#332f2c] dark:bg-[#1d1c19] shrink-0">
                          {note.customerName}
                        </span>
                      )}
                    </div>
                    <span className="truncate text-xs text-fg-subtle">
                      {note.content || (totalCount > 0 ? `${completedCount}/${totalCount} mục checklist` : 'Không có nội dung')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {note.labels.slice(0, 2).map((lbl) => (
                      <span
                        key={lbl}
                        className="rounded border border-line bg-raised px-1.5 py-0.5 text-[10px] text-fg-subtle dark:border-[#332f2c] dark:bg-[#1d1c19]"
                      >
                        {lbl}
                      </span>
                    ))}
                  </div>

                  <span className="text-[11px] text-fg-subtle tnum shrink-0 w-20 text-right">
                    {formatDate(note.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: THÊM / SỬA GHI CHÚ */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-[#2a2724]/50"
              onClick={() => setIsModalOpen(false)}
            />
            <form
              onSubmit={handleSaveNote}
              className="animate-modal-pop relative z-10 flex max-h-[92vh] w-full max-w-[540px] flex-col overflow-hidden rounded-lg border border-line-strong bg-surface dark:border-[#3d3934] dark:bg-[#232120]"
            >
              <div className="flex shrink-0 items-center border-b border-line px-4 py-3 dark:border-[#332f2c]">
                <h3 className="text-[13px] font-semibold text-fg">
                  {editingNote ? 'Sửa ghi chú' : 'Thêm ghi chú'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                            className="text-fg-subtle hover:text-danger transition"
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
                      className="h-8 shrink-0 rounded-md border border-line bg-surface px-3 text-xs font-medium text-fg-muted hover:text-fg dark:border-[#332f2c] dark:bg-[#232120]"
                    >
                      Thêm
                    </button>
                  </div>
                </div>

                {/* Phân loại nhãn */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Nhãn phân loại</label>
                  <div className="flex flex-wrap gap-1.5">
                    {LABELS.map((name) => {
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
                {editingNote ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(editingNote.id)}
                    className="flex items-center gap-1 text-xs text-danger hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Xoá ghi chú
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-[30px] rounded-md border border-line bg-surface px-3 text-xs font-medium text-fg-muted hover:bg-raised dark:border-[#332f2c] dark:bg-[#232120]"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="h-[30px] rounded-md bg-brand px-3.5 text-xs font-medium text-white transition hover:bg-[#d2651f]"
                  >
                    {editingNote ? 'Lưu thay đổi' : 'Tạo ghi chú'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default NotesPage;

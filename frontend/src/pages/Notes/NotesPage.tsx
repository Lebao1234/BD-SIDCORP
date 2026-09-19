import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '../../components/Layout/AppLayout';
import api from '../../services/api';
import type { Note } from '../../types';
import { useCustomerOptions } from '../../hooks/useCustomerOptions';
import { INITIAL_NOTES } from '../../constants/notes';
import {
  NotesToolbar,
  NoteCard,
  NoteEditorModal,
} from '../../components/Notes';

export const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('sidcorp_crm_notes');
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });


  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'notes' | 'archive'>('notes');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Dùng hook chia sẻ thay vì tự gọi `/customers?limit=100` trong useEffect:
  // ba màn hình khác cũng cần đúng danh sách này, và react-query gom chúng lại
  // thành một lần gọi mạng duy nhất. Bản cũ còn nuốt lỗi bằng `.catch(() => {})`
  // nên khi tải hỏng thì ô chọn khách hàng trống trơn mà không ai biết vì sao.
  const { options: customers } = useCustomerOptions();

  useEffect(() => {
    localStorage.setItem('sidcorp_crm_notes', JSON.stringify(notes));
  }, [notes]);

  const handleOpenAddModal = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleToggleCheckItem = (noteId: string, itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) =>
      prev.map((note) => {
        if (note.id !== noteId || !note.checklist) return note;
        return {
          ...note,
          checklist: note.checklist.map((item) =>
            item.id === itemId ? { ...item, done: !item.done } : item
          ),
        };
      })
    );
  };

  const handleSaveNote = (noteData: {
    title: string;
    content?: string;
    imageUrl?: string;
    customer_id?: number | null;
    customerName?: string | null;
    labels: string[];
    checklist?: Note['checklist'];
  }) => {
    if (editingNote) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id
            ? {
                ...n,
                ...noteData,
              }
            : n
        )
      );
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        ...noteData,
        createdAt: new Date().toISOString(),
      };
      setNotes((prev) => [newNote, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setIsModalOpen(false);
  };

  const handleToggleArchive = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, archived: !n.archived } : n))
    );
  };

  const handleSyncToCustomerTimeline = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!note.customer_id) return;

    try {
      let fullContent = `[Ghi chú]: ${note.title}\n\n`;
      if (note.content) fullContent += `${note.content}\n`;
      if (note.checklist && note.checklist.length > 0) {
        fullContent += '\nChecklist:\n' + note.checklist.map((c) => `${c.done ? '✓' : '□'} ${c.text}`).join('\n');
      }

      await api.post('/notes', {
        customer_id: note.customer_id,
        content: fullContent,
      });

      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, isSyncedToExchange: true } : n))
      );

      setSyncFeedback('Đã đồng bộ ghi chú vào lịch sử khách hàng.');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err: any) {
      console.error('Lỗi đồng bộ ghi chú:', err);
      alert(err.response?.data?.error || 'Không thể đồng bộ vào dòng thời gian khách hàng.');
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const isArchived = Boolean(note.archived);
      if (activeView === 'notes' && isArchived) return false;
      if (activeView === 'archive' && !isArchived) return false;

      if (selectedLabel && !note.labels.includes(selectedLabel)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = note.title.toLowerCase().includes(q);
        const matchContent = note.content?.toLowerCase().includes(q);
        const matchCustomer = note.customerName?.toLowerCase().includes(q);
        const matchChecklist = note.checklist?.some((c) => c.text.toLowerCase().includes(q));
        if (!matchTitle && !matchContent && !matchCustomer && !matchChecklist) return false;
      }

      return true;
    });
  }, [notes, activeView, selectedLabel, searchQuery]);

  return (
    <AppLayout>
      <div className="flex flex-col gap-3.5 pb-8">
        {/* Toolbar điều khiển */}
        <NotesToolbar
          totalNotes={filteredNotes.length}
          activeView={activeView}
          onViewChange={setActiveView}
          layoutMode={layoutMode}
          onLayoutModeChange={setLayoutMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedLabel={selectedLabel}
          onSelectLabel={setSelectedLabel}
          onOpenAddModal={handleOpenAddModal}
          syncFeedback={syncFeedback}
        />

        {/* Nội dung ghi chú: dạng lưới hoặc danh sách */}
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
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                layoutMode="grid"
                onEdit={handleOpenEditModal}
                onToggleArchive={handleToggleArchive}
                onSyncTimeline={handleSyncToCustomerTimeline}
                onToggleCheckItem={handleToggleCheckItem}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-surface dark:border-[#332f2c] dark:bg-[#232120]">
            {filteredNotes.map((note, index) => (
              <NoteCard
                key={note.id}
                note={note}
                layoutMode="list"
                index={index}
                onEdit={handleOpenEditModal}
                onToggleArchive={handleToggleArchive}
                onSyncTimeline={handleSyncToCustomerTimeline}
                onToggleCheckItem={handleToggleCheckItem}
              />
            ))}
          </div>
        )}

        {/* Modal thêm/sửa ghi chú */}
        <NoteEditorModal
          isOpen={isModalOpen}
          note={editingNote}
          customers={customers}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
        />
      </div>
    </AppLayout>
  );
};

export default NotesPage;

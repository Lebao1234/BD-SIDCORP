import React from 'react';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  StickyNote,
  Archive,
  CheckCircle2,
} from 'lucide-react';
import { LABELS } from './notesTypes';

interface NotesToolbarProps {
  totalNotes: number;
  activeView: 'notes' | 'archive';
  onViewChange: (view: 'notes' | 'archive') => void;
  layoutMode: 'grid' | 'list';
  onLayoutModeChange: (mode: 'grid' | 'list') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLabel: string | null;
  onSelectLabel: (label: string | null) => void;
  onOpenAddModal: () => void;
  syncFeedback?: string | null;
}

export const NotesToolbar: React.FC<NotesToolbarProps> = ({
  totalNotes,
  activeView,
  onViewChange,
  layoutMode,
  onLayoutModeChange,
  searchQuery,
  onSearchChange,
  selectedLabel,
  onSelectLabel,
  onOpenAddModal,
  syncFeedback,
}) => {
  return (
    <div className="flex flex-col gap-3.5">
      {/* Tiêu đề + hành động chính */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[19px] font-semibold tracking-[-0.01em] text-fg dark:text-[#f2f0ed]">Ghi chú & Biên bản</h1>
          <p className="text-xs text-fg-subtle dark:text-[#8f8b84]">
            {totalNotes} ghi chú {activeView === 'archive' ? 'đã lưu trữ' : 'trong hệ thống'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Chế độ xem: Ghi chú / Lưu trữ */}
          <div className="flex h-[30px] items-stretch rounded-md border border-line bg-raised p-0.5 dark:border-[#332f2c] dark:bg-[#1d1c19]">
            <button
              type="button"
              onClick={() => onViewChange('notes')}
              className={`flex items-center gap-1.5 rounded px-2.5 text-xs transition cursor-pointer ${
                activeView === 'notes'
                  ? 'border border-line-strong bg-surface font-medium text-fg dark:border-[#3d3934] dark:bg-[#232120] dark:text-[#f2f0ed]'
                  : 'text-fg-subtle hover:text-fg dark:text-[#8f8b84] dark:hover:text-[#f2f0ed]'
              }`}
            >
              <StickyNote className="h-3.5 w-3.5" /> Ghi chú
            </button>
            <button
              type="button"
              onClick={() => onViewChange('archive')}
              className={`flex items-center gap-1.5 rounded px-2.5 text-xs transition cursor-pointer ${
                activeView === 'archive'
                  ? 'border border-line-strong bg-surface font-medium text-fg dark:border-[#3d3934] dark:bg-[#232120] dark:text-[#f2f0ed]'
                  : 'text-fg-subtle hover:text-fg dark:text-[#8f8b84] dark:hover:text-[#f2f0ed]'
              }`}
            >
              <Archive className="h-3.5 w-3.5" /> Lưu trữ
            </button>
          </div>

          {/* Bố cục: Lưới / Danh sách */}
          <div className="flex h-[30px] items-stretch rounded-md border border-line bg-raised p-0.5 dark:border-[#332f2c] dark:bg-[#1d1c19]">
            <button
              type="button"
              onClick={() => onLayoutModeChange('grid')}
              className={`flex items-center justify-center rounded px-2 text-xs transition cursor-pointer ${
                layoutMode === 'grid'
                  ? 'border border-line-strong bg-surface font-medium text-fg dark:border-[#3d3934] dark:bg-[#232120] dark:text-[#f2f0ed]'
                  : 'text-fg-subtle hover:text-fg dark:text-[#8f8b84] dark:hover:text-[#f2f0ed]'
              }`}
              title="Dạng lưới"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onLayoutModeChange('list')}
              className={`flex items-center justify-center rounded px-2 text-xs transition cursor-pointer ${
                layoutMode === 'list'
                  ? 'border border-line-strong bg-surface font-medium text-fg dark:border-[#3d3934] dark:bg-[#232120] dark:text-[#f2f0ed]'
                  : 'text-fg-subtle hover:text-fg dark:text-[#8f8b84] dark:hover:text-[#f2f0ed]'
              }`}
              title="Dạng danh sách"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Nút thêm mới */}
          <button
            type="button"
            onClick={onOpenAddModal}
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
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle dark:text-[#8f8b84]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tiêu đề, nội dung, khách hàng…"
            className="h-[30px] w-64 md:w-72 rounded-md border border-line bg-surface pl-8 pr-2.5 text-xs text-fg placeholder:text-fg-subtle dark:border-[#332f2c] dark:bg-[#232120] dark:text-[#f2f0ed] dark:placeholder:text-[#8f8b84] focus:border-line-strong focus:outline-none"
          />
        </div>

        <div className="hidden sm:block mx-1 h-4 w-px bg-line dark:bg-[#332f2c]" />

        <button
          type="button"
          onClick={() => onSelectLabel(null)}
          className={`h-[30px] rounded-md border px-2.5 text-xs transition cursor-pointer ${
            selectedLabel === null
              ? 'border-line-strong bg-raised font-medium text-fg dark:border-[#3d3934] dark:bg-[#2c2a27] dark:text-[#f2f0ed]'
              : 'border-line bg-surface text-fg-muted hover:text-fg dark:border-[#332f2c] dark:bg-[#232120] dark:text-[#a8a49d] dark:hover:text-[#f2f0ed]'
          }`}
        >
          Tất cả
        </button>
        {LABELS.map((name) => {
          const isSelected = selectedLabel === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelectLabel(isSelected ? null : name)}
              className={`h-[30px] rounded-md border px-2.5 text-xs transition cursor-pointer ${
                isSelected
                  ? 'border-line-strong bg-raised font-medium text-fg dark:border-[#3d3934] dark:bg-[#2c2a27] dark:text-[#f2f0ed]'
                  : 'border-line bg-surface text-fg-muted hover:text-fg dark:border-[#332f2c] dark:bg-[#232120] dark:text-[#a8a49d] dark:hover:text-[#f2f0ed]'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
};


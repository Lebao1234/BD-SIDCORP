import React from 'react';
import {
  Briefcase,
  Share2,
  Archive,
  Check,
  CheckCircle2,
  StickyNote,
} from 'lucide-react';
import { formatDate } from '../../utils/datetime';
import type { Note } from './notesTypes';

interface NoteCardProps {
  note: Note;
  layoutMode: 'grid' | 'list';
  index?: number;
  onEdit: (note: Note) => void;
  onToggleArchive: (note: Note, e: React.MouseEvent) => void;
  onSyncTimeline: (note: Note, e: React.MouseEvent) => void;
  onToggleCheckItem: (noteId: string, itemId: string, e: React.MouseEvent) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  layoutMode,
  index = 0,
  onEdit,
  onToggleArchive,
  onSyncTimeline,
  onToggleCheckItem,
}) => {
  const completedCount = note.checklist ? note.checklist.filter(c => c.done).length : 0;
  const totalCount = note.checklist ? note.checklist.length : 0;

  if (layoutMode === 'list') {
    return (
      <div
        onClick={() => onEdit(note)}
        className={`flex items-center gap-3 border-b border-divider px-4 py-2.5 last:border-b-0 cursor-pointer transition hover:bg-raised dark:border-[#2a2724] dark:hover:bg-[#262422] ${
          index % 2 === 1 ? 'bg-surface-alt dark:bg-[#262422]' : ''
        }`}
        style={{ minHeight: 44 }}
      >
        <StickyNote className="h-4 w-4 text-fg-subtle shrink-0" />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13px] font-medium text-fg dark:text-[#f2f0ed]">
              {note.title}
            </span>
            {note.customerName && (
              <span className="rounded border border-line bg-raised px-1.5 py-0.5 text-[10px] text-fg-subtle dark:border-[#332f2c] dark:bg-[#1d1c19] dark:text-[#8f8b84] shrink-0">
                {note.customerName}
              </span>
            )}
          </div>
          <span className="truncate text-xs text-fg-subtle dark:text-[#8f8b84]">
            {note.content || (totalCount > 0 ? `${completedCount}/${totalCount} mục checklist` : 'Không có nội dung')}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {note.labels.slice(0, 2).map((lbl) => (
            <span
              key={lbl}
              className="rounded border border-line bg-raised px-1.5 py-0.5 text-[10px] text-fg-subtle dark:border-[#332f2c] dark:bg-[#1d1c19] dark:text-[#8f8b84]"
            >
              {lbl}
            </span>
          ))}
        </div>

        <span className="text-[11px] text-fg-subtle dark:text-[#8f8b84] tnum shrink-0 w-20 text-right">
          {formatDate(note.createdAt)}
        </span>
      </div>
    );
  }

  // Grid Mode
  return (
    <div
      onClick={() => onEdit(note)}
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
                onClick={(e) => onSyncTimeline(note, e)}
                title="Đồng bộ vào lịch sử trao đổi khách hàng"
                className="flex h-6 w-6 items-center justify-center rounded text-fg-subtle hover:bg-raised hover:text-brand dark:hover:bg-[#2c2a27]"
              >
                <Share2 className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => onToggleArchive(note, e)}
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
        <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-fg leading-snug dark:text-[#f2f0ed]">
          {note.title}
        </h3>

        {/* Nội dung snippet */}
        {note.content && (
          <p className="text-xs text-fg-body line-clamp-3 leading-relaxed dark:text-[#dedbd5]">
            {note.content}
          </p>
        )}

        {/* Checklist items */}
        {note.checklist && note.checklist.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-fg-subtle dark:text-[#8f8b84]">
              <span>Checklist</span>
              <span className="tnum font-medium text-fg-muted dark:text-[#a8a49d]">
                {completedCount}/{totalCount} đã xong
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {note.checklist.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  onClick={(e) => onToggleCheckItem(note.id, item.id, e)}
                  className="flex items-center gap-2 text-xs py-0.5 text-fg-body hover:text-fg dark:text-[#dedbd5] dark:hover:text-[#f2f0ed] transition cursor-pointer"
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
                      item.done ? 'line-through text-fg-faint dark:text-[#736f68]' : 'text-fg-body dark:text-[#dedbd5]'
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
              {note.checklist.length > 4 && (
                <span className="text-[11px] text-fg-subtle dark:text-[#8f8b84] italic">
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
              className="rounded border border-line bg-raised px-1.5 py-0.5 text-[10px] font-medium text-fg-subtle dark:border-[#332f2c] dark:bg-[#1d1c19] dark:text-[#8f8b84]"
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
          <span className="text-[11px] text-fg-subtle dark:text-[#8f8b84] tnum">
            {formatDate(note.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
};


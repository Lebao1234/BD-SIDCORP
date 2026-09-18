import React from 'react';
import { Search, X } from 'lucide-react';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { AVAILABLE_TEMPLATES } from './templates';

export type ArchiveFilter = 'all' | 'sent' | 'draft';

interface EmailArchiveToolbarProps {
  totalCount: number;
  sentCount: number;
  draftCount: number;
  activeFilter: ArchiveFilter;
  onFilterChange: (filter: ArchiveFilter) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const STAT_CARD_CLASS =
  'bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 px-3.5 py-2.5 rounded-xl shadow-2xs';
const STAT_LABEL_CLASS = 'text-[11px] font-medium text-zinc-500 dark:text-zinc-400';

/** Bốn ô thống kê nhanh, hàng tab lọc và ô tìm kiếm của kho lưu trữ. */
export const EmailArchiveToolbar: React.FC<EmailArchiveToolbarProps> = ({
  totalCount,
  sentCount,
  draftCount,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}) => {
  const tabs: { id: ArchiveFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Tất cả email', count: totalCount },
    { id: 'sent', label: 'Đã gửi', count: sentCount },
    { id: 'draft', label: 'Bản nháp', count: draftCount },
  ];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={STAT_CARD_CLASS}>
          <div className={STAT_LABEL_CLASS}>Tổng email lưu trữ</div>
          <div className="text-lg font-semibold text-zinc-900 dark:text-white mt-0.5">
            <AnimatedCounter value={totalCount} />
          </div>
        </div>
        <div className={STAT_CARD_CLASS}>
          <div className={STAT_LABEL_CLASS}>Đã gửi</div>
          <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
            <AnimatedCounter value={sentCount} />
          </div>
        </div>
        <div className={STAT_CARD_CLASS}>
          <div className={STAT_LABEL_CLASS}>Bản nháp / Lưu tạm</div>
          <div className="text-lg font-semibold text-zinc-600 dark:text-zinc-300 mt-0.5">
            <AnimatedCounter value={draftCount} />
          </div>
        </div>
        <div className={STAT_CARD_CLASS}>
          <div className={STAT_LABEL_CLASS}>Mẫu template sẵn có</div>
          <div className="text-lg font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
            <AnimatedCounter value={AVAILABLE_TEMPLATES.length} />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 self-start">
          {tabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                      : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo người nhận, email, tiêu đề..."
            className="w-full pl-9 pr-8 py-1.5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition shadow-2xs placeholder:text-zinc-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Xoá từ khoá tìm kiếm"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

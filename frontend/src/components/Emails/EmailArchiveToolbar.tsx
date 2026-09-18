import React from 'react';
import { AlertTriangle, Search, X } from 'lucide-react';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { AVAILABLE_TEMPLATES } from './templates';

export type ArchiveFilter = 'all' | 'sent' | 'draft' | 'duplicates';

interface EmailArchiveToolbarProps {
  totalCount: number;
  sentCount: number;
  draftCount: number;
  duplicateCount?: number;
  activeFilter: ArchiveFilter;
  onFilterChange: (filter: ArchiveFilter) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const STAT_CARD_CLASS =
  'bg-white dark:bg-[#1d1c19] border border-gray-200 dark:border-[#332f2c] px-3.5 py-2.5 rounded-xl shadow-2xs';
const STAT_LABEL_CLASS = 'text-[11px] font-medium text-gray-500 dark:text-gray-400';

/** Ô thống kê nhanh, hàng tab lọc và ô tìm kiếm của kho lưu trữ. */
export const EmailArchiveToolbar: React.FC<EmailArchiveToolbarProps> = ({
  totalCount,
  sentCount,
  draftCount,
  duplicateCount = 0,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}) => {
  const tabs: { id: ArchiveFilter; label: string; count: number; isWarning?: boolean }[] = [
    { id: 'all', label: 'Tất cả email', count: totalCount },
    { id: 'sent', label: 'Đã gửi', count: sentCount },
    { id: 'draft', label: 'Bản nháp', count: draftCount },
  ];

  if (duplicateCount > 0) {
    tabs.push({
      id: 'duplicates',
      label: 'Mail trùng lặp',
      count: duplicateCount,
      isWarning: true,
    });
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={STAT_CARD_CLASS}>
          <div className={STAT_LABEL_CLASS}>Tổng email lưu trữ</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white mt-0.5">
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
          <div className="text-lg font-semibold text-gray-600 dark:text-gray-300 mt-0.5">
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
        <div className="inline-flex items-center p-0.5 bg-gray-100 dark:bg-[#232120] rounded-xl border border-gray-200 dark:border-[#332f2c] self-start flex-wrap gap-0.5">
          {tabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-[#1d1c19] text-gray-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.isWarning && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive
                      ? tab.isWarning
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold'
                        : 'bg-gray-100 text-gray-700 dark:bg-[#282522] dark:text-gray-300'
                      : tab.isWarning
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo người nhận, email, công ty..."
            className="w-full pl-9 pr-8 py-1.5 bg-white dark:bg-[#1d1c19] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-lg text-xs outline-none focus:border-gray-400 dark:focus:border-[#4f4943] transition shadow-2xs placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Xoá từ khoá tìm kiếm"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

import React from 'react';
import { Search, X } from 'lucide-react';
import type { FilterCategory, FilterTab } from './notificationCategory';

interface NotificationToolbarProps {
  tabs: FilterTab[];
  activeFilter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

/** Hàng tab phân loại và ô tìm kiếm của trang thông báo. */
export const NotificationToolbar: React.FC<NotificationToolbarProps> = ({
  tabs,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}) => (
  <div className="bg-white dark:bg-[#1d1c19] border border-gray-200 dark:border-[#332f2c] p-3 sm:p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = activeFilter === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onFilterChange(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              isActive
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-2xs font-semibold'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#232120]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isActive
                    ? 'bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900'
                    : 'bg-gray-200 dark:bg-[#2e2b28] text-gray-700 dark:text-gray-300'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>

    <div className="relative w-full md:w-64 shrink-0">
      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Tìm kiếm nội dung thông báo..."
        className="w-full pl-9 pr-3.5 py-1.5 bg-gray-50 dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl text-xs outline-none focus:border-gray-900 dark:focus:border-white transition shadow-2xs"
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
);


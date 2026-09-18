import React from 'react';
import { Laptop, Moon, Paintbrush, Sun } from 'lucide-react';
import type { ThemeType } from '../ThemeProvider';

interface AppearanceTabProps {
  theme: ThemeType;
  onSelectTheme: (theme: ThemeType) => void;
}

interface ThemeOption {
  value: ThemeType;
  label: string;
  icon: typeof Sun;
  iconClass: string;
  activeClass: string;
  /** Khối xem trước nhỏ mô phỏng nền và các dòng nội dung của chủ đề. */
  preview: { surface: string; lines: [string, string] };
}

// Ba chủ đề khai báo bằng dữ liệu thay vì ba khối JSX gần giống nhau.
const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'light',
    label: 'Chế độ Sáng',
    icon: Sun,
    iconClass: 'text-amber-500',
    activeClass: 'border-[#e8732c] bg-orange-50/20 ring-1 ring-[#e8732c]',
    preview: {
      surface: 'bg-[#fbfbfa] border-[#e6e4e0]',
      lines: ['bg-gray-300', 'bg-gray-200'],
    },
  },
  {
    value: 'dark',
    label: 'Chế độ Tối',
    icon: Moon,
    iconClass: 'text-indigo-400',
    activeClass: 'border-[#e8732c] bg-orange-950/20 ring-1 ring-[#e8732c]',
    preview: {
      surface: 'bg-[#171614] border-[#332f2c]',
      lines: ['bg-[#2d2927]', 'bg-[#221f1e]'],
    },
  },
  {
    value: 'luxury-dark',
    label: 'Hệ thống / Sang trọng',
    icon: Laptop,
    iconClass: 'text-[#e8732c]',
    activeClass: 'border-[#e8732c] bg-orange-950/20 ring-1 ring-[#e8732c]',
    preview: {
      surface:
        'bg-gradient-to-r from-gray-100 to-[#171614] border-[#e6e4e0] dark:border-[#332f2c]',
      lines: ['bg-gray-400', 'bg-gray-300'],
    },
  },
];

export const AppearanceTab: React.FC<AppearanceTabProps> = ({ theme, onSelectTheme }) => (
  <div className="flex flex-col bg-white dark:bg-[#1d1c19] border border-[#e6e4e0] dark:border-[#332f2c] rounded-lg overflow-hidden shadow-2xs">
    <div className="flex flex-col gap-0.5 px-4 py-3.5 border-b border-[#efedea] dark:border-[#2a2624]">
      <div className="text-[13px] font-semibold text-[#1c1b19] dark:text-white flex items-center gap-2">
        <Paintbrush className="w-4 h-4 text-[#e8732c]" />
        <span>Giao diện hiển thị</span>
      </div>
      <div className="text-[11px] text-[#97938c]">
        Tùy chỉnh chủ đề sáng, tối hoặc theo cài đặt hệ điều hành
      </div>
    </div>

    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectTheme(option.value)}
              className={`border rounded-lg p-3.5 cursor-pointer transition flex flex-col items-center gap-2.5 ${
                isActive
                  ? option.activeClass
                  : 'border-[#e6e4e0] dark:border-[#332f2c] hover:border-gray-400 bg-white dark:bg-[#232120]'
              }`}
            >
              <div
                className={`w-full h-16 rounded-md border p-2 flex flex-col gap-1.5 justify-center ${option.preview.surface}`}
              >
                <div className={`w-3/4 h-2 rounded ${option.preview.lines[0]}`} />
                <div className={`w-1/2 h-2 rounded ${option.preview.lines[1]}`} />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#1c1b19] dark:text-white">
                <Icon className={`w-3.5 h-3.5 ${option.iconClass}`} />
                <span>{option.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

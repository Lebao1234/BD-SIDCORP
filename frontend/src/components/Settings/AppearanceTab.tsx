import React from 'react';
import { Laptop, Moon, Sun } from 'lucide-react';
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
    iconClass: 'text-fg-muted',
    activeClass: 'border-brand bg-brand-soft ring-1 ring-brand',
    preview: {
      surface: 'bg-[#f6f7f9] border-[#e3e6eb]',
      lines: ['bg-[#c9ced7]', 'bg-[#e3e6eb]'],
    },
  },
  {
    value: 'dark',
    label: 'Chế độ Tối',
    icon: Moon,
    iconClass: 'text-fg-muted',
    activeClass: 'border-brand bg-brand-soft ring-1 ring-brand',
    preview: {
      surface: 'bg-[#0c0d10] border-[#25282f]',
      lines: ['bg-[#3a3f48]', 'bg-[#1f2228]'],
    },
  },
  {
    value: 'luxury-dark',
    label: 'Hệ thống / Sang trọng',
    icon: Laptop,
    iconClass: 'text-brand-text',
    activeClass: 'border-brand bg-brand-soft ring-1 ring-brand',
    preview: {
      surface:
        'bg-gradient-to-r from-[#f6f7f9] to-[#0c0d10] border-line',
      lines: ['bg-[#8a909b]', 'bg-[#c9ced7]'],
    },
  },
];

export const AppearanceTab: React.FC<AppearanceTabProps> = ({ theme, onSelectTheme }) => (
  <div className="flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
    <div className="flex flex-col gap-0.5 border-b border-divider px-4 py-3.5">
      <div className="text-[13.5px] font-semibold text-fg">
        
        <span>Giao diện hiển thị</span>
      </div>
      <div className="text-[12px] text-fg-faint">
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
                  : 'border-line hover:border-line-strong bg-surface'
              }`}
            >
              <div
                className={`w-full h-16 rounded-md border p-2 flex flex-col gap-1.5 justify-center ${option.preview.surface}`}
              >
                <div className={`w-3/4 h-2 rounded ${option.preview.lines[0]}`} />
                <div className={`w-1/2 h-2 rounded ${option.preview.lines[1]}`} />
              </div>
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-fg">
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

import React from 'react';
import { Bell } from 'lucide-react';
import { Toggle } from '../common/Toggle';
import {
  NOTIFICATION_PREFERENCES,
  type NotificationPreferenceKey,
  type NotificationPreferences,
} from './notificationPreferences';

interface NotificationsTabProps {
  preferences: NotificationPreferences;
  onChange: (key: NotificationPreferenceKey, value: boolean) => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ preferences, onChange }) => (
  <div className="flex flex-col bg-white dark:bg-[#1d1c19] border border-[#e6e4e0] dark:border-[#332f2c] rounded-lg overflow-hidden shadow-2xs">
    <div className="flex flex-col gap-0.5 px-4 py-3.5 border-b border-[#efedea] dark:border-[#2a2624]">
      <div className="text-[13px] font-semibold text-[#1c1b19] dark:text-white flex items-center gap-2">
        <Bell className="w-4 h-4 text-[#e8732c]" />
        <span>Cấu hình thông báo</span>
      </div>
      <div className="text-[11px] text-[#97938c]">
        Kiểm soát cách thức bạn nhận thông báo và âm thanh nhắc việc
      </div>
    </div>

    <div className="p-4 space-y-3">
      {NOTIFICATION_PREFERENCES.map((pref) => (
        <Toggle
          key={pref.key}
          checked={preferences[pref.key]}
          onChange={(value) => onChange(pref.key, value)}
          label={pref.label}
          description={pref.description}
          variant="row"
        />
      ))}

      <p className="text-[11px] text-[#a5a199] leading-relaxed pt-1">
        Các tuỳ chọn này hiện chỉ áp dụng trong phiên làm việc hiện tại. Hệ thống chưa lưu cấu
        hình thông báo theo tài khoản.
      </p>
    </div>
  </div>
);

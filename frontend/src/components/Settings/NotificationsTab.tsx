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
  <div className="flex flex-col bg-surface dark:bg-panel border border-line dark:border-line rounded-lg overflow-hidden shadow-2xs">
    <div className="flex flex-col gap-0.5 px-4 py-3.5 border-b border-divider dark:border-divider">
      <div className="text-[13px] font-semibold text-fg dark:text-white flex items-center gap-2">
        <Bell className="w-4 h-4 text-brand" />
        <span>Cấu hình thông báo</span>
      </div>
      <div className="text-[11px] text-fg-faint">
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

      <p className="text-[11px] text-fg-faint leading-relaxed pt-1">
        Các tuỳ chọn này hiện chỉ áp dụng trong phiên làm việc hiện tại. Hệ thống chưa lưu cấu
        hình thông báo theo tài khoản.
      </p>
    </div>
  </div>
);

import React from 'react';
import { Monitor } from 'lucide-react';
import { Toggle } from '../common/Toggle';
import {
  NOTIFICATION_PREFERENCES,
  type NotificationPreferenceKey,
  type NotificationPreferences,
} from './notificationPreferences';

interface AccountSidebarProps {
  role?: string;
  approved?: boolean;
  assignedCount: number | null;
  preferences: NotificationPreferences;
  onPreferenceChange: (key: NotificationPreferenceKey, value: boolean) => void;
}

const CARD_CLASS =
  'flex flex-col bg-white dark:bg-[#1d1c19] border border-[#e6e4e0] dark:border-[#332f2c] rounded-lg overflow-hidden shadow-2xs';
const CARD_HEADER_CLASS =
  'flex flex-col gap-0.5 px-4 py-3 border-b border-[#efedea] dark:border-[#2a2624]';
const CARD_TITLE_CLASS = 'text-[13px] font-semibold text-[#1c1b19] dark:text-white';

/**
 * Nhận diện trình duyệt và hệ điều hành của phiên đang mở.
 *
 * Trước đây thẻ "Phiên đăng nhập" hiển thị cứng "Chrome · Windows · TP.HCM" và
 * một thiết bị iPhone không có thật, kèm nút "Thu hồi" chỉ đổi state cục bộ rồi
 * báo "đã thu hồi thành công". Hệ thống dùng JWT 7 ngày không có danh sách thu
 * hồi, nên câu báo đó là sai. Ở đây chỉ hiển thị thứ thực sự biết được.
 */
const describeCurrentSession = (): string => {
  if (typeof navigator === 'undefined') return 'Phiên hiện tại';

  const ua = navigator.userAgent;

  const browser =
    /Edg\//.test(ua) ? 'Edge'
    : /OPR\//.test(ua) ? 'Opera'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari'
    : /Firefox\//.test(ua) ? 'Firefox'
    : 'Trình duyệt';

  const platform =
    /Windows/.test(ua) ? 'Windows'
    : /Android/.test(ua) ? 'Android'
    : /iPhone|iPad/.test(ua) ? 'iOS'
    : /Mac OS X/.test(ua) ? 'macOS'
    : /Linux/.test(ua) ? 'Linux'
    : 'Thiết bị khác';

  return `${browser} · ${platform}`;
};

export const AccountSidebar: React.FC<AccountSidebarProps> = ({
  role,
  approved,
  assignedCount,
  preferences,
  onPreferenceChange,
}) => (
  <div className="flex flex-col gap-3">
    {/* Quyền hạn */}
    <div className={CARD_CLASS}>
      <div className={CARD_HEADER_CLASS}>
        <div className={CARD_TITLE_CLASS}>Quyền hạn</div>
      </div>
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[#7d7a73] dark:text-[#97938c]">Vai trò hệ thống</span>
          <span className="inline-flex px-2 py-0.5 border border-[#e0ddd8] dark:border-[#3a3532] rounded bg-[#f3f1ee] dark:bg-[#282522] text-[11px] font-medium text-[#56534d] dark:text-[#c4c0b8]">
            {role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[#7d7a73] dark:text-[#97938c]">Trạng thái duyệt</span>
          {/* Trước đây luôn vẽ "Đã duyệt" bất kể trạng thái thật của tài khoản */}
          {approved === false ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#b8551a] dark:text-[#fbbf24] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b8551a] dark:bg-[#fbbf24]" />
              <span>Chờ duyệt</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#1a7f4b] dark:text-[#34d399] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1a7f4b] dark:bg-[#34d399]" />
              <span>Đã duyệt</span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[#7d7a73] dark:text-[#97938c]">Khách hàng phụ trách</span>
          <span className="text-xs font-semibold tabular-nums text-[#1c1b19] dark:text-white">
            {assignedCount === null ? '—' : assignedCount}
          </span>
        </div>

        <div className="pt-1 text-[11px] text-[#a5a199] leading-relaxed border-t border-[#f3f1ee] dark:border-[#282522]">
          Chỉ quản trị viên mới thay đổi được vai trò. Liên hệ admin nếu cần điều chỉnh.
        </div>
      </div>
    </div>

    {/* Phiên đăng nhập */}
    <div className={CARD_CLASS}>
      <div className={CARD_HEADER_CLASS}>
        <div className={CARD_TITLE_CLASS}>Phiên đăng nhập</div>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-2.5">
          <Monitor className="w-4 h-4 text-[#7d7a73] shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5 flex-grow min-w-0">
            <div className="text-xs font-medium text-[#1c1b19] dark:text-white">
              {describeCurrentSession()}
            </div>
            <div className="text-[11px] text-[#97938c]">Đang hoạt động</div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#1a7f4b] dark:text-[#34d399] font-medium shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1a7f4b] dark:bg-[#34d399]" />
            <span>Hiện tại</span>
          </span>
        </div>

        <div className="pt-2 text-[11px] text-[#a5a199] leading-relaxed border-t border-[#f3f1ee] dark:border-[#282522]">
          Hệ thống chưa theo dõi các phiên đăng nhập khác và chưa hỗ trợ đăng xuất từ xa. Nếu nghi
          ngờ tài khoản bị lộ, hãy đổi mật khẩu và báo quản trị viên.
        </div>
      </div>
    </div>

    {/* Thông báo nhanh — cùng nguồn dữ liệu với tab Thông báo */}
    <div className={CARD_CLASS}>
      <div className={CARD_HEADER_CLASS}>
        <div className={CARD_TITLE_CLASS}>Thông báo</div>
      </div>
      <div className="flex flex-col gap-3 p-4">
        {NOTIFICATION_PREFERENCES.map((pref) => (
          <Toggle
            key={pref.key}
            checked={preferences[pref.key]}
            onChange={(value) => onPreferenceChange(pref.key, value)}
            label={pref.shortLabel}
            description={pref.shortDescription}
            variant="plain"
          />
        ))}
      </div>
    </div>
  </div>
);

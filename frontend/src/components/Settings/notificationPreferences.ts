import { useState } from 'react';

export type NotificationPreferenceKey = 'mention' | 'internalChat' | 'appointment';

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

interface PreferenceDefinition {
  key: NotificationPreferenceKey;
  /** Nhãn dài, dùng cho tab Thông báo ở cột trái. */
  label: string;
  description: string;
  /** Nhãn ngắn, dùng cho thẻ tóm tắt hẹp ở cột phải. */
  shortLabel: string;
  shortDescription: string;
}

/**
 * Ba tuỳ chọn thông báo, khai báo một lần.
 *
 * Trước đây mỗi tuỳ chọn được vẽ tay hai lần — một lần trong tab, một lần trong
 * thẻ tóm tắt bên phải — nên nhãn và mô tả đã bắt đầu lệch nhau giữa hai chỗ.
 * Giờ cả hai nơi cùng duyệt qua mảng này.
 */
export const NOTIFICATION_PREFERENCES: PreferenceDefinition[] = [
  {
    key: 'mention',
    label: 'Khi được nhắc tên (@mention)',
    description: 'Nhận thông báo tức thì khi ai đó gõ @ tên bạn trong ghi chú khách hàng',
    shortLabel: 'Khi được nhắc tên',
    shortDescription: 'Ai đó gõ @ tên bạn trong ghi chú',
  },
  {
    key: 'internalChat',
    label: 'Tin nhắn nội bộ & Diễn đàn',
    description: 'Thông báo tin nhắn riêng và thảo luận nhóm',
    shortLabel: 'Tin nhắn nội bộ',
    shortDescription: 'Tin nhắn riêng và diễn đàn nhóm',
  },
  {
    key: 'appointment',
    label: 'Nhắc lịch hẹn chăm sóc',
    description: 'Thông báo trước giờ hẹn chăm sóc khách hàng 30 phút',
    shortLabel: 'Nhắc lịch hẹn',
    shortDescription: 'Trước giờ hẹn chăm sóc 30 phút',
  },
];

const DEFAULT_PREFERENCES: NotificationPreferences = {
  mention: true,
  internalChat: true,
  appointment: false,
};

/**
 * Trạng thái ba công tắc thông báo.
 *
 * LƯU Ý: hiện chỉ là trạng thái trong bộ nhớ của phiên làm việc. Backend chưa có
 * endpoint lưu tuỳ chọn thông báo, nên bật/tắt ở đây chưa tác động tới việc hệ
 * thống có gửi thông báo hay không, và sẽ trở về mặc định khi tải lại trang.
 * Khi có API thật thì thay phần thân hook này bằng một `useQuery` +
 * `useMutation`, chỗ gọi không phải đổi gì.
 */
export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  const setPreference = (key: NotificationPreferenceKey, value: boolean) =>
    setPreferences((prev) => ({ ...prev, [key]: value }));

  return { preferences, setPreference };
};

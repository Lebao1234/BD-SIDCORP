import { AtSign, Bell, Briefcase, Clock, type LucideIcon } from 'lucide-react';
import type { AppNotification } from '../../context/SocketContext';

export type NotificationCategory = 'mention' | 'customer' | 'task' | 'system';
export type FilterCategory = 'all' | 'unread' | NotificationCategory;

interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const getCategory = (item: AppNotification): NotificationCategory => {
  const type = item.type?.toLowerCase() ?? '';

  if (type.includes('mention') || item.content?.includes('@')) return 'mention';
  if (item.customerId || type.includes('customer')) return 'customer';
  if (type.includes('task') || type.includes('remind')) return 'task';
  return 'system';
};

export const CATEGORY_META: Record<NotificationCategory, CategoryMeta> = {
  mention: {
    label: 'Nhắc tên',
    icon: AtSign,
    color:
      'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  customer: {
    label: 'Khách hàng',
    icon: Briefcase,
    color:
      'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  task: {
    label: 'Công việc',
    icon: Clock,
    color:
      'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  system: {
    label: 'Hệ thống',
    icon: Bell,
    color:
      'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  },
};

export const matchesFilter = (item: AppNotification, filter: FilterCategory): boolean => {
  if (filter === 'all') return true;
  if (filter === 'unread') return !item.isRead;
  return getCategory(item) === filter;
};

export const matchesSearch = (item: AppNotification, keyword: string): boolean => {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;

  return [item.title, item.content, item.customerName, item.authorName].some((field) =>
    field?.toLowerCase().includes(q)
  );
};

export interface FilterTab {
  id: FilterCategory;
  label: string;
  count: number;
}

export const buildFilterTabs = (notifications: AppNotification[]): FilterTab[] => {
  const countBy = (filter: FilterCategory) =>
    notifications.reduce((total, item) => total + (matchesFilter(item, filter) ? 1 : 0), 0);

  return [
    { id: 'all', label: 'Tất cả', count: notifications.length },
    { id: 'unread', label: 'Chưa đọc', count: countBy('unread') },
    { id: 'mention', label: 'Nhắc tên (@)', count: countBy('mention') },
    { id: 'customer', label: 'Khách hàng', count: countBy('customer') },
    { id: 'task', label: 'Công việc', count: countBy('task') },
  ];
};


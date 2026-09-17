export const TASK_TYPES      = ['TASK', 'MEETING', 'CALL', 'FOLLOW_UP'] as const;
export const TASK_STATUSES   = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;
export const TASK_PRIORITIES = ['LOW', 'NORMAL', 'HIGH'] as const;

export type TaskType     = (typeof TASK_TYPES)[number];
export type TaskStatus   = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;

  start_at?: string | null;
  end_at?: string | null;
  due_at?: string | null;
  all_day: boolean;

  location?: string | null;
  remind_before_minutes?: number | null;
  reminded_at?: string | null;

  customer_id?: number | null;
  customer?: { id: number; name: string | null; phone_number: string | null } | null;

  owner_id: number;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskSummary {
  today: Task[];
  overdueCount: number;
  openCount: number;
  meetingsToday: number;
}

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  TASK:      'Công việc',
  MEETING:   'Cuộc họp',
  CALL:      'Gọi điện',
  FOLLOW_UP: 'Chăm sóc',
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  TODO:        'Chưa làm',
  IN_PROGRESS: 'Đang làm',
  DONE:        'Hoàn thành',
  CANCELLED:   'Đã huỷ',
};

// Màu chỉ nằm ở chấm 6px, giống cách hiển thị trạng thái khách hàng
export const TASK_STATUS_DOT: Record<TaskStatus, string> = {
  TODO:        'bg-[#c9c5be]',
  IN_PROGRESS: 'bg-[#b5730f]',
  DONE:        'bg-[#1a7f4b]',
  CANCELLED:   'bg-[#c2372b]',
};

export const TASK_STATUS_CLASS: Record<TaskStatus, string> = {
  TODO:        'border border-gray-300 text-gray-700 bg-gray-50/60 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800/30',
  IN_PROGRESS: 'border border-blue-400 text-blue-600 bg-blue-50/60 dark:border-blue-400 dark:text-blue-400 dark:bg-blue-950/20',
  DONE:        'border border-emerald-500 text-emerald-700 bg-emerald-50/60 dark:border-emerald-400 dark:text-emerald-400 dark:bg-emerald-950/20',
  CANCELLED:   'border border-rose-200 text-rose-600 bg-rose-100/80 dark:border-rose-900/60 dark:text-rose-400 dark:bg-rose-950/40',
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW:    'Thấp',
  NORMAL: 'Bình thường',
  HIGH:   'Cao',
};

export const REMIND_OPTIONS: { value: number | ''; label: string }[] = [
  { value: '',   label: 'Không nhắc' },
  { value: 5,    label: 'Trước 5 phút' },
  { value: 15,   label: 'Trước 15 phút' },
  { value: 30,   label: 'Trước 30 phút' },
  { value: 60,   label: 'Trước 1 giờ' },
  { value: 1440, label: 'Trước 1 ngày' },
];

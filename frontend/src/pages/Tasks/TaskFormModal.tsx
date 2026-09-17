import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
  Task, TaskType, TaskStatus, TaskPriority,
  TASK_TYPE_LABEL, TASK_STATUS_LABEL, TASK_PRIORITY_LABEL, REMIND_OPTIONS,
} from '../../types/task';
import { Customer } from '../../types';
import { toDateTimeLocalValue, fromDateTimeLocalValue } from '../../utils/datetime';

interface Props {
  task: Task | null;
  onClose: () => void;
  onSubmit: (payload: Partial<Task>) => void;
}

const fieldCls =
  'h-8 w-full rounded-md border border-line-input bg-surface px-2.5 text-[13px] ' +
  'dark:border-[#332f2c] dark:bg-[#232120]';
const labelCls = 'text-[11px] text-fg-subtle';

export const TaskFormModal: React.FC<Props> = ({ task, onClose, onSubmit }) => {
  const isEdit = Boolean(task?.id);

  const [form, setForm] = useState({
    title:       task?.title ?? '',
    description: task?.description ?? '',
    type:        (task?.type ?? 'TASK') as TaskType,
    status:      (task?.status ?? 'TODO') as TaskStatus,
    priority:    (task?.priority ?? 'NORMAL') as TaskPriority,
    start_at:    toDateTimeLocalValue(task?.start_at),
    end_at:      toDateTimeLocalValue(task?.end_at),
    due_at:      toDateTimeLocalValue(task?.due_at),
    location:    task?.location ?? '',
    customer_id: task?.customer_id ? String(task.customer_id) : '',
    remind_before_minutes:
      task?.remind_before_minutes !== null && task?.remind_before_minutes !== undefined
        ? String(task.remind_before_minutes)
        : '',
  });
  const [error, setError] = useState('');

  // Danh sách khách hàng để gắn việc — chỉ nạp khi modal mở
  const { data: customers = [] } = useQuery({
    queryKey: ['customersForTask'],
    queryFn: async () => {
      const res = await api.get('/customers?page=1&limit=200');
      return (res.data?.data ?? []) as Customer[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) return setError('Tiêu đề công việc là bắt buộc.');
    if (form.start_at && form.end_at && form.end_at < form.start_at) {
      return setError('Thời điểm kết thúc phải sau thời điểm bắt đầu.');
    }

    onSubmit({
      title:       form.title.trim(),
      description: form.description || null,
      type:        form.type,
      status:      form.status,
      priority:    form.priority,
      // Mọi mốc thời gian đều quy về UTC ở đúng một chỗ
      start_at:    fromDateTimeLocalValue(form.start_at),
      end_at:      fromDateTimeLocalValue(form.end_at),
      due_at:      fromDateTimeLocalValue(form.due_at),
      location:    form.location || null,
      customer_id: form.customer_id ? Number(form.customer_id) : null,
      remind_before_minutes: form.remind_before_minutes ? Number(form.remind_before_minutes) : null,
    } as Partial<Task>);
  };

  const isScheduled = form.type === 'MEETING' || Boolean(form.start_at);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#2a2724]/50" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="animate-modal-pop relative z-10 flex max-h-[92vh] w-full max-w-[560px] flex-col
          overflow-hidden rounded-lg border border-line-strong bg-surface dark:border-[#3d3934] dark:bg-[#232120]"
      >
        <div className="flex shrink-0 items-center border-b border-line px-4 py-3 dark:border-[#332f2c]">
          <h3 className="text-[13px] font-semibold">
            {isEdit ? 'Sửa công việc' : 'Thêm công việc'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-fg-subtle transition hover:bg-raised dark:hover:bg-[#2c2a27]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto p-4">
          {error && (
            <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Tiêu đề *</label>
            <input
              className={fieldCls}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="VD: Gọi lại khách hàng sau demo"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Loại</label>
              <select className={fieldCls} value={form.type} onChange={(e) => set('type', e.target.value)}>
                {(Object.keys(TASK_TYPE_LABEL) as TaskType[]).map((t) => (
                  <option key={t} value={t}>{TASK_TYPE_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Trạng thái</label>
              <select className={fieldCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
                {(Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map((t) => (
                  <option key={t} value={t}>{TASK_STATUS_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Ưu tiên</label>
              <select className={fieldCls} value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {(Object.keys(TASK_PRIORITY_LABEL) as TaskPriority[]).map((t) => (
                  <option key={t} value={t}>{TASK_PRIORITY_LABEL[t]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Bắt đầu</label>
              <input type="datetime-local" className={fieldCls} value={form.start_at} onChange={(e) => set('start_at', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Kết thúc</label>
              <input type="datetime-local" className={fieldCls} value={form.end_at} onChange={(e) => set('end_at', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Hạn chót (nếu không đặt giờ)</label>
              <input type="datetime-local" className={fieldCls} value={form.due_at} onChange={(e) => set('due_at', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Nhắc trước</label>
              <select
                className={fieldCls}
                value={form.remind_before_minutes}
                onChange={(e) => set('remind_before_minutes', e.target.value)}
                disabled={!isScheduled}
                title={isScheduled ? undefined : 'Cần đặt thời điểm bắt đầu thì mới nhắc được'}
              >
                {REMIND_OPTIONS.map((o) => (
                  <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Địa điểm hoặc đường dẫn họp</label>
            <input
              className={fieldCls}
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="VD: Google Meet, hoặc 148 Tô Hiến Thành Q.10"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Gắn với khách hàng</label>
            <select className={fieldCls} value={form.customer_id} onChange={(e) => set('customer_id', e.target.value)}>
              <option value="">Không gắn</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayId ? `${c.displayId} · ` : ''}{c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Ghi chú</label>
            <textarea
              rows={3}
              className="w-full resize-y rounded-md border border-line-input bg-surface px-2.5 py-2 text-[13px] dark:border-[#332f2c] dark:bg-[#232120]"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-line px-4 py-3 dark:border-[#332f2c]">
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="h-[30px] rounded-md border border-line bg-surface px-3.5 text-xs font-medium text-fg-muted dark:border-[#332f2c] dark:bg-[#232120]"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="h-[30px] rounded-md bg-brand px-4 text-xs font-medium text-white transition hover:bg-[#d2651f]"
          >
            {isEdit ? 'Lưu thay đổi' : 'Tạo công việc'}
          </button>
        </div>
      </form>
    </div>
  );
};

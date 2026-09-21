import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  Users,
  Phone,
  HeartHandshake,
  Clock,
  MapPin,
  Building2,
  Bell,
  AlertCircle,
  Timer,
  ChevronDown,
  CalendarPlus,
  FileText,
  Flame,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
  Task,
  TaskType,
  TaskStatus,
  TaskPriority,
  TASK_TYPE_LABEL,
  TASK_STATUS_LABEL,
  TASK_PRIORITY_LABEL,
  REMIND_OPTIONS,
} from '../../types/task';
import { Customer } from '../../types';
import { toDateTimeLocalValue, fromDateTimeLocalValue } from '../../utils/datetime';

interface Props {
  task: Task | null;
  onClose: () => void;
  onSubmit: (payload: Partial<Task>) => void;
}

// Helper tính thời lượng giữa bắt đầu và kết thúc
const getDurationInfo = (startStr: string, endStr: string): { text: string; isInvalid: boolean } | null => {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  const diffMs = end - start;
  if (diffMs <= 0) return { text: 'Thời điểm kết thúc phải sau bắt đầu', isInvalid: true };
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0 && mins > 0) return { text: `${hours} giờ ${mins} phút`, isInvalid: false };
  if (hours > 0) return { text: `${hours} giờ`, isInvalid: false };
  return { text: `${mins} phút`, isInvalid: false };
};

// Helper tính mốc thời gian nhắc nhở cụ thể để người dùng xem trước
const getReminderInfo = (startStr: string, remindMinutesStr: string): string | null => {
  if (!startStr || !remindMinutesStr) return null;
  const mins = Number(remindMinutesStr);
  if (!mins || Number.isNaN(mins)) return null;
  const startDate = new Date(startStr);
  if (Number.isNaN(startDate.getTime())) return null;
  const remindDate = new Date(startDate.getTime() - mins * 60_000);
  const timeStr = remindDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = remindDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `Chuông báo sẽ gửi lúc ${timeStr} ngày ${dateStr}`;
};

const typeIcons: Record<TaskType, React.ReactNode> = {
  TASK: <CheckSquare className="w-3.5 h-3.5" />,
  MEETING: <Users className="w-3.5 h-3.5" />,
  CALL: <Phone className="w-3.5 h-3.5" />,
  FOLLOW_UP: <HeartHandshake className="w-3.5 h-3.5" />,
};

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

  // Tự động gợi ý kết thúc khi người dùng chọn giờ bắt đầu (nếu chưa có kết thúc)
  const handleStartAtChange = (val: string) => {
    setForm((p) => {
      const updated = { ...p, start_at: val };
      if (val && !p.end_at) {
        const start = new Date(val);
        if (!Number.isNaN(start.getTime())) {
          const defaultEnd = new Date(start.getTime() + 60 * 60_000); // Mặc định 1 giờ
          updated.end_at = toDateTimeLocalValue(defaultEnd);
        }
      }
      return updated;
    });
  };

  // Nút áp dụng thời lượng nhanh (+30p, +45p, +1h, +2h)
  const applyDuration = (minutes: number) => {
    if (!form.start_at) return;
    const startDate = new Date(form.start_at);
    if (Number.isNaN(startDate.getTime())) return;
    const endDate = new Date(startDate.getTime() + minutes * 60_000);
    set('end_at', toDateTimeLocalValue(endDate));
  };

  // Tính toán thời lượng hiển thị trực quan
  const durationInfo = getDurationInfo(form.start_at, form.end_at);

  // Tính mốc giờ nhắc nhở cụ thể để người dùng biết chính xác lúc nào chuông reo
  const reminderPreview = getReminderInfo(form.start_at, form.remind_before_minutes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) return setError('Vui lòng nhập tiêu đề công việc.');
    if (form.start_at && form.end_at && form.end_at < form.start_at) {
      return setError('Thời điểm kết thúc phải sau thời điểm bắt đầu.');
    }
    if (form.remind_before_minutes && !form.start_at) {
      return setError('Cần đặt thời điểm bắt đầu để hệ thống có thể tính giờ gửi thông báo nhắc trước.');
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

  const hasStartTime = Boolean(form.start_at);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      {/* Nền mờ hiện đại */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="animate-modal-pop relative z-10 flex max-h-[92vh] w-full max-w-[580px] flex-col
          overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl transition-all
          dark:border-[#38332f] dark:bg-[#1e1c1a]"
      >
        {/* Header với Icon và Tiêu đề sang trọng */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3.5 dark:border-[#2b2724]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand dark:bg-brand/20">
              <CalendarPlus className="h-5 w-5 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {isEdit ? 'Chỉnh sửa công việc' : 'Thêm công việc mới'}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {isEdit
                  ? 'Cập nhật tiến độ, thời gian và chi tiết công việc'
                  : 'Lên lịch trình, phân loại và đặt nhắc nhở tự động'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#2c2a27] dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nội dung form */}
        <div className="flex flex-col gap-4 overflow-y-auto p-5 text-[13px]">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2.5 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Ô nhập tiêu đề chính */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Tiêu đề công việc <span className="text-rose-500">*</span>
            </label>
            <input
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/40 px-3.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 transition focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15 dark:border-[#383430] dark:bg-[#262320]/60 dark:text-gray-100 dark:focus:bg-[#201d1b]"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="VD: Đăng 1 content Linkedin, Họp demo khách hàng..."
              autoFocus
            />
          </div>

          {/* Segmented Control chọn Loại công việc */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Loại hoạt động
            </label>
            <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-gray-200/70 bg-gray-100/80 p-1 dark:border-[#2e2a27] dark:bg-[#181615]">
              {(Object.keys(TASK_TYPE_LABEL) as TaskType[]).map((t) => {
                const isActive = form.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('type', t)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white text-brand shadow-xs font-semibold dark:bg-[#2b2724]'
                        : 'text-gray-500 hover:bg-white/60 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-[#22201d] dark:hover:text-gray-200'
                    }`}
                  >
                    {typeIcons[t]}
                    <span>{TASK_TYPE_LABEL[t]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trạng thái & Mức độ ưu tiên */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Trạng thái
              </label>
              <div className="relative">
                <select
                  className="h-9 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 pr-8 text-xs font-medium text-gray-800 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 dark:border-[#383430] dark:bg-[#23201d] dark:text-gray-200 cursor-pointer"
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                >
                  {(Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map((t) => (
                    <option key={t} value={t}>{TASK_STATUS_LABEL[t]}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Mức độ ưu tiên
                </label>
                {form.priority === 'HIGH' && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                    <Flame className="h-3 w-3" /> Khẩn cấp
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  className="h-9 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 pr-8 text-xs font-medium text-gray-800 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 dark:border-[#383430] dark:bg-[#23201d] dark:text-gray-200 cursor-pointer"
                  value={form.priority}
                  onChange={(e) => set('priority', e.target.value)}
                >
                  {(Object.keys(TASK_PRIORITY_LABEL) as TaskPriority[]).map((t) => (
                    <option key={t} value={t}>{TASK_PRIORITY_LABEL[t]}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Group Card: Thời gian & Lịch trình */}
          <div className="rounded-2xl border border-gray-200/70 bg-gray-50/70 p-3.5 space-y-3 dark:border-[#332f2c] dark:bg-[#1a1816]/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
                <Clock className="h-3.5 w-3.5 text-brand" />
                <span>Thời gian & Lịch trình</span>
              </div>
              {durationInfo && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                    durationInfo.isInvalid
                      ? 'border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'border border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}
                >
                  <Timer className="h-3 w-3" />
                  {durationInfo.text}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                  Bắt đầu
                </label>
                <input
                  type="datetime-local"
                  className="h-9 w-full rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-800 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 dark:border-[#383430] dark:bg-[#23201d] dark:text-gray-200 cursor-pointer"
                  value={form.start_at}
                  onChange={(e) => handleStartAtChange(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                  Kết thúc
                </label>
                <input
                  type="datetime-local"
                  className="h-9 w-full rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-800 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 dark:border-[#383430] dark:bg-[#23201d] dark:text-gray-200 cursor-pointer"
                  value={form.end_at}
                  onChange={(e) => set('end_at', e.target.value)}
                />
              </div>
            </div>

            {/* Nút cộng nhanh thời lượng */}
            {form.start_at && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[11px] text-gray-500 dark:text-gray-400">Thời lượng nhanh:</span>
                {[
                  { label: '+30p', mins: 30 },
                  { label: '+45p', mins: 45 },
                  { label: '+1h', mins: 60 },
                  { label: '+1.5h', mins: 90 },
                  { label: '+2h', mins: 120 },
                ].map((p) => (
                  <button
                    key={p.mins}
                    type="button"
                    onClick={() => applyDuration(p.mins)}
                    className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-gray-600 shadow-2xs transition hover:border-brand hover:bg-brand/5 hover:text-brand dark:border-[#383430] dark:bg-[#252220] dark:text-gray-300 cursor-pointer active:scale-95"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200/60 dark:border-[#2f2b27]">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                  Hạn chót (Deadline)
                </label>
                <input
                  type="datetime-local"
                  className="h-9 w-full rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-800 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 dark:border-[#383430] dark:bg-[#23201d] dark:text-gray-200 cursor-pointer"
                  value={form.due_at}
                  onChange={(e) => set('due_at', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                  Nhắc trước giờ bắt đầu
                </label>
                <div className="relative">
                  <select
                    className="h-9 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 pr-8 text-xs font-medium text-gray-800 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 dark:border-[#383430] dark:bg-[#23201d] dark:text-gray-200 disabled:opacity-50 cursor-pointer"
                    value={form.remind_before_minutes}
                    onChange={(e) => set('remind_before_minutes', e.target.value)}
                    disabled={!hasStartTime}
                    title={hasStartTime ? undefined : 'Cần đặt thời điểm bắt đầu để hệ thống tính giờ nhắc'}
                  >
                    {REMIND_OPTIONS.map((o) => (
                      <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Dòng hiển thị giải thích tính toán nhắc việc hoặc hướng dẫn */}
            {hasStartTime && form.remind_before_minutes && reminderPreview ? (
              <div className="flex items-center gap-2 rounded-xl border border-blue-200/70 bg-blue-50/80 px-3 py-2 text-[11px] text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
                <Bell className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                <span className="font-medium">{reminderPreview}</span>
              </div>
            ) : !hasStartTime ? (
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                💡 Đặt mốc <span className="font-semibold text-gray-700 dark:text-gray-300">Bắt đầu</span> để kích hoạt chuông báo nhắc trước.
              </p>
            ) : null}
          </div>

          {/* Địa điểm & Khách hàng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                <span>Địa điểm / Link họp</span>
              </label>
              <input
                className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-800 placeholder:text-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 dark:border-[#383430] dark:bg-[#23201d] dark:text-gray-200"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="VD: Google Meet, hoặc 148 Tô Hiến Thành..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                <span>Gắn với khách hàng</span>
              </label>
              <div className="relative">
                <select
                  className="h-9 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 pr-8 text-xs font-medium text-gray-800 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 dark:border-[#383430] dark:bg-[#23201d] dark:text-gray-200 cursor-pointer"
                  value={form.customer_id}
                  onChange={(e) => set('customer_id', e.target.value)}
                >
                  <option value="">Không gắn (Cá nhân)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayId ? `${c.displayId} · ` : ''}{c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Ghi chú chi tiết */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
              <FileText className="h-3.5 w-3.5 text-gray-400" />
              <span>Ghi chú bổ sung</span>
            </label>
            <textarea
              rows={3}
              className="w-full resize-y rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-800 placeholder:text-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 dark:border-[#383430] dark:bg-[#23201d] dark:text-gray-200"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Ghi chú nội dung trao đổi, chuẩn bị tài liệu hoặc yêu cầu cụ thể..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50/40 px-5 py-3.5 dark:border-[#2b2724] dark:bg-[#181615]/50">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-xl border border-gray-200 bg-white px-4 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-800 dark:border-[#383430] dark:bg-[#23201d] dark:text-gray-300 dark:hover:bg-[#2a2724] cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="h-9 rounded-xl bg-gradient-to-r from-brand to-[#d2651f] px-5 text-xs font-semibold text-white shadow-sm transition hover:from-[#d2651f] hover:to-[#be5617] hover:shadow active:scale-[0.98] cursor-pointer"
          >
            {isEdit ? 'Lưu thay đổi' : 'Tạo công việc'}
          </button>
        </div>
      </form>
    </div>
  );
};

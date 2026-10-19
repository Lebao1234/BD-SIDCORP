import React, { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '../../components/Layout/AppLayout';
import { useTasks } from '../../hooks/useTasks';
import { useCustomerOptions } from '../../hooks/useCustomerOptions';
import {TaskType, TaskStatus, TaskPriority } from '../../types/task';
import { notify, confirmDialog } from '../../lib/notify';
import { toolbarButton, iconButton, primaryButton, pageTitle } from '../../components/common/ui';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
  Check,
  Calendar as CalendarIcon,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  isDbTask: boolean;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  color: 'blue' | 'purple' | 'amber' | 'emerald' | 'rose' | 'teal';
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  customer_id?: number | null;
  customerName?: string | null;
  location?: string | null;
  all_day: boolean;
  description?: string;
}

// Màu chỉ nằm ở vạch 3px bên trái chip; nền và chữ giữ trung tính để lịch dày
// việc vẫn đọc được. Dùng bảng màu chuỗi dữ liệu đã kiểm định mù màu; ưu tiên
// cao lấy màu "nguy hiểm" để nổi lên giữa các việc thường.
const EVENT_COLOR_MAP = {
  blue: 'var(--series-1)',
  purple: 'var(--series-2)',
  amber: 'var(--series-other)',
  emerald: 'var(--series-3)',
  rose: 'var(--color-danger)',
  teal: 'var(--series-3)',
};

const TYPE_LABEL_VI: Record<TaskType, string> = {
  TASK: 'Công việc',
  MEETING: 'Cuộc họp',
  CALL: 'Gọi điện',
  FOLLOW_UP: 'Chăm sóc',
};

const TYPE_DEFAULT_COLOR: Record<TaskType, CalendarEvent['color']> = {
  MEETING: 'purple',
  CALL: 'emerald',
  FOLLOW_UP: 'amber',
  TASK: 'blue',
};

// Định dạng YYYY-MM-DD theo đúng giờ địa phương (local time),
// tránh lỗi toISOString() chuyển về UTC gây lệch -1 ngày ở múi giờ UTC+
const formatLocalDate = (d: Date | string | null | undefined): string => {
  if (!d) return '';
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Lịch Việt Nam bắt đầu tuần từ Thứ Hai.
const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

// Định nghĩa cấu trúc chuẩn cho dữ liệu Form sự kiện lịch
interface CalendarFormData {
  title: string;
  date: string;
  time: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  customerId: number | '';
  color: CalendarEvent['color'];
  location: string;
  allDay: boolean;
  description: string;
}

const INITIAL_FORM_DATA: CalendarFormData = {
  title: '',
  date: '',
  time: '09:00',
  type: 'MEETING',
  status: 'TODO',
  priority: 'NORMAL',
  customerId: '',
  color: 'purple',
  location: '',
  allDay: false,
  description: '',
};

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  /*
   * Chỉ tải việc của tháng đang xem.
   *
   * Trước đây trang này gọi `useTasks({ scope: 'all' })`, mà hook đó gắn cứng
   * `limit=200` — nghĩa là tải 200 công việc của mọi thời điểm rồi lọc ở trình
   * duyệt. Hệ quả: tải thừa dữ liệu của những tháng không ai nhìn, và khi vượt
   * 200 việc thì lịch âm thầm trống chỗ.
   *
   * Khoảng lấy rộng hơn tháng một tuần ở hai đầu, vì lưới lịch có hiển thị vài
   * ngày của tháng trước và tháng sau.
   */
  const range = useMemo(() => {
    const from = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    from.setDate(from.getDate() - 7);
    from.setHours(0, 0, 0, 0);

    const to = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    to.setDate(to.getDate() + 7);
    to.setHours(23, 59, 59, 999);

    return { from: from.toISOString(), to: to.toISOString() };
  }, [currentDate]);

  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, setFilters } =
    useTasks({ scope: 'all', from: range.from, to: range.to });

  // Đổi tháng thì đổi khoảng lấy dữ liệu; react-query tự giữ lại kết quả của
  // những tháng đã xem nên đi tới đi lui không gọi mạng lại.
  useEffect(() => {
    setFilters({ scope: 'all', from: range.from, to: range.to });
  }, [range, setFilters]);

  // Dùng hook chia sẻ thay vì gọi API trực tiếp (tránh duplicate request, tận dụng React Query cache)
  const { options: customers } = useCustomerOptions();

  // Modal State – Tinh gọn thành 1 state Form duy nhất thay vì 11 useState rải rác
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState<CalendarFormData>(INITIAL_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);

  const updateFormField = <K extends keyof CalendarFormData>(key: K, value: CalendarFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Convert DB tasks to Calendar events
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    if (!tasks || tasks.length === 0) {
      return [];
    }

    return tasks.map(t => {
      let dateStr = '';
      let timeStr = '';

      if (t.start_at) {
        const d = new Date(t.start_at);
        dateStr = formatLocalDate(d);
        timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (t.due_at) {
        const d = new Date(t.due_at);
        dateStr = formatLocalDate(d);
        timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (t.created_at) {
        dateStr = formatLocalDate(t.created_at);
      }

      const defaultColor = TYPE_DEFAULT_COLOR[t.type] || 'blue';
      const color = t.priority === 'HIGH' ? 'rose' : defaultColor;

      return {
        id: String(t.id),
        isDbTask: true,
        title: t.title,
        date: dateStr,
        time: t.all_day ? 'Cả ngày' : timeStr,
        color,
        type: t.type,
        status: t.status,
        priority: t.priority,
        customer_id: t.customer_id,
        customerName: t.customer?.name,
        location: t.location,
        all_day: t.all_day,
        description: t.description || undefined,
      };
    });
  }, [tasks]);

  // Nhóm events theo ngày (YYYY-MM-DD) bằng Map để tra cứu O(1) trong render 42 ô,
  // thay vì filter O(n) × 42 lần = ~42.000 phép so sánh mỗi render khi có nhiều tasks.
  const eventsByDate = useMemo<Record<string, CalendarEvent[]>>(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const evt of calendarEvents) {
      if (!evt.date) continue;
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    }
    return map;
  }, [calendarEvents]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = `Tháng ${month + 1}, ${year}`;

  // Build grid: 42 cells (6 weeks) starting Sunday
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0 = Thứ 2
    const startDate = new Date(year, month, 1 - startingDayOfWeek);

    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }
    return days;
  }, [year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleOpenAddModal = (initialDate?: string) => {
    setEditingEvent(null);
    setFormData({
      ...INITIAL_FORM_DATA,
      date: initialDate || formatLocalDate(new Date()),
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (evt: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(evt);
    setFormData({
      title: evt.title,
      date: evt.date,
      time: evt.time && evt.time !== 'Cả ngày' ? evt.time : '09:00',
      type: evt.type,
      status: evt.status,
      priority: evt.priority,
      customerId: evt.customer_id || '',
      color: evt.color,
      location: evt.location || '',
      allDay: evt.all_day,
      description: evt.description || '',
    });
    setIsModalOpen(true);
  };

  const handleQuickToggleDone = async (evt: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus: TaskStatus = evt.status === 'DONE' ? 'TODO' : 'DONE';
    try {
      await updateTask.mutateAsync({
        id: Number(evt.id),
        status: newStatus,
        completed_at: newStatus === 'DONE' ? new Date().toISOString() : null,
      });
    } catch (err) {
      console.error('Lỗi đổi trạng thái công việc:', err);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const { title, date, time, type, status, priority, customerId, location, allDay, description } = formData;
    if (!title.trim() || !date) return;

    setIsSaving(true);
    try {
      let start_at: string | null = null;
      let due_at: string | null = null;

      if (date) {
        if (time && !allDay) {
          const combined = new Date(`${date}T${time.length === 5 ? time + ':00' : time}`);
          const iso = !isNaN(combined.getTime()) ? combined.toISOString() : new Date(`${date}T00:00:00`).toISOString();
          start_at = iso;
          due_at = iso;
        } else {
          const iso = new Date(`${date}T00:00:00`).toISOString();
          start_at = iso;
          due_at = iso;
        }
      }

      const payload = {
        title: title.trim(),
        type,
        status,
        priority,
        customer_id: customerId ? Number(customerId) : null,
        start_at,
        due_at,
        all_day: allDay,
        location: location.trim() || null,
        description: description.trim() || null,
      };

      if (editingEvent) {
        await updateTask.mutateAsync({
          id: Number(editingEvent.id),
          ...payload,
        });
      } else {
        await createTask.mutateAsync(payload);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Lỗi lưu công việc trên lịch:', err);
      notify.error('Không thể lưu công việc. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (await confirmDialog({ title: 'Xoá công việc này?', message: 'Công việc sẽ bị xoá khỏi lịch của mọi người liên quan.', danger: true })) {
      try {
        await deleteTask.mutateAsync(Number(id));
        setIsModalOpen(false);
      } catch (err) {
        console.error('Lỗi xóa công việc:', err);
        notify.error('Không thể xoá công việc.');
      }
    }
  };

  const todayStr = formatLocalDate(new Date());

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className={pageTitle}>{monthName}</h2>
            <p className="text-[13px] text-fg-subtle">
              {tasksLoading ? 'Đang đồng bộ lịch…' : 'Bấm vào một ngày để thêm công việc hoặc lịch hẹn.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden items-center gap-3 pr-2 text-[12px] text-fg-subtle lg:flex">
              {(['TASK', 'MEETING', 'CALL', 'FOLLOW_UP'] as TaskType[]).map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-[3px] rounded-full" style={{ backgroundColor: EVENT_COLOR_MAP[TYPE_DEFAULT_COLOR[t]] }} />
                  {TYPE_LABEL_VI[t]}
                </span>
              ))}
            </div>
            <button onClick={handleToday} className={toolbarButton}>
              Hôm nay
            </button>
            <button onClick={handlePrevMonth} className={iconButton} title="Tháng trước" aria-label="Tháng trước">
              <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
            </button>
            <button onClick={handleNextMonth} className={iconButton} title="Tháng sau" aria-label="Tháng sau">
              <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
            </button>
            <button onClick={() => handleOpenAddModal()} className={primaryButton}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              Thêm công việc
            </button>
          </div>
        </div>

        {/* 7-Day Column Headers */}
        <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
          <div className="table-sticky-header grid grid-cols-7 border-b border-line">
            {WEEKDAYS.map(day => (
              <div
                key={day}
                className="px-2.5 py-2 text-left text-[12px] font-medium text-fg-subtle"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid (42 cells) */}
          <div className="grid grid-cols-7 divide-x divide-y divide-divider">
            {calendarDays.map((d, index) => {
              const dateStr = formatLocalDate(d);
              const isCurrentMonth = d.getMonth() === month;
              const isToday = dateStr === todayStr;
              const dayEvents = eventsByDate[dateStr] || [];

              return (
                <div
                  key={index}
                  onClick={() => handleOpenAddModal(dateStr)}
                  className={`flex min-h-[112px] cursor-pointer flex-col p-1.5 transition-colors hover:bg-surface-alt sm:min-h-[128px] ${
                    !isCurrentMonth ? 'bg-surface-alt/60 text-fg-empty' : 'bg-surface'
                  }`}
                >
                  {/* Day number header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`tnum inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[12px] font-medium ${
                        isToday
                          ? 'bg-brand font-semibold text-white'
                          : isCurrentMonth
                          ? 'text-fg dark:text-fg'
                          : 'text-fg-empty dark:text-fg-faint'
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="tnum pr-1 text-[11px] text-fg-faint">
                        {dayEvents.length} việc
                      </span>
                    )}
                  </div>

                  {/* Event pills in cell */}
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map(evt => (
                      <div
                        key={evt.id}
                        onClick={e => handleOpenEditModal(evt, e)}
                        className={`group flex cursor-pointer items-center justify-between gap-1 truncate rounded-chip border border-line border-l-[3px] bg-surface-alt py-[3px] pl-1.5 pr-1 text-[11.5px] text-fg-body transition hover:border-line-strong hover:bg-raised ${
                          evt.status === 'DONE' ? 'opacity-55 line-through' : ''
                        }`}
                        style={{ borderLeftColor: EVENT_COLOR_MAP[evt.color] || EVENT_COLOR_MAP.blue }}
                        title={`${evt.time ? evt.time + ' - ' : ''}${evt.title}${evt.customerName ? ` (${evt.customerName})` : ''}`}
                      >
                        <div className="truncate flex items-center gap-1 min-w-0">
                          {evt.time && <span className="tnum shrink-0 text-[11px] text-fg-faint">{evt.time}</span>}
                          <span className="truncate font-medium">{evt.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={e => handleQuickToggleDone(evt, e)}
                          title={evt.status === 'DONE' ? 'Đánh dấu chưa làm' : 'Đánh dấu hoàn thành'}
                          className="shrink-0 rounded-chip p-0.5 text-fg-subtle opacity-0 transition hover:bg-surface hover:text-ok group-hover:opacity-100"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="block px-1.5 text-[11px] text-fg-faint">
                        +{dayEvents.length - 3} việc nữa
                      </span>
                    )}
                  </div>

                  <div className="h-0" />
                </div>
              );
            })}
          </div>
        </div>

        {/* MODAL: ADD / EDIT TASK EVENT CONNECTED TO DB */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            <div
              className="fixed inset-0 bg-[#0c0d10]/45 transition-opacity animate-fade-in"
              onClick={() => setIsModalOpen(false)}
            />
            <div className="relative w-full max-w-lg bg-surface dark:bg-panel rounded-2xl shadow-2xl z-10 flex flex-col border border-line dark:border-line overflow-hidden animate-modal-pop">
              <div className="flex items-center justify-between px-6 py-4 border-b border-divider dark:border-line bg-surface dark:bg-panel shrink-0">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-fg-body dark:text-fg-body" />
                  <h3 className="text-base font-bold text-fg dark:text-white">
                    {editingEvent ? 'Chỉnh sửa công việc / lịch hẹn' : 'Thêm công việc / lịch hẹn mới'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-fg-faint hover:text-fg-body dark:hover:text-white hover:bg-raised dark:hover:bg-raised rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="p-6 space-y-4 text-xs">
                {/* Title */}
                <div>
                  <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1 block">Tiêu đề công việc / Cuộc họp *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => updateFormField('title', e.target.value)}
                    placeholder="Ví dụ: Họp ký hợp đồng tư vấn giải pháp CRM..."
                    className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs"
                  />
                </div>

                {/* Type & Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1 block">Phân loại</label>
                    <select
                      value={formData.type}
                      onChange={e => {
                        const val = e.target.value as TaskType;
                        setFormData(prev => ({
                          ...prev,
                          type: val,
                          color: TYPE_DEFAULT_COLOR[val] || 'blue'
                        }));
                      }}
                      className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3 py-2 text-xs outline-none cursor-pointer shadow-2xs"
                    >
                      <option value="MEETING">Cuộc họp (MEETING)</option>
                      <option value="CALL">Gọi điện (CALL)</option>
                      <option value="FOLLOW_UP">Chăm sóc (FOLLOW_UP)</option>
                      <option value="TASK">Công việc (TASK)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1 block">Mức độ ưu tiên</label>
                    <select
                      value={formData.priority}
                      onChange={e => updateFormField('priority', e.target.value as TaskPriority)}
                      className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3 py-2 text-xs outline-none cursor-pointer shadow-2xs"
                    >
                      <option value="LOW">Thấp</option>
                      <option value="NORMAL">Bình thường</option>
                      <option value="HIGH">Cao (Khẩn cấp)</option>
                    </select>
                  </div>
                </div>

                {/* Date, Time & All Day */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1 block">Ngày diễn ra *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={e => updateFormField('date', e.target.value)}
                      className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted block">Thời gian</label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-fg-subtle">
                        <input
                          type="checkbox"
                          checked={formData.allDay}
                          onChange={e => updateFormField('allDay', e.target.checked)}
                          className="rounded border-line-strong dark:border-line-strong"
                        />
                        Cả ngày
                      </label>
                    </div>
                    <input
                      type="time"
                      disabled={formData.allDay}
                      value={formData.time}
                      onChange={e => updateFormField('time', e.target.value)}
                      className={`w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs ${
                        formData.allDay ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Customer Link (Real CRM DB connection) */}
                <div>
                  <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1 block">
                    Gắn với khách hàng trong CRM (Tùy chọn)
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={e => updateFormField('customerId', e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3 py-2 text-xs outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="">-- Không gắn khách hàng cụ thể --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name || `Khách hàng #${c.id}`} {c.phone_number ? `(${c.phone_number})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1 block">Địa điểm / Link họp</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => updateFormField('location', e.target.value)}
                      placeholder="Văn phòng công ty / Google Meet…"
                      className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1 block">Trạng thái xử lý</label>
                    <select
                      value={formData.status}
                      onChange={e => updateFormField('status', e.target.value as TaskStatus)}
                      className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3 py-2 text-xs outline-none cursor-pointer shadow-2xs"
                    >
                      <option value="TODO">Chưa làm (TODO)</option>
                      <option value="IN_PROGRESS">Đang làm (IN_PROGRESS)</option>
                      <option value="DONE">Hoàn thành (DONE)</option>
                      <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                    </select>
                  </div>
                </div>

                {/* Color Tag Selection */}
                <div>
                  <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">Màu sắc thẻ</label>
                  <div className="flex items-center gap-2">
                    {(['blue', 'purple', 'amber', 'emerald', 'rose', 'teal'] as const).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateFormField('color', c)}
                        className={`w-7 h-7 rounded-xl border-2 transition cursor-pointer flex items-center justify-center ${
                          formData.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                        }`}
                        style={{
                          backgroundColor:
                            c === 'blue'
                              ? '#3b82f6'
                              : c === 'purple'
                              ? '#a855f7'
                              : c === 'amber'
                              ? '#f59e0b'
                              : c === 'emerald'
                              ? '#10b981'
                              : c === 'rose'
                              ? '#f43f5e'
                              : '#14b8a6',
                        }}
                      >
                        {formData.color === c && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1 block">Nội dung / Ghi chú</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={e => updateFormField('description', e.target.value)}
                    placeholder="Mục tiêu cuộc họp, tài liệu cần chuẩn bị mang theo..."
                    className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-divider dark:border-line">
                  {editingEvent ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(editingEvent.id)}
                      className="text-rose-500 hover:text-rose-600 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa công việc
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-raised dark:bg-surface text-fg-body dark:text-fg-body hover:bg-line dark:hover:bg-raised rounded-xl text-xs font-medium transition cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-control text-[13px] font-medium transition cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSaving ? 'Đang lưu...' : editingEvent ? 'Lưu thay đổi' : 'Tạo công việc'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
export default CalendarPage;

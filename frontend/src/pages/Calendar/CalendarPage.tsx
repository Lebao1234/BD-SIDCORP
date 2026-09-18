/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { AppLayout } from '../../components/Layout/AppLayout';
import { useTasks } from '../../hooks/useTasks';
import { useCustomerOptions } from '../../hooks/useCustomerOptions';
import {TaskType, TaskStatus, TaskPriority } from '../../types/task';
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

const EVENT_COLOR_MAP = {
  blue: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  purple: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  amber: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  emerald: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  rose: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  teal: 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
};

const TYPE_DEFAULT_COLOR: Record<TaskType, CalendarEvent['color']> = {
  MEETING: 'purple',
  CALL: 'emerald',
  FOLLOW_UP: 'amber',
  TASK: 'blue',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Connect to real backend Task API
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask } = useTasks({ scope: 'all' });

  // Dùng hook chia sẻ thay vì gọi API trực tiếp (tránh duplicate request, tận dụng React Query cache)
  const { options: customers } = useCustomerOptions();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formType, setFormType] = useState<TaskType>('MEETING');
  const [formStatus, setFormStatus] = useState<TaskStatus>('TODO');
  const [formPriority, setFormPriority] = useState<TaskPriority>('NORMAL');
  const [formCustomerId, setFormCustomerId] = useState<number | ''>('');
  const [formColor, setFormColor] = useState<CalendarEvent['color']>('purple');
  const [formLocation, setFormLocation] = useState('');
  const [formAllDay, setFormAllDay] = useState(false);
  const [formDesc, setFormDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
        dateStr = t.start_at.split('T')[0];
        timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (t.due_at) {
        const d = new Date(t.due_at);
        dateStr = t.due_at.split('T')[0];
        timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (t.created_at) {
        dateStr = t.created_at.split('T')[0];
      }

      const defaultColor = TYPE_DEFAULT_COLOR[t.type] || 'blue';
      const color = t.priority === 'HIGH' ? 'rose' : defaultColor;

      return {
        id: String(t.id),
        isDbTask: true,
        title: t.title,
        date: dateStr,
        time: t.all_day ? 'All day' : timeStr,
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

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Build grid: 42 cells (6 weeks) starting Sunday
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
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
    setFormTitle('');
    setFormDate(initialDate || new Date().toISOString().split('T')[0]);
    setFormTime('09:00');
    setFormType('MEETING');
    setFormStatus('TODO');
    setFormPriority('NORMAL');
    setFormCustomerId('');
    setFormColor('purple');
    setFormLocation('');
    setFormAllDay(false);
    setFormDesc('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (evt: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(evt);
    setFormTitle(evt.title);
    setFormDate(evt.date);
    setFormTime(evt.time && evt.time !== 'All day' ? evt.time : '');
    setFormType(evt.type);
    setFormStatus(evt.status);
    setFormPriority(evt.priority);
    setFormCustomerId(evt.customer_id || '');
    setFormColor(evt.color);
    setFormLocation(evt.location || '');
    setFormAllDay(evt.all_day);
    setFormDesc(evt.description || '');
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
    if (!formTitle.trim() || !formDate) return;

    setIsSaving(true);
    try {
      // Build ISO timestamps
      let start_at: string | null = null;
      let due_at: string | null = null;

      if (formDate) {
        if (formTime && !formAllDay) {
          const combined = new Date(`${formDate}T${formTime.length === 5 ? formTime + ':00' : formTime}`);
          if (!isNaN(combined.getTime())) {
            start_at = combined.toISOString();
            due_at = combined.toISOString();
          } else {
            start_at = new Date(formDate).toISOString();
            due_at = start_at;
          }
        } else {
          start_at = new Date(formDate).toISOString();
          due_at = start_at;
        }
      }

      if (editingEvent) {
        await updateTask.mutateAsync({
          id: Number(editingEvent.id),
          title: formTitle.trim(),
          type: formType,
          status: formStatus,
          priority: formPriority,
          customer_id: formCustomerId ? Number(formCustomerId) : null,
          start_at,
          due_at,
          all_day: formAllDay,
          location: formLocation.trim() || null,
          description: formDesc.trim() || null,
        });
      } else {
        await createTask.mutateAsync({
          title: formTitle.trim(),
          type: formType,
          status: formStatus,
          priority: formPriority,
          customer_id: formCustomerId ? Number(formCustomerId) : null,
          start_at,
          due_at,
          all_day: formAllDay,
          location: formLocation.trim() || null,
          description: formDesc.trim() || null,
        });
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Lỗi lưu công việc trên lịch:', err);
      alert('Không thể lưu công việc. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công việc này khỏi cơ sở dữ liệu?')) {
      try {
        await deleteTask.mutateAsync(Number(id));
        setIsModalOpen(false);
      } catch (err) {
        console.error('Lỗi xóa công việc:', err);
        alert('Không thể xóa công việc.');
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Calendar Top Navigation Header matching media_1789637472106.png */}
        <div className="bg-white dark:bg-[#1d1c19] border border-gray-200 dark:border-[#332f2c] p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToday}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-[#332f2c] bg-white dark:bg-[#232120] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#282522] text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              Today
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#232120] transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#232120] transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{monthName}</span>
              {tasksLoading && (
                <span className="text-[11px] font-normal text-gray-400 animate-pulse">(Đang đồng bộ...)</span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* View indicator – chỉ hỗ trợ Tháng hiện tại */}
            <span className="appearance-none bg-white dark:bg-[#232120] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3 py-1.5 text-xs font-medium shadow-2xs">
              Tháng (Month)
            </span>

            <button
              onClick={() => handleOpenAddModal()}
              className="bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Thêm công việc
            </button>
          </div>
        </div>

        {/* 7-Day Column Headers */}
        <div className="bg-white dark:bg-[#1d1c19] border border-gray-200 dark:border-[#332f2c] rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-[#332f2c] bg-gray-50/70 dark:bg-[#1a1917]">
            {WEEKDAYS.map(day => (
              <div
                key={day}
                className="py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid (42 cells) */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-[#262422] border-b border-gray-200 dark:border-[#332f2c]">
            {calendarDays.map((d, index) => {
              const dateStr = d.toISOString().split('T')[0];
              const isCurrentMonth = d.getMonth() === month;
              const isToday = dateStr === todayStr;
              const dayEvents = eventsByDate[dateStr] || [];

              return (
                <div
                  key={index}
                  onClick={() => handleOpenAddModal(dateStr)}
                  className={`min-h-[115px] sm:min-h-[135px] p-2 flex flex-col justify-between transition cursor-pointer hover:bg-gray-50/80 dark:hover:bg-[#232120]/60 ${
                    !isCurrentMonth ? 'bg-gray-50/30 dark:bg-[#171614]/40 text-gray-300 dark:text-gray-600' : 'bg-white dark:bg-[#1d1c19]'
                  }`}
                >
                  {/* Day number header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        isToday
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold shadow-2xs'
                          : isCurrentMonth
                          ? 'text-gray-800 dark:text-gray-200'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono font-medium text-gray-400">
                        {dayEvents.length} việc
                      </span>
                    )}
                  </div>

                  {/* Event pills in cell */}
                  <div className="space-y-1 my-1 overflow-y-auto max-h-[85px] custom-scrollbar">
                    {dayEvents.slice(0, 3).map(evt => (
                      <div
                        key={evt.id}
                        onClick={e => handleOpenEditModal(evt, e)}
                        className={`group px-2 py-1 rounded-lg text-[11px] font-medium border truncate cursor-pointer transition hover:opacity-95 shadow-2xs flex items-center justify-between gap-1 ${
                          EVENT_COLOR_MAP[evt.color] || EVENT_COLOR_MAP.blue
                        } ${evt.status === 'DONE' ? 'opacity-60 line-through' : ''}`}
                        title={`${evt.time ? evt.time + ' - ' : ''}${evt.title}${evt.customerName ? ` (${evt.customerName})` : ''}`}
                      >
                        <div className="truncate flex items-center gap-1 min-w-0">
                          {evt.time && <span className="font-mono text-[10px] opacity-80 shrink-0">{evt.time}</span>}
                          <span className="truncate">{evt.title}</span>
                          {evt.customerName && (
                            <span className="text-[10px] opacity-75 font-normal shrink-0">· {evt.customerName}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={e => handleQuickToggleDone(evt, e)}
                          title={evt.status === 'DONE' ? 'Đánh dấu chưa làm' : 'Đánh dấu hoàn thành'}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition shrink-0"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-gray-400 font-medium px-1 block">
                        + {dayEvents.length - 3} công việc nữa
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
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
              onClick={() => setIsModalOpen(false)}
            />
            <div className="relative w-full max-w-lg bg-white dark:bg-[#1d1c19] rounded-2xl shadow-2xl z-10 flex flex-col border border-gray-200 dark:border-[#332f2c] overflow-hidden animate-modal-pop">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#332f2c] bg-white dark:bg-[#1d1c19] shrink-0">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {editingEvent ? 'Chỉnh sửa công việc / lịch hẹn' : 'Thêm công việc / lịch hẹn mới'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#282522] rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="p-6 space-y-4 text-xs">
                {/* Title */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Tiêu đề công việc / Cuộc họp *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="Ví dụ: Họp ký hợp đồng tư vấn giải pháp CRM..."
                    className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs"
                  />
                </div>

                {/* Type & Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Phân loại</label>
                    <select
                      value={formType}
                      onChange={e => {
                        const val = e.target.value as TaskType;
                        setFormType(val);
                        setFormColor(TYPE_DEFAULT_COLOR[val] || 'blue');
                      }}
                      className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3 py-2 text-xs outline-none cursor-pointer shadow-2xs"
                    >
                      <option value="MEETING">Cuộc họp (MEETING)</option>
                      <option value="CALL">Gọi điện (CALL)</option>
                      <option value="FOLLOW_UP">Chăm sóc (FOLLOW_UP)</option>
                      <option value="TASK">Công việc (TASK)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Mức độ ưu tiên</label>
                    <select
                      value={formPriority}
                      onChange={e => setFormPriority(e.target.value as TaskPriority)}
                      className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3 py-2 text-xs outline-none cursor-pointer shadow-2xs"
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
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Ngày diễn ra *</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block">Thời gian</label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-gray-500">
                        <input
                          type="checkbox"
                          checked={formAllDay}
                          onChange={e => setFormAllDay(e.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        Cả ngày
                      </label>
                    </div>
                    <input
                      type="time"
                      disabled={formAllDay}
                      value={formTime}
                      onChange={e => setFormTime(e.target.value)}
                      className={`w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs ${
                        formAllDay ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Customer Link (Real CRM DB connection) */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
                    Gắn với khách hàng trong CRM (Tùy chọn)
                  </label>
                  <select
                    value={formCustomerId}
                    onChange={e => setFormCustomerId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3 py-2 text-xs outline-none cursor-pointer shadow-2xs"
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
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Địa điểm / Link họp</label>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={e => setFormLocation(e.target.value)}
                      placeholder="Văn phòng SIDCORP / Google Meet..."
                      className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Trạng thái xử lý</label>
                    <select
                      value={formStatus}
                      onChange={e => setFormStatus(e.target.value as TaskStatus)}
                      className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3 py-2 text-xs outline-none cursor-pointer shadow-2xs"
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
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Màu sắc thẻ</label>
                  <div className="flex items-center gap-2">
                    {(['blue', 'purple', 'amber', 'emerald', 'rose', 'teal'] as const).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormColor(c)}
                        className={`w-7 h-7 rounded-xl border-2 transition cursor-pointer flex items-center justify-center ${
                          formColor === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
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
                        {formColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Nội dung / Ghi chú</label>
                  <textarea
                    rows={3}
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="Mục tiêu cuộc họp, tài liệu cần chuẩn bị mang theo..."
                    className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#2b2826]">
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
                      className="px-4 py-2 bg-gray-100 dark:bg-[#232120] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2c2927] rounded-xl text-xs font-medium transition cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
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

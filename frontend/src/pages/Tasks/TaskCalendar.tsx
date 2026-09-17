import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { Task, TASK_STATUS_DOT } from '../../types/task';
import { formatTime } from '../../utils/datetime';

interface Props {
  onSelectTask: (task: Task) => void;
  onCreateAt: (isoDate: string) => void;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// Lưới tháng bắt đầu từ thứ Hai, phủ trọn 6 tuần để chiều cao không nhảy
// khi chuyển tháng.
const buildMonthGrid = (anchor: Date): Date[] => {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  // getDay(): 0 = Chủ nhật. Quy về thứ Hai = 0.
  const offset = (first.getDay() + 6) % 7;

  const start = new Date(first);
  start.setDate(first.getDate() - offset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const dayKey  = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export const TaskCalendar: React.FC<Props> = ({ onSelectTask, onCreateAt }) => {
  const [anchor, setAnchor] = useState(() => new Date());

  const days = useMemo(() => buildMonthGrid(anchor), [anchor]);

  // Nạp đúng khoảng đang hiển thị thay vì tải tất cả
  const { from, to } = useMemo(
    () => ({
      from: days[0].toISOString(),
      to:   new Date(days[41].getTime() + 86_400_000 - 1).toISOString(),
    }),
    [days]
  );

  const { tasks, loading } = useTasks({ scope: 'all', from, to });

  // Gom việc theo ngày một lần, thay vì lọc lại 42 lần trong lúc render
  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      const raw = t.start_at ?? t.due_at;
      if (!raw) return;
      const k = dayKey(new Date(raw));
      const list = map.get(k);
      if (list) list.push(t); else map.set(k, [t]);
    });
    return map;
  }, [tasks]);

  const today = new Date();
  const monthLabel = anchor.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  const shiftMonth = (delta: number) =>
    setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1));

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface dark:border-[#332f2c] dark:bg-[#232120]">

      {/* Điều khiển tháng */}
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-2.5 dark:border-[#332f2c]">
        <span className="text-[13px] font-semibold capitalize">{monthLabel}</span>
        {loading && <span className="text-[11px] text-fg-faint">đang tải…</span>}

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setAnchor(new Date())}
            className="h-[30px] rounded-md border border-line bg-surface px-2.5 text-xs font-medium text-fg-muted dark:border-[#332f2c] dark:bg-[#232120]"
          >
            Hôm nay
          </button>
          <button
            onClick={() => shiftMonth(-1)}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-line bg-surface dark:border-[#332f2c] dark:bg-[#232120]"
          >
            <ChevronLeft className="h-4 w-4 text-fg-muted" />
          </button>
          <button
            onClick={() => shiftMonth(1)}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-line bg-surface dark:border-[#332f2c] dark:bg-[#232120]"
          >
            <ChevronRight className="h-4 w-4 text-fg-muted" />
          </button>
        </div>
      </div>

      {/* Tên thứ */}
      <div className="grid grid-cols-7 border-b border-line bg-canvas dark:border-[#332f2c] dark:bg-[#1d1c19]">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-2 py-1.5 text-center text-[11px] font-medium text-fg-subtle">
            {w}
          </div>
        ))}
      </div>

      {/* Lưới ngày */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = day.getMonth() === anchor.getMonth();
          const isToday = sameDay(day, today);
          const items   = byDay.get(dayKey(day)) ?? [];

          return (
            <div
              key={day.toISOString()}
              onDoubleClick={() => {
                const at = new Date(day);
                at.setHours(9, 0, 0, 0);
                onCreateAt(at.toISOString());
              }}
              title="Nhấp đúp để thêm công việc vào ngày này"
              className={`flex min-h-[104px] flex-col gap-1 border-b border-r border-divider p-1.5
                dark:border-[#2a2724] ${inMonth ? '' : 'bg-canvas dark:bg-[#1d1c19]'}`}
            >
              <span
                className={`tnum flex h-5 w-5 items-center justify-center rounded text-[11px]
                  ${isToday ? 'bg-brand font-semibold text-white' : inMonth ? 'text-fg-muted' : 'text-fg-empty'}`}
              >
                {day.getDate()}
              </span>

              {items.slice(0, 3).map((t) => (
                <button
                  key={t.id}
                  onClick={(e) => { e.stopPropagation(); onSelectTask(t); }}
                  className="flex items-center gap-1.5 rounded px-1 py-0.5 text-left transition hover:bg-raised dark:hover:bg-[#2c2a27]"
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TASK_STATUS_DOT[t.status]}`} />
                  {t.start_at && !t.all_day && (
                    <span className="tnum shrink-0 text-[10px] text-fg-faint">{formatTime(t.start_at)}</span>
                  )}
                  <span
                    className={`truncate text-[11px] ${
                      t.status === 'DONE' || t.status === 'CANCELLED'
                        ? 'text-fg-faint line-through'
                        : 'text-fg-body dark:text-[#d6d2cb]'
                    }`}
                  >
                    {t.title}
                  </span>
                </button>
              ))}

              {items.length > 3 && (
                <span className="px-1 text-[10px] text-fg-faint">+{items.length - 3} việc nữa</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

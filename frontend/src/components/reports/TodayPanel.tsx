import React from 'react';
import { Link } from 'react-router-dom';
import { useTaskSummary } from '../../hooks/useTasks';
import { TASK_TYPE_LABEL, TASK_STATUS_DOT } from '../../types/task';
import { formatTime, formatTimeRange } from '../../utils/datetime';
import { MapPin } from 'lucide-react';

/**
 * Khối "Hôm nay" trên trang chủ.
 *
 * Đây là lý do để mở CRM mỗi sáng thay vì mở lịch riêng: việc cần làm và cuộc
 * họp sắp tới nằm ngay cạnh số liệu kinh doanh.
 */
export const TodayPanel: React.FC = () => {
  const { data, isLoading } = useTaskSummary();

  const today = data?.today ?? [];
  const now = new Date();
  const dateLabel = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });

  return (
    <div
      style={{ animationDelay: '320ms' }}
      className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface dark:border-[#332f2c] dark:bg-[#232120] animate-fade-in-up transition-shadow duration-300 hover:shadow-sm"
    >
      <div className="flex items-center gap-2.5 border-b border-divider px-4 py-3 dark:border-[#2a2724]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold">Hôm nay</span>
          <span className="text-[11px] capitalize text-fg-faint">{dateLabel}</span>
        </div>

        <div className="ml-auto flex items-center gap-3 text-[11px]">
          {data && data.overdueCount > 0 && (
            <span className="flex items-center gap-1.5 text-danger">
              <span className="h-1.5 w-1.5 rounded-full bg-danger" />
              <span className="tnum font-medium">{data.overdueCount}</span> quá hạn
            </span>
          )}
          <Link to="/tasks" className="font-medium text-brand-text hover:underline">
            Mở công việc
          </Link>
        </div>
      </div>

      <div className="flex flex-col">
        {isLoading && (
          <div className="px-4 py-8 text-center text-xs text-fg-faint">Đang tải…</div>
        )}

        {!isLoading && today.length === 0 && (
          <div className="flex flex-col items-center gap-1 px-4 py-8">
            <p className="text-[13px] font-medium">Hôm nay không có lịch</p>
            <p className="text-[11px] text-fg-subtle">
              {data && data.openCount > 0
                ? `Còn ${data.openCount} việc chưa xong ở các ngày khác.`
                : 'Chưa có công việc nào đang mở.'}
            </p>
          </div>
        )}

        {today.map((task) => (
          <Link
            key={task.id}
            to="/tasks"
            className="flex items-center gap-3 border-b border-divider px-4 transition last:border-b-0
              hover:bg-surface-alt dark:border-[#2a2724] dark:hover:bg-[#262422]"
            style={{ minHeight: 44 }}
          >
            <span className="tnum w-11 shrink-0 text-[11px] text-fg-subtle">
              {task.start_at && !task.all_day ? formatTime(task.start_at) : 'Cả ngày'}
            </span>

            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TASK_STATUS_DOT[task.status]}`} />

            <span className="flex min-w-0 flex-1 flex-col gap-0.5 py-2">
              <span className="truncate text-[13px] font-medium">{task.title}</span>
              <span className="flex flex-wrap items-center gap-x-2 text-[11px] text-fg-faint">
                <span>{TASK_TYPE_LABEL[task.type]}</span>
                {task.customer?.name && <span className="truncate">· {task.customer.name}</span>}
                {task.location && (
                  <span className="inline-flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3" /> {task.location}
                  </span>
                )}
              </span>
            </span>

            {task.end_at && (
              <span className="tnum hidden shrink-0 text-[11px] text-fg-faint sm:block">
                {formatTimeRange(task.start_at, task.end_at).split('· ')[1] ?? ''}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

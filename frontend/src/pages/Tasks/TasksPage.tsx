import React, { useMemo, useState } from 'react';
import { AppLayout } from '../../components/Layout/AppLayout';
import { useTasks, TaskScope } from '../../hooks/useTasks';
import {
  Task, TaskType, TaskStatus,
  TASK_TYPE_LABEL, TASK_STATUS_LABEL, TASK_STATUS_DOT, TASK_STATUS_CLASS, TASK_PRIORITY_LABEL,
} from '../../types/task';
import { TaskFormModal } from './TaskFormModal';
import { TaskCalendar } from './TaskCalendar';
import { formatDate, formatTimeRange, isOverdue } from '../../utils/datetime';
import { Plus, Check, Trash2, CalendarDays, List, MapPin } from 'lucide-react';

const SCOPES: { value: TaskScope; label: string }[] = [
  { value: 'all',      label: 'Tất cả' },
  { value: 'today',    label: 'Hôm nay' },
  { value: 'upcoming', label: '7 ngày tới' },
  { value: 'overdue',  label: 'Quá hạn' },
];

export const TasksPage: React.FC = () => {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [editing, setEditing] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { tasks, loading, filters, setFilters, createTask, updateTask, deleteTask } =
    useTasks({ scope: 'all' });

  const openCount = useMemo(
    () => tasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length,
    [tasks]
  );

  const handleToggleDone = (task: Task) =>
    updateTask.mutate({ id: task.id, status: task.status === 'DONE' ? 'TODO' : 'DONE' });

  const handleDelete = (task: Task) => {
    if (!window.confirm(`Xoá công việc "${task.title}"?`)) return;
    deleteTask.mutate(task.id);
  };

  const openCreate = () => { setEditing(null); setIsFormOpen(true); };
  const openEdit   = (t: Task) => { setEditing(t); setIsFormOpen(true); };

  return (
    <AppLayout>
      <div className="flex flex-col gap-3.5">

        {/* Tiêu đề + hành động chính */}
        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-[19px] font-semibold tracking-[-0.01em]">Công việc</h1>
            <p className="text-xs text-fg-subtle">
              {loading ? 'Đang tải…' : `${openCount} việc chưa hoàn thành`}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex h-[30px] items-stretch rounded-md border border-line bg-raised p-0.5 dark:border-[#332f2c] dark:bg-[#1d1c19]">
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 rounded px-2.5 text-xs transition ${
                  view === 'list'
                    ? 'border border-line-strong bg-surface font-medium dark:border-[#3d3934] dark:bg-[#232120]'
                    : 'text-fg-subtle'
                }`}
              >
                <List className="h-3.5 w-3.5" /> Danh sách
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`flex items-center gap-1.5 rounded px-2.5 text-xs transition ${
                  view === 'calendar'
                    ? 'border border-line-strong bg-surface font-medium dark:border-[#3d3934] dark:bg-[#232120]'
                    : 'text-fg-subtle'
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" /> Lịch
              </button>
            </div>

            <button
              onClick={openCreate}
              className="flex h-[30px] items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-white transition hover:bg-[#d2651f]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.1} /> Thêm công việc
            </button>
          </div>
        </div>

        {view === 'list' ? (
          <>
            {/* Bộ lọc */}
            <div className="flex flex-wrap items-center gap-2">
              {SCOPES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setFilters({ ...filters, scope: s.value })}
                  className={`h-[30px] rounded-md border px-2.5 text-xs transition ${
                    filters.scope === s.value
                      ? 'border-line-strong bg-raised font-medium dark:border-[#3d3934] dark:bg-[#2c2a27]'
                      : 'border-line bg-surface text-fg-muted dark:border-[#332f2c] dark:bg-[#232120]'
                  }`}
                >
                  {s.label}
                </button>
              ))}

              <div className="mx-1 h-4 w-px bg-line dark:bg-[#332f2c]" />

              <select
                value={filters.type ?? ''}
                onChange={(e) => setFilters({ ...filters, type: e.target.value as TaskType | '' })}
                className="h-[30px] rounded-md border border-line bg-surface px-2 text-xs text-fg-muted dark:border-[#332f2c] dark:bg-[#232120]"
              >
                <option value="">Mọi loại</option>
                {(Object.keys(TASK_TYPE_LABEL) as TaskType[]).map((t) => (
                  <option key={t} value={t}>{TASK_TYPE_LABEL[t]}</option>
                ))}
              </select>

              <select
                value={filters.status ?? ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as TaskStatus | '' })}
                className="h-[30px] rounded-md border border-line bg-surface px-2 text-xs text-fg-muted dark:border-[#332f2c] dark:bg-[#232120]"
              >
                <option value="">Mọi trạng thái</option>
                {(Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map((t) => (
                  <option key={t} value={t}>{TASK_STATUS_LABEL[t]}</option>
                ))}
              </select>
            </div>

            {/* Danh sách */}
            <div className="overflow-hidden rounded-lg border border-line bg-surface dark:border-[#332f2c] dark:bg-[#232120]">
              {loading && tasks.length === 0 && (
                <div className="px-4 py-10 text-center text-xs text-fg-faint">Đang tải…</div>
              )}

              {!loading && tasks.length === 0 && (
                <div className="flex flex-col items-center gap-1.5 px-4 py-14">
                  <p className="text-[13px] font-medium">Chưa có công việc nào</p>
                  <p className="text-xs text-fg-subtle">Bấm “Thêm công việc” để ghi việc đầu tiên.</p>
                </div>
              )}

              {tasks.map((task, i) => {
                const done = task.status === 'DONE' || task.status === 'CANCELLED';
                const when = task.start_at
                  ? formatTimeRange(task.start_at, task.end_at)
                  : task.due_at
                    ? `Hạn ${formatDate(task.due_at)}`
                    : '';
                const late = !done && isOverdue(task.start_at ?? task.due_at);

                return (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 border-b border-divider px-4 last:border-b-0
                      dark:border-[#2a2724] ${i % 2 === 1 ? 'bg-surface-alt dark:bg-[#262422]' : ''}`}
                    style={{ minHeight: 44 }}
                  >
                    <button
                      onClick={() => handleToggleDone(task)}
                      title={done ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition
                        ${task.status === 'DONE'
                          ? 'border-[#1a7f4b] bg-[#1a7f4b] text-white'
                          : 'border-line-strong hover:border-fg-subtle dark:border-[#3d3934]'}`}
                    >
                      {task.status === 'DONE' && <Check className="h-3 w-3" strokeWidth={3} />}
                    </button>

                    <button onClick={() => openEdit(task)} className="flex min-w-0 flex-1 flex-col gap-0.5 py-2 text-left">
                      <span className={`truncate text-[13px] ${done ? 'text-fg-faint line-through' : 'font-medium'}`}>
                        {task.title}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-fg-faint">
                        <span>{TASK_TYPE_LABEL[task.type]}</span>
                        {when ? (
                          <span className={`tnum ${late ? 'font-medium text-danger' : ''}`}>{when}</span>
                        ) : (
                          <span className="italic text-fg-subtle">Chưa xếp lịch</span>
                        )}
                        {task.customer?.name && <span className="truncate">· {task.customer.name}</span>}
                        {task.location && (
                          <span className="inline-flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3" /> {task.location}
                          </span>
                        )}
                      </span>
                    </button>

                    {task.priority === 'HIGH' && !done && (
                      <span className="shrink-0 rounded border border-line-strong px-1.5 py-px text-[11px] font-medium dark:border-[#3d3934]">
                        {TASK_PRIORITY_LABEL.HIGH}
                      </span>
                    )}

                    <span
                      className={`whitespace-nowrap inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-2xs ${
                        TASK_STATUS_CLASS[task.status]
                      }`}
                    >
                      {TASK_STATUS_LABEL[task.status]}
                    </span>

                    <button
                      onClick={() => handleDelete(task)}
                      title="Xoá công việc"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-fg-faint transition hover:bg-raised hover:text-danger dark:hover:bg-[#2c2a27]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <TaskCalendar onSelectTask={openEdit} onCreateAt={(d) => { setEditing({ start_at: d } as Task); setIsFormOpen(true); }} />
        )}
      </div>

      {isFormOpen && (
        <TaskFormModal
          task={editing}
          onClose={() => setIsFormOpen(false)}
          onSubmit={(payload) => {
            if (editing?.id) updateTask.mutate({ id: editing.id, ...payload });
            else createTask.mutate(payload);
            setIsFormOpen(false);
          }}
        />
      )}
    </AppLayout>
  );
};

export default TasksPage;

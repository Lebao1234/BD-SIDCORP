import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Task, TaskSummary, TaskStatus, TaskType } from '../types/task';

export type TaskScope = 'today' | 'upcoming' | 'overdue' | 'all';

interface TaskFilters {
  scope: TaskScope;
  status?: TaskStatus | '';
  type?: TaskType | '';
  from?: string;
  to?: string;
}

const buildQuery = (f: TaskFilters): string => {
  const qs = new URLSearchParams();
  qs.append('scope', f.scope);
  qs.append('limit', '200');
  if (f.status) qs.append('status', f.status);
  if (f.type)   qs.append('type', f.type);
  if (f.from)   qs.append('from', f.from);
  if (f.to)     qs.append('to', f.to);
  return qs.toString();
};

export const useTasks = (initial: TaskFilters = { scope: 'all' }) => {
  const [filters, setFilters] = useState<TaskFilters>(initial);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const res = await api.get(`/tasks?${buildQuery(filters)}`);
      return (res.data?.data ?? []) as Task[];
    },
    placeholderData: keepPreviousData,
  });

  // Mọi thao tác ghi đều làm mới cả danh sách lẫn khối "Hôm nay" ở trang chủ,
  // nếu không hai chỗ sẽ hiển thị lệch nhau.
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['taskSummary'] });
  };

  const createTask = useMutation({
    mutationFn: (payload: Partial<Task>) => api.post('/tasks', payload).then((r) => r.data),
    onSuccess: invalidate,
  });

  const updateTask = useMutation({
    mutationFn: ({ id, ...payload }: Partial<Task> & { id: number }) =>
      api.put(`/tasks/${id}`, payload).then((r) => r.data),
    onSuccess: invalidate,
  });

  const deleteTask = useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${id}`).then((r) => r.data),
    onSuccess: invalidate,
  });

  return { tasks: data ?? [], loading: isLoading, filters, setFilters, refetch, createTask, updateTask, deleteTask };
};

export const useTaskSummary = () =>
  useQuery({
    queryKey: ['taskSummary'],
    queryFn: async () => (await api.get('/tasks/summary')).data as TaskSummary,
    refetchInterval: 5 * 60 * 1000,
  });

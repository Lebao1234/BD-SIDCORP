import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { DataTable, Column } from '../../components/Table/DataTable';
import api from '../../services/api';
import {
  Search, CheckCircle, Shield, Trash2, ShieldAlert
} from 'lucide-react';
import { AdminUser } from '../../types';
import { useQueryClient } from '@tanstack/react-query';
import { useUsers } from '../../hooks/useUsers';
import { AppLayout } from '../../components/Layout/AppLayout';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toastNotification, clearToast, refreshNotifications } = useSocket();

  const [searchQuery, setSearchQuery] = useState('');

  // Dùng chung query key ['users'] với các màn hình khác, thay vì tự gọi
  // `/users` trong useEffect và giữ một bản sao state riêng.
  const queryClient = useQueryClient();
  const { users, loading } = useUsers();

  // Mọi thao tác quản trị đều làm mới danh sách dùng chung. Trước đây mỗi
  // handler tự vá mảng trong state cục bộ, nên các màn hình khác vẫn đọc dữ
  // liệu cũ cho tới lần tải lại trang tiếp theo.
  const invalidateUsers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  }, [queryClient]);

  const handleApprove = useCallback(async (id: number) => {
    try {
      await api.patch(`/users/${id}/approve`);
      invalidateUsers();
    } catch (err) {
      console.error('Lỗi duyệt user:', err);
      alert('Không thể duyệt người dùng này');
    }
  }, [invalidateUsers]);

  const handleChangeRole = useCallback(async (id: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Bạn có chắc muốn đổi quyền thành ${newRole.toUpperCase()}?`)) return;

    try {
      await api.patch(`/users/${id}/role`, { role: newRole });
      invalidateUsers();
    } catch (err) {
      console.error('Lỗi đổi quyền:', err);
      alert('Không thể đổi quyền');
    }
  }, [invalidateUsers]);

  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này vĩnh viễn?')) return;

    try {
      await api.delete(`/users/${id}`);
      invalidateUsers();
    } catch (err) {
      console.error('Lỗi xóa user:', err);
      alert('Lỗi khi xóa người dùng');
    }
  }, [invalidateUsers]);

  // useMemo: tránh filter lại mỗi lần component re-render vì lý do khác
  const filteredUsers = useMemo(() =>
    users.filter(u =>
      u.role !== 'admin' && (
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    ),
    [users, searchQuery]
  );

  // useMemo: columns chứa closures với handlers — memoize để DataTable không mất tối ưu
  const columns = useMemo<Column<AdminUser>[]>(() => [
    { key: 'id', title: 'ID', width: '50px' },
    {
      key: 'name',
      title: 'Người dùng',
      render: (u) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-fg dark:text-[#f2f0ed]">{u.name || 'Chưa cập nhật'}</span>
          <span className="text-xs text-fg-subtle dark:text-[#8f8b84]">{u.email}</span>
        </div>
      )
    },
    {
      key: 'role',
      title: 'Quyền',
      render: (u) => (
        <span className="inline-flex h-[22px] items-center rounded-chip border border-line px-2 text-[11px]
          text-fg-body dark:border-[#3d3934] dark:text-[#cdc9c2]">
          {u.role === 'admin' ? 'Quản trị' : 'Nhân viên'}
        </span>
      )
    },
    {
      key: 'approved',
      title: 'Trạng thái',
      render: (u) => (
        <span className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: u.approved ? '#1a7f4b' : '#b5730f' }}
          />
          {u.approved ? 'Đã duyệt' : 'Chờ duyệt'}
        </span>
      )
    },
    {
      key: 'actions' as keyof AdminUser,
      title: 'Thao tác',
      render: (u) => (
        <div className="flex items-center gap-1">
          {!u.approved && (
            <button
              onClick={() => handleApprove(u.id)}
              className="flex h-7 w-7 items-center justify-center rounded-control text-fg-subtle transition
                hover:bg-raised hover:text-ok dark:text-[#8f8b84] dark:hover:bg-[#2c2a27]"
              title="Phê duyệt tài khoản"
            >
              <CheckCircle className="h-4 w-4" strokeWidth={1.7} />
            </button>
          )}
          <button
            onClick={() => handleChangeRole(u.id, u.role)}
            className="flex h-7 w-7 items-center justify-center rounded-control text-fg-subtle transition
              hover:bg-raised hover:text-fg dark:text-[#8f8b84] dark:hover:bg-[#2c2a27] dark:hover:text-[#f2f0ed]"
            title="Đổi quyền hạn"
          >
            {u.role === 'admin' ? <ShieldAlert className="h-4 w-4" strokeWidth={1.7} /> : <Shield className="h-4 w-4" strokeWidth={1.7} />}
          </button>
          <button
            onClick={() => handleDelete(u.id)}
            className="flex h-7 w-7 items-center justify-center rounded-control text-fg-subtle transition
              hover:bg-raised hover:text-danger dark:text-[#8f8b84] dark:hover:bg-[#2c2a27]"
            title="Xóa tài khoản"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.7} />
          </button>
        </div>
      )
    }
  ], [handleApprove, handleChangeRole, handleDelete]);

  return (
    <AppLayout isAdminPage={true} onSelectCustomer={(id) => navigate(`/customers?customerId=${id}`)}>
      {/* TOAST NOTIFICATION */}
      {toastNotification && (
        <div className="animate-fade-in fixed right-6 top-20 z-[9999] max-w-sm rounded-card border border-line
          bg-surface p-3.5 shadow-[0_4px_16px_rgba(28,27,25,0.10)]
          dark:border-[#332f2c] dark:bg-[#232120]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <h4 className="text-[13px] font-semibold text-fg dark:text-[#f2f0ed]">{toastNotification.title}</h4>
              <p className="text-xs text-fg-muted dark:text-[#a8a49d]">{toastNotification.content}</p>
            </div>
            <button
              onClick={() => { clearToast(); refreshNotifications(); }}
              className="shrink-0 text-xs text-fg-faint transition hover:text-fg dark:text-[#7f7b74] dark:hover:text-[#f2f0ed]"
            >
              Đóng
            </button>
          </div>
          {toastNotification.customerId && (
            <button
              onClick={() => {
                navigate(`/customers?customerId=${toastNotification.customerId}`);
                clearToast();
              }}
              className="mt-2 block text-xs font-medium text-brand-text transition hover:text-[#8f4114]
                dark:text-[#f0955a] dark:hover:text-[#f5b183]"
            >
              Mở chi tiết khách hàng →
            </button>
          )}
        </div>
      )}

      {/* Main Workspace Content */}
      <div className="flex flex-col gap-[18px]">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1">
            <h1 className="text-[19px] font-semibold tracking-[-0.01em] text-fg dark:text-[#f2f0ed]">
              Người dùng hệ thống
            </h1>
            <p className="tnum text-xs text-fg-subtle dark:text-[#8f8b84]">
              {filteredUsers.length} tài khoản · {filteredUsers.filter((u) => !u.approved).length} chờ duyệt
            </p>
          </div>

          <div className="relative w-full sm:ml-auto sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-fg-faint" strokeWidth={1.9} />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[30px] w-full rounded-control border border-line bg-surface pl-8 pr-3 text-xs
                text-fg placeholder-fg-faint dark:border-[#332f2c] dark:bg-[#232120] dark:text-[#f2f0ed]"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredUsers}
          keyExtractor={(u) => u.id.toString()}
          isLoading={loading}
          emptyMessage="Không có người dùng nào."
        />
      </div>
    </AppLayout>
  );
};

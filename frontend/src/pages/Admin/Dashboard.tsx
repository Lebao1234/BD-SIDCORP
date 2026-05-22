import React, { useState, useEffect } from 'react';
import { InternalChat } from '../../components/InternalChat';
import { useAuth } from '../../context/AuthContext';
import { DataTable, Column } from '../../components/Table/DataTable';
import api from '../../services/api';
import {
  Users, Search, LogOut, CheckCircle, Shield, Trash2, ShieldAlert
} from 'lucide-react';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  approved: boolean;
}

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Lỗi lấy danh sách người dùng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await api.patch(`/users/${id}/approve`);
      setUsers(users.map(u => u.id === id ? { ...u, approved: true } : u));
    } catch (err) {
      console.error('Lỗi duyệt user:', err);
      alert('Không thể duyệt người dùng này');
    }
  };

  const handleChangeRole = async (id: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Bạn có chắc muốn đổi quyền thành ${newRole.toUpperCase()}?`)) return;

    try {
      await api.patch(`/users/${id}/role`, { role: newRole });
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Lỗi đổi quyền:', err);
      alert('Không thể đổi quyền');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này vĩnh viễn?')) return;

    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error('Lỗi xóa user:', err);
      alert('Lỗi khi xóa người dùng');
    }
  };

  const filteredUsers = users.filter(u =>
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column<AdminUser>[] = [
    { key: 'id', title: 'ID', width: '50px' },
    {
      key: 'name',
      title: 'Thông tin User',
      render: (u) => (
        <div>
          <p className="font-bold text-white">{u.name || 'Chưa cập nhật'}</p>
          <p className="text-xs text-slate-400">{u.email}</p>
        </div>
      )
    },
    {
      key: 'role',
      title: 'Quyền',
      render: (u) => (
        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
          u.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-500/20 text-slate-300'
        }`}>
          {u.role}
        </span>
      )
    },
    {
      key: 'approved',
      title: 'Trạng thái',
      render: (u) => (
        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
          u.approved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {u.approved ? 'Đã duyệt' : 'Chờ duyệt'}
        </span>
      )
    },
    {
      key: 'id',
      title: 'Thao tác',
      render: (u) => (
        <div className="flex items-center gap-2">
          {!u.approved && (
            <button
              onClick={() => handleApprove(u.id)}
              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded transition"
              title="Phê duyệt tài khoản"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleChangeRole(u.id, u.role)}
            className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded transition"
            title="Đổi quyền hạn"
          >
            {u.role === 'admin' ? <ShieldAlert className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleDelete(u.id)}
            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded transition"
            title="Xóa tài khoản"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="h-screen flex flex-col bg-[#070b13] text-slate-100 overflow-hidden">
      {/* HEADER */}
      <header className="glass-panel border-b border-slate-900 px-6 py-3.5 flex items-center justify-between shrink-0 bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="bg-yellow-600 p-2 rounded-xl text-white shadow-lg shadow-yellow-500/10">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-wide">Quản trị Hệ thống</h1>
            <p className="text-[10px] text-yellow-400 font-semibold tracking-wider">ADMIN DASHBOARD</p>
          </div>
        </div>

        {/* Cụm công cụ bên phải */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <span className="text-xs font-bold text-slate-200 block">{user?.name}</span>
            <span className="text-[9px] text-slate-500 font-semibold uppercase">@{user?.email} • {user?.role}</span>
          </div>

          <button
            onClick={logout}
            className="p-2.5 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 hover:text-rose-300 rounded-xl border border-rose-950/40 transition"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Trò chuyện nội bộ */}
        <aside className="w-80 border-r border-slate-900 flex flex-col shrink-0 bg-[#090e18]/45">
          <InternalChat embedded={true} />
        </aside>

        {/* Right Content Area: Danh sách người dùng */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-500" />
              Danh sách Người dùng
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition"
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
        </main>
      </div>
    </div>
  );
};

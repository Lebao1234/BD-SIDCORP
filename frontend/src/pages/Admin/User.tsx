import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Header } from '../../components/Header';
import { Shield, ShieldAlert, Check, X, Trash2, RefreshCw } from 'lucide-react';

interface User {
  id: number;
  name: string | null;
  email: string;
  role: 'admin' | 'user';
  approved: boolean;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  const handleToggleApproval = async (id: number, currentStatus: boolean) => {
    setProcessingId(id);
    try {
      await api.put(`/users/${id}`, { approved: !currentStatus });
      setUsers(users.map(u => u.id === id ? { ...u, approved: !currentStatus } : u));
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái duyệt:', err);
      alert('Không thể cập nhật trạng thái người dùng');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleRole = async (id: number, currentRole: 'admin' | 'user') => {
    setProcessingId(id);
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.put(`/users/${id}`, { role: newRole });
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Lỗi đổi quyền:', err);
      alert('Không thể cập nhật phân quyền');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn người dùng này?')) return;
    setProcessingId(id);
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error('Lỗi xóa user:', err);
      alert('Lỗi: Không thể tự xóa tài khoản của mình hoặc tài khoản có ràng buộc dữ liệu');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#070b13] overflow-y-auto custom-scrollbar">
      <Header />
      
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-yellow-500" />
              Quản lý Người Dùng
            </h1>
            <p className="text-slate-400 mt-2">Duyệt tài khoản mới đăng ký và phân quyền hệ thống</p>
          </div>
          
          <button 
            onClick={fetchUsers} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-yellow-500 hover:bg-slate-800 rounded-xl transition shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        <div className="glass-panel rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4 font-semibold">Tài khoản</th>
                  <th className="px-6 py-4 font-semibold text-center">Phân quyền</th>
                  <th className="px-6 py-4 font-semibold text-center">Trạng thái duyệt</th>
                  <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-yellow-500/50" />
                      Đang tải danh sách người dùng...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      Chưa có người dùng nào trên hệ thống.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-yellow-500 font-bold shadow-inner">
                            {u.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-200">{u.name || 'Người dùng ẩn danh'}</div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleRole(u.id, u.role)}
                          disabled={processingId === u.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                            u.role === 'admin' 
                              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20' 
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                          } disabled:opacity-50`}
                          title="Click để đổi quyền"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          {u.role === 'admin' ? 'Admin' : 'Nhân viên'}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleApproval(u.id, u.approved)}
                          disabled={processingId === u.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                            u.approved 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                          } disabled:opacity-50`}
                          title={u.approved ? "Khóa tài khoản" : "Duyệt tài khoản"}
                        >
                          {u.approved ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          {u.approved ? 'Đã duyệt' : 'Chờ duyệt'}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={processingId === u.id}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition disabled:opacity-50"
                          title="Xóa người dùng"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

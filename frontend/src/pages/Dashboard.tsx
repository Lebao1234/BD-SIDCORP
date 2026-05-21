import React, { useState, useEffect } from 'react';
import { CustomerProfile } from '../components/CustomerProfile';
import { CustomerNoteTimeline } from '../components/CustomerNoteTimeline';
import { AttachmentManager, Attachment } from '../components/AttachmentManager';
import { NotificationBell } from '../components/NotificationBell';
import { InternalChat } from '../components/InternalChat';
import { useAuth, User } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { 
  Users, Plus, Search, LogOut, MessageSquare, 
  TrendingUp, FileCheck, PhoneCall, AlertCircle, RefreshCw, Sparkles 
} from 'lucide-react';

export interface Customer {
  id: string;
  name: string;
  company?: string;
  industry?: string;
  price: number;
  status: string;
  email: string;
  phone: string;
  location?: string;
  source?: string;
  appointment?: string;
  description?: string;
  createdAt: string;
  attachments?: Attachment[];
  notes?: any[];
}

export const Dashboard: React.FC = () => {
  const { user, logout, quickSwitch } = useAuth();
  const { toastNotification, clearToast, refreshNotifications } = useSocket();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Drawers States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Form add customer state
  const [newCustomerData, setNewCustomerData] = useState({
    name: '', company: '', industry: '', price: '',
    status: 'NEW', email: '', phone: '', location: '',
    source: 'Facebook Ads', appointment: '', description: ''
  });
  
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<User[]>([]);

  // Tải danh sách khách hàng
  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (err) {
      console.error('Không thể lấy danh sách khách hàng:', err);
    }
  };

  // Tải danh sách các tài khoản nhân viên (cho switcher tài khoản)
  const fetchAvailableAccounts = async () => {
    try {
      const res = await api.get('/auth/users');
      setAvailableAccounts(res.data);
    } catch (err) {
      console.error('Không thể lấy danh sách tài khoản demo:', err);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchAvailableAccounts();
  }, []);

  // Tải thông tin chi tiết khi chọn 1 khách hàng cụ thể
  useEffect(() => {
    if (!selectedCustomerId) {
      setSelectedCustomer(null);
      return;
    }
    const fetchCustomerDetail = async () => {
      try {
        const response = await api.get(`/customers/${selectedCustomerId}`);
        setSelectedCustomer(response.data);
      } catch (err) {
        console.error('Không thể lấy chi tiết khách hàng:', err);
      }
    };
    fetchCustomerDetail();
  }, [selectedCustomerId]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await api.post('/customers', {
        ...newCustomerData,
        price: newCustomerData.price ? Number(newCustomerData.price) : 0,
        appointment: newCustomerData.appointment ? new Date(newCustomerData.appointment).toISOString() : null
      });
      setCustomers(prev => [res.data, ...prev]);
      setSelectedCustomerId(res.data.id);
      setIsAddModalOpen(false);
      // Reset form
      setNewCustomerData({
        name: '', company: '', industry: '', price: '',
        status: 'NEW', email: '', phone: '', location: '',
        source: 'Facebook Ads', appointment: '', description: ''
      });
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Không thể tạo khách hàng.');
    }
  };

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
  };

  // Callback khi cập nhật thông tin thành công từ panel con
  const handleCustomerUpdated = (updated: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    setSelectedCustomer(prev => prev ? { ...prev, ...updated } : null);
  };

  // Callback khi thêm Note mới
  const handleNoteAdded = (newNote: any) => {
    if (selectedCustomer) {
      setSelectedCustomer({
        ...selectedCustomer,
        notes: [newNote, ...(selectedCustomer.notes || [])]
      });
    }
  };

  // Callback upload file đính kèm
  const handleAttachmentUploaded = (newFile: Attachment) => {
    if (selectedCustomer) {
      setSelectedCustomer({
        ...selectedCustomer,
        attachments: [newFile, ...(selectedCustomer.attachments || [])]
      });
    }
  };

  const handleAttachmentDeleted = (fileId: string) => {
    if (selectedCustomer) {
      setSelectedCustomer({
        ...selectedCustomer,
        attachments: (selectedCustomer.attachments || []).filter(a => a.id !== fileId)
      });
    }
  };

  // Lọc danh sách khách hàng theo truy vấn tìm kiếm
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  // Thống kê sơ bộ
  const totalValue = customers.reduce((sum, c) => sum + Number(c.price || 0), 0);
  const signedCount = customers.filter(c => c.status === 'SIGNED').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#070b13] text-slate-100 relative">
      {/* 1. TOAST THÔNG BÁO REALTIME (HIỂN THỊ NỔI KHI BỊ TAG) */}
      {toastNotification && (
        <div className="fixed top-20 right-6 z-[9999] max-w-sm glass-panel p-4 rounded-xl border-l-4 border-yellow-500 shadow-2xl animate-bounce">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h4 className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {toastNotification.title}
              </h4>
              <p className="text-xs text-slate-200 mt-1">{toastNotification.content}</p>
            </div>
            <button 
              onClick={() => {
                clearToast();
                refreshNotifications();
              }}
              className="text-slate-500 hover:text-white text-xs"
            >
              Đóng
            </button>
          </div>
          {toastNotification.customerId && (
            <button
              onClick={() => {
                setSelectedCustomerId(toastNotification.customerId!);
                clearToast();
              }}
              className="text-[10px] text-yellow-400 font-bold underline mt-2 block"
            >
              Mở chi tiết khách hàng →
            </button>
          )}
        </div>
      )}

      {/* 2. HEADER */}
      <header className="glass-panel border-b border-slate-900 px-6 py-3.5 flex items-center justify-between shrink-0 sticky top-0 z-40 bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="bg-yellow-600 p-2 rounded-xl text-white shadow-lg shadow-yellow-500/10">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-wide">BD LightHuman</h1>
            <p className="text-[10px] text-yellow-400 font-semibold tracking-wider">HỆ THỐNG QUẢN TRỊ NỘI BỘ</p>
          </div>
        </div>

        {/* Cụm công cụ bên phải */}
        <div className="flex items-center gap-4">
          {/* Quick Account Switcher (Tuyệt vời để Test Realtime) */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1">
            <span className="text-[10px] font-bold text-slate-500">SWITCH USER:</span>
            <div className="flex gap-1">
              {availableAccounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={async () => {
                    // Do đây là hệ thống test nội bộ, ta login giả định bằng username
                    // Để đơn giản, ta switch thẳng:
                    // Gọi API login của account này lấy token mới
                    try {
                      const res = await api.post('/auth/login', { username: acc.username, password: '123' });
                      quickSwitch(res.data.user, res.data.token);
                    } catch (e) {
                      alert('Switch lỗi. Vui lòng đảm bảo đã seed dữ liệu!');
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                    user?.id === acc.id 
                      ? 'bg-yellow-600/20 text-yellow-400 border-yellow-500/40' 
                      : 'bg-transparent text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {acc.fullName.split(' ').pop()}
                </button>
              ))}
            </div>
          </div>

          {/* User Info */}
          <div className="text-right hidden md:block">
            <span className="text-xs font-bold text-slate-200 block">{user?.fullName}</span>
            <span className="text-[9px] text-slate-500 font-semibold uppercase">@{user?.username} • {user?.role}</span>
          </div>

          {/* Realtime Notification Bell */}
          <NotificationBell onSelectCustomer={handleSelectCustomer} />

          {/* Chat Toggle Button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition flex items-center gap-1.5 font-medium text-xs relative"
          >
            <MessageSquare className="w-5 h-5 text-yellow-400" />
            <span className="hidden sm:inline">Trò chuyện</span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2.5 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 hover:text-rose-300 rounded-xl border border-rose-950/40 transition"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 3. MAIN WORKSPACE CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Danh sách khách hàng */}
        <aside className="w-80 border-r border-slate-900 flex flex-col shrink-0 bg-[#090e18]/45">
          {/* Nút thêm & Tìm kiếm */}
          <div className="p-4 space-y-3 shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-yellow-500/5"
            >
              <Plus className="w-4 h-4" />
              Thêm Khách Hàng Mới
            </button>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm tên, email, sđt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition"
              />
            </div>
          </div>

          {/* List Khách hàng */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                Không tìm thấy khách hàng nào hợp lệ.
              </div>
            ) : (
              filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCustomer(c.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col gap-1.5 ${
                    selectedCustomerId === c.id
                      ? 'bg-yellow-950/15 border-yellow-500/40 text-white shadow-md'
                      : 'bg-slate-900/30 border-slate-850 hover:border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 w-full">
                    <h4 className="text-xs font-bold truncate max-w-[70%]">{c.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                      c.status === 'SIGNED' ? 'bg-yellow-500/20 text-yellow-400' :
                      c.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' :
                      c.status === 'QUOTED' ? 'bg-blue-500/20 text-blue-400' :
                      c.status === 'CONSULTING' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {c.status === 'SIGNED' ? 'Ký HĐ' :
                       c.status === 'REJECTED' ? 'Từ chối' :
                       c.status === 'QUOTED' ? 'Gửi báo giá' :
                       c.status === 'CONSULTING' ? 'Tư vấn' :
                       'Mới'}
                    </span>
                  </div>
                  {c.company && (
                    <span className="text-[10px] text-slate-500 font-medium truncate">{c.company}</span>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{c.phone}</span>
                    <span className="font-semibold text-slate-300">{Number(c.price).toLocaleString()} đ</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Right Content Area: Panel Chi tiết và Timeline */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {selectedCustomer ? (
            /* Có khách hàng đang chọn -> Load hồ sơ */
            <div className="space-y-6 animate-fade-in">
              {/* Profile details & Timeline */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <CustomerProfile 
                  customer={selectedCustomer} 
                  onUpdate={handleCustomerUpdated} 
                />
                <CustomerNoteTimeline
                  customerId={selectedCustomer.id}
                  notes={selectedCustomer.notes || []}
                  onNoteAdded={handleNoteAdded}
                />
              </div>

              {/* Fixed Attachments ở dưới cùng */}
              <AttachmentManager
                customerId={selectedCustomer.id}
                attachments={selectedCustomer.attachments || []}
                onAttachmentUploaded={handleAttachmentUploaded}
                onAttachmentDeleted={handleAttachmentDeleted}
              />
            </div>
          ) : (
            /* Chưa chọn khách hàng -> Hiện Stats */
            <div className="h-full flex flex-col justify-center items-center max-w-4xl mx-auto py-12 text-center animate-fade-in">
              <div className="bg-yellow-600/10 border border-yellow-500/20 p-4 rounded-3xl mb-6">
                <Users className="w-12 h-12 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">Chào mừng tới Hệ thống Quản trị CRM & Chat nội bộ</h2>
              <p className="text-sm text-slate-400 mt-2 max-w-md">
                Chọn một khách hàng ở danh sách bên trái hoặc nhấn nút Thêm khách hàng mới để bắt đầu chăm sóc và trao đổi thông tin.
              </p>

              {/* Grid Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mt-12">
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-left">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Tổng số Khách hàng</span>
                  <span className="text-2xl font-black text-white mt-1 block">{customers.length}</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Khách hàng trong CSDL</span>
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-left">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Doanh thu dự kiến</span>
                  <span className="text-2xl font-black text-yellow-400 mt-1 block">{totalValue.toLocaleString()} đ</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Giá trị của các thương vụ</span>
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-left">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Hợp đồng đã chốt</span>
                  <span className="text-2xl font-black text-white mt-1 block">{signedCount}</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Trạng thái đã ký thành công</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Slide-out Internal Chat Drawer */}
      <InternalChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* 4. MODAL THÊM KHÁCH HÀNG MỚI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="glass-panel p-6 rounded-2xl shadow-2xl z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4 pb-2 border-b border-slate-800">Thêm Khách Hàng Mới</h3>
            
            {formError && (
              <div className="p-3 mb-4 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Tên khách hàng/Đối tác *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerData.name}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Công ty</label>
                  <input
                    type="text"
                    value={newCustomerData.company}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, company: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none"
                    placeholder="Tên doanh nghiệp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Thư điện tử (Email) *</label>
                  <input
                    type="email"
                    required
                    value={newCustomerData.email}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none"
                    placeholder="example@mail.com"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerData.phone}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none"
                    placeholder="0901234567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Lĩnh vực kinh doanh</label>
                  <input
                    type="text"
                    value={newCustomerData.industry}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, industry: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none"
                    placeholder="Ví dụ: Bất động sản"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Giá trị hợp đồng (VNĐ)</label>
                  <input
                    type="number"
                    value={newCustomerData.price}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, price: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none"
                    placeholder="Số tiền dự kiến"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Địa chỉ / Địa điểm</label>
                  <input
                    type="text"
                    value={newCustomerData.location}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, location: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none"
                    placeholder="Hà Nội, TP.HCM..."
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Nguồn khách</label>
                  <select
                    value={newCustomerData.source}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, source: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                  >
                    <option value="Facebook Ads">Facebook Ads</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Website">Website</option>
                    <option value="Khách tự tìm">Khách tự tìm</option>
                    <option value="Giới thiệu">Giới thiệu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">Lịch hẹn chăm sóc tiếp theo</label>
                <input
                  type="datetime-local"
                  value={newCustomerData.appointment}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, appointment: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">Mô tả ban đầu</label>
                <textarea
                  rows={2}
                  value={newCustomerData.description}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none resize-none"
                  placeholder="Ghi chú ban đầu khi nhận khách..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-bold"
                >
                  Tạo mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CustomerNoteTimeline } from '../../components/Customer/CustomerNoteTimeline';
import { AttachmentManager, Attachment } from '../../components/Customer/AttachmentManager';
import { CustomerProfile } from '../../components/Customer/CustomerProfile';
import { NotificationBell } from '../../components/NotificationBell';

import { useAuth, User } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { DataTable, Column } from '../../components/Table/DataTable';
import api from '../../services/api';
import {
  Users, Plus, Search, LogOut, TrendingUp, Sparkles, X,
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface NoteWriter {
  id: string;
  name: string;
}

/** Khớp với response từ backend (Exchange Prisma model) */
export interface NoteResponse {
  id: number;
  content: string;
  created_at: string;
  writer: NoteWriter;
}

/** Shape dùng trong frontend - Đã được đồng bộ với backend */
export interface FrontendNoteResponse {
  id: number;
  content: string;
  created_at: string;
  customer_id: number;
  writer: NoteWriter;
}

// Note — khớp với CustomerNoteTimeline interface
export interface Note {
  id?: string;
  _id?: string;
  customerId: string;         // map từ customer_id
  authorId: string;           // map từ writer.id
  authorName: string;         // map từ writer.name
  content: string;
  createdAt: string;          // map từ created_at
}


export interface Customer {
  id: string | number;
  name: string;
  company_id?: number | null;
  company?: string | { id: number; name: string };
  field?: string;
  price: number;
  status: string;
  email: string;
  phone_number: string;
  location?: string;
  from_source?: string;
  appointment?: string;
  note?: string;
  created_at: string;
  updated_at?: string;
  address?: string;
  classified?: string;
  attachments?: Attachment[];
  notes?: Note[];
}

interface NewCustomerForm {
  name: string;
  company_id: string;
  field: string;
  price: string;
  status: string;
  email: string;
  phone_number: string;
  location: string;
  from_source: string;
  appointment: string;
  note: string;
}

const INITIAL_FORM: NewCustomerForm = {
  name: '', company_id: '', field: '', price: '',
  status: 'NEW', email: '', phone_number: '', location: '',
  from_source: 'Facebook Ads', appointment: '', note: '',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  SIGNED:     'Ký HĐ',
  REJECTED:   'Từ chối',
  QUOTED:     'Gửi báo giá',
  CONSULTING: 'Tư vấn',
  NEW:        'Mới',
};

const STATUS_CLASS: Record<string, string> = {
  SIGNED:     'bg-yellow-500/20 text-yellow-400',
  REJECTED:   'bg-rose-500/20 text-rose-400',
  QUOTED:     'bg-blue-500/20 text-blue-400',
  CONSULTING: 'bg-amber-500/20 text-amber-400',
  NEW:        'bg-slate-500/20 text-slate-400',
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { toastNotification, clearToast, refreshNotifications } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [customers, setCustomers]             = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(searchParams.get('customerId'));
  const [selectedCustomer, setSelectedCustomer]     = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery]         = useState('');
  const [loading, setLoading]                 = useState(true);
  const [isAddModalOpen, setIsAddModalOpen]   = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState<NewCustomerForm>(INITIAL_FORM);
  const [formError, setFormError]             = useState('');
  const [team, setTeam]                       = useState<User[]>([]);

  // ── Fetch danh sách team cho mention ───────────────────────────────────────
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await api.get('/users');
        setTeam(response.data);
      } catch (err) {
        console.error('Không thể lấy danh sách team:', err);
      }
    };
    fetchTeam();
  }, []);

  // ── Fetch danh sách khách hàng ─────────────────────────────────────────────

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<Customer[]>('/customers');
      setCustomers(response.data);
    } catch (err) {
      console.error('Không thể lấy danh sách khách hàng:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCustomers();
  }, [fetchCustomers]);

  // ── Fetch chi tiết khi chọn customer ──────────────────────────────────────

  useEffect(() => {
    if (!selectedCustomerId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCustomer(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        const response = await api.get<any>(`/customers/${selectedCustomerId}`);
        const data = response.data;
        
        // Map exchanges to notes
        const mappedNotes: Note[] = (data.exchanges || []).map((ex: any) => ({
          id: ex.id,
          customerId: ex.customer_id,
          authorId: ex.writer_id || ex.writer?.id,
          authorName: ex.writer?.name || 'Unknown',
          content: ex.content,
          createdAt: ex.created_at,
        }));
        
        setSelectedCustomer({ ...data, notes: mappedNotes });
        setIsDetailModalOpen(true);
      } catch (err) {
        console.error('Không thể lấy chi tiết khách hàng:', err);
      }
    };

    fetchDetail();
  }, [selectedCustomerId]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    setSearchParams({ customerId: id });
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedCustomerId(null);
    setSearchParams({});
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await api.post<Customer>('/customers', {
        ...newCustomerData,
        price:       newCustomerData.price ? Number(newCustomerData.price) : 0,
        appointment: newCustomerData.appointment
          ? new Date(newCustomerData.appointment).toISOString()
          : null,
      });
      setCustomers(prev => [res.data, ...prev]);
      setIsAddModalOpen(false);
      setNewCustomerData(INITIAL_FORM);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })
        .response?.data?.error ?? 'Không thể tạo khách hàng.';
      setFormError(message);
    }
  };

  const handleCustomerUpdated = (updated: Customer) => {
    setCustomers(prev =>
      prev.map(c => c.id === updated.id ? { ...c, ...updated } : c)
    );
    setSelectedCustomer(prev => prev ? { ...prev, ...updated } : null);
  };

  /** Nhận raw NoteResponse từ CustomerNoteTimeline, map rồi prepend vào state */
  const handleNoteAdded = (note: Note) => {
    setSelectedCustomer(prev =>
    prev ? { ...prev, notes: [note, ...(prev.notes ?? [])] } : null
  );
  };

  const handleAttachmentUploaded = (newFile: Attachment) => {
    setSelectedCustomer(prev =>
      prev ? { ...prev, attachments: [newFile, ...(prev.attachments ?? [])] } : null
    );
  };

  const handleAttachmentDeleted = (fileId: string) => {
    setSelectedCustomer(prev =>
      prev
        ? { ...prev, attachments: (prev.attachments ?? []).filter(a => a.id !== fileId) }
        : null
    );
  };

  const handleFormChange = (field: keyof NewCustomerForm, value: string) => {
    setNewCustomerData(prev => ({ ...prev, [field]: value }));
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone_number && c.phone_number.includes(q))
    );
  });

  // ── Table columns ──────────────────────────────────────────────────────────

  const customerColumns: Column<Customer>[] = [
    {
      key: 'id',
      title: 'ID',
      render: (c) => <span className="text-slate-400 text-xs font-bold">#{c.id}</span>,
    },
    {
      key: 'name',
      title: 'Họ và tên',
      render: (c) => (
        <span
          className="font-bold text-white hover:underline cursor-pointer"
          onClick={() => handleSelectCustomer(c.id.toString())}
        >
          {c.name}
        </span>
      ),
    },
    {
      key: 'company',
      title: 'Công ty',
      render: (c) => (
        <span className="text-xs text-slate-300 font-medium">
          {c.company ? (typeof c.company === 'string' ? c.company : c.company.name) : '-'}
        </span>
      ),
    },
    {
      key: 'field',
      title: 'Lĩnh vực',
      render: (c) => <span className="text-xs text-slate-300">{c.field || '-'}</span>,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (c) => (
        <span
          className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
            STATUS_CLASS[c.status] ?? STATUS_CLASS.NEW
          }`}
        >
          {STATUS_LABEL[c.status] ?? c.status}
        </span>
      ),
    },
    {
      key: 'classified',
      title: 'Phân loại',
      render: (c) => {
        const cl = (c as any).classified;
        return <span className={`text-xs font-bold ${cl === 'VIP' ? 'text-amber-400' : 'text-slate-300'}`}>{cl || '-'}</span>;
      },
    },
    {
      key: 'from_source',
      title: 'Nguồn khách hàng',
      render: (c) => <span className="text-xs text-slate-300">{c.from_source || '-'}</span>,
    },
    {
      key: 'price',
      title: 'Giá trị HĐ',
      render: (c) => (
        <span className="font-semibold text-yellow-400">
          {Number(c.price ?? 0).toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      key: 'phone_number',
      title: 'Số điện thoại',
      render: (c) => <span className="text-xs text-slate-300">{c.phone_number || '-'}</span>,
    },
    {
      key: 'email',
      title: 'Email',
      render: (c) => <span className="text-xs text-slate-300">{c.email || '-'}</span>,
    },
    {
      key: 'location',
      title: 'Khu vực',
      render: (c) => <span className="text-xs text-slate-300 truncate max-w-[100px] inline-block" title={c.location}>{c.location || '-'}</span>,
    },
    {
      key: 'address',
      title: 'Địa chỉ',
      render: (c) => <span className="text-xs text-slate-300 truncate max-w-[120px] inline-block" title={c.address}>{c.address || '-'}</span>,
    },
    {
      key: 'appointment',
      title: 'Lịch hẹn',
      render: (c) => <span className="text-xs text-slate-300">{c.appointment ? new Date(c.appointment).toLocaleDateString('vi-VN') : '-'}</span>,
    },
    {
      key: 'note',
      title: 'Ghi chú',
      render: (c) => <span className="text-xs text-slate-300 truncate max-w-[150px] inline-block" title={c.note}>{c.note || '-'}</span>,
    },
    {
      key: 'created_at',
      title: 'Ngày tạo',
      render: (c) => <span className="text-slate-400 text-[10px]">{new Date(c.created_at).toLocaleDateString('vi-VN')}</span>,
    },
    {
      key: 'updated_at',
      title: 'Ngày cập nhật',
      render: (c) => {
        const dateStr = (c as any).updated_at;
        return <span className="text-slate-400 text-[10px]">{dateStr ? new Date(dateStr).toLocaleDateString('vi-VN') : ''}</span>;
      },
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-[#070b13] text-slate-100 overflow-hidden relative">

      {/* TOAST NOTIFICATION */}
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
              onClick={() => { clearToast(); refreshNotifications(); }}
              className="text-slate-500 hover:text-white text-xs"
            >
              Đóng
            </button>
          </div>
          {toastNotification.customerId && (
            <button
              onClick={() => {
                handleSelectCustomer(toastNotification.customerId!);
                clearToast();
              }}
              className="text-[10px] text-yellow-400 font-bold underline mt-2 block"
            >
              Mở chi tiết khách hàng →
            </button>
          )}
        </div>
      )}

      {/* HEADER */}
      <header className="glass-panel border-b border-slate-900 px-6 py-3.5 flex items-center justify-between shrink-0 bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="bg-yellow-600 p-2 rounded-xl text-white shadow-lg shadow-yellow-500/10">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-wide">BD LightHuman</h1>
            <p className="text-[10px] text-yellow-400 font-semibold tracking-wider">HỆ THỐNG CRM TƯ VẤN</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <span className="text-xs font-bold text-slate-200 block">{user?.name}</span>
            <span className="text-[9px] text-slate-500 font-semibold uppercase">
              @{user?.email} • {user?.role}
            </span>
          </div>
          
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-3 rounded-xl transition"
            >
              Quản trị Users
            </button>
          )}

          <NotificationBell onSelectCustomer={handleSelectCustomer} />
          <button
            onClick={logout}
            className="p-2.5 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 hover:text-rose-300 rounded-xl border border-rose-950/40 transition"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">



        {/* Danh sách khách hàng */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-500" />
              Danh sách Khách hàng
            </h2>

            <div className="flex gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Tìm khách hàng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition"
                />
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition shadow-lg shadow-yellow-500/10"
              >
                <Plus className="w-4 h-4" />
                Thêm Khách Hàng
              </button>
            </div>
          </div>

          <DataTable
            columns={customerColumns}
            data={filteredCustomers}
            keyExtractor={(c) => c.id.toString()}
            isLoading={loading}
            emptyMessage="Không có khách hàng nào."
          />
        </main>
      </div>

      {/* MODAL THÊM KHÁCH HÀNG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="glass-panel p-6 rounded-2xl shadow-2xl z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4 pb-2 border-b border-slate-800">
              Thêm Khách Hàng Mới
            </h3>

            {formError && (
              <div className="p-3 mb-4 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Tên khách hàng *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-yellow-500 transition"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerData.phone_number}
                    onChange={(e) => handleFormChange('phone_number', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-yellow-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newCustomerData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-yellow-500 transition"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Giá trị dự kiến</label>
                  <input
                    type="number"
                    value={newCustomerData.price}
                    onChange={(e) => handleFormChange('price', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-yellow-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Lĩnh vực (Field)</label>
                  <input
                    type="text"
                    value={newCustomerData.field}
                    onChange={(e) => handleFormChange('field', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-yellow-500 transition"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Nguồn (Source)</label>
                  <select
                    value={newCustomerData.from_source}
                    onChange={(e) => handleFormChange('from_source', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-yellow-500 transition"
                  >
                    <option value="Facebook Ads">Facebook Ads</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Website">Website</option>
                    <option value="Giới thiệu">Giới thiệu</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Địa điểm (Location)</label>
                  <input
                    type="text"
                    value={newCustomerData.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-yellow-500 transition"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Lịch hẹn</label>
                  <input
                    type="datetime-local"
                    value={newCustomerData.appointment}
                    onChange={(e) => handleFormChange('appointment', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-yellow-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">Ghi chú (Note)</label>
                <textarea
                  value={newCustomerData.note || ''}
                  onChange={(e) => handleFormChange('note', e.target.value)}
                  placeholder="Nhập ghi chú (Gõ @Tên để tag nhân viên)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-yellow-500 transition resize-none"
                  rows={2}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800 gap-3">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setFormError(''); }}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-bold transition"
                >
                  Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT KHÁCH HÀNG */}
      {isDetailModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={handleCloseDetail}
          />
          <div className="relative w-full max-w-4xl h-full glass-panel shadow-2xl z-10 flex flex-col border-l border-slate-800 overflow-hidden animate-slide-in-right">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
              <h3 className="text-lg font-bold text-white">Chi tiết Khách hàng</h3>
              <button
                onClick={handleCloseDetail}
                className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#070b13]/90">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <CustomerProfile
                  customer={selectedCustomer}
                  onUpdate={handleCustomerUpdated}
                />
                <CustomerNoteTimeline
                  customerId={selectedCustomer.id.toString()}
                  notes={selectedCustomer.notes ?? []}
                  onNoteAdded={handleNoteAdded}
                />
              </div>

              <AttachmentManager
                customerId={selectedCustomer.id.toString()}
                attachments={selectedCustomer.attachments ?? []}
                onAttachmentUploaded={handleAttachmentUploaded}
                onAttachmentDeleted={handleAttachmentDeleted}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
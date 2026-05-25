import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CustomerNoteTimeline } from '../../components/Customer/CustomerNoteTimeline';
import { AttachmentManager } from '../../components/Customer/AttachmentManager';
import { CustomerProfile } from '../../components/Customer/CustomerProfile';
import { Header } from '../../components/Header';
import { CompanyForm } from '../../components/Company/CompanyForm';

import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { DataTable, Column } from '../../components/Table/DataTable';
import api from '../../services/api';
import { MentionsInput, Mention } from 'react-mentions';
import {
  Users, Plus, Search, Sparkles, X, Building2, Trash2
} from 'lucide-react';

import { Customer, CustomerDetailResponse, Note, Attachment, Company, BackendDocument } from '../../types';

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
  classified: string;
}

const INITIAL_FORM: NewCustomerForm = {
  name: '', company_id: '', field: '', price: '',
  status: 'NEW', email: '', phone_number: '', location: '',
  from_source: 'Facebook Ads', appointment: '', note: '', classified: '',
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
  SIGNED:     'bg-[#e8732c]/20 text-[#e8732c]',
  REJECTED:   'bg-rose-500/20 text-rose-400',
  QUOTED:     'bg-blue-500/20 text-blue-400',
  CONSULTING: 'bg-[#e8732c]/20 text-[#e8732c]',
  NEW:        'bg-slate-500/20 text-slate-400',
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const UserDashboard: React.FC = () => {
  const { toastNotification, clearToast, refreshNotifications } = useSocket();
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [customers, setCustomers]             = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(searchParams.get('customerId'));
  const [selectedCustomer, setSelectedCustomer]     = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery]         = useState('');
  const [loading, setLoading]                 = useState(true);
  const [isAddModalOpen, setIsAddModalOpen]   = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState<NewCustomerForm>(INITIAL_FORM);
  const [formError, setFormError]             = useState('');
  const [team, setTeam]                       = useState<{ id: number; name: string }[]>([]);
  
  // ── States cho Pagination và Filters ──────────────────────────────────────
  const [page, setPage]                       = useState(1);
  const [totalPages, setTotalPages]           = useState(1);
  const [classifiedFilter, setClassifiedFilter] = useState('');
  const [ownerFilter, setOwnerFilter]         = useState('');
  const [companies, setCompanies]             = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);

  // ── Fetch danh sách team cho mention ───────────────────────────────────────
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await api.get('/users');
        // Chỉ lấy admin để tag
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admins = res.data.filter((u: any) => u.role?.toLowerCase() === 'admin');
        setTeam(admins);
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
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (classifiedFilter) params.append('classified', classifiedFilter);
      if (ownerFilter) params.append('owner_id', ownerFilter);

      const response = await api.get(`/customers?${params.toString()}`);
      if (response.data && response.data.data) {
        setCustomers(response.data.data);
        setTotalPages(response.data.totalPages || 1);
      } else {
        // Fallback backward compatibility
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setCustomers(response.data as any);
      }
    } catch (err) {
      console.error('Không thể lấy danh sách khách hàng:', err);
    } finally {
      setLoading(false);
    }
  }, [page, classifiedFilter, ownerFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCustomers();
  }, [fetchCustomers]);

  // ── Fetch danh sách công ty ────────────────────────────────────────────────
  const fetchCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
    } catch (err) {
      console.error('Không thể lấy danh sách công ty:', err);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  const currentTab = searchParams.get('tab') || 'customer';

  useEffect(() => {
    if (currentTab === 'company') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCompanies();
    }
  }, [currentTab, fetchCompanies]);

  // ── Fetch chi tiết khi chọn customer ──────────────────────────────────────

  useEffect(() => {
    if (!selectedCustomerId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCustomer(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        const response = await api.get<CustomerDetailResponse>(`/customers/${selectedCustomerId}`);
        const data = response.data;
        
        // Map exchanges to notes
        const mappedNotes: Note[] = (data.exchanges || []).map((ex) => ({
          id: ex.id.toString(),
          customerId: ex.customer_id.toString(),
          authorId: (ex.writer_id || ex.writer?.id || '').toString(),
          authorName: ex.writer?.name || 'Unknown',
          content: ex.content || '',
          createdAt: ex.created_at,
        }));

        // Map documents to attachments
        const mappedAttachments: Attachment[] = (data.documents || []).map((doc) => ({
          id: doc.id.toString(),
          name: doc.file_name || '',
          url: doc.file_url || '',
          customerId: doc.customer_id.toString(),
          userId: doc.uploaded_by.toString(),
          createdAt: doc.created_at,
          uploader: doc.uploader,
          file_name: doc.file_name,
          file_url: doc.file_url,
        }));
        
        setSelectedCustomer({ ...data, notes: mappedNotes, attachments: mappedAttachments } as unknown as Customer);
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
    // Map documents to attachments from updated customer
    const detail = updated as unknown as CustomerDetailResponse;
    const mappedAttachments: Attachment[] = (detail.documents || []).map((doc) => ({
      id: doc.id.toString(),
      name: doc.file_name || '',
      url: doc.file_url || '',
      customerId: doc.customer_id.toString(),
      userId: (doc.uploaded_by || '').toString(),
      createdAt: doc.created_at,
      uploader: doc.uploader,
      file_name: doc.file_name,
      file_url: doc.file_url,
    }));

    setCustomers(prev =>
      prev.map(c => String(c.id) === String(updated.id) ? { ...c, ...updated } : c)
    );
    setSelectedCustomer(prev => prev ? { ...prev, ...updated, attachments: mappedAttachments } : null);
    
    // Yêu cầu: Trả về luôn user/dashboard sau khi lưu
    handleCloseDetail();
  };

  /** Nhận raw NoteResponse từ CustomerNoteTimeline, map rồi prepend vào state */
  const handleNoteAdded = (note: Note) => {
    setSelectedCustomer(prev =>
      prev ? { ...prev, notes: [note, ...(prev.notes ?? [])] } : null
    );
  };

  const handleAttachmentUploaded = (newFile: Attachment) => {
    const raw = newFile as unknown as BackendDocument;
    const formattedFile: Attachment = {
      id: (newFile.id || raw.id).toString(),
      name: newFile.name || raw.file_name || '',
      url: newFile.url || raw.file_url || '',
      customerId: (newFile.customerId || raw.customer_id || '').toString(),
      userId: (newFile.userId || raw.uploaded_by || '').toString(),
      createdAt: newFile.createdAt || raw.created_at,
      uploader: newFile.uploader || raw.uploader,
      file_name: newFile.file_name || raw.file_name,
      file_url: newFile.file_url || raw.file_url,
    };

    setSelectedCustomer(prev =>
      prev ? { ...prev, attachments: [formattedFile, ...(prev.attachments ?? [])] } : null
    );
    const targetCustomerId = formattedFile.customerId;
    if (targetCustomerId) {
      setCustomers(prev =>
        prev.map(c => {
          if (String(c.id) === String(targetCustomerId)) {
            const detail = c as unknown as CustomerDetailResponse;
            const updatedDocs = [raw, ...((detail.documents) || [])];
            return { ...c, documents: updatedDocs };
          }
          return c;
        })
      );
    }
  };

  const handleAttachmentDeleted = (fileId: string) => {
    setSelectedCustomer(prev =>
      prev
        ? { ...prev, attachments: (prev.attachments ?? []).filter(a => String(a.id) !== String(fileId)) }
        : null
    );
    setCustomers(prev =>
      prev.map(c => {
        const detail = c as unknown as CustomerDetailResponse;
        return {
          ...c,
          documents: (detail.documents || []).filter((d) => String(d.id) !== String(fileId))
        };
      })
    );
  };

  const handleFormChange = (field: keyof NewCustomerForm, value: string) => {
    setNewCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
    try {
      await api.delete(`/customers/${id}`);
      setCustomers(prev => prev.filter(c => String(c.id) !== String(id)));
      if (selectedCustomerId === String(id)) {
        handleCloseDetail();
      }
    } catch (err) {
      console.error('Lỗi xóa khách hàng:', err);
      alert('Không thể xóa khách hàng. Bạn có thể không có quyền.');
    }
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
      render: (c) => {
        const hasCompany = !!c.company_id;
        const compName = c.company ? (typeof c.company === 'string' ? c.company : c.company.name) : '';
        if (!hasCompany) return <span className="text-xs text-slate-500 font-medium">-</span>;
        return (
          <span
            className="text-xs text-[#e8732c] font-bold hover:underline cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCompanyId(c.company_id!);
              setIsCompanyFormOpen(true);
            }}
          >
            {compName}
          </span>
        );
      },
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
        const cl = c.classified;
        const labels: Record<string, string> = { VIP: 'VIP', Lead: 'Tiềm năng', Normal: 'Thông thường' };
        return <span className={`text-xs font-bold ${cl === 'VIP' ? 'text-[#e8732c]' : 'text-slate-300'}`}>{cl ? (labels[cl] || cl) : '-'}</span>;
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
        <span className="font-semibold text-[#e8732c]">
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
        const dateStr = (c).updated_at;
        return <span className="text-slate-400 text-[10px]">{dateStr ? new Date(dateStr).toLocaleDateString('vi-VN') : ''}</span>;
      },
    },
    {
      key: 'id' as keyof Customer,
      title: 'Thao tác',
      render: (c) => {
        // Chỉ owner hoặc admin mới được xóa
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isOwnerOrAdmin = currentUser?.role === 'admin' || (c as any).owner_id === currentUser?.id;
        
        if (!isOwnerOrAdmin) return null;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteCustomer(c.id.toString());
            }}
            className="p-1.5 text-slate-500 hover:bg-rose-500/20 hover:text-rose-500 rounded transition"
            title="Xóa khách hàng"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        );
      },
    },
  ];

  const companyColumns: Column<Company>[] = [
    {
      key: 'id',
      title: 'ID',
      render: (comp) => <span className="text-slate-400 text-xs font-bold">#{comp.id}</span>,
    },
    {
      key: 'name',
      title: 'Tên công ty',
      render: (comp) => (
        <span
          className="font-bold text-white hover:underline cursor-pointer"
          onClick={() => {
            setSelectedCompanyId(comp.id);
            setIsCompanyFormOpen(true);
          }}
        >
          {comp.name}
        </span>
      ),
    },
    {
      key: 'tax_code',
      title: 'Mã số thuế',
      render: (comp) => <span className="text-xs text-slate-300">{comp.tax_code || '-'}</span>,
    },
    {
      key: 'field',
      title: 'Lĩnh vực',
      render: (comp) => <span className="text-xs text-slate-300">{comp.field || '-'}</span>,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (comp) => {
        const statusLabel: Record<string, string> = {
          potential: 'Tiềm năng',
          active: 'Đang hoạt động',
          inactive: 'Ngưng HĐ',
        };
        const statusClass: Record<string, string> = {
          potential: 'bg-blue-500/20 text-blue-400',
          active: 'bg-emerald-500/20 text-emerald-400',
          inactive: 'bg-rose-500/20 text-rose-400',
        };
        return (
          <span
            className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              statusClass[comp.status] ?? 'bg-slate-500/20 text-slate-300'
            }`}
          >
            {statusLabel[comp.status] ?? comp.status}
          </span>
        );
      },
    },
    {
      key: 'phone',
      title: 'Số điện thoại',
      render: (comp) => <span className="text-xs text-slate-300">{comp.phone || '-'}</span>,
    },
    {
      key: 'email',
      title: 'Email',
      render: (comp) => <span className="text-xs text-slate-300">{comp.email || '-'}</span>,
    },
    {
      key: 'website',
      title: 'Website',
      render: (comp) => <span className="text-xs text-slate-300">{comp.website || '-'}</span>,
    },
    {
      key: 'address',
      title: 'Địa chỉ',
      render: (comp) => <span className="text-xs text-slate-300 truncate max-w-[120px] inline-block" title={comp.address}>{comp.address || '-'}</span>,
    },
    {
      key: 'created_at',
      title: 'Ngày tạo',
      render: (comp) => <span className="text-slate-400 text-[10px]">{new Date(comp.created_at).toLocaleDateString('vi-VN')}</span>,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-[#070b13] text-slate-100 overflow-hidden relative">

      {/* TOAST NOTIFICATION */}
      {toastNotification && (
        <div className="fixed top-20 right-6 z-[9999] max-w-sm glass-panel p-4 rounded-xl border-l-4 border-[#e8732c] shadow-2xl animate-bounce">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h4 className="text-xs font-bold text-[#e8732c] flex items-center gap-1">
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
              className="text-[10px] text-[#e8732c] font-bold underline mt-2 block"
            >
              Mở chi tiết khách hàng →
            </button>
          )}
        </div>
      )}

      {/* HEADER TÁI SỬ DỤNG VỚI DASHBOARD MENU */}
      <Header isAdminPage={false} onSelectCustomer={handleSelectCustomer} />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden mt-20">
        {/* Danh sách khách hàng HOẶC Công ty */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentTab === 'company' ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#e8732c]" />
                  Danh sách Công ty
                </h2>

                <div className="flex gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Tìm công ty..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#e8732c] transition"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCompanyId(null);
                      setIsCompanyFormOpen(true);
                    }}
                    className="bg-[#e8732c] hover:bg-[#f5882e] text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition shadow-lg shadow-[#e8732c]/10"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm Công Ty
                  </button>
                </div>
              </div>

              <DataTable
                columns={companyColumns}
                data={companies.filter(comp =>
                  (comp.name && comp.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (comp.tax_code && comp.tax_code.includes(searchQuery))
                )}
                keyExtractor={(comp) => comp.id.toString()}
                isLoading={loadingCompanies}
                emptyMessage="Không có công ty nào."
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#e8732c]" />
                  Danh sách Khách hàng
                </h2>

                <div className="flex gap-3">
                  {/* Filter Phân loại */}
                  <select
                    value={classifiedFilter}
                    onChange={(e) => {
                      setClassifiedFilter(e.target.value);
                      setPage(1);
                    }}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#e8732c] transition"
                  >
                    <option value="">Tất cả phân loại</option>
                    <option value="VIP">VIP</option>
                    <option value="Lead">Tiềm năng (Lead)</option>
                    <option value="Normal">Thông thường (Normal)</option>
                  </select>

                  {/* Filter Nhân viên (chỉ dành cho admin) */}
                  {currentUser?.role === 'admin' ? (
                    <select
                      value={ownerFilter}
                      onChange={(e) => {
                        setOwnerFilter(e.target.value);
                        setPage(1);
                      }}
                      className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#e8732c] transition"
                    >
                      <option value="">Tất cả nhân viên</option>
                      {team.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  ) : null}

                  <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Tìm khách hàng..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#e8732c] transition"
                    />
                  </div>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-[#e8732c] hover:bg-[#f5882e] text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition shadow-lg shadow-[#e8732c]/10"
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
                pagination={{
                  page,
                  totalPages,
                  onPageChange: setPage
                }}
              />
            </>
          )}
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
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerData.phone_number}
                    onChange={(e) => handleFormChange('phone_number', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
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
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Giá trị dự kiến</label>
                  <input
                    type="number"
                    value={newCustomerData.price}
                    onChange={(e) => handleFormChange('price', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
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
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Nguồn (Source)</label>
                  <select
                    value={newCustomerData.from_source}
                    onChange={(e) => handleFormChange('from_source', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
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
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Lịch hẹn</label>
                  <input
                    type="datetime-local"
                    value={newCustomerData.appointment}
                    onChange={(e) => handleFormChange('appointment', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">Phân loại (VIP, Tiềm năng...)</label>
                <select
                  value={newCustomerData.classified}
                  onChange={(e) => handleFormChange('classified', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
                >
                  <option value="">Chưa phân loại</option>
                  <option value="VIP">VIP</option>
                  <option value="Lead">Tiềm năng (Lead)</option>
                  <option value="Normal">Thông thường (Normal)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">Ghi chú (Note)</label>
                <MentionsInput
                  value={newCustomerData.note || ''}
                  onChange={(e) => handleFormChange('note', e.target.value)}
                  placeholder="Nhập ghi chú (Gõ @Tên để tag nhân viên)..."
                  className="mentions-input-chat"
                  style={{
                    control: {
                      fontSize: '12px',
                      fontWeight: 'normal',
                    },
                    input: {
                      padding: '8px 14px',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                      backgroundColor: '#0f172a',
                      color: '#e2e8f0',
                      outline: 'none',
                      minHeight: '48px',
                    },
                    suggestions: {
                      list: {
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        fontSize: 12,
                        borderRadius: '8px',
                        maxHeight: '150px',
                        overflowY: 'auto',
                        zIndex: 9999
                      },
                      item: {
                        padding: '8px 12px',
                        borderBottom: '1px solid #1e293b',
                        color: '#cbd5e1'
                      },
                    },
                  }}
                >
                  <Mention
                    trigger="@"
                    markup="@[__display__](__id__)"
                    data={team.map(u => ({ id: String(u.id), display: String(u.name) }))}
                    style={{
                      backgroundColor: 'rgba(232, 115, 44, 0.2)',
                      color: '#e8732c',
                      borderRadius: '4px',
                      padding: '0 2px'
                    }}
                    renderSuggestion={(suggestion, search, highlightedDisplay) => (
                      <div className="hover:text-[#e8732c]">{highlightedDisplay}</div>
                    )}
                  />
                </MentionsInput>
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
                  className="px-4 py-2 bg-[#e8732c] hover:bg-[#f5882e] text-white rounded-xl font-bold transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={handleCloseDetail}
          />
          <div className="relative w-full max-w-5xl max-h-[95vh] glass-panel rounded-2xl shadow-2xl z-10 flex flex-col border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
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

      {/* MODAL THÊM/SỬA CÔNG TY */}
      {isCompanyFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsCompanyFormOpen(false)}
          />
          <div className="glass-panel p-6 rounded-2xl shadow-2xl z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-800 relative">
            <h3 className="text-lg font-bold text-white mb-4 pb-2 border-b border-slate-800">
              {selectedCompanyId ? 'Cập nhật Thông tin Công ty' : 'Thêm Công ty Mới'}
            </h3>
            <CompanyForm
              companyId={selectedCompanyId}
              onSaved={() => {
                setIsCompanyFormOpen(false);
                fetchCompanies();
              }}
              onCancel={() => setIsCompanyFormOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;

import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { DataTable, Column } from '../../../components/Table/DataTable';
import { Customer } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useCommonStore } from '../../../store/useCommonStore';
import { useCustomers } from '../../../hooks/useCustomers';
import api from '../../../services/api';
import { MentionTextarea } from '../../../components/MentionTextarea';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_CLASS, INITIAL_CUSTOMER_FORM } from '../../../utils/constants';

interface CustomerTabProps {
  onSelectCustomer: (id: string) => void;
  onOpenCompanyForm: (companyId: number | null) => void;
}

export const CustomerTab: React.FC<CustomerTabProps> = ({ onSelectCustomer, onOpenCompanyForm }) => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { team, fetchTeam } = useCommonStore();
  
  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const {
    customers, loading,
    page, setPage, totalPages,
    classifiedFilter, setClassifiedFilter,
    ownerFilter, setOwnerFilter,
    statusFilter, setStatusFilter
  } = useCustomers();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState(INITIAL_CUSTOMER_FORM);
  const [formError, setFormError] = useState('');

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post<Customer>('/customers', {
        ...newCustomerData,
        price:       newCustomerData.price ? Number(newCustomerData.price) : 0,
        appointment: newCustomerData.appointment
          ? new Date(newCustomerData.appointment).toISOString()
          : null,
      });
      // Invalidate query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsAddModalOpen(false);
      setNewCustomerData(INITIAL_CUSTOMER_FORM);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })
        .response?.data?.error ?? 'Không thể tạo khách hàng.';
      setFormError(message);
    }
  };

  const handleFormChange = (field: keyof typeof INITIAL_CUSTOMER_FORM, value: string) => {
    setNewCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
    try {
      await api.delete(`/customers/${id}`);
      alert('Đã xóa khách hàng thành công!');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Không thể xóa khách hàng lúc này. Vui lòng thử lại sau.';
      console.error('Lỗi khi xóa:', errorMessage);
      alert(errorMessage);
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
          onClick={() => onSelectCustomer(c.id.toString())}
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
              onOpenCompanyForm(c.company_id!);
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
            CUSTOMER_STATUS_CLASS[c.status] ?? CUSTOMER_STATUS_CLASS.NEW
          }`}
        >
          {CUSTOMER_STATUS_LABEL[c.status] ?? c.status}
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
          {formatCurrency(c.price)}
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
      key: 'address',
      title: 'Địa chỉ',
      render: (c) => <span className="text-xs text-slate-300 truncate max-w-[120px] inline-block" title={c.location}>{c.location || '-'}</span>,
    },
    {
      key: 'appointment',
      title: 'Lịch hẹn',
      render: (c) => <span className="text-xs text-slate-300">{formatDate(c.appointment)}</span>,
    },
    {
      key: 'note',
      title: 'Ghi chú',
      render: (c) => <span className="text-xs text-slate-300 truncate max-w-[150px] inline-block" title={c.note}>{c.note || '-'}</span>,
    },
    {
      key: 'created_at',
      title: 'Ngày tạo',
      render: (c) => <span className="text-slate-400 text-[10px]">{formatDate(c.created_at)}</span>,
    },
    {
      key: 'updated_at',
      title: 'Ngày cập nhật',
      render: (c) => <span className="text-slate-400 text-[10px]">{formatDate(c.updated_at)}</span>,
    },
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      key: 'actions' as any,
      title: 'Thao tác',
      render: (c) => {
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

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-[#e8732c]" />
          Danh sách Khách hàng
        </h2>

        <div className="flex gap-3">
          {/* Filter Trạng thái chăm sóc */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#e8732c] transition"
          >
            <option value="">Trạng thái chăm sóc</option>
            <option value="NEW">Mới tiếp nhận</option>
            <option value="CONSULTING">Đang tư vấn</option>
            <option value="QUOTED">Đã gửi báo giá</option>
            <option value="SIGNED">Đã ký hợp đồng</option>
            <option value="REJECTED">Khách từ chối</option>
          </select>

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
                <option key={u.id} value={u.id.toString()}>{u.name}</option>
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

      {/* MODAL THÊM KHÁCH HÀNG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="glass-panel p-6 rounded-2xl shadow-2xl z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-800 relative">
            <h3 className="text-lg font-bold text-white mb-4 pb-2 border-b border-slate-800">
              Thêm Khách Hàng Mới
            </h3>

            {formError && (
              <div className="p-3 mb-4 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs relative">
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
                  <label className="font-semibold text-slate-400 block mb-1">Tên công ty</label>
                  <input
                    type="text"
                    value={newCustomerData.company_name}
                    onChange={(e) => handleFormChange('company_name', e.target.value)}
                    placeholder="Nhập tên công ty mới..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="relative z-50">
                <label className="font-semibold text-slate-400 block mb-1">Ghi chú (Note)</label>
                <MentionTextarea
                  value={newCustomerData.note || ''}
                  onChange={(val) => handleFormChange('note', val)}
                  placeholder="Nhập ghi chú (Gõ @Tên để tag nhân viên)..."
                  users={team.map(u => ({ id: u.id.toString(), name: u.name, role: u.role }))}
                  dropdownDirection="down"
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
                  className="px-4 py-2 bg-[#e8732c] hover:bg-[#f5882e] text-white rounded-xl font-bold transition"
                >
                  Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

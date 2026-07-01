import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Search, Trash2, Download, Upload, FileSpreadsheet } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { useQueryClient } from '@tanstack/react-query';
import { DataTable, Column } from '../../../components/Table/DataTable';
import { Customer } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useCommonStore } from '../../../store/useCommonStore';
import { useCustomers } from '../../../hooks/useCustomers';
import api from '../../../services/api';
import { MentionTextarea } from '../../../components/MentionTextarea';
import { useExportExcel } from '../../../hooks/useExportExcel';
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
  const { exportToExcel } = useExportExcel();
  
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
        classified:  newCustomerData.classified || null,
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
    setNewCustomerData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'status' && value !== 'REJECTED') {
        updated.current_step = '';
      }
      return updated;
    });
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
    try {
      await api.delete(`/customers/${id}`);
      alert('Đã xóa khách hàng thành công!');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const handleExport = async () => {
    try {
      // Gọi API lấy toàn bộ danh sách khách hàng khớp với bộ lọc hiện tại (không phân trang bằng cách set limit lớn)
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '1000000');
      if (classifiedFilter) params.append('classified', classifiedFilter);
      if (ownerFilter) params.append('owner_id', ownerFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/customers?${params.toString()}`);
      let allCustomers: Customer[] = [];
      if (response.data && response.data.data) {
        allCustomers = response.data.data;
      } else if (Array.isArray(response.data)) {
        allCustomers = response.data;
      }

      // Lọc theo searchQuery (tìm kiếm) ở phía Client tương tự như filteredCustomers
      const q = searchQuery.toLowerCase();
      const exportCustomers = allCustomers.filter(c => {
        return (
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.phone_number && c.phone_number.includes(q))
        );
      });

      const exportData = exportCustomers.map((c) => ({
        stt: c.displayId || `KH-${String(c.id).padStart(3, '0')}`,
        created_at: formatDate(c.created_at),
        name: c.name,
        company: c.company ? (typeof c.company === 'string' ? c.company : c.company.name) : '',
        field: c.field || '',
        status: CUSTOMER_STATUS_LABEL[c.status] ?? c.status,
        reject_reason: c.reject_reason || '',
        classified: c.classified || '',
        from_source: c.from_source || '',
        price: c.price || 0,
        phone_number: c.phone_number || '',
        email: c.email || '',
        address: c.address || '',
        link_url: c.link_url || '',
        appointment: c.appointment ? formatDate(c.appointment) : '',
        note: c.note || '',
        updated_at: formatDate(c.updated_at),
      }));

      exportToExcel({
        data: exportData,
        fileName: 'Danh_Sach_Khach_Hang',
        sheetName: 'Khách hàng',
        headers: {
          stt: 'STT',
          created_at: 'Ngày tạo',
          name: 'Họ và tên',
          company: 'Đầu mối doanh nghiệp',
          field: 'Lĩnh vực',
          status: 'Trạng thái',
          reject_reason: 'Lý do ngừng / Hủy',
          classified: 'Phân loại',
          from_source: 'Nguồn khách hàng',
          price: 'Giá trị HD',
          phone_number: 'Số điện thoại',
          email: 'Email',
          address: 'Địa chỉ',
          link_url: 'Link URL',
          appointment: 'Lịch hẹn',
          note: 'Nhu cầu khách hàng',
          updated_at: 'Ngày cập nhật',
        }
      });
    } catch (error) {
      console.error('Lỗi khi xuất excel:', error);
      alert('Không thể xuất Excel lúc này. Vui lòng thử lại sau.');
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [{
      stt: '1',
      created_at: formatDate(new Date().toISOString()),
      name: 'Nguyễn Văn A',
      company: 'Công ty ABC',
      field: 'Bất động sản',
      status: 'Mới tiếp nhận',
      reject_reason: '',
      classified: 'VIP',
      from_source: 'Facebook',
      price: '10.000.000',
      phone_number: '0901234567',
      email: 'nguyenvana@example.com',
      address: '123 Đường Số 1, Quận 1, TP.HCM',
      link_url: 'https://fb.com/nguyenvana',
      appointment: '',
      note: 'Khách hàng quan tâm dự án X',
      updated_at: formatDate(new Date().toISOString()),
    }];

    exportToExcel({
      data: templateData,
      fileName: 'Mau_Nhap_Khach_Hang',
      sheetName: 'Mẫu Khách hàng',
      headers: {
        stt: 'STT',
        created_at: 'Ngày tạo',
        name: 'Họ và tên',
        company: 'Đầu mối doanh nghiệp',
        field: 'Lĩnh vực',
        status: 'Trạng thái',
        reject_reason: 'Lý do ngừng / Hủy',
        classified: 'Phân loại',
        from_source: 'Nguồn khách hàng',
        price: 'Giá trị HD',
        phone_number: 'Số điện thoại',
        email: 'Email',
        address: 'Địa chỉ',
        link_url: 'Link URL',
        appointment: 'Lịch hẹn',
        note: 'Nhu cầu khách hàng',
        updated_at: 'Ngày cập nhật',
      }
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      
      const importedData: any[] = [];
      let isFirstRow = true;
      let headers: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (isFirstRow) {
          headers = (row.values as string[]).map(val => val ? val.toString().trim() : '');
          isFirstRow = false;
        } else {
          const rowData: any = {};
          (row.values as any[]).forEach((val, index) => {
            if (index === 0) return; // exceljs array is 1-based
            const header = headers[index];
            if (header) {
              rowData[header] = val;
            }
          });
          
          if (rowData['Họ và tên']) {
            // Map status label back to key
            let statusCode = 'NEW';
            for (const [key, label] of Object.entries(CUSTOMER_STATUS_LABEL)) {
              if (label === rowData['Trạng thái']) {
                statusCode = key;
                break;
              }
            }

            importedData.push({
              name: rowData['Họ và tên']?.toString(),
              company_name: rowData['Đầu mối doanh nghiệp']?.toString(),
              field: rowData['Lĩnh vực']?.toString(),
              status: statusCode,
              reject_reason: rowData['Lý do ngừng / Hủy']?.toString(),
              classified: rowData['Phân loại']?.toString(),
              from_source: rowData['Nguồn khách hàng']?.toString(),
              price: rowData['Giá trị HD'] ? parseFloat(rowData['Giá trị HD'].toString().replace(/\D/g, '')) : undefined,
              phone_number: rowData['Số điện thoại']?.toString(),
              email: rowData['Email']?.toString(),
              address: rowData['Địa chỉ']?.toString(),
            });
          }
        }
      });

      if (importedData.length === 0) {
        alert('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
        return;
      }

      const res = await api.post('/customers/bulk', { customers: importedData });
      alert(`Đã nhập thành công ${res.data.successCount} khách hàng. Đã bỏ qua ${res.data.skipCount} khách hàng bị trùng Email/SĐT.`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Lỗi khi nhập excel:', error);
      alert('Không thể nhập Excel. Vui lòng kiểm tra lại định dạng file.');
    }
  };

  // ── Table columns ──────────────────────────────────────────────────────────

  const customerColumns: Column<Customer>[] = [
    {
      key: 'id',
      title: 'ID',
      render: (c) => <span className="text-slate-400 text-xs font-bold">{c.displayId || c.id}</span>,
    },
        {
      key: 'created_at',
      title: 'Ngày tạo',
      render: (c) => <span className="text-slate-400 text-[10px]">{formatDate(c.created_at)}</span>,
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
      title: 'Đầu mối doanh nghiệp',
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
        <div className="flex flex-col gap-1 items-start">
          <span
            className={`whitespace-nowrap inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              CUSTOMER_STATUS_CLASS[c.status] ?? CUSTOMER_STATUS_CLASS.NEW
            }`}
          >
            {CUSTOMER_STATUS_LABEL[c.status] ?? c.status}
          </span>
          {c.status === 'REJECTED' && c.current_step && (
            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
              ({c.current_step})
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'reject_reason',
      title: 'LÝ DO TỪ CHỐI / HỦY',
      render: (c) => <span className="text-xs text-slate-300 truncate max-w-[150px] inline-block" title={c.reject_reason}>{c.reject_reason || '-'}</span>,
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
      title: 'ĐỊA CHỈ',
      render: (c) => <span className="text-xs text-slate-300 truncate max-w-[120px] inline-block" title={c.address}>{c.address || '-'}</span>,
    },
    {
      key: 'link_url',
      title: 'LINK URL',
      render: (c) => c.link_url ? <a href={c.link_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate max-w-[100px] inline-block" title={c.link_url}>Link</a> : <span className="text-xs text-slate-300">-</span>,
    },
    {
      key: 'appointment',
      title: 'Lịch hẹn',
      render: (c) => <span className="text-xs text-slate-300">{formatDate(c.appointment)}</span>,
    },
    {
      key: 'note',
      title: 'Nhu cầu khách hàng',
      render: (c) => <span className="text-xs text-slate-300 truncate max-w-[150px] inline-block" title={c.note}>{c.note || '-'}</span>,
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
            <option value="DEMO_SENT">Đã gửi demo</option>
            <option value="QUOTED">Đã gửi báo giá</option>
            <option value="CONTRACT_SENT">Đã gửi hợp đồng</option>
            <option value="SIGNED">Đã ký hợp đồng</option>
            <option value="REJECTED">Đã hủy</option>
            <option value="CONSULTING">Đang tư vấn</option>
            <option value="STOPCONSULTING">Ngừng tư vấn</option>
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
            onClick={handleDownloadTemplate}
            className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition shadow-lg shadow-slate-700/10"
          >
            <FileSpreadsheet className="w-4 h-4" />Tải File Mẫu
          </button>
          <button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition shadow-lg shadow-green-600/10"
          >
            <Download className="w-4 h-4" />Xuất Excel
          </button>
          
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/10"
          >
            <Upload className="w-4 h-4" />Nhập Excel
          </button>
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
                  <label className="font-semibold text-slate-400 block mb-1">Người đại diện *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Đầu mối doanh nghiệp</label>
                  <input
                    type="text"
                    value={newCustomerData.company_name}
                    onChange={(e) => handleFormChange('company_name', e.target.value)}
                    placeholder="Nhập tên đầu mối doanh nghiệp mới..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={newCustomerData.phone_number}
                    onChange={(e) => handleFormChange('phone_number', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
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
                    <option value="Facebook">Facebook</option>
                    <option value="Linkedin">Linkedin</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Website">Website</option>
                    <option value="Giới thiệu">Giới thiệu</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Địa chỉ</label>
                  <input
                    type="text"
                    value={newCustomerData.address}
                    onChange={(e) => handleFormChange('address', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Link URL</label>
                  <input
                    type="text"
                    value={newCustomerData.link_url}
                    onChange={(e) => handleFormChange('link_url', e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="font-semibold text-slate-400 block mb-1">Trạng thái chăm sóc</label>
                  <select
                    value={newCustomerData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
                  >
                    <option value="NEW">Mới tiếp nhận</option>
                    <option value="DEMO_SENT">Đã gửi demo</option>
                    <option value="QUOTED">Đã gửi báo giá</option>
                    <option value="CONTRACT_SENT">Đã gửi hợp đồng</option>
                    <option value="SIGNED">Đã ký hợp đồng</option>
                    <option value="REJECTED">Đã hủy</option>
                    <option value="CONSULTING">Đang tư vấn</option>
                    <option value="STOPCONSULTING">Ngừng tư vấn</option>
                  </select>
                </div>
              </div>

              {newCustomerData.status === 'REJECTED' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-400 block mb-1">Hủy ở bước</label>
                    <select
                      value={newCustomerData.current_step || ''}
                      onChange={(e) => handleFormChange('current_step', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
                    >
                      <option value="">-- Chọn bước --</option>
                      <option value="Đã gửi demo">Đã gửi demo</option>
                      <option value="Đã gửi báo giá">Đã gửi báo giá</option>
                      <option value="Đã gửi hợp đồng">Đã gửi hợp đồng</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-400 block mb-1">Lý do từ chối</label>
                    <input
                      type="text"
                      value={newCustomerData.reject_reason || ''}
                      onChange={(e) => handleFormChange('reject_reason', e.target.value)}
                      placeholder="Nhập lý do khách hàng từ chối..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
                    />
                  </div>
                </div>
              )}

              <div className="relative z-50">
                <label className="font-semibold text-slate-400 block mb-1">Nhu cầu khách hàng</label>
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

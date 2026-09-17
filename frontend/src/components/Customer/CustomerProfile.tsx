import React, { useState, useEffect } from 'react';
import type { Customer } from '../../types';
import { Save, User as UserIcon, Info, Building2, ChevronDown, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { toDateTimeLocalValue, fromDateTimeLocalValue } from '../../utils/datetime';

interface CustomerProfileProps {
  customer: Customer;
  onUpdate: (updatedCustomer: Customer) => void;
}

interface CustomerProfileFormData {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  industry?: string;
  price?: number | string;
  status?: string;
  source?: string;
  address?: string;
  link_url?: string;
  appointment?: string;
  description?: string;
  classified?: string;
  reject_reason?: string;
  current_step?: string;
  
  company_tax_code?: string;
  company_email?: string;
  company_phone?: string;
  company_status?: string;
  company_field?: string;
  company_address?: string;
  company_bank_name?: string;
  company_bank_account_no?: string;
  company_bank_branch?: string;
  company_note?: string;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ customer, onUpdate }) => {
  const [formData, setFormData] = useState<CustomerProfileFormData>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);

  useEffect(() => {
    if (customer) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompanyId(customer.company_id || null);
      const comp = customer.company ?? null;
      setFormData({
        name: customer.name,
        company: comp?.name ?? '',
        company_tax_code: comp?.tax_code || '',
        company_email: comp?.email || '',
        company_phone: comp?.phone || '',
        company_status: comp?.status || 'potential',
        company_field: comp?.field || '',
        company_address: comp?.address || '',
        company_bank_name: comp?.bank_name || '',
        company_bank_account_no: comp?.bank_account_no || '',
        company_bank_branch: comp?.bank_branch || '',
        company_note: comp?.note || '',
        
        email: customer.email,
        phone: customer.phone_number ?? '',
        industry: customer.field ?? '',
        price: customer.price ?? '',
        status: customer.status ?? 'NEW',
        source: customer.from_source ?? '',
        address: customer.address ?? '',
        link_url: customer.link_url ?? '',
        appointment: toDateTimeLocalValue(customer.appointment),
        description: customer.note ?? '',
        classified: customer.classified ?? '',
        reject_reason: customer.reject_reason ?? '',
        current_step: customer.current_step ?? '',
      });
      setMessage(null);
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'status' && value !== 'REJECTED') {
        updated.current_step = '';
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await api.put(`/customers/${customer.id}`, {
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone,
        field: formData.industry,
        price: formData.price ? Number(formData.price) : 0,
        status: formData.status,
        from_source: formData.source,
        address: formData.address,
        link_url: formData.link_url,
        appointment: fromDateTimeLocalValue(formData.appointment as string),
        note: formData.description,
        classified: formData.classified || null,
        reject_reason: formData.reject_reason || null,
        current_step: formData.current_step || null,
        company_id: companyId,
        company_name: formData.company,
        company_tax_code: formData.company_tax_code,
        company_email: formData.company_email,
        company_phone: formData.company_phone,
        company_status: formData.company_status,
        company_field: formData.company_field,
        company_address: formData.company_address,
        company_bank_name: formData.company_bank_name,
        company_bank_account_no: formData.company_bank_account_no,
        company_bank_branch: formData.company_bank_branch,
        company_note: formData.company_note,
      });

      setMessage({ type: 'success', text: 'Cập nhật thông tin khách hàng thành công!' });
      onUpdate(response.data);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: unknown) {
      console.error(err);
      setMessage({
        type: 'error',
        text: (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Không thể cập nhật thông tin khách hàng.'
      });
    } finally {
      setSaving(false);
    }
  };

  // Tính toán các trường thông tin còn thiếu
  const trackedFields = [
    { key: 'name', label: 'Họ tên', elementId: 'input-name', filled: !!formData.name?.trim() },
    { key: 'phone', label: 'Số điện thoại', elementId: 'input-phone', filled: !!formData.phone?.trim() },
    { key: 'email', label: 'Email', elementId: 'input-email', filled: !!formData.email?.trim() },
    { key: 'company', label: 'Doanh nghiệp', elementId: 'input-company', filled: !!formData.company?.trim() },
    { key: 'industry', label: 'Lĩnh vực', elementId: 'input-industry', filled: !!formData.industry?.trim() },
    { key: 'price', label: 'Giá trị HĐ', elementId: 'input-price', filled: Boolean(formData.price && Number(formData.price) > 0) },
    { key: 'source', label: 'Nguồn KH', elementId: 'input-source', filled: !!formData.source?.trim() },
    { key: 'appointment', label: 'Lịch hẹn', elementId: 'input-appointment', filled: !!formData.appointment?.trim() },
    { key: 'description', label: 'Nhu cầu', elementId: 'input-description', filled: !!formData.description?.trim() },
  ];

  const filledCount = trackedFields.filter(f => f.filled).length;
  const totalCount = trackedFields.length;
  const completionPercent = Math.round((filledCount / totalCount) * 100);
  const missingFields = trackedFields.filter(f => !f.filled);

  const handleJumpToField = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-blue-500');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-blue-500');
      }, 1500);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1d1c19] border border-gray-200 dark:border-[#332f2c] p-6 rounded-2xl shadow-sm w-full space-y-6">

      {/* Thông báo cập nhật */}
      {message && (
        <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
        }`}>
          <Info className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Độ hoàn thiện hồ sơ & Nhắc nhở thông tin còn thiếu */}
      <div className="p-4 rounded-xl border border-gray-200 dark:border-[#332f2c] bg-gray-50/70 dark:bg-[#232120]/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 ${completionPercent === 100 ? 'text-emerald-500' : 'text-gray-500 dark:text-gray-400'}`} />
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              Độ hoàn thiện hồ sơ: {filledCount}/{totalCount} ({completionPercent}%)
            </span>
          </div>
          {completionPercent === 100 ? (
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Đầy đủ thông tin
            </span>
          ) : (
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              Còn thiếu {missingFields.length} mục
            </span>
          )}
        </div>

        {/* Thanh tiến độ */}
        <div className="w-full bg-gray-200 dark:bg-[#332f2c] h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              completionPercent === 100 ? 'bg-emerald-500' : 'bg-gray-900 dark:bg-white'
            }`}
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        {/* Nút bấm nhảy nhanh đến các trường còn thiếu */}
        {missingFields.length > 0 && (
          <div className="flex items-center flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-gray-400 dark:text-gray-500">Cần bổ sung:</span>
            {missingFields.map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => handleJumpToField(f.elementId)}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md border border-dashed border-gray-300 dark:border-[#443f3b] text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-white hover:bg-white dark:hover:bg-[#1c1b18] transition cursor-pointer flex items-center gap-1 group"
                title={`Nhấn để điền ${f.label}`}
              >
                <span>+ {f.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* --- THÔNG TIN ĐẦU MỐI DOANH NGHIỆP --- */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3.5 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-900 dark:text-white" />
            Thông tin Đầu mối doanh nghiệp
          </h3>
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Tên Đầu Mối</label>
                <input
                  id="input-company"
                  type="text"
                  name="company"
                  value={formData.company || ''}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-2xs"
                  placeholder="Tên doanh nghiệp / đối tác"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Mã số thuế</label>
                <input
                  type="text"
                  name="company_tax_code"
                  value={formData.company_tax_code || ''}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-2xs"
                  placeholder="010xxxxxxx"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Email Doanh nghiệp</label>
                <input
                  type="email"
                  name="company_email"
                  value={formData.company_email || ''}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-2xs"
                  placeholder="contact@company.vn"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Số điện thoại</label>
                <input
                  type="text"
                  name="company_phone"
                  value={formData.company_phone || ''}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-2xs"
                  placeholder="024 xxxx xxxx"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Trạng thái Đầu mối</label>
                <div className="relative">
                  <select
                    name="company_status"
                    value={formData.company_status || 'potential'}
                    onChange={handleChange}
                    className="appearance-none w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 pr-9 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition shadow-2xs cursor-pointer"
                  >
                    <option value="potential">Tiềm năng</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Ngưng HĐ</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Lĩnh vực hoạt động</label>
                <input
                  type="text"
                  name="company_field"
                  value={formData.company_field || ''}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-2xs"
                  placeholder="Công nghệ, Sản xuất..."
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Địa chỉ doanh nghiệp</label>
              <input
                type="text"
                name="company_address"
                value={formData.company_address || ''}
                onChange={handleChange}
                className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-2xs"
                placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
              />
            </div>

            {/* Tài khoản ngân hàng */}
            <div className="pt-2">
              <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Thông tin Ngân hàng</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1 block">Tên Ngân Hàng</label>
                  <input
                    type="text"
                    name="company_bank_name"
                    value={formData.company_bank_name || ''}
                    onChange={handleChange}
                    placeholder="VCB, MB..."
                    className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3 py-1.5 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1 block">Số tài khoản</label>
                  <input
                    type="text"
                    name="company_bank_account_no"
                    value={formData.company_bank_account_no || ''}
                    onChange={handleChange}
                    placeholder="0123456789"
                    className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3 py-1.5 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1 block">Chi nhánh</label>
                  <input
                    type="text"
                    name="company_bank_branch"
                    value={formData.company_bank_branch || ''}
                    onChange={handleChange}
                    placeholder="Chi nhánh..."
                    className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3 py-1.5 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Ghi chú doanh nghiệp</label>
              <textarea
                name="company_note"
                rows={2}
                value={formData.company_note || ''}
                onChange={handleChange}
                placeholder="Ghi chú nội bộ về doanh nghiệp..."
                className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs resize-none"
              />
            </div>
          </div>
        </div>

        {/* --- THÔNG TIN KHÁCH HÀNG (NGƯỜI ĐẠI DIỆN) --- */}
        <div className="pt-5 border-t border-gray-100 dark:border-[#2b2826]">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3.5 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-gray-900 dark:text-white" />
            Thông tin Người đại diện
          </h3>
          
          <div className="space-y-3.5">
            {/* Name and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Người đại diện *</label>
                <input
                  id="input-name"
                  type="text"
                  name="name"
                  required
                  value={formData.name || ''}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition shadow-2xs"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Số điện thoại</label>
                <input
                  id="input-phone"
                  type="text"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition shadow-2xs"
                  placeholder="0901234567"
                />
              </div>
            </div>

            {/* Email and Link URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Thư điện tử (Email)</label>
                <input
                  id="input-email"
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition shadow-2xs"
                  placeholder="example@mail.com"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Đường dẫn liên kết (Link URL)</label>
                <input
                  type="text"
                  name="link_url"
                  value={formData.link_url || ''}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition shadow-2xs"
                  placeholder="https://facebook.com/..."
                />
              </div>
            </div>

            {/* Industry and Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Lĩnh vực phân loại</label>
                <input
                  id="input-industry"
                  type="text"
                  name="industry"
                  value={formData.industry || ''}
                  onChange={handleChange}
                  placeholder="Bán lẻ, Dược phẩm, F&B..."
                  className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition shadow-2xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Giá trị hợp đồng (VNĐ)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">đ</span>
                  <input
                    id="input-price"
                    type="number"
                    name="price"
                    value={formData.price || ''}
                    onChange={handleChange}
                    placeholder="50,000,000"
                    className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl pl-8 pr-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition shadow-2xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Status and Source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Trạng thái chăm sóc</label>
                <div className="relative">
                  <select
                    name="status"
                    value={formData.status || 'NEW'}
                    onChange={handleChange}
                    className="appearance-none w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 pr-9 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs cursor-pointer"
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
                  <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Nguồn khách hàng</label>
                <div className="relative">
                  <select
                    id="input-source"
                    name="source"
                    value={formData.source || ''}
                    onChange={handleChange}
                    className="appearance-none w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 pr-9 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs cursor-pointer"
                  >
                    <option value="">-- Chọn nguồn --</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Linkedin">Linkedin</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Website">Website</option>
                    <option value="Giới thiệu">Giới thiệu</option>
                    <option value="Khác">Khác</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {formData.status === 'REJECTED' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Hủy ở bước</label>
                  <div className="relative">
                    <select
                      name="current_step"
                      value={formData.current_step || ''}
                      onChange={handleChange}
                      className="appearance-none w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 pr-9 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs cursor-pointer"
                    >
                      <option value="">-- Chọn bước --</option>
                      <option value="Đã gửi demo">Đã gửi demo</option>
                      <option value="Đã gửi báo giá">Đã gửi báo giá</option>
                      <option value="Đã gửi hợp đồng">Đã gửi hợp đồng</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Lý do từ chối / hủy</label>
                  <input
                    type="text"
                    name="reject_reason"
                    value={formData.reject_reason || ''}
                    onChange={handleChange}
                    placeholder="Nhập lý do khách hàng từ chối..."
                    className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* Appointment and Classified */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Lịch hẹn chăm sóc tiếp theo</label>
                <input
                  id="input-appointment"
                  type="datetime-local"
                  name="appointment"
                  value={formData.appointment || ''}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Phân loại khách hàng</label>
                <div className="relative">
                  <select
                    name="classified"
                    value={formData.classified || ''}
                    onChange={handleChange}
                    className="appearance-none w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 pr-9 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs cursor-pointer"
                  >
                    <option value="">Chưa phân loại</option>
                    <option value="VIP">VIP (Khách hàng cực kỳ quan trọng)</option>
                    <option value="Lead">Tiềm năng (Khả năng chốt cao)</option>
                    <option value="Normal">Thường (Đang chăm sóc cơ bản)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Description -> Nhu cầu khách hàng */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Nhu cầu khách hàng</label>
              <textarea
                id="input-description"
                name="description"
                rows={3}
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full bg-white dark:bg-[#232120] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#332f2c] rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs resize-none"
                placeholder="Mô tả nhu cầu, mong muốn ban đầu của khách hàng..."
              />
            </div>
          </div>
        </div>

        {/* Nút lưu thay đổi - Monochrome */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gray-900 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-6"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Đang cập nhật...' : 'Lưu Thay đổi'}
        </button>
      </form>
    </div>
  );
};

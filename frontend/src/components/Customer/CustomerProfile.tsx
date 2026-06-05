import React, { useState, useEffect } from 'react';
import type { Customer } from '../../types';
import { Save, User as UserIcon, Info, Building2 } from 'lucide-react';
import api from '../../services/api';

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
      const comp = typeof customer.company === 'string' ? null : customer.company;
      setFormData({
        name: customer.name,
        company: comp?.name || (typeof customer.company === 'string' ? customer.company : ''),
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
        appointment: customer.appointment ? new Date(customer.appointment).toISOString().slice(0, 16) : '',
        description: customer.note ?? '',
        classified: customer.classified ?? '',
      });
      setMessage(null);
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        appointment: formData.appointment ? new Date(formData.appointment as string).toISOString() : null,
        note: formData.description,
        classified: formData.classified || null,
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
      
      alert('Cập nhật thông tin khách hàng thành công!');
      
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

  return (
    <div className="glass-panel p-6 rounded-2xl shadow-xl w-full">

      {message && (
        <div className={`p-4 mb-4 rounded-xl text-sm flex items-center gap-2 animate-fade-in ${
          message.type === 'success' ? 'bg-[#e8732c]/10 text-[#e8732c] border border-[#e8732c]/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          <Info className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* --- THÔNG TIN ĐẦU MỐI DOANH NGHIỆP --- */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#e8732c]" />
            Thông tin Đầu mối doanh nghiệp
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Tên Đầu Mối *</label>
                <input
                  type="text"
                  name="company"
                  required
                  value={formData.company || ''}
                  onChange={handleChange}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#e8732c] transition"
                  placeholder="Tên doanh nghiệp / đối tác"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Mã số thuế</label>
                <input
                  type="text"
                  name="company_tax_code"
                  value={formData.company_tax_code || ''}
                  onChange={handleChange}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#e8732c] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email</label>
                <input
                  type="email"
                  name="company_email"
                  value={formData.company_email || ''}
                  onChange={handleChange}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#e8732c] transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Số điện thoại</label>
                <input
                  type="text"
                  name="company_phone"
                  value={formData.company_phone || ''}
                  onChange={handleChange}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#e8732c] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Trạng thái</label>
                <select
                  name="company_status"
                  value={formData.company_status || 'potential'}
                  onChange={handleChange}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#e8732c] transition"
                >
                  <option value="potential">Tiềm năng</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Ngưng HĐ</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Lĩnh vực</label>
                <input
                  type="text"
                  name="company_field"
                  value={formData.company_field || ''}
                  onChange={handleChange}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#e8732c] transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Địa chỉ (Address)</label>
              <input
                type="text"
                name="company_address"
                value={formData.company_address || ''}
                onChange={handleChange}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#e8732c] transition"
              />
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-[#e8732c] mb-2 block">Thông tin Ngân hàng</label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Tên NH</label>
                  <input
                    type="text"
                    name="company_bank_name"
                    value={formData.company_bank_name || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#e8732c] transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 mb-1 block">STK</label>
                  <input
                    type="text"
                    name="company_bank_account_no"
                    value={formData.company_bank_account_no || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#e8732c] transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Chi nhánh</label>
                  <input
                    type="text"
                    name="company_bank_branch"
                    value={formData.company_bank_branch || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#e8732c] transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Ghi chú doanh nghiệp (Note)</label>
              <textarea
                name="company_note"
                rows={2}
                value={formData.company_note || ''}
                onChange={handleChange}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#e8732c] transition resize-none"
              />
            </div>
          </div>
        </div>

        {/* --- THÔNG TIN KHÁCH HÀNG (NGƯỜI ĐẠI DIỆN) --- */}
        <div className="pt-6 border-t border-slate-800">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#e8732c]" />
            Thông tin Người đại diện
          </h3>
          
          <div className="space-y-4">
            {/* Name and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Người đại diện *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name || ''}
                  onChange={handleChange}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] transition"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Số điện thoại *</label>
                <input
                  type="text"
                  name="phone"
                  required
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] transition"
                  placeholder="0901234567"
                />
              </div>
            </div>

            {/* Email and Link URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Thư điện tử (Email)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] transition"
                  placeholder="example@mail.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Đường dẫn liên kết (Link URL)</label>
                <input
                  type="text"
                  name="link_url"
                  value={formData.link_url || ''}
                  onChange={handleChange}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] transition"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Industry and Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Lĩnh vực phân loại</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry || ''}
                  onChange={handleChange}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Giá trị hợp đồng (VNĐ)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 text-xs font-bold">đ</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price || ''}
                    onChange={handleChange}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] transition"
                  />
                </div>
              </div>
            </div>

            {/* Status and Source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Trạng thái chăm sóc</label>
                <select
                  name="status"
                  value={formData.status || 'NEW'}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] transition appearance-none"
                >
                  <option value="NEW">Mới tiếp nhận</option>
                  <option value="CONSULTING">Đang tư vấn</option>
                  <option value="STOPCONSULTING">Ngừng tư vấn</option>
                  <option value="QUOTED">Đã gửi báo giá</option>
                  <option value="SIGNED">Đã ký hợp đồng</option>
                  <option value="REJECTED">Khách từ chối</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Nguồn khách hàng</label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] transition"
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

            {/* Appointment and Classified */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Lịch hẹn chăm sóc tiếp theo</label>
                <input
                  type="datetime-local"
                  name="appointment"
                  value={formData.appointment || ''}
                  onChange={handleChange}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Phân loại khách hàng</label>
                <select
                  name="classified"
                  value={formData.classified || ''}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] transition"
                >
                  <option value="">Chưa phân loại</option>
                  <option value="VIP">VIP (Khách hàng cực kỳ quan trọng)</option>
                  <option value="Lead">Tiềm năng (Khả năng chốt cao)</option>
                  <option value="Normal">Thường (Đang chăm sóc cơ bản)</option>
                </select>
              </div>
            </div>

            {/* Description -> Nhu cầu khách hàng */}
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Nhu cầu khách hàng</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] transition resize-none"
                placeholder="Mô tả nhu cầu, mong muốn ban đầu của khách hàng..."
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#e8732c] hover:bg-[#f5882e] text-white font-medium text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-[0.98] mt-6"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Đang cập nhật...' : 'Lưu Thay đổi'}
        </button>
      </form>
    </div>
  );
};

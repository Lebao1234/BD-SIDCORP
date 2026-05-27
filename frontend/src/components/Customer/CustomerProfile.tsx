import React, { useState, useEffect } from 'react';
import type { Customer } from '../../types';
import { Save, User as UserIcon, Info } from 'lucide-react';
import api from '../../services/api';
import { CompanyForm } from '../Company/CompanyForm';

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
  appointment?: string;
  description?: string;
  classified?: string;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ customer, onUpdate }) => {
  const [formData, setFormData] = useState<CustomerProfileFormData>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyId, setCompanyId] = useState<number | null>(null);

  useEffect(() => {
    if (customer) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompanyId(customer.company_id || null);
      setFormData({
        name: customer.name,
        company: typeof customer.company === 'string' ? customer.company : customer.company?.name ?? '',
        email: customer.email,
        phone: customer.phone_number ?? '',
        industry: customer.field ?? '',
        price: customer.price ?? '',
        status: customer.status ?? 'NEW',
        source: customer.from_source ?? 'Facebook',
        address: customer.address ?? '',
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
        appointment: formData.appointment ? new Date(formData.appointment as string).toISOString() : null,
        note: formData.description,
        classified: formData.classified || null,
        company_id: companyId,
        company_name: !companyId ? formData.company : undefined
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

  return (
    <div className="glass-panel p-6 rounded-2xl shadow-xl w-full">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
          <UserIcon className="w-5 h-5 text-[#e8732c]" />
          Thông tin chi tiết Khách hàng
        </h2>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          formData.status === 'SIGNED' ? 'bg-[#e8732c]/20 text-[#e8732c] border border-[#e8732c]/30' :
          formData.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
          formData.status === 'QUOTED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
          formData.status === 'CONSULTING' ? 'bg-[#e8732c]/20 text-[#e8732c] border border-[#e8732c]/30' :
          'bg-slate-500/20 text-slate-400 border border-slate-500/30'
        }`}>
          {formData.status === 'SIGNED' ? 'Đã ký hợp đồng' :
           formData.status === 'REJECTED' ? 'Khách từ chối' :
           formData.status === 'QUOTED' ? 'Đã gửi báo giá' :
           formData.status === 'CONSULTING' ? 'Đang tư vấn' :
           'Mới nhận'}
        </span>
      </div>

      {message && (
        <div className={`p-4 mb-4 rounded-xl text-sm flex items-center gap-2 animate-fade-in ${
          message.type === 'success' ? 'bg-[#e8732c]/10 text-[#e8732c] border border-[#e8732c]/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          <Info className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name and Company */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Họ và tên khách hàng *</label>
            <div className="relative">
              <input
                type="text"
                name="name"
                required
                value={formData.name || ''}
                onChange={handleChange}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] focus:ring-1 focus:ring-[#e8732c] transition"
                placeholder="Nguyễn Văn A"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 flex justify-between items-center">
              Công ty / Đối tác
              <button 
                type="button"
                onClick={() => setIsCompanyModalOpen(true)}
                className="text-[10px] text-[#e8732c] hover:underline flex items-center gap-1"
              >
                {companyId ? 'Sửa thông tin CT' : '+ Thêm mới CT'}
              </button>
            </label>
            <input
              type="text"
              name="company"
              value={formData.company || ''}
              readOnly={!!companyId}
              onChange={handleChange}
              onClick={() => {
                if (companyId) setIsCompanyModalOpen(true);
              }}
              className={`w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] focus:ring-1 focus:ring-[#e8732c] transition ${companyId ? 'cursor-pointer hover:bg-slate-800' : ''}`}
              placeholder="Tên công ty"
            />
          </div>
        </div>

        {/* Email and Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Thư điện tử (Email)</label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] focus:ring-1 focus:ring-[#e8732c] transition"
                placeholder="example@mail.com"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Số điện thoại *</label>
            <input
              type="text"
              name="phone"
              required
              value={formData.phone || ''}
              onChange={handleChange}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] focus:ring-1 focus:ring-[#e8732c] transition"
              placeholder="0901234567"
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
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] focus:ring-1 focus:ring-[#e8732c] transition"
              placeholder="Ví dụ: Bất động sản, Công nghệ..."
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
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] focus:ring-1 focus:ring-[#e8732c] transition"
                placeholder="Dự kiến hoặc chính thức"
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
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] focus:ring-1 focus:ring-[#e8732c] transition appearance-none"
            >
              <option value="NEW">Mới tiếp nhận</option>
              <option value="CONSULTING">Đang tư vấn</option>
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
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] focus:ring-1 focus:ring-[#e8732c] transition"
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

        {/* Address and Appointment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Địa chỉ</label>
            <input
              type="text"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] focus:ring-1 focus:ring-[#e8732c] transition"
              placeholder="Hà Nội, TP.HCM..."
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Lịch hẹn chăm sóc tiếp theo</label>
            <input
              type="datetime-local"
              name="appointment"
              value={formData.appointment || ''}
              onChange={handleChange}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] focus:ring-1 focus:ring-[#e8732c] transition"
            />
          </div>
        </div>

        {/* Classified */}
        <div>
          <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Phân loại khách hàng</label>
          <select
            name="classified"
            value={formData.classified || ''}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] focus:ring-1 focus:ring-[#e8732c] transition"
          >
            <option value="">Chưa phân loại</option>
            <option value="VIP">VIP (Khách hàng cực kỳ quan trọng)</option>
            <option value="Lead">Tiềm năng (Khả năng chốt cao)</option>
            <option value="Normal">Thường (Đang chăm sóc cơ bản)</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Mô tả / Ghi chú thêm ban đầu</label>
          <textarea
            name="description"
            rows={3}
            value={formData.description || ''}
            onChange={handleChange}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8732c] focus:ring-1 focus:ring-[#e8732c] transition resize-none"
            placeholder="Mô tả nhu cầu, mong muốn ban đầu của khách hàng..."
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#e8732c] hover:bg-[#f5882e] text-white font-medium text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-[0.98]"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Đang cập nhật...' : 'Lưu Thay đổi'}
        </button>
      </form>

      {/* COMPANY MODAL */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsCompanyModalOpen(false)}
          />
          <div className="glass-panel p-6 rounded-2xl shadow-2xl z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-800 relative">
            <h3 className="text-lg font-bold text-white mb-4 pb-2 border-b border-slate-800">
              {companyId ? 'Thông tin Công ty' : 'Thêm Công ty mới'}
            </h3>
            <CompanyForm 
              companyId={companyId}
              onSaved={(companyData) => {
                setIsCompanyModalOpen(false);
                if (companyData) {
                  setCompanyId(companyData.id);
                  setFormData(prev => ({ ...prev, company: companyData.name }));
                }
              }}
              onCancel={() => setIsCompanyModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

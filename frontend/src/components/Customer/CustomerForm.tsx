/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { X, Save, User, Briefcase, Phone, Mail } from 'lucide-react';
import { Button } from '../Button/Button';
import api from '../../services/api';

interface CustomerData {
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  description: string;
}

interface CustomerFormProps {
  customerId?: number;
  initialData?: Partial<CustomerData>;
  onClose: () => void;
  onSuccess: (data: CustomerData) => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ customerId, initialData, onClose, onSuccess }) => {
  const isEdit = !!initialData && !!customerId;
  const [formData, setFormData] = useState<CustomerData>({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'NEW',
    description: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        name:         formData.name,
        email:        formData.email || undefined,
        phone_number: formData.phone || undefined,
        status:       formData.status,
        note:         formData.description || undefined,
        company_name: formData.company || undefined,
      };
      if (isEdit && customerId) {
        await api.put(`/customers/${customerId}`, payload);
      } else {
        await api.post('/customers', payload);
      }
      onSuccess(formData);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-[#1d1c19] w-full max-w-lg rounded-2xl p-6 relative animate-modal-pop border border-gray-200 dark:border-[#332f2c] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#282522] rounded-xl transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 dark:text-[#f2f0ed] mb-6 flex items-center gap-2">
          {isEdit ? <Briefcase className="w-5 h-5 text-[#e8732c]" /> : <User className="w-5 h-5 text-[#e8732c]" />}
          {isEdit ? 'Cập nhật Khách Hàng' : 'Thêm Mới Khách Hàng'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-[#a8a49d] block mb-1.5">Họ và Tên <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-white dark:bg-[#232120] border border-gray-200 dark:border-[#332f2c] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-[#f2f0ed] placeholder:text-gray-400 dark:placeholder:text-[#7f7b74] focus:outline-none focus:border-[#e8732c] dark:focus:border-[#e8732c] transition shadow-2xs"
                placeholder="Nhập tên khách hàng"
              />
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-[#a8a49d] block mb-1.5">Số điện thoại <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 dark:text-[#7f7b74]" />
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#232120] border border-gray-200 dark:border-[#332f2c] rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-[#f2f0ed] placeholder:text-gray-400 dark:placeholder:text-[#7f7b74] focus:outline-none focus:border-[#e8732c] dark:focus:border-[#e8732c] transition shadow-2xs"
                  placeholder="09..."
                />
              </div>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-[#a8a49d] block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 dark:text-[#7f7b74]" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#232120] border border-gray-200 dark:border-[#332f2c] rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-[#f2f0ed] placeholder:text-gray-400 dark:placeholder:text-[#7f7b74] focus:outline-none focus:border-[#e8732c] dark:focus:border-[#e8732c] transition shadow-2xs"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-[#a8a49d] block mb-1.5">Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-white dark:bg-[#232120] border border-gray-200 dark:border-[#332f2c] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-[#f2f0ed] focus:outline-none focus:border-[#e8732c] dark:focus:border-[#e8732c] transition shadow-2xs"
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
            
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-[#a8a49d] block mb-1.5">Ghi chú</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-white dark:bg-[#232120] border border-gray-200 dark:border-[#332f2c] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-[#f2f0ed] placeholder:text-gray-400 dark:placeholder:text-[#7f7b74] focus:outline-none focus:border-[#e8732c] dark:focus:border-[#e8732c] transition shadow-2xs resize-none"
                placeholder="Thông tin thêm..."
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-500 mt-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-[#2a2724]">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />} disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo khách hàng'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

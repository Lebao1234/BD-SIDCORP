import React, { useState, useEffect } from 'react';
import { X, Save, User, Briefcase, Phone, Mail } from 'lucide-react';
import { Button } from '../Button/Button';

interface CustomerData {
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  description: string;
}

interface CustomerFormProps {
  initialData?: Partial<CustomerData>;
  onClose: () => void;
  onSuccess: (data: CustomerData) => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ initialData, onClose, onSuccess }) => {
  const isEdit = !!initialData;
  const [formData, setFormData] = useState<CustomerData>({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'NEW',
    description: ''
  });

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call or call real API here
    // const response = await api.post('/customers', formData);
    console.log('Submitting:', formData);
    onSuccess(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 relative animate-fade-in border border-slate-700 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          {isEdit ? <Briefcase className="w-5 h-5 text-yellow-500" /> : <User className="w-5 h-5 text-yellow-500" />}
          {isEdit ? 'Cập nhật Khách Hàng' : 'Thêm Mới Khách Hàng'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Họ và Tên</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-yellow-500 transition"
                placeholder="Nhập tên khách hàng"
              />
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Số điện thoại</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-yellow-500 transition"
                  placeholder="09..."
                />
              </div>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-yellow-500 transition"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-yellow-500 transition appearance-none"
              >
                <option value="NEW">Mới nhận</option>
                <option value="CONSULTING">Đang tư vấn</option>
                <option value="QUOTED">Đã gửi báo giá</option>
                <option value="SIGNED">Đã ký hợp đồng</option>
                <option value="REJECTED">Khách từ chối</option>
              </select>
            </div>
            
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Ghi chú</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-yellow-500 transition resize-none"
                placeholder="Thông tin thêm..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
              {isEdit ? 'Lưu thay đổi' : 'Tạo khách hàng'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export interface CompanyData {
  id?: number;
  name: string;
  tax_code?: string;
  email?: string;
  phone?: string;
  website?: string;
  facebook?: string;
  linkedin?: string;
  zalo?: string;
  address?: string;
  location?: string;
  field?: string;
  status: 'active' | 'inactive' | 'potential';
  note?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_branch?: string;
}

const INITIAL_FORM: CompanyData = {
  name: '',
  tax_code: '',
  email: '',
  phone: '',
  website: '',
  facebook: '',
  linkedin: '',
  zalo: '',
  address: '',
  location: '',
  field: '',
  status: 'potential',
  note: '',
  bank_name: '',
  bank_account_no: '',
  bank_branch: '',
};

interface CompanyFormProps {
  companyId: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSaved: (company?: any) => void;
  onCancel: () => void;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({ companyId, onSaved, onCancel }) => {
  const [formData, setFormData] = useState<CompanyData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (companyId) {
      // eslint-disable-next-line react-hooks/immutability
      fetchCompanyDetail();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(INITIAL_FORM);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const fetchCompanyDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/companies/${companyId}`);
      if (res.data) {
        setFormData(res.data);
      }
    } catch (err) {
      console.error('Lỗi lấy thông tin công ty', err);
      setError('Không thể lấy thông tin chi tiết.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CompanyData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (companyId) {
        res = await api.put(`/companies/${companyId}`, formData);
      } else {
        res = await api.post('/companies', formData);
      }
      onSaved(res.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Lỗi khi lưu công ty.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && companyId && formData.name === '') {
    return <div className="text-slate-400 text-center py-4">Đang tải...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {error && (
        <div className="p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-semibold text-slate-400 block mb-1">Tên công ty *</label>
          <input
            type="text"
            required
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
          />
        </div>
        <div>
          <label className="font-semibold text-slate-400 block mb-1">Mã số thuế</label>
          <input
            type="text"
            value={formData.tax_code || ''}
            onChange={(e) => handleChange('tax_code', e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-semibold text-slate-400 block mb-1">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
          />
        </div>
        <div>
          <label className="font-semibold text-slate-400 block mb-1">Số điện thoại</label>
          <input
            type="text"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-semibold text-slate-400 block mb-1">Trạng thái</label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
          >
            <option value="potential">Tiềm năng</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngưng HĐ</option>
          </select>
        </div>
        <div>
          <label className="font-semibold text-slate-400 block mb-1">Lĩnh vực</label>
          <input
            type="text"
            value={formData.field || ''}
            onChange={(e) => handleChange('field', e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
          />
        </div>
      </div>

      <div>
        <label className="font-semibold text-slate-400 block mb-1">Địa chỉ (Address)</label>
        <input
          type="text"
          value={formData.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
        />
      </div>

      <div className="pt-2">
        <h4 className="text-[#e8732c] font-bold mb-2">Thông tin Ngân hàng</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="font-semibold text-slate-400 block mb-1">Tên NH</label>
            <input
              type="text"
              value={formData.bank_name || ''}
              onChange={(e) => handleChange('bank_name', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-400 block mb-1">STK</label>
            <input
              type="text"
              value={formData.bank_account_no || ''}
              onChange={(e) => handleChange('bank_account_no', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-400 block mb-1">Chi nhánh</label>
            <input
              type="text"
              value={formData.bank_branch || ''}
              onChange={(e) => handleChange('bank_branch', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="font-semibold text-slate-400 block mb-1">Ghi chú (Note)</label>
        <textarea
          value={formData.note || ''}
          onChange={(e) => handleChange('note', e.target.value)}
          placeholder="Nhập ghi chú..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#e8732c] transition resize-none"
          rows={3}
        />
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-800 gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800 transition"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-[#e8732c] hover:bg-[#f5882e] text-white rounded-xl font-bold transition disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : 'Lưu Công ty'}
        </button>
      </div>
    </form>
  );
};

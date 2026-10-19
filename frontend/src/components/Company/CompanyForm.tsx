import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CreditCard, ChevronDown, Loader2 } from 'lucide-react';

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
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!companyId) {
      // Đổi từ sửa sang thêm mới phải xoá dữ liệu của doanh nghiệp trước đó khỏi form.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(INITIAL_FORM);
      return;
    }
    // Đổi companyId nhanh liên tiếp: phản hồi của lần gọi cũ về sau không được ghi đè form.
    let cancelled = false;
    const fetchCompanyDetail = async () => {
      setFetching(true);
      try {
        const res = await api.get(`/companies/${companyId}`);
        if (!cancelled && res.data) {
          setFormData(res.data);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Lỗi lấy thông tin đầu mối doanh nghiệp', err);
        setError('Không thể lấy thông tin chi tiết.');
      } finally {
        if (!cancelled) setFetching(false);
      }
    };
    fetchCompanyDetail();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

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
      setError(err?.response?.data?.error || 'Lỗi khi lưu đầu mối doanh nghiệp.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching && companyId && formData.name === '') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-fg-faint gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-xs">Đang tải thông tin doanh nghiệp...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {error && (
        <div className="p-3 rounded-xl text-xs bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 font-medium">
          {error}
        </div>
      )}

      {/* Tên và Mã số thuế */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">
            Tên doanh nghiệp *
          </label>
          <input
            type="text"
            required
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Ví dụ: Công ty Cổ phần Alpha..."
            className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-fg-faint dark:placeholder:text-fg-subtle shadow-2xs"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">
            Mã số thuế (MST)
          </label>
          <input
            type="text"
            value={formData.tax_code || ''}
            onChange={(e) => handleChange('tax_code', e.target.value)}
            placeholder="010xxxxxxx"
            className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-fg-faint dark:placeholder:text-fg-subtle shadow-2xs"
          />
        </div>
      </div>

      {/* Email và SĐT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">
            Email doanh nghiệp
          </label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="contact@company.vn"
            className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-fg-faint dark:placeholder:text-fg-subtle shadow-2xs"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">
            Số điện thoại
          </label>
          <input
            type="text"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="024 xxxx xxxx"
            className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-fg-faint dark:placeholder:text-fg-subtle shadow-2xs"
          />
        </div>
      </div>

      {/* Trạng thái và Lĩnh vực */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">
            Trạng thái hoạt động
          </label>
          <div className="relative">
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="appearance-none w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 pr-9 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs cursor-pointer"
            >
              <option value="potential">Tiềm năng</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngưng HĐ</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">
            Lĩnh vực kinh doanh
          </label>
          <input
            type="text"
            value={formData.field || ''}
            onChange={(e) => handleChange('field', e.target.value)}
            placeholder="Công nghệ, F&B, Logistics..."
            className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-fg-faint dark:placeholder:text-fg-subtle shadow-2xs"
          />
        </div>
      </div>

      {/* Địa chỉ */}
      <div>
        <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">
          Địa chỉ trụ sở / văn phòng
        </label>
        <input
          type="text"
          value={formData.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố..."
          className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 dark:focus:ring-white/10 outline-none transition placeholder:text-fg-faint dark:placeholder:text-fg-subtle shadow-2xs"
        />
      </div>

      {/* Thông tin Ngân hàng */}
      <div className="pt-3 border-t border-divider dark:border-line">
        <h4 className="text-xs font-semibold text-fg dark:text-white mb-2.5 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-fg-faint" />
          Thông tin Ngân hàng
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-fg-subtle dark:text-fg-muted mb-1 block">Tên ngân hàng</label>
            <input
              type="text"
              value={formData.bank_name || ''}
              onChange={(e) => handleChange('bank_name', e.target.value)}
              placeholder="VCB, Techcombank..."
              className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3 py-1.5 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-fg-subtle dark:text-fg-muted mb-1 block">Số tài khoản (STK)</label>
            <input
              type="text"
              value={formData.bank_account_no || ''}
              onChange={(e) => handleChange('bank_account_no', e.target.value)}
              placeholder="0123456789"
              className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3 py-1.5 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-fg-subtle dark:text-fg-muted mb-1 block">Chi nhánh</label>
            <input
              type="text"
              value={formData.bank_branch || ''}
              onChange={(e) => handleChange('bank_branch', e.target.value)}
              placeholder="Chi nhánh Hà Nội..."
              className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3 py-1.5 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Ghi chú */}
      <div>
        <label className="text-[11px] font-semibold text-fg-muted dark:text-fg-muted mb-1.5 block">
          Ghi chú nội bộ (Note)
        </label>
        <textarea
          value={formData.note || ''}
          onChange={(e) => handleChange('note', e.target.value)}
          placeholder="Ghi chú nội bộ về đầu mối doanh nghiệp này..."
          className="w-full bg-surface dark:bg-surface text-fg dark:text-fg border border-line dark:border-line rounded-xl px-3.5 py-2 text-xs focus:border-gray-900 dark:focus:border-white focus:ring-1 outline-none transition shadow-2xs resize-none"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-4 border-t border-divider dark:border-line gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 bg-raised dark:bg-surface text-fg-body dark:text-fg-body hover:bg-line dark:hover:bg-raised rounded-xl text-xs font-medium transition cursor-pointer"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : (companyId ? 'Lưu thay đổi' : 'Tạo doanh nghiệp')}
        </button>
      </div>
    </form>
  );
};

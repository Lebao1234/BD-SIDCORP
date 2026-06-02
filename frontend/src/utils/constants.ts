export const CUSTOMER_STATUS_LABEL: Record<string, string> = {
  SIGNED:     'Ký HĐ',
  REJECTED:   'Từ chối',
  QUOTED:     'Gửi báo giá',
  CONSULTING: 'Tư vấn',
  NEW:        'Mới',
};

export const CUSTOMER_STATUS_CLASS: Record<string, string> = {
  SIGNED:     'bg-[#e8732c]/20 text-[#e8732c]',
  REJECTED:   'bg-rose-500/20 text-rose-400',
  QUOTED:     'bg-blue-500/20 text-blue-400',
  CONSULTING: 'bg-[#e8732c]/20 text-[#e8732c]',
  NEW:        'bg-slate-500/20 text-slate-400',
};

export const COMPANY_STATUS_LABEL: Record<string, string> = {
  potential: 'Tiềm năng',
  active: 'Đang hoạt động',
  inactive: 'Ngưng HĐ',
};

export const COMPANY_STATUS_CLASS: Record<string, string> = {
  potential: 'bg-blue-500/20 text-blue-400',
  active: 'bg-emerald-500/20 text-emerald-400',
  inactive: 'bg-rose-500/20 text-rose-400',
};

export const INITIAL_CUSTOMER_FORM = {
  name: '', company_id: '', company_name: '', field: '', price: '',
  status: 'NEW', email: '', phone_number: '', address: '',
  from_source: 'Facebook', appointment: '', note: '', classified: '', link_url: '',
};

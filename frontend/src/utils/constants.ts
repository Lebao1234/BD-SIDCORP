export const CUSTOMER_STATUS_LABEL: Record<string, string> = {
  NEW:           'Mới tiếp nhận',
  DEMO_SENT:     'Đã gửi demo',
  QUOTED:        'Đã gửi báo giá',
  CONTRACT_SENT: 'Đã gửi hợp đồng',
  SIGNED:        'Đã ký hợp đồng',
  REJECTED:      'Đã hủy',
  CONSULTING:    'Đang tư vấn',
  STOPCONSULTING:'Ngừng tư vấn',
};

export const CUSTOMER_STATUS_CLASS: Record<string, string> = {
  NEW:           'bg-slate-500/20 text-slate-400',
  DEMO_SENT:     'bg-violet-500/20 text-violet-400',
  QUOTED:        'bg-blue-500/20 text-blue-400',
  CONTRACT_SENT: 'bg-amber-500/20 text-amber-400',
  SIGNED:        'bg-emerald-500/20 text-emerald-400',
  REJECTED:      'bg-rose-500/20 text-rose-400',
  CONSULTING:    'bg-sky-500/20 text-sky-400',
  STOPCONSULTING:'bg-slate-500/20 text-slate-400',
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
  reject_reason: '', current_step: '',
};

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
  NEW:           'border border-gray-300 text-gray-700 bg-gray-50/60 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800/30',
  DEMO_SENT:     'border border-indigo-400 text-indigo-700 bg-indigo-50/60 dark:border-indigo-400 dark:text-indigo-400 dark:bg-indigo-950/20',
  QUOTED:        'border border-blue-400 text-blue-600 bg-blue-50/60 dark:border-blue-400 dark:text-blue-400 dark:bg-blue-950/20',
  CONTRACT_SENT: 'border border-amber-400 text-amber-700 bg-amber-50/60 dark:border-amber-400 dark:text-amber-400 dark:bg-amber-950/20',
  SIGNED:        'border border-emerald-500 text-emerald-700 bg-emerald-50/60 dark:border-emerald-400 dark:text-emerald-400 dark:bg-emerald-950/20',
  REJECTED:      'border border-rose-200 text-rose-600 bg-rose-100/80 dark:border-rose-900/60 dark:text-rose-400 dark:bg-rose-950/40',
  CONSULTING:    'border border-blue-400 text-blue-600 bg-blue-50/60 dark:border-blue-400 dark:text-blue-400 dark:bg-blue-950/20',
  STOPCONSULTING:'border border-rose-200 text-rose-600 bg-rose-50/70 dark:border-rose-900/40 dark:text-rose-400 dark:bg-rose-950/30',
};

export const COMPANY_STATUS_LABEL: Record<string, string> = {
  potential: 'Tiềm năng',
  active: 'Đang hoạt động',
  inactive: 'Ngưng HĐ',
};

export const COMPANY_STATUS_CLASS: Record<string, string> = {
  potential: 'border border-blue-400 text-blue-600 bg-blue-50/60 dark:border-blue-400 dark:text-blue-400 dark:bg-blue-950/20',
  active:    'border border-emerald-500 text-emerald-700 bg-emerald-50/60 dark:border-emerald-400 dark:text-emerald-400 dark:bg-emerald-950/20',
  inactive:  'border border-rose-200 text-rose-600 bg-rose-100/80 dark:border-rose-900/60 dark:text-rose-400 dark:bg-rose-950/40',
};

export const INITIAL_CUSTOMER_FORM = {
  name: '', company_id: '', company_name: '', field: '', price: '',
  status: 'NEW', email: '', phone_number: '', address: '',
  from_source: 'Facebook', appointment: '', note: '', classified: '', link_url: '',
  reject_reason: '', current_step: '',
};

/* Chấm màu trạng thái — dùng cho bảng và biểu đồ ở trang Báo cáo.
   Bảng màu lấy từ .design/canvas.json: màu chỉ nằm ở chấm 6px, chữ giữ màu
   thường, không dùng viên thuốc nền pastel. */
export const CUSTOMER_STATUS_DOT: Record<string, string> = {
  NEW:           '#c9c5be',
  CONSULTING:    '#b5730f',
  DEMO_SENT:     '#7a5bbd',
  QUOTED:        '#3f7dbd',
  CONTRACT_SENT: '#2f5f8f',
  SIGNED:        '#1a7f4b',
  REJECTED:      '#c2372b',
  STOPCONSULTING:'#a5a199',
};

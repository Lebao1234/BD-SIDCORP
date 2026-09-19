import type { Note } from '../types/note';

export const LABELS = ['Tư vấn', 'Khách hàng', 'Hợp đồng', 'Báo giá', 'Kế hoạch', 'Nội bộ'];

export const INITIAL_NOTES: Note[] = [
  {
    id: '1',
    title: 'Khảo sát nhu cầu chuyển đổi số CRM',
    content:
      'Khách hàng mong muốn quản trị tập trung luồng tiếp cận 15 sales rep, tích hợp kho tài liệu Drive và cảnh báo công việc quá hạn trên mobile.',
    labels: ['Tư vấn', 'Khách hàng'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Checklist chuẩn bị hồ sơ thầu & Báo giá',
    checklist: [
      { id: 'c1', text: 'Bản đề xuất giải pháp ERP/CRM hoàn chỉnh', done: true },
      { id: 'c2', text: 'Bảng tính ROI và lộ trình triển khai 4 giai đoạn', done: true },
      { id: 'c3', text: 'Dự thảo hợp đồng dịch vụ và cam kết bảo mật SLA', done: false },
      { id: 'c4', text: 'Hồ sơ năng lực công ty và 3 case studies tương tự', done: true },
      { id: 'c5', text: 'Xác nhận lịch pitching trực tiếp với Ban Giám Đốc', done: false },
    ],
    labels: ['Báo giá', 'Hợp đồng'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Thỏa thuận điều khoản thanh toán hợp đồng',
    content:
      'Đề xuất chia 3 đợt thanh toán: Đợt 1 (40% khi ký), Đợt 2 (40% sau khi bàn giao module CRM), Đợt 3 (20% sau nghiệm thu 30 ngày).',
    labels: ['Hợp đồng', 'Tư vấn'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Kế hoạch triển khai quý 4 & Phân bổ nhân sự',
    checklist: [
      { id: 'k1', text: 'Đào tạo nhân sự sử dụng tính năng @mention và nhắc việc', done: true },
      { id: 'k2', text: 'Nhập danh sách 200 khách hàng tiềm năng vào database', done: false },
      { id: 'k3', text: 'Kiểm tra phân quyền Admin vs Nhân viên tư vấn', done: true },
    ],
    labels: ['Kế hoạch', 'Nội bộ'],
    createdAt: new Date().toISOString(),
  },
];


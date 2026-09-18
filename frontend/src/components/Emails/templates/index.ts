import { TEMPLATE_SIDPEAK } from './sidpeakTemplate';
import { TEMPLATE_INTRO_ERP } from './introErpTemplate';
import { TEMPLATE_PROPOSAL } from './proposalTemplate';
import { TEMPLATE_DEMO_FOLLOWUP } from './demoFollowupTemplate';

export interface EmailTemplateItem {
  id: string;
  name: string;
  category: string;
  badgeColor: string;
  description: string;
  defaultSubject: string;
  htmlContent: string;
}

/** Kho mẫu email dựng sẵn. */
export const AVAILABLE_TEMPLATES: EmailTemplateItem[] = [
  {
    id: 'sidpeak',
    name: 'SidPeak — Quản Trị Nhân Sự',
    category: 'HRM Solution',
    badgeColor:
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    description:
      'Giới thiệu nền tảng quản trị hồ sơ nhân sự, tự động hóa chấm công & tính lương chuyên nghiệp.',
    defaultSubject:
      '[SidPeak] Giải Pháp Quản Trị Nhân Sự & Tự Động Hóa Chấm Công, Tính Lương Cho Doanh Nghiệp',
    htmlContent: TEMPLATE_SIDPEAK,
  },
  {
    id: 'intro_erp',
    name: 'Giới Thiệu Hệ Sinh Thái SIDCORP',
    category: 'Cold Outreach',
    badgeColor:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    description:
      'Thư ngỏ tiếp cận ban lãnh đạo, chuẩn hóa quy trình quản trị khách hàng & bán hàng doanh nghiệp.',
    defaultSubject:
      '[SIDCORP] Giải pháp Quản trị & Tối ưu Quy trình Bán hàng Chuyên sâu Cho Doanh Nghiệp',
    htmlContent: TEMPLATE_INTRO_ERP,
  },
  {
    id: 'proposal',
    name: 'Đề Xuất Giải Pháp & Báo Giá CRM',
    category: 'Báo giá / Proposal',
    badgeColor:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    description:
      'Thư ngỏ hợp tác, dự toán chi phí triển khai hệ thống và chính sách ưu đãi đặc quyền theo quý.',
    defaultSubject: 'Thư ngỏ Hợp tác & Dự toán Triển khai Hệ thống CRM Doanh nghiệp Q4',
    htmlContent: TEMPLATE_PROPOSAL,
  },
  {
    id: 'demo_followup',
    name: 'Chăm Sóc Sau Buổi Demo CRM',
    category: 'Nurturing / CSKH',
    badgeColor:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    description:
      'Email cảm ơn và gửi biên bản cuộc họp, slide tổng quan tính năng sau buổi demo thực tế.',
    defaultSubject: 'Tài liệu đính kèm & Biên bản tóm tắt buổi Demo CRM Doanh nghiệp',
    htmlContent: TEMPLATE_DEMO_FOLLOWUP,
  },
];

export const DEFAULT_TEMPLATE_ID = 'sidpeak';

export const findTemplate = (id: string): EmailTemplateItem | undefined =>
  AVAILABLE_TEMPLATES.find((t) => t.id === id);

export { TEMPLATE_SIDPEAK };

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppLayout } from '../../components/Layout/AppLayout';
import { AnimatedCounter } from '../../components/common/AnimatedCounter';
import api from '../../services/api';
import { TEMPLATE_SIDPEAK } from './templates/sidpeakTemplate';
import {
  Mail,
  Send,
  CheckCircle2,
  Clock,
  Code,
  Eye,
  Copy,
  Check,
  Plus,
  Search,
  Smartphone,
  Monitor,
  X,
  FileText,
  Users,
  Calendar,
  Sparkles,
  ExternalLink,
  Trash2,
  RotateCw,
  Briefcase,
  Layers,
  MoreHorizontal,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Circle,
  Upload,
  CheckSquare,
  Square,
  ChevronDown,
} from 'lucide-react';

export interface EmailCampaign {
  id: string;
  dbId?: number;
  code: string;
  category: string;
  title: string;
  subject: string;
  targetAudience: string;
  priority: 'high' | 'medium' | 'low';
  status: 'sent' | 'draft' | 'in_progress';
  sentAt?: string;
  scheduledAt?: string;
  templateHtml: string;
  usagesCount?: number;
}

// Bộ template email marketing HTML mẫu chuyên nghiệp cho Consultant
const TEMPLATE_INTRO_ERP = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Giới thiệu Hệ sinh thái SIDCORP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e4e4e7;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #18181b; padding: 32px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">SIDCORP SOLUTIONS</h1>
              <p style="color: #a1a1aa; margin: 8px 0 0 0; font-size: 13px;">Giải pháp Quản trị & Tối ưu Quy trình Bán hàng Chuyên sâu</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 30px;">
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Kính gửi <strong>Quý Ban Lãnh đạo Doanh nghiệp</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #3f3f46; margin: 0 0 20px 0;">
                Chúng tôi hiểu rằng việc theo dõi luồng khách hàng từ lúc tiếp cận đến khi ký hợp đồng và triển khai thường gặp nhiều rào cản do thiếu một hệ thống tập trung. 
                <strong>Hệ thống SIDCORP CRM</strong> được xây dựng chuyên biệt để giải quyết bài toán này.
              </p>
              <!-- Features Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px; background-color: #f8fafc; border-radius: 10px; border-left: 4px solid #18181b; margin-bottom: 10px;">
                    <strong style="font-size: 13px; color: #09090b;">✓ Quản lý Khách hàng & Đầu mối Doanh nghiệp</strong>
                    <p style="font-size: 12px; color: #71717a; margin: 4px 0 0 0;">Lưu vết lịch sử tư vấn, đính kèm hợp đồng, tài liệu và tiến trình chăm sóc.</p>
                  </td>
                </tr>
                <tr><td height="10"></td></tr>
                <tr>
                  <td style="padding: 14px; background-color: #f8fafc; border-radius: 10px; border-left: 4px solid #18181b;">
                    <strong style="font-size: 13px; color: #09090b;">✓ Tích hợp Tài liệu Drive & Báo giá tức thì</strong>
                    <p style="font-size: 12px; color: #71717a; margin: 4px 0 0 0;">Truy cập nhanh bộ hồ sơ năng lực theo ngành nghề chỉ với 1 click.</p>
                  </td>
                </tr>
              </table>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
                <tr>
                  <td align="center">
                    <a href="https://sidcorp.vn/demo" style="background-color: #18181b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; display: inline-block;">
                      Đặt Lịch Demo Hệ Thống (30 Phút)
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 13px; line-height: 1.5; color: #71717a; margin: 20px 0 0 0;">
                Trân trọng,<br>
                <strong>Đội ngũ Tư vấn Cấp cao SIDCORP</strong><br>
                Hotline: 0901 234 567 | Email: contact@sidcorp.vn
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f4f5; padding: 18px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="font-size: 11px; color: #71717a; margin: 0;">© 2026 SIDCORP Corporation. Bảo lưu mọi quyền.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const TEMPLATE_PROPOSAL = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Thư ngỏ Hợp tác & Báo giá Đặc quyền</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #ffffff; font-family: Arial, sans-serif; color: #27272a;">
  <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 12px; padding: 28px;">
    <h2 style="color: #09090b; font-size: 18px; margin-top: 0;">THƯ NGỎ HỢP TÁC &amp; ĐỀ XUẤT GIẢI PHÁP TƯ VẤN</h2>
    <p style="font-size: 13px; line-height: 1.6; color: #52525b;">Chào Quý đối tác,</p>
    <p style="font-size: 13px; line-height: 1.6; color: #52525b;">
      Sau buổi làm việc sơ bộ về định hướng mở rộng thị trường, chúng tôi đã hoàn thiện bản đề xuất chi tiết giải pháp chuẩn hóa quy trình CRM.
    </p>
    <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="font-size: 12px; margin: 0 0 8px 0; color: #71717a;">GÓI ĐỀ XUẤT:</p>
      <p style="font-size: 15px; font-weight: bold; margin: 0; color: #09090b;">Gói Tư vấn &amp; Triển khai Hệ thống CRM Doanh nghiệp</p>
      <p style="font-size: 12px; margin: 6px 0 0 0; color: #16a34a; font-weight: 600;">✓ Ưu đãi đặc quyền 15% khi xác nhận triển khai trong tháng</p>
    </div>
    <p style="font-size: 13px; line-height: 1.6; color: #52525b;">
      Quý đối tác vui lòng xem chi tiết tài liệu đính kèm bên dưới hoặc phản hồi email này để đặt lịch ký kết hợp đồng.
    </p>
    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
    <p style="font-size: 12px; color: #a1a1aa; margin: 0;">SIDCORP Consulting Solutions · contact@sidcorp.vn</p>
  </div>
</body>
</html>`;

export const MarketingEmailPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'sent' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // CRM Customers for dispatching email
  const [customers, setCustomers] = useState<{ id: number; name: string | null; phone_number: string | null }[]>([]);

  // Preview Modal State
  const [previewCampaign, setPreviewCampaign] = useState<EmailCampaign | null>(null);
  const [previewMode, setPreviewMode] = useState<'visual' | 'code'>('visual');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);

  // New Campaign Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newAudience, setNewAudience] = useState('Doanh nghiệp B2B');
  const [newCategory, setNewCategory] = useState('Cold Outreach');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newStatus, setNewStatus] = useState<'draft' | 'sent'>('draft');
  const [templateSource, setTemplateSource] = useState<'preset_sidpeak' | 'preset_intro' | 'preset_proposal' | 'custom_html'>('preset_sidpeak');
  const [customHtmlInput, setCustomHtmlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Send to Customer Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchCampaign, setDispatchCampaign] = useState<EmailCampaign | null>(null);
  const [dispatchCustomerId, setDispatchCustomerId] = useState<number | ''>('');
  const [dispatchFeedback, setDispatchFeedback] = useState<string | null>(null);

  // Close popup menu when clicking outside
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch campaigns from backend Asset database (type=EMAIL_TEMPLATE)
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assets?type=EMAIL_TEMPLATE');
      const assets = res.data || [];
      const mapped: EmailCampaign[] = assets.map((a: any, idx: number) => {
        const meta = a.meta || {};
        const isSent = a.status === 'PUBLISHED' || meta.status === 'sent';
        const codeNum = a.id ? (8000 + a.id) : (7000 + idx);

        let priority: 'high' | 'medium' | 'low' = 'medium';
        if (a.title.includes('SidPeak') || a.title.includes('Báo giá') || meta.targetAudience?.includes('VIP')) priority = 'high';
        else if (a.title.includes('Demo') || a.title.includes('Chăm sóc')) priority = 'medium';
        else priority = 'low';

        return {
          id: String(a.id),
          dbId: a.id,
          code: `CAMP-${codeNum}`,
          category: a.category || (a.title.includes('SidPeak') ? 'HRM Solution' : a.title.includes('Báo giá') ? 'Follow-up' : a.title.includes('Demo') ? 'Nurturing' : 'Cold Outreach'),
          title: a.title,
          subject: meta.subject || a.title,
          targetAudience: meta.targetAudience || 'Doanh nghiệp B2B',
          priority,
          status: isSent ? 'sent' : 'draft',
          sentAt: meta.sentAt ? new Date(meta.sentAt).toLocaleDateString('vi-VN') : undefined,
          scheduledAt: meta.scheduledAt ? new Date(meta.scheduledAt).toLocaleDateString('vi-VN') : (isSent ? undefined : 'Đang chuẩn bị'),
          templateHtml: meta.templateHtml || (a.title.includes('SidPeak') ? TEMPLATE_SIDPEAK : a.title.includes('Báo giá') ? TEMPLATE_PROPOSAL : TEMPLATE_INTRO_ERP),
          usagesCount: a._count?.usages || 0,
        };
      });
      setCampaigns(mapped);
    } catch (err) {
      console.warn('Lỗi lấy danh sách email marketing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    api.get('/customers?limit=100').then(res => {
      if (res.data?.data) setCustomers(res.data.data);
    }).catch(() => {});
  }, []);

  const totalCount = campaigns.length;
  const sentCount = campaigns.filter(c => c.status === 'sent').length;
  const draftCount = campaigns.filter(c => c.status === 'draft').length;

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredCampaigns.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCampaigns.map(c => c.id));
    }
  };

  const handleToggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleToggleStatus = async (c: EmailCampaign, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = c.status === 'sent' ? 'draft' : 'sent';
    const newPrismaStatus = newStatus === 'sent' ? 'PUBLISHED' : 'DRAFT';

    try {
      if (c.dbId) {
        await api.put(`/assets/${c.dbId}`, {
          status: newPrismaStatus,
          meta: {
            subject: c.subject,
            targetAudience: c.targetAudience,
            templateHtml: c.templateHtml,
            status: newStatus,
            sentAt: newStatus === 'sent' ? new Date().toISOString() : undefined,
          },
        });
      }
      setCampaigns(prev =>
        prev.map(item =>
          item.id === c.id
            ? {
                ...item,
                status: newStatus,
                sentAt: newStatus === 'sent' ? new Date().toLocaleDateString('vi-VN') : undefined,
              }
            : item
        )
      );
      setActiveMenuId(null);
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái chiến dịch:', err);
    }
  };

  const handleCopyCode = () => {
    if (!previewCampaign) return;
    navigator.clipboard.writeText(previewCampaign.templateHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSubject.trim()) return;

    setIsSaving(true);
    try {
      let finalHtml = TEMPLATE_SIDPEAK;
      if (templateSource === 'preset_intro') finalHtml = TEMPLATE_INTRO_ERP;
      else if (templateSource === 'preset_proposal') finalHtml = TEMPLATE_PROPOSAL;
      else if (templateSource === 'preset_sidpeak') finalHtml = TEMPLATE_SIDPEAK;
      else if (templateSource === 'custom_html' && customHtmlInput.trim()) {
        finalHtml = customHtmlInput.trim();
      }

      const prismaStatus = newStatus === 'sent' ? 'PUBLISHED' : 'DRAFT';

      const res = await api.post('/assets', {
        type: 'EMAIL_TEMPLATE',
        title: newTitle.trim(),
        description: `Chiến dịch email: ${newSubject.trim()}`,
        category: newCategory,
        status: prismaStatus,
        meta: {
          subject: newSubject.trim(),
          targetAudience: newAudience.trim() || 'Doanh nghiệp B2B',
          templateHtml: finalHtml,
          status: newStatus,
          sentAt: newStatus === 'sent' ? new Date().toISOString() : undefined,
        },
      });

      const a = res.data;
      const newCamp: EmailCampaign = {
        id: String(a.id),
        dbId: a.id,
        code: `CAMP-${8000 + a.id}`,
        category: newCategory,
        title: a.title,
        subject: newSubject.trim(),
        targetAudience: newAudience.trim() || 'Doanh nghiệp B2B',
        priority: newPriority,
        status: newStatus,
        sentAt: newStatus === 'sent' ? new Date().toLocaleDateString('vi-VN') : undefined,
        scheduledAt: newStatus === 'draft' ? 'Đang chuẩn bị' : undefined,
        templateHtml: finalHtml,
        usagesCount: 0,
      };

      setCampaigns([newCamp, ...campaigns]);
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewSubject('');
      setCustomHtmlInput('');
    } catch (err) {
      console.error('Lỗi tạo chiến dịch email:', err);
      alert('Không thể tạo chiến dịch email. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCampaign = async (c: EmailCampaign, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Bạn có chắc muốn xóa chiến dịch "${c.title}"?`)) return;

    try {
      if (c.dbId) {
        await api.delete(`/assets/${c.dbId}`);
      }
      setCampaigns(prev => prev.filter(item => item.id !== c.id));
      setActiveMenuId(null);
    } catch (err) {
      console.error('Lỗi xóa chiến dịch:', err);
      alert('Không thể xóa chiến dịch email.');
    }
  };

  const handleOpenDispatchModal = (c: EmailCampaign, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDispatchCampaign(c);
    setDispatchCustomerId('');
    setIsDispatchModalOpen(true);
    setActiveMenuId(null);
  };

  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchCampaign?.dbId) return;

    try {
      await api.post(`/assets/${dispatchCampaign.dbId}/usage`, {
        customer_id: dispatchCustomerId ? Number(dispatchCustomerId) : null,
        note: `Gửi email chiến dịch: ${dispatchCampaign.title}`,
      });

      setCampaigns(prev =>
        prev.map(c =>
          c.id === dispatchCampaign.id
            ? { ...c, usagesCount: (c.usagesCount || 0) + 1 }
            : c
        )
      );

      setDispatchFeedback('Đã ghi nhận lượt gửi email cho khách hàng vào cơ sở dữ liệu CRM!');
      setTimeout(() => setDispatchFeedback(null), 3500);
      setIsDispatchModalOpen(false);
    } catch (err) {
      console.error('Lỗi ghi nhận gửi email:', err);
      alert('Không thể ghi nhận lượt gửi email.');
    }
  };

  // Bulk mark as sent
  const handleBulkMarkSent = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      const camp = campaigns.find(c => c.id === id);
      if (camp && camp.status !== 'sent') {
        await handleToggleStatus(camp);
      }
    }
    setSelectedIds([]);
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(camp => {
      const matchesFilter =
        activeFilter === 'all' ? true : camp.status === activeFilter;
      const matchesSearch =
        camp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camp.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camp.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camp.targetAudience.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [campaigns, activeFilter, searchQuery]);

  return (
    <AppLayout>
      <div className="space-y-5 max-w-7xl mx-auto pb-16">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Chiến dịch Email
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Quản lý danh sách gửi email tiếp cận khách hàng và kho mẫu template HTML.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={fetchCampaigns}
              title="Làm mới danh sách"
              className="h-8 w-8 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="h-8 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-medium rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo chiến dịch</span>
            </button>
          </div>
        </div>

        {dispatchFeedback && (
          <div className="p-3 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40 animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{dispatchFeedback}</span>
          </div>
        )}

        {/* Sleek, Compact Metrics Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 px-3.5 py-2.5 rounded-xl shadow-2xs">
            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Tổng chiến dịch</div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-white mt-0.5">
              <AnimatedCounter value={totalCount} />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 px-3.5 py-2.5 rounded-xl shadow-2xs">
            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Đã gửi</div>
            <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              <AnimatedCounter value={sentCount} />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 px-3.5 py-2.5 rounded-xl shadow-2xs">
            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Bản nháp</div>
            <div className="text-lg font-semibold text-zinc-600 dark:text-zinc-300 mt-0.5">
              <AnimatedCounter value={draftCount} />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 px-3.5 py-2.5 rounded-xl shadow-2xs">
            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Tỷ lệ hoàn thành</div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
              <AnimatedCounter value={totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0} />%
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Control Filter */}
          <div className="inline-flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 self-start">
            {[
              { id: 'all', label: 'Tất cả', count: totalCount },
              { id: 'sent', label: 'Đã gửi', count: sentCount },
              { id: 'draft', label: 'Bản nháp', count: draftCount },
            ].map(tab => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Bulk Action */}
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkMarkSent}
                className="h-8 px-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đánh dấu đã gửi ({selectedIds.length})</span>
              </button>
            )}

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã, tiêu đề, đối tượng..."
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition shadow-2xs placeholder:text-zinc-400"
              />
            </div>
          </div>
        </div>

        {/* REFINED DATA TABLE */}
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs overflow-hidden">
          {filteredCampaigns.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Không tìm thấy chiến dịch nào</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Tạo chiến dịch email mới hoặc thay đổi bộ lọc tìm kiếm.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                {/* Table Header */}
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 text-[11px] font-medium select-none">
                    <th className="w-10 px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length > 0 && selectedIds.length === filteredCampaigns.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                      />
                    </th>
                    <th className="w-24 px-3 py-2.5 font-mono">Mã số</th>
                    <th className="w-32 px-3 py-2.5">Phân loại</th>
                    <th className="px-3 py-2.5 min-w-[260px]">Tiêu đề chiến dịch &amp; Email</th>
                    <th className="w-28 px-3 py-2.5">Trạng thái</th>
                    <th className="w-40 px-3 py-2.5">Đối tượng</th>
                    <th className="w-32 px-3 py-2.5 text-center">Mẫu email</th>
                    <th className="w-16 px-3 py-2.5 text-right">Thao tác</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredCampaigns.map(camp => {
                    const isSelected = selectedIds.includes(camp.id);
                    const isMenuOpen = activeMenuId === camp.id;

                    return (
                      <tr
                        key={camp.id}
                        onClick={() => {
                          setPreviewCampaign(camp);
                          setPreviewMode('visual');
                        }}
                        className={`group hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer ${
                          isSelected ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => handleToggleSelectOne(camp.id, e as any)}
                            className="rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                          />
                        </td>

                        {/* ID */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                            {camp.code}
                          </span>
                        </td>

                        {/* Category Badge */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80">
                            {camp.category}
                          </span>
                        </td>

                        {/* Title & Subject Snippet */}
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-0.5 max-w-lg">
                            <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {camp.title}
                            </span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                              {camp.subject}
                            </span>
                          </div>
                        </td>

                        {/* Status with Clean Dot Indicator */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {camp.status === 'sent' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                              <span>Đã gửi</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0"></span>
                              <span>Bản nháp</span>
                            </span>
                          )}
                        </td>

                        {/* Audience */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-[150px] inline-block">
                            {camp.targetAudience}
                          </span>
                        </td>

                        {/* DEDICATED "XEM MẪU" BUTTON COLUMN (MATCHING media_1789641367372.png) */}
                        <td className="px-3 py-2.5 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewCampaign(camp);
                              setPreviewMode('visual');
                            }}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium shadow-2xs transition-all cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 active:scale-98"
                            title="Xem trước mẫu giao diện email"
                          >
                            <Eye className="w-4 h-4 text-zinc-400 dark:text-zinc-400 shrink-0" />
                            <span>Xem mẫu</span>
                          </button>
                        </td>

                        {/* Thao tác (3 dots menu) */}
                        <td className="px-3 py-2.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() => setActiveMenuId(isMenuOpen ? null : camp.id)}
                              className="h-7 w-7 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition cursor-pointer"
                              title="Thao tác khác"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu Popover */}
                            {isMenuOpen && (
                              <div
                                ref={menuRef}
                                className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg py-1 z-30 animate-modal-pop text-left"
                              >
                                <button
                                  onClick={() => {
                                    setPreviewCampaign(camp);
                                    setPreviewMode('visual');
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                                  <span>Xem trực quan</span>
                                </button>

                                <button
                                  onClick={() => handleOpenDispatchModal(camp)}
                                  className="w-full px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Gửi cho khách hàng</span>
                                </button>

                                <button
                                  onClick={() => handleToggleStatus(camp)}
                                  className="w-full px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                                  <span>
                                    {camp.status === 'sent' ? 'Đổi sang Bản nháp' : 'Đánh dấu Đã gửi'}
                                  </span>
                                </button>

                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(camp.templateHtml);
                                    alert('Đã sao chép mã HTML của mẫu email!');
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                                  <span>Sao chép mã HTML</span>
                                </button>

                                <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                                <button
                                  onClick={() => handleDeleteCampaign(camp)}
                                  className="w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Xóa chiến dịch</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <div>
              {selectedIds.length > 0 ? (
                <span>Đã chọn {selectedIds.length} / {filteredCampaigns.length}</span>
              ) : (
                <span>{filteredCampaigns.length} chiến dịch</span>
              )}
            </div>
            <div className="text-zinc-400">
              Trang 1 / 1
            </div>
          </div>
        </div>

        {/* MODAL: PREVIEW RESPONSIVE HTML TEMPLATE */}
        {previewCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
              onClick={() => setPreviewCampaign(null)}
            />
            <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl z-10 flex flex-col border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-modal-pop max-h-[92vh]">
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                      <span>{previewCampaign.title}</span>
                      <span className="font-mono text-xs text-zinc-400 font-normal">({previewCampaign.code})</span>
                    </h3>
                    <p className="text-xs text-zinc-500 truncate max-w-sm sm:max-w-md mt-0.5">
                      Tiêu đề: {previewCampaign.subject}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mode Selector: Visual / Code */}
                  <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200/70 dark:border-zinc-700/60">
                    <button
                      onClick={() => setPreviewMode('visual')}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        previewMode === 'visual'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Trực quan</span>
                    </button>
                    <button
                      onClick={() => setPreviewMode('code')}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        previewMode === 'code'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>Mã HTML</span>
                    </button>
                  </div>

                  {/* Device Toggle in Visual Mode */}
                  {previewMode === 'visual' && (
                    <div className="hidden sm:flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200/70 dark:border-zinc-700/60">
                      <button
                        onClick={() => setDeviceMode('desktop')}
                        className={`p-1.5 rounded-md transition cursor-pointer ${
                          deviceMode === 'desktop'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                        title="Máy tính"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeviceMode('mobile')}
                        className={`p-1.5 rounded-md transition cursor-pointer ${
                          deviceMode === 'mobile'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                        title="Di động"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Copy Code */}
                  <button
                    onClick={handleCopyCode}
                    className="h-8 px-3 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1.5 text-xs font-medium shadow-2xs"
                    title="Sao chép toàn bộ mã HTML"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                    <span className="hidden sm:inline">{copied ? 'Đã sao chép' : 'Sao chép HTML'}</span>
                  </button>

                  <button
                    onClick={() => setPreviewCampaign(null)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preview Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-100 dark:bg-zinc-950 flex justify-center">
                {previewMode === 'visual' ? (
                  <div
                    className={`transition-all duration-300 shadow-md rounded-xl overflow-hidden bg-white ${
                      deviceMode === 'desktop'
                        ? 'w-full max-w-[650px] min-h-[500px]'
                        : 'w-[375px] min-h-[600px] border-4 border-zinc-800 rounded-3xl'
                    }`}
                  >
                    <iframe
                      srcDoc={previewCampaign.templateHtml}
                      title="HTML Preview"
                      className="w-full h-full min-h-[550px] border-none"
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-3xl">
                    <pre className="p-4 bg-zinc-900 text-zinc-100 text-xs font-mono rounded-xl overflow-x-auto border border-zinc-800 leading-relaxed max-h-[550px]">
                      {previewCampaign.templateHtml}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: DISPATCH TO CRM CUSTOMER */}
        {isDispatchModalOpen && dispatchCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
              onClick={() => setIsDispatchModalOpen(false)}
            />
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl z-10 flex flex-col border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-modal-pop">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  <span>Gửi email cho khách hàng CRM</span>
                </h3>
                <button
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmDispatch} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">Chiến dịch</label>
                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-900 dark:text-white">
                    {dispatchCampaign.title}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">
                    Khách hàng nhận từ CRM Database *
                  </label>
                  <select
                    required
                    value={dispatchCustomerId}
                    onChange={e => setDispatchCustomerId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name || `Khách hàng #${c.id}`} {c.phone_number ? `(${c.phone_number})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Lượt gửi email sẽ được lưu lại trong lịch sử tương tác khách hàng.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsDispatchModalOpen(false)}
                    className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 rounded-lg font-medium transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 rounded-lg font-medium transition cursor-pointer shadow-2xs"
                  >
                    Xác nhận gửi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CREATE NEW CAMPAIGN */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
              onClick={() => setIsAddModalOpen(false)}
            />
            <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl z-10 flex flex-col border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-modal-pop max-h-[92vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Tạo chiến dịch email mới
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="p-6 space-y-4 text-xs overflow-y-auto">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Tên chiến dịch *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Ví dụ: Chiến dịch Giới thiệu giải pháp CRM..."
                    className="w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs focus:border-zinc-900 dark:focus:border-zinc-400 outline-none transition shadow-2xs placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Tiêu đề email (Subject) *</label>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    placeholder="Ví dụ: [SIDCORP] Thư ngỏ Hợp tác & Giải pháp..."
                    className="w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs focus:border-zinc-900 dark:focus:border-zinc-400 outline-none transition shadow-2xs placeholder:text-zinc-400"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Phân loại</label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none cursor-pointer shadow-2xs"
                    >
                      <option value="Cold Outreach">Cold Outreach</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Báo giá">Báo giá</option>
                      <option value="Nurturing">Nurturing</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Mức ưu tiên</label>
                    <select
                      value={newPriority}
                      onChange={e => setNewPriority(e.target.value as any)}
                      className="w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none cursor-pointer shadow-2xs"
                    >
                      <option value="high">Cao</option>
                      <option value="medium">Trung bình</option>
                      <option value="low">Thấp</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Trạng thái</label>
                    <select
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value as any)}
                      className="w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none cursor-pointer shadow-2xs"
                    >
                      <option value="draft">Bản nháp</option>
                      <option value="sent">Đã gửi</option>
                    </select>
                  </div>
                </div>

                {/* Template Selection / Custom HTML */}
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                    Nguồn mẫu Email HTML
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateSource('preset_sidpeak');
                        if (!newTitle) setNewTitle('SidPeak — Quản Trị Nhân Sự Toàn Diện');
                        if (!newSubject) setNewSubject('[SidPeak] Giải Pháp Quản Trị Nhân Sự & Tự Động Hóa Chấm Công, Tính Lương');
                        setNewCategory('Giới thiệu sản phẩm');
                        setNewAudience('Doanh nghiệp B2B & Trưởng phòng HR');
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition cursor-pointer ${
                        templateSource === 'preset_sidpeak'
                          ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-white'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      Mẫu SidPeak HRM
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateSource('preset_intro')}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition cursor-pointer ${
                        templateSource === 'preset_intro'
                          ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-white'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      Mẫu Giới thiệu
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateSource('preset_proposal')}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition cursor-pointer ${
                        templateSource === 'preset_proposal'
                          ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-white'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      Mẫu Thư ngỏ
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateSource('custom_html')}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition cursor-pointer ${
                        templateSource === 'custom_html'
                          ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-white'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      Nhập HTML riêng
                    </button>
                  </div>

                  {templateSource === 'custom_html' && (
                    <div className="space-y-2 animate-fade-in">
                      <textarea
                        rows={6}
                        required
                        value={customHtmlInput}
                        onChange={e => setCustomHtmlInput(e.target.value)}
                        placeholder="Dán mã nguồn HTML email vào đây..."
                        className="w-full bg-zinc-900 text-zinc-100 border border-zinc-700 rounded-lg p-3 font-mono text-xs outline-none leading-relaxed resize-none"
                      />
                      <p className="text-[11px] text-zinc-400">
                        File hoặc mã HTML email của bạn sẽ được lưu trực tiếp vào cơ sở dữ liệu.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 rounded-lg text-xs font-medium transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {isSaving ? 'Đang tạo...' : 'Tạo chiến dịch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
export default MarketingEmailPage;

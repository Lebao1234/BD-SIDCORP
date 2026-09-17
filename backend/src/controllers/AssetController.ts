import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../config/db';

// Helper nhận diện định dạng từ Google Drive URL
export const detectDriveFormat = (url: string): string => {
  if (!url) return 'other';
  const clean = url.toLowerCase();
  if (clean.includes('docs.google.com/document')) return 'docs';
  if (clean.includes('docs.google.com/spreadsheets')) return 'sheets';
  if (clean.includes('docs.google.com/presentation')) return 'slides';
  if (clean.includes('drive.google.com/drive/folders')) return 'folder';
  if (clean.includes('drive.google.com/file') || clean.includes('/file/d/')) return 'drive_file';
  if (clean.endsWith('.pdf') || clean.includes('.pdf?')) return 'pdf';
  return 'other';
};

// Dữ liệu mẫu khởi tạo cho Consultant khi mới dùng
const DEFAULT_CONSULTANT_RESOURCES = [
  {
    title: 'Hợp đồng dịch vụ tư vấn CRM & Chuyển đổi số mẫu 2026',
    description: 'Bản hợp đồng chuẩn gồm các điều khoản thanh toán, phạm vi công việc, cam kết bảo mật và SLA hỗ trợ kỹ thuật.',
    category: 'Hợp đồng',
    file_url: 'https://docs.google.com/document/d/1sample_contract_template_sidcorp_crm_2026/edit',
    format: 'docs',
    tags: ['Hợp đồng', 'Pháp lý', 'Chuyển đổi số'],
  },
  {
    title: 'Proposal & Báo giá triển khai hệ thống quản trị khách hàng',
    description: 'Slide trình bày tổng quan giải pháp, lộ trình triển khai 4 giai đoạn và bảng chi phí chi tiết theo quy mô.',
    category: 'Proposal / Đề xuất',
    file_url: 'https://docs.google.com/presentation/d/1sample_proposal_pitch_deck_sidcorp_crm/edit',
    format: 'slides',
    tags: ['Proposal', 'Báo giá', 'Pitching'],
  },
  {
    title: 'Bảng tính định giá dịch vụ & Ước tính ROI tư vấn',
    description: 'Bảng tính công thức ước tính chi phí, điểm hòa vốn và tỉ suất sinh lời ROI khi doanh nghiệp ứng dụng hệ thống.',
    category: 'Báo giá',
    file_url: 'https://docs.google.com/spreadsheets/d/1sample_pricing_calculator_roi_consultant/edit',
    format: 'sheets',
    tags: ['Báo giá', 'ROI', 'Dự toán'],
  },
  {
    title: 'Checklist 25 tiêu chí khảo sát quy trình bán hàng & CSKH',
    description: 'Biểu mẫu phỏng vấn Giám đốc kinh doanh và các trưởng nhóm để bóc tách nút thắt quy trình trước khi tư vấn.',
    category: 'Biểu mẫu & Checklist',
    file_url: 'https://docs.google.com/spreadsheets/d/1sample_audit_checklist_sales_pipeline/edit',
    format: 'sheets',
    tags: ['Khảo sát', 'Audit', 'Checklist'],
  },
  {
    title: 'Hồ sơ năng lực tư vấn & Case Study doanh nghiệp thành công',
    description: 'Thư mục tổng hợp các bài học thực chiến, số liệu tăng trưởng và thư cảm ơn từ các khách hàng tiêu biểu.',
    category: 'Slide năng lực',
    file_url: 'https://drive.google.com/drive/folders/1sample_portfolio_case_studies_folder',
    format: 'folder',
    tags: ['Profile', 'Case Study', 'Uy tín'],
  },
];

const DEFAULT_EMAIL_TEMPLATES = [
  {
    title: 'Chiến dịch Giới thiệu Hệ sinh thái SIDCORP',
    description: 'Email tiếp cận khách hàng B2B, giới thiệu hệ thống CRM chuyên sâu và đề xuất giải pháp tối ưu vận hành.',
    category: 'Cold Outreach',
    file_url: 'https://crm.sidcorp.vn/templates/intro-erp',
    format: 'email',
    tags: ['B2B', 'Cold Email', 'Giới thiệu'],
    type: 'EMAIL_TEMPLATE' as const,
    status: 'PUBLISHED' as const,
    meta: {
      subject: '[SIDCORP] Giải pháp Quản trị & Tối ưu Bán hàng Chuyên sâu',
      targetAudience: 'Doanh nghiệp B2B & Leads mới',
      status: 'sent',
      sentAt: '2026-09-15T09:00:00.000Z',
    },
  },
  {
    title: 'Đề xuất Giải pháp & Báo giá Đặc quyền Q4',
    description: 'Thư ngỏ gửi sau khi làm việc sơ bộ với khách hàng, gửi kèm báo giá và cam kết bảo hành triển khai.',
    category: 'Follow-up',
    file_url: 'https://crm.sidcorp.vn/templates/proposal',
    format: 'email',
    tags: ['Proposal', 'Báo giá', 'Follow-up'],
    type: 'EMAIL_TEMPLATE' as const,
    status: 'DRAFT' as const,
    meta: {
      subject: 'Thư ngỏ Hợp tác & Dự toán Triển khai Hệ thống CRM',
      targetAudience: 'Khách hàng Tiềm năng (Warm Leads)',
      status: 'draft',
      scheduledAt: '2026-09-20T10:00:00.000Z',
    },
  },
  {
    title: 'Chăm sóc sau Buổi Demo & Khảo sát Nhu cầu',
    description: 'Email cảm ơn và gửi biên bản cuộc họp, slide tổng quan tính năng sau buổi demo thực tế.',
    category: 'Nurturing',
    file_url: 'https://crm.sidcorp.vn/templates/after-demo',
    format: 'email',
    tags: ['Demo', 'Nurturing', 'CSKH'],
    type: 'EMAIL_TEMPLATE' as const,
    status: 'PUBLISHED' as const,
    meta: {
      subject: 'Tài liệu đính kèm & Biên bản tóm tắt buổi Demo CRM',
      targetAudience: 'Khách hàng đã qua Demo',
      status: 'sent',
      sentAt: '2026-09-16T14:30:00.000Z',
    },
  },
  {
    title: 'SidPeak — Quản Trị Nhân Sự Toàn Diện',
    description: 'Email giới thiệu nền tảng quản trị nhân sự SidPeak: hồ sơ tập trung, chấm công & tính lương, tuyển dụng và KPI.',
    category: 'Giới thiệu sản phẩm',
    file_url: 'https://sidpeak.epodsystem.com/',
    format: 'email',
    tags: ['HRM', 'SidPeak', 'Chấm công', 'Nhân sự'],
    type: 'EMAIL_TEMPLATE' as const,
    status: 'PUBLISHED' as const,
    meta: {
      subject: '[SidPeak] Giải Pháp Quản Trị Nhân Sự & Tự Động Hóa Chấm Công, Tính Lương Cho Doanh Nghiệp',
      targetAudience: 'Doanh nghiệp B2B & Trưởng phòng HR',
      status: 'sent',
      sentAt: '2026-09-17T08:00:00.000Z',
    },
  },
];

// ── GET /api/assets ──────────────────────────────────────────────────────────
export const getAssets = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực người dùng.' });

  const { type = 'DOCUMENT', category, search } = req.query;

  try {
    const ownerId = Number(user.id);

    // Kiểm tra xem đã có tài liệu nào chưa; nếu chưa thì seed sẵn tài liệu mẫu cho Consultant
    const totalCount = await prisma.asset.count({
      where: { owner_id: ownerId, type: (type as any) || 'DOCUMENT' }
    });

    if (totalCount === 0 && (type === 'DOCUMENT' || !type)) {
      for (const item of DEFAULT_CONSULTANT_RESOURCES) {
        await prisma.asset.create({
          data: {
            type: 'DOCUMENT',
            title: item.title,
            description: item.description,
            category: item.category,
            file_url: item.file_url,
            format: item.format,
            tags: item.tags,
            owner_id: ownerId,
          }
        });
      }
    } else if (totalCount === 0 && type === 'EMAIL_TEMPLATE') {
      for (const item of DEFAULT_EMAIL_TEMPLATES) {
        await prisma.asset.create({
          data: {
            type: 'EMAIL_TEMPLATE',
            title: item.title,
            description: item.description,
            category: item.category,
            file_url: item.file_url,
            format: item.format,
            tags: item.tags,
            status: item.status,
            meta: item.meta,
            owner_id: ownerId,
          }
        });
      }
    }

    const whereClause: any = {
      owner_id: ownerId,
      type: (type as any) || 'DOCUMENT',
    };

    if (category && category !== 'all' && category !== 'Tất cả') {
      whereClause.category = String(category);
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }

    const assets = await prisma.asset.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { usages: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return res.json(assets);
  } catch (err) {
    console.error('Lỗi lấy danh sách tài nguyên:', err);
    return res.status(500).json({ error: 'Không thể lấy danh sách tài nguyên.' });
  }
};

// ── POST /api/assets ─────────────────────────────────────────────────────────
export const createAsset = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa xác thực người dùng.' });

  const { title, description, category, file_url, format, tags, type = 'DOCUMENT', meta, status = 'READY', file_name } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Tiêu đề tài liệu là bắt buộc.' });
  }
  
  const effectiveUrl = file_url && file_url.trim() ? file_url.trim() : `https://crm.sidcorp.vn/templates/${Date.now()}`;

  try {
    const detectedFormat = format || (file_url ? detectDriveFormat(file_url) : 'other');

    const newAsset = await prisma.asset.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        category: category?.trim() || 'Khác',
        file_url: effectiveUrl,
        file_name: file_name || null,
        format: detectedFormat,
        tags: Array.isArray(tags) ? tags : [],
        type: type || 'DOCUMENT',
        status: status || 'READY',
        meta: meta || undefined,
        owner_id: Number(user.id),
      }
    });

    return res.status(201).json(newAsset);
  } catch (err) {
    console.error('Lỗi tạo tài nguyên:', err);
    return res.status(500).json({ error: 'Không thể tạo tài nguyên.' });
  }
};

// ── PUT /api/assets/:id ──────────────────────────────────────────────────────
export const updateAsset = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { id } = req.params;

  if (!user) return res.status(401).json({ error: 'Chưa xác thực người dùng.' });

  const { title, description, category, file_url, format, tags, meta, status, file_name } = req.body;

  try {
    const existing = await prisma.asset.findUnique({
      where: { id: Number(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy tài nguyên.' });
    }

    if (existing.owner_id !== Number(user.id) && user.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền chỉnh sửa tài nguyên này.' });
    }

    const detectedFormat = format || (file_url ? detectDriveFormat(file_url) : existing.format);

    const updated = await prisma.asset.update({
      where: { id: Number(id) },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(category !== undefined && { category: category?.trim() || 'Khác' }),
        ...(file_url !== undefined && { file_url: file_url.trim() }),
        ...(file_name !== undefined && { file_name: file_name || null }),
        ...(detectedFormat !== undefined && { format: detectedFormat }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
        ...(meta !== undefined && { meta }),
        ...(status !== undefined && { status }),
      }
    });

    return res.json(updated);
  } catch (err) {
    console.error('Lỗi cập nhật tài nguyên:', err);
    return res.status(500).json({ error: 'Không thể cập nhật tài nguyên.' });
  }
};

// ── DELETE /api/assets/:id ───────────────────────────────────────────────────
export const deleteAsset = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { id } = req.params;

  if (!user) return res.status(401).json({ error: 'Chưa xác thực người dùng.' });

  try {
    const existing = await prisma.asset.findUnique({
      where: { id: Number(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy tài nguyên.' });
    }

    if (existing.owner_id !== Number(user.id) && user.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền xóa tài nguyên này.' });
    }

    await prisma.asset.delete({
      where: { id: Number(id) }
    });

    return res.json({ success: true, message: 'Đã xóa tài nguyên thành công.' });
  } catch (err) {
    console.error('Lỗi xóa tài nguyên:', err);
    return res.status(500).json({ error: 'Không thể xóa tài nguyên.' });
  }
};

// ── POST /api/assets/:id/usage ───────────────────────────────────────────────
// Ghi nhận lịch sử mỗi khi Consultant chia sẻ tài liệu hoặc gửi cho khách hàng
export const recordAssetUsage = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { id } = req.params;
  const { customer_id, note } = req.body;

  if (!user) return res.status(401).json({ error: 'Chưa xác thực người dùng.' });

  try {
    const usage = await prisma.assetUsage.create({
      data: {
        asset_id: Number(id),
        customer_id: customer_id ? Number(customer_id) : null,
        note: note || 'Đã sao chép/mở tài liệu',
      }
    });

    return res.status(201).json(usage);
  } catch (err) {
    console.error('Lỗi ghi nhận sử dụng tài nguyên:', err);
    return res.status(500).json({ error: 'Không thể ghi nhận lượt sử dụng.' });
  }
};


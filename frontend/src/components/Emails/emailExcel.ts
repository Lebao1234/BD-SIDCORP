/**
 * ExcelJS nặng khoảng 930KB sau khi gộp, còn file-saver thì chỉ cần lúc bấm tải.
 * Import tĩnh ở đầu file khiến cả hai nằm trên đường tải quan trọng của trang,
 * dù người dùng có thể không bao giờ bấm xuất Excel. Nạp động ngay trong hàm
 * xử lý thì chi phí đó chỉ phát sinh đúng lúc cần.
 */
const loadExcel = async () => {
  const [{ default: ExcelJS }, { default: fileSaver }] = await Promise.all([
    import('exceljs'),
    import('file-saver'),
  ]);
  return { ExcelJS, fileSaver };
};
import { AVAILABLE_TEMPLATES, DEFAULT_TEMPLATE_ID, findTemplate } from './templates';
import type { ArchivedEmail, ArchivedEmailStatus } from './emailCampaign';

export interface ParsedEmailRow {
  rowNumber: number;
  recipientName: string;
  recipientEmail: string;
  customerCompany?: string;
  subject?: string;
  templateId: string;
  templateName: string;
  status: ArchivedEmailStatus;
  snippet?: string;
  isValid: boolean;
  error?: string;
}

export interface ParseExcelResult {
  fileName: string;
  rows: ParsedEmailRow[];
  validCount: number;
  invalidCount: number;
  errors: string[];
}

/**
 * Tải file Excel mẫu (.xlsx) chuẩn hóa để người dùng điền danh sách email tiếp thị.
 */
export const downloadEmailExcelTemplate = async (): Promise<void> => {
  const { ExcelJS, fileSaver } = await loadExcel();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIDCORP CRM';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Danh_Sach_Email', {
    views: [{ showGridLines: true }],
  });

  // Cấu hình các cột
  worksheet.columns = [
    { header: 'Họ và tên người nhận (*)', key: 'recipientName', width: 28 },
    { header: 'Email người nhận (*)', key: 'recipientEmail', width: 32 },
    { header: 'Doanh nghiệp / Công ty', key: 'customerCompany', width: 32 },
    { header: 'Tiêu đề thư', key: 'subject', width: 42 },
    { header: 'Mẫu áp dụng', key: 'templateName', width: 28 },
    { header: 'Trạng thái (Đã gửi / Bản nháp)', key: 'status', width: 22 },
    { header: 'Ghi chú / Tóm tắt nội dung', key: 'snippet', width: 38 },
  ];

  // Định dạng hàng tiêu đề (Header Row)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 32;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8732C' }, // SIDCORP Orange
    };
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD4611F' } },
      left: { style: 'thin', color: { argb: 'FFD4611F' } },
      bottom: { style: 'medium', color: { argb: 'FFC25012' } },
      right: { style: 'thin', color: { argb: 'FFD4611F' } },
    };
  });

  // Dữ liệu mẫu thực tế
  const sampleData = [
    {
      recipientName: 'Lê Hoàng Nam',
      recipientEmail: 'nam.le@vinatex-group.vn',
      customerCompany: 'Tập đoàn Dệt May Vinatex',
      subject: '[SidPeak] Giải Pháp Quản Trị Nhân Sự & Tự Động Hóa Chấm Công',
      templateName: 'SidPeak — Quản Trị Nhân Sự',
      status: 'Đã gửi',
      snippet: 'Email tiếp cận giới thiệu giải pháp chấm công và tính lương tự động cho phòng HR.',
    },
    {
      recipientName: 'Trần Thị Mai Lan',
      recipientEmail: 'lan.tran@techcorp.com.vn',
      customerCompany: 'Công ty Cổ phần TechCorp Việt Nam',
      subject: '[SIDCORP] Giải pháp Quản trị & Tối ưu Bán hàng Chuyên sâu',
      templateName: 'Giới Thiệu Hệ Sinh Thái SIDCORP',
      status: 'Đã gửi',
      snippet: 'Thư ngỏ tiếp cận ban lãnh đạo, chuẩn hóa quy trình CRM & bán hàng B2B.',
    },
    {
      recipientName: 'Nguyễn Quốc Hùng',
      recipientEmail: 'hung.nguyen@delta-logistics.vn',
      customerCompany: 'Delta Logistics JSC',
      subject: 'Thư ngỏ Hợp tác & Dự toán Triển khai Hệ thống CRM Q4',
      templateName: 'Đề Xuất Giải Pháp & Báo Giá CRM',
      status: 'Bản nháp',
      snippet: 'Bản dự thảo báo giá và lộ trình triển khai 4 giai đoạn cho khách hàng mới.',
    },
    {
      recipientName: 'Phạm Minh Đức',
      recipientEmail: 'duc.pm@anphat-holding.com',
      customerCompany: 'An Phát Holdings',
      subject: 'Tài liệu đính kèm & Biên bản tóm tắt buổi Demo CRM',
      templateName: 'Chăm Sóc Sau Buổi Demo CRM',
      status: 'Đã gửi',
      snippet: 'Email cảm ơn và gửi biên bản cuộc họp, slide tổng quan tính năng sau demo.',
    },
  ];

  // Thêm dữ liệu mẫu vào sheet
  sampleData.forEach((item, index) => {
    const row = worksheet.addRow(item);
    row.height = 24;
    row.eachCell((cell, colIndex) => {
      cell.font = { name: 'Calibri', size: 10 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colIndex === 6 ? 'center' : 'left',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE6E4E0' } },
        left: { style: 'thin', color: { argb: 'FFE6E4E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE6E4E0' } },
        right: { style: 'thin', color: { argb: 'FFE6E4E0' } },
      };
      // Zebra striping
      if (index % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFBFBFA' },
        };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  fileSaver.saveAs(blob, 'Mau_Danh_Sach_Email_Marketing_SIDCORP.xlsx');
};

/**
 * Chuẩn hóa và ánh xạ chuỗi tên mẫu sang ID mẫu email hợp lệ.
 */
export const matchTemplateId = (templateNameOrId?: string, fallbackId = DEFAULT_TEMPLATE_ID): string => {
  if (!templateNameOrId) return fallbackId;
  const clean = templateNameOrId.trim().toLowerCase();

  // Khớp chính xác ID
  const directMatch = AVAILABLE_TEMPLATES.find((t) => t.id.toLowerCase() === clean);
  if (directMatch) return directMatch.id;

  // Khớp theo tên hoặc từ khóa nhận diện
  if (clean.includes('sidpeak') || clean.includes('nhân sự') || clean.includes('hrm')) {
    return 'sidpeak';
  }
  if (clean.includes('giới thiệu') || clean.includes('sidcorp') || clean.includes('erp') || clean.includes('outreach')) {
    return 'intro_erp';
  }
  if (clean.includes('báo giá') || clean.includes('proposal') || clean.includes('đề xuất')) {
    return 'proposal';
  }
  if (clean.includes('demo') || clean.includes('sau demo') || clean.includes('khảo sát') || clean.includes('cskh')) {
    return 'demo_followup';
  }

  return fallbackId;
};

/**
 * Đọc và phân tích file Excel (.xlsx / .xls) tải lên từ máy tính.
 */
export const parseEmailExcelFile = async (
  file: File,
  defaultTemplateId = DEFAULT_TEMPLATE_ID,
  defaultStatus: ArchivedEmailStatus = 'sent'
): Promise<ParseExcelResult> => {
  const { ExcelJS } = await loadExcel();

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('File Excel không có trang tính (worksheet) nào.');
  }

  const rows: ParsedEmailRow[] = [];
  const errors: string[] = [];
  let headerMap: Record<number, string> = {};
  let isFirstRow = true;

  worksheet.eachRow((row, rowNumber) => {
    const values = row.values as any[];
    if (!values || values.length === 0) return;

    // Dòng đầu tiên là tiêu đề cột
    if (isFirstRow) {
      values.forEach((val, idx) => {
        if (!val) return;
        const text = String(val).trim().toLowerCase();
        if (text.includes('họ và tên') || text.includes('họ tên') || text.includes('người nhận') || text.includes('name')) {
          headerMap[idx] = 'recipientName';
        } else if (text.includes('email') || text.includes('mail')) {
          headerMap[idx] = 'recipientEmail';
        } else if (text.includes('doanh nghiệp') || text.includes('công ty') || text.includes('company')) {
          headerMap[idx] = 'customerCompany';
        } else if (text.includes('tiêu đề') || text.includes('chủ đề') || text.includes('subject')) {
          headerMap[idx] = 'subject';
        } else if (text.includes('mẫu') || text.includes('template')) {
          headerMap[idx] = 'templateName';
        } else if (text.includes('trạng thái') || text.includes('status')) {
          headerMap[idx] = 'status';
        } else if (text.includes('ghi chú') || text.includes('tóm tắt') || text.includes('nội dung') || text.includes('snippet') || text.includes('note')) {
          headerMap[idx] = 'snippet';
        }
      });

      // Nếu không tìm thấy cột có tên rõ ràng, fallback theo vị trí cột mặc định
      if (Object.keys(headerMap).length === 0) {
        headerMap = {
          1: 'recipientName',
          2: 'recipientEmail',
          3: 'customerCompany',
          4: 'subject',
          5: 'templateName',
          6: 'status',
          7: 'snippet',
        };
      }

      isFirstRow = false;
      return;
    }

    // Đọc dữ liệu từng dòng
    const rowObj: Record<string, string> = {};
    values.forEach((val, idx) => {
      const key = headerMap[idx];
      if (key && val !== undefined && val !== null) {
        rowObj[key] = String(val).trim();
      }
    });

    const recipientName = rowObj['recipientName'] || '';
    const recipientEmail = rowObj['recipientEmail'] || '';
    const customerCompany = rowObj['customerCompany'] || undefined;
    const rawTemplate = rowObj['templateName'];
    const rawStatus = rowObj['status']?.toLowerCase();
    const rawSnippet = rowObj['snippet'];

    // Dòng hoàn toàn trống thì bỏ qua
    if (!recipientName && !recipientEmail) {
      return;
    }

    let isValid = true;
    let errorMsg: string | undefined;

    if (!recipientName && !recipientEmail) {
      isValid = false;
      errorMsg = 'Thiếu cả Tên và Email người nhận';
    }

    // Xác định template ID và template Name
    const templateId = matchTemplateId(rawTemplate, defaultTemplateId);
    const matchedTemplate = findTemplate(templateId);
    const templateName = matchedTemplate?.name || 'Mẫu tùy chỉnh';

    // Xác định tiêu đề
    const subject = rowObj['subject'] || matchedTemplate?.defaultSubject || '[SIDCORP] Thư ngỏ hợp tác & giải pháp';

    // Xác định trạng thái
    let status: ArchivedEmailStatus = defaultStatus;
    if (rawStatus) {
      if (rawStatus.includes('nháp') || rawStatus.includes('draft') || rawStatus.includes('lưu')) {
        status = 'draft';
      } else if (rawStatus.includes('gửi') || rawStatus.includes('sent') || rawStatus.includes('thành công')) {
        status = 'sent';
      }
    }

    rows.push({
      rowNumber,
      recipientName: recipientName || recipientEmail || 'Khách hàng',
      recipientEmail,
      customerCompany,
      subject,
      templateId,
      templateName,
      status,
      snippet: rawSnippet || `Email tiếp thị: ${subject}`,
      isValid,
      error: errorMsg,
    });
  });

  const validCount = rows.filter((r) => r.isValid).length;
  const invalidCount = rows.length - validCount;

  return {
    fileName: file.name,
    rows,
    validCount,
    invalidCount,
    errors,
  };
};

/**
 * Chuyển các dòng Excel đã duyệt thành mảng ArchivedEmail để lưu lên cơ sở dữ liệu.
 */
export const buildEmailsFromExcelRows = (
  rows: ParsedEmailRow[],
  senderName: string
): Array<Omit<ArchivedEmail, 'id' | 'dbId'>> => {
  return rows
    .filter((r) => r.isValid)
    .map((r) => {
      const template = findTemplate(r.templateId);
      return {
        recipientName: r.recipientName,
        recipientEmail: r.recipientEmail,
        customerCompany: r.customerCompany,
        subject: r.subject || template?.defaultSubject || 'Thư ngỏ tiếp thị',
        snippet: r.snippet || `Email: ${r.subject}`,
        templateName: r.templateName,
        templateId: r.templateId,
        senderName,
        status: r.status,
        sentAt: r.status === 'sent' ? new Date().toISOString() : null,
        htmlContent: template?.htmlContent || '',
      };
    });
};


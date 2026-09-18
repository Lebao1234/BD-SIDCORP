import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  FileText,
  Building2,
  Check,
} from 'lucide-react';
import { Alert } from '../common/Alert';
import { useFeedback } from '../../hooks/useFeedback';
import { AVAILABLE_TEMPLATES, DEFAULT_TEMPLATE_ID, findTemplate } from './templates';
import type { ArchivedEmailStatus } from './emailCampaign';
import {
  downloadEmailExcelTemplate,
  parseEmailExcelFile,
  buildEmailsFromExcelRows,
  type ParsedEmailRow,
} from './emailExcel';

interface ImportEmailExcelModalProps {
  isImporting: boolean;
  onClose: () => void;
  onSubmit: (emails: ReturnType<typeof buildEmailsFromExcelRows>) => Promise<void>;
  currentUserName: string;
}

export const ImportEmailExcelModal: React.FC<ImportEmailExcelModalProps> = ({
  isImporting,
  onClose,
  onSubmit,
  currentUserName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { feedback, showError, showErrorFrom, clear } = useFeedback();

  const [isParsing, setIsParsing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedEmailRow[]>([]);
  const [defaultTemplateId, setDefaultTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [defaultStatus, setDefaultStatus] = useState<ArchivedEmailStatus>('sent');
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      await downloadEmailExcelTemplate();
    } catch (err) {
      showErrorFrom(err, 'Không thể tải file Excel mẫu.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clear();
    setSelectedFile(file);
    setIsParsing(true);

    try {
      const result = await parseEmailExcelFile(file, defaultTemplateId, defaultStatus);
      setParsedRows(result.rows);
      if (result.rows.length === 0) {
        showError('File Excel không có dòng dữ liệu hợp lệ nào.');
      }
    } catch (err) {
      showErrorFrom(err, 'Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng file (.xlsx / .xls).');
      setSelectedFile(null);
      setParsedRows([]);
    } finally {
      setIsParsing(false);
      // Reset input value so re-selecting same file triggers onChange
      e.target.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showError('Vui lòng chọn file Excel có đuôi .xlsx hoặc .xls.');
      return;
    }

    clear();
    setSelectedFile(file);
    setIsParsing(true);

    try {
      const result = await parseEmailExcelFile(file, defaultTemplateId, defaultStatus);
      setParsedRows(result.rows);
      if (result.rows.length === 0) {
        showError('File Excel không có dòng dữ liệu hợp lệ nào.');
      }
    } catch (err) {
      showErrorFrom(err, 'Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng file.');
      setSelectedFile(null);
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const handleSubmit = async () => {
    if (validRows.length === 0) {
      showError('Không có dòng email hợp lệ nào để nhập.');
      return;
    }

    clear();
    try {
      const payload = buildEmailsFromExcelRows(validRows, currentUserName);
      await onSubmit(payload);
    } catch (err) {
      showErrorFrom(err, 'Lỗi khi lưu danh sách email vào cơ sở dữ liệu.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-white dark:bg-[#1d1c19] border border-zinc-200 dark:border-zinc-800 w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                Nhập Danh Sách Email từ Excel
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Tải lên file Excel để lưu trữ danh sách email tiếp thị vào cơ sở dữ liệu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          <Alert feedback={feedback} onDismiss={clear} />

          {/* Download Sample & Instructions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-800/40 text-xs">
            <div className="space-y-0.5">
              <div className="font-semibold text-orange-900 dark:text-orange-200">
                Chưa có file mẫu Excel?
              </div>
              <div className="text-[11px] text-orange-700/80 dark:text-orange-300/80">
                Tải file mẫu chuẩn với các cột: Họ tên, Email, Doanh nghiệp, Tiêu đề, Mẫu áp dụng, Trạng thái.
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={isDownloadingTemplate}
              className="h-8 px-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadingTemplate ? 'Đang tạo mẫu...' : 'Tải file mẫu Excel (.xlsx)'}</span>
            </button>
          </div>

          {/* Dropzone / Upload Box */}
          {!selectedFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-orange-500 dark:hover:border-orange-500 rounded-2xl p-8 text-center cursor-pointer transition bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-orange-50/20 dark:hover:bg-orange-950/10 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto mb-3 text-zinc-400 group-hover:text-orange-500 group-hover:border-orange-200 transition shadow-2xs">
                {isParsing ? (
                  <RotateCw className="w-6 h-6 animate-spin text-orange-500" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {isParsing ? 'Đang đọc và phân tích file Excel...' : 'Nhấp để chọn file Excel hoặc kéo thả vào đây'}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Hỗ trợ định dạng bảng tính .xlsx, .xls (Dung lượng tối đa 15MB)
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {selectedFile.name}
                  </div>
                  <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                    <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {validRows.length} email hợp lệ
                    </span>
                    {invalidRows.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-rose-500 font-medium">
                          {invalidRows.length} dòng bỏ qua
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Chọn file khác
                </button>
              </div>
            </div>
          )}

          {/* Config Defaults (In case Excel doesn't specify template or status) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Mẫu mặc định (nếu dòng trong Excel không ghi)
              </label>
              <select
                value={defaultTemplateId}
                onChange={(e) => setDefaultTemplateId(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-zinc-900 dark:focus:border-white transition shadow-2xs"
              >
                {AVAILABLE_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name} ({tmpl.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Trạng thái mặc định (nếu trong Excel không ghi)
              </label>
              <select
                value={defaultStatus}
                onChange={(e) => setDefaultStatus(e.target.value as ArchivedEmailStatus)}
                className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-zinc-900 dark:focus:border-white transition shadow-2xs"
              >
                <option value="sent">Đã gửi (Lưu lịch sử đã gửi)</option>
                <option value="draft">Bản nháp (Lưu tạm chờ gửi)</option>
              </select>
            </div>
          </div>

          {/* Data Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Xem trước dữ liệu ({validRows.length}/{parsedRows.length} email sẵn sàng nhập)
                </span>
                <span className="text-[11px] text-zinc-500">
                  Hiển thị tối đa 10 dòng đầu tiên
                </span>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 font-medium text-[11px] border-b border-zinc-200 dark:border-zinc-800 select-none sticky top-0">
                        <th className="px-3 py-2 w-12 text-center">#</th>
                        <th className="px-3 py-2 min-w-[160px]">Người nhận / Email</th>
                        <th className="px-3 py-2 min-w-[140px]">Doanh nghiệp</th>
                        <th className="px-3 py-2 min-w-[180px]">Tiêu đề thư</th>
                        <th className="px-3 py-2 min-w-[140px]">Mẫu áp dụng</th>
                        <th className="px-3 py-2 w-24 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {parsedRows.slice(0, 10).map((row, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 ${
                            !row.isValid ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                          }`}
                        >
                          <td className="px-3 py-2 text-center text-zinc-400 font-mono text-[11px]">
                            {row.rowNumber}
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-medium text-zinc-900 dark:text-zinc-100">
                              {row.recipientName}
                            </div>
                            <div className="text-[11px] text-zinc-500 truncate">
                              {row.recipientEmail || '(Chưa có email)'}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400 truncate">
                            {row.customerCompany || '—'}
                          </td>
                          <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300 truncate">
                            {row.subject || '—'}
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                              {row.templateName}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {row.status === 'sent' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Đã gửi</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                <span>Bản nháp</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {validRows.length > 0
              ? `Sẵn sàng nhập ${validRows.length} email vào cơ sở dữ liệu.`
              : 'Chọn file Excel để bắt đầu nhập.'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="h-8 px-4 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={validRows.length === 0 || isImporting}
              className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang nhập vào hệ thống...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Nhập {validRows.length > 0 ? `${validRows.length} email` : ''} vào hệ thống</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportEmailExcelModal;

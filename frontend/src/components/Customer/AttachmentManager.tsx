/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from 'react';
import { Paperclip, Download, Trash2, Upload, FileText, FileImage, FileSpreadsheet, Loader2 } from 'lucide-react';
import api from '../../services/api';

import { Attachment } from '../../types';
import { notify, confirmDialog } from '../../lib/notify';

interface AttachmentManagerProps {
  customerId: string;
  attachments: Attachment[];
  onAttachmentUploaded: (newAttachment: Attachment) => void;
  onAttachmentDeleted: (id: string) => void;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({ customerId, attachments, onAttachmentUploaded, onAttachmentDeleted }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) {
      return <FileImage className="w-5 h-5 text-indigo-500" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    }
    return <FileText className="w-5 h-5 text-blue-500" />;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('customerId', customerId);
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await api.post('/attachments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      onAttachmentUploaded(response.data);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Không thể upload file:', err);
      notify.error('Tải tệp lên thất bại. Vui lòng kiểm tra lại cấu hình lưu trữ.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog({ title: 'Xoá tài liệu khỏi hồ sơ?', message: 'Tệp sẽ bị gỡ khỏi hồ sơ khách hàng này.', danger: true }))) return;
    try {
      await api.delete(`/attachments/${id}`);
      onAttachmentDeleted(id);
    } catch (err) {
      console.error('Không thể xóa file:', err);
    }
  };

  return (
    <div className="bg-surface dark:bg-panel border border-line dark:border-line p-6 rounded-2xl shadow-sm w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-divider dark:border-line">
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2 text-fg dark:text-white">
            <Paperclip className="w-4 h-4 text-fg dark:text-white" />
            Tài liệu đính kèm & Hồ sơ
          </h2>
          <p className="text-xs text-fg-subtle dark:text-fg-muted mt-0.5">
            Lưu trữ hợp đồng, báo giá, ảnh chứng từ quan trọng của khách hàng.
          </p>
        </div>

        <div className="shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-brand hover:bg-brand-hover text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? 'Đang tải lên...' : 'Tải tài liệu lên'}
          </button>
        </div>
      </div>

      {attachments.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-line dark:border-line rounded-xl bg-surface-alt/50 dark:bg-surface/30">
          <Paperclip className="w-8 h-8 text-fg-empty dark:text-fg-faint mx-auto mb-2" />
          <p className="text-xs text-fg-subtle dark:text-fg-muted">Chưa có tài liệu đính kèm nào được tải lên cho khách hàng này.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="p-3 rounded-xl border border-line dark:border-line bg-surface dark:bg-surface flex items-center justify-between gap-3 hover:border-line-strong dark:hover:border-line-strong transition shadow-2xs group animate-fade-in"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 p-2 bg-raised dark:bg-canvas rounded-lg">
                  {getFileIcon(file.file_name || file.name || '')}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-fg dark:text-white truncate" title={file.file_name || file.name}>
                    {file.file_name || file.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-fg-faint dark:text-fg-subtle">
                    <span>{file.uploader?.name || file.uploadedBy?.name || 'Nhân viên'}</span>
                    <span>•</span>
                    <span>{new Date(file.createdAt || (file as any).created_at || new Date()).toLocaleDateString('vi-VN')}</span>
                    <span>•</span>
                    <span className="font-mono">{formatFileSize(file.size)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={file.file_url || file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-fg-faint hover:text-fg dark:hover:text-white hover:bg-raised dark:hover:bg-divider rounded-lg transition"
                  title="Tải xuống tài liệu"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="p-1.5 text-fg-faint hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                  title="Xóa tài liệu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

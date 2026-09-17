/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from 'react';
import { Paperclip, Download, Trash2, Upload, FileText, FileImage, FileSpreadsheet, Loader2 } from 'lucide-react';
import api from '../../services/api';

import { Attachment } from '../../types';

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
      alert('Tải file lên thất bại. Vui lòng kiểm tra lại cấu hình lưu trữ.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này khỏi hồ sơ khách hàng?')) return;
    try {
      await api.delete(`/attachments/${id}`);
      onAttachmentDeleted(id);
    } catch (err) {
      console.error('Không thể xóa file:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1d1c19] border border-gray-200 dark:border-[#332f2c] p-6 rounded-2xl shadow-sm w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-[#2b2826]">
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <Paperclip className="w-4 h-4 text-gray-900 dark:text-white" />
            Tài liệu đính kèm & Hồ sơ
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
            className="bg-gray-900 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? 'Đang tải lên...' : 'Tải tài liệu lên'}
          </button>
        </div>
      </div>

      {attachments.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-gray-200 dark:border-[#332f2c] rounded-xl bg-gray-50/50 dark:bg-[#232120]/30">
          <Paperclip className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-xs text-gray-500 dark:text-gray-400">Chưa có tài liệu đính kèm nào được tải lên cho khách hàng này.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="p-3 rounded-xl border border-gray-200 dark:border-[#332f2c] bg-white dark:bg-[#232120] flex items-center justify-between gap-3 hover:border-gray-300 dark:hover:border-gray-600 transition shadow-2xs group animate-fade-in"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 p-2 bg-gray-100 dark:bg-[#1a1917] rounded-lg">
                  {getFileIcon(file.file_name || file.name || '')}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate" title={file.file_name || file.name}>
                    {file.file_name || file.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
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
                  className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2724] rounded-lg transition"
                  title="Tải xuống tài liệu"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
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

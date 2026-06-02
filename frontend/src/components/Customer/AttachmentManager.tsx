/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from 'react';
import { Paperclip, Download, Trash2, Upload, FileText, FileImage, FileSpreadsheet } from 'lucide-react';
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
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) {
      return <FileImage className="w-8 h-8 text-indigo-400" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-8 h-8 text-[#e8732c]" />;
    }
    return <FileText className="w-8 h-8 text-blue-400" />;
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
      alert('Tải file lên thất bại. Vui lòng kiểm tra lại cấu hình Supabase Storage.');
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
    <div className="glass-panel p-6 rounded-2xl shadow-xl w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Paperclip className="w-5 h-5 text-[#e8732c]" />
            File tổng
          </h2>
          <p className="text-xs text-slate-400 mt-1">Lưu trữ cố định hợp đồng, báo giá, ảnh chứng từ quan trọng của khách hàng.</p>
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
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition disabled:opacity-50 active:scale-95 shadow-lg"
          >
            <Upload className="w-4 h-4 text-[#e8732c]" />
            {uploading ? 'Đang tải lên...' : 'Tải tài liệu lên'}
          </button>
        </div>
      </div>

      {attachments.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-xl">
          <Paperclip className="w-10 h-10 text-slate-600 mx-auto mb-2.5" />
          <p className="text-sm text-slate-500">Chưa có tài liệu đính kèm nào được tải lên cho khách hàng này.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="glass-card p-4 rounded-xl border border-slate-850 flex items-start justify-between gap-3 hover:border-slate-700/60 transition group animate-fade-in"
            >
              <div className="flex items-center gap-3 w-10/12">
                <div className="shrink-0 p-2 bg-slate-900 rounded-lg">
                  {getFileIcon(file.file_name || file.name || '')}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-sm font-bold text-slate-200 truncate" title={file.file_name || file.name}>
                    {file.file_name || file.name}
                  </h4>
                  <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-slate-400">
                    <span>Người tải: {file.uploader?.name || file.uploadedBy?.name || 'Nhân viên'}</span>
                    <span>Ngày tải: {new Date(file.createdAt || (file as any).created_at || new Date()).toLocaleDateString('vi-VN')} - {formatFileSize(file.size)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0 opacity-80 group-hover:opacity-100 transition">
                <a
                  href={file.file_url || file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-[#e8732c]/20 text-slate-400 hover:text-[#e8732c] rounded transition"
                  title="Tải xuống nhanh"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="p-1.5 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 rounded transition"
                  title="Xóa tài liệu"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

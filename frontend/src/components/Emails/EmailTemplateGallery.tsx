import React, { useState } from 'react';
import { Check, Copy, Eye, LayoutTemplate, Send } from 'lucide-react';
import { AVAILABLE_TEMPLATES, type EmailTemplateItem } from './templates';

interface EmailTemplateGalleryProps {
  onPreview: (template: EmailTemplateItem) => void;
  onCompose: (template: EmailTemplateItem) => void;
}

/** Lưới các mẫu email chuẩn hóa và tiêu đề mail sử dụng ở đầu trang. */
export const EmailTemplateGallery: React.FC<EmailTemplateGalleryProps> = ({
  onPreview,
  onCompose,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopySubject = (e: React.MouseEvent, tmpl: EmailTemplateItem) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tmpl.defaultSubject);
    setCopiedId(tmpl.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#1d1c19] border border-gray-200 dark:border-[#332f2c] rounded-2xl p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-[#2b2825]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <LayoutTemplate className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Mẫu Email Tiếp Thị Chuẩn &amp; Tiêu Đề Mẫu
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Chọn mẫu thiết kế và tiêu đề tương ứng bên dưới để gửi tiếp cận khách hàng.
            </p>
          </div>
        </div>
        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-[#282522] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#3a3632] self-start sm:self-auto">
          {AVAILABLE_TEMPLATES.length} mẫu có sẵn
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {AVAILABLE_TEMPLATES.map((tmpl) => {
          const isCopied = copiedId === tmpl.id;
          return (
            <div
              key={tmpl.id}
              className="flex flex-col justify-between p-3.5 rounded-xl border border-gray-200/80 dark:border-[#332f2c] bg-gray-50/50 dark:bg-[#232120]/60 hover:bg-white dark:hover:bg-[#232120] hover:border-gray-300 dark:hover:border-[#423d38] transition-all shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${tmpl.badgeColor}`}
                  >
                    {tmpl.category}
                  </span>
                </div>

                <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                  {tmpl.name}
                </h3>

                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                  {tmpl.description}
                </p>

                {/* Tiêu đề mail mẫu sử dụng */}
                <div className="mt-3 p-2 rounded-lg bg-white dark:bg-[#1a1917] border border-gray-200/70 dark:border-[#332f2c]">
                  <div className="flex items-center justify-between text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1">
                    <span>Tiêu đề gửi:</span>
                    <button
                      type="button"
                      onClick={(e) => handleCopySubject(e, tmpl)}
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      title="Sao chép tiêu đề này"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Chép</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-[11px] font-medium text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">
                    {tmpl.defaultSubject}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3.5 pt-2.5 border-t border-gray-100 dark:border-[#2b2825]">
                <button
                  type="button"
                  onClick={() => onPreview(tmpl)}
                  className="flex-1 h-7 px-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#2c2a27] dark:hover:bg-[#35322e] text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Xem trước giao diện HTML email"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem mẫu</span>
                </button>

                <button
                  type="button"
                  onClick={() => onCompose(tmpl)}
                  className="h-7 px-3 bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Sử dụng mẫu này để gửi cho khách"
                >
                  <Send className="w-3 h-3 text-orange-400 dark:text-orange-600" />
                  <span>Dùng mẫu</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

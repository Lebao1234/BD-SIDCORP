import React from 'react';
import { Eye, FileText, Send, Sparkles } from 'lucide-react';
import { AVAILABLE_TEMPLATES, type EmailTemplateItem } from './templates';

interface EmailTemplateGalleryProps {
  onPreview: (template: EmailTemplateItem) => void;
  onCompose: (template: EmailTemplateItem) => void;
}

/** Lưới các mẫu email dựng sẵn ở đầu trang. */
export const EmailTemplateGallery: React.FC<EmailTemplateGalleryProps> = ({
  onPreview,
  onCompose,
}) => (
  <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Kho Mẫu Email Tiếp Thị Chuẩn Hóa
          </h2>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Nhấp vào nút{' '}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">"Xem mẫu"</span> riêng ở
            từng mẫu để xem trước giao diện HTML thực tế.
          </p>
        </div>
      </div>
      <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 self-start sm:self-auto border border-zinc-200/70 dark:border-zinc-700/60">
        {AVAILABLE_TEMPLATES.length} mẫu thiết kế sẵn
      </span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {AVAILABLE_TEMPLATES.map((tmpl) => (
        <div
          key={tmpl.id}
          className="group flex flex-col justify-between p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-2xs"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${tmpl.badgeColor}`}
              >
                {tmpl.category}
              </span>
              <FileText className="w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-500 transition-colors" />
            </div>

            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
              {tmpl.name}
            </h3>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
              {tmpl.description}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={() => onPreview(tmpl)}
              className="flex-1 h-7 px-2.5 bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-98"
              title="Click để xem toàn bộ mẫu email này"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem mẫu</span>
            </button>

            <button
              type="button"
              onClick={() => onCompose(tmpl)}
              className="h-7 px-2.5 bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
              title="Sử dụng mẫu này để soạn email cho khách hàng"
            >
              <Send className="w-3 h-3 text-orange-500" />
              <span>Dùng</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

import React, { useEffect, useState } from 'react';
import { Check, Code, Copy, Eye, FileText, Monitor, Smartphone, X } from 'lucide-react';

export interface PreviewItem {
  /** Định danh của thứ đang xem — trang cha dùng làm `key` để remount. */
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  htmlContent: string;
}

interface EmailPreviewModalProps {
  item: PreviewItem;
  onClose: () => void;
}

/**
 * Cửa sổ xem trước một email hoặc mẫu template.
 *
 * `previewMode`, `deviceMode` và trạng thái "đã sao chép" chỉ có ý nghĩa khi
 * cửa sổ đang mở, nên chúng thuộc về component này chứ không phải trang cha —
 * trước đây trang cha giữ cả ba và vẽ lại toàn bộ bảng mỗi khi đổi chế độ xem.
 *
 * Trang cha render component này kèm `key={item.id}`, nên mở một email khác là
 * một lần mount mới và ba trạng thái trên tự trở về mặc định — không cần
 * useEffect đồng bộ lại.
 */
export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({ item, onClose }) => {
  const [previewMode, setPreviewMode] = useState<'visual' | 'code'>('visual');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);

  // Esc để đóng — cửa sổ chiếm toàn màn hình nên cần lối thoát bằng bàn phím
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.htmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Clipboard bị chặn (không phải HTTPS, hoặc trình duyệt từ chối quyền).
      // Im lặng ở đây thì người dùng bấm mà không hiểu vì sao không có gì xảy ra.
      console.error('Không thể sao chép mã HTML:', err);
      window.prompt('Trình duyệt chặn sao chép tự động. Hãy sao chép thủ công:', item.htmlContent);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl z-10 flex flex-col border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-modal-pop max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>{item.title}</span>
                {item.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800">
                    {item.badge}
                  </span>
                )}
              </h3>
              {item.subtitle && (
                <p className="text-xs text-zinc-500 truncate max-w-sm sm:max-w-md mt-0.5">
                  {item.subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200/70 dark:border-zinc-700/60">
              <button
                type="button"
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
                type="button"
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

            {previewMode === 'visual' && (
              <div className="hidden sm:flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200/70 dark:border-zinc-700/60">
                <button
                  type="button"
                  onClick={() => setDeviceMode('desktop')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    deviceMode === 'desktop'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                  title="Xem dạng Máy tính"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode('mobile')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    deviceMode === 'mobile'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                  title="Xem dạng Di động"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="h-8 px-3 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1.5 text-xs font-medium shadow-2xs"
              title="Sao chép toàn bộ mã HTML"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span className="hidden sm:inline">{copied ? 'Đã sao chép' : 'Sao chép HTML'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cửa sổ xem trước"
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-100 dark:bg-zinc-950 flex justify-center">
          {previewMode === 'visual' ? (
            <div
              className={`transition-all duration-300 shadow-md rounded-xl overflow-hidden bg-white ${
                deviceMode === 'desktop'
                  ? 'w-full max-w-[650px] min-h-[500px]'
                  : 'w-[375px] min-h-[600px] border-4 border-zinc-800 rounded-3xl'
              }`}
            >
              {/* sandbox rỗng: HTML mẫu chỉ để xem bố cục, không cần chạy script */}
              <iframe
                srcDoc={item.htmlContent}
                title="Xem trước email"
                sandbox=""
                className="w-full h-full min-h-[550px] border-none"
              />
            </div>
          ) : (
            <div className="w-full max-w-3xl">
              <pre className="p-4 bg-zinc-900 text-zinc-100 text-xs font-mono rounded-xl overflow-x-auto border border-zinc-800 leading-relaxed max-h-[550px]">
                {item.htmlContent}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

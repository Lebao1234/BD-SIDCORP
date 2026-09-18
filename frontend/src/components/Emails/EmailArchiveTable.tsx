import React, { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Clock,
  Copy,
  Eye,
  Mail,
  MoreHorizontal,
  Trash2,
  User,
} from 'lucide-react';
import { formatDateTime } from '../../utils/datetime';
import type { ArchivedEmail } from './emailCampaign';

interface EmailArchiveTableProps {
  emails: ArchivedEmail[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onView: (email: ArchivedEmail) => void;
  onToggleStatus: (email: ArchivedEmail) => void;
  onCopyHtml: (email: ArchivedEmail) => void;
  onDelete: (email: ArchivedEmail) => void;
  busyId?: string | null;
}

/** Bảng danh sách email đã lưu trữ. */
export const EmailArchiveTable: React.FC<EmailArchiveTableProps> = ({
  emails,
  selectedIds,
  onSelectionChange,
  onView,
  onToggleStatus,
  onCopyHtml,
  onDelete,
  busyId,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Đóng menu khi bấm ra ngoài. Đăng ký một lần cho cả bảng thay vì mỗi dòng
  // một listener.
  useEffect(() => {
    if (!activeMenuId) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  const allSelected = emails.length > 0 && selectedIds.length === emails.length;

  const toggleSelectAll = () => {
    onSelectionChange(allSelected ? [] : emails.map((e) => e.id));
  };

  const toggleSelectOne = (id: string) => {
    onSelectionChange(
      selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]
    );
  };

  const runAndCloseMenu = (action: () => void) => {
    action();
    setActiveMenuId(null);
  };

  return (
    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs overflow-hidden">
      {emails.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mx-auto mb-3 text-zinc-400">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Không tìm thấy email lưu trữ nào
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Bấm "Soạn &amp; Lưu trữ Email" ở trên để lưu email đầu tiên.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 text-[11px] font-medium select-none">
                <th className="w-10 px-3 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Chọn tất cả email"
                    className="rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                  />
                </th>
                <th className="w-56 px-3 py-2.5">Người nhận / Khách hàng</th>
                <th className="px-3 py-2.5 min-w-[280px]">Tiêu đề thư &amp; Nội dung</th>
                <th className="w-48 px-3 py-2.5">Mẫu áp dụng</th>
                <th className="w-36 px-3 py-2.5">Người soạn</th>
                <th className="w-40 px-3 py-2.5">Thời gian gửi / Lưu</th>
                <th className="w-24 px-3 py-2.5 text-center">Trạng thái</th>
                <th className="w-16 px-3 py-2.5 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {emails.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isMenuOpen = activeMenuId === item.id;
                const isBusy = busyId === item.id;

                return (
                  <tr
                    key={item.id}
                    onClick={() => onView(item)}
                    className={`group hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer ${
                      isSelected ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''
                    } ${isBusy ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(item.id)}
                        aria-label={`Chọn email gửi tới ${item.recipientName}`}
                        className="rounded border-zinc-300 dark:border-zinc-600 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                      />
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.recipientName}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                          {item.recipientEmail || '—'}
                        </span>
                        {item.customerCompany && (
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" />
                            <span>{item.customerCompany}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-0.5 max-w-xl">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {item.subject}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                          {item.snippet}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80">
                        {item.templateName}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                        <User className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{item.senderName}</span>
                      </div>
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                      {formatDateTime(item.sentAt)}
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap text-center">
                      {item.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>Đã gửi</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                          <span>Bản nháp</span>
                        </span>
                      )}
                    </td>

                    <td
                      className="px-3 py-2.5 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className="relative inline-block text-left"
                        ref={isMenuOpen ? menuRef : null}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(isMenuOpen ? null : item.id)}
                          aria-label="Mở menu thao tác"
                          className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-30 py-1 text-left animate-pop-in">
                            <button
                              type="button"
                              onClick={() => runAndCloseMenu(() => onView(item))}
                              className="w-full px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Xem chi tiết email</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => runAndCloseMenu(() => onToggleStatus(item))}
                              className="w-full px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>
                                {item.status === 'sent' ? 'Đổi sang Bản nháp' : 'Đánh dấu Đã gửi'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => runAndCloseMenu(() => onCopyHtml(item))}
                              className="w-full px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Sao chép mã HTML</span>
                            </button>

                            <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                            <button
                              type="button"
                              onClick={() => runAndCloseMenu(() => onDelete(item))}
                              className="w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa khỏi lưu trữ</span>
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

      <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
        <div>
          {selectedIds.length > 0 ? (
            <span>
              Đã chọn {selectedIds.length} / {emails.length}
            </span>
          ) : (
            <span>{emails.length} email được lưu trữ</span>
          )}
        </div>
      </div>
    </div>
  );
};

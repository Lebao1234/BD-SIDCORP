import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
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
  onBulkDelete?: (emails: ArchivedEmail[]) => void;
  busyId?: string | null;
  isBulkDeleting?: boolean;
}

/** Số dòng hiển thị mỗi trang của bảng lưu trữ */
const ROWS_PER_PAGE = 50;

/** Bảng danh sách email đã lưu trữ (Tập trung danh sách, không hiện tiêu đề lặp, hỗ trợ check trùng & xóa hàng loạt). */
export const EmailArchiveTable: React.FC<EmailArchiveTableProps> = ({
  emails,
  selectedIds,
  onSelectionChange,
  onView,
  onToggleStatus,
  onCopyHtml,
  onDelete,
  onBulkDelete,
  busyId,
  isBulkDeleting = false,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Bảng này trước đây render THẲNG toàn bộ danh sách vào DOM. Sau một lần nhập
  // Excel vài nghìn dòng thì mỗi thao tác gõ phím hay tick chọn đều phải đối
  // chiếu lại ngần ấy hàng, và trình duyệt đứng hình.
  const [page, setPage] = useState(1);

  // Đổi bộ lọc hoặc từ khoá thì quay về trang đầu. Điều chỉnh ngay trong lúc
  // render (pattern React khuyến nghị) thay vì thêm một useEffect và một vòng
  // render thừa.
  const [lastEmailsRef, setLastEmailsRef] = useState(emails);
  if (emails !== lastEmailsRef) {
    setLastEmailsRef(emails);
    setPage(1);
  }

  // Đóng menu khi bấm ra ngoài
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

  // Bản đồ đếm số lần xuất hiện của từng địa chỉ email để check trùng
  const duplicateMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const email of emails) {
      const addr = (email.recipientEmail || '').trim().toLowerCase();
      if (addr) {
        map.set(addr, (map.get(addr) || 0) + 1);
      }
    }
    return map;
  }, [emails]);

  // Tổng số dòng có email bị trùng
  const duplicateRows = useMemo(() => {
    return emails.filter((e) => {
      const addr = (e.recipientEmail || '').trim().toLowerCase();
      return addr && (duplicateMap.get(addr) || 0) > 1;
    });
  }, [emails, duplicateMap]);

  const totalPages = Math.max(1, Math.ceil(emails.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visibleEmails = useMemo(
    () => emails.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE),
    [emails, safePage]
  );

  // "Chọn tất cả" vẫn áp dụng cho CẢ danh sách đang lọc, không chỉ trang đang
  // xem — nếu không thì nút xoá hàng loạt sẽ lặng lẽ bỏ sót dữ liệu.
  const allSelected = emails.length > 0 && selectedIds.length === emails.length;

  const toggleSelectAll = () => {
    onSelectionChange(allSelected ? [] : emails.map((e) => e.id));
  };

  const toggleSelectOne = (id: string) => {
    onSelectionChange(
      selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]
    );
  };

  const selectAllDuplicates = () => {
    onSelectionChange(duplicateRows.map((e) => e.id));
  };

  const runAndCloseMenu = (action: () => void) => {
    action();
    setActiveMenuId(null);
  };

  const handleExecuteBulkDelete = () => {
    if (!onBulkDelete || selectedIds.length === 0) return;
    const selectedEmails = emails.filter((e) => selectedIds.includes(e.id));
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa ${selectedEmails.length} email đã chọn khỏi kho lưu trữ?`
      )
    ) {
      onBulkDelete(selectedEmails);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1d1c19] border border-gray-200 dark:border-[#332f2c] rounded-2xl shadow-2xs overflow-hidden">
      {/* Thanh công cụ thao tác hàng loạt khi có mục được chọn */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 bg-blue-50/90 dark:bg-blue-950/40 border-b border-blue-200/70 dark:border-blue-900/50 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-900 dark:text-blue-200">
              Đã chọn {selectedIds.length} / {emails.length} email
            </span>
            <button
              type="button"
              onClick={() => onSelectionChange([])}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer ml-1"
            >
              Bỏ chọn tất cả
            </button>
          </div>

          <div className="flex items-center gap-2">
            {duplicateRows.length > 0 && (
              <button
                type="button"
                onClick={selectAllDuplicates}
                className="h-7 px-2.5 border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Chọn tất cả {duplicateRows.length} mail trùng
              </button>
            )}

            {onBulkDelete && (
              <button
                type="button"
                onClick={handleExecuteBulkDelete}
                disabled={isBulkDeleting}
                className="h-7 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isBulkDeleting ? 'Đang xóa...' : `Xóa ${selectedIds.length} email đã chọn`}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {emails.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#282522] flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Không tìm thấy email lưu trữ nào
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Bấm "Soạn &amp; Lưu trữ Email" hoặc "Nhập Excel" ở trên để thêm vào danh sách.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#332f2c] bg-gray-50/75 dark:bg-[#232120]/80 text-gray-500 dark:text-gray-400 text-[11px] font-medium select-none">
                <th className="w-10 px-3.5 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Chọn tất cả email"
                    className="rounded border-gray-300 dark:border-gray-600 text-gray-900 focus:ring-gray-900 cursor-pointer"
                  />
                </th>
                <th className="px-3.5 py-3 min-w-[240px]">Người nhận &amp; Địa chỉ Email</th>
                <th className="px-3.5 py-3 w-48">Mẫu áp dụng</th>
                <th className="px-3.5 py-3 w-36">Người soạn</th>
                <th className="px-3.5 py-3 w-40">Thời gian gửi / Lưu</th>
                <th className="px-3.5 py-3 w-28 text-center">Trạng thái</th>
                <th className="px-3.5 py-3 w-36 text-center">Kiểm tra trùng</th>
                <th className="px-3.5 py-3 w-16 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-[#2b2825]">
              {visibleEmails.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isMenuOpen = activeMenuId === item.id;
                const isBusy = busyId === item.id;

                const emailAddr = (item.recipientEmail || '').trim().toLowerCase();
                const dupCount = emailAddr ? duplicateMap.get(emailAddr) || 0 : 0;
                const isDuplicate = dupCount > 1;

                return (
                  <tr
                    key={item.id}
                    onClick={() => onView(item)}
                    className={`group hover:bg-gray-50/70 dark:hover:bg-[#232120]/60 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    } ${isBusy ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="px-3.5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(item.id)}
                        aria-label={`Chọn email gửi tới ${item.recipientName}`}
                        className="rounded border-gray-300 dark:border-gray-600 text-gray-900 focus:ring-gray-900 cursor-pointer"
                      />
                    </td>

                    {/* Người nhận & Email */}
                    <td className="px-3.5 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.recipientName}
                        </span>
                        <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 font-medium">
                          {item.recipientEmail || '—'}
                        </span>
                        {item.customerCompany && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" />
                            <span>{item.customerCompany}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Mẫu áp dụng */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-[#282522] text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-[#3a3632]">
                        {item.templateName}
                      </span>
                    </td>

                    {/* Người soạn */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{item.senderName}</span>
                      </div>
                    </td>

                    {/* Thời gian */}
                    <td className="px-3.5 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                      {formatDateTime(item.sentAt)}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-3.5 py-3 whitespace-nowrap text-center">
                      {item.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>Đã gửi</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#282522] border border-gray-200 dark:border-[#3a3632] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                          <span>Bản nháp</span>
                        </span>
                      )}
                    </td>

                    {/* Kiểm tra trùng lặp */}
                    <td className="px-3.5 py-3 whitespace-nowrap text-center">
                      {isDuplicate ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          title={`Địa chỉ email này đã gửi/lưu ${dupCount} lần`}
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          <span>Trùng ({dupCount})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500/70" />
                          <span>Duy nhất</span>
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td
                      className="px-3.5 py-3 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className="relative inline-block text-left"
                        ref={isMenuOpen ? menuRef : null}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            title="Xóa email này"
                            className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveMenuId(isMenuOpen ? null : item.id)}
                            aria-label="Mở menu thao tác"
                            className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#282522] transition cursor-pointer"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>

                        {isMenuOpen && (
                          <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#1d1c19] border border-gray-200 dark:border-[#332f2c] rounded-xl shadow-lg z-30 py-1 text-left animate-pop-in">
                            <button
                              type="button"
                              onClick={() => runAndCloseMenu(() => onView(item))}
                              className="w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#282522] flex items-center gap-2 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-400" />
                              <span>Xem chi tiết email</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => runAndCloseMenu(() => onToggleStatus(item))}
                              className="w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#282522] flex items-center gap-2 cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>
                                {item.status === 'sent' ? 'Đổi sang Bản nháp' : 'Đánh dấu Đã gửi'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => runAndCloseMenu(() => onCopyHtml(item))}
                              className="w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#282522] flex items-center gap-2 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-gray-400" />
                              <span>Sao chép mã HTML</span>
                            </button>

                            <div className="my-1 border-t border-gray-100 dark:border-[#2b2825]" />

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

      {/* Footer bảng */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-[#2b2825] bg-gray-50/50 dark:bg-[#232120]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400">
        <div>
          {selectedIds.length > 0 ? (
            <span>
              Đã chọn <strong className="text-gray-800 dark:text-gray-200">{selectedIds.length}</strong> / {emails.length} email
            </span>
          ) : (
            <span>Tổng cộng <strong className="text-gray-800 dark:text-gray-200">{emails.length}</strong> email được lưu trữ</span>
          )}
        </div>

        {duplicateRows.length > 0 && (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Phát hiện {duplicateRows.length} bản ghi bị trùng địa chỉ email</span>
            <button
              type="button"
              onClick={selectAllDuplicates}
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
            >
              (Chọn để xóa)
            </button>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 sm:ml-auto">
            <span className="tnum text-gray-500 dark:text-gray-400">
              Trang {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(safePage - 1)}
              disabled={safePage <= 1}
              className="h-7 rounded-lg border border-gray-200 dark:border-[#332f2c] px-2.5 font-medium
                text-gray-600 dark:text-gray-300 transition hover:text-gray-900 dark:hover:text-white
                disabled:pointer-events-none disabled:opacity-40"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= totalPages}
              className="h-7 rounded-lg border border-gray-200 dark:border-[#332f2c] px-2.5 font-medium
                text-gray-600 dark:text-gray-300 transition hover:text-gray-900 dark:hover:text-white
                disabled:pointer-events-none disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

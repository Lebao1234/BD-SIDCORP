import React, { useMemo, useState } from 'react';
import { AlertCircle, FileSpreadsheet, Inbox, Plus, RotateCw } from 'lucide-react';
import { AppLayout } from '../../components/Layout/AppLayout';
import { Alert } from '../../components/common/Alert';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../hooks/useFeedback';
import { useEmailCampaigns } from '../../hooks/useEmailCampaigns';
import { formatDateTime } from '../../utils/datetime';
import {
  buildEmailFromInput,
  matchesSearch,
  type ArchivedEmail,
  type ComposeEmailInput,
  DEFAULT_TEMPLATE_ID,
  type EmailTemplateItem,
  ComposeEmailModal,
  ImportEmailExcelModal,
  EmailArchiveTable,
  EmailArchiveToolbar,
  type ArchiveFilter,
  EmailPreviewModal,
  type PreviewItem,
  EmailTemplateGallery,
} from '../../components/Emails';

/**
 * Trang Lưu Trữ Email & Tiếp Thị.
 *
 * LƯU Ý NGHIỆP VỤ: trang này KHÔNG gửi email — backend chưa có dịch vụ gửi thư.
 * "Đã gửi" nghĩa là người dùng tự ghi nhận rằng họ đã gửi thư cho khách bằng hộp
 * thư của mình. Nhãn trên giao diện viết theo đúng nghĩa đó để không ai hiểu
 * nhầm là hệ thống đã thay mình gửi đi.
 */
export const MarketingEmailPage: React.FC = () => {
  const { user } = useAuth();
  const {
    emails,
    loading,
    isRefreshing,
    loadError,
    refetch,
    createEmail,
    bulkCreateEmails,
    changeStatus,
    deleteEmail,
    bulkDeleteEmails,
  } = useEmailCampaigns();
  const { feedback, showSuccess, showErrorFrom, clear } = useFeedback();

  const [activeFilter, setActiveFilter] = useState<ArchiveFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<PreviewItem | null>(null);
  const [composeTemplateId, setComposeTemplateId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const sentCount = useMemo(() => emails.filter((e) => e.status === 'sent').length, [emails]);
  const draftCount = emails.length - sentCount;

  // Tính số lượng các bản ghi có địa chỉ email bị trùng
  const duplicateEmails = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of emails) {
      const addr = (e.recipientEmail || '').trim().toLowerCase();
      if (addr) map.set(addr, (map.get(addr) || 0) + 1);
    }
    return emails.filter((e) => {
      const addr = (e.recipientEmail || '').trim().toLowerCase();
      return addr && (map.get(addr) || 0) > 1;
    });
  }, [emails]);

  const duplicateCount = duplicateEmails.length;

  const filteredEmails = useMemo(() => {
    const dupMap = new Map<string, number>();
    for (const e of emails) {
      const addr = (e.recipientEmail || '').trim().toLowerCase();
      if (addr) dupMap.set(addr, (dupMap.get(addr) || 0) + 1);
    }

    return emails.filter((item) => {
      if (activeFilter === 'duplicates') {
        const addr = (item.recipientEmail || '').trim().toLowerCase();
        if (!addr || (dupMap.get(addr) || 0) <= 1) return false;
      } else if (activeFilter !== 'all' && item.status !== activeFilter) {
        return false;
      }
      return matchesSearch(item, searchQuery);
    });
  }, [emails, activeFilter, searchQuery]);

  const handlePreviewTemplate = (tmpl: EmailTemplateItem) => {
    setPreviewItem({
      id: `template-${tmpl.id}`,
      title: tmpl.name,
      subtitle: `Mẫu template: ${tmpl.category} • Tiêu đề gợi ý: ${tmpl.defaultSubject}`,
      badge: tmpl.category,
      htmlContent: tmpl.htmlContent,
    });
  };

  const handleViewEmail = (item: ArchivedEmail) => {
    setPreviewItem({
      id: `email-${item.id}`,
      title: item.subject,
      subtitle: `Người nhận: ${item.recipientName}${
        item.recipientEmail ? ` (${item.recipientEmail})` : ''
      } • ${formatDateTime(item.sentAt)}`,
      badge: item.templateName,
      htmlContent: item.htmlContent,
    });
  };

  const handleCreate = async (input: ComposeEmailInput) => {
    // Lỗi được ném tiếp để cửa sổ soạn thư tự hiển thị và giữ nguyên dữ liệu đã nhập
    await createEmail.mutateAsync(buildEmailFromInput(input, user?.name ?? 'Không rõ'));
    showSuccess(
      input.status === 'sent'
        ? 'Đã ghi nhận email vào kho lưu trữ.'
        : 'Đã lưu bản nháp email thành công.'
    );
  };

  const handleImportExcel = async (importedEmails: Array<Omit<ArchivedEmail, 'id' | 'dbId'>>) => {
    await bulkCreateEmails.mutateAsync(importedEmails);
    setIsImportModalOpen(false);
    showSuccess(`Đã nhập thành công ${importedEmails.length} email từ file Excel vào kho lưu trữ.`);
  };

  const handleToggleStatus = async (item: ArchivedEmail) => {
    clear();
    setBusyId(item.id);
    try {
      const next = item.status === 'sent' ? 'draft' : 'sent';
      await changeStatus.mutateAsync({ email: item, status: next });
      showSuccess(
        next === 'sent' ? 'Đã đánh dấu email là đã gửi.' : 'Đã chuyển email về bản nháp.'
      );
    } catch (err) {
      showErrorFrom(err, 'Không thể cập nhật trạng thái email.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: ArchivedEmail) => {
    if (
      !window.confirm(`Bạn có chắc muốn xóa email gửi tới "${item.recipientName}" khỏi lưu trữ?`)
    ) {
      return;
    }

    clear();
    setBusyId(item.id);
    try {
      await deleteEmail.mutateAsync(item);
      setSelectedIds((prev) => prev.filter((id) => id !== item.id));
      showSuccess('Đã xóa email khỏi kho lưu trữ.');
    } catch (err) {
      showErrorFrom(err, 'Không thể xóa email khỏi lưu trữ.');
    } finally {
      setBusyId(null);
    }
  };

  const handleBulkDelete = async (selectedEmails: ArchivedEmail[]) => {
    clear();
    try {
      await bulkDeleteEmails.mutateAsync(selectedEmails);
      const deletedIdSet = new Set(selectedEmails.map((e) => e.id));
      setSelectedIds((prev) => prev.filter((id) => !deletedIdSet.has(id)));
      showSuccess(`Đã xóa ${selectedEmails.length} email khỏi kho lưu trữ.`);
    } catch (err) {
      showErrorFrom(err, 'Không thể xóa các email đã chọn.');
    }
  };

  const handleCopyHtml = async (item: ArchivedEmail) => {
    clear();
    try {
      await navigator.clipboard.writeText(item.htmlContent);
      showSuccess('Đã sao chép mã HTML của email này.');
    } catch (err) {
      showErrorFrom(err, 'Trình duyệt không cho phép sao chép tự động.');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2.5">
              <Inbox className="w-5 h-5 text-orange-500" />
              <span>Lưu Trữ Email &amp; Tiếp Thị</span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Kho mẫu email HTML và nhật ký các email tiếp cận khách hàng. Hệ thống lưu lại nội dung
              và lịch sử — việc gửi thư vẫn thực hiện bằng hộp thư của bạn.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefreshing}
              title="Làm mới danh sách email"
              className="h-8 w-8 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs disabled:opacity-60"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              title="Tải lên file Excel để nhập danh sách email hàng loạt"
              className="h-8 px-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-98"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Nhập Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setComposeTemplateId(DEFAULT_TEMPLATE_ID)}
              className="h-8 px-3.5 bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Soạn &amp; Lưu trữ Email</span>
            </button>
          </div>
        </div>

        <Alert feedback={feedback} onDismiss={clear} />

        <EmailTemplateGallery
          onPreview={handlePreviewTemplate}
          onCompose={(tmpl) => setComposeTemplateId(tmpl.id)}
        />

        <EmailArchiveToolbar
          totalCount={emails.length}
          sentCount={sentCount}
          draftCount={draftCount}
          duplicateCount={duplicateCount}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {loadError ? (
          <div className="bg-white dark:bg-[#1d1c19] border border-rose-200 dark:border-rose-900/50 rounded-2xl p-10 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mx-auto mb-3 text-rose-500">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Không tải được kho lưu trữ email
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{loadError.message}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 h-8 px-4 bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-900 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : loading ? (
          <div className="bg-white dark:bg-[#1d1c19] border border-gray-200 dark:border-[#332f2c] rounded-2xl p-12 text-center shadow-2xs">
            <RotateCw className="w-5 h-5 animate-spin text-gray-400 mx-auto mb-3" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Đang tải kho lưu trữ email...
            </p>
          </div>
        ) : (
          <EmailArchiveTable
            emails={filteredEmails}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onView={handleViewEmail}
            onToggleStatus={handleToggleStatus}
            onCopyHtml={handleCopyHtml}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            busyId={busyId}
            isBulkDeleting={bulkDeleteEmails.isPending}
          />
        )}

        {previewItem && (
          <EmailPreviewModal
            key={previewItem.id}
            item={previewItem}
            onClose={() => setPreviewItem(null)}
          />
        )}

        {composeTemplateId && (
          <ComposeEmailModal
            initialTemplateId={composeTemplateId}
            isSaving={createEmail.isPending}
            onClose={() => setComposeTemplateId(null)}
            onSubmit={handleCreate}
          />
        )}

        {isImportModalOpen && (
          <ImportEmailExcelModal
            isImporting={bulkCreateEmails.isPending}
            onClose={() => setIsImportModalOpen(false)}
            onSubmit={handleImportExcel}
            currentUserName={user?.name ?? 'Nhân viên'}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default MarketingEmailPage;

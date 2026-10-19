import React, { useState, useMemo } from 'react';
import { AppLayout } from '../../components/Layout/AppLayout';
import {
  Search,
  Plus,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Table as TableIcon,
  Presentation,
  Folder,
  FileCheck,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Archive,
} from 'lucide-react';
import api from '../../services/api';
import { Asset } from '../../types';
import { useResourceAssets } from '../../hooks/useResourceAssets';
import { ResourceModal } from '../../components/Resources/ResourceModal';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow, EmptyCell } from '../../components/ui/table';
import { notify, confirmDialog } from '../../lib/notify';

const CATEGORIES = [
  'Tất cả',
  'Hợp đồng',
  'Proposal / Đề xuất',
  'Báo giá',
  'Slide năng lực',
  'Biểu mẫu & Checklist',
  'Quy trình & Framework',
  'Khác',
];

export const ResourceHubPage: React.FC = () => {
  const { assets, isLoading, createAsset, uploadAsset, updateAsset, deleteAsset } = useResourceAssets();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Copy Link State
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredAssets = useMemo(() => {
    return assets.filter((item) => {
      const matchCat =
        selectedCategory === 'Tất cả' ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        !search.trim() ||
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()) ||
        item.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [assets, selectedCategory, search]);

  const handleCopyLink = (asset: Asset) => {
    navigator.clipboard.writeText(asset.file_url);
    setCopiedId(asset.id);
    showToast(`Đã sao chép liên kết: ${asset.title}`);

    // Ghi nhận lượt sao chép
    api.post(`/assets/${asset.id}/usage`, { note: 'Sao chép link Drive' }).catch(() => {});

    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleOpenDrive = (asset: Asset) => {
    window.open(asset.file_url, '_blank', 'noopener,noreferrer');
    api.post(`/assets/${asset.id}/usage`, { note: 'Mở trực tiếp tài liệu' }).catch(() => {});
  };

  const handleDelete = async (asset: Asset) => {
    if (await confirmDialog({ title: `Xoá "${asset.title}"?`, message: 'Tài liệu sẽ bị gỡ khỏi danh sách.', danger: true })) {
      try {
        await deleteAsset.mutateAsync(asset.id);
        showToast('Đã xóa tài liệu khỏi danh sách.');
      } catch (err) {
        notify.error(err, 'Không thể xoá tài liệu.');
      }
    }
  };

  // Submit Modal - Thêm bằng link hoặc Sửa
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleModalSubmit = async (data: any) => {
    if (editingAsset) {
      await updateAsset.mutateAsync({ id: editingAsset.id, data });
      showToast('Đã cập nhật thông tin tài liệu.');
    } else {
      await createAsset.mutateAsync(data);
      showToast('Đã thêm tài liệu mới thành công.');
    }
  };

  // Submit Modal - Tải tệp trực tiếp lên Supabase
  const handleModalUpload = async (formData: FormData) => {
    await uploadAsset.mutateAsync(formData);
    showToast('Đã tải lên và lưu tài liệu thành công.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Icon hiển thị theo định dạng tài liệu
  const renderFormatBadge = (format?: string | null) => {
    const cls =
      'inline-flex items-center gap-1 rounded border border-line bg-raised px-1.5 py-0.5 text-[11px] font-medium text-fg-subtle dark:border-line dark:bg-panel';
    switch (format) {
      case 'sheets':
        return (
          <span className={cls}>
            <TableIcon className="h-3 w-3 text-ok" /> Sheets
          </span>
        );
      case 'slides':
        return (
          <span className={cls}>
            <Presentation className="h-3 w-3 text-warn" /> Slides
          </span>
        );
      case 'folder':
        return (
          <span className={cls}>
            <Folder className="h-3 w-3 text-info" /> Thư mục
          </span>
        );
      case 'pdf':
        return (
          <span className={cls}>
            <FileCheck className="h-3 w-3 text-danger" /> PDF
          </span>
        );
      case 'image':
        return (
          <span className={cls}>
            <ImageIcon className="h-3 w-3 text-purple-500" /> Ảnh
          </span>
        );
      case 'archive':
        return (
          <span className={cls}>
            <Archive className="h-3 w-3 text-amber-500" /> File nén
          </span>
        );
      case 'docs':
      default:
        return (
          <span className={cls}>
            <FileText className="h-3 w-3 text-info" /> Docs
          </span>
        );
    }
  };

  return (
    <AppLayout>
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-md border border-line-strong bg-surface px-3.5 py-2 text-xs font-medium text-fg shadow-md animate-fade-in dark:border-line-input dark:bg-surface">
          <Check className="h-3.5 w-3.5 text-ok shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-3.5 pb-8">
        {/* ── Tiêu đề + Hành động chính ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-[19px] font-semibold tracking-[-0.01em]">Kho tài liệu & biểu mẫu</h1>
            <p className="text-xs text-fg-subtle">
              {filteredAssets.length} tài liệu trong kho lưu trữ
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View Mode Toggle: Grid / Table */}
            <div className="flex h-[30px] items-stretch rounded-md border border-line bg-raised p-0.5 dark:border-line dark:bg-panel">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center rounded px-2 text-xs transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'border border-line-strong bg-surface font-medium text-fg dark:border-line-input dark:bg-surface'
                    : 'text-fg-subtle hover:text-fg'
                }`}
                title="Dạng lưới thẻ"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center justify-center rounded px-2 text-xs transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'border border-line-strong bg-surface font-medium text-fg dark:border-line-input dark:bg-surface'
                    : 'text-fg-subtle hover:text-fg'
                }`}
                title="Dạng danh sách"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={() => {
                setEditingAsset(null);
                setIsModalOpen(true);
              }}
              type="button"
              className="flex h-[30px] items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-medium text-white transition hover:bg-brand-hover cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.1} />
              <span>Thêm tài liệu</span>
            </button>
          </div>
        </div>

        {/* ── Toolbar: Search & Danh mục ── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên tài liệu, từ khoá…"
              className="h-[30px] w-64 md:w-72 rounded-md border border-line bg-surface pl-8 pr-2.5 text-xs text-fg placeholder:text-fg-subtle dark:border-line dark:bg-surface focus:border-line-strong focus:outline-none"
            />
          </div>

          <div className="hidden sm:block mx-1 h-4 w-px bg-line dark:bg-line" />

          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`h-[30px] rounded-md border px-2.5 text-xs transition cursor-pointer ${
                  isActive
                    ? 'border-line-strong bg-raised font-medium text-fg dark:border-line-input dark:bg-raised'
                    : 'border-line bg-surface text-fg-muted hover:text-fg dark:border-line dark:bg-surface'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ── Nội dung tài liệu ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-xs text-fg-subtle">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-fg-subtle border-t-transparent" />
            <span>Đang tải danh sách tài liệu…</span>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-line bg-surface py-14 text-center dark:border-line dark:bg-surface">
            <p className="text-[13px] font-medium text-fg">Không tìm thấy tài liệu phù hợp</p>
            <p className="text-xs text-fg-subtle">
              {search || selectedCategory !== 'Tất cả'
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.'
                : 'Bấm “Thêm tài liệu” để lưu trữ liên kết tài liệu biểu mẫu đầu tiên.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── Dạng Thẻ (Grid View) ── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredAssets.map((asset) => {
              const isCopied = copiedId === asset.id;
              return (
                <div
                  key={asset.id}
                  className="flex flex-col justify-between rounded-lg border border-line bg-surface p-3.5 transition duration-150 hover:border-line-strong dark:border-line dark:bg-surface group"
                >
                  <div className="flex flex-col gap-2">
                    {/* Header: Định dạng & Danh mục */}
                    <div className="flex items-center justify-between gap-2">
                      {renderFormatBadge(asset.format)}
                      <span className="truncate text-[11px] font-medium text-fg-subtle dark:text-fg-subtle">
                        {asset.category || 'Tài liệu'}
                      </span>
                    </div>

                    {/* Tiêu đề */}
                    <h3
                      onClick={() => handleOpenDrive(asset)}
                      className="text-[13px] font-semibold tracking-[-0.01em] text-fg dark:text-fg leading-snug hover:text-brand cursor-pointer line-clamp-2"
                    >
                      {asset.title}
                    </h3>

                    {/* Mô tả */}
                    {asset.description && (
                      <p className="text-xs text-fg-body dark:text-fg-body line-clamp-2 leading-relaxed">
                        {asset.description}
                      </p>
                    )}

                    {/* Tags */}
                    {Array.isArray(asset.tags) && asset.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {asset.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="rounded border border-line bg-raised px-1.5 py-0.5 text-[10px] text-fg-subtle dark:border-line dark:bg-panel dark:text-fg-subtle"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between gap-1.5 border-t border-divider dark:border-divider pt-2.5 mt-3">
                    {/* Nút Copy Link */}
                    <button
                      type="button"
                      onClick={() => handleCopyLink(asset)}
                      className={`flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition cursor-pointer ${
                        isCopied
                          ? 'border-ok/30 bg-ok/10 text-ok'
                          : 'border-line bg-surface text-fg hover:bg-raised dark:border-line dark:bg-surface dark:text-fg-body dark:hover:bg-raised'
                      }`}
                      title="Sao chép liên kết"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-fg-subtle dark:text-fg-subtle" />
                          <span>Sao chép liên kết</span>
                        </>
                      )}
                    </button>

                    {/* Nút Mở trực tiếp trên Drive hoặc Tệp tin */}
                    <button
                      type="button"
                      onClick={() => handleOpenDrive(asset)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface text-fg-subtle transition hover:bg-raised hover:text-fg dark:border-line dark:bg-surface dark:text-fg-subtle dark:hover:text-fg dark:hover:bg-raised cursor-pointer"
                      title={asset.file_url?.includes('/attachments/') ? 'Xem / Tải tệp tin' : 'Mở trên Google Drive'}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>

                    {/* Nút Sửa */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAsset(asset);
                        setIsModalOpen(true);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-fg-subtle transition hover:bg-raised hover:text-fg dark:hover:bg-raised cursor-pointer"
                      title="Sửa tài liệu"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Nút Xoá */}
                    <button
                      type="button"
                      onClick={() => handleDelete(asset)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-fg-subtle transition hover:bg-danger/10 hover:text-danger cursor-pointer"
                      title="Xoá tài liệu"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Dạng Danh Sách (Table View) ── */
          <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên tài liệu / biểu mẫu</TableHead>
                    <TableHead>Định dạng</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="text-right">
                      <span className="sr-only">Thao tác</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => {
                    const isCopied = copiedId === asset.id;
                    return (
                      <TableRow key={asset.id}>
                        <TableCell>
                          <div
                            onClick={() => handleOpenDrive(asset)}
                            className="font-medium text-fg cursor-pointer hover:text-brand"
                          >
                            {asset.title}
                          </div>
                          <div className="max-w-xs truncate text-xs text-fg-subtle">
                            {asset.file_url}
                          </div>
                        </TableCell>
                        <TableCell>{renderFormatBadge(asset.format)}</TableCell>
                        <TableCell className="text-fg-muted">{asset.category || <EmptyCell />}</TableCell>
                        <TableCell className="max-w-xs truncate text-fg-subtle">
                          {asset.description || <EmptyCell />}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyLink(asset)}
                              className={`h-7 px-2.5 rounded-md border text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                                isCopied
                                  ? 'border-ok/30 bg-ok/10 text-ok'
                                  : 'border-line bg-surface text-fg hover:bg-raised dark:border-line dark:bg-surface'
                              }`}
                            >
                              {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              <span>{isCopied ? 'Đã sao chép' : 'Sao chép'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDrive(asset)}
                              className="h-7 w-7 flex items-center justify-center rounded-md border border-line bg-surface text-fg-subtle hover:text-fg hover:bg-raised dark:border-line dark:bg-surface"
                              title={asset.file_url?.includes('/attachments/') ? 'Xem / Tải tệp tin' : 'Mở trên Google Drive'}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAsset(asset);
                                setIsModalOpen(true);
                              }}
                              className="h-7 w-7 flex items-center justify-center rounded-md text-fg-subtle hover:text-fg hover:bg-raised"
                              title="Sửa"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(asset)}
                              className="h-7 w-7 flex items-center justify-center rounded-md text-fg-subtle hover:text-danger hover:bg-danger/10"
                              title="Xóa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
          </TableContainer>
        )}
      </div>

      {/* Modal thêm/sửa tài liệu */}
      <ResourceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAsset(null);
        }}
        onSubmit={handleModalSubmit}
        onUpload={handleModalUpload}
        initialData={editingAsset}
      />
    </AppLayout>
  );
};

export default ResourceHubPage;

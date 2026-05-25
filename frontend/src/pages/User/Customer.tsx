import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../../components/Header';
import { CompanyForm } from '../../components/Company/CompanyForm';
import { CustomerProfile } from '../../components/Customer/CustomerProfile';
import { CustomerNoteTimeline } from '../../components/Customer/CustomerNoteTimeline';
import { AttachmentManager } from '../../components/Customer/AttachmentManager';
import { X } from 'lucide-react';

import { CustomerTab } from './tabs/CustomerTab';
import { CompanyTab } from './tabs/CompanyTab';
import { useCustomerDetail } from '../../hooks/useCustomerDetail';
import { Customer, CustomerDetailResponse, Attachment } from '../../types';

const UserDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'customer';

  // Company Form State
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  // Customer Detail Hook
  const {
    selectedCustomer,
    setSelectedCustomer,
    isDetailModalOpen,
    handleCloseDetail
  } = useCustomerDetail(searchParams.get('customerId'));

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectCustomer = (id: string) => {
    setSearchParams({ customerId: id, tab: currentTab });
  };

  const handleOpenCompanyForm = (companyId: number | null) => {
    setSelectedCompanyId(companyId);
    setIsCompanyFormOpen(true);
  };

  const handleCloseDetailModal = () => {
    handleCloseDetail();
    setSearchParams({ tab: currentTab }); // Clear customerId from URL
  };

  const handleCustomerUpdated = (updated: Customer) => {
    const detail = updated as unknown as CustomerDetailResponse;
    const mappedAttachments: Attachment[] = (detail.documents || []).map((doc) => ({
      id: doc.id.toString(),
      name: doc.file_name || '',
      url: doc.file_url || '',
      customerId: doc.customer_id.toString(),
      userId: (doc.uploaded_by || '').toString(),
      createdAt: doc.created_at,
      uploader: doc.uploader,
      file_name: doc.file_name,
      file_url: doc.file_url,
    }));

    setSelectedCustomer(prev => prev ? { ...prev, ...updated, attachments: mappedAttachments } : null);
    handleCloseDetailModal();
  };


  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-[#070b13] text-slate-100 overflow-hidden relative">
      <Header isAdminPage={false} onSelectCustomer={handleSelectCustomer} />

      <div className="flex-1 flex overflow-hidden mt-20">
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentTab === 'company' ? (
            <CompanyTab onOpenCompanyForm={handleOpenCompanyForm} />
          ) : (
            <CustomerTab 
              onSelectCustomer={handleSelectCustomer} 
              onOpenCompanyForm={handleOpenCompanyForm} 
            />
          )}
        </main>
      </div>

      {/* MODAL CHI TIẾT KHÁCH HÀNG */}
      {isDetailModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={handleCloseDetailModal}
          />
          <div className="relative w-full max-w-5xl max-h-[95vh] glass-panel rounded-2xl shadow-2xl z-10 flex flex-col border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
              <h3 className="text-lg font-bold text-white">Chi tiết Khách hàng</h3>
              <button
                onClick={handleCloseDetailModal}
                className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#070b13]/90">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <CustomerProfile
                  customer={selectedCustomer}
                  onUpdate={handleCustomerUpdated}
                />
                <CustomerNoteTimeline
                  customerId={selectedCustomer.id.toString()}
                  notes={selectedCustomer.notes ?? []}
                  onNoteAdded={(note) => {
                    setSelectedCustomer(prev => prev ? { ...prev, notes: [note, ...(prev.notes ?? [])] } : null);
                  }}
                />
              </div>

              <AttachmentManager
                customerId={selectedCustomer.id.toString()}
                attachments={selectedCustomer.attachments ?? []}
                onAttachmentUploaded={(newFile) => {
                  setSelectedCustomer(prev => prev ? { ...prev, attachments: [newFile, ...(prev.attachments ?? [])] } : null);
                }}
                onAttachmentDeleted={(fileId) => {
                  setSelectedCustomer(prev => prev ? { ...prev, attachments: (prev.attachments ?? []).filter(a => String(a.id) !== String(fileId)) } : null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM/SỬA CÔNG TY */}
      {isCompanyFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsCompanyFormOpen(false)}
          />
          <div className="glass-panel p-6 rounded-2xl shadow-2xl z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-800 relative">
            <h3 className="text-lg font-bold text-white mb-4 pb-2 border-b border-slate-800">
              {selectedCompanyId ? 'Cập nhật Thông tin Công ty' : 'Thêm Công ty Mới'}
            </h3>
            <CompanyForm
              companyId={selectedCompanyId}
              onSaved={() => {
                setIsCompanyFormOpen(false);
                // Ghi chú: Nếu CompanyTab đang mở, cần cơ chế trigger refetch (ví dụ gọi fetchCompanies hoặc truyền event).
                // Do thiết kế đơn giản, ta đóng form. Lần sau mở tab sẽ có autoFetch.
              }}
              onCancel={() => setIsCompanyFormOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;

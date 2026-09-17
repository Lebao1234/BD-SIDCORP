import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../../components/Layout/AppLayout';
import { CompanyForm } from '../../components/Company/CompanyForm';
import { CustomerProfile } from '../../components/Customer/CustomerProfile';
import { CustomerNoteTimeline } from '../../components/Customer/CustomerNoteTimeline';
import { AttachmentManager } from '../../components/Customer/AttachmentManager';
import { X, Phone, Mail, Briefcase } from 'lucide-react';

import { CustomerTab } from './tabs/CustomerTab';
import { CompanyTab } from './tabs/CompanyTab';
import { useCustomerDetail } from '../../hooks/useCustomerDetail';
import { Customer, CustomerDetailResponse, Attachment } from '../../types';
import { CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_CLASS } from '../../utils/constants';

const UserDashboard: React.FC = () => {
  const queryClient = useQueryClient();
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
    
    // Invalidate query to refresh the Customer list on the main page
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    handleCloseDetailModal();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppLayout isAdminPage={false} onSelectCustomer={handleSelectCustomer}>
      <div className="space-y-6">
        {currentTab === 'company' ? (
          <CompanyTab onOpenCompanyForm={handleOpenCompanyForm} />
        ) : (
          <CustomerTab 
            onSelectCustomer={handleSelectCustomer} 
            onOpenCompanyForm={handleOpenCompanyForm} 
          />
        )}
      </div>

      {/* MODAL CHI TIẾT KHÁCH HÀNG */}
      {isDetailModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={handleCloseDetailModal}
          />
          <div className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-[#1d1c19] rounded-2xl shadow-2xl z-10 flex flex-col border border-gray-200 dark:border-[#332f2c] overflow-hidden animate-modal-pop">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#332f2c] bg-white dark:bg-[#1d1c19] shrink-0">
              <div className="min-w-0">
                {/* Eyebrow & Status */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-mono font-medium text-gray-400 dark:text-gray-500 tracking-wider">
                    KH-{selectedCustomer.id.toString().padStart(4, '0')}
                  </span>
                  <span className="text-gray-300 dark:text-gray-700">·</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedCustomer.company?.name || 'Khách hàng cá nhân'}
                  </span>
                  {selectedCustomer.status && (
                    <>
                      <span className="text-gray-300 dark:text-gray-700">·</span>
                      <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border shadow-2xs ${
                        CUSTOMER_STATUS_CLASS[selectedCustomer.status] || CUSTOMER_STATUS_CLASS.NEW
                      }`}>
                        {CUSTOMER_STATUS_LABEL[selectedCustomer.status] || selectedCustomer.status}
                      </span>
                    </>
                  )}
                </div>

                {/* Primary Entity Title */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {selectedCustomer.name}
                </h3>

                {/* Metadata Row */}
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {selectedCustomer.phone_number && (
                    <span className="font-mono text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {selectedCustomer.phone_number}
                    </span>
                  )}
                  {selectedCustomer.email && (
                    <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {selectedCustomer.email}
                    </span>
                  )}
                  {selectedCustomer.field && (
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {selectedCustomer.field}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleCloseDetailModal}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#282522] rounded-xl transition shrink-0 ml-4 cursor-pointer"
                title="Đóng (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50/60 dark:bg-[#151412] custom-scrollbar">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <CustomerProfile
                  customer={selectedCustomer}
                  onUpdate={handleCustomerUpdated}
                />
                <div className="space-y-6 flex flex-col h-full">
                  <CustomerNoteTimeline
                    customerId={selectedCustomer.id.toString()}
                    notes={selectedCustomer.notes ?? []}
                    onNoteAdded={(note) => {
                      setSelectedCustomer(prev => prev ? { ...prev, notes: [note, ...(prev.notes ?? [])] } : null);
                    }}
                    onAttachmentUploaded={(newFile) => {
                      setSelectedCustomer(prev => prev ? { ...prev, attachments: [newFile, ...(prev.attachments ?? [])] } : null);
                    }}
                  />
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
          </div>
        </div>
      )}

      {/* MODAL THÊM/SỬA ĐẦU MỐI DOANH NGHIỆP */}
      {isCompanyFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsCompanyFormOpen(false)}
          />
          <div className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-[#1d1c19] rounded-2xl shadow-2xl z-10 flex flex-col border border-gray-200 dark:border-[#332f2c] overflow-hidden animate-modal-pop">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#332f2c] bg-white dark:bg-[#1d1c19] shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {selectedCompanyId ? 'Cập nhật Đầu mối Doanh nghiệp' : 'Thêm Đầu mối Doanh nghiệp'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedCompanyId ? 'Quản lý thông tin doanh nghiệp, MST và thông tin thanh toán' : 'Tạo mới hồ sơ doanh nghiệp / đối tác hợp tác'}
                </p>
              </div>
              <button
                onClick={() => setIsCompanyFormOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#282522] rounded-xl transition cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-[#1d1c19] custom-scrollbar">
              <CompanyForm
                companyId={selectedCompanyId}
                onSaved={() => {
                  setIsCompanyFormOpen(false);
                }}
                onCancel={() => setIsCompanyFormOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default UserDashboard;
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Customer, CustomerDetailResponse, Note, Attachment } from '../types';

export const useCustomerDetail = (initialCustomerId: string | null) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialCustomerId);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [localCustomerData, setLocalCustomerData] = useState<Customer | null>(null);

  useEffect(() => {
    if (initialCustomerId !== selectedCustomerId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId, selectedCustomerId]);

  const fetchDetail = async (id: string) => {
    const response = await api.get<CustomerDetailResponse>(`/customers/${id}`);
    const data = response.data;
    
    // Map exchanges to notes
    const mappedNotes: Note[] = (data.exchanges || []).map((ex) => ({
      id: ex.id.toString(),
      customerId: ex.customer_id.toString(),
      authorId: (ex.writer_id || ex.writer?.id || '').toString(),
      authorName: ex.writer?.name || 'Unknown',
      content: ex.content || '',
      createdAt: ex.created_at,
    }));

    // Map documents to attachments
    const mappedAttachments: Attachment[] = (data.documents || []).map((doc) => ({
      id: doc.id.toString(),
      name: doc.file_name || '',
      url: doc.file_url || '',
      customerId: doc.customer_id.toString(),
      userId: doc.uploaded_by.toString(),
      createdAt: doc.created_at,
      uploader: doc.uploader,
      file_name: doc.file_name,
      file_url: doc.file_url,
    }));
    
    return { ...data, notes: mappedNotes, attachments: mappedAttachments } as unknown as Customer;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['customerDetail', selectedCustomerId],
    queryFn: () => fetchDetail(selectedCustomerId!),
    enabled: !!selectedCustomerId,
  });

  useEffect(() => {
    if (selectedCustomerId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDetailModalOpen(true);
    } else {
      setIsDetailModalOpen(false);
      setLocalCustomerData(null);
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalCustomerData(data);
    }
  }, [data]);

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedCustomerId(null);
  };

  return {
    selectedCustomerId,
    setSelectedCustomerId,
    selectedCustomer: localCustomerData,
    setSelectedCustomer: setLocalCustomerData,
    isDetailModalOpen,
    setIsDetailModalOpen,
    handleCloseDetail,
    isLoading
  };
};

import { Note } from './note';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size?: number;
  customerId: string;
  userId: string;
  createdAt: string;
  file_name?: string;
  file_url?: string;
  uploadedBy?: {
    id: number;
    name: string;
  };
  uploader?: {
    id: number;
    name: string;
  };
}

export interface BackendDocument {
  id: number;
  file_name: string;
  file_url: string;
  customer_id: number;
  uploaded_by: number;
  created_at: string;
  uploader?: {
    id: number;
    name: string;
  };
}

export interface Customer {
  exchanges: never[];
  id: string | number;
  name: string;
  company_id?: number | null;
  company?: string | { id: number; name: string };
  field?: string;
  price: number;
  status: string;
  email: string;
  phone_number: string;
  address?: string;
  from_source?: string;
  appointment?: string;
  note?: string;
  created_at: string;
  updated_at?: string;
  address?: string;
  classified?: string;
  attachments?: Attachment[];
  notes?: Note[];
}

export interface CustomerDetailResponse extends Omit<Customer, 'exchanges'> {
  documents: BackendDocument[];
  exchanges: {
    id: number;
    customer_id: number;
    writer_id: number;
    content: string;
    created_at: string;
    writer: {
      id: number;
      name: string;
    };
  }[];
}

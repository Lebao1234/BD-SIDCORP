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
  id: number;
  displayId?: string;
  name: string;
  company_id?: number | null;
  company?: string | {
    id: number;
    name: string;
    tax_code?: string;
    email?: string;
    phone?: string;
    website?: string;
    facebook?: string;
    linkedin?: string;
    zalo?: string;
    address?: string;
    location?: string;
    field?: string;
    status?: string;
    note?: string;
    bank_name?: string;
    bank_account_no?: string;
    bank_branch?: string;
  };
  field?: string;
  price: number;
  status: string;
  email: string;
  phone_number: string;
  address?: string;
  link_url?: string;
  from_source?: string;
  appointment?: string;
  note?: string;
  created_at: string;
  updated_at?: string;
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

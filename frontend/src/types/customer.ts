import { CustomerExchangeNote } from './note';
import { Company } from './company';

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
  id: number;
  displayId?: string;
  name: string;
  owner_id?: number | null;
  owner?: { id: number; name: string | null; email?: string | null } | null;
  company_id?: number | null;
  // GET /customers và GET /customers/:id trả về cùng một hình dạng cho trường
  // này, nên không còn union `string | object` như trước.
  company?: Company | null;
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
  reject_reason?: string;
  current_step?: string;
  attachments?: Attachment[];
  notes?: CustomerExchangeNote[];
}

export interface CustomerDetailResponse extends Customer {
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

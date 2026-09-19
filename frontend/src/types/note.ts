export interface NoteWriter {
  id: string;
  name: string;
}

export interface NoteResponse {
  id: number;
  content: string;
  created_at: string;
  writer: NoteWriter;
}

export interface FrontendNoteResponse {
  id: number;
  content: string;
  created_at: string;
  customer_id: number;
  writer: NoteWriter;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface CustomerOption {
  id: number;
  name: string | null;
  phone_number: string | null;
}

/**
 * Ghi chú cá nhân / công việc trong hệ thống Notes
 */
export interface Note {
  id: string;
  title: string;
  content?: string;
  imageUrl?: string;
  checklist?: ChecklistItem[];
  labels: string[];
  customer_id?: number | null;
  customerName?: string | null;
  isSyncedToExchange?: boolean;
  archived?: boolean;
  createdAt: string;
}

/**
 * Ghi chú trao đổi gắn với khách hàng trong CRM Timeline (Customer Exchange)
 */
export interface CustomerExchangeNote {
  id?: string;
  _id?: string;
  customerId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

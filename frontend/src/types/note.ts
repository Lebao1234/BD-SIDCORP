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

export interface Note {
  id?: string;
  _id?: string;
  customerId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Asset {
  id: number;
  type: 'DOCUMENT' | 'SOCIAL_POST' | 'EMAIL_TEMPLATE';
  title: string;
  description?: string | null;
  category?: string | null;
  status: 'DRAFT' | 'READY' | 'PUBLISHED' | 'ARCHIVED';
  tags: string[];
  file_url: string;
  file_name?: string | null;
  format?: string | null;
  meta?: Record<string, any> | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
  _count?: {
    usages: number;
  };
}

export interface AssetUsage {
  id: number;
  asset_id: number;
  customer_id?: number | null;
  used_at: string;
  note?: string | null;
}


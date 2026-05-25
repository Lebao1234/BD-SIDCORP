export interface Company {
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
  status: 'active' | 'inactive' | 'potential';
  note?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_branch?: string;
  created_at: string;
  updated_at?: string;
}

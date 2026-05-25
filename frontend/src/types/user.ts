export interface User {
  id: string | number;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  approved?: boolean;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  actions?: never;
}

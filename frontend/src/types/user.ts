export interface User {
  id: number;
  displayId?: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  approved?: boolean;
}

export interface AdminUser {
  id: number;
  displayId?: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  actions?: never;
}

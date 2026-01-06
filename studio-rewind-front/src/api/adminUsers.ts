// src/api/adminUsers.ts
import api from './client';

export type UserRole = 'client' | 'admin' | 'super_admin';
export type AccountType = 'particulier' | 'professionnel';

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  account_type: AccountType;
  firstname?: string | null;
  lastname?: string | null;
  company_name?: string | null;
  vat_number?: string | null;
  phone: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const res = await api.get<AdminUser[]>('/admin/users');
  return res.data;
}

export async function activateAdminUser(userId: string): Promise<AdminUser> {
  const res = await api.patch<AdminUser>(`/admin/activate/${userId}`);
  return res.data;
}

export async function deactivateAdminUser(userId: string): Promise<AdminUser> {
  const res = await api.patch<AdminUser>(`/admin/deactivate/${userId}`);
  return res.data;
}

export async function deleteAdminUser(userId: string): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(`/admin/delete/${userId}`);
  return res.data;
}

// src/api/adminPromo.ts
import api from './client';

export interface PromoCode {
  id: string;
  code: string;
  email: string;
  discount: number;
  used: boolean;
  used_at: string | null;
  expires_at: string;
  createdAt: string;
}

export interface PromoStats {
  total: number;
  used: number;
  active: number;
  expired: number;
}

export async function getAdminPromoCodes(): Promise<PromoCode[]> {
  const res = await api.get<PromoCode[]>('/promo/admin');
  return res.data;
}

export async function getAdminPromoStats(): Promise<PromoStats> {
  const res = await api.get<PromoStats>('/promo/admin/stats');
  return res.data;
}

export async function deleteAdminPromoCode(id: string): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<{ success: boolean; message: string }>(`/promo/admin/${id}`);
  return res.data;
}

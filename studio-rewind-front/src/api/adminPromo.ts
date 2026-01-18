// src/api/adminPromo.ts
import api from './client';

export interface PromoCode {
  id: string;
  code: string;
  email: string;
  discount: number;
  used: boolean;
  used_at: string | null;
  expires_at: string | null;
  createdAt: string;
}

export interface PromoStats {
  total: number;
  used: number;
  active: number;
  expired: number;
}

export interface PopupConfig {
  id: string;
  title: string;
  subtitle: string | null;
  text: string | null;
  discount: number;
  code_prefix: string;
  code_validity_days: number | null;
  show_once: boolean;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromoCodeData {
  code: string;
  discount: number;
  validityDays?: number | null;
}

export interface SavePopupData {
  id?: string;
  title: string;
  subtitle?: string;
  text?: string;
  discount: number;
  code_prefix?: string;
  code_validity_days?: number | null;
  show_once: boolean;
  is_active: boolean;
}

// ============================================================
// CODES PROMO
// ============================================================

export async function getAdminPromoCodes(): Promise<PromoCode[]> {
  const res = await api.get<PromoCode[]>('/promo/admin');
  return res.data;
}

export async function getAdminPromoStats(): Promise<PromoStats> {
  const res = await api.get<PromoStats>('/promo/admin/stats');
  return res.data;
}

export async function createAdminPromoCode(data: CreatePromoCodeData): Promise<{ success: boolean; message: string; promoCode: PromoCode }> {
  const res = await api.post<{ success: boolean; message: string; promoCode: PromoCode }>('/promo/admin/create', data);
  return res.data;
}

export async function deleteAdminPromoCode(id: string): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<{ success: boolean; message: string }>(`/promo/admin/${id}`);
  return res.data;
}

// ============================================================
// POPUPS
// ============================================================

export async function getAdminPopups(): Promise<PopupConfig[]> {
  const res = await api.get<PopupConfig[]>('/promo/admin/popups');
  return res.data;
}

export async function saveAdminPopup(data: SavePopupData): Promise<{ success: boolean; message: string; popup: PopupConfig }> {
  const res = await api.post<{ success: boolean; message: string; popup: PopupConfig }>('/promo/admin/popups', data);
  return res.data;
}

export async function deleteAdminPopup(id: string): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<{ success: boolean; message: string }>(`/promo/admin/popups/${id}`);
  return res.data;
}

export async function toggleAdminPopup(id: string, isActive: boolean): Promise<{ success: boolean; message: string; popup: PopupConfig }> {
  const res = await api.patch<{ success: boolean; message: string; popup: PopupConfig }>(`/promo/admin/popups/${id}/toggle`, { is_active: isActive });
  return res.data;
}

// ============================================================
// PUBLIC - POPUP ACTIVE
// ============================================================

export async function getActivePopup(): Promise<PopupConfig | null> {
  const res = await api.get<PopupConfig | null>('/promo/popup/active');
  return res.data;
}

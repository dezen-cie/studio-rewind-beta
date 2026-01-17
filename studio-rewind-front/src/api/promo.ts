// src/api/promo.ts
import api from './client';

export interface PromoSubscribeResponse {
  success: boolean;
  message: string;
}

export interface PromoValidateResponse {
  valid: boolean;
  discount?: number;
  message: string;
}

export interface PromoApplyResponse {
  success: boolean;
  message: string;
}

/**
 * S'inscrire pour recevoir un code promo par email
 */
export async function subscribePromo(email: string): Promise<PromoSubscribeResponse> {
  const { data } = await api.post<PromoSubscribeResponse>('/promo/subscribe', { email });
  return data;
}

/**
 * Valider un code promo
 */
export async function validatePromoCode(code: string): Promise<PromoValidateResponse> {
  const { data } = await api.post<PromoValidateResponse>('/promo/validate', { code });
  return data;
}

/**
 * Marquer un code promo comme utilise
 */
export async function applyPromoCode(code: string): Promise<PromoApplyResponse> {
  const { data } = await api.post<PromoApplyResponse>('/promo/apply', { code });
  return data;
}

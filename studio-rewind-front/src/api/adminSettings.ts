// src/api/adminSettings.ts
import api from './client';

export interface StudioSettings {
  id: string;
  key: string;
  // Horaires
  opening_time: string;
  closing_time: string;
  open_days: number[];
  // Tarification
  vat_rate: number;
  commission_rate: number;
  night_surcharge_before: string;
  night_surcharge_after: string;
  night_surcharge_percent: number;
  weekend_surcharge_percent: number;
  // Notifications
  confirmation_email_enabled: boolean;
  reminder_enabled: boolean;
  reminder_hours_before: number;
  // Fermetures
  holidays_closure_enabled: boolean;
  // Entreprise
  company_name: string | null;
  company_address: string | null;
  company_postal_code: string | null;
  company_city: string | null;
  company_siret: string | null;
  company_vat_number: string | null;
  company_email: string | null;
  company_phone: string | null;
  // Banque
  bank_name: string | null;
  bank_iban: string | null;
  bank_bic: string | null;
  // Logo
  logo_path: string | null;
}

export interface UpdateSettingsData {
  // Horaires
  opening_time?: string;
  closing_time?: string;
  open_days?: number[];
  // Tarification
  vat_rate?: number;
  commission_rate?: number;
  night_surcharge_before?: string;
  night_surcharge_after?: string;
  night_surcharge_percent?: number;
  weekend_surcharge_percent?: number;
  // Notifications
  confirmation_email_enabled?: boolean;
  reminder_enabled?: boolean;
  reminder_hours_before?: number;
  // Fermetures
  holidays_closure_enabled?: boolean;
  // Entreprise
  company_name?: string;
  company_address?: string;
  company_postal_code?: string;
  company_city?: string;
  company_siret?: string;
  company_vat_number?: string;
  company_email?: string;
  company_phone?: string;
  // Banque
  bank_name?: string;
  bank_iban?: string;
  bank_bic?: string;
}

export interface RatesInfo {
  vat_rate: number;
  commission_rate: number;
}

export interface CompanyInfo {
  name: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  siret: string | null;
  vat_number: string | null;
  email: string | null;
  phone: string | null;
  bank_name: string | null;
  bank_iban: string | null;
  bank_bic: string | null;
  logo_path: string | null;
}

/**
 * Récupère tous les paramètres du studio
 */
export async function getAdminSettings(): Promise<StudioSettings> {
  const res = await api.get<StudioSettings>('/admin/settings');
  return res.data;
}

/**
 * Met à jour les paramètres du studio
 */
export async function updateAdminSettings(data: UpdateSettingsData): Promise<StudioSettings> {
  const res = await api.put<StudioSettings>('/admin/settings', data);
  return res.data;
}

/**
 * Récupère les taux (TVA et commission)
 */
export async function getAdminRates(): Promise<RatesInfo> {
  const res = await api.get<RatesInfo>('/admin/settings/rates');
  return res.data;
}

/**
 * Récupère les informations entreprise
 */
export async function getAdminCompanyInfo(): Promise<CompanyInfo> {
  const res = await api.get<CompanyInfo>('/admin/settings/company');
  return res.data;
}

/**
 * Upload le logo entreprise
 */
export async function uploadAdminLogo(file: File): Promise<{ message: string; logo_path: string }> {
  const formData = new FormData();
  formData.append('logo', file);
  const res = await api.post<{ message: string; logo_path: string }>('/admin/settings/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
}

/**
 * Supprime le logo entreprise
 */
export async function deleteAdminLogo(): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>('/admin/settings/logo');
  return res.data;
}

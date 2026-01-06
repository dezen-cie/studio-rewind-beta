// src/api/formulas.ts
import api from './client';
import type { FormulaKey } from '../pages/ReservationPage';

export interface PublicFormula {
  id: string;
  key: FormulaKey; // "autonome" | "amelioree" | "abonnement" | "reseaux"
  name: string;
  billing_type: 'hourly' | 'subscription';
  price_ttc: number;
}

// --- Admin API ---
export async function getAdminFormulas(): Promise<PublicFormula[]> {
  const res = await api.get<PublicFormula[]>('/admin/formulas');
  return res.data;
}

export async function updateAdminFormula(
  id: string,
  data: { name?: string; price_ttc?: number }
): Promise<PublicFormula> {
  const res = await api.patch<PublicFormula>(`/admin/formulas/${id}`, data);
  return res.data;
}

export async function getPublicFormulas(): Promise<PublicFormula[]> {
  const res = await api.get<PublicFormula[]>('/formulas');
  return res.data;
}

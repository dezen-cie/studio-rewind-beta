// src/api/formulas.ts
import api from './client';
import type { FormulaKey } from '../pages/ReservationPage';

export interface FormulaOption {
  id: string;
  formula_id: string;
  icon: string; // Nom de l'icône Lucide (ex: "FilePlay", "User", "Scissors")
  content: string;
  display_order: number;
}

export interface PublicFormula {
  id: string;
  key: FormulaKey; // "solo" | "duo" | "pro"
  name: string;
  billing_type: 'hourly' | 'subscription';
  price_ttc: number; // Contient le prix HT
  requires_podcaster: boolean; // Si true, nécessite de choisir un podcasteur
  options?: FormulaOption[];
}

// --- Admin API ---
export async function getAdminFormulas(): Promise<PublicFormula[]> {
  const res = await api.get<PublicFormula[]>('/admin/formulas');
  return res.data;
}

export async function updateAdminFormula(
  id: string,
  data: { name?: string; price_ttc?: number; requires_podcaster?: boolean }
): Promise<PublicFormula> {
  const res = await api.patch<PublicFormula>(`/admin/formulas/${id}`, data);
  return res.data;
}

export async function getPublicFormulas(): Promise<PublicFormula[]> {
  const res = await api.get<PublicFormula[]>('/formulas');
  return res.data;
}

// --- Admin Options API ---
export async function getFormulaOptions(formulaId: string): Promise<FormulaOption[]> {
  const res = await api.get<FormulaOption[]>(`/admin/formulas/${formulaId}/options`);
  return res.data;
}

export async function createFormulaOption(
  formulaId: string,
  data: { icon: string; content: string; display_order?: number }
): Promise<FormulaOption> {
  const res = await api.post<FormulaOption>(`/admin/formulas/${formulaId}/options`, data);
  return res.data;
}

export async function updateFormulaOption(
  optionId: string,
  data: { icon?: string; content?: string; display_order?: number }
): Promise<FormulaOption> {
  const res = await api.patch<FormulaOption>(`/admin/formulas/options/${optionId}`, data);
  return res.data;
}

export async function deleteFormulaOption(optionId: string): Promise<void> {
  await api.delete(`/admin/formulas/options/${optionId}`);
}

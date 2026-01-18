// src/api/formulas.ts
import api from './client';

export interface FormulaOption {
  id: string;
  formula_id: string;
  icon: string; // Nom de l'icône Lucide (ex: "FilePlay", "User", "Scissors")
  content: string;
  display_order: number;
}

export interface PublicFormula {
  id: string;
  key: string; // Clé technique unique (ex: "solo", "duo", "pro", ou générée)
  name: string;
  billing_type: 'hourly' | 'subscription';
  price_ttc: number; // Contient le prix HT
  requires_podcaster: boolean; // Si true, nécessite de choisir un podcasteur
  description?: string | null; // Description affichée sur le site
  image_url?: string | null; // URL de l'image de la formule
  border_start?: string; // Couleur début dégradé (ex: "rgb(153, 221, 252)")
  border_end?: string; // Couleur fin dégradé (ex: "rgb(196, 202, 0)")
  min_height?: number; // Hauteur minimale de la carte en pixels
  display_order?: number; // Ordre d'affichage
  is_active?: boolean; // Si false, non affiché sur le site public
  options?: FormulaOption[];
}

export interface CreateFormulaData {
  name: string;
  billing_type?: 'hourly' | 'subscription';
  price_ttc: number;
  requires_podcaster?: boolean;
  description?: string | null;
  border_start?: string;
  border_end?: string;
  min_height?: number;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateFormulaData {
  name?: string;
  price_ttc?: number;
  requires_podcaster?: boolean;
  description?: string | null;
  border_start?: string;
  border_end?: string;
  min_height?: number;
  display_order?: number;
  is_active?: boolean;
}

// --- Admin API ---
export async function getAdminFormulas(): Promise<PublicFormula[]> {
  const res = await api.get<PublicFormula[]>('/admin/formulas');
  return res.data;
}

export async function createAdminFormula(data: CreateFormulaData): Promise<PublicFormula> {
  const res = await api.post<PublicFormula>('/admin/formulas', data);
  return res.data;
}

export async function updateAdminFormula(
  id: string,
  data: UpdateFormulaData
): Promise<PublicFormula> {
  const res = await api.patch<PublicFormula>(`/admin/formulas/${id}`, data);
  return res.data;
}

export async function deleteAdminFormula(id: string): Promise<void> {
  await api.delete(`/admin/formulas/${id}`);
}

export async function uploadFormulaImage(id: string, file: File): Promise<PublicFormula> {
  const formData = new FormData();
  formData.append('photo', file);
  const res = await api.post<PublicFormula>(`/admin/formulas/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export async function deleteFormulaImage(id: string): Promise<PublicFormula> {
  const res = await api.delete<PublicFormula>(`/admin/formulas/${id}/image`);
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

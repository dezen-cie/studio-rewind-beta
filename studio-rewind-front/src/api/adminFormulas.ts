// src/api/adminFormulas.ts
import api from './client';

export interface AdminFormula {
  id: string;
  key: string;
  name: string;
  billing_type: 'hourly' | 'subscription';
  price_ttc: number;
}

export async function getAdminFormulas(): Promise<AdminFormula[]> {
  const res = await api.get<AdminFormula[]>('/admin/formulas');
  return res.data;
}

export async function updateAdminFormula(
  id: string,
  payload: Partial<Pick<AdminFormula, 'name' | 'price_ttc'>>
): Promise<AdminFormula> {
  const res = await api.patch<AdminFormula>(`/admin/formulas/${id}`, payload);
  return res.data;
}

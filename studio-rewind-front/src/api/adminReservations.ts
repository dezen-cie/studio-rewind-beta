// src/api/adminReservations.ts
import api from './client';

export interface AdminReservationUser {
  id: string;
  email: string;
  firstname?: string | null;
  lastname?: string | null;
  company_name?: string | null;
}

export interface AdminReservation {
  id: string;
  user_id: string;
  formula: 'solo' | 'duo' | 'pro';
  start_date: string;
  end_date: string;
  total_hours: number;
  price_ht: number;
  price_tva: number;
  price_ttc: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  User?: AdminReservationUser;
  // Champs promo
  promo_code?: string | null;
  promo_label?: string | null;
  promo_discount?: number | null;
  original_price_ht?: number | null;
  original_price_ttc?: number | null;
}

export async function getAdminReservations(): Promise<AdminReservation[]> {
  const res = await api.get<AdminReservation[]>('/admin/reservations');
  return res.data;
}

export async function getAdminReservationsByDay(date: string): Promise<AdminReservation[]> {
  const res = await api.get<AdminReservation[]>(`/admin/reservations/day/${date}`);
  return res.data;
}

// ====== Nouveaux endpoints d’action admin ======

export interface UpdateReservationPayload {
  start_date: string;
  end_date: string;
}

export async function updateAdminReservation(
  reservationId: string,
  payload: UpdateReservationPayload
): Promise<AdminReservation> {
  const res = await api.patch<AdminReservation>(
    `/admin/reservations/${reservationId}`,
    payload
  );
  return res.data;
}

export async function cancelAdminReservation(
  reservationId: string
): Promise<AdminReservation> {
  const res = await api.post<AdminReservation>(
    `/admin/reservations/${reservationId}/cancel`
  );
  return res.data;
}

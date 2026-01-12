// src/api/memberReservations.ts
import api from './client';

export type MemberReservationStatus = 'pending' | 'confirmed' | 'cancelled';
export type MemberReservationFormula = 'autonome' | 'amelioree' | 'abonnement';

export interface MemberReservation {
  id: string;
  user_id: string;
  formula: MemberReservationFormula;
  start_date: string;
  end_date: string;
  total_hours: number;
  price_ht: number;
  price_tva: number;
  price_ttc: number;
  status: MemberReservationStatus;
  podcaster_id?: string;
  Podcaster?: {
    id: string;
    name: string;
  };
}

export async function getMemberReservations(): Promise<MemberReservation[]> {
  const res = await api.get<MemberReservation[]>('/reservations/me');
  return res.data;
}

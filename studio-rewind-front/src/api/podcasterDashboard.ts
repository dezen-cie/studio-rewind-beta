// src/api/podcasterDashboard.ts
import api from './client';

export interface PodcasterUser {
  id: string;
  email: string;
  firstname: string;
  must_change_password: boolean;
}

export interface PodcasterProfile {
  id: string;
  name: string;
  video_url: string;
  audio_url: string;
  display_order: number;
  is_active: boolean;
}

export interface PodcasterMeResponse {
  user: PodcasterUser;
  podcaster: PodcasterProfile;
}

export interface ReservationUser {
  id: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  company_name: string | null;
  phone: string | null;
}

export interface PodcasterReservation {
  id: string;
  formula: string;
  start_date: string;
  end_date: string;
  total_hours: number;
  price_ttc: number;
  status: string;
  User: ReservationUser;
}

// Récupérer les informations du podcasteur connecté
export async function getPodcasterMe(): Promise<PodcasterMeResponse> {
  const res = await api.get<PodcasterMeResponse>('/podcaster/me');
  return res.data;
}

// Récupérer les réservations du podcasteur pour un jour donné
export async function getPodcasterReservationsByDate(date: string): Promise<PodcasterReservation[]> {
  const res = await api.get<PodcasterReservation[]>(`/podcaster/reservations/${date}`);
  return res.data;
}

// Récupérer toutes les réservations à venir
export async function getPodcasterUpcomingReservations(): Promise<PodcasterReservation[]> {
  const res = await api.get<PodcasterReservation[]>('/podcaster/reservations');
  return res.data;
}

// Changer le mot de passe
export async function changePodcasterPassword(data: {
  current_password?: string;
  new_password: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>('/podcaster/change-password', data);
  return res.data;
}

// ====== GESTION DES CRENEAUX BLOQUES ======

export interface PodcasterBlockedSlot {
  id: string;
  podcaster_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_full_day: boolean;
  reason: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Recuperer tous les creneaux bloques du podcasteur
export async function getPodcasterBlockedSlots(): Promise<PodcasterBlockedSlot[]> {
  const res = await api.get<PodcasterBlockedSlot[]>('/podcaster/blocked-slots');
  return res.data;
}

// Recuperer les creneaux bloques pour une date donnee
export async function getPodcasterBlockedSlotsByDate(date: string): Promise<PodcasterBlockedSlot[]> {
  const res = await api.get<PodcasterBlockedSlot[]>(`/podcaster/blocked-slots/date/${date}`);
  return res.data;
}

// Creer un nouveau creneau bloque
export async function createPodcasterBlockedSlot(data: {
  date: string;
  start_time?: string;
  end_time?: string;
  is_full_day?: boolean;
  reason?: string;
}): Promise<PodcasterBlockedSlot> {
  const res = await api.post<PodcasterBlockedSlot>('/podcaster/blocked-slots', data);
  return res.data;
}

// Supprimer un creneau bloque
export async function deletePodcasterBlockedSlot(id: string): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<{ success: boolean; message: string }>(`/podcaster/blocked-slots/${id}`);
  return res.data;
}

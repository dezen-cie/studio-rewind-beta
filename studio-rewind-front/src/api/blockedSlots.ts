// src/api/blockedSlots.ts
import api from './client';

export interface BlockedSlot {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_full_day: boolean;
  is_unblock?: boolean;
  reason: string | null;
  created_by: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DefaultBlockedRange {
  start: number;
  end: number;
}

export interface StudioSettings {
  id?: string;
  key?: string;
  opening_time: string;
  closing_time: string;
  open_days: number[];
  createdAt?: string;
  updatedAt?: string;
}

// --- API publique ---

/**
 * Récupère les blocages pour une date donnée (public)
 */
export async function getBlockedSlotsForDate(date: string): Promise<BlockedSlot[]> {
  const res = await api.get<BlockedSlot[]>(`/reservations/blocked/${date}`);
  return res.data;
}

/**
 * Récupère les heures bloquées par défaut (0-9h et 18-24h)
 */
export async function getDefaultBlockedHours(): Promise<DefaultBlockedRange[]> {
  const res = await api.get<DefaultBlockedRange[]>('/reservations/default-blocked-hours');
  return res.data;
}

/**
 * Récupère les déblocages pour une date donnée (public)
 */
export async function getUnblocksForDate(date: string): Promise<BlockedSlot[]> {
  const res = await api.get<BlockedSlot[]>(`/reservations/unblocks/${date}`);
  return res.data;
}

/**
 * Récupère les paramètres du studio (horaires et jours d'ouverture) - public
 */
export async function getStudioSettingsPublic(): Promise<StudioSettings> {
  const res = await api.get<StudioSettings>('/reservations/studio-settings');
  return res.data;
}

/**
 * Récupère les plages bloquées calculées depuis les paramètres - public
 */
export async function getComputedBlockedRangesPublic(): Promise<DefaultBlockedRange[]> {
  const res = await api.get<DefaultBlockedRange[]>('/reservations/computed-blocked-ranges');
  return res.data;
}

/**
 * Récupère les dates avec déblocages pour un mois donné - public
 */
export async function getUnblockDatesForMonth(year: number, month: number): Promise<string[]> {
  const res = await api.get<string[]>(`/reservations/unblock-dates/${year}/${month}`);
  return res.data;
}

// --- API Admin ---

/**
 * Récupère les blocages pour un mois (admin)
 */
export async function getAdminBlockedSlotsForMonth(
  year: number,
  month: number
): Promise<BlockedSlot[]> {
  const res = await api.get<BlockedSlot[]>(`/admin/blocked-slots/month/${year}/${month}`);
  return res.data;
}

/**
 * Récupère les blocages pour une date (admin)
 */
export async function getAdminBlockedSlotsForDate(date: string): Promise<BlockedSlot[]> {
  const res = await api.get<BlockedSlot[]>(`/admin/blocked-slots/date/${date}`);
  return res.data;
}

/**
 * Crée un blocage ou déblocage (admin)
 */
export async function createAdminBlockedSlot(data: {
  date: string;
  start_time?: string;
  end_time?: string;
  is_full_day: boolean;
  is_unblock?: boolean;
  reason?: string;
}): Promise<BlockedSlot> {
  const res = await api.post<BlockedSlot>('/admin/blocked-slots', data);
  return res.data;
}

/**
 * Récupère les heures bloquées par défaut (admin)
 */
export async function getAdminDefaultBlockedHours(): Promise<DefaultBlockedRange[]> {
  const res = await api.get<DefaultBlockedRange[]>('/admin/blocked-slots/default-hours');
  return res.data;
}

/**
 * Récupère les déblocages pour une date (admin)
 */
export async function getAdminUnblocksForDate(date: string): Promise<BlockedSlot[]> {
  const res = await api.get<BlockedSlot[]>(`/admin/blocked-slots/unblocks/${date}`);
  return res.data;
}

/**
 * Supprime un blocage par ID (admin)
 */
export async function deleteAdminBlockedSlot(id: string): Promise<void> {
  await api.delete(`/admin/blocked-slots/${id}`);
}

/**
 * Supprime tous les blocages pour une date (admin)
 */
export async function deleteAdminBlockedSlotsForDate(date: string): Promise<{ deleted: number }> {
  const res = await api.delete<{ deleted: number }>(`/admin/blocked-slots/date/${date}`);
  return res.data;
}

/**
 * Récupère les paramètres du studio (admin)
 */
export async function getAdminStudioSettings(): Promise<StudioSettings> {
  const res = await api.get<StudioSettings>('/admin/blocked-slots/settings');
  return res.data;
}

/**
 * Met à jour les paramètres du studio (admin)
 */
export async function updateAdminStudioSettings(data: {
  opening_time?: string;
  closing_time?: string;
  open_days?: number[];
}): Promise<StudioSettings> {
  const res = await api.put<StudioSettings>('/admin/blocked-slots/settings', data);
  return res.data;
}

/**
 * Récupère les plages bloquées calculées depuis les paramètres (admin)
 */
export async function getAdminComputedBlockedRanges(): Promise<DefaultBlockedRange[]> {
  const res = await api.get<DefaultBlockedRange[]>('/admin/blocked-slots/computed-ranges');
  return res.data;
}

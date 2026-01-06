// src/api/blockedSlots.ts
import api from './client';

export interface BlockedSlot {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_full_day: boolean;
  reason: string | null;
  created_by: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- API publique ---

/**
 * Récupère les blocages pour une date donnée (public)
 */
export async function getBlockedSlotsForDate(date: string): Promise<BlockedSlot[]> {
  const res = await api.get<BlockedSlot[]>(`/reservations/blocked/${date}`);
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
 * Crée un blocage (admin)
 */
export async function createAdminBlockedSlot(data: {
  date: string;
  start_time?: string;
  end_time?: string;
  is_full_day: boolean;
  reason?: string;
}): Promise<BlockedSlot> {
  const res = await api.post<BlockedSlot>('/admin/blocked-slots', data);
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

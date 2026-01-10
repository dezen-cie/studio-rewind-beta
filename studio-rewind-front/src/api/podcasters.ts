// src/api/podcasters.ts
import api from './client';

export interface Podcaster {
  id: string;
  name: string;
  video_url: string;
  audio_url: string;
  display_order: number;
  is_active: boolean;
  email?: string;
  user_id?: string;
  defaultPassword?: string; // Retourné uniquement à la création
}

export interface CreatePodcasterData {
  name: string;
  email: string;
  video: File;
  audio: File;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdatePodcasterData {
  name?: string;
  video?: File;
  audio?: File;
  display_order?: number;
  is_active?: boolean;
}

// --- Public API ---
export async function getPublicPodcasters(): Promise<Podcaster[]> {
  const res = await api.get<Podcaster[]>('/podcasters');
  return res.data;
}

// --- Admin API ---
export async function getAdminPodcasters(): Promise<Podcaster[]> {
  const res = await api.get<Podcaster[]>('/admin/podcasters');
  return res.data;
}

export async function createAdminPodcaster(data: CreatePodcasterData): Promise<Podcaster> {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('email', data.email);
  formData.append('video', data.video);
  formData.append('audio', data.audio);
  if (data.display_order !== undefined) {
    formData.append('display_order', String(data.display_order));
  }
  if (data.is_active !== undefined) {
    formData.append('is_active', String(data.is_active));
  }

  const res = await api.post<Podcaster>('/admin/podcasters', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export async function updateAdminPodcaster(
  id: string,
  data: UpdatePodcasterData
): Promise<Podcaster> {
  const formData = new FormData();

  if (data.name !== undefined) {
    formData.append('name', data.name);
  }
  if (data.video) {
    formData.append('video', data.video);
  }
  if (data.audio) {
    formData.append('audio', data.audio);
  }
  if (data.display_order !== undefined) {
    formData.append('display_order', String(data.display_order));
  }
  if (data.is_active !== undefined) {
    formData.append('is_active', String(data.is_active));
  }

  const res = await api.patch<Podcaster>(`/admin/podcasters/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export async function deleteAdminPodcaster(id: string): Promise<void> {
  await api.delete(`/admin/podcasters/${id}`);
}

// --- Public API pour les creneaux bloques ---
export interface PodcasterBlockedSlotPublic {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_full_day: boolean;
}

// Recuperer les creneaux bloques d'un podcasteur pour une date donnee (public)
export async function getPodcasterBlockedSlotsForDate(
  podcasterId: string,
  date: string
): Promise<PodcasterBlockedSlotPublic[]> {
  const res = await api.get<PodcasterBlockedSlotPublic[]>(
    `/podcasters/${podcasterId}/blocked-slots/${date}`
  );
  return res.data;
}

// Recuperer toutes les dates avec jour entier bloque pour un podcasteur (public)
// Utilise pour griser les dates dans le calendrier client
export async function getPodcasterFullDayBlocks(podcasterId: string): Promise<string[]> {
  const res = await api.get<string[]>(`/podcasters/${podcasterId}/full-day-blocks`);
  return res.data;
}

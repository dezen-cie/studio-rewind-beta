// src/api/podcasters.ts
import api from './client';

export interface Podcaster {
  id: string;
  name: string;
  video_url: string | null;
  audio_url: string | null;
  display_order: number;
  team_display_order?: number | null; // Ordre d'affichage sur la page équipe (null = à la fin)
  is_active: boolean;
  email?: string;
  user_id?: string;
  defaultPassword?: string; // Retourné uniquement à la création
  photo_url?: string;
  description?: string;
  profile_online?: boolean;
  team_role?: string; // Rôle affiché sur la page équipe (ex: "CEO & Podcasteur", "CSO")
  role?: 'podcaster' | 'admin' | 'super_admin'; // Rôle de l'utilisateur associé
  is_core_team?: boolean; // Membres principaux
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
  team_display_order?: number | null;
  team_role?: string;
  is_active?: boolean;
}

// --- Public API ---
export async function getPublicPodcasters(): Promise<Podcaster[]> {
  const res = await api.get<Podcaster[]>('/podcasters');
  return res.data;
}

// Récupérer les podcasters avec profil en ligne (page équipe)
export async function getTeamPodcasters(): Promise<Podcaster[]> {
  const res = await api.get<Podcaster[]>('/podcasters/team');
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
  if (data.team_display_order !== undefined) {
    formData.append('team_display_order', data.team_display_order === null ? 'null' : String(data.team_display_order));
  }
  if (data.team_role !== undefined) {
    formData.append('team_role', data.team_role);
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

// Toggle le statut admin d'un podcaster (super admin uniquement)
export async function togglePodcasterAdmin(id: string, makeAdmin: boolean): Promise<Podcaster> {
  const res = await api.patch<Podcaster>(`/admin/podcasters/${id}/toggle-admin`, { makeAdmin });
  return res.data;
}

// Toggle le statut core team d'un podcaster (super admin uniquement)
export async function togglePodcasterCoreTeam(id: string, is_core_team: boolean): Promise<Podcaster> {
  const res = await api.patch<Podcaster>(`/admin/podcasters/${id}/toggle-core-team`, { is_core_team });
  return res.data;
}

// Modifier l'ordre d'affichage sur la page équipe (super admin uniquement)
// team_display_order: 1, 2, 3... pour définir l'ordre, null pour mettre à la fin
export async function updatePodcasterTeamOrder(id: string, team_display_order: number | null): Promise<Podcaster> {
  const res = await api.patch<Podcaster>(`/admin/podcasters/${id}/team-order`, { team_display_order });
  return res.data;
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

// --- Podcaster Dashboard API ---
export interface UpdatePodcasterProfileData {
  photo?: File;
  description?: string;
  profile_online?: boolean;
}

// Mettre à jour le profil du podcaster (photo, description, profile_online)
export async function updatePodcasterProfile(data: UpdatePodcasterProfileData): Promise<Podcaster> {
  const formData = new FormData();

  if (data.photo) {
    formData.append('photo', data.photo);
  }
  if (data.description !== undefined) {
    formData.append('description', data.description);
  }
  if (data.profile_online !== undefined) {
    formData.append('profile_online', String(data.profile_online));
  }

  const res = await api.patch<Podcaster>('/podcaster/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

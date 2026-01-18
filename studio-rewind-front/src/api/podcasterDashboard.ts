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
  video_url: string | null;
  audio_url: string | null;
  display_order: number;
  is_active: boolean;
  photo_url?: string;
  description?: string;
  profile_online?: boolean;
  team_role?: string;
  is_billable?: boolean;
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

// ====== GESTION DU PROFIL EQUIPE ======

export interface UpdatePodcasterProfileData {
  photo?: File;
  description?: string;
  profile_online?: boolean;
}

// Mettre à jour le profil du podcaster (photo, description, profile_online)
export async function updatePodcasterProfile(data: UpdatePodcasterProfileData): Promise<PodcasterProfile> {
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

  const res = await api.patch<PodcasterProfile>('/podcaster/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

// ====== DEVENIR / QUITTER PODCASTER ======

export interface CheckPodcasterResponse {
  hasPodcasterProfile: boolean;
  podcaster: PodcasterProfile | null;
}

// Vérifier si l'utilisateur a un profil podcaster
export async function checkPodcasterProfile(): Promise<CheckPodcasterResponse> {
  const res = await api.get<CheckPodcasterResponse>('/podcaster/check-podcaster');
  return res.data;
}

// Devenir podcaster (pour admin/super_admin)
export async function becomePodcaster(data: {
  name: string;
  video?: File;
  audio?: File;
}): Promise<{ success: boolean; message: string; podcaster: PodcasterProfile }> {
  const formData = new FormData();
  formData.append('name', data.name);
  if (data.video) {
    formData.append('video', data.video);
  }
  if (data.audio) {
    formData.append('audio', data.audio);
  }

  const res = await api.post<{ success: boolean; message: string; podcaster: PodcasterProfile }>(
    '/podcaster/become-podcaster',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return res.data;
}

// Désactiver le profil podcaster
export async function deactivatePodcasterProfile(): Promise<{ success: boolean; message: string; podcaster: PodcasterProfile }> {
  const res = await api.patch<{ success: boolean; message: string; podcaster: PodcasterProfile }>(
    '/podcaster/deactivate-podcaster'
  );
  return res.data;
}

// Réactiver le profil podcaster
export async function reactivatePodcasterProfile(): Promise<{ success: boolean; message: string; podcaster: PodcasterProfile }> {
  const res = await api.patch<{ success: boolean; message: string; podcaster: PodcasterProfile }>(
    '/podcaster/reactivate-podcaster'
  );
  return res.data;
}

// Uploader/mettre à jour les fichiers video/audio
export async function uploadPodcasterMedia(data: {
  video?: File;
  audio?: File;
}): Promise<{ success: boolean; message: string; podcaster: PodcasterProfile }> {
  const formData = new FormData();
  if (data.video) {
    formData.append('video', data.video);
  }
  if (data.audio) {
    formData.append('audio', data.audio);
  }

  const res = await api.patch<{ success: boolean; message: string; podcaster: PodcasterProfile }>(
    '/podcaster/upload-media',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return res.data;
}

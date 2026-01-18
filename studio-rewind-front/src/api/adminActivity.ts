// src/api/adminActivity.ts
import api from './client';

// Types
export interface ClientActivity {
  id: string;
  email: string;
  name: string;
  account_type: 'particulier' | 'professionnel' | null;
  vat_number: string | null;
  phone: string | null;
  total_reservations: number;
  total_hours: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  total_discount: number;
  promos_used: number;
  promo_type: 'Code' | 'Popup' | null;
  promo_codes: string[];
  first_reservation: string | null;
  last_reservation: string | null;
  created_at: string;
}

export interface ClientsTotals {
  total_clients: number;
  total_reservations: number;
  total_hours: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  total_discount: number;
  total_promos: number;
}

export interface ClientsActivityResponse {
  clients: ClientActivity[];
  totals: ClientsTotals;
}

export interface PodcasterActivity {
  id: string;
  name: string;
  is_billable: boolean;
  total_sessions: number;
  total_hours: number;
  total_revenue_ht: number;
  total_revenue_ttc: number;
  commission_rate: number;
  commission_ht: number;
  commission_tva: number;
  commission_ttc: number;
  first_session: string | null;
  last_session: string | null;
}

export interface PodcastersTotals {
  total_podcasters: number;
  total_sessions: number;
  total_hours: number;
  total_revenue_ht: number;
  total_revenue_ttc: number;
  total_commission_ht: number;
  total_commission_tva: number;
  total_commission_ttc: number;
}

export interface PodcastersActivityResponse {
  podcasters: PodcasterActivity[];
  totals: PodcastersTotals;
}

export interface ActivitySummary {
  period: {
    start_date: string | null;
    end_date: string | null;
  };
  clients: {
    total: number;
    new_clients: number;
    total_reservations: number;
  };
  revenue: {
    total_ht: number;
    total_tva: number;
    total_ttc: number;
    total_discount: number;
  };
  hours: {
    total: number;
  };
  commissions: {
    total_ht: number;
    total_ttc: number;
  };
  promos: {
    codes_used: number;
    total_discount: number;
  };
}

export interface ActivityFilters {
  start_date?: string;
  end_date?: string;
}

// API functions
export async function getActivitySummary(filters?: ActivityFilters): Promise<ActivitySummary> {
  const params = new URLSearchParams();
  if (filters?.start_date) params.set('start_date', filters.start_date);
  if (filters?.end_date) params.set('end_date', filters.end_date);

  const res = await api.get<ActivitySummary>(`/admin/activity/summary?${params.toString()}`);
  return res.data;
}

export async function getClientsActivity(filters?: ActivityFilters): Promise<ClientsActivityResponse> {
  const params = new URLSearchParams();
  if (filters?.start_date) params.set('start_date', filters.start_date);
  if (filters?.end_date) params.set('end_date', filters.end_date);

  const res = await api.get<ClientsActivityResponse>(`/admin/activity/clients?${params.toString()}`);
  return res.data;
}

export async function getPodcastersActivity(filters?: ActivityFilters): Promise<PodcastersActivityResponse> {
  const params = new URLSearchParams();
  if (filters?.start_date) params.set('start_date', filters.start_date);
  if (filters?.end_date) params.set('end_date', filters.end_date);

  const res = await api.get<PodcastersActivityResponse>(`/admin/activity/podcasters?${params.toString()}`);
  return res.data;
}

export function getExportClientsUrl(filters?: ActivityFilters): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';
  const params = new URLSearchParams();
  if (filters?.start_date) params.set('start_date', filters.start_date);
  if (filters?.end_date) params.set('end_date', filters.end_date);

  return `${baseUrl}/admin/activity/export/clients?${params.toString()}`;
}

export function getExportPodcastersUrl(filters?: ActivityFilters): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';
  const params = new URLSearchParams();
  if (filters?.start_date) params.set('start_date', filters.start_date);
  if (filters?.end_date) params.set('end_date', filters.end_date);

  return `${baseUrl}/admin/activity/export/podcasters?${params.toString()}`;
}

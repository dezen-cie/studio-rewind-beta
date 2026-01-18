// src/api/adminDashboard.ts
import api from './client';

export interface DashboardSummary {
  today_revenue_ttc: number;
  month_revenue_ttc: number;
  month_commissions_ttc: number;
  month_margin_ttc: number;
}

export interface DashboardReservationUser {
  id: string;
  email: string;
  firstname?: string | null;
  lastname?: string | null;
  company_name?: string | null;
}

export interface DashboardReservationPodcaster {
  id: string;
  name: string;
}

export interface DashboardReservation {
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
  User?: DashboardReservationUser;
  podcaster?: DashboardReservationPodcaster;
}

export interface OccupancyData {
  effective_start: number;
  effective_end: number;
  total_available_hours: number;
  booked_hours: number;
  blocked_hours: number;
  available_hours: number;
  occupancy_rate: number;
  is_full_day_blocked: boolean;
}

export async function getDashboardSummary(date?: string): Promise<DashboardSummary> {
  const params = date ? { date } : {};
  const res = await api.get<DashboardSummary>('/admin/dashboard', { params });
  return res.data;
}

export async function getDayReservations(date?: string): Promise<DashboardReservation[]> {
  const params = date ? { date } : {};
  const res = await api.get<DashboardReservation[]>('/admin/dashboard/day', { params });
  return res.data;
}

export async function getUpcomingReservations(date?: string): Promise<DashboardReservation[]> {
  const params = date ? { date } : {};
  const res = await api.get<DashboardReservation[]>('/admin/dashboard/upcoming', { params });
  return res.data;
}

export async function getDayOccupancy(date?: string): Promise<OccupancyData> {
  const params = date ? { date } : {};
  const res = await api.get<OccupancyData>('/admin/dashboard/occupancy', { params });
  return res.data;
}

export async function getMonthReservationDays(year: number, month: number): Promise<string[]> {
  const res = await api.get<string[]>('/admin/dashboard/month-days', {
    params: { year, month }
  });
  return res.data;
}

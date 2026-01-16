// src/api/revenue.ts
import api from './client';

export interface PodcasterRevenue {
  podcaster_id: string;
  podcaster_name: string;
  total_revenue_ht: number;
  commission_20: number;
  total_reservations: number;
  total_hours: number;
}

export interface MonthlyRevenue {
  year: number;
  month: number;
  podcasters: PodcasterRevenue[];
  totals: {
    total_revenue_ht: number;
    total_commission: number;
    total_reservations: number;
    total_hours: number;
  };
}

export interface AvailableMonth {
  year: number;
  month: number;
}

/**
 * Récupère le CA des podcasteurs pour un mois donné
 */
export async function getRevenueByMonth(year: number, month: number): Promise<MonthlyRevenue> {
  const res = await api.get<MonthlyRevenue>(`/admin/revenue/${year}/${month}`);
  return res.data;
}

/**
 * Récupère les mois disponibles
 */
export async function getAvailableMonths(): Promise<AvailableMonth[]> {
  const res = await api.get<AvailableMonth[]>('/admin/revenue/months');
  return res.data;
}

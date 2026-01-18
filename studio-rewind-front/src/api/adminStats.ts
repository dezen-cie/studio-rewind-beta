// src/api/adminStats.ts
import api from './client';

export interface StatsOverview {
  total_revenue_ttc: number;
  reservations_revenue_ttc: number;
  subscriptions_revenue_ttc: number;
  total_reservations: number;
  total_hours: number;
  occupancy_rate: number;
}

export interface RevenueEvolutionItem {
  period: string;
  revenue: number;
  count: number;
}

export interface TopClient {
  user_id: string;
  display_name: string;
  email: string;
  account_type: string;
  total_revenue: number;
  reservations_count: number;
  total_hours: number;
}

export interface FormulaStats {
  formula_key: string;
  formula_name: string;
  total_revenue: number;
  reservations_count: number;
  total_hours: number;
}

export interface PodcasterStats {
  podcaster_id: string;
  podcaster_name: string;
  podcaster_photo: string | null;
  sessions_count: number;
  total_hours: number;
  total_revenue: number;
}

export interface PeriodComparison {
  current: StatsOverview;
  previous: StatsOverview;
  changes: {
    revenue: number;
    reservations: number;
    hours: number;
    occupancy: number;
  };
}

/**
 * Récupère les statistiques globales pour une période
 */
export async function getStatsOverview(startDate: string, endDate: string): Promise<StatsOverview> {
  const res = await api.get<StatsOverview>('/admin/stats/overview', {
    params: { start_date: startDate, end_date: endDate }
  });
  return res.data;
}

/**
 * Récupère l'évolution du CA par période
 */
export async function getRevenueEvolution(
  startDate: string,
  endDate: string,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<RevenueEvolutionItem[]> {
  const res = await api.get<RevenueEvolutionItem[]>('/admin/stats/evolution', {
    params: { start_date: startDate, end_date: endDate, group_by: groupBy }
  });
  return res.data;
}

/**
 * Récupère les top clients par CA
 */
export async function getTopClients(
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<TopClient[]> {
  const res = await api.get<TopClient[]>('/admin/stats/top-clients', {
    params: { start_date: startDate, end_date: endDate, limit }
  });
  return res.data;
}

/**
 * Récupère le CA par formule
 */
export async function getRevenueByFormula(startDate: string, endDate: string): Promise<FormulaStats[]> {
  const res = await api.get<FormulaStats[]>('/admin/stats/by-formula', {
    params: { start_date: startDate, end_date: endDate }
  });
  return res.data;
}

/**
 * Récupère les sessions par podcasteur
 */
export async function getSessionsByPodcaster(startDate: string, endDate: string): Promise<PodcasterStats[]> {
  const res = await api.get<PodcasterStats[]>('/admin/stats/by-podcaster', {
    params: { start_date: startDate, end_date: endDate }
  });
  return res.data;
}

/**
 * Compare deux périodes
 */
export async function comparePeriods(
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string
): Promise<PeriodComparison> {
  const res = await api.get<PeriodComparison>('/admin/stats/compare', {
    params: {
      current_start: currentStart,
      current_end: currentEnd,
      previous_start: previousStart,
      previous_end: previousEnd
    }
  });
  return res.data;
}

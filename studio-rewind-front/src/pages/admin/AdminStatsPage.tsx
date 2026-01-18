import { useEffect, useState, useMemo } from 'react';
import { Calendar, TrendingUp, Users, Mic, BarChart3, DollarSign, Clock, ChevronDown } from 'lucide-react';
import {
  getStatsOverview,
  getRevenueEvolution,
  getTopClients,
  getRevenueByFormula,
  getSessionsByPodcaster,
  comparePeriods,
  type StatsOverview,
  type RevenueEvolutionItem,
  type TopClient,
  type FormulaStats,
  type PodcasterStats,
  type PeriodComparison
} from '../../api/adminStats';
import './AdminStatsPage.css';

type PeriodPreset = '7d' | '30d' | '90d' | '12m' | 'mtd' | 'custom';
type GroupBy = 'day' | 'week' | 'month';

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateRange(preset: PeriodPreset): { start: string; end: string; previousStart: string; previousEnd: string } {
  const now = new Date();
  const end = toDateKey(now);

  let start: Date;
  let previousStart: Date;
  let previousEnd: Date;

  switch (preset) {
    case '7d':
      start = new Date(now);
      start.setDate(now.getDate() - 6);
      previousEnd = new Date(start);
      previousEnd.setDate(start.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousEnd.getDate() - 6);
      break;
    case '30d':
      start = new Date(now);
      start.setDate(now.getDate() - 29);
      previousEnd = new Date(start);
      previousEnd.setDate(start.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousEnd.getDate() - 29);
      break;
    case '90d':
      start = new Date(now);
      start.setDate(now.getDate() - 89);
      previousEnd = new Date(start);
      previousEnd.setDate(start.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousEnd.getDate() - 89);
      break;
    case '12m':
      start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      start.setDate(start.getDate() + 1);
      previousEnd = new Date(start);
      previousEnd.setDate(start.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setFullYear(previousEnd.getFullYear() - 1);
      previousStart.setDate(previousStart.getDate() + 1);
      break;
    case 'mtd':
      // Début du mois jusqu'à aujourd'hui
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      // Période précédente = même période du mois précédent
      const dayOfMonth = now.getDate();
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth() - 1, dayOfMonth);
      break;
    default:
      start = new Date(now);
      start.setDate(now.getDate() - 29);
      previousEnd = new Date(start);
      previousEnd.setDate(start.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousEnd.getDate() - 29);
  }

  return {
    start: toDateKey(start),
    end,
    previousStart: toDateKey(previousStart),
    previousEnd: toDateKey(previousEnd)
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value}%`;
}

function AdminStatsPage() {
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('30d');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [evolution, setEvolution] = useState<RevenueEvolutionItem[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [byFormula, setByFormula] = useState<FormulaStats[]>([]);
  const [byPodcaster, setByPodcaster] = useState<PodcasterStats[]>([]);
  const [comparison, setComparison] = useState<PeriodComparison | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateRange = useMemo(() => getDateRange(periodPreset), [periodPreset]);

  // Auto-adjust groupBy based on period
  useEffect(() => {
    switch (periodPreset) {
      case '7d':
        setGroupBy('day');
        break;
      case '30d':
        setGroupBy('day');
        break;
      case '90d':
        setGroupBy('week');
        break;
      case '12m':
        setGroupBy('month');
        break;
      case 'mtd':
        setGroupBy('day');
        break;
    }
  }, [periodPreset]);

  // Load data
  useEffect(() => {
    async function load() {
      try {
        setError(null);
        setLoading(true);

        const [overviewData, evolutionData, clientsData, formulaData, podcasterData, comparisonData] = await Promise.all([
          getStatsOverview(dateRange.start, dateRange.end),
          getRevenueEvolution(dateRange.start, dateRange.end, groupBy),
          getTopClients(dateRange.start, dateRange.end, 5),
          getRevenueByFormula(dateRange.start, dateRange.end),
          getSessionsByPodcaster(dateRange.start, dateRange.end),
          comparePeriods(dateRange.start, dateRange.end, dateRange.previousStart, dateRange.previousEnd)
        ]);

        setOverview(overviewData);
        setEvolution(evolutionData);
        setTopClients(clientsData);
        setByFormula(formulaData);
        setByPodcaster(podcasterData);
        setComparison(comparisonData);
      } catch (err: any) {
        console.error('Erreur AdminStats:', err);
        setError(err?.response?.data?.message || 'Impossible de charger les statistiques.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [dateRange, groupBy]);

  const periodLabels: Record<PeriodPreset, string> = {
    '7d': '7 derniers jours',
    '30d': '30 derniers jours',
    '90d': '90 derniers jours',
    '12m': '12 derniers mois',
    'mtd': 'Début du mois',
    'custom': 'Personnalisé'
  };

  // Compute max revenue for chart scaling
  const maxRevenue = useMemo(() => {
    if (evolution.length === 0) return 100;
    return Math.max(...evolution.map(e => e.revenue), 1);
  }, [evolution]);

  // Format period label for x-axis
  const formatPeriodLabel = (period: string): string => {
    if (groupBy === 'week') {
      const [year, week] = period.split('-');
      return `S${week}`;
    }
    if (groupBy === 'month') {
      const [year, month] = period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('fr-FR', { month: 'short' });
    }
    // day
    const date = new Date(period);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="sr-admin-card stats-loading">
        <div className="spinner"></div>
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sr-admin-card stats-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="button is-primary is-small">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="admin-stats-page">
      {/* Period Selector */}
      <div className="stats-period-selector">
        <div className="stats-period-dropdown">
          <button
            className="stats-period-btn"
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
          >
            <Calendar size={18} />
            <span>{periodLabels[periodPreset]}</span>
            <ChevronDown size={16} />
          </button>
          {showPeriodDropdown && (
            <div className="stats-period-dropdown-menu">
              {(['mtd', '7d', '30d', '90d', '12m'] as PeriodPreset[]).map(preset => (
                <button
                  key={preset}
                  className={`stats-period-option ${periodPreset === preset ? 'active' : ''}`}
                  onClick={() => {
                    setPeriodPreset(preset);
                    setShowPeriodDropdown(false);
                  }}
                >
                  {periodLabels[preset]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="stats-period-info">
          Du {new Date(dateRange.start).toLocaleDateString('fr-FR')} au {new Date(dateRange.end).toLocaleDateString('fr-FR')}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-kpi-grid">
        <div className="sr-admin-card stats-kpi-card">
          <div className="stats-kpi-icon revenue">
            <DollarSign size={22} />
          </div>
          <div className="stats-kpi-content">
            <div className="stats-kpi-label">CA TTC</div>
            <div className="stats-kpi-value">{formatCurrency(overview?.total_revenue_ttc || 0)}</div>
            {comparison && (
              <div className={`stats-kpi-change ${comparison.changes.revenue >= 0 ? 'positive' : 'negative'}`}>
                {formatPercent(comparison.changes.revenue)} vs période précédente
              </div>
            )}
          </div>
        </div>

        <div className="sr-admin-card stats-kpi-card">
          <div className="stats-kpi-icon reservations">
            <Calendar size={22} />
          </div>
          <div className="stats-kpi-content">
            <div className="stats-kpi-label">Réservations</div>
            <div className="stats-kpi-value">{overview?.total_reservations || 0}</div>
            {comparison && (
              <div className={`stats-kpi-change ${comparison.changes.reservations >= 0 ? 'positive' : 'negative'}`}>
                {formatPercent(comparison.changes.reservations)} vs période précédente
              </div>
            )}
          </div>
        </div>

        <div className="sr-admin-card stats-kpi-card">
          <div className="stats-kpi-icon occupancy">
            <BarChart3 size={22} />
          </div>
          <div className="stats-kpi-content">
            <div className="stats-kpi-label">Taux de remplissage</div>
            <div className="stats-kpi-value">{overview?.occupancy_rate || 0}%</div>
            <div className="stats-kpi-bar">
              <div
                className="stats-kpi-bar-fill"
                style={{ width: `${Math.min(overview?.occupancy_rate || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="sr-admin-card stats-kpi-card">
          <div className="stats-kpi-icon hours">
            <Clock size={22} />
          </div>
          <div className="stats-kpi-content">
            <div className="stats-kpi-label">Heures réservées</div>
            <div className="stats-kpi-value">{overview?.total_hours || 0}h</div>
            {comparison && (
              <div className={`stats-kpi-change ${comparison.changes.hours >= 0 ? 'positive' : 'negative'}`}>
                {formatPercent(comparison.changes.hours)} vs période précédente
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Evolution Chart */}
      <div className="sr-admin-card stats-chart-card">
        <div className="stats-card-header">
          <h3><TrendingUp size={18} /> Evolution du CA</h3>
          <div className="stats-chart-groupby">
            <button
              className={groupBy === 'day' ? 'active' : ''}
              onClick={() => setGroupBy('day')}
            >
              Jour
            </button>
            <button
              className={groupBy === 'week' ? 'active' : ''}
              onClick={() => setGroupBy('week')}
            >
              Semaine
            </button>
            <button
              className={groupBy === 'month' ? 'active' : ''}
              onClick={() => setGroupBy('month')}
            >
              Mois
            </button>
          </div>
        </div>

        {evolution.length === 0 ? (
          <div className="stats-empty">
            <TrendingUp size={32} />
            <p>Aucune donnée pour cette période</p>
          </div>
        ) : (
          <div className="stats-chart">
            <div className="stats-chart-y-axis">
              <span>{formatCurrency(maxRevenue)}</span>
              <span>{formatCurrency(maxRevenue / 2)}</span>
              <span>0 €</span>
            </div>
            <div className="stats-chart-bars">
              {evolution.map((item, idx) => (
                <div key={idx} className="stats-chart-bar-container">
                  <div
                    className="stats-chart-bar"
                    style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
                    title={`${formatPeriodLabel(item.period)}: ${formatCurrency(item.revenue)} (${item.count} réservations)`}
                  >
                    <div className="stats-chart-bar-tooltip">
                      <strong>{formatCurrency(item.revenue)}</strong>
                      <span>{item.count} résa.</span>
                    </div>
                  </div>
                  <span className="stats-chart-label">{formatPeriodLabel(item.period)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Grid: Top Clients, Formulas, Podcasters */}
      <div className="stats-bottom-grid">
        {/* Top Clients */}
        <div className="sr-admin-card stats-list-card">
          <div className="stats-card-header">
            <h3><Users size={18} /> Top clients</h3>
          </div>
          {topClients.length === 0 ? (
            <div className="stats-empty-small">
              <p>Aucun client pour cette période</p>
            </div>
          ) : (
            <div className="stats-list">
              {topClients.map((client, idx) => (
                <div key={client.user_id} className="stats-list-item">
                  <div className="stats-list-rank">{idx + 1}</div>
                  <div className="stats-list-info">
                    <div className="stats-list-name">{client.display_name}</div>
                    <div className="stats-list-detail">
                      {client.reservations_count} résa. - {client.total_hours}h
                    </div>
                  </div>
                  <div className="stats-list-value">{formatCurrency(client.total_revenue)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue by Formula */}
        <div className="sr-admin-card stats-list-card">
          <div className="stats-card-header">
            <h3><BarChart3 size={18} /> CA par formule</h3>
          </div>
          {byFormula.length === 0 ? (
            <div className="stats-empty-small">
              <p>Aucune réservation pour cette période</p>
            </div>
          ) : (
            <div className="stats-list">
              {byFormula.map((formula, idx) => {
                const totalFormulas = byFormula.reduce((acc, f) => acc + f.total_revenue, 0);
                const percent = totalFormulas > 0 ? (formula.total_revenue / totalFormulas) * 100 : 0;
                return (
                  <div key={formula.formula_key} className="stats-list-item with-bar">
                    <div className="stats-list-info">
                      <div className="stats-list-name">{formula.formula_name}</div>
                      <div className="stats-list-detail">
                        {formula.reservations_count} résa. - {formula.total_hours}h
                      </div>
                    </div>
                    <div className="stats-list-bar-container">
                      <div
                        className="stats-list-bar"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="stats-list-value">{formatCurrency(formula.total_revenue)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sessions by Podcaster */}
        <div className="sr-admin-card stats-list-card">
          <div className="stats-card-header">
            <h3><Mic size={18} /> Sessions par podcasteur</h3>
          </div>
          {byPodcaster.length === 0 ? (
            <div className="stats-empty-small">
              <p>Aucune session pour cette période</p>
            </div>
          ) : (
            <div className="stats-list">
              {byPodcaster.map((podcaster) => (
                <div key={podcaster.podcaster_id} className="stats-list-item">
                  <div className="stats-list-avatar">
                    {podcaster.podcaster_photo ? (
                      <img src={podcaster.podcaster_photo} alt={podcaster.podcaster_name} />
                    ) : (
                      <Mic size={18} />
                    )}
                  </div>
                  <div className="stats-list-info">
                    <div className="stats-list-name">{podcaster.podcaster_name}</div>
                    <div className="stats-list-detail">
                      {podcaster.total_hours}h - {formatCurrency(podcaster.total_revenue)}
                    </div>
                  </div>
                  <div className="stats-list-value sessions">{podcaster.sessions_count} sessions</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminStatsPage;

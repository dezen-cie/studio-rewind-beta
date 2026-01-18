// src/pages/admin/AdminActivityPage.tsx
import { useEffect, useState } from 'react';
import { getStoredToken } from '../../api/client';
import {
  type ClientActivity,
  type PodcasterActivity,
  type ClientsTotals,
  type PodcastersTotals,
  type ActivitySummary,
  type ActivityFilters,
  getActivitySummary,
  getClientsActivity,
  getPodcastersActivity,
  getExportClientsUrl,
  getExportPodcastersUrl
} from '../../api/adminActivity';
import './AdminActivityPage.css';

type TabType = 'clients' | 'podcasters';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('fr-FR');
}

function formatCurrency(value: number): string {
  return value.toFixed(2) + ' €';
}

function AdminActivityPage() {
  const [activeTab, setActiveTab] = useState<TabType>('clients');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Donnees
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [clients, setClients] = useState<ClientActivity[]>([]);
  const [clientsTotals, setClientsTotals] = useState<ClientsTotals | null>(null);
  const [podcasters, setPodcasters] = useState<PodcasterActivity[]>([]);
  const [podcastersTotals, setPodcastersTotals] = useState<PodcastersTotals | null>(null);

  const filters: ActivityFilters = {
    start_date: startDate || undefined,
    end_date: endDate || undefined
  };

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, clientsData, podcastersData] = await Promise.all([
        getActivitySummary(filters),
        getClientsActivity(filters),
        getPodcastersActivity(filters)
      ]);

      setSummary(summaryData);
      setClients(clientsData.clients);
      setClientsTotals(clientsData.totals);
      setPodcasters(podcastersData.podcasters);
      setPodcastersTotals(podcastersData.totals);
    } catch (err: any) {
      console.error('Erreur chargement activite:', err);
      setError(err?.response?.data?.message || 'Erreur lors du chargement des donnees.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleFilter() {
    loadData();
  }

  function handleReset() {
    setStartDate('');
    setEndDate('');
    // Recharger sans filtres
    setTimeout(() => loadData(), 0);
  }

  function handleExport() {
    const token = getStoredToken();
    const url = activeTab === 'clients'
      ? getExportClientsUrl(filters)
      : getExportPodcastersUrl(filters);

    // Ouvrir dans un nouvel onglet avec le token
    window.open(`${url}&token=${token}`, '_blank');
  }

  return (
    <div className="sr-page">
      <div className="sr-page-header">
        <div>
          <h2 className="sr-page-title">Suivi d'activité</h2>
          <p className="sr-page-subtitle">
            Récapitulatif comptable des clients et podcasteurs avec export CSV.
          </p>
        </div>
      </div>

      {error && <p className="sr-page-error">{error}</p>}

      {/* Resume global */}
      {summary && (
        <div className="activity-summary-cards">
          <div className="activity-card">
            <div className="activity-card-label">CA TTC</div>
            <div className="activity-card-value">{formatCurrency(summary.revenue.total_ttc)}</div>
            <div className="activity-card-sub">HT: {formatCurrency(summary.revenue.total_ht)}</div>
          </div>
          <div className="activity-card">
            <div className="activity-card-label">Heures totales</div>
            <div className="activity-card-value">{summary.hours.total} h</div>
            <div className="activity-card-sub">{summary.clients.total_reservations} réservations</div>
          </div>
          <div className="activity-card">
            <div className="activity-card-label">Clients</div>
            <div className="activity-card-value">{summary.clients.total}</div>
            <div className="activity-card-sub">{summary.clients.new_clients} nouveaux</div>
          </div>
          <div className="activity-card">
            <div className="activity-card-label">Commissions</div>
            <div className="activity-card-value">{formatCurrency(summary.commissions.total_ttc)}</div>
            <div className="activity-card-sub">HT: {formatCurrency(summary.commissions.total_ht)}</div>
          </div>
          <div className="activity-card activity-card-highlight">
            <div className="activity-card-label">Marge Studio</div>
            <div className="activity-card-value">{formatCurrency(summary.revenue.total_ttc - summary.commissions.total_ttc)}</div>
            <div className="activity-card-sub">HT: {formatCurrency(summary.revenue.total_ht - summary.commissions.total_ht)}</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="sr-card activity-filters">
        <div className="activity-filters-row">
          <div className="activity-filter-group">
            <label>Du</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="activity-filter-group">
            <label>Au</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button className="button is-primary" onClick={handleFilter} disabled={loading}>
            {loading ? 'Chargement...' : 'Filtrer'}
          </button>
          <button className="button" onClick={handleReset} disabled={loading}>
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Tabs + Export */}
      <div className="sr-card">
        <div className="activity-tabs-header">
          <div className="activity-tabs">
            <button
              className={`activity-tab ${activeTab === 'clients' ? 'active' : ''}`}
              onClick={() => setActiveTab('clients')}
            >
              Clients
            </button>
            <button
              className={`activity-tab ${activeTab === 'podcasters' ? 'active' : ''}`}
              onClick={() => setActiveTab('podcasters')}
            >
              Podcasteurs
            </button>
          </div>
          <button className="button is-info is-small" onClick={handleExport}>
            Exporter CSV
          </button>
        </div>

        {loading && <p style={{ padding: '1rem' }}>Chargement...</p>}

        {/* Tab Clients */}
        {!loading && activeTab === 'clients' && (
          <div className="activity-table-wrapper">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>N° TVA</th>
                  <th className="text-right">Nb Résa</th>
                  <th className="text-right">Heures</th>
                  <th className="text-right">CA HT</th>
                  <th className="text-right">TVA</th>
                  <th className="text-right">CA TTC</th>
                  <th className="text-right">Réductions</th>
                  <th className="text-right">Promos</th>
                  <th>Type Promo</th>
                  <th>Code Promo</th>
                  <th>1ère Résa</th>
                  <th>Dernière Résa</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={15} className="text-center">Aucun client trouvé pour cette période.</td>
                  </tr>
                )}
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td className="client-name">{c.name}</td>
                    <td>{c.email}</td>
                    <td>
                      <span className={`type-badge ${c.account_type || ''}`}>
                        {c.account_type === 'professionnel' ? 'Pro' : 'Part.'}
                      </span>
                    </td>
                    <td>{c.vat_number || '-'}</td>
                    <td className="text-right">{c.total_reservations}</td>
                    <td className="text-right">{c.total_hours}</td>
                    <td className="text-right">{formatCurrency(c.total_ht)}</td>
                    <td className="text-right">{formatCurrency(c.total_tva)}</td>
                    <td className="text-right font-bold">{formatCurrency(c.total_ttc)}</td>
                    <td className="text-right discount">{c.total_discount > 0 ? `-${formatCurrency(c.total_discount)}` : '-'}</td>
                    <td className="text-right">{c.promos_used || '-'}</td>
                    <td>{c.promo_type || '-'}</td>
                    <td>{c.promo_codes?.length > 0 ? c.promo_codes.join(', ') : '-'}</td>
                    <td>{formatDate(c.first_reservation)}</td>
                    <td>{formatDate(c.last_reservation)}</td>
                  </tr>
                ))}
              </tbody>
              {clientsTotals && clients.length > 0 && (
                <tfoot>
                  <tr className="totals-row">
                    <td colSpan={4}><strong>TOTAL</strong></td>
                    <td className="text-right"><strong>{clientsTotals.total_reservations}</strong></td>
                    <td className="text-right"><strong>{clientsTotals.total_hours} h</strong></td>
                    <td className="text-right"><strong>{formatCurrency(clientsTotals.total_ht)}</strong></td>
                    <td className="text-right"><strong>{formatCurrency(clientsTotals.total_tva)}</strong></td>
                    <td className="text-right"><strong>{formatCurrency(clientsTotals.total_ttc)}</strong></td>
                    <td className="text-right discount"><strong>{clientsTotals.total_discount > 0 ? `-${formatCurrency(clientsTotals.total_discount)}` : '-'}</strong></td>
                    <td className="text-right"><strong>{clientsTotals.total_promos}</strong></td>
                    <td></td>
                    <td></td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Tab Podcasteurs */}
        {!loading && activeTab === 'podcasters' && (
          <div className="activity-table-wrapper">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Podcasteur</th>
                  <th className="text-right">Nb Sessions</th>
                  <th className="text-right">Heures</th>
                  <th className="text-right">CA HT généré</th>
                  <th className="text-right">CA TTC généré</th>
                  <th className="text-right">Taux</th>
                  <th className="text-right">Commission HT</th>
                  <th className="text-right">Commission TVA</th>
                  <th className="text-right">Commission TTC</th>
                  <th>1ère Session</th>
                  <th>Dernière Session</th>
                </tr>
              </thead>
              <tbody>
                {podcasters.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center">Aucun podcasteur trouvé pour cette période.</td>
                  </tr>
                )}
                {podcasters.map((p) => (
                  <tr key={p.id}>
                    <td className="client-name">{p.name}</td>
                    <td className="text-right">{p.total_sessions}</td>
                    <td className="text-right">{p.total_hours}</td>
                    <td className="text-right">{formatCurrency(p.total_revenue_ht)}</td>
                    <td className="text-right">{formatCurrency(p.total_revenue_ttc)}</td>
                    <td className="text-right">{p.is_billable ? `${p.commission_rate}%` : '-'}</td>
                    <td className="text-right">{p.is_billable ? formatCurrency(p.commission_ht) : '-'}</td>
                    <td className="text-right">{p.is_billable ? formatCurrency(p.commission_tva) : '-'}</td>
                    <td className="text-right font-bold commission">{p.is_billable ? formatCurrency(p.commission_ttc) : '-'}</td>
                    <td>{formatDate(p.first_session)}</td>
                    <td>{formatDate(p.last_session)}</td>
                  </tr>
                ))}
              </tbody>
              {podcastersTotals && podcasters.length > 0 && (
                <tfoot>
                  <tr className="totals-row">
                    <td><strong>TOTAL</strong></td>
                    <td className="text-right"><strong>{podcastersTotals.total_sessions}</strong></td>
                    <td className="text-right"><strong>{podcastersTotals.total_hours} h</strong></td>
                    <td className="text-right"><strong>{formatCurrency(podcastersTotals.total_revenue_ht)}</strong></td>
                    <td className="text-right"><strong>{formatCurrency(podcastersTotals.total_revenue_ttc)}</strong></td>
                    <td></td>
                    <td className="text-right"><strong>{formatCurrency(podcastersTotals.total_commission_ht)}</strong></td>
                    <td className="text-right"><strong>{formatCurrency(podcastersTotals.total_commission_tva)}</strong></td>
                    <td className="text-right commission"><strong>{formatCurrency(podcastersTotals.total_commission_ttc)}</strong></td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminActivityPage;

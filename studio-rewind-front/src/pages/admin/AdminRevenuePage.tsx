// src/pages/admin/AdminRevenuePage.tsx
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, Users, Clock, Euro } from 'lucide-react';
import {
  getRevenueByMonth,
  type MonthlyRevenue
} from '../../api/revenue';
import './AdminRevenuePage.css';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

function AdminRevenuePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenue, setRevenue] = useState<MonthlyRevenue | null>(null);

  // Mois courant par défaut
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);

  // Charger les données au démarrage et quand le mois change
  useEffect(() => {
    loadRevenue(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  async function loadRevenue(year: number, month: number) {
    try {
      setLoading(true);
      setError(null);
      const data = await getRevenueByMonth(year, month);
      setRevenue(data);
    } catch (err: any) {
      console.error('Erreur chargement CA:', err);
      setError('Impossible de charger les données de CA.');
    } finally {
      setLoading(false);
    }
  }

  function goToPreviousMonth() {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  function goToNextMonth() {
    const now = new Date();
    const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1;
    if (isCurrentMonth) return; // Ne pas aller au-delà du mois courant

    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  // Vérifier si on peut aller au mois suivant
  const now2 = new Date();
  const canGoNext = !(currentYear === now2.getFullYear() && currentMonth === now2.getMonth() + 1);

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  return (
    <div className="sr-page">
      <div className="sr-page-header">
        <div>
          <h2 className="sr-page-title">Commissions</h2>
          <p className="sr-page-subtitle">
            Suivi mensuel des commissions par podcasteur
          </p>
        </div>
      </div>

      {error && <p className="sr-page-error">{error}</p>}

      <div className="sr-page-body">
        {/* Navigation des mois */}
        <div className="revenue-month-nav">
          <button
            className="revenue-nav-btn"
            onClick={goToPreviousMonth}
            disabled={loading}
            title="Mois précédent"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="revenue-month-label">
            <span className="revenue-month-name">
              {MONTH_NAMES[currentMonth - 1]}
            </span>
            <span className="revenue-month-year">{currentYear}</span>
          </div>
          <button
            className="revenue-nav-btn"
            onClick={goToNextMonth}
            disabled={!canGoNext || loading}
            title="Mois suivant"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {loading ? (
          <div className="revenue-loading">Chargement...</div>
        ) : (
          <>
            {/* Cards récapitulatives */}
            <div className="revenue-summary-cards">
              <div className="revenue-card">
                <div className="revenue-card-icon">
                  <Euro size={24} />
                </div>
                <div className="revenue-card-content">
                  <span className="revenue-card-value">
                    {formatCurrency(revenue?.totals.total_revenue ?? 0)}
                  </span>
                  <span className="revenue-card-label">CA Total</span>
                </div>
              </div>
              <div className="revenue-card revenue-card--commission">
                <div className="revenue-card-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="revenue-card-content">
                  <span className="revenue-card-value">
                    {formatCurrency(revenue?.totals.total_commission ?? 0)}
                  </span>
                  <span className="revenue-card-label">Commission 20%</span>
                </div>
              </div>
              <div className="revenue-card">
                <div className="revenue-card-icon">
                  <Users size={24} />
                </div>
                <div className="revenue-card-content">
                  <span className="revenue-card-value">
                    {revenue?.totals.total_reservations ?? 0}
                  </span>
                  <span className="revenue-card-label">Réservations</span>
                </div>
              </div>
              <div className="revenue-card">
                <div className="revenue-card-icon">
                  <Clock size={24} />
                </div>
                <div className="revenue-card-content">
                  <span className="revenue-card-value">
                    {revenue?.totals.total_hours ?? 0}h
                  </span>
                  <span className="revenue-card-label">Heures totales</span>
                </div>
              </div>
            </div>

            {/* Tableau par podcasteur */}
            <div className="sr-card">
              <h3 className="revenue-table-title">Détail par podcasteur</h3>
              {!revenue?.podcasters || revenue.podcasters.length === 0 ? (
                <p className="revenue-no-data">Aucun podcasteur actif.</p>
              ) : (
                <div className="revenue-table-container">
                  <table className="revenue-table">
                    <thead>
                      <tr>
                        <th>Podcasteur</th>
                        <th className="text-right">Réservations</th>
                        <th className="text-right">Heures</th>
                        <th className="text-right">CA</th>
                        <th className="text-right">Commission 20%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenue.podcasters.map((p) => (
                        <tr key={p.podcaster_id} className={p.total_revenue > 0 ? '' : 'revenue-row-empty'}>
                          <td className="revenue-podcaster-name">{p.podcaster_name}</td>
                          <td className="text-right">{p.total_reservations}</td>
                          <td className="text-right">{p.total_hours}h</td>
                          <td className="text-right revenue-amount">
                            {formatCurrency(p.total_revenue)}
                          </td>
                          <td className="text-right revenue-commission">
                            {formatCurrency(p.commission_20)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="revenue-totals-row">
                        <td><strong>Total</strong></td>
                        <td className="text-right"><strong>{revenue.totals.total_reservations}</strong></td>
                        <td className="text-right"><strong>{revenue.totals.total_hours}h</strong></td>
                        <td className="text-right revenue-amount">
                          <strong>{formatCurrency(revenue.totals.total_revenue)}</strong>
                        </td>
                        <td className="text-right revenue-commission">
                          <strong>{formatCurrency(revenue.totals.total_commission)}</strong>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminRevenuePage;

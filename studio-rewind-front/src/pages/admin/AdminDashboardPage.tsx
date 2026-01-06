import { useEffect, useState } from 'react';
import { Clock, Calendar, Users, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getDashboardSummary,
  getDayReservations,
  getUpcomingReservations,
  getDayOccupancy,
  type DashboardReservation,
  type OccupancyData
} from '../../api/adminDashboard';
import './AdminDashboardPage.css';

// Heures d'ouverture du studio (9h - 18h)
const STUDIO_START = 9;
const STUDIO_END = 18;
const STUDIO_HOURS = STUDIO_END - STUDIO_START;

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function AdminDashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [summary, setSummary] = useState<{
    today_revenue_ttc: number;
    month_revenue_ttc: number;
  } | null>(null);

  const [dayReservations, setDayReservations] = useState<DashboardReservation[]>([]);
  const [upcomingReservations, setUpcomingReservations] = useState<DashboardReservation[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancyData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isToday = isSameDay(selectedDate, new Date());
  const dateKey = toDateKey(selectedDate);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        setLoading(true);
        const [summaryData, dayData, upcomingData, occupancyData] = await Promise.all([
          getDashboardSummary(dateKey),
          getDayReservations(dateKey),
          getUpcomingReservations(dateKey),
          getDayOccupancy(dateKey)
        ]);

        setSummary(summaryData);
        setDayReservations(dayData);
        setUpcomingReservations(upcomingData);
        setOccupancy(occupancyData);
      } catch (err: any) {
        console.error('Erreur AdminDashboard:', err);
        const message =
          err?.response?.data?.message ||
          'Impossible de charger le dashboard admin.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [dateKey]);

  function goToPreviousDay() {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  }

  function goToNextDay() {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  }

  function goToToday() {
    setSelectedDate(new Date());
  }

  function handleDateInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (value) {
      setSelectedDate(new Date(value));
    }
    setShowDatePicker(false);
  }

  function formatCurrency(value: number) {
    return `${value.toFixed(2)} €`;
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getClientName(r: DashboardReservation) {
    if (r.User) {
      if (r.User.company_name) return r.User.company_name;
      if (r.User.firstname || r.User.lastname) {
        return `${r.User.firstname || ''} ${r.User.lastname || ''}`.trim();
      }
      return r.User.email;
    }
    return 'Client inconnu';
  }

  function getFormulaLabel(formula: DashboardReservation['formula']) {
    switch (formula) {
      case 'autonome':
        return 'Autonome';
      case 'amelioree':
        return 'Améliorée';
      case 'abonnement':
        return 'Abonnement';
      case 'reseaux':
        return 'Réseaux';
      default:
        return formula;
    }
  }

  function getFormulaColor(formula: DashboardReservation['formula']) {
    switch (formula) {
      case 'autonome':
        return '#3b82f6';
      case 'amelioree':
        return '#8b5cf6';
      case 'abonnement':
        return '#10b981';
      case 'reseaux':
        return '#f97316';
      default:
        return '#6b7280';
    }
  }

  // Calcul de la position et largeur pour la timeline
  function getTimelinePosition(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    const left = ((Math.max(startHour, STUDIO_START) - STUDIO_START) / STUDIO_HOURS) * 100;
    const width = ((Math.min(endHour, STUDIO_END) - Math.max(startHour, STUDIO_START)) / STUDIO_HOURS) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  }

  // Générer les marqueurs d'heures
  const hourMarkers = [];
  for (let h = STUDIO_START; h <= STUDIO_END; h++) {
    hourMarkers.push(h);
  }

  // Heure actuelle pour l'indicateur
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const currentTimePosition =
    currentHour >= STUDIO_START && currentHour <= STUDIO_END
      ? ((currentHour - STUDIO_START) / STUDIO_HOURS) * 100
      : null;

  // Formater le nom du mois pour l'affichage
  const monthLabel = selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="sr-page">
      <div className="sr-page-header">
        <div>
          <h2 className="sr-page-title">Dashboard</h2>
          <p className="sr-page-subtitle">
            Vue d'ensemble de l'activité du studio.
          </p>
        </div>
      </div>

      {error && <p className="sr-page-error">{error}</p>}

      <div className="sr-page-body">
        {loading && <p>Chargement du dashboard...</p>}

        {!loading && (
          <>
            {/* SÉLECTEUR DE DATE */}
            <div className="dashboard-date-selector">
              <button
                type="button"
                className="date-nav-btn"
                onClick={goToPreviousDay}
                title="Jour précédent"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="date-display">
                <button
                  type="button"
                  className="date-display-btn"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <Calendar size={18} />
                  <span className="date-display-text">
                    {isToday ? "Aujourd'hui" : selectedDate.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </button>

                {showDatePicker && (
                  <div className="date-picker-dropdown">
                    <input
                      type="date"
                      value={dateKey}
                      onChange={handleDateInputChange}
                      className="date-picker-input"
                    />
                  </div>
                )}

                {!isToday && (
                  <button
                    type="button"
                    className="today-btn"
                    onClick={goToToday}
                  >
                    Retour à aujourd'hui
                  </button>
                )}
              </div>

              <button
                type="button"
                className="date-nav-btn"
                onClick={goToNextDay}
                title="Jour suivant"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* STATS CARDS */}
            <div className="sr-stats-grid">
              <div className="sr-stats-card">
                <div className="sr-stats-icon">
                  <TrendingUp size={20} />
                </div>
                <div className="sr-stats-content">
                  <div className="sr-stats-label">CA du jour (TTC)</div>
                  <div className="sr-stats-value">
                    {formatCurrency(summary?.today_revenue_ttc || 0)}
                  </div>
                </div>
              </div>

              <div className="sr-stats-card">
                <div className="sr-stats-icon">
                  <Calendar size={20} />
                </div>
                <div className="sr-stats-content">
                  <div className="sr-stats-label">CA {monthLabel} (TTC)</div>
                  <div className="sr-stats-value">
                    {formatCurrency(summary?.month_revenue_ttc || 0)}
                  </div>
                </div>
              </div>

              <div className="sr-stats-card">
                <div className="sr-stats-icon">
                  <Users size={20} />
                </div>
                <div className="sr-stats-content">
                  <div className="sr-stats-label">Réservations ce jour</div>
                  <div className="sr-stats-value">{dayReservations.length}</div>
                </div>
              </div>

              <div className="sr-stats-card occupancy-card">
                <div className="sr-stats-icon">
                  <Clock size={20} />
                </div>
                <div className="sr-stats-content">
                  <div className="sr-stats-label">Taux d'occupation</div>
                  <div className="sr-stats-value">{occupancy?.occupancy_rate || 0}%</div>
                  <div className="occupancy-bar">
                    <div
                      className="occupancy-fill"
                      style={{ width: `${occupancy?.occupancy_rate || 0}%` }}
                    />
                  </div>
                  <div className="occupancy-details">
                    <span>{occupancy?.booked_hours || 0}h réservées</span>
                    <span>{occupancy?.available_hours || 0}h disponibles</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TIMELINE DU JOUR */}
            <section className="sr-section">
              <div className="sr-section-header">
                <div>
                  <h3 className="sr-section-title">
                    {isToday ? "Aujourd'hui" : selectedDate.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </h3>
                  <p className="sr-section-subtitle">
                    Timeline des réservations
                  </p>
                </div>
              </div>

              <div className="sr-card timeline-card">
                {dayReservations.length === 0 ? (
                  <div className="timeline-empty">
                    <Calendar size={32} />
                    <p>Aucune réservation {isToday ? "aujourd'hui" : 'ce jour'}</p>
                  </div>
                ) : (
                  <>
                    {/* Timeline visuelle */}
                    <div className="timeline-container">
                      <div className="timeline-hours">
                        {hourMarkers.map((h) => (
                          <div key={h} className="timeline-hour-marker">
                            <span>{h}h</span>
                          </div>
                        ))}
                      </div>

                      {/* Ligne horizontale avec points */}
                      <div className="timeline-hours-line">
                        {hourMarkers.map((h, index) => (
                          <div
                            key={h}
                            className="timeline-dot"
                            style={{ left: `${(index / (hourMarkers.length - 1)) * 100}%` }}
                          />
                        ))}
                      </div>

                      <div className="timeline-track">
                        {/* Indicateur heure actuelle */}
                        {currentTimePosition !== null && (
                          <div
                            className="timeline-now"
                            style={{ left: `${currentTimePosition}%` }}
                          >
                            <div className="timeline-now-line" />
                            <div className="timeline-now-dot" />
                          </div>
                        )}

                        {/* Réservations */}
                        {dayReservations.map((r) => {
                          const pos = getTimelinePosition(r.start_date, r.end_date);
                          return (
                            <div
                              key={r.id}
                              className="timeline-block"
                              style={{
                                left: pos.left,
                                width: pos.width,
                                backgroundColor: getFormulaColor(r.formula)
                              }}
                              title={`${getClientName(r)} - ${formatTime(r.start_date)} à ${formatTime(r.end_date)}`}
                            >
                              <span className="timeline-block-label">
                                {getClientName(r)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Liste détaillée */}
                    <div className="timeline-list">
                      {dayReservations.map((r) => (
                        <div key={r.id} className="timeline-item">
                          <div
                            className="timeline-item-indicator"
                            style={{ backgroundColor: getFormulaColor(r.formula) }}
                          />
                          <div className="timeline-item-time">
                            {formatTime(r.start_date)} - {formatTime(r.end_date)}
                          </div>
                          <div className="timeline-item-client">{getClientName(r)}</div>
                          <div className="timeline-item-formula">
                            {getFormulaLabel(r.formula)}
                          </div>
                          <div className="timeline-item-duration">{r.total_hours}h</div>
                          <div
                            className={`timeline-item-status ${r.status}`}
                          >
                            {r.status === 'confirmed' ? 'Confirmé' : r.status === 'pending' ? 'En attente' : 'Annulé'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* PROCHAINES RÉSERVATIONS */}
            <section className="sr-section">
              <div className="sr-section-header">
                <div>
                  <h3 className="sr-section-title">Prochaines réservations</h3>
                  <p className="sr-section-subtitle">
                    Réservations à venir dans les prochaines 48h
                  </p>
                </div>
                <div className="sr-section-meta">
                  <span className="sr-chip">{upcomingReservations.length} à venir</span>
                </div>
              </div>

              <div className="sr-card">
                {upcomingReservations.length === 0 ? (
                  <div className="upcoming-empty">
                    <Clock size={32} />
                    <p>Aucune réservation dans les prochaines 48h</p>
                  </div>
                ) : (
                  <div className="upcoming-list">
                    {upcomingReservations.map((r) => (
                      <div key={r.id} className="upcoming-item">
                        <div
                          className="upcoming-item-indicator"
                          style={{ backgroundColor: getFormulaColor(r.formula) }}
                        />
                        <div className="upcoming-item-datetime">
                          {formatDateTime(r.start_date)}
                        </div>
                        <div className="upcoming-item-client">{getClientName(r)}</div>
                        <div className="upcoming-item-formula">
                          {getFormulaLabel(r.formula)}
                        </div>
                        <div className="upcoming-item-duration">{r.total_hours}h</div>
                        <div className="upcoming-item-price">
                          {formatCurrency(r.price_ttc)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;

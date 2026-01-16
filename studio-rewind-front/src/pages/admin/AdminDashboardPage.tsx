import { useEffect, useState, useMemo } from 'react';
import { Clock, Calendar, Users, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getDashboardSummary,
  getDayReservations,
  getUpcomingReservations,
  getDayOccupancy,
  getMonthReservationDays,
  type DashboardReservation,
  type OccupancyData
} from '../../api/adminDashboard';
import './AdminDashboardPage.css';

// Heures d'ouverture par défaut (utilisées si pas de données d'occupation)
const DEFAULT_STUDIO_START = 9;
const DEFAULT_STUDIO_END = 18;

interface CalendarDay {
  date: Date | null;
  key: string;
  isToday: boolean;
  isSelected: boolean;
  hasReservation: boolean;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildCalendarMatrix(
  year: number,
  month: number,
  selectedDateKey: string,
  reservationDays: Set<string>
): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startWeekDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  const today = new Date();
  const todayKey = toDateKey(today);
  const cells: CalendarDay[] = [];

  const offset = startWeekDay === 0 ? 6 : startWeekDay - 1;
  for (let i = 0; i < offset; i++) {
    cells.push({ date: null, key: `empty-${i}`, isToday: false, isSelected: false, hasReservation: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const key = toDateKey(date);
    cells.push({
      date,
      key,
      isToday: key === todayKey,
      isSelected: selectedDateKey === key,
      hasReservation: reservationDays.has(key)
    });
  }

  return cells;
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

  // États pour le calendrier
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [reservationDays, setReservationDays] = useState<Set<string>>(new Set());

  const isToday = isSameDay(selectedDate, new Date());
  const dateKey = toDateKey(selectedDate);

  // Construire la matrice du calendrier
  const calendarCells = useMemo(
    () => buildCalendarMatrix(calendarYear, calendarMonth, dateKey, reservationDays),
    [calendarYear, calendarMonth, dateKey, reservationDays]
  );

  const calendarMonthLabel = useMemo(() => {
    const d = new Date(calendarYear, calendarMonth, 1);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }, [calendarMonth, calendarYear]);

  // Charger les données du jour sélectionné
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

  // Charger les jours avec réservations pour le mois du calendrier (seulement si visible)
  useEffect(() => {
    if (!showCalendar) return;
    async function loadMonthDays() {
      try {
        const days = await getMonthReservationDays(calendarYear, calendarMonth + 1);
        setReservationDays(new Set(days));
      } catch (err) {
        console.error('Erreur chargement jours réservations:', err);
      }
    }
    loadMonthDays();
  }, [calendarYear, calendarMonth, showCalendar]);

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
    // Synchroniser le calendrier avec aujourd'hui
    const now = new Date();
    setCalendarMonth(now.getMonth());
    setCalendarYear(now.getFullYear());
  }

  function handleCalendarPrevMonth() {
    setCalendarMonth((prev) => {
      if (prev === 0) {
        setCalendarYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }

  function handleCalendarNextMonth() {
    setCalendarMonth((prev) => {
      if (prev === 11) {
        setCalendarYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }

  function handleCalendarDayClick(cell: CalendarDay) {
    if (!cell.date) return;
    setSelectedDate(cell.date);
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
      case 'solo':
        return 'Solo';
      case 'duo':
        return 'Duo';
      case 'pro':
        return 'Pro';
      default:
        return formula;
    }
  }

  function getFormulaColor(formula: DashboardReservation['formula']) {
    switch (formula) {
      case 'solo':
        return '#3b82f6'; // Bleu
      case 'duo':
        return '#8b5cf6'; // Violet
      case 'pro':
        return '#f97316'; // Orange
      default:
        return '#6b7280';
    }
  }

  // Heures effectives basées sur les données d'occupation (ou valeurs par défaut)
  const effectiveStart = occupancy?.effective_start ?? DEFAULT_STUDIO_START;
  const effectiveEnd = occupancy?.effective_end ?? DEFAULT_STUDIO_END;
  const effectiveHours = effectiveEnd - effectiveStart;

  // Calcul de la position et largeur pour la timeline
  function getTimelinePosition(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    const left = ((Math.max(startHour, effectiveStart) - effectiveStart) / effectiveHours) * 100;
    const width = ((Math.min(endHour, effectiveEnd) - Math.max(startHour, effectiveStart)) / effectiveHours) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  }

  // Générer les marqueurs d'heures dynamiquement
  const hourMarkers = [];
  for (let h = Math.floor(effectiveStart); h <= Math.ceil(effectiveEnd); h++) {
    hourMarkers.push(h);
  }

  // Heure actuelle pour l'indicateur
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const currentTimePosition =
    currentHour >= effectiveStart && currentHour <= effectiveEnd
      ? ((currentHour - effectiveStart) / effectiveHours) * 100
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
                  <div className="sr-stats-label">
                    Taux d'occupation
                    {occupancy && occupancy.total_available_hours > 9 && (
                      <span style={{ fontSize: '0.7rem', marginLeft: '4px', opacity: 0.7 }}>
                        ({occupancy.total_available_hours}h ouvertes)
                      </span>
                    )}
                  </div>
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

            {/* CHECKBOX CALENDRIER */}
            <label className="dashboard-calendar-toggle">
              <input
                type="checkbox"
                checked={showCalendar}
                onChange={(e) => setShowCalendar(e.target.checked)}
              />
              <span>Voir le calendrier</span>
            </label>

            {/* CALENDRIER */}
            {showCalendar && (
              <div className="dashboard-calendar">
                <div className="dashboard-calendar-header">
                  <button
                    type="button"
                    className="dashboard-calendar-arrow"
                    onClick={handleCalendarPrevMonth}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="dashboard-calendar-month">{calendarMonthLabel}</span>
                  <button
                    type="button"
                    className="dashboard-calendar-arrow"
                    onClick={handleCalendarNextMonth}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="dashboard-calendar-grid">
                  <div className="dashboard-calendar-weekday">L</div>
                  <div className="dashboard-calendar-weekday">M</div>
                  <div className="dashboard-calendar-weekday">M</div>
                  <div className="dashboard-calendar-weekday">J</div>
                  <div className="dashboard-calendar-weekday">V</div>
                  <div className="dashboard-calendar-weekday">S</div>
                  <div className="dashboard-calendar-weekday">D</div>

                  {calendarCells.map((cell) => (
                    <button
                      key={cell.key}
                      type="button"
                      className={[
                        'dashboard-calendar-day',
                        !cell.date ? 'dashboard-calendar-day--empty' : '',
                        cell.isToday ? 'dashboard-calendar-day--today' : '',
                        cell.isSelected ? 'dashboard-calendar-day--selected' : '',
                        cell.hasReservation ? 'dashboard-calendar-day--has-reservation' : ''
                      ].filter(Boolean).join(' ')}
                      onClick={() => handleCalendarDayClick(cell)}
                      disabled={!cell.date}
                    >
                      <span>{cell.date ? cell.date.getDate() : ''}</span>
                    </button>
                  ))}
                </div>

                <div className="dashboard-calendar-legend">
                  <span className="dashboard-calendar-legend-item">
                    <span className="dashboard-calendar-legend-dot dashboard-calendar-legend-dot--today" />
                    Aujourd'hui
                  </span>
                  <span className="dashboard-calendar-legend-item">
                    <span className="dashboard-calendar-legend-dot dashboard-calendar-legend-dot--selected" />
                    Sélectionné
                  </span>
                  <span className="dashboard-calendar-legend-item">
                    <span className="dashboard-calendar-legend-dot dashboard-calendar-legend-dot--reservation" />
                    Réservation
                  </span>
                </div>
              </div>
            )}

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
                          <div className="timeline-item-podcaster">
                            {r.podcaster?.name || '—'}
                          </div>
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

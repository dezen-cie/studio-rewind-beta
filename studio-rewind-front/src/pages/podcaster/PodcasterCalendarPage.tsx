import { useEffect, useMemo, useState } from 'react';
import {
  getPodcasterReservationsByDate,
  type PodcasterReservation
} from '../../api/podcasterDashboard';
import './PodcasterCalendarPage.css';

interface CalendarDay {
  date: Date | null;
  key: string;
  isToday: boolean;
  isSelected: boolean;
}

function getLocalDateKey(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildCalendarMatrix(
  year: number,
  month: number,
  selectedDateKey: string | null
): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startWeekDay = firstDayOfMonth.getDay(); // 0 = dimanche
  const daysInMonth = lastDayOfMonth.getDate();

  const today = new Date();
  const todayKey = getLocalDateKey(today);
  const cells: CalendarDay[] = [];

  // on commence le calendrier a Lundi
  const offset = startWeekDay === 0 ? 6 : startWeekDay - 1;
  for (let i = 0; i < offset; i++) {
    cells.push({
      date: null,
      key: `empty-${i}`,
      isToday: false,
      isSelected: false
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const key = getLocalDateKey(date);
    cells.push({
      date,
      key,
      isToday: key === todayKey,
      isSelected: selectedDateKey === key
    });
  }

  return cells;
}

function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getClientName(user: PodcasterReservation['User']): string {
  if (user.company_name) return user.company_name;
  if (user.firstname && user.lastname) return `${user.firstname} ${user.lastname}`;
  if (user.firstname) return user.firstname;
  return user.email;
}

function getFormulaLabel(formula: string): string {
  switch (formula) {
    case 'solo': return 'Formule Solo';
    case 'duo': return 'Formule Duo';
    case 'pro': return 'Formule Pro';
    default: return formula;
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case 'confirmed':
      return 'pc-status-confirmed';
    case 'pending':
      return 'pc-status-pending';
    case 'cancelled':
      return 'pc-status-cancelled';
    default:
      return '';
  }
}

function PodcasterCalendarPage() {
  const [reservations, setReservations] = useState<PodcasterReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return now.getMonth();
  });
  const [currentYear, setCurrentYear] = useState(() => {
    const now = new Date();
    return now.getFullYear();
  });

  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(() => {
    return getLocalDateKey(new Date());
  });

  // Calendrier
  const calendarCells = useMemo(
    () => buildCalendarMatrix(currentYear, currentMonth, selectedDateKey),
    [currentYear, currentMonth, selectedDateKey]
  );

  const monthLabel = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }, [currentMonth, currentYear]);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDateKey) return '';
    const [y, m, day] = selectedDateKey.split('-').map(Number);
    const d = new Date(y, (m || 1) - 1, day || 1);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, [selectedDateKey]);

  // Charger les reservations pour la date selectionnee
  useEffect(() => {
    async function loadReservations() {
      if (!selectedDateKey) {
        setReservations([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getPodcasterReservationsByDate(selectedDateKey);
        setReservations(data);
      } catch (err: any) {
        console.error('Erreur chargement reservations:', err);
        setError(err?.response?.data?.message || 'Erreur lors du chargement des reservations.');
        setReservations([]);
      } finally {
        setLoading(false);
      }
    }
    loadReservations();
  }, [selectedDateKey]);

  function handlePreviousMonth() {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }

  function handleNextMonth() {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }

  function handleDayClick(cell: CalendarDay) {
    if (!cell.date) return;
    const key = cell.key;
    setSelectedDateKey(key);
    // Si on change de mois, mettre a jour le calendrier
    if (cell.date.getMonth() !== currentMonth || cell.date.getFullYear() !== currentYear) {
      setCurrentMonth(cell.date.getMonth());
      setCurrentYear(cell.date.getFullYear());
    }
  }

  return (
    <div className="pc-dashboard">
      <div className="pc-dashboard-inner">
        <h2 className="pc-dashboard-title">Mon Calendrier</h2>
        <p className="pc-dashboard-subtitle">
          Consultez vos reservations jour par jour.
        </p>

        {error && <p className="pc-error">{error}</p>}

        <div className="pc-dashboard-content">
          {/* Calendrier + reservations du jour */}
          <section className="pc-calendar-card">
            <div className="pc-calendar-header">
              <div className="pc-calendar-header-left">
                <div className="pc-calendar-header-left-icon">📅</div>
                <span>Date des reservations</span>
              </div>
              <div className="pc-calendar-header-right">
                {selectedDateLabel || 'Selectionnez un jour'}
              </div>
            </div>

            <div className="pc-calendar-month-row">
              <button
                type="button"
                className="pc-calendar-arrow-btn"
                onClick={handlePreviousMonth}
              >
                ‹
              </button>
              <div className="pc-calendar-month-title">{monthLabel}</div>
              <button
                type="button"
                className="pc-calendar-arrow-btn"
                onClick={handleNextMonth}
              >
                ›
              </button>
            </div>

            <div className="pc-calendar-grid">
              <div className="pc-calendar-weekday">L</div>
              <div className="pc-calendar-weekday">M</div>
              <div className="pc-calendar-weekday">M</div>
              <div className="pc-calendar-weekday">J</div>
              <div className="pc-calendar-weekday">V</div>
              <div className="pc-calendar-weekday">S</div>
              <div className="pc-calendar-weekday">D</div>

              {calendarCells.map((cell) => (
                <button
                  key={cell.key}
                  type="button"
                  className={[
                    'pc-calendar-day',
                    !cell.date ? 'pc-calendar-day--empty' : '',
                    cell.isToday ? 'pc-calendar-day--today' : '',
                    cell.isSelected ? 'pc-calendar-day--selected' : ''
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleDayClick(cell)}
                  disabled={!cell.date}
                >
                  <span>{cell.date ? cell.date.getDate() : ''}</span>
                </button>
              ))}
            </div>

            <div className="pc-calendar-legend">
              <span className="pc-calendar-legend-item">
                <span className="pc-calendar-legend-dot pc-calendar-legend-dot--today" />
                Aujourd'hui
              </span>
              <span className="pc-calendar-legend-item">
                <span className="pc-calendar-legend-dot pc-calendar-legend-dot--selected" />
                Jour selectionne
              </span>
            </div>

            {selectedDateKey && (
              <div className="pc-selected-day">
                <h4 className="pc-selected-day-title">
                  Reservations du {selectedDateLabel}
                </h4>

                {loading && <p>Chargement des reservations...</p>}

                {!loading && reservations.length === 0 && (
                  <p className="pc-empty-message">Aucune reservation pour ce jour.</p>
                )}

                {!loading && reservations.length > 0 && (
                  <ul className="pc-reservation-list">
                    {reservations.map((r) => (
                      <li key={r.id} className="pc-reservation-card">
                        <div className="pc-reservation-header">
                          <span className="pc-reservation-formula">
                            {getFormulaLabel(r.formula)}
                          </span>
                          <span className={`pc-reservation-status ${getStatusClass(r.status)}`}>
                            {r.status === 'confirmed' ? 'Confirmee' : r.status === 'pending' ? 'En attente' : r.status}
                          </span>
                        </div>
                        <p className="pc-reservation-time">
                          {formatTime(r.start_date)} - {formatTime(r.end_date)} ({r.total_hours}h)
                        </p>
                        <div className="pc-reservation-client">
                          <p className="pc-reservation-client-name">
                            {getClientName(r.User)}
                          </p>
                          <p className="pc-reservation-client-email">
                            {r.User.email}
                          </p>
                          {r.User.phone && (
                            <p className="pc-reservation-client-phone">
                              Tel: {r.User.phone}
                            </p>
                          )}
                        </div>
                        <p className="pc-reservation-price">
                          {r.price_ttc.toFixed(2)} EUR TTC
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default PodcasterCalendarPage;

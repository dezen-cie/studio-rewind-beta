import { useEffect, useMemo, useState } from 'react';
import { Trash2, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getPodcasterBlockedSlots,
  getPodcasterBlockedSlotsByDate,
  createPodcasterBlockedSlot,
  deletePodcasterBlockedSlot,
  type PodcasterBlockedSlot
} from '../../api/podcasterDashboard';
import './PodcasterBlockedSlotsPage.css';

interface CalendarDay {
  date: Date | null;
  key: string;
  isToday: boolean;
  isSelected: boolean;
  hasBlocked: boolean;
  isFullDayBlocked: boolean;
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
  selectedDateKey: string | null,
  blockedSlots: PodcasterBlockedSlot[]
): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startWeekDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const today = new Date();
  const todayKey = getLocalDateKey(today);

  // Group blocked slots by date
  const blockedByDate = new Map<string, { hasBlocked: boolean; isFullDay: boolean }>();
  blockedSlots.forEach((slot) => {
    const existing = blockedByDate.get(slot.date);
    if (existing) {
      existing.isFullDay = existing.isFullDay || slot.is_full_day;
    } else {
      blockedByDate.set(slot.date, { hasBlocked: true, isFullDay: slot.is_full_day });
    }
  });

  const cells: CalendarDay[] = [];

  // Start calendar at Monday
  const offset = startWeekDay === 0 ? 6 : startWeekDay - 1;
  for (let i = 0; i < offset; i++) {
    cells.push({
      date: null,
      key: `empty-${i}`,
      isToday: false,
      isSelected: false,
      hasBlocked: false,
      isFullDayBlocked: false
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const key = getLocalDateKey(date);
    const blockInfo = blockedByDate.get(key);
    cells.push({
      date,
      key,
      isToday: key === todayKey,
      isSelected: selectedDateKey === key,
      hasBlocked: blockInfo?.hasBlocked || false,
      isFullDayBlocked: blockInfo?.isFullDay || false
    });
  }

  return cells;
}

const HOURS: string[] = [];
for (let h = 9; h <= 18; h++) {
  HOURS.push(`${h.toString().padStart(2, '0')}:00`);
}

function PodcasterBlockedSlotsPage() {
  const [allBlockedSlots, setAllBlockedSlots] = useState<PodcasterBlockedSlot[]>([]);
  const [dayBlockedSlots, setDayBlockedSlots] = useState<PodcasterBlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDay, setLoadingDay] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [blockType, setBlockType] = useState<'fullday' | 'hours' | 'multidays'>('fullday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [reason, setReason] = useState('');
  const [creating, setCreating] = useState(false);

  // Pour le mode plusieurs jours
  const [multiDayStart, setMultiDayStart] = useState<string | null>(null);
  const [multiDayEnd, setMultiDayEnd] = useState<string | null>(null);
  const [multiDayMonth, setMultiDayMonth] = useState(() => new Date().getMonth());
  const [multiDayYear, setMultiDayYear] = useState(() => new Date().getFullYear());

  // Load all blocked slots
  async function loadAllBlockedSlots() {
    try {
      setError(null);
      const data = await getPodcasterBlockedSlots();
      setAllBlockedSlots(data);
    } catch (err: any) {
      console.error('Erreur chargement blocages:', err);
      setError('Impossible de charger vos creneaux bloques.');
    } finally {
      setLoading(false);
    }
  }

  // Load blocked slots for selected day
  async function loadDayBlockedSlots(dateKey: string) {
    try {
      setLoadingDay(true);
      const data = await getPodcasterBlockedSlotsByDate(dateKey);
      setDayBlockedSlots(data);
    } catch (err: any) {
      console.error('Erreur chargement blocages jour:', err);
    } finally {
      setLoadingDay(false);
    }
  }

  useEffect(() => {
    loadAllBlockedSlots();
  }, []);

  useEffect(() => {
    if (selectedDateKey) {
      loadDayBlockedSlots(selectedDateKey);
    } else {
      setDayBlockedSlots([]);
    }
  }, [selectedDateKey]);

  // Calendar
  const calendarCells = useMemo(
    () => buildCalendarMatrix(currentYear, currentMonth, selectedDateKey, allBlockedSlots),
    [currentYear, currentMonth, selectedDateKey, allBlockedSlots]
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
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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
    setSelectedDateKey(cell.key);
  }

  // Check if date is in the past
  function isDateInPast(dateKey: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = dateKey.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d);
    return targetDate < today;
  }

  // Mini calendar pour le mode plusieurs jours
  const multiDayCalendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(multiDayYear, multiDayMonth, 1);
    const lastDayOfMonth = new Date(multiDayYear, multiDayMonth + 1, 0);
    const startWeekDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const today = new Date();
    const todayKey = getLocalDateKey(today);

    const cells: { date: Date | null; key: string; isToday: boolean; isPast: boolean }[] = [];

    const offset = startWeekDay === 0 ? 6 : startWeekDay - 1;
    for (let i = 0; i < offset; i++) {
      cells.push({ date: null, key: `empty-${i}`, isToday: false, isPast: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(multiDayYear, multiDayMonth, day);
      const key = getLocalDateKey(date);
      const isPast = key < todayKey;
      cells.push({ date, key, isToday: key === todayKey, isPast });
    }

    return cells;
  }, [multiDayYear, multiDayMonth]);

  const multiDayMonthLabel = useMemo(() => {
    const d = new Date(multiDayYear, multiDayMonth, 1);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }, [multiDayMonth, multiDayYear]);

  // Helper pour obtenir toutes les dates entre start et end
  function getDateRange(start: string, end: string): string[] {
    const dates: string[] = [];
    const [sy, sm, sd] = start.split('-').map(Number);
    const [ey, em, ed] = end.split('-').map(Number);
    const startDate = new Date(sy, sm - 1, sd);
    const endDate = new Date(ey, em - 1, ed);

    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(getLocalDateKey(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  // Create blocked slot
  async function handleCreateBlocked() {
    try {
      setCreating(true);
      setError(null);

      if (blockType === 'multidays') {
        // Mode plusieurs jours
        if (!multiDayStart || !multiDayEnd) {
          setError('Veuillez selectionner une date de debut et une date de fin.');
          setCreating(false);
          return;
        }

        if (multiDayStart > multiDayEnd) {
          setError('La date de debut doit etre avant la date de fin.');
          setCreating(false);
          return;
        }

        const dates = getDateRange(multiDayStart, multiDayEnd);

        // Creer un blocage pour chaque jour
        for (const date of dates) {
          await createPodcasterBlockedSlot({
            date,
            is_full_day: true,
            reason: reason.trim() || undefined
          });
        }

        // Reload data
        await loadAllBlockedSlots();
        if (selectedDateKey) {
          await loadDayBlockedSlots(selectedDateKey);
        }
      } else {
        // Mode jour unique ou creneau
        if (!selectedDateKey) return;

        if (isDateInPast(selectedDateKey)) {
          setError('Impossible de bloquer une date passee.');
          setCreating(false);
          return;
        }

        const payload: {
          date: string;
          is_full_day: boolean;
          start_time?: string;
          end_time?: string;
          reason?: string;
        } = {
          date: selectedDateKey,
          is_full_day: blockType === 'fullday'
        };

        if (blockType === 'hours') {
          payload.start_time = startTime;
          payload.end_time = endTime;
        }

        if (reason.trim()) {
          payload.reason = reason.trim();
        }

        await createPodcasterBlockedSlot(payload);

        // Reload data
        await Promise.all([loadAllBlockedSlots(), loadDayBlockedSlots(selectedDateKey)]);
      }

      // Reset modal
      setShowModal(false);
      setBlockType('fullday');
      setStartTime('09:00');
      setEndTime('18:00');
      setReason('');
      setMultiDayStart(null);
      setMultiDayEnd(null);
    } catch (err: any) {
      console.error('Erreur creation blocage:', err);
      setError(err?.response?.data?.message || 'Impossible de creer le blocage.');
    } finally {
      setCreating(false);
    }
  }

  // Delete blocked slot
  async function handleDeleteBlocked(id: string) {
    if (!selectedDateKey) return;
    const confirm = window.confirm('Supprimer ce blocage ?');
    if (!confirm) return;

    try {
      setError(null);
      await deletePodcasterBlockedSlot(id);
      await Promise.all([loadAllBlockedSlots(), loadDayBlockedSlots(selectedDateKey)]);
    } catch (err: any) {
      console.error('Erreur suppression blocage:', err);
      setError(err?.response?.data?.message || 'Impossible de supprimer le blocage.');
    }
  }

  function formatTime(time: string | null): string {
    if (!time) return '';
    return time.substring(0, 5);
  }

  if (loading) {
    return (
      <div className="pcb-dashboard">
        <div className="pcb-dashboard-inner">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pcb-dashboard">
      <div className="pcb-dashboard-inner">
        <h2 className="pcb-dashboard-title">Mes Disponibilites</h2>
        <p className="pcb-dashboard-subtitle">
          Bloquez des jours ou des creneaux pour indiquer vos indisponibilites.
        </p>

        {error && <p className="pcb-error">{error}</p>}

        <div className="pcb-layout">
          {/* Calendar */}
          <section className="pcb-calendar-card">
            <div className="pcb-calendar-header">
              <div className="pcb-calendar-header-left">
                <div className="pcb-calendar-header-left-icon">📅</div>
                <span>Calendrier</span>
              </div>
            </div>

            <div className="pcb-calendar-month-row">
              <button
                type="button"
                className="pcb-calendar-arrow-btn"
                onClick={handlePreviousMonth}
              >
                ‹
              </button>
              <div className="pcb-calendar-month-title">{monthLabel}</div>
              <button
                type="button"
                className="pcb-calendar-arrow-btn"
                onClick={handleNextMonth}
              >
                ›
              </button>
            </div>

            <div className="pcb-calendar-grid">
              <div className="pcb-calendar-weekday">L</div>
              <div className="pcb-calendar-weekday">M</div>
              <div className="pcb-calendar-weekday">M</div>
              <div className="pcb-calendar-weekday">J</div>
              <div className="pcb-calendar-weekday">V</div>
              <div className="pcb-calendar-weekday">S</div>
              <div className="pcb-calendar-weekday">D</div>

              {calendarCells.map((cell) => (
                <button
                  key={cell.key}
                  type="button"
                  className={[
                    'pcb-calendar-day',
                    !cell.date ? 'pcb-calendar-day--empty' : '',
                    cell.isToday ? 'pcb-calendar-day--today' : '',
                    cell.isSelected ? 'pcb-calendar-day--selected' : '',
                    cell.isFullDayBlocked ? 'pcb-calendar-day--fullday' : '',
                    cell.hasBlocked && !cell.isFullDayBlocked ? 'pcb-calendar-day--partial' : ''
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

            <div className="pcb-calendar-legend">
              <span className="pcb-calendar-legend-item">
                <span className="pcb-calendar-legend-dot pcb-calendar-legend-dot--today" />
                Aujourd'hui
              </span>
              <span className="pcb-calendar-legend-item">
                <span className="pcb-calendar-legend-dot pcb-calendar-legend-dot--fullday" />
                Jour entier bloque
              </span>
              <span className="pcb-calendar-legend-item">
                <span className="pcb-calendar-legend-dot pcb-calendar-legend-dot--partial" />
                Creneaux bloques
              </span>
            </div>
          </section>

          {/* Day panel */}
          <section className="pcb-day-panel">
            {!selectedDateKey ? (
              <div className="pcb-day-empty">
                <p>Selectionnez un jour dans le calendrier pour voir ou ajouter des blocages.</p>
              </div>
            ) : (
              <>
                <div className="pcb-day-header">
                  <h3>{selectedDateLabel}</h3>
                  {!isDateInPast(selectedDateKey) && (
                    <button
                      type="button"
                      className="pcb-add-btn"
                      onClick={() => setShowModal(true)}
                    >
                      <Plus size={16} />
                      <span>Ajouter</span>
                    </button>
                  )}
                </div>

                {loadingDay && <p className="pcb-loading">Chargement...</p>}

                {!loadingDay && dayBlockedSlots.length === 0 && (
                  <p className="pcb-day-no-blocks">
                    Aucun blocage pour ce jour. Les clients peuvent reserver.
                  </p>
                )}

                {!loadingDay && dayBlockedSlots.length > 0 && (
                  <div className="pcb-day-list">
                    {dayBlockedSlots.map((slot) => (
                      <div key={slot.id} className="pcb-slot-item">
                        <div className="pcb-slot-info">
                          {slot.is_full_day ? (
                            <span className="pcb-slot-time pcb-slot-time--fullday">
                              Journee entiere
                            </span>
                          ) : (
                            <span className="pcb-slot-time">
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </span>
                          )}
                          {slot.reason && (
                            <span className="pcb-slot-reason">{slot.reason}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="pcb-slot-delete"
                          onClick={() => handleDeleteBlocked(slot.id)}
                          title="Supprimer ce blocage"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="pcb-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pcb-modal pcb-modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="pcb-modal-header">
              <h3>Ajouter un blocage</h3>
              <button
                type="button"
                className="pcb-modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="pcb-modal-body">
              {blockType !== 'multidays' && selectedDateKey && (
                <p className="pcb-modal-date">{selectedDateLabel}</p>
              )}

              <div className="pcb-field">
                <label className="pcb-label">Type de blocage</label>
                <div className="pcb-radio-group pcb-radio-group--vertical">
                  <label className="pcb-radio">
                    <input
                      type="radio"
                      name="blockType"
                      checked={blockType === 'fullday'}
                      onChange={() => setBlockType('fullday')}
                    />
                    <span>Journee entiere</span>
                  </label>
                  <label className="pcb-radio">
                    <input
                      type="radio"
                      name="blockType"
                      checked={blockType === 'hours'}
                      onChange={() => setBlockType('hours')}
                    />
                    <span>Creneau horaire</span>
                  </label>
                  <label className="pcb-radio">
                    <input
                      type="radio"
                      name="blockType"
                      checked={blockType === 'multidays'}
                      onChange={() => setBlockType('multidays')}
                    />
                    <span>Plusieurs jours</span>
                  </label>
                </div>
              </div>

              {blockType === 'hours' && (
                <div className="pcb-time-inputs">
                  <div className="pcb-field">
                    <label className="pcb-label">Heure de debut</label>
                    <select
                      className="pcb-select"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pcb-field">
                    <label className="pcb-label">Heure de fin</label>
                    <select
                      className="pcb-select"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {blockType === 'multidays' && (
                <div className="pcb-multiday-picker">
                  <div className="pcb-multiday-header">
                    <button
                      type="button"
                      className="pcb-calendar-arrow-btn"
                      onClick={() => {
                        if (multiDayMonth === 0) {
                          setMultiDayYear(y => y - 1);
                          setMultiDayMonth(11);
                        } else {
                          setMultiDayMonth(m => m - 1);
                        }
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="pcb-multiday-month">{multiDayMonthLabel}</span>
                    <button
                      type="button"
                      className="pcb-calendar-arrow-btn"
                      onClick={() => {
                        if (multiDayMonth === 11) {
                          setMultiDayYear(y => y + 1);
                          setMultiDayMonth(0);
                        } else {
                          setMultiDayMonth(m => m + 1);
                        }
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="pcb-multiday-grid">
                    <div className="pcb-calendar-weekday">L</div>
                    <div className="pcb-calendar-weekday">M</div>
                    <div className="pcb-calendar-weekday">M</div>
                    <div className="pcb-calendar-weekday">J</div>
                    <div className="pcb-calendar-weekday">V</div>
                    <div className="pcb-calendar-weekday">S</div>
                    <div className="pcb-calendar-weekday">D</div>

                    {multiDayCalendarCells.map((cell) => {
                      const isStart = cell.key === multiDayStart;
                      const isEnd = cell.key === multiDayEnd;
                      const isInRange = multiDayStart && multiDayEnd && cell.key >= multiDayStart && cell.key <= multiDayEnd;
                      return (
                        <button
                          key={cell.key}
                          type="button"
                          className={[
                            'pcb-multiday-cell',
                            !cell.date ? 'pcb-multiday-cell--empty' : '',
                            cell.isPast ? 'pcb-multiday-cell--past' : '',
                            isStart || isEnd ? 'pcb-multiday-cell--selected' : '',
                            isInRange && !isStart && !isEnd ? 'pcb-multiday-cell--inrange' : ''
                          ].filter(Boolean).join(' ')}
                          onClick={() => {
                            if (!cell.date || cell.isPast) return;
                            if (!multiDayStart || (multiDayStart && multiDayEnd)) {
                              setMultiDayStart(cell.key);
                              setMultiDayEnd(null);
                            } else {
                              if (cell.key < multiDayStart) {
                                setMultiDayEnd(multiDayStart);
                                setMultiDayStart(cell.key);
                              } else {
                                setMultiDayEnd(cell.key);
                              }
                            }
                          }}
                          disabled={!cell.date || cell.isPast}
                        >
                          <span>{cell.date ? cell.date.getDate() : ''}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pcb-multiday-selection">
                    {multiDayStart && multiDayEnd ? (
                      <p>Du <strong>{multiDayStart}</strong> au <strong>{multiDayEnd}</strong></p>
                    ) : multiDayStart ? (
                      <p>Debut: <strong>{multiDayStart}</strong> - Selectionnez la date de fin</p>
                    ) : (
                      <p>Selectionnez la date de debut</p>
                    )}
                  </div>
                </div>
              )}

              <div className="pcb-field">
                <label className="pcb-label">Raison (optionnel)</label>
                <input
                  className="pcb-input"
                  type="text"
                  placeholder="Ex: Vacances, RDV personnel..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <div className="pcb-modal-footer">
              <button
                type="button"
                className="pcb-btn pcb-btn--secondary"
                onClick={() => setShowModal(false)}
                disabled={creating}
              >
                Annuler
              </button>
              <button
                type="button"
                className="pcb-btn pcb-btn--primary"
                onClick={handleCreateBlocked}
                disabled={creating || (blockType === 'multidays' && (!multiDayStart || !multiDayEnd))}
              >
                {creating ? 'Creation...' : 'Creer le blocage'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PodcasterBlockedSlotsPage;

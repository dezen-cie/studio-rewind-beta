// src/pages/admin/AdminBlockedSlotsPage.tsx
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Trash2, Plus, X } from 'lucide-react';
import {
  type BlockedSlot,
  getAdminBlockedSlotsForMonth,
  getAdminBlockedSlotsForDate,
  createAdminBlockedSlot,
  deleteAdminBlockedSlot,
} from '../../api/blockedSlots';
import './AdminBlockedSlotsPage.css';

const daysLabels: string[] = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

type Day = number | null;
type Week = Day[];
type DaysMatrix = Week[];

function getDaysMatrix(year: number, month: number): DaysMatrix {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  let startDay = firstDay.getDay();
  startDay = (startDay + 6) % 7;

  const weeks: DaysMatrix = [];
  let currentDay = 1 - startDay;

  while (currentDay <= daysInMonth) {
    const week: Week = [];
    for (let i = 0; i < 7; i++) {
      if (currentDay < 1 || currentDay > daysInMonth) {
        week.push(null);
      } else {
        week.push(currentDay);
      }
      currentDay++;
    }
    weeks.push(week);
  }

  return weeks;
}

function formatMonthYear(date: Date): string {
  const month = date.toLocaleString('fr-FR', { month: 'long' });
  const year = date.getFullYear();
  return `${month} ${year}`;
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const HOURS: string[] = [];
for (let h = 9; h <= 18; h++) {
  HOURS.push(`${h.toString().padStart(2, '0')}:00`);
}

function AdminBlockedSlotsPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [monthBlockedSlots, setMonthBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loadingMonth, setLoadingMonth] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayBlockedSlots, setDayBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loadingDay, setLoadingDay] = useState(false);

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

  const [error, setError] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const weeks = getDaysMatrix(year, month);

  // Charger les blocages du mois
  async function loadMonthBlockedSlots() {
    try {
      setLoadingMonth(true);
      setError(null);
      const data = await getAdminBlockedSlotsForMonth(year, month + 1);
      setMonthBlockedSlots(data);
    } catch (err: any) {
      console.error('Erreur chargement blocages mois:', err);
      setError('Impossible de charger les blocages du mois.');
    } finally {
      setLoadingMonth(false);
    }
  }

  // Charger les blocages d'un jour
  async function loadDayBlockedSlots(dateKey: string) {
    try {
      setLoadingDay(true);
      setError(null);
      const data = await getAdminBlockedSlotsForDate(dateKey);
      setDayBlockedSlots(data);
    } catch (err: any) {
      console.error('Erreur chargement blocages jour:', err);
      setError('Impossible de charger les blocages du jour.');
    } finally {
      setLoadingDay(false);
    }
  }

  useEffect(() => {
    loadMonthBlockedSlots();
  }, [year, month]);

  useEffect(() => {
    if (selectedDate) {
      loadDayBlockedSlots(selectedDate);
    } else {
      setDayBlockedSlots([]);
    }
  }, [selectedDate]);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDay = (day: Day) => {
    if (!day) return;
    const dateKey = toDateKey(year, month, day);
    setSelectedDate(dateKey);
  };

  // Vérifie si un jour a des blocages
  function getDayBlockedInfo(day: Day): { hasBlocked: boolean; isFullDayBlocked: boolean } {
    if (!day) return { hasBlocked: false, isFullDayBlocked: false };
    const dateKey = toDateKey(year, month, day);
    const dayBlocks = monthBlockedSlots.filter((b) => b.date === dateKey);
    const hasBlocked = dayBlocks.length > 0;
    const isFullDayBlocked = dayBlocks.some((b) => b.is_full_day);
    return { hasBlocked, isFullDayBlocked };
  }

  const isSelected = (day: Day): boolean => {
    if (!selectedDate || !day) return false;
    const dateKey = toDateKey(year, month, day);
    return selectedDate === dateKey;
  };

  // Mini calendar pour le mode plusieurs jours
  const multiDayCalendarCells = React.useMemo(() => {
    const firstDayOfMonth = new Date(multiDayYear, multiDayMonth, 1);
    const lastDayOfMonth = new Date(multiDayYear, multiDayMonth + 1, 0);
    const startWeekDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const today = new Date();
    const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    const cells: { date: Date | null; key: string; isToday: boolean; isPast: boolean }[] = [];

    const offset = startWeekDay === 0 ? 6 : startWeekDay - 1;
    for (let i = 0; i < offset; i++) {
      cells.push({ date: null, key: `empty-${i}`, isToday: false, isPast: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(multiDayYear, multiDayMonth, day);
      const key = toDateKey(multiDayYear, multiDayMonth, day);
      const isPast = key < todayKey;
      cells.push({ date, key, isToday: key === todayKey, isPast });
    }

    return cells;
  }, [multiDayYear, multiDayMonth]);

  const multiDayMonthLabel = React.useMemo(() => {
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
      dates.push(toDateKey(current.getFullYear(), current.getMonth(), current.getDate()));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  // Créer un blocage
  async function handleCreateBlocked() {
    try {
      setCreating(true);
      setError(null);

      if (blockType === 'multidays') {
        // Mode plusieurs jours
        if (!multiDayStart || !multiDayEnd) {
          setError('Veuillez sélectionner une date de début et une date de fin.');
          setCreating(false);
          return;
        }

        if (multiDayStart > multiDayEnd) {
          setError('La date de début doit être avant la date de fin.');
          setCreating(false);
          return;
        }

        const dates = getDateRange(multiDayStart, multiDayEnd);

        // Créer un blocage pour chaque jour
        for (const date of dates) {
          await createAdminBlockedSlot({
            date,
            is_full_day: true,
            reason: reason.trim() || undefined
          });
        }

        // Recharger les données
        await loadMonthBlockedSlots();
        if (selectedDate) {
          await loadDayBlockedSlots(selectedDate);
        }
      } else {
        // Mode jour unique ou créneau
        if (!selectedDate) return;

        const payload: {
          date: string;
          is_full_day: boolean;
          start_time?: string;
          end_time?: string;
          reason?: string;
        } = {
          date: selectedDate,
          is_full_day: blockType === 'fullday',
        };

        if (blockType === 'hours') {
          payload.start_time = startTime;
          payload.end_time = endTime;
        }

        if (reason.trim()) {
          payload.reason = reason.trim();
        }

        await createAdminBlockedSlot(payload);

        // Recharger les données
        await Promise.all([loadMonthBlockedSlots(), loadDayBlockedSlots(selectedDate)]);
      }

      // Reset le modal
      setShowModal(false);
      setBlockType('fullday');
      setStartTime('09:00');
      setEndTime('18:00');
      setReason('');
      setMultiDayStart(null);
      setMultiDayEnd(null);
    } catch (err: any) {
      console.error('Erreur création blocage:', err);
      setError(err?.response?.data?.message || 'Impossible de créer le blocage.');
    } finally {
      setCreating(false);
    }
  }

  // Supprimer un blocage
  async function handleDeleteBlocked(id: string) {
    if (!selectedDate) return;
    const confirm = window.confirm('Supprimer ce blocage ?');
    if (!confirm) return;

    try {
      setError(null);
      await deleteAdminBlockedSlot(id);
      await Promise.all([loadMonthBlockedSlots(), loadDayBlockedSlots(selectedDate)]);
    } catch (err: any) {
      console.error('Erreur suppression blocage:', err);
      setError(err?.response?.data?.message || 'Impossible de supprimer le blocage.');
    }
  }

  function formatTime(time: string | null): string {
    if (!time) return '';
    return time.substring(0, 5);
  }

  function formatSelectedDate(dateKey: string): string {
    const [y, m, d] = dateKey.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return (
    <div className="sr-page">
      <div className="sr-page-header">
        <div>
          <h2 className="sr-page-title">Gestion des créneaux bloqués</h2>
          <p className="sr-page-subtitle">
            Bloquez des jours ou des créneaux horaires pour empêcher les réservations.
          </p>
        </div>
      </div>

      {error && <p className="sr-page-error">{error}</p>}

      <div className="sr-page-body">
        <div className="blocked-slots-layout">
          {/* CALENDRIER */}
          <div className="sr-card blocked-calendar-card">
            <div className="blocked-calendar-header">
              <div className="blocked-calendar-title">
                <Calendar size={18} />
                <span>Calendrier</span>
              </div>
            </div>

            <div className="blocked-calendar-month-nav">
              <button type="button" onClick={handlePrevMonth}>
                <ChevronLeft size={18} />
              </button>
              <span className="blocked-calendar-month-label">
                {formatMonthYear(currentDate)}
              </span>
              <button type="button" onClick={handleNextMonth}>
                <ChevronRight size={18} />
              </button>
            </div>

            {loadingMonth && <p className="blocked-loading">Chargement...</p>}

            <div className="blocked-calendar-grid">
              <div className="blocked-calendar-row blocked-calendar-row-labels">
                {daysLabels.map((label, index) => (
                  <div key={index} className="blocked-calendar-cell blocked-calendar-cell-label">
                    {label}
                  </div>
                ))}
              </div>

              {weeks.map((week: Week, weekIndex: number) => (
                <div key={weekIndex} className="blocked-calendar-row">
                  {week.map((day: Day, dayIndex: number) => {
                    const { hasBlocked, isFullDayBlocked } = getDayBlockedInfo(day);
                    return (
                      <button
                        key={dayIndex}
                        type="button"
                        className={
                          'blocked-calendar-cell blocked-calendar-cell-day' +
                          (day ? '' : ' blocked-calendar-cell-empty') +
                          (isSelected(day) ? ' blocked-calendar-cell-selected' : '') +
                          (isFullDayBlocked ? ' blocked-calendar-cell-fullday' : '') +
                          (hasBlocked && !isFullDayBlocked ? ' blocked-calendar-cell-partial' : '')
                        }
                        onClick={() => handleSelectDay(day)}
                        disabled={!day}
                      >
                        {day ?? ''}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="blocked-legend">
              <div className="blocked-legend-item">
                <span className="blocked-legend-dot fullday"></span>
                <span>Jour entier bloqué</span>
              </div>
              <div className="blocked-legend-item">
                <span className="blocked-legend-dot partial"></span>
                <span>Créneaux bloqués</span>
              </div>
            </div>
          </div>

          {/* PANNEAU DÉTAIL DU JOUR */}
          <div className="sr-card blocked-day-panel">
            {!selectedDate ? (
              <div className="blocked-day-empty">
                <Calendar size={48} />
                <p>Sélectionnez un jour dans le calendrier pour voir ou ajouter des blocages.</p>
              </div>
            ) : (
              <>
                <div className="blocked-day-header">
                  <h3>{formatSelectedDate(selectedDate)}</h3>
                  <button
                    type="button"
                    className="button is-primary is-small"
                    onClick={() => setShowModal(true)}
                  >
                    <Plus size={16} />
                    <span>Ajouter un blocage</span>
                  </button>
                </div>

                {loadingDay && <p className="blocked-loading">Chargement...</p>}

                {!loadingDay && dayBlockedSlots.length === 0 && (
                  <p className="blocked-day-no-blocks">
                    Aucun blocage pour ce jour. Les utilisateurs peuvent réserver librement.
                  </p>
                )}

                {!loadingDay && dayBlockedSlots.length > 0 && (
                  <div className="blocked-day-list">
                    {dayBlockedSlots.map((slot) => (
                      <div key={slot.id} className="blocked-slot-item">
                        <div className="blocked-slot-info">
                          {slot.is_full_day ? (
                            <span className="blocked-slot-time fullday">Journée entière</span>
                          ) : (
                            <span className="blocked-slot-time">
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </span>
                          )}
                          {slot.reason && (
                            <span className="blocked-slot-reason">{slot.reason}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="blocked-slot-delete"
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
          </div>
        </div>
      </div>

      {/* MODAL AJOUT BLOCAGE */}
      {showModal && (
        <div className="blocked-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="blocked-modal blocked-modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="blocked-modal-header">
              <h3>Ajouter un blocage</h3>
              <button
                type="button"
                className="blocked-modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="blocked-modal-body">
              {blockType !== 'multidays' && selectedDate && (
                <p className="blocked-modal-date">{formatSelectedDate(selectedDate)}</p>
              )}

              <div className="field">
                <label className="label">Type de blocage</label>
                <div className="control blocked-radio-group--vertical">
                  <label className="radio">
                    <input
                      type="radio"
                      name="blockType"
                      checked={blockType === 'fullday'}
                      onChange={() => setBlockType('fullday')}
                    />
                    <span>Journée entière</span>
                  </label>
                  <label className="radio">
                    <input
                      type="radio"
                      name="blockType"
                      checked={blockType === 'hours'}
                      onChange={() => setBlockType('hours')}
                    />
                    <span>Créneau horaire</span>
                  </label>
                  <label className="radio">
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
                <div className="blocked-time-inputs">
                  <div className="field">
                    <label className="label">Heure de début</label>
                    <div className="control">
                      <div className="select">
                        <select value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                          {HOURS.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Heure de fin</label>
                    <div className="control">
                      <div className="select">
                        <select value={endTime} onChange={(e) => setEndTime(e.target.value)}>
                          {HOURS.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {blockType === 'multidays' && (
                <div className="blocked-multiday-picker">
                  <div className="blocked-multiday-header">
                    <button
                      type="button"
                      className="blocked-multiday-arrow"
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
                    <span className="blocked-multiday-month">{multiDayMonthLabel}</span>
                    <button
                      type="button"
                      className="blocked-multiday-arrow"
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

                  <div className="blocked-multiday-grid">
                    {daysLabels.map((label, index) => (
                      <div key={index} className="blocked-multiday-weekday">{label}</div>
                    ))}

                    {multiDayCalendarCells.map((cell) => {
                      const isStart = cell.key === multiDayStart;
                      const isEnd = cell.key === multiDayEnd;
                      const isInRange = multiDayStart && multiDayEnd && cell.key >= multiDayStart && cell.key <= multiDayEnd;
                      return (
                        <button
                          key={cell.key}
                          type="button"
                          className={[
                            'blocked-multiday-cell',
                            !cell.date ? 'blocked-multiday-cell--empty' : '',
                            cell.isPast ? 'blocked-multiday-cell--past' : '',
                            isStart || isEnd ? 'blocked-multiday-cell--selected' : '',
                            isInRange && !isStart && !isEnd ? 'blocked-multiday-cell--inrange' : ''
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

                  <div className="blocked-multiday-selection">
                    {multiDayStart && multiDayEnd ? (
                      <p>Du <strong>{multiDayStart}</strong> au <strong>{multiDayEnd}</strong></p>
                    ) : multiDayStart ? (
                      <p>Début: <strong>{multiDayStart}</strong> - Sélectionnez la date de fin</p>
                    ) : (
                      <p>Sélectionnez la date de début</p>
                    )}
                  </div>
                </div>
              )}

              <div className="field">
                <label className="label">Raison (optionnel)</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    placeholder="Ex: Maintenance, Événement privé..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="blocked-modal-footer">
              <button
                type="button"
                className="button"
                onClick={() => setShowModal(false)}
                disabled={creating}
              >
                Annuler
              </button>
              <button
                type="button"
                className="button is-primary"
                onClick={handleCreateBlocked}
                disabled={creating || (blockType === 'multidays' && (!multiDayStart || !multiDayEnd))}
              >
                {creating ? 'Création...' : 'Créer le blocage'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBlockedSlotsPage;

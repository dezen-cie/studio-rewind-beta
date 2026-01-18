// src/pages/admin/AdminBlockedSlotsPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Trash2, Plus, X } from 'lucide-react';
import {
  type BlockedSlot,
  getAdminBlockedSlotsForMonth,
  getAdminBlockedSlotsForDate,
  createAdminBlockedSlot,
  deleteAdminBlockedSlot,
  getAdminStudioSettings,
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

// Fonction pour générer les heures de blocage selon les horaires d'ouverture
function generateBlockHours(openingTime: string, closingTime: string): string[] {
  const openingHour = parseInt(openingTime.split(':')[0], 10);
  const closingHour = parseInt(closingTime.split(':')[0], 10);
  const hours: string[] = [];
  for (let h = openingHour; h <= closingHour; h++) {
    hours.push(`${h.toString().padStart(2, '0')}:00`);
  }
  return hours;
}

// Fonction pour générer les heures hors horaires pour les déblocages
function generateUnblockHours(openingTime: string, closingTime: string): string[] {
  const openingHour = parseInt(openingTime.split(':')[0], 10);
  const closingHour = parseInt(closingTime.split(':')[0], 10);
  const hours: string[] = [];
  // Avant l'ouverture (0h jusqu'à l'heure d'ouverture)
  for (let h = 0; h <= openingHour; h++) {
    hours.push(`${h.toString().padStart(2, '0')}:00`);
  }
  // Après la fermeture (heure de fermeture jusqu'à 23h)
  for (let h = closingHour; h <= 23; h++) {
    hours.push(`${h.toString().padStart(2, '0')}:00`);
  }
  return hours;
}

// Toutes les heures en tranches de 30 minutes pour les horaires d'ouverture
const ALL_HOURS_30MIN: string[] = [];
for (let h = 0; h < 24; h++) {
  ALL_HOURS_30MIN.push(`${h.toString().padStart(2, '0')}:00`);
  ALL_HOURS_30MIN.push(`${h.toString().padStart(2, '0')}:30`);
}
ALL_HOURS_30MIN.push('24:00'); // Minuit fin de journée

// Labels des jours de la semaine (1=Lundi ... 7=Dimanche)
const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
];

function AdminBlockedSlotsPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [monthBlockedSlots, setMonthBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loadingMonth, setLoadingMonth] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayBlockedSlots, setDayBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loadingDay, setLoadingDay] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [blockType, setBlockType] = useState<'fullday' | 'hours' | 'multidays' | 'unblock'>('fullday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [unblockStartTime, setUnblockStartTime] = useState('07:00');
  const [unblockEndTime, setUnblockEndTime] = useState('09:00');
  const [reason, setReason] = useState('');
  const [creating, setCreating] = useState(false);

  // Pour le mode plusieurs jours
  const [multiDayStart, setMultiDayStart] = useState<string | null>(null);
  const [multiDayEnd, setMultiDayEnd] = useState<string | null>(null);
  const [multiDayMonth, setMultiDayMonth] = useState(() => new Date().getMonth());
  const [multiDayYear, setMultiDayYear] = useState(() => new Date().getFullYear());

  const [error, setError] = useState<string | null>(null);

  // État pour les paramètres du studio (lecture seule)
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsOpeningTime, setSettingsOpeningTime] = useState('09:00');
  const [settingsClosingTime, setSettingsClosingTime] = useState('18:00');
  const [settingsOpenDays, setSettingsOpenDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // Heures dynamiques basées sur les horaires d'ouverture
  const blockHours = useMemo(() => {
    return generateBlockHours(settingsOpeningTime, settingsClosingTime);
  }, [settingsOpeningTime, settingsClosingTime]);

  const unblockHours = useMemo(() => {
    return generateUnblockHours(settingsOpeningTime, settingsClosingTime);
  }, [settingsOpeningTime, settingsClosingTime]);

  // Labels formatés pour les heures d'ouverture
  const openingHourLabel = useMemo(() => {
    const hour = parseInt(settingsOpeningTime.split(':')[0], 10);
    return `${hour}h`;
  }, [settingsOpeningTime]);

  const closingHourLabel = useMemo(() => {
    const hour = parseInt(settingsClosingTime.split(':')[0], 10);
    return `${hour}h`;
  }, [settingsClosingTime]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const weeks = getDaysMatrix(year, month);

  // Charger les paramètres du studio (lecture seule pour affichage)
  async function loadSettings() {
    try {
      setLoadingSettings(true);
      const data = await getAdminStudioSettings();
      const openingTime = data.opening_time?.substring(0, 5) || '09:00';
      const closingTime = data.closing_time?.substring(0, 5) || '18:00';
      setSettingsOpeningTime(openingTime);
      setSettingsClosingTime(closingTime);
      // Récupérer les jours d'ouverture
      if (data.open_days && Array.isArray(data.open_days)) {
        setSettingsOpenDays(data.open_days);
      }
      // Mettre à jour les valeurs par défaut du modal
      setStartTime(openingTime);
      setEndTime(closingTime);
    } catch (err: any) {
      console.error('Erreur chargement paramètres:', err);
    } finally {
      setLoadingSettings(false);
    }
  }

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
    loadSettings();
  }, []);

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

  // Vérifie si un jour a des blocages ou déblocages
  function getDayBlockedInfo(day: Day): { hasBlocked: boolean; isFullDayBlocked: boolean; hasUnblock: boolean } {
    if (!day) return { hasBlocked: false, isFullDayBlocked: false, hasUnblock: false };
    const dateKey = toDateKey(year, month, day);
    const dayBlocks = monthBlockedSlots.filter((b) => b.date === dateKey);
    const blocks = dayBlocks.filter((b) => !b.is_unblock);
    const unblocks = dayBlocks.filter((b) => b.is_unblock);
    const hasBlocked = blocks.length > 0;
    const isFullDayBlocked = blocks.some((b) => b.is_full_day);
    const hasUnblock = unblocks.length > 0;
    return { hasBlocked, isFullDayBlocked, hasUnblock };
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
        // Mode jour unique, créneau ou déblocage
        if (!selectedDate) return;

        const payload: {
          date: string;
          is_full_day: boolean;
          is_unblock?: boolean;
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

        if (blockType === 'unblock') {
          payload.is_full_day = false;
          payload.is_unblock = true;
          payload.start_time = unblockStartTime;
          payload.end_time = unblockEndTime;
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
      setStartTime(settingsOpeningTime);
      setEndTime(settingsClosingTime);
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

  // Vérifie si le jour sélectionné est un jour normalement ouvert
  function isSelectedDayOpen(): boolean {
    if (!selectedDate) return true;
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const jsDay = date.getDay(); // 0=Dimanche, 1=Lundi, ..., 6=Samedi
    // Convertir en format settings: 1=Lundi, ..., 7=Dimanche
    const settingsDay = jsDay === 0 ? 7 : jsDay;
    return settingsOpenDays.includes(settingsDay);
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
        {/* SECTION GESTION DES CRÉNEAUX BLOQUÉS */}
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
                    const { hasBlocked, isFullDayBlocked, hasUnblock } = getDayBlockedInfo(day);
                    return (
                      <button
                        key={dayIndex}
                        type="button"
                        className={
                          'blocked-calendar-cell blocked-calendar-cell-day' +
                          (day ? '' : ' blocked-calendar-cell-empty') +
                          (isSelected(day) ? ' blocked-calendar-cell-selected' : '') +
                          (isFullDayBlocked ? ' blocked-calendar-cell-fullday' : '') +
                          (hasBlocked && !isFullDayBlocked ? ' blocked-calendar-cell-partial' : '') +
                          (hasUnblock ? ' blocked-calendar-cell-unblock' : '')
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
              <div className="blocked-legend-item">
                <span className="blocked-legend-dot unblock"></span>
                <span>Ouverture exceptionnelle</span>
              </div>
            </div>
            <p className="blocked-info-text">
              Par défaut, le studio est ouvert de {settingsOpeningTime} à {settingsClosingTime}. Les créneaux hors de ces horaires sont automatiquement bloqués.
            </p>
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
                    <span>Ajout d'une exception</span>
                  </button>
                </div>

                {loadingDay && <p className="blocked-loading">Chargement...</p>}

                {!loadingDay && dayBlockedSlots.length === 0 && (
                  <p className="blocked-day-no-blocks">
                    {isSelectedDayOpen()
                      ? 'Aucun blocage pour ce jour. Les utilisateurs peuvent réserver librement.'
                      : 'Jour non réservable pour le moment (fermé par défaut).'}
                  </p>
                )}

                {!loadingDay && dayBlockedSlots.length > 0 && (
                  <div className="blocked-day-list">
                    {dayBlockedSlots.map((slot) => (
                      <div key={slot.id} className={`blocked-slot-item ${slot.is_unblock ? 'blocked-slot-item--unblock' : ''}`}>
                        <div className="blocked-slot-info">
                          {slot.is_unblock ? (
                            <span className="blocked-slot-time unblock">
                              Ouverture {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </span>
                          ) : slot.is_full_day ? (
                            <span className="blocked-slot-time fullday">Journée entière bloquée</span>
                          ) : (
                            <span className="blocked-slot-time">
                              Blocage {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
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
                          title={slot.is_unblock ? "Supprimer cette ouverture" : "Supprimer ce blocage"}
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
              <h3>Ajout d'une exception</h3>
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
                <label className="label">Type d'action</label>
                <div className="control blocked-radio-group--vertical">
                  <label className="radio">
                    <input
                      type="radio"
                      name="blockType"
                      checked={blockType === 'fullday'}
                      onChange={() => setBlockType('fullday')}
                    />
                    <span>Bloquer la journée entière</span>
                  </label>
                  <label className="radio">
                    <input
                      type="radio"
                      name="blockType"
                      checked={blockType === 'hours'}
                      onChange={() => setBlockType('hours')}
                    />
                    <span>Bloquer un créneau ({openingHourLabel}-{closingHourLabel})</span>
                  </label>
                  <label className="radio">
                    <input
                      type="radio"
                      name="blockType"
                      checked={blockType === 'multidays'}
                      onChange={() => setBlockType('multidays')}
                    />
                    <span>Bloquer plusieurs jours</span>
                  </label>
                  <label className="radio">
                    <input
                      type="radio"
                      name="blockType"
                      checked={blockType === 'unblock'}
                      onChange={() => setBlockType('unblock')}
                    />
                    <span>Ouvrir un créneau hors horaires (0h-{openingHourLabel} ou {closingHourLabel}-24h)</span>
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
                          {blockHours.map((h) => (
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
                          {blockHours.map((h) => (
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

              {blockType === 'unblock' && (
                <div className="blocked-time-inputs">
                  <p className="blocked-unblock-info">
                    Ouvrez un créneau en dehors des horaires d'ouverture habituels ({openingHourLabel}-{closingHourLabel}).
                  </p>
                  <div className="field">
                    <label className="label">Heure de début</label>
                    <div className="control">
                      <div className="select">
                        <select value={unblockStartTime} onChange={(e) => setUnblockStartTime(e.target.value)}>
                          {unblockHours.map((h) => (
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
                        <select value={unblockEndTime} onChange={(e) => setUnblockEndTime(e.target.value)}>
                          {unblockHours.map((h) => (
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
                {creating ? 'Création...' : blockType === 'unblock' ? 'Ouvrir le créneau' : 'Créer le blocage'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBlockedSlotsPage;

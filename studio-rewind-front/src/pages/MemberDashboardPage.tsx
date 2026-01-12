import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  type MemberReservation,
  getMemberReservations
} from '../api/memberReservations';

import api from '../api/client';
import './MemberDashboardPage.css';
import PasswordCard from '../components/PasswordCard';
import Contact from '../components/Contact';
import { getPublicPodcasters, getPodcasterBlockedSlotsForDate, type Podcaster, type PodcasterBlockedSlotPublic } from '../api/podcasters';
import { getBlockedSlotsForDate, getDefaultBlockedHours, getUnblocksForDate, type BlockedSlot, type DefaultBlockedRange } from '../api/blockedSlots';
import { User } from 'lucide-react';

type MemberReservationStatus = MemberReservation['status'];
type MemberReservationFormula = MemberReservation['formula'];

interface CalendarDay {
  date: Date | null;
  key: string;
  hasReservations: boolean;
  isToday: boolean;
  isSelected: boolean;
}

// ====== TYPES PACK D'HEURES & CRENEAUX JOUR ======

type SubscriptionInfo = {
  hasSubscription: boolean;
  purchased_hours?: number; // total d'heures achetées (toutes subscriptions actives)
  used_hours?: number; // total d'heures consommées via packs
  remaining_hours?: number; // heures restantes
};

type DayReservation = {
  id: string;
  formula: string;
  start_date: string;
  end_date: string;
  status: string;
};

// pour pouvoir lire is_subscription même si pas typé dans MemberReservation
type MemberReservationWithSub = MemberReservation & {
  is_subscription?: boolean;
};

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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
  reservations: MemberReservation[],
  selectedDateKey: string | null
): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startWeekDay = firstDayOfMonth.getDay(); // 0 = dimanche
  const daysInMonth = lastDayOfMonth.getDate();

  const reservationsByDay = new Set<string>();
  reservations.forEach((r) => {
    const d = new Date(r.start_date);
    if (!Number.isNaN(d.getTime())) {
      reservationsByDay.add(getLocalDateKey(d));
    }
  });

  const today = new Date();
  const todayKey = getLocalDateKey(today);
  const cells: CalendarDay[] = [];

  // on commence le calendrier à Lundi
  const offset = startWeekDay === 0 ? 6 : startWeekDay - 1;
  for (let i = 0; i < offset; i++) {
    cells.push({
      date: null,
      key: `empty-${i}`,
      hasReservations: false,
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
      hasReservations: reservationsByDay.has(key),
      isToday: key === todayKey,
      isSelected: selectedDateKey === key
    });
  }

  return cells;
}

function getFormulaLabel(r: MemberReservationWithSub) {
  if (r.formula === 'amelioree' && r.is_subscription) {
    return 'Formule améliorée (pack heures)';
  }

  switch (r.formula as MemberReservationFormula) {
    case 'autonome':
      return 'Formule autonome';
    case 'amelioree':
      return 'Formule améliorée';
    case 'abonnement':
      return 'Formule pack';
    default:
      return r.formula;
  }
}

function getStatusClass(status: MemberReservationStatus) {
  switch (status) {
    case 'confirmed':
      return 'sr-status-confirmed';
    case 'pending':
      return 'sr-status-pending';
    case 'cancelled':
      return 'sr-status-cancelled';
    default:
      return '';
  }
}

// Toutes les heures de la journée (0h à 23h) - pour les calculs de blocage
const HOURS: string[] = [];
for (let h = 0; h <= 23; h++) {
  HOURS.push(`${h.toString().padStart(2, '0')}:00`);
}

function MemberDashboardPage() {
  const location = useLocation();

  // 🔔 message flash après redirection (navigate('/member', { state: { flash: '...' } }))
  const [flash, _setFlash] = useState<string | null>(() => {
    const state = location.state as any;
    const msg = state?.flash;
    return typeof msg === 'string' ? msg : null;
  });

  const [reservations, setReservations] = useState<MemberReservationWithSub[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return now.getMonth();
  });
  const [currentYear, setCurrentYear] = useState(() => {
    const now = new Date();
    return now.getFullYear();
  });

  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  // ====== PACK D'HEURES ======
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(
    null
  );
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(
    null
  );

  const hasSubscription = subscriptionInfo?.hasSubscription === true;
  const purchasedHours = subscriptionInfo?.purchased_hours ?? 0;
  const usedHours = subscriptionInfo?.used_hours ?? 0;
  const remainingHours = subscriptionInfo?.remaining_hours ?? 0;

  // ====== CRENEAUX DU JOUR (pour blocage) ======
  const [dayReservations, setDayReservations] = useState<DayReservation[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // ====== SÉLECTION HEURES PACK ======
  const [subStartTime, setSubStartTime] = useState<string>('');
  const [subEndTime, setSubEndTime] = useState<string>('');
  const [subActionError, setSubActionError] = useState<string | null>(null);
  const [subActionSuccess, setSubActionSuccess] = useState<string | null>(null);
  const [subActionLoading, setSubActionLoading] = useState(false);

  // ====== PODCASTEURS POUR PACK ======
  const [podcasters, setPodcasters] = useState<Podcaster[]>([]);
  const [loadingPodcasters, setLoadingPodcasters] = useState(true);
  const [selectedPodcaster, setSelectedPodcaster] = useState<{ id: string; name: string } | null>(null);
  const [podcasterBlockedSlots, setPodcasterBlockedSlots] = useState<PodcasterBlockedSlotPublic[]>([]);
  const [adminBlockedSlots, setAdminBlockedSlots] = useState<BlockedSlot[]>([]);
  const [defaultBlockedRanges, setDefaultBlockedRanges] = useState<DefaultBlockedRange[]>([]);
  const [unblocks, setUnblocks] = useState<BlockedSlot[]>([]);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        setLoading(true);
        const data = await getMemberReservations();
        setReservations(data as MemberReservationWithSub[]);
      } catch (err: any) {
        console.error('Erreur getMemberReservations:', err);
        const message =
          err?.response?.data?.message ||
          'Impossible de charger vos réservations.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    async function loadSubscription() {
      try {
        setSubscriptionError(null);
        setSubscriptionLoading(true);
        const res = await api.get<SubscriptionInfo>('/subscriptions/me');
        setSubscriptionInfo(res.data);
      } catch (err: any) {
        console.error('Erreur /subscriptions/me:', err);
        const message =
          err?.response?.data?.message ||
          "Impossible de charger vos heures prépayées.";
        setSubscriptionError(message);
        setSubscriptionInfo({ hasSubscription: false });
      } finally {
        setSubscriptionLoading(false);
      }
    }

    load();
    loadSubscription();

    // Charger les podcasteurs et heures bloquées par défaut
    async function loadPodcastersAndDefaults() {
      try {
        setLoadingPodcasters(true);
        const [podcastersData, defaultHours] = await Promise.all([
          getPublicPodcasters(),
          getDefaultBlockedHours()
        ]);
        setPodcasters(podcastersData);
        setDefaultBlockedRanges(defaultHours);
      } catch (err) {
        console.error('Erreur chargement podcasteurs:', err);
      } finally {
        setLoadingPodcasters(false);
      }
    }
    loadPodcastersAndDefaults();
  }, []);

  // ====== CALENDRIER ======
  const calendarCells = useMemo(
    () =>
      buildCalendarMatrix(
        currentYear,
        currentMonth,
        reservations,
        selectedDateKey
      ),
    [currentYear, currentMonth, reservations, selectedDateKey]
  );

  const reservationsBySelectedDay = useMemo(() => {
    if (!selectedDateKey) return [];
    return reservations.filter((r) => {
      const d = new Date(r.start_date);
      if (Number.isNaN(d.getTime())) return false;
      return getLocalDateKey(d) === selectedDateKey;
    });
  }, [selectedDateKey, reservations]);

  const upcomingReservations = useMemo(() => {
    const now = new Date();
    return reservations
      .filter((r) => new Date(r.start_date) >= now)
      .sort(
        (a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
  }, [reservations]);

  // date sélectionnée en objet Date (utile pour résa pack)
  const selectedDateObject = useMemo(() => {
    if (!selectedDateKey) return null;
    const [y, m, d] = selectedDateKey.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }, [selectedDateKey]);

  function handlePreviousMonth() {
    setSelectedDateKey(null);
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }

  function handleNextMonth() {
    setSelectedDateKey(null);
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
    setSelectedDateKey((current) => (current === key ? null : key));
    // reset sélection heures & messages
    setSubStartTime('');
    setSubEndTime('');
    setSubActionError(null);
    setSubActionSuccess(null);
  }

  function handlePodcasterChange(podcasterId: string) {
    const podcaster = podcasters.find(p => p.id === podcasterId);
    if (podcaster) {
      setSelectedPodcaster({ id: podcaster.id, name: podcaster.name });
    } else {
      setSelectedPodcaster(null);
    }
    // Reset les créneaux quand on change de podcasteur
    setSubStartTime('');
    setSubEndTime('');
    setSubActionError(null);
    setSubActionSuccess(null);
  }

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

  // ====== CHARGEMENT DES CRÉNEAUX DU JOUR (pour blocage) ======
  useEffect(() => {
    async function loadDay() {
      if (!hasSubscription || !selectedDateKey || !selectedPodcaster) {
        setDayReservations([]);
        setPodcasterBlockedSlots([]);
        setAdminBlockedSlots([]);
        setUnblocks([]);
        setSlotsError(null);
        return;
      }

      setSlotsLoading(true);
      setSlotsError(null);
      try {
        // Charger toutes les données en parallèle
        const [reservationsRes, adminBlocked, podcasterBlocked, unblocksRes] = await Promise.all([
          api.get<DayReservation[]>(`/podcasters/${selectedPodcaster.id}/reservations/${selectedDateKey}`),
          getBlockedSlotsForDate(selectedDateKey),
          getPodcasterBlockedSlotsForDate(selectedPodcaster.id, selectedDateKey),
          getUnblocksForDate(selectedDateKey)
        ]);
        setDayReservations(reservationsRes.data);
        setAdminBlockedSlots(adminBlocked);
        setPodcasterBlockedSlots(podcasterBlocked);
        setUnblocks(unblocksRes);
      } catch (err: any) {
        console.warn('Erreur chargement créneaux jour (pack):', err);
        setDayReservations([]);
        setPodcasterBlockedSlots([]);
        setAdminBlockedSlots([]);
        setUnblocks([]);
        setSlotsError(
          "Impossible de récupérer les créneaux réservés pour ce jour (tout sera affiché comme disponible)."
        );
      } finally {
        setSlotsLoading(false);
      }
    }

    loadDay();
  }, [hasSubscription, selectedDateKey, selectedPodcaster]);

  // ====== UTILS POUR BLOQUER LES HEURES ======
  function getHourFloat(dateStr: string): number | null {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d.getHours() + d.getMinutes() / 60;
  }

  function getTimeFloat(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h + (m || 0) / 60;
  }

  // Vérifie si le jour entier est bloqué (admin ou podcasteur)
  function isFullDayBlocked(): boolean {
    const adminFullDay = adminBlockedSlots.some((b) => b.is_full_day);
    const podcasterFullDay = podcasterBlockedSlots.some((b) => b.is_full_day);
    return adminFullDay || podcasterFullDay;
  }

  // Vérifie si une heure est dans les plages bloquées par défaut
  function isInDefaultBlockedRange(hour: number): boolean {
    return defaultBlockedRanges.some(range => hour >= range.start && hour < range.end);
  }

  // Vérifie si une heure est débloquée (ouverture exceptionnelle)
  function isHourUnblocked(hour: number): boolean {
    return unblocks.some((u) => {
      if (!u.start_time || !u.end_time) return false;
      const s = getTimeFloat(u.start_time);
      const e = getTimeFloat(u.end_time);
      return hour >= s && hour < e;
    });
  }

  // Vérifie si une heure est dans un blocage
  function isHourInsideBlocked(hour: number): boolean {
    // Vérifier les blocages admin
    const inAdminBlocked = adminBlockedSlots.some((b) => {
      if (b.is_unblock) return false;
      if (b.is_full_day) return true;
      if (!b.start_time || !b.end_time) return false;
      const s = getTimeFloat(b.start_time);
      const e = getTimeFloat(b.end_time);
      return hour >= s && hour < e;
    });
    if (inAdminBlocked) return true;

    // Vérifier les blocages podcasteur
    const inPodcasterBlocked = podcasterBlockedSlots.some((b) => {
      if (b.is_full_day) return true;
      if (!b.start_time || !b.end_time) return false;
      const s = getTimeFloat(b.start_time);
      const e = getTimeFloat(b.end_time);
      return hour >= s && hour < e;
    });
    if (inPodcasterBlocked) return true;

    // Vérifier les heures par défaut bloquées
    if (isInDefaultBlockedRange(hour)) {
      return !isHourUnblocked(hour);
    }

    return false;
  }

  function isHourInsideReservations(hour: number): boolean {
    return dayReservations.some((r) => {
      const s = getHourFloat(r.start_date);
      const e = getHourFloat(r.end_date);
      if (s === null || e === null) return false;
      return hour >= s && hour < e;
    });
  }

  // Vérifie si un intervalle est entièrement couvert par un déblocage
  function isIntervalFullyUnblocked(startHour: number, endHour: number): boolean {
    return unblocks.some((u) => {
      if (!u.start_time || !u.end_time) return false;
      const s = getTimeFloat(u.start_time);
      const e = getTimeFloat(u.end_time);
      return s <= startHour && e >= endHour;
    });
  }

  function doesIntervalOverlapBlocked(startHour: number, endHour: number): boolean {
    // Vérifier les blocages admin
    const adminOverlap = adminBlockedSlots.some((b) => {
      if (b.is_unblock) return false;
      if (b.is_full_day) return true;
      if (!b.start_time || !b.end_time) return false;
      const s = getTimeFloat(b.start_time);
      const e = getTimeFloat(b.end_time);
      return startHour < e && endHour > s;
    });
    if (adminOverlap) return true;

    // Vérifier les blocages podcasteur
    const podcasterOverlap = podcasterBlockedSlots.some((b) => {
      if (b.is_full_day) return true;
      if (!b.start_time || !b.end_time) return false;
      const s = getTimeFloat(b.start_time);
      const e = getTimeFloat(b.end_time);
      return startHour < e && endHour > s;
    });
    if (podcasterOverlap) return true;

    // Vérifier si l'intervalle chevauche les heures par défaut bloquées
    for (const range of defaultBlockedRanges) {
      if (startHour < range.end && endHour > range.start) {
        if (!isIntervalFullyUnblocked(Math.max(startHour, range.start), Math.min(endHour, range.end))) {
          return true;
        }
      }
    }

    return false;
  }

  function doesIntervalOverlap(startHour: number, endHour: number): boolean {
    const reservationConflict = dayReservations.some((r) => {
      const s = getHourFloat(r.start_date);
      const e = getHourFloat(r.end_date);
      if (s === null || e === null) return false;
      return startHour < e && endHour > s;
    });

    const blockedConflict = doesIntervalOverlapBlocked(startHour, endHour);

    return reservationConflict || blockedConflict;
  }

  const disabledStartTimes = useMemo(() => {
    // Tout désactivé tant qu'on n'a pas de date, pack ou podcasteur
    if (!hasSubscription || !selectedDateObject || !selectedPodcaster) return HOURS;

    // Si le jour entier est bloqué
    if (isFullDayBlocked()) return HOURS;

    const disabled: string[] = [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(
      selectedDateObject.getFullYear(),
      selectedDateObject.getMonth(),
      selectedDateObject.getDate()
    );
    const isPastDay = selectedDay < today;

    let minAllowedHour: number | null = null;
    if (!isPastDay && selectedDay.getTime() === today.getTime()) {
      const limit = new Date(now.getTime());
      limit.setHours(limit.getHours() + 2);
      minAllowedHour = limit.getHours();
    }

    for (const hourStr of HOURS) {
      const [h] = hourStr.split(':').map(Number);

      // Jours déjà passés
      if (isPastDay) {
        disabled.push(hourStr);
        continue;
      }

      // Jour courant : on interdit les heures à moins de 2h
      if (minAllowedHour !== null && h < minAllowedHour) {
        disabled.push(hourStr);
        continue;
      }

      // Vérifier si l'heure est dans un blocage
      if (isHourInsideBlocked(h)) {
        disabled.push(hourStr);
        continue;
      }

      // Créneaux déjà réservés
      if (isHourInsideReservations(h)) {
        disabled.push(hourStr);
      }
    }
    return disabled;
  }, [hasSubscription, selectedDateObject, selectedPodcaster, dayReservations, adminBlockedSlots, podcasterBlockedSlots, defaultBlockedRanges, unblocks]);

  const disabledEndTimes = useMemo(() => {
    if (!hasSubscription || !selectedDateObject || !selectedPodcaster || !subStartTime) return [];
    const disabled: string[] = [];

    const [startHour] = subStartTime.split(':').map(Number);
    if (Number.isNaN(startHour)) return [];

    for (const hourStr of HOURS) {
      const [h] = hourStr.split(':').map(Number);
      if (h <= startHour) continue;

      if (doesIntervalOverlap(startHour, h)) {
        disabled.push(hourStr);
      }
    }

    return disabled;
  }, [hasSubscription, selectedDateObject, selectedPodcaster, subStartTime, dayReservations, adminBlockedSlots, podcasterBlockedSlots, defaultBlockedRanges, unblocks]);

  // ====== HEURES DISPONIBLES À AFFICHER (incluant les déblocages exceptionnels) ======
  const availableHours = useMemo(() => {
    // Heures normales d'ouverture (9h-18h)
    const normalHours = new Set<number>();
    for (let h = 9; h <= 18; h++) {
      normalHours.add(h);
    }

    // Ajouter les heures des déblocages exceptionnels
    for (const u of unblocks) {
      if (!u.start_time || !u.end_time) continue;
      const startH = getTimeFloat(u.start_time);
      const endH = getTimeFloat(u.end_time);
      // Ajouter chaque heure entière dans la plage débloquée
      for (let h = Math.floor(startH); h <= Math.floor(endH); h++) {
        if (h >= 0 && h <= 23) {
          normalHours.add(h);
        }
      }
    }

    // Convertir en tableau trié de strings
    return Array.from(normalHours)
      .sort((a, b) => a - b)
      .map(h => `${h.toString().padStart(2, '0')}:00`);
  }, [unblocks]);

  // durée sélectionnée pour le pack
  let aboSelectedHours: number | null = null;
  if (subStartTime && subEndTime) {
    const [sh] = subStartTime.split(':').map(Number);
    const [eh] = subEndTime.split(':').map(Number);
    const diff = eh - sh;
    aboSelectedHours = diff > 0 ? diff : 0;
  }

  function buildDateTime(date: Date, time: string) {
    const [h, m] = time.split(':').map(Number);
    const d = new Date(date);
    d.setHours(h || 0, m || 0, 0, 0);
    return d.toISOString();
  }

 

  // ====== ACTION : CRÉER RÉSERVATION VIA PACK ======
  async function handleCreateSubscriptionReservation() {
    setSubActionError(null);
    setSubActionSuccess(null);

    if (!hasSubscription) {
      setSubActionError(
        "Vous n'avez pas d'heures prépayées actives. Cette action n'est pas disponible."
      );
      return;
    }

    if (!selectedPodcaster) {
      setSubActionError('Merci de sélectionner un podcasteur.');
      return;
    }

    if (!selectedDateObject || !subStartTime || !subEndTime) {
      setSubActionError(
        'Merci de sélectionner une date, une heure de début et une heure de fin.'
      );
      return;
    }

    if (!aboSelectedHours || aboSelectedHours <= 0) {
      setSubActionError('La durée doit être supérieure à 0h.');
      return;
    }

    if (aboSelectedHours > remainingHours) {
      setSubActionError(
        `Vous dépassez votre quota d'heures prépayées. Il vous reste ${remainingHours}h sur ${purchasedHours}h.`
      );
      return;
    }

    setSubActionLoading(true);

    try {
      const start_date = buildDateTime(selectedDateObject, subStartTime);
      const end_date = buildDateTime(selectedDateObject, subEndTime);

      await api.post('/reservations', {
        formula: 'amelioree',
        start_date,
        end_date,
        is_subscription: true,
        podcaster_id: selectedPodcaster.id
      });

      setSubActionSuccess(
        'Votre créneau a bien été réservé et décompté de vos heures prépayées.'
      );
      setSubStartTime('');
      setSubEndTime('');

      // recharger : infos de pack, créneaux du jour et résas
      await Promise.all([
        (async () => {
          try {
            const res = await api.get<SubscriptionInfo>('/subscriptions/me');
            setSubscriptionInfo(res.data);
          } catch (err: any) {
            console.error('Erreur refresh subscription:', err);
          }
        })(),
        (async () => {
          try {
            const res = await api.get<DayReservation[]>(
              `/reservations/day/${getLocalDateKey(selectedDateObject)}`
            );
            setDayReservations(res.data);
          } catch (err: any) {
            console.error('Erreur refresh day reservations:', err);
          }
        })(),
        (async () => {
          try {
            const data = await getMemberReservations();
            setReservations(data as MemberReservationWithSub[]);
          } catch (err: any) {
            console.error('Erreur refresh member reservations:', err);
          }
        })()
      ]);
    } catch (err: any) {
      console.error('Erreur création réservation via pack:', err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Erreur lors de la création de votre réservation.';
      setSubActionError(message);
    } finally {
      setSubActionLoading(false);
    }

  }

  return (
    <div className="member-dashboard">
      <div className="member-dashboard-inner">
        {/* 🔔 MESSAGE FLASH */}
        {flash && <div className="member-flash">{flash}</div>}

        <h2 className="member-dashboard-title">Espace membre</h2>
        <p className="member-dashboard-subtitle">
          Consulte et visualise facilement toutes tes réservations de studio.
        </p>

        {error && <p className="member-error">{error}</p>}
        {loading && <p>Chargement de tes réservations...</p>}

        {!loading && !error && (
          <>
          <div className="member-dashboard-content">
            {/* Calendrier + réservations du jour */}
            <section className="member-calendar-card">
              <div className="member-calendar-header">
                <div className="member-calendar-header-left">
                  <div className="member-calendar-header-left-icon">📅</div>
                  <span>Date des réservations</span>
                </div>
                <div className="member-calendar-header-right">
                  {selectedDateLabel || 'Sélectionne un jour'}
                </div>
              </div>

              {/* Infos pack d'heures */}
              <div className="member-subscription-info">
                {subscriptionLoading && (
                  <p className="member-subscription-text">
                    Chargement de vos heures prépayées...
                  </p>
                )}
                {!subscriptionLoading && subscriptionError && (
                  <p className="member-subscription-text member-subscription-text--error">
                    {subscriptionError}
                  </p>
                )}
                {!subscriptionLoading &&
                  !subscriptionError &&
                  hasSubscription && (
                    <p className="member-subscription-text">
                      Heures prépayées actives : vous avez utilisé{' '}
                      <strong>{usedHours}h</strong> sur{' '}
                      <strong>{purchasedHours}h</strong>. Il vous reste{' '}
                      <strong>{remainingHours}h</strong> à planifier, sans
                      limite de temps.
                    </p>
                  )}
                {!subscriptionLoading &&
                  !subscriptionError &&
                  !hasSubscription && (
                    <p className="member-subscription-text">
                      Vous n&apos;avez pas de pack d&apos;heures actif. Pour
                      réserver un créneau, utilisez le tunnel de réservation.
                    </p>
                  )}
              </div>

              <div className="member-calendar-month-row">
                <button
                  type="button"
                  className="member-calendar-arrow-btn"
                  onClick={handlePreviousMonth}
                >
                  ‹
                </button>
                <div className="member-calendar-month-title">{monthLabel}</div>
                <button
                  type="button"
                  className="member-calendar-arrow-btn"
                  onClick={handleNextMonth}
                >
                  ›
                </button>
              </div>

              <div className="member-calendar-grid">
                <div className="member-calendar-weekday">L</div>
                <div className="member-calendar-weekday">M</div>
                <div className="member-calendar-weekday">M</div>
                <div className="member-calendar-weekday">J</div>
                <div className="member-calendar-weekday">V</div>
                <div className="member-calendar-weekday">S</div>
                <div className="member-calendar-weekday">D</div>

                {calendarCells.map((cell) => (
                  <button
                    key={cell.key}
                    type="button"
                    className={[
                      'member-calendar-day',
                      !cell.date ? 'member-calendar-day--empty' : '',
                      cell.hasReservations
                        ? 'member-calendar-day--has-reservation'
                        : '',
                      cell.isToday ? 'member-calendar-day--today' : '',
                      cell.isSelected ? 'member-calendar-day--selected' : ''
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

              <div className="member-calendar-legend">
                <span className="member-calendar-legend-item">
                  <span className="member-calendar-legend-dot member-calendar-legend-dot--has-reservation" />
                  Jour avec réservation
                </span>
                <span className="member-calendar-legend-item">
                  <span className="member-calendar-legend-dot member-calendar-legend-dot--today" />
                  Aujourd&apos;hui
                </span>
              </div>

              {/* Zone "Réserver avec mes heures prépayées" */}
              {hasSubscription && (
                <div className="member-subscription-reservation">
                  <h4 className="member-subscription-reservation-title">
                    Réserver un créneau avec vos heures prépayées
                  </h4>

                  {/* Sélection du podcasteur */}
                  <div className="member-podcaster-selection">
                    <label className="member-podcaster-label">
                      <User size={18} />
                      <span>Choisissez votre podcasteur :</span>
                    </label>
                    {loadingPodcasters ? (
                      <p className="member-subscription-text">Chargement des podcasteurs...</p>
                    ) : podcasters.length === 0 ? (
                      <p className="member-subscription-text member-subscription-text--error">
                        Aucun podcasteur disponible pour le moment.
                      </p>
                    ) : (
                      <div className="member-podcaster-buttons">
                        {podcasters.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className={`member-podcaster-btn ${selectedPodcaster?.id === p.id ? 'selected' : ''}`}
                            onClick={() => handlePodcasterChange(p.id)}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!selectedPodcaster && (
                    <p className="member-subscription-text">
                      Sélectionnez d&apos;abord un podcasteur ci-dessus.
                    </p>
                  )}

                  {selectedPodcaster && !selectedDateObject && (
                    <p className="member-subscription-text">
                      Sélectionnez maintenant un jour dans le calendrier.
                    </p>
                  )}

                  {selectedPodcaster && selectedDateObject && (
                    <>
                      {slotsLoading && (
                        <p className="member-subscription-text">
                          Chargement des créneaux disponibles...
                        </p>
                      )}
                      {slotsError && (
                        <p className="member-subscription-text member-subscription-text--error">
                          {slotsError}
                        </p>
                      )}

                      <div className="booked-time-inputs">
                        <div className="booked-time-field">
                          <label htmlFor="subStartTime">
                            Heure de début
                          </label>
                          <select
                            id="subStartTime"
                            value={subStartTime}
                            onChange={(e) => {
                              setSubStartTime(e.target.value);
                              setSubEndTime('');
                              setSubActionError(null);
                              setSubActionSuccess(null);
                            }}
                          >
                            <option value="">Sélectionner</option>
                            {availableHours.map((hour) => (
                              <option
                                key={hour}
                                value={hour}
                                disabled={disabledStartTimes.includes(hour)}
                              >
                                {hour}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="booked-time-field">
                          <label htmlFor="subEndTime">Heure de fin</label>
                          <select
                            id="subEndTime"
                            value={subEndTime}
                            onChange={(e) => {
                              setSubEndTime(e.target.value);
                              setSubActionError(null);
                              setSubActionSuccess(null);
                            }}
                            disabled={!subStartTime}
                          >
                            <option value="">Sélectionner</option>
                            {availableHours.filter((hour) => {
                              if (!subStartTime) return true;
                              const [sh] = subStartTime
                                .split(':')
                                .map(Number);
                              const [eh] = hour.split(':').map(Number);
                              return eh > sh;
                            }).map((hour) => (
                              <option
                                key={hour}
                                value={hour}
                                disabled={disabledEndTimes.includes(hour)}
                              >
                                {hour}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {aboSelectedHours !== null && aboSelectedHours > 0 && (
                        <p className="member-subscription-text">
                          Durée sélectionnée :{' '}
                          <strong>{aboSelectedHours}h</strong> – il vous reste{' '}
                          <strong>{remainingHours}h</strong> sur{' '}
                          <strong>{purchasedHours}h</strong> au total.
                        </p>
                      )}

                      {subActionError && (
                        <p className="member-subscription-text member-subscription-text--error">
                          {subActionError}
                        </p>
                      )}
                      {subActionSuccess && (
                        <p className="member-subscription-text member-subscription-text--success">
                          {subActionSuccess}
                        </p>
                      )}

                      <button
                        type="button"
                        className="validation"
                        onClick={handleCreateSubscriptionReservation}
                        disabled={
                          subActionLoading ||
                          !selectedPodcaster ||
                          !selectedDateObject ||
                          !subStartTime ||
                          !subEndTime ||
                          !aboSelectedHours ||
                          aboSelectedHours <= 0 ||
                          remainingHours <= 0
                        }
                      >
                        {subActionLoading
                          ? 'Validation en cours...'
                          : 'Valider ma réservation (heures prépayées)'}
                      </button>
                    </>
                  )}
                </div>
              )}

              {selectedDateKey && (
                <div className="member-selected-day">
                  <h4 className="member-selected-day-title">
                    Réservations du {selectedDateLabel}
                  </h4>
                  {reservationsBySelectedDay.length === 0 && (
                    <p>Aucune réservation pour ce jour.</p>
                  )}
                  {reservationsBySelectedDay.length > 0 && (
                    <ul className="member-reservation-list">
                      {reservationsBySelectedDay.map((r) => (
                        <li key={r.id} className="member-reservation-card">
                          <div className="member-reservation-header">
                            <span className="member-reservation-formula">
                              {getFormulaLabel(r)}
                            </span>
                            <span
                              className={`member-reservation-status ${getStatusClass(
                                r.status
                              )}`}
                            >
                              {r.status}
                            </span>
                          </div>
                          <p className="member-reservation-dates">
                            {formatDateTime(r.start_date)} →{' '}
                            {formatDateTime(r.end_date)}
                          </p>
                          {r.Podcaster && (
                            <p className="member-reservation-podcaster">
                              Avec {r.Podcaster.name}
                            </p>
                          )}
                          <p className="member-reservation-extra">
                            {r.total_hours} h – {r.price_ttc.toFixed(2)} € TTC
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>

            {/* Réservations à venir */}
            <section className="member-upcoming-section">
              <h3 className="member-upcoming-title">Réservations à venir</h3>
              {upcomingReservations.length === 0 && (
                <p className="member-upcoming-empty">
                  Tu n&apos;as pas encore de réservation à venir.
                </p>
              )}

              {upcomingReservations.length > 0 && (
                <ul className="member-reservation-list">
                  {upcomingReservations.map((r) => (
                    <li key={r.id} className="member-reservation-card">
                      <div className="member-reservation-header">
                        <span className="member-reservation-formula">
                          {getFormulaLabel(r)}
                        </span>
                        <span
                          className={`member-reservation-status ${getStatusClass(
                            r.status
                          )}`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="member-reservation-dates">
                        {formatDateTime(r.start_date)} →{' '}
                        {formatDateTime(r.end_date)}
                      </p>
                      {r.Podcaster && (
                        <p className="member-reservation-podcaster">
                          Avec {r.Podcaster.name}
                        </p>
                      )}
                      <p className="member-reservation-extra">
                        {r.total_hours} h – {r.price_ttc.toFixed(2)} € TTC
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
        
          </div>
          <div className="card-more">
            <PasswordCard />
            <Contact />
          </div>
        </>
        )}
      </div>
    </div>
  );
}

export default MemberDashboardPage;

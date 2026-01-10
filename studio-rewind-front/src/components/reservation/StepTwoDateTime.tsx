// StepTwoDateTime.tsx (ou StepTwo.tsx selon ton nom de fichier)
import { useEffect, useMemo, useState } from 'react';
import './StepTwoDateTime.css';
import { Calendar, Clock, User } from 'lucide-react';
import BookingCalendar from './BookingCalendar';
import TimeRangeInputs from './TimerangeInputs';
import api from '../../api/client';
import { getBlockedSlotsForDate, type BlockedSlot } from '../../api/blockedSlots';
import { getPublicPodcasters, getPodcasterBlockedSlotsForDate, getPodcasterFullDayBlocks, type Podcaster, type PodcasterBlockedSlotPublic } from '../../api/podcasters';

import type { FormulaKey, PricingBreakdown, SelectedPodcaster } from '../../pages/ReservationPage';

type DayReservation = {
  id: string;
  formula: string;
  start_date: string;
  end_date: string;
  status: string;
};

const HOURS: string[] = [];
for (let h = 9; h <= 18; h++) {
  HOURS.push(`${h.toString().padStart(2, '0')}:00`);
}

type StepTwoDateTimeProps = {
  formula: FormulaKey; // "autonome" | "amelioree" | "reseaux"
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  startTime: string;
  setStartTime: (value: string) => void;
  endTime: string;
  setEndTime: (value: string) => void;
  selectedPodcaster: SelectedPodcaster | null;
  setSelectedPodcaster: (podcaster: SelectedPodcaster | null) => void;
  onBack: () => void;
  onConfirm: (nextPricing: PricingBreakdown) => void;
};

const StepTwoDateTime = ({
  formula,
  selectedDate,
  setSelectedDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  selectedPodcaster,
  setSelectedPodcaster,
  onBack,
  onConfirm
}: StepTwoDateTimeProps) => {
  const [dayReservations, setDayReservations] = useState<DayReservation[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [podcasterBlockedSlots, setPodcasterBlockedSlots] = useState<PodcasterBlockedSlotPublic[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Liste des podcasteurs disponibles
  const [podcasters, setPodcasters] = useState<Podcaster[]>([]);
  const [loadingPodcasters, setLoadingPodcasters] = useState(true);

  // Dates avec jour entier bloque pour le podcasteur selectionne (pour griser le calendrier)
  const [fullDayBlockedDates, setFullDayBlockedDates] = useState<string[]>([]);

  // Charger les podcasteurs au montage du composant
  useEffect(() => {
    async function loadPodcasters() {
      try {
        setLoadingPodcasters(true);
        const data = await getPublicPodcasters();
        setPodcasters(data);
      } catch (err) {
        console.error('Erreur chargement podcasteurs:', err);
      } finally {
        setLoadingPodcasters(false);
      }
    }
    loadPodcasters();
  }, []);

  // Charger les dates bloquees jour entier quand on selectionne un podcasteur
  useEffect(() => {
    async function loadFullDayBlocks() {
      if (!selectedPodcaster) {
        setFullDayBlockedDates([]);
        return;
      }
      try {
        const dates = await getPodcasterFullDayBlocks(selectedPodcaster.id);
        setFullDayBlockedDates(dates);
      } catch (err) {
        console.error('Erreur chargement dates bloquees:', err);
        setFullDayBlockedDates([]);
      }
    }
    loadFullDayBlocks();
  }, [selectedPodcaster]);

  // Formule Réseaux = durée fixe de 2h
  const isReseaux = formula === 'reseaux';
  const RESEAUX_DURATION = 2; // heures

  // ====== CHARGER LES RÉSA ET BLOCAGES DU JOUR POUR LE PODCASTEUR SÉLECTIONNÉ ======
  useEffect(() => {
    async function loadDayData() {
      if (!selectedDate || !selectedPodcaster) {
        setDayReservations([]);
        setBlockedSlots([]);
        setPodcasterBlockedSlots([]);
        return;
      }

      setSlotsError(null);
      setLoadingSlots(true);

      function getLocalDateKey(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`; // YYYY-MM-DD en LOCAL
      }

      const dateKey = getLocalDateKey(selectedDate);

      try {
        // Charger les réservations du podcasteur, les blocages admin ET les blocages podcasteur en parallèle
        const [reservationsRes, blockedRes, podcasterBlockedRes] = await Promise.all([
          api.get<DayReservation[]>(`/podcasters/${selectedPodcaster.id}/reservations/${dateKey}`),
          getBlockedSlotsForDate(dateKey),
          getPodcasterBlockedSlotsForDate(selectedPodcaster.id, dateKey)
        ]);
        setDayReservations(reservationsRes.data);
        setBlockedSlots(blockedRes);
        setPodcasterBlockedSlots(podcasterBlockedRes);
      } catch (err: any) {
        console.warn('Erreur chargement créneaux du jour:', err);
        setDayReservations([]);
        setBlockedSlots([]);
        setPodcasterBlockedSlots([]);
        setSlotsError(
          "Impossible de récupérer les créneaux réservés pour cette date (tout est affiché comme disponible)."
        );
      } finally {
        setLoadingSlots(false);
      }
    }

    loadDayData();
  }, [selectedDate, selectedPodcaster]);

  // ====== UTILS POUR LES HEURES ======
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
    // Verifier les blocages admin
    const adminFullDay = blockedSlots.some((b) => b.is_full_day);
    // Verifier les blocages podcasteur
    const podcasterFullDay = podcasterBlockedSlots.some((b) => b.is_full_day);
    return adminFullDay || podcasterFullDay;
  }

  // Vérifie si une heure est dans un blocage (admin ou podcasteur)
  function isHourInsideBlocked(hour: number): boolean {
    // Verifier les blocages admin
    const inAdminBlocked = blockedSlots.some((b) => {
      if (b.is_full_day) return true;
      if (!b.start_time || !b.end_time) return false;
      const s = getTimeFloat(b.start_time);
      const e = getTimeFloat(b.end_time);
      return hour >= s && hour < e;
    });

    // Verifier les blocages podcasteur
    const inPodcasterBlocked = podcasterBlockedSlots.some((b) => {
      if (b.is_full_day) return true;
      if (!b.start_time || !b.end_time) return false;
      const s = getTimeFloat(b.start_time);
      const e = getTimeFloat(b.end_time);
      return hour >= s && hour < e;
    });

    return inAdminBlocked || inPodcasterBlocked;
  }

  // Vérifie si un intervalle chevauche un blocage (admin ou podcasteur)
  function doesIntervalOverlapBlocked(startHour: number, endHour: number): boolean {
    // Verifier les blocages admin
    const adminOverlap = blockedSlots.some((b) => {
      if (b.is_full_day) return true;
      if (!b.start_time || !b.end_time) return false;
      const s = getTimeFloat(b.start_time);
      const e = getTimeFloat(b.end_time);
      return startHour < e && endHour > s;
    });

    // Verifier les blocages podcasteur
    const podcasterOverlap = podcasterBlockedSlots.some((b) => {
      if (b.is_full_day) return true;
      if (!b.start_time || !b.end_time) return false;
      const s = getTimeFloat(b.start_time);
      const e = getTimeFloat(b.end_time);
      return startHour < e && endHour > s;
    });

    return adminOverlap || podcasterOverlap;
  }

  function isHourInsideReservations(hour: number): boolean {
    // On regarde si un bloc [hour, hour+1) chevauche une réservation existante
    return dayReservations.some((r) => {
      const s = getHourFloat(r.start_date);
      const e = getHourFloat(r.end_date);
      if (s === null || e === null) return false;
      return hour >= s && hour < e;
    });
  }

  function doesIntervalOverlap(startHour: number, endHour: number): boolean {
    // intervalle [startHour, endHour) vs toutes les résas de la journée ET les blocages
    const reservationConflict = dayReservations.some((r) => {
      const s = getHourFloat(r.start_date);
      const e = getHourFloat(r.end_date);
      if (s === null || e === null) return false;
      return startHour < e && endHour > s;
    });

    const blockedConflict = doesIntervalOverlapBlocked(startHour, endHour);

    return reservationConflict || blockedConflict;
  }

  // ====== HEURES DÉSACTIVÉES ======
  const disabledStartTimes = useMemo(() => {
  // Tant qu'il n'y a pas de date sélectionnée, on bloque tout
  if (!selectedDate) return HOURS;

  // Si le jour entier est bloqué par l'admin, tout est désactivé
  if (isFullDayBlocked()) return HOURS;

  const disabled: string[] = [];

  // On calcule la date du jour (sans l'heure) pour comparer
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const selectedDay = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate()
  );

  const isPastDay = selectedDay < today;

  // Si la date est dans le passé, on désactive toutes les heures
  // (de toute façon le back refusera)
  let minAllowedHour: number | null = null;

  if (!isPastDay && selectedDay.getTime() === today.getTime()) {
    // Jour courant : on impose un délai de 2h minimum avant l'heure choisie
    const limit = new Date(now.getTime());
    limit.setHours(limit.getHours() + 2);
    minAllowedHour = limit.getHours();
  }

  for (const hourStr of HOURS) {
    const [h] = hourStr.split(':').map(Number);

    // Jours déjà passés => tout est bloqué
    if (isPastDay) {
      disabled.push(hourStr);
      continue;
    }

    // Jour courant : on interdit les heures à moins de 2h
    if (minAllowedHour !== null && h < minAllowedHour) {
      disabled.push(hourStr);
      continue;
    }

    // Vérifier si l'heure est dans un blocage admin
    if (isHourInsideBlocked(h)) {
      disabled.push(hourStr);
      continue;
    }

    // Pour la formule Réseaux : vérifier que le créneau de 2h est disponible
    if (isReseaux) {
      // Vérifier que h+2 ne dépasse pas 18h (fermeture)
      if (h + RESEAUX_DURATION > 18) {
        disabled.push(hourStr);
        continue;
      }
      // Vérifier que le créneau [h, h+2) est libre (résas + blocages)
      if (doesIntervalOverlap(h, h + RESEAUX_DURATION)) {
        disabled.push(hourStr);
        continue;
      }
    } else {
      // Créneaux déjà réservés (formules classiques)
      if (isHourInsideReservations(h)) {
        disabled.push(hourStr);
      }
    }
  }

  return disabled;
}, [selectedDate, dayReservations, blockedSlots, podcasterBlockedSlots, isReseaux]);


  const disabledEndTimes = useMemo(() => {
    if (!selectedDate || !startTime) return [];
    const disabled: string[] = [];

    const [startHour] = startTime.split(':').map(Number);
    if (Number.isNaN(startHour)) return [];

    for (const hourStr of HOURS) {
      const [h] = hourStr.split(':').map(Number);
      if (h <= startHour) continue;

      if (doesIntervalOverlap(startHour, h)) {
        disabled.push(hourStr);
      }
    }

    return disabled;
  }, [selectedDate, startTime, dayReservations, blockedSlots, podcasterBlockedSlots]);

  // ====== CALCUL AUTOMATIQUE HEURE DE FIN POUR RÉSEAUX ======
  // Quand on sélectionne une heure de début pour 'reseaux', on calcule automatiquement +2h
  useEffect(() => {
    if (isReseaux && startTime) {
      const [sh] = startTime.split(':').map(Number);
      const calculatedEnd = `${(sh + RESEAUX_DURATION).toString().padStart(2, '0')}:00`;
      if (endTime !== calculatedEnd) {
        setEndTime(calculatedEnd);
      }
    }
  }, [isReseaux, startTime, endTime, setEndTime]);

  // ====== CALCUL HEURES ======
  let bookedHours: number | null = null;
  if (isReseaux && startTime) {
    // Pour Réseaux, c'est toujours 2h
    bookedHours = RESEAUX_DURATION;
  } else if (startTime && endTime) {
    const [sh] = startTime.split(':').map(Number);
    const [eh] = endTime.split(':').map(Number);
    const diff = eh - sh;
    bookedHours = diff > 0 ? diff : 0;
  }

  // ====== TARIFS HT ======
  const TVA_RATE = 0.2;
  let totalHT: number = 0;
  let tvaAmount: number = 0;
  let totalTTC: number = 0;

  if (isReseaux) {
    // Formule Réseaux : prix fixe 1200€ TTC
    totalTTC = 1200;
    totalHT = totalTTC / 1.2;
    tvaAmount = totalTTC - totalHT;
  } else {
    // Formules à l'heure
    let hourlyRateHt: number = 0;
    if (formula === 'autonome') hourlyRateHt = 83.33; // 100 TTC ≈ 83.33 HT
    if (formula === 'amelioree') hourlyRateHt = 250; // 300 TTC = 250 HT

    const safeBookedHours = bookedHours ?? 0;
    totalHT = hourlyRateHt * safeBookedHours;
    tvaAmount = totalHT * TVA_RATE;
    totalTTC = totalHT + tvaAmount;
  }

  const safeBookedHours = bookedHours ?? 0;

  // ====== VALIDATION BOUTON ======
  const canConfirm = isReseaux
    ? selectedPodcaster !== null && selectedDate !== null && startTime !== '' && bookedHours !== null && bookedHours > 0
    : selectedPodcaster !== null && selectedDate !== null && startTime !== '' && endTime !== '' && bookedHours !== null && bookedHours > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;

    const nextPricing: PricingBreakdown = {
      hours: safeBookedHours,
      price_ht: Number(totalHT.toFixed(2)),
      price_tva: Number(tvaAmount.toFixed(2)),
      price_ttc: Number(totalTTC.toFixed(2))
    };

    onConfirm(nextPricing);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setStartTime('');
    setEndTime('');
  };

  const handlePodcasterChange = (podcasterId: string) => {
    const podcaster = podcasters.find(p => p.id === podcasterId);
    if (podcaster) {
      setSelectedPodcaster({ id: podcaster.id, name: podcaster.name });
    } else {
      setSelectedPodcaster(null);
    }
    // Reset les créneaux quand on change de podcasteur
    setStartTime('');
    setEndTime('');
  };

  return (
    <main className="booked-main">
      <h2>Choisir votre podcasteur et votre date</h2>

      {/* Sélection du podcasteur */}
      <div className="podcaster-selection">
        <label className="podcaster-label">
          <User size={18} />
          <span>Choisissez votre podcasteur :</span>
        </label>
        {loadingPodcasters ? (
          <p className="podcaster-loading">Chargement des podcasteurs...</p>
        ) : podcasters.length === 0 ? (
          <p className="podcaster-error">Aucun podcasteur disponible pour le moment.</p>
        ) : (
          <div className="podcaster-buttons">
            {podcasters.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`podcaster-btn ${selectedPodcaster?.id === p.id ? 'selected' : ''}`}
                onClick={() => handlePodcasterChange(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="booked-step2">
        <BookingCalendar value={selectedDate} onChange={handleDateChange} disabledDates={fullDayBlockedDates} />

        <div className="recap">
          {/* RÉCAP EN HAUT : toujours TTC */}
          <div className="recap-price">
            <p>Récapitulatif</p>
            <p className="totalPrice color">€ {totalTTC.toFixed(2)}</p>
          </div>

          {formula && (
            <p>
              Formule choisie : <strong>{formula}</strong>
            </p>
          )}

          <div className="recap-infos">
            {selectedDate && (
              <p className="flex-align">
                <Calendar />
                Date choisie :{' '}
                <strong>{selectedDate.toLocaleDateString('fr-FR')}</strong>
                {startTime && <> à {startTime}h</>}
              </p>
            )}

            {bookedHours !== null && bookedHours > 0 && (
              <p className="flex-align">
                <Clock />
                Durée <strong>{bookedHours}h</strong>
              </p>
            )}
          </div>

          {/* DÉTAIL PRIX */}
          <>
            <div className="recap-infos padding">
              {isReseaux ? (
                <p className="flex-align flex-split">
                  Formule Réseaux (2h + montage){' '}
                  <span>€ {totalHT.toFixed(2)}</span>
                </p>
              ) : (
                <p className="flex-align flex-split">
                  Tournage ({safeBookedHours} heure
                  {safeBookedHours > 1 ? 's' : ''}){' '}
                  <span>€ {totalHT.toFixed(2)}</span>
                </p>
              )}
              <p className="flex-align flex-split small">
                TVA (20%) <span>€ {tvaAmount.toFixed(2)}</span>
              </p>
            </div>
            <p className="flex-align flex-split padding color">
              Total TTC : <strong>€ {totalTTC.toFixed(2)}</strong>
            </p>
          </>

          <div className="slots-status">
            {slotsError && (
              <p className="small-warning">
                {slotsError}
              </p>
            )}

            {!slotsError && loadingSlots && (
              <p className="slots-loading">
                Chargement des créneaux disponibles...
              </p>
            )}
          </div>

          <div className="booked-actions">
            <button
              className={`btn btn-primary ${canConfirm ? 'active' : 'disabled'}`}
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              Confirmer
            </button>

            <button
              type="button"
              className="btn-precedent"
              onClick={onBack}
            >
              Revenir au choix de la formule
            </button>
          </div>
        </div>

        <TimeRangeInputs
          startTime={startTime}
          endTime={endTime}
          onChangeStart={setStartTime}
          onChangeEnd={setEndTime}
          disabledStartTimes={disabledStartTimes}
          disabledEndTimes={disabledEndTimes}
          hideEndTime={isReseaux}
          fixedDurationLabel="Créneau (2h)"
        />
      </div>
    </main>
  );
};

export default StepTwoDateTime;

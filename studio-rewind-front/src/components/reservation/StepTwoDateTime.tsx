// StepTwoDateTime.tsx (ou StepTwo.tsx selon ton nom de fichier)
import { useEffect, useMemo, useState } from 'react';
import './StepTwoDateTime.css';
import { Calendar, Clock, User } from 'lucide-react';
import BookingCalendar from './BookingCalendar';
import TimeRangeInputs from './TimerangeInputs';
import api from '../../api/client';
import {
  getBlockedSlotsForDate,
  getDefaultBlockedHours,
  getUnblocksForDate,
  getStudioSettingsPublic,
  getUnblockDatesForMonth,
  type BlockedSlot,
  type DefaultBlockedRange,
  type StudioSettings
} from '../../api/blockedSlots';
import { getPublicPodcasters, getPodcasterBlockedSlotsForDate, getPodcasterFullDayBlocks, type Podcaster, type PodcasterBlockedSlotPublic } from '../../api/podcasters';
import { getPublicFormulas } from '../../api/formulas';

import type { FormulaKey, PricingBreakdown, SelectedPodcaster } from '../../pages/ReservationPage';

type DayReservation = {
  id: string;
  formula: string;
  start_date: string;
  end_date: string;
  status: string;
};

// Toutes les heures de la journée (0h à 23h)
const HOURS: string[] = [];
for (let h = 0; h <= 23; h++) {
  HOURS.push(`${h.toString().padStart(2, '0')}:00`);
}

type StepTwoDateTimeProps = {
  formula: FormulaKey; // "solo" | "duo" | "pro"
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
  const [defaultBlockedRanges, setDefaultBlockedRanges] = useState<DefaultBlockedRange[]>([]);
  const [studioSettings, setStudioSettings] = useState<StudioSettings | null>(null);
  const [unblocks, setUnblocks] = useState<BlockedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Liste des podcasteurs disponibles
  const [podcasters, setPodcasters] = useState<Podcaster[]>([]);
  const [loadingPodcasters, setLoadingPodcasters] = useState(true);

  // Info sur la formule (pour savoir si elle nécessite un podcasteur et son prix)
  const [requiresPodcaster, setRequiresPodcaster] = useState<boolean>(true);
  const [formulaPrice, setFormulaPrice] = useState<number>(0);
  const [formulaName, setFormulaName] = useState<string>('');

  // Dates avec jour entier bloque pour le podcasteur selectionne (pour griser le calendrier)
  const [fullDayBlockedDates, setFullDayBlockedDates] = useState<string[]>([]);

  // Dates avec ouverture exceptionnelle (pour dégriser les jours normalement fermés)
  const [exceptionalOpenDates, setExceptionalOpenDates] = useState<string[]>([]);

  // Charger les podcasteurs, les heures bloquées par défaut, les paramètres du studio et l'info de la formule au montage
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingPodcasters(true);
        const [podcastersData, defaultHours, settings, formulas] = await Promise.all([
          getPublicPodcasters(),
          getDefaultBlockedHours(),
          getStudioSettingsPublic(),
          getPublicFormulas()
        ]);
        setPodcasters(podcastersData);
        setDefaultBlockedRanges(defaultHours);
        setStudioSettings(settings);

        // Trouver la formule actuelle et récupérer ses infos
        const currentFormula = formulas.find((f) => f.key === formula);
        if (currentFormula) {
          setRequiresPodcaster(currentFormula.requires_podcaster ?? true);
          setFormulaPrice(currentFormula.price_ttc);
          setFormulaName(currentFormula.name);
        }

        // Charger les dates avec ouvertures exceptionnelles pour les 6 prochains mois
        const now = new Date();
        const unblockPromises = [];
        for (let i = 0; i < 6; i++) {
          const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
          unblockPromises.push(getUnblockDatesForMonth(targetDate.getFullYear(), targetDate.getMonth() + 1));
        }
        const unblockResults = await Promise.all(unblockPromises);
        const allUnblockDates = unblockResults.flat();
        setExceptionalOpenDates(allUnblockDates);
      } catch (err) {
        console.error('Erreur chargement données initiales:', err);
      } finally {
        setLoadingPodcasters(false);
      }
    }
    loadInitialData();
  }, [formula]);

  // Charger les dates bloquees jour entier quand on selectionne un podcasteur (si requis)
  useEffect(() => {
    async function loadFullDayBlocks() {
      // Si podcasteur non requis ou non sélectionné, pas de dates bloquées spécifiques
      if (!requiresPodcaster || !selectedPodcaster) {
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
  }, [selectedPodcaster, requiresPodcaster]);

  // Durée fixe de 1h pour toutes les formules
  const FIXED_DURATION = 1; // heure

  // ====== CHARGER LES RÉSA ET BLOCAGES DU JOUR POUR LE PODCASTEUR SÉLECTIONNÉ ======
  useEffect(() => {
    async function loadDayData() {
      // Si podcasteur requis mais non sélectionné, ou si pas de date : pas de chargement
      if (!selectedDate || (requiresPodcaster && !selectedPodcaster)) {
        setDayReservations([]);
        setBlockedSlots([]);
        setPodcasterBlockedSlots([]);
        setUnblocks([]);
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
        // Charger les réservations, blocages admin, blocages podcasteur (si requis) ET déblocages en parallèle
        const promises: Promise<any>[] = [
          api.get<DayReservation[]>(`/reservations/day/${dateKey}`),
          getBlockedSlotsForDate(dateKey),
          getUnblocksForDate(dateKey)
        ];

        // Ajouter le chargement des blocages podcasteur seulement si requis et sélectionné
        if (requiresPodcaster && selectedPodcaster) {
          promises.push(getPodcasterBlockedSlotsForDate(selectedPodcaster.id, dateKey));
        }

        const results = await Promise.all(promises);
        setDayReservations(results[0].data);
        setBlockedSlots(results[1]);
        setUnblocks(results[2]);
        setPodcasterBlockedSlots(requiresPodcaster && selectedPodcaster ? results[3] : []);
      } catch (err: any) {
        console.warn('Erreur chargement créneaux du jour:', err);
        setDayReservations([]);
        setBlockedSlots([]);
        setPodcasterBlockedSlots([]);
        setUnblocks([]);
        setSlotsError(
          "Impossible de récupérer les créneaux réservés pour cette date (tout est affiché comme disponible)."
        );
      } finally {
        setLoadingSlots(false);
      }
    }

    loadDayData();
  }, [selectedDate, selectedPodcaster, requiresPodcaster]);

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

  // Vérifie si une heure est dans les plages bloquées par défaut (0-9h et 18-24h)
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

  // Vérifie si une heure est dans un blocage (admin, podcasteur, ou heures par défaut)
  function isHourInsideBlocked(hour: number): boolean {
    // Vérifier les blocages admin (sauf les unblocks)
    const inAdminBlocked = blockedSlots.some((b) => {
      if (b.is_unblock) return false; // Ignorer les unblocks ici
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

    // Vérifier les heures par défaut bloquées (0-9h et 18-24h)
    if (isInDefaultBlockedRange(hour)) {
      // Sauf si cette heure est débloquée
      return !isHourUnblocked(hour);
    }

    return false;
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

  // Vérifie si un intervalle chevauche un blocage (admin, podcasteur, ou heures par défaut)
  function doesIntervalOverlapBlocked(startHour: number, endHour: number): boolean {
    // Vérifier les blocages admin (sauf unblocks)
    const adminOverlap = blockedSlots.some((b) => {
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
        // L'intervalle chevauche une plage bloquée par défaut
        // Vérifier si cette partie est entièrement débloquée
        if (!isIntervalFullyUnblocked(Math.max(startHour, range.start), Math.min(endHour, range.end))) {
          return true;
        }
      }
    }

    return false;
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

    // Vérifier que le créneau de 1h est disponible
    // Vérifier que h+1 ne dépasse pas 24h
    if (h + FIXED_DURATION > 24) {
      disabled.push(hourStr);
      continue;
    }
    // Vérifier que le créneau [h, h+1) est libre (résas + blocages)
    if (doesIntervalOverlap(h, h + FIXED_DURATION)) {
      disabled.push(hourStr);
      continue;
    }
  }

  return disabled;
}, [selectedDate, dayReservations, blockedSlots, podcasterBlockedSlots, defaultBlockedRanges, unblocks]);


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
  }, [selectedDate, startTime, dayReservations, blockedSlots, podcasterBlockedSlots, defaultBlockedRanges, unblocks]);

  // ====== JOURS FERMÉS DE LA SEMAINE ======
  const closedDaysOfWeek = useMemo(() => {
    if (!studioSettings || !studioSettings.open_days) return [];
    // open_days contient les jours ouverts (1=Lundi, ..., 7=Dimanche)
    // On doit retourner les jours FERMÉS
    const allDays = [1, 2, 3, 4, 5, 6, 7];
    return allDays.filter(d => !studioSettings.open_days.includes(d));
  }, [studioSettings]);

  // ====== HEURES DISPONIBLES À AFFICHER (incluant les déblocages exceptionnels) ======
  const availableHours = useMemo(() => {
    // Heures normales d'ouverture basées sur les paramètres du studio
    const normalHours = new Set<number>();

    // Récupérer les heures d'ouverture et de fermeture
    let openingHour = 9;
    let closingHour = 18;

    if (studioSettings) {
      const openTime = studioSettings.opening_time || '09:00';
      const closeTime = studioSettings.closing_time || '18:00';
      openingHour = parseInt(openTime.split(':')[0], 10);
      closingHour = parseInt(closeTime.split(':')[0], 10);
    }

    for (let h = openingHour; h <= closingHour; h++) {
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
  }, [unblocks, studioSettings]);

  // ====== CALCUL AUTOMATIQUE HEURE DE FIN (TOUJOURS +1h) ======
  useEffect(() => {
    if (startTime) {
      const [sh] = startTime.split(':').map(Number);
      const calculatedEnd = `${(sh + FIXED_DURATION).toString().padStart(2, '0')}:00`;
      if (endTime !== calculatedEnd) {
        setEndTime(calculatedEnd);
      }
    }
  }, [startTime, endTime, setEndTime]);

  // ====== CALCUL HEURES (toujours 1h) ======
  let bookedHours: number | null = null;
  if (startTime) {
    bookedHours = FIXED_DURATION;
  }

  // ====== TARIFS HT ======
  const TVA_RATE = 0.2;

  // Prix HT de la formule (depuis la BDD)
  const totalHT = formulaPrice;
  const tvaAmount = totalHT * TVA_RATE;
  const totalTTC = totalHT + tvaAmount;

  const safeBookedHours = bookedHours ?? 0;

  // ====== VALIDATION BOUTON ======
  const podcasterValid = !requiresPodcaster || selectedPodcaster !== null;
  const canConfirm = podcasterValid && selectedDate !== null && startTime !== '' && bookedHours !== null && bookedHours > 0;

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
      <h2 style={{ marginBottom: '2rem' }}>
        {requiresPodcaster ? 'Choisir votre podcasteur et votre date' : 'Choisir votre date'}
      </h2>

      {/* Sélection du podcasteur (si requis par la formule) */}
      {requiresPodcaster && (
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
      )}

      <div className="booked-step2">
        <BookingCalendar value={selectedDate} onChange={handleDateChange} disabledDates={fullDayBlockedDates} closedDaysOfWeek={closedDaysOfWeek} exceptionalOpenDates={exceptionalOpenDates} />

        <div className="recap">
          {/* RÉCAP EN HAUT : toujours TTC */}
          <div className="recap-price">
            <p>Récapitulatif</p>
            <p className="totalPrice color">€ {totalTTC.toFixed(2)}</p>
          </div>

          {formula && (
            <p>
              Formule choisie : <strong>{formulaName || formula}</strong>
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
              <p className="flex-align flex-split">
                {formulaName || formula} (1h){' '}
                <span>€ {totalHT.toFixed(2)} HT</span>
              </p>
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
          hideEndTime={true}
          fixedDurationLabel="Créneau (1h)"
          availableHours={availableHours}
        />
      </div>
    </main>
  );
};

export default StepTwoDateTime;

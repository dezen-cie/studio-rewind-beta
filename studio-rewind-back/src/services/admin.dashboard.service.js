// src/services/admin.dashboard.service.js
import { Op } from 'sequelize';
import { Reservation, Subscription, User, BlockedSlot, Podcaster } from '../models/index.js';

function getDayRange(date = new Date()) {
  const d = new Date(date);
  const start = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    0,
    0,
    0
  );
  const end = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    23,
    59,
    59
  );
  return { start, end };
}

function getNext48hRange(fromDate = new Date()) {
  const d = new Date(fromDate);
  // Fin du jour sélectionné
  const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  // 48h après la fin du jour
  const end = new Date(dayEnd.getTime() + 48 * 60 * 60 * 1000);
  return { start: dayEnd, end };
}

function getMonthRange(date = new Date()) {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export async function getDashboardSummary(selectedDate = null) {
  const targetDate = selectedDate ? new Date(selectedDate) : new Date();
  const { start: startDay, end: endDay } = getDayRange(targetDate);
  const { start: startMonth, end: endMonth } = getMonthRange(targetDate);

  const whereBaseReservations = {
    status: 'confirmed',
    is_subscription: false
  };

  const [
    reservationsToday,
    reservationsMonth,
    subscriptionsToday,
    subscriptionsMonth,
    resCount,
    subCount
  ] = await Promise.all([
    // CA réservations du jour
    Reservation.sum('price_ttc', {
      where: {
        ...whereBaseReservations,
        start_date: {
          [Op.between]: [startDay, endDay]
        }
      }
    }),

    // CA réservations du mois
    Reservation.sum('price_ttc', {
      where: {
        ...whereBaseReservations,
        start_date: { [Op.between]: [startMonth, endMonth] }
      }
    }),

    // CA packs d'heures vendus aujourd'hui (legacy)
    Subscription.sum('price_ttc', {
      where: {
        paid_at: {
          [Op.between]: [startDay, endDay]
        }
      }
    }),

    // CA packs d'heures vendus ce mois-ci (legacy)
    Subscription.sum('price_ttc', {
      where: {
        paid_at: {
          [Op.between]: [startMonth, endMonth]
        }
      }
    }),

    // Pour vérifier réellement les lignes en base
    Reservation.count(),
    Subscription.count()
  ]);

  const todayRevenue =
    Number(reservationsToday || 0) + Number(subscriptionsToday || 0);
  const monthRevenue =
    Number(reservationsMonth || 0) + Number(subscriptionsMonth || 0);

  return {
    today_revenue_ttc: todayRevenue,
    month_revenue_ttc: monthRevenue
  };
}

/**
 * Récupère les réservations du jour avec les infos utilisateur
 */
export async function getDayReservations(selectedDate = null) {
  const targetDate = selectedDate ? new Date(selectedDate) : new Date();
  const { start, end } = getDayRange(targetDate);

  const reservations = await Reservation.findAll({
    where: {
      status: { [Op.ne]: 'cancelled' },
      start_date: { [Op.between]: [start, end] }
    },
    include: [
      {
        model: User,
        attributes: ['id', 'email', 'firstname', 'lastname', 'company_name']
      },
      {
        model: Podcaster,
        as: 'podcaster',
        attributes: ['id', 'name']
      }
    ],
    order: [['start_date', 'ASC']]
  });

  return reservations;
}

/**
 * Récupère les réservations des prochaines 48h (hors le jour sélectionné pour éviter les doublons)
 */
export async function getUpcomingReservations(selectedDate = null) {
  const targetDate = selectedDate ? new Date(selectedDate) : new Date();
  const { end: dayEnd } = getDayRange(targetDate);
  const { end: next48hEnd } = getNext48hRange(targetDate);

  // On prend après le jour sélectionné jusqu'à 48h
  const reservations = await Reservation.findAll({
    where: {
      status: { [Op.ne]: 'cancelled' },
      start_date: { [Op.between]: [dayEnd, next48hEnd] }
    },
    include: [
      {
        model: User,
        attributes: ['id', 'email', 'firstname', 'lastname', 'company_name']
      },
      {
        model: Podcaster,
        as: 'podcaster',
        attributes: ['id', 'name']
      }
    ],
    order: [['start_date', 'ASC']],
    limit: 10
  });

  return reservations;
}

/**
 * Récupère les dates qui ont des réservations pour un mois donné
 * Retourne un tableau de dates au format 'YYYY-MM-DD'
 */
export async function getMonthReservationDays(year, month) {
  const start = new Date(year, month, 1, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  const reservations = await Reservation.findAll({
    where: {
      status: { [Op.ne]: 'cancelled' },
      start_date: { [Op.between]: [start, end] }
    },
    attributes: ['start_date']
  });

  // Extraire les dates uniques
  const daysSet = new Set();
  for (const r of reservations) {
    const d = new Date(r.start_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    daysSet.add(key);
  }

  return Array.from(daysSet);
}

export async function getDayOccupancyRate(selectedDate = null) {
  const targetDate = selectedDate ? new Date(selectedDate) : new Date();
  const { start, end } = getDayRange(targetDate);

  // Heures d'ouverture par défaut
  const DEFAULT_START = 9;
  const DEFAULT_END = 18;

  // Récupérer les réservations du jour
  const reservations = await Reservation.findAll({
    where: {
      status: { [Op.ne]: 'cancelled' },
      start_date: { [Op.between]: [start, end] }
    },
    attributes: ['start_date', 'end_date', 'total_hours']
  });

  // Récupérer les blocages du jour (utiliser la date locale, pas UTC)
  const todayStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
  const blockedSlots = await BlockedSlot.findAll({
    where: { date: todayStr }
  });

  // Séparer les blocages et les déblocages (créneaux exceptionnels)
  const blockSlots = blockedSlots.filter(b => !b.is_unblock);
  const unblockSlots = blockedSlots.filter(b => b.is_unblock);

  // Calculer les heures étendues grâce aux déblocages (créneaux exceptionnels)
  let effectiveStart = DEFAULT_START;
  let effectiveEnd = DEFAULT_END;
  let extraHours = 0;

  for (const unblock of unblockSlots) {
    if (unblock.start_time && unblock.end_time) {
      const [sh, sm] = unblock.start_time.split(':').map(Number);
      const [eh, em] = unblock.end_time.split(':').map(Number);
      const unblockStart = sh + sm / 60;
      const unblockEnd = eh + em / 60;

      // Si le déblocage est avant l'heure d'ouverture par défaut
      if (unblockStart < DEFAULT_START) {
        effectiveStart = Math.min(effectiveStart, unblockStart);
        extraHours += Math.min(DEFAULT_START, unblockEnd) - unblockStart;
      }
      // Si le déblocage est après l'heure de fermeture par défaut
      if (unblockEnd > DEFAULT_END) {
        effectiveEnd = Math.max(effectiveEnd, unblockEnd);
        extraHours += unblockEnd - Math.max(DEFAULT_END, unblockStart);
      }
    }
  }

  // Heures totales disponibles = heures par défaut + heures exceptionnelles
  const BASE_HOURS = DEFAULT_END - DEFAULT_START;
  const totalAvailableHours = BASE_HOURS + extraHours;

  // Calculer les heures réservées
  const bookedHours = reservations.reduce((acc, r) => acc + (r.total_hours || 0), 0);

  // Calculer les heures bloquées (pendant les heures d'ouverture effectives)
  let blockedHours = 0;
  let isFullDayBlocked = false;

  for (const block of blockSlots) {
    if (block.is_full_day) {
      blockedHours = totalAvailableHours;
      isFullDayBlocked = true;
      break;
    } else if (block.start_time && block.end_time) {
      const [sh, sm] = block.start_time.split(':').map(Number);
      const [eh, em] = block.end_time.split(':').map(Number);
      const blockStart = Math.max(sh + sm / 60, effectiveStart);
      const blockEnd = Math.min(eh + em / 60, effectiveEnd);
      if (blockEnd > blockStart) {
        blockedHours += blockEnd - blockStart;
      }
    }
  }

  // Total des heures disponibles après blocages
  const netAvailableHours = Math.max(totalAvailableHours - blockedHours, 0);

  // Taux d'occupation = heures réservées / heures disponibles nettes
  const occupancyRate = netAvailableHours > 0
    ? (bookedHours / netAvailableHours) * 100
    : 0;

  return {
    // Heures effectives d'ouverture (pour la timeline)
    effective_start: effectiveStart,
    effective_end: effectiveEnd,
    // Statistiques
    total_available_hours: totalAvailableHours,
    booked_hours: bookedHours,
    blocked_hours: blockedHours,
    available_hours: Math.max(netAvailableHours - bookedHours, 0),
    occupancy_rate: Math.round(Math.min(occupancyRate, 100)),
    is_full_day_blocked: isFullDayBlocked
  };
}

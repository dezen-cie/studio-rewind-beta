// src/services/admin.dashboard.service.js
import { Op } from 'sequelize';
import { Reservation, Subscription, User, BlockedSlot } from '../models/index.js';

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
    // CA réservations du jour (hors abonnement)
    Reservation.sum('price_ttc', {
      where: {
        ...whereBaseReservations,
        start_date: {
          [Op.between]: [startDay, endDay]
        }
      }
    }),

    // CA réservations du mois (hors abonnement)
    Reservation.sum('price_ttc', {
      where: {
        ...whereBaseReservations,
        start_date: { [Op.between]: [startMonth, endMonth] }
      }
    }),

    // CA abonnements vendus aujourd'hui
    Subscription.sum('price_ttc', {
      where: {
        paid_at: {
          [Op.between]: [startDay, endDay]
        }
      }
    }),

    // CA abonnements vendus ce mois-ci
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

  console.log('DASHBOARD DEBUG', {
    startDay,
    endDay,
    startMonth,
    endMonth,
    resCount,
    subCount,
    reservationsToday: reservationsToday || 0,
    reservationsMonth: reservationsMonth || 0,
    subscriptionsToday: subscriptionsToday || 0,
    subscriptionsMonth: subscriptionsMonth || 0,
    todayRevenue,
    monthRevenue
  });

  return {
    today_revenue_ttc: todayRevenue,
    month_revenue_ttc: monthRevenue
  };
}

/**
 * Récupère les réservations du jour avec les infos utilisateur
 * Exclut les achats de pack (formula = 'abonnement') car ils n'occupent pas le studio
 */
export async function getDayReservations(selectedDate = null) {
  const targetDate = selectedDate ? new Date(selectedDate) : new Date();
  const { start, end } = getDayRange(targetDate);

  const reservations = await Reservation.findAll({
    where: {
      status: { [Op.ne]: 'cancelled' },
      start_date: { [Op.between]: [start, end] },
      // Exclure les achats de pack (formula = 'abonnement') car ils n'occupent pas le studio
      formula: { [Op.ne]: 'abonnement' }
    },
    include: [
      {
        model: User,
        attributes: ['id', 'email', 'firstname', 'lastname', 'company_name']
      }
    ],
    order: [['start_date', 'ASC']]
  });

  return reservations;
}

/**
 * Récupère les réservations des prochaines 48h (hors le jour sélectionné pour éviter les doublons)
 * Exclut les achats de pack (formula = 'abonnement')
 */
export async function getUpcomingReservations(selectedDate = null) {
  const targetDate = selectedDate ? new Date(selectedDate) : new Date();
  const { end: dayEnd } = getDayRange(targetDate);
  const { end: next48hEnd } = getNext48hRange(targetDate);

  // On prend après le jour sélectionné jusqu'à 48h
  const reservations = await Reservation.findAll({
    where: {
      status: { [Op.ne]: 'cancelled' },
      start_date: { [Op.between]: [dayEnd, next48hEnd] },
      // Exclure les achats de pack
      formula: { [Op.ne]: 'abonnement' }
    },
    include: [
      {
        model: User,
        attributes: ['id', 'email', 'firstname', 'lastname', 'company_name']
      }
    ],
    order: [['start_date', 'ASC']],
    limit: 10
  });

  return reservations;
}

/**
 * Calcule le taux d'occupation du studio pour un jour donné
 * Heures d'ouverture : 9h - 18h = 9 heures disponibles
 */
/**
 * Récupère les dates qui ont des réservations pour un mois donné
 * Retourne un tableau de dates au format 'YYYY-MM-DD'
 * Exclut les achats de pack (formula = 'abonnement')
 */
export async function getMonthReservationDays(year, month) {
  const start = new Date(year, month, 1, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  const reservations = await Reservation.findAll({
    where: {
      status: { [Op.ne]: 'cancelled' },
      start_date: { [Op.between]: [start, end] },
      // Exclure les achats de pack
      formula: { [Op.ne]: 'abonnement' }
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
  const STUDIO_HOURS = 9; // 9h à 18h = 9 heures

  // Récupérer les réservations du jour (exclure les achats de pack)
  const reservations = await Reservation.findAll({
    where: {
      status: { [Op.ne]: 'cancelled' },
      start_date: { [Op.between]: [start, end] },
      // Exclure les achats de pack (formula = 'abonnement') car ils n'occupent pas le studio
      formula: { [Op.ne]: 'abonnement' }
    },
    attributes: ['start_date', 'end_date', 'total_hours']
  });

  // Récupérer les blocages du jour
  const todayStr = start.toISOString().split('T')[0];
  const blockedSlots = await BlockedSlot.findAll({
    where: { date: todayStr }
  });

  // Calculer les heures réservées
  const bookedHours = reservations.reduce((acc, r) => acc + (r.total_hours || 0), 0);

  // Calculer les heures bloquées
  let blockedHours = 0;
  for (const block of blockedSlots) {
    if (block.is_full_day) {
      blockedHours = STUDIO_HOURS;
      break;
    } else if (block.start_time && block.end_time) {
      const [sh, sm] = block.start_time.split(':').map(Number);
      const [eh, em] = block.end_time.split(':').map(Number);
      blockedHours += (eh + em / 60) - (sh + sm / 60);
    }
  }

  // Total des heures occupées (réservations + blocages)
  const totalOccupiedHours = Math.min(bookedHours + blockedHours, STUDIO_HOURS);
  const occupancyRate = (totalOccupiedHours / STUDIO_HOURS) * 100;

  return {
    studio_hours: STUDIO_HOURS,
    booked_hours: bookedHours,
    blocked_hours: blockedHours,
    available_hours: Math.max(STUDIO_HOURS - totalOccupiedHours, 0),
    occupancy_rate: Math.round(occupancyRate)
  };
}

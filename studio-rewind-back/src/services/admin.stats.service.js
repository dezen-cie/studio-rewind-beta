// src/services/admin.stats.service.js
import { Op, fn, col, literal } from 'sequelize';
import { Reservation, User, Podcaster, Formula, Subscription } from '../models/index.js';
import { getOpeningHours, isDayOpen } from './studioSettings.service.js';

/**
 * Obtenir les statistiques globales pour une période
 */
export async function getStatsOverview(startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const whereBase = {
    status: 'confirmed',
    is_subscription: false,
    start_date: { [Op.between]: [start, end] }
  };

  const [
    totalRevenue,
    totalReservations,
    totalHours,
    subscriptionsRevenue
  ] = await Promise.all([
    // CA des réservations
    Reservation.sum('price_ttc', { where: whereBase }),
    // Nombre de réservations
    Reservation.count({ where: whereBase }),
    // Total heures réservées
    Reservation.sum('total_hours', { where: whereBase }),
    // CA des packs d'heures (subscriptions)
    Subscription.sum('price_ttc', {
      where: {
        paid_at: { [Op.between]: [start, end] }
      }
    })
  ]);

  // Calculer le taux de remplissage sur la période
  const occupancyRate = await calculatePeriodOccupancy(start, end);

  return {
    total_revenue_ttc: Number(totalRevenue || 0) + Number(subscriptionsRevenue || 0),
    reservations_revenue_ttc: Number(totalRevenue || 0),
    subscriptions_revenue_ttc: Number(subscriptionsRevenue || 0),
    total_reservations: totalReservations || 0,
    total_hours: Number(totalHours || 0),
    occupancy_rate: occupancyRate
  };
}

/**
 * Calculer le taux de remplissage moyen sur une période
 */
async function calculatePeriodOccupancy(start, end) {
  const openingHours = await getOpeningHours();
  const hoursPerDay = openingHours.closing_hour - openingHours.opening_hour;

  let totalAvailableHours = 0;
  let totalBookedHours = 0;

  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    const dayIsOpen = await isDayOpen(dayOfWeek);

    if (dayIsOpen) {
      totalAvailableHours += hoursPerDay;

      // Récupérer les heures réservées pour ce jour
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayHours = await Reservation.sum('total_hours', {
        where: {
          status: 'confirmed',
          is_subscription: false,
          start_date: { [Op.between]: [dayStart, dayEnd] }
        }
      });

      totalBookedHours += Number(dayHours || 0);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return totalAvailableHours > 0
    ? Math.round((totalBookedHours / totalAvailableHours) * 100)
    : 0;
}

/**
 * Obtenir l'évolution du CA par jour/semaine/mois
 */
export async function getRevenueEvolution(startDate, endDate, groupBy = 'day') {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  let dateFormat;
  switch (groupBy) {
    case 'week':
      dateFormat = literal("TO_CHAR(start_date, 'IYYY-IW')");
      break;
    case 'month':
      dateFormat = literal("TO_CHAR(start_date, 'YYYY-MM')");
      break;
    default: // day
      dateFormat = literal("TO_CHAR(start_date, 'YYYY-MM-DD')");
  }

  const results = await Reservation.findAll({
    attributes: [
      [dateFormat, 'period'],
      [fn('SUM', col('price_ttc')), 'revenue'],
      [fn('COUNT', col('id')), 'count']
    ],
    where: {
      status: 'confirmed',
      is_subscription: false,
      start_date: { [Op.between]: [start, end] }
    },
    group: [dateFormat],
    order: [[dateFormat, 'ASC']],
    raw: true
  });

  return results.map(r => ({
    period: r.period,
    revenue: Number(r.revenue || 0),
    count: Number(r.count || 0)
  }));
}

/**
 * Obtenir les top clients par CA
 */
export async function getTopClients(startDate, endDate, limit = 10) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const results = await Reservation.findAll({
    attributes: [
      'user_id',
      [fn('SUM', col('Reservation.price_ttc')), 'total_revenue'],
      [fn('COUNT', col('Reservation.id')), 'reservations_count'],
      [fn('SUM', col('Reservation.total_hours')), 'total_hours']
    ],
    where: {
      status: 'confirmed',
      is_subscription: false,
      start_date: { [Op.between]: [start, end] }
    },
    include: [{
      model: User,
      attributes: ['id', 'email', 'firstname', 'lastname', 'company_name', 'account_type']
    }],
    group: ['user_id', 'User.id'],
    order: [[fn('SUM', col('Reservation.price_ttc')), 'DESC']],
    limit,
    raw: false
  });

  return results.map(r => {
    const user = r.User;
    let displayName = user?.email || 'Inconnu';
    if (user?.account_type === 'professionnel' && user?.company_name) {
      displayName = user.company_name;
    } else if (user?.firstname || user?.lastname) {
      displayName = `${user.firstname || ''} ${user.lastname || ''}`.trim();
    }

    return {
      user_id: r.user_id,
      display_name: displayName,
      email: user?.email,
      account_type: user?.account_type,
      total_revenue: Number(r.dataValues.total_revenue || 0),
      reservations_count: Number(r.dataValues.reservations_count || 0),
      total_hours: Number(r.dataValues.total_hours || 0)
    };
  });
}

/**
 * Obtenir le CA par formule
 */
export async function getRevenueByFormula(startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const results = await Reservation.findAll({
    attributes: [
      'formula',
      [fn('SUM', col('price_ttc')), 'total_revenue'],
      [fn('COUNT', col('id')), 'reservations_count'],
      [fn('SUM', col('total_hours')), 'total_hours']
    ],
    where: {
      status: 'confirmed',
      is_subscription: false,
      start_date: { [Op.between]: [start, end] }
    },
    group: ['formula'],
    order: [[fn('SUM', col('price_ttc')), 'DESC']],
    raw: true
  });

  // Récupérer les noms des formules
  const formulas = await Formula.findAll({
    attributes: ['key', 'name'],
    raw: true
  });
  const formulaNames = {};
  for (const f of formulas) {
    formulaNames[f.key] = f.name;
  }

  return results.map(r => ({
    formula_key: r.formula,
    formula_name: formulaNames[r.formula] || r.formula,
    total_revenue: Number(r.total_revenue || 0),
    reservations_count: Number(r.reservations_count || 0),
    total_hours: Number(r.total_hours || 0)
  }));
}

/**
 * Obtenir les sessions par podcasteur
 */
export async function getSessionsByPodcaster(startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const results = await Reservation.findAll({
    attributes: [
      'podcaster_id',
      [fn('COUNT', col('Reservation.id')), 'sessions_count'],
      [fn('SUM', col('Reservation.total_hours')), 'total_hours'],
      [fn('SUM', col('Reservation.price_ttc')), 'total_revenue']
    ],
    where: {
      status: 'confirmed',
      is_subscription: false,
      podcaster_id: { [Op.ne]: null },
      start_date: { [Op.between]: [start, end] }
    },
    include: [{
      model: Podcaster,
      as: 'podcaster',
      attributes: ['id', 'name', 'photo_url']
    }],
    group: ['podcaster_id', 'podcaster.id'],
    order: [[fn('COUNT', col('Reservation.id')), 'DESC']],
    raw: false
  });

  return results.map(r => ({
    podcaster_id: r.podcaster_id,
    podcaster_name: r.podcaster?.name || 'Non assigné',
    podcaster_photo: r.podcaster?.photo_url || null,
    sessions_count: Number(r.dataValues.sessions_count || 0),
    total_hours: Number(r.dataValues.total_hours || 0),
    total_revenue: Number(r.dataValues.total_revenue || 0)
  }));
}

/**
 * Comparer deux périodes
 */
export async function comparePeriods(currentStart, currentEnd, previousStart, previousEnd) {
  const [current, previous] = await Promise.all([
    getStatsOverview(currentStart, currentEnd),
    getStatsOverview(previousStart, previousEnd)
  ]);

  const calculateChange = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return {
    current,
    previous,
    changes: {
      revenue: calculateChange(current.total_revenue_ttc, previous.total_revenue_ttc),
      reservations: calculateChange(current.total_reservations, previous.total_reservations),
      hours: calculateChange(current.total_hours, previous.total_hours),
      occupancy: calculateChange(current.occupancy_rate, previous.occupancy_rate)
    }
  };
}

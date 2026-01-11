// src/services/podcasterRevenue.service.js
import { Op } from 'sequelize';
import { Reservation, Podcaster } from '../models/index.js';

/**
 * Récupère le chiffre d'affaires par podcasteur pour un mois donné
 * @param {number} year - Année
 * @param {number} month - Mois (1-12)
 * @returns {Promise<Array>} Liste des podcasteurs avec leur CA
 */
export async function getPodcastersRevenueByMonth(year, month) {
  // Calculer les dates de début et fin du mois
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Récupérer tous les podcasteurs
  const podcasters = await Podcaster.findAll({
    where: { is_active: true },
    order: [['display_order', 'ASC']]
  });

  // Pour chaque podcasteur, calculer le CA du mois
  const results = await Promise.all(
    podcasters.map(async (podcaster) => {
      // Récupérer les réservations confirmées du podcasteur pour ce mois
      const reservations = await Reservation.findAll({
        where: {
          podcaster_id: podcaster.id,
          status: 'confirmed',
          start_date: {
            [Op.gte]: startDate,
            [Op.lte]: endDate
          }
        }
      });

      // Calculer le CA total
      const totalRevenue = reservations.reduce((sum, r) => sum + (r.price_ttc || 0), 0);
      const totalReservations = reservations.length;
      const totalHours = reservations.reduce((sum, r) => sum + (r.total_hours || 0), 0);

      // Calculer les 20%
      const commission = totalRevenue * 0.20;

      return {
        podcaster_id: podcaster.id,
        podcaster_name: podcaster.name,
        total_revenue: Math.round(totalRevenue * 100) / 100,
        commission_20: Math.round(commission * 100) / 100,
        total_reservations: totalReservations,
        total_hours: Math.round(totalHours * 100) / 100
      };
    })
  );

  // Calculer les totaux globaux
  const globalTotal = results.reduce((sum, r) => sum + r.total_revenue, 0);
  const globalCommission = results.reduce((sum, r) => sum + r.commission_20, 0);
  const globalReservations = results.reduce((sum, r) => sum + r.total_reservations, 0);
  const globalHours = results.reduce((sum, r) => sum + r.total_hours, 0);

  return {
    year,
    month,
    podcasters: results,
    totals: {
      total_revenue: Math.round(globalTotal * 100) / 100,
      total_commission: Math.round(globalCommission * 100) / 100,
      total_reservations: globalReservations,
      total_hours: Math.round(globalHours * 100) / 100
    }
  };
}

/**
 * Récupère les mois disponibles (mois avec au moins une réservation)
 * @returns {Promise<Array>} Liste des mois disponibles
 */
export async function getAvailableMonths() {
  const reservations = await Reservation.findAll({
    where: { status: 'confirmed' },
    attributes: ['start_date'],
    order: [['start_date', 'DESC']]
  });

  // Extraire les mois uniques
  const monthsSet = new Set();
  reservations.forEach((r) => {
    const date = new Date(r.start_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(key);
  });

  // Convertir en tableau et trier
  const months = Array.from(monthsSet)
    .map((key) => {
      const [year, month] = key.split('-');
      return { year: parseInt(year), month: parseInt(month) };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

  // Ajouter le mois courant s'il n'existe pas
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (!monthsSet.has(currentKey)) {
    months.unshift({ year: now.getFullYear(), month: now.getMonth() + 1 });
  }

  return months;
}

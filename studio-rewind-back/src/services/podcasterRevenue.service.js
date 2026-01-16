// src/services/podcasterRevenue.service.js
import { Op } from 'sequelize';
import { Reservation, Podcaster, Subscription } from '../models/index.js';

/**
 * Calcule le CA effectif HT d'une réservation (pour commission)
 * Pour les réservations via pack, on calcule : (prix_pack_ht / nb_heures_pack) × heures_réservées
 * @param {Object} reservation - La réservation
 * @returns {Promise<number>} Le CA effectif HT
 */
async function getEffectiveRevenueHT(reservation) {
  // Réservation classique : on prend le prix_ht directement
  if (!reservation.is_subscription) {
    return reservation.price_ht || 0;
  }

  // Réservation via pack : calculer le taux horaire du pack (en HT)
  // Trouver le pack de l'utilisateur (le plus récent actif ou le dernier créé)
  const subscription = await Subscription.findOne({
    where: { user_id: reservation.user_id },
    order: [['createdAt', 'DESC']]
  });

  if (!subscription) {
    // Fallback : utiliser les valeurs par défaut (666.67€ HT pour 5h, soit 800€ TTC)
    const hourlyRateHT = (800 / 1.2) / 5; // = 133.33€/h HT
    return hourlyRateHT * (reservation.total_hours || 0);
  }

  // Utiliser price_ht si disponible, sinon calculer depuis price_ttc
  const packPriceHT = subscription.price_ht || (subscription.price_ttc / 1.2) || (800 / 1.2);
  const packHours = subscription.monthly_hours_quota || 5;
  const hourlyRateHT = packPriceHT / packHours;

  return hourlyRateHT * (reservation.total_hours || 0);
}

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

      // Calculer le CA total HT (en prenant en compte les packs)
      let totalRevenueHT = 0;
      for (const r of reservations) {
        const effectiveRevenueHT = await getEffectiveRevenueHT(r);
        totalRevenueHT += effectiveRevenueHT;
      }

      const totalReservations = reservations.length;
      const totalHours = reservations.reduce((sum, r) => sum + (r.total_hours || 0), 0);

      // Calculer les 20% sur le HT
      const commission = totalRevenueHT * 0.20;

      return {
        podcaster_id: podcaster.id,
        podcaster_name: podcaster.name,
        total_revenue_ht: Math.round(totalRevenueHT * 100) / 100,
        commission_20: Math.round(commission * 100) / 100,
        total_reservations: totalReservations,
        total_hours: Math.round(totalHours * 100) / 100
      };
    })
  );

  // Calculer les totaux globaux
  const globalTotalHT = results.reduce((sum, r) => sum + r.total_revenue_ht, 0);
  const globalCommission = results.reduce((sum, r) => sum + r.commission_20, 0);
  const globalReservations = results.reduce((sum, r) => sum + r.total_reservations, 0);
  const globalHours = results.reduce((sum, r) => sum + r.total_hours, 0);

  return {
    year,
    month,
    podcasters: results,
    totals: {
      total_revenue_ht: Math.round(globalTotalHT * 100) / 100,
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

// src/services/activity.service.js
import { Op } from 'sequelize';
import { Reservation, User, Podcaster, PromoCode } from '../models/index.js';
import { getCommissionRate, getVatRate } from './studioSettings.service.js';

/**
 * Recupere l'activite des clients avec CA genere
 * @param {Object} options - Options de filtrage
 * @param {Date} options.startDate - Date de debut (optionnel)
 * @param {Date} options.endDate - Date de fin (optionnel)
 * @returns {Promise<Object>} Donnees clients et totaux
 */
export async function getClientsActivity({ startDate, endDate } = {}) {
  // Construire le filtre de dates pour les reservations
  const dateFilter = {};
  if (startDate) {
    dateFilter[Op.gte] = new Date(startDate);
  }
  if (endDate) {
    dateFilter[Op.lte] = new Date(endDate);
  }

  const reservationWhere = {
    status: 'confirmed'
  };
  if (startDate || endDate) {
    reservationWhere.start_date = dateFilter;
  }

  // Recuperer tous les utilisateurs clients (pas admin/podcaster)
  const users = await User.findAll({
    where: {
      role: 'client',
      is_active: true
    },
    order: [['createdAt', 'DESC']]
  });

  // Pour chaque utilisateur, calculer les stats
  const clientsData = await Promise.all(
    users.map(async (user) => {
      // Reservations confirmees de ce client
      const reservations = await Reservation.findAll({
        where: {
          user_id: user.id,
          ...reservationWhere
        },
        order: [['start_date', 'ASC']]
      });

      if (reservations.length === 0) {
        return null; // Exclure les clients sans reservation dans la periode
      }

      // Calculer les totaux
      const totalReservations = reservations.length;
      const totalHours = reservations.reduce((sum, r) => sum + (r.total_hours || 0), 0);

      // CA avec et sans promo
      const totalHT = reservations.reduce((sum, r) => sum + (r.price_ht || 0), 0);
      const totalTVA = reservations.reduce((sum, r) => sum + (r.price_tva || 0), 0);
      const totalTTC = reservations.reduce((sum, r) => sum + (r.price_ttc || 0), 0);

      // Montant des reductions (prix original - prix paye)
      const totalOriginalHT = reservations.reduce((sum, r) => sum + (r.original_price_ht || r.price_ht || 0), 0);
      const totalDiscount = totalOriginalHT - totalHT;

      // Compter les promos utilisees et collecter les codes
      const promosUsed = reservations.filter(r => r.promo_code).length;
      const promoCodes = [...new Set(reservations.filter(r => r.promo_code).map(r => r.promo_code))];

      // Determiner le type de promo (Code manuel ou Popup)
      let promoType = null;
      if (promoCodes.length > 0) {
        // Chercher les codes promo dans la base pour determiner leur type
        const promoRecords = await PromoCode.findAll({
          where: { code: promoCodes }
        });

        // Si au moins un code est manuel (email = manual@admin.local), type = Code
        // Sinon type = Popup
        const hasManualCode = promoRecords.some(p => p.email === 'manual@admin.local');
        promoType = hasManualCode ? 'Code' : 'Popup';
      }

      // Dates premiere et derniere reservation
      const firstReservation = reservations[0]?.start_date || null;
      const lastReservation = reservations[reservations.length - 1]?.start_date || null;

      return {
        id: user.id,
        email: user.email,
        name: user.company_name || `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'N/A',
        account_type: user.account_type,
        vat_number: user.vat_number || null,
        phone: user.phone || null,
        total_reservations: totalReservations,
        total_hours: Math.round(totalHours * 100) / 100,
        total_ht: Math.round(totalHT * 100) / 100,
        total_tva: Math.round(totalTVA * 100) / 100,
        total_ttc: Math.round(totalTTC * 100) / 100,
        total_discount: Math.round(totalDiscount * 100) / 100,
        promos_used: promosUsed,
        promo_type: promoType,
        promo_codes: promoCodes,
        first_reservation: firstReservation,
        last_reservation: lastReservation,
        created_at: user.createdAt
      };
    })
  );

  // Filtrer les clients sans reservation
  const clients = clientsData.filter(c => c !== null);

  // Calculer les totaux globaux
  const totals = {
    total_clients: clients.length,
    total_reservations: clients.reduce((sum, c) => sum + c.total_reservations, 0),
    total_hours: Math.round(clients.reduce((sum, c) => sum + c.total_hours, 0) * 100) / 100,
    total_ht: Math.round(clients.reduce((sum, c) => sum + c.total_ht, 0) * 100) / 100,
    total_tva: Math.round(clients.reduce((sum, c) => sum + c.total_tva, 0) * 100) / 100,
    total_ttc: Math.round(clients.reduce((sum, c) => sum + c.total_ttc, 0) * 100) / 100,
    total_discount: Math.round(clients.reduce((sum, c) => sum + c.total_discount, 0) * 100) / 100,
    total_promos: clients.reduce((sum, c) => sum + c.promos_used, 0)
  };

  return { clients, totals };
}

/**
 * Recupere l'activite des podcasteurs avec commissions
 * @param {Object} options - Options de filtrage
 * @param {Date} options.startDate - Date de debut (optionnel)
 * @param {Date} options.endDate - Date de fin (optionnel)
 * @returns {Promise<Object>} Donnees podcasteurs et totaux
 */
export async function getPodcastersActivity({ startDate, endDate } = {}) {
  // Construire le filtre de dates
  const dateFilter = {};
  if (startDate) {
    dateFilter[Op.gte] = new Date(startDate);
  }
  if (endDate) {
    dateFilter[Op.lte] = new Date(endDate);
  }

  const reservationWhere = {
    status: 'confirmed',
    podcaster_id: { [Op.not]: null }
  };
  if (startDate || endDate) {
    reservationWhere.start_date = dateFilter;
  }

  // Recuperer tous les podcasteurs
  const podcasters = await Podcaster.findAll({
    where: { is_active: true },
    order: [['display_order', 'ASC']]
  });

  // Récupérer les taux dynamiques depuis les paramètres
  const COMMISSION_RATE = await getCommissionRate(); // Ex: 0.20 pour 20%
  const VAT_RATE = await getVatRate(); // Ex: 0.20 pour 20%

  // Pour chaque podcasteur, calculer les stats
  const podcastersData = await Promise.all(
    podcasters.map(async (podcaster) => {
      // Reservations confirmees de ce podcasteur
      const reservations = await Reservation.findAll({
        where: {
          podcaster_id: podcaster.id,
          status: 'confirmed',
          ...(startDate || endDate ? { start_date: dateFilter } : {})
        },
        order: [['start_date', 'ASC']]
      });

      // Calculer les totaux
      const totalSessions = reservations.length;
      const totalHours = reservations.reduce((sum, r) => sum + (r.total_hours || 0), 0);
      const totalRevenueHT = reservations.reduce((sum, r) => sum + (r.price_ht || 0), 0);
      const totalRevenueTTC = reservations.reduce((sum, r) => sum + (r.price_ttc || 0), 0);

      // Commission seulement pour les podcasteurs facturables
      let commissionHT = 0;
      let commissionTVA = 0;
      let commissionTTC = 0;

      if (podcaster.is_billable) {
        // Commission sur le HT
        commissionHT = totalRevenueHT * COMMISSION_RATE;
        commissionTVA = commissionHT * VAT_RATE; // TVA sur commission dynamique
        commissionTTC = commissionHT + commissionTVA;
      }

      // Dates premiere et derniere session
      const firstSession = reservations[0]?.start_date || null;
      const lastSession = reservations[reservations.length - 1]?.start_date || null;

      return {
        id: podcaster.id,
        name: podcaster.name,
        is_billable: podcaster.is_billable || false,
        total_sessions: totalSessions,
        total_hours: Math.round(totalHours * 100) / 100,
        total_revenue_ht: Math.round(totalRevenueHT * 100) / 100,
        total_revenue_ttc: Math.round(totalRevenueTTC * 100) / 100,
        commission_rate: podcaster.is_billable ? COMMISSION_RATE * 100 : 0, // En pourcentage, 0 si non facturable
        commission_ht: Math.round(commissionHT * 100) / 100,
        commission_tva: Math.round(commissionTVA * 100) / 100,
        commission_ttc: Math.round(commissionTTC * 100) / 100,
        first_session: firstSession,
        last_session: lastSession
      };
    })
  );

  // Calculer les totaux globaux (commissions seulement pour les podcasteurs facturables)
  const billablePodcasters = podcastersData.filter(p => p.is_billable);
  const totals = {
    total_podcasters: podcastersData.length,
    total_billable: billablePodcasters.length,
    total_sessions: podcastersData.reduce((sum, p) => sum + p.total_sessions, 0),
    total_hours: Math.round(podcastersData.reduce((sum, p) => sum + p.total_hours, 0) * 100) / 100,
    total_revenue_ht: Math.round(podcastersData.reduce((sum, p) => sum + p.total_revenue_ht, 0) * 100) / 100,
    total_revenue_ttc: Math.round(podcastersData.reduce((sum, p) => sum + p.total_revenue_ttc, 0) * 100) / 100,
    total_commission_ht: Math.round(billablePodcasters.reduce((sum, p) => sum + p.commission_ht, 0) * 100) / 100,
    total_commission_tva: Math.round(billablePodcasters.reduce((sum, p) => sum + p.commission_tva, 0) * 100) / 100,
    total_commission_ttc: Math.round(billablePodcasters.reduce((sum, p) => sum + p.commission_ttc, 0) * 100) / 100
  };

  return { podcasters: podcastersData, totals };
}

/**
 * Recupere un resume global de l'activite
 * @param {Object} options - Options de filtrage
 * @returns {Promise<Object>} Resume global
 */
export async function getActivitySummary({ startDate, endDate } = {}) {
  const [clientsData, podcastersData] = await Promise.all([
    getClientsActivity({ startDate, endDate }),
    getPodcastersActivity({ startDate, endDate })
  ]);

  // Nombre de nouveaux clients sur la periode
  let newClientsCount = 0;
  if (startDate) {
    newClientsCount = await User.count({
      where: {
        role: 'client',
        is_active: true,
        createdAt: {
          [Op.gte]: new Date(startDate),
          ...(endDate ? { [Op.lte]: new Date(endDate) } : {})
        }
      }
    });
  }

  // Stats codes promo
  const promoStats = await PromoCode.findAll({
    where: {
      used: true,
      ...(startDate || endDate ? {
        used_at: {
          ...(startDate ? { [Op.gte]: new Date(startDate) } : {}),
          ...(endDate ? { [Op.lte]: new Date(endDate) } : {})
        }
      } : {})
    }
  });

  return {
    period: {
      start_date: startDate || null,
      end_date: endDate || null
    },
    clients: {
      total: clientsData.totals.total_clients,
      new_clients: newClientsCount,
      total_reservations: clientsData.totals.total_reservations
    },
    revenue: {
      total_ht: clientsData.totals.total_ht,
      total_tva: clientsData.totals.total_tva,
      total_ttc: clientsData.totals.total_ttc,
      total_discount: clientsData.totals.total_discount
    },
    hours: {
      total: clientsData.totals.total_hours
    },
    commissions: {
      total_ht: podcastersData.totals.total_commission_ht,
      total_ttc: podcastersData.totals.total_commission_ttc
    },
    promos: {
      codes_used: promoStats.length,
      total_discount: clientsData.totals.total_discount
    }
  };
}

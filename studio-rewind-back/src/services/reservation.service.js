import { Op } from 'sequelize';
import { Reservation, Subscription, User } from '../models/index.js';
import { calculateReservationPricing } from '../utils/pricing.js';
import { isSlotBlocked, getBlockedSlotsForDate } from './blockedSlot.service.js';

// =======================
//  VALIDATION DES ENTRÉES
// =======================

// Regex pour validation de date ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/;

function validateDateFormat(dateStr, fieldName = 'date') {
  if (typeof dateStr !== 'string' || !ISO_DATE_REGEX.test(dateStr)) {
    const error = new Error(`Format de ${fieldName} invalide. Utilisez le format ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss).`);
    error.status = 400;
    throw error;
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    const error = new Error(`${fieldName} invalide.`);
    error.status = 400;
    throw error;
  }

  return date;
}

function validateDateRange(startDate, endDate) {
  const start = validateDateFormat(startDate, 'date de début');
  const end = validateDateFormat(endDate, 'date de fin');

  if (end <= start) {
    const error = new Error('La date de fin doit être postérieure à la date de début.');
    error.status = 400;
    throw error;
  }

  // Vérifier que la réservation n'est pas dans le passé (tolérance de 5 minutes)
  const now = new Date();
  now.setMinutes(now.getMinutes() - 5);
  if (start < now) {
    const error = new Error('Impossible de réserver un créneau dans le passé.');
    error.status = 400;
    throw error;
  }

  return { start, end };
}

// =======================
//  LOGIQUE PACK D'HEURES
// =======================

// Total global d'heures achetées / consommées / restantes (tous packs actifs)
export async function getUserSubscriptionUsage(userId) {
  // Toutes les subscriptions actives = tous les packs d'heures encore valides
  const subscriptions = await Subscription.findAll({
    where: {
      user_id: userId,
      active: true
    }
  });

  // Heures achetées = somme du quota de chaque pack (5h par pack par ex.)
  const purchasedHours = subscriptions.reduce(
    (acc, sub) => acc + (sub.monthly_hours_quota || 0),
    0
  );

  if (purchasedHours === 0) {
    return {
      purchasedHours: 0,
      usedHours: 0,
      remainingHours: 0
    };
  }

  // Heures déjà utilisées = toutes les réservations faites via abonnement,
  // sans limite de temps (historique complet), hors réservations annulées
  const reservations = await Reservation.findAll({
    where: {
      user_id: userId,
      is_subscription: true,
      status: {
        [Op.ne]: 'cancelled'
      }
    }
  });

  const usedHours = reservations.reduce(
    (acc, r) => acc + (r.total_hours || 0),
    0
  );

  const remainingHours = purchasedHours - usedHours;

  return {
    purchasedHours,
    usedHours,
    remainingHours
  };
}

// Vérifie le quota global d'heures si on crée/modifie une réservation abonnement
// hoursToAdd = nombre d'heures de la réservation qu'on souhaite ajouter
export async function checkSubscriptionQuota(userId, hoursToAdd) {
  const { purchasedHours, usedHours, remainingHours } =
    await getUserSubscriptionUsage(userId);

  if (purchasedHours === 0) {
    const error = new Error(
      "Vous n'avez pas d'heures prépayées disponibles. Veuillez acheter un pack."
    );
    error.status = 400;
    throw error;
  }

  if (hoursToAdd > remainingHours) {
    const error = new Error(
      `Vous n'avez pas suffisamment d'heures restantes sur vos packs. Il vous reste ${remainingHours.toFixed(
        2
      )}h, et vous essayez de réserver ${hoursToAdd.toFixed(2)}h.`
    );
    error.status = 400;
    throw error;
  }
}

// Vérifie les chevauchements de créneaux pour un podcasteur spécifique
export async function checkAvailability(
  startDate,
  endDate,
  podcasterId,
  excludeReservationId = null
) {
  // Vérifier d'abord si le créneau est bloqué par l'admin
  const blocked = await isSlotBlocked(new Date(startDate), new Date(endDate));
  if (blocked) {
    const error = new Error('Ce créneau est bloqué par l\'administrateur.');
    error.status = 400;
    throw error;
  }

  // Vérifier les réservations existantes pour ce podcasteur
  const whereClause = {
    podcaster_id: podcasterId,
    status: { [Op.ne]: 'cancelled' },
    start_date: { [Op.lt]: endDate },
    end_date: { [Op.gt]: startDate }
  };

  if (excludeReservationId) {
    whereClause.id = { [Op.ne]: excludeReservationId };
  }

  const conflict = await Reservation.findOne({ where: whereClause });

  if (conflict) {
    const error = new Error('Ce créneau est déjà réservé pour ce podcasteur.');
    error.status = 400;
    throw error;
  }
}

// ==========================
// ====== Côté public =======
// ==========================

// utilisé pour :
// - StepTwoDateTime (tunnel de réservation) => /api/reservations/day/:date
// - Espace membre pour bloquer les créneaux → version admin séparée
export async function getReservationsByDayPublic(date) {
  const target = new Date(date);
  if (isNaN(target.getTime())) {
    const error = new Error('Date invalide.');
    error.status = 400;
    throw error;
  }

  const startOfDay = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
    0,
    0,
    0
  );
  const endOfDay = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
    23,
    59,
    59
  );

  const reservations = await Reservation.findAll({
    where: {
      status: { [Op.ne]: 'cancelled' },
      start_date: {
        [Op.between]: [startOfDay, endOfDay]
      }
    },
    attributes: ['id', 'formula', 'start_date', 'end_date', 'status'],
    order: [['start_date', 'ASC']]
  });

  return reservations;
}

// ==========================
// ===== Côté utilisateur ===
// ==========================

export async function previewReservation(
  userId,
  { formula, start_date, end_date, podcaster_id }
) {
  // Validation des dates en entrée
  validateDateRange(start_date, end_date);

  if (!podcaster_id) {
    const error = new Error('Le podcasteur est obligatoire.');
    error.status = 400;
    throw error;
  }

  const user = await User.findByPk(userId);
  if (!user || !user.is_active) {
    const error = new Error('Utilisateur inactif ou introuvable.');
    error.status = 403;
    throw error;
  }

  const pricing = await calculateReservationPricing(
    formula,
    start_date,
    end_date
  );

  // Ici, on ne consomme PAS les packs d'heures :
  // previewReservation est utilisé par le tunnel public (paiement à l'acte).
  await checkAvailability(start_date, end_date, podcaster_id);

  return {
    formula,
    start_date,
    end_date,
    podcaster_id,
    ...pricing
  };
}

export async function createReservation(
  userId,
  { formula, start_date, end_date, podcaster_id, is_subscription = false }
) {
  // Validation des dates en entrée
  validateDateRange(start_date, end_date);

  if (!podcaster_id) {
    const error = new Error('Le podcasteur est obligatoire.');
    error.status = 400;
    throw error;
  }

  const user = await User.findByPk(userId);
  if (!user || !user.is_active) {
    const error = new Error('Utilisateur inactif ou introuvable.');
    error.status = 403;
    throw error;
  }

  const pricing = await calculateReservationPricing(
    formula,
    start_date,
    end_date
  );

  // Si la réservation passe par un pack d'heures,
  // on vérifie la disponibilité globale des heures.
  if (is_subscription) {
    await checkSubscriptionQuota(userId, pricing.total_hours);
  }

  await checkAvailability(start_date, end_date, podcaster_id);

  const reservation = await Reservation.create({
    user_id: userId,
    podcaster_id,
    formula,
    start_date,
    end_date,
    total_hours: pricing.total_hours,
    price_ht: pricing.price_ht,
    price_tva: pricing.price_tva,
    price_ttc: pricing.price_ttc,
    is_subscription,
    // Une résa via pack est immédiatement confirmée (déjà payée)
    status: is_subscription ? 'confirmed' : 'pending'
  });

  return reservation;
}

export async function getUserReservations(userId) {
  const reservations = await Reservation.findAll({
    where: {
      user_id: userId
    },
    order: [['start_date', 'DESC']]
  });

  return reservations;
}

// =======================
// ===== Côté admin ======
// =======================

export async function adminListReservations() {
  const reservations = await Reservation.findAll({
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

export async function adminGetReservationsByDay(date) {
  const target = new Date(date);
  if (isNaN(target.getTime())) {
    const error = new Error('Date invalide.');
    error.status = 400;
    throw error;
  }

  const startOfDay = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
    0,
    0,
    0
  );
  const endOfDay = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
    23,
    59,
    59
  );

  const reservations = await Reservation.findAll({
    where: {
      start_date: {
        [Op.between]: [startOfDay, endOfDay]
      }
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

export async function adminUpdateReservation(
  reservationId,
  { start_date, end_date }
) {
  const reservation = await Reservation.findByPk(reservationId, {
    include: [User]
  });

  if (!reservation) {
    const error = new Error('Réservation introuvable.');
    error.status = 404;
    throw error;
  }

  const user = reservation.User;
  if (!user || !user.is_active) {
    const error = new Error(
      "L'utilisateur lié à cette réservation est inactif."
    );
    error.status = 400;
    throw error;
  }

  const pricing = await calculateReservationPricing(
    reservation.formula,
    start_date,
    end_date
  );

  // Si cette réservation est liée à un pack, on vérifie le quota global
  if (reservation.is_subscription) {
    await checkSubscriptionQuota(user.id, pricing.total_hours);
  }

  await checkAvailability(start_date, end_date, reservation.podcaster_id, reservation.id);

  reservation.start_date = start_date;
  reservation.end_date = end_date;
  reservation.total_hours = pricing.total_hours;
  reservation.price_ht = pricing.price_ht;
  reservation.price_tva = pricing.price_tva;
  reservation.price_ttc = pricing.price_ttc;

  await reservation.save();

  return reservation;
}

export async function adminCancelReservation(reservationId) {
  const reservation = await Reservation.findByPk(reservationId, {
    include: [User]
  });

  if (!reservation) {
    const error = new Error('Réservation introuvable.');
    error.status = 404;
    throw error;
  }

  reservation.status = 'cancelled';
  await reservation.save();

  return reservation;
}

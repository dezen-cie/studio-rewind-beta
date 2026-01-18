// src/services/blockedSlot.service.js
import { Op } from 'sequelize';
import { BlockedSlot } from '../models/index.js';
import { getDefaultBlockedRangesFromSettings, isDayOpen } from './studioSettings.service.js';

// Heures par défaut bloquées (hors horaires d'ouverture) - LEGACY, utilisé comme fallback
const DEFAULT_BLOCKED_RANGES = [
  { start: 0, end: 9 },   // Minuit à 9h
  { start: 18, end: 24 }  // 18h à minuit
];

/**
 * Vérifie si un intervalle chevauche les plages bloquées
 * @param {number} startHour - Heure de début
 * @param {number} endHour - Heure de fin
 * @param {Array} blockedRanges - Plages bloquées [{start, end}, ...]
 */
function intervalOverlapsBlockedRanges(startHour, endHour, blockedRanges) {
  for (const range of blockedRanges) {
    // Chevauchement si start < range.end ET end > range.start
    if (startHour < range.end && endHour > range.start) {
      return true;
    }
  }
  return false;
}

/**
 * Récupère tous les blocages pour un mois donné
 */
export async function getBlockedSlotsForMonth(year, month) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  const blockedSlots = await BlockedSlot.findAll({
    where: {
      date: {
        [Op.between]: [startOfMonth, endOfMonth]
      }
    },
    order: [['date', 'ASC'], ['start_time', 'ASC']]
  });

  return blockedSlots;
}

/**
 * Récupère les blocages pour une date spécifique
 */
export async function getBlockedSlotsForDate(date) {
  const blockedSlots = await BlockedSlot.findAll({
    where: { date },
    order: [['start_time', 'ASC']]
  });

  return blockedSlots;
}

/**
 * Récupère les déblocages (créneaux ouverts hors horaires) pour une date
 */
export async function getUnblocksForDate(date) {
  const unblocks = await BlockedSlot.findAll({
    where: {
      date,
      is_unblock: true
    },
    order: [['start_time', 'ASC']]
  });

  return unblocks;
}

/**
 * Récupère toutes les dates qui ont des déblocages pour un mois donné
 * @returns {Array<string>} Tableau de dates au format YYYY-MM-DD
 */
export async function getUnblockDatesForMonth(year, month) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  const unblocks = await BlockedSlot.findAll({
    where: {
      date: {
        [Op.between]: [startOfMonth, endOfMonth]
      },
      is_unblock: true
    },
    attributes: ['date']
  });

  // Extraire les dates uniques
  const datesSet = new Set();
  for (const u of unblocks) {
    datesSet.add(u.date);
  }

  return Array.from(datesSet);
}

/**
 * Vérifie si un créneau est bloqué
 * Prend en compte :
 * 1. Le jour de la semaine (fermé selon les paramètres)
 * 2. Les heures par défaut bloquées (selon les paramètres du studio)
 * 3. Les déblocages exceptionnels (is_unblock: true)
 * 4. Les blocages manuels de l'admin
 *
 * @param {Date} startDate - Date/heure de début
 * @param {Date} endDate - Date/heure de fin
 * @returns {boolean} true si le créneau est bloqué
 */
export async function isSlotBlocked(startDate, endDate) {
  const dateOnly = startDate.toISOString().split('T')[0];
  const dayOfWeek = startDate.getDay(); // 0=Dimanche, 1=Lundi, ...

  // Vérifier si le jour est ouvert selon les paramètres
  const dayIsOpen = await isDayOpen(dayOfWeek);

  if (!dayIsOpen) {
    // Le jour est fermé, chercher un déblocage exceptionnel
    const startHour = startDate.getHours();
    const startMinutes = startDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinutes = endDate.getMinutes();

    const startTimeStr = `${startHour.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}:00`;
    const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00`;

    const unblock = await BlockedSlot.findOne({
      where: {
        date: dateOnly,
        is_unblock: true,
        start_time: { [Op.lte]: startTimeStr },
        end_time: { [Op.gte]: endTimeStr }
      }
    });

    // Si pas de déblocage, le jour est fermé
    if (!unblock) {
      return true;
    }
  }

  // Vérifier si le jour entier est bloqué (blocage manuel)
  const fullDayBlock = await BlockedSlot.findOne({
    where: {
      date: dateOnly,
      is_full_day: true,
      is_unblock: false
    }
  });

  if (fullDayBlock) {
    return true;
  }

  const startHour = startDate.getHours();
  const startMinutes = startDate.getMinutes();
  const endHour = endDate.getHours();
  const endMinutes = endDate.getMinutes();

  const startTimeStr = `${startHour.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}:00`;
  const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00`;

  // Récupérer les plages bloquées depuis les paramètres
  const blockedRanges = await getDefaultBlockedRangesFromSettings();

  // Vérifier si le créneau est dans les heures par défaut bloquées
  const inDefaultBlocked = intervalOverlapsBlockedRanges(startHour, endHour, blockedRanges);

  if (inDefaultBlocked) {
    // Chercher un déblocage qui couvre entièrement le créneau demandé
    const unblock = await BlockedSlot.findOne({
      where: {
        date: dateOnly,
        is_unblock: true,
        start_time: { [Op.lte]: startTimeStr },
        end_time: { [Op.gte]: endTimeStr }
      }
    });

    // Si pas de déblocage couvrant le créneau, il est bloqué
    if (!unblock) {
      return true;
    }
  }

  // Vérifier les blocages manuels spécifiques (créneaux dans les horaires normaux)
  const conflictingBlock = await BlockedSlot.findOne({
    where: {
      date: dateOnly,
      is_full_day: false,
      is_unblock: false,
      start_time: { [Op.lt]: endTimeStr },
      end_time: { [Op.gt]: startTimeStr }
    }
  });

  return !!conflictingBlock;
}

/**
 * Retourne les informations sur les heures par défaut
 */
export function getDefaultBlockedRanges() {
  return DEFAULT_BLOCKED_RANGES;
}

/**
 * Crée un blocage ou un déblocage
 * @param {Object} params
 * @param {string} params.date - Date au format YYYY-MM-DD
 * @param {string} params.start_time - Heure de début (HH:MM)
 * @param {string} params.end_time - Heure de fin (HH:MM)
 * @param {boolean} params.is_full_day - Blocage jour entier
 * @param {boolean} params.is_unblock - true = déblocage d'un créneau hors horaires
 * @param {string} params.reason - Raison
 * @param {string} params.created_by - ID de l'admin
 */
export async function createBlockedSlot({ date, start_time, end_time, is_full_day, is_unblock = false, reason, created_by }) {
  // Validation
  if (!date) {
    const error = new Error('La date est obligatoire.');
    error.status = 400;
    throw error;
  }

  if (!is_full_day && (!start_time || !end_time)) {
    const error = new Error('Pour un créneau spécifique, les heures de début et fin sont obligatoires.');
    error.status = 400;
    throw error;
  }

  // Un déblocage ne peut pas être jour entier
  if (is_unblock && is_full_day) {
    const error = new Error('Un déblocage doit avoir des heures spécifiques.');
    error.status = 400;
    throw error;
  }

  // Si jour entier (blocage), on supprime les créneaux existants pour cette date
  if (is_full_day && !is_unblock) {
    await BlockedSlot.destroy({
      where: { date, is_unblock: false }
    });
  }

  const blockedSlot = await BlockedSlot.create({
    date,
    start_time: is_full_day ? null : start_time,
    end_time: is_full_day ? null : end_time,
    is_full_day,
    is_unblock,
    reason,
    created_by
  });

  return blockedSlot;
}

/**
 * Supprime un blocage par son ID
 */
export async function deleteBlockedSlot(id) {
  const blockedSlot = await BlockedSlot.findByPk(id);

  if (!blockedSlot) {
    const error = new Error('Blocage introuvable.');
    error.status = 404;
    throw error;
  }

  await blockedSlot.destroy();
  return { success: true };
}

/**
 * Supprime tous les blocages pour une date
 */
export async function deleteBlockedSlotsForDate(date) {
  const deleted = await BlockedSlot.destroy({
    where: { date }
  });

  return { deleted };
}

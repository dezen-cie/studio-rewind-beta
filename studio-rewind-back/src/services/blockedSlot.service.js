// src/services/blockedSlot.service.js
import { Op } from 'sequelize';
import { BlockedSlot } from '../models/index.js';

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
 * Vérifie si un créneau est bloqué
 * @param {Date} startDate - Date/heure de début
 * @param {Date} endDate - Date/heure de fin
 * @returns {boolean} true si le créneau est bloqué
 */
export async function isSlotBlocked(startDate, endDate) {
  const dateOnly = startDate.toISOString().split('T')[0];

  // Vérifier si le jour entier est bloqué
  const fullDayBlock = await BlockedSlot.findOne({
    where: {
      date: dateOnly,
      is_full_day: true
    }
  });

  if (fullDayBlock) {
    return true;
  }

  // Vérifier les créneaux spécifiques
  const startHour = startDate.getHours();
  const startMinutes = startDate.getMinutes();
  const endHour = endDate.getHours();
  const endMinutes = endDate.getMinutes();

  const startTimeStr = `${startHour.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}:00`;
  const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00`;

  // Chercher un blocage qui chevauche le créneau demandé
  const conflictingBlock = await BlockedSlot.findOne({
    where: {
      date: dateOnly,
      is_full_day: false,
      start_time: { [Op.lt]: endTimeStr },
      end_time: { [Op.gt]: startTimeStr }
    }
  });

  return !!conflictingBlock;
}

/**
 * Crée un blocage (jour entier ou créneau)
 */
export async function createBlockedSlot({ date, start_time, end_time, is_full_day, reason, created_by }) {
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

  // Si jour entier, on supprime les créneaux existants pour cette date
  if (is_full_day) {
    await BlockedSlot.destroy({
      where: { date }
    });
  }

  const blockedSlot = await BlockedSlot.create({
    date,
    start_time: is_full_day ? null : start_time,
    end_time: is_full_day ? null : end_time,
    is_full_day,
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

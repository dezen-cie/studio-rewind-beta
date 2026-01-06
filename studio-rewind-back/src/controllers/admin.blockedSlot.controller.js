// src/controllers/admin.blockedSlot.controller.js
import {
  getBlockedSlotsForMonth,
  getBlockedSlotsForDate,
  createBlockedSlot,
  deleteBlockedSlot,
  deleteBlockedSlotsForDate
} from '../services/blockedSlot.service.js';

/**
 * GET /admin/blocked-slots/month/:year/:month
 * Récupère tous les blocages pour un mois
 */
export async function listBlockedSlotsForMonth(req, res) {
  try {
    const { year, month } = req.params;
    const blockedSlots = await getBlockedSlotsForMonth(
      parseInt(year, 10),
      parseInt(month, 10)
    );
    return res.json(blockedSlots);
  } catch (error) {
    console.error('Erreur listBlockedSlotsForMonth:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

/**
 * GET /admin/blocked-slots/date/:date
 * Récupère les blocages pour une date spécifique
 */
export async function listBlockedSlotsForDate(req, res) {
  try {
    const { date } = req.params;
    const blockedSlots = await getBlockedSlotsForDate(date);
    return res.json(blockedSlots);
  } catch (error) {
    console.error('Erreur listBlockedSlotsForDate:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

/**
 * POST /admin/blocked-slots
 * Crée un nouveau blocage
 */
export async function createBlockedSlotController(req, res) {
  try {
    const { date, start_time, end_time, is_full_day, reason } = req.body;
    const created_by = req.user?.id;

    const blockedSlot = await createBlockedSlot({
      date,
      start_time,
      end_time,
      is_full_day,
      reason,
      created_by
    });

    return res.status(201).json(blockedSlot);
  } catch (error) {
    console.error('Erreur createBlockedSlot:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

/**
 * DELETE /admin/blocked-slots/:id
 * Supprime un blocage par ID
 */
export async function deleteBlockedSlotController(req, res) {
  try {
    const { id } = req.params;
    await deleteBlockedSlot(id);
    return res.json({ success: true });
  } catch (error) {
    console.error('Erreur deleteBlockedSlot:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

/**
 * DELETE /admin/blocked-slots/date/:date
 * Supprime tous les blocages pour une date
 */
export async function deleteBlockedSlotsForDateController(req, res) {
  try {
    const { date } = req.params;
    const result = await deleteBlockedSlotsForDate(date);
    return res.json(result);
  } catch (error) {
    console.error('Erreur deleteBlockedSlotsForDate:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

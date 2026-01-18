// src/routes/admin.blockedSlot.routes.js
import { Router } from 'express';
import {
  listBlockedSlotsForMonth,
  listBlockedSlotsForDate,
  createBlockedSlotController,
  deleteBlockedSlotController,
  deleteBlockedSlotsForDateController,
  getDefaultBlockedRangesController,
  getUnblocksForDateController,
  getStudioSettingsController,
  updateStudioSettingsController,
  getComputedBlockedRangesController
} from '../controllers/admin.blockedSlot.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Toutes les routes nécessitent d'être admin
router.use(authenticate, requireAdmin);

// GET /admin/blocked-slots/default-hours - Heures bloquées par défaut (hardcodé, legacy)
router.get('/default-hours', getDefaultBlockedRangesController);

// GET /admin/blocked-slots/settings - Paramètres du studio (horaires et jours)
router.get('/settings', getStudioSettingsController);

// PUT /admin/blocked-slots/settings - Mise à jour des paramètres
router.put('/settings', updateStudioSettingsController);

// GET /admin/blocked-slots/computed-ranges - Plages bloquées calculées depuis les paramètres
router.get('/computed-ranges', getComputedBlockedRangesController);

// GET /admin/blocked-slots/month/:year/:month
router.get('/month/:year/:month', listBlockedSlotsForMonth);

// GET /admin/blocked-slots/date/:date
router.get('/date/:date', listBlockedSlotsForDate);

// GET /admin/blocked-slots/unblocks/:date - Déblocages pour une date
router.get('/unblocks/:date', getUnblocksForDateController);

// POST /admin/blocked-slots
router.post('/', createBlockedSlotController);

// DELETE /admin/blocked-slots/:id
router.delete('/:id', deleteBlockedSlotController);

// DELETE /admin/blocked-slots/date/:date
router.delete('/date/:date', deleteBlockedSlotsForDateController);

export default router;

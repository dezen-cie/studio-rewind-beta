// src/routes/admin.blockedSlot.routes.js
import { Router } from 'express';
import {
  listBlockedSlotsForMonth,
  listBlockedSlotsForDate,
  createBlockedSlotController,
  deleteBlockedSlotController,
  deleteBlockedSlotsForDateController
} from '../controllers/admin.blockedSlot.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Toutes les routes nécessitent d'être admin
router.use(authenticate, requireAdmin);

// GET /admin/blocked-slots/month/:year/:month
router.get('/month/:year/:month', listBlockedSlotsForMonth);

// GET /admin/blocked-slots/date/:date
router.get('/date/:date', listBlockedSlotsForDate);

// POST /admin/blocked-slots
router.post('/', createBlockedSlotController);

// DELETE /admin/blocked-slots/:id
router.delete('/:id', deleteBlockedSlotController);

// DELETE /admin/blocked-slots/date/:date
router.delete('/date/:date', deleteBlockedSlotsForDateController);

export default router;

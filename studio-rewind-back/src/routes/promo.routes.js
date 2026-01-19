// src/routes/promo.routes.js
import { Router } from 'express';
import {
  subscribe,
  validate,
  apply,
  stats,
  adminList,
  adminDelete,
  adminCreatePromo,
  adminTogglePromo,
  getPopupActive,
  adminListPopups,
  adminSavePopup,
  adminDeletePopup,
  adminTogglePopup
} from '../controllers/promo.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// ============================================================
// ROUTES PUBLIQUES
// ============================================================

// POST /api/promo/subscribe - Inscription pour recevoir un code promo
router.post('/subscribe', subscribe);

// POST /api/promo/validate - Valider un code promo
router.post('/validate', validate);

// POST /api/promo/apply - Marquer un code promo comme utilise
router.post('/apply', apply);

// GET /api/promo/popup/active - Recuperer la popup active (public)
router.get('/popup/active', getPopupActive);

// ============================================================
// ROUTES ADMIN - CODES PROMO
// ============================================================

router.get('/admin', authenticate, requireAdmin, adminList);
router.get('/admin/stats', authenticate, requireAdmin, stats);
router.post('/admin/create', authenticate, requireAdmin, adminCreatePromo);
router.patch('/admin/:id/toggle', authenticate, requireAdmin, adminTogglePromo);
router.delete('/admin/:id', authenticate, requireAdmin, adminDelete);

// ============================================================
// ROUTES ADMIN - POPUPS
// ============================================================

router.get('/admin/popups', authenticate, requireAdmin, adminListPopups);
router.post('/admin/popups', authenticate, requireAdmin, adminSavePopup);
router.delete('/admin/popups/:id', authenticate, requireAdmin, adminDeletePopup);
router.patch('/admin/popups/:id/toggle', authenticate, requireAdmin, adminTogglePopup);

export default router;

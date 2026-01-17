// src/routes/promo.routes.js
import { Router } from 'express';
import { subscribe, validate, apply, stats, adminList, adminDelete } from '../controllers/promo.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// POST /api/promo/subscribe - Inscription pour recevoir un code promo
router.post('/subscribe', subscribe);

// POST /api/promo/validate - Valider un code promo
router.post('/validate', validate);

// POST /api/promo/apply - Marquer un code promo comme utilise
router.post('/apply', apply);

// Routes admin
router.get('/admin', authenticate, requireAdmin, adminList);
router.get('/admin/stats', authenticate, requireAdmin, stats);
router.delete('/admin/:id', authenticate, requireAdmin, adminDelete);

export default router;

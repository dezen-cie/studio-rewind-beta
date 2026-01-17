// src/routes/admin.promo.routes.js
import { Router } from 'express';
import { stats } from '../controllers/promo.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/admin/promo/stats - Statistiques des codes promo (admin uniquement)
router.get('/stats', authenticate, requireAdmin, stats);

export default router;

// src/routes/admin.revenue.routes.js
import { Router } from 'express';
import {
  getRevenueByMonth,
  getAvailableMonthsController
} from '../controllers/admin.revenue.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

// Récupérer les mois disponibles
router.get('/months', getAvailableMonthsController);

// Récupérer le CA pour un mois donné
router.get('/:year/:month', getRevenueByMonth);

export default router;

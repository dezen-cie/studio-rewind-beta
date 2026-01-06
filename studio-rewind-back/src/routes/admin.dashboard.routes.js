// src/routes/admin.dashboard.routes.js
import { Router } from 'express';
import {
  getDashboardSummaryController,
  getDayReservationsController,
  getUpcomingReservationsController,
  getDayOccupancyController
} from '../controllers/admin.dashboard.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

// GET /admin/dashboard?date=YYYY-MM-DD - Résumé général (CA du jour et du mois)
router.get('/', getDashboardSummaryController);

// GET /admin/dashboard/day?date=YYYY-MM-DD - Réservations du jour sélectionné
router.get('/day', getDayReservationsController);

// GET /admin/dashboard/upcoming?date=YYYY-MM-DD - Réservations à venir (48h après le jour)
router.get('/upcoming', getUpcomingReservationsController);

// GET /admin/dashboard/occupancy?date=YYYY-MM-DD - Taux d'occupation du jour
router.get('/occupancy', getDayOccupancyController);

export default router;

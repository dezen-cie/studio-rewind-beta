// src/routes/admin.stats.routes.js
import { Router } from 'express';
import {
  getOverviewController,
  getEvolutionController,
  getTopClientsController,
  getByFormulaController,
  getByPodcasterController,
  getCompareController
} from '../controllers/admin.stats.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

// GET /admin/stats/overview?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
// Statistiques globales (CA, réservations, taux de remplissage)
router.get('/overview', getOverviewController);

// GET /admin/stats/evolution?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&group_by=day|week|month
// Evolution du CA par période
router.get('/evolution', getEvolutionController);

// GET /admin/stats/top-clients?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&limit=10
// Top clients par CA
router.get('/top-clients', getTopClientsController);

// GET /admin/stats/by-formula?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
// CA par formule
router.get('/by-formula', getByFormulaController);

// GET /admin/stats/by-podcaster?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
// Sessions par podcasteur
router.get('/by-podcaster', getByPodcasterController);

// GET /admin/stats/compare?current_start=...&current_end=...&previous_start=...&previous_end=...
// Comparer deux périodes
router.get('/compare', getCompareController);

export default router;

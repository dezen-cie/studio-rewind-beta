// src/routes/reservation.routes.js
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  preview,
  create,
  getMine,
  getByDayPublic,
  getBlockedByDayPublic,
  getDefaultBlockedHoursPublic,
  getUnblocksByDayPublic,
  getStudioSettingsPublic,
  getComputedBlockedRangesPublic,
  getUnblockDatesForMonthPublic,
  calculatePricingPublic
} from '../controllers/reservation.controller.js';

const router = Router();

// Route publique : récupérer les réservations d'un jour donné
router.get('/day/:date', getByDayPublic);

// Route publique : récupérer les blocages d'un jour donné
router.get('/blocked/:date', getBlockedByDayPublic);

// Route publique : récupérer les heures bloquées par défaut (0-9h et 18-24h)
router.get('/default-blocked-hours', getDefaultBlockedHoursPublic);

// Route publique : récupérer les déblocages d'un jour donné
router.get('/unblocks/:date', getUnblocksByDayPublic);

// Route publique : récupérer les paramètres du studio (horaires et jours d'ouverture)
router.get('/studio-settings', getStudioSettingsPublic);

// Route publique : récupérer les plages bloquées calculées depuis les paramètres
router.get('/computed-blocked-ranges', getComputedBlockedRangesPublic);

// Route publique : récupérer les dates avec déblocages pour un mois
router.get('/unblock-dates/:year/:month', getUnblockDatesForMonthPublic);

// Route publique : calcul du prix avec majorations (step 2 tunnel)
router.post('/calculate-pricing', calculatePricingPublic);

// Prévisualisation (step 2 du tunnel : calcul prix HT/TVA/TTC) - nécessite auth
router.post('/preview', authenticate, preview);

// Création de la réservation (step 3, après validation + Stripe plus tard)
router.post('/', authenticate, create);

// Récupérer les réservations de l'utilisateur connecté (espace client)
router.get('/me', authenticate, getMine);


export default router;

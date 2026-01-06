// src/routes/admin.reservation.routes.js
import { Router } from 'express';
import {
  getAllReservations,
  getReservationsByDay,
  updateReservationDates,
  cancelReservation
} from '../controllers/admin.reservation.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Toutes ces routes sont pour admin + super_admin
router.use(authenticate, requireAdmin);

// Liste complète des réservations (pour la vue liste)
router.get('/', getAllReservations);

// Réservations d'un jour précis (pour le clic sur un jour dans le calendrier)
router.get('/day/:date', getReservationsByDay);

// Modifier les dates d'une réservation
router.patch('/:reservationId', updateReservationDates);

// Annuler une réservation
router.post('/:reservationId/cancel', cancelReservation);

export default router;

// src/routes/payment.routes.js
import { Router } from 'express';
import { 
    createReservationIntent, 
    confirmReservation
} from '../controllers/payment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Créer un PaymentIntent + reservation (formule solo/duo/pro)
router.post('/reservation-intent', authenticate, createReservationIntent);

// Confirmer une réservation après succès du paiement Stripe
router.post('/confirm-reservation', authenticate, confirmReservation);

export default router;

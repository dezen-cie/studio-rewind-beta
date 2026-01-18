// src/routes/invoice.routes.js
import { Router } from 'express';
import {
  downloadReservationInvoice,
  downloadCommissionStatement,
  downloadAllInvoices
} from '../controllers/invoice.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Télécharger toutes les factures en ZIP (admin uniquement)
router.get('/download-all', authenticate, downloadAllInvoices);

// Télécharger la facture d'une réservation (client ou admin)
router.get('/reservation/:id', authenticate, downloadReservationInvoice);

// Télécharger le relevé de commission d'une réservation (podcasteur ou admin)
router.get('/commission/:reservationId', authenticate, downloadCommissionStatement);

export default router;

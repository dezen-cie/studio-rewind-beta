// src/routes/message.routes.js
import { Router } from 'express';
import {
  contactPublic,
  contactAuthenticated,
  adminGetMessages,
  adminGetMessageById,
  adminArchiveMessage,
  adminDeleteMessageController,
  adminReplyToMessageController
} from '../controllers/message.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Formulaire de contact public (non connecté)
router.post('/contact', contactPublic);

// Formulaire de contact depuis un compte connecté (espace membre)
router.post('/contact-auth', authenticate, contactAuthenticated);

// Boîte de réception admin
router.get('/admin', authenticate, requireAdmin, adminGetMessages);

// Détail d'un message (admin)
router.get('/admin/:id', authenticate, requireAdmin, adminGetMessageById);

// Archiver un message (admin)
router.patch('/admin/:id/archive', authenticate, requireAdmin, adminArchiveMessage);


// Supprimer un message (admin)
router.delete('/admin/:id', authenticate, requireAdmin, adminDeleteMessageController);

// Répondre à un message (admin)
router.post('/admin/:id/reply', authenticate, requireAdmin, adminReplyToMessageController);

export default router;

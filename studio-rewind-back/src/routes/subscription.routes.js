// src/routes/subscription.routes.js
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { getMySubscription, adminCreateSubscription } from '../controllers/subscription.controller.js';

const router = Router();


function ensureAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({ message: 'Accès réservé aux admins.' });
  }
  next();
}

// Pack d'heures du membre connecté
router.get('/me', authenticate, getMySubscription);

// Création / assignation d'un pack d'heures à un user (admin)
router.post('/', authenticate, ensureAdmin, adminCreateSubscription);

export default router;

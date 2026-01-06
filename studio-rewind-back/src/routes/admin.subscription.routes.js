// src/routes/admin/subscription.admin.routes.js
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { adminCreateSubscription } from '../controllers/subscription.controller.js';

const router = Router();

function ensureAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({ message: 'Accès réservé aux admins.' });
  }
  next();
}

// POST /api/admin/subscriptions
router.post('/', authenticate, ensureAdmin, adminCreateSubscription);

export default router;

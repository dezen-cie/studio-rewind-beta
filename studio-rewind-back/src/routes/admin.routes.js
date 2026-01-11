// src/routes/admin.routes.js
import { Router } from 'express';
import {
  createAdminAccount,
  activateUser,
  deactivateUser,
  deleteUser,
  getUsers,
  toggleAdmin,
} from '../controllers/admin.controller.js';

import adminSubscriptionRoutes from './admin.subscription.routes.js';

import { authenticate, requireAdmin, requireSuperAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Création de l'admin → réservé super admin
router.post('/create-admin', authenticate, requireSuperAdmin, createAdminAccount);

// Liste des utilisateurs → admin + super_admin
router.get('/users', authenticate, requireAdmin, getUsers);

// Activer / désactiver un user → admin ou super admin
router.patch('/activate/:userId', authenticate, requireAdmin, activateUser);
router.patch('/deactivate/:userId', authenticate, requireAdmin, deactivateUser);

// Suppression définitive → super admin
router.delete('/delete/:userId', authenticate, requireSuperAdmin, deleteUser);

// Toggle admin status → super admin uniquement
router.patch('/toggle-admin/:userId', authenticate, requireSuperAdmin, toggleAdmin);

router.use('/subscriptions', adminSubscriptionRoutes);
export default router;

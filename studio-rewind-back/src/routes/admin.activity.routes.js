// src/routes/admin.activity.routes.js
import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';
import {
  getClients,
  getPodcasters,
  getSummary,
  exportClients,
  exportPodcasters
} from '../controllers/admin.activity.controller.js';

const router = Router();

// Toutes les routes necessitent auth admin
router.use(authenticate, requireAdmin);

// GET /api/admin/activity/summary - Resume global
router.get('/summary', getSummary);

// GET /api/admin/activity/clients - Liste clients avec CA
router.get('/clients', getClients);

// GET /api/admin/activity/podcasters - Liste podcasteurs avec commissions
router.get('/podcasters', getPodcasters);

// GET /api/admin/activity/export/clients - Export CSV clients
router.get('/export/clients', exportClients);

// GET /api/admin/activity/export/podcasters - Export CSV podcasteurs
router.get('/export/podcasters', exportPodcasters);

export default router;

// src/routes/admin.podcaster.routes.js
import { Router } from 'express';
import {
  listPodcasters,
  createPodcasterController,
  updatePodcasterController,
  deletePodcasterController,
  togglePodcasterAdminController,
  toggleCoreTeamController,
  updateTeamOrderController
} from '../controllers/admin.podcaster.controller.js';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middlewares/auth.middleware.js';
import { uploadPodcasterFiles } from '../config/upload.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', listPodcasters);
router.post('/', uploadPodcasterFiles, createPodcasterController);
router.patch('/:id', uploadPodcasterFiles, updatePodcasterController);
router.delete('/:id', deletePodcasterController);

// Toggle admin status - super admin uniquement
router.patch('/:id/toggle-admin', requireSuperAdmin, togglePodcasterAdminController);

// Toggle core team status - super admin uniquement
router.patch('/:id/toggle-core-team', requireSuperAdmin, toggleCoreTeamController);

// Modifier l'ordre d'affichage sur la page équipe - super admin uniquement
router.patch('/:id/team-order', requireSuperAdmin, updateTeamOrderController);

export default router;

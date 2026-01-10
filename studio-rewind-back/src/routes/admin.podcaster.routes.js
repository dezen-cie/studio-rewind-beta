// src/routes/admin.podcaster.routes.js
import { Router } from 'express';
import {
  listPodcasters,
  createPodcasterController,
  updatePodcasterController,
  deletePodcasterController
} from '../controllers/admin.podcaster.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';
import { uploadPodcasterFiles } from '../config/upload.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', listPodcasters);
router.post('/', uploadPodcasterFiles, createPodcasterController);
router.patch('/:id', uploadPodcasterFiles, updatePodcasterController);
router.delete('/:id', deletePodcasterController);

export default router;

// src/routes/admin.formula.routes.js
import { Router } from 'express';
import {
  listFormulas,
  createFormulaController,
  updateFormulaController,
  deleteFormulaController,
  uploadFormulaImageController,
  deleteFormulaImageController,
  listFormulaOptions,
  createFormulaOptionController,
  updateFormulaOptionController,
  deleteFormulaOptionController
} from '../controllers/admin.formula.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';
import { uploadFormulaPhoto } from '../config/upload.js';

const router = Router();

router.use(authenticate, requireAdmin);

// Formules
router.get('/', listFormulas);
router.post('/', createFormulaController);
router.patch('/:id', updateFormulaController);
router.delete('/:id', deleteFormulaController);

// Image de formule
router.post('/:id/image', uploadFormulaPhoto, uploadFormulaImageController);
router.delete('/:id/image', deleteFormulaImageController);

// Options des formules
router.get('/:id/options', listFormulaOptions);
router.post('/:id/options', createFormulaOptionController);
router.patch('/options/:optionId', updateFormulaOptionController);
router.delete('/options/:optionId', deleteFormulaOptionController);

export default router;

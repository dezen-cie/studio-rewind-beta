// src/routes/admin.formula.routes.js
import { Router } from 'express';
import {
  listFormulas,
  updateFormulaController,
  listFormulaOptions,
  createFormulaOptionController,
  updateFormulaOptionController,
  deleteFormulaOptionController
} from '../controllers/admin.formula.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

// Formules
router.get('/', listFormulas);
router.patch('/:id', updateFormulaController);

// Options des formules
router.get('/:id/options', listFormulaOptions);
router.post('/:id/options', createFormulaOptionController);
router.patch('/options/:optionId', updateFormulaOptionController);
router.delete('/options/:optionId', deleteFormulaOptionController);

export default router;

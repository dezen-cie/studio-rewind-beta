// src/routes/admin.formula.routes.js
import { Router } from 'express';
import { listFormulas, updateFormulaController } from '../controllers/admin.formula.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', listFormulas);
router.patch('/:id', updateFormulaController);

export default router;

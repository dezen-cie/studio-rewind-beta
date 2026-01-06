// src/routes/formula.routes.js
import { Router } from 'express';
import { publicListFormulas } from '../controllers/formula.controller.js';

const router = Router();

// Route publique, aucune authentification ici
router.get('/', publicListFormulas);

export default router;

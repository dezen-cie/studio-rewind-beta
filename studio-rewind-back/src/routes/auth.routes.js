// src/routes/auth.routes.js
import { Router } from 'express';
import { register, login, me, logout, changePasswordController  } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Inscription (client)
router.post('/register', register);

// Login (client, admin, super_admin)
router.post('/login', login);

// Changer le mot de passe
router.patch('/change-password', authenticate, changePasswordController);

// Profil de l'utilisateur connecté
router.get('/me', authenticate, me);

router.post('/logout', authenticate, logout);

export default router;

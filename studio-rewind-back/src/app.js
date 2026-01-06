// src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import reservationRoutes from './routes/reservation.routes.js';
import adminRoutes from './routes/admin.routes.js';
import adminReservationRoutes from './routes/admin.reservation.routes.js';
import messageRoutes from './routes/message.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminFormulaRoutes from './routes/admin.formula.routes.js';
import adminDashboardRoutes from './routes/admin.dashboard.routes.js';
import adminBlockedSlotRoutes from './routes/admin.blockedSlot.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import formulaRoutes from './routes/formula.routes.js';

const app = express();

const FRONT_ORIGIN =
  process.env.FRONT_ORIGIN || 'http://localhost:5173';

// ===================
// SECURITY MIDDLEWARES
// ===================

// Helmet - headers de sécurité HTTP
app.use(helmet());

// Rate limiting global - 100 requêtes par minute par IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { message: 'Trop de requêtes, veuillez réessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Rate limiting strict pour l'authentification - 5 tentatives par minute
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: 'Trop de tentatives de connexion, veuillez réessayer dans une minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS + cookies (pour JWT en httpOnly)
app.use(
  cors({
    origin: FRONT_ORIGIN,
    credentials: true,
  })
);

// Parsing JSON + cookies
app.use(express.json());
app.use(cookieParser());

// Routes API
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/reservations', adminReservationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/formulas', adminFormulaRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/blocked-slots', adminBlockedSlotRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/formulas', formulaRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Studio Rewind API running',
  });
});

// 404 générique
app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable.' });
});

// Gestionnaire d’erreurs générique
// (à améliorer si tu veux des codes/erreurs plus précis)
app.use((err, req, res, next) => {
  console.error('Erreur non gérée :', err);
  res
    .status(err.status || 500)
    .json({ message: err.message || 'Erreur serveur.' });
});

export default app;

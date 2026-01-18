// src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
import adminPodcasterRoutes from './routes/admin.podcaster.routes.js';
import podcasterRoutes from './routes/podcaster.routes.js';
import podcasterDashboardRoutes from './routes/podcaster.dashboard.routes.js';
import adminRevenueRoutes from './routes/admin.revenue.routes.js';
import promoRoutes from './routes/promo.routes.js';
import adminPromoRoutes from './routes/admin.promo.routes.js';
import adminActivityRoutes from './routes/admin.activity.routes.js';
import adminEmailingRoutes from './routes/admin.emailing.routes.js';
import { unsubscribeController, trackOpenController, trackClickController, oneClickUnsubscribeController } from './controllers/emailing.controller.js';

const app = express();

// Trust proxy - nécessaire pour Render et autres reverse proxies
// Permet à express-rate-limit de récupérer la vraie IP du client
app.set('trust proxy', 1);

// Supporte plusieurs origines séparées par des virgules
const ALLOWED_ORIGINS = (process.env.FRONT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

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
    origin: function (origin, callback) {
      // Permettre les requêtes sans origin (ex: mobile apps, Postman)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Parsing JSON + cookies
app.use(express.json());
app.use(cookieParser());

// Servir les fichiers uploades (videos/audios podcasteurs)
// Avec headers CORS pour permettre l'acces depuis le frontend
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Servir les images statiques (photos de profil des membres fondateurs)
// Avec headers CORS pour permettre l'acces depuis le frontend
app.use('/images', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '../public/images')));

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
app.use('/api/admin/podcasters', adminPodcasterRoutes);
app.use('/api/podcasters', podcasterRoutes);
app.use('/api/podcaster', podcasterDashboardRoutes);
app.use('/api/admin/revenue', adminRevenueRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/admin/promo', adminPromoRoutes);
app.use('/api/admin/activity', adminActivityRoutes);
app.use('/api/admin/emailing', adminEmailingRoutes);

// Route publique de desabonnement (pas d'auth requise)
app.post('/api/emailing/unsubscribe', unsubscribeController);

// Route one-click unsubscribe pour Gmail/clients email (RFC 8058)
// Accepte POST (Gmail automatic) et GET (manual clicks)
app.post('/api/emailing/unsubscribe/:token', oneClickUnsubscribeController);
app.get('/api/emailing/unsubscribe/:token', oneClickUnsubscribeController);

// Routes publiques de tracking email (pas d'auth requise)
app.get('/api/emailing/track/open/:campaignId/:token', trackOpenController);
app.get('/api/emailing/track/click/:campaignId/:token', trackClickController);

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

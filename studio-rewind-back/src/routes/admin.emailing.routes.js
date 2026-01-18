// src/routes/admin.emailing.routes.js
import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';
import {
  getOptinUsersController,
  uploadExcelController,
  createCampaignController,
  sendCampaignController,
  getCampaignsController,
  getCampaignController,
  deleteCampaignController,
  updateStatsController,
  getMailerStatusController,
  unsubscribeController,
  processScheduledController
} from '../controllers/emailing.controller.js';

const router = Router();

// Multer pour l'upload Excel (en memoire)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepte les fichiers Excel
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporte. Utilisez .xlsx, .xls ou .csv'));
    }
  }
});

// Toutes les routes sont protegees admin
router.use(authenticate, requireAdmin);

// Liste des utilisateurs optin
router.get('/optin-users', getOptinUsersController);

// Upload et parsing d'un fichier Excel
router.post('/upload-excel', upload.single('file'), uploadExcelController);

// Statut du mailer SMTP
router.get('/mailer-status', getMailerStatusController);

// CRUD Campagnes
router.get('/campaigns', getCampaignsController);
router.post('/campaigns', createCampaignController);
router.get('/campaigns/:id', getCampaignController);
router.delete('/campaigns/:id', deleteCampaignController);

// Envoi d'une campagne
router.post('/campaigns/:id/send', sendCampaignController);

// Mise a jour des stats (pour tests/demo)
router.patch('/campaigns/:id/stats', updateStatsController);

// Traitement des campagnes programmees
router.post('/process-scheduled', processScheduledController);

export default router;

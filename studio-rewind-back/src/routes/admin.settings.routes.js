// src/routes/admin.settings.routes.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getAllSettingsController,
  updateAllSettingsController,
  uploadLogoController,
  deleteLogoController,
  getRatesController,
  getCompanyInfoController
} from '../controllers/admin.settings.controller.js';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Configuration multer pour upload logo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP.'));
    }
  }
});

// Toutes les routes nécessitent d'être admin
router.use(authenticate, requireAdmin);

// GET /admin/settings - Récupérer tous les paramètres
router.get('/', getAllSettingsController);

// PUT /admin/settings - Mettre à jour les paramètres
router.put('/', updateAllSettingsController);

// GET /admin/settings/rates - Récupérer les taux (TVA, commission)
router.get('/rates', getRatesController);

// GET /admin/settings/company - Récupérer les infos entreprise
router.get('/company', getCompanyInfoController);

// POST /admin/settings/logo - Upload logo
router.post('/logo', upload.single('logo'), uploadLogoController);

// DELETE /admin/settings/logo - Supprimer logo
router.delete('/logo', deleteLogoController);

export default router;

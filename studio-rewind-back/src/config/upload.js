// src/config/upload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossier de base pour les uploads
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');
const AUDIOS_DIR = path.join(UPLOADS_DIR, 'audios');

// Creer les dossiers s'ils n'existent pas
[UPLOADS_DIR, VIDEOS_DIR, AUDIOS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'video') {
      cb(null, VIDEOS_DIR);
    } else if (file.fieldname === 'audio') {
      cb(null, AUDIOS_DIR);
    } else {
      cb(new Error('Champ de fichier non reconnu'), null);
    }
  },
  filename: (req, file, cb) => {
    // Generer un nom unique avec timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filtrer les types de fichiers
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    // Accepter les fichiers video
    const allowedMimes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format video non supporte. Utilisez MP4, WebM ou OGG.'), false);
    }
  } else if (file.fieldname === 'audio') {
    // Accepter les fichiers audio
    const allowedMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format audio non supporte. Utilisez MP3, WAV ou OGG.'), false);
    }
  } else {
    cb(new Error('Champ de fichier non reconnu'), false);
  }
};

// Configuration multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB max
  }
});

// Middleware pour upload video + audio
export const uploadPodcasterFiles = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]);

// Fonction utilitaire pour supprimer un fichier
export function deleteFile(filePath) {
  if (!filePath) return;

  const fullPath = path.join(UPLOADS_DIR, filePath.replace('/uploads/', ''));

  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log('Fichier supprime:', fullPath);
    } catch (error) {
      console.error('Erreur suppression fichier:', error);
    }
  }
}

export { UPLOADS_DIR, VIDEOS_DIR, AUDIOS_DIR };

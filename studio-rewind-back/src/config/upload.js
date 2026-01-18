// src/config/upload.js
import multer from 'multer';
import path from 'path';
import { uploadFile, deleteFile as deleteStorageFile, UPLOADS_DIR } from '../services/storage.service.js';

// Configuration du stockage en memoire (pour ensuite envoyer au service de storage)
const storage = multer.memoryStorage();

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
  } else if (file.fieldname === 'photo') {
    // Accepter les fichiers image
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format image non supporte. Utilisez JPG, PNG ou WebP.'), false);
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

// Middleware pour upload video + audio (creation podcaster par admin)
export const uploadPodcasterFiles = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]);

// Middleware pour upload photo profil podcaster
export const uploadPodcasterPhoto = upload.fields([
  { name: 'photo', maxCount: 1 }
]);

// Middleware pour upload video + audio (devenir podcaster / upload media)
export const uploadPodcasterMedia = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]);

// Middleware pour upload photo formule
export const uploadFormulaPhoto = upload.fields([
  { name: 'photo', maxCount: 1 }
]);

/**
 * Generer un nom de fichier unique
 */
function generateFileName(fieldname, originalname) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(originalname);
  return fieldname + '-' + uniqueSuffix + ext;
}

/**
 * Traiter et uploader un fichier vers le stockage
 * @param {Object} file - Le fichier multer (avec buffer)
 * @returns {Promise<string>} L'URL du fichier uploade
 */
export async function processAndUploadFile(file) {
  if (!file || !file.buffer) {
    throw new Error('Fichier invalide');
  }

  const fileName = generateFileName(file.fieldname, file.originalname);

  // Determiner le bucket selon le type de fichier
  let bucket;
  if (file.fieldname === 'video') {
    bucket = 'videos';
  } else if (file.fieldname === 'audio') {
    bucket = 'audios';
  } else if (file.fieldname === 'photo') {
    bucket = 'photos';
  } else {
    throw new Error('Type de fichier non reconnu');
  }

  // Uploader vers le service de storage (local ou Supabase)
  const url = await uploadFile(file.buffer, fileName, bucket, file.mimetype);
  return url;
}

/**
 * Fonction utilitaire pour supprimer un fichier
 * Compatible avec les anciennes URLs locales et les nouvelles URLs Supabase
 */
export function deleteFile(filePath) {
  deleteStorageFile(filePath);
}

export { UPLOADS_DIR };

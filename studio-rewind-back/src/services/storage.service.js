// src/services/storage.service.js
// Service de stockage hybride: local en dev, Supabase en production
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossier de base pour les uploads locaux
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Detecter le mode de stockage
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
const isSupabaseMode = STORAGE_TYPE === 'supabase' && supabase !== null;

console.log(`📦 Mode de stockage: ${isSupabaseMode ? 'Supabase' : 'Local'}`);

/**
 * Upload un fichier vers le stockage (local ou Supabase)
 * @param {Buffer} fileBuffer - Le contenu du fichier
 * @param {string} fileName - Le nom du fichier
 * @param {string} bucket - Le bucket/dossier (videos, audios, photos)
 * @param {string} mimeType - Le type MIME du fichier
 * @returns {Promise<string>} L'URL publique du fichier
 */
export async function uploadFile(fileBuffer, fileName, bucket, mimeType) {
  if (isSupabaseMode) {
    return uploadToSupabase(fileBuffer, fileName, bucket, mimeType);
  } else {
    return uploadToLocal(fileBuffer, fileName, bucket);
  }
}

/**
 * Upload vers Supabase Storage
 */
async function uploadToSupabase(fileBuffer, fileName, bucket, mimeType) {
  const filePath = `${bucket}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('studio-rewind')
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error) {
    console.error('Erreur upload Supabase:', error);
    throw new Error('Erreur lors de l\'upload du fichier: ' + error.message);
  }

  // Recuperer l'URL publique
  const { data: urlData } = supabase.storage
    .from('studio-rewind')
    .getPublicUrl(filePath);

  console.log('✅ Fichier uploadé sur Supabase:', urlData.publicUrl);
  return urlData.publicUrl;
}

/**
 * Upload vers le systeme de fichiers local
 */
async function uploadToLocal(fileBuffer, fileName, bucket) {
  const bucketDir = path.join(UPLOADS_DIR, bucket);

  // Creer le dossier s'il n'existe pas
  if (!fs.existsSync(bucketDir)) {
    fs.mkdirSync(bucketDir, { recursive: true });
  }

  const filePath = path.join(bucketDir, fileName);

  // Ecrire le fichier
  fs.writeFileSync(filePath, fileBuffer);

  // Retourner l'URL relative
  const url = `/uploads/${bucket}/${fileName}`;
  console.log('✅ Fichier sauvegardé localement:', url);
  return url;
}

/**
 * Supprimer un fichier du stockage
 * @param {string} fileUrl - L'URL du fichier a supprimer
 */
export async function deleteFile(fileUrl) {
  if (!fileUrl) return;

  try {
    if (isSupabaseMode && fileUrl.includes('supabase')) {
      await deleteFromSupabase(fileUrl);
    } else if (fileUrl.startsWith('/uploads/')) {
      await deleteFromLocal(fileUrl);
    }
    // Si l'URL est de type /images/, on ne supprime pas (images statiques)
  } catch (error) {
    console.error('Erreur suppression fichier:', error);
  }
}

/**
 * Supprimer de Supabase Storage
 */
async function deleteFromSupabase(fileUrl) {
  // Extraire le chemin du fichier depuis l'URL
  // URL format: https://xxx.supabase.co/storage/v1/object/public/studio-rewind/videos/file.mp4
  const urlParts = fileUrl.split('/studio-rewind/');
  if (urlParts.length < 2) return;

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('studio-rewind')
    .remove([filePath]);

  if (error) {
    console.error('Erreur suppression Supabase:', error);
  } else {
    console.log('✅ Fichier supprimé de Supabase:', filePath);
  }
}

/**
 * Supprimer du systeme de fichiers local
 */
async function deleteFromLocal(fileUrl) {
  const relativePath = fileUrl.replace('/uploads/', '');
  const fullPath = path.join(UPLOADS_DIR, relativePath);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log('✅ Fichier supprimé localement:', fullPath);
  }
}

/**
 * Verifier si on est en mode Supabase
 */
export function isUsingSupabase() {
  return isSupabaseMode;
}

export { UPLOADS_DIR };

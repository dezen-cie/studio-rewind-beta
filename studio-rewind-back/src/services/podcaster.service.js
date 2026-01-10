// src/services/podcaster.service.js
import bcrypt from 'bcrypt';
import { Podcaster, User } from '../models/index.js';
import { deleteFile } from '../config/upload.js';

const SALT_ROUNDS = 10;

// Récupérer tous les podcasters actifs (pour le front public)
export async function getActivePodcasters() {
  const podcasters = await Podcaster.findAll({
    where: { is_active: true },
    order: [['display_order', 'ASC']]
  });
  return podcasters;
}

// Récupérer tous les podcasters (pour l'admin)
export async function getAllPodcasters() {
  const podcasters = await Podcaster.findAll({
    order: [['display_order', 'ASC']]
  });
  return podcasters;
}

// Créer un nouveau podcaster avec son compte utilisateur
export async function createPodcaster({ name, video_url, audio_url, display_order, is_active, email }) {
  if (!name || !name.trim()) {
    const error = new Error('Le nom est obligatoire.');
    error.status = 400;
    throw error;
  }

  if (!email || !email.trim()) {
    const error = new Error('L\'email est obligatoire.');
    error.status = 400;
    throw error;
  }

  if (!video_url || !video_url.trim()) {
    const error = new Error('La video est obligatoire.');
    error.status = 400;
    throw error;
  }

  if (!audio_url || !audio_url.trim()) {
    const error = new Error('L\'audio est obligatoire.');
    error.status = 400;
    throw error;
  }

  // Vérifier que l'email n'existe pas déjà
  const existingUser = await User.findOne({ where: { email: email.trim() } });
  if (existingUser) {
    const error = new Error('Un compte existe déjà avec cet email.');
    error.status = 400;
    throw error;
  }

  // Générer le mot de passe par défaut : nom + "1"
  const defaultPassword = name.trim().replace(/\s+/g, '') + '1';
  const hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

  // Créer le compte utilisateur pour le podcasteur
  const user = await User.create({
    email: email.trim(),
    password: hashedPassword,
    role: 'podcaster',
    account_type: null,
    firstname: name.trim(),
    lastname: null,
    phone: null,
    is_active: true,
    must_change_password: true
  });

  // Si pas d'ordre spécifié, mettre à la fin
  let order = display_order;
  if (order === undefined || order === null) {
    const maxOrder = await Podcaster.max('display_order');
    order = (maxOrder || 0) + 1;
  }

  const podcaster = await Podcaster.create({
    name: name.trim(),
    video_url: video_url.trim(),
    audio_url: audio_url.trim(),
    display_order: order,
    is_active: is_active !== false,
    user_id: user.id
  });

  return {
    ...podcaster.toJSON(),
    email: user.email,
    defaultPassword // On retourne le mot de passe pour affichage une seule fois
  };
}

// Mettre à jour un podcaster
export async function updatePodcaster(id, { name, video_url, audio_url, display_order, is_active, oldVideoUrl, oldAudioUrl }) {
  const podcaster = await Podcaster.findByPk(id);

  if (!podcaster) {
    const error = new Error('Podcasteur introuvable.');
    error.status = 404;
    throw error;
  }

  if (name !== undefined) {
    if (!name.trim()) {
      const error = new Error('Le nom ne peut pas être vide.');
      error.status = 400;
      throw error;
    }
    podcaster.name = name.trim();
  }

  // Si nouvelle video, supprimer l'ancienne
  if (video_url !== undefined && oldVideoUrl) {
    deleteFile(podcaster.video_url);
    podcaster.video_url = video_url.trim();
  }

  // Si nouvel audio, supprimer l'ancien
  if (audio_url !== undefined && oldAudioUrl) {
    deleteFile(podcaster.audio_url);
    podcaster.audio_url = audio_url.trim();
  }

  if (display_order !== undefined) {
    podcaster.display_order = display_order;
  }

  if (is_active !== undefined) {
    podcaster.is_active = is_active;
  }

  await podcaster.save();
  return podcaster;
}

// Supprimer un podcaster et son compte utilisateur
export async function deletePodcaster(id) {
  const podcaster = await Podcaster.findByPk(id);

  if (!podcaster) {
    const error = new Error('Podcasteur introuvable.');
    error.status = 404;
    throw error;
  }

  // Supprimer le compte utilisateur associé si existant
  if (podcaster.user_id) {
    const user = await User.findByPk(podcaster.user_id);
    if (user) {
      await user.destroy();
    }
  }

  // Supprimer les fichiers associes
  deleteFile(podcaster.video_url);
  deleteFile(podcaster.audio_url);

  await podcaster.destroy();
  return { success: true, message: 'Podcasteur, compte utilisateur et fichiers supprimés.' };
}

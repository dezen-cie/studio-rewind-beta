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

// Récupérer les podcasters avec profil en ligne (pour la page équipe)
export async function getOnlinePodcasters() {
  const podcasters = await Podcaster.findAll({
    where: { profile_online: true },
    order: [['display_order', 'ASC']]
  });
  return podcasters;
}

// Récupérer tous les podcasters (pour l'admin)
export async function getAllPodcasters() {
  const podcasters = await Podcaster.findAll({
    order: [['display_order', 'ASC']],
    include: [{
      model: User,
      as: 'user',
      attributes: ['role'],
      required: false
    }]
  });

  // Transformer pour inclure le rôle au premier niveau
  return podcasters.map(p => {
    const data = p.toJSON();
    data.role = data.user?.role || 'podcaster';
    delete data.user;
    return data;
  });
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
export async function updatePodcaster(id, { name, video_url, audio_url, display_order, is_active, oldVideoUrl, oldAudioUrl }, requestingUser = null) {
  const podcaster = await Podcaster.findByPk(id);

  if (!podcaster) {
    const error = new Error('Podcasteur introuvable.');
    error.status = 404;
    throw error;
  }

  // Vérifier si le podcaster cible est un super_admin
  if (podcaster.user_id) {
    const targetUser = await User.findByPk(podcaster.user_id);
    if (targetUser && targetUser.role === 'super_admin') {
      // Seul le super_admin peut se modifier lui-même
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        const error = new Error('Impossible de modifier le super administrateur.');
        error.status = 403;
        throw error;
      }
      // Vérifier que c'est bien le super_admin qui se modifie lui-même
      if (requestingUser.id !== podcaster.user_id) {
        const error = new Error('Seul le super administrateur peut modifier son propre profil.');
        error.status = 403;
        throw error;
      }
    }
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
export async function deletePodcaster(id, requestingUser = null) {
  const podcaster = await Podcaster.findByPk(id);

  if (!podcaster) {
    const error = new Error('Podcasteur introuvable.');
    error.status = 404;
    throw error;
  }

  // Vérifier si le podcaster cible est un super_admin
  if (podcaster.user_id) {
    const targetUser = await User.findByPk(podcaster.user_id);
    if (targetUser && targetUser.role === 'super_admin') {
      // Seul le super_admin peut se supprimer lui-même
      if (!requestingUser || requestingUser.role !== 'super_admin') {
        const error = new Error('Impossible de supprimer le super administrateur.');
        error.status = 403;
        throw error;
      }
      // Vérifier que c'est bien le super_admin qui se supprime lui-même
      if (requestingUser.id !== podcaster.user_id) {
        const error = new Error('Seul le super administrateur peut supprimer son propre profil.');
        error.status = 403;
        throw error;
      }
    }
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

// Récupérer un podcaster par son user_id
export async function getPodcasterByUserId(userId) {
  const podcaster = await Podcaster.findOne({
    where: { user_id: userId }
  });
  return podcaster;
}

// Mettre à jour le profil d'un podcaster (photo, description, profile_online)
export async function updatePodcasterProfile(id, { photo_url, description, profile_online, oldPhotoUrl }) {
  const podcaster = await Podcaster.findByPk(id);

  if (!podcaster) {
    const error = new Error('Podcasteur introuvable.');
    error.status = 404;
    throw error;
  }

  // Si nouvelle photo, supprimer l'ancienne
  if (photo_url !== undefined) {
    if (oldPhotoUrl && podcaster.photo_url) {
      deleteFile(podcaster.photo_url);
    }
    podcaster.photo_url = photo_url;
  }

  if (description !== undefined) {
    // Limiter à 450 mots
    const words = description.trim().split(/\s+/);
    if (words.length > 450) {
      const error = new Error('La description ne peut pas dépasser 450 mots.');
      error.status = 400;
      throw error;
    }
    podcaster.description = description.trim();
  }

  if (profile_online !== undefined) {
    podcaster.profile_online = profile_online;
  }

  await podcaster.save();
  return podcaster;
}

// Toggle le statut admin d'un podcaster
export async function togglePodcasterAdmin(podcasterId, makeAdmin, requestingUserId) {
  const podcaster = await Podcaster.findByPk(podcasterId);

  if (!podcaster) {
    const error = new Error('Podcasteur introuvable.');
    error.status = 404;
    throw error;
  }

  if (!podcaster.user_id) {
    const error = new Error('Ce podcaster n\'a pas de compte utilisateur associé.');
    error.status = 400;
    throw error;
  }

  const user = await User.findByPk(podcaster.user_id);

  if (!user) {
    const error = new Error('Compte utilisateur du podcaster introuvable.');
    error.status = 404;
    throw error;
  }

  // Ne pas permettre de modifier un super_admin
  if (user.role === 'super_admin') {
    const error = new Error('Impossible de modifier le statut d\'un super admin.');
    error.status = 403;
    throw error;
  }

  // Ne pas permettre de se modifier soi-même
  if (podcaster.user_id === requestingUserId) {
    const error = new Error('Vous ne pouvez pas modifier votre propre statut.');
    error.status = 403;
    throw error;
  }

  if (makeAdmin) {
    user.role = 'admin';
  } else {
    user.role = 'podcaster';
  }

  await user.save();

  // Retourner le podcaster avec le nouveau rôle
  const data = podcaster.toJSON();
  data.role = user.role;
  return data;
}

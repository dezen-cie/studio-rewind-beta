// src/routes/podcaster.dashboard.routes.js
import { Router } from 'express';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import { authenticate } from '../middlewares/auth.middleware.js';
import { Reservation, User, Podcaster, PodcasterBlockedSlot } from '../models/index.js';
import { uploadPodcasterPhoto, uploadPodcasterFiles, processAndUploadFile, deleteFile } from '../config/upload.js';
import { updatePodcasterProfile } from '../services/podcaster.service.js';

const router = Router();
const SALT_ROUNDS = 10;

// Middleware pour vérifier que l'utilisateur est un podcasteur (ou admin avec profil podcaster)
async function requirePodcaster(req, res, next) {
  if (!req.user) {
    return res.status(403).json({ message: 'Acces reserve aux podcasteurs.' });
  }

  // Si le rôle est podcaster, c'est ok
  if (req.user.role === 'podcaster') {
    return next();
  }

  // Si le rôle est admin ou super_admin, vérifier qu'il a un profil podcaster
  if (req.user.role === 'admin' || req.user.role === 'super_admin') {
    const podcaster = await Podcaster.findOne({ where: { user_id: req.user.id } });
    if (podcaster) {
      return next();
    }
  }

  return res.status(403).json({ message: 'Acces reserve aux podcasteurs.' });
}

// Récupérer les informations du podcasteur connecté
router.get('/me', authenticate, requirePodcaster, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Podcaster,
        as: 'podcaster'
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        must_change_password: user.must_change_password
      },
      podcaster: user.podcaster
    });
  } catch (error) {
    console.error('Erreur getPodcasterMe:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Récupérer les réservations du podcasteur pour un jour donné
router.get('/reservations/:date', authenticate, requirePodcaster, async (req, res) => {
  try {
    const { date } = req.params;

    // Récupérer le podcaster associé à cet utilisateur
    const podcaster = await Podcaster.findOne({
      where: { user_id: req.user.id }
    });

    if (!podcaster) {
      return res.status(404).json({ message: 'Profil podcasteur introuvable.' });
    }

    const target = new Date(date);
    if (isNaN(target.getTime())) {
      return res.status(400).json({ message: 'Date invalide.' });
    }

    const startOfDay = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
      0, 0, 0
    );
    const endOfDay = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
      23, 59, 59
    );

    const reservations = await Reservation.findAll({
      where: {
        podcaster_id: podcaster.id,
        status: { [Op.ne]: 'cancelled' },
        start_date: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      include: [{
        model: User,
        attributes: ['id', 'email', 'firstname', 'lastname', 'company_name', 'phone']
      }],
      order: [['start_date', 'ASC']]
    });

    return res.json(reservations);
  } catch (error) {
    console.error('Erreur getPodcasterReservations:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Récupérer toutes les réservations à venir du podcasteur
router.get('/reservations', authenticate, requirePodcaster, async (req, res) => {
  try {
    // Récupérer le podcaster associé à cet utilisateur
    const podcaster = await Podcaster.findOne({
      where: { user_id: req.user.id }
    });

    if (!podcaster) {
      return res.status(404).json({ message: 'Profil podcasteur introuvable.' });
    }

    const now = new Date();

    const reservations = await Reservation.findAll({
      where: {
        podcaster_id: podcaster.id,
        status: { [Op.ne]: 'cancelled' },
        start_date: { [Op.gte]: now }
      },
      include: [{
        model: User,
        attributes: ['id', 'email', 'firstname', 'lastname', 'company_name', 'phone']
      }],
      order: [['start_date', 'ASC']]
    });

    return res.json(reservations);
  } catch (error) {
    console.error('Erreur getPodcasterAllReservations:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Changer le mot de passe du podcasteur
router.post('/change-password', authenticate, requirePodcaster, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({
        message: 'Le nouveau mot de passe doit contenir au moins 6 caracteres.'
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    // Si ce n'est pas le premier changement de mot de passe, vérifier l'ancien
    if (!user.must_change_password) {
      if (!current_password) {
        return res.status(400).json({ message: 'Le mot de passe actuel est obligatoire.' });
      }

      const isMatch = await bcrypt.compare(current_password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Mot de passe actuel incorrect.' });
      }
    }

    // Hasher et sauvegarder le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(new_password, SALT_ROUNDS);
    user.password = hashedPassword;
    user.must_change_password = false;
    await user.save();

    return res.json({
      success: true,
      message: 'Mot de passe modifie avec succes.'
    });
  } catch (error) {
    console.error('Erreur changePassword:', error);
    return res.status(500).json({ message: error.message });
  }
});

// ====== GESTION DU PROFIL EQUIPE ======

// Mettre à jour le profil du podcasteur (photo, description, profile_online)
router.patch('/profile', authenticate, requirePodcaster, uploadPodcasterPhoto, async (req, res) => {
  let photo_url = undefined;

  try {
    const podcaster = await Podcaster.findOne({
      where: { user_id: req.user.id }
    });

    if (!podcaster) {
      return res.status(404).json({ message: 'Profil podcasteur introuvable.' });
    }

    const { description, profile_online } = req.body;

    // Gérer l'upload de photo
    let oldPhotoUrl = false;
    if (req.files && req.files.photo && req.files.photo[0]) {
      photo_url = await processAndUploadFile(req.files.photo[0]);
      oldPhotoUrl = !!podcaster.photo_url;
    }

    const updatedPodcaster = await updatePodcasterProfile(podcaster.id, {
      photo_url,
      description,
      profile_online: profile_online === 'true' || profile_online === true,
      oldPhotoUrl
    });

    return res.json(updatedPodcaster);
  } catch (error) {
    console.error('Erreur updateProfile:', error);
    // Supprimer le fichier uploadé en cas d'erreur
    if (photo_url) deleteFile(photo_url);
    return res.status(error.status || 500).json({ message: error.message });
  }
});

// ====== GESTION DES CRENEAUX BLOQUES ======

// Recuperer tous les creneaux bloques du podcasteur
router.get('/blocked-slots', authenticate, requirePodcaster, async (req, res) => {
  try {
    const podcaster = await Podcaster.findOne({
      where: { user_id: req.user.id }
    });

    if (!podcaster) {
      return res.status(404).json({ message: 'Profil podcasteur introuvable.' });
    }

    const blockedSlots = await PodcasterBlockedSlot.findAll({
      where: { podcaster_id: podcaster.id },
      order: [['date', 'ASC'], ['start_time', 'ASC']]
    });

    return res.json(blockedSlots);
  } catch (error) {
    console.error('Erreur getBlockedSlots:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Recuperer les creneaux bloques pour une date donnee
router.get('/blocked-slots/date/:date', authenticate, requirePodcaster, async (req, res) => {
  try {
    const { date } = req.params;

    const podcaster = await Podcaster.findOne({
      where: { user_id: req.user.id }
    });

    if (!podcaster) {
      return res.status(404).json({ message: 'Profil podcasteur introuvable.' });
    }

    const blockedSlots = await PodcasterBlockedSlot.findAll({
      where: {
        podcaster_id: podcaster.id,
        date: date
      },
      order: [['start_time', 'ASC']]
    });

    return res.json(blockedSlots);
  } catch (error) {
    console.error('Erreur getBlockedSlotsByDate:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Creer un nouveau creneau bloque
router.post('/blocked-slots', authenticate, requirePodcaster, async (req, res) => {
  try {
    const { date, start_time, end_time, is_full_day, reason } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'La date est obligatoire.' });
    }

    const podcaster = await Podcaster.findOne({
      where: { user_id: req.user.id }
    });

    if (!podcaster) {
      return res.status(404).json({ message: 'Profil podcasteur introuvable.' });
    }

    // Verifier que la date n'est pas dans le passe
    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate < today) {
      return res.status(400).json({ message: 'Impossible de bloquer une date passee.' });
    }

    // Si ce n'est pas un jour entier, verifier les heures
    if (!is_full_day) {
      if (!start_time || !end_time) {
        return res.status(400).json({
          message: 'Les heures de debut et de fin sont obligatoires pour un creneau partiel.'
        });
      }

      // Verifier que l'heure de fin est apres l'heure de debut
      if (start_time >= end_time) {
        return res.status(400).json({
          message: "L'heure de fin doit etre apres l'heure de debut."
        });
      }
    }

    const blockedSlot = await PodcasterBlockedSlot.create({
      podcaster_id: podcaster.id,
      date,
      start_time: is_full_day ? null : start_time,
      end_time: is_full_day ? null : end_time,
      is_full_day: is_full_day || false,
      reason: reason || null
    });

    return res.status(201).json(blockedSlot);
  } catch (error) {
    console.error('Erreur createBlockedSlot:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Supprimer un creneau bloque
router.delete('/blocked-slots/:id', authenticate, requirePodcaster, async (req, res) => {
  try {
    const { id } = req.params;

    const podcaster = await Podcaster.findOne({
      where: { user_id: req.user.id }
    });

    if (!podcaster) {
      return res.status(404).json({ message: 'Profil podcasteur introuvable.' });
    }

    const blockedSlot = await PodcasterBlockedSlot.findOne({
      where: {
        id,
        podcaster_id: podcaster.id
      }
    });

    if (!blockedSlot) {
      return res.status(404).json({ message: 'Creneau bloque introuvable.' });
    }

    await blockedSlot.destroy();

    return res.json({ success: true, message: 'Creneau bloque supprime.' });
  } catch (error) {
    console.error('Erreur deleteBlockedSlot:', error);
    return res.status(500).json({ message: error.message });
  }
});

// ====== DEVENIR / QUITTER PODCASTER ======

// Vérifier si l'utilisateur actuel a un profil podcaster
router.get('/check-podcaster', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    // Seuls les admins/super_admins peuvent accéder à cette route
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.role !== 'podcaster') {
      return res.status(403).json({ message: 'Accès non autorisé.' });
    }

    const podcaster = await Podcaster.findOne({ where: { user_id: req.user.id } });

    return res.json({
      hasPodcasterProfile: !!podcaster,
      podcaster: podcaster || null
    });
  } catch (error) {
    console.error('Erreur checkPodcaster:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Devenir podcaster (pour admin/super_admin sans profil podcaster)
router.post('/become-podcaster', authenticate, uploadPodcasterFiles, async (req, res) => {
  let video_url = null;
  let audio_url = null;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    // Seuls les admins/super_admins peuvent devenir podcaster via cette route
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Seuls les administrateurs peuvent utiliser cette fonctionnalité.' });
    }

    // Vérifier qu'il n'a pas déjà un profil podcaster
    const existingPodcaster = await Podcaster.findOne({ where: { user_id: req.user.id } });
    if (existingPodcaster) {
      return res.status(400).json({ message: 'Vous avez déjà un profil podcaster.' });
    }

    const { name } = req.body;
    const videoFile = req.files?.video?.[0];
    const audioFile = req.files?.audio?.[0];

    // Le nom est obligatoire
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Le nom est obligatoire.' });
    }

    // Uploader les fichiers si fournis
    if (videoFile) {
      video_url = await processAndUploadFile(videoFile);
    }
    if (audioFile) {
      audio_url = await processAndUploadFile(audioFile);
    }

    // Récupérer l'ordre max actuel
    const maxOrder = await Podcaster.max('display_order') || 0;

    const podcaster = await Podcaster.create({
      name: name.trim(),
      video_url,
      audio_url,
      display_order: maxOrder + 1,
      is_active: true,
      profile_online: false,
      user_id: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: 'Profil podcaster créé avec succès.',
      podcaster
    });
  } catch (error) {
    console.error('Erreur becomePodcaster:', error);
    // Supprimer les fichiers uploadés en cas d'erreur
    if (video_url) deleteFile(video_url);
    if (audio_url) deleteFile(audio_url);
    return res.status(500).json({ message: error.message });
  }
});

// Désactiver le profil podcaster (ne plus être podcaster)
router.patch('/deactivate-podcaster', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    const podcaster = await Podcaster.findOne({ where: { user_id: req.user.id } });

    if (!podcaster) {
      return res.status(404).json({ message: 'Profil podcaster introuvable.' });
    }

    // Désactiver le profil (ne pas supprimer)
    podcaster.is_active = false;
    podcaster.profile_online = false;
    await podcaster.save();

    return res.json({
      success: true,
      message: 'Profil podcaster désactivé.',
      podcaster
    });
  } catch (error) {
    console.error('Erreur deactivatePodcaster:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Réactiver le profil podcaster
router.patch('/reactivate-podcaster', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    const podcaster = await Podcaster.findOne({ where: { user_id: req.user.id } });

    if (!podcaster) {
      return res.status(404).json({ message: 'Profil podcaster introuvable.' });
    }

    // Réactiver le profil
    podcaster.is_active = true;
    await podcaster.save();

    return res.json({
      success: true,
      message: 'Profil podcaster réactivé.',
      podcaster
    });
  } catch (error) {
    console.error('Erreur reactivatePodcaster:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Uploader/mettre à jour les fichiers video/audio du podcaster
router.patch('/upload-media', authenticate, uploadPodcasterFiles, async (req, res) => {
  let video_url = null;
  let audio_url = null;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    const podcaster = await Podcaster.findOne({ where: { user_id: req.user.id } });

    if (!podcaster) {
      return res.status(404).json({ message: 'Profil podcaster introuvable.' });
    }

    const videoFile = req.files?.video?.[0];
    const audioFile = req.files?.audio?.[0];

    if (!videoFile && !audioFile) {
      return res.status(400).json({ message: 'Aucun fichier fourni.' });
    }

    // Supprimer les anciens fichiers et uploader les nouveaux
    if (videoFile) {
      if (podcaster.video_url) deleteFile(podcaster.video_url);
      video_url = await processAndUploadFile(videoFile);
      podcaster.video_url = video_url;
    }
    if (audioFile) {
      if (podcaster.audio_url) deleteFile(podcaster.audio_url);
      audio_url = await processAndUploadFile(audioFile);
      podcaster.audio_url = audio_url;
    }

    await podcaster.save();

    return res.json({
      success: true,
      message: 'Fichiers mis à jour.',
      podcaster
    });
  } catch (error) {
    console.error('Erreur uploadMedia:', error);
    // Supprimer les fichiers uploadés en cas d'erreur
    if (video_url) deleteFile(video_url);
    if (audio_url) deleteFile(audio_url);
    return res.status(500).json({ message: error.message });
  }
});

export default router;

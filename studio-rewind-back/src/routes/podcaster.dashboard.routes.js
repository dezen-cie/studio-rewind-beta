// src/routes/podcaster.dashboard.routes.js
import { Router } from 'express';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import { authenticate } from '../middlewares/auth.middleware.js';
import { Reservation, User, Podcaster, PodcasterBlockedSlot } from '../models/index.js';

const router = Router();
const SALT_ROUNDS = 10;

// Middleware pour vérifier que l'utilisateur est un podcasteur
function requirePodcaster(req, res, next) {
  if (!req.user || req.user.role !== 'podcaster') {
    return res.status(403).json({ message: 'Acces reserve aux podcasteurs.' });
  }
  next();
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

export default router;

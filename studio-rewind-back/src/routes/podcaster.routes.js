// src/routes/podcaster.routes.js
import { Router } from 'express';
import { Op } from 'sequelize';
import { getActivePodcasters } from '../services/podcaster.service.js';
import { Reservation, PodcasterBlockedSlot } from '../models/index.js';

const router = Router();

// Route publique pour récupérer les podcasteurs actifs
router.get('/', async (req, res) => {
  try {
    const podcasters = await getActivePodcasters();
    return res.json(podcasters);
  } catch (error) {
    console.error('Erreur getActivePodcasters:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
});

// Route publique pour récupérer les réservations d'un podcasteur pour un jour donné
// Utilisé pour filtrer les créneaux disponibles dans le tunnel de réservation
router.get('/:podcasterId/reservations/:date', async (req, res) => {
  try {
    const { podcasterId, date } = req.params;

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
        podcaster_id: podcasterId,
        status: { [Op.ne]: 'cancelled' },
        start_date: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      attributes: ['id', 'formula', 'start_date', 'end_date', 'status'],
      order: [['start_date', 'ASC']]
    });

    return res.json(reservations);
  } catch (error) {
    console.error('Erreur getPodcasterReservations:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
});

// Route publique pour recuperer les creneaux bloques d'un podcasteur pour un jour donne
// Utilise pour filtrer les creneaux disponibles dans le tunnel de reservation
router.get('/:podcasterId/blocked-slots/:date', async (req, res) => {
  try {
    const { podcasterId, date } = req.params;

    const blockedSlots = await PodcasterBlockedSlot.findAll({
      where: {
        podcaster_id: podcasterId,
        date: date
      },
      attributes: ['id', 'date', 'start_time', 'end_time', 'is_full_day'],
      order: [['start_time', 'ASC']]
    });

    return res.json(blockedSlots);
  } catch (error) {
    console.error('Erreur getPodcasterBlockedSlots:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
});

export default router;

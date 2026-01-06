// src/controllers/reservation.controller.js
import {
  previewReservation,
  createReservation,
  getUserReservations,
  getReservationsByDayPublic
} from '../services/reservation.service.js';
import { getBlockedSlotsForDate } from '../services/blockedSlot.service.js';

// ============= PUBLIC : créneaux du jour (step 2 tunnel, espace membre abo) =============

export async function getByDayPublic(req, res) {
  try {
    const { date } = req.params;
    if (!date) {
      return res.status(400).json({ message: 'Date manquante.' });
    }

    const reservations = await getReservationsByDayPublic(date);
    return res.json(reservations);
  } catch (error) {
    console.error('Erreur getByDayPublic:', error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Erreur serveur.' });
  }
}

// ================== UTILISATEUR COURANT ==================

export async function preview(req, res) {
  try {
    const { formula, start_date, end_date } = req.body;

    if (!formula || !start_date || !end_date) {
      return res.status(400).json({
        message:
          'Formule, date de début et date de fin sont obligatoires.'
      });
    }

    const data = await previewReservation(req.user.id, {
      formula,
      start_date,
      end_date
    });

    return res.json(data);
  } catch (error) {
    console.error('Erreur preview reservation:', error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Erreur serveur.' });
  }
}

export async function create(req, res) {
  try {
    const { formula, start_date, end_date, is_subscription } = req.body;

    if (!formula || !start_date || !end_date) {
      return res.status(400).json({
        message:
          'Formule, date de début et date de fin sont obligatoires.'
      });
    }

    const reservation = await createReservation(req.user.id, {
      formula,
      start_date,
      end_date,
      is_subscription: !!is_subscription
    });

    return res.status(201).json(reservation);
  } catch (error) {
    console.error('Erreur create reservation:', error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Erreur serveur.' });
  }
}

export async function getMine(req, res) {
  try {
    const reservations = await getUserReservations(req.user.id);
    return res.json(reservations);
  } catch (error) {
    console.error('Erreur get user reservations:', error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Erreur serveur.' });
  }
}

// ============= PUBLIC : blocages du jour =============

export async function getBlockedByDayPublic(req, res) {
  try {
    const { date } = req.params;
    if (!date) {
      return res.status(400).json({ message: 'Date manquante.' });
    }

    const blockedSlots = await getBlockedSlotsForDate(date);
    return res.json(blockedSlots);
  } catch (error) {
    console.error('Erreur getBlockedByDayPublic:', error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Erreur serveur.' });
  }
}

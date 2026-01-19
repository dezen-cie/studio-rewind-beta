// src/controllers/admin.reservation.controller.js
import {
  adminListReservations,
  adminGetReservationsByDay,
  adminUpdateReservation,
  adminCancelReservation
} from '../services/reservation.service.js';
import { markReservationsAsViewed } from '../services/notification.service.js';

export async function getAllReservations(req, res) {
  try {
    const reservations = await adminListReservations();
    // Marquer les nouvelles réservations comme vues
    await markReservationsAsViewed();
    return res.json(reservations);
  } catch (error) {
    console.error('Erreur getAllReservations:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function getReservationsByDay(req, res) {
  try {
    const { date } = req.params; // format attendu: YYYY-MM-DD
    const reservations = await adminGetReservationsByDay(date);
    return res.json(reservations);
  } catch (error) {
    console.error('Erreur getReservationsByDay:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function updateReservationDates(req, res) {
  try {
    const { reservationId } = req.params;
    const { start_date, end_date } = req.body;

    if (!start_date || !end_date) {
      return res
        .status(400)
        .json({ message: 'Les dates de début et de fin sont obligatoires.' });
    }

    const reservation = await adminUpdateReservation(reservationId, {
      start_date,
      end_date
    });

    return res.json(reservation);
  } catch (error) {
    console.error('Erreur updateReservationDates:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function cancelReservation(req, res) {
  try {
    const { reservationId } = req.params;
    const reservation = await adminCancelReservation(reservationId);
    return res.json(reservation);
  } catch (error) {
    console.error('Erreur cancelReservation:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

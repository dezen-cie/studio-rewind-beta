// src/controllers/admin.dashboard.controller.js
import {
  getDashboardSummary,
  getDayReservations,
  getUpcomingReservations,
  getDayOccupancyRate,
  getMonthReservationDays
} from '../services/admin.dashboard.service.js';

export async function getDashboardSummaryController(req, res) {
  try {
    const { date } = req.query;
    const summary = await getDashboardSummary(date);
    return res.json(summary);
  } catch (error) {
    console.error('Erreur getDashboardSummary:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function getDayReservationsController(req, res) {
  try {
    const { date } = req.query;
    const reservations = await getDayReservations(date);
    return res.json(reservations);
  } catch (error) {
    console.error('Erreur getDayReservations:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function getUpcomingReservationsController(req, res) {
  try {
    const { date } = req.query;
    const reservations = await getUpcomingReservations(date);
    return res.json(reservations);
  } catch (error) {
    console.error('Erreur getUpcomingReservations:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function getDayOccupancyController(req, res) {
  try {
    const { date } = req.query;
    const occupancy = await getDayOccupancyRate(date);
    return res.json(occupancy);
  } catch (error) {
    console.error('Erreur getDayOccupancy:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function getMonthReservationDaysController(req, res) {
  try {
    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ message: 'Les paramètres year et month sont requis.' });
    }
    const days = await getMonthReservationDays(parseInt(year), parseInt(month) - 1);
    return res.json(days);
  } catch (error) {
    console.error('Erreur getMonthReservationDays:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

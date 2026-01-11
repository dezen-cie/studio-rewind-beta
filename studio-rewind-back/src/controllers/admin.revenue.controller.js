// src/controllers/admin.revenue.controller.js
import {
  getPodcastersRevenueByMonth,
  getAvailableMonths
} from '../services/podcasterRevenue.service.js';

/**
 * Récupère le CA des podcasteurs pour un mois donné
 */
export async function getRevenueByMonth(req, res) {
  try {
    const { year, month } = req.params;

    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ message: 'Année ou mois invalide.' });
    }

    const data = await getPodcastersRevenueByMonth(yearNum, monthNum);
    return res.json(data);
  } catch (error) {
    console.error('Erreur getRevenueByMonth:', error);
    return res.status(500).json({ message: error.message });
  }
}

/**
 * Récupère les mois disponibles
 */
export async function getAvailableMonthsController(req, res) {
  try {
    const months = await getAvailableMonths();
    return res.json(months);
  } catch (error) {
    console.error('Erreur getAvailableMonths:', error);
    return res.status(500).json({ message: error.message });
  }
}

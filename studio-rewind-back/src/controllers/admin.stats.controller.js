// src/controllers/admin.stats.controller.js
import {
  getStatsOverview,
  getRevenueEvolution,
  getTopClients,
  getRevenueByFormula,
  getSessionsByPodcaster,
  comparePeriods
} from '../services/admin.stats.service.js';

/**
 * GET /admin/stats/overview
 * Statistiques globales pour une période
 */
export async function getOverviewController(req, res) {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Les paramètres start_date et end_date sont requis.' });
    }

    const stats = await getStatsOverview(start_date, end_date);
    return res.json(stats);
  } catch (error) {
    console.error('Erreur getStatsOverview:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

/**
 * GET /admin/stats/evolution
 * Evolution du CA par jour/semaine/mois
 */
export async function getEvolutionController(req, res) {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Les paramètres start_date et end_date sont requis.' });
    }

    const evolution = await getRevenueEvolution(start_date, end_date, group_by);
    return res.json(evolution);
  } catch (error) {
    console.error('Erreur getRevenueEvolution:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

/**
 * GET /admin/stats/top-clients
 * Top clients par CA
 */
export async function getTopClientsController(req, res) {
  try {
    const { start_date, end_date, limit = 10 } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Les paramètres start_date et end_date sont requis.' });
    }

    const clients = await getTopClients(start_date, end_date, parseInt(limit));
    return res.json(clients);
  } catch (error) {
    console.error('Erreur getTopClients:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

/**
 * GET /admin/stats/by-formula
 * CA par formule
 */
export async function getByFormulaController(req, res) {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Les paramètres start_date et end_date sont requis.' });
    }

    const byFormula = await getRevenueByFormula(start_date, end_date);
    return res.json(byFormula);
  } catch (error) {
    console.error('Erreur getRevenueByFormula:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

/**
 * GET /admin/stats/by-podcaster
 * Sessions par podcasteur
 */
export async function getByPodcasterController(req, res) {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Les paramètres start_date et end_date sont requis.' });
    }

    const byPodcaster = await getSessionsByPodcaster(start_date, end_date);
    return res.json(byPodcaster);
  } catch (error) {
    console.error('Erreur getSessionsByPodcaster:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

/**
 * GET /admin/stats/compare
 * Comparer deux périodes
 */
export async function getCompareController(req, res) {
  try {
    const { current_start, current_end, previous_start, previous_end } = req.query;

    if (!current_start || !current_end || !previous_start || !previous_end) {
      return res.status(400).json({
        message: 'Les paramètres current_start, current_end, previous_start et previous_end sont requis.'
      });
    }

    const comparison = await comparePeriods(current_start, current_end, previous_start, previous_end);
    return res.json(comparison);
  } catch (error) {
    console.error('Erreur comparePeriods:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

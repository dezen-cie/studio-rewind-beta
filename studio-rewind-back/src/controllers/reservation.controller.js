// src/controllers/reservation.controller.js
import {
  previewReservation,
  createReservation,
  getUserReservations,
  getReservationsByDayPublic
} from '../services/reservation.service.js';
import {
  getBlockedSlotsForDate,
  getUnblocksForDate,
  getDefaultBlockedRanges,
  getUnblockDatesForMonth
} from '../services/blockedSlot.service.js';
import {
  getStudioSettings,
  getDefaultBlockedRangesFromSettings
} from '../services/studioSettings.service.js';

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
    const { formula, start_date, end_date, is_subscription, podcaster_id } = req.body;

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
      podcaster_id,
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

// ============= PUBLIC : heures bloquées par défaut =============

export async function getDefaultBlockedHoursPublic(_req, res) {
  try {
    // Utiliser les paramètres de la base de données au lieu des valeurs hardcodées
    const ranges = await getDefaultBlockedRangesFromSettings();
    return res.json(ranges);
  } catch (error) {
    console.error('Erreur getDefaultBlockedHoursPublic:', error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Erreur serveur.' });
  }
}

// ============= PUBLIC : déblocages du jour =============

export async function getUnblocksByDayPublic(req, res) {
  try {
    const { date } = req.params;
    if (!date) {
      return res.status(400).json({ message: 'Date manquante.' });
    }

    const unblocks = await getUnblocksForDate(date);
    return res.json(unblocks);
  } catch (error) {
    console.error('Erreur getUnblocksByDayPublic:', error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Erreur serveur.' });
  }
}

// ============= PUBLIC : paramètres du studio =============

export async function getStudioSettingsPublic(_req, res) {
  try {
    const settings = await getStudioSettings();
    return res.json({
      opening_time: settings.opening_time,
      closing_time: settings.closing_time,
      open_days: settings.open_days
    });
  } catch (error) {
    console.error('Erreur getStudioSettingsPublic:', error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Erreur serveur.' });
  }
}

// ============= PUBLIC : plages bloquées calculées =============

export async function getComputedBlockedRangesPublic(_req, res) {
  try {
    const ranges = await getDefaultBlockedRangesFromSettings();
    return res.json(ranges);
  } catch (error) {
    console.error('Erreur getComputedBlockedRangesPublic:', error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Erreur serveur.' });
  }
}

// ============= PUBLIC : dates avec déblocages pour un mois =============

export async function getUnblockDatesForMonthPublic(req, res) {
  try {
    const { year, month } = req.params;
    if (!year || !month) {
      return res.status(400).json({ message: 'Année et mois requis.' });
    }
    const dates = await getUnblockDatesForMonth(parseInt(year, 10), parseInt(month, 10));
    return res.json(dates);
  } catch (error) {
    console.error('Erreur getUnblockDatesForMonthPublic:', error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Erreur serveur.' });
  }
}

// src/services/studioSettings.service.js
import { StudioSettings } from '../models/index.js';

// Valeurs par défaut
const DEFAULT_SETTINGS = {
  opening_time: '09:00',
  closing_time: '18:00',
  open_days: [1, 2, 3, 4, 5] // Lundi à Vendredi
};

/**
 * Récupère les paramètres du studio (crée avec les valeurs par défaut si inexistant)
 */
export async function getStudioSettings() {
  let settings = await StudioSettings.findOne({ where: { key: 'main' } });

  if (!settings) {
    settings = await StudioSettings.create({
      key: 'main',
      ...DEFAULT_SETTINGS
    });
  }

  return settings;
}

/**
 * Met à jour les paramètres du studio
 */
export async function updateStudioSettings({ opening_time, closing_time, open_days }) {
  let settings = await StudioSettings.findOne({ where: { key: 'main' } });

  if (!settings) {
    settings = await StudioSettings.create({
      key: 'main',
      opening_time: opening_time || DEFAULT_SETTINGS.opening_time,
      closing_time: closing_time || DEFAULT_SETTINGS.closing_time,
      open_days: open_days || DEFAULT_SETTINGS.open_days
    });
  } else {
    // Validation de l'heure de fermeture > ouverture
    const openTime = opening_time || settings.opening_time;
    const closeTime = closing_time || settings.closing_time;

    if (closeTime <= openTime) {
      const error = new Error("L'heure de fermeture doit être après l'heure d'ouverture.");
      error.status = 400;
      throw error;
    }

    await settings.update({
      opening_time: opening_time !== undefined ? opening_time : settings.opening_time,
      closing_time: closing_time !== undefined ? closing_time : settings.closing_time,
      open_days: open_days !== undefined ? open_days : settings.open_days
    });
  }

  return settings;
}

/**
 * Calcule les plages horaires bloquées par défaut basées sur les paramètres
 * @returns {Array} [{ start: number, end: number }, ...]
 */
export async function getDefaultBlockedRangesFromSettings() {
  const settings = await getStudioSettings();

  const openingHour = parseInt(settings.opening_time.split(':')[0], 10);
  const closingHour = parseInt(settings.closing_time.split(':')[0], 10);

  const ranges = [];

  // Avant l'ouverture (minuit jusqu'à l'heure d'ouverture)
  if (openingHour > 0) {
    ranges.push({ start: 0, end: openingHour });
  }

  // Après la fermeture (heure de fermeture jusqu'à minuit)
  if (closingHour < 24) {
    ranges.push({ start: closingHour, end: 24 });
  }

  return ranges;
}

/**
 * Vérifie si un jour donné est ouvert
 * @param {number} dayOfWeek - Jour de la semaine (0=Dimanche, 1=Lundi, ..., 6=Samedi en JS)
 * @returns {Promise<boolean>}
 */
export async function isDayOpen(dayOfWeek) {
  const settings = await getStudioSettings();

  // Convertir le format JS (0=Dimanche) vers notre format (1=Lundi, 7=Dimanche)
  const ourDayFormat = dayOfWeek === 0 ? 7 : dayOfWeek;

  return settings.open_days.includes(ourDayFormat);
}

/**
 * Retourne les heures d'ouverture formatées
 */
export async function getOpeningHours() {
  const settings = await getStudioSettings();

  return {
    opening_time: settings.opening_time,
    closing_time: settings.closing_time,
    opening_hour: parseInt(settings.opening_time.split(':')[0], 10),
    closing_hour: parseInt(settings.closing_time.split(':')[0], 10)
  };
}

/**
 * Retourne les jours d'ouverture
 */
export async function getOpenDays() {
  const settings = await getStudioSettings();
  return settings.open_days;
}

// src/services/studioSettings.service.js
import { StudioSettings } from '../models/index.js';

// Valeurs par défaut
const DEFAULT_SETTINGS = {
  opening_time: '09:00',
  closing_time: '18:00',
  open_days: [1, 2, 3, 4, 5], // Lundi à Vendredi
  vat_rate: 20.00,
  commission_rate: 20.00,
  night_surcharge_before: '09:00',
  night_surcharge_after: '18:00',
  night_surcharge_percent: 0.00,
  weekend_surcharge_percent: 0.00,
  reminder_enabled: true,
  reminder_hours_before: 24,
  holidays_closure_enabled: false
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
 * Met à jour les paramètres du studio (horaires uniquement - pour compatibilité)
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
 * Met à jour tous les paramètres du studio
 */
export async function updateAllStudioSettings(data) {
  let settings = await StudioSettings.findOne({ where: { key: 'main' } });

  if (!settings) {
    settings = await StudioSettings.create({
      key: 'main',
      ...DEFAULT_SETTINGS,
      ...data
    });
  } else {
    // Validation horaires si fournis
    if (data.opening_time || data.closing_time) {
      const openTime = data.opening_time || settings.opening_time;
      const closeTime = data.closing_time || settings.closing_time;

      if (closeTime <= openTime) {
        const error = new Error("L'heure de fermeture doit être après l'heure d'ouverture.");
        error.status = 400;
        throw error;
      }
    }

    // Validation taux TVA
    if (data.vat_rate !== undefined) {
      const rate = parseFloat(data.vat_rate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        const error = new Error("Le taux de TVA doit être entre 0 et 100.");
        error.status = 400;
        throw error;
      }
    }

    // Validation taux commission
    if (data.commission_rate !== undefined) {
      const rate = parseFloat(data.commission_rate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        const error = new Error("Le taux de commission doit être entre 0 et 100.");
        error.status = 400;
        throw error;
      }
    }

    // Validation majoration nuit
    if (data.night_surcharge_percent !== undefined) {
      const rate = parseFloat(data.night_surcharge_percent);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        const error = new Error("La majoration nuit doit être entre 0 et 100.");
        error.status = 400;
        throw error;
      }
    }

    // Validation majoration week-end
    if (data.weekend_surcharge_percent !== undefined) {
      const rate = parseFloat(data.weekend_surcharge_percent);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        const error = new Error("La majoration week-end doit être entre 0 et 100.");
        error.status = 400;
        throw error;
      }
    }

    // Validation délai rappel
    if (data.reminder_hours_before !== undefined) {
      const hours = parseInt(data.reminder_hours_before);
      if (isNaN(hours) || hours < 1 || hours > 168) {
        const error = new Error("Le délai de rappel doit être entre 1 et 168 heures.");
        error.status = 400;
        throw error;
      }
    }

    await settings.update(data);
  }

  return settings;
}

/**
 * Récupère le taux de TVA actuel
 */
export async function getVatRate() {
  const settings = await getStudioSettings();
  return parseFloat(settings.vat_rate) / 100; // Retourne 0.20 pour 20%
}

/**
 * Récupère le taux de commission actuel
 */
export async function getCommissionRate() {
  const settings = await getStudioSettings();
  return parseFloat(settings.commission_rate) / 100; // Retourne 0.20 pour 20%
}

/**
 * Récupère les informations entreprise pour les factures
 */
export async function getCompanyInfo() {
  const settings = await getStudioSettings();
  return {
    name: settings.company_name,
    address: settings.company_address,
    postal_code: settings.company_postal_code,
    city: settings.company_city,
    siret: settings.company_siret,
    vat_number: settings.company_vat_number,
    email: settings.company_email,
    phone: settings.company_phone,
    bank_name: settings.bank_name,
    bank_iban: settings.bank_iban,
    bank_bic: settings.bank_bic,
    logo_path: settings.logo_path
  };
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

/**
 * Récupère les paramètres de majoration tarifaire
 */
export async function getPricingSurcharges() {
  const settings = await getStudioSettings();
  return {
    night_surcharge_before: settings.night_surcharge_before,
    night_surcharge_after: settings.night_surcharge_after,
    night_surcharge_percent: parseFloat(settings.night_surcharge_percent) / 100,
    weekend_surcharge_percent: parseFloat(settings.weekend_surcharge_percent) / 100
  };
}

/**
 * Récupère les paramètres de notifications
 */
export async function getNotificationSettings() {
  const settings = await getStudioSettings();
  return {
    confirmation_email_enabled: settings.confirmation_email_enabled,
    reminder_enabled: settings.reminder_enabled,
    reminder_hours_before: settings.reminder_hours_before
  };
}

/**
 * Vérifie si l'email de confirmation de réservation est activé
 */
export async function isConfirmationEmailEnabled() {
  const settings = await getStudioSettings();
  return settings.confirmation_email_enabled;
}

/**
 * Vérifie si les fermetures jours fériés sont activées
 */
export async function isHolidaysClosureEnabled() {
  const settings = await getStudioSettings();
  return settings.holidays_closure_enabled;
}

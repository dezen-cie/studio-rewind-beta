// src/utils/pricing.js
import { Formula } from '../models/index.js';
import { getVatRate, getPricingSurcharges } from '../services/studioSettings.service.js';

// Retourne la formule en BDD pour une clé donnée
async function getFormulaByKey(formulaKey) {
  const formula = await Formula.findOne({ where: { key: formulaKey } });
  if (!formula) {
    const error = new Error(`Formule "${formulaKey}" introuvable en base.`);
    error.status = 500;
    throw error;
  }
  return formula;
}

/**
 * Convertit une heure au format "HH:MM" en nombre décimal (ex: "09:30" => 9.5)
 */
function timeToDecimal(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + (minutes || 0) / 60;
}

/**
 * Calcule le pourcentage de majoration applicable
 * @param {Date} startDate - Date/heure de début
 * @param {Object} surcharges - Paramètres de majoration
 * @returns {number} Pourcentage de majoration (0.10 = 10%)
 */
function calculateSurchargePercent(startDate, surcharges) {
  let totalSurcharge = 0;

  const dayOfWeek = startDate.getDay(); // 0=Dimanche, 6=Samedi
  const hour = startDate.getHours() + startDate.getMinutes() / 60;

  // Majoration week-end (samedi ou dimanche)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    totalSurcharge += surcharges.weekend_surcharge_percent;
  }

  // Majoration nuit (avant l'heure "before" ou après l'heure "after")
  const nightBefore = timeToDecimal(surcharges.night_surcharge_before);
  const nightAfter = timeToDecimal(surcharges.night_surcharge_after);

  if (hour < nightBefore || hour >= nightAfter) {
    totalSurcharge += surcharges.night_surcharge_percent;
  }

  return totalSurcharge;
}

// Retourne { total_hours, price_ht, price_tva, price_ttc, surcharge_percent, surcharge_amount }
// Toutes les formules sont maintenant à prix fixe pour 1h (prix stocké en HT)
export async function calculateReservationPricing(formulaKey, startDate, endDate) {
  if (!formulaKey) {
    const error = new Error('Formule non spécifiée.');
    error.status = 400;
    throw error;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    const error = new Error('Dates de début ou de fin invalides.');
    error.status = 400;
    throw error;
  }

  if (end <= start) {
    const error = new Error('La date de fin doit être postérieure à la date de début.');
    error.status = 400;
    throw error;
  }

  const formula = await getFormulaByKey(formulaKey);

  // Prix HT de base
  let base_price_ht = formula.price_ttc; // Le champ contient le HT
  if (!base_price_ht || base_price_ht <= 0) {
    const error = new Error(
      `Tarif HT invalide pour la formule "${formulaKey}". Vérifie ta configuration en base.`
    );
    error.status = 500;
    throw error;
  }

  // Récupérer les paramètres de majoration
  const surcharges = await getPricingSurcharges();

  // Calculer la majoration applicable
  const surchargePercent = calculateSurchargePercent(start, surcharges);
  const surchargeAmount = Number((base_price_ht * surchargePercent).toFixed(2));

  // Prix HT final avec majoration
  const price_ht = Number((base_price_ht + surchargeAmount).toFixed(2));

  // Récupérer le taux de TVA dynamique
  const vatRate = await getVatRate();

  // Calcul TVA
  const price_tva = Number((price_ht * vatRate).toFixed(2));
  const price_ttc = Number((price_ht + price_tva).toFixed(2));

  return {
    total_hours: 1, // Durée fixe 1h
    price_ht,
    price_tva,
    price_ttc,
    surcharge_percent: surchargePercent * 100, // En pourcentage (ex: 10 pour 10%)
    surcharge_amount: surchargeAmount,
    vat_rate: vatRate * 100 // En pourcentage (ex: 20 pour 20%)
  };
}

// src/utils/pricing.js
import { Formula } from '../models/index.js';

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

// Retourne { total_hours, price_ht, price_tva, price_ttc }
export async function calculateReservationPricing(formulaKey, startDate, endDate) {
  if (!['autonome', 'amelioree', 'abonnement', 'reseaux'].includes(formulaKey)) {
    const error = new Error('Formule invalide.');
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

  const diffMs = end.getTime() - start.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  const total_hours_raw = Number(hours.toFixed(2)); // 2 décimales

  const formula = await getFormulaByKey(formulaKey);

  // 🔴 CAS PARTICULIER : "abonnement" = achat d'un pack d'heures
  // On considère que cette formule représente un pack (ex: 5h) vendu à un prix fixe.
  if (formulaKey === 'abonnement') {
    const HOURS_PER_PACK = 5;

    // Tu peux configurer le prix TTC en BDD dans Formula.price_ttc,
    // sinon on fallback sur 800€ TTC.
    const packPriceTtc = formula.price_ttc || 800;

    const price_ht = Number((packPriceTtc / 1.2).toFixed(2)); // TVA 20%
    const price_tva = Number((packPriceTtc - price_ht).toFixed(2));

    return {
      total_hours: HOURS_PER_PACK,
      price_ht,
      price_tva,
      price_ttc: packPriceTtc
    };
  }

  // 🟠 CAS PARTICULIER : "reseaux" = forfait avec 2h d'enregistrement + montage
  if (formulaKey === 'reseaux') {
    const HOURS_INCLUDED = 2;

    // Prix TTC en BDD dans Formula.price_ttc, sinon fallback sur 1200€ TTC.
    const forfaitPriceTtc = formula.price_ttc || 1200;

    const price_ht = Number((forfaitPriceTtc / 1.2).toFixed(2)); // TVA 20%
    const price_tva = Number((forfaitPriceTtc - price_ht).toFixed(2));

    return {
      total_hours: HOURS_INCLUDED,
      price_ht,
      price_tva,
      price_ttc: forfaitPriceTtc
    };
  }

  // 🔵 Autres formules : calcul classique à l'heure
  const rateTtc = formula.price_ttc; // prix TTC / heure
  if (!rateTtc || rateTtc <= 0) {
    const error = new Error(
      `Tarif TTC invalide pour la formule "${formulaKey}". Vérifie ta configuration en base.`
    );
    error.status = 500;
    throw error;
  }

  const price_ttc = Number((rateTtc * total_hours_raw).toFixed(2));
  const price_ht = Number((price_ttc / 1.2).toFixed(2)); // TVA 20%
  const price_tva = Number((price_ttc - price_ht).toFixed(2));

  return {
    total_hours: total_hours_raw,
    price_ht,
    price_tva,
    price_ttc
  };
}

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
// Toutes les formules sont maintenant à prix fixe pour 1h (prix stocké en HT)
export async function calculateReservationPricing(formulaKey, startDate, endDate) {
  if (!['solo', 'duo', 'pro'].includes(formulaKey)) {
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

  const formula = await getFormulaByKey(formulaKey);

  // Prix HT stocké dans price_ttc (le champ garde son nom mais contient le HT)
  const price_ht = formula.price_ttc;
  if (!price_ht || price_ht <= 0) {
    const error = new Error(
      `Tarif HT invalide pour la formule "${formulaKey}". Vérifie ta configuration en base.`
    );
    error.status = 500;
    throw error;
  }

  // Calcul TVA 20%
  const price_tva = Number((price_ht * 0.2).toFixed(2));
  const price_ttc = Number((price_ht + price_tva).toFixed(2));

  return {
    total_hours: 1, // Durée fixe 1h
    price_ht: Number(price_ht.toFixed(2)),
    price_tva,
    price_ttc
  };
}

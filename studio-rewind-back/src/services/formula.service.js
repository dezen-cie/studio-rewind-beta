// src/services/formula.service.js
import { Formula } from '../models/index.js';

export async function getAllFormulas() {
  const formulas = await Formula.findAll({
    order: [['billing_type', 'ASC'], ['key', 'ASC']]
  });
  return formulas;
}

export async function updateFormula(id, { name, price_ttc }) {
  const formula = await Formula.findByPk(id);

  if (!formula) {
    const error = new Error('Formule introuvable.');
    error.status = 404;
    throw error;
  }

  if (typeof name === 'string' && name.trim().length > 0) {
    formula.name = name.trim();
  }

  if (typeof price_ttc === 'number') {
    if (price_ttc < 0) {
      const error = new Error('Le prix doit être positif.');
      error.status = 400;
      throw error;
    }
    formula.price_ttc = price_ttc;
  }

  await formula.save();
  return formula;
}

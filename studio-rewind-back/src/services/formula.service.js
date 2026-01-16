// src/services/formula.service.js
import { Formula, FormulaOption } from '../models/index.js';

export async function getAllFormulas() {
  const formulas = await Formula.findAll({
    include: [{
      model: FormulaOption,
      as: 'options',
      order: [['display_order', 'ASC']]
    }],
    order: [['billing_type', 'ASC'], ['key', 'ASC']]
  });
  return formulas;
}

// ====== OPTIONS ======

export async function getFormulaOptions(formulaId) {
  const options = await FormulaOption.findAll({
    where: { formula_id: formulaId },
    order: [['display_order', 'ASC']]
  });
  return options;
}

export async function createFormulaOption(formulaId, { icon, content, display_order }) {
  const formula = await Formula.findByPk(formulaId);
  if (!formula) {
    const error = new Error('Formule introuvable.');
    error.status = 404;
    throw error;
  }

  const option = await FormulaOption.create({
    formula_id: formulaId,
    icon: icon || 'Circle',
    content: content || '',
    display_order: display_order ?? 0
  });

  return option;
}

export async function updateFormulaOption(optionId, { icon, content, display_order }) {
  const option = await FormulaOption.findByPk(optionId);
  if (!option) {
    const error = new Error('Option introuvable.');
    error.status = 404;
    throw error;
  }

  if (icon !== undefined) option.icon = icon;
  if (content !== undefined) option.content = content;
  if (display_order !== undefined) option.display_order = display_order;

  await option.save();
  return option;
}

export async function deleteFormulaOption(optionId) {
  const option = await FormulaOption.findByPk(optionId);
  if (!option) {
    const error = new Error('Option introuvable.');
    error.status = 404;
    throw error;
  }

  await option.destroy();
  return { success: true };
}

export async function updateFormula(id, { name, price_ttc, requires_podcaster }) {
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

  if (typeof requires_podcaster === 'boolean') {
    formula.requires_podcaster = requires_podcaster;
  }

  await formula.save();
  return formula;
}

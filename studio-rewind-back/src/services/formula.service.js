// src/services/formula.service.js
import { Formula, FormulaOption } from '../models/index.js';

export async function getAllFormulas() {
  const formulas = await Formula.findAll({
    include: [{
      model: FormulaOption,
      as: 'options',
      order: [['display_order', 'ASC']]
    }],
    order: [['display_order', 'ASC'], ['price_ttc', 'ASC']]
  });
  return formulas;
}

export async function getActiveFormulas() {
  const formulas = await Formula.findAll({
    where: { is_active: true },
    include: [{
      model: FormulaOption,
      as: 'options',
      order: [['display_order', 'ASC']]
    }],
    order: [['display_order', 'ASC'], ['price_ttc', 'ASC']]
  });
  return formulas;
}

export async function createFormula(data) {
  const {
    name,
    billing_type = 'hourly',
    price_ttc,
    requires_podcaster = true,
    description = null,
    border_start = 'rgb(153, 221, 252)',
    border_end = 'rgb(196, 202, 0)',
    min_height = 420,
    display_order = 0,
    is_active = true
  } = data;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    const error = new Error('Le nom de la formule est requis.');
    error.status = 400;
    throw error;
  }

  if (price_ttc === undefined || typeof price_ttc !== 'number' || price_ttc < 0) {
    const error = new Error('Le prix doit être un nombre positif.');
    error.status = 400;
    throw error;
  }

  // Générer une clé unique à partir du nom
  const baseKey = name.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Supprimer accents
    .replace(/[^a-z0-9]+/g, '-') // Remplacer caractères spéciaux par des tirets
    .replace(/^-|-$/g, ''); // Supprimer tirets en début/fin

  // Vérifier si la clé existe déjà, sinon ajouter un suffixe
  let key = baseKey;
  let counter = 1;
  while (await Formula.findOne({ where: { key } })) {
    key = `${baseKey}-${counter}`;
    counter++;
  }

  const formula = await Formula.create({
    key,
    name: name.trim(),
    billing_type,
    price_ttc,
    requires_podcaster,
    description: description?.trim() || null,
    border_start,
    border_end,
    min_height,
    display_order,
    is_active
  });

  return formula;
}

export async function deleteFormula(id) {
  const formula = await Formula.findByPk(id);

  if (!formula) {
    const error = new Error('Formule introuvable.');
    error.status = 404;
    throw error;
  }

  // Supprimer d'abord les options associées
  await FormulaOption.destroy({ where: { formula_id: id } });

  // Supprimer la formule
  await formula.destroy();

  return { success: true };
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

export async function updateFormula(id, data) {
  const {
    name,
    price_ttc,
    requires_podcaster,
    description,
    image_url,
    border_start,
    border_end,
    min_height,
    display_order,
    is_active
  } = data;

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

  if (typeof description === 'string') {
    formula.description = description.trim() || null;
  }

  // image_url peut être une string ou null (pour supprimer)
  if (image_url !== undefined) {
    formula.image_url = image_url;
  }

  if (typeof border_start === 'string') {
    formula.border_start = border_start;
  }

  if (typeof border_end === 'string') {
    formula.border_end = border_end;
  }

  if (typeof min_height === 'number' && min_height > 0) {
    formula.min_height = min_height;
  }

  if (typeof display_order === 'number') {
    formula.display_order = display_order;
  }

  if (typeof is_active === 'boolean') {
    formula.is_active = is_active;
  }

  await formula.save();
  return formula;
}

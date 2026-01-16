// src/controllers/admin.formula.controller.js
import {
  getAllFormulas,
  updateFormula,
  getFormulaOptions,
  createFormulaOption,
  updateFormulaOption,
  deleteFormulaOption
} from '../services/formula.service.js';

export async function listFormulas(req, res) {
  try {
    const formulas = await getAllFormulas();
    return res.json(formulas);
  } catch (error) {
    console.error('Erreur listFormulas:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function updateFormulaController(req, res) {
  try {
    const { id } = req.params;
    const { name, price_ttc, requires_podcaster } = req.body;

    const payload = {};
    if (name !== undefined) payload.name = name;
    if (price_ttc !== undefined) payload.price_ttc = Number(price_ttc);
    if (requires_podcaster !== undefined) payload.requires_podcaster = Boolean(requires_podcaster);

    const formula = await updateFormula(id, payload);
    return res.json(formula);
  } catch (error) {
    console.error('Erreur updateFormula:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

// ====== OPTIONS ======

export async function listFormulaOptions(req, res) {
  try {
    const { id } = req.params;
    const options = await getFormulaOptions(id);
    return res.json(options);
  } catch (error) {
    console.error('Erreur listFormulaOptions:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function createFormulaOptionController(req, res) {
  try {
    const { id } = req.params;
    const { icon, content, display_order } = req.body;

    const option = await createFormulaOption(id, { icon, content, display_order });
    return res.status(201).json(option);
  } catch (error) {
    console.error('Erreur createFormulaOption:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function updateFormulaOptionController(req, res) {
  try {
    const { optionId } = req.params;
    const { icon, content, display_order } = req.body;

    const option = await updateFormulaOption(optionId, { icon, content, display_order });
    return res.json(option);
  } catch (error) {
    console.error('Erreur updateFormulaOption:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function deleteFormulaOptionController(req, res) {
  try {
    const { optionId } = req.params;
    await deleteFormulaOption(optionId);
    return res.json({ success: true });
  } catch (error) {
    console.error('Erreur deleteFormulaOption:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

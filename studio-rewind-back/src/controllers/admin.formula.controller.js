// src/controllers/admin.formula.controller.js
import { getAllFormulas, updateFormula } from '../services/formula.service.js';

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
    const { name, price_ttc } = req.body;

    const payload = {};
    if (name !== undefined) payload.name = name;
    if (price_ttc !== undefined) payload.price_ttc = Number(price_ttc);

    const formula = await updateFormula(id, payload);
    return res.json(formula);
  } catch (error) {
    console.error('Erreur updateFormula:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

import { getAllFormulas } from '../services/formula.service.js';

export async function publicListFormulas(req, res) {
  try {
    const formulas = await getAllFormulas();
    return res.json(formulas);
  } catch (error) {
    console.error('Erreur publicListFormulas:', error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Erreur serveur.' });
  }
}
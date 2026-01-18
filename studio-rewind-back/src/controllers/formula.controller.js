import { getActiveFormulas } from '../services/formula.service.js';

export async function publicListFormulas(req, res) {
  try {
    // Retourne uniquement les formules actives pour le site public
    const formulas = await getActiveFormulas();
    return res.json(formulas);
  } catch (error) {
    console.error('Erreur publicListFormulas:', error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Erreur serveur.' });
  }
}
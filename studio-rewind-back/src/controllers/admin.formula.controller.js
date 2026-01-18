// src/controllers/admin.formula.controller.js
import {
  getAllFormulas,
  createFormula,
  updateFormula,
  deleteFormula,
  getFormulaOptions,
  createFormulaOption,
  updateFormulaOption,
  deleteFormulaOption
} from '../services/formula.service.js';
import { processAndUploadFile, deleteFile } from '../config/upload.js';

export async function listFormulas(req, res) {
  try {
    const formulas = await getAllFormulas();
    return res.json(formulas);
  } catch (error) {
    console.error('Erreur listFormulas:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function createFormulaController(req, res) {
  try {
    const {
      name,
      billing_type,
      price_ttc,
      requires_podcaster,
      description,
      border_start,
      border_end,
      min_height,
      display_order,
      is_active
    } = req.body;

    const formula = await createFormula({
      name,
      billing_type,
      price_ttc: price_ttc !== undefined ? Number(price_ttc) : undefined,
      requires_podcaster,
      description,
      border_start,
      border_end,
      min_height: min_height !== undefined ? Number(min_height) : undefined,
      display_order: display_order !== undefined ? Number(display_order) : undefined,
      is_active
    });

    return res.status(201).json(formula);
  } catch (error) {
    console.error('Erreur createFormula:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function updateFormulaController(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      price_ttc,
      requires_podcaster,
      description,
      border_start,
      border_end,
      min_height,
      display_order,
      is_active
    } = req.body;

    const payload = {};
    if (name !== undefined) payload.name = name;
    if (price_ttc !== undefined) payload.price_ttc = Number(price_ttc);
    if (requires_podcaster !== undefined) payload.requires_podcaster = Boolean(requires_podcaster);
    if (description !== undefined) payload.description = description;
    if (border_start !== undefined) payload.border_start = border_start;
    if (border_end !== undefined) payload.border_end = border_end;
    if (min_height !== undefined) payload.min_height = Number(min_height);
    if (display_order !== undefined) payload.display_order = Number(display_order);
    if (is_active !== undefined) payload.is_active = Boolean(is_active);

    const formula = await updateFormula(id, payload);
    return res.json(formula);
  } catch (error) {
    console.error('Erreur updateFormula:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function deleteFormulaController(req, res) {
  try {
    const { id } = req.params;
    await deleteFormula(id);
    return res.json({ success: true });
  } catch (error) {
    console.error('Erreur deleteFormula:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function uploadFormulaImageController(req, res) {
  try {
    const { id } = req.params;

    // Vérifier qu'un fichier a été envoyé
    if (!req.files || !req.files.photo || !req.files.photo[0]) {
      return res.status(400).json({ message: 'Aucune image fournie.' });
    }

    // Récupérer la formule existante pour supprimer l'ancienne image si besoin
    const formulas = await getAllFormulas();
    const formula = formulas.find(f => f.id === id);
    if (!formula) {
      return res.status(404).json({ message: 'Formule introuvable.' });
    }

    // Supprimer l'ancienne image si elle existe
    if (formula.image_url) {
      deleteFile(formula.image_url);
    }

    // Uploader la nouvelle image
    const photoUrl = await processAndUploadFile(req.files.photo[0]);

    // Mettre à jour la formule avec l'URL de l'image
    const updatedFormula = await updateFormula(id, { image_url: photoUrl });

    return res.json(updatedFormula);
  } catch (error) {
    console.error('Erreur uploadFormulaImage:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function deleteFormulaImageController(req, res) {
  try {
    const { id } = req.params;

    // Récupérer la formule
    const formulas = await getAllFormulas();
    const formula = formulas.find(f => f.id === id);
    if (!formula) {
      return res.status(404).json({ message: 'Formule introuvable.' });
    }

    // Supprimer l'image si elle existe
    if (formula.image_url) {
      deleteFile(formula.image_url);
    }

    // Mettre à jour la formule
    const updatedFormula = await updateFormula(id, { image_url: null });

    return res.json(updatedFormula);
  } catch (error) {
    console.error('Erreur deleteFormulaImage:', error);
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

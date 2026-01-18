// src/services/promo.service.js
import { PromoCode, PopupConfig } from '../models/index.js';
import { Op } from 'sequelize';
import crypto from 'crypto';

/**
 * Genere un code promo unique (ex: BIENVENUE-A7X3K9)
 * @param {string} prefix - Le prefixe du code (defaut: BIENVENUE)
 */
function generatePromoCode(prefix = 'BIENVENUE') {
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${randomPart}`;
}

/**
 * Cree un nouveau code promo pour un email
 * @param {string} email - L'adresse email du visiteur
 * @param {object} options - Options pour le code promo
 * @param {number} options.discount - Pourcentage de reduction (defaut: 15)
 * @param {string} options.prefix - Prefixe du code (defaut: BIENVENUE)
 * @param {number|null} options.validityDays - Duree de validite en jours (null = sans expiration)
 * @returns {Promise<PromoCode>} Le code promo cree
 */
export async function createPromoCode(email, options = {}) {
  const { discount = 15, prefix = 'BIENVENUE', validityDays = 30 } = options;

  // Verifie si un code existe deja pour cet email
  const existingCode = await PromoCode.findOne({
    where: { email: email.toLowerCase() }
  });

  if (existingCode) {
    // Si le code existe et n'est pas expire (ou sans expiration), on le retourne
    const notExpired = !existingCode.expires_at || existingCode.expires_at > new Date();
    if (notExpired && !existingCode.used) {
      return existingCode;
    }
    // Si expire ou utilise, on en cree un nouveau
  }

  // Genere un code unique
  let code;
  let isUnique = false;
  while (!isUnique) {
    code = generatePromoCode(prefix);
    const existing = await PromoCode.findOne({ where: { code } });
    if (!existing) isUnique = true;
  }

  // Date d'expiration (null si pas de limite)
  let expiresAt = null;
  if (validityDays !== null && validityDays > 0) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);
  }

  const promoCode = await PromoCode.create({
    code,
    email: email.toLowerCase(),
    discount,
    expires_at: expiresAt
  });

  return promoCode;
}

/**
 * Cree un code promo manuel (admin) avec code personnalise
 * @param {object} data - Donnees du code promo
 * @param {string} data.code - Le code promo (sera mis en majuscules)
 * @param {number} data.discount - Pourcentage de reduction
 * @param {number|null} data.validityDays - Duree de validite en jours (null = sans expiration)
 * @returns {Promise<PromoCode>} Le code promo cree
 */
export async function createManualPromoCode({ code, discount, validityDays = null }) {
  const upperCode = code.toUpperCase().trim();

  // Verifie si le code existe deja
  const existingCode = await PromoCode.findOne({
    where: { code: upperCode }
  });

  if (existingCode) {
    const error = new Error('Ce code promo existe deja.');
    error.status = 400;
    throw error;
  }

  // Date d'expiration (null si pas de limite)
  let expiresAt = null;
  if (validityDays !== null && validityDays > 0) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);
  }

  const promoCode = await PromoCode.create({
    code: upperCode,
    email: 'manual@admin.local', // Email fictif pour les codes manuels
    discount,
    expires_at: expiresAt
  });

  return promoCode;
}

/**
 * Valide un code promo
 * @param {string} code - Le code promo a valider
 * @param {string} email - L'email du client (pour verifier usage unique par client)
 * @returns {Promise<{valid: boolean, discount?: number, message: string}>}
 */
export async function validatePromoCode(code, email = null) {
  const promoCode = await PromoCode.findOne({
    where: { code: code.toUpperCase() }
  });

  if (!promoCode) {
    return { valid: false, message: 'Code promo invalide.' };
  }

  // Pour les codes manuels (non lies a un email specifique)
  const isManualCode = promoCode.email === 'manual@admin.local';

  if (isManualCode) {
    // Verifier si ce client a deja utilise ce code
    if (email) {
      const alreadyUsed = await PromoCode.findOne({
        where: {
          code: code.toUpperCase(),
          used: true,
          used_by_email: email.toLowerCase()
        }
      });
      if (alreadyUsed) {
        return { valid: false, message: 'Vous avez deja utilise ce code promo.' };
      }
    }
  } else {
    // Code lie a un email specifique
    if (promoCode.used) {
      return { valid: false, message: 'Ce code promo a deja ete utilise.' };
    }
  }

  // Verifier expiration (si date definie)
  if (promoCode.expires_at && promoCode.expires_at < new Date()) {
    return { valid: false, message: 'Ce code promo a expire.' };
  }

  return {
    valid: true,
    discount: promoCode.discount,
    message: `Reduction de ${promoCode.discount}% appliquee !`
  };
}

/**
 * Marque un code promo comme utilise
 * @param {string} code - Le code promo a marquer
 * @returns {Promise<boolean>} True si le code a ete marque avec succes
 */
export async function markPromoCodeAsUsed(code) {
  const promoCode = await PromoCode.findOne({
    where: { code: code.toUpperCase() }
  });

  if (!promoCode || promoCode.used) {
    return false;
  }

  await promoCode.update({
    used: true,
    used_at: new Date()
  });

  return true;
}

/**
 * Recupere les statistiques des codes promo
 * @returns {Promise<object>}
 */
export async function getPromoStats() {
  const total = await PromoCode.count();
  const used = await PromoCode.count({ where: { used: true } });
  const active = await PromoCode.count({
    where: {
      used: false,
      [Op.or]: [
        { expires_at: null },
        { expires_at: { [Op.gt]: new Date() } }
      ]
    }
  });
  const expired = await PromoCode.count({
    where: {
      used: false,
      expires_at: { [Op.ne]: null },
      expires_at: { [Op.lt]: new Date() }
    }
  });

  return { total, used, active, expired };
}

/**
 * Liste tous les codes promo (pour admin)
 * @returns {Promise<PromoCode[]>}
 */
export async function getAllPromoCodes() {
  const codes = await PromoCode.findAll({
    order: [['createdAt', 'DESC']]
  });
  return codes;
}

/**
 * Supprime un code promo (admin)
 * @param {string} id - L'ID du code promo
 * @returns {Promise<boolean>}
 */
export async function deletePromoCode(id) {
  const promoCode = await PromoCode.findByPk(id);
  if (!promoCode) {
    const error = new Error('Code promo introuvable.');
    error.status = 404;
    throw error;
  }
  await promoCode.destroy();
  return true;
}

// ============================================================
// POPUP CONFIG FUNCTIONS
// ============================================================

/**
 * Recupere la popup active (pour le frontend public)
 * @returns {Promise<PopupConfig|null>}
 */
export async function getActivePopup() {
  const popup = await PopupConfig.findOne({
    where: { is_active: true }
  });
  return popup;
}

/**
 * Liste toutes les popups (pour admin)
 * @returns {Promise<PopupConfig[]>}
 */
export async function getAllPopups() {
  const popups = await PopupConfig.findAll({
    order: [['createdAt', 'DESC']]
  });
  return popups;
}

/**
 * Cree ou met a jour une popup
 * @param {object} data - Donnees de la popup
 * @returns {Promise<PopupConfig>}
 */
export async function createOrUpdatePopup(data) {
  const { id, title, subtitle, text, discount, code_prefix, code_validity_days, show_once, is_active } = data;

  // Si on active cette popup, desactiver les autres
  if (is_active) {
    await PopupConfig.update(
      { is_active: false },
      { where: { is_active: true } }
    );
  }

  if (id) {
    // Mise a jour
    const popup = await PopupConfig.findByPk(id);
    if (!popup) {
      const error = new Error('Popup introuvable.');
      error.status = 404;
      throw error;
    }

    await popup.update({
      title,
      subtitle,
      text,
      discount,
      code_prefix,
      code_validity_days,
      show_once,
      is_active
    });

    return popup;
  } else {
    // Creation
    const popup = await PopupConfig.create({
      title,
      subtitle,
      text,
      discount,
      code_prefix,
      code_validity_days: code_validity_days || null,
      show_once,
      is_active
    });

    return popup;
  }
}

/**
 * Supprime une popup (admin)
 * @param {string} id - L'ID de la popup
 * @returns {Promise<boolean>}
 */
export async function deletePopup(id) {
  const popup = await PopupConfig.findByPk(id);
  if (!popup) {
    const error = new Error('Popup introuvable.');
    error.status = 404;
    throw error;
  }
  await popup.destroy();
  return true;
}

/**
 * Active/desactive une popup
 * @param {string} id - L'ID de la popup
 * @param {boolean} active - Activer ou desactiver
 * @returns {Promise<PopupConfig>}
 */
export async function togglePopupActive(id, active) {
  const popup = await PopupConfig.findByPk(id);
  if (!popup) {
    const error = new Error('Popup introuvable.');
    error.status = 404;
    throw error;
  }

  // Si on active, desactiver les autres
  if (active) {
    await PopupConfig.update(
      { is_active: false },
      { where: { is_active: true, id: { [Op.ne]: id } } }
    );
  }

  await popup.update({ is_active: active });
  return popup;
}

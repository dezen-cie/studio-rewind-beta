// src/services/promo.service.js
import { PromoCode } from '../models/index.js';
import { Op } from 'sequelize';
import crypto from 'crypto';

/**
 * Genere un code promo unique (ex: BIENVENUE-A7X3K9)
 */
function generatePromoCode() {
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BIENVENUE-${randomPart}`;
}

/**
 * Cree un nouveau code promo pour un email
 * @param {string} email - L'adresse email du visiteur
 * @returns {Promise<PromoCode>} Le code promo cree
 */
export async function createPromoCode(email) {
  // Verifie si un code existe deja pour cet email
  const existingCode = await PromoCode.findOne({
    where: { email: email.toLowerCase() }
  });

  if (existingCode) {
    // Si le code existe et n'est pas expire, on le retourne
    if (existingCode.expires_at > new Date() && !existingCode.used) {
      return existingCode;
    }
    // Si expire ou utilise, on en cree un nouveau
  }

  // Genere un code unique
  let code;
  let isUnique = false;
  while (!isUnique) {
    code = generatePromoCode();
    const existing = await PromoCode.findOne({ where: { code } });
    if (!existing) isUnique = true;
  }

  // Date d'expiration: 30 jours
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const promoCode = await PromoCode.create({
    code,
    email: email.toLowerCase(),
    discount: 15,
    expires_at: expiresAt
  });

  return promoCode;
}

/**
 * Valide un code promo
 * @param {string} code - Le code promo a valider
 * @returns {Promise<{valid: boolean, discount?: number, message: string}>}
 */
export async function validatePromoCode(code) {
  const promoCode = await PromoCode.findOne({
    where: { code: code.toUpperCase() }
  });

  if (!promoCode) {
    return { valid: false, message: 'Code promo invalide.' };
  }

  if (promoCode.used) {
    return { valid: false, message: 'Ce code promo a deja ete utilise.' };
  }

  if (promoCode.expires_at < new Date()) {
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
      expires_at: { [Op.gt]: new Date() }
    }
  });
  const expired = await PromoCode.count({
    where: {
      used: false,
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

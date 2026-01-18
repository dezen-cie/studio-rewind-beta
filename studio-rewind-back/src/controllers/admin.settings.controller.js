// src/controllers/admin.settings.controller.js
import { getStudioSettings, updateAllStudioSettings, getVatRate, getCommissionRate, getCompanyInfo } from '../services/studioSettings.service.js';
import path from 'path';
import fs from 'fs';

/**
 * GET /admin/settings
 * Récupère tous les paramètres du studio
 */
export async function getAllSettingsController(req, res, next) {
  try {
    const settings = await getStudioSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /admin/settings
 * Met à jour tous les paramètres du studio
 */
export async function updateAllSettingsController(req, res, next) {
  try {
    const {
      // Horaires
      opening_time,
      closing_time,
      open_days,
      // Tarification
      vat_rate,
      commission_rate,
      night_surcharge_before,
      night_surcharge_after,
      night_surcharge_percent,
      weekend_surcharge_percent,
      // Notifications
      confirmation_email_enabled,
      reminder_enabled,
      reminder_hours_before,
      // Fermetures
      holidays_closure_enabled,
      // Entreprise
      company_name,
      company_address,
      company_postal_code,
      company_city,
      company_siret,
      company_vat_number,
      company_email,
      company_phone,
      // Banque
      bank_name,
      bank_iban,
      bank_bic
    } = req.body;

    const updateData = {};

    // Horaires
    if (opening_time !== undefined) updateData.opening_time = opening_time;
    if (closing_time !== undefined) updateData.closing_time = closing_time;
    if (open_days !== undefined) updateData.open_days = open_days;

    // Tarification
    if (vat_rate !== undefined) updateData.vat_rate = parseFloat(vat_rate);
    if (commission_rate !== undefined) updateData.commission_rate = parseFloat(commission_rate);
    if (night_surcharge_before !== undefined) updateData.night_surcharge_before = night_surcharge_before;
    if (night_surcharge_after !== undefined) updateData.night_surcharge_after = night_surcharge_after;
    if (night_surcharge_percent !== undefined) updateData.night_surcharge_percent = parseFloat(night_surcharge_percent);
    if (weekend_surcharge_percent !== undefined) updateData.weekend_surcharge_percent = parseFloat(weekend_surcharge_percent);

    // Notifications
    if (confirmation_email_enabled !== undefined) updateData.confirmation_email_enabled = confirmation_email_enabled;
    if (reminder_enabled !== undefined) updateData.reminder_enabled = reminder_enabled;
    if (reminder_hours_before !== undefined) updateData.reminder_hours_before = parseInt(reminder_hours_before);

    // Fermetures
    if (holidays_closure_enabled !== undefined) updateData.holidays_closure_enabled = holidays_closure_enabled;

    // Entreprise
    if (company_name !== undefined) updateData.company_name = company_name;
    if (company_address !== undefined) updateData.company_address = company_address;
    if (company_postal_code !== undefined) updateData.company_postal_code = company_postal_code;
    if (company_city !== undefined) updateData.company_city = company_city;
    if (company_siret !== undefined) updateData.company_siret = company_siret;
    if (company_vat_number !== undefined) updateData.company_vat_number = company_vat_number;
    if (company_email !== undefined) updateData.company_email = company_email;
    if (company_phone !== undefined) updateData.company_phone = company_phone;

    // Banque
    if (bank_name !== undefined) updateData.bank_name = bank_name;
    if (bank_iban !== undefined) updateData.bank_iban = bank_iban;
    if (bank_bic !== undefined) updateData.bank_bic = bank_bic;

    const settings = await updateAllStudioSettings(updateData);
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/settings/logo
 * Upload du logo entreprise
 */
export async function uploadLogoController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni.' });
    }

    // Supprimer l'ancien logo si existant
    const settings = await getStudioSettings();
    if (settings.logo_path) {
      const oldLogoPath = path.join(process.cwd(), 'uploads', settings.logo_path);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Enregistrer le nouveau chemin
    const logoPath = `logos/${req.file.filename}`;
    await updateAllStudioSettings({ logo_path: logoPath });

    res.json({
      message: 'Logo uploadé avec succès.',
      logo_path: logoPath
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /admin/settings/logo
 * Supprime le logo entreprise
 */
export async function deleteLogoController(req, res, next) {
  try {
    const settings = await getStudioSettings();

    if (settings.logo_path) {
      const logoPath = path.join(process.cwd(), 'uploads', settings.logo_path);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
      await updateAllStudioSettings({ logo_path: null });
    }

    res.json({ message: 'Logo supprimé avec succès.' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /admin/settings/rates
 * Récupère uniquement les taux (TVA et commission)
 */
export async function getRatesController(req, res, next) {
  try {
    const vatRate = await getVatRate();
    const commissionRate = await getCommissionRate();
    res.json({
      vat_rate: vatRate,
      commission_rate: commissionRate
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /admin/settings/company
 * Récupère les informations entreprise
 */
export async function getCompanyInfoController(req, res, next) {
  try {
    const company = await getCompanyInfo();
    res.json(company);
  } catch (error) {
    next(error);
  }
}

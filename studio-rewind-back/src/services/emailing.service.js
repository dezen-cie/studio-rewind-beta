// src/services/emailing.service.js
import { User, EmailCampaign } from '../models/index.js';
import { sendMail } from '../config/mailer.js';
import * as XLSX from 'xlsx';

/**
 * Recupere les utilisateurs optin (acceptent les offres commerciales)
 * @returns {Promise<Array>} Liste des utilisateurs optin
 */
export async function getOptinUsers() {
  const users = await User.findAll({
    where: {
      optin_commercial: true,
      is_active: true,
      role: 'client'
    },
    attributes: ['id', 'email', 'firstname', 'lastname', 'company_name', 'createdAt'],
    order: [['createdAt', 'DESC']]
  });

  return users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.company_name || `${u.firstname || ''} ${u.lastname || ''}`.trim() || u.email,
    created_at: u.createdAt
  }));
}

/**
 * Parse un fichier Excel pour extraire les emails
 * @param {Buffer} fileBuffer - Contenu du fichier Excel
 * @returns {Array} Liste des contacts [{email, name}]
 */
export function parseExcelFile(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const contacts = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const row of data) {
    const keys = Object.keys(row);

    // Cherche une colonne email (case insensitive)
    let emailKey = keys.find(k =>
      k.toLowerCase().includes('email') || k.toLowerCase().includes('mail')
    );

    // Si pas de colonne email trouvee, cherche la premiere valeur qui ressemble a un email
    let email = null;
    if (emailKey) {
      email = row[emailKey];
    } else {
      // Parcourt toutes les colonnes pour trouver un email
      for (const key of keys) {
        const val = String(row[key] || '').trim();
        if (emailRegex.test(val)) {
          email = val;
          break;
        }
      }
    }

    // Cherche une colonne nom
    const nameKey = keys.find(k =>
      k.toLowerCase().includes('nom') || k.toLowerCase().includes('name') || k.toLowerCase().includes('prenom')
    );
    const name = nameKey ? row[nameKey] : '';

    if (email && emailRegex.test(String(email).trim())) {
      contacts.push({
        email: String(email).trim().toLowerCase(),
        name: name ? String(name).trim() : ''
      });
    }
  }

  // Deduplique par email
  const uniqueContacts = [];
  const seen = new Set();
  for (const c of contacts) {
    if (!seen.has(c.email)) {
      seen.add(c.email);
      uniqueContacts.push(c);
    }
  }

  return uniqueContacts;
}

/**
 * Cree une nouvelle campagne
 * @param {Object} data - Donnees de la campagne
 */
export async function createCampaign({ name, subject, html_content, recipients, scheduled_at }) {
  const campaign = await EmailCampaign.create({
    name,
    subject,
    html_content,
    status: scheduled_at ? 'scheduled' : 'draft',
    recipients,
    scheduled_at: scheduled_at || null
  });

  return campaign;
}

/**
 * Envoie une campagne
 * @param {string} campaignId - ID de la campagne
 */
export async function sendCampaign(campaignId) {
  const campaign = await EmailCampaign.findByPk(campaignId);

  if (!campaign) {
    const error = new Error('Campagne introuvable.');
    error.status = 404;
    throw error;
  }

  if (campaign.status === 'sent') {
    const error = new Error('Cette campagne a deja ete envoyee.');
    error.status = 400;
    throw error;
  }

  if (!campaign.recipients || campaign.recipients.length === 0) {
    const error = new Error('Aucun destinataire pour cette campagne.');
    error.status = 400;
    throw error;
  }

  // Mettre a jour le statut
  await campaign.update({ status: 'sending' });

  const results = {
    sent: 0,
    failed: 0,
    errors: []
  };

  try {
    // Envoyer les emails un par un via le mailer existant
    for (const recipient of campaign.recipients) {
      try {
        // 1. Ajouter le footer de desabonnement
        let htmlContent = addUnsubscribeFooter(campaign.html_content, recipient.email);

        // 2. Ajouter le tracking (pixel d'ouverture + liens trackes)
        htmlContent = addTrackingToHtml(htmlContent, campaign.id, recipient.email);

        // 3. Generer le lien de desabonnement backend pour le header List-Unsubscribe
        const token = Buffer.from(recipient.email.toLowerCase()).toString('base64');
        const backendUrl = process.env.API_URL || process.env.BACK_URL || 'http://localhost:4000';
        const oneClickUnsubscribeUrl = `${backendUrl}/api/emailing/unsubscribe/${token}`;

        await sendMail({
          to: recipient.email,
          subject: campaign.subject,
          html: htmlContent,
          text: campaign.html_content.replace(/<[^>]*>/g, ''), // Version texte
          headers: {
            'List-Unsubscribe': `<${oneClickUnsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
          }
        });
        results.sent++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          email: recipient.email,
          error: err.message
        });
        console.error(`Erreur envoi email a ${recipient.email}:`, err.message);
      }
    }

    // Mettre a jour la campagne avec les resultats
    await campaign.update({
      status: 'sent',
      emails_sent: results.sent,
      sent_at: new Date()
    });

    return {
      success: true,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors
    };
  } catch (error) {
    await campaign.update({ status: 'failed' });
    throw error;
  }
}

/**
 * Recupere toutes les campagnes
 */
export async function getAllCampaigns() {
  const campaigns = await EmailCampaign.findAll({
    order: [['createdAt', 'DESC']],
    attributes: [
      'id', 'name', 'subject', 'status',
      'emails_sent', 'emails_opened', 'emails_clicked',
      'sent_at', 'scheduled_at', 'createdAt'
    ]
  });

  return campaigns.map(c => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    status: c.status,
    emails_sent: c.emails_sent,
    emails_opened: c.emails_opened,
    emails_clicked: c.emails_clicked,
    open_rate: c.emails_sent > 0 ? Math.round((c.emails_opened / c.emails_sent) * 100) : 0,
    click_rate: c.emails_sent > 0 ? Math.round((c.emails_clicked / c.emails_sent) * 100) : 0,
    sent_at: c.sent_at,
    scheduled_at: c.scheduled_at,
    created_at: c.createdAt
  }));
}

/**
 * Recupere une campagne par ID
 */
export async function getCampaignById(id) {
  const campaign = await EmailCampaign.findByPk(id);

  if (!campaign) {
    const error = new Error('Campagne introuvable.');
    error.status = 404;
    throw error;
  }

  return campaign;
}

/**
 * Supprime une campagne
 */
export async function deleteCampaign(id) {
  const campaign = await EmailCampaign.findByPk(id);

  if (!campaign) {
    const error = new Error('Campagne introuvable.');
    error.status = 404;
    throw error;
  }

  if (campaign.status === 'sending') {
    const error = new Error('Impossible de supprimer une campagne en cours d\'envoi.');
    error.status = 400;
    throw error;
  }

  await campaign.destroy();
  return true;
}

/**
 * Met a jour les stats d'une campagne (simule les opens/clicks pour demo)
 * En production, utiliser les webhooks Brevo
 */
export async function updateCampaignStats(id, { emails_opened, emails_clicked }) {
  const campaign = await EmailCampaign.findByPk(id);

  if (!campaign) {
    const error = new Error('Campagne introuvable.');
    error.status = 404;
    throw error;
  }

  await campaign.update({
    emails_opened: emails_opened ?? campaign.emails_opened,
    emails_clicked: emails_clicked ?? campaign.emails_clicked
  });

  return campaign;
}

/**
 * Desabonne un utilisateur (supprime l'optin)
 * @param {string} email - Email de l'utilisateur
 * @param {string} token - Token de verification (base64 de l'email)
 */
export async function unsubscribeUser(email, token) {
  // Verifier le token (simple base64 de l'email pour eviter les abus)
  const expectedToken = Buffer.from(email.toLowerCase()).toString('base64');
  if (token !== expectedToken) {
    const error = new Error('Lien de desabonnement invalide.');
    error.status = 400;
    throw error;
  }

  const user = await User.findOne({
    where: { email: email.toLowerCase() }
  });

  if (!user) {
    // Ne pas reveler si l'email existe ou non
    return { success: true, message: 'Desabonnement effectue.' };
  }

  await user.update({ optin_commercial: false });
  return { success: true, message: 'Vous avez ete desabonne avec succes.' };
}

/**
 * Genere le lien de desabonnement pour un email
 * @param {string} email - Email de l'utilisateur
 */
export function generateUnsubscribeLink(email) {
  const token = Buffer.from(email.toLowerCase()).toString('base64');
  const baseUrl = process.env.FRONT_ORIGIN || 'http://localhost:5173';
  return `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
}

/**
 * Ajoute le footer de desabonnement au contenu HTML
 * @param {string} htmlContent - Contenu HTML original
 * @param {string} email - Email du destinataire
 */
export function addUnsubscribeFooter(htmlContent, email) {
  const unsubscribeLink = generateUnsubscribeLink(email);
  const footer = `
<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
  <p>Vous recevez cet email car vous avez accepte de recevoir nos offres commerciales.</p>
  <p><a href="${unsubscribeLink}" style="color: #666;">Se desabonner</a></p>
</div>`;

  // Inserer avant </body> si present, sinon a la fin
  if (htmlContent.includes('</body>')) {
    return htmlContent.replace('</body>', `${footer}</body>`);
  }
  return htmlContent + footer;
}

/**
 * Traite les campagnes programmees dont l'heure d'envoi est passee
 * Cette fonction peut etre appelee periodiquement via un cron ou un intervalle
 */
export async function processScheduledCampaigns() {
  const { Op } = await import('sequelize');

  const campaignsToSend = await EmailCampaign.findAll({
    where: {
      status: 'scheduled',
      scheduled_at: {
        [Op.lte]: new Date()
      }
    }
  });

  const results = [];

  for (const campaign of campaignsToSend) {
    try {
      console.log(`📧 Envoi de la campagne programmee: ${campaign.name}`);
      const result = await sendCampaign(campaign.id);
      results.push({
        id: campaign.id,
        name: campaign.name,
        success: true,
        ...result
      });
    } catch (error) {
      console.error(`Erreur envoi campagne ${campaign.name}:`, error.message);
      results.push({
        id: campaign.id,
        name: campaign.name,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Verifie le statut du mailer (SMTP Brevo)
 */
export async function checkMailerStatus() {
  const hasSmtpConfig =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (!hasSmtpConfig) {
    return {
      configured: false,
      valid: false,
      message: 'SMTP non configure (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)'
    };
  }

  return {
    configured: true,
    valid: true,
    email: process.env.SMTP_FROM || process.env.SMTP_USER,
    host: process.env.SMTP_HOST
  };
}

/**
 * Genere l'URL de tracking pour le pixel d'ouverture
 * @param {string} campaignId - ID de la campagne
 * @param {string} email - Email du destinataire
 */
export function generateTrackingPixelUrl(campaignId, email) {
  const baseUrl = process.env.API_URL || process.env.BACK_URL || 'http://localhost:4000';
  const token = Buffer.from(email.toLowerCase()).toString('base64');
  return `${baseUrl}/api/emailing/track/open/${campaignId}/${token}`;
}

/**
 * Genere l'URL de tracking pour un lien cliquable
 * @param {string} campaignId - ID de la campagne
 * @param {string} email - Email du destinataire
 * @param {string} originalUrl - URL originale du lien
 */
export function generateTrackingLinkUrl(campaignId, email, originalUrl) {
  const baseUrl = process.env.API_URL || process.env.BACK_URL || 'http://localhost:4000';
  const token = Buffer.from(email.toLowerCase()).toString('base64');
  return `${baseUrl}/api/emailing/track/click/${campaignId}/${token}?url=${encodeURIComponent(originalUrl)}`;
}

/**
 * Ajoute le pixel de tracking et wrappe les liens dans le HTML
 * @param {string} htmlContent - Contenu HTML original
 * @param {string} campaignId - ID de la campagne
 * @param {string} email - Email du destinataire
 */
export function addTrackingToHtml(htmlContent, campaignId, email) {
  let html = htmlContent;

  // Ajoute le pixel de tracking (image 1x1 transparente)
  const pixelUrl = generateTrackingPixelUrl(campaignId, email);
  const trackingPixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none;width:1px;height:1px;" alt="" />`;

  // Insere le pixel avant </body> si present, sinon a la fin
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${trackingPixel}</body>`);
  } else {
    html = html + trackingPixel;
  }

  // Wrappe tous les liens <a href="..."> pour le tracking des clics
  // Exclut les liens de desabonnement et mailto:
  html = html.replace(
    /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi,
    (match, before, url, after) => {
      // Ne pas tracker les liens mailto, tel, ou de desabonnement
      if (url.startsWith('mailto:') || url.startsWith('tel:') || url.includes('unsubscribe')) {
        return match;
      }
      const trackedUrl = generateTrackingLinkUrl(campaignId, email, url);
      return `<a ${before}href="${trackedUrl}"${after}>`;
    }
  );

  return html;
}

/**
 * Enregistre une ouverture d'email
 * @param {string} campaignId - ID de la campagne
 * @param {string} token - Token (email en base64)
 */
export async function trackEmailOpen(campaignId, token) {
  try {
    const campaign = await EmailCampaign.findByPk(campaignId);
    if (!campaign) return false;

    // Incremente le compteur d'ouvertures
    await campaign.increment('emails_opened');
    return true;
  } catch (error) {
    console.error('Erreur tracking open:', error.message);
    return false;
  }
}

/**
 * Enregistre un clic sur un lien
 * @param {string} campaignId - ID de la campagne
 * @param {string} token - Token (email en base64)
 */
export async function trackEmailClick(campaignId, token) {
  try {
    const campaign = await EmailCampaign.findByPk(campaignId);
    if (!campaign) return false;

    // Incremente le compteur de clics ET d'ouvertures
    // (si quelqu'un clique, il a forcement ouvert l'email)
    await campaign.increment(['emails_clicked', 'emails_opened']);
    return true;
  } catch (error) {
    console.error('Erreur tracking click:', error.message);
    return false;
  }
}

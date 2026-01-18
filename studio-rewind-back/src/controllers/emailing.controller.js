// src/controllers/emailing.controller.js
import {
  getOptinUsers,
  parseExcelFile,
  createCampaign,
  sendCampaign,
  getAllCampaigns,
  getCampaignById,
  deleteCampaign,
  updateCampaignStats,
  checkMailerStatus,
  unsubscribeUser,
  processScheduledCampaigns,
  trackEmailOpen,
  trackEmailClick
} from '../services/emailing.service.js';

/**
 * GET /admin/emailing/optin-users
 * Recupere la liste des utilisateurs optin
 */
export async function getOptinUsersController(req, res, next) {
  try {
    const users = await getOptinUsers();
    res.json({ users, count: users.length });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/emailing/upload-excel
 * Upload et parse un fichier Excel
 */
export async function uploadExcelController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni.' });
    }

    const contacts = parseExcelFile(req.file.buffer);

    res.json({
      success: true,
      contacts,
      count: contacts.length
    });
  } catch (error) {
    console.error('Erreur parsing Excel:', error);
    res.status(400).json({
      message: 'Erreur lors de la lecture du fichier Excel.',
      error: error.message
    });
  }
}

/**
 * POST /admin/emailing/campaigns
 * Cree une nouvelle campagne
 */
export async function createCampaignController(req, res, next) {
  try {
    const { name, subject, html_content, recipients, scheduled_at } = req.body;

    if (!name || !subject || !html_content) {
      return res.status(400).json({
        message: 'Le nom, l\'objet et le contenu sont obligatoires.'
      });
    }

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({
        message: 'Au moins un destinataire est requis.'
      });
    }

    // Valider la date programmee si fournie
    let scheduledDate = null;
    if (scheduled_at) {
      scheduledDate = new Date(scheduled_at);
      if (isNaN(scheduledDate.getTime())) {
        return res.status(400).json({
          message: 'Date de programmation invalide.'
        });
      }
      if (scheduledDate <= new Date()) {
        return res.status(400).json({
          message: 'La date de programmation doit etre dans le futur.'
        });
      }
    }

    const campaign = await createCampaign({
      name,
      subject,
      html_content,
      recipients,
      scheduled_at: scheduledDate
    });

    res.status(201).json({
      success: true,
      message: scheduledDate
        ? `Campagne programmee pour le ${scheduledDate.toLocaleString('fr-FR')}.`
        : 'Campagne creee avec succes.',
      campaign: {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        status: campaign.status,
        scheduled_at: campaign.scheduled_at,
        recipients_count: recipients.length
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/emailing/campaigns/:id/send
 * Envoie une campagne
 */
export async function sendCampaignController(req, res, next) {
  try {
    const { id } = req.params;
    const result = await sendCampaign(id);

    res.json({
      success: true,
      message: `Campagne envoyee: ${result.sent} emails envoyes, ${result.failed} echecs.`,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /admin/emailing/campaigns
 * Liste toutes les campagnes
 */
export async function getCampaignsController(req, res, next) {
  try {
    const campaigns = await getAllCampaigns();
    res.json({ campaigns });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /admin/emailing/campaigns/:id
 * Recupere une campagne par ID
 */
export async function getCampaignController(req, res, next) {
  try {
    const { id } = req.params;
    const campaign = await getCampaignById(id);
    res.json({ campaign });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /admin/emailing/campaigns/:id
 * Supprime une campagne
 */
export async function deleteCampaignController(req, res, next) {
  try {
    const { id } = req.params;
    await deleteCampaign(id);
    res.json({ success: true, message: 'Campagne supprimee.' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /admin/emailing/campaigns/:id/stats
 * Met a jour les stats d'une campagne (pour tests/demo)
 */
export async function updateStatsController(req, res, next) {
  try {
    const { id } = req.params;
    const { emails_opened, emails_clicked } = req.body;

    const campaign = await updateCampaignStats(id, { emails_opened, emails_clicked });

    res.json({
      success: true,
      campaign: {
        id: campaign.id,
        emails_opened: campaign.emails_opened,
        emails_clicked: campaign.emails_clicked
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /admin/emailing/mailer-status
 * Verifie le statut du mailer SMTP
 */
export async function getMailerStatusController(req, res, next) {
  try {
    const status = await checkMailerStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /emailing/unsubscribe (PUBLIC - pas d'auth)
 * Desabonne un utilisateur des emails commerciaux
 */
export async function unsubscribeController(req, res, next) {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ message: 'Email et token sont obligatoires.' });
    }

    const result = await unsubscribeUser(email, token);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/emailing/process-scheduled
 * Traite les campagnes programmees dont l'heure est passee
 */
export async function processScheduledController(req, res, next) {
  try {
    const results = await processScheduledCampaigns();
    res.json({
      success: true,
      processed: results.length,
      results
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/emailing/track/open/:campaignId/:token
 * Tracking pixel d'ouverture - retourne une image 1x1 transparente
 */
export async function trackOpenController(req, res) {
  const { campaignId, token } = req.params;

  // Enregistre l'ouverture (en arriere-plan, ne bloque pas la reponse)
  trackEmailOpen(campaignId, token).catch(() => {});

  // Retourne un pixel GIF transparent 1x1
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  res.set({
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  res.send(pixel);
}

/**
 * GET /api/emailing/track/click/:campaignId/:token
 * Tracking de clic - redirige vers l'URL originale
 */
export async function trackClickController(req, res) {
  const { campaignId, token } = req.params;
  const { url } = req.query;

  // Enregistre le clic (en arriere-plan)
  trackEmailClick(campaignId, token).catch(() => {});

  // Redirige vers l'URL originale
  if (url) {
    res.redirect(302, url);
  } else {
    // Si pas d'URL, redirige vers le site principal
    const frontUrl = process.env.FRONT_ORIGIN || 'http://localhost:5173';
    res.redirect(302, frontUrl);
  }
}

/**
 * POST /api/emailing/unsubscribe/:token
 * One-click unsubscribe pour Gmail/clients email (RFC 8058)
 * Accepte aussi GET pour les clics manuels
 */
export async function oneClickUnsubscribeController(req, res) {
  const { token } = req.params;

  if (!token) {
    return res.status(400).send('Token manquant.');
  }

  try {
    // Decode l'email depuis le token (base64)
    const email = Buffer.from(token, 'base64').toString('utf-8');

    if (!email || !email.includes('@')) {
      return res.status(400).send('Token invalide.');
    }

    // Desabonne l'utilisateur
    await unsubscribeUser(email, token);

    // Pour les requetes POST (Gmail one-click), retourne 200 OK
    if (req.method === 'POST') {
      return res.status(200).send('Desabonnement effectue.');
    }

    // Pour les requetes GET, redirige vers une page de confirmation
    const frontUrl = process.env.FRONT_ORIGIN || 'http://localhost:5173';
    res.redirect(302, `${frontUrl}/unsubscribe?success=true&email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error('Erreur one-click unsubscribe:', error.message);
    res.status(500).send('Erreur lors du desabonnement.');
  }
}

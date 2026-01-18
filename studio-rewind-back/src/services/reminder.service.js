// src/services/reminder.service.js
import { Op } from 'sequelize';
import { Reservation, User, Podcaster, Formula } from '../models/index.js';
import { sendMail } from '../config/mailer.js';
import { getNotificationSettings, getCompanyInfo, isConfirmationEmailEnabled } from './studioSettings.service.js';

/**
 * Récupère les réservations qui nécessitent un rappel
 * Critères:
 * - Statut confirmé
 * - Rappel non encore envoyé
 * - Date de début dans la fenêtre de rappel (ex: dans les prochaines X heures)
 */
export async function getReservationsNeedingReminder() {
  const settings = await getNotificationSettings();

  // Si les rappels sont désactivés, on ne fait rien
  if (!settings.reminder_enabled) {
    return [];
  }

  const hoursBeforeReservation = settings.reminder_hours_before || 24;

  const now = new Date();
  const reminderWindowStart = new Date(now);
  const reminderWindowEnd = new Date(now);
  reminderWindowEnd.setHours(reminderWindowEnd.getHours() + hoursBeforeReservation);

  // On cherche les réservations:
  // - Confirmées
  // - Dont le rappel n'a pas été envoyé
  // - Dont la date de début est entre maintenant et maintenant + X heures
  const reservations = await Reservation.findAll({
    where: {
      status: 'confirmed',
      reminder_sent: false,
      start_date: {
        [Op.gt]: now,
        [Op.lte]: reminderWindowEnd
      }
    },
    include: [
      {
        model: User,
        attributes: ['id', 'email', 'firstname', 'lastname', 'company_name']
      },
      {
        model: Podcaster,
        as: 'podcaster',
        attributes: ['id', 'name']
      }
    ]
  });

  return reservations;
}

/**
 * Formate une date en français
 * @param {Date} date
 * @returns {string}
 */
function formatDateFr(date) {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return date.toLocaleDateString('fr-FR', options);
}

/**
 * Formate une heure en français
 * @param {Date} date
 * @returns {string}
 */
function formatTimeFr(date) {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Génère le contenu HTML de l'email de rappel
 * @param {Object} reservation - La réservation
 * @param {Object} user - L'utilisateur
 * @param {Object} companyInfo - Infos de l'entreprise
 */
function generateReminderEmailHtml(reservation, user, companyInfo) {
  const startDate = new Date(reservation.start_date);
  const endDate = new Date(reservation.end_date);
  const userName = user.firstname || user.company_name || user.email;
  const podcasterName = reservation.podcaster?.name || 'Non spécifié';
  const studioName = companyInfo.company_name || 'Studio Rewind';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #1a1a2e; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${studioName}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #333; margin-top: 0;">Rappel de votre réservation</h2>

              <p style="color: #666; line-height: 1.6;">
                Bonjour ${userName},
              </p>

              <p style="color: #666; line-height: 1.6;">
                Nous vous rappelons votre réservation prochaine au studio :
              </p>

              <!-- Reservation Details Box -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #646cff;">
                <table width="100%" cellpadding="5" cellspacing="0">
                  <tr>
                    <td style="color: #666; width: 40%;">📅 <strong>Date :</strong></td>
                    <td style="color: #333;">${formatDateFr(startDate)}</td>
                  </tr>
                  <tr>
                    <td style="color: #666;">⏰ <strong>Horaire :</strong></td>
                    <td style="color: #333;">${formatTimeFr(startDate)} - ${formatTimeFr(endDate)}</td>
                  </tr>
                  <tr>
                    <td style="color: #666;">🎙️ <strong>Formule :</strong></td>
                    <td style="color: #333;">${reservation.formula}</td>
                  </tr>
                  <tr>
                    <td style="color: #666;">👤 <strong>Podcasteur :</strong></td>
                    <td style="color: #333;">${podcasterName}</td>
                  </tr>
                </table>
              </div>

              <p style="color: #666; line-height: 1.6;">
                <strong>Important :</strong> Merci d'arriver 5 minutes avant l'heure de votre réservation afin de commencer à l'heure prévue.
              </p>

              <p style="color: #666; line-height: 1.6;">
                Si vous avez des questions ou si vous devez modifier votre réservation, n'hésitez pas à nous contacter.
              </p>

              <p style="color: #666; line-height: 1.6; margin-bottom: 0;">
                À très bientôt au studio !
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                ${studioName}<br>
                ${companyInfo.company_address || ''} ${companyInfo.company_postal_code || ''} ${companyInfo.company_city || ''}<br>
                ${companyInfo.company_email ? `Email: ${companyInfo.company_email}` : ''} ${companyInfo.company_phone ? `| Tél: ${companyInfo.company_phone}` : ''}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Génère le contenu texte de l'email de rappel
 */
function generateReminderEmailText(reservation, user, companyInfo) {
  const startDate = new Date(reservation.start_date);
  const endDate = new Date(reservation.end_date);
  const userName = user.firstname || user.company_name || user.email;
  const podcasterName = reservation.podcaster?.name || 'Non spécifié';
  const studioName = companyInfo.company_name || 'Studio Rewind';

  return `
${studioName} - Rappel de votre réservation

Bonjour ${userName},

Nous vous rappelons votre réservation prochaine au studio :

📅 Date : ${formatDateFr(startDate)}
⏰ Horaire : ${formatTimeFr(startDate)} - ${formatTimeFr(endDate)}
🎙️ Formule : ${reservation.formula}
👤 Podcasteur : ${podcasterName}

Important : Merci d'arriver 5 minutes avant l'heure de votre réservation afin de commencer à l'heure prévue.

Si vous avez des questions ou si vous devez modifier votre réservation, n'hésitez pas à nous contacter.

À très bientôt au studio !

---
${studioName}
${companyInfo.company_address || ''} ${companyInfo.company_postal_code || ''} ${companyInfo.company_city || ''}
${companyInfo.company_email || ''} ${companyInfo.company_phone || ''}
`;
}

/**
 * Envoie un rappel pour une réservation
 * @param {Object} reservation
 */
export async function sendReservationReminder(reservation) {
  const user = reservation.User;
  if (!user || !user.email) {
    console.warn(`⚠️ Pas d'email pour la réservation ${reservation.id}`);
    return { success: false, error: 'Pas d\'email utilisateur' };
  }

  try {
    const companyInfo = await getCompanyInfo();
    const studioName = companyInfo.company_name || 'Studio Rewind';

    const htmlContent = generateReminderEmailHtml(reservation, user, companyInfo);
    const textContent = generateReminderEmailText(reservation, user, companyInfo);

    await sendMail({
      to: user.email,
      subject: `${studioName} - Rappel de votre réservation`,
      html: htmlContent,
      text: textContent
    });

    // Marquer le rappel comme envoyé
    await reservation.update({ reminder_sent: true });

    console.log(`📧 Rappel envoyé pour réservation ${reservation.id} à ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Erreur envoi rappel réservation ${reservation.id}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Traite tous les rappels de réservation en attente
 * Cette fonction doit être appelée périodiquement (via cron/setInterval)
 */
export async function processReservationReminders() {
  const settings = await getNotificationSettings();

  // Si les rappels sont désactivés, on ne fait rien
  if (!settings.reminder_enabled) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  const reservations = await getReservationsNeedingReminder();

  if (reservations.length === 0) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  const results = {
    processed: reservations.length,
    sent: 0,
    failed: 0,
    errors: []
  };

  for (const reservation of reservations) {
    const result = await sendReservationReminder(reservation);
    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push({
        reservationId: reservation.id,
        error: result.error
      });
    }
  }

  return results;
}

// =============================================
// EMAIL DE CONFIRMATION DE RÉSERVATION
// =============================================

/**
 * Génère le contenu HTML de l'email de confirmation
 * @param {Object} reservation - La réservation
 * @param {Object} user - L'utilisateur
 * @param {Object} companyInfo - Infos de l'entreprise
 */
function generateConfirmationEmailHtml(reservation, user, companyInfo) {
  const startDate = new Date(reservation.start_date);
  const endDate = new Date(reservation.end_date);
  const userName = user.firstname || user.company_name || user.email;
  const podcasterName = reservation.podcaster?.name || 'Non spécifié';
  const studioName = companyInfo.company_name || 'Studio Rewind';
  const logoUrl = companyInfo.logo_path
    ? `${process.env.API_URL || process.env.BACK_URL || 'http://localhost:4000'}/uploads/${companyInfo.logo_path}`
    : null;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header avec logo -->
          <tr>
            <td style="background-color: #1a1a2e; padding: 30px; text-align: center;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${studioName}" style="max-height: 60px; margin-bottom: 15px;" />` : ''}
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${studioName}</h1>
            </td>
          </tr>

          <!-- Bandeau de confirmation -->
          <tr>
            <td style="background-color: #22c55e; padding: 15px; text-align: center;">
              <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: bold;">
                ✓ Réservation confirmée
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #666; line-height: 1.6; font-size: 16px;">
                Bonjour ${userName},
              </p>

              <p style="color: #666; line-height: 1.6;">
                Votre réservation a été confirmée avec succès. Voici les détails :
              </p>

              <!-- Reservation Details Box -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 25px 0; border-left: 4px solid #22c55e;">
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #666; width: 40%; font-size: 15px;">📅 <strong>Date :</strong></td>
                    <td style="color: #333; font-size: 15px;">${formatDateFr(startDate)}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 15px;">⏰ <strong>Horaire :</strong></td>
                    <td style="color: #333; font-size: 15px;">${formatTimeFr(startDate)} - ${formatTimeFr(endDate)}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 15px;">🎙️ <strong>Formule :</strong></td>
                    <td style="color: #333; font-size: 15px;">${reservation.formula}</td>
                  </tr>
                  ${reservation.podcaster ? `
                  <tr>
                    <td style="color: #666; font-size: 15px;">👤 <strong>Podcasteur :</strong></td>
                    <td style="color: #333; font-size: 15px;">${podcasterName}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="color: #666; font-size: 15px;">💰 <strong>Montant :</strong></td>
                    <td style="color: #333; font-size: 15px; font-weight: bold;">${reservation.price_ttc?.toFixed(2) || '0.00'} € TTC</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #fff3cd; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>📍 Rappel :</strong> Merci d'arriver 5 minutes avant l'heure de votre réservation afin de commencer à l'heure prévue.
                </p>
              </div>

              <p style="color: #666; line-height: 1.6;">
                Si vous avez des questions ou si vous devez modifier votre réservation, n'hésitez pas à nous contacter.
              </p>

              <p style="color: #666; line-height: 1.6; margin-bottom: 0;">
                Nous avons hâte de vous accueillir !
              </p>

              <p style="color: #333; line-height: 1.6; margin-top: 20px;">
                L'équipe ${studioName}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a2e; padding: 25px; text-align: center;">
              <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">
                ${studioName}
              </p>
              <p style="color: rgba(255, 255, 255, 0.7); font-size: 12px; margin: 0; line-height: 1.8;">
                ${companyInfo.company_address ? `${companyInfo.company_address}<br>` : ''}
                ${companyInfo.company_postal_code || ''} ${companyInfo.company_city || ''}<br>
                ${companyInfo.company_email ? `📧 ${companyInfo.company_email}` : ''}
                ${companyInfo.company_phone ? ` | 📞 ${companyInfo.company_phone}` : ''}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Génère le contenu texte de l'email de confirmation
 */
function generateConfirmationEmailText(reservation, user, companyInfo) {
  const startDate = new Date(reservation.start_date);
  const endDate = new Date(reservation.end_date);
  const userName = user.firstname || user.company_name || user.email;
  const podcasterName = reservation.podcaster?.name || 'Non spécifié';
  const studioName = companyInfo.company_name || 'Studio Rewind';

  return `
${studioName} - Réservation confirmée ✓

Bonjour ${userName},

Votre réservation a été confirmée avec succès. Voici les détails :

📅 Date : ${formatDateFr(startDate)}
⏰ Horaire : ${formatTimeFr(startDate)} - ${formatTimeFr(endDate)}
🎙️ Formule : ${reservation.formula}
${reservation.podcaster ? `👤 Podcasteur : ${podcasterName}` : ''}
💰 Montant : ${reservation.price_ttc?.toFixed(2) || '0.00'} € TTC

📍 Rappel : Merci d'arriver 5 minutes avant l'heure de votre réservation afin de commencer à l'heure prévue.

Si vous avez des questions ou si vous devez modifier votre réservation, n'hésitez pas à nous contacter.

Nous avons hâte de vous accueillir !

L'équipe ${studioName}

---
${studioName}
${companyInfo.company_address || ''}
${companyInfo.company_postal_code || ''} ${companyInfo.company_city || ''}
${companyInfo.company_email || ''} ${companyInfo.company_phone ? `| ${companyInfo.company_phone}` : ''}
`;
}

/**
 * Envoie un email de confirmation de réservation
 * @param {Object} reservation - La réservation (doit inclure User et podcaster)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendReservationConfirmationEmail(reservation) {
  // Vérifier si l'email de confirmation est activé
  const isEnabled = await isConfirmationEmailEnabled();
  if (!isEnabled) {
    console.log('📧 Email de confirmation désactivé dans les paramètres');
    return { success: true, skipped: true };
  }

  // Récupérer l'utilisateur si non inclus
  let user = reservation.User;
  if (!user) {
    user = await User.findByPk(reservation.user_id);
  }

  if (!user || !user.email) {
    console.warn(`⚠️ Pas d'email pour la réservation ${reservation.id}`);
    return { success: false, error: 'Pas d\'email utilisateur' };
  }

  // Récupérer le podcasteur si non inclus
  let podcaster = reservation.podcaster;
  if (!podcaster && reservation.podcaster_id) {
    podcaster = await Podcaster.findByPk(reservation.podcaster_id);
    reservation.podcaster = podcaster;
  }

  try {
    const companyInfo = await getCompanyInfo();
    const studioName = companyInfo.company_name || 'Studio Rewind';

    const htmlContent = generateConfirmationEmailHtml(reservation, user, companyInfo);
    const textContent = generateConfirmationEmailText(reservation, user, companyInfo);

    await sendMail({
      to: user.email,
      subject: `${studioName} - Confirmation de votre réservation`,
      html: htmlContent,
      text: textContent
    });

    console.log(`📧 Email de confirmation envoyé pour réservation ${reservation.id} à ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Erreur envoi email confirmation réservation ${reservation.id}:`, error.message);
    return { success: false, error: error.message };
  }
}

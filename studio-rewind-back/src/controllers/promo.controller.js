// src/controllers/promo.controller.js
import { createPromoCode, validatePromoCode, markPromoCodeAsUsed, getPromoStats, getAllPromoCodes, deletePromoCode } from '../services/promo.service.js';
import { sendMail } from '../config/mailer.js';

/**
 * Genere le template HTML de l'email promo
 */
function getPromoEmailTemplate(code, discount) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre code promo Studio Rewind</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Studio Rewind</h1>
              <p style="margin: 10px 0 0; color: #a0a0a0; font-size: 14px;">Votre studio podcast</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 24px; font-weight: 600; text-align: center;">
                Bienvenue chez Studio Rewind !
              </h2>

              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.6; text-align: center;">
                Merci de votre interet pour notre studio. Pour votre premier podcast, beneficiez d'une reduction exclusive de <strong>${discount}%</strong> sur nos forfaits.
              </p>

              <!-- Promo Code Box -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center;">
                <p style="margin: 0 0 10px; color: #ffffff; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                  Votre code promo
                </p>
                <p style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 3px;">
                  ${code}
                </p>
              </div>

              <p style="margin: 0 0 20px; color: #555555; font-size: 14px; line-height: 1.6; text-align: center;">
                Utilisez ce code lors de votre reservation pour beneficier de votre reduction. Ce code est valable 30 jours et ne peut etre utilise qu'une seule fois.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONT_ORIGIN || 'http://localhost:5173'}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                  Reserver maintenant
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 10px; color: #888888; font-size: 14px;">
                Studio Rewind - Votre podcast, notre passion
              </p>
              <p style="margin: 0; color: #aaaaaa; font-size: 12px;">
                Cet email a ete envoye suite a votre inscription sur notre site.
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
 * POST /api/promo/subscribe
 * Inscription pour recevoir un code promo
 */
export async function subscribe(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requis.' });
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email invalide.' });
    }

    // Cree le code promo
    const promoCode = await createPromoCode(email);

    // Envoie l'email avec le code
    const htmlContent = getPromoEmailTemplate(promoCode.code, promoCode.discount);

    await sendMail({
      to: email,
      subject: `Votre code promo -${promoCode.discount}% - Studio Rewind`,
      text: `Bienvenue chez Studio Rewind ! Votre code promo est : ${promoCode.code}. Il vous donne droit a ${promoCode.discount}% de reduction sur votre premiere reservation. Valable 30 jours.`,
      html: htmlContent
    });

    res.status(201).json({
      success: true,
      message: 'Code promo envoye par email !'
    });

  } catch (error) {
    console.error('Erreur subscribe promo:', error);
    res.status(500).json({ message: 'Erreur lors de la creation du code promo.' });
  }
}

/**
 * POST /api/promo/validate
 * Valide un code promo
 */
export async function validate(req, res) {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Code promo requis.' });
    }

    const result = await validatePromoCode(code);

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    res.json({
      valid: true,
      discount: result.discount,
      message: result.message
    });

  } catch (error) {
    console.error('Erreur validate promo:', error);
    res.status(500).json({ message: 'Erreur lors de la validation du code promo.' });
  }
}

/**
 * POST /api/promo/apply
 * Marque un code promo comme utilise
 */
export async function apply(req, res) {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Code promo requis.' });
    }

    const success = await markPromoCodeAsUsed(code);

    if (!success) {
      return res.status(400).json({ message: 'Code promo invalide ou deja utilise.' });
    }

    res.json({
      success: true,
      message: 'Code promo applique avec succes.'
    });

  } catch (error) {
    console.error('Erreur apply promo:', error);
    res.status(500).json({ message: 'Erreur lors de l\'application du code promo.' });
  }
}

/**
 * GET /api/promo/admin/stats
 * Recupere les statistiques des codes promo (admin)
 */
export async function stats(req, res) {
  try {
    const promoStats = await getPromoStats();
    res.json(promoStats);
  } catch (error) {
    console.error('Erreur stats promo:', error);
    res.status(500).json({ message: 'Erreur lors de la recuperation des statistiques.' });
  }
}

/**
 * GET /api/promo/admin
 * Liste tous les codes promo (admin)
 */
export async function adminList(req, res) {
  try {
    const codes = await getAllPromoCodes();
    res.json(codes);
  } catch (error) {
    console.error('Erreur list promo:', error);
    res.status(500).json({ message: 'Erreur lors de la recuperation des codes promo.' });
  }
}

/**
 * DELETE /api/promo/admin/:id
 * Supprime un code promo (admin)
 */
export async function adminDelete(req, res) {
  try {
    const { id } = req.params;
    await deletePromoCode(id);
    res.json({ success: true, message: 'Code promo supprime.' });
  } catch (error) {
    console.error('Erreur delete promo:', error);
    res.status(error.status || 500).json({ message: error.message });
  }
}

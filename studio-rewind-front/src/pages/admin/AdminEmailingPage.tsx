// src/pages/admin/AdminEmailingPage.tsx
import { useEffect, useState, useRef } from 'react';
import {
  type OptinUser,
  type ExcelContact,
  type Campaign,
  type MailerStatus,
  getOptinUsers,
  uploadExcelFile,
  createCampaign,
  sendCampaign,
  getCampaigns,
  deleteCampaign,
  getMailerStatus
} from '../../api/adminEmailing';
import './AdminEmailingPage.css';

type RecipientSource = 'optin' | 'excel' | 'both';

// Fonction pour obtenir l'URL du site (localhost en dev, domaine en prod)
function getSiteUrl(): string {
  return window.location.origin;
}

// Template HTML par defaut pour les newsletters
const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter Studio Rewind</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1a1a1a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Container principal -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.3);">

          <!-- Header avec logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #ce1b1d 0%, #8b0000 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 2px;">
                STUDIO REWIND
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; letter-spacing: 1px;">
                Votre studio podcast professionnel
              </p>
            </td>
          </tr>

          <!-- Image hero -->
          <tr>
            <td style="padding: 0;">
              <div style="background: linear-gradient(180deg, #2d2d2d 0%, #1a1a1a 100%); padding: 40px; text-align: center;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center">
                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 20px;">
                        <tr>
                          <td style="width: 80px; height: 80px; background: linear-gradient(135deg, #ce1b1d 0%, #ff4444 100%); border-radius: 50%; text-align: center; vertical-align: middle;">
                            <img src="https://img.icons8.com/ios-filled/100/ffffff/microphone.png" alt="Micro" width="44" height="44" style="display: inline-block; vertical-align: middle;" />
                          </td>
                        </tr>
                      </table>
                      <h2 style="margin: 0 0 10px; color: #ffffff; font-size: 28px; font-weight: 600;">
                        Offre Exclusive
                      </h2>
                      <p style="margin: 0; color: #aaaaaa; font-size: 16px;">
                        Valable jusqu'au 31 janvier 2026
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 40px;">
              <h3 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600; text-align: center;">
                -20% sur votre prochaine session
              </h3>

              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.7; text-align: center;">
                Cher(e) client(e),
              </p>

              <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.7;">
                Nous sommes ravis de vous offrir une <strong style="color: #ce1b1d;">reduction exclusive de 20%</strong> sur votre prochaine reservation au Studio Rewind. Que ce soit pour enregistrer votre podcast, une interview ou une session voix-off, profitez de notre equipement professionnel a prix reduit.
              </p>

              <!-- Code promo -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <div style="background: linear-gradient(135deg, #f8f8f8 0%, #eeeeee 100%); border: 2px dashed #ce1b1d; border-radius: 12px; padding: 25px 40px; display: inline-block;">
                      <p style="margin: 0 0 8px; color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">
                        Votre code promo
                      </p>
                      <p style="margin: 0; color: #ce1b1d; font-size: 32px; font-weight: 700; letter-spacing: 4px;">
                        REWIND20
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Avantages -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                <tr>
                  <td style="padding: 15px; background: #fafafa; border-radius: 8px; border-left: 4px solid #ce1b1d;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="40" valign="top">
                          <span style="font-size: 24px;">✓</span>
                        </td>
                        <td>
                          <p style="margin: 0; color: #333333; font-size: 15px;">
                            <strong>Equipement haut de gamme</strong> - Micros Shure, table de mixage Rodecaster
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 15px; background: #fafafa; border-radius: 8px; border-left: 4px solid #ce1b1d;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="40" valign="top">
                          <span style="font-size: 24px;">✓</span>
                        </td>
                        <td>
                          <p style="margin: 0; color: #333333; font-size: 15px;">
                            <strong>Acoustique professionnelle</strong> - Studio insonorise pour un son parfait
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 15px; background: #fafafa; border-radius: 8px; border-left: 4px solid #ce1b1d;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="40" valign="top">
                          <span style="font-size: 24px;">✓</span>
                        </td>
                        <td>
                          <p style="margin: 0; color: #333333; font-size: 15px;">
                            <strong>Accompagnement personnalise</strong> - Un technicien a votre disposition
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 35px 0 20px;">
                <tr>
                  <td align="center">
                    <a href="{{SITE_URL}}/reservation" style="display: inline-block; background: linear-gradient(135deg, #ce1b1d 0%, #a01517 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-size: 16px; font-weight: 600; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(206, 27, 29, 0.4);">
                      RESERVER MAINTENANT
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #888888; font-size: 14px; text-align: center; font-style: italic;">
                * Offre valable une seule fois par client, non cumulable avec d'autres promotions.
              </p>
            </td>
          </tr>

          <!-- Separateur -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent, #e0e0e0, transparent);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: #fafafa;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 15px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                      Studio Rewind
                    </p>
                    <p style="margin: 0 0 5px; color: #666666; font-size: 14px;">
                      7 avenue de la liberation, 74200 Thonon-les-bains
                    </p>
                    <p style="margin: 0 0 20px; color: #666666; font-size: 14px;">
                      contact@studiorewind.fr
                    </p>

                    <!-- Reseaux sociaux -->
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 0 6px;">
                          <a href="https://www.instagram.com/studio__rewind/" style="display: inline-block; background: #E4405F; border-radius: 6px; padding: 8px 14px; text-decoration: none;" target="_blank">
                            <span style="color: #ffffff; font-size: 13px; font-weight: 600;">Instagram</span>
                          </a>
                        </td>
                        <td style="padding: 0 6px;">
                          <a href="https://www.tiktok.com/@studio_rewind" style="display: inline-block; background: #000000; border-radius: 6px; padding: 8px 14px; text-decoration: none;" target="_blank">
                            <span style="color: #ffffff; font-size: 13px; font-weight: 600;">TikTok</span>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Copyright -->
          <tr>
            <td style="background: #1a1a1a; padding: 20px 40px; text-align: center;">
              <p style="margin: 0; color: #666666; font-size: 12px;">
                © 2026 Studio Rewind. Tous droits reserves.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

// Template 2 - Style moderne avec gradient
const TEMPLATE_2 = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter Studio Rewind</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 30px 20px;">

        <!-- Container principal -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden;">

          <!-- Header minimaliste -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 50px; height: 50px; background: #ce1b1d; border-radius: 12px; text-align: center; vertical-align: middle;">
                    <img src="https://img.icons8.com/ios-filled/100/ffffff/microphone.png" alt="Micro" width="28" height="28" style="display: inline-block; vertical-align: middle;" />
                  </td>
                  <td style="padding-left: 15px;">
                    <p style="margin: 0; font-size: 22px; font-weight: 700; color: #1a1a1a; letter-spacing: 1px;">STUDIO REWIND</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero avec gradient -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(145deg, #ce1b1d 0%, #ff6b6b 50%, #ffa500 100%); border-radius: 20px; overflow: hidden;">
                <tr>
                  <td style="padding: 50px 40px; text-align: center;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 3px;">Offre limitee</p>
                    <h1 style="margin: 0 0 15px; font-size: 48px; font-weight: 800; color: #ffffff;">-25%</h1>
                    <p style="margin: 0; font-size: 18px; color: rgba(255,255,255,0.95);">sur votre premiere session</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contenu -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 26px; font-weight: 700; color: #1a1a1a; text-align: center;">
                Lancez votre podcast !
              </h2>
              <p style="margin: 0 0 25px; font-size: 16px; line-height: 1.8; color: #555555; text-align: center;">
                Vous avez un projet de podcast ? C'est le moment parfait pour vous lancer.
                Profitez de notre studio professionnel equipe et de l'accompagnement de nos techniciens.
              </p>
            </td>
          </tr>

          <!-- 3 Cards features -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <!-- Card 1 -->
                  <td width="33%" style="padding: 0 5px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fafafa; border-radius: 16px; text-align: center;">
                      <tr>
                        <td style="padding: 25px 15px;">
                          <div style="width: 50px; height: 50px; background: #fff3f3; border-radius: 50%; margin: 0 auto 15px; line-height: 50px;">
                            <span style="font-size: 24px;">🎧</span>
                          </div>
                          <p style="margin: 0 0 5px; font-size: 14px; font-weight: 700; color: #1a1a1a;">Equipement Pro</p>
                          <p style="margin: 0; font-size: 12px; color: #888888;">Shure SM7B, Rodecaster</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Card 2 -->
                  <td width="33%" style="padding: 0 5px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fafafa; border-radius: 16px; text-align: center;">
                      <tr>
                        <td style="padding: 25px 15px;">
                          <div style="width: 50px; height: 50px; background: #fff3f3; border-radius: 50%; margin: 0 auto 15px; line-height: 50px;">
                            <span style="font-size: 24px;">🎬</span>
                          </div>
                          <p style="margin: 0 0 5px; font-size: 14px; font-weight: 700; color: #1a1a1a;">Studio Video</p>
                          <p style="margin: 0; font-size: 12px; color: #888888;">Multi-cameras 4K</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Card 3 -->
                  <td width="33%" style="padding: 0 5px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fafafa; border-radius: 16px; text-align: center;">
                      <tr>
                        <td style="padding: 25px 15px;">
                          <div style="width: 50px; height: 50px; background: #fff3f3; border-radius: 50%; margin: 0 auto 15px; line-height: 50px;">
                            <span style="font-size: 24px;">👨‍💻</span>
                          </div>
                          <p style="margin: 0 0 5px; font-size: 14px; font-weight: 700; color: #1a1a1a;">Technicien</p>
                          <p style="margin: 0; font-size: 12px; color: #888888;">A votre service</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Code promo moderne -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #1a1a1a; border-radius: 16px;">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <p style="margin: 0 0 10px; font-size: 13px; color: #888888; text-transform: uppercase; letter-spacing: 2px;">Utilisez le code</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                      <tr>
                        <td style="background: #ce1b1d; padding: 12px 30px; border-radius: 8px;">
                          <p style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 4px;">PODCAST25</p>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 15px 0 0; font-size: 13px; color: #666666;">Valable jusqu'au 28 fevrier 2026</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 50px; text-align: center;">
              <a href="{{SITE_URL}}/reservation" style="display: inline-block; background: #ce1b1d; color: #ffffff; text-decoration: none; padding: 18px 60px; border-radius: 100px; font-size: 15px; font-weight: 700; letter-spacing: 1px;">
                RESERVER MA SESSION
              </a>
              <p style="margin: 20px 0 0; font-size: 13px; color: #999999;">
                Repondez a cet email pour toute question
              </p>
            </td>
          </tr>

          <!-- Separateur -->
          <tr>
            <td style="padding: 0 60px;">
              <div style="height: 1px; background: #eeeeee;"></div>
            </td>
          </tr>

          <!-- Footer moderne -->
          <tr>
            <td style="padding: 40px; text-align: center;">
              <p style="margin: 0 0 5px; font-size: 16px; font-weight: 600; color: #1a1a1a;">Studio Rewind</p>
              <p style="margin: 0 0 20px; font-size: 13px; color: #888888;">
                7 avenue de la liberation, 74200 Thonon-les-bains
              </p>

              <!-- Reseaux sociaux -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 20px;">
                <tr>
                  <td style="padding: 0 6px;">
                    <a href="https://www.instagram.com/studio__rewind/" style="display: inline-block; background: #E4405F; border-radius: 6px; padding: 8px 14px; text-decoration: none;" target="_blank">
                      <span style="color: #ffffff; font-size: 13px; font-weight: 600;">Instagram</span>
                    </a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://www.tiktok.com/@studio_rewind" style="display: inline-block; background: #000000; border-radius: 6px; padding: 8px 14px; text-decoration: none;" target="_blank">
                      <span style="color: #ffffff; font-size: 13px; font-weight: 600;">TikTok</span>
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; color: #aaaaaa;">
                contact@studiorewind.fr
              </p>
            </td>
          </tr>

        </table>
        <!-- Fin container principal -->

        <!-- Copyright -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 25px 40px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #999999;">
                © 2026 Studio Rewind. Tous droits reserves.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

// Map des templates disponibles
const TEMPLATES: Record<string, { name: string; html: string }> = {
  model1: { name: 'Modèle 1 - Classique', html: DEFAULT_HTML_TEMPLATE },
  model2: { name: 'Modèle 2 - Moderne gradient', html: TEMPLATE_2 }
};

function AdminEmailingPage() {
  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mailer status
  const [mailerStatus, setMailerStatus] = useState<MailerStatus | null>(null);

  // Optin users
  const [optinUsers, setOptinUsers] = useState<OptinUser[]>([]);

  // Excel contacts
  const [excelContacts, setExcelContacts] = useState<ExcelContact[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Campaign form
  const [campaignName, setCampaignName] = useState('');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('model1');
  const [htmlContent, setHtmlContent] = useState(() =>
    DEFAULT_HTML_TEMPLATE.replace(/\{\{SITE_URL\}\}/g, getSiteUrl())
  );
  const [viewMode, setViewMode] = useState<'preview' | 'text' | 'html'>('preview');

  // Handler pour changement de template
  function handleTemplateChange(templateKey: string) {
    setSelectedTemplate(templateKey);
    const template = TEMPLATES[templateKey];
    if (template) {
      setHtmlContent(template.html.replace(/\{\{SITE_URL\}\}/g, getSiteUrl()));
    }
  }
  const [recipientSource, setRecipientSource] = useState<RecipientSource>('optin');

  // Fonction pour extraire le texte brut du HTML (conserve les lignes significatives)
  function extractTextFromHtml(html: string): string {
    // Supprime les balises style et script avec leur contenu
    let text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    // Remplace les balises de bloc par des sauts de ligne
    text = text.replace(/<\/(p|div|tr|h[1-6]|li|td)>/gi, '\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    // Supprime toutes les autres balises
    text = text.replace(/<[^>]+>/g, '');
    // Decode les entites HTML courantes
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    // Nettoie les espaces multiples
    text = text.replace(/[ \t]+/g, ' ');
    // Nettoie les lignes (trim chaque ligne, enleve les lignes vides consecutives)
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return lines.join('\n');
  }

  // Extraire les lignes de texte significatives du HTML
  function extractTextLines(html: string): string[] {
    const text = extractTextFromHtml(html);
    return text.split('\n').filter(l => l.trim().length > 0);
  }

  // Texte extrait (derive du HTML)
  const textContent = extractTextFromHtml(htmlContent);

  // Handler pour les modifications de texte - fait un find/replace intelligent dans le HTML
  function handleTextChange(newText: string) {
    const oldLines = extractTextLines(htmlContent);
    const newLines = newText.split('\n').filter(l => l.trim().length > 0);

    let updatedHtml = htmlContent;

    // Pour chaque ligne qui a change, faire un remplacement dans le HTML
    const minLen = Math.min(oldLines.length, newLines.length);
    for (let i = 0; i < minLen; i++) {
      const oldLine = oldLines[i].trim();
      const newLine = newLines[i].trim();
      if (oldLine !== newLine && oldLine.length > 0) {
        // Remplace l'ancienne ligne par la nouvelle dans le HTML
        // Utilise une regex pour gerer les espaces/retours a la ligne dans le HTML
        const escapedOld = oldLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedOld.split(/\s+/).join('\\s*'), 'g');
        updatedHtml = updatedHtml.replace(regex, newLine);
      }
    }

    setHtmlContent(updatedHtml);
  }

  // Programmation envoi
  const [sendMode, setSendMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Campaigns history
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [mailerRes, optinRes, campaignsRes] = await Promise.all([
        getMailerStatus(),
        getOptinUsers(),
        getCampaigns()
      ]);

      setMailerStatus(mailerRes);
      setOptinUsers(optinRes.users);
      setCampaigns(campaignsRes.campaigns);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }

  // Handle Excel file upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      const result = await uploadExcelFile(file);
      setExcelContacts(result.contacts);
      setSuccess(`${result.count} contacts importés depuis le fichier Excel.`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de l\'import du fichier.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  // Get recipients based on source selection
  function getRecipients(): Array<{ email: string; name?: string }> {
    const recipients: Array<{ email: string; name?: string }> = [];
    const seenEmails = new Set<string>();

    if (recipientSource === 'optin' || recipientSource === 'both') {
      for (const u of optinUsers) {
        if (!seenEmails.has(u.email)) {
          seenEmails.add(u.email);
          recipients.push({ email: u.email, name: u.name });
        }
      }
    }

    if (recipientSource === 'excel' || recipientSource === 'both') {
      for (const c of excelContacts) {
        if (!seenEmails.has(c.email)) {
          seenEmails.add(c.email);
          recipients.push({ email: c.email, name: c.name });
        }
      }
    }

    return recipients;
  }

  // Create and send campaign
  async function handleCreateCampaign(sendNow: boolean = false) {
    if (!campaignName.trim()) {
      setError('Le nom de la campagne est obligatoire.');
      return;
    }
    if (!campaignSubject.trim()) {
      setError('L\'objet de l\'email est obligatoire.');
      return;
    }
    if (!htmlContent.trim()) {
      setError('Le contenu de l\'email est obligatoire.');
      return;
    }

    const recipients = getRecipients();
    if (recipients.length === 0) {
      setError('Aucun destinataire sélectionné.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Construire la date de programmation si mode programmé
      let scheduledAt: string | null = null;
      if (sendMode === 'scheduled' && scheduledDate && scheduledTime) {
        // Créer une date locale et l'envoyer en ISO (UTC) pour éviter les problèmes de timezone
        const localDate = new Date(`${scheduledDate}T${scheduledTime}:00`);
        scheduledAt = localDate.toISOString();
      }

      const result = await createCampaign({
        name: campaignName,
        subject: campaignSubject,
        html_content: htmlContent,
        recipients,
        scheduled_at: scheduledAt
      });

      if (scheduledAt) {
        setSuccess(result.message || 'Campagne programmée avec succès.');
      } else if (sendNow && result.campaign.id) {
        const sendResult = await sendCampaign(result.campaign.id);
        setSuccess(`Campagne envoyée ! ${sendResult.sent} emails envoyés, ${sendResult.failed} échecs.`);
      } else {
        setSuccess('Campagne créée en brouillon.');
      }

      // Reset form
      setCampaignName('');
      setCampaignSubject('');
      setSelectedTemplate('model1');
      setHtmlContent(DEFAULT_HTML_TEMPLATE.replace(/\{\{SITE_URL\}\}/g, getSiteUrl()));
      setViewMode('preview');
      setSendMode('immediate');
      setScheduledDate('');
      setScheduledTime('');

      // Reload campaigns
      const campaignsRes = await getCampaigns();
      setCampaigns(campaignsRes.campaigns);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la création de la campagne.');
    } finally {
      setLoading(false);
    }
  }

  // Send existing campaign
  async function handleSendCampaign(id: string) {
    if (!confirm('Voulez-vous vraiment envoyer cette campagne ?')) return;

    try {
      setLoading(true);
      setError(null);
      const result = await sendCampaign(id);
      setSuccess(`Campagne envoyée ! ${result.sent} emails envoyés, ${result.failed} échecs.`);

      // Reload campaigns
      const campaignsRes = await getCampaigns();
      setCampaigns(campaignsRes.campaigns);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de l\'envoi.');
    } finally {
      setLoading(false);
    }
  }

  // Delete campaign
  async function handleDeleteCampaign(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cette campagne ?')) return;

    try {
      setLoading(true);
      await deleteCampaign(id);
      setCampaigns(campaigns.filter(c => c.id !== id));
      setSuccess('Campagne supprimée.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la suppression.');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getStatusLabel(status: string): { label: string; className: string } {
    switch (status) {
      case 'draft':
        return { label: 'Brouillon', className: 'status-draft' };
      case 'scheduled':
        return { label: 'Programmée', className: 'status-scheduled' };
      case 'sending':
        return { label: 'En cours...', className: 'status-sending' };
      case 'sent':
        return { label: 'Envoyée', className: 'status-sent' };
      case 'failed':
        return { label: 'Échec', className: 'status-failed' };
      default:
        return { label: status, className: '' };
    }
  }

  const totalRecipients = getRecipients().length;

  return (
    <div className="sr-page">
      <div className="sr-page-header">
        <div>
          <h2 className="sr-page-title">Emailing</h2>
          <p className="sr-page-subtitle">
            Gérez vos campagnes d'emailing et envoyez des offres commerciales à vos clients.
          </p>
        </div>
      </div>

      {error && <div className="sr-alert sr-alert-error">{error}</div>}
      {success && <div className="sr-alert sr-alert-success">{success}</div>}

      {/* Mailer Status */}
      <div className="sr-card emailing-brevo-status">
        <h3>Statut Email (SMTP)</h3>
        {mailerStatus ? (
          <div className={`brevo-status-indicator ${mailerStatus.configured && mailerStatus.valid ? 'connected' : 'disconnected'}`}>
            <span className="brevo-status-dot"></span>
            {mailerStatus.configured && mailerStatus.valid ? (
              <span>Connecté via {mailerStatus.host} ({mailerStatus.email})</span>
            ) : (
              <span>Non configuré ({mailerStatus.message})</span>
            )}
          </div>
        ) : (
          <span>Chargement...</span>
        )}
      </div>

      <div className="emailing-grid">
        {/* Left Column: Recipients */}
        <div className="emailing-recipients">
          {/* Optin Users */}
          <div className="sr-card">
            <h3>Utilisateurs Optin ({optinUsers.length})</h3>
            <p className="emailing-help">Clients ayant accepté de recevoir des offres commerciales.</p>
            {optinUsers.length === 0 ? (
              <p className="emailing-empty">Aucun utilisateur optin.</p>
            ) : (
              <select className="emailing-users-select" size={1}>
                {optinUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email} {u.name ? `(${u.name})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Excel Upload */}
          <div className="sr-card">
            <h3>Import Excel</h3>
            <p className="emailing-help">Importez une base de données client depuis un fichier Excel.</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="emailing-file-input"
            />
            {excelContacts.length > 0 && (
              <div className="emailing-excel-result">
                <p className="emailing-excel-count">{excelContacts.length} contacts importés</p>
                <select className="emailing-users-select" size={1}>
                  {excelContacts.map((c, i) => (
                    <option key={i} value={c.email}>
                      {c.email} {c.name ? `(${c.name})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  className="button is-small is-danger"
                  onClick={() => setExcelContacts([])}
                >
                  Effacer
                </button>
              </div>
            )}
          </div>

          {/* Recipient Source Selection */}
          <div className="sr-card">
            <h3>Destinataires</h3>
            <div className="emailing-recipient-source">
              <label>
                <input
                  type="radio"
                  name="source"
                  value="optin"
                  checked={recipientSource === 'optin'}
                  onChange={() => setRecipientSource('optin')}
                />
                Utilisateurs optin uniquement ({optinUsers.length})
              </label>
              <label>
                <input
                  type="radio"
                  name="source"
                  value="excel"
                  checked={recipientSource === 'excel'}
                  onChange={() => setRecipientSource('excel')}
                  disabled={excelContacts.length === 0}
                />
                Fichier Excel uniquement ({excelContacts.length})
              </label>
              <label>
                <input
                  type="radio"
                  name="source"
                  value="both"
                  checked={recipientSource === 'both'}
                  onChange={() => setRecipientSource('both')}
                  disabled={excelContacts.length === 0}
                />
                Les deux (dédupliqué)
              </label>
            </div>
            <p className="emailing-total-recipients">
              <strong>{totalRecipients}</strong> destinataires sélectionnés
            </p>
          </div>
        </div>

        {/* Right Column: Campaign Form */}
        <div className="emailing-campaign-form">
          <div className="sr-card">
            <h3>Créer une campagne</h3>

            <div className="emailing-field">
              <label>Titre de la campagne (interne)</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Ex: Promo Janvier 2026"
              />
            </div>

            <div className="emailing-field">
              <label>Objet de l'email</label>
              <input
                type="text"
                value={campaignSubject}
                onChange={(e) => setCampaignSubject(e.target.value)}
                placeholder="Ex: -15% sur votre prochaine réservation !"
              />
            </div>

            <div className="emailing-field">
              <label>Modèle de newsletter</label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="emailing-users-select"
              >
                {Object.entries(TEMPLATES).map(([key, template]) => (
                  <option key={key} value={key}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="emailing-field">
              <div className="emailing-field-header">
                <label>Contenu du message</label>
                <div className="emailing-mode-buttons">
                  <button
                    type="button"
                    className={`emailing-mode-btn ${viewMode === 'preview' ? 'active preview' : ''}`}
                    onClick={() => setViewMode('preview')}
                  >
                    Aperçu
                  </button>
                  <button
                    type="button"
                    className={`emailing-mode-btn ${viewMode === 'text' ? 'active' : ''}`}
                    onClick={() => setViewMode('text')}
                  >
                    Texte
                  </button>
                  <button
                    type="button"
                    className={`emailing-mode-btn ${viewMode === 'html' ? 'active' : ''}`}
                    onClick={() => setViewMode('html')}
                  >
                    &lt;/&gt; HTML
                  </button>
                </div>
              </div>

              {viewMode === 'preview' && (
                <div className="emailing-preview-container">
                  <iframe
                    className="emailing-preview-iframe"
                    srcDoc={htmlContent}
                    title="Aperçu de l'email"
                  />
                </div>
              )}

              {viewMode === 'text' && (
                <textarea
                  value={textContent}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Le texte de votre email..."
                  rows={14}
                  className="text-mode"
                />
              )}

              {viewMode === 'html' && (
                <>
                  <textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="<!DOCTYPE html>..."
                    rows={14}
                    className="html-mode"
                  />
                  <p className="emailing-html-hint">
                    Mode HTML actif. Modifiez le code source directement.
                  </p>
                </>
              )}
            </div>

            {/* Programmation envoi */}
            <div className="emailing-field">
              <label>Mode d'envoi</label>
              <div className="emailing-send-mode">
                <label className="emailing-send-mode-option">
                  <input
                    type="radio"
                    name="sendMode"
                    value="immediate"
                    checked={sendMode === 'immediate'}
                    onChange={() => setSendMode('immediate')}
                  />
                  <span>Envoi immédiat</span>
                </label>
                <label className="emailing-send-mode-option">
                  <input
                    type="radio"
                    name="sendMode"
                    value="scheduled"
                    checked={sendMode === 'scheduled'}
                    onChange={() => setSendMode('scheduled')}
                  />
                  <span>Programmer l'envoi</span>
                </label>
              </div>

              {sendMode === 'scheduled' && (
                <div className="emailing-schedule-inputs">
                  <div className="emailing-schedule-field">
                    <label>Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="emailing-schedule-field">
                    <label>Heure</label>
                    <select
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    >
                      <option value="">-- Choisir --</option>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <option key={hour} value={`${hour}:00`}>
                            {hour}:00
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="emailing-actions">
              <button
                className="button"
                onClick={() => handleCreateCampaign(false)}
                disabled={loading || totalRecipients === 0 || sendMode === 'scheduled'}
              >
                Enregistrer en brouillon
              </button>
              {sendMode === 'scheduled' ? (
                <button
                  className="button is-primary"
                  onClick={() => handleCreateCampaign(false)}
                  disabled={loading || totalRecipients === 0 || !scheduledDate || !scheduledTime}
                >
                  {loading ? 'Programmation...' : `Programmer pour ${totalRecipients} destinataires`}
                </button>
              ) : (
                <button
                  className="button is-primary"
                  onClick={() => handleCreateCampaign(true)}
                  disabled={loading || totalRecipients === 0 || !mailerStatus?.valid}
                >
                  {loading ? 'Envoi...' : `Envoyer à ${totalRecipients} destinataires`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns History */}
      <div className="sr-card emailing-history">
        <h3>Historique des campagnes</h3>
        {campaigns.length === 0 ? (
          <p className="emailing-empty">Aucune campagne pour le moment.</p>
        ) : (
          <div className="emailing-table-wrapper">
            <table className="emailing-table">
              <thead>
                <tr>
                  <th>Campagne</th>
                  <th>Objet</th>
                  <th>Statut</th>
                  <th className="text-right">Envoyés</th>
                  <th className="text-right">Ouverts</th>
                  <th className="text-right">Clics</th>
                  <th className="text-right">Taux ouverture</th>
                  <th className="text-right">Taux clic</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const status = getStatusLabel(c.status);
                  return (
                    <tr key={c.id}>
                      <td className="campaign-name">{c.name}</td>
                      <td className="campaign-subject">{c.subject}</td>
                      <td>
                        <span className={`campaign-status ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="text-right">{c.emails_sent}</td>
                      <td className="text-right">{c.emails_opened}</td>
                      <td className="text-right">{c.emails_clicked}</td>
                      <td className="text-right">{c.open_rate}%</td>
                      <td className="text-right">{c.click_rate}%</td>
                      <td>
                        {c.status === 'scheduled' && c.scheduled_at ? (
                          <span title="Envoi programmé">⏰ {formatDate(c.scheduled_at)}</span>
                        ) : (
                          formatDate(c.sent_at || c.created_at)
                        )}
                      </td>
                      <td className="campaign-actions">
                        {(c.status === 'draft' || c.status === 'scheduled') && (
                          <button
                            className="button is-small is-primary"
                            onClick={() => handleSendCampaign(c.id)}
                            disabled={loading || !mailerStatus?.valid}
                          >
                            Envoyer maintenant
                          </button>
                        )}
                        <button
                          className="button is-small is-danger"
                          onClick={() => handleDeleteCampaign(c.id)}
                          disabled={loading || c.status === 'sending'}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminEmailingPage;

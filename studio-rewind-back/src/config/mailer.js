// src/config/mailer.js
import nodemailer from 'nodemailer';

const hasSmtpConfig =
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS;

let transporter;

// Utilise SMTP réel si configuré (dev ou prod)
if (hasSmtpConfig) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  console.log('📧 Mailer configuré en mode SMTP réel (Brevo).');
} else {
  // Mode développement / fallback : rien n’est envoyé, tout est loggé
  transporter = nodemailer.createTransport({
    jsonTransport: true
  });

  console.log(
    '📧 Mailer en mode JSON (dev) : aucun SMTP utilisé, les emails sont loggés dans la console.'
  );
}

export async function sendMail({ to, subject, text, html, headers = {} }) {
  const from =
    process.env.SMTP_FROM || 'no-reply@studio-rewind.local';

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
      headers
    });

    // Log simple en mode SMTP réel, détaillé uniquement en mode JSON (sans SMTP)
    if (hasSmtpConfig) {
      console.log(`📨 Email envoyé à ${to} (messageId: ${info.messageId})`);
    } else {
      console.log('📨 Email simulé (pas de SMTP configuré) :');
      console.log(JSON.stringify(info, null, 2));
    }

    return info;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message);
    console.error('Détails:', error);
    throw error;
  }
}

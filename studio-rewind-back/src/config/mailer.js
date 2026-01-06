// src/config/mailer.js
import nodemailer from 'nodemailer';

const isProd = process.env.NODE_ENV === 'production';

const hasSmtpConfig =
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS;

let transporter;

if (isProd && hasSmtpConfig) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  console.log('📧 Mailer configuré en mode SMTP réel (production).');
} else {
  // Mode développement / fallback : rien n’est envoyé, tout est loggé
  transporter = nodemailer.createTransport({
    jsonTransport: true
  });

  console.log(
    '📧 Mailer en mode JSON (dev) : aucun SMTP utilisé, les emails sont loggés dans la console.'
  );
}

export async function sendMail({ to, subject, text }) {
  const from =
    process.env.SMTP_FROM || 'no-reply@studio-rewind.local';

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text
  });

  console.log('📨 Email envoyé / simulé :');
  console.log(JSON.stringify(info, null, 2));

  return info;
}

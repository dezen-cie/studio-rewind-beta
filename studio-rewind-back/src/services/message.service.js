// src/services/message.service.js
import { Message, User } from '../models/index.js';
import { sendMail } from '../config/mailer.js';

export async function createContactMessage({ userId = null, email, subject, content }) {
  if (!subject || !content) {
    const error = new Error('Sujet et contenu sont obligatoires.');
    error.status = 400;
    throw error;
  }

  let finalEmail = email || null;

  if (userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error("Utilisateur associé introuvable.");
      error.status = 404;
      throw error;
    }
    if (!finalEmail) {
      finalEmail = user.email;
    }
  }

  if (!finalEmail) {
    const error = new Error("L'email est obligatoire (soit fourni, soit issu du compte utilisateur).");
    error.status = 400;
    throw error;
  }

  const message = await Message.create({
    user_id: userId,
    email: finalEmail,
    subject,
    content,
    status: 'new'
  });

  return message;
}

export async function listMessagesAdmin() {
  const messages = await Message.findAll({
    include: [
      {
        model: User,
        attributes: ['id', 'email', 'firstname', 'lastname', 'company_name']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  return messages;
}

export async function getMessageAdmin(id) {
  const message = await Message.findByPk(id, {
    include: [
      {
        model: User,
        attributes: ['id', 'email', 'firstname', 'lastname', 'company_name']
      }
    ]
  });

  if (!message) {
    const error = new Error('Message introuvable.');
    error.status = 404;
    throw error;
  }

  if (message.status === 'new') {
    message.status = 'read';
    await message.save();
  }

  return message;
}

export async function archiveMessageAdmin(id) {
  const message = await Message.findByPk(id);

  if (!message) {
    const error = new Error('Message introuvable.');
    error.status = 404;
    throw error;
  }

  message.status = 'archived';
  await message.save();

  return message;
}

export async function deleteMessageAdmin(id) {
  const message = await Message.findByPk(id);

  if (!message) {
    const error = new Error('Message introuvable.');
    error.status = 404;
    throw error;
  }

  await message.destroy();
  return { message: 'Message supprimé.' };
}

export async function replyToMessageAdmin(id, { subject, text }) {
  const message = await Message.findByPk(id);

  if (!message) {
    const error = new Error('Message introuvable.');
    error.status = 404;
    throw error;
  }

  if (!text || text.trim().length === 0) {
    const error = new Error('Le contenu de la réponse est obligatoire.');
    error.status = 400;
    throw error;
  }

  const replySubject = subject && subject.trim().length > 0
    ? subject.trim()
    : `Re: ${message.subject}`;

  // Template HTML pour la réponse
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Poppins', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background-color: #0a0b0e; padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .content { padding: 30px; color: #333333; line-height: 1.6; }
    .original-message { background-color: #f9f9f9; border-left: 3px solid #ce1b1d; padding: 15px; margin-top: 20px; font-size: 14px; color: #666; }
    .original-message p { margin: 5px 0; }
    .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888; }
    .footer a { color: #ce1b1d; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Studio Rewind</h1>
    </div>
    <div class="content">
      ${text.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('')}

      <div class="original-message">
        <p><strong>Votre message original :</strong></p>
        <p><em>Sujet : ${message.subject}</em></p>
        <p>${message.content.split('\n').join('<br>')}</p>
      </div>
    </div>
    <div class="footer">
      <p>Studio Rewind - Votre studio podcast</p>
      <p><a href="https://studiorewind.fr">www.studiorewind.fr</a></p>
    </div>
  </div>
</body>
</html>`;

  await sendMail({
    to: message.email,
    subject: replySubject,
    text,
    html
  });

  // Sauvegarder la réponse dans le message
  message.reply_subject = replySubject;
  message.reply_content = text;
  message.replied_at = new Date();

  // Marquer comme lu si nouveau
  if (message.status === 'new') {
    message.status = 'read';
  }

  await message.save();

  return { success: true };
}

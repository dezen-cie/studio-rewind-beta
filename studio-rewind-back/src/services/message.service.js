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

  await sendMail({
    to: message.email,
    subject: replySubject,
    text
  });

  // On peut marquer le message comme "read"
  if (message.status === 'new') {
    message.status = 'read';
    await message.save();
  }

  return { success: true };
}

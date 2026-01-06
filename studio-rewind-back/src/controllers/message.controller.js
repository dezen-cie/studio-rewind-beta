// src/controllers/message.controller.js
import {
  createContactMessage,
  listMessagesAdmin,
  getMessageAdmin,
  archiveMessageAdmin,
  deleteMessageAdmin,
  replyToMessageAdmin
} from '../services/message.service.js';

export async function contactPublic(req, res) {
  try {
    const { email, subject, content } = req.body;

    if (!email || !subject || !content) {
      return res.status(400).json({
        message: "Email, sujet et message sont obligatoires."
      });
    }

    const message = await createContactMessage({
      email,
      subject,
      content
    });

    return res.status(201).json(message);
  } catch (error) {
    console.error('Erreur contactPublic:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function contactAuthenticated(req, res) {
  try {
    const { subject, content } = req.body;

    if (!subject || !content) {
      return res.status(400).json({
        message: "Sujet et message sont obligatoires."
      });
    }

    const message = await createContactMessage({
      userId: req.user.id,
      subject,
      content
    });

    return res.status(201).json(message);
  } catch (error) {
    console.error('Erreur contactAuthenticated:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function adminGetMessages(req, res) {
  try {
    const messages = await listMessagesAdmin();
    return res.json(messages);
  } catch (error) {
    console.error('Erreur adminGetMessages:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function adminGetMessageById(req, res) {
  try {
    const { id } = req.params;
    const message = await getMessageAdmin(id);
    return res.json(message);
  } catch (error) {
    console.error('Erreur adminGetMessageById:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function adminArchiveMessage(req, res) {
  try {
    const { id } = req.params;
    const message = await archiveMessageAdmin(id);
    return res.json(message);
  } catch (error) {
    console.error('Erreur adminArchiveMessage:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function adminDeleteMessageController(req, res) {
  try {
    const { id } = req.params;
    const result = await deleteMessageAdmin(id);
    return res.json(result);
  } catch (error) {
    console.error('Erreur adminDeleteMessage:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function adminReplyToMessageController(req, res) {
  try {
    const { id } = req.params;
    const { subject, text } = req.body;

    const result = await replyToMessageAdmin(id, { subject, text });
    return res.json(result);
  } catch (error) {
    console.error('Erreur adminReplyToMessage:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

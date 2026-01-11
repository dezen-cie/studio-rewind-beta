// src/controllers/admin.controller.js
import {
  createAdmin,
  setUserActiveStatus,
  deleteUserPermanent,
  listUsers,
  toggleAdminStatus
} from '../services/admin.service.js';

export async function createAdminAccount(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe obligatoires." });
    }

    const admin = await createAdmin(email, password);
    return res.status(201).json(admin);
  } catch (error) {
    console.error("Erreur createAdmin:", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function activateUser(req, res) {
  try {
    const { userId } = req.params;
    const user = await setUserActiveStatus(userId, true);
    return res.json(user);
  } catch (error) {
    console.error("Erreur activateUser:", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function deactivateUser(req, res) {
  try {
    const { userId } = req.params;
    const user = await setUserActiveStatus(userId, false);
    return res.json(user);
  } catch (error) {
    console.error("Erreur deactivateUser:", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const { userId } = req.params;
    const result = await deleteUserPermanent(userId);
    return res.json(result);
  } catch (error) {
    console.error("Erreur deleteUser:", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function getUsers(req, res) {
  try {
    const users = await listUsers();
    return res.json(users);
  } catch (error) {
    console.error('Erreur getUsers:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function toggleAdmin(req, res) {
  try {
    const { userId } = req.params;
    const { makeAdmin } = req.body;

    if (typeof makeAdmin !== 'boolean') {
      return res.status(400).json({ message: "Le paramètre makeAdmin est obligatoire (true/false)." });
    }

    const user = await toggleAdminStatus(userId, makeAdmin, req.user.id);
    return res.json(user);
  } catch (error) {
    console.error('Erreur toggleAdmin:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

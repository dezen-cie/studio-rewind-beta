// src/services/admin.service.js
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { User } from '../models/index.js';

const SALT_ROUNDS = 10;

// Création de l'admin (uniquement par super admin)
export async function createAdmin(email, password) {
  const exists = await User.findOne({ where: { email } });

  if (exists) {
    const error = new Error("Un utilisateur existe déjà avec cet email.");
    error.status = 400;
    throw error;
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const admin = await User.create({
    email,
    password: hashed,
    role: 'admin',
    account_type: 'professionnel',
    company_name: 'Administration',
    phone: '0000000000',
    is_active: true
  });

  return admin;
}

export async function listUsers() {
  const users = await User.findAll({
    where: {
      role: { [Op.ne]: 'super_admin' } // <--- SUPER ADMIN NON RENVOYÉ
    },
    attributes: {
      exclude: ['password']
    },
    order: [['created_at', 'DESC']]
  });

  return users;
}

// Désactiver / Activer un compte utilisateur
export async function setUserActiveStatus(userId, active) {
  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error("Utilisateur introuvable.");
    error.status = 404;
    throw error;
  }

  user.is_active = active;
  await user.save();

  return user;
}

// Hard delete
export async function deleteUserPermanent(userId) {
  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error("Utilisateur introuvable.");
    error.status = 404;
    throw error;
  }

  await user.destroy();
  return { message: "Utilisateur supprimé définitivement." };
}

// Toggle admin status (uniquement via cette fonction, pas autrement)
export async function toggleAdminStatus(userId, makeAdmin, requestingUserId) {
  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error("Utilisateur introuvable.");
    error.status = 404;
    throw error;
  }

  // Ne pas permettre de modifier un super_admin
  if (user.role === 'super_admin') {
    const error = new Error("Impossible de modifier le statut d'un super admin.");
    error.status = 403;
    throw error;
  }

  // Ne pas permettre de se modifier soi-même
  if (userId === requestingUserId) {
    const error = new Error("Vous ne pouvez pas modifier votre propre statut.");
    error.status = 403;
    throw error;
  }

  if (makeAdmin) {
    // Promouvoir en admin (garder le lien podcaster s'il existe)
    user.role = 'admin';
  } else {
    // Rétrograder : si c'est un podcaster, revenir à podcaster, sinon client
    const { Podcaster } = await import('../models/index.js');
    const podcaster = await Podcaster.findOne({ where: { user_id: userId } });

    if (podcaster) {
      user.role = 'podcaster';
    } else {
      user.role = 'client';
    }
  }

  await user.save();

  // Retourner l'utilisateur sans le mot de passe
  const { password, ...userWithoutPassword } = user.toJSON();
  return userWithoutPassword;
}

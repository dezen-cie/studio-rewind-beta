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

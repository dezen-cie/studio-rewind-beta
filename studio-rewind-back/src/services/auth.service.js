// src/services/auth.service.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const SALT_ROUNDS = 10;

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      is_active: user.is_active
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
}

export async function registerUser(payload) {
  const {
    email,
    password,
    account_type,
    firstname,
    lastname,
    company_name,
    vat_number,
    phone
  } = payload;

  // Vérifier que l'email n'existe pas déjà
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    const error = new Error('Un compte existe déjà avec cet email.');
    error.status = 400;
    throw error;
  }

  // Hash du mot de passe
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Création de l’utilisateur (toujours client ici)
  const user = await User.create({
    email,
    password: hashedPassword,
    account_type,
    firstname: account_type === 'particulier' ? firstname : null,
    lastname: account_type === 'particulier' ? lastname : null,
    company_name: account_type === 'professionnel' ? company_name : null,
    vat_number: account_type === 'professionnel' ? vat_number : null,
    phone,
    role: 'client',
    is_active: true
  });

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      account_type: user.account_type,
      firstname: user.firstname,
      lastname: user.lastname,
      company_name: user.company_name,
      vat_number: user.vat_number,
      phone: user.phone,
      is_active: user.is_active
    }
  };
}

export async function loginUser(email, password) {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    const error = new Error('Identifiants invalides.');
    error.status = 401;
    throw error;
  }

  if (!user.is_active) {
    const error = new Error("Ce compte est inactif. Veuillez contacter l'administrateur.");
    error.status = 403;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Identifiants invalides.');
    error.status = 401;
    throw error;
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      account_type: user.account_type,
      firstname: user.firstname,
      lastname: user.lastname,
      company_name: user.company_name,
      vat_number: user.vat_number,
      phone: user.phone,
      is_active: user.is_active,
      must_change_password: user.must_change_password || false
    }
  };
}

export async function getUserProfile(userId) {
  const user = await User.findByPk(userId, {
    attributes: {
      exclude: ['password']
    }
  });

  if (!user) {
    const error = new Error('Utilisateur introuvable.');
    error.status = 404;
    throw error;
  }

  return user;
}

// src/controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User, Podcaster } from '../models/index.js';

const { JWT_SECRET, JWT_EXPIRES_IN = '7d', NODE_ENV } = process.env;

function signToken(user) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET manquant dans ton .env back');
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      account_type: user.account_type,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function sanitizeUser(user, podcasterId = null) {
  return {
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
    podcaster_id: podcasterId,
  };
}

function sendAuthResponse(res, user, podcasterId = null) {
  const token = signToken(user);

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
    secure: NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
  });

  return res.json({
    user: sanitizeUser(user, podcasterId),
    token, // Pour Safari iOS qui bloque les cookies tiers
  });
}

// ========== REGISTER ==========
export async function register(req, res) {
  try {
    const {
      email,
      password,
      account_type,
      firstname,
      lastname,
      company_name,
      vat_number,
      phone,
    } = req.body;

    if (!email || !password || !account_type || !phone) {
      return res.status(400).json({
        message:
          'Email, mot de passe, type de compte et téléphone sont obligatoires.',
      });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'Un utilisateur avec cet email existe déjà.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      account_type,
      firstname: firstname || null,
      lastname: lastname || null,
      company_name: company_name || null,
      vat_number: vat_number || null,
      phone,
      role: 'client',
      is_active: true,
    });

    return sendAuthResponse(res, user);
  } catch (error) {
    console.error('Erreur register:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ========== LOGIN ==========
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email et mot de passe sont obligatoires.' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res
        .status(401)
        .json({ message: 'Identifiants invalides.' });
    }

    if (!user.is_active) {
      return res.status(403).json({
        message:
          'Ton compte est inactif. Contacte un administrateur si besoin.',
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res
        .status(401)
        .json({ message: 'Identifiants invalides.' });
    }

    // Vérifier si l'utilisateur est aussi un podcaster
    const podcaster = await Podcaster.findOne({ where: { user_id: user.id } });
    const podcasterId = podcaster ? podcaster.id : null;

    return sendAuthResponse(res, user, podcasterId);
  } catch (error) {
    console.error('Erreur login:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ========== ME ==========
export async function me(req, res) {
  try {
    if (!req.user?.id) {
      return res
        .status(401)
        .json({ message: 'Non authentifié.' });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res
        .status(404)
        .json({ message: 'Utilisateur introuvable.' });
    }

    // Vérifier si l'utilisateur est aussi un podcaster
    const podcaster = await Podcaster.findOne({ where: { user_id: user.id } });
    const podcasterId = podcaster ? podcaster.id : null;

    return res.json({
      user: sanitizeUser(user, podcasterId),
    });
  } catch (error) {
    console.error('Erreur me:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}


// ========== CHANGE PASSWORD ==========
export async function changePasswordController(req, res) {
  try {
    const userId = req.user?.id; 

    if (!userId) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
      return res
        .status(400)
        .json({ message: 'Tous les champs sont obligatoires.' });
    }

    if (new_password !== confirm_password) {
      return res
        .status(400)
        .json({ message: 'La confirmation ne correspond pas au nouveau mot de passe.' });
    }

    // optionnel : règles de complexité
    if (new_password.length < 8) {
      return res
        .status(400)
        .json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    const isValid = await bcrypt.compare(current_password, user.password);
    if (!isValid) {
      return res
        .status(400)
        .json({ message: 'Le mot de passe actuel est incorrect.' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    user.password = hashed;
    await user.save();

    return res.json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur changePasswordController:', error);
    return res.status(500).json({ message: 'Erreur serveur lors du changement de mot de passe.' });
  }
}

// ========== LOGOUT ==========
export async function logout(req, res) {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
      secure: NODE_ENV === 'production',
    });
    return res.json({ message: 'Déconnecté.' });
  } catch (error) {
    console.error('Erreur logout:', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

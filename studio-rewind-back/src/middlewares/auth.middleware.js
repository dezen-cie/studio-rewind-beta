// src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  console.warn(
    '⚠️ JWT_SECRET manquant dans les variables d’environnement. Le middleware auth va planter si tu ne le fournis pas.'
  );
}

export function authenticate(req, res, next) {
  if (!JWT_SECRET) {
    return res
      .status(500)
      .json({ message: 'JWT mal configuré côté serveur.' });
  }

  let token = null;

  // 1) Header Authorization (pour tests / REST Client)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  // 2) Cookie httpOnly (flux normal front)
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Non authentifié. Token manquant.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // on normalise ce qu’on expose au reste du back
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      account_type: payload.account_type,
    };

    return next();
  } catch (err) {
    console.error('Erreur vérification JWT :', err);
    return res
      .status(401)
      .json({ message: 'Token invalide ou expiré.' });
  }
}

export function requireAdmin(req, res, next) {
  if (
    !req.user ||
    (req.user.role !== 'admin' && req.user.role !== 'super_admin')
  ) {
    return res
      .status(403)
      .json({ message: 'Accès réservé aux administrateurs.' });
  }
  next();
}

export function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      message: 'Accès réservé au super administrateur.',
    });
  }
  next();
}

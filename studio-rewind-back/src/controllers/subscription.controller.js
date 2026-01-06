import { Subscription } from '../models/index.js';
import { getUserSubscriptionUsage } from '../services/reservation.service.js';

export async function getMySubscription(req, res) {
  try {
    const userId = req.user.id;

    const subscriptions = await Subscription.findAll({
      where: {
        user_id: userId,
        active: true
      }
    });

    if (!subscriptions.length) {
      return res.json({
        hasSubscription: false,
        purchased_hours: 0,
        used_hours: 0,
        remaining_hours: 0
      });
    }

    const { purchasedHours, usedHours, remainingHours } =
      await getUserSubscriptionUsage(userId);

    return res.json({
      hasSubscription: true,
      purchased_hours: purchasedHours,
      used_hours: usedHours,
      remaining_hours: remainingHours
    });
  } catch (error) {
    console.error('Erreur getMySubscription:', error);
    return res
      .status(500)
      .json({ message: error.message || 'Erreur serveur.' });
  }
}

/**
 * POST /api/subscriptions
 * Création d'un pack d'heures pour un utilisateur (admin only)
 */
export async function adminCreateSubscription(req, res) {
  try {
    const { user_id, monthly_hours_quota } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'user_id est obligatoire.' });
    }

    // 800€ TTC pour le pack (adaptable plus tard)
    const priceTtc = 800;
    const priceHt = priceTtc / 1.2;
    const priceTva = priceTtc - priceHt;

    const subscription = await Subscription.create({
      user_id,
      // ce champ représente maintenant "nombre d'heures dans ce pack"
      monthly_hours_quota: monthly_hours_quota ?? 5,
      hours_used: 0,
      active: true,
      price_ht: priceHt,
      price_tva: priceTva,
      price_ttc: priceTtc,
      paid_at: new Date()
    });

    return res.status(201).json(subscription);
  } catch (err) {
    console.error('Erreur adminCreateSubscription:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
}

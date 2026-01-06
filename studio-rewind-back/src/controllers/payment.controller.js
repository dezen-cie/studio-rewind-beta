// src/controllers/payment.controller.js
import {
  createReservationPaymentIntent,
  confirmReservationPayment
} from '../services/payment.service.js';

/**
 * POST /api/payments/reservation-intent
 * Crée un PaymentIntent Stripe + une réservation "pending"
 * (paiement à l'acte pour une formule autonome / améliorée / "abonnement pack")
 */
export async function createReservationIntent(req, res) {
  try {
    const userId = req.user.id;
    const { formula, start_date, end_date } = req.body;

    const result = await createReservationPaymentIntent(userId, {
      formula,
      start_date,
      end_date
    });

    return res.json(result);
  } catch (error) {
    console.error('Erreur createReservationIntent:', error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Erreur serveur.' });
  }
}

/**
 * POST /api/payments/confirm-reservation
 * Confirmé après succès Stripe (PaymentIntent status = succeeded)
 * -> passe la réservation en "confirmed"
 * -> si formula === "abonnement", crée un pack d'heures (Subscription)
 */
export async function confirmReservation(req, res) {
  try {
    const userId = req.user.id;
    const { reservation_id, payment_intent_id } = req.body;

    const reservation = await confirmReservationPayment(userId, {
      reservation_id,
      payment_intent_id
    });

    return res.json({ reservation });
  } catch (error) {
    console.error('Erreur confirmReservation:', error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Erreur serveur.' });
  }
}

/**
 * (Optionnel) POST /api/payments/subscription-intent
 *
 * Si tu as encore une route qui pointe dessus (ex: /payments/subscription-intent),
 * on la garde pour éviter un crash, mais on la désactive proprement.
 *
 * Si tu n'utilises plus cette route, tu peux aussi supprimer
 * la route côté `payment.routes.js` et cette fonction.
 */
export async function createSubscriptionIntent(_req, res) {
  return res.status(400).json({
    message:
      "Le flux de paiement d'abonnement dédié n'est plus utilisé. Utilisez le tunnel de réservation classique ou un nouveau flux adapté."
  });
}

/**
 * (Optionnel) POST /api/payments/confirm-subscription
 *
 * Même logique que ci-dessus : on expose la fonction pour ne pas casser
 * d'éventuelles routes existantes, mais on signale que le flux est désactivé.
 */
export async function confirmSubscriptionPayment(_req, res) {
  return res.status(400).json({
    message:
      "La confirmation d'abonnement via cette route n'est plus disponible. Le flux d'abonnement dédié est désactivé."
  });
}

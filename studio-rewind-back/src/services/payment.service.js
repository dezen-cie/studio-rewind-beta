// src/services/payment.service.js
import stripe from '../config/stripe.js';
import { Reservation, User, Subscription } from '../models/index.js';
import { calculateReservationPricing } from '../utils/pricing.js';
import { checkAvailability } from './reservation.service.js';

// ==============================
//  PaymentIntent + réservation
//  (paiement à l'acte via Stripe)
// ==============================

export async function createReservationPaymentIntent(
  userId,
  { formula, start_date, end_date, podcaster_id }
) {
  const user = await User.findByPk(userId);
  if (!user || !user.is_active) {
    const err = new Error('Utilisateur inactif ou introuvable.');
    err.status = 403;
    throw err;
  }

  if (!formula || !start_date || !end_date) {
    const err = new Error(
      'Formule, date de début et date de fin sont obligatoires.'
    );
    err.status = 400;
    throw err;
  }

  // Pour les formules classiques (pas abonnement), le podcasteur est obligatoire
  if (formula !== 'abonnement' && !podcaster_id) {
    const err = new Error('Le podcasteur est obligatoire.');
    err.status = 400;
    throw err;
  }

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    const err = new Error('Dates de début / fin invalides.');
    err.status = 400;
    throw err;
  }

  if (endDate <= startDate) {
    const err = new Error(
      'La date de fin doit être strictement supérieure à la date de début.'
    );
    err.status = 400;
    throw err;
  }

  // Calcul du pricing pour cette réservation ou ce pack
  const pricing = await calculateReservationPricing(
    formula,
    startDate,
    endDate
  );

  // Sécurité : on refuse d'aller parler à Stripe avec un montant nul ou négatif
  if (!pricing.price_ttc || pricing.price_ttc <= 0) {
    const err = new Error(
      "Le montant calculé pour cette réservation est nul ou invalide. Vérifie la configuration tarifaire."
    );
    err.status = 400;
    throw err;
  }

  // ❗ IMPORTANT :
  // Pour les formules classiques (autonome / améliorée / reseaux), on vérifie que le créneau n'est pas déjà pris.
  // Pour "abonnement" (achat de pack d'heures), on NE bloque PAS le studio.
  if (formula !== 'abonnement') {
    await checkAvailability(startDate, endDate, podcaster_id);
  }

  // On crée une "réservation" en pending, qui sert soit :
  // - de vraie réservation de créneau (autonome / améliorée)
  // - de trace d'achat de pack (abonnement)
  const reservation = await Reservation.create({
    user_id: userId,
    podcaster_id: podcaster_id || null,
    formula,
    start_date: startDate,
    end_date: endDate,
    total_hours: pricing.total_hours,
    price_ht: pricing.price_ht,
    price_tva: pricing.price_tva,
    price_ttc: pricing.price_ttc,
    is_subscription: false, // ce n'est PAS encore une résa consommant un pack
    status: 'pending'
  });

  const amount = Math.round(pricing.price_ttc * 100); // en centimes
  const currency = process.env.STRIPE_CURRENCY || 'eur';

  // Création du PaymentIntent Stripe (uniquement paiement par carte bancaire)
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    payment_method_types: ['card'],
    metadata: {
      user_id: String(userId),
      reservation_id: String(reservation.id),
      formula
    }
  });

  // On garde la référence vers le PaymentIntent dans la réservation
  reservation.stripe_payment_intent_id = paymentIntent.id;
  await reservation.save();

  return {
    clientSecret: paymentIntent.client_secret,
    reservationId: reservation.id,
    paymentIntentId: paymentIntent.id
  };
}

// ====================================
//  Confirmation après succès Stripe
// ====================================

export async function confirmReservationPayment(
  userId,
  { reservation_id, payment_intent_id }
) {
  if (!reservation_id || !payment_intent_id) {
    const err = new Error(
      'reservation_id et payment_intent_id sont obligatoires.'
    );
    err.status = 400;
    throw err;
  }

  const reservation = await Reservation.findOne({
    where: {
      id: reservation_id,
      user_id: userId
    }
  });

  if (!reservation) {
    const err = new Error(
      "Réservation introuvable pour cet utilisateur ou déjà supprimée."
    );
    err.status = 404;
    throw err;
  }

  // Si déjà confirmée, on renvoie simplement
  if (reservation.status === 'confirmed') {
    return reservation;
  }

  // Vérif de cohérence PaymentIntent
  if (
    reservation.stripe_payment_intent_id &&
    reservation.stripe_payment_intent_id !== payment_intent_id
  ) {
    const err = new Error(
      "Incohérence entre la réservation et l'identifiant du paiement."
    );
    err.status = 400;
    throw err;
  }

  // On récupère le PaymentIntent côté Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(
    payment_intent_id
  );

  if (!paymentIntent) {
    const err = new Error('PaymentIntent introuvable côté Stripe.');
    err.status = 400;
    throw err;
  }

  if (paymentIntent.status !== 'succeeded') {
    const err = new Error(
      `Le paiement n’est pas confirmé côté Stripe (statut : ${paymentIntent.status}).`
    );
    err.status = 400;
    throw err;
  }

  // Paiement OK -> on confirme la réservation
  reservation.status = 'confirmed';
  await reservation.save();

  // Si la formule est "abonnement", on crée un pack d'heures prépayées
  if (reservation.formula === 'abonnement') {
    const HOURS_PER_PACK = 5; // pack de 5h comme défini dans ta logique

    await Subscription.create({
      user_id: reservation.user_id,
      monthly_hours_quota: HOURS_PER_PACK, // utilisé comme "nombre d'heures du pack"
      hours_used: 0,
      active: true,
      price_ht: reservation.price_ht,
      price_tva: reservation.price_tva,
      price_ttc: reservation.price_ttc,
      paid_at: new Date(),
      stripe_subscription_id: null // on ne gère pas de subscription Stripe ici
    });
  }

  return reservation;
}

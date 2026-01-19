// src/services/payment.service.js
import stripe from '../config/stripe.js';
import { Reservation, User, Formula, PromoCode, Podcaster } from '../models/index.js';
import { calculateReservationPricing } from '../utils/pricing.js';
import { checkAvailability } from './reservation.service.js';
import { sendReservationConfirmationEmail } from './reminder.service.js';

// ==============================
//  PaymentIntent + réservation
//  (paiement à l'acte via Stripe)
// ==============================

export async function createReservationPaymentIntent(
  userId,
  { formula, start_date, end_date, podcaster_id, promo_code }
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

  // Vérifier si la formule nécessite un podcasteur
  const formulaData = await Formula.findOne({ where: { key: formula } });
  const requiresPodcaster = formulaData?.requires_podcaster ?? true;

  if (requiresPodcaster && !podcaster_id) {
    const err = new Error('Le choix du podcasteur est obligatoire pour cette formule.');
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

  // Gestion du code promo
  let promoData = null;
  let finalPricing = { ...pricing };

  if (promo_code) {
    const promoCodeRecord = await PromoCode.findOne({
      where: { code: promo_code.toUpperCase() }
    });

    if (!promoCodeRecord) {
      const err = new Error('Code promo invalide.');
      err.status = 400;
      throw err;
    }

    // Vérifier si le code est actif
    if (promoCodeRecord.is_active === false) {
      const err = new Error('Ce code promo n\'est plus actif.');
      err.status = 400;
      throw err;
    }

    // Vérifier si le code n'est pas expiré
    if (promoCodeRecord.expires_at && promoCodeRecord.expires_at < new Date()) {
      const err = new Error('Ce code promo a expiré.');
      err.status = 400;
      throw err;
    }

    // Appliquer la reduction
    const discountPercent = promoCodeRecord.discount;
    const discountMultiplier = 1 - (discountPercent / 100);

    promoData = {
      code: promoCodeRecord.code,
      label: 'Code promo',
      discount: discountPercent,
      original_price_ht: pricing.price_ht,
      original_price_ttc: pricing.price_ttc
    };

    // Recalculer les prix avec la reduction
    finalPricing.price_ht = Math.round(pricing.price_ht * discountMultiplier * 100) / 100;
    finalPricing.price_tva = Math.round(finalPricing.price_ht * 0.2 * 100) / 100;
    finalPricing.price_ttc = Math.round((finalPricing.price_ht + finalPricing.price_tva) * 100) / 100;

    // Incrémenter le compteur d'utilisation (ne bloque pas les futures utilisations)
    await promoCodeRecord.increment('usage_count');
  }

  // Vérifier que le créneau n'est pas déjà pris
  await checkAvailability(startDate, endDate, podcaster_id);

  // Créer la réservation en pending
  const reservation = await Reservation.create({
    user_id: userId,
    podcaster_id: podcaster_id || null,
    formula,
    start_date: startDate,
    end_date: endDate,
    total_hours: finalPricing.total_hours,
    price_ht: finalPricing.price_ht,
    price_tva: finalPricing.price_tva,
    price_ttc: finalPricing.price_ttc,
    is_subscription: false,
    status: 'pending',
    // Champs promo
    promo_code: promoData?.code || null,
    promo_label: promoData?.label || null,
    promo_discount: promoData?.discount || null,
    original_price_ht: promoData?.original_price_ht || null,
    original_price_ttc: promoData?.original_price_ttc || null
  });

  const amount = Math.round(finalPricing.price_ttc * 100); // en centimes
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

  // Envoyer l'email de confirmation (async, ne bloque pas)
  sendReservationConfirmationEmail(reservation).catch(err => {
    console.error('Erreur envoi email confirmation:', err.message);
  });

  return reservation;
}

// ==============================
//  Récupérer le client secret d'une réservation pending
//  (pour reprendre un paiement abandonné)
// ==============================

export async function getReservationPaymentInfo(userId, reservationId) {
  if (!reservationId) {
    const err = new Error('reservation_id est obligatoire.');
    err.status = 400;
    throw err;
  }

  const reservation = await Reservation.findOne({
    where: {
      id: reservationId,
      user_id: userId
    },
    include: [
      {
        model: Podcaster,
        as: 'podcaster',
        attributes: ['id', 'name']
      }
    ]
  });

  if (!reservation) {
    const err = new Error('Réservation introuvable.');
    err.status = 404;
    throw err;
  }

  // Vérifier que la réservation est bien pending
  if (reservation.status !== 'pending') {
    const err = new Error(`Cette réservation est déjà ${reservation.status === 'confirmed' ? 'confirmée' : 'annulée'}.`);
    err.status = 400;
    throw err;
  }

  // Vérifier qu'on a bien un PaymentIntent
  if (!reservation.stripe_payment_intent_id) {
    const err = new Error('Aucun paiement en attente pour cette réservation.');
    err.status = 400;
    throw err;
  }

  // Récupérer le PaymentIntent Stripe pour obtenir le client_secret
  const paymentIntent = await stripe.paymentIntents.retrieve(
    reservation.stripe_payment_intent_id
  );

  if (!paymentIntent) {
    const err = new Error('PaymentIntent introuvable côté Stripe.');
    err.status = 404;
    throw err;
  }

  // Si le paiement a déjà réussi, confirmer la réservation
  if (paymentIntent.status === 'succeeded') {
    reservation.status = 'confirmed';
    await reservation.save();

    // Envoyer l'email de confirmation (async, ne bloque pas)
    sendReservationConfirmationEmail(reservation).catch(err => {
      console.error('Erreur envoi email confirmation:', err.message);
    });

    const err = new Error('Le paiement a déjà été effectué. Votre réservation est confirmée.');
    err.status = 400;
    throw err;
  }

  // Si le paiement a été annulé, on ne peut pas reprendre
  if (paymentIntent.status === 'canceled') {
    const err = new Error('Le paiement a été annulé. Veuillez créer une nouvelle réservation.');
    err.status = 400;
    throw err;
  }

  // Récupérer le nom de la formule
  const formula = await Formula.findOne({ where: { key: reservation.formula } });

  return {
    clientSecret: paymentIntent.client_secret,
    reservationId: reservation.id,
    paymentIntentId: reservation.stripe_payment_intent_id,
    reservation: {
      id: reservation.id,
      formula: reservation.formula,
      formulaName: formula?.name || reservation.formula,
      start_date: reservation.start_date,
      end_date: reservation.end_date,
      total_hours: reservation.total_hours,
      price_ht: reservation.price_ht,
      price_tva: reservation.price_tva,
      price_ttc: reservation.price_ttc,
      podcaster: reservation.podcaster
    }
  };
}

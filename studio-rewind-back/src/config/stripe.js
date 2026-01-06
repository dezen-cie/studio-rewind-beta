// src/config/stripe.js
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error(
    'STRIPE_SECRET_KEY manquant dans ton fichier .env (clé secrète Stripe).'
  );
}

// Tu peux adapter la version d’API si besoin
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20'
});

export default stripe;

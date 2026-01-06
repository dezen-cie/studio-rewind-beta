// src/stripe/stripeClient.ts
import { loadStripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    'VITE_STRIPE_PUBLISHABLE_KEY manquant dans ton .env front (clé publique Stripe).'
  );
}

export const stripePromise = loadStripe(publishableKey);

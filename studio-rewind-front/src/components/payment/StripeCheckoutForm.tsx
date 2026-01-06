// src/components/payment/StripeCheckoutForm.tsx
import React, { useState } from 'react';
import {
  PaymentElement,
  useElements,
  useStripe
} from '@stripe/react-stripe-js';
import api from '../../api/client';

// On le garde pour rester compatible avec StepThreeSummary si tu passes encore "mode"
type Mode = 'reservation' | 'subscription';

type StripeCheckoutFormProps = {
  mode?: Mode;
  // Peut être undefined ou null côté appel, on gère ça proprement
  reservationId?: string | null;
  paymentIntentId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
};

const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({
  mode = 'reservation',
  reservationId,
  paymentIntentId,
  onSuccess,
  onError
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // On efface l'erreur locale, mais on ne déclenche PAS onError ici
    setLocalError(null);

    if (!stripe || !elements) {
      const msg = 'Le module de paiement n’est pas encore prêt.';
      setLocalError(msg);
      onError(msg);
      return;
    }

    setSubmitting(true);

    try {
      // 1) Stripe traite le paiement
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Pas de redirection, on reste dans ton SPA
        },
        redirect: 'if_required'
      });

      // 👉 SEULEMENT si Stripe renvoie une vraie erreur on affiche un message
      if (stripeError) {
        console.error('Erreur Stripe confirmPayment:', stripeError);
        const msg =
          stripeError.message ||
          'Une erreur est survenue lors de la confirmation du paiement.';

        setLocalError(msg);
        onError(msg);
        setSubmitting(false);
        return;
      }

      // À ce stade, Stripe considère que le paiement est OK (ou va finir côté 3DS),
      // donc on passe à la confirmation côté serveur.

      // Pour l’instant, on ne gère qu’un flux "réservation" côté back
      if (mode === 'reservation') {
        if (!reservationId) {
          const msg =
            "ID de réservation manquant pour confirmer la réservation côté serveur.";
          setLocalError(msg);
          onError(msg);
          setSubmitting(false);
          return;
        }

        try {
          await api.post('/payments/confirm-reservation', {
            reservation_id: reservationId,
            payment_intent_id: paymentIntentId
          });
        } catch (err: any) {
          console.error('Erreur /payments/confirm-reservation:', err);
          const msg =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            'Le paiement est passé, mais une erreur est survenue lors de la confirmation de la réservation.';

          setLocalError(msg);
          onError(msg);
          setSubmitting(false);
          return;
        }
      } else {
        // Si un jour tu réactives un vrai flux "subscription" dédié,
        // tu pourras gérer un appel /payments/confirm-subscription ici.
        // Pour l’instant on ne fait rien de spécial.
      }

      // 3) Tout est OK → on laisse le parent rediriger
      onSuccess();
    } catch (err: any) {
      console.error('Erreur handleSubmit Stripe:', err);
      const msg =
        err?.message ||
        'Une erreur inattendue est survenue pendant le paiement.';
      setLocalError(msg);
      onError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stripe-checkout-form">
      <div className="payment-element-wrapper">
        <PaymentElement id="payment-element" />
      </div>

      {localError && (
        <p className="auth-error" style={{ marginTop: '1rem' }}>
          {localError}
        </p>
      )}

      <div className="form-actions" style={{ marginTop: '1.5rem' }}>
        <button
          type="submit"
          className="confirm-btn active"
          disabled={submitting || !stripe || !elements}
        >
          {submitting ? 'Paiement en cours...' : 'Payer et confirmer'}
        </button>
      </div>
    </form>
  );
};

export default StripeCheckoutForm;

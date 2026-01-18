// src/pages/ResumePaymentPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import api from '../api/client';
import StripeCheckoutForm from '../components/payment/StripeCheckoutForm';
import './ResumePaymentPage.css';

// Stripe
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string | undefined;
const stripePromise: Promise<Stripe | null> | null = stripePublicKey
  ? loadStripe(stripePublicKey)
  : null;

interface ReservationInfo {
  id: string;
  formula: string;
  formulaName: string;
  start_date: string;
  end_date: string;
  total_hours: number;
  price_ht: number;
  price_tva: number;
  price_ttc: number;
  podcaster?: {
    id: string;
    name: string;
  } | null;
}

interface PaymentInfo {
  clientSecret: string;
  reservationId: string;
  paymentIntentId: string;
  reservation: ReservationInfo;
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function ResumePaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  useEffect(() => {
    async function loadPaymentInfo() {
      if (!id) {
        setError('Réservation non spécifiée.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await api.get<PaymentInfo>(`/payments/reservation/${id}/resume`);
        setPaymentInfo(res.data);
      } catch (err: any) {
        console.error('Erreur chargement paiement:', err);
        const message = err?.response?.data?.message || 'Impossible de charger les informations de paiement.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadPaymentInfo();
  }, [id]);

  function handleStripeSuccess() {
    const flash = 'Votre paiement a été accepté et votre réservation est confirmée. Rendez-vous au studio à la date et heure convenues !';
    navigate('/member', { state: { flash } });
  }

  function handleStripeError(message: string) {
    setError(message || 'Erreur lors du paiement.');
  }

  if (loading) {
    return (
      <div className="resume-payment-page">
        <div className="resume-payment-container">
          <p className="resume-payment-loading">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="resume-payment-page">
        <div className="resume-payment-container">
          <div className="resume-payment-error">
            <h2>Erreur</h2>
            <p>{error}</p>
            <Link to="/member" className="resume-payment-back-link">
              Retour à l'espace membre
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentInfo) {
    return (
      <div className="resume-payment-page">
        <div className="resume-payment-container">
          <p>Aucune information de paiement trouvée.</p>
          <Link to="/member" className="resume-payment-back-link">
            Retour à l'espace membre
          </Link>
        </div>
      </div>
    );
  }

  const { reservation } = paymentInfo;

  return (
    <div className="resume-payment-page">
      <div className="resume-payment-container">
        <h1 className="resume-payment-title">Finaliser votre paiement</h1>

        {/* Récapitulatif de la réservation */}
        <section className="resume-payment-summary">
          <h2>Récapitulatif</h2>
          <div className="resume-payment-details">
            <p>
              <strong>Formule :</strong> {reservation.formulaName}
            </p>
            <p>
              <strong>Date :</strong> {formatDateTime(reservation.start_date)} → {formatDateTime(reservation.end_date)}
            </p>
            {reservation.podcaster && (
              <p>
                <strong>Podcasteur :</strong> {reservation.podcaster.name}
              </p>
            )}
            <p>
              <strong>Durée :</strong> {reservation.total_hours}h
            </p>
          </div>

          <div className="resume-payment-prices">
            <p>
              Prix HT : <strong>{reservation.price_ht.toFixed(2)} €</strong>
            </p>
            <p>
              TVA (20%) : <strong>{reservation.price_tva.toFixed(2)} €</strong>
            </p>
            <p className="resume-payment-total">
              Prix TTC : <strong>{reservation.price_ttc.toFixed(2)} €</strong>
            </p>
          </div>
        </section>

        {/* Formulaire Stripe */}
        <section className="resume-payment-stripe">
          {!stripePromise && (
            <p className="resume-payment-error-text">
              La clé publique Stripe est manquante (VITE_STRIPE_PUBLIC_KEY).
            </p>
          )}

          {stripePromise && (
            <>
              <h2>Paiement sécurisé</h2>
              <p className="resume-payment-info">
                Renseignez vos informations de carte pour finaliser votre paiement.
              </p>

              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: paymentInfo.clientSecret,
                  locale: 'fr',
                  appearance: {
                    theme: 'stripe',
                  },
                }}
              >
                <StripeCheckoutForm
                  mode="reservation"
                  reservationId={paymentInfo.reservationId}
                  paymentIntentId={paymentInfo.paymentIntentId}
                  onSuccess={handleStripeSuccess}
                  onError={handleStripeError}
                />
              </Elements>
            </>
          )}
        </section>

        <div className="resume-payment-footer">
          <Link to="/member" className="resume-payment-cancel-link">
            Annuler et retourner à l'espace membre
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResumePaymentPage;

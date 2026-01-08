// src/components/reservation/StepThree.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FormulaKey, PricingBreakdown } from '../../pages/ReservationPage';
import api, { setStoredToken } from '../../api/client';
import './StepThreeSummary.css';

// Stripe
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import StripeCheckoutForm from '../payment/StripeCheckoutForm';

// ====== STRIPE PUBLIC KEY ======
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string | undefined;
const stripePromise: Promise<Stripe | null> | null = stripePublicKey
  ? loadStripe(stripePublicKey)
  : null;

type StepThreeSummaryProps = {
  formula: FormulaKey;
  selectedDate: Date | null;
  startTime: string;
  endTime: string;
  pricing: PricingBreakdown | null;
  onBack: () => void;
};

type Mode = 'register' | 'login';
type AccountType = 'particulier' | 'professionnel';

type PaymentStep = 'formulaire_client' | 'stripe';

function buildDateTime(date: Date, time: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toISOString();
}

const StepThreeSummary: React.FC<StepThreeSummaryProps> = ({
  formula,
  selectedDate,
  startTime,
  endTime,
  pricing,
  onBack
}) => {
  const navigate = useNavigate();
  const isSubscription = formula === 'abonnement';
  const isReseaux = formula === 'reseaux';

  const [mode, setMode] = useState<Mode>('register');
  const [accountType, setAccountType] = useState<AccountType>('particulier');

  // REGISTER
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [extraRequest, setExtraRequest] = useState('');

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);

  // LOGIN
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginExtraRequest, setLoginExtraRequest] = useState('');

  // États généraux
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Étape paiement Stripe
  const [paymentStep, setPaymentStep] =
    useState<PaymentStep>('formulaire_client');
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null
  );
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  function formatDate() {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('fr-FR');
  }

  function getFormulaLabel() {
    if (formula === 'autonome') return 'Formule autonome';
    if (formula === 'amelioree') return 'Formule améliorée';
    if (formula === 'abonnement') return "Pack d'heures (abonnement)";
    if (formula === 'reseaux') return 'Formule Réseaux';
    return formula;
  }

  // ============================
  //  FLOW PAIEMENT (RÉSERVATION / PACK D'HEURES)
  // ============================

  async function startStripeReservationFlow() {
    // 🔴 CAS ABONNEMENT = achat d'un pack d'heures
    // On ne demande PAS de date/heure au client ici.
    if (isSubscription) {
      try {
        const now = new Date();
        const startIso = now.toISOString();
        const endIso = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(); // bloc fictif 5h

        const res = await api.post('/payments/reservation-intent', {
          formula,
          start_date: startIso,
          end_date: endIso
        });

        const data = res.data || {};
        const clientSecret = data.clientSecret;
        const resId = data.reservationId;
        const piId = data.paymentIntentId;

        if (!clientSecret || !resId || !piId) {
          throw new Error(
            'Réponse Stripe / pack heures invalide : clientSecret ou ids manquants.'
          );
        }

        setStripeClientSecret(clientSecret);
        setReservationId(resId);
        setPaymentIntentId(piId);
        setPaymentStep('stripe');
        setError(null);
        setSuccess(null);
        return;
      } catch (err: any) {
        console.error('Erreur startStripeReservationFlow (pack heures):', err);
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Erreur lors de la préparation du paiement du pack heures.';
        setError(msg);
        throw err;
      }
    }

    // 🔵 CAS RÉSERVATION (autonome / améliorée)
    if (!selectedDate || !startTime || !endTime) {
      throw new Error(
        'Date et créneau horaire obligatoires pour cette formule.'
      );
    }

    const startIso = buildDateTime(selectedDate, startTime);
    const endIso = buildDateTime(selectedDate, endTime);

    const res = await api.post('/payments/reservation-intent', {
      formula,
      start_date: startIso,
      end_date: endIso
    });

    const data = res.data || {};
    const clientSecret = data.clientSecret;
    const resId = data.reservationId;
    const piId = data.paymentIntentId;

    if (!clientSecret || !resId || !piId) {
      throw new Error(
        'Réponse Stripe / réservation invalide : clientSecret ou ids manquants.'
      );
    }

    setStripeClientSecret(clientSecret);
    setReservationId(resId);
    setPaymentIntentId(piId);
    setPaymentStep('stripe');
    setError(null);
    setSuccess(null);
  }

  /**
   * Callback appelé par StripeCheckoutForm en cas de succès :
   *  - paiement Stripe OK
   *  - back a confirmé la réservation ou créé le pack d'heures
   *  => on redirige vers /member avec flash
   */
  function handleStripeSuccess() {
    let flash = 'Votre paiement a été accepté et votre réservation est confirmée.';
    if (isSubscription) {
      flash = "Votre pack d'heures est actif. Vous pouvez maintenant réserver vos créneaux depuis l'espace membre.";
    } else if (isReseaux) {
      flash = "Votre Formule Réseaux est confirmée. Rendez-vous au studio à la date et heure convenues !";
    }
    navigate('/member', { state: { flash } });
  }

  function handleStripeError(message: string) {
    setError(message || 'Erreur lors du paiement.');
  }

  // ============================
  //  SUBMIT REGISTER / LOGIN
  // ============================

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!acceptTerms) {
      setError(
        "Vous devez accepter les CGU et la politique de confidentialité."
      );
      return;
    }

    if (!regPassword || regPassword !== regPasswordConfirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (!regEmail.trim()) {
      setError("L'email est obligatoire.");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        email: regEmail,
        password: regPassword,
        account_type: accountType,
        phone
      };

      if (accountType === 'particulier') {
        payload.firstname = firstname;
        payload.lastname = lastname;
      } else {
        payload.company_name = companyName;
        payload.vat_number = vatNumber;
      }

      const res = await api.post('/auth/register', payload);

      if (res.data?.user) {
        localStorage.setItem('sr_user', JSON.stringify(res.data.user));
      }
      // Stocke le token pour Safari iOS (fallback si cookies bloqués)
      if (res.data?.token) {
        setStoredToken(res.data.token);
      }

      // On enchaîne avec la création du PaymentIntent
      await startStripeReservationFlow();
    } catch (err: any) {
      console.error('Erreur inscription + réservation/pack:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Erreur lors de l'inscription ou de la préparation du paiement.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Email et mot de passe sont obligatoires.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPassword
      });

      if (res.data?.user) {
        localStorage.setItem('sr_user', JSON.stringify(res.data.user));
      }
      // Stocke le token pour Safari iOS (fallback si cookies bloqués)
      if (res.data?.token) {
        setStoredToken(res.data.token);
      }

      await startStripeReservationFlow();
    } catch (err: any) {
      console.error('Erreur connexion + réservation/pack:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Erreur lors de la connexion ou de la préparation du paiement.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ==== PRIX ABONNEMENT (statique pour l'instant – affichage) ====
  const abonnementPriceTtc = 800;
  const abonnementPriceHt = abonnementPriceTtc / 1.2;
  const aboTva = abonnementPriceHt * 0.2;
  const aboTtc = abonnementPriceHt + aboTva;

  return (
    <main className="booked-main booked-main-step3">
      <h2>Récapitulatif de votre réservation</h2>

      {/* WARNING DÉMO */}
      <div className="demo-warning">
        <span className="demo-warning-icon">⚠️</span>
        <div className="demo-warning-content">
          <strong>Site de démonstration</strong>
          <p>
            Ce site est une version de démonstration. Merci de ne pas effectuer de réservation réelle.
            Les paiements utilisent le mode test de Stripe (aucun prélèvement réel).
          </p>
        </div>
      </div>

      {/* RÉCAP PANIER */}
      <section className="cart-summary">
        <div className="cart-summary-main">
          <div className="cart-summary-visual">
            <div className="cart-summary-img-placeholder">
              {getFormulaLabel()}
            </div>
          </div>
        </div>

        <div className="recaps">
          <div className="cart-summary-recap">
            <div>
              <p>
                Formule : <strong>{getFormulaLabel()}</strong>
              </p>

              {!isSubscription && selectedDate && (
                <p>
                  Date : <strong>{formatDate()}</strong>
                </p>
              )}
            </div>

            {!isSubscription && (
              <div>
                {startTime && endTime && (
                  <p>
                    Créneau :{' '}
                    <strong>
                      {startTime} - {endTime}
                    </strong>
                  </p>
                )}

                {pricing && (
                  <p>
                    Nombre d&apos;heures :{' '}
                    <strong>{pricing.hours}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="cart-summary-actions">
            <button type="button" className="" onClick={onBack}>
              Modifier
            </button>
          </div>
        </div>

        <div className="recap-prices">
          {!isSubscription && pricing && (
            <>
              <p>
                Prix total HT :{' '}
                <strong>{pricing.price_ht.toFixed(2)} €</strong>
              </p>
              <p>
                TVA (20%) :{' '}
                <strong>{pricing.price_tva.toFixed(2)} €</strong>
              </p>
              <p>
                Prix total TTC :{' '}
                <strong>{pricing.price_ttc.toFixed(2)} €</strong>
              </p>
              {isReseaux && (
                <p className="small-info">
                  Enregistrement de 2h + montage de 2 podcasts et 5 vidéos verticales pour les réseaux.
                </p>
              )}
            </>
          )}

          {isSubscription && (
            <>
              <p>
                Prix pack HT :{' '}
                <strong>{abonnementPriceHt.toFixed(2)} €</strong>
              </p>
              <p>
                TVA (20%) : <strong>{aboTva.toFixed(2)} €</strong>
              </p>
              <p>
                Prix pack TTC :{' '}
                <strong>{aboTtc.toFixed(2)} €</strong>
              </p>
              <p className="small-info">
                Ce pack donne droit à 5h de réservation, gérées depuis votre espace membre.
              </p>
            </>
          )}
        </div>
      </section>

      {/* ZONE ERREUR / SUCCESS GÉNÉRALE */}
      <section className="customer-section">
        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        {/* 1) Étape formulaire client (register / login) */}
        {paymentStep === 'formulaire_client' && (
          <>
            {mode === 'register' ? (
              <>
                <header className="customer-header">
                  <h3>Nouveau client</h3>
                  <button
                    type="button"
                    className="link-like"
                    onClick={() => setMode('login')}
                  >
                    Vous avez déjà un compte ? Connectez-vous
                  </button>
                </header>

                <div className="customer-tabs">
                  <button
                    type="button"
                    className={
                      'customer-tab' +
                      (accountType === 'particulier' ? ' active' : '')
                    }
                    onClick={() => setAccountType('particulier')}
                  >
                    Particulier
                  </button>
                  <button
                    type="button"
                    className={
                      'customer-tab' +
                      (accountType === 'professionnel' ? ' active' : '')
                    }
                    onClick={() => setAccountType('professionnel')}
                  >
                    Professionnel
                  </button>
                </div>

                <form
                  className="customer-form"
                  onSubmit={handleRegisterSubmit}
                >
                  <div className="form-row">
                    <label htmlFor="regEmail">Email</label>
                    <input
                      id="regEmail"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <label htmlFor="regPassword">Mot de passe</label>
                    <input
                      id="regPassword"
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <label htmlFor="regPasswordConfirm">
                      Confirmation du mot de passe
                    </label>
                    <input
                      id="regPasswordConfirm"
                      type="password"
                      value={regPasswordConfirm}
                      onChange={(e) =>
                        setRegPasswordConfirm(e.target.value)
                      }
                      required
                    />
                  </div>

                  {accountType === 'particulier' && (
                    <>
                      <div className="form-row">
                        <label htmlFor="firstname">Prénom</label>
                        <input
                          id="firstname"
                          type="text"
                          value={firstname}
                          onChange={(e) =>
                            setFirstname(e.target.value)
                          }
                        />
                      </div>

                      <div className="form-row">
                        <label htmlFor="lastname">Nom</label>
                        <input
                          id="lastname"
                          type="text"
                          value={lastname}
                          onChange={(e) =>
                            setLastname(e.target.value)
                          }
                        />
                      </div>
                    </>
                  )}

                  {accountType === 'professionnel' && (
                    <>
                      <div className="form-row">
                        <label htmlFor="companyName">
                          Nom de l&apos;entreprise
                        </label>
                        <input
                          id="companyName"
                          type="text"
                          value={companyName}
                          onChange={(e) =>
                            setCompanyName(e.target.value)
                          }
                        />
                      </div>

                      <div className="form-row">
                        <label htmlFor="vatNumber">
                          Numéro de TVA
                        </label>
                        <input
                          id="vatNumber"
                          type="text"
                          value={vatNumber}
                          onChange={(e) =>
                            setVatNumber(e.target.value)
                          }
                        />
                      </div>
                    </>
                  )}

                  <div className="form-row">
                    <label htmlFor="phone">
                      Numéro de téléphone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <label htmlFor="extraRequest">
                      Demande supplémentaire
                    </label>
                    <textarea
                      id="extraRequest"
                      value={extraRequest}
                      onChange={(e) =>
                        setExtraRequest(e.target.value)
                      }
                    />
                  </div>

                  <div className="form-row checkbox-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) =>
                          setAcceptTerms(e.target.checked)
                        }
                      />
                      <span>
                        J&apos;ai lu et j&apos;accepte les CGU et la
                        Politique de confidentialité. Je consens au
                        traitement de mes données personnelles
                        conformément à cette politique.
                      </span>
                    </label>
                  </div>

                  <div className="form-row checkbox-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={acceptMarketing}
                        onChange={(e) =>
                          setAcceptMarketing(e.target.checked)
                        }
                      />
                      <span>
                        J&apos;accepte de recevoir des actualités et des
                        offres commerciales par email.
                      </span>
                    </label>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="prev-step-btn"
                      onClick={onBack}
                      disabled={loading}
                    >
                      Étape précédente
                    </button>
                    <button
                      type="submit"
                      className="confirm-btn active"
                      disabled={loading}
                    >
                      {loading
                        ? 'Traitement...'
                        : 'Procéder au paiement'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <header className="customer-header">
                  <h3>Connexion</h3>
                  <button
                    type="button"
                    className="link-like"
                    onClick={() => setMode('register')}
                  >
                    Vous n&apos;avez pas de compte ? Créer un compte
                  </button>
                </header>

                <form
                  className="customer-form"
                  onSubmit={handleLoginSubmit}
                >
                  <div className="form-row">
                    <label htmlFor="loginEmail">Email</label>
                    <input
                      id="loginEmail"
                      type="email"
                      value={loginEmail}
                      onChange={(e) =>
                        setLoginEmail(e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="form-row">
                    <label htmlFor="loginPassword">
                      Mot de passe
                    </label>
                    <input
                      id="loginPassword"
                      type="password"
                      value={loginPassword}
                      onChange={(e) =>
                        setLoginPassword(e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="form-row">
                    <label htmlFor="loginExtraRequest">
                      Demande supplémentaire
                    </label>
                    <textarea
                      id="loginExtraRequest"
                      value={loginExtraRequest}
                      onChange={(e) =>
                        setLoginExtraRequest(e.target.value)
                      }
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="prev-step-btn"
                      onClick={onBack}
                      disabled={loading}
                    >
                      Étape précédente
                    </button>
                    <button
                      type="submit"
                      className="confirm-btn active"
                      disabled={loading}
                    >
                      {loading
                        ? 'Traitement...'
                        : 'Procéder au paiement'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </>
        )}

        {/* 2) Étape Stripe (PaymentElement) */}
        {paymentStep === 'stripe' &&
          stripeClientSecret &&
          paymentIntentId && (
            <>
              {!stripePromise && (
                <p className="auth-error">
                  La clé publique Stripe est manquante (VITE_STRIPE_PUBLIC_KEY).
                  Ajoute-la dans ton fichier .env du front pour pouvoir payer.
                </p>
              )}

              {stripePromise && (
                <div className="stripe-step-wrapper">
                  <h3>Paiement sécurisé</h3>
                  <p className="small-info">
                    Renseignez vos informations de carte pour finaliser votre
                    paiement.
                  </p>

                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: stripeClientSecret,
                      locale: 'fr',
                      appearance: {
                        theme: 'stripe',
                      },
                    }}
                  >
                    <StripeCheckoutForm
                      mode="reservation"
                      reservationId={reservationId}
                      paymentIntentId={paymentIntentId}
                      onSuccess={handleStripeSuccess}
                      onError={handleStripeError}
                    />
                  </Elements>
                </div>
              )}
            </>
          )}
      </section>
    </main>
  );
};

export default StepThreeSummary;

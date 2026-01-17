// src/components/PopupPromo/PopupPromo.tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { subscribePromo } from '../../api/promo';
import './PopupPromo.css';

const POPUP_STORAGE_KEY = 'sr_promo_popup_seen';
const POPUP_EXPIRY_DAYS = 7;

// En dev, ajouter ?popup=1 dans l'URL pour forcer l'affichage
const DEV_MODE = import.meta.env.DEV;

function PopupPromo() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // En dev, ?popup=1 force l'affichage
    const urlParams = new URLSearchParams(window.location.search);
    const forcePopup = DEV_MODE && urlParams.get('popup') === '1';

    if (!forcePopup) {
      // Verifie si le popup a deja ete affiche
      const storedData = localStorage.getItem(POPUP_STORAGE_KEY);

      if (storedData) {
        const { timestamp } = JSON.parse(storedData);
        const now = Date.now();
        const expiryTime = POPUP_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

        // Si moins de 7 jours, ne pas afficher
        if (now - timestamp < expiryTime) {
          return;
        }
      }
    }

    // Affiche le popup apres un delai de 2 secondes (ou immediatement si force)
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, forcePopup ? 500 : 2000);

    return () => clearTimeout(timer);
  }, []);

  function handleClose() {
    setIsVisible(false);
    // Stocke le timestamp pour ne plus afficher pendant 7 jours
    localStorage.setItem(
      POPUP_STORAGE_KEY,
      JSON.stringify({ timestamp: Date.now() })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Veuillez entrer votre adresse email.');
      return;
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }

    try {
      setIsSubmitting(true);
      await subscribePromo(email);
      setSuccess(true);

      // Ferme automatiquement apres 5 secondes
      setTimeout(() => {
        handleClose();
      }, 5000);
    } catch (err: any) {
      console.error('Erreur inscription promo:', err);
      const msg = err?.response?.data?.message || 'Une erreur est survenue.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isVisible) return null;

  return (
    <div className="popup-promo-overlay" onClick={handleClose}>
      <div className="popup-promo" onClick={(e) => e.stopPropagation()}>
        <button className="popup-promo-close" onClick={handleClose} aria-label="Fermer">
          <X size={24} />
        </button>

        {!success ? (
          <>
            <div className="popup-promo-badge">Offre de lancement</div>
            <h2 className="popup-promo-title">Bienvenue chez Studio Rewind</h2>
            <p className="popup-promo-text">
              Pour votre premier podcast, beneficiez de <strong>-15%</strong> sur nos formules.
            </p>

            <form className="popup-promo-form" onSubmit={handleSubmit}>
              <div className="popup-promo-field">
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              {error && <p className="popup-promo-error">{error}</p>}

              <button
                type="submit"
                className="popup-promo-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Envoi...' : "Recevoir l'offre"}
              </button>
            </form>

            <p className="popup-promo-disclaimer">
              Vous recevrez votre code promo par email.
            </p>
          </>
        ) : (
          <div className="popup-promo-success">
            <div className="popup-promo-success-icon">✓</div>
            <h2 className="popup-promo-title">Merci !</h2>
            <p className="popup-promo-text">
              Votre code promo a ete envoye a <strong>{email}</strong>
            </p>
            <p className="popup-promo-text popup-promo-text--small">
              Pensez a verifier vos spams si vous ne le trouvez pas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PopupPromo;

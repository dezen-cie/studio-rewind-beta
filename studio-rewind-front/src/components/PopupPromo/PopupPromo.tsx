// src/components/PopupPromo/PopupPromo.tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { subscribePromo, getActivePopupConfig, type PopupConfig } from '../../api/promo';
import './PopupPromo.css';

const POPUP_STORAGE_KEY = 'sr_promo_popup_seen';

// En dev, ajouter ?popup=1 dans l'URL pour forcer l'affichage
const DEV_MODE = import.meta.env.DEV;

function PopupPromo() {
  const [isVisible, setIsVisible] = useState(false);
  const [popupConfig, setPopupConfig] = useState<PopupConfig | null>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Charger la config de la popup active
    async function loadPopupConfig() {
      try {
        const config = await getActivePopupConfig();

        // Si pas de popup active, ne rien afficher
        if (!config) {
          return;
        }

        setPopupConfig(config);

        // En dev, ?popup=1 force l'affichage
        const urlParams = new URLSearchParams(window.location.search);
        const forcePopup = DEV_MODE && urlParams.get('popup') === '1';

        if (!forcePopup) {
          // Si show_once est desactive, on affiche toujours la popup
          if (!config.show_once) {
            // On affiche a chaque visite, pas de verification du localStorage
          } else {
            // show_once est active : verifier si deja vu
            const storedData = localStorage.getItem(POPUP_STORAGE_KEY);

            if (storedData) {
              const { popupId } = JSON.parse(storedData);

              // Si c'est la meme popup et show_once actif, ne pas reafficher
              if (popupId === config.id) {
                return;
              }
            }
          }
        }

        // Affiche le popup apres un delai de 2 secondes (ou immediatement si force)
        setTimeout(() => {
          setIsVisible(true);
        }, forcePopup ? 500 : 2000);

      } catch (err) {
        console.error('Erreur chargement popup config:', err);
        // En cas d'erreur, on n'affiche pas la popup
      }
    }

    loadPopupConfig();
  }, []);

  function handleClose() {
    setIsVisible(false);
    // Stocke l'ID de la popup seulement si show_once est actif
    if (popupConfig && popupConfig.show_once) {
      localStorage.setItem(
        POPUP_STORAGE_KEY,
        JSON.stringify({
          popupId: popupConfig.id
        })
      );
    }
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

  if (!isVisible || !popupConfig) return null;

  // Valeurs par defaut si non definies
  const title = popupConfig.title || 'Offre speciale';
  const subtitle = popupConfig.subtitle;
  const text = popupConfig.text;
  const discount = popupConfig.discount || 15;

  return (
    <div className="popup-promo-overlay" onClick={handleClose}>
      <div className="popup-promo" onClick={(e) => e.stopPropagation()}>
        <button className="popup-promo-close" onClick={handleClose} aria-label="Fermer">
          <X size={24} />
        </button>

        {!success ? (
          <>
            <div className="popup-promo-badge">{title}</div>
            {subtitle && <h2 className="popup-promo-title">{subtitle}</h2>}
            <p className="popup-promo-text">
              {text || (
                <>
                  Pour votre premier podcast, beneficiez de <strong>-{discount}%</strong> sur nos formules.
                </>
              )}
              {!text && discount && (
                <></>
              )}
            </p>
            {text && discount && (
              <p className="popup-promo-discount">
                <strong>{discount}%</strong> de reduction
              </p>
            )}

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

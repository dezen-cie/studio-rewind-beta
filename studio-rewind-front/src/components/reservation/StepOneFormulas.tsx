// src/components/reservation/StepOneFormulas.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  getPublicFormulas,
  type PublicFormula
} from '../../api/formulas';

interface StepOneFormulasProps {
  onSelectFormula: (formula: string) => void;
}

function formatPriceHt(price: number): string {
  // 99 -> "99,00€ HT"
  return `${price.toFixed(2).replace('.', ',')}€ HT`;
}

// Helper pour construire l'URL complète des images uploadées
function getImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  // Si c'est une URL relative du backend (/uploads/...), on ajoute le base URL de l'API
  if (imageUrl.startsWith('/uploads/')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';
    // Enlever '/api' de la fin pour avoir le domaine du backend
    const backendBase = apiBase.replace(/\/api$/, '');
    return `${backendBase}${imageUrl}`;
  }
  // Sinon c'est une URL complète (Supabase, etc.)
  return imageUrl;
}

function StepOneFormulas({ onSelectFormula }: StepOneFormulasProps) {
  const [formulas, setFormulas] = useState<PublicFormula[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Chargement des formules depuis l'API publique
  useEffect(() => {
    async function load() {
      try {
        setError(null);
        setLoading(true);
        const data = await getPublicFormulas();
        setFormulas(data);
      } catch (err: any) {
        console.error('Erreur getPublicFormulas:', err);
        const msg =
          err?.response?.data?.message ||
          "Impossible de charger les formules. Réessaie plus tard.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Trier par display_order puis par prix (l'API retourne déjà les formules actives)
  const orderedFormulas = useMemo(() => {
    return [...formulas].sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.price_ttc - b.price_ttc
    );
  }, [formulas]);

  return (
    <main className="booked-main">
      <h2>Sélectionner votre formule</h2>

      {loading && (
        <p style={{ marginTop: '1rem' }}>
          Chargement des formules...
        </p>
      )}

      {error && !loading && (
        <p style={{ marginTop: '1rem', color: '#f97316' }}>
          {error}
        </p>
      )}

      <div className="booked-formules">
        {orderedFormulas.map((f) => {
          // Prix affiché en HT (durée fixe 1h)
          const priceLabel = formatPriceHt(f.price_ttc);
          // Description de la BDD ou fallback
          const description = f.description || 'Découvrez cette formule adaptée à vos besoins.';
          // URL de l'image avec le bon domaine
          const imageUrl = getImageUrl(f.image_url);

          return (
            <article
              key={f.id}
              className="booked-formule"
              onClick={() => onSelectFormula(f.key)}
              style={{ cursor: 'pointer' }}
            >
              {imageUrl ? (
                // Image depuis la BDD
                <img
                  src={imageUrl}
                  alt={f.name}
                  loading="lazy"
                  onError={(e) => {
                    // Fallback si l'image n'existe pas
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/formule-solo.jpg';
                  }}
                />
              ) : (
                // Fallback sur les images statiques
                <picture>
                  <source
                    srcSet={`/images/formule-${f.key}.webp`}
                    type="image/webp"
                  />
                  <img
                    src={`/images/formule-${f.key}.jpg`}
                    alt={f.name}
                    loading="lazy"
                    onError={(e) => {
                      // Fallback si l'image n'existe pas
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/formule-solo.jpg';
                    }}
                  />
                </picture>
              )}
              <div>
              <div className="reservation-formula-info">
                <p className="reservation-formula-title">
                  {f.name}
                </p>
                <p className="reservation-formula-price">
                  {priceLabel}
                </p>
                <p className="reservation-formula-description">
                  {description}
                </p>
                </div>
              </div>

              <button
                className="select"
                onClick={() => onSelectFormula(f.key)}
              >
                Sélectionner
              </button>
            </article>
          );
        })}
      </div>
    </main>
  );
}

export default StepOneFormulas;

// src/components/reservation/StepOneFormulas.tsx
import { useEffect, useMemo, useState } from 'react';
import type { FormulaKey } from '../../pages/ReservationPage';
import {
  getPublicFormulas,
  type PublicFormula
} from '../../api/formulas';

interface StepOneFormulasProps {
  onSelectFormula: (formula: FormulaKey) => void;
}

// On borne les clés qu'on considère dans le tunnel de résa
const ALLOWED_KEYS: FormulaKey[] = ['solo', 'duo', 'pro'];

function getFormulaDescription(key: FormulaKey): string {
  switch (key) {
    case 'solo':
      return "Formule idéale pour débuter, accès au studio avec accompagnement de base.";
    case 'duo':
      return "Accompagnement complet avec un podcasteur expérimenté pour optimiser ton contenu.";
    case 'pro':
      return "Formule premium avec accompagnement VIP et services de post-production inclus.";
    default:
      return '';
  }
}

function formatPriceHt(price: number): string {
  // 99 -> "99,00€ HT"
  return `${price.toFixed(2).replace('.', ',')}€ HT`;
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

  // On filtre les formules utilisables dans le tunnel
  // puis on les trie de la moins chère à la plus chère
  const orderedFormulas = useMemo(() => {
    return formulas
      .filter((f) => ALLOWED_KEYS.includes(f.key))
      .sort((a, b) => a.price_ttc - b.price_ttc);
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

          const buttonLabel = 'Sélectionner'

          return (
            <article
              key={f.id}
              className="booked-formule"
              onClick={() => onSelectFormula(f.key)}
              style={{ cursor: 'pointer' }}
            >
              <picture>
                <source
                  srcSet={`/images/formule-${f.key}.webp`}
                  type="image/webp"
                />
                <img src={`/images/formule-${f.key}.jpg`} alt={f.name} loading="lazy" />
              </picture>
              <div>
              <div className="reservation-formula-info">
                <p className="reservation-formula-title">
                  {f.name}
                </p>
                <p className="reservation-formula-price">
                  {priceLabel}
                </p>
                <p className="reservation-formula-description">
                  {getFormulaDescription(f.key)}
                </p>
                </div>
              </div>

              <button
                className="select"
                onClick={() => onSelectFormula(f.key)}
              >
                {buttonLabel}
              </button>
            </article>
          );
        })}
      </div>
    </main>
  );
}

export default StepOneFormulas;

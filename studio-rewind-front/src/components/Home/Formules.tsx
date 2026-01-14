// src/components/Home/Formules.tsx
import { useEffect, useRef, useState, type JSX } from 'react';
// import { Link } from 'react-router-dom'; // TEMPORAIREMENT MASQUÉ
import {
  FilePlay,
  User,
  Scissors,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import './Formules.css';
import Timeline from './Timeline';
import {
  getPublicFormulas,
  type PublicFormula
} from '../../api/formulas';
import type { FormulaKey } from '../../pages/ReservationPage';

// -----------------------------------------------
// CONFIG marketing (FRONT)
// -----------------------------------------------
const formulaConfig: Record<
  FormulaKey,
  {
    cssClass: string;
    description: JSX.Element;
    priceSuffix: string;
    reservationLink: string;
    options: JSX.Element[];
  }
> = {
  autonome: {
    cssClass: 'formule formule1',
    description: (
      <p className="formule-desc">
        {'Tourne en studio, récupére les rushes, gére toi même le montage'
          .split(',')
          .map((part, i) => (
            <span key={i}>
              {part.trim()}
              {i < 2 && <br />}
            </span>
          ))}
      </p>
    ),
    priceSuffix: 'TTC/heure',
    reservationLink: '/reservation?step=2&formula=autonome',
    options: [
      <p key="file"><FilePlay /> Rushes vidéos & audio</p>,
      <p key="user"><User /> Accompagnement minimal</p>
    ]
  },

  amelioree: {
    cssClass: 'formule formule2',
    description: (
      <p className="formule-desc">
        Enregistre avec un podcasteur qui t'accompagne
      </p>
    ),
    priceSuffix: 'TTC/heure',
    reservationLink: '/reservation?step=2&formula=amelioree',
    options: [
      <p key="file"><FilePlay /> Rushes vidéos & audio</p>,
      <p key="user"><User /> Un podcasteur à tes côtés</p>,
      <p key="scissors"><Scissors /> Montage vidéo pro sous 72h</p>
    ]
  },

  abonnement: {
    cssClass: 'formule formule3',
    description: (
      <p className="formule-desc">
        Achete un crédit de 5h utilisables quand tu voudras
      </p>
    ),
    priceSuffix: 'TTC',
    reservationLink: '/reservation?step=3&formula=abonnement',
    options: [
      <p key="file"><FilePlay /> Rushes vidéos & audio</p>,
      <p key="user"><User /> Un podcasteur à tes côtés</p>,
      <p key="scissors"><Scissors /> Montage vidéo pro sous 72h</p>
    ]
  },

  reseaux: {
    cssClass: 'formule formule4',
    description: (
      <p className="formule-desc">
        Enregistrement de 2h avec montage de 2 podcasts et 5 videos formats verticales
      </p>
    ),
    priceSuffix: 'TTC',
    reservationLink: '/reservation?step=2&formula=reseaux',
    options: [
      <p key="file"><FilePlay /> Rushes vidéos & audio</p>,
      <p key="user"><User /> Un podcasteur à tes côtés</p>,
      <p key="scissors"><Scissors /> Montage vidéo pro sous 72h</p>
    ]
  }
};

function Formules() {
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const [formulas, setFormulas] = useState<PublicFormula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleScroll = (direction: 'prev' | 'next') => {
    if (!sliderRef.current) return;
    const container = sliderRef.current;
    const scrollAmount = container.clientWidth * 0.9;
    container.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await getPublicFormulas();
      
        if (!mounted) return;

        const allowed = data.filter((f) =>
          ['autonome', 'amelioree', 'abonnement', 'reseaux'].includes(f.key)
        );

        allowed.sort((a, b) => a.price_ttc - b.price_ttc);

        setFormulas(allowed);
      } catch (err) {
        console.error('Erreur formules :', err);
        if (mounted) setError('Impossible de charger les formules.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="formules">
      <div className="formules-header">
        <h2 className="section-title subtitle">
          “Enregistre, monte et publie des podcasts de qualité professionnelle”
        </h2>
        {/* TEMPORAIREMENT MASQUÉ - CTA Réservation
        <Link className="btn btn-primary" to="/reservation">
          Réserver une session
        </Link>
        */}
        <p className="handwritten">
          Découvre nos offres flexibles adaptées à tous les créateurs.
        </p>
      </div>

      {loading && <p className="formules-status">Chargement…</p>}
      {error && <p className="formules-status formules-status--error">{error}</p>}

      {!loading && formulas.length > 0 && (
        <div className="formules-slider">
          <button
            className="formules-arrow formules-arrow-left"
            type="button"
            onClick={() => handleScroll('prev')}
          >
            <ChevronLeft size={24} />
          </button>

          <div className="formule-cards" ref={sliderRef}>
            {formulas.map((f) => {
              const cfg = formulaConfig[f.key as FormulaKey];
              if (!cfg) return null;

              return (
                <div key={f.id} className={cfg.cssClass}>
                  <h4>{f.name}</h4>

                  {cfg.description}

                  <p className="price">
                    {f.price_ttc}€ <span>{cfg.priceSuffix}</span>
                  </p>

                  {/* TEMPORAIREMENT MASQUÉ - CTA Réservation
                  <Link to={cfg.reservationLink}>
                    <button className="btn btn-primary">
                      Choisir cette formule
                    </button>
                  </Link>
                  */}

                  <div className="formule-options">{cfg.options}</div>
                </div>
              );
            })}
          </div>

          <button
            className="formules-arrow formules-arrow-right"
            type="button"
            onClick={() => handleScroll('next')}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      <Timeline />
    </section>
  );
}

export default Formules;

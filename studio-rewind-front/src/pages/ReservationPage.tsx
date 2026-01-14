import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import StepOneFormulas from '../components/reservation/StepOneFormulas';
import StepTwoDateTime from '../components/reservation/StepTwoDateTime';
import StepThreeSummary from '../components/reservation/StepThreeSummary';
import Footer from '../components/Footer/Footer';
import './Reservation.css'
import Menus from '../components/Header/Menus';


export type FormulaKey = 'autonome' | 'amelioree' | 'abonnement' | 'reseaux';

export interface PricingBreakdown {
  hours: number;
  price_ht: number;
  price_tva: number;
  price_ttc: number;
}

export interface SelectedPodcaster {
  id: string;
  name: string;
}

function ReservationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const stepParam = searchParams.get('step');
  const formulaParam = searchParams.get('formula') as FormulaKey | null;

  const initialStep = useMemo(() => {
    const s = Number(stepParam || '1');
    if (s === 2 || s === 3) return s;
    return 1;
  }, [stepParam]);

  const [step, setStep] = useState<number>(initialStep);
  const [formula, setFormula] = useState<FormulaKey | null>(formulaParam);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [selectedPodcaster, setSelectedPodcaster] = useState<SelectedPodcaster | null>(null);

  function updateUrl(nextStep: number, nextFormula: FormulaKey | null = formula) {
    const params = new URLSearchParams();
    params.set('step', String(nextStep));
    if (nextFormula) params.set('formula', nextFormula);
    navigate(`/reservation?${params.toString()}`, { replace: true });
  }

  function handleSelectFormula(f: FormulaKey) {
    setFormula(f);
    setSelectedDate(null);
    setStartTime('');
    setEndTime('');
    setPricing(null);
    setSelectedPodcaster(null);

    if (f === 'abonnement') {
      setStep(3);
      updateUrl(3, f);
    } else {
      setStep(2);
      updateUrl(2, f);
    }
  }

  function goToStep1() {
    setStep(1);
    setFormula(null);
    setSelectedDate(null);
    setStartTime('');
    setEndTime('');
    setPricing(null);
    setSelectedPodcaster(null);
    updateUrl(1, null);
  }

  function goToStep2() {
    if (!formula || formula === 'abonnement') {
      goToStep1();
      return;
    }
    setStep(2);
    updateUrl(2, formula);
  }

  function handleConfirmStep2(nextPricing: PricingBreakdown) {
    setPricing(nextPricing);
    setStep(3);
    updateUrl(3, formula);
  }

  return (
     <section className="booking">
      <header className="booked-header">
        <div className="booked-menu">
          <Link to="/">
            <picture>
              <source srcSet="/images/logo-header.webp" type="image/webp" />
              <img
                src="/images/logo-header.png"
                alt="Logo Studio Rewind"
                className="logo-header"
              />
            </picture>
          </Link>

          <Menus />
        </div>
      </header>
      <main className="reservation-main">
        {step === 1 && (
          <StepOneFormulas onSelectFormula={handleSelectFormula} />
        )}

        {step === 2 && formula && formula !== 'abonnement' && (
          <StepTwoDateTime
            formula={formula}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
            selectedPodcaster={selectedPodcaster}
            setSelectedPodcaster={setSelectedPodcaster}
            onBack={goToStep1}
            onConfirm={handleConfirmStep2}
          />
        )}

        {step === 3 && formula && (
          <StepThreeSummary
            formula={formula}
            selectedDate={selectedDate}
            startTime={startTime}
            endTime={endTime}
            pricing={pricing}
            selectedPodcaster={selectedPodcaster}
            onBack={formula === 'abonnement' ? goToStep1 : goToStep2}
          />
        )}
      </main>
      <Footer />
    </section>
  );
}

export default ReservationPage;

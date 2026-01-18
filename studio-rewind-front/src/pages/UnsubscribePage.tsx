// src/pages/UnsubscribePage.tsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import './UnsubscribePage.css';

function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'confirm'>('confirm');
  const [message, setMessage] = useState('');

  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  async function handleUnsubscribe() {
    if (!email || !token) {
      setStatus('error');
      setMessage('Lien de desabonnement invalide.');
      return;
    }

    setStatus('loading');

    try {
      const res = await api.post('/emailing/unsubscribe', { email, token });
      setStatus('success');
      setMessage(res.data.message || 'Vous avez ete desabonne avec succes.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.response?.data?.message || 'Erreur lors du desabonnement.');
    }
  }

  // Si pas d'email ou token, afficher erreur directement
  useEffect(() => {
    if (!email || !token) {
      setStatus('error');
      setMessage('Lien de desabonnement invalide ou expire.');
    }
  }, [email, token]);

  return (
    <div className="unsubscribe-page">
      <div className="unsubscribe-card">
        <div className="unsubscribe-logo">SR</div>
        <h1>Desabonnement</h1>

        {status === 'confirm' && (
          <>
            <p className="unsubscribe-text">
              Vous souhaitez vous desabonner des emails commerciaux de Studio Rewind ?
            </p>
            <p className="unsubscribe-email">{email}</p>
            <div className="unsubscribe-actions">
              <button onClick={handleUnsubscribe} className="unsubscribe-btn confirm">
                Confirmer le desabonnement
              </button>
              <Link to="/" className="unsubscribe-btn cancel">
                Annuler
              </Link>
            </div>
          </>
        )}

        {status === 'loading' && (
          <p className="unsubscribe-text">Traitement en cours...</p>
        )}

        {status === 'success' && (
          <>
            <div className="unsubscribe-icon success">✓</div>
            <p className="unsubscribe-text">{message}</p>
            <p className="unsubscribe-subtext">
              Vous ne recevrez plus d'emails commerciaux de notre part.
            </p>
            <Link to="/" className="unsubscribe-btn">
              Retour au site
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="unsubscribe-icon error">✗</div>
            <p className="unsubscribe-text error">{message}</p>
            <Link to="/" className="unsubscribe-btn">
              Retour au site
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default UnsubscribePage;

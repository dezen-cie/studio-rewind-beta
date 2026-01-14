import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { login } from '../api/auth';
import './LoginPage.css'
function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | undefined)?.from || '/member';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(email, password);
      localStorage.setItem('sr_user', JSON.stringify(data.user));

      // Redirection en fonction du rôle
      if (data.user.role === 'admin' || data.user.role === 'super_admin') {
        navigate('/admin', { replace: true });
      } else if (data.user.role === 'podcaster') {
        navigate('/podcaster', { replace: true });
      } else {
        // Soit vers la page demandée, soit vers /member
        navigate(from || '/member', { replace: true });
      }
    } catch (err: any) {
      console.error('Erreur login front:', err);
      const message =
        err?.response?.data?.message ||
        'Impossible de se connecter. Vérifiez vos identifiants.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <header className="login-page-header">
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

        <div className="menu">
          <Link
            className="header-logo_link"
            to="/"
          >
           Retour au site
          </Link>
        </div>
    </header>
    <div className="sr-login">
      <h2>Connexion</h2>

      <form className="sr-login-form" onSubmit={handleSubmit}>
        <div className="sr-form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="sr-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="sr-form-group">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            className="sr-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className="sr-error">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

    </div>

    </>
  );
}

export default LoginPage;

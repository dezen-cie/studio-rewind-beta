import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { changePodcasterPassword } from '../../api/podcasterDashboard';
import type { PodcasterLayoutOutletContext } from '../../layouts/PodcasterLayout';

function PodcasterPasswordPage() {
  const navigate = useNavigate();
  const { mustChangePassword, setMustChangePassword } = useOutletContext<PodcasterLayoutOutletContext>();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset les messages quand on change les inputs
  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [currentPassword, newPassword, confirmPassword]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (!mustChangePassword && !currentPassword) {
      setError('Le mot de passe actuel est obligatoire.');
      return;
    }

    setLoading(true);

    try {
      const payload: { current_password?: string; new_password: string } = {
        new_password: newPassword
      };

      if (!mustChangePassword) {
        payload.current_password = currentPassword;
      }

      const result = await changePodcasterPassword(payload);

      setSuccess(result.message);

      // Mettre à jour le flag dans le localStorage
      const rawUser = localStorage.getItem('sr_user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        user.must_change_password = false;
        localStorage.setItem('sr_user', JSON.stringify(user));
      }

      // Mettre à jour le context
      setMustChangePassword(false);

      // Reset le formulaire
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Rediriger vers le calendrier après 2 secondes
      setTimeout(() => {
        navigate('/podcaster');
      }, 2000);

    } catch (err: any) {
      console.error('Erreur changement mot de passe:', err);
      setError(err?.response?.data?.message || 'Erreur lors du changement de mot de passe.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sr-page">
      <div className="sr-page-header">
        <div>
          <h2 className="sr-page-title">Changer mon mot de passe</h2>
          <p className="sr-page-subtitle">
            {mustChangePassword
              ? 'Vous devez changer votre mot de passe par defaut pour securiser votre compte.'
              : 'Modifiez votre mot de passe pour securiser votre compte.'}
          </p>
        </div>
      </div>

      <div className="sr-page-body">
        <div className="sr-card" style={{ maxWidth: '500px' }}>
          {mustChangePassword && (
            <div className="notification is-warning mb-4">
              <strong>Premier connexion :</strong> Vous devez definir un nouveau mot de passe.
            </div>
          )}

          {error && (
            <div className="notification is-danger">
              {error}
            </div>
          )}

          {success && (
            <div className="notification is-success">
              {success}
              <p className="mt-2 is-size-7">Redirection vers le calendrier...</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!mustChangePassword && (
              <div className="field">
                <label className="label">Mot de passe actuel</label>
                <div className="control">
                  <input
                    type="password"
                    className="input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Votre mot de passe actuel"
                  />
                </div>
              </div>
            )}

            <div className="field">
              <label className="label">Nouveau mot de passe</label>
              <div className="control">
                <input
                  type="password"
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Minimum 6 caracteres"
                />
              </div>
              <p className="help">Le mot de passe doit contenir au moins 6 caracteres.</p>
            </div>

            <div className="field">
              <label className="label">Confirmer le nouveau mot de passe</label>
              <div className="control">
                <input
                  type="password"
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Repetez le nouveau mot de passe"
                />
              </div>
            </div>

            <div className="field mt-5">
              <div className="control">
                <button
                  type="submit"
                  className={`button is-primary is-fullwidth ${loading ? 'is-loading' : ''}`}
                  disabled={loading}
                >
                  Changer mon mot de passe
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PodcasterPasswordPage;

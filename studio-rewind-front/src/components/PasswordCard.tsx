import { changeMyPassword } from '../api/auth';
import { useState } from 'react';   
import './PasswordCard.css'
   

function PasswordCard(){
    // ====== MOT DE PASSE ======
      const [currentPassword, setCurrentPassword] = useState('');
      const [newPassword, setNewPassword] = useState('');
      const [confirmPassword, setConfirmPassword] = useState('');
      const [passwordLoading, setPasswordLoading] = useState(false);
      const [passwordError, setPasswordError] = useState<string | null>(null);
      const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

     async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Merci de remplir tous les champs.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await changeMyPassword(
        currentPassword,
        newPassword,
        confirmPassword
      );
      setPasswordSuccess(res.message || 'Mot de passe mis à jour.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Erreur changement de mot de passe:', err);
      const message =
        err?.response?.data?.message ||
        'Impossible de changer le mot de passe pour le moment.';
      setPasswordError(message);
    } finally {
      setPasswordLoading(false);
    }
  }

    return(
        <section className="member-password-card">
            <h3 className="member-password-title">Modifier mon mot de passe</h3>
            <p className="member-password-subtitle">
              Change ton mot de passe en toute sécurité. Tu devras utiliser le nouveau à ta prochaine connexion.
            </p>

            <form
              className="member-password-form"
              onSubmit={handleChangePassword}
            >
              <div className="member-password-field">
                <label htmlFor="currentPassword">Mot de passe actuel</label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <div className="member-password-field">
                <label htmlFor="newPassword">Nouveau mot de passe</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="member-password-field">
                <label htmlFor="confirmPassword">
                  Confirmation du nouveau mot de passe
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {passwordError && (
                <p className="member-password-message member-password-message--error">
                  {passwordError}
                </p>
              )}

              {passwordSuccess && (
                <p className="member-password-message member-password-message--success">
                  {passwordSuccess}
                </p>
              )}

              <button
                type="submit"
                className="member-password-submit"
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Mise à jour...' : 'Mettre à jour mon mot de passe'}
              </button>
            </form>
        </section>
    )
}       

export default PasswordCard
        
        
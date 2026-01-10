import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';
import 'bulma/css/bulma.min.css';
import './admin.css';

export type PodcasterLayoutOutletContext = {
  mustChangePassword: boolean;
  setMustChangePassword: (value: boolean) => void;
};

function PodcasterLayout() {
  const navigate = useNavigate();
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const rawUser =
    typeof window !== 'undefined' ? window.localStorage.getItem('sr_user') : null;
  const user = rawUser ? JSON.parse(rawUser) : null;

  useEffect(() => {
    // Vérifier si l'utilisateur doit changer son mot de passe
    if (user?.must_change_password) {
      setMustChangePassword(true);
    }
  }, [user]);

  function getDisplayName() {
    if (!user) return 'Podcasteur';
    return user.firstname || user.email;
  }

  const userInitials = getDisplayName()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="sr-admin-root">
      <div className="sr-admin-shell">
        {/* SIDEBAR */}
        <aside className="sr-admin-sidebar">
          <div className="sr-admin-sidebar-header">
            <div className="sr-admin-logo">SR</div>
            <div className="sr-admin-product">
              <div className="sr-admin-product-name">Studio Rewind</div>
              <div className="sr-admin-product-tag">Espace Podcasteur</div>
            </div>
          </div>

          <nav className="sr-admin-nav">
            <p className="sr-admin-nav-section">Mon espace</p>
            <ul>
              <li>
                <NavLink
                  to="/podcaster"
                  end
                  className={({ isActive }) =>
                    `sr-admin-navlink ${isActive ? 'is-active' : ''}`
                  }
                >
                  <span className="sr-admin-navlink-icon">📅</span>
                  <span>Mon Calendrier</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/podcaster/disponibilites"
                  className={({ isActive }) =>
                    `sr-admin-navlink ${isActive ? 'is-active' : ''}`
                  }
                >
                  <span className="sr-admin-navlink-icon">🚫</span>
                  <span>Mes Disponibilites</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/podcaster/password"
                  className={({ isActive }) =>
                    `sr-admin-navlink ${isActive ? 'is-active' : ''}`
                  }
                >
                  <span className="sr-admin-navlink-icon">🔒</span>
                  <span>Mot de passe</span>
                  {mustChangePassword && (
                    <span className="sr-admin-navlink-badge">!</span>
                  )}
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="sr-admin-sidebar-footer">
            <div className="sr-admin-sidebar-user">
              <div className="sr-admin-sidebar-avatar">{userInitials || 'P'}</div>
              <div className="sr-admin-sidebar-user-meta">
                <div className="sr-admin-sidebar-user-name">{getDisplayName()}</div>
                <div className="sr-admin-sidebar-user-role">Podcasteur</div>
              </div>
            </div>

            <button
              type="button"
              className="sr-admin-sidebar-logout"
              onClick={async () => {
                await logout();
                window.location.href = '/';
              }}
            >
              Deconnexion
            </button>
          </div>
        </aside>

        {/* MAIN AREA */}
        <div className="sr-admin-main">
          <header className="sr-admin-header">
            <div className="sr-admin-header-left">
              <h1 className="sr-admin-header-title">Espace Podcasteur</h1>
              <p className="sr-admin-header-subtitle">
                Consultez vos reservations et gerez votre compte.
              </p>
            </div>
          </header>

          <main className="sr-admin-main-content">
            {mustChangePassword && (
              <div className="notification is-warning mb-4">
                <strong>Attention :</strong> Vous devez changer votre mot de passe avant de continuer.
                <button
                  className="button is-small is-warning ml-3"
                  onClick={() => navigate('/podcaster/password')}
                >
                  Changer maintenant
                </button>
              </div>
            )}
            <Outlet context={{ mustChangePassword, setMustChangePassword }} />
          </main>
        </div>
      </div>
    </div>
  );
}

export default PodcasterLayout;

import { useMemo, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { logout } from '../utils/auth';
import 'bulma/css/bulma.min.css';
import './admin.css';


export type AdminLayoutOutletContext = {
  searchQuery: string;
};

function AdminLayout() {

  const [searchQuery, setSearchQuery] = useState('');

  const rawUser =
    typeof window !== 'undefined' ? window.localStorage.getItem('sr_user') : null;
  const user = rawUser ? JSON.parse(rawUser) : null;

  function getDisplayName() {
    if (!user) return 'Utilisateur';
    if (user.account_type === 'professionnel' && user.company_name) {
      return user.company_name;
    }
    return `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.email;
  }

  function getRoleLabel() {
    if (!user) return '';
    switch (user.role) {
      case 'admin':
        return 'Admin';
      case 'super_admin':
        return 'Super admin';
      default:
        return user.role;
    }
  }

  const userInitials = useMemo(() => {
    const name = getDisplayName();
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase())
      .join('');
  }, [rawUser]);


  return (
    <div className="sr-admin-root">
      <div className="sr-admin-shell">
        {/* SIDEBAR */}
        <aside className="sr-admin-sidebar">
          <div className="sr-admin-sidebar-header">
            <div className="sr-admin-logo">SR</div>
            <div className="sr-admin-product">
              <div className="sr-admin-product-name">Studio Rewind</div>
              <div className="sr-admin-product-tag">Administration</div>
            </div>
          </div>

          <nav className="sr-admin-nav">
            <p className="sr-admin-nav-section">Vue d’ensemble</p>
            <ul>
              <li>
                <NavLink
                  to="/admin"
                  end
                  className={({ isActive }) =>
                    `sr-admin-navlink ${isActive ? 'is-active' : ''}`
                  }
                >
                  <span className="sr-admin-navlink-icon">📊</span>
                  <span>Dashboard</span>
                </NavLink>
              </li>
            </ul>

            <p className="sr-admin-nav-section">Gestion</p>
            <ul>
              <li>
                <NavLink
                  to="/admin/reservations"
                  className={({ isActive }) =>
                    `sr-admin-navlink ${isActive ? 'is-active' : ''}`
                  }
                >
                  <span className="sr-admin-navlink-icon">📅</span>
                  <span>Réservations</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/archives"
                  className={({ isActive }) =>
                    `sr-admin-navlink ${isActive ? 'is-active' : ''}`
                  }
                >
                  <span className="sr-admin-navlink-icon">📁</span>
                  <span>Archives</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `sr-admin-navlink ${isActive ? 'is-active' : ''}`
                  }
                >
                  <span className="sr-admin-navlink-icon">👥</span>
                  <span>Utilisateurs</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/messages"
                  className={({ isActive }) =>
                    `sr-admin-navlink ${isActive ? 'is-active' : ''}`
                  }
                >
                  <span className="sr-admin-navlink-icon">✉️</span>
                  <span>Messages</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/formulas"
                  className={({ isActive }) =>
                    `sr-admin-navlink ${isActive ? 'is-active' : ''}`
                  }
                >
                  <span className="sr-admin-navlink-icon">💰</span>
                  <span>Formules</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/blocked-slots"
                  className={({ isActive }) =>
                    `sr-admin-navlink ${isActive ? 'is-active' : ''}`
                  }
                >
                  <span className="sr-admin-navlink-icon">🚫</span>
                  <span>Créneaux bloqués</span>
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="sr-admin-sidebar-footer">
            {/*<button
              type="button"
              className="sr-admin-theme-toggle"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? '☀️ Mode clair' : '🌙 Mode sombre'}
            </button> */}

            <div className="sr-admin-sidebar-user">
              <div className="sr-admin-sidebar-avatar">{userInitials || 'SR'}</div>
              <div className="sr-admin-sidebar-user-meta">
                <div className="sr-admin-sidebar-user-name">{getDisplayName()}</div>
                <div className="sr-admin-sidebar-user-role">{getRoleLabel()}</div>
              </div>
            </div>

            <button
              type="button"
              className="sr-admin-sidebar-logout"
              onClick={async () => {
                await logout();
                window.location.href = '/login';
              }}
            >
              Déconnexion
            </button>
          </div>
        </aside>

        {/* MAIN AREA */}
        <div className="sr-admin-main">
          <header className="sr-admin-header">
            <div className="sr-admin-header-left">
              <h1 className="sr-admin-header-title">Espace d’administration</h1>
              <p className="sr-admin-header-subtitle">
                Pilote les réservations, les utilisateurs et les messages du studio.
              </p>
            </div>
            <div className="sr-admin-header-right">
              <input
                className="sr-admin-header-search"
                type="search"
                placeholder="Rechercher (nom, email, sujet, formule…)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </header>

          <main className="sr-admin-main-content">
            <Outlet context={{ searchQuery }} />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;

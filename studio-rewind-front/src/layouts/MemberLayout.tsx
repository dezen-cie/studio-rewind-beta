import { Outlet, Link, useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';
import './MemberLayout.css';

function MemberLayout() {
  const navigate = useNavigate();

  const rawUser =
    typeof window !== 'undefined' ? localStorage.getItem('sr_user') : null;
  const user = rawUser ? JSON.parse(rawUser) : null;

  function getDisplayName() {
    if (!user) return 'Membre';
    if (user.account_type === 'professionnel' && user.company_name) {
      return user.company_name;
    }
    const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim();
    return fullName || user.email;
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="member-layout">
      <header className="member-header">
        <div className="member-header-left">
          <Link to="/" className="member-header-logo">
            Studio Rewind
          </Link>
        </div>

        <div className="member-header-center">
          <span className="member-header-name">{getDisplayName()}</span>
          <span className="member-header-role">Espace membre</span>
        </div>

        <div className="member-header-right">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="member-header-site-link"
          >
            Voir le site
          </a>
          <button
            type="button"
            className="member-header-logout"
            onClick={handleLogout}
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="member-layout-main">
        <Outlet />
      </main>
    </div>
  );
}

export default MemberLayout;

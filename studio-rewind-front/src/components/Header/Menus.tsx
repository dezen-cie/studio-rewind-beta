// Menus.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MoveRight, Menu, X, LogOut, UserRound } from 'lucide-react'
import './Menus.css'

import { isAuthenticated, logout } from '../../utils/auth';

function Menus() {
  const [isOpen, setIsOpen] = useState(false)
  const authed = isAuthenticated();
  const navigate = useNavigate();
  
    function handleLogout() {
      logout();
      navigate('/', { replace: true });
    }
  

  return (
    <>
      <div className={`menu ${isOpen ? 'menu--open' : ''}`}>
        <Link
          className="header-logo_link"
          to="/"
          state={{ scrollTo: 'studio' }}
          onClick={() => setIsOpen(false)}
        >
          Studio
        </Link>
        {/* TEMPORAIREMENT MASQUÉ - Lien Formules
        <Link
          className="header-logo_link"
          to="/"
          state={{ scrollTo: "formules" }}
          onClick={() => setIsOpen(false)}
        >
          Formules
        </Link>
        */}
        <Link className="header-logo_link" to="/equipe" onClick={() => setIsOpen(false)}>
          Equipe
        </Link>
        <Link className="header-logo_link" to="/devenez-podcasteur" onClick={() => setIsOpen(false)}>
          Devenir podcasteur
        </Link>
        {/* TEMPORAIREMENT MASQUÉ - CTA Réservation
        <Link className="header-logo_link btn_link" to="/reservation" onClick={() => setIsOpen(false)}>
          Réserver
          <MoveRight />
        </Link>
        */}
        {authed && (
            <>
              <button
                type="button"
                className="header-logo_link"
                onClick={handleLogout}
              >
                <LogOut />
              </button>
            </>
          )}

          {!authed && (
            <button
              type="button"
              className="header-logo_link"
              onClick={() => navigate('/login')}
            >
              <UserRound  className="header-logo_link"/>
            </button>
          )}
      </div>

    
      <button
        type="button"
        className="menu-toggle"
        onClick={() => setIsOpen(open => !open)}
        aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      >
        {isOpen ? <X /> : <Menu />}
      </button>
    </>
  )
}

export default Menus

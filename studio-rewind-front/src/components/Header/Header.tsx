import type  { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react';
import Menus from './Menus'
import './Header.css'
import BackgroundVideo from './BackgroundVideo'

type HeaderProps = {
  children?: ReactNode
}

function Header({ children }: HeaderProps) {
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  const handleScroll = () => {
      let target: Element | null = null;

      if (isHomePage) {
        target = document.querySelector(".formules");
      } else {
        // Pages légales
        target = document.querySelector(".legal-header");
        // Sinon, première section du main
        if (!target) {
          target = document.querySelector(".sr-public-main > *:first-child");
        }
      }

      if (!target) return;

      target.scrollIntoView({
        behavior: "smooth",
      });
    }

  return (
    <header className="header">
      <BackgroundVideo />

      <div className="header-content">
        <nav className="nav">
          <Link className="header-logo_link" to="/">
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
        </nav>

        <div className="header-hero">
          {children}
          <ChevronDown 
            onClick={handleScroll}
          />
        </div>
      </div>
      <Link className="swissjob-logo" to="https://www.swissjobs.fr/" target="_blank">
        En partenariat avec
      </Link>
    </header>
  )
}

export default Header

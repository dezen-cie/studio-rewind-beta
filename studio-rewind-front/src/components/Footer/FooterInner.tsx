import { Link, useLocation } from 'react-router-dom'
import { Instagram, Facebook, ArrowUp } from 'lucide-react'
import './FooterInner.css'


function FooterInner(){
  const location = useLocation();
  const isPodcasterPage = location.pathname === '/devenez-podcasteur';

  const handleScroll = () => {
    const header = document.querySelector('header');
    if (!header) return;

    header.scrollIntoView({
      behavior: 'smooth',
    });
  };

    return(
      <div className="footer-content">
        <div className="footer-inner">
          <div className={`footer-top ${isPodcasterPage ? 'footer-top--centered' : ''}`}>
            <img
              src="/images/logo-footer.svg"
              alt="Logo Studio Rewind"
              className="logo-footer"
              loading="lazy"
            />
            {!isPodcasterPage && (
              <Link className="footer-nav_link" to="/reservation">
                <button className="btn btn-primary">Réserver un créneau</button>
              </Link>
            )}
          </div>

          <div className="footer-separator" />

          <div className="footer-bottom">
            <p>© 2025 Studio Rewind. Tous droits réservés</p>

            <nav className="footer-nav">
              <Link className="footer-nav_link" to="/equipe">
                Notre équipe
              </Link>
              <Link className="footer-nav_link" to="/cgv">
                CGV
              </Link>
              <Link className="footer-nav_link" to="/mentions-legales">
                Mentions légales
              </Link>
              <Link className="footer-nav_link" to="/politique-de-confidentialite">
                Politique de confidentialité
              </Link>
              
            </nav>

            <div className="footer-social">
              <a href="https://www.instagram.com/studio_rewind_official/" className="icon-insta" target="_blank" rel="noreferrer">
                <Instagram />
              </a>
              <a href="https://www.facebook.com/" className="icon-fb" target="_blank" rel="noreferrer">
                <Facebook />
              </a>
              <button
                type="button"
                className="back-to-top"
                onClick={handleScroll}
                aria-label="Revenir en haut de la page"
              >
                <ArrowUp />
              </button>
            </div>
          </div>
        </div>
      </div>
    )

}

export default FooterInner
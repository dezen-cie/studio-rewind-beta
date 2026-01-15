import { Link, useLocation } from 'react-router-dom'
import { Instagram, ArrowUp } from 'lucide-react'
import './FooterInner.css'

function TikTokIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  )
}


function FooterInner(){
  const location = useLocation();
  const isPodcasterPage = location.pathname === '/devenir-podcasteur';

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
              <a href="https://www.instagram.com/stories/studio__rewind/" className="icon-insta" target="_blank" rel="noreferrer">
                <Instagram />
              </a>
              <a href="https://www.tiktok.com/@studio_rewind" className="icon-tiktok" target="_blank" rel="noreferrer">
                <TikTokIcon />
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
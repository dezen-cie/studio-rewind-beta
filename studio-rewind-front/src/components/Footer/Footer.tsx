import { useLocation } from 'react-router-dom';
import './Footer.css';
import FAQ from './Faq'
import FooterInner from './FooterInner'

function Footer(){
  const location = useLocation();
  const hideFaq = location.pathname === '/devenir-podcasteur';

  return (
    <>
      <footer className="footer">
        {!hideFaq && <FAQ />}
        <FooterInner />
      </footer>
    </>
  );
}

export default Footer;

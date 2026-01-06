import './Footer.css';
import FAQ from './Faq'
import FooterInner from './FooterInner'

function Footer(){
  
  return (
    <>
      <footer className="footer">
        <FAQ />
        <FooterInner />
      </footer>
    </>
  );
}

export default Footer;

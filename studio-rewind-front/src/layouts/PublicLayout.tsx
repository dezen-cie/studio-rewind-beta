// src/layouts/PublicLayout.tsx
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { MoveRight } from 'lucide-react'
import Header from '../components/Header/Header'
import Footer from '../components/Footer/Footer'

function PublicLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  function goToReservation() {
    navigate('/reservation?step=1');
  }
  
  let headerContent: ReactNode;

  switch (location.pathname) {
    case '/':
      headerContent = (
        <>
          <h1>
            Ton studio clé en main pour 
            <span>tes Podcast & Interviews</span>
          </h1>

          <div className="header-call_to_action">
            <p>Créez. Enregistrez. Rayonnez.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={goToReservation}
            >
              Réserver un créneau
              <MoveRight />
            </button>
          </div>
        </>
      );
      break;

    case '/equipe':
      headerContent = (
        <>
           <h1>Rencontre notre équipe</h1>
          <div className="header-call_to_action">
            <p className="p-header">
            </p>
            <Link className="" to="/reservation">
              <button 
                type="button" 
                className="btn btn-primary">
                Réserver un créneau  
                <MoveRight />
              </button>
            </Link>
          </div>
        </>
      );
      break;

     default:
      headerContent = (
        <>
          <h1>Studio Rewind</h1>
          <p>Un studio dédié aux créateurs exigeants.</p>
        </>
      )
      break
  }

  return (
    <>
     
      <Header>
        {headerContent}
      </Header>

      <main className="sr-public-main">
        <Outlet />
      </main>

      <Footer />
    </>
  );
}

export default PublicLayout;



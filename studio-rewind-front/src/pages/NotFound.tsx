import { Link } from 'react-router-dom'
import { ArrowLeft, Mic, Video, Headphones, Film, Camera, Music } from 'lucide-react'
import './NotFound.css'

function NotFound() {
  return (
    <div className="notfound-page">
      {/* Icônes flottantes audio/vidéo */}
      <div className="floating-elements">
        <span className="float-icon"><Mic color="white" size={32} /></span>
        <span className="float-icon"><Video color="white" size={32} /></span>
        <span className="float-icon"><Headphones color="white" size={32} /></span>
        <span className="float-icon"><Film color="white" size={32} /></span>
        <span className="float-icon"><Camera color="white" size={32} /></span>
        <span className="float-icon"><Music color="white" size={32} /></span>
      </div>

      <div className="notfound-content">
        <picture>
          <source srcSet="/images/logo.webp" type="image/webp" />
          <img src="/images/logo.png" alt="Studio Rewind" className="notfound-logo" />
        </picture>

        {/* Clap de cinéma animé */}
        <div className="notfound-clap">
          <div className="clap-top"></div>
          <div className="clap-bottom">
            <p className="clap-text">404</p>
            <span className="clap-scene">URL NOT FOUND</span>
            <div className="clap-lines">
              <div className="clap-line"></div>
              <div className="clap-line"></div>
              <div className="clap-line"></div>
            </div>
          </div>
        </div>

        {/* Indicateur REC */}
        <div className="notfound-rec">
          <span className="rec-dot"></span>
          ERROR 404
        </div>

        {/* Timeline vidéo */}
        <div className="notfound-timeline">
          <div className="timeline-bar">
            <div className="timeline-progress"></div>
          </div>
          <div className="timeline-time">
            <span>00:04:04</span>
            <span>??:??:??</span>
          </div>
        </div>

        <p className="notfound-code">404</p>
        <h1 className="notfound-title">Coupez ! Scène introuvable...</h1>
        <p className="notfound-text">
          Cette page n'a jamais été tournée, ou alors elle est restée sur la table de montage.
          <br />
          Retour au studio pour une nouvelle prise !
        </p>

        <Link to="/" className="notfound-link">
          <ArrowLeft />
          Retour à l'accueil
        </Link>

        <div className="notfound-messages">
          <p>[ FICHIER MEDIA INTROUVABLE ]</p>
        </div>
      </div>
    </div>
  )
}

export default NotFound

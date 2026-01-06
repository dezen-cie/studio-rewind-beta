import { useState, useEffect } from 'react'
import './BackgroundVideo.css'

type ConnectionType = 'slow' | 'fast';

function getConnectionType(): ConnectionType {
  // Vérifie l'API Network Information (Chrome, Edge, Opera)
  const connection = (navigator as any).connection ||
                     (navigator as any).mozConnection ||
                     (navigator as any).webkitConnection;

  if (connection) {
    // Si l'utilisateur a activé l'économie de données
    if (connection.saveData) {
      return 'slow';
    }

    // Vérifie le type de connexion effectif
    const slowTypes = ['slow-2g', '2g', '3g'];
    if (slowTypes.includes(connection.effectiveType)) {
      return 'slow';
    }

    // Vérifie la bande passante (en Mbps)
    if (connection.downlink && connection.downlink < 1.5) {
      return 'slow';
    }
  }

  return 'fast';
}

function BackgroundVideo() {
  const [videoSrc, setVideoSrc] = useState<string>('/videos/header-small.mp4');

  useEffect(() => {
    const connectionType = getConnectionType();
    const isSmallScreen = window.innerWidth < 600;

    // Connexion lente OU petit écran = vidéo légère
    if (connectionType === 'slow' || isSmallScreen) {
      setVideoSrc('/videos/header-small.mp4');
    } else {
      setVideoSrc('/videos/header-full.mp4');
    }

    // Écoute les changements de connexion
    const connection = (navigator as any).connection;
    if (connection) {
      const handleChange = () => {
        const newType = getConnectionType();
        const small = window.innerWidth < 600;
        setVideoSrc(newType === 'slow' || small
          ? '/videos/header-small.mp4'
          : '/videos/header-full.mp4'
        );
      };
      connection.addEventListener('change', handleChange);
      return () => connection.removeEventListener('change', handleChange);
    }
  }, []);

  return (
    <div className="video-background">
      <video autoPlay muted loop playsInline key={videoSrc}>
        <source src={videoSrc} type="video/mp4" />
      </video>
    </div>
  );
}

export default BackgroundVideo
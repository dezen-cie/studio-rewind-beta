import { useState, useRef, useEffect, useCallback } from 'react'
import './Podcasteurs.css'
import { getPublicPodcasters, type Podcaster } from '../../api/podcasters'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

function getMediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('/uploads')) {
    return BACKEND_URL + url
  }
  return url
}

function Podcasteurs() {
  const [podcasters, setPodcasters] = useState<Podcaster[]>([])
  const [loading, setLoading] = useState(true)
  const [currentAudio, setCurrentAudio] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => {
    async function loadPodcasters() {
      try {
        const data = await getPublicPodcasters()
        // Filtrer les podcasters qui ont video et audio
        const validPodcasters = data.filter(p => p.video_url && p.audio_url)
        setPodcasters(validPodcasters)
      } catch (error) {
        console.error('Erreur chargement podcasteurs:', error)
      } finally {
        setLoading(false)
      }
    }
    loadPodcasters()
  }, [])

  // Gerer la lecture des videos - une seule a la fois
  const handleVideoHover = useCallback((index: number) => {
    videoRefs.current.forEach((video, i) => {
      if (video) {
        if (i === index) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      }
    })
  }, [])

  const handleSelectPodcasteur = (audioFile: string) => {
    const audio = audioRef.current
    if (!audio) return

    if (currentAudio === audioFile) {
      if (audio.paused) {
        audio.play()
      } else {
        audio.pause()
      }
      return
    }

    setCurrentAudio(audioFile)

    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play()
      }
    }, 50)
  }

  // Ne pas afficher la section s'il n'y a pas de podcasteurs
  if (!loading && podcasters.length === 0) {
    return null
  }

  // Determiner la classe de layout selon le nombre de podcasteurs
  const getLayoutClass = () => {
    const count = podcasters.length
    if (count >= 9) return 'layout-9plus'
    if (count === 8) return 'layout-8'
    if (count === 7) return 'layout-7'
    if (count === 6) return 'layout-6'
    return 'layout-default'
  }

  return (
    <section
      className={`podcasteurs ${getLayoutClass()}`}
      style={{ '--podcaster-count': podcasters.length } as React.CSSProperties}
    >
      <audio ref={audioRef} src={currentAudio || undefined} />

      <div className="casting-text">
        <h3 className="subtitle">Nos podcasteurs t'accompagnent</h3>
        <p>Clique & Ecoute tes podcasteurs</p>
      </div>

      {podcasters.map((podcaster, index) => (
        <div
          key={podcaster.id}
          className="casting-video"
          onClick={() => handleSelectPodcasteur(getMediaUrl(podcaster.audio_url))}
          onMouseEnter={() => handleVideoHover(index)}
        >
          <span className="casting_label">{podcaster.name}</span>
          <video
            ref={(el) => { videoRefs.current[index] = el }}
            autoPlay={index === 0}
            muted
            loop
            playsInline
          >
            <source src={getMediaUrl(podcaster.video_url)} type="video/mp4" />
          </video>
        </div>
      ))}
    </section>
  )
}

export default Podcasteurs

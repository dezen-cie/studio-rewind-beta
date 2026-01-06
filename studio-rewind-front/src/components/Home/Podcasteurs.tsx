import { useState, useRef } from 'react'
import './Podcasteurs.css'

function Podcasteurs() {
  const [currentAudio, setCurrentAudio] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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

  return (
    <section className="podcasteurs">
      <audio ref={audioRef} src={currentAudio || undefined} />

      <div className="casting-text">
        <h3 className="subtitle">Nos podcasteurs t'accompagnent</h3>
        <p>Clique & Ecoute tes podcasteurs</p>
      </div>

      <div className="casting-video" onClick={() => handleSelectPodcasteur('/audios/pod1.mp3')}>
        <span className="casting_label">Podcasteur 1</span>
        <video autoPlay muted loop playsInline>
          <source src="/videos/video-podcasteur1.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="casting-video" onClick={() => handleSelectPodcasteur('/audios/pod2.mp3')}>
        <span className="casting_label">Podcasteur 2</span>
        <video autoPlay muted loop playsInline>
          <source src="/videos/video-podcasteur2.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="casting-video" onClick={() => handleSelectPodcasteur('/audios/pod3.mp3')}>
        <span className="casting_label">Podcasteur 3</span>
        <video autoPlay muted loop playsInline>
          <source src="/videos/video-podcasteur3.mp4" type="video/mp4" />
        </video>
      </div>
    </section>
  )
}

export default Podcasteurs

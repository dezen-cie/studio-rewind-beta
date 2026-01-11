import { useState, useEffect } from 'react'
import SimpleMap from '../components/Home/SimpleMap'
import { getTeamPodcasters, type Podcaster } from '../api/podcasters'
import './Team.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

interface TeamMember {
  id: string | number
  name: string
  role: string
  image: string
  description?: string
  isFromApi?: boolean
}

// Membres statiques (non gérés via la BDD)
const staticTeamMembers: TeamMember[] = [
  { id: 'static-3', name: 'Clément', role: 'Vidéaste', image: '/images/John.jpg' },
]

const teamDescriptions: Record<string, string> = {
  'static-3': `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Description de Clément à personnaliser.`,
}

function Team() {
  const [selectedMember, setSelectedMember] = useState<string | number | null>(null)
  const [podcasters, setPodcasters] = useState<Podcaster[]>([])

  useEffect(() => {
    async function loadPodcasters() {
      try {
        const data = await getTeamPodcasters()
        setPodcasters(data)
      } catch (err) {
        console.error('Erreur chargement podcasters:', err)
      }
    }
    loadPodcasters()
  }, [])

  // Combiner les podcasters de l'API avec les membres statiques
  const allMembers: TeamMember[] = [
    // D'abord les membres de l'API (Karim, Gregory, etc.)
    ...podcasters.map(p => ({
      id: p.id,
      name: p.name,
      role: p.team_role || 'Podcasteur',
      image: p.photo_url
        ? (p.photo_url.startsWith('/images') ? p.photo_url : BACKEND_URL + p.photo_url)
        : '/images/default-avatar.jpg',
      description: p.description,
      isFromApi: true
    })),
    // Puis les membres statiques
    ...staticTeamMembers
  ]

  const handleMemberClick = (id: string | number) => {
    setSelectedMember(id)
  }

  const handleBackToAll = () => {
    setSelectedMember(null)
  }

  const selected = allMembers.find(m => m.id === selectedMember)
  const others = allMembers.filter(m => m.id !== selectedMember)

  return (
    <div className="team">
      <p className="text-team">
        Chez Studio Rewind, nous croyons que la qualité d'un contenu vidéo repose avant tout sur les personnes qui le créent. C'est pourquoi nous avons réuni une équipe de passionnés, chacun expert dans son domaine, pour t'offrir une expérience de tournage unique et professionnelle.

        Selon la formule choisie, tu peux être accompagné par un podcasteur habitué à l'exercice caméra. Son rôle ne se limite pas à te filmer : il sait créer une atmosphère détendue, poser les bonnes questions au bon moment, relancer la conversation quand il le faut et te guider pour que tu puisses exprimer exactement ce que tu souhaites transmettre. Que tu sois à l'aise devant la caméra ou que ce soit ta première fois, notre équipe s'adapte à toi pour tirer le meilleur de chaque prise.

        De même, selon ta formule, notre vidéaste peut prendre le relais une fois le tournage terminé. Il transforme les rushes en un contenu soigné, dynamique et prêt à être diffusé. Chaque montage est pensé pour correspondre à tes objectifs : que ce soit pour tes réseaux sociaux, ton site web ou ta communication interne, nous veillons à ce que le résultat final soit à la hauteur de tes attentes.

        Mais au-delà des compétences techniques, ce qui fait vraiment la différence chez Studio Rewind, c'est l'humain. Chaque membre de notre équipe partage la même vision : t'aider à donner le meilleur de toi-même et à raconter ton histoire de manière authentique. Nous sommes convaincus que derrière chaque entrepreneur, chaque dirigeant, chaque créateur, il y a un message qui mérite d'être entendu.

        Cette page te permet de découvrir les visages de ceux qui seront à tes côtés lors de ton passage au studio.

        <span className="text-team-cta">Clique sur nous pour apprendre à nous connaître.</span>
      </p>

      <section className="commercial-team">
        {selectedMember === null ? (
          <div className="team-grid">
            {allMembers.map(member => (
              <div
                key={member.id}
                className="commercial-member"
                onClick={() => handleMemberClick(member.id)}
              >
                <div className="commercial-member_role">
                  <h3>{member.role}</h3>
                  <p>{member.name}</p>
                </div>
                <img src={member.image} alt={member.role} loading="lazy" />
              </div>
            ))}
          </div>
        ) : (
          <div className="team-detail-view">
            <div className="team-detail-content">
              <div className="team-detail-selected">
                <img src={selected?.image} alt={selected?.role} loading="lazy" />
                <h3>{selected?.name}</h3>
                <p>{selected?.role}</p>
              </div>
              <div className="team-detail-text">
                <p>{selected?.isFromApi ? selected?.description : teamDescriptions[selectedMember as string]}</p>
                <button className="back-to-team" onClick={handleBackToAll}>
                  Voir toute l'équipe
                </button>
              </div>
              <div className="team-detail-others">
                {others.map(member => (
                  <div
                    key={member.id}
                    className="commercial-member-small"
                    onClick={() => handleMemberClick(member.id)}
                  >
                    <img src={member.image} alt={member.role} loading="lazy" />
                    <span>{member.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <SimpleMap />
    </div>
  )
}

export default Team

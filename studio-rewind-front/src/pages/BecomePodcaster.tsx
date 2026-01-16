import { useState } from 'react'
import { ChevronDown, Mic, Video, Users, Wallet, Check } from 'lucide-react'
import api from '../api/client'
import './BecomePodcaster.css'

type FaqItem = {
  question: string
  answer: string
}

const FAQ_DATA: FaqItem[] = [
  {
    question: "Est-ce que je peux créer mon podcast même si je n'ai jamais fait ça avant ?",
    answer: "Oui ! On accompagne les débutants comme les experts. Tu bénéficies d'un accompagnement technique et éditorial complet pour structurer tes épisodes."
  },
  {
    question: "Est-ce que je dois acheter du matériel ?",
    answer: "Non. Tout est fourni : caméras Sony FX30, micros Rode, éclairage pro, etc."
  },
  {
    question: "Combien ça coûte ?",
    answer: "Un abonnement de 39,90 €/mois pour être référencé et accéder au studio."
  },
  {
    question: "Comment je suis payé ?",
    answer: "Tu touches 20% sur chaque prestation vendue via Studio Rewind. Par exemple, si un client paie 1 000 € pour une formule, tu touches 200 €."
  }
]

function BecomePodcaster() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    city: '',
    phone: '',
    siret: '',
    companyName: '',
    status: '',
    message: '',
    rgpdAccepted: false
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const { firstname, lastname, email, city, phone, siret, companyName, status, message, rgpdAccepted } = formData

    // Validation des champs obligatoires
    if (!firstname.trim() || !lastname.trim()) {
      setError('Veuillez renseigner votre prénom et nom.')
      return
    }
    if (!email.trim()) {
      setError('Veuillez renseigner votre email.')
      return
    }
    if (!siret.trim()) {
      setError('Veuillez renseigner votre numéro SIRET (ou "en cours" si pas encore obtenu).')
      return
    }
    if (!companyName.trim()) {
      setError('Veuillez renseigner le nom de votre société.')
      return
    }
    if (!status) {
      setError('Veuillez sélectionner votre statut juridique.')
      return
    }
    if (!message.trim()) {
      setError('Veuillez renseigner votre message.')
      return
    }
    if (!rgpdAccepted) {
      setError('Veuillez accepter la politique de confidentialité.')
      return
    }

    const content = [
      'Nouvelle demande pour devenir podcasteur',
      '',
      `Prénom : ${firstname}`,
      `Nom : ${lastname}`,
      `Email : ${email}`,
      `Ville : ${city || 'Non précisée'}`,
      `Téléphone : ${phone || 'Non précisé'}`,
      '',
      `Nom de la société : ${companyName}`,
      `SIRET : ${siret}`,
      `Statut : ${status}`,
      '',
      'Message :',
      message
    ].join('\n')

    try {
      setSubmitting(true)
      await api.post('/messages/contact', {
        email,
        subject: `Devenir podcasteur - ${firstname} ${lastname} (${companyName})`,
        content
      })

      setSuccess('Merci ! Ta demande a bien été envoyée. On te recontacte sous 48h.')
      setFormData({
        firstname: '',
        lastname: '',
        email: '',
        city: '',
        phone: '',
        siret: '',
        companyName: '',
        status: '',
        message: '',
        rgpdAccepted: false
      })
    } catch (err: any) {
      console.error('Erreur envoi formulaire podcasteur :', err)
      const msg = err?.response?.data?.message || "Une erreur est survenue lors de l'envoi."
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="become-podcaster">
      {/* Hero Section */}
      <section className="bp-hero">
        <div className="bp-hero-content">
          <h1 className="bp-title">
            <Mic className="bp-title-icon" />
            Crée ton Podcast avec Studio Rewind
          </h1>
          <p className="bp-subtitle">
            Tu as une idée, une expertise ou une passion ?
          </p>
          <p className="bp-description">
            Studio Rewind te donne <strong>tout ce qu'il faut</strong> pour lancer ton podcast <strong>sans prise de tête</strong> : studio pro, accompagnement et visibilité.
          </p>
          <a href="#formulaire" className="btn btn-primary">Je lance mon podcast</a>
        </div>
      </section>

      {/* How it works */}
      <section className="bp-section bp-how">
        <h2 className="subtitle">Comment ça marche ?</h2>

        <div className="bp-steps">
          <div className="bp-step">
            <div className="bp-step-number">1</div>
            <h3>Tu as un projet de podcast ?</h3>
            <p>Peu importe ton niveau (débutant ou expert), on t'accompagne de A à Z.</p>
          </div>

          <div className="bp-step">
            <div className="bp-step-number">2</div>
            <h3>On te fournit tout</h3>
            <ul className="bp-step-list">
              <li><Video size={18} /> Un studio équipé (caméras Sony FX30, micros Rode, éclairage pro, fond vert)</li>
              <li><Users size={18} /> Un accompagnement technique et éditorial pour structurer tes épisodes</li>
              <li><Mic size={18} /> Un montage audio/vidéo (selon la formule choisie)</li>
            </ul>
          </div>

          <div className="bp-step">
            <div className="bp-step-number">3</div>
            <h3>Tu es référencé sur notre plateforme</h3>
            <p>Ton podcast est mis en avant sur notre site et nos réseaux. Tu bénéficies d'une <strong>visibilité immédiate</strong>.</p>
          </div>

          <div className="bp-step">
            <div className="bp-step-number">4</div>
            <h3>Tu es rémunéré</h3>
            <p><Wallet size={18} /> <strong>20% du montant</strong> de chaque prestation vendue grâce à ton podcast.</p>
            <p className="bp-step-example">Exemple : Si un client paie 1 000 € pour une formule, tu touches <strong>200 €</strong>.</p>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="bp-section bp-why">
        <h2 className="subtitle">Pourquoi choisir Studio Rewind ?</h2>

        <div className="bp-advantages">
          <div className="bp-advantage">
            <Check className="bp-advantage-icon" />
            <div>
              <h4>Pas besoin d'investir dans du matériel</h4>
              <p>Tout est fourni.</p>
            </div>
          </div>

          <div className="bp-advantage">
            <Check className="bp-advantage-icon" />
            <div>
              <h4>Pas besoin d'être un pro</h4>
              <p>On te forme (médiatraining inclus).</p>
            </div>
          </div>

          <div className="bp-advantage">
            <Check className="bp-advantage-icon" />
            <div>
              <h4>Pas besoin de chercher des clients</h4>
              <p>On te met en relation avec notre réseau.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps to start */}
      <section className="bp-section bp-start">
        <h2 className="subtitle">Étapes pour commencer</h2>

        <div className="bp-timeline">
          <div className="bp-timeline-item">
            <span className="bp-timeline-number">1</span>
            <p>Remplis le formulaire ci-dessous</p>
          </div>
          <div className="bp-timeline-item">
            <span className="bp-timeline-number">2</span>
            <p>On étudie ton projet sous 48h</p>
          </div>
          <div className="bp-timeline-item">
            <span className="bp-timeline-number">3</span>
            <p>On te donne accès au studio et à nos outils</p>
          </div>
          <div className="bp-timeline-item">
            <span className="bp-timeline-number">4</span>
            <p>Tu lances ton podcast et tu commences à gagner de l'argent</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bp-section bp-faq">
        <h2 className="subtitle">Questions fréquentes</h2>

        <div className="bp-faq-list">
          {FAQ_DATA.map((item, index) => (
            <div key={index} className="bp-faq-row">
              <div
                className="bp-faq-header"
                onClick={() => handleToggle(index)}
              >
                <span className="bp-faq-question">{item.question}</span>
                <ChevronDown
                  className={`bp-faq-chevron ${openIndex === index ? 'bp-faq-chevron--open' : ''}`}
                  size={16}
                />
              </div>

              {openIndex === index && (
                <div className="bp-faq-answer">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section id="formulaire" className="bp-section bp-form-section">
        <h2 className="subtitle">Je veux créer mon podcast !</h2>

        <form className="bp-form" onSubmit={handleSubmit}>
          <div className="bp-form-row">
            <div className="bp-form-group">
              <label htmlFor="firstname">Prénom *</label>
              <input
                id="firstname"
                name="firstname"
                type="text"
                value={formData.firstname}
                onChange={handleChange}
                required
              />
            </div>

            <div className="bp-form-group">
              <label htmlFor="lastname">Nom *</label>
              <input
                id="lastname"
                name="lastname"
                type="text"
                value={formData.lastname}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="bp-form-row">
            <div className="bp-form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="bp-form-group">
              <label htmlFor="city">Ville</label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="bp-form-row">
            <div className="bp-form-group">
              <label htmlFor="phone">Téléphone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="bp-form-group">
              <label htmlFor="companyName">Nom de la société *</label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="bp-form-row">
            <div className="bp-form-group">
              <label htmlFor="siret">SIRET *</label>
              <input
                id="siret"
                name="siret"
                type="text"
                value={formData.siret}
                onChange={handleChange}
                placeholder="Ou 'en cours' si pas encore obtenu"
                required
              />
            </div>

            <div className="bp-form-group">
              <label htmlFor="status">Statut juridique *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionner...</option>
                <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                <option value="Micro-entreprise">Micro-entreprise</option>
                <option value="SARL">SARL</option>
                <option value="SAS">SAS</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>

          <div className="bp-form-group bp-form-group--full">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleChange}
              placeholder="Décris ton projet, tes motivations, tes questions..."
              required
            />
          </div>

          <div className="bp-form-group bp-form-group--full bp-form-checkbox">
            <label>
              <input
                type="checkbox"
                name="rgpdAccepted"
                checked={formData.rgpdAccepted}
                onChange={handleChange}
                required
              />
              <span>J'accepte que mes données soient utilisées pour traiter ma demande conformément à la <a href="/politique-de-confidentialite" target="_blank" rel="noopener noreferrer">politique de confidentialité</a>. *</span>
            </label>
          </div>

          {error && <p className="bp-form-message bp-form-message--error">{error}</p>}
          {success && <p className="bp-form-message bp-form-message--success">{success}</p>}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Envoi en cours...' : 'Je lance mon podcast'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default BecomePodcaster

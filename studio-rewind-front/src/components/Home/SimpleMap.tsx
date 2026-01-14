import api from '../../api/client';
import React, { useState } from 'react';
import { Contact, Phone, Building2, Mail, Send } from 'lucide-react';
import './SimpleMap.css'


function SimpleMap() {
     const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullname.trim() || !email.trim() || !message.trim()) {
      setError('Le nom complet, l’email et le message sont obligatoires.');
      return;
    }

    const subject = "Contact depuis la page d'accueil";
    const content = [
      `Nom complet : ${fullname}`,
      phone ? `Téléphone : ${phone}` : null,
      company ? `Entreprise : ${company}` : null,
      '',
      'Message :',
      message
    ]
      .filter(Boolean)
      .join('\n');

    try {
      setSubmitting(true);
      await api.post('/messages/contact', {
        email,
        subject,
        content
      });

      setSuccess('Merci, votre message a bien été envoyé.');
      setFullname('');
      setPhone('');
      setCompany('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      console.error('Erreur envoi contact :', err);
      const msg =
        err?.response?.data?.message ||
        'Une erreur est survenue lors de l’envoi du message.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <section className="map-wrapper">
        <h3 className="subtitle">Accès au studio</h3>
        <div className="wrap">
            <div className="map-container a">
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1946.75044406743!2d6.479628903740912!3d46.36698851728512!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x478c3fac256f66d1%3A0x9cf893d8c52f9379!2sCosmic%20Comet%20-%20Espaces%20de%20Travail%20%C3%A0%20Thonon-les-Bains!5e0!3m2!1sfr!2sfr!4v1764349188455!5m2!1sfr!2sfr" 
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                />
            </div>
            <div className="grid-center b">
                <p className="access-title">
                    Adresse
                </p>
                <address>
                    Studio Rewind<br/>
                    7 avenue de la libération<br/>
                    74200 Thonon-les-bains
                </address>

                <a href="tel:+33667296965">0667296965</a>
                <a href="mailto:virmaud.gregory@gmail.com?subject=Demande%20info&body=Bonjour">contact@studio-rewind.fr</a>
                <picture>
                  <source srcSet="/images/deventure.webp" type="image/webp" />
                  <img src="/images/deventure.png" alt="" loading="lazy" />
                </picture>
            </div>
            <div className="contact c">
                <p className="access-title">Une question? Ecrivez-nous</p>
                <form className="form-contact" onSubmit={handleSubmit}>
                    <div className="input-field">
                        <Contact className="icon" />
                        <input
                            id="fullname"
                            type="text"
                            placeholder="Nom complet"
                            value={fullname}
                            onChange={(e) => setFullname(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-field">
                        <Phone className="icon" />
                        <input
                            id="phone"
                            placeholder="Téléphone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                    <div className="input-field">
                        <Building2 className="icon" />
                        <input
                            id="company"
                            placeholder="Entreprise"
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                        />
                    </div>
                    <div className="input-field">
                        <Mail className="icon" />
                        <input
                            id="email"
                            placeholder="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-field">
                        <Send className="icon icon-textarea" />
                        <textarea
                        id="message"
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        />
                    </div>

                    {error && <p className="sr-error">{error}</p>}
                    {success && <p className="sr-success">{success}</p>}

                    <button className="sr-button" type="submit" disabled={submitting}>
                        {submitting ? 'Envoi...' : 'Envoyer'}
                    </button>
                
                </form>
            </div>
        </div>
    </section>
  );
}

export default SimpleMap



           

      

          
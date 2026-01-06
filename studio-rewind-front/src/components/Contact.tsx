// src/components/Contact.tsx
import { useState } from 'react';
import api from '../api/client';
import './Contact.css'

function Contact() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // On récupère l'email du membre connecté depuis le localStorage
  const rawUser =
    typeof window !== 'undefined' ? localStorage.getItem('sr_user') : null;
  const user = rawUser ? JSON.parse(rawUser) : null;
  const userEmail: string | null = user?.email ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!userEmail) {
      setError(
        "Impossible d'identifier votre compte. Merci de vous reconnecter avant d'envoyer un message."
      );
      return;
    }

    if (!subject.trim() || !message.trim()) {
      setError('Le sujet et le message sont obligatoires.');
      return;
    }

    const finalSubject = subject.trim();

    const content = [
      "Message envoyé depuis l'espace membre.",
      user?.firstname || user?.lastname || user?.company_name
        ? `Identité : ${
            user.company_name ||
            `${user.firstname || ''} ${user.lastname || ''}`.trim()
          }`
        : null,
      `Email : ${userEmail}`,
      '',
      'Sujet :',
      finalSubject,
      '',
      'Message :',
      message.trim()
    ]
      .filter(Boolean)
      .join('\n');

    try {
      setSubmitting(true);
      await api.post('/messages/contact', {
        email: userEmail,
        subject: finalSubject,
        content
      });

      setSuccess('Merci, votre message a bien été envoyé.');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error('Erreur envoi contact membre :', err);
      const msg =
        err?.response?.data?.message ||
        'Une erreur est survenue lors de l’envoi du message.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="member-password-card member-contact-card">
      <h3 className="member-password-title">Contacter le studio</h3>
      <p className="member-password-subtitle">
        Une question sur tes réservations, ton abonnement ou le studio ? Envoie
        un message directement à l’équipe.
      </p>

      <form className="member-password-form" onSubmit={handleSubmit}>
        <div className="member-password-field">
          <label htmlFor="contact-subject">Sujet</label>
          <input
            id="contact-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>

        <div className="member-password-field">
          <label htmlFor="contact-message">Message</label>
          <textarea
            id="contact-message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="member-password-message member-password-message--error">
            {error}
          </p>
        )}

        {success && (
          <p className="member-password-message member-password-message--success">
            {success}
          </p>
        )}

        <button
          type="submit"
          className="member-password-submit"
          disabled={submitting}
        >
          {submitting ? 'Envoi...' : 'Envoyer mon message'}
        </button>
      </form>
    </section>
  );
}

export default Contact;

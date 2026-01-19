import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  type AdminMessage,
  getAdminMessages,
  getAdminMessageById,
  deleteAdminMessage,
  replyToAdminMessage
} from '../../api/adminMessages';
import type { AdminLayoutOutletContext } from '../../layouts/AdminLayout';

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getMessageCreatedAt(msg: AdminMessage) {
  return msg.createdAt || msg.created_at || '';
}

function getSenderName(msg: AdminMessage) {
  if (msg.User) {
    if (msg.User.company_name) return msg.User.company_name;
    if (msg.User.firstname || msg.User.lastname) {
      return `${msg.User.firstname || ''} ${msg.User.lastname || ''}`.trim();
    }
  }
  return msg.email;
}

function AdminMessagesPage() {
  const { searchQuery, refreshNotifications } = useOutletContext<AdminLayoutOutletContext>();

  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminMessage | null>(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [replySubject, setReplySubject] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        setLoadingList(true);
        const data = await getAdminMessages();
        setMessages(data);
        // Rafraichir les notifications pour avoir les compteurs a jour
        refreshNotifications();
        if (data.length > 0) {
          setSelectedId(data[0].id);
        }
      } catch (err: any) {
        console.error('Erreur getAdminMessages:', err);
        const message =
          err?.response?.data?.message || "Impossible de charger les messages.";
        setError(message);
      } finally {
        setLoadingList(false);
      }
    }

    load();
  }, [refreshNotifications]);

  useEffect(() => {
    async function loadDetail(id: string) {
      try {
        setLoadingDetail(true);
        const msg = await getAdminMessageById(id);
        setSelected(msg);

        // Rafraichir les notifications (le message est maintenant lu)
        refreshNotifications();

        // Mettre a jour le statut dans la liste locale
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: 'read' } : m))
        );

        if (!replySubject) {
          setReplySubject(`Re: ${msg.subject}`);
        }
      } catch (err: any) {
        console.error('Erreur getAdminMessageById:', err);
        const message =
          err?.response?.data?.message ||
          "Impossible de charger le détail du message.";
        setError(message);
      } finally {
        setLoadingDetail(false);
      }
    }

    if (selectedId) {
      loadDetail(selectedId);
    } else {
      setSelected(null);
    }
  }, [selectedId, refreshNotifications]);

  async function handleDelete() {
    if (!selected) return;
    const confirm = window.confirm(
      `Supprimer définitivement ce message de ${getSenderName(selected)} ?`
    );
    if (!confirm) return;

    try {
      setDeleting(true);
      setError(null);
      await deleteAdminMessage(selected.id);

      setMessages((prev) => prev.filter((m) => m.id !== selected.id));

      // Rafraichir les notifications
      refreshNotifications();

      const remaining = messages.filter((m) => m.id !== selected.id);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      } else {
        setSelectedId(null);
      }
    } catch (err: any) {
      console.error('Erreur deleteAdminMessage:', err);
      const message =
        err?.response?.data?.message ||
        "Impossible de supprimer ce message.";
      setError(message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (!replyText.trim()) {
      alert('Merci de saisir un message de réponse.');
      return;
    }

    try {
      setSendingReply(true);
      setError(null);
      await replyToAdminMessage(selected.id, replySubject, replyText);

      // Recharger le message pour afficher la réponse
      const updatedMsg = await getAdminMessageById(selected.id);
      setSelected(updatedMsg);

      setReplyText('');
      alert(`Réponse envoyée avec succès à ${selected.email}`);
    } catch (err: any) {
      console.error('Erreur replyToAdminMessage:', err);
      const message =
        err?.response?.data?.message ||
        "Impossible d'envoyer la réponse.";
      setError(message);
    } finally {
      setSendingReply(false);
    }
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredMessages = !normalizedQuery
    ? messages
    : messages.filter((msg) => {
        const sender = getSenderName(msg);
        const createdAt = getMessageCreatedAt(msg);
        const haystack = [
          sender,
          msg.email,
          msg.subject,
          msg.content,
          createdAt ? formatDate(createdAt) : ''
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      });

  const totalMessages = filteredMessages.length;

  return (
    <div className="sr-page">
      <div className="sr-page-header">
        <div>
          <h2 className="sr-page-title">Messages</h2>
          <p className="sr-page-subtitle">
            Boîte de réception des messages envoyés depuis le site.
          </p>
        </div>
        {totalMessages > 0 && (
          <div className="sr-section-meta">
            <span className="sr-chip">
              {totalMessages} message{totalMessages > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {error && <p className="sr-page-error">{error}</p>}

      <div className="sr-page-body">
        {loadingList && (
          <div className="sr-card">
            <p>Chargement des messages...</p>
          </div>
        )}

        {!loadingList && filteredMessages.length === 0 && (
          <div className="sr-card">
            <p>Aucun message ne correspond à ta recherche.</p>
          </div>
        )}

        {!loadingList && filteredMessages.length > 0 && (
          <div className="sr-card">
            <div className="columns" style={{ marginTop: '0.2rem' }}>
              <div className="column is-4">
                <aside className="menu">
                  <ul
                    className="menu-list"
                    style={{ maxHeight: '480px', overflowY: 'auto', width:'80%' }}
                  >
                    {filteredMessages.map((msg) => {
                      const isActive = msg.id === selectedId;
                      const createdAt = getMessageCreatedAt(msg);

                      return (
                        <li key={msg.id}>
                          <a
                            className={isActive ? 'is-active' : ''}
                            onClick={() => setSelectedId(msg.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="flex-column">
                              <span>{getSenderName(msg)}</span>
                              <span className="is-size-7">
                                {createdAt ? formatDate(createdAt) : ''}
                              </span>
                            </div>
                            <div className="is-size-7">
                              <span className="has-text-grey-light">
                                {msg.subject}
                              </span>
                            </div>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </aside>
              </div>

              <div className="column is-8">
                {loadingDetail && <p>Chargement du message...</p>}

                {!loadingDetail && selected && (
                  <>
                    <div className="sr-card" style={{ marginBottom: '0.8rem' }}>
                      <div className="is-flex is-justify-content-space-between is-align-items-center">
                        <div>
                          <p className="has-text-weight-semibold has-text-white">
                            {selected.subject}
                          </p>
                          <p className="is-size-7 has-text-grey-light">
                            De : {getSenderName(selected)} &lt;{selected.email}
                            &gt;
                          </p>
                          <p className="is-size-7 has-text-grey-light">
                            Reçu le :{' '}
                            {getMessageCreatedAt(selected)
                              ? formatDate(
                                  getMessageCreatedAt(selected) as string
                                )
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <button
                            className="button is-danger is-small"
                            onClick={handleDelete}
                            disabled={deleting}
                          >
                            {deleting ? 'Suppression...' : 'Supprimer'}
                          </button>
                        </div>
                      </div>

                      <div
                        className="content"
                        style={{
                          marginTop: '0.9rem',
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.9rem'
                        }}
                      >
                        {selected.content}
                      </div>
                    </div>

                    {/* Affichage de la réponse si elle existe */}
                    {selected.reply_content && (
                      <div
                        className="sr-card"
                        style={{
                          marginBottom: '0.8rem',
                          backgroundColor: 'rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        <div className="is-flex is-justify-content-space-between is-align-items-center">
                          <div>
                            <p className="has-text-weight-semibold" style={{ color: '#ce1b1d' }}>
                              Vous avez répondu :
                            </p>
                            <p className="is-size-7 has-text-grey-light">
                              Sujet : {selected.reply_subject}
                            </p>
                            <p className="is-size-7 has-text-grey-light">
                              Envoyé le : {selected.replied_at ? formatDate(selected.replied_at) : 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div
                          className="content"
                          style={{
                            marginTop: '0.9rem',
                            whiteSpace: 'pre-wrap',
                            fontSize: '0.9rem'
                          }}
                        >
                          {selected.reply_content}
                        </div>
                      </div>
                    )}

                    <div className="sr-card">
                      <p
                        className="has-text-weight-semibold has-text-white"
                        style={{ marginBottom: '0.5rem' }}
                      >
                        Répondre à {selected.email}
                      </p>
                      <form onSubmit={handleSendReply}>
                        <div className="field">
                          <label className="label has-text-white is-size-7">
                            Sujet
                          </label>
                          <div className="control">
                            <input
                              className="input"
                              type="text"
                              value={replySubject}
                              onChange={(e) => setReplySubject(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="field">
                          <label className="label has-text-white is-size-7">
                            Message
                          </label>
                          <div className="control">
                            <textarea
                              className="textarea"
                              rows={5}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="field is-grouped is-justify-content-flex-end">
                          <div className="control">
                            <button
                              className="button is-primary is-small"
                              type="submit"
                              disabled={sendingReply}
                            >
                              {sendingReply ? 'Envoi...' : 'Envoyer la réponse'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </>
                )}

                {!loadingDetail && !selected && (
                  <p>Sélectionne un message dans la liste pour le consulter.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminMessagesPage;

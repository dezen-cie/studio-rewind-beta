import { useEffect, useState, useRef } from 'react';
import {
  type Podcaster,
  getAdminPodcasters,
  createAdminPodcaster,
  updateAdminPodcaster,
  deleteAdminPodcaster,
  togglePodcasterAdmin,
  togglePodcasterCoreTeam
} from '../../api/podcasters';
import { getUserRole } from '../../utils/auth';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function AdminPodcastersPage() {
  const currentUserRole = getUserRole();
  const isSuperAdmin = currentUserRole === 'super_admin';

  const [podcasters, setPodcasters] = useState<Podcaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingAdminId, setTogglingAdminId] = useState<string | null>(null);
  const [togglingCoreTeamId, setTogglingCoreTeamId] = useState<string | null>(null);

  // Form state for creating
  const [isCreating, setIsCreating] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formVideo, setFormVideo] = useState<File | null>(null);
  const [formAudio, setFormAudio] = useState<File | null>(null);
  const [formOrder, setFormOrder] = useState('');
  const [formTeamOrder, setFormTeamOrder] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Pour afficher le mot de passe par défaut après création
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  // Refs for file inputs
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editVideo, setEditVideo] = useState<File | null>(null);
  const [editAudio, setEditAudio] = useState<File | null>(null);
  const [editOrder, setEditOrder] = useState('');
  const [editTeamOrder, setEditTeamOrder] = useState('');
  const [editTeamRole, setEditTeamRole] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const editVideoRef = useRef<HTMLInputElement>(null);
  const editAudioRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPodcasters();
  }, []);

  async function loadPodcasters() {
    try {
      setError(null);
      setLoading(true);
      const data = await getAdminPodcasters();
      setPodcasters(data);
    } catch (err: any) {
      console.error('Erreur getAdminPodcasters:', err);
      const message =
        err?.response?.data?.message ||
        "Impossible de charger les podcasteurs.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormName('');
    setFormEmail('');
    setFormVideo(null);
    setFormAudio(null);
    setFormOrder('');
    setFormTeamOrder('');
    setFormIsActive(true);
    setIsCreating(false);
    setCreatedPassword(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
  }

  function resetEditForm() {
    setEditingId(null);
    setEditName('');
    setEditPhone('');
    setEditVideo(null);
    setEditAudio(null);
    setEditOrder('');
    setEditTeamOrder('');
    setEditTeamRole('');
    setEditIsActive(true);
    if (editVideoRef.current) editVideoRef.current.value = '';
    if (editAudioRef.current) editAudioRef.current.value = '';
  }

  function startCreate() {
    resetForm();
    resetEditForm();
    setIsCreating(true);
  }

  function startEdit(p: Podcaster) {
    resetForm();
    setEditingId(p.id);
    setEditName(p.name);
    setEditPhone(p.phone || '');
    setEditVideo(null);
    setEditAudio(null);
    setEditOrder(String(p.display_order));
    setEditTeamOrder(p.team_display_order !== null && p.team_display_order !== undefined ? String(p.team_display_order) : '');
    setEditTeamRole(p.team_role || '');
    setEditIsActive(p.is_active);
  }

  function cancelForm() {
    resetForm();
    resetEditForm();
  }

  async function handleCreate() {
    if (!formName.trim()) {
      setError('Le nom est obligatoire.');
      return;
    }
    if (!formEmail.trim()) {
      setError('L\'email est obligatoire.');
      return;
    }
    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail.trim())) {
      setError('L\'email n\'est pas valide.');
      return;
    }
    if (!formVideo) {
      setError('La video est obligatoire.');
      return;
    }
    if (!formAudio) {
      setError('L\'audio est obligatoire.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const newPodcaster = await createAdminPodcaster({
        name: formName.trim(),
        email: formEmail.trim(),
        video: formVideo,
        audio: formAudio,
        display_order: formOrder ? parseInt(formOrder, 10) : undefined,
        team_display_order: formTeamOrder ? parseInt(formTeamOrder, 10) : undefined,
        is_active: formIsActive
      });

      // Afficher le mot de passe généré
      if (newPodcaster.defaultPassword) {
        setCreatedPassword(newPodcaster.defaultPassword);
      }

      setPodcasters((prev) => [...prev, newPodcaster].sort((a, b) => a.display_order - b.display_order));

      // Ne pas resetForm immédiatement si on a un mot de passe à afficher
      if (!newPodcaster.defaultPassword) {
        resetForm();
      } else {
        // Reset seulement les champs de formulaire mais garder isCreating pour afficher le mot de passe
        setFormName('');
        setFormEmail('');
        setFormVideo(null);
        setFormAudio(null);
        setFormOrder('');
        setFormTeamOrder('');
        setFormIsActive(true);
        if (videoInputRef.current) videoInputRef.current.value = '';
        if (audioInputRef.current) audioInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Erreur createAdminPodcaster:', err);
      const message =
        err?.response?.data?.message ||
        "Impossible de creer le podcasteur.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(p: Podcaster) {
    if (!editName.trim()) {
      setError('Le nom est obligatoire.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updated = await updateAdminPodcaster(p.id, {
        name: editName.trim(),
        phone: editPhone.trim() || null,
        video: editVideo || undefined,
        audio: editAudio || undefined,
        display_order: editOrder ? parseInt(editOrder, 10) : undefined,
        team_display_order: editTeamOrder === '' ? null : parseInt(editTeamOrder, 10),
        team_role: editTeamRole.trim(),
        is_active: editIsActive
      });
      setPodcasters((prev) =>
        prev
          .map((x) => (x.id === updated.id ? updated : x))
          .sort((a, b) => a.display_order - b.display_order)
      );
      resetEditForm();
    } catch (err: any) {
      console.error('Erreur updateAdminPodcaster:', err);
      const message =
        err?.response?.data?.message ||
        "Impossible de mettre a jour le podcasteur.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Podcaster) {
    if (!confirm(`Supprimer le podcasteur "${p.name}" ?\nLes fichiers video et audio seront egalement supprimes.`)) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await deleteAdminPodcaster(p.id);
      setPodcasters((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err: any) {
      console.error('Erreur deleteAdminPodcaster:', err);
      const message =
        err?.response?.data?.message ||
        "Impossible de supprimer le podcasteur.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Podcaster) {
    try {
      setSaving(true);
      setError(null);
      const updated = await updateAdminPodcaster(p.id, {
        is_active: !p.is_active
      });
      setPodcasters((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : x))
      );
    } catch (err: any) {
      console.error('Erreur toggleActive:', err);
      const message =
        err?.response?.data?.message ||
        "Impossible de modifier le statut.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAdmin(p: Podcaster) {
    const isCurrentlyAdmin = p.role === 'admin';
    try {
      setTogglingAdminId(p.id);
      setError(null);
      const updated = await togglePodcasterAdmin(p.id, !isCurrentlyAdmin);
      setPodcasters((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : x))
      );
    } catch (err: any) {
      console.error('Erreur togglePodcasterAdmin:', err);
      const message =
        err?.response?.data?.message ||
        "Impossible de modifier le statut admin.";
      setError(message);
    } finally {
      setTogglingAdminId(null);
    }
  }

  async function handleToggleCoreTeam(p: Podcaster) {
    try {
      setTogglingCoreTeamId(p.id);
      setError(null);
      const updated = await togglePodcasterCoreTeam(p.id, !p.is_core_team);
      setPodcasters((prev) =>
        prev.map((x) => (x.id === updated.id ? { ...x, is_core_team: updated.is_core_team } : x))
      );
    } catch (err: any) {
      console.error('Erreur togglePodcasterCoreTeam:', err);
      const message =
        err?.response?.data?.message ||
        "Impossible de modifier le statut equipe principale.";
      setError(message);
    } finally {
      setTogglingCoreTeamId(null);
    }
  }

  function getMediaUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('/uploads')) {
      return BACKEND_URL + url;
    }
    return url;
  }

  return (
    <div className="sr-page">
      <div className="sr-page-header">
        <div>
          <h2 className="sr-page-title">Podcasteurs</h2>
          <p className="sr-page-subtitle">
            Gere les podcasteurs affiches sur la page d'accueil.
          </p>
        </div>
        <div className="sr-section-meta">
          {podcasters.length > 0 && (
            <span className="sr-chip">
              {podcasters.length} podcasteur{podcasters.length > 1 ? 's' : ''}
            </span>
          )}
          <button
            className="button is-primary"
            onClick={startCreate}
            disabled={isCreating || editingId !== null}
          >
            + Ajouter
          </button>
        </div>
      </div>

      {error && <p className="sr-page-error">{error}</p>}

      <div className="sr-page-body">
        <div className="sr-card">
          {loading && <p>Chargement des podcasteurs...</p>}

          {!loading && !error && podcasters.length === 0 && !isCreating && (
            <p>Aucun podcasteur. Cliquez sur "+ Ajouter" pour en creer un.</p>
          )}

          {/* Create form */}
          {isCreating && (
            <div className="box mb-4">
              {createdPassword ? (
                // Affichage du mot de passe après création réussie
                <div className="notification is-success">
                  <h4 className="title is-5">Podcasteur cree avec succes !</h4>
                  <p><strong>Mot de passe genere :</strong> <code>{createdPassword}</code></p>
                  <p className="mt-2">
                    Notez ce mot de passe et transmettez-le au podcasteur.
                    Il devra le changer lors de sa premiere connexion.
                  </p>
                  <button
                    className="button is-primary mt-3"
                    onClick={resetForm}
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <>
              <h4 className="title is-5">Nouveau podcasteur</h4>
              <div className="field">
                <label className="label">Nom</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Podcasteur 1"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="field">
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="email@exemple.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  disabled={saving}
                />
                <p className="help">L'email servira de login. Le mot de passe sera: nom + "1"</p>
              </div>
              <div className="field">
                <label className="label">Video</label>
                <div className="file has-name is-fullwidth">
                  <label className="file-label">
                    <input
                      ref={videoInputRef}
                      className="file-input"
                      type="file"
                      accept="video/mp4,video/webm,video/ogg"
                      onChange={(e) => setFormVideo(e.target.files?.[0] || null)}
                      disabled={saving}
                    />
                    <span className="file-cta">
                      <span className="file-label">Choisir une video...</span>
                    </span>
                    <span className="file-name">
                      {formVideo ? formVideo.name : 'Aucun fichier selectionne'}
                    </span>
                  </label>
                </div>
                <p className="help">Formats acceptes: MP4, WebM, OGG (max 100 MB)</p>
              </div>
              <div className="field">
                <label className="label">Audio</label>
                <div className="file has-name is-fullwidth">
                  <label className="file-label">
                    <input
                      ref={audioInputRef}
                      className="file-input"
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
                      onChange={(e) => setFormAudio(e.target.files?.[0] || null)}
                      disabled={saving}
                    />
                    <span className="file-cta">
                      <span className="file-label">Choisir un audio...</span>
                    </span>
                    <span className="file-name">
                      {formAudio ? formAudio.name : 'Aucun fichier selectionne'}
                    </span>
                  </label>
                </div>
                <p className="help">Formats acceptes: MP3, WAV, OGG (max 100 MB)</p>
              </div>
              <div className="columns">
                <div className="column is-6">
                  <div className="field">
                    <label className="label">Ordre page d'accueil</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="1, 2, 3..."
                      value={formOrder}
                      onChange={(e) => setFormOrder(e.target.value)}
                      disabled={saving}
                      min="0"
                      style={{ width: '100px' }}
                    />
                  </div>
                </div>
                <div className="column is-6">
                  <div className="field">
                    <label className="label">Ordre page equipe</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="1, 2, 3..."
                      value={formTeamOrder}
                      onChange={(e) => setFormTeamOrder(e.target.value)}
                      disabled={saving}
                      min="1"
                      style={{ width: '100px' }}
                    />
                    <p className="help">Vide = apparait a la fin</p>
                  </div>
                </div>
              </div>
              <div className="field">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    disabled={saving}
                  />{' '}
                  Actif (visible sur le site)
                </label>
              </div>
              <div className="buttons">
                <button
                  className="button is-success"
                  disabled={saving}
                  onClick={handleCreate}
                >
                  {saving ? 'Creation...' : 'Creer'}
                </button>
                <button
                  className="button"
                  disabled={saving}
                  onClick={cancelForm}
                >
                  Annuler
                </button>
              </div>
                </>
              )}
            </div>
          )}

          {/* Podcasters list */}
          {!loading && podcasters.length > 0 && (
            <div className="podcasters-list">
              {podcasters.map((p) => {
                const isEditing = editingId === p.id;
                // Le super admin ne peut être modifié que par lui-même
                const isPodcasterSuperAdmin = p.role === 'super_admin';
                const canModifyThisPodcaster = !isPodcasterSuperAdmin || isSuperAdmin;

                return (
                  <div key={p.id} className="box mb-4" style={{ opacity: p.is_active ? 1 : 0.6 }}>
                    {isEditing ? (
                      // Edit form
                      <>
                        <div className="columns">
                          <div className="column is-6">
                            <div className="columns">
                              <div className="column is-4">
                                <div className="field">
                                  <label className="label">Nom</label>
                                  <input
                                    type="text"
                                    className="input"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    disabled={saving}
                                    placeholder="Ex: Gregory"
                                  />
                                </div>
                              </div>
                              <div className="column is-4">
                                <div className="field">
                                  <label className="label">Telephone</label>
                                  <input
                                    type="tel"
                                    className="input"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    disabled={saving}
                                    placeholder="Ex: 0606060606"
                                  />
                                </div>
                              </div>
                              <div className="column is-4">
                                <div className="field">
                                  <label className="label">Role</label>
                                  <input
                                    type="text"
                                    className="input"
                                    value={editTeamRole}
                                    onChange={(e) => setEditTeamRole(e.target.value)}
                                    disabled={saving}
                                    placeholder="Ex: CEO & Podcasteur"
                                  />
                                  <p className="help">Affiche au-dessus du nom sur la page equipe</p>
                                </div>
                              </div>
                            </div>
                            <div className="columns">
                              <div className="column is-6">
                                <div className="field">
                                  <label className="label">Ordre page d'accueil</label>
                                  <input
                                    type="number"
                                    className="input"
                                    value={editOrder}
                                    onChange={(e) => setEditOrder(e.target.value)}
                                    disabled={saving}
                                    min="0"
                                    style={{ width: '100px' }}
                                  />
                                </div>
                              </div>
                              <div className="column is-6">
                                <div className="field">
                                  <label className="label">Ordre page equipe</label>
                                  <input
                                    type="number"
                                    className="input"
                                    value={editTeamOrder}
                                    onChange={(e) => setEditTeamOrder(e.target.value)}
                                    disabled={saving}
                                    min="1"
                                    style={{ width: '100px' }}
                                    placeholder="vide = fin"
                                  />
                                  <p className="help">Vide = apparait a la fin</p>
                                </div>
                              </div>
                            </div>
                            <div className="field">
                              <label className="checkbox">
                                <input
                                  type="checkbox"
                                  checked={editIsActive}
                                  onChange={(e) => setEditIsActive(e.target.checked)}
                                  disabled={saving}
                                />{' '}
                                Actif (visible sur la page d'accueil)
                              </label>
                            </div>
                          </div>
                          <div className="column is-3">
                            <div className="field">
                              <label className="label">Nouvelle video</label>
                              <div className="file has-name is-fullwidth is-small">
                                <label className="file-label">
                                  <input
                                    ref={editVideoRef}
                                    className="file-input"
                                    type="file"
                                    accept="video/mp4,video/webm,video/ogg"
                                    onChange={(e) => setEditVideo(e.target.files?.[0] || null)}
                                    disabled={saving}
                                  />
                                  <span className="file-cta">
                                    <span className="file-label">Choisir...</span>
                                  </span>
                                  <span className="file-name">
                                    {editVideo ? editVideo.name : 'Garder actuelle'}
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>
                          <div className="column is-3">
                            <div className="field">
                              <label className="label">Nouvel audio</label>
                              <div className="file has-name is-fullwidth is-small">
                                <label className="file-label">
                                  <input
                                    ref={editAudioRef}
                                    className="file-input"
                                    type="file"
                                    accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
                                    onChange={(e) => setEditAudio(e.target.files?.[0] || null)}
                                    disabled={saving}
                                  />
                                  <span className="file-cta">
                                    <span className="file-label">Choisir...</span>
                                  </span>
                                  <span className="file-name">
                                    {editAudio ? editAudio.name : 'Garder actuel'}
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="buttons">
                          <button
                            className="button is-success"
                            disabled={saving}
                            onClick={() => handleUpdate(p)}
                          >
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                          </button>
                          <button
                            className="button"
                            disabled={saving}
                            onClick={cancelForm}
                          >
                            Annuler
                          </button>
                        </div>
                      </>
                    ) : (
                      // Display mode
                      <div className="columns is-vcentered">
                        <div className="column is-1">
                          <span className="tag is-medium">{p.display_order}</span>
                        </div>
                        <div className="column is-2">
                          <strong>{p.name}</strong>
                          {p.phone && (
                            <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                              <a href={`tel:${p.phone}`} style={{ color: '#6366f1' }}>{p.phone}</a>
                            </div>
                          )}
                        </div>
                        <div className="column is-2">
                          {p.video_url ? (
                            <video
                              src={getMediaUrl(p.video_url)}
                              style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: '4px' }}
                              muted
                              loop
                              autoPlay
                              playsInline
                            />
                          ) : (
                            <span className="tag is-light" style={{ fontSize: '0.7rem' }}>Pas de video</span>
                          )}
                        </div>
                        <div className="column is-2">
                          {p.audio_url ? (
                            <audio
                              src={getMediaUrl(p.audio_url)}
                              controls
                              style={{ width: '100%', height: '32px' }}
                            />
                          ) : (
                            <span className="tag is-light" style={{ fontSize: '0.7rem' }}>Pas d'audio</span>
                          )}
                        </div>
                        <div className="column is-1">
                          {canModifyThisPodcaster ? (
                            <span
                              className={`tag ${p.is_active ? 'is-success' : 'is-warning'}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => toggleActive(p)}
                              title="Cliquer pour changer"
                            >
                              {p.is_active ? 'Actif' : 'Inactif'}
                            </span>
                          ) : (
                            <span
                              className="tag is-light"
                              style={{ cursor: 'not-allowed', opacity: 0.7 }}
                              title="Super admin - non modifiable"
                            >
                              {p.is_active ? 'Actif' : 'Inactif'}
                            </span>
                          )}
                        </div>
                        {isSuperAdmin && (
                          <div className="column is-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {!isPodcasterSuperAdmin && (
                              <div
                                onClick={() => !togglingAdminId && handleToggleAdmin(p)}
                                title={p.role === 'admin' ? 'Retirer les droits admin' : 'Promouvoir en admin'}
                                style={{
                                  position: 'relative',
                                  width: '90px',
                                  height: '28px',
                                  backgroundColor: p.role === 'admin' ? '#23d160' : '#dbdbdb',
                                  borderRadius: '14px',
                                  cursor: togglingAdminId === p.id ? 'wait' : 'pointer',
                                  transition: 'background-color 0.3s',
                                  opacity: togglingAdminId === p.id ? 0.6 : 1
                                }}
                              >
                                {/* Knob */}
                                <div style={{
                                  position: 'absolute',
                                  top: '2px',
                                  left: p.role === 'admin' ? '64px' : '2px',
                                  width: '24px',
                                  height: '24px',
                                  backgroundColor: '#fff',
                                  borderRadius: '50%',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                  transition: 'left 0.3s'
                                }} />
                                {/* Label */}
                                <span style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: p.role === 'admin' ? '8px' : '32px',
                                  transform: 'translateY(-50%)',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  color: p.role === 'admin' ? '#fff' : '#7a7a7a',
                                  transition: 'left 0.3s',
                                  userSelect: 'none'
                                }}>
                                  {togglingAdminId === p.id ? '...' : (p.role === 'admin' ? 'Admin' : 'No Admin')}
                                </span>
                              </div>
                            )}
                            <div
                              onClick={() => !togglingCoreTeamId && handleToggleCoreTeam(p)}
                              title={p.is_core_team ? 'Retirer de l\'equipe principale' : 'Ajouter a l\'equipe principale'}
                              style={{
                                position: 'relative',
                                width: '90px',
                                height: '28px',
                                backgroundColor: p.is_core_team ? '#3273dc' : '#dbdbdb',
                                borderRadius: '14px',
                                cursor: togglingCoreTeamId === p.id ? 'wait' : 'pointer',
                                transition: 'background-color 0.3s',
                                opacity: togglingCoreTeamId === p.id ? 0.6 : 1
                              }}
                            >
                              {/* Knob */}
                              <div style={{
                                position: 'absolute',
                                top: '2px',
                                left: p.is_core_team ? '64px' : '2px',
                                width: '24px',
                                height: '24px',
                                backgroundColor: '#fff',
                                borderRadius: '50%',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                transition: 'left 0.3s'
                              }} />
                              {/* Label */}
                              <span style={{
                                position: 'absolute',
                                top: '50%',
                                left: p.is_core_team ? '8px' : '32px',
                                transform: 'translateY(-50%)',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                color: p.is_core_team ? '#fff' : '#7a7a7a',
                                transition: 'left 0.3s',
                                userSelect: 'none'
                              }}>
                                {togglingCoreTeamId === p.id ? '...' : (p.is_core_team ? 'Equipe' : 'Externe')}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className={`column ${isSuperAdmin ? 'is-2' : 'is-4'}`}>
                          {canModifyThisPodcaster ? (
                            <div className="buttons are-small">
                              <button
                                className="button is-info"
                                onClick={() => startEdit(p)}
                                disabled={isCreating || editingId !== null}
                              >
                                Modifier
                              </button>
                              <button
                                className="button is-danger"
                                onClick={() => handleDelete(p)}
                                disabled={saving || isCreating || editingId !== null}
                              >
                                Supprimer
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPodcastersPage;

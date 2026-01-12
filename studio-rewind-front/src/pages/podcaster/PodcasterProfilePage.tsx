import { useEffect, useState, useRef } from 'react';
import { Upload, Save, Eye, EyeOff, UserPlus, UserMinus, Video, Music } from 'lucide-react';
import {
  checkPodcasterProfile,
  getPodcasterMe,
  updatePodcasterProfile,
  becomePodcaster,
  deactivatePodcasterProfile,
  reactivatePodcasterProfile,
  uploadPodcasterMedia,
  type PodcasterProfile
} from '../../api/podcasterDashboard';
import { getUserRole } from '../../utils/auth';
import './PodcasterProfilePage.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// Helper pour construire les URLs de médias (gère les URLs Supabase, locales et statiques)
function getMediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  // URLs complètes (Supabase, etc.) → retourner telles quelles
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // URLs relatives du backend → préfixer avec BACKEND_URL
  return BACKEND_URL + url
}

function PodcasterProfilePage() {
  const userRole = getUserRole();
  const isAdminOrSuperAdmin = userRole === 'admin' || userRole === 'super_admin';

  const [podcaster, setPodcaster] = useState<PodcasterProfile | null>(null);
  const [hasPodcasterProfile, setHasPodcasterProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Formulaire profil existant
  const [description, setDescription] = useState('');
  const [profileOnline, setProfileOnline] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Formulaire devenir podcaster
  const [wantToBePodcaster, setWantToBePodcaster] = useState(false);
  const [newName, setNewName] = useState('');
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [newAudioFile, setNewAudioFile] = useState<File | null>(null);

  // Formulaire upload media (pour podcaster sans fichiers)
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const newVideoInputRef = useRef<HTMLInputElement>(null);
  const newAudioInputRef = useRef<HTMLInputElement>(null);

  // Compter les mots
  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > 450;

  async function loadProfile() {
    try {
      setError(null);
      setLoading(true);

      if (isAdminOrSuperAdmin) {
        // Pour les admins, d'abord vérifier s'ils ont un profil podcaster
        const checkResult = await checkPodcasterProfile();
        setHasPodcasterProfile(checkResult.hasPodcasterProfile);

        if (checkResult.hasPodcasterProfile && checkResult.podcaster) {
          setPodcaster(checkResult.podcaster);
          setDescription(checkResult.podcaster.description || '');
          setProfileOnline(checkResult.podcaster.profile_online || false);
          if (checkResult.podcaster.photo_url) {
            setPhotoPreview(getMediaUrl(checkResult.podcaster.photo_url));
          }
        }
      } else {
        // Pour les podcasters normaux
        const data = await getPodcasterMe();
        setPodcaster(data.podcaster);
        setHasPodcasterProfile(true);
        setDescription(data.podcaster.description || '');
        setProfileOnline(data.podcaster.profile_online || false);
        if (data.podcaster.photo_url) {
          setPhotoPreview(getMediaUrl(data.podcaster.photo_url));
        }
      }
    } catch (err: any) {
      console.error('Erreur chargement profil:', err);
      if (isAdminOrSuperAdmin) {
        // Si l'admin n'a pas de profil podcaster, c'est normal
        setHasPodcasterProfile(false);
      } else {
        setError('Impossible de charger votre profil.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSave() {
    if (isOverLimit) {
      setError('La description ne peut pas depasser 450 mots.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updatedPodcaster = await updatePodcasterProfile({
        photo: photoFile || undefined,
        description,
        profile_online: profileOnline
      });

      setPodcaster(updatedPodcaster);
      setPhotoFile(null);
      if (updatedPodcaster.photo_url) {
        setPhotoPreview(getMediaUrl(updatedPodcaster.photo_url));
      }
      setSuccess('Profil mis a jour avec succes !');
    } catch (err: any) {
      console.error('Erreur sauvegarde profil:', err);
      setError(err?.response?.data?.message || 'Impossible de sauvegarder le profil.');
    } finally {
      setSaving(false);
    }
  }

  async function handleBecomePodcaster() {
    if (!newName.trim()) {
      setError('Le nom est obligatoire.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await becomePodcaster({
        name: newName.trim(),
        video: newVideoFile || undefined,
        audio: newAudioFile || undefined
      });

      setPodcaster(result.podcaster);
      setHasPodcasterProfile(true);
      setWantToBePodcaster(false);
      setNewName('');
      setNewVideoFile(null);
      setNewAudioFile(null);
      setSuccess('Vous etes maintenant podcaster !');
    } catch (err: any) {
      console.error('Erreur becomePodcaster:', err);
      setError(err?.response?.data?.message || 'Impossible de creer le profil podcaster.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!confirm('Etes-vous sur de vouloir desactiver votre profil podcaster ?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await deactivatePodcasterProfile();
      setPodcaster(result.podcaster);
      setSuccess('Profil podcaster desactive.');
    } catch (err: any) {
      console.error('Erreur deactivatePodcaster:', err);
      setError(err?.response?.data?.message || 'Impossible de desactiver le profil.');
    } finally {
      setSaving(false);
    }
  }

  async function handleReactivate() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await reactivatePodcasterProfile();
      setPodcaster(result.podcaster);
      setSuccess('Profil podcaster reactive !');
    } catch (err: any) {
      console.error('Erreur reactivatePodcaster:', err);
      setError(err?.response?.data?.message || 'Impossible de reactiver le profil.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadMedia() {
    if (!videoFile && !audioFile) {
      setError('Selectionnez au moins un fichier.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await uploadPodcasterMedia({
        video: videoFile || undefined,
        audio: audioFile || undefined
      });

      setPodcaster(result.podcaster);
      setVideoFile(null);
      setAudioFile(null);
      if (videoInputRef.current) videoInputRef.current.value = '';
      if (audioInputRef.current) audioInputRef.current.value = '';
      setSuccess('Fichiers mis a jour !');
    } catch (err: any) {
      console.error('Erreur uploadMedia:', err);
      setError(err?.response?.data?.message || 'Impossible de mettre a jour les fichiers.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="pcp-dashboard">
        <div className="pcp-dashboard-inner">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  // Cas 1: Admin/Super admin sans profil podcaster
  if (isAdminOrSuperAdmin && !hasPodcasterProfile) {
    return (
      <div className="pcp-dashboard">
        <div className="pcp-dashboard-inner">
          <h2 className="pcp-dashboard-title">Mon Profil Equipe</h2>
          <p className="pcp-dashboard-subtitle">
            Vous n'avez pas encore de profil podcaster.
          </p>

          {error && <p className="pcp-error">{error}</p>}
          {success && <p className="pcp-success">{success}</p>}

          <div className="pcp-become-section">
            <label className="pcp-checkbox-label pcp-checkbox-label--large">
              <input
                type="checkbox"
                checked={wantToBePodcaster}
                onChange={(e) => setWantToBePodcaster(e.target.checked)}
              />
              <span className="pcp-checkbox-text">
                <UserPlus size={20} />
                Devenir podcaster
              </span>
            </label>

            {wantToBePodcaster && (
              <div className="pcp-form pcp-become-form">
                <div className="pcp-field">
                  <label className="pcp-label">Votre nom de podcaster *</label>
                  <input
                    type="text"
                    className="pcp-input"
                    placeholder="Ex: DJ Karim"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                <div className="pcp-field">
                  <label className="pcp-label">
                    <Video size={16} /> Video de presentation (optionnel)
                  </label>
                  <div className="pcp-file-input">
                    <input
                      ref={newVideoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/ogg"
                      onChange={(e) => setNewVideoFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <p className="pcp-hint">Formats: MP4, WebM, OGG (max 100 MB)</p>
                </div>

                <div className="pcp-field">
                  <label className="pcp-label">
                    <Music size={16} /> Audio de presentation (optionnel)
                  </label>
                  <div className="pcp-file-input">
                    <input
                      ref={newAudioInputRef}
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
                      onChange={(e) => setNewAudioFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <p className="pcp-hint">Formats: MP3, WAV, OGG (max 100 MB)</p>
                </div>

                <button
                  type="button"
                  className="pcp-save-btn"
                  onClick={handleBecomePodcaster}
                  disabled={saving || !newName.trim()}
                >
                  <UserPlus size={18} />
                  <span>{saving ? 'Creation...' : 'Creer mon profil podcaster'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Variable pour savoir si le profil podcaster est inactif
  const isPodcasterInactive = !!(podcaster && !podcaster.is_active);

  // Cas 2: Podcaster avec profil (actif ou inactif)
  return (
    <div className="pcp-dashboard">
      <div className="pcp-dashboard-inner">
        <h2 className="pcp-dashboard-title">Mon Profil Equipe</h2>
        <p className="pcp-dashboard-subtitle">
          Gerez votre profil qui sera affiche sur la page equipe du site.
        </p>

        {error && <p className="pcp-error">{error}</p>}
        {success && <p className="pcp-success">{success}</p>}

        {/* Bandeau d'avertissement si profil podcaster inactif */}
        {isPodcasterInactive && (
          <div className="pcp-inactive-banner">
            <p className="pcp-inactive-message">
              Votre profil podcaster est actuellement inactif. Vous n'apparaissez pas sur la page d'accueil
              et ne pouvez pas etre selectionne pour les reservations.
            </p>
            <button
              type="button"
              className="pcp-reactivate-btn-small"
              onClick={handleReactivate}
              disabled={saving}
            >
              <UserPlus size={16} />
              <span>{saving ? 'Reactivation...' : 'Reactiver'}</span>
            </button>
          </div>
        )}

        {/* Section upload video/audio si manquants */}
        {podcaster && (!podcaster.video_url || !podcaster.audio_url) && (
          <div className={`pcp-media-section ${isPodcasterInactive ? 'pcp-media-section--disabled' : ''}`}>
            <h3 className="pcp-section-title">Fichiers de presentation</h3>
            {isPodcasterInactive ? (
              <p className="pcp-hint pcp-hint--warning">
                Votre profil podcaster est inactif. Reactivez-le pour uploader des fichiers video/audio.
              </p>
            ) : (
              <p className="pcp-hint">
                {!podcaster.video_url && !podcaster.audio_url
                  ? 'Vous n\'avez pas encore uploade de video ni d\'audio.'
                  : !podcaster.video_url
                  ? 'Vous n\'avez pas encore uploade de video.'
                  : 'Vous n\'avez pas encore uploade d\'audio.'}
              </p>
            )}

            <div className="pcp-media-form">
              {!podcaster.video_url && (
                <div className="pcp-field">
                  <label className="pcp-label">
                    <Video size={16} /> Video de presentation
                  </label>
                  <div className="pcp-file-input">
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/ogg"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      disabled={isPodcasterInactive}
                    />
                  </div>
                </div>
              )}

              {!podcaster.audio_url && (
                <div className="pcp-field">
                  <label className="pcp-label">
                    <Music size={16} /> Audio de presentation
                  </label>
                  <div className="pcp-file-input">
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      disabled={isPodcasterInactive}
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                className="pcp-upload-btn"
                onClick={handleUploadMedia}
                disabled={saving || isPodcasterInactive || (!videoFile && !audioFile)}
              >
                <Upload size={18} />
                <span>{saving ? 'Upload...' : 'Uploader les fichiers'}</span>
              </button>
            </div>
          </div>
        )}

        <div className="pcp-form">
          {/* Photo */}
          <div className="pcp-photo-section">
            <label className="pcp-label">Photo de profil</label>
            <div className="pcp-photo-container">
              {photoPreview ? (
                <img src={photoPreview} alt="Photo de profil" className="pcp-photo-preview" />
              ) : (
                <div className="pcp-photo-placeholder">
                  <Upload size={32} />
                  <span>Aucune photo</span>
                </div>
              )}
              <button
                type="button"
                className="pcp-photo-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} />
                <span>{photoPreview ? 'Changer' : 'Ajouter'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
            </div>
            <p className="pcp-photo-hint">Formats acceptes: JPG, PNG, WebP</p>
          </div>

          {/* Description */}
          <div className="pcp-field">
            <label className="pcp-label">Description</label>
            <textarea
              className={`pcp-textarea ${isOverLimit ? 'pcp-textarea--error' : ''}`}
              placeholder="Presentez-vous en quelques mots... (max 450 mots)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={10}
            />
            <div className={`pcp-word-count ${isOverLimit ? 'pcp-word-count--error' : ''}`}>
              {wordCount} / 450 mots
            </div>
          </div>

          {/* Profile Online */}
          <div className="pcp-field">
            <label className="pcp-checkbox-label">
              <input
                type="checkbox"
                checked={profileOnline}
                onChange={(e) => setProfileOnline(e.target.checked)}
              />
              <span className="pcp-checkbox-text">
                {profileOnline ? <Eye size={18} /> : <EyeOff size={18} />}
                Mettre mon profil en ligne
              </span>
            </label>
            <p className="pcp-hint">
              {profileOnline
                ? 'Votre profil est visible sur la page equipe du site.'
                : 'Votre profil n\'est pas visible sur le site.'}
            </p>
          </div>

          {/* Save Button */}
          <button
            type="button"
            className="pcp-save-btn"
            onClick={handleSave}
            disabled={saving || isOverLimit}
          >
            <Save size={18} />
            <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </button>
        </div>

        {/* Section desactiver - uniquement si profil actif */}
        {!isPodcasterInactive && (
          <div className="pcp-deactivate-section">
            <hr className="pcp-divider" />
            <label className="pcp-checkbox-label pcp-checkbox-label--danger">
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    handleDeactivate();
                    e.target.checked = false;
                  }
                }}
                disabled={saving}
              />
              <span className="pcp-checkbox-text">
                <UserMinus size={18} />
                Ne plus etre podcaster
              </span>
            </label>
            <p className="pcp-hint pcp-hint--danger">
              Cochez cette case pour desactiver votre profil podcaster. Vous pourrez le reactiver plus tard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PodcasterProfilePage;

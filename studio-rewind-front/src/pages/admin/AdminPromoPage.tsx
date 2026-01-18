// src/pages/admin/AdminPromoPage.tsx
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Ticket,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  Plus,
  MessageSquare,
  Eye,
  EyeOff,
  Percent
} from 'lucide-react';
import {
  getAdminPromoCodes,
  getAdminPromoStats,
  createAdminPromoCode,
  deleteAdminPromoCode,
  getAdminPopups,
  saveAdminPopup,
  deleteAdminPopup,
  toggleAdminPopup,
  type PromoCode,
  type PromoStats,
  type PopupConfig
} from '../../api/adminPromo';
import type { AdminLayoutOutletContext } from '../../layouts/AdminLayout';
import './AdminPromoPage.css';

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function getStatus(code: PromoCode): { label: string; className: string } {
  if (code.used) {
    return { label: 'Utilise', className: 'promo-status--used' };
  }
  if (code.expires_at && new Date(code.expires_at) < new Date()) {
    return { label: 'Expire', className: 'promo-status--expired' };
  }
  return { label: 'Actif', className: 'promo-status--active' };
}

function AdminPromoPage() {
  const { searchQuery } = useOutletContext<AdminLayoutOutletContext>();

  // Etats pour les codes promo
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [stats, setStats] = useState<PromoStats | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Etats pour les popups
  const [popups, setPopups] = useState<PopupConfig[]>([]);
  const [_loadingPopups, setLoadingPopups] = useState(true);

  // Formulaire creation code promo
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState(15);
  const [newPromoValidity, setNewPromoValidity] = useState<string>('');
  const [creatingPromo, setCreatingPromo] = useState(false);

  // Formulaire popup
  const [popupTitle, setPopupTitle] = useState('');
  const [popupSubtitle, setPopupSubtitle] = useState('');
  const [popupText, setPopupText] = useState('');
  const [popupDiscount, setPopupDiscount] = useState(15);
  const [popupCodePrefix, setPopupCodePrefix] = useState('PROMO');
  const [popupValidityDays, setPopupValidityDays] = useState<string>('30');
  const [popupShowOnce, setPopupShowOnce] = useState(true);
  const [popupIsActive, setPopupIsActive] = useState(false);
  const [editingPopupId, setEditingPopupId] = useState<string | null>(null);
  const [savingPopup, setSavingPopup] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setLoadingPopups(true);
      setError(null);

      const [codesData, statsData, popupsData] = await Promise.all([
        getAdminPromoCodes(),
        getAdminPromoStats(),
        getAdminPopups()
      ]);

      setCodes(codesData);
      setStats(statsData);
      setPopups(popupsData);
    } catch (err: any) {
      console.error('Erreur chargement promo:', err);
      setError('Impossible de charger les donnees.');
    } finally {
      setLoading(false);
      setLoadingPopups(false);
    }
  }

  // ============================================================
  // HANDLERS CODES PROMO
  // ============================================================

  async function handleCreatePromo(e: React.FormEvent) {
    e.preventDefault();
    if (!newPromoCode.trim()) {
      alert('Veuillez saisir un code promo.');
      return;
    }
    if (newPromoDiscount < 1 || newPromoDiscount > 100) {
      alert('Le pourcentage doit etre entre 1 et 100.');
      return;
    }

    try {
      setCreatingPromo(true);
      const validityDays = newPromoValidity ? parseInt(newPromoValidity, 10) : null;

      await createAdminPromoCode({
        code: newPromoCode,
        discount: newPromoDiscount,
        validityDays
      });

      // Reset form
      setNewPromoCode('');
      setNewPromoDiscount(15);
      setNewPromoValidity('');

      // Reload data
      const [codesData, statsData] = await Promise.all([
        getAdminPromoCodes(),
        getAdminPromoStats()
      ]);
      setCodes(codesData);
      setStats(statsData);

      alert('Code promo cree avec succes !');
    } catch (err: any) {
      console.error('Erreur creation promo:', err);
      alert(err?.response?.data?.message || 'Erreur lors de la creation.');
    } finally {
      setCreatingPromo(false);
    }
  }

  async function handleDeletePromo(id: string, code: string) {
    const confirm = window.confirm(`Supprimer le code promo "${code}" ?`);
    if (!confirm) return;

    try {
      setDeleting(id);
      await deleteAdminPromoCode(id);
      setCodes(prev => prev.filter(c => c.id !== id));
      const statsData = await getAdminPromoStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Erreur suppression promo:', err);
      alert(err?.response?.data?.message || 'Erreur lors de la suppression.');
    } finally {
      setDeleting(null);
    }
  }

  // ============================================================
  // HANDLERS POPUP
  // ============================================================

  function resetPopupForm() {
    setPopupTitle('');
    setPopupSubtitle('');
    setPopupText('');
    setPopupDiscount(15);
    setPopupCodePrefix('PROMO');
    setPopupValidityDays('30');
    setPopupShowOnce(true);
    setPopupIsActive(false);
    setEditingPopupId(null);
  }

  function handleEditPopup(popup: PopupConfig) {
    setEditingPopupId(popup.id);
    setPopupTitle(popup.title);
    setPopupSubtitle(popup.subtitle || '');
    setPopupText(popup.text || '');
    setPopupDiscount(popup.discount);
    setPopupCodePrefix(popup.code_prefix || 'PROMO');
    setPopupValidityDays(popup.code_validity_days?.toString() || '');
    setPopupShowOnce(popup.show_once);
    setPopupIsActive(popup.is_active);
  }

  async function handleSavePopup(e: React.FormEvent) {
    e.preventDefault();
    if (!popupTitle.trim()) {
      alert('Veuillez saisir un titre.');
      return;
    }
    if (popupDiscount < 1 || popupDiscount > 100) {
      alert('Le pourcentage doit etre entre 1 et 100.');
      return;
    }

    try {
      setSavingPopup(true);

      await saveAdminPopup({
        id: editingPopupId || undefined,
        title: popupTitle,
        subtitle: popupSubtitle || undefined,
        text: popupText || undefined,
        discount: popupDiscount,
        code_prefix: popupCodePrefix || 'PROMO',
        code_validity_days: popupValidityDays ? parseInt(popupValidityDays, 10) : null,
        show_once: popupShowOnce,
        is_active: popupIsActive
      });

      resetPopupForm();

      // Reload popups
      const popupsData = await getAdminPopups();
      setPopups(popupsData);

      alert(editingPopupId ? 'Popup mise a jour !' : 'Popup creee avec succes !');
    } catch (err: any) {
      console.error('Erreur save popup:', err);
      alert(err?.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSavingPopup(false);
    }
  }

  async function handleTogglePopup(id: string, currentActive: boolean) {
    try {
      await toggleAdminPopup(id, !currentActive);
      const popupsData = await getAdminPopups();
      setPopups(popupsData);
    } catch (err: any) {
      console.error('Erreur toggle popup:', err);
      alert(err?.response?.data?.message || 'Erreur lors du changement de statut.');
    }
  }

  async function handleDeletePopup(id: string) {
    const confirm = window.confirm('Supprimer cette popup ?');
    if (!confirm) return;

    try {
      await deleteAdminPopup(id);
      setPopups(prev => prev.filter(p => p.id !== id));
      if (editingPopupId === id) {
        resetPopupForm();
      }
    } catch (err: any) {
      console.error('Erreur suppression popup:', err);
      alert(err?.response?.data?.message || 'Erreur lors de la suppression.');
    }
  }

  // Filtrage par recherche
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCodes = !normalizedQuery
    ? codes
    : codes.filter(code => {
        const haystack = [
          code.code,
          code.email,
          formatDate(code.createdAt),
          getStatus(code).label
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      });

  return (
    <div className="sr-page">
      <div className="sr-page-header">
        <div>
          <h2 className="sr-page-title">Promotions</h2>
          <p className="sr-page-subtitle">
            Gestion des codes promo et de la popup promotionnelle
          </p>
        </div>
      </div>

      {error && <p className="sr-page-error">{error}</p>}

      <div className="sr-page-body">
        {loading ? (
          <div className="promo-loading">Chargement...</div>
        ) : (
          <>
            {/* Section Creation */}
            <div className="promo-creation-section">
              {/* Card Creer une promotion */}
              <div className="sr-card promo-form-card">
                <h3 className="promo-form-title">
                  <Plus size={20} />
                  Creer une promotion
                </h3>
                <p className="promo-form-subtitle">
                  Creez un code promo utilisable dans le tunnel de reservation
                </p>
                <form onSubmit={handleCreatePromo}>
                  <div className="field">
                    <label className="label">Code promo</label>
                    <div className="control">
                      <input
                        className="input"
                        type="text"
                        placeholder="Ex: SUMMER2024"
                        value={newPromoCode}
                        onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                        maxLength={20}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Reduction (%)</label>
                    <div className="control">
                      <input
                        className="input"
                        type="number"
                        min={1}
                        max={100}
                        value={newPromoDiscount}
                        onChange={(e) => setNewPromoDiscount(parseInt(e.target.value, 10) || 0)}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Validite (jours)</label>
                    <div className="control">
                      <input
                        className="input"
                        type="number"
                        min={1}
                        placeholder="Laisser vide = sans expiration"
                        value={newPromoValidity}
                        onChange={(e) => setNewPromoValidity(e.target.value)}
                      />
                    </div>
                    <p className="help">Laisser vide pour une validite illimitee</p>
                  </div>

                  <button
                    className="button is-primary is-fullwidth"
                    type="submit"
                    disabled={creatingPromo}
                  >
                    {creatingPromo ? 'Creation...' : 'Creer le code promo'}
                  </button>
                </form>
              </div>

              {/* Card Configurer la popup */}
              <div className="sr-card promo-form-card">
                <h3 className="promo-form-title">
                  <MessageSquare size={20} />
                  {editingPopupId ? 'Modifier la popup' : 'Creer une popup'}
                </h3>
                <p className="promo-form-subtitle">
                  Configurez la popup affichee aux nouveaux visiteurs
                </p>
                <form onSubmit={handleSavePopup}>
                  <div className="field">
                    <label className="label">Titre *</label>
                    <div className="control">
                      <input
                        className="input"
                        type="text"
                        placeholder="Ex: Offre de lancement"
                        value={popupTitle}
                        onChange={(e) => setPopupTitle(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Sous-titre</label>
                    <div className="control">
                      <input
                        className="input"
                        type="text"
                        placeholder="Ex: Bienvenue chez Studio Rewind"
                        value={popupSubtitle}
                        onChange={(e) => setPopupSubtitle(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Texte</label>
                    <div className="control">
                      <textarea
                        className="textarea"
                        rows={2}
                        placeholder="Texte descriptif de l'offre..."
                        value={popupText}
                        onChange={(e) => setPopupText(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="columns is-mobile">
                    <div className="column">
                      <div className="field">
                        <label className="label">Reduction (%)</label>
                        <div className="control">
                          <input
                            className="input"
                            type="number"
                            min={1}
                            max={100}
                            value={popupDiscount}
                            onChange={(e) => setPopupDiscount(parseInt(e.target.value, 10) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="column">
                      <div className="field">
                        <label className="label">Prefixe code</label>
                        <div className="control">
                          <input
                            className="input"
                            type="text"
                            placeholder="PROMO"
                            value={popupCodePrefix}
                            onChange={(e) => setPopupCodePrefix(e.target.value.toUpperCase())}
                            maxLength={10}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Validite des codes (jours)</label>
                    <div className="control">
                      <input
                        className="input"
                        type="number"
                        min={1}
                        placeholder="30"
                        value={popupValidityDays}
                        onChange={(e) => setPopupValidityDays(e.target.value)}
                      />
                    </div>
                    <p className="help">Laisser vide = sans expiration</p>
                  </div>

                  <div className="field">
                    <label className="checkbox promo-checkbox">
                      <input
                        type="checkbox"
                        checked={popupShowOnce}
                        onChange={(e) => setPopupShowOnce(e.target.checked)}
                      />
                      <span>Afficher une seule fois par visiteur</span>
                    </label>
                  </div>

                  <div className="field">
                    <label className="checkbox promo-checkbox">
                      <input
                        type="checkbox"
                        checked={popupIsActive}
                        onChange={(e) => setPopupIsActive(e.target.checked)}
                      />
                      <span>Activer cette popup</span>
                    </label>
                  </div>

                  <div className="buttons">
                    <button
                      className="button is-primary"
                      type="submit"
                      disabled={savingPopup}
                    >
                      {savingPopup ? 'Sauvegarde...' : (editingPopupId ? 'Mettre a jour' : 'Creer la popup')}
                    </button>
                    {editingPopupId && (
                      <button
                        className="button"
                        type="button"
                        onClick={resetPopupForm}
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Liste des popups existantes */}
            {popups.length > 0 && (
              <div className="sr-card" style={{ marginBottom: '1.5rem' }}>
                <h3 className="promo-table-title">Popups configurees</h3>
                <div className="promo-popups-list">
                  {popups.map((popup) => (
                    <div key={popup.id} className={`promo-popup-item ${popup.is_active ? 'promo-popup-item--active' : ''}`}>
                      <div className="promo-popup-info">
                        <div className="promo-popup-header">
                          <strong>{popup.title}</strong>
                          {popup.is_active && (
                            <span className="promo-status promo-status--active">Active</span>
                          )}
                        </div>
                        {popup.subtitle && <p className="promo-popup-subtitle">{popup.subtitle}</p>}
                        <div className="promo-popup-meta">
                          <span><Percent size={14} /> {popup.discount}%</span>
                          <span>Prefixe: {popup.code_prefix}</span>
                          <span>{popup.show_once ? 'Une fois' : 'Chaque visite'}</span>
                        </div>
                      </div>
                      <div className="promo-popup-actions">
                        <button
                          className="button is-small"
                          onClick={() => handleTogglePopup(popup.id, popup.is_active)}
                          title={popup.is_active ? 'Desactiver' : 'Activer'}
                        >
                          {popup.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          className="button is-small is-info"
                          onClick={() => handleEditPopup(popup)}
                          title="Modifier"
                        >
                          Modifier
                        </button>
                        <button
                          className="button is-small is-danger"
                          onClick={() => handleDeletePopup(popup.id)}
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cards statistiques */}
            <div className="promo-summary-cards">
              <div className="promo-card">
                <div className="promo-card-icon">
                  <Ticket size={24} />
                </div>
                <div className="promo-card-content">
                  <span className="promo-card-value">{stats?.total ?? 0}</span>
                  <span className="promo-card-label">Total</span>
                </div>
              </div>
              <div className="promo-card promo-card--active">
                <div className="promo-card-icon">
                  <Clock size={24} />
                </div>
                <div className="promo-card-content">
                  <span className="promo-card-value">{stats?.active ?? 0}</span>
                  <span className="promo-card-label">Actifs</span>
                </div>
              </div>
              <div className="promo-card promo-card--used">
                <div className="promo-card-icon">
                  <CheckCircle size={24} />
                </div>
                <div className="promo-card-content">
                  <span className="promo-card-value">{stats?.used ?? 0}</span>
                  <span className="promo-card-label">Utilises</span>
                </div>
              </div>
              <div className="promo-card promo-card--expired">
                <div className="promo-card-icon">
                  <XCircle size={24} />
                </div>
                <div className="promo-card-content">
                  <span className="promo-card-value">{stats?.expired ?? 0}</span>
                  <span className="promo-card-label">Expires</span>
                </div>
              </div>
            </div>

            {/* Liste des codes */}
            <div className="sr-card">
              <h3 className="promo-table-title">Liste des codes promo</h3>
              {filteredCodes.length === 0 ? (
                <p className="promo-no-data">Aucun code promo.</p>
              ) : (
                <div className="promo-table-container">
                  <table className="promo-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Email</th>
                        <th className="text-center">Reduction</th>
                        <th className="text-center">Statut</th>
                        <th>Cree le</th>
                        <th>Expire le</th>
                        <th>Utilise le</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCodes.map((code) => {
                        const status = getStatus(code);
                        const isManual = code.email === 'manual@admin.local';
                        return (
                          <tr key={code.id}>
                            <td className="promo-code-cell">{code.code}</td>
                            <td className="promo-email-cell">
                              {isManual ? <em className="has-text-grey">Manuel</em> : code.email}
                            </td>
                            <td className="text-center">{code.discount}%</td>
                            <td className="text-center">
                              <span className={`promo-status ${status.className}`}>
                                {status.label}
                              </span>
                            </td>
                            <td>{formatDate(code.createdAt)}</td>
                            <td>{formatDate(code.expires_at)}</td>
                            <td>{formatDate(code.used_at)}</td>
                            <td className="text-center">
                              <button
                                className="promo-delete-btn"
                                onClick={() => handleDeletePromo(code.id, code.code)}
                                disabled={deleting === code.id}
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPromoPage;

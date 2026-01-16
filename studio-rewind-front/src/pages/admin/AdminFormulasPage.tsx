import { Fragment, useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  // Icônes pour les formules
  FilePlay,
  User,
  Users,
  Scissors,
  Video,
  Mic,
  Mic2,
  Headphones,
  Camera,
  Film,
  Music,
  Music2,
  Play,
  Star,
  Award,
  Circle,
  Clock,
  Calendar,
  CalendarCheck,
  CheckCircle,
  CheckCircle2,
  Settings,
  Settings2,
  Sliders,
  SlidersHorizontal,
  Wand2,
  Sparkles,
  Zap,
  Rocket,
  Target,
  TrendingUp,
  BarChart,
  PieChart,
  Activity,
  Heart,
  ThumbsUp,
  MessageCircle,
  MessageSquare,
  Mail,
  Send,
  Share2,
  Download,
  Upload,
  Cloud,
  Database,
  Server,
  Wifi,
  Globe,
  Link,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  Key,
  Fingerprint,
  UserCheck,
  UserPlus,
  Crown,
  Gift,
  Package,
  Box,
  Archive,
  Folder,
  FolderOpen,
  File,
  FileText,
  FileVideo,
  FileAudio,
  Image,
  Images,
  Palette,
  Brush,
  PenTool,
  Pencil,
  Highlighter,
  Type,
  Bold,
  Italic,
  List,
  ListChecks,
  ClipboardList,
  ClipboardCheck,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Lamp,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Radio,
  Tv,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Speaker,
  Disc,
  PlayCircle,
  PauseCircle,
  StopCircle,
  SkipForward,
  SkipBack,
  FastForward,
  Rewind,
  Repeat,
  Shuffle,
  Podcast,
  Rss,
  Clapperboard,
  MonitorPlay,
  type LucideIcon
} from 'lucide-react';
import {
  type PublicFormula,
  type FormulaOption,
  getAdminFormulas,
  updateAdminFormula,
  createFormulaOption,
  updateFormulaOption,
  deleteFormulaOption
} from '../../api/formulas';

// Map des icônes disponibles (groupées par catégorie pour faciliter la recherche)
const iconMap: Record<string, LucideIcon> = {
  // Média & Audio
  FilePlay,
  Video,
  Film,
  Clapperboard,
  MonitorPlay,
  Camera,
  Mic,
  Mic2,
  Headphones,
  Music,
  Music2,
  Radio,
  Podcast,
  Rss,
  Speaker,
  Volume2,
  VolumeX,
  Disc,
  Play,
  PlayCircle,
  PauseCircle,
  StopCircle,
  SkipForward,
  SkipBack,
  FastForward,
  Rewind,
  Repeat,
  Shuffle,
  Tv,
  Monitor,

  // Édition & Création
  Scissors,
  Wand2,
  Sparkles,
  Palette,
  Brush,
  PenTool,
  Pencil,
  Highlighter,
  Type,
  Bold,
  Italic,

  // Utilisateurs
  User,
  Users,
  UserCheck,
  UserPlus,
  Crown,

  // Succès & Validation
  Star,
  Award,
  CheckCircle,
  CheckCircle2,
  ThumbsUp,
  Heart,
  Target,
  Trophy: Award,

  // Temps & Planning
  Clock,
  Calendar,
  CalendarCheck,

  // Paramètres
  Settings,
  Settings2,
  Sliders,
  SlidersHorizontal,

  // Performance
  Zap,
  Rocket,
  TrendingUp,
  BarChart,
  PieChart,
  Activity,

  // Communication
  MessageCircle,
  MessageSquare,
  Mail,
  Send,
  Share2,

  // Fichiers
  File,
  FileText,
  FileVideo,
  FileAudio,
  Image,
  Images,
  Folder,
  FolderOpen,
  Archive,
  Package,
  Box,

  // Documents
  List,
  ListChecks,
  ClipboardList,
  ClipboardCheck,
  BookOpen,

  // Apprentissage
  GraduationCap,
  Lightbulb,
  Lamp,

  // Sécurité
  Lock,
  Unlock,
  Shield,
  Key,
  Fingerprint,
  Eye,
  EyeOff,

  // Tech & Cloud
  Download,
  Upload,
  Cloud,
  Database,
  Server,
  Wifi,
  Globe,
  Link,
  ExternalLink,

  // Devices
  Smartphone,
  Tablet,
  Laptop,

  // Divers
  Gift,
  Sun,
  Moon,
  Circle
};

const AVAILABLE_ICONS = Object.keys(iconMap);

// Composant sélecteur d'icône visuel
function IconPicker({
  value,
  onChange,
  disabled
}: {
  value: string;
  onChange: (icon: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const CurrentIcon = iconMap[value] || Circle;

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'var(--sr-color-surface)',
          border: '1px solid var(--sr-color-border-subtle)',
          borderRadius: 'var(--sr-radius-md)',
          color: 'var(--sr-color-text)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minWidth: '120px'
        }}
      >
        <CurrentIcon size={16} />
        <span style={{ fontSize: '0.8rem' }}>{value}</span>
        <ChevronDown size={14} style={{ marginLeft: 'auto' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 100,
            marginTop: '4px',
            padding: '8px',
            background: 'var(--sr-color-surface)',
            border: '1px solid var(--sr-color-border-subtle)',
            borderRadius: 'var(--sr-radius-md)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            maxHeight: '250px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '4px',
            width: '320px'
          }}
        >
          {AVAILABLE_ICONS.map((iconName) => {
            const Icon = iconMap[iconName];
            const isSelected = value === iconName;
            return (
              <button
                key={iconName}
                type="button"
                title={iconName}
                onClick={() => {
                  onChange(iconName);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  background: isSelected
                    ? 'var(--sr-color-accent-soft)'
                    : 'transparent',
                  border: isSelected
                    ? '1px solid var(--sr-color-accent)'
                    : '1px solid transparent',
                  borderRadius: 'var(--sr-radius-sm)',
                  color: isSelected
                    ? 'var(--sr-color-accent)'
                    : 'var(--sr-color-text)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--sr-color-surface-soft)';
                    e.currentTarget.style.borderColor = 'var(--sr-color-border-subtle)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminFormulasPage() {
  const [formulas, setFormulas] = useState<PublicFormula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);

  // Gestion des options
  const [expandedFormulaId, setExpandedFormulaId] = useState<string | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editOptionIcon, setEditOptionIcon] = useState('');
  const [editOptionContent, setEditOptionContent] = useState('');
  const [newOptionIcon, setNewOptionIcon] = useState('Circle');
  const [newOptionContent, setNewOptionContent] = useState('');
  const [savingOption, setSavingOption] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        setLoading(true);
        const data = await getAdminFormulas();
        // Trier par prix croissant
        data.sort((a, b) => a.price_ttc - b.price_ttc);
        setFormulas(data);
      } catch (err: any) {
        console.error('Erreur getAdminFormulas:', err);
        const message =
          err?.response?.data?.message ||
          "Impossible de charger les formules.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function getBillingLabel(f: PublicFormula) {
    return f.billing_type === 'subscription' ? 'Forfait' : 'À l\'heure';
  }

  function getKeyLabel(key: string) {
    switch (key) {
      case 'solo':
        return 'Solo';
      case 'duo':
        return 'Duo';
      case 'pro':
        return 'Pro';
      default:
        return key;
    }
  }

  function startEdit(f: PublicFormula) {
    setEditingId(f.id);
    setEditName(f.name);
    setEditPrice(String(f.price_ttc));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditPrice('');
  }

  async function handleSave(f: PublicFormula) {
    const newName = editName.trim();
    const newPrice = parseFloat(editPrice);

    if (!newName) {
      setError('Le nom ne peut pas être vide.');
      return;
    }
    if (isNaN(newPrice) || newPrice < 0) {
      setError('Le prix doit être un nombre positif.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updated = await updateAdminFormula(f.id, {
        name: newName,
        price_ttc: newPrice
      });
      setFormulas((prev) =>
        prev
          .map((x) => (x.id === updated.id ? updated : x))
          .sort((a, b) => a.price_ttc - b.price_ttc)
      );
      cancelEdit();
    } catch (err: any) {
      console.error('Erreur updateAdminFormula:', err);
      const message =
        err?.response?.data?.message ||
        "Impossible de mettre à jour la formule.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleRequiresPodcaster(f: PublicFormula) {
    try {
      setError(null);
      const updated = await updateAdminFormula(f.id, {
        requires_podcaster: !f.requires_podcaster
      });
      setFormulas((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : x))
      );
    } catch (err: any) {
      console.error('Erreur toggle requires_podcaster:', err);
      const message =
        err?.response?.data?.message ||
        "Impossible de modifier l'option podcasteur.";
      setError(message);
    }
  }

  // === Gestion des options ===

  function toggleExpandFormula(formulaId: string) {
    setExpandedFormulaId((prev) => (prev === formulaId ? null : formulaId));
    // Reset l'édition d'option quand on change de formule
    setEditingOptionId(null);
    setNewOptionContent('');
    setNewOptionIcon('Circle');
  }

  function startEditOption(option: FormulaOption) {
    setEditingOptionId(option.id);
    setEditOptionIcon(option.icon);
    setEditOptionContent(option.content);
  }

  function cancelEditOption() {
    setEditingOptionId(null);
    setEditOptionIcon('');
    setEditOptionContent('');
  }

  async function handleSaveOption(option: FormulaOption) {
    const content = editOptionContent.trim();
    if (!content) {
      setError('Le contenu de l\'option ne peut pas être vide.');
      return;
    }

    try {
      setSavingOption(true);
      setError(null);
      const updated = await updateFormulaOption(option.id, {
        icon: editOptionIcon,
        content
      });

      // Mettre à jour localement
      setFormulas((prev) =>
        prev.map((f) => {
          if (f.id !== option.formula_id) return f;
          return {
            ...f,
            options: f.options?.map((o) =>
              o.id === updated.id ? updated : o
            )
          };
        })
      );
      cancelEditOption();
    } catch (err: any) {
      console.error('Erreur updateFormulaOption:', err);
      const message =
        err?.response?.data?.message || "Impossible de modifier l'option.";
      setError(message);
    } finally {
      setSavingOption(false);
    }
  }

  async function handleDeleteOption(option: FormulaOption) {
    if (!confirm('Supprimer cette option ?')) return;

    try {
      setSavingOption(true);
      setError(null);
      await deleteFormulaOption(option.id);

      // Mettre à jour localement
      setFormulas((prev) =>
        prev.map((f) => {
          if (f.id !== option.formula_id) return f;
          return {
            ...f,
            options: f.options?.filter((o) => o.id !== option.id)
          };
        })
      );
    } catch (err: any) {
      console.error('Erreur deleteFormulaOption:', err);
      const message =
        err?.response?.data?.message || "Impossible de supprimer l'option.";
      setError(message);
    } finally {
      setSavingOption(false);
    }
  }

  async function handleAddOption(formulaId: string) {
    const content = newOptionContent.trim();
    if (!content) {
      setError('Le contenu de l\'option ne peut pas être vide.');
      return;
    }

    try {
      setSavingOption(true);
      setError(null);

      // Calculer le display_order
      const formula = formulas.find((f) => f.id === formulaId);
      const maxOrder = formula?.options?.reduce(
        (max, o) => Math.max(max, o.display_order),
        -1
      ) ?? -1;

      const created = await createFormulaOption(formulaId, {
        icon: newOptionIcon,
        content,
        display_order: maxOrder + 1
      });

      // Mettre à jour localement
      setFormulas((prev) =>
        prev.map((f) => {
          if (f.id !== formulaId) return f;
          return {
            ...f,
            options: [...(f.options || []), created]
          };
        })
      );

      // Reset le formulaire
      setNewOptionContent('');
      setNewOptionIcon('Circle');
    } catch (err: any) {
      console.error('Erreur createFormulaOption:', err);
      const message =
        err?.response?.data?.message || "Impossible de créer l'option.";
      setError(message);
    } finally {
      setSavingOption(false);
    }
  }

  function getIcon(iconName: string): LucideIcon {
    return iconMap[iconName] || Circle;
  }

  return (
    <div className="sr-page">
      <div className="sr-page-header">
        <div>
          <h2 className="sr-page-title">Formules</h2>
          <p className="sr-page-subtitle">
            Gère les noms et prix des formules affichées sur le site.
          </p>
        </div>
        <div className="sr-section-meta">
          {formulas.length > 0 && (
            <span className="sr-chip">
              {formulas.length} formule{formulas.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {error && <p className="sr-page-error">{error}</p>}

      <div className="sr-page-body">
        <div className="sr-card">
          {loading && <p>Chargement des formules...</p>}

          {!loading && !error && formulas.length === 0 && (
            <p>Aucune formule trouvée.</p>
          )}

          {!loading && formulas.length > 0 && (
            <table className="table is-fullwidth is-striped is-hoverable">
              <thead>
                <tr>
                  <th>Clé</th>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Prix HT</th>
                  <th>Podcasteur</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {formulas.map((f) => {
                  const isEditing = editingId === f.id;
                  const isExpanded = expandedFormulaId === f.id;
                  const options = f.options || [];
                  const sortedOptions = [...options].sort(
                    (a, b) => a.display_order - b.display_order
                  );

                  return (
                    <Fragment key={f.id}>
                      <tr>
                        <td>
                          <code>{getKeyLabel(f.key)}</code>
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              className="input is-small"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              disabled={saving}
                            />
                          ) : (
                            f.name
                          )}
                        </td>
                        <td>{getBillingLabel(f)}</td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              className="input is-small"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              disabled={saving}
                              min="0"
                              step="0.01"
                              style={{ width: '100px' }}
                            />
                          ) : (
                            `${f.price_ttc.toFixed(2).replace('.', ',')}€`
                          )}
                        </td>
                        <td>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={f.requires_podcaster ?? true}
                              onChange={() => handleToggleRequiresPodcaster(f)}
                              disabled={isEditing}
                            />
                            <span style={{ fontSize: '0.85rem', color: 'var(--sr-color-text-muted)' }}>
                              {f.requires_podcaster ?? true ? 'Requis' : 'Non requis'}
                            </span>
                          </label>
                        </td>
                        <td>
                          <div className="buttons are-small">
                            {isEditing ? (
                              <>
                                <button
                                  className="button is-success"
                                  disabled={saving}
                                  onClick={() => handleSave(f)}
                                >
                                  {saving ? '...' : 'Enregistrer'}
                                </button>
                                <button
                                  className="button"
                                  disabled={saving}
                                  onClick={cancelEdit}
                                >
                                  Annuler
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="button is-info"
                                  onClick={() => startEdit(f)}
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  className="button"
                                  onClick={() => toggleExpandFormula(f.id)}
                                  title="Gérer les options"
                                >
                                  {isExpanded ? (
                                    <ChevronUp size={14} />
                                  ) : (
                                    <ChevronDown size={14} />
                                  )}
                                  <span style={{ marginLeft: '4px' }}>
                                    Options ({options.length})
                                  </span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Options de la formule */}
                      {isExpanded && (
                        <tr key={`${f.id}-options`}>
                          <td colSpan={6} style={{ background: 'var(--sr-color-surface)', borderRadius: 'var(--sr-radius-md)' }}>
                            <div style={{ padding: '1rem' }}>
                              <h4 style={{ marginBottom: '1rem', color: 'var(--sr-color-heading)' }}>
                                Options de la formule "{f.name}"
                              </h4>

                              {/* Liste des options existantes */}
                              {sortedOptions.length > 0 && (
                                <table
                                  className="table is-fullwidth is-narrow"
                                  style={{ marginBottom: '1rem', background: 'transparent' }}
                                >
                                  <thead>
                                    <tr>
                                      <th style={{ width: '120px' }}>Icône</th>
                                      <th>Contenu</th>
                                      <th style={{ width: '150px' }}></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sortedOptions.map((opt) => {
                                      const isEditingOpt =
                                        editingOptionId === opt.id;
                                      const IconComponent = getIcon(opt.icon);

                                      return (
                                        <tr key={opt.id}>
                                          <td>
                                            {isEditingOpt ? (
                                              <IconPicker
                                                value={editOptionIcon}
                                                onChange={setEditOptionIcon}
                                                disabled={savingOption}
                                              />
                                            ) : (
                                              <span
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '8px'
                                                }}
                                              >
                                                <IconComponent size={16} />
                                              </span>
                                            )}
                                          </td>
                                          <td>
                                            {isEditingOpt ? (
                                              <input
                                                type="text"
                                                className="input is-small"
                                                value={editOptionContent}
                                                onChange={(e) =>
                                                  setEditOptionContent(
                                                    e.target.value
                                                  )
                                                }
                                                disabled={savingOption}
                                              />
                                            ) : (
                                              opt.content
                                            )}
                                          </td>
                                          <td>
                                            <div className="buttons are-small">
                                              {isEditingOpt ? (
                                                <>
                                                  <button
                                                    className="button is-success is-small"
                                                    disabled={savingOption}
                                                    onClick={() =>
                                                      handleSaveOption(opt)
                                                    }
                                                  >
                                                    <Check size={14} />
                                                  </button>
                                                  <button
                                                    className="button is-small"
                                                    disabled={savingOption}
                                                    onClick={cancelEditOption}
                                                  >
                                                    <X size={14} />
                                                  </button>
                                                </>
                                              ) : (
                                                <>
                                                  <button
                                                    className="button is-info is-small"
                                                    onClick={() =>
                                                      startEditOption(opt)
                                                    }
                                                  >
                                                    <Edit size={14} />
                                                  </button>
                                                  <button
                                                    className="button is-danger is-small"
                                                    onClick={() =>
                                                      handleDeleteOption(opt)
                                                    }
                                                  >
                                                    <Trash2 size={14} />
                                                  </button>
                                                </>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              )}

                              {sortedOptions.length === 0 && (
                                <p style={{ marginBottom: '1rem', color: 'var(--sr-color-text-muted)' }}>
                                  Aucune option pour cette formule.
                                </p>
                              )}

                              {/* Formulaire d'ajout */}
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '0.5rem',
                                  alignItems: 'flex-end',
                                  flexWrap: 'wrap'
                                }}
                              >
                                <div>
                                  <label className="label is-small" style={{ color: 'var(--sr-color-text-muted)' }}>Icône</label>
                                  <IconPicker
                                    value={newOptionIcon}
                                    onChange={setNewOptionIcon}
                                    disabled={savingOption}
                                  />
                                </div>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                  <label className="label is-small" style={{ color: 'var(--sr-color-text-muted)' }}>
                                    Contenu
                                  </label>
                                  <input
                                    type="text"
                                    className="input is-small"
                                    placeholder="Ex: Accès au studio 1h"
                                    value={newOptionContent}
                                    onChange={(e) =>
                                      setNewOptionContent(e.target.value)
                                    }
                                    disabled={savingOption}
                                  />
                                </div>
                                <button
                                  className="button is-primary is-small"
                                  onClick={() => handleAddOption(f.id)}
                                  disabled={savingOption || !newOptionContent.trim()}
                                >
                                  <Plus size={14} />
                                  <span style={{ marginLeft: '4px' }}>
                                    Ajouter
                                  </span>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminFormulasPage;

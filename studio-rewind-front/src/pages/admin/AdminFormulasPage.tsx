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
  createAdminFormula,
  updateAdminFormula,
  deleteAdminFormula,
  uploadFormulaImage,
  deleteFormulaImage,
  createFormulaOption,
  updateFormulaOption,
  deleteFormulaOption
} from '../../api/formulas';

// Fonction utilitaire pour convertir hex en rgb
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return hex;
}

// Fonction utilitaire pour convertir rgb en hex
function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return rgb;
}

// Helper pour construire l'URL complète des images uploadées
function getImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('/uploads/')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';
    const backendBase = apiBase.replace(/\/api$/, '');
    return `${backendBase}${imageUrl}`;
  }
  return imageUrl;
}

// Composant ColorPicker simple
function ColorPicker({
  label,
  value,
  onChange,
  disabled
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}) {
  const hexValue = rgbToHex(value);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={{ fontSize: '0.8rem', color: 'var(--sr-color-text-muted)', minWidth: '80px' }}>
        {label}
      </label>
      <input
        type="color"
        value={hexValue}
        onChange={(e) => onChange(hexToRgb(e.target.value))}
        disabled={disabled}
        style={{
          width: '40px',
          height: '30px',
          padding: '0',
          border: '1px solid var(--sr-color-border-subtle)',
          borderRadius: 'var(--sr-radius-sm)',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      />
      <span style={{ fontSize: '0.75rem', color: 'var(--sr-color-text-muted)', fontFamily: 'monospace' }}>
        {value}
      </span>
    </div>
  );
}

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
  const [editDescription, setEditDescription] = useState('');
  const [editBorderStart, setEditBorderStart] = useState('rgb(153, 221, 252)');
  const [editBorderEnd, setEditBorderEnd] = useState('rgb(196, 202, 0)');
  const [editMinHeight, setEditMinHeight] = useState('420');
  const [editDisplayOrder, setEditDisplayOrder] = useState('0');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editRequiresPodcaster, setEditRequiresPodcaster] = useState(true);
  const [saving, setSaving] = useState(false);

  // Gestion de la création
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBillingType, setNewBillingType] = useState<'hourly' | 'subscription'>('hourly');
  const [newBorderStart, setNewBorderStart] = useState('rgb(153, 221, 252)');
  const [newBorderEnd, setNewBorderEnd] = useState('rgb(196, 202, 0)');
  const [newMinHeight, setNewMinHeight] = useState('420');
  const [newDisplayOrder, setNewDisplayOrder] = useState('0');
  const [newRequiresPodcaster, setNewRequiresPodcaster] = useState(true);
  const [creating, setCreating] = useState(false);
  // Options temporaires pour la création
  const [tempOptions, setTempOptions] = useState<Array<{ icon: string; content: string }>>([]);
  const [tempOptionIcon, setTempOptionIcon] = useState('Circle');
  const [tempOptionContent, setTempOptionContent] = useState('');

  // Gestion des options
  const [expandedFormulaId, setExpandedFormulaId] = useState<string | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editOptionIcon, setEditOptionIcon] = useState('');
  const [editOptionContent, setEditOptionContent] = useState('');
  const [newOptionIcon, setNewOptionIcon] = useState('Circle');
  const [newOptionContent, setNewOptionContent] = useState('');
  const [savingOption, setSavingOption] = useState(false);

  // Gestion des images
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        setLoading(true);
        const data = await getAdminFormulas();
        // Trier par display_order puis par prix
        data.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.price_ttc - b.price_ttc);
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

  function startEdit(f: PublicFormula) {
    setEditingId(f.id);
    setEditName(f.name);
    setEditPrice(String(f.price_ttc));
    setEditDescription(f.description || '');
    setEditBorderStart(f.border_start || 'rgb(153, 221, 252)');
    setEditBorderEnd(f.border_end || 'rgb(196, 202, 0)');
    setEditMinHeight(String(f.min_height || 420));
    setEditDisplayOrder(String(f.display_order ?? 0));
    setEditIsActive(f.is_active ?? true);
    setEditRequiresPodcaster(f.requires_podcaster ?? true);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditPrice('');
    setEditDescription('');
    setEditBorderStart('rgb(153, 221, 252)');
    setEditBorderEnd('rgb(196, 202, 0)');
    setEditMinHeight('420');
    setEditDisplayOrder('0');
    setEditIsActive(true);
    setEditRequiresPodcaster(true);
  }

  async function handleSave(f: PublicFormula) {
    const trimmedName = editName.trim();
    const parsedPrice = parseFloat(editPrice);
    const parsedMinHeight = parseInt(editMinHeight);
    const parsedDisplayOrder = parseInt(editDisplayOrder);

    if (!trimmedName) {
      setError('Le nom ne peut pas être vide.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Le prix doit être un nombre positif.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updated = await updateAdminFormula(f.id, {
        name: trimmedName,
        price_ttc: parsedPrice,
        description: editDescription.trim() || null,
        border_start: editBorderStart,
        border_end: editBorderEnd,
        min_height: isNaN(parsedMinHeight) ? 420 : parsedMinHeight,
        display_order: isNaN(parsedDisplayOrder) ? 0 : parsedDisplayOrder,
        is_active: editIsActive,
        requires_podcaster: editRequiresPodcaster
      });
      setFormulas((prev) =>
        prev
          .map((x) => (x.id === updated.id ? updated : x))
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.price_ttc - b.price_ttc)
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

  // Ajouter une option temporaire lors de la création
  function addTempOption() {
    const content = tempOptionContent.trim();
    if (!content) return;
    setTempOptions((prev) => [...prev, { icon: tempOptionIcon, content }]);
    setTempOptionIcon('Circle');
    setTempOptionContent('');
  }

  // Supprimer une option temporaire
  function removeTempOption(index: number) {
    setTempOptions((prev) => prev.filter((_, i) => i !== index));
  }

  // Création d'une nouvelle formule
  async function handleCreate() {
    const trimmedName = newName.trim();
    const parsedPrice = parseFloat(newPrice);
    const parsedMinHeight = parseInt(newMinHeight);
    const parsedDisplayOrder = parseInt(newDisplayOrder);

    if (!trimmedName) {
      setError('Le nom de la formule est requis.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Le prix doit être un nombre positif.');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const created = await createAdminFormula({
        name: trimmedName,
        billing_type: newBillingType,
        price_ttc: parsedPrice,
        description: newDescription.trim() || null,
        border_start: newBorderStart,
        border_end: newBorderEnd,
        min_height: isNaN(parsedMinHeight) ? 420 : parsedMinHeight,
        display_order: isNaN(parsedDisplayOrder) ? formulas.length : parsedDisplayOrder,
        is_active: true,
        requires_podcaster: newRequiresPodcaster
      });

      // Créer les options associées
      const createdOptions = [];
      for (let i = 0; i < tempOptions.length; i++) {
        const opt = tempOptions[i];
        try {
          const createdOpt = await createFormulaOption(created.id, {
            icon: opt.icon,
            content: opt.content,
            display_order: i
          });
          createdOptions.push(createdOpt);
        } catch (err) {
          console.error('Erreur création option:', err);
        }
      }

      // Mettre à jour avec les options
      const formulaWithOptions = { ...created, options: createdOptions };
      setFormulas((prev) =>
        [...prev, formulaWithOptions].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.price_ttc - b.price_ttc)
      );

      // Reset du formulaire
      setNewName('');
      setNewPrice('');
      setNewDescription('');
      setNewBillingType('hourly');
      setNewBorderStart('rgb(153, 221, 252)');
      setNewBorderEnd('rgb(196, 202, 0)');
      setNewMinHeight('420');
      setNewDisplayOrder('0');
      setNewRequiresPodcaster(true);
      setTempOptions([]);
      setTempOptionIcon('Circle');
      setTempOptionContent('');
      setShowCreateForm(false);
    } catch (err: any) {
      console.error('Erreur createAdminFormula:', err);
      const message =
        err?.response?.data?.message ||
        "Impossible de créer la formule.";
      setError(message);
    } finally {
      setCreating(false);
    }
  }

  // Suppression d'une formule
  async function handleDelete(f: PublicFormula) {
    if (!confirm(`Supprimer la formule "${f.name}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      setError(null);
      await deleteAdminFormula(f.id);
      setFormulas((prev) => prev.filter((x) => x.id !== f.id));
    } catch (err: any) {
      console.error('Erreur deleteAdminFormula:', err);
      const message =
        err?.response?.data?.message ||
        "Impossible de supprimer la formule.";
      setError(message);
    }
  }

  // Toggle actif/inactif
  async function handleToggleActive(f: PublicFormula) {
    try {
      setError(null);
      const updated = await updateAdminFormula(f.id, {
        is_active: !f.is_active
      });
      setFormulas((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : x))
      );
    } catch (err: any) {
      console.error('Erreur toggle is_active:', err);
      const message =
        err?.response?.data?.message ||
        "Impossible de modifier le statut.";
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

  // === Gestion des images ===

  async function handleImageUpload(formulaId: string, file: File) {
    try {
      setUploadingImageId(formulaId);
      setError(null);
      const updated = await uploadFormulaImage(formulaId, file);
      setFormulas((prev) =>
        prev.map((f) => (f.id === updated.id ? { ...f, image_url: updated.image_url } : f))
      );
    } catch (err: any) {
      console.error('Erreur upload image:', err);
      const message =
        err?.response?.data?.message || "Impossible d'uploader l'image.";
      setError(message);
    } finally {
      setUploadingImageId(null);
    }
  }

  async function handleImageDelete(formulaId: string) {
    if (!confirm("Supprimer l'image de cette formule ?")) return;

    try {
      setUploadingImageId(formulaId);
      setError(null);
      const updated = await deleteFormulaImage(formulaId);
      setFormulas((prev) =>
        prev.map((f) => (f.id === updated.id ? { ...f, image_url: null } : f))
      );
    } catch (err: any) {
      console.error('Erreur suppression image:', err);
      const message =
        err?.response?.data?.message || "Impossible de supprimer l'image.";
      setError(message);
    } finally {
      setUploadingImageId(null);
    }
  }

  return (
    <div className="sr-page">
      <div className="sr-page-header">
        <div>
          <h2 className="sr-page-title">Formules</h2>
          <p className="sr-page-subtitle">
            Gère les formules affichées sur le site et dans le tunnel de réservation.
          </p>
        </div>
        <div className="sr-section-meta" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {formulas.length > 0 && (
            <span className="sr-chip">
              {formulas.length} formule{formulas.length > 1 ? 's' : ''}
            </span>
          )}
          <button
            className="button is-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <Plus size={16} style={{ marginRight: '6px' }} />
            Nouvelle formule
          </button>
        </div>
      </div>

      {error && <p className="sr-page-error">{error}</p>}

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="sr-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--sr-color-heading)' }}>
            Créer une nouvelle formule
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="label is-small">Nom *</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: Formule Premium"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={creating}
              />
            </div>
            <div>
              <label className="label is-small">Prix HT *</label>
              <input
                type="number"
                className="input"
                placeholder="Ex: 99"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                disabled={creating}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="label is-small">Type de facturation</label>
              <select
                className="input"
                value={newBillingType}
                onChange={(e) => setNewBillingType(e.target.value as 'hourly' | 'subscription')}
                disabled={creating}
              >
                <option value="hourly">À l'heure</option>
                <option value="subscription">Forfait</option>
              </select>
            </div>
            <div>
              <label className="label is-small">Ordre d'affichage</label>
              <input
                type="number"
                className="input"
                placeholder="0"
                value={newDisplayOrder}
                onChange={(e) => setNewDisplayOrder(e.target.value)}
                disabled={creating}
                min="0"
              />
            </div>
            <div>
              <label className="label is-small">Hauteur min (px)</label>
              <input
                type="number"
                className="input"
                placeholder="420"
                value={newMinHeight}
                onChange={(e) => setNewMinHeight(e.target.value)}
                disabled={creating}
                min="200"
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '1.5rem' }}>
                <input
                  type="checkbox"
                  checked={newRequiresPodcaster}
                  onChange={(e) => setNewRequiresPodcaster(e.target.checked)}
                  disabled={creating}
                />
                <span>Avec podcasteur</span>
              </label>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="label is-small">Description</label>
              <textarea
                className="textarea"
                placeholder="Description de la formule..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                disabled={creating}
                rows={2}
              />
            </div>
            <div>
              <ColorPicker
                label="Couleur début"
                value={newBorderStart}
                onChange={setNewBorderStart}
                disabled={creating}
              />
            </div>
            <div>
              <ColorPicker
                label="Couleur fin"
                value={newBorderEnd}
                onChange={setNewBorderEnd}
                disabled={creating}
              />
            </div>
          </div>

          {/* Aperçu des couleurs */}
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--sr-color-text-muted)' }}>Aperçu :</span>
            <div
              style={{
                width: '150px',
                height: '40px',
                borderRadius: '8px',
                background: `linear-gradient(90deg, ${newBorderStart}, ${newBorderEnd})`,
                border: '2px solid transparent',
                boxShadow: `0 0 10px ${newBorderStart}`
              }}
            />
          </div>

          {/* Section Options */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--sr-color-surface-soft)', borderRadius: 'var(--sr-radius-md)' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--sr-color-heading)', fontSize: '0.95rem' }}>
              Options de la formule
            </h4>

            {/* Liste des options ajoutées */}
            {tempOptions.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                {tempOptions.map((opt, index) => {
                  const TempIcon = iconMap[opt.icon] || Circle;
                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem',
                        marginBottom: '0.5rem',
                        background: 'var(--sr-color-surface)',
                        borderRadius: 'var(--sr-radius-sm)',
                        border: '1px solid var(--sr-color-border-subtle)'
                      }}
                    >
                      <TempIcon size={16} />
                      <span style={{ flex: 1 }}>{opt.content}</span>
                      <button
                        type="button"
                        className="button is-small is-danger"
                        onClick={() => removeTempOption(index)}
                        disabled={creating}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Formulaire d'ajout d'option */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label className="label is-small" style={{ color: 'var(--sr-color-text-muted)' }}>Icône</label>
                <IconPicker
                  value={tempOptionIcon}
                  onChange={setTempOptionIcon}
                  disabled={creating}
                />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label className="label is-small" style={{ color: 'var(--sr-color-text-muted)' }}>Contenu</label>
                <input
                  type="text"
                  className="input is-small"
                  placeholder="Ex: Accès au studio 1h"
                  value={tempOptionContent}
                  onChange={(e) => setTempOptionContent(e.target.value)}
                  disabled={creating}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTempOption();
                    }
                  }}
                />
              </div>
              <button
                type="button"
                className="button is-primary is-small"
                onClick={addTempOption}
                disabled={creating || !tempOptionContent.trim()}
              >
                <Plus size={14} />
                <span style={{ marginLeft: '4px' }}>Ajouter</span>
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            <button
              className="button is-success"
              onClick={handleCreate}
              disabled={creating || !newName.trim() || !newPrice}
            >
              {creating ? 'Création...' : 'Créer la formule'}
            </button>
            <button
              className="button"
              onClick={() => {
                setShowCreateForm(false);
                setTempOptions([]);
                setTempOptionIcon('Circle');
                setTempOptionContent('');
              }}
              disabled={creating}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="sr-page-body">
        <div className="sr-card">
          {loading && <p>Chargement des formules...</p>}

          {!loading && !error && formulas.length === 0 && (
            <p>Aucune formule trouvée. Cliquez sur "Nouvelle formule" pour en créer une.</p>
          )}

          {!loading && formulas.length > 0 && (
            <table className="table is-fullwidth is-striped is-hoverable">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Ordre</th>
                  <th>Nom</th>
                  <th>Description</th>
                  <th>Prix HT</th>
                  <th>Podcasteur</th>
                  <th>Couleurs</th>
                  <th>Statut</th>
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
                      {/* Ligne principale - toujours en lecture seule */}
                      <tr style={{ opacity: f.is_active === false ? 0.5 : 1 }}>
                        <td>
                          <code>{f.display_order ?? 0}</code>
                        </td>
                        <td>
                          <div>
                            <strong>{f.name}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--sr-color-text-muted)' }}>
                              {f.key}
                            </div>
                          </div>
                        </td>
                        <td style={{ maxWidth: '200px' }}>
                          <span style={{ fontSize: '0.8rem', color: f.description ? 'inherit' : 'var(--sr-color-text-muted)' }}>
                            {f.description ? (f.description.length > 50 ? f.description.substring(0, 50) + '...' : f.description) : '—'}
                          </span>
                        </td>
                        <td>{f.price_ttc.toFixed(2).replace('.', ',')}€</td>
                        <td>
                          <span
                            className={`sr-chip ${f.requires_podcaster ? 'is-info' : ''}`}
                            style={{ fontSize: '0.75rem' }}
                          >
                            {f.requires_podcaster ? 'Oui' : 'Non'}
                          </span>
                        </td>
                        <td>
                          <div
                            style={{
                              width: '60px',
                              height: '24px',
                              borderRadius: '4px',
                              background: `linear-gradient(90deg, ${f.border_start || 'rgb(153, 221, 252)'}, ${f.border_end || 'rgb(196, 202, 0)'})`
                            }}
                            title={`${f.border_start} → ${f.border_end}`}
                          />
                        </td>
                        <td>
                          <span
                            className={`sr-chip ${f.is_active !== false ? 'is-success' : 'is-danger'}`}
                            style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                            onClick={() => handleToggleActive(f)}
                            title="Cliquer pour changer le statut"
                          >
                            {f.is_active !== false ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td>
                          <div className="buttons are-small" style={{ flexWrap: 'nowrap' }}>
                            <button
                              className={`button is-small ${isEditing ? 'is-warning' : 'is-info'}`}
                              onClick={() => isEditing ? cancelEdit() : startEdit(f)}
                              title={isEditing ? 'Fermer l\'édition' : 'Modifier'}
                            >
                              {isEditing ? <X size={14} /> : <Edit size={14} />}
                            </button>
                            <button
                              className="button is-small"
                              onClick={() => toggleExpandFormula(f.id)}
                              title="Gérer les options"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              <span style={{ marginLeft: '4px', fontSize: '0.75rem' }}>
                                {options.length}
                              </span>
                            </button>
                            <button
                              className="button is-danger is-small"
                              onClick={() => handleDelete(f)}
                              title="Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Panneau d'édition */}
                      {isEditing && (
                        <tr key={`${f.id}-edit`}>
                          <td colSpan={8} style={{ background: 'var(--sr-color-surface)', borderRadius: 'var(--sr-radius-md)', padding: '1.5rem' }}>
                            <h4 style={{ marginBottom: '1rem', color: 'var(--sr-color-heading)' }}>
                              Modifier "{f.name}"
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                              <div>
                                <label className="label is-small">Nom *</label>
                                <input
                                  type="text"
                                  className="input"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  disabled={saving}
                                />
                              </div>
                              <div>
                                <label className="label is-small">Prix HT *</label>
                                <input
                                  type="number"
                                  className="input"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  disabled={saving}
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              <div>
                                <label className="label is-small">Ordre d'affichage</label>
                                <input
                                  type="number"
                                  className="input"
                                  value={editDisplayOrder}
                                  onChange={(e) => setEditDisplayOrder(e.target.value)}
                                  disabled={saving}
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="label is-small">Hauteur min (px)</label>
                                <input
                                  type="number"
                                  className="input"
                                  value={editMinHeight}
                                  onChange={(e) => setEditMinHeight(e.target.value)}
                                  disabled={saving}
                                  min="200"
                                />
                              </div>
                              <div style={{ gridColumn: 'span 2' }}>
                                <label className="label is-small">Description</label>
                                <textarea
                                  className="textarea"
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  disabled={saving}
                                  rows={2}
                                  placeholder="Description de la formule..."
                                />
                              </div>

                              {/* Section Image */}
                              <div style={{ gridColumn: 'span 2' }}>
                                <label className="label is-small">Image de la formule</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                  {getImageUrl(f.image_url) && (
                                    <div style={{ position: 'relative' }}>
                                      <img
                                        src={getImageUrl(f.image_url)!}
                                        alt={f.name}
                                        style={{
                                          width: '120px',
                                          height: '80px',
                                          objectFit: 'cover',
                                          borderRadius: 'var(--sr-radius-md)',
                                          border: '2px solid var(--sr-color-border-subtle)'
                                        }}
                                      />
                                      <button
                                        type="button"
                                        className="button is-danger is-small"
                                        onClick={() => handleImageDelete(f.id)}
                                        disabled={uploadingImageId === f.id}
                                        style={{
                                          position: 'absolute',
                                          top: '-8px',
                                          right: '-8px',
                                          padding: '4px',
                                          minWidth: 'unset',
                                          borderRadius: '50%'
                                        }}
                                        title="Supprimer l'image"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  )}
                                  <div>
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleImageUpload(f.id, file);
                                        e.target.value = '';
                                      }}
                                      disabled={uploadingImageId === f.id}
                                      style={{ display: 'none' }}
                                      id={`image-upload-${f.id}`}
                                    />
                                    <label
                                      htmlFor={`image-upload-${f.id}`}
                                      className="button is-info is-small"
                                      style={{ cursor: uploadingImageId === f.id ? 'wait' : 'pointer' }}
                                    >
                                      <Upload size={14} style={{ marginRight: '6px' }} />
                                      {uploadingImageId === f.id
                                        ? 'Upload...'
                                        : f.image_url
                                        ? 'Changer l\'image'
                                        : 'Ajouter une image'}
                                    </label>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--sr-color-text-muted)', marginTop: '4px' }}>
                                      JPG, PNG ou WebP
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <ColorPicker
                                  label="Couleur début"
                                  value={editBorderStart}
                                  onChange={setEditBorderStart}
                                  disabled={saving}
                                />
                              </div>
                              <div>
                                <ColorPicker
                                  label="Couleur fin"
                                  value={editBorderEnd}
                                  onChange={setEditBorderEnd}
                                  disabled={saving}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '1.5rem' }}>
                                  <input
                                    type="checkbox"
                                    checked={editIsActive}
                                    onChange={(e) => setEditIsActive(e.target.checked)}
                                    disabled={saving}
                                  />
                                  <span>Formule active</span>
                                </label>
                              </div>
                              <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '1.5rem' }}>
                                  <input
                                    type="checkbox"
                                    checked={editRequiresPodcaster}
                                    onChange={(e) => setEditRequiresPodcaster(e.target.checked)}
                                    disabled={saving}
                                  />
                                  <span>Avec podcasteur</span>
                                </label>
                              </div>
                            </div>
                            {/* Aperçu des couleurs */}
                            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--sr-color-text-muted)' }}>Aperçu :</span>
                              <div
                                style={{
                                  width: '150px',
                                  height: '40px',
                                  borderRadius: '8px',
                                  background: `linear-gradient(90deg, ${editBorderStart}, ${editBorderEnd})`,
                                  border: '2px solid transparent',
                                  boxShadow: `0 0 10px ${editBorderStart}`
                                }}
                              />
                            </div>
                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                              <button
                                className="button is-success"
                                disabled={saving}
                                onClick={() => handleSave(f)}
                              >
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                              </button>
                              <button
                                className="button"
                                disabled={saving}
                                onClick={cancelEdit}
                              >
                                Annuler
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Options de la formule */}
                      {isExpanded && !isEditing && (
                        <tr key={`${f.id}-options`}>
                          <td colSpan={8} style={{ background: 'var(--sr-color-surface)', borderRadius: 'var(--sr-radius-md)' }}>
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

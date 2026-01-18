// src/components/Home/Formules.tsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
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
  Link as LinkIcon,
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

import './Formules.css';
import Timeline from './Timeline';
import {
  getPublicFormulas,
  type PublicFormula,
  type FormulaOption
} from '../../api/formulas';

// Map des icônes Lucide disponibles
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
  Link: LinkIcon,
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

// Fonction pour obtenir l'icône Lucide à partir du nom
function getLucideIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || Circle;
}

// Rendu d'une option avec son icône dynamique
function OptionItem({ option }: { option: FormulaOption }) {
  const Icon = getLucideIcon(option.icon);
  return (
    <p key={option.id}>
      <Icon size={16} /> {option.content}
    </p>
  );
}

// Fonction pour convertir RGB en RGBA avec opacité
function rgbToRgba(rgb: string, alpha: number): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
  }
  return rgb;
}

// Génère les styles inline pour une formule avec ses couleurs
function getFormulaStyles(f: PublicFormula): React.CSSProperties {
  const borderStart = f.border_start || 'rgb(153, 221, 252)';
  const borderEnd = f.border_end || 'rgb(196, 202, 0)';
  const minHeight = f.min_height || 420;

  return {
    position: 'relative',
    minHeight: `${minHeight}px`,
    border: '3px solid transparent',
    borderRadius: '15px',
    transform: 'translateY(-6px)',
    background: `linear-gradient(180deg, rgb(33, 27, 39) 0%, rgb(5, 3, 8) 100%) padding-box, linear-gradient(90deg, ${borderStart}, ${borderEnd}) border-box`,
    // Variables CSS personnalisées pour l'animation
    '--border-start': borderStart,
    '--border-end': borderEnd,
    '--glow-main': rgbToRgba(borderStart, 0.9),
    '--glow-soft': rgbToRgba(borderEnd, 0.6),
  } as React.CSSProperties;
}

// Style pour le badge avec dégradé
function getBadgeStyles(f: PublicFormula): React.CSSProperties {
  const borderStart = f.border_start || 'rgb(153, 221, 252)';
  const borderEnd = f.border_end || 'rgb(196, 202, 0)';

  return {
    background: `linear-gradient(90deg, ${borderStart}, ${borderEnd})`,
  };
}

function Formules() {
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const [formulas, setFormulas] = useState<PublicFormula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleScroll = (direction: 'prev' | 'next') => {
    if (!sliderRef.current) return;
    const container = sliderRef.current;
    const scrollAmount = container.clientWidth * 0.9;
    container.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await getPublicFormulas();

        if (!mounted) return;

        // Trier par display_order puis par prix (l'API retourne déjà les formules actives)
        data.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.price_ttc - b.price_ttc);

        setFormulas(data);
      } catch (err) {
        console.error('Erreur formules :', err);
        if (mounted) setError('Impossible de charger les formules.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="formules">
      <div className="formules-header">
        <h2 className="section-title subtitle">
          “Enregistre, monte et publie des podcasts de qualité professionnelle”
        </h2>
        <Link className="btn btn-primary" to="/reservation">
          Réserver une session
        </Link>
        <p className="handwritten">
          Découvre nos offres flexibles adaptées à tous les créateurs.
        </p>
      </div>

      {loading && <p className="formules-status">Chargement…</p>}
      {error && <p className="formules-status formules-status--error">{error}</p>}

      {!loading && formulas.length > 0 && (
        <div className="formules-slider">
          <button
            className="formules-arrow formules-arrow-left"
            type="button"
            onClick={() => handleScroll('prev')}
          >
            <ChevronLeft size={24} />
          </button>

          <div className="formule-cards" ref={sliderRef}>
            {formulas.map((f) => {
              // Options de l'API ou fallback vide
              const options = f.options || [];
              // Trier par display_order
              const sortedOptions = [...options].sort((a, b) => a.display_order - b.display_order);
              // Lien vers la réservation avec la clé de la formule
              const reservationLink = `/reservation?step=2&formula=${f.key}`;

              return (
                <div
                  key={f.id}
                  className="formule formule-dynamic"
                  style={getFormulaStyles(f)}
                >
                  <h4 className="formule-badge" style={getBadgeStyles(f)}>{f.name}</h4>

                  <p className="formule-desc">
                    {f.description || 'Découvrez cette formule adaptée à vos besoins.'}
                  </p>

                  <p className="price">
                    {f.price_ttc}€ <span>HT</span>
                  </p>

                  <Link to={reservationLink}>
                    <button className="btn btn-primary">
                      Choisir cette formule
                    </button>
                  </Link>

                  <div className="formule-options">
                    {sortedOptions.map((opt) => (
                      <OptionItem key={opt.id} option={opt} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="formules-arrow formules-arrow-right"
            type="button"
            onClick={() => handleScroll('next')}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      <Timeline />
    </section>
  );
}

export default Formules;

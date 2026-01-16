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
import type { FormulaKey } from '../../pages/ReservationPage';

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

// Config statique pour les styles CSS et descriptions (fallback)
const formulaConfig: Record<
  FormulaKey,
  {
    cssClass: string;
    description: string;
    priceSuffix: string;
    reservationLink: string;
  }
> = {
  solo: {
    cssClass: 'formule formule1',
    description: "Formule idéale pour débuter, accès au studio avec accompagnement de base.",
    priceSuffix: 'HT',
    reservationLink: '/reservation?step=2&formula=solo'
  },
  duo: {
    cssClass: 'formule formule2',
    description: "Accompagnement complet avec un podcasteur expérimenté pour optimiser ton contenu.",
    priceSuffix: 'HT',
    reservationLink: '/reservation?step=2&formula=duo'
  },
  pro: {
    cssClass: 'formule formule3',
    description: "Formule premium avec accompagnement VIP et services de post-production inclus.",
    priceSuffix: 'HT',
    reservationLink: '/reservation?step=2&formula=pro'
  }
};

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

        const allowed = data.filter((f) =>
          ['solo', 'duo', 'pro'].includes(f.key)
        );

        allowed.sort((a, b) => a.price_ttc - b.price_ttc);

        setFormulas(allowed);
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
              const cfg = formulaConfig[f.key as FormulaKey];
              if (!cfg) return null;

              // Options de l'API ou fallback vide
              const options = f.options || [];
              // Trier par display_order
              const sortedOptions = [...options].sort((a, b) => a.display_order - b.display_order);

              return (
                <div key={f.id} className={cfg.cssClass}>
                  <h4 className="formule-badge">{f.name}</h4>

                  <p className="formule-desc">{cfg.description}</p>

                  <p className="price">
                    {f.price_ttc}€ <span>{cfg.priceSuffix}</span>
                  </p>

                  <Link to={cfg.reservationLink}>
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

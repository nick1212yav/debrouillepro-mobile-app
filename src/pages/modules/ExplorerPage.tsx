import { View, Pressable, Text, TextInput, Image, type ViewStyle, type TextStyle, type ImageStyle } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Sparkles,
  TrendingUp,
  Hash,
  Users as UsersIcon,
  Heart,
  MessageSquare,
  Eye,
  MapPin,
  UserPlus,
  Home,
  Briefcase,
  Car,
  Heart as HeartIcon,
  CreditCard,
  Users,
  Package,
  Leaf,
  Newspaper,
  CalendarDays,
  Plane,
  AlertTriangle,
  BookOpen,
  ShoppingBag,
  Radio,
  Scale,
  HandHeart,
  Trophy,
  GraduationCap,
  Zap,
  BedDouble,
  UtensilsCrossed,
  Megaphone,
  Building2,
  TreePine,
  Mountain,
  Lightbulb,
  Network,
  Tv,
  Database,
  Shield,
  Map,
  Wallet,
  Star,
  Award,
  Wrench,
  Truck,
  BarChart2,
  Globe,
  Camera,
  PenTool,
  Film,
  Layers,
  Target,
  Activity,
  Flame,
  Coffee,
  Music,
  BookMarked,
  Microscope,
  Cpu,
  Landmark,
  Church,
  Bike,
  ShoppingCart,
  Stethoscope,
  Compass,
  Clock,
  Plus,
  ChevronRight,
  Navigation,
  MapPinned,
} from "lucide-react-native";
import { useEffect, useState } from "react";

// ─── Module definition ────────────────────────────────────────────────────────

type LucideIcon = React.ComponentType<{
  size?: number;
  style?: ViewStyle | TextStyle | ImageStyle;
  className?: string;
}>;

interface Module {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  desc: string;
  implemented: boolean;
  isNew?: boolean;
  category: string;
}

const MODULES: Module[] = [
  // ── Vie quotidienne ──
  {
    id: "immo",
    label: "Immobilier",
    icon: Home,
    color: "#10B981",
    desc: "Louer · Acheter · Terrain",
    implemented: true,
    category: "Vie quotidienne",
  },
  {
    id: "logement",
    label: "Logement social",
    icon: Building2,
    color: "#10B981",
    desc: "HLM · Résidences sociales",
    implemented: true,
    isNew: true,
    category: "Vie quotidienne",
  },
  {
    id: "hebergement",
    label: "Hébergement",
    icon: BedDouble,
    color: "#10B981",
    desc: "Hôtels · Villas · Auberges",
    implemented: true,
    isNew: true,
    category: "Vie quotidienne",
  },
  {
    id: "city-habitat",
    label: "City & Habitat",
    icon: Landmark,
    color: "#6366F1",
    desc: "Urbanisme · Habitat",
    implemented: true,
    isNew: true,
    category: "Vie quotidienne",
  },
  {
    id: "services",
    label: "Services perso.",
    icon: Wrench,
    color: "#F97316",
    desc: "Aide à la personne",
    implemented: true,
    isNew: true,
    category: "Vie quotidienne",
  },
  {
    id: "restauration",
    label: "Restauration",
    icon: UtensilsCrossed,
    color: "#F97316",
    desc: "Restaurants · Traiteurs",
    implemented: true,
    isNew: true,
    category: "Vie quotidienne",
  },

  // ── Travail & Finances ──
  {
    id: "jobs",
    label: "Jobs / Pro",
    icon: Briefcase,
    color: "#8B5CF6",
    desc: "Postuler · Recruter",
    implemented: true,
    category: "Travail & Finances",
  },
  {
    id: "emploi",
    label: "Emploi formel",
    icon: Target,
    color: "#8B5CF6",
    desc: "Offres · Candidatures",
    implemented: true,
    isNew: true,
    category: "Travail & Finances",
  },
  {
    id: "paiement",
    label: "Paiement",
    icon: CreditCard,
    color: "#10B981",
    desc: "Mobile Money · Carte",
    implemented: true,
    category: "Travail & Finances",
  },
  {
    id: "wallet",
    label: "Portefeuille",
    icon: Wallet,
    color: "#10B981",
    desc: "Solde · Transactions",
    implemented: true,
    category: "Travail & Finances",
  },
  {
    id: "finances",
    label: "Finances+",
    icon: TrendingUp,
    color: "#10B981",
    desc: "Investir · Épargner",
    implemented: true,
    isNew: true,
    category: "Travail & Finances",
  },
  {
    id: "business",
    label: "Business",
    icon: BarChart2,
    color: "#8B5CF6",
    desc: "Entreprises · PME",
    implemented: true,
    isNew: true,
    category: "Travail & Finances",
  },
  {
    id: "marketplace",
    label: "Boutique",
    icon: ShoppingBag,
    color: "#F97316",
    desc: "Acheter · Vendre",
    implemented: true,
    category: "Travail & Finances",
  },
  {
    id: "marketplace-pro",
    label: "Boutique Pro",
    icon: ShoppingCart,
    color: "#F97316",
    desc: "Vendeur pro · Gestion stock",
    implemented: true,
    isNew: true,
    category: "Travail & Finances",
  },
  {
    id: "revenus",
    label: "Revenus",
    icon: Star,
    color: "#FBBF24",
    desc: "Gains · Missions rémunérées",
    implemented: true,
    category: "Travail & Finances",
  },
  {
    id: "revenus-dashboard",
    label: "Dashboard Rev.",
    icon: Activity,
    color: "#FBBF24",
    desc: "Statistiques · Paiements",
    implemented: true,
    isNew: true,
    category: "Travail & Finances",
  },

  // ── Mobilité ──
  {
    id: "transport",
    label: "Transport",
    icon: Car,
    color: "#3B82F6",
    desc: "Réserver · Suivre",
    implemented: true,
    category: "Mobilité",
  },
  {
    id: "livraison",
    label: "Livraison",
    icon: Package,
    color: "#3B82F6",
    desc: "Colis · Repas · Courses",
    implemented: true,
    category: "Mobilité",
  },
  {
    id: "voyages",
    label: "Voyages",
    icon: Plane,
    color: "#0EA5E9",
    desc: "Planifier · Réserver",
    implemented: true,
    isNew: true,
    category: "Mobilité",
  },
  {
    id: "destinations",
    label: "Destinations",
    icon: Compass,
    color: "#0EA5E9",
    desc: "Explorer · Découvrir",
    implemented: true,
    isNew: true,
    category: "Mobilité",
  },
  {
    id: "planificateur",
    label: "Planificateur",
    icon: MapPin,
    color: "#0EA5E9",
    desc: "Itinéraires · Planning",
    implemented: true,
    isNew: true,
    category: "Mobilité",
  },
  {
    id: "carnet-voyage",
    label: "Carnet de voyage",
    icon: BookMarked,
    color: "#0EA5E9",
    desc: "Journal · Souvenirs",
    implemented: true,
    isNew: true,
    category: "Mobilité",
  },
  {
    id: "budget-voyage",
    label: "Budget voyage",
    icon: Wallet,
    color: "#0EA5E9",
    desc: "Dépenses · Budget",
    implemented: true,
    isNew: true,
    category: "Mobilité",
  },
  {
    id: "tracking",
    label: "Tracking",
    icon: Bike,
    color: "#6366F1",
    desc: "Suivi en temps réel",
    implemented: true,
    isNew: true,
    category: "Mobilité",
  },

  // ── Santé & Bien-être ──
  {
    id: "sante",
    label: "Santé",
    icon: HeartIcon,
    color: "#EF4444",
    desc: "RDV · Téléconsult.",
    implemented: true,
    category: "Santé & Bien-être",
  },
  {
    id: "fitness",
    label: "Fitness",
    icon: Flame,
    color: "#EF4444",
    desc: "Entraînements · Timer",
    implemented: true,
    isNew: true,
    category: "Santé & Bien-être",
  },
  {
    id: "nutrition",
    label: "Nutrition",
    icon: Coffee,
    color: "#F59E0B",
    desc: "Journal alimentaire",
    implemented: true,
    isNew: true,
    category: "Santé & Bien-être",
  },
  {
    id: "meditation",
    label: "Méditation",
    icon: Activity,
    color: "#8B5CF6",
    desc: "Respiration · Pleine conscience",
    implemented: true,
    isNew: true,
    category: "Santé & Bien-être",
  },
  {
    id: "bienetre",
    label: "Bien-être",
    icon: Stethoscope,
    color: "#10B981",
    desc: "Dashboard santé",
    implemented: true,
    isNew: true,
    category: "Santé & Bien-être",
  },
  {
    id: "sport",
    label: "Sport",
    icon: Trophy,
    color: "#6366F1",
    desc: "Clubs · Tournois · Résultats",
    implemented: true,
    isNew: true,
    category: "Santé & Bien-être",
  },

  // ── Éducation ──
  {
    id: "apprendre",
    label: "Apprendre",
    icon: BookOpen,
    color: "#F59E0B",
    desc: "Cours · Certificats",
    implemented: true,
    isNew: true,
    category: "Éducation",
  },
  {
    id: "cours",
    label: "Cours & Catalogue",
    icon: GraduationCap,
    color: "#A78BFA",
    desc: "MOOC · Cours en ligne",
    implemented: true,
    isNew: true,
    category: "Éducation",
  },
  {
    id: "quiz",
    label: "Quiz & Évals",
    icon: Target,
    color: "#A78BFA",
    desc: "Exercices · Tests",
    implemented: true,
    isNew: true,
    category: "Éducation",
  },
  {
    id: "certifications",
    label: "Certifications",
    icon: Award,
    color: "#A78BFA",
    desc: "Badges · Diplômes",
    implemented: true,
    isNew: true,
    category: "Éducation",
  },
  {
    id: "mentorat",
    label: "Mentorat",
    icon: Users,
    color: "#A78BFA",
    desc: "Mentors · Communauté",
    implemented: true,
    isNew: true,
    category: "Éducation",
  },
  {
    id: "edu-formelle",
    label: "Éducation Formelle",
    icon: Microscope,
    color: "#A78BFA",
    desc: "Écoles · Bourses",
    implemented: true,
    isNew: true,
    category: "Éducation",
  },
  {
    id: "ecole",
    label: "École",
    icon: GraduationCap,
    color: "#F59E0B",
    desc: "Scolarité · Inscription",
    implemented: true,
    isNew: true,
    category: "Éducation",
  },

  // ── Communauté & Social ──
  {
    id: "community",
    label: "Community",
    icon: Users,
    color: "#8B5CF6",
    desc: "Groupes · Discussions",
    implemented: true,
    category: "Communauté & Social",
  },
  {
    id: "groupes",
    label: "Groupes",
    icon: Network,
    color: "#8B5CF6",
    desc: "Créer · Rejoindre",
    implemented: true,
    isNew: true,
    category: "Communauté & Social",
  },
  {
    id: "evenements",
    label: "Événements",
    icon: CalendarDays,
    color: "#EC4899",
    desc: "Créer · Billetterie",
    implemented: true,
    isNew: true,
    category: "Communauté & Social",
  },
  {
    id: "evenements-pro",
    label: "Événements Pro",
    icon: CalendarDays,
    color: "#EC4899",
    desc: "Gestion pro d'événements",
    implemented: true,
    isNew: true,
    category: "Communauté & Social",
  },
  {
    id: "parrainage",
    label: "Parrainage",
    icon: HandHeart,
    color: "#EC4899",
    desc: "Inviter & Gagner",
    implemented: true,
    isNew: true,
    category: "Communauté & Social",
  },
  {
    id: "recompenses",
    label: "Récompenses",
    icon: Star,
    color: "#FBBF24",
    desc: "Points · Badges · Cashback",
    implemented: true,
    isNew: true,
    category: "Communauté & Social",
  },
  {
    id: "network",
    label: "Network",
    icon: Globe,
    color: "#3B82F6",
    desc: "Réseau professionnel",
    implemented: true,
    isNew: true,
    category: "Communauté & Social",
  },
  {
    id: "eglise",
    label: "Église & Foi",
    icon: Church,
    color: "#FBBF24",
    desc: "Communautés religieuses",
    implemented: true,
    isNew: true,
    category: "Communauté & Social",
  },

  // ── Médias & Création ──
  {
    id: "media",
    label: "Médias",
    icon: Newspaper,
    color: "#06B6D4",
    desc: "News · Podcasts · Radio",
    implemented: true,
    isNew: true,
    category: "Médias & Création",
  },
  {
    id: "live",
    label: "Live Stories",
    icon: Radio,
    color: "#EF4444",
    desc: "Streamer · Regarder",
    implemented: true,
    isNew: true,
    category: "Médias & Création",
  },
  {
    id: "live-streaming",
    label: "Live Streaming",
    icon: Tv,
    color: "#EF4444",
    desc: "Diffusion en direct",
    implemented: true,
    isNew: true,
    category: "Médias & Création",
  },
  {
    id: "editeur",
    label: "Éditeur",
    icon: PenTool,
    color: "#8B5CF6",
    desc: "Créer du contenu",
    implemented: true,
    isNew: true,
    category: "Médias & Création",
  },
  {
    id: "studio",
    label: "Studio Photo",
    icon: Camera,
    color: "#EC4899",
    desc: "Retouche · Filtres",
    implemented: true,
    isNew: true,
    category: "Médias & Création",
  },
  {
    id: "stories-creator",
    label: "Stories Creator",
    icon: Film,
    color: "#EC4899",
    desc: "Stories · Réels",
    implemented: true,
    isNew: true,
    category: "Médias & Création",
  },
  {
    id: "templates",
    label: "Templates",
    icon: Layers,
    color: "#8B5CF6",
    desc: "Modèles prêts à l'emploi",
    implemented: true,
    isNew: true,
    category: "Médias & Création",
  },
  {
    id: "pub",
    label: "Publicité",
    icon: Megaphone,
    color: "#F59E0B",
    desc: "Créer · Diffuser · Mesurer",
    implemented: true,
    isNew: true,
    category: "Médias & Création",
  },
  {
    id: "cocreation",
    label: "Co-création",
    icon: Lightbulb,
    color: "#A78BFA",
    desc: "Projets collaboratifs",
    implemented: true,
    isNew: true,
    category: "Médias & Création",
  },

  // ── Agriculture & Environnement ──
  {
    id: "agri",
    label: "Agriculture",
    icon: Leaf,
    color: "#22C55E",
    desc: "Planter · Vendre",
    implemented: true,
    isNew: true,
    category: "Agriculture & Environnement",
  },
  {
    id: "environnement",
    label: "Environnement",
    icon: TreePine,
    color: "#22C55E",
    desc: "Écologie · Recyclage",
    implemented: true,
    isNew: true,
    category: "Agriculture & Environnement",
  },
  {
    id: "energie",
    label: "Énergie",
    icon: Zap,
    color: "#FBBF24",
    desc: "Solaire · Réseau électrique",
    implemented: true,
    isNew: true,
    category: "Agriculture & Environnement",
  },

  // ── Gouvernance & Sécurité ──
  {
    id: "justice",
    label: "Justice",
    icon: Scale,
    color: "#9CA3AF",
    desc: "Signaler · Défendre",
    implemented: true,
    isNew: true,
    category: "Gouvernance & Sécurité",
  },
  {
    id: "juridique",
    label: "Juridique",
    icon: Scale,
    color: "#9CA3AF",
    desc: "Conseil légal · Documents",
    implemented: true,
    isNew: true,
    category: "Gouvernance & Sécurité",
  },
  {
    id: "securite",
    label: "Sécurité publique",
    icon: Shield,
    color: "#EF4444",
    desc: "Alertes · Signalements",
    implemented: true,
    isNew: true,
    category: "Gouvernance & Sécurité",
  },
  {
    id: "sos",
    label: "SOS & Urgences",
    icon: AlertTriangle,
    color: "#EF4444",
    desc: "Appel · Alerte · Sécurité",
    implemented: true,
    isNew: true,
    category: "Gouvernance & Sécurité",
  },
  {
    id: "urbanisme",
    label: "Urbanisme",
    icon: Building2,
    color: "#6366F1",
    desc: "Plans · Projets urbains",
    implemented: true,
    isNew: true,
    category: "Gouvernance & Sécurité",
  },
  {
    id: "amenagement",
    label: "Aménagement",
    icon: Mountain,
    color: "#6366F1",
    desc: "Territoire · Infrastructure",
    implemented: true,
    isNew: true,
    category: "Gouvernance & Sécurité",
  },
  {
    id: "data-publique",
    label: "Data Publique",
    icon: Database,
    color: "#06B6D4",
    desc: "Open data · Statistiques",
    implemented: true,
    isNew: true,
    category: "Gouvernance & Sécurité",
  },

  // ── ONG & Solidarité ──
  {
    id: "ong",
    label: "ONG & Dons",
    icon: HandHeart,
    color: "#10B981",
    desc: "Campagnes · Bénévolat",
    implemented: true,
    isNew: true,
    category: "ONG & Solidarité",
  },

  // ── Tech & Innovation ──
  {
    id: "map3d",
    label: "Map 3D",
    icon: Map,
    color: "#6366F1",
    desc: "Cartographie 3D avancée",
    implemented: true,
    isNew: true,
    category: "Tech & Innovation",
  },
  {
    id: "carte",
    label: "Carte",
    icon: MapPin,
    color: "#6366F1",
    desc: "Explorer autour de moi",
    implemented: true,
    category: "Tech & Innovation",
  },
  {
    id: "reputation",
    label: "Réputation",
    icon: Star,
    color: "#FBBF24",
    desc: "Scores · Avis · Badge",
    implemented: true,
    isNew: true,
    category: "Tech & Innovation",
  },
  {
    id: "premium",
    label: "Premium",
    icon: Sparkles,
    color: "#8B5CF6",
    desc: "Fonctions avancées",
    implemented: true,
    isNew: true,
    category: "Tech & Innovation",
  },

  // ── Gestion personnelle ──
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart2,
    color: "#8B5CF6",
    desc: "Vue globale de vos données",
    implemented: true,
    category: "Gestion personnelle",
  },
  {
    id: "agenda",
    label: "Agenda",
    icon: Clock,
    color: "#EC4899",
    desc: "Rendez-vous · Rappels",
    implemented: true,
    isNew: true,
    category: "Gestion personnelle",
  },
  {
    id: "documents",
    label: "Documents",
    icon: Layers,
    color: "#06B6D4",
    desc: "Fichiers · Contrats",
    implemented: true,
    isNew: true,
    category: "Gestion personnelle",
  },
  {
    id: "favorites",
    label: "Favoris",
    icon: Star,
    color: "#FBBF24",
    desc: "Sauvegardes · Collections",
    implemented: true,
    category: "Gestion personnelle",
  },
  {
    id: "settings",
    label: "Paramètres",
    icon: Cpu,
    color: "#9CA3AF",
    desc: "Compte · Préférences",
    implemented: true,
    category: "Gestion personnelle",
  },

  // ── Annonces ──
  {
    id: "annonces",
    label: "Annonces",
    icon: Megaphone,
    color: "#F59E0B",
    desc: "Ventes · Petites annonces",
    implemented: true,
    isNew: true,
    category: "Annonces",
  },

  // ── Messages & Notifs ──
  {
    id: "messages",
    label: "Messages",
    icon: MessageSquare,
    color: "#3B82F6",
    desc: "Conversations · Groupes",
    implemented: true,
    category: "Messages & Notifs",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Music,
    color: "#EC4899",
    desc: "Alertes · Centre de notifs",
    implemented: true,
    category: "Messages & Notifs",
  },
  {
    id: "decouverte",
    label: "Découverte",
    icon: Compass,
    color: "#EC4899",
    desc: "Tendances · Tags · Suggestions",
    implemented: true,
    isNew: true,
    category: "Messages & Notifs",
  },
];
const EXPLORER_CATEGORIES = [
  "Tous",
  ...Array.from(new Set(MODULES.map((m) => m.category))),
];

interface ExplorerPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
  /** Ouvre le profil public d'un utilisateur depuis Explorer. */
  onViewProfile?: (userId: string) => void;
  /** Ouvre le détail d'une publication depuis Explorer. */
  onViewPublication?: (publicationId: string) => void;
}

const DISCOVERY_SPOTLIGHTS = [
  {
    id: "immo",
    label: "Trouver un logement",
    desc: "Appartements, maisons, terrains",
    icon: Home,
    color: "#10B981",
  },
  {
    id: "jobs",
    label: "Trouver une opportunité",
    desc: "Jobs, missions et business",
    icon: Briefcase,
    color: "#8B5CF6",
  },
  {
    id: "evenements",
    label: "Sortir & rencontrer",
    desc: "Événements près de vous",
    icon: CalendarDays,
    color: "#EC4899",
  },
  {
    id: "voyages",
    label: "Partir découvrir",
    desc: "Destinations et voyages",
    icon: Plane,
    color: "#0EA5E9",
  },
];

const DISCOVERY_UNIVERSES = [
  {
    id: "Vie quotidienne",
    icon: Home,
    color: "#10B981",
    desc: "Logement · services · restauration",
  },
  {
    id: "Travail & Finances",
    icon: Briefcase,
    color: "#8B5CF6",
    desc: "Jobs · business · revenus",
  },
  {
    id: "Mobilité",
    icon: Car,
    color: "#3B82F6",
    desc: "Transport · voyages · livraison",
  },
  {
    id: "Santé & Bien-être",
    icon: HeartIcon,
    color: "#EF4444",
    desc: "Santé · fitness · bien-être",
  },
  {
    id: "Éducation",
    icon: GraduationCap,
    color: "#F59E0B",
    desc: "Cours · quiz · mentorat",
  },
  {
    id: "Communauté & Social",
    icon: Users,
    color: "#EC4899",
    desc: "Groupes · événements · réseau",
  },
  {
    id: "Médias & Création",
    icon: Camera,
    color: "#06B6D4",
    desc: "Stories · live · création",
  },
  {
    id: "Agriculture & Environnement",
    icon: Leaf,
    color: "#22C55E",
    desc: "Agriculture · écologie · énergie",
  },
];

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
  color = "#A78BFA",
  action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  color?: string;
  action?: () => void;
}) {
  return (
    <View className="flex items-end justify-between gap-3 mb-4"><View className="min-w-0"><View className="flex items-center gap-2"><View className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}16`, borderStyle: "solid" }}><Icon size={13} style={{ color }} /></View><Text className="text-[15px] font-black text-white tracking-tight">{title}</Text></View>{subtitle && (
          <Text className="text-[10px] text-white/35 mt-1 ml-9">{subtitle}</Text>
        )}</View>{action && (
        <Pressable onPress={action} className="text-[10px] font-bold text-white/45 transition-colors"><Text>Tout voir →</Text></Pressable>
      )}</View>
  );
}

function HeroSearch({
  search,
  setSearch,
  onSurprise,
}: {
  search: string;
  setSearch: (value: string) => void;
  onSurprise: () => void;
}) {
  return (
    <View initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative overflow-hidden rounded-[30px] p-5 sm:p-7" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderStyle: "solid", boxShadow:
              "0 24px 80px rgba(0,0,0,0.35), inset 0 1px rgba(255,255,255,0.05)" }}>
      <View className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      <View className="absolute -left-20 -bottom-24 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <View className="relative z-10 max-w-3xl"><View className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full mb-4" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Sparkles size={12} className="text-purple-300" /><Text className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">Découverte intelligente
          </Text></View><Text className="text-3xl sm:text-4xl font-black tracking-[-0.04em] text-white leading-[0.98]">Qu'avez-vous envie
          <Text className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">de découvrir ?
          </Text></Text><Text className="text-xs sm:text-sm text-white/45 mt-3 max-w-xl leading-relaxed">Trouvez une opportunité, un service, un lieu, un événement ou
          simplement quelque chose de nouveau à explorer.
        </Text><View className="flex gap-2 mt-5"><View className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3.5 rounded-2xl" style={{ backgroundColor: "rgba(0,0,0,0.28)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", boxShadow: "inset 0 1px rgba(255,255,255,0.04)" }}><Search size={17} className="text-white/35 flex-shrink-0" /><TextInput value={search} onChangeText={(value) => setSearch(value)} placeholder="Emploi, appartement, restaurant, événement…" className="w-full bg-transparent text-sm text-white placeholder:text-white/25 outline-none" /></View><Pressable onPress={onSurprise} className="w-12 sm:w-auto sm:px-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform" style={{ borderWidth: 1, borderColor: "rgba(167,139,250,0.3)", borderStyle: "solid" }}><Sparkles size={16} className="text-purple-200" /><Text className="hidden sm:inline text-xs font-black text-purple-100">Surprends-moi
            </Text></Pressable></View><View className="flex flex-wrap gap-2 mt-4">{[
            "À proximité",
            "🔥 Tendances",
            "💼 Opportunités",
            "🎟️ Événements",
          ].map((item) => (
            <Text key={item} className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white/45" style={{ backgroundColor: "rgba(255,255,255,0.045)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}>{item}</Text>
          ))}</View></View>
    </View>
  );
}

function TrendingSection({
  onNavigate,
  onViewProfile,
  onViewPublication,
  onTrackClick,
}: {
  onNavigate: (page: string) => void;
  onViewProfile?: (userId: string) => void;
  onViewPublication?: (publicationId: string) => void;
  onTrackClick: (args: {
    sectionId: string;
    itemId?: string;
    itemType?: string;
    moduleId?: string;
    position?: number;
    metadata?: Record<string, any>;
  }) => void;
}) {
  const trendingTags = useQuery(api.discover.trendingTags, {});
  const trendingPubs = useQuery(api.discover.trendingPublications, {
    limit: 6,
  });
  const suggestedUsers = useQuery(api.discover.suggestedUsers, {}) ?? [];
  const isLoading = trendingTags === undefined || trendingPubs === undefined;

  if (isLoading) {
    return (
      <View><SectionTitle icon={TrendingUp} title="Ce qui fait bouger la communauté" subtitle="Les signaux les plus actifs en ce moment" color="#F97316" /><View className="flex gap-3 overflow-hidden">{Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 min-w-[260px] rounded-3xl" />
          ))}</View></View>
    );
  }

  const hasTags = trendingTags.length > 0;
  const hasPubs = trendingPubs.length > 0;
  const hasUsers = suggestedUsers.length > 0;
  if (!hasTags && !hasPubs && !hasUsers) return null;

  return (
    <View><SectionTitle icon={TrendingUp} title="Ce qui fait bouger la communauté" subtitle="Tendances, publications et personnes à découvrir" color="#F97316" />{hasTags && (
        <View className="flex gap-2 overflow-x-auto pb-1 mb-4" style={{  }}>{trendingTags.slice(0, 12).map((tag, i) => (
            <View key={tag.tag} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl" style={{ backgroundColor: i === 0 ? "rgba(249,115,22,0.13)" : "rgba(139,92,246,0.09)", borderWidth: 0, borderColor: "rgba(249,115,22,0.26)", borderStyle: "solid" }}>
              <Hash
                size={11}
                className={i === 0 ? "text-orange-300" : "text-purple-300"}
              />
              <Text className="text-xs font-bold text-white/70">{tag.tag}</Text>
              <Text className="text-[9px] text-white/30">{tag.count}</Text>
            </View>
          ))}</View>
      )}{hasPubs && (
        <View className="gap-3">{trendingPubs.slice(0, 6).map((pub, i) => (
            <Pressable key={pub._id} onPress={() => {
                onTrackClick({
                  sectionId: "trending_publications",
                  itemId: String(pub._id),
                  itemType: "publication",
                  moduleId: "decouverte",
                  position: i,
                  metadata: { title: pub.title, source: "trending" },
                });
                if (onViewPublication) onViewPublication(String(pub._id));
                else onNavigate("decouverte");
              }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="group relative overflow-hidden rounded-3xl p-3.5 text-left active:scale-[0.99] transition-transform" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
              <View className="flex gap-3">{pub.images.length > 0 ? (
                  <Image className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" source={{ uri: pub.images[0] }} accessibilityLabel="" />
                ) : (
                  <View className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(139,92,246,0.1)" }}><Sparkles size={18} className="text-purple-300/60" /></View>
                )}<View className="min-w-0 flex-1"><Text className="text-sm font-black text-white truncate">{pub.title}</Text><Text className="text-[10px] text-white/35 mt-1 leading-relaxed">{pub.description}</Text><View className="flex items-center gap-3 mt-2"><Text className="text-[9px] text-white/30">♡ {pub.likeCount}</Text><Text className="text-[9px] text-white/30">💬 {pub.commentCount}</Text><Text className="text-[9px] text-white/30">◉ {pub.viewCount}</Text></View></View></View>
              <View className="flex items-center gap-1.5 mt-3"><View className="w-5 h-5 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">{pub.authorAvatar ? (
                    <Image className="w-full h-full object-cover" source={{ uri: pub.authorAvatar }} accessibilityLabel="" />
                  ) : (
                    <UsersIcon size={9} className="text-white/40" />
                  )}</View><Text className="text-[9px] text-white/35 truncate">{pub.authorName}</Text>{pub.tags.length > 0 && (
                  <Text className="text-[9px] text-purple-300/70 truncate">#{pub.tags[0]}</Text>
                )}</View>
            </Pressable>
          ))}</View>
      )}{hasUsers && (
        <View className="mt-5"><View className="flex items-center gap-2 mb-3"><UserPlus size={13} className="text-emerald-300" /><Text className="text-xs font-black text-white/75">Personnes à découvrir
            </Text></View><View className="flex gap-3 overflow-x-auto pb-1" style={{  }}>{suggestedUsers.slice(0, 8).map((user, i) => (
              <Pressable key={user._id} onPress={() => {
                  onTrackClick({
                    sectionId: "trending_people",
                    itemId: String(user._id),
                    itemType: "person",
                    moduleId: "network",
                    position: i,
                    metadata: { name: user.name, source: "suggested_users" },
                  });
                  if (onViewProfile) onViewProfile(String(user._id));
                  else onNavigate("network");
                }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="flex-shrink-0 w-32 p-3 rounded-2xl text-center" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
                <View className="w-12 h-12 mx-auto rounded-full bg-white/10 overflow-hidden flex items-center justify-center mb-2">{user.avatar ? (
                    <Image className="w-full h-full object-cover" source={{ uri: user.avatar }} accessibilityLabel="" />
                  ) : (
                    <UsersIcon size={17} className="text-white/30" />
                  )}</View>
                <Text className="text-[11px] font-bold text-white truncate">{user.name}</Text>
                {user.city && (
                  <Text className="text-[9px] text-white/30 truncate mt-0.5">{user.city}</Text>
                )}
                <Text className="text-[9px] text-emerald-300/50 mt-1">{user.followerCount}abonnés
                </Text>
              </Pressable>
            ))}</View></View>
      )}</View>
  );
}

// ─── Explorer V2 — données backend unifiées ───────────────────────────────────

type BackendCard = {
  id: string;
  kind: string;
  title: string;
  description: string;
  subtitle?: string;
  image?: string;
  city?: string;
  location?: string;
  distanceKm?: number;
  priceLabel?: string;
  rating?: number;
  count?: number;
  badge?: string;
  route: string;
  moduleId: string;
  score: number;
  metadata?: Record<string, any>;
};

type ExplorerBackendData = {
  location: {
    city: string | null;
    radiusKm: number;
    hasCoordinates: boolean;
  };
  search: { query: string; results: BackendCard[]; count: number };
  forYou: BackendCard[];
  nearby: BackendCard[];
  opportunities: BackendCard[];
  events: BackendCard[];
  publications: BackendCard[];
  people: BackendCard[];
  marketplace: BackendCard[];
  counts: Record<string, number>;
};

function BackendCardView({
  card,
  onNavigate,
  onViewProfile,
  onViewPublication,
  onTrackClick,
  sectionId,
  position,
  compact = false,
}: {
  card: BackendCard;
  onNavigate: (page: string) => void;
  onViewProfile?: (userId: string) => void;
  onViewPublication?: (publicationId: string) => void;
  onTrackClick: (args: {
    sectionId: string;
    itemId?: string;
    itemType?: string;
    moduleId?: string;
    position?: number;
    metadata?: Record<string, any>;
  }) => void;
  sectionId: string;
  position: number;
  compact?: boolean;
}) {
  const colors: Record<string, string> = {
    job: "#8B5CF6",
    immo: "#10B981",
    service: "#F97316",
    restaurant: "#F59E0B",
    event: "#EC4899",
    publication: "#06B6D4",
    person: "#3B82F6",
    product: "#F97316",
  };
  const color = colors[card.kind] ?? "#8B5CF6";

  return (
    <Pressable onPress={() => {
        const itemId = String(card.id);
        const itemType = card.kind;
        const rawMetadata = {
          title: card.title,
          route: card.route,
          score: card.score,
          city: card.city,
          location: card.location,
          ...(card.metadata ?? {}),
        };
        const cleanMetadata = Object.fromEntries(
          Object.entries(rawMetadata).filter(
            ([, value]) => value !== undefined,
          ),
        );

        onTrackClick({
          sectionId,
          itemId,
          itemType,
          moduleId: card.moduleId,
          position,
          metadata: cleanMetadata,
        });

        if (card.kind === "person") {
          if (onViewProfile) onViewProfile(itemId);
          else onNavigate(card.route);
          return;
        }

        if (card.kind === "publication") {
          if (onViewPublication) onViewPublication(itemId);
          else onNavigate(card.route);
          return;
        }

        onNavigate(card.route);
      }} whileTap={{ scale: 0.98 }} className={`group relative overflow-hidden text-left rounded-3xl cursor-pointer ${
        compact ? "p-3 min-w-[245px]" : "p-3.5"
      }`} style={{ borderStyle: "solid" }}>
      <View className="flex gap-3">{card.image ? (
          <Image className={`${compact ? "w-16 h-16" : "w-20 h-20"} rounded-2xl object-cover flex-shrink-0 bg-white/5`} source={{ uri: card.image }} accessibilityLabel="" />
        ) : (
          <View className={`${compact ? "w-16 h-16" : "w-20 h-20"} rounded-2xl flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: `${color}15` }}>{card.kind === "job" ? (
              <Briefcase size={20} style={{ color }} />
            ) : card.kind === "immo" ? (
              <Home size={20} style={{ color }} />
            ) : card.kind === "event" ? (
              <CalendarDays size={20} style={{ color }} />
            ) : card.kind === "person" ? (
              <UsersIcon size={20} style={{ color }} />
            ) : card.kind === "product" ? (
              <ShoppingBag size={20} style={{ color }} />
            ) : card.kind === "restaurant" ? (
              <UtensilsCrossed size={20} style={{ color }} />
            ) : (
              <Sparkles size={20} style={{ color }} />
            )}</View>
        )}<View className="min-w-0 flex-1"><View className="flex items-start gap-2"><Text className="text-sm font-black text-white truncate flex-1">{card.title}</Text><ChevronRight size={14} className="text-white/20 flex-shrink-0 mt-0.5" /></View>{card.subtitle && (
            <Text className="text-[10px] text-white/45 mt-0.5 truncate">{card.subtitle}</Text>
          )}<Text className="text-[10px] text-white/30 mt-1 leading-relaxed">{card.description}</Text><View className="flex items-center gap-2 mt-2 flex-wrap">{card.priceLabel && (
              <Text className="text-[10px] font-black" style={{ color }}>{card.priceLabel}</Text>
            )}{card.rating !== undefined && (
              <Text className="text-[9px] text-amber-300/70">★ {card.rating.toFixed(1)}</Text>
            )}{card.distanceKm !== undefined && (
              <Text className="flex items-center gap-1 text-[9px] text-blue-300/65"><Navigation size={9} />{card.distanceKm}km
              </Text>
            )}{card.badge && (
              <Text className="px-1.5 py-0.5 rounded-full text-[8px] font-black" style={{ backgroundColor: `${color}18`, color }}>{card.badge}</Text>
            )}</View></View></View>

      {card.location && (
        <View className="flex items-center gap-1 mt-2 text-[9px] text-white/25 truncate"><MapPin size={9} /><Text className="truncate">{card.location}</Text></View>
      )}
    </Pressable>
  );
}

function BackendCardRow({
  title,
  subtitle,
  icon,
  color,
  cards,
  onNavigate,
  onViewProfile,
  onViewPublication,
  onTrackClick,
  sectionId,
  action,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  cards: BackendCard[];
  onNavigate: (page: string) => void;
  onViewProfile?: (userId: string) => void;
  onViewPublication?: (publicationId: string) => void;
  onTrackClick: (args: {
    sectionId: string;
    itemId?: string;
    itemType?: string;
    moduleId?: string;
    position?: number;
    metadata?: Record<string, any>;
  }) => void;
  sectionId: string;
  action?: () => void;
}) {
  if (!cards.length) return null;
  return (
    <View><SectionTitle icon={icon} title={title} subtitle={subtitle} color={color} action={action} /><View className="flex gap-3 overflow-x-auto pb-1" style={{  }}>{cards.map((card, i) => (
          <BackendCardView
            key={`${card.kind}-${card.id}`}
            card={card}
            onNavigate={onNavigate}
            onViewProfile={onViewProfile}
            onViewPublication={onViewPublication}
            onTrackClick={onTrackClick}
            sectionId={sectionId}
            position={i}
            compact
          />
        ))}</View></View>
  );
}

function ExplorerBackendSections({
  data,
  searching,
  onNavigate,
  onViewProfile,
  onViewPublication,
  onTrackClick,
}: {
  data?: ExplorerBackendData;
  searching: boolean;
  onNavigate: (page: string) => void;
  onViewProfile?: (userId: string) => void;
  onViewPublication?: (publicationId: string) => void;
  onTrackClick: (args: {
    sectionId: string;
    itemId?: string;
    itemType?: string;
    moduleId?: string;
    position?: number;
    metadata?: Record<string, any>;
  }) => void;
}) {
  if (!data) {
    return (
      <View className="space-y-3"><Skeleton className="h-6 w-44" /><View className="flex gap-3 overflow-hidden"><Skeleton className="h-28 min-w-[250px] rounded-3xl" /><Skeleton className="h-28 min-w-[250px] rounded-3xl" /></View></View>
    );
  }

  if (searching) {
    return (
      <View><SectionTitle icon={Search} title={`Résultats pour « ${data.search.query} »`} subtitle={`${data.search.count} résultat${data.search.count > 1 ? "s" : ""} dans tout DébrouillePro`} color="#A78BFA" />{data.search.results.length ? (
          <View className="gap-3">{data.search.results.map((card, i) => (
              <BackendCardView
                key={`${card.kind}-${card.id}`}
                card={card}
                onNavigate={onNavigate}
                onViewProfile={onViewProfile}
                onViewPublication={onViewPublication}
                onTrackClick={onTrackClick}
                sectionId="search_results"
                position={i}
              />
            ))}</View>
        ) : (
          <View className="rounded-3xl p-6 text-center" style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}><Search size={20} className="mx-auto text-white/20" /><Text className="text-xs font-bold text-white/45 mt-2">Aucun résultat multi-module
            </Text><Text className="text-[10px] text-white/25 mt-1">Essayez un métier, une ville, un logement, un produit ou un
              événement.
            </Text></View>
        )}</View>
    );
  }

  return (
    <View className="space-y-8"><BackendCardRow title="Pour vous" subtitle="Une sélection calculée à partir de votre contexte et de vos centres d'intérêt" icon={Sparkles} color="#A78BFA" cards={data.forYou} onNavigate={onNavigate} onViewProfile={onViewProfile} onViewPublication={onViewPublication} onTrackClick={onTrackClick} sectionId="for_you" /><BackendCardRow title="À proximité" subtitle={
          data.location.hasCoordinates
            ? `Dans un rayon de ${data.location.radiusKm} km`
            : data.location.city
              ? `Autour de ${data.location.city}`
              : "Activez votre position pour une découverte locale précise"
        } icon={MapPinned} color="#3B82F6" cards={data.nearby} onNavigate={onNavigate} onViewProfile={onViewProfile} onViewPublication={onViewPublication} onTrackClick={onTrackClick} sectionId="nearby" action={() => onNavigate("carte")} /><BackendCardRow title="Opportunités à saisir" subtitle="Jobs, services, immobilier, produits et occasions utiles" icon={Briefcase} color="#8B5CF6" cards={data.opportunities} onNavigate={onNavigate} onViewProfile={onViewProfile} onViewPublication={onViewPublication} onTrackClick={onTrackClick} sectionId="opportunities" /><BackendCardRow title="Événements" subtitle="Ce qui arrive bientôt autour de vous" icon={CalendarDays} color="#EC4899" cards={data.events} onNavigate={onNavigate} onViewProfile={onViewProfile} onViewPublication={onViewPublication} onTrackClick={onTrackClick} sectionId="events" action={() => onNavigate("evenements")} /><BackendCardRow title="Publications" subtitle="Le contenu qui circule maintenant dans la communauté" icon={Newspaper} color="#06B6D4" cards={data.publications} onNavigate={onNavigate} onViewProfile={onViewProfile} onViewPublication={onViewPublication} onTrackClick={onTrackClick} sectionId="publications" action={() => onNavigate("decouverte")} /><BackendCardRow title="Personnes à découvrir" subtitle="Membres, professionnels et créateurs" icon={UsersIcon} color="#10B981" cards={data.people} onNavigate={onNavigate} onViewProfile={onViewProfile} onViewPublication={onViewPublication} onTrackClick={onTrackClick} sectionId="people" /><BackendCardRow title="Marketplace" subtitle="Produits disponibles maintenant" icon={ShoppingBag} color="#F97316" cards={data.marketplace} onNavigate={onNavigate} onViewProfile={onViewProfile} onViewPublication={onViewPublication} onTrackClick={onTrackClick} sectionId="marketplace" action={() => onNavigate("marketplace")} /></View>
  );
}

export default function ExplorerPage({
  onBack,
  onNavigate,
  onViewProfile,
  onViewPublication,
}: ExplorerPageProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tous");
  const [showTrending, setShowTrending] = useState(true);
  const [surprise, setSurprise] = useState(0);
  const [geo, setGeo] = useState<{ lat: number; lon: number } | null>(null);
  const trackExplorerEvent = useMutation(api.homeAnalytics.trackEvent);
  const [explorerSessionId] = useState(
    () => `explorer-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  );

  const handleTrackClick = ({
    sectionId,
    itemId,
    itemType,
    moduleId,
    position,
    metadata,
  }: {
    sectionId: string;
    itemId?: string;
    itemType?: string;
    moduleId?: string;
    position?: number;
    metadata?: Record<string, any>;
  }) => {
    void trackExplorerEvent({
      event: {
        eventType: "click",
        sessionId: explorerSessionId,
        sectionId,
        itemId,
        itemType,
        moduleId,
        position,
        source: "explorer",
        metadata: metadata ? { ...metadata, source: "explorer" } : undefined,
      },
    }).catch(() => {
      // L'analytics ne doit jamais bloquer la navigation.
    });
  };

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => {
        // Le backend retombe sur la ville du profil si la géolocalisation est refusée.
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  const explorerData = useQuery(api.explorer.getExplorerData, {
    q: search.trim() || undefined,
    latitude: geo?.lat,
    longitude: geo?.lon,
    radiusKm: 25,
    limit: 8,
  }) as ExplorerBackendData | undefined;

  const filtered = MODULES.filter((m) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      m.label.toLowerCase().includes(q) ||
      m.desc.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q);
    const matchCat = category === "Tous" || m.category === category;
    return matchSearch && matchCat;
  });

  const implementedCount = MODULES.filter((m) => m.implemented).length;
  const featured = DISCOVERY_SPOTLIGHTS[surprise % DISCOVERY_SPOTLIGHTS.length];

  const handleModuleClick = (mod: Module) => {
    if (!mod.implemented) {
      toast(`${mod.label} arrive bientôt !`, {
        description: "Module en développement.",
        duration: 2500,
      });
      return;
    }
    handleTrackClick({
      sectionId: "modules",
      itemId: mod.id,
      itemType: "module",
      moduleId: mod.id,
      metadata: { label: mod.label, category: mod.category },
    });
    onNavigate(mod.id);
  };

  const handleSurprise = () => {
    const next = (surprise + 1) % DISCOVERY_SPOTLIGHTS.length;
    setSurprise(next);
    setSearch("");
    setCategory("Tous");
    toast("✨ Une idée pour vous", {
      description: DISCOVERY_SPOTLIGHTS[next].label,
      duration: 2200,
    });
  };

  const searching = Boolean(search.trim()) || category !== "Tous";

  return (
    <View className="relative h-full w-full overflow-hidden flex flex-col" style={{  }}><View className="absolute inset-0 pointer-events-none overflow-hidden"><View className="absolute -top-32 right-[-5%] w-[420px] h-[420px] rounded-full" style={{  }} /><View className="absolute top-[45%] left-[-15%] w-[360px] h-[360px] rounded-full" style={{  }} /></View><View className="relative z-20 flex-shrink-0 px-4 sm:px-6 pt-5 pb-3" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", backgroundColor: "rgba(2,6,23,0.72)" }}><View className="flex items-center gap-3"><Pressable onPress={onBack} className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-transform" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><ArrowLeft size={17} className="text-white/80" /></Pressable><View className="min-w-0"><Text className="text-lg font-black text-white tracking-tight">Explorer
            </Text><Text className="text-[10px] text-white/35"><Text className="text-purple-300 font-bold">{implementedCount}</Text>{" "}modules · le monde DébrouillePro
            </Text></View><View className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl" style={{ backgroundColor: "rgba(139,92,246,0.11)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}><Sparkles size={11} className="text-purple-300" /><Text className="text-[10px] font-black text-purple-300">Pro</Text></View></View></View><View className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6" style={{  }}><View className="max-w-[1400px] mx-auto space-y-8"><HeroSearch search={search} setSearch={setSearch} onSurprise={handleSurprise} />{!searching && (
            <View><SectionTitle icon={Sparkles} title="Commencez par ce qui vous ressemble" subtitle="Les portes d'entrée les plus utiles aujourd'hui" /><View className="gap-3">{DISCOVERY_SPOTLIGHTS.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <Pressable key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onPress={() => {
                        handleTrackClick({
                          sectionId: "spotlights",
                          itemId: item.id,
                          itemType: "module",
                          moduleId: item.id,
                          position: i,
                          metadata: { label: item.label },
                        });
                        onNavigate(item.id);
                      }} className="relative overflow-hidden text-left p-4 rounded-3xl active:scale-[0.98] transition-transform" style={{ borderStyle: "solid" }}>
                      <View className="flex items-start justify-between gap-2"><View className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${item.color}1c` }}><Icon size={20} style={{  }} /></View><Text className="text-white/20 text-lg">↗</Text></View>
                      <Text className="text-sm font-black text-white mt-4">{item.label}</Text>
                      <Text className="text-[10px] text-white/35 mt-1 leading-relaxed">{item.desc}</Text>
                    </Pressable>
                  );
                })}</View></View>
          )}{false && !searching && (
            <View className="relative overflow-hidden rounded-[28px] p-4 sm:p-5" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex flex-col sm:flex-row sm:items-center gap-4"><View className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(59,130,246,0.13)", borderWidth: 1, borderColor: "rgba(59,130,246,0.22)", borderStyle: "solid" }}><MapPin size={22} className="text-blue-300" /></View><View className="flex-1 min-w-0"><Text className="text-sm font-black text-white">Découvrez ce qui se passe autour de vous
                  </Text><Text className="text-[10px] text-white/35 mt-1">Services, commerces, événements, logements et opportunités à
                    proximité.
                  </Text></View><Pressable onPress={() => onNavigate("carte")} className="px-4 py-2.5 rounded-xl text-[10px] font-black text-blue-100 active:scale-95 transition-transform" style={{ backgroundColor: "rgba(59,130,246,0.14)", borderWidth: 1, borderColor: "rgba(59,130,246,0.25)", borderStyle: "solid" }}><Text>Explorer la carte →</Text></Pressable></View></View>
          )}{!searching && showTrending && (
            <TrendingSection
              onNavigate={onNavigate}
              onViewProfile={onViewProfile}
              onViewPublication={onViewPublication}
              onTrackClick={handleTrackClick}
            />
          )}<ExplorerBackendSections data={explorerData} searching={searching} onNavigate={onNavigate} onViewProfile={onViewProfile} onViewPublication={onViewPublication} onTrackClick={handleTrackClick} />{false && !searching && (
            <View><SectionTitle icon={Flame} title="Opportunités à saisir" subtitle="Les univers qui peuvent vous faire gagner du temps, de l'argent ou des connexions" /><View className="gap-3">{[
                  {
                    id: "jobs",
                    label: "Jobs & missions",
                    desc: "Travail · recrutement",
                    icon: Briefcase,
                    color: "#8B5CF6",
                  },
                  {
                    id: "marketplace",
                    label: "Acheter & vendre",
                    desc: "Petites annonces",
                    icon: ShoppingBag,
                    color: "#F97316",
                  },
                  {
                    id: "immo",
                    label: "Immobilier",
                    desc: "Louer · acheter",
                    icon: Home,
                    color: "#10B981",
                  },
                  {
                    id: "business",
                    label: "Business",
                    desc: "Entreprises · PME",
                    icon: TrendingUp,
                    color: "#3B82F6",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Pressable key={item.id} onPress={() => onNavigate(item.id)} className="flex items-center gap-3 p-3.5 rounded-2xl text-left active:scale-[0.98] transition-transform" style={{ backgroundColor: "rgba(255,255,255,0.035)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}><View className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}><Icon size={18} style={{  }} /></View><View className="min-w-0"><Text className="text-xs font-black text-white truncate">{item.label}</Text><Text className="text-[9px] text-white/30 mt-0.5">{item.desc}</Text></View></Pressable>
                  );
                })}</View></View>
          )}{false && !searching && (
            <View><SectionTitle icon={CalendarDays} title="Sortir, apprendre, rencontrer" subtitle="Quelques chemins pour vivre DébrouillePro au-delà du quotidien" /><View className="gap-3">{[
                  {
                    id: "evenements",
                    label: "Événements",
                    desc: "Concerts, rencontres, communautés et activités.",
                    icon: CalendarDays,
                    color: "#EC4899",
                  },
                  {
                    id: "apprendre",
                    label: "Apprendre",
                    desc: "Cours, quiz, certifications et mentorat.",
                    icon: GraduationCap,
                    color: "#F59E0B",
                  },
                  {
                    id: "voyages",
                    label: "Voyager",
                    desc: "Destinations, itinéraires et carnets de voyage.",
                    icon: Plane,
                    color: "#0EA5E9",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Pressable key={item.id} onPress={() => onNavigate(item.id)} className="relative overflow-hidden p-5 rounded-3xl text-left active:scale-[0.99] transition-transform" style={{ borderStyle: "solid" }}><View className="flex items-center justify-between"><View className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${item.color}18` }}><Icon size={21} style={{  }} /></View><Text className="text-white/20">↗</Text></View><Text className="text-base font-black text-white mt-5">{item.label}</Text><Text className="text-[10px] text-white/35 mt-1 max-w-xs leading-relaxed">{item.desc}</Text></Pressable>
                  );
                })}</View></View>
          )}{!searching && (
            <View><SectionTitle icon={Compass} title="Les univers DébrouillePro" subtitle={`${implementedCount} modules actifs répartis dans ${EXPLORER_CATEGORIES.length - 1} univers`} /><View className="gap-3">{DISCOVERY_UNIVERSES.map((universe, i) => {
                  const Icon = universe.icon;
                  const count = MODULES.filter(
                    (m) => m.category === universe.id,
                  ).length;
                  return (
                    <Pressable key={universe.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.035 }} onPress={() => setCategory(universe.id)} className="relative overflow-hidden p-4 rounded-3xl text-left active:scale-[0.98] transition-transform" style={{ borderStyle: "solid" }}>
                      <View className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${universe.color}17` }}><Icon size={19} style={{  }} /></View>
                      <Text className="text-xs font-black text-white mt-3">{universe.id}</Text>
                      <Text className="text-[9px] text-white/30 mt-1">{universe.desc}</Text>
                      <View className="mt-3 text-[9px] font-bold" style={{  }}>{count}<Text>modules →</Text></View>
                    </Pressable>
                  );
                })}</View></View>
          )}<View><View className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4"><SectionTitle icon={Search} title={searching ? "Résultats Explorer" : "Tous les modules"} subtitle={
                  searching
                    ? `${filtered.length} résultat${filtered.length > 1 ? "s" : ""} pour votre recherche`
                    : "Accédez directement à n'importe quel univers"
                } />{!searching && (
                <Pressable onPress={() => setShowTrending((v) => !v)} className="self-start sm:self-auto px-3 py-2 rounded-xl text-[10px] font-bold" style={{ backgroundColor: showTrending
                                      ? "rgba(249,115,22,0.12)"
                                      : "rgba(255,255,255,0.04)", borderColor: "rgba(249,115,22,0.22)", borderStyle: "solid" }}><TrendingUp size={10} className="inline mr-1.5" /><Text>Tendances</Text></Pressable>
              )}</View><View className="flex gap-2 overflow-x-auto pb-3" style={{  }}>{EXPLORER_CATEGORIES.map((cat) => (
                <Pressable key={cat} onPress={() => setCategory(cat)} className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold active:scale-95 transition-transform" style={{ backgroundColor: category === cat
                                        ? "rgba(139,92,246,0.18)"
                                        : "rgba(255,255,255,0.045)", borderColor: "rgba(139,92,246,0.32)", borderStyle: "solid" }}>{cat}</Pressable>
              ))}</View><View>{filtered.length === 0 ? (
                <View key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 rounded-3xl" style={{ backgroundColor: "rgba(255,255,255,0.025)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "dashed" }}>
                  <Search size={24} className="text-white/15" />
                  <Text className="text-white/40 text-sm mt-3">Aucune découverte ne correspond à votre recherche.
                  </Text>
                  <Pressable onPress={() => {
                      setSearch("");
                      setCategory("Tous");
                    }} className="mt-3 text-[10px] font-bold text-purple-300"><Text>Réinitialiser →</Text></Pressable>
                </View>
              ) : (
                <View key={category + search} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="gap-3">
                  {filtered.map((mod, i) => {
                    const Icon = mod.icon;
                    return (
                      <Pressable key={mod.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.018, 0.25) }} onPress={() => handleModuleClick(mod)} className="relative flex items-start gap-3 p-4 rounded-3xl text-left active:scale-[0.98] transition-transform" style={{ borderStyle: "solid" }}>
                        <View className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${mod.color}19` }}><Icon size={19} style={{  }} /></View>
                        <View className="min-w-0"><View className="flex items-center gap-1 flex-wrap"><Text className="text-xs font-black text-white truncate">{mod.label}</Text>{mod.isNew && (
                              <Text className="px-1.5 py-0.5 rounded-full text-[7px] font-black text-white" style={{  }}>
                                NEW
                              </Text>
                            )}</View><Text className="text-[9px] text-white/35 mt-1 leading-relaxed">{mod.desc}</Text></View>
                      </Pressable>
                    );
                  })}
                </View>
              )}</View></View>{!searching && (
            <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative overflow-hidden rounded-[30px] p-6 sm:p-8 text-center" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
              <Sparkles size={18} className="mx-auto text-purple-300" />
              <Text className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35 mt-3">
                Et si aujourd'hui…
              </Text>
              <Text className="text-xl sm:text-2xl font-black text-white mt-2">{featured.label}</Text>
              <Text className="text-[10px] text-white/35 mt-1">{featured.desc}</Text>
              <View className="flex justify-center gap-2 mt-5">
                <Pressable onPress={() => {
                    handleTrackClick({
                      sectionId: "featured_idea",
                      itemId: featured.id,
                      itemType: "module",
                      moduleId: featured.id,
                      metadata: { label: featured.label },
                    });
                    onNavigate(featured.id);
                  }} className="px-5 py-2.5 rounded-xl text-[10px] font-black text-white active:scale-95 transition-transform" style={{ boxShadow: `0 8px 28px ${featured.color}20` }}>
                  Découvrir maintenant →
                </Pressable>
                <Pressable onPress={handleSurprise} className="px-4 py-2.5 rounded-xl text-[10px] font-bold text-white/55" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                  Une autre idée
                </Pressable>
              </View>
            </View>
          )}<View className="h-3" /></View></View></View>
  );
}

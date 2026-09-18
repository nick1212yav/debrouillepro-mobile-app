import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import * as Location from "expo-location";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Award,
  BarChart2,
  BedDouble,
  Bike,
  BookMarked,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  Camera,
  Car,
  ChevronRight,
  Church,
  Clock,
  Compass,
  Coffee,
  Cpu,
  CreditCard,
  Database,
  Film,
  Flame,
  Globe,
  GraduationCap,
  HandHeart,
  Hash,
  Heart,
  Home,
  Landmark,
  Layers,
  Leaf,
  Lightbulb,
  Map,
  MapPin,
  MapPinned,
  Megaphone,
  MessageSquare,
  Microscope,
  Mountain,
  Navigation,
  Network,
  Newspaper,
  Package,
  PenTool,
  Plane,
  Radio,
  Scale,
  Search,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Stethoscope,
  Target,
  TrendingUp,
  Trophy,
  TreePine,
  Tv,
  UtensilsCrossed,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import AIBanner from "@/pages/home/_components/AIBanner.tsx";
import AIPersonalizedSuggestion from "@/pages/home/_components/AIPersonalizedSuggestion.tsx";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type Module = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  desc: string;
  implemented: boolean;
  isNew?: boolean;
  category: string;
};

type TrackArgs = {
  sectionId: string;
  itemId?: string;
  itemType?: string;
  moduleId?: string;
  position?: number;
  metadata?: Record<string, unknown>;
};

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
  metadata?: Record<string, unknown>;
};

type ExplorerBackendData = {
  location: {
    city: string | null;
    radiusKm: number;
    hasCoordinates: boolean;
  };
  search: {
    query: string;
    results: BackendCard[];
    count: number;
  };
  forYou: BackendCard[];
  nearby: BackendCard[];
  opportunities: BackendCard[];
  events: BackendCard[];
  publications: BackendCard[];
  people: BackendCard[];
  marketplace: BackendCard[];
  counts: Record<string, number>;
};

type ExplorerPageProps = {
  onBack: () => void;
  onNavigate: (page: string) => void;
  onViewProfile?: (userId: string) => void;
  onViewPublication?: (publicationId: string) => void;
};

/* ============================================================================
 * MODULE CATALOGUE
 * ========================================================================== */

const MODULES: Module[] = [
  // --------------------------------------------------------------------------
  // VIE QUOTIDIENNE
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // TRAVAIL & FINANCES
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // MOBILITÉ
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // SANTÉ
  // --------------------------------------------------------------------------

  {
    id: "sante",
    label: "Santé",
    icon: Heart,
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

  // --------------------------------------------------------------------------
  // ÉDUCATION
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // COMMUNAUTÉ
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // MÉDIAS
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // AGRICULTURE
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // GOUVERNANCE
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // ONG
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // TECH
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // GESTION
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // ANNONCES
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // MESSAGES
  // --------------------------------------------------------------------------

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
    icon: Activity,
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
  ...Array.from(new Set(MODULES.map((module) => module.category))),
];

/* ============================================================================
 * DISCOVERY LAYERS
 * ========================================================================== */

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
    icon: Briefcase, // ← APRÈS
    color: "#8B5CF6",
  },
  {
    id: "evenements",
    label: "Sortir & rencontrer",
    desc: "Événements et communautés",
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
] as const;

const DISCOVERY_UNIVERSES = [
  {
    id: "Vie quotidienne",
    icon: Home,
    color: "#10B981",
    desc: "Logement · services · restauration",
  },
  {
    id: "Travail & Finances",
    icon: TrendingUp,
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
    icon: Heart,
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
] as const;

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function moduleForKind(kind: string) {
  const map: Record<string, string> = {
    job: "jobs",
    immo: "immo",
    service: "services",
    restaurant: "restauration",
    event: "evenements",
    publication: "decouverte",
    person: "network",
    product: "marketplace",
  };

  return map[kind] ?? kind;
}

function colorForKind(kind: string) {
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

  return colors[kind] ?? "#A78BFA";
}

/* ============================================================================
 * SECTION TITLE
 * ========================================================================== */

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
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeading}>
        <View style={[styles.sectionIcon, { backgroundColor: `${color}18` }]}>
          <Icon size={14} color={color} />
        </View>

        <View style={styles.flex1}>
          <Text style={styles.sectionTitle}>{title}</Text>

          {subtitle ? (
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
      </View>

      {action ? (
        <Pressable
          onPress={action}
          hitSlop={8}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.smallAction,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.smallActionText}>Tout voir</Text>

          <ChevronRight size={12} color="rgba(255,255,255,0.4)" />
        </Pressable>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * HERO
 * ========================================================================== */

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
    <View style={styles.hero}>
      <View
        pointerEvents="none"
        style={[styles.heroGlow, styles.heroGlowRight]}
      />

      <View
        pointerEvents="none"
        style={[styles.heroGlow, styles.heroGlowLeft]}
      />

      <View style={styles.heroContent}>
        <View style={styles.eyebrow}>
          <Sparkles size={12} color="#C4B5FD" />

          <Text style={styles.eyebrowText}>DÉCOUVERTE INTELLIGENTE</Text>
        </View>

        <Text style={styles.heroTitle}>
          Qu'avez-vous envie{"\n"}
          <Text style={styles.heroAccent}>de découvrir ?</Text>
        </Text>

        <Text style={styles.heroDescription}>
          Un lieu, une opportunité, un service, une personne, un événement ou
          quelque chose que vous n'aviez pas encore pensé à chercher.
        </Text>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={18} color="rgba(255,255,255,0.38)" />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Emploi, appartement, restaurant, événement…"
              placeholderTextColor="rgba(255,255,255,0.25)"
              style={styles.searchInput}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              accessibilityLabel="Rechercher"
            />
          </View>

          <Pressable
            onPress={onSurprise}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.surpriseButton,
              pressed && styles.pressed,
            ]}
          >
            <Sparkles size={16} color="#DDD6FE" />

            <Text style={styles.surpriseText}>Surprends-moi</Text>
          </Pressable>
        </View>

        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <MapPinned size={10} color="rgba(255,255,255,0.4)" />
            <Text style={styles.chipText}>À proximité</Text>
          </View>

          <View style={styles.chip}>
            <TrendingUp size={10} color="rgba(255,255,255,0.4)" />
            <Text style={styles.chipText}>Tendances</Text>
          </View>

          <View style={styles.chip}>
            <Briefcase size={10} color="rgba(255,255,255,0.4)" />
            <Text style={styles.chipText}>Opportunités</Text>
          </View>

          <View style={styles.chip}>
            <CalendarDays size={10} color="rgba(255,255,255,0.4)" />
            <Text style={styles.chipText}>Événements</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * BACKEND CARD
 * ========================================================================== */

function BackendCardView({
  card,
  compact = false,
  onNavigate,
  onViewProfile,
  onViewPublication,
  onTrackClick,
  sectionId,
  position,
}: {
  card: BackendCard;
  compact?: boolean;
  onNavigate: (page: string) => void;
  onViewProfile?: (userId: string) => void;
  onViewPublication?: (publicationId: string) => void;
  onTrackClick: (args: TrackArgs) => void;
  sectionId: string;
  position: number;
}) {
  const color = colorForKind(card.kind);

  const handlePress = () => {
    const id = String(card.id);

    const metadata: Record<string, unknown> = {
      title: card.title,
      route: card.route,
      score: card.score,
    };

    if (card.city !== undefined) {
      metadata.city = card.city;
    }

    if (card.location !== undefined) {
      metadata.location = card.location;
    }

    if (card.metadata) {
      Object.assign(metadata, card.metadata);
    }

    onTrackClick({
      sectionId,
      itemId: id,
      itemType: card.kind,
      moduleId: card.moduleId || moduleForKind(card.kind),
      position,
      metadata,
    });

    if (card.kind === "person" && onViewProfile) {
      onViewProfile(id);
      return;
    }

    if (card.kind === "publication" && onViewPublication) {
      onViewPublication(id);
      return;
    }

    onNavigate(card.route);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={card.title}
      style={({ pressed }) => [
        styles.card,
        compact && styles.compactCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardMain}>
        {card.image ? (
          <Image
            source={{ uri: card.image }}
            style={compact ? styles.compactImage : styles.cardImage}
            resizeMode="cover"
            accessibilityLabel={card.title}
          />
        ) : (
          <View
            style={[
              compact ? styles.compactImage : styles.cardImage,
              styles.imagePlaceholder,
              {
                backgroundColor: `${color}18`,
              },
            ]}
          >
            {card.kind === "job" ? (
              <Briefcase size={20} color={color} />
            ) : card.kind === "immo" ? (
              <Home size={20} color={color} />
            ) : card.kind === "event" ? (
              <CalendarDays size={20} color={color} />
            ) : card.kind === "person" ? (
              <Users size={20} color={color} />
            ) : card.kind === "product" ? (
              <ShoppingBag size={20} color={color} />
            ) : card.kind === "restaurant" ? (
              <UtensilsCrossed size={20} color={color} />
            ) : (
              <Sparkles size={20} color={color} />
            )}
          </View>
        )}

        <View style={styles.flex1}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {card.title}
            </Text>

            <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
          </View>

          {card.subtitle ? (
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {card.subtitle}
            </Text>
          ) : null}

          <Text style={styles.cardDescription} numberOfLines={2}>
            {card.description}
          </Text>

          <View style={styles.metaRow}>
            {card.priceLabel ? (
              <Text style={[styles.price, { color }]}>{card.priceLabel}</Text>
            ) : null}

            {card.rating !== undefined ? (
              <Text style={styles.rating}>★ {card.rating.toFixed(1)}</Text>
            ) : null}

            {card.distanceKm !== undefined ? (
              <View style={styles.inlineMeta}>
                <Navigation size={9} color="#93C5FD" />

                <Text style={styles.distance}>{card.distanceKm} km</Text>
              </View>
            ) : null}

            {card.badge ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: `${color}18`,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color }]}>{card.badge}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {card.location ? (
        <View style={styles.locationRow}>
          <MapPin size={10} color="rgba(255,255,255,0.28)" />

          <Text style={styles.locationText} numberOfLines={1}>
            {card.location}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/* ============================================================================
 * HORIZONTAL BACKEND SECTION
 * ========================================================================== */

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
  onTrackClick: (args: TrackArgs) => void;
  sectionId: string;
  action?: () => void;
}) {
  if (!cards.length) {
    return null;
  }

  return (
    <View>
      <SectionTitle
        icon={icon}
        title={title}
        subtitle={subtitle}
        color={color}
        action={action}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalContent}
      >
        {cards.map((card, index) => (
          <BackendCardView
            key={`${card.kind}-${card.id}`}
            card={card}
            compact
            onNavigate={onNavigate}
            onViewProfile={onViewProfile}
            onViewPublication={onViewPublication}
            onTrackClick={onTrackClick}
            sectionId={sectionId}
            position={index}
          />
        ))}
      </ScrollView>
    </View>
  );
}

/* ============================================================================
 * TRENDING
 * ========================================================================== */

function TrendingSection({
  onNavigate,
  onViewProfile,
  onViewPublication,
  onTrackClick,
}: {
  onNavigate: (page: string) => void;
  onViewProfile?: (userId: string) => void;
  onViewPublication?: (publicationId: string) => void;
  onTrackClick: (args: TrackArgs) => void;
}) {
  const trendingTags = useQuery(api.discover.trendingTags, {});

  const trendingPubs = useQuery(api.discover.trendingPublications, {
    limit: 6,
  });

  const suggestedUsers = useQuery(api.discover.suggestedUsers, {}) ?? [];

  const loading = trendingTags === undefined || trendingPubs === undefined;

  if (loading) {
    return (
      <View>
        <SectionTitle
          icon={TrendingUp}
          title="Ce qui fait bouger la communauté"
          subtitle="Tendances, publications et personnes à découvrir"
          color="#F97316"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContent}
        >
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} style={styles.trendSkeleton} />
          ))}
        </ScrollView>
      </View>
    );
  }

  const hasTags = trendingTags.length > 0;

  const hasPubs = trendingPubs.length > 0;

  const hasUsers = suggestedUsers.length > 0;

  if (!hasTags && !hasPubs && !hasUsers) {
    return null;
  }

  return (
    <View>
      <SectionTitle
        icon={TrendingUp}
        title="Ce qui fait bouger la communauté"
        subtitle="Tendances, publications et personnes à découvrir"
        color="#F97316"
      />

      {hasTags ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContent}
          style={styles.tagScroll}
        >
          {trendingTags.slice(0, 12).map((tag, index) => (
            <View
              key={tag.tag}
              style={[styles.trendTag, index === 0 && styles.trendTagActive]}
            >
              <Hash size={11} color={index === 0 ? "#FDBA74" : "#C4B5FD"} />

              <Text style={styles.trendTagText}>{tag.tag}</Text>

              <Text style={styles.trendTagCount}>{tag.count}</Text>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {hasPubs ? (
        <View style={styles.stackGap}>
          {trendingPubs.slice(0, 6).map((pub, index) => (
            <Pressable
              key={pub._id}
              onPress={() => {
                onTrackClick({
                  sectionId: "trending_publications",
                  itemId: String(pub._id),
                  itemType: "publication",
                  moduleId: "decouverte",
                  position: index,
                  metadata: {
                    title: pub.title,
                    source: "trending",
                  },
                });

                if (onViewPublication) {
                  onViewPublication(String(pub._id));
                } else {
                  onNavigate("decouverte");
                }
              }}
              style={({ pressed }) => [
                styles.trendingPublication,
                pressed && styles.cardPressed,
              ]}
            >
              {pub.images?.[0] ? (
                <Image
                  source={{
                    uri: pub.images[0],
                  }}
                  style={styles.trendingImage}
                  resizeMode="cover"
                  accessibilityLabel={pub.title}
                />
              ) : (
                <View style={[styles.trendingImage, styles.imagePlaceholder]}>
                  <Sparkles size={18} color="#C4B5FD" />
                </View>
              )}

              <View style={styles.flex1}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {pub.title}
                </Text>

                <Text style={styles.cardDescription} numberOfLines={2}>
                  {pub.description}
                </Text>

                <View style={styles.statsRow}>
                  <Text style={styles.statText}>♡ {pub.likeCount}</Text>

                  <Text style={styles.statText}>💬 {pub.commentCount}</Text>

                  <Text style={styles.statText}>◉ {pub.viewCount}</Text>
                </View>

                <Text style={styles.authorText} numberOfLines={1}>
                  {pub.authorName}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {hasUsers ? (
        <View style={styles.peopleBlock}>
          <View style={styles.peopleHeading}>
            <UserPlus size={13} color="#86EFAC" />

            <Text style={styles.peopleHeadingText}>Personnes à découvrir</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalContent}
          >
            {suggestedUsers.slice(0, 8).map((user, index) => (
              <Pressable
                key={user._id}
                onPress={() => {
                  onTrackClick({
                    sectionId: "trending_people",
                    itemId: String(user._id),
                    itemType: "person",
                    moduleId: "network",
                    position: index,
                    metadata: {
                      name: user.name,
                      source: "suggested_users",
                    },
                  });

                  if (onViewProfile) {
                    onViewProfile(String(user._id));
                  } else {
                    onNavigate("network");
                  }
                }}
                style={({ pressed }) => [
                  styles.personCard,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.avatar}>
                  {user.avatar ? (
                    <Image
                      source={{
                        uri: user.avatar,
                      }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                      accessibilityLabel={user.name}
                    />
                  ) : (
                    <Users size={17} color="rgba(255,255,255,0.32)" />
                  )}
                </View>

                <Text style={styles.personName} numberOfLines={1}>
                  {user.name}
                </Text>

                {user.city ? (
                  <Text style={styles.personCity} numberOfLines={1}>
                    {user.city}
                  </Text>
                ) : null}

                <Text style={styles.personFollowers}>
                  {user.followerCount} abonnés
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * BACKEND DISCOVERY
 * ========================================================================== */

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
  onTrackClick: (args: TrackArgs) => void;
}) {
  if (!data) {
    return (
      <View style={styles.loadingBlock}>
        <Skeleton style={styles.skeletonTitle} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContent}
        >
          <Skeleton style={styles.backendSkeleton} />

          <Skeleton style={styles.backendSkeleton} />
        </ScrollView>
      </View>
    );
  }

  if (searching) {
    return (
      <View>
        <SectionTitle
          icon={Search}
          title={`Résultats pour « ${data.search.query} »`}
          subtitle={`${data.search.count} résultat${
            data.search.count > 1 ? "s" : ""
          } dans tout l'écosystème`}
        />

        {data.search.results.length ? (
          <View style={styles.stackGap}>
            {data.search.results.map((card, index) => (
              <BackendCardView
                key={`${card.kind}-${card.id}`}
                card={card}
                onNavigate={onNavigate}
                onViewProfile={onViewProfile}
                onViewPublication={onViewPublication}
                onTrackClick={onTrackClick}
                sectionId="search_results"
                position={index}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Search size={24} color="rgba(255,255,255,0.18)" />

            <Text style={styles.emptyTitle}>Aucun résultat multi-module</Text>

            <Text style={styles.emptyText}>
              Essayez un métier, une ville, un logement, un produit ou un
              événement.
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.stackGapLarge}>
      <BackendCardRow
        title="Pour vous"
        subtitle="Une sélection issue des données disponibles pour votre contexte"
        icon={Sparkles}
        color="#A78BFA"
        cards={data.forYou}
        onNavigate={onNavigate}
        onViewProfile={onViewProfile}
        onViewPublication={onViewPublication}
        onTrackClick={onTrackClick}
        sectionId="for_you"
      />

      <BackendCardRow
        title="À proximité"
        subtitle={
          data.location.hasCoordinates
            ? `Dans un rayon de ${data.location.radiusKm} km`
            : data.location.city
              ? `Autour de ${data.location.city}`
              : "Activez votre position pour une découverte locale précise"
        }
        icon={MapPinned}
        color="#3B82F6"
        cards={data.nearby}
        onNavigate={onNavigate}
        onViewProfile={onViewProfile}
        onViewPublication={onViewPublication}
        onTrackClick={onTrackClick}
        sectionId="nearby"
        action={() => onNavigate("carte")}
      />

      <BackendCardRow
        title="Opportunités à saisir"
        subtitle="Jobs, services, immobilier, produits et occasions utiles"
        icon={Target}
        color="#8B5CF6"
        cards={data.opportunities}
        onNavigate={onNavigate}
        onViewProfile={onViewProfile}
        onViewPublication={onViewPublication}
        onTrackClick={onTrackClick}
        sectionId="opportunities"
      />

      <BackendCardRow
        title="Événements"
        subtitle="Ce qui arrive bientôt"
        icon={CalendarDays}
        color="#EC4899"
        cards={data.events}
        onNavigate={onNavigate}
        onViewProfile={onViewProfile}
        onViewPublication={onViewPublication}
        onTrackClick={onTrackClick}
        sectionId="events"
        action={() => onNavigate("evenements")}
      />

      <BackendCardRow
        title="Publications"
        subtitle="Le contenu qui circule dans la communauté"
        icon={Newspaper}
        color="#06B6D4"
        cards={data.publications}
        onNavigate={onNavigate}
        onViewProfile={onViewProfile}
        onViewPublication={onViewPublication}
        onTrackClick={onTrackClick}
        sectionId="publications"
        action={() => onNavigate("decouverte")}
      />

      <BackendCardRow
        title="Personnes à découvrir"
        subtitle="Membres, professionnels et créateurs"
        icon={Users}
        color="#10B981"
        cards={data.people}
        onNavigate={onNavigate}
        onViewProfile={onViewProfile}
        onViewPublication={onViewPublication}
        onTrackClick={onTrackClick}
        sectionId="people"
      />

      <BackendCardRow
        title="Marketplace"
        subtitle="Produits disponibles maintenant"
        icon={ShoppingBag}
        color="#F97316"
        cards={data.marketplace}
        onNavigate={onNavigate}
        onViewProfile={onViewProfile}
        onViewPublication={onViewPublication}
        onTrackClick={onTrackClick}
        sectionId="marketplace"
        action={() => onNavigate("marketplace")}
      />
    </View>
  );
}

/* ============================================================================
 * MAIN PAGE
 * ========================================================================== */

export default function ExplorerPage({
  onBack,
  onNavigate,
  onViewProfile,
  onViewPublication,
}: ExplorerPageProps) {
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("Tous");

  const [showTrending, setShowTrending] = useState(true);

  const [surpriseIndex, setSurpriseIndex] = useState(0);

  const [geo, setGeo] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  const [explorerSessionId] = useState(
    () => `explorer-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  );

  const trackExplorerEvent = useMutation(api.homeAnalytics.trackEvent);

  /*
   * IMPORTANT :
   * La géolocalisation n'est jamais demandée au démarrage.
   * Elle n'est obtenue qu'après une action explicite de l'utilisateur.
   */
  const requestLocation = async () => {
    if (Platform.OS === "web") {
      return;
    }

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setGeo({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      });
    } catch {
      /*
       * L'utilisateur peut continuer sans position.
       * Le backend utilise alors les informations disponibles
       * dans son contexte.
       */
    }
  };

  const handleTrackClick = ({
    sectionId,
    itemId,
    itemType,
    moduleId,
    position,
    metadata,
  }: TrackArgs) => {
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
        metadata,
      },
    }).catch(() => {
      /*
       * Analytics non bloquante :
       * aucune navigation ne doit dépendre
       * de la réussite du tracking.
       */
    });
  };

  const explorerData = useQuery(api.explorer.getExplorerData, {
    q: search.trim() || undefined,
    latitude: geo?.lat,
    longitude: geo?.lon,
    radiusKm: 25,
    limit: 8,
  }) as ExplorerBackendData | undefined;

  const filteredModules = useMemo(() => {
    const query = search.trim().toLowerCase();

    return MODULES.filter((module) => {
      const matchesSearch =
        !query ||
        module.label.toLowerCase().includes(query) ||
        module.desc.toLowerCase().includes(query) ||
        module.category.toLowerCase().includes(query);

      const matchesCategory =
        category === "Tous" || module.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  const implementedCount = MODULES.filter(
    (module) => module.implemented,
  ).length;

  const searching = Boolean(search.trim()) || category !== "Tous";

  /*
   * Le mode "Surprends-moi" exploite d'abord
   * les vrais résultats du backend lorsqu'ils existent.
   * Le catalogue statique n'est qu'une porte d'entrée
   * vers un module existant.
   */
  const surpriseCard =
    explorerData?.forYou?.[
      surpriseIndex % Math.max(explorerData.forYou.length, 1)
    ];

  const surpriseModule =
    DISCOVERY_SPOTLIGHTS[surpriseIndex % DISCOVERY_SPOTLIGHTS.length];

  const handleSurprise = () => {
    setSearch("");
    setCategory("Tous");

    if (explorerData?.forYou?.length) {
      const next = (surpriseIndex + 1) % explorerData.forYou.length;

      setSurpriseIndex(next);
      return;
    }

    setSurpriseIndex((value) => (value + 1) % DISCOVERY_SPOTLIGHTS.length);
  };

  const handleModuleClick = (module: Module) => {
    if (!module.implemented) {
      return;
    }

    handleTrackClick({
      sectionId: "modules",
      itemId: module.id,
      itemType: "module",
      moduleId: module.id,
      metadata: {
        label: module.label,
        category: module.category,
      },
    });

    onNavigate(module.id);
  };

  const handleSpotlight = (id: string, label: string, index: number) => {
    handleTrackClick({
      sectionId: "spotlights",
      itemId: id,
      itemType: "module",
      moduleId: id,
      position: index,
      metadata: {
        label,
      },
    });

    onNavigate(id);
  };

  const handleUniverse = (id: string) => {
    setCategory(id);
    setSearch("");
  };

  const resetFilters = () => {
    setSearch("");
    setCategory("Tous");
  };

  return (
    <View style={styles.screen}>
      {/* ------------------------------------------------------------------ */}
      {/* ATMOSPHERE                                                         */}
      {/* ------------------------------------------------------------------ */}

      <View pointerEvents="none" style={styles.backgroundLayer}>
        <View style={[styles.backgroundOrb, styles.orbRight]} />

        <View style={[styles.backgroundOrb, styles.orbLeft]} />
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={18} color="rgba(255,255,255,0.84)" />
        </Pressable>

        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>Explorer</Text>

          <Text style={styles.headerSubtitle}>
            <Text style={styles.headerCount}>{implementedCount}</Text> modules ·
            un univers à explorer
          </Text>
        </View>

        <View style={styles.proPill}>
          <Sparkles size={11} color="#C4B5FD" />

          <Text style={styles.proText}>PRO</Text>
        </View>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* CONTENT                                                            */}
      {/* ------------------------------------------------------------------ */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          isTablet && styles.contentTablet,
        ]}
      >
        {/* HERO ------------------------------------------------------------ */}

        <HeroSearch
          search={search}
          setSearch={setSearch}
          onSurprise={handleSurprise}
        />

        {/* IA DISCOVERY ---------------------------------------------------- */}

        {!searching ? (
          <View style={styles.aiDiscoverySection}>
            <AIBanner
              onOpenAI={() => onNavigate("ai-studio")}
              onOpenStudio={() => onNavigate("ai-studio")}
            />

            <AIPersonalizedSuggestion
              onNavigate={onNavigate}
              onOpenStudio={() => onNavigate("ai-studio")}
            />
          </View>
        ) : null}

        {/* QUICK DOORS ---------------------------------------------------- */}

        {!searching ? (
          <View>
            <SectionTitle
              icon={Sparkles}
              title="Commencez par ce qui vous ressemble"
              subtitle="Des portes d'entrée vers les usages les plus utiles"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalContent}
            >
              {DISCOVERY_SPOTLIGHTS.map((item, index) => {
                const Icon = item.icon;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleSpotlight(item.id, item.label, index)}
                    style={({ pressed }) => [
                      styles.spotlight,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.spotlightIcon,
                        {
                          backgroundColor: `${item.color}1C`,
                        },
                      ]}
                    >
                      <Icon size={20} color={item.color} />
                    </View>

                    <Text style={styles.spotlightTitle}>{item.label}</Text>

                    <Text style={styles.spotlightDescription}>{item.desc}</Text>

                    <ArrowUpRight
                      size={16}
                      color="rgba(255,255,255,0.24)"
                      style={styles.spotlightArrow}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* LOCATION ------------------------------------------------------- */}

        {!searching && !geo ? (
          <Pressable
            onPress={requestLocation}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.locationBanner,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.locationIcon}>
              <MapPinned size={20} color="#93C5FD" />
            </View>

            <View style={styles.flex1}>
              <Text style={styles.locationBannerTitle}>
                Rendez Explorer local
              </Text>

              <Text style={styles.locationBannerText}>
                Activez votre position lorsque vous le souhaitez pour découvrir
                les contenus et services réellement proches.
              </Text>
            </View>

            <ChevronRight size={18} color="rgba(255,255,255,0.28)" />
          </Pressable>
        ) : null}

        {/* TRENDING ------------------------------------------------------- */}

        {!searching && showTrending ? (
          <TrendingSection
            onNavigate={onNavigate}
            onViewProfile={onViewProfile}
            onViewPublication={onViewPublication}
            onTrackClick={handleTrackClick}
          />
        ) : null}

        {/* REAL BACKEND DISCOVERY ----------------------------------------- */}

        <ExplorerBackendSections
          data={explorerData}
          searching={searching}
          onNavigate={onNavigate}
          onViewProfile={onViewProfile}
          onViewPublication={onViewPublication}
          onTrackClick={handleTrackClick}
        />

        {/* UNIVERSES ------------------------------------------------------ */}

        {!searching ? (
          <View>
            <SectionTitle
              icon={Compass}
              title="Les univers DébrouillePro"
              subtitle={`${implementedCount} modules actifs répartis dans ${EXPLORER_CATEGORIES.length - 1} univers`}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalContent}
            >
              {DISCOVERY_UNIVERSES.map((universe) => {
                const Icon = universe.icon;

                const count = MODULES.filter(
                  (module) => module.category === universe.id,
                ).length;

                return (
                  <Pressable
                    key={universe.id}
                    onPress={() => handleUniverse(universe.id)}
                    style={({ pressed }) => [
                      styles.universeCard,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.spotlightIcon,
                        {
                          backgroundColor: `${universe.color}17`,
                        },
                      ]}
                    >
                      <Icon size={19} color={universe.color} />
                    </View>

                    <Text style={styles.universeTitle}>{universe.id}</Text>

                    <Text style={styles.universeDescription} numberOfLines={2}>
                      {universe.desc}
                    </Text>

                    <Text
                      style={[
                        styles.universeCount,
                        {
                          color: universe.color,
                        },
                      ]}
                    >
                      {count} modules →
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* MODULE EXPLORER ------------------------------------------------ */}

        <View>
          <View style={styles.modulesHeader}>
            <View style={styles.flex1}>
              <SectionTitle
                icon={Search}
                title={searching ? "Résultats Explorer" : "Tous les modules"}
                subtitle={
                  searching
                    ? `${filteredModules.length} résultat${
                        filteredModules.length > 1 ? "s" : ""
                      } dans le catalogue`
                    : "Accédez directement à n'importe quel univers"
                }
              />
            </View>

            {!searching ? (
              <Pressable
                onPress={() => setShowTrending((value) => !value)}
                style={({ pressed }) => [
                  styles.trendingToggle,
                  showTrending && styles.trendingToggleActive,
                  pressed && styles.pressed,
                ]}
              >
                <TrendingUp
                  size={11}
                  color={showTrending ? "#FDBA74" : "rgba(255,255,255,0.45)"}
                />

                <Text style={styles.trendingToggleText}>Tendances</Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalContent}
          >
            {EXPLORER_CATEGORIES.map((item) => {
              const active = category === item;

              return (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    active && styles.categoryChipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      active && styles.categoryTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {filteredModules.length === 0 ? (
            <View style={styles.emptyState}>
              <Search size={24} color="rgba(255,255,255,0.16)" />

              <Text style={styles.emptyTitle}>Rien ne correspond</Text>

              <Text style={styles.emptyText}>
                Modifiez votre recherche ou choisissez un autre univers.
              </Text>

              <Pressable onPress={resetFilters} style={styles.resetButton}>
                <Text style={styles.resetText}>Réinitialiser</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.moduleGrid}>
              {filteredModules.map((module) => {
                const Icon = module.icon;

                return (
                  <Pressable
                    key={module.id}
                    onPress={() => handleModuleClick(module)}
                    accessibilityRole="button"
                    accessibilityLabel={`${module.label}. ${module.desc}`}
                    style={({ pressed }) => [
                      styles.moduleCard,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.moduleIcon,
                        {
                          backgroundColor: `${module.color}19`,
                        },
                      ]}
                    >
                      <Icon size={19} color={module.color} />
                    </View>

                    <View style={styles.flex1}>
                      <View style={styles.moduleTitleRow}>
                        <Text style={styles.moduleTitle} numberOfLines={1}>
                          {module.label}
                        </Text>

                        {module.isNew ? (
                          <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>NEW</Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={styles.moduleDescription} numberOfLines={2}>
                        {module.desc}
                      </Text>
                    </View>

                    <ChevronRight size={14} color="rgba(255,255,255,0.18)" />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* SURPRISE EXPERIENCE -------------------------------------------- */}

        {!searching ? (
          <View style={styles.featured}>
            <View pointerEvents="none" style={styles.featuredOrb} />

            <Sparkles size={18} color="#C4B5FD" />

            <Text style={styles.featuredEyebrow}>ET SI AUJOURD'HUI…</Text>

            {surpriseCard ? (
              <>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {surpriseCard.title}
                </Text>

                <Text style={styles.featuredDescription} numberOfLines={2}>
                  {surpriseCard.description}
                </Text>

                <View style={styles.featuredActions}>
                  <Pressable
                    onPress={() => {
                      handleTrackClick({
                        sectionId: "featured_idea",
                        itemId: String(surpriseCard.id),
                        itemType: surpriseCard.kind,
                        moduleId: surpriseCard.moduleId,
                        metadata: {
                          title: surpriseCard.title,
                          source: "surprise",
                        },
                      });

                      onNavigate(surpriseCard.route);
                    }}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      {
                        backgroundColor: colorForKind(surpriseCard.kind),
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>Découvrir</Text>

                    <ArrowUpRight size={14} color="#fff" />
                  </Pressable>

                  <Pressable
                    onPress={handleSurprise}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Sparkles size={12} color="#C4B5FD" />

                    <Text style={styles.secondaryButtonText}>
                      Encore une idée
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.featuredTitle}>{surpriseModule.label}</Text>

                <Text style={styles.featuredDescription}>
                  {surpriseModule.desc}
                </Text>

                <View style={styles.featuredActions}>
                  <Pressable
                    onPress={() =>
                      handleSpotlight(
                        surpriseModule.id,
                        surpriseModule.label,
                        surpriseIndex,
                      )
                    }
                    style={({ pressed }) => [
                      styles.primaryButton,
                      {
                        backgroundColor: surpriseModule.color,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>Découvrir</Text>

                    <ArrowUpRight size={14} color="#fff" />
                  </Pressable>

                  <Pressable
                    onPress={handleSurprise}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Une autre idée
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        ) : null}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

/* ============================================================================
 * STYLES — DARK PREMIUM / GLASS
 * ========================================================================== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },

  backgroundOrb: {
    position: "absolute",
    width: 330,
    height: 330,
    borderRadius: 165,
  },

  orbRight: {
    right: -165,
    top: -110,
    backgroundColor: "rgba(139,92,246,0.075)",
  },

  orbLeft: {
    left: -190,
    top: "44%",
    backgroundColor: "rgba(6,182,212,0.04)",
  },

  header: {
    minHeight: 70,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(2,6,23,0.94)",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
  },

  headerCount: {
    color: "#C4B5FD",
    fontWeight: "900",
  },

  proPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(139,92,246,0.11)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.20)",
  },

  proText: {
    color: "#C4B5FD",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 30,
  },

  contentTablet: {
    paddingHorizontal: 28,
    maxWidth: 1100,
    alignSelf: "center",
    width: "100%",
  },

  aiDiscoverySection: {
    gap: 12,
  },

  hero: {
    minHeight: 310,
    overflow: "hidden",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  heroGlow: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
  },

  heroGlowRight: {
    right: -100,
    top: -90,
    backgroundColor: "rgba(139,92,246,0.11)",
  },

  heroGlowLeft: {
    left: -100,
    bottom: -120,
    backgroundColor: "rgba(6,182,212,0.06)",
  },

  heroContent: {
    padding: 22,
  },

  eyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  eyebrowText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  heroTitle: {
    marginTop: 18,
    color: "#fff",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -1.5,
  },

  heroAccent: {
    color: "#C4B5FD",
  },

  heroDescription: {
    maxWidth: 680,
    marginTop: 11,
    color: "rgba(255,255,255,0.47)",
    fontSize: 12,
    lineHeight: 19,
  },

  searchRow: {
    marginTop: 19,
    flexDirection: "row",
    gap: 9,
  },

  searchBox: {
    flex: 1,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.30)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    color: "#fff",
    fontSize: 13,
    paddingVertical: 0,
  },

  surpriseButton: {
    minHeight: 50,
    paddingHorizontal: 15,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
  },

  surpriseText: {
    color: "#E9D5FF",
    fontSize: 11,
    fontWeight: "900",
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 13,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  chipText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 9,
    fontWeight: "700",
  },

  sectionHeader: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },

  sectionHeading: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.34)",
    fontSize: 9,
    lineHeight: 14,
  },

  smallAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  smallActionText: {
    color: "rgba(255,255,255,0.43)",
    fontSize: 9,
    fontWeight: "800",
  },

  horizontalContent: {
    gap: 10,
    paddingRight: 4,
  },

  spotlight: {
    width: 215,
    minHeight: 150,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  spotlightIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  spotlightTitle: {
    marginTop: 17,
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },

  spotlightDescription: {
    marginTop: 5,
    color: "rgba(255,255,255,0.34)",
    fontSize: 9,
    lineHeight: 14,
  },

  spotlightArrow: {
    position: "absolute",
    right: 14,
    top: 14,
  },

  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 23,
    backgroundColor: "rgba(59,130,246,0.07)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.17)",
  },

  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.12)",
  },

  locationBannerTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },

  locationBannerText: {
    marginTop: 4,
    color: "rgba(255,255,255,0.34)",
    fontSize: 9,
    lineHeight: 14,
  },

  trendTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: "rgba(139,92,246,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  trendTagActive: {
    backgroundColor: "rgba(249,115,22,0.13)",
    borderColor: "rgba(249,115,22,0.24)",
  },

  trendTagText: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 10,
    fontWeight: "800",
  },

  trendTagCount: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 8,
  },

  tagScroll: {
    marginBottom: 10,
  },

  card: {
    padding: 14,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  compactCard: {
    width: 285,
    minHeight: 135,
  },

  cardMain: {
    flexDirection: "row",
    gap: 12,
  },

  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  compactImage: {
    width: 64,
    height: 64,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  flex1: {
    flex: 1,
    minWidth: 0,
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  cardTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },

  cardSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.40)",
    fontSize: 9,
  },

  cardDescription: {
    marginTop: 5,
    color: "rgba(255,255,255,0.31)",
    fontSize: 9,
    lineHeight: 14,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 8,
  },

  price: {
    fontSize: 9,
    fontWeight: "900",
  },

  rating: {
    color: "rgba(253,230,138,0.75)",
    fontSize: 9,
  },

  inlineMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  distance: {
    color: "rgba(147,197,253,0.68)",
    fontSize: 8,
  },

  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },

  badgeText: {
    fontSize: 7,
    fontWeight: "900",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 9,
  },

  locationText: {
    flex: 1,
    color: "rgba(255,255,255,0.25)",
    fontSize: 8,
  },

  stackGap: {
    gap: 10,
  },

  stackGapLarge: {
    gap: 28,
  },

  loadingBlock: {
    gap: 10,
  },

  skeletonTitle: {
    width: 180,
    height: 22,
    borderRadius: 8,
  },

  backendSkeleton: {
    width: 270,
    height: 120,
    borderRadius: 24,
  },

  trendSkeleton: {
    width: 270,
    height: 125,
    borderRadius: 24,
  },

  trendingPublication: {
    padding: 12,
    borderRadius: 22,
    flexDirection: "row",
    gap: 11,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  trendingImage: {
    width: 70,
    height: 70,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 7,
  },

  statText: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 8,
  },

  authorText: {
    marginTop: 6,
    color: "rgba(255,255,255,0.32)",
    fontSize: 8,
  },

  peopleBlock: {
    marginTop: 18,
  },

  peopleHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 9,
  },

  peopleHeadingText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "900",
  },

  personCard: {
    width: 125,
    padding: 12,
    alignItems: "center",
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 8,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  personName: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },

  personCity: {
    marginTop: 2,
    color: "rgba(255,255,255,0.28)",
    fontSize: 8,
  },

  personFollowers: {
    marginTop: 5,
    color: "rgba(134,239,172,0.58)",
    fontSize: 8,
  },

  universeCard: {
    width: 210,
    minHeight: 155,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  universeTitle: {
    marginTop: 13,
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },

  universeDescription: {
    marginTop: 5,
    color: "rgba(255,255,255,0.31)",
    fontSize: 9,
    lineHeight: 14,
  },

  universeCount: {
    marginTop: 12,
    fontSize: 9,
    fontWeight: "900",
  },

  modulesHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },

  trendingToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  trendingToggleActive: {
    backgroundColor: "rgba(249,115,22,0.12)",
    borderColor: "rgba(249,115,22,0.22)",
  },

  trendingToggleText: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 8,
    fontWeight: "800",
  },

  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  categoryChipActive: {
    backgroundColor: "rgba(139,92,246,0.18)",
    borderColor: "rgba(139,92,246,0.30)",
  },

  categoryText: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 9,
    fontWeight: "800",
  },

  categoryTextActive: {
    color: "#DDD6FE",
  },

  moduleGrid: {
    gap: 9,
  },

  moduleCard: {
    minHeight: 76,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.032)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  moduleIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  moduleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  moduleTitle: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    flexShrink: 1,
  },

  moduleDescription: {
    marginTop: 4,
    color: "rgba(255,255,255,0.32)",
    fontSize: 9,
    lineHeight: 14,
  },

  newBadge: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(167,139,250,0.18)",
  },

  newBadgeText: {
    color: "#DDD6FE",
    fontSize: 6,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  emptyTitle: {
    marginTop: 10,
    color: "rgba(255,255,255,0.48)",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 5,
    color: "rgba(255,255,255,0.26)",
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
  },

  resetButton: {
    marginTop: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: "rgba(139,92,246,0.12)",
  },

  resetText: {
    color: "#C4B5FD",
    fontSize: 9,
    fontWeight: "900",
  },

  featured: {
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    padding: 26,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  featuredOrb: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    right: -90,
    top: -110,
    backgroundColor: "rgba(139,92,246,0.08)",
  },

  featuredEyebrow: {
    marginTop: 10,
    color: "rgba(255,255,255,0.32)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  featuredTitle: {
    marginTop: 7,
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },

  featuredDescription: {
    marginTop: 5,
    color: "rgba(255,255,255,0.34)",
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
    maxWidth: 500,
  },

  featuredActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 17,
  },

  primaryButton: {
    minHeight: 42,
    paddingHorizontal: 17,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
  },

  secondaryButton: {
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  secondaryButtonText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 9,
    fontWeight: "800",
  },

  cardPressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  pressed: {
    opacity: 0.72,
  },

  bottomSpace: {
    height: 20,
  },
});

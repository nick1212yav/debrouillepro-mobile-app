// src/pages/modules/ActionsPage.tsx
"use no memo";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Award,
  BarChart2,
  BedDouble,
  BookOpen,
  Briefcase,
  CalendarDays,
  Camera,
  Car,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  CreditCard,
  Flame,
  FileText,
  Film,
  Globe,
  GraduationCap,
  HandHeart,
  Heart,
  Home,
  Landmark,
  Leaf,
  Lightbulb,
  LogIn,
  Map,
  MapPin,
  Megaphone,
  MessageSquare,
  Network,
  Newspaper,
  Package,
  Phone,
  Radio,
  Scale,
  Search,
  Send,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Stethoscope,
  Target,
  TrendingUp,
  Trophy,
  Truck,
  UtensilsCrossed,
  Users,
  Wallet,
  Wrench,
  X,
  Zap,
} from "lucide-react-native";

import { toast } from "sonner";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type LucideIcon = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: object;
  fill?: string;
}>;

type ActionStatus = "available" | "coming_soon";

interface Action {
  id: string;
  icon: LucideIcon;
  label: string;
  desc: string;
  page?: string;
  color: string;
  category: string;
  status: ActionStatus;
  keywords: string[];
}

interface ActionsPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

/* ============================================================================
 * ACTION CATALOG
 *
 * IMPORTANT:
 * - "available" means the action has a navigation destination in this screen.
 * - "coming_soon" never pretends that a backend operation exists.
 * - No popularity score is fabricated.
 * ========================================================================== */

const ALL_ACTIONS: Action[] = [
  {
    id: "payer",
    icon: CreditCard,
    label: "Payer",
    desc: "Ouvrir les paiements",
    page: "paiement",
    color: "#10B981",
    category: "Finance",
    status: "available",
    keywords: ["payer", "paiement", "money", "mobile", "carte"],
  },
  {
    id: "wallet",
    icon: Wallet,
    label: "Mon Wallet",
    desc: "Consulter votre portefeuille",
    page: "wallet",
    color: "#22C55E",
    category: "Finance",
    status: "available",
    keywords: ["wallet", "argent", "solde", "portefeuille"],
  },
  {
    id: "facturer",
    icon: FileText,
    label: "Facturer",
    desc: "Accéder à la facturation",
    page: "paiement",
    color: "#14B8A6",
    category: "Finance",
    status: "available",
    keywords: ["facture", "facturation", "business"],
  },
  {
    id: "finances",
    icon: TrendingUp,
    label: "Finances",
    desc: "Suivre votre activité financière",
    page: "finances",
    color: "#06B6D4",
    category: "Finance",
    status: "available",
    keywords: ["finance", "budget", "argent", "dépenses"],
  },

  {
    id: "vtc",
    icon: Car,
    label: "VTC / Taxi",
    desc: "Accéder à la mobilité",
    page: "transport",
    color: "#3B82F6",
    category: "Mobilité",
    status: "available",
    keywords: ["taxi", "vtc", "transport", "trajet", "voiture"],
  },
  {
    id: "moto",
    icon: Truck,
    label: "Moto-taxi",
    desc: "Accéder au transport moto",
    page: "transport",
    color: "#2563EB",
    category: "Mobilité",
    status: "available",
    keywords: ["moto", "taxi", "transport"],
  },
  {
    id: "colis",
    icon: Package,
    label: "Colis",
    desc: "Accéder aux livraisons",
    page: "livraison",
    color: "#0EA5E9",
    category: "Mobilité",
    status: "available",
    keywords: ["colis", "livraison", "envoyer", "recevoir"],
  },
  {
    id: "repas",
    icon: UtensilsCrossed,
    label: "Repas",
    desc: "Accéder à la restauration",
    page: "restauration",
    color: "#F97316",
    category: "Mobilité",
    status: "available",
    keywords: ["repas", "restaurant", "manger", "livraison"],
  },
  {
    id: "voyager",
    icon: Compass,
    label: "Voyager",
    desc: "Explorer les voyages",
    page: "voyages",
    color: "#38BDF8",
    category: "Mobilité",
    status: "available",
    keywords: ["voyage", "bus", "avion", "ferry", "transport"],
  },
  {
    id: "heberger",
    icon: BedDouble,
    label: "Hébergement",
    desc: "Trouver un hébergement",
    page: "hebergement",
    color: "#10B981",
    category: "Mobilité",
    status: "available",
    keywords: ["hôtel", "logement", "hébergement", "chambre"],
  },

  {
    id: "louer",
    icon: Home,
    label: "Louer",
    desc: "Explorer les biens à louer",
    page: "immo",
    color: "#8B5CF6",
    category: "Emploi & Immobilier",
    status: "available",
    keywords: ["louer", "location", "appartement", "studio", "maison"],
  },
  {
    id: "vendre-immo",
    icon: Home,
    label: "Vendre un bien",
    desc: "Accéder à l'immobilier",
    page: "immo",
    color: "#A855F7",
    category: "Emploi & Immobilier",
    status: "available",
    keywords: ["vendre", "maison", "terrain", "immobilier", "bien"],
  },
  {
    id: "emploi",
    icon: Briefcase,
    label: "Chercher un emploi",
    desc: "Explorer les opportunités",
    page: "jobs",
    color: "#6366F1",
    category: "Emploi & Immobilier",
    status: "available",
    keywords: ["emploi", "travail", "job", "recrutement", "carrière"],
  },
  {
    id: "recruter",
    icon: Users,
    label: "Recruter",
    desc: "Accéder au recrutement",
    page: "jobs",
    color: "#7C3AED",
    category: "Emploi & Immobilier",
    status: "available",
    keywords: ["recruter", "emploi", "candidat", "entreprise"],
  },
  {
    id: "freelance",
    icon: Landmark,
    label: "Freelance",
    desc: "Explorer les missions",
    page: "jobs",
    color: "#8B5CF6",
    category: "Emploi & Immobilier",
    status: "available",
    keywords: ["freelance", "mission", "contrat", "travail"],
  },
  {
    id: "business",
    icon: BarChart2,
    label: "Business",
    desc: "Accéder à votre espace entreprise",
    page: "business",
    color: "#A78BFA",
    category: "Emploi & Immobilier",
    status: "available",
    keywords: ["business", "entreprise", "commerce", "gestion"],
  },

  {
    id: "plomberie",
    icon: Wrench,
    label: "Plomberie",
    desc: "Trouver des services",
    page: "services",
    color: "#F97316",
    category: "Services",
    status: "available",
    keywords: ["plomberie", "plombier", "réparation"],
  },
  {
    id: "electricite",
    icon: Zap,
    label: "Électricité",
    desc: "Trouver des services",
    page: "energie",
    color: "#FBBF24",
    category: "Services",
    status: "available",
    keywords: ["électricité", "électricien", "panne", "courant"],
  },
  {
    id: "menage",
    icon: Activity,
    label: "Ménage",
    desc: "Explorer les services",
    page: "services",
    color: "#FB923C",
    category: "Services",
    status: "available",
    keywords: ["ménage", "nettoyage", "maison"],
  },
  {
    id: "cours-domicile",
    icon: GraduationCap,
    label: "Cours privés",
    desc: "Explorer les services éducatifs",
    page: "apprendre",
    color: "#F59E0B",
    category: "Services",
    status: "available",
    keywords: ["cours", "professeur", "éducation", "domicile"],
  },
  {
    id: "livraison-dom",
    icon: Package,
    label: "Livraison",
    desc: "Accéder aux livraisons",
    page: "livraison",
    color: "#F97316",
    category: "Services",
    status: "available",
    keywords: ["livraison", "course", "colis"],
  },
  {
    id: "restaurant-call",
    icon: UtensilsCrossed,
    label: "Restauration",
    desc: "Explorer les restaurants",
    page: "restauration",
    color: "#EA580C",
    category: "Services",
    status: "available",
    keywords: ["restaurant", "menu", "repas", "food"],
  },

  {
    id: "rdv",
    icon: CalendarDays,
    label: "Prendre rendez-vous",
    desc: "Accéder à la santé",
    page: "sante",
    color: "#EF4444",
    category: "Santé",
    status: "available",
    keywords: ["médecin", "rdv", "rendez-vous", "docteur", "santé"],
  },
  {
    id: "teleconsult",
    icon: Phone,
    label: "Téléconsultation",
    desc: "Accéder aux services de santé",
    page: "sante",
    color: "#F43F5E",
    category: "Santé",
    status: "available",
    keywords: ["médecin", "appel", "consultation", "téléconsultation"],
  },
  {
    id: "pharmacie",
    icon: Stethoscope,
    label: "Pharmacie",
    desc: "Accéder aux services de santé",
    page: "sante",
    color: "#E11D48",
    category: "Santé",
    status: "available",
    keywords: ["pharmacie", "médicament", "santé"],
  },
  {
    id: "entrainer",
    icon: Flame,
    label: "S'entraîner",
    desc: "Explorer le fitness",
    page: "fitness",
    color: "#F43F5E",
    category: "Santé",
    status: "available",
    keywords: ["sport", "fitness", "entraînement", "workout"],
  },
  {
    id: "nutrition-log",
    icon: UtensilsCrossed,
    label: "Nutrition",
    desc: "Explorer la nutrition",
    page: "nutrition",
    color: "#F59E0B",
    category: "Santé",
    status: "available",
    keywords: ["nutrition", "aliment", "repas", "santé"],
  },
  {
    id: "mediter",
    icon: Activity,
    label: "Méditer",
    desc: "Explorer le bien-être",
    page: "meditation",
    color: "#8B5CF6",
    category: "Santé",
    status: "available",
    keywords: ["méditation", "respiration", "bien-être"],
  },
  {
    id: "sport-club",
    icon: Trophy,
    label: "Sport",
    desc: "Explorer les activités sportives",
    page: "sport",
    color: "#6366F1",
    category: "Santé",
    status: "available",
    keywords: ["sport", "club", "tournoi"],
  },

  {
    id: "cours",
    icon: BookOpen,
    label: "Cours",
    desc: "Explorer les formations",
    page: "cours",
    color: "#F59E0B",
    category: "Éducation",
    status: "available",
    keywords: ["cours", "formation", "apprendre", "mooc"],
  },
  {
    id: "quiz",
    icon: Target,
    label: "Quiz",
    desc: "Explorer les évaluations",
    page: "quiz",
    color: "#A78BFA",
    category: "Éducation",
    status: "available",
    keywords: ["quiz", "test", "évaluation"],
  },
  {
    id: "certifier",
    icon: Award,
    label: "Certifications",
    desc: "Explorer les certifications",
    page: "certifications",
    color: "#8B5CF6",
    category: "Éducation",
    status: "available",
    keywords: ["certificat", "certification", "diplôme"],
  },
  {
    id: "mentorat",
    icon: Users,
    label: "Mentorat",
    desc: "Explorer le mentorat",
    page: "mentorat",
    color: "#7C3AED",
    category: "Éducation",
    status: "available",
    keywords: ["mentor", "mentorat", "conseil"],
  },
  {
    id: "ecole",
    icon: GraduationCap,
    label: "École",
    desc: "Accéder à la scolarité",
    page: "ecole",
    color: "#F59E0B",
    category: "Éducation",
    status: "available",
    keywords: ["école", "scolarité", "élève"],
  },
  {
    id: "apprendre",
    icon: BookOpen,
    label: "Apprendre",
    desc: "Explorer les ressources",
    page: "apprendre",
    color: "#F97316",
    category: "Éducation",
    status: "available",
    keywords: ["apprendre", "formation", "éducation"],
  },

  {
    id: "groupes",
    icon: Users,
    label: "Groupes",
    desc: "Explorer la communauté",
    page: "community",
    color: "#EC4899",
    category: "Communauté",
    status: "available",
    keywords: ["groupe", "communauté", "discussion"],
  },
  {
    id: "evenement",
    icon: CalendarDays,
    label: "Événements",
    desc: "Découvrir les événements",
    page: "evenements",
    color: "#DB2777",
    category: "Communauté",
    status: "available",
    keywords: ["événement", "event", "agenda"],
  },
  {
    id: "parrainer",
    icon: HandHeart,
    label: "Parrainage",
    desc: "Explorer le parrainage",
    page: "parrainage",
    color: "#EC4899",
    category: "Communauté",
    status: "available",
    keywords: ["parrainage", "inviter", "ami"],
  },
  {
    id: "reseau",
    icon: Network,
    label: "Réseau",
    desc: "Développer votre réseau",
    page: "network",
    color: "#3B82F6",
    category: "Communauté",
    status: "available",
    keywords: ["réseau", "professionnel", "connexion"],
  },
  {
    id: "messages",
    icon: MessageSquare,
    label: "Messages",
    desc: "Accéder à la messagerie",
    page: "messages",
    color: "#2563EB",
    category: "Communauté",
    status: "available",
    keywords: ["message", "chat", "conversation"],
  },

  {
    id: "lire-news",
    icon: Newspaper,
    label: "Actualités",
    desc: "Explorer les contenus",
    page: "media",
    color: "#06B6D4",
    category: "Création & Média",
    status: "available",
    keywords: ["actualité", "news", "information", "podcast"],
  },
  {
    id: "streamer",
    icon: Radio,
    label: "Live",
    desc: "Accéder au direct",
    page: "live-streaming",
    color: "#EF4444",
    category: "Création & Média",
    status: "available",
    keywords: ["live", "direct", "stream", "streaming"],
  },
  {
    id: "creer-contenu",
    icon: Camera,
    label: "Créer",
    desc: "Créer du contenu",
    page: "editeur",
    color: "#8B5CF6",
    category: "Création & Média",
    status: "available",
    keywords: ["créer", "contenu", "vidéo", "photo"],
  },
  {
    id: "publier-story",
    icon: Film,
    label: "Story",
    desc: "Accéder à la création de stories",
    page: "stories-creator",
    color: "#EC4899",
    category: "Création & Média",
    status: "available",
    keywords: ["story", "stories", "vidéo"],
  },
  {
    id: "lancer-pub",
    icon: Megaphone,
    label: "Publicité",
    desc: "Accéder aux campagnes",
    page: "pub",
    color: "#F59E0B",
    category: "Création & Média",
    status: "available",
    keywords: ["pub", "publicité", "campagne", "marketing"],
  },
  {
    id: "cocreation",
    icon: Lightbulb,
    label: "Co-créer",
    desc: "Explorer la collaboration",
    page: "cocreation",
    color: "#A78BFA",
    category: "Création & Média",
    status: "available",
    keywords: ["collaboration", "projet", "créer"],
  },

  {
    id: "planter",
    icon: Leaf,
    label: "Agriculture",
    desc: "Accéder aux outils agricoles",
    page: "agri",
    color: "#22C55E",
    category: "Agriculture",
    status: "available",
    keywords: ["agriculture", "agri", "ferme", "planter"],
  },
  {
    id: "vendre-agri",
    icon: ShoppingBag,
    label: "Marché agricole",
    desc: "Explorer le marché agricole",
    page: "agri",
    color: "#16A34A",
    category: "Agriculture",
    status: "available",
    keywords: ["agriculture", "vente", "marché", "produits"],
  },
  {
    id: "environnement",
    icon: Globe,
    label: "Environnement",
    desc: "Explorer les initiatives vertes",
    page: "environnement",
    color: "#22C55E",
    category: "Agriculture",
    status: "available",
    keywords: ["écologie", "environnement", "recyclage", "green"],
  },
  {
    id: "energie",
    icon: Zap,
    label: "Énergie",
    desc: "Accéder aux services énergie",
    page: "energie",
    color: "#FBBF24",
    category: "Agriculture",
    status: "available",
    keywords: ["énergie", "solaire", "électricité", "réseau"],
  },

  {
    id: "sos",
    icon: AlertTriangle,
    label: "SOS",
    desc: "Accéder aux urgences",
    page: "sos",
    color: "#EF4444",
    category: "Sécurité & Citoyen",
    status: "available",
    keywords: ["sos", "urgence", "aide"],
  },
  {
    id: "securite",
    icon: Shield,
    label: "Sécurité",
    desc: "Accéder aux signalements",
    page: "securite",
    color: "#DC2626",
    category: "Sécurité & Citoyen",
    status: "available",
    keywords: ["sécurité", "incident", "signalement"],
  },
  {
    id: "juridique",
    icon: Scale,
    label: "Juridique",
    desc: "Accéder aux services juridiques",
    page: "juridique",
    color: "#94A3B8",
    category: "Sécurité & Citoyen",
    status: "available",
    keywords: ["juridique", "loi", "avocat", "droit"],
  },
  {
    id: "justice",
    icon: Scale,
    label: "Justice",
    desc: "Accéder aux services de justice",
    page: "justice",
    color: "#CBD5E1",
    category: "Sécurité & Citoyen",
    status: "available",
    keywords: ["justice", "droit", "plainte"],
  },
  {
    id: "data-pub",
    icon: BarChart2,
    label: "Data publique",
    desc: "Explorer les données publiques",
    page: "data-publique",
    color: "#06B6D4",
    category: "Sécurité & Citoyen",
    status: "available",
    keywords: ["data", "données", "publique", "open data"],
  },

  {
    id: "dons",
    icon: HandHeart,
    label: "Faire un don",
    desc: "Explorer la solidarité",
    page: "ong",
    color: "#10B981",
    category: "Solidarité",
    status: "available",
    keywords: ["don", "solidarité", "ong", "cause"],
  },
  {
    id: "benevolat",
    icon: Globe,
    label: "Bénévolat",
    desc: "Explorer les missions",
    page: "ong",
    color: "#059669",
    category: "Solidarité",
    status: "available",
    keywords: ["bénévolat", "volontariat", "ong"],
  },
  {
    id: "campagne",
    icon: Megaphone,
    label: "Campagne",
    desc: "Accéder aux campagnes",
    page: "ong",
    color: "#10B981",
    category: "Solidarité",
    status: "available",
    keywords: ["campagne", "collecte", "association"],
  },

  {
    id: "carte",
    icon: MapPin,
    label: "Carte",
    desc: "Explorer autour de vous",
    page: "carte",
    color: "#6366F1",
    category: "Explorer",
    status: "available",
    keywords: ["carte", "map", "proche", "autour"],
  },
  {
    id: "map3d",
    icon: Map,
    label: "Map 3D",
    desc: "Explorer la cartographie",
    page: "map3d",
    color: "#818CF8",
    category: "Explorer",
    status: "available",
    keywords: ["map", "3d", "carte"],
  },
  {
    id: "profile",
    icon: LogIn,
    label: "Mon compte",
    desc: "Profil et paramètres",
    page: "profile",
    color: "#8B5CF6",
    category: "Explorer",
    status: "available",
    keywords: ["profil", "compte", "paramètres"],
  },
];

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const CATEGORIES = [
  "Tous",
  ...Array.from(new Set(ALL_ACTIONS.map((action) => action.category))),
];

const QUICK_IDS = ["wallet", "payer", "emploi", "louer", "vtc", "marche"];

const MAX_RECENT = 6;
const MAX_FAVORITES = 12;

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function findAction(id: string): Action | undefined {
  return ALL_ACTIONS.find((action) => action.id === id);
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/* ============================================================================
 * AMBIENT BACKGROUND
 * ========================================================================== */

function AmbientBackground() {
  const { width, height } = useWindowDimensions();

  const orbA = useRef(new Animated.Value(0)).current;
  const orbB = useRef(new Animated.Value(0)).current;
  const orbC = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createLoop = (
      value: Animated.Value,
      distance: number,
      duration: number,
    ) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: distance,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );

    const loopA = createLoop(orbA, -35, 8500);
    const loopB = createLoop(orbB, 45, 10500);
    const loopC = createLoop(orbC, -28, 11500);

    loopA.start();
    loopB.start();
    loopC.start();

    return () => {
      loopA.stop();
      loopB.stop();
      loopC.stop();
    };
  }, [orbA, orbB, orbC]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["#03020A", "#08051A", "#0B0820", "#02030A"]}
        locations={[0, 0.36, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.orb,
          {
            width: Math.max(420, width * 0.95),
            height: Math.max(420, width * 0.95),
            top: -220,
            left: -180,
            backgroundColor: "rgba(124,58,237,0.22)",
            transform: [{ translateY: orbA }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.orb,
          {
            width: 360,
            height: 360,
            top: height * 0.36,
            right: -190,
            backgroundColor: "rgba(37,99,235,0.18)",
            transform: [{ translateY: orbB }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.orb,
          {
            width: 300,
            height: 300,
            bottom: -150,
            left: -90,
            backgroundColor: "rgba(236,72,153,0.10)",
            transform: [{ translateY: orbC }],
          },
        ]}
      />
    </View>
  );
}

/* ============================================================================
 * REVEAL
 * ========================================================================== */

function Reveal({
  children,
  delay = 0,
  distance = 18,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: object;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 500,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ============================================================================
 * PRESSABLE SCALE
 * ========================================================================== */

function PressScale({
  children,
  onPress,
  onLongPress,
  disabled = false,
  scaleTo = 0.96,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  scaleTo?: number;
  style?: object;
  accessibilityLabel?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: scaleTo,
      speed: 40,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [scale, scaleTo]);

  const pressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 35,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * ACTION ICON
 * ========================================================================== */

function ActionIcon({ action, size = 46 }: { action: Action; size?: number }) {
  const Icon = action.icon;

  return (
    <View
      style={[
        styles.actionIcon,
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
          backgroundColor: `${action.color}20`,
          borderColor: `${action.color}40`,
        },
      ]}
    >
      <Icon size={size * 0.42} color={action.color} strokeWidth={2.2} />
    </View>
  );
}

/* ============================================================================
 * FEATURED ACTION
 * ========================================================================== */

function FeaturedAction({
  action,
  favorite,
  onPress,
  onFavorite,
}: {
  action: Action;
  favorite: boolean;
  onPress: () => void;
  onFavorite: (event: GestureResponderEvent) => void;
}) {
  return (
    <PressScale onPress={onPress} style={styles.featuredWrap}>
      <LinearGradient
        colors={[`${action.color}32`, `${action.color}12`, "rgba(7,5,18,0.82)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.featuredCard,
          {
            borderColor: `${action.color}48`,
          },
        ]}
      >
        <View
          pointerEvents="none"
          style={[
            styles.featuredGlow,
            {
              backgroundColor: action.color,
            },
          ]}
        />

        <Pressable
          onPress={onFavorite}
          hitSlop={8}
          style={styles.featuredFavorite}
          accessibilityRole="button"
          accessibilityLabel={
            favorite
              ? `Retirer ${action.label} des favoris`
              : `Ajouter ${action.label} aux favoris`
          }
        >
          <Star
            size={14}
            color={favorite ? "#FACC15" : "rgba(255,255,255,0.45)"}
            fill={favorite ? "#FACC15" : "transparent"}
          />
        </Pressable>

        <ActionIcon action={action} size={52} />

        <View style={styles.featuredContent}>
          <View style={styles.featuredTitleRow}>
            <Text style={styles.featuredTitle} numberOfLines={1}>
              {action.label}
            </Text>

            <ArrowUpRight size={15} color="rgba(255,255,255,0.45)" />
          </View>

          <Text style={styles.featuredDescription} numberOfLines={2}>
            {action.desc}
          </Text>

          <View style={styles.featuredMeta}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    action.status === "available" ? "#34D399" : "#FBBF24",
                },
              ]}
            />

            <Text style={styles.featuredMetaText}>
              {action.status === "available" ? "Accéder" : "Bientôt disponible"}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </PressScale>
  );
}

/* ============================================================================
 * ACTION TILE
 * ========================================================================== */

function ActionTile({
  action,
  favorite,
  onPress,
  onFavorite,
}: {
  action: Action;
  favorite: boolean;
  onPress: () => void;
  onFavorite: (event: GestureResponderEvent) => void;
}) {
  return (
    <PressScale
      onPress={onPress}
      disabled={action.status === "coming_soon"}
      style={styles.tileWrap}
      scaleTo={0.965}
    >
      <View
        style={[
          styles.tile,
          {
            borderColor:
              action.status === "coming_soon"
                ? "rgba(255,255,255,0.06)"
                : `${action.color}30`,
            opacity: action.status === "coming_soon" ? 0.62 : 1,
          },
        ]}
      >
        <LinearGradient
          colors={[`${action.color}18`, `${action.color}06`, "rgba(0,0,0,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View
          pointerEvents="none"
          style={[
            styles.tileAccent,
            {
              backgroundColor: action.color,
            },
          ]}
        />

        <Pressable
          onPress={onFavorite}
          hitSlop={8}
          style={styles.tileFavorite}
          accessibilityRole="button"
          accessibilityLabel={
            favorite
              ? `Retirer ${action.label} des favoris`
              : `Ajouter ${action.label} aux favoris`
          }
        >
          <Star
            size={12}
            color={favorite ? "#FACC15" : "rgba(255,255,255,0.28)"}
            fill={favorite ? "#FACC15" : "transparent"}
          />
        </Pressable>

        <ActionIcon action={action} size={44} />

        <View style={styles.tileText}>
          <Text style={styles.tileTitle} numberOfLines={1}>
            {action.label}
          </Text>

          <Text style={styles.tileDescription} numberOfLines={2}>
            {action.desc}
          </Text>

          {action.status === "coming_soon" ? (
            <View style={styles.comingSoonBadge}>
              <Clock3 size={9} color="#FBBF24" />
              <Text style={styles.comingSoonText}>Bientôt</Text>
            </View>
          ) : (
            <View style={styles.tileArrow}>
              <ChevronRight size={13} color="rgba(255,255,255,0.25)" />
            </View>
          )}
        </View>
      </View>
    </PressScale>
  );
}

/* ============================================================================
 * RECENT / FAVORITE CHIP
 * ========================================================================== */

function CompactAction({
  action,
  onPress,
}: {
  action: Action;
  onPress: () => void;
}) {
  return (
    <PressScale onPress={onPress} scaleTo={0.95}>
      <View
        style={[
          styles.compactAction,
          {
            borderColor: `${action.color}30`,
          },
        ]}
      >
        <View
          style={[
            styles.compactIcon,
            {
              backgroundColor: `${action.color}18`,
            },
          ]}
        >
          <action.icon size={15} color={action.color} />
        </View>

        <Text style={styles.compactLabel} numberOfLines={1}>
          {action.label}
        </Text>
      </View>
    </PressScale>
  );
}

/* ============================================================================
 * CATEGORY CHIP
 * ========================================================================== */

function CategoryChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.categoryChip, active && styles.categoryChipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {active && <Sparkles size={11} color="#C4B5FD" />}

      <Text
        style={[
          styles.categoryChipText,
          active && styles.categoryChipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ============================================================================
 * MAIN PAGE
 * ========================================================================== */

export default function ActionsPage({ onBack, onNavigate }: ActionsPageProps) {
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tous");

  /*
   * Intentionally session-local.
   *
   * We do not pretend this is persistent storage.
   * If persistent cross-session favorites are required, connect them later
   * to the real user-preferences backend / native persistence layer.
   */
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const [showAllCategories, setShowAllCategories] = useState(false);

  const normalizedSearch = normalize(search);

  /* ------------------------------------------------------------------------
   * Derived actions
   * ---------------------------------------------------------------------- */

  const recentActions = useMemo(
    () =>
      recentIds
        .map(findAction)
        .filter((action): action is Action => Boolean(action)),
    [recentIds],
  );

  const favoriteActions = useMemo(
    () =>
      favoriteIds
        .map(findAction)
        .filter((action): action is Action => Boolean(action)),
    [favoriteIds],
  );

  const quickActions = useMemo(
    () =>
      QUICK_IDS.map(findAction).filter((action): action is Action =>
        Boolean(action),
      ),
    [],
  );

  const filteredActions = useMemo(() => {
    return ALL_ACTIONS.filter((action) => {
      const matchesCategory =
        activeCategory === "Tous" || action.category === activeCategory;

      if (!normalizedSearch) {
        return matchesCategory;
      }

      const haystack = normalize(
        [action.label, action.desc, action.category, ...action.keywords].join(
          " ",
        ),
      );

      return matchesCategory && haystack.includes(normalizedSearch);
    });
  }, [activeCategory, normalizedSearch]);

  const suggestedActions = useMemo(() => {
    if (!normalizedSearch) return [];

    return filteredActions
      .filter((action) => action.status === "available")
      .slice(0, 5);
  }, [filteredActions, normalizedSearch]);

  const visibleCategories = showAllCategories
    ? CATEGORIES
    : CATEGORIES.slice(0, 6);

  const isSearching = normalizedSearch.length > 0;
  const isFiltering = isSearching || activeCategory !== "Tous";

  /* ------------------------------------------------------------------------
   * Interaction
   * ---------------------------------------------------------------------- */

  const handleOpenAction = useCallback(
    (action: Action) => {
      if (action.status === "coming_soon") {
        toast("Cette fonctionnalité arrive bientôt", {
          description:
            "Nous préférons vous montrer clairement ce qui est disponible.",
          duration: 2200,
        });

        return;
      }

      setRecentIds((current) =>
        [action.id, ...current.filter((id) => id !== action.id)].slice(
          0,
          MAX_RECENT,
        ),
      );

      if (action.page) {
        onNavigate(action.page);
        return;
      }

      toast(action.label, {
        description: action.desc,
        duration: 1800,
      });
    },
    [onNavigate],
  );

  const handleToggleFavorite = useCallback(
    (event: GestureResponderEvent, action: Action) => {
      event.stopPropagation();

      setFavoriteIds((current) => {
        const exists = current.includes(action.id);

        if (exists) {
          toast("Retiré de vos favoris", {
            description: action.label,
            duration: 1300,
          });

          return current.filter((id) => id !== action.id);
        }

        if (current.length >= MAX_FAVORITES) {
          toast("Vos favoris sont pleins", {
            description: "Retirez une action avant d'en ajouter une nouvelle.",
            duration: 1800,
          });

          return current;
        }

        toast("Ajouté à vos favoris", {
          description: action.label,
          duration: 1300,
        });

        return [action.id, ...current];
      });
    },
    [],
  );

  const clearSearch = useCallback(() => {
    setSearch("");
  }, []);

  const resetFilters = useCallback(() => {
    setSearch("");
    setActiveCategory("Tous");
  }, []);

  /* ------------------------------------------------------------------------
   * Render
   * ---------------------------------------------------------------------- */

  return (
    <View style={styles.root}>
      <AmbientBackground />

      {/* ==================================================================
       * HEADER
       * ================================================================== */}

      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 12) + 8,
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft size={18} color="rgba(255,255,255,0.92)" />
          </Pressable>

          <View style={styles.headerIdentity}>
            <View style={styles.headerEyebrowRow}>
              <View style={styles.liveDot} />
              <Text style={styles.headerEyebrow}>DÉBROUILLEPRO</Text>
            </View>

            <Text style={styles.headerTitle}>Actions</Text>
          </View>

          <View style={styles.headerBadge}>
            <LinearGradient
              colors={["#8B5CF6", "#4F46E5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <Zap size={17} color="#fff" strokeWidth={2.4} />
          </View>
        </View>

        {/* ================================================================
         * SMART SEARCH
         * ================================================================ */}

        <View style={styles.searchContainer}>
          <Search size={17} color="rgba(255,255,255,0.42)" />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Que voulez-vous faire ?"
            placeholderTextColor="rgba(255,255,255,0.30)"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Rechercher une action"
          />

          {search.length > 0 && (
            <Pressable
              onPress={clearSearch}
              hitSlop={8}
              style={styles.searchClear}
              accessibilityRole="button"
              accessibilityLabel="Effacer la recherche"
            >
              <X size={13} color="rgba(255,255,255,0.65)" />
            </Pressable>
          )}
        </View>

        {/* ================================================================
         * CATEGORIES
         * ================================================================ */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {visibleCategories.map((category) => (
            <CategoryChip
              key={category}
              label={category}
              active={activeCategory === category}
              onPress={() => setActiveCategory(category)}
            />
          ))}

          {!showAllCategories && CATEGORIES.length > 6 && (
            <Pressable
              onPress={() => setShowAllCategories(true)}
              style={styles.moreCategories}
              accessibilityRole="button"
              accessibilityLabel="Afficher toutes les catégories"
            >
              <Text style={styles.moreCategoriesText}>
                +{CATEGORIES.length - 6}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      {/* ==================================================================
       * BODY
       * ================================================================== */}

      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.bodyContent,
          {
            paddingBottom: Math.max(insets.bottom, 20) + 48,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isFiltering ? (
          <>
            {/* ============================================================
             * SEARCH RESULT
             * ============================================================ */}

            <Reveal delay={40}>
              <View style={styles.searchResultHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>RECHERCHE</Text>

                  <Text style={styles.searchResultTitle}>
                    {filteredActions.length} résultat
                    {filteredActions.length === 1 ? "" : "s"}
                  </Text>
                </View>

                <Pressable onPress={resetFilters} hitSlop={8}>
                  <Text style={styles.resetText}>Réinitialiser</Text>
                </Pressable>
              </View>
            </Reveal>

            {/* ============================================================
             * SMART SUGGESTION
             * ============================================================ */}

            {suggestedActions.length > 0 && (
              <Reveal delay={90}>
                <View style={styles.smartSuggestion}>
                  <LinearGradient
                    colors={["rgba(139,92,246,0.22)", "rgba(59,130,246,0.08)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />

                  <View style={styles.smartSuggestionIcon}>
                    <Sparkles size={17} color="#C4B5FD" />
                  </View>

                  <View style={styles.smartSuggestionText}>
                    <Text style={styles.smartSuggestionTitle}>
                      Trouvé pour vous
                    </Text>

                    <Text style={styles.smartSuggestionDescription}>
                      Voici les actions qui correspondent le mieux à votre
                      recherche.
                    </Text>
                  </View>
                </View>
              </Reveal>
            )}

            {/* ============================================================
             * EMPTY SEARCH
             * ============================================================ */}

            {filteredActions.length === 0 ? (
              <Reveal delay={80}>
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Search size={25} color="rgba(255,255,255,0.28)" />
                  </View>

                  <Text style={styles.emptyTitle}>
                    Rien trouvé pour le moment
                  </Text>

                  <Text style={styles.emptyDescription}>
                    Essayez un autre mot comme « emploi », « argent », «
                    logement », « transport » ou « santé ».
                  </Text>

                  <Pressable onPress={resetFilters} style={styles.emptyButton}>
                    <Text style={styles.emptyButtonText}>
                      Voir toutes les actions
                    </Text>

                    <ArrowUpRight size={15} color="#fff" />
                  </Pressable>
                </View>
              </Reveal>
            ) : (
              <View style={styles.grid}>
                {filteredActions.map((action, index) => (
                  <Reveal
                    key={action.id}
                    delay={Math.min(100 + index * 22, 360)}
                    style={styles.gridItem}
                  >
                    <ActionTile
                      action={action}
                      favorite={favoriteIds.includes(action.id)}
                      onPress={() => handleOpenAction(action)}
                      onFavorite={(event) =>
                        handleToggleFavorite(event, action)
                      }
                    />
                  </Reveal>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {/* ============================================================
             * HERO
             * ============================================================ */}

            <Reveal delay={20}>
              <View style={styles.hero}>
                <LinearGradient
                  colors={[
                    "rgba(124,58,237,0.30)",
                    "rgba(79,70,229,0.15)",
                    "rgba(7,5,18,0.76)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                <View pointerEvents="none" style={styles.heroGlowA} />

                <View pointerEvents="none" style={styles.heroGlowB} />

                <View style={styles.heroTop}>
                  <LinearGradient
                    colors={["#8B5CF6", "#4F46E5"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroIcon}
                  >
                    <Sparkles size={22} color="#fff" strokeWidth={2} />
                  </LinearGradient>

                  <View style={styles.heroText}>
                    <Text style={styles.heroEyebrow}>CENTRE DE COMMANDE</Text>

                    <Text style={styles.heroTitle}>Tout commence ici.</Text>

                    <Text style={styles.heroDescription}>
                      Retrouvez rapidement ce dont vous avez besoin, explorez de
                      nouveaux services et construisez votre propre espace
                      d'accès.
                    </Text>
                  </View>
                </View>

                <View style={styles.heroTrust}>
                  <View style={styles.heroTrustItem}>
                    <Check size={12} color="#34D399" />

                    <Text style={styles.heroTrustText}>
                      Actions clairement identifiées
                    </Text>
                  </View>

                  <View style={styles.heroTrustItem}>
                    <Shield size={12} color="#A78BFA" />

                    <Text style={styles.heroTrustText}>
                      Pas de fausse promesse
                    </Text>
                  </View>
                </View>
              </View>
            </Reveal>

            {/* ============================================================
             * QUICK ACCESS
             * ============================================================ */}

            <Reveal delay={100}>
              <View style={styles.sectionHeader}>
                <View>
                  <View style={styles.sectionEyebrowRow}>
                    <Flame size={11} color="#FB923C" />

                    <Text style={[styles.sectionEyebrow, { color: "#FDBA74" }]}>
                      ACCÈS RAPIDE
                    </Text>
                  </View>

                  <Text style={styles.sectionTitle}>Commencer maintenant</Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredRow}
              >
                {quickActions.map((action) => (
                  <FeaturedAction
                    key={action.id}
                    action={action}
                    favorite={favoriteIds.includes(action.id)}
                    onPress={() => handleOpenAction(action)}
                    onFavorite={(event) => handleToggleFavorite(event, action)}
                  />
                ))}
              </ScrollView>
            </Reveal>

            {/* ============================================================
             * FAVORITES
             * ============================================================ */}

            {favoriteActions.length > 0 && (
              <Reveal delay={160}>
                <View style={styles.sectionHeader}>
                  <View>
                    <View style={styles.sectionEyebrowRow}>
                      <Heart size={11} color="#FB7185" fill="#FB7185" />

                      <Text
                        style={[styles.sectionEyebrow, { color: "#FDA4AF" }]}
                      >
                        VOTRE ESPACE
                      </Text>
                    </View>

                    <Text style={styles.sectionTitle}>Vos favoris</Text>
                  </View>

                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {favoriteActions.length}
                    </Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.compactRow}
                >
                  {favoriteActions.map((action) => (
                    <CompactAction
                      key={action.id}
                      action={action}
                      onPress={() => handleOpenAction(action)}
                    />
                  ))}
                </ScrollView>
              </Reveal>
            )}

            {/* ============================================================
             * RECENT
             * ============================================================ */}

            {recentActions.length > 0 && (
              <Reveal delay={200}>
                <View style={styles.sectionHeader}>
                  <View>
                    <View style={styles.sectionEyebrowRow}>
                      <Clock3 size={11} color="rgba(255,255,255,0.55)" />

                      <Text
                        style={[
                          styles.sectionEyebrow,
                          {
                            color: "rgba(255,255,255,0.52)",
                          },
                        ]}
                      >
                        REPRENDRE
                      </Text>
                    </View>

                    <Text style={styles.sectionTitle}>Là où vous étiez</Text>
                  </View>

                  <Pressable onPress={() => setRecentIds([])} hitSlop={8}>
                    <Text style={styles.clearText}>Effacer</Text>
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.compactRow}
                >
                  {recentActions.map((action) => (
                    <CompactAction
                      key={action.id}
                      action={action}
                      onPress={() => handleOpenAction(action)}
                    />
                  ))}
                </ScrollView>
              </Reveal>
            )}

            {/* ============================================================
             * DISCOVERY
             * ============================================================ */}

            <Reveal delay={250}>
              <View style={[styles.sectionHeader, { marginTop: 8 }]}>
                <View>
                  <View style={styles.sectionEyebrowRow}>
                    <Compass size={11} color="#A78BFA" />

                    <Text style={[styles.sectionEyebrow, { color: "#C4B5FD" }]}>
                      DÉCOUVRIR
                    </Text>
                  </View>

                  <Text style={styles.sectionTitle}>
                    Explorer DébrouillePro
                  </Text>
                </View>
              </View>
            </Reveal>

            {/* ============================================================
             * CATEGORY GROUPS
             * ============================================================ */}

            {CATEGORIES.filter((category) => category !== "Tous").map(
              (category, categoryIndex) => {
                const categoryActions = ALL_ACTIONS.filter(
                  (action) => action.category === category,
                );

                if (categoryActions.length === 0) {
                  return null;
                }

                return (
                  <Reveal
                    key={category}
                    delay={280 + Math.min(categoryIndex * 20, 180)}
                  >
                    <View style={styles.categorySection}>
                      <View style={styles.categorySectionHeader}>
                        <View>
                          <Text style={styles.categorySectionTitle}>
                            {category}
                          </Text>

                          <Text style={styles.categorySectionSubtitle}>
                            {categoryActions.length} action
                            {categoryActions.length === 1 ? "" : "s"} à explorer
                          </Text>
                        </View>

                        <Pressable
                          onPress={() => {
                            setActiveCategory(category);
                            setSearch("");
                          }}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`Voir toutes les actions de ${category}`}
                        >
                          <ArrowUpRight
                            size={17}
                            color="rgba(255,255,255,0.40)"
                          />
                        </Pressable>
                      </View>

                      <View style={styles.grid}>
                        {categoryActions.map((action) => (
                          <ActionTile
                            key={action.id}
                            action={action}
                            favorite={favoriteIds.includes(action.id)}
                            onPress={() => handleOpenAction(action)}
                            onFavorite={(event) =>
                              handleToggleFavorite(event, action)
                            }
                          />
                        ))}
                      </View>
                    </View>
                  </Reveal>
                );
              },
            )}

            {/* ============================================================
             * TRUST FOOTER
             * ============================================================ */}

            <Reveal delay={500}>
              <View style={styles.trustFooter}>
                <LinearGradient
                  colors={["rgba(139,92,246,0.16)", "rgba(59,130,246,0.06)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                <View style={styles.trustFooterIcon}>
                  <Shield size={17} color="#A78BFA" />
                </View>

                <View style={styles.trustFooterText}>
                  <Text style={styles.trustFooterTitle}>
                    Une expérience claire par conception
                  </Text>

                  <Text style={styles.trustFooterDescription}>
                    Une action doit vous conduire vers quelque chose de
                    compréhensible. Lorsqu'une fonctionnalité n'est pas encore
                    prête, DébrouillePro préfère vous le dire plutôt que de
                    simuler un résultat.
                  </Text>
                </View>
              </View>
            </Reveal>
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const TILE_SHADOW = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 12,
    },
  },
  android: {
    elevation: 5,
  },
  default: {},
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#03020A",
  },

  orb: {
    position: "absolute",
    borderRadius: 9999,
  },

  /* ------------------------------------------------------------------------
   * HEADER
   * ---------------------------------------------------------------------- */

  header: {
    paddingHorizontal: 16,
    paddingBottom: 13,
    backgroundColor: "rgba(3,2,10,0.94)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.065)",
    zIndex: 20,
  },

  headerTopRow: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.94 }],
  },

  headerIdentity: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },

  headerEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#34D399",
  },

  headerEyebrow: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.38)",
  },

  headerTitle: {
    marginTop: 2,
    fontSize: 20,
    lineHeight: 23,
    fontWeight: "900",
    letterSpacing: -0.55,
    color: "#FFFFFF",
  },

  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: 15,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    ...Platform.select({
      ios: {
        shadowColor: "#7C3AED",
        shadowOpacity: 0.4,
        shadowRadius: 14,
        shadowOffset: {
          width: 0,
          height: 6,
        },
      },
      android: {
        elevation: 7,
      },
      default: {},
    }),
  },

  searchContainer: {
    marginTop: 14,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.095)",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
    paddingVertical: 0,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  searchClear: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.075)",
  },

  categoryRow: {
    paddingTop: 11,
    gap: 7,
    paddingRight: 8,
  },

  categoryChip: {
    minHeight: 31,
    paddingHorizontal: 12,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  categoryChipActive: {
    backgroundColor: "rgba(139,92,246,0.16)",
    borderColor: "rgba(167,139,250,0.34)",
  },

  categoryChipText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.53)",
  },

  categoryChipTextActive: {
    color: "#C4B5FD",
  },

  moreCategories: {
    minWidth: 36,
    height: 31,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  moreCategoriesText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 10,
    fontWeight: "900",
  },

  /* ------------------------------------------------------------------------
   * BODY
   * ---------------------------------------------------------------------- */

  body: {
    flex: 1,
  },

  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 17,
  },

  /* ------------------------------------------------------------------------
   * HERO
   * ---------------------------------------------------------------------- */

  hero: {
    minHeight: 194,
    overflow: "hidden",
    borderRadius: 27,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.20)",
    ...TILE_SHADOW,
  },

  heroGlowA: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 999,
    top: -100,
    right: -55,
    backgroundColor: "rgba(139,92,246,0.20)",
  },

  heroGlowB: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 999,
    bottom: -75,
    left: -35,
    backgroundColor: "rgba(59,130,246,0.13)",
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  heroText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 13,
  },

  heroEyebrow: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "#C4B5FD",
  },

  heroTitle: {
    marginTop: 4,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: "#FFFFFF",
  },

  heroDescription: {
    marginTop: 6,
    maxWidth: 500,
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "500",
    color: "rgba(255,255,255,0.56)",
  },

  heroTrust: {
    marginTop: 20,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.075)",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 13,
  },

  heroTrustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  heroTrustText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.50)",
  },

  /* ------------------------------------------------------------------------
   * SECTION
   * ---------------------------------------------------------------------- */

  sectionHeader: {
    marginTop: 25,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  sectionEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  sectionEyebrow: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: "900",
    letterSpacing: 1.35,
    color: "#A78BFA",
  },

  sectionTitle: {
    marginTop: 3,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
    letterSpacing: -0.45,
    color: "#FFFFFF",
  },

  countBadge: {
    minWidth: 28,
    height: 25,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.13)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.22)",
  },

  countBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#C4B5FD",
  },

  clearText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.40)",
  },

  /* ------------------------------------------------------------------------
   * FEATURED
   * ---------------------------------------------------------------------- */

  featuredRow: {
    gap: 10,
    paddingRight: 10,
  },

  featuredWrap: {
    width: 245,
  },

  featuredCard: {
    minHeight: 174,
    overflow: "hidden",
    borderRadius: 23,
    padding: 15,
    borderWidth: 1,
    ...TILE_SHADOW,
  },

  featuredGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 999,
    top: -55,
    right: -35,
    opacity: 0.14,
  },

  featuredFavorite: {
    position: "absolute",
    top: 13,
    right: 13,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  featuredContent: {
    flex: 1,
    justifyContent: "flex-end",
    marginTop: 15,
  },

  featuredTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  featuredTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.25,
    color: "#FFFFFF",
  },

  featuredDescription: {
    marginTop: 5,
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.48)",
  },

  featuredMeta: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },

  featuredMetaText: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.55)",
  },

  /* ------------------------------------------------------------------------
   * COMPACT
   * ---------------------------------------------------------------------- */

  compactRow: {
    gap: 8,
    paddingRight: 10,
  },

  compactAction: {
    minHeight: 43,
    maxWidth: 170,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
  },

  compactIcon: {
    width: 29,
    height: 29,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  compactLabel: {
    maxWidth: 110,
    fontSize: 10.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.72)",
  },

  /* ------------------------------------------------------------------------
   * CATEGORY SECTION
   * ---------------------------------------------------------------------- */

  categorySection: {
    marginTop: 18,
  },

  categorySectionHeader: {
    marginBottom: 10,
    paddingHorizontal: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  categorySectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  categorySectionSubtitle: {
    marginTop: 2,
    fontSize: 9.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.36)",
  },

  /* ------------------------------------------------------------------------
   * GRID
   * ---------------------------------------------------------------------- */

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 9,
  },

  gridItem: {
    width: "100%",
  },

  tileWrap: {
    width: "100%",
  },

  tile: {
    minHeight: 102,
    position: "relative",
    overflow: "hidden",
    borderRadius: 19,
    padding: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.035)",
    flexDirection: "row",
    alignItems: "center",
  },

  tileAccent: {
    position: "absolute",
    width: 5,
    height: 42,
    left: 0,
    top: 30,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    opacity: 0.72,
  },

  tileFavorite: {
    position: "absolute",
    right: 10,
    top: 9,
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.10)",
  },

  actionIcon: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  tileText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    paddingRight: 27,
  },

  tileTitle: {
    fontSize: 13.5,
    lineHeight: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  tileDescription: {
    marginTop: 4,
    fontSize: 9.8,
    lineHeight: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.42)",
  },

  tileArrow: {
    position: "absolute",
    right: 10,
    bottom: 9,
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  comingSoonBadge: {
    marginTop: 7,
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(251,191,36,0.08)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.15)",
  },

  comingSoonText: {
    fontSize: 7.5,
    fontWeight: "900",
    color: "#FBBF24",
    letterSpacing: 0.4,
  },

  /* ------------------------------------------------------------------------
   * SEARCH
   * ---------------------------------------------------------------------- */

  searchResultHeader: {
    marginTop: 4,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  searchResultTitle: {
    marginTop: 3,
    fontSize: 21,
    lineHeight: 25,
    fontWeight: "900",
    letterSpacing: -0.6,
    color: "#FFFFFF",
  },

  resetText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#A78BFA",
  },

  smartSuggestion: {
    minHeight: 70,
    overflow: "hidden",
    marginBottom: 15,
    padding: 13,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.20)",
    flexDirection: "row",
    alignItems: "center",
  },

  smartSuggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.15)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.20)",
  },

  smartSuggestionText: {
    flex: 1,
    marginLeft: 11,
  },

  smartSuggestionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#DDD6FE",
  },

  smartSuggestionDescription: {
    marginTop: 3,
    fontSize: 9.5,
    lineHeight: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.43)",
  },

  /* ------------------------------------------------------------------------
   * EMPTY
   * ---------------------------------------------------------------------- */

  emptyState: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  emptyTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
  },

  emptyDescription: {
    marginTop: 7,
    maxWidth: 310,
    fontSize: 10.5,
    lineHeight: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.40)",
    textAlign: "center",
  },

  emptyButton: {
    marginTop: 18,
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#5B21B6",
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.22)",
  },

  emptyButtonText: {
    fontSize: 10.5,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  /* ------------------------------------------------------------------------
   * FOOTER
   * ---------------------------------------------------------------------- */

  trustFooter: {
    overflow: "hidden",
    marginTop: 25,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.15)",
    flexDirection: "row",
  },

  trustFooterIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.18)",
  },

  trustFooterText: {
    flex: 1,
    marginLeft: 11,
  },

  trustFooterTitle: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#DDD6FE",
  },

  trustFooterDescription: {
    marginTop: 4,
    fontSize: 9.5,
    lineHeight: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.39)",
  },
});

// src/pages/modules/ActionsPage.tsx
"use no memo";

import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  useWindowDimensions,
  type GestureResponderEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
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
  ChevronRight,
  Clock,
  Coffee,
  Compass,
  CreditCard,
  Flame,
  FileText,
  Film,
  Globe,
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
  Package,
  Phone,
  Plus,
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
  Activity,
  AlertTriangle,
  GraduationCap,
  Newspaper,
  TreePine,
} from "lucide-react-native";
import { toast } from "sonner";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type LucideIcon = ComponentType<{
  size?: number;
  color?: string;
  style?: object;
}>;

interface Action {
  id: string;
  icon: LucideIcon;
  label: string;
  desc: string;
  page?: string;
  color: string;
  category: string;
}

/* ============================================================================
 * DATA — 60+ actions
 * ========================================================================== */

const ALL_ACTIONS: Action[] = [
  {
    id: "payer",
    icon: CreditCard,
    label: "Payer",
    desc: "Mobile Money, carte",
    page: "paiement",
    color: "#10B981",
    category: "Finance & Paiements",
  },
  {
    id: "transferer",
    icon: Send,
    label: "Transférer",
    desc: "Peer-to-peer instantané",
    page: "wallet",
    color: "#10B981",
    category: "Finance & Paiements",
  },
  {
    id: "facturer",
    icon: FileText,
    label: "Facturer",
    desc: "Créer une facture",
    page: "paiement",
    color: "#10B981",
    category: "Finance & Paiements",
  },
  {
    id: "epargner",
    icon: TrendingUp,
    label: "Épargner",
    desc: "Micro-crédit & plans",
    page: "wallet",
    color: "#10B981",
    category: "Finance & Paiements",
  },
  {
    id: "investir",
    icon: BarChart2,
    label: "Investir",
    desc: "Placements & portefeuille",
    page: "finances",
    color: "#10B981",
    category: "Finance & Paiements",
  },
  {
    id: "marche",
    icon: ShoppingBag,
    label: "Marché",
    desc: "Acheter & vendre",
    page: "marketplace",
    color: "#F97316",
    category: "Finance & Paiements",
  },

  {
    id: "vtc",
    icon: Car,
    label: "VTC / Taxi",
    desc: "Réserver un trajet",
    page: "transport",
    color: "#3B82F6",
    category: "Mobilité & Livraison",
  },
  {
    id: "moto",
    icon: Truck,
    label: "Moto-taxi",
    desc: "Rapide et pratique",
    page: "transport",
    color: "#3B82F6",
    category: "Mobilité & Livraison",
  },
  {
    id: "colis",
    icon: Package,
    label: "Colis",
    desc: "Envoyer / recevoir",
    page: "livraison",
    color: "#3B82F6",
    category: "Mobilité & Livraison",
  },
  {
    id: "repas",
    icon: UtensilsCrossed,
    label: "Repas",
    desc: "Commander",
    page: "restauration",
    color: "#F97316",
    category: "Mobilité & Livraison",
  },
  {
    id: "voyager",
    icon: Compass,
    label: "Voyager",
    desc: "Bus, avion, ferry",
    page: "voyages",
    color: "#0EA5E9",
    category: "Mobilité & Livraison",
  },
  {
    id: "heberger",
    icon: BedDouble,
    label: "Hébergement",
    desc: "Trouver un logement",
    page: "hebergement",
    color: "#10B981",
    category: "Mobilité & Livraison",
  },

  {
    id: "louer",
    icon: Home,
    label: "Louer",
    desc: "Appartements & studios",
    page: "immo",
    color: "#8B5CF6",
    category: "Immobilier & Emploi",
  },
  {
    id: "vendre-immo",
    icon: Home,
    label: "Vendre immo",
    desc: "Mettre un bien en vente",
    page: "immo",
    color: "#8B5CF6",
    category: "Immobilier & Emploi",
  },
  {
    id: "emploi",
    icon: Briefcase,
    label: "Chercher emploi",
    desc: "Offres & candidatures",
    page: "jobs",
    color: "#8B5CF6",
    category: "Immobilier & Emploi",
  },
  {
    id: "recruter",
    icon: Users,
    label: "Recruter",
    desc: "Poster une offre",
    page: "jobs",
    color: "#8B5CF6",
    category: "Immobilier & Emploi",
  },
  {
    id: "freelance",
    icon: Landmark,
    label: "Freelance",
    desc: "Missions & contrats",
    page: "jobs",
    color: "#8B5CF6",
    category: "Immobilier & Emploi",
  },
  {
    id: "business",
    icon: BarChart2,
    label: "Business",
    desc: "Gérer son entreprise",
    page: "business",
    color: "#8B5CF6",
    category: "Immobilier & Emploi",
  },

  {
    id: "plomberie",
    icon: Wrench,
    label: "Plomberie",
    desc: "Intervention rapide",
    page: "services",
    color: "#F97316",
    category: "Services à domicile",
  },
  {
    id: "electricite",
    icon: Zap,
    label: "Électricité",
    desc: "Dépannage",
    page: "energie",
    color: "#FBBF24",
    category: "Services à domicile",
  },
  {
    id: "menage",
    icon: Activity,
    label: "Ménage",
    desc: "Professionnels vérifiés",
    page: "services",
    color: "#F97316",
    category: "Services à domicile",
  },
  {
    id: "cours-domicile",
    icon: GraduationCap,
    label: "Cours privés",
    desc: "À domicile",
    page: "apprendre",
    color: "#F59E0B",
    category: "Services à domicile",
  },
  {
    id: "livraison-dom",
    icon: Package,
    label: "Livraison",
    desc: "Courses & colis",
    page: "livraison",
    color: "#F97316",
    category: "Services à domicile",
  },
  {
    id: "restaurant-call",
    icon: UtensilsCrossed,
    label: "Restauration",
    desc: "Menu & livraison",
    page: "restauration",
    color: "#F97316",
    category: "Services à domicile",
  },

  {
    id: "rdv",
    icon: CalendarDays,
    label: "Prendre RDV",
    desc: "Médecin, spécialiste",
    page: "sante",
    color: "#EF4444",
    category: "Santé & Bien-être",
  },
  {
    id: "teleconsult",
    icon: Phone,
    label: "Téléconsult.",
    desc: "Consultation en ligne",
    page: "sante",
    color: "#EF4444",
    category: "Santé & Bien-être",
  },
  {
    id: "pharmacie",
    icon: Stethoscope,
    label: "Pharmacie",
    desc: "Commande & livraison",
    page: "sante",
    color: "#EF4444",
    category: "Santé & Bien-être",
  },
  {
    id: "entrainer",
    icon: Flame,
    label: "S'entraîner",
    desc: "Workouts",
    page: "fitness",
    color: "#EF4444",
    category: "Santé & Bien-être",
  },
  {
    id: "nutrition-log",
    icon: Coffee,
    label: "Nutrition",
    desc: "Journal alimentaire",
    page: "nutrition",
    color: "#F59E0B",
    category: "Santé & Bien-être",
  },
  {
    id: "mediter",
    icon: Activity,
    label: "Méditer",
    desc: "Respiration guidée",
    page: "meditation",
    color: "#8B5CF6",
    category: "Santé & Bien-être",
  },
  {
    id: "sport-club",
    icon: Trophy,
    label: "Sport",
    desc: "Clubs · Tournois",
    page: "sport",
    color: "#6366F1",
    category: "Santé & Bien-être",
  },

  {
    id: "cours",
    icon: BookOpen,
    label: "Cours",
    desc: "MOOC · Apprentissage",
    page: "cours",
    color: "#F59E0B",
    category: "Éducation & Formation",
  },
  {
    id: "quiz",
    icon: Target,
    label: "Quiz",
    desc: "Tests & évaluations",
    page: "quiz",
    color: "#A78BFA",
    category: "Éducation & Formation",
  },
  {
    id: "certifier",
    icon: Award,
    label: "Certifier",
    desc: "Obtenir un certificat",
    page: "certifications",
    color: "#A78BFA",
    category: "Éducation & Formation",
  },
  {
    id: "mentorat",
    icon: Users,
    label: "Mentorat",
    desc: "Trouver un mentor",
    page: "mentorat",
    color: "#A78BFA",
    category: "Éducation & Formation",
  },
  {
    id: "ecole",
    icon: GraduationCap,
    label: "École",
    desc: "Scolarité · Inscription",
    page: "ecole",
    color: "#F59E0B",
    category: "Éducation & Formation",
  },
  {
    id: "apprendre",
    icon: BookOpen,
    label: "Apprendre",
    desc: "Catalogue complet",
    page: "apprendre",
    color: "#F59E0B",
    category: "Éducation & Formation",
  },

  {
    id: "groupes",
    icon: Users,
    label: "Groupes",
    desc: "Rejoindre des discussions",
    page: "community",
    color: "#EC4899",
    category: "Social & Communauté",
  },
  {
    id: "evenement",
    icon: CalendarDays,
    label: "Événements",
    desc: "Découvrir et créer",
    page: "evenements",
    color: "#EC4899",
    category: "Social & Communauté",
  },
  {
    id: "parrainer",
    icon: HandHeart,
    label: "Parrainer",
    desc: "Inviter & gagner",
    page: "parrainage",
    color: "#EC4899",
    category: "Social & Communauté",
  },
  {
    id: "reseau",
    icon: Network,
    label: "Réseau",
    desc: "Connexions professionnelles",
    page: "network",
    color: "#3B82F6",
    category: "Social & Communauté",
  },
  {
    id: "messages",
    icon: MessageSquare,
    label: "Messages",
    desc: "Tchatter · Groupes",
    page: "messages",
    color: "#3B82F6",
    category: "Social & Communauté",
  },

  {
    id: "lire-news",
    icon: Newspaper,
    label: "Actualités",
    desc: "News & podcasts",
    page: "media",
    color: "#06B6D4",
    category: "Médias & Création",
  },
  {
    id: "streamer",
    icon: Radio,
    label: "Streamer",
    desc: "Lancer un live",
    page: "live-streaming",
    color: "#EF4444",
    category: "Médias & Création",
  },
  {
    id: "creer-contenu",
    icon: Camera,
    label: "Créer contenu",
    desc: "Stories · Vidéos",
    page: "editeur",
    color: "#8B5CF6",
    category: "Médias & Création",
  },
  {
    id: "publier-story",
    icon: Film,
    label: "Story Creator",
    desc: "Créer une story",
    page: "stories-creator",
    color: "#EC4899",
    category: "Médias & Création",
  },
  {
    id: "lancer-pub",
    icon: Megaphone,
    label: "Publicité",
    desc: "Créer une campagne",
    page: "pub",
    color: "#F59E0B",
    category: "Médias & Création",
  },
  {
    id: "cocreation",
    icon: Lightbulb,
    label: "Co-créer",
    desc: "Projet collaboratif",
    page: "cocreation",
    color: "#A78BFA",
    category: "Médias & Création",
  },

  {
    id: "planter",
    icon: Leaf,
    label: "Planter",
    desc: "Calendrier & conseils",
    page: "agri",
    color: "#22C55E",
    category: "Agriculture & Environnement",
  },
  {
    id: "vendre-agri",
    icon: ShoppingBag,
    label: "Vendre Agri",
    desc: "Marché agricole",
    page: "agri",
    color: "#22C55E",
    category: "Agriculture & Environnement",
  },
  {
    id: "environnement",
    icon: TreePine,
    label: "Écologie",
    desc: "Recyclage · Green",
    page: "environnement",
    color: "#22C55E",
    category: "Agriculture & Environnement",
  },
  {
    id: "energie",
    icon: Zap,
    label: "Énergie",
    desc: "Solaire · Réseau",
    page: "energie",
    color: "#FBBF24",
    category: "Agriculture & Environnement",
  },

  {
    id: "sos",
    icon: AlertTriangle,
    label: "SOS",
    desc: "Alerte urgence",
    page: "sos",
    color: "#EF4444",
    category: "Gouvernance & Sécurité",
  },
  {
    id: "securite",
    icon: Shield,
    label: "Sécurité",
    desc: "Signalement incident",
    page: "securite",
    color: "#EF4444",
    category: "Gouvernance & Sécurité",
  },
  {
    id: "juridique",
    icon: Scale,
    label: "Juridique",
    desc: "Conseil légal",
    page: "juridique",
    color: "#9CA3AF",
    category: "Gouvernance & Sécurité",
  },
  {
    id: "justice",
    icon: Scale,
    label: "Justice",
    desc: "Signaler · Défendre",
    page: "justice",
    color: "#9CA3AF",
    category: "Gouvernance & Sécurité",
  },
  {
    id: "data-pub",
    icon: BarChart2,
    label: "Data Publique",
    desc: "Open data officiel",
    page: "data-publique",
    color: "#06B6D4",
    category: "Gouvernance & Sécurité",
  },

  {
    id: "dons",
    icon: HandHeart,
    label: "Faire un don",
    desc: "Soutenir une cause",
    page: "ong",
    color: "#10B981",
    category: "ONG & Solidarité",
  },
  {
    id: "benevolat",
    icon: Globe,
    label: "Bénévolat",
    desc: "S'engager bénévolement",
    page: "ong",
    color: "#10B981",
    category: "ONG & Solidarité",
  },
  {
    id: "campagne",
    icon: Megaphone,
    label: "Campagne",
    desc: "Lancer une collecte",
    page: "ong",
    color: "#10B981",
    category: "ONG & Solidarité",
  },

  {
    id: "carte",
    icon: MapPin,
    label: "Carte",
    desc: "Explorer autour de moi",
    page: "carte",
    color: "#6366F1",
    category: "Carte & Tech",
  },
  {
    id: "map3d",
    icon: Map,
    label: "Map 3D",
    desc: "Cartographie avancée",
    page: "map3d",
    color: "#6366F1",
    category: "Carte & Tech",
  },
  {
    id: "login",
    icon: LogIn,
    label: "Mon compte",
    desc: "Profil · Paramètres",
    page: "profile",
    color: "#8B5CF6",
    category: "Carte & Tech",
  },
];

/* ============================================================================
 * STORAGE HELPERS (safe on RN + web)
 * ========================================================================== */

const RECENT_KEY = "debrouille_recent_actions";
const FAV_KEY = "debrouille_fav_actions";
const MAX_RECENT = 6;

function getStorage(): Storage | null {
  try {
    if (typeof globalThis === "undefined") return null;
    const s = (globalThis as { localStorage?: Storage }).localStorage;
    if (!s || typeof s.getItem !== "function") return null;
    return s;
  } catch {
    return null;
  }
}

function readStorage(key: string): string[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const value = storage.getItem(key);
    return value ? (JSON.parse(value) as string[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(key: string, value: string[]) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

const CATEGORIES: string[] = [
  "Tous",
  ...Array.from(new Set(ALL_ACTIONS.map((a) => a.category))),
];

const PREFERRED_IDS = [
  "payer",
  "transferer",
  "vtc",
  "emploi",
  "louer",
  "rdv",
  "marche",
  "voyager",
];

/* ============================================================================
 * AMBIENT BACKGROUND — orbes flottants natifs
 * ========================================================================== */

function AmbientBackground() {
  const { width: W, height: H } = useWindowDimensions();
  const orbA = useRef(new Animated.Value(0)).current;
  const orbB = useRef(new Animated.Value(0)).current;
  const orbC = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopA = Animated.loop(
      Animated.sequence([
        Animated.timing(orbA, {
          toValue: -40,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbA, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const loopB = Animated.loop(
      Animated.sequence([
        Animated.timing(orbB, {
          toValue: 50,
          duration: 11000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbB, {
          toValue: 0,
          duration: 11000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const loopC = Animated.loop(
      Animated.sequence([
        Animated.timing(orbC, {
          toValue: -30,
          duration: 10000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbC, {
          toValue: 0,
          duration: 10000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
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
        colors={["#05030E", "#0C0724", "#08041A", "#10062A"]}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: Math.max(360, W * 0.9),
            height: Math.max(360, W * 0.9),
            top: -180,
            left: -140,
            backgroundColor: "rgba(139,92,246,0.28)",
            transform: [{ translateY: orbA }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: 320,
            height: 320,
            top: H * 0.4,
            right: -140,
            backgroundColor: "rgba(99,102,241,0.22)",
            transform: [{ translateY: orbB }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: 280,
            height: 280,
            bottom: -120,
            left: -60,
            backgroundColor: "rgba(249,115,22,0.16)",
            transform: [{ translateY: orbC }],
          },
        ]}
      />
    </View>
  );
}

/* ============================================================================
 * REVEAL — entrance animée native
 * ========================================================================== */

function Reveal({
  delay = 0,
  distance = 14,
  children,
  style,
}: {
  delay?: number;
  distance?: number;
  children: ReactNode;
  style?: object;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(anim, {
      toValue: 1,
      duration: 480,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
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
 * PRESS SCALE WRAPPER — feedback natif
 * ========================================================================== */

function PressScale({
  onPress,
  onLongPress,
  children,
  style,
  scaleTo = 0.96,
  accessibilityLabel,
  disabled,
}: {
  onPress?: () => void;
  onLongPress?: () => void;
  children: ReactNode;
  style?: object;
  scaleTo?: number;
  accessibilityLabel?: string;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * ACTION TILE — grande tuile bento (2 colonnes)
 * ========================================================================== */

function ActionTile({
  action,
  isFav,
  onTap,
  onToggleFav,
}: {
  action: Action;
  isFav: boolean;
  onTap: () => void;
  onToggleFav: (event: GestureResponderEvent) => void;
}) {
  const Icon = action.icon;

  return (
    <PressScale onPress={onTap} style={styles.tileWrap} scaleTo={0.97}>
      <View style={[styles.tile, { borderColor: `${action.color}33` }]}>
        {/* Gradient de fond */}
        <LinearGradient
          colors={[`${action.color}22`, `${action.color}08`, "rgba(0,0,0,0)"]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Halo supérieur */}
        <View
          pointerEvents="none"
          style={[styles.tileHalo, { backgroundColor: action.color }]}
        />

        {/* Fav */}
        <Pressable
          onPress={onToggleFav}
          accessibilityLabel={
            isFav
              ? `Retirer ${action.label} des favoris`
              : `Ajouter ${action.label} aux favoris`
          }
          style={styles.tileFavBtn}
          hitSlop={6}
        >
          <Star
            size={11}
            color={isFav ? "#FACC15" : "rgba(255,255,255,0.35)"}
            fill={isFav ? "#FACC15" : "transparent"}
          />
        </Pressable>

        {/* Icone */}
        <View
          style={[
            styles.tileIconBox,
            {
              backgroundColor: `${action.color}26`,
              borderColor: `${action.color}40`,
            },
          ]}
        >
          <Icon size={20} color={action.color} />
        </View>

        {/* Texte */}
        <View style={styles.tileTextBlock}>
          <Text style={styles.tileLabel} numberOfLines={1}>
            {action.label}
          </Text>
          <Text style={styles.tileDesc} numberOfLines={2}>
            {action.desc}
          </Text>
        </View>

        {/* Chevron discret en bas à droite */}
        <View style={styles.tileChevron}>
          <ChevronRight size={12} color="rgba(255,255,255,0.22)" />
        </View>
      </View>
    </PressScale>
  );
}

/* ============================================================================
 * FEATURED CARD — grande carte carrousel horizontal
 * ========================================================================== */

function FeaturedCard({
  action,
  isFav,
  onTap,
  onToggleFav,
}: {
  action: Action;
  isFav: boolean;
  onTap: () => void;
  onToggleFav: (event: GestureResponderEvent) => void;
}) {
  const Icon = action.icon;

  return (
    <PressScale onPress={onTap} style={styles.featuredWrap} scaleTo={0.97}>
      <LinearGradient
        colors={[`${action.color}30`, `${action.color}12`, "rgba(10,6,24,0.6)"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.featuredCard, { borderColor: `${action.color}44` }]}
      >
        {/* Halo */}
        <View
          pointerEvents="none"
          style={[styles.featuredHalo, { backgroundColor: action.color }]}
        />

        {/* Fav */}
        <Pressable
          onPress={onToggleFav}
          accessibilityLabel={
            isFav ? "Retirer des favoris" : "Ajouter aux favoris"
          }
          style={styles.featuredFavBtn}
          hitSlop={6}
        >
          <Star
            size={12}
            color={isFav ? "#FACC15" : "rgba(255,255,255,0.4)"}
            fill={isFav ? "#FACC15" : "transparent"}
          />
        </Pressable>

        {/* Icone */}
        <View
          style={[
            styles.featuredIconBox,
            {
              backgroundColor: `${action.color}2A`,
              borderColor: `${action.color}55`,
              shadowColor: action.color,
            },
          ]}
        >
          <Icon size={22} color={action.color} />
        </View>

        {/* Texte */}
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Text style={styles.featuredLabel} numberOfLines={1}>
            {action.label}
          </Text>
          <Text style={styles.featuredDesc} numberOfLines={1}>
            {action.desc}
          </Text>

          <View style={styles.featuredBottomRow}>
            <View
              style={[
                styles.featuredBadge,
                {
                  backgroundColor: `${action.color}22`,
                  borderColor: `${action.color}55`,
                },
              ]}
            >
              <Text style={[styles.featuredBadgeText, { color: action.color }]}>
                {action.category.split(" ")[0]}
              </Text>
            </View>
            <ArrowUpRight size={14} color="rgba(255,255,255,0.45)" />
          </View>
        </View>
      </LinearGradient>
    </PressScale>
  );
}

/* ============================================================================
 * RECENT CHIP — petite pastille horizontale
 * ========================================================================== */

function RecentChip({ action, onTap }: { action: Action; onTap: () => void }) {
  const Icon = action.icon;

  return (
    <PressScale onPress={onTap} scaleTo={0.94}>
      <LinearGradient
        colors={[`${action.color}1E`, `${action.color}08`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.recentChip, { borderColor: `${action.color}33` }]}
      >
        <View
          style={[
            styles.recentIconBox,
            { backgroundColor: `${action.color}26` },
          ]}
        >
          <Icon size={15} color={action.color} />
        </View>
        <Text style={styles.recentLabel} numberOfLines={1}>
          {action.label}
        </Text>
      </LinearGradient>
    </PressScale>
  );
}

/* ============================================================================
 * MAIN PAGE
 * ========================================================================== */

interface ActionsPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

export default function ActionsPage({ onBack, onNavigate }: ActionsPageProps) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    readStorage(RECENT_KEY),
  );
  const [favIds, setFavIds] = useState<string[]>(() => readStorage(FAV_KEY));

  useEffect(() => {
    writeStorage(RECENT_KEY, recentIds);
  }, [recentIds]);

  useEffect(() => {
    writeStorage(FAV_KEY, favIds);
  }, [favIds]);

  /* ─────────── Handlers ─────────── */

  const handleTap = useCallback(
    (action: Action) => {
      setRecentIds((previous) =>
        [action.id, ...previous.filter((id) => id !== action.id)].slice(
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
        duration: 2000,
      });
    },
    [onNavigate],
  );

  const handleToggleFav = useCallback(
    (event: GestureResponderEvent, action: Action) => {
      event.stopPropagation();

      setFavIds((previous) => {
        const exists = previous.includes(action.id);

        if (exists) {
          toast("Retiré des favoris", { duration: 1400 });
          return previous.filter((id) => id !== action.id);
        }

        toast(`${action.label} ajouté aux favoris`, { duration: 1400 });
        return [action.id, ...previous];
      });
    },
    [],
  );

  /* ─────────── Derived data ─────────── */

  const recentActions = useMemo(
    () =>
      recentIds
        .map((id) => ALL_ACTIONS.find((a) => a.id === id))
        .filter((a): a is Action => Boolean(a)),
    [recentIds],
  );

  const favActions = useMemo(
    () =>
      favIds
        .map((id) => ALL_ACTIONS.find((a) => a.id === id))
        .filter((a): a is Action => Boolean(a)),
    [favIds],
  );

  const filteredActions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return ALL_ACTIONS.filter((action) => {
      const matchesSearch =
        !query ||
        action.label.toLowerCase().includes(query) ||
        action.desc.toLowerCase().includes(query) ||
        action.category.toLowerCase().includes(query);

      const matchesCategory =
        activeCategory === "Tous" || action.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const isFiltering = search.trim().length > 0 || activeCategory !== "Tous";

  const popularActions = useMemo(
    () =>
      PREFERRED_IDS.map((id) => ALL_ACTIONS.find((a) => a.id === id)).filter(
        (a): a is Action => Boolean(a),
      ),
    [],
  );

  /* ─────────── Render ─────────── */

  return (
    <View style={styles.root}>
      <AmbientBackground />

      {/* ═════════════ HEADER ═════════════ */}
      <View
        style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}
      >
        {/* Row 1 */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            accessibilityLabel="Retour"
            hitSlop={8}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.75, transform: [{ scale: 0.94 }] },
            ]}
          >
            <ArrowLeft size={17} color="rgba(255,255,255,0.9)" />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Actions rapides
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {ALL_ACTIONS.length} services · {CATEGORIES.length - 1} catégories
            </Text>
          </View>

          <LinearGradient
            colors={["#8B5CF6", "#6366F1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerIcon}
          >
            <Zap size={17} color="#fff" />
          </LinearGradient>
        </View>

        {/* Row 2 — Search */}
        <View style={styles.searchWrap}>
          <Search size={15} color="rgba(255,255,255,0.4)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Que voulez-vous faire ?"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.searchInput}
            autoComplete="off"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch("")}
              style={styles.searchClear}
              hitSlop={6}
            >
              <X size={12} color="rgba(255,255,255,0.6)" />
            </Pressable>
          )}
        </View>

        {/* Row 3 — Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORIES.map((category) => {
            const active = activeCategory === category;
            const label =
              category === "Tous"
                ? `Tous · ${ALL_ACTIONS.length}`
                : category.split(" ")[0];

            return (
              <Pressable
                key={category}
                onPress={() => setActiveCategory(category)}
                style={[
                  styles.chip,
                  active ? styles.chipActive : styles.chipIdle,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? "#FDBA74" : "rgba(255,255,255,0.6)" },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ═════════════ BODY ═════════════ */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.bodyContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isFiltering ? (
          <>
            {/* Result header */}
            <Reveal>
              <View style={styles.resultHeader}>
                <View>
                  <Text style={styles.resultEyebrow}>RÉSULTATS</Text>
                  <Text style={styles.resultTitle}>
                    {filteredActions.length} action
                    {filteredActions.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setSearch("");
                    setActiveCategory("Tous");
                  }}
                  hitSlop={6}
                >
                  <Text style={styles.resetLink}>Réinitialiser</Text>
                </Pressable>
              </View>
            </Reveal>

            {filteredActions.length === 0 ? (
              <Reveal>
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIcon}>
                    <Search size={24} color="rgba(255,255,255,0.2)" />
                  </View>
                  <Text style={styles.emptyTitle}>Aucune action trouvée</Text>
                  <Text style={styles.emptySub}>
                    Essayez un autre mot ou une autre catégorie.
                  </Text>
                </View>
              </Reveal>
            ) : (
              <View style={styles.grid}>
                {filteredActions.map((action, i) => (
                  <Reveal
                    key={action.id}
                    delay={Math.min(i * 25, 300)}
                    style={styles.gridItem}
                  >
                    <ActionTile
                      action={action}
                      isFav={favIds.includes(action.id)}
                      onTap={() => handleTap(action)}
                      onToggleFav={(event) => handleToggleFav(event, action)}
                    />
                  </Reveal>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {/* ─── HERO COMPACT ─── */}
            <Reveal delay={20}>
              <View style={styles.hero}>
                <LinearGradient
                  colors={[
                    "rgba(139,92,246,0.22)",
                    "rgba(99,102,241,0.10)",
                    "rgba(10,6,24,0.4)",
                  ]}
                  locations={[0, 0.5, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View pointerEvents="none" style={styles.heroOrbA} />
                <View pointerEvents="none" style={styles.heroOrbB} />

                <View style={styles.heroTopRow}>
                  <LinearGradient
                    colors={["#8B5CF6", "#6366F1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroIconBox}
                  >
                    <Sparkles size={20} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.heroEyebrow}>CENTRE DE COMMANDES</Text>
                    <Text style={styles.heroTitle}>
                      Faites plus, en moins de temps.
                    </Text>
                  </View>
                </View>

                <View style={styles.heroStatsRow}>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>
                      {ALL_ACTIONS.length}
                    </Text>
                    <Text style={styles.heroStatLabel}>ACTIONS</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStat}>
                    <Text style={[styles.heroStatValue, { color: "#FACC15" }]}>
                      {favActions.length}
                    </Text>
                    <Text style={styles.heroStatLabel}>FAVORIS</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStat}>
                    <Text style={[styles.heroStatValue, { color: "#34D399" }]}>
                      {recentActions.length}
                    </Text>
                    <Text style={styles.heroStatLabel}>RÉCENTS</Text>
                  </View>
                </View>
              </View>
            </Reveal>

            {/* ─── POPULAR — carrousel horizontal ─── */}
            <Reveal delay={100}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <View style={styles.sectionEyebrowRow}>
                    <Flame size={11} color="#FB923C" />
                    <Text style={[styles.sectionEyebrow, { color: "#FDBA74" }]}>
                      ACCÈS INSTANTANÉ
                    </Text>
                  </View>
                  <Text style={styles.sectionTitle}>Les plus utiles</Text>
                </View>
                <View style={styles.sectionCountBadge}>
                  <Text style={styles.sectionCountText}>
                    {popularActions.length}
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredRow}
              >
                {popularActions.map((action) => (
                  <FeaturedCard
                    key={action.id}
                    action={action}
                    isFav={favIds.includes(action.id)}
                    onTap={() => handleTap(action)}
                    onToggleFav={(event) => handleToggleFav(event, action)}
                  />
                ))}
              </ScrollView>
            </Reveal>

            {/* ─── FAVORITES ─── */}
            {favActions.length > 0 && (
              <Reveal delay={160}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <View style={styles.sectionEyebrowRow}>
                      <Heart size={11} color="#FB7185" fill="#FB7185" />
                      <Text
                        style={[styles.sectionEyebrow, { color: "#FDA4AF" }]}
                      >
                        MES FAVORIS
                      </Text>
                    </View>
                    <Text style={styles.sectionTitle}>Vos préférés</Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentRow}
                >
                  {favActions.map((action) => (
                    <RecentChip
                      key={action.id}
                      action={action}
                      onTap={() => handleTap(action)}
                    />
                  ))}
                </ScrollView>
              </Reveal>
            )}

            {/* ─── RECENT ─── */}
            {recentActions.length > 0 && (
              <Reveal delay={220}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <View style={styles.sectionEyebrowRow}>
                      <Clock size={11} color="rgba(255,255,255,0.55)" />
                      <Text
                        style={[
                          styles.sectionEyebrow,
                          { color: "rgba(255,255,255,0.5)" },
                        ]}
                      >
                        RÉCENTS
                      </Text>
                    </View>
                    <Text style={styles.sectionTitle}>
                      Reprendre là où vous étiez
                    </Text>
                  </View>
                  <Pressable onPress={() => setRecentIds([])} hitSlop={6}>
                    <Text style={styles.clearLink}>Effacer</Text>
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentRow}
                >
                  {recentActions.map((action) => (
                    <RecentChip
                      key={action.id}
                      action={action}
                      onTap={() => handleTap(action)}
                    />
                  ))}
                </ScrollView>
              </Reveal>
            )}

            {/* ─── TOUTES LES ACTIONS ─── */}
            <Reveal delay={280}>
              <View style={[styles.sectionHeaderRow, { marginTop: 8 }]}>
                <View>
                  <View style={styles.sectionEyebrowRow}>
                    <Sparkles size={11} color="#A78BFA" />
                    <Text style={[styles.sectionEyebrow, { color: "#C4B5FD" }]}>
                      EXPLORER
                    </Text>
                  </View>
                  <Text style={styles.sectionTitle}>Toutes les actions</Text>
                </View>
              </View>
            </Reveal>

            <View style={styles.grid}>
              {ALL_ACTIONS.map((action, i) => (
                <Reveal
                  key={action.id}
                  delay={Math.min(320 + i * 15, 700)}
                  style={styles.gridItem}
                >
                  <ActionTile
                    action={action}
                    isFav={favIds.includes(action.id)}
                    onTap={() => handleTap(action)}
                    onToggleFav={(event) => handleToggleFav(event, action)}
                  />
                </Reveal>
              ))}
            </View>

            {/* ─── FOOTER ─── */}
            <Reveal delay={700}>
              <View style={styles.footer}>
                <LinearGradient
                  colors={["rgba(167,139,250,0.14)", "rgba(99,102,241,0.05)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.footerRow}>
                  <View style={styles.footerIconBox}>
                    <Sparkles size={15} color="#A78BFA" />
                  </View>
                  <Text style={styles.footerText}>
                    DébrouillePro rassemble vos services essentiels dans un seul
                    espace.{" "}
                    <Text style={styles.footerHighlight}>
                      Ajoutez vos actions préférées pour les retrouver encore
                      plus vite.
                    </Text>
                  </Text>
                </View>

                <View style={styles.footerStatusRow}>
                  <View style={styles.footerDot} />
                  <Text style={styles.footerStatusText}>
                    CENTRE DE COMMANDES ACTIF
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
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  android: { elevation: 4 },
  default: {},
});

const styles = StyleSheet.create({
  /* ── Root ─────────────────────────── */
  root: {
    flex: 1,
    backgroundColor: "#05030E",
  },
  orb: {
    position: "absolute",
    borderRadius: 9999,
  },

  /* ── Header ───────────────────────── */
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "rgba(5,3,14,0.92)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.4,
  },
  headerSub: {
    marginTop: 3,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.42)",
    fontWeight: "600",
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#8B5CF6",
        shadowOpacity: 0.55,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },

  /* ── Search ───────────────────────── */
  searchWrap: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    padding: 0,
  },
  searchClear: {
    width: 26,
    height: 26,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  /* ── Chips ────────────────────────── */
  chipsRow: {
    gap: 8,
    paddingTop: 14,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipActive: {
    borderColor: "rgba(249,115,22,0.55)",
    backgroundColor: "rgba(249,115,22,0.14)",
  },
  chipIdle: {
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.1,
  },

  /* ── Body ─────────────────────────── */
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 24,
  },

  /* ── Result header ────────────────── */
  resultHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  resultEyebrow: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 2,
  },
  resultTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.4,
  },
  resetLink: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#C4B5FD",
  },

  /* ── Sections ─────────────────────── */
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  sectionEyebrow: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.4,
  },
  sectionCountBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  sectionCountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.5)",
  },
  clearLink: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.4)",
  },

  /* ── Hero compact ─────────────────── */
  hero: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.28)",
    overflow: "hidden",
  },
  heroOrbA: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(139,92,246,0.20)",
  },
  heroOrbB: {
    position: "absolute",
    bottom: -50,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(99,102,241,0.14)",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#6366F1",
        shadowOpacity: 0.55,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  heroEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    color: "rgba(196,181,253,0.9)",
    letterSpacing: 2,
  },
  heroTitle: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.4,
  },
  heroStatsRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#C4B5FD",
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    marginTop: 3,
    fontSize: 8.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 1.4,
  },
  heroStatDivider: {
    width: 1,
    height: 26,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  /* ── Featured carousel ────────────── */
  featuredRow: {
    gap: 12,
    paddingRight: 8,
  },
  featuredWrap: {
    width: 190,
  },
  featuredCard: {
    width: 190,
    height: 170,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    overflow: "hidden",
    ...TILE_SHADOW,
  },
  featuredHalo: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.25,
  },
  featuredFavBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
    width: 26,
    height: 26,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  featuredIconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.55,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  featuredLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  featuredDesc: {
    marginTop: 3,
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "600",
  },
  featuredBottomRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  featuredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  featuredBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  /* ── Recent chips ─────────────────── */
  recentRow: {
    gap: 10,
    paddingRight: 8,
  },
  recentChip: {
    minWidth: 120,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  recentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  recentLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
  },

  /* ── Grid 2-col ───────────────────── */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  gridItem: {
    width: "48.5%",
  },

  /* ── Action Tile ──────────────────── */
  tileWrap: {
    width: "100%",
  },
  tile: {
    minHeight: 132,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    overflow: "hidden",
    ...TILE_SHADOW,
  },
  tileHalo: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.22,
  },
  tileFavBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
    width: 24,
    height: 24,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  tileIconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  tileTextBlock: {
    marginTop: 10,
    minWidth: 0,
  },
  tileLabel: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.1,
  },
  tileDesc: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 13,
    color: "rgba(255,255,255,0.42)",
    fontWeight: "600",
  },
  tileChevron: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },

  /* ── Empty ────────────────────────── */
  emptyWrap: {
    minHeight: 260,
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(255,255,255,0.55)",
  },
  emptySub: {
    marginTop: 4,
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "600",
  },

  /* ── Footer ───────────────────────── */
  footer: {
    marginTop: 6,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
    overflow: "hidden",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  footerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.15)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  footerText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },
  footerHighlight: {
    color: "rgba(255,255,255,0.85)",
  },
  footerStatusRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },
  footerStatusText: {
    fontSize: 9,
    fontWeight: "900",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 1.8,
  },
});

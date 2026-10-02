import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import {
  Alert,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BedDouble,
  BookOpen,
  Briefcase,
  Calendar,
  Check,
  ChevronRight,
  Compass,
  FileText,
  HandHeart,
  Heart,
  Home,
  Leaf,
  MapPin,
  Megaphone,
  Phone,
  Plane,
  Plus,
  Radio,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  TrendingUp,
  Truck,
  UserPlus,
  Users,
  UtensilsCrossed,
  Video,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react-native";

import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useMutation } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api.js";

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import type { PublicationType } from "@/hooks/use-publications";

import { SignInButton } from "@/components/ui/signin";
import AIWriteAssist from "@/components/AIWriteAssist";
import ImageUploader from "@/components/ImageUploader";

import ArticleForm from "./ArticleForm";

import { CreatePropertySheet } from "@/features/immo/components/CreatePropertySheet";
import { CreateAnnonceSheet } from "@/features/annonce/sheets/CreateAnnonceSheet";
import { CreateServiceSheet } from "@/features/service/sheets/CreateServiceSheet";
import { CreatePostSheet } from "@/features/community/components/CreatePost";
import { CreateEventSheet } from "@/features/events/components/CreateEventSheet";
import { CreateProductSheet } from "@/features/marketplace/components/CreateProductSheet";
import { CreateHealthSheet } from "@/features/sante/components/CreateHealthSheet";
import { CreateTransportSheet } from "@/features/transport/create/CreateTransportSheet";
import { CreateRestaurantSheet } from "@/features/restauration/create/CreateRestaurantSheet";
import { CreateAccommodationSheet } from "@/features/hebergement/sheets/CreateAccommodationSheet";
import { CreateAgriSheet } from "@/features/agri/sheets/CreateAgriSheet";
import { CreateNetworkSheet } from "@/features/network/sheets/CreateNetworkSheet";
import { CreateVoyageSheet } from "@/features/voyages/sheets/CreateVoyageSheet";
import CreateReelSheet from "./CreateReelSheet";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface CreateBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Callback de navigation.
   *
   * Utilisé uniquement pour "Live" : le Live n'a pas de formulaire
   * dans le sheet. On ferme le sheet et on délègue la navigation
   * à HomePage.
   */
  onNavigate?: (page: string) => void;
}

type ExtendedPublicationType = PublicationType | "network" | "voyages" | "live";

type GenericPublicationType = "energie" | "ong" | "video" | "sondage";

type ContractType =
  | "cdi"
  | "cdd"
  | "stage"
  | "freelance"
  | "alternance"
  | "benevole";

type FeaturedConfig = {
  rank: number;
  variant: "flagship" | "compact";
  tagline: string;
  ctaLabel: string;
};

/**
 * Option du catalogue Create Hub.
 *
 * - `keywords` : mots-clés factuels (objets, lieux, catégories).
 * - `intents`  : verbes / actions / expressions naturelles de l'utilisateur
 *                (« dormir », « bouffer », « trouver un taf »…). C'est ce
 *                qui permet à la recherche de comprendre une intention
 *                plutôt qu'un simple mot-clé.
 */
type CreateOption = {
  id: ExtendedPublicationType;
  icon: LucideIcon;
  label: string;
  desc: string;
  color: string;
  keywords: string[];
  intents?: string[];
  featured?: FeaturedConfig;
};

type FormState = {
  title: string;
  description: string;
  price: string;
  location: string;
  category: string;
  contact: string;
  condition: string;
};

type CreatePublicationArgs = {
  type: GenericPublicationType;
  title: string;
  description: string;
  price?: string;
  location?: string;
  category?: string;
  images: string[];
  tags: string[];
  meta?: string;
};

type CreatePublicationFn = (
  args: CreatePublicationArgs,
) => Promise<Id<"publications">>;

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const HISTORY_STORAGE_KEY = "debrouille_create_history_v2";
const MAX_HISTORY = 6;

const QUICK_CARD_WIDTH = 132;
const MODULE_CARD_WIDTH = 172;

const CREATE_OPTIONS: CreateOption[] = [
  {
    id: "immo",
    icon: Home,
    label: "Immobilier",
    desc: "Vente, location, terrain",
    color: "#F97316",
    keywords: [
      "maison",
      "appartement",
      "terrain",
      "bureau",
      "commerce",
      "location",
      "vente",
      "bien",
      "studio",
      "villa",
    ],
    intents: [
      "habiter",
      "louer",
      "acheter une maison",
      "déménager",
      "logement",
      "résider",
      "vivre",
      "chercher une maison",
      "trouver un logement",
    ],
    featured: {
      rank: 4,
      variant: "compact",
      tagline: "Publiez un bien et trouvez vos acquéreurs.",
      ctaLabel: "Créer",
    },
  },
  {
    id: "job",
    icon: Briefcase,
    label: "Emploi",
    desc: "Offre, recrutement, freelance",
    color: "#8B5CF6",
    keywords: [
      "travail",
      "emploi",
      "carrière",
      "poste",
      "cdi",
      "stage",
      "mission",
      "freelance",
      "recrutement",
      "cv",
      "salaire",
    ],
    intents: [
      "travailler",
      "postuler",
      "chercher un emploi",
      "trouver un travail",
      "trouver un taf",
      "trouver un boulot",
      "recruter",
      "embaucher",
      "gagner de l'argent",
    ],
    featured: {
      rank: 2,
      variant: "compact",
      tagline: "Recrutez ou publiez une offre.",
      ctaLabel: "Créer",
    },
  },
  {
    id: "service",
    icon: Wrench,
    label: "Service",
    desc: "Proposez vos compétences",
    color: "#F97316",
    keywords: [
      "réparation",
      "plomberie",
      "électricité",
      "design",
      "formation",
      "conseil",
      "prestation",
      "service",
      "artisan",
      "maintenance",
    ],
    intents: [
      "réparer",
      "dépanner",
      "bricoler",
      "aider",
      "proposer mes services",
      "chercher un plombier",
      "chercher un électricien",
      "trouver un artisan",
    ],
    featured: {
      rank: 3,
      variant: "compact",
      tagline: "Proposez votre savoir-faire.",
      ctaLabel: "Créer",
    },
  },
  {
    id: "evenement",
    icon: Calendar,
    label: "Événement",
    desc: "Concert, conférence, fête",
    color: "#EC4899",
    keywords: [
      "concert",
      "foire",
      "exposition",
      "festival",
      "sport",
      "culture",
      "réunion",
      "événement",
      "soirée",
    ],
    intents: [
      "sortir",
      "organiser une fête",
      "assister à un concert",
      "participer",
      "passer une soirée",
      "activité",
    ],
  },
  {
    id: "community",
    icon: Users,
    label: "Community",
    desc: "Partagez avec la communauté",
    color: "#3B82F6",
    keywords: [
      "post",
      "discussion",
      "groupe",
      "partage",
      "conseil",
      "forum",
      "communauté",
      "discussion",
    ],
    intents: [
      "discuter",
      "partager",
      "poster",
      "publier",
      "raconter",
      "témoigner",
      "créer un groupe",
      "rejoindre une communauté",
    ],
    featured: {
      rank: 1,
      variant: "flagship",
      tagline:
        "Publiez, échangez, créez du lien et lancez votre communauté sur DébrouillePro.",
      ctaLabel: "Explorer",
    },
  },
  {
    id: "agri",
    icon: Leaf,
    label: "Agriculture",
    desc: "Produits, intrants, conseil",
    color: "#84CC16",
    keywords: [
      "ferme",
      "récolte",
      "engrais",
      "matériel",
      "élevage",
      "culture",
      "semences",
      "agriculture",
      "champ",
    ],
    intents: [
      "cultiver",
      "planter",
      "récolter",
      "élever",
      "produire agricole",
      "vendre ma récolte",
    ],
  },
  {
    id: "sante",
    icon: Heart,
    label: "Santé",
    desc: "Médecin, pharmacie, conseil",
    color: "#EF4444",
    keywords: [
      "médecin",
      "pharmacie",
      "urgence",
      "télémédecine",
      "vaccin",
      "hôpital",
      "clinique",
      "santé",
      "docteur",
    ],
    intents: [
      "soigner",
      "consulter un médecin",
      "être malade",
      "avoir mal",
      "trouver un docteur",
      "urgence médicale",
      "prendre rendez-vous",
    ],
  },
  {
    id: "transport",
    icon: Truck,
    label: "Transport",
    desc: "Trajet, colis, covoiturage",
    color: "#6366F1",
    keywords: [
      "trajet",
      "taxi",
      "covoiturage",
      "livraison",
      "colis",
      "moto",
      "bus",
      "véhicule",
      "transport",
      "déménagement",
    ],
    intents: [
      "déplacer",
      "livrer",
      "envoyer un colis",
      "expédier",
      "covoiturer",
      "prendre un taxi",
      "déménager des meubles",
    ],
  },
  {
    id: "annonce",
    icon: Megaphone,
    label: "Annonce",
    desc: "Vente d'objet, échange",
    color: "#F59E0B",
    keywords: [
      "objet",
      "occasion",
      "vente",
      "échange",
      "troc",
      "matériel",
      "annonce",
      "bonne affaire",
    ],
    intents: [
      "annoncer",
      "prévenir",
      "vendre un objet",
      "acheter d'occasion",
      "trouver pas cher",
      "faire une bonne affaire",
    ],
  },
  {
    id: "restauration",
    icon: UtensilsCrossed,
    label: "Restauration",
    desc: "Restaurant, traiteur, plats",
    color: "#F97316",
    keywords: [
      "restaurant",
      "traiteur",
      "plat",
      "menu",
      "snack",
      "livraison",
      "repas",
      "restauration",
      "cuisine",
      "food",
    ],
    intents: [
      "manger",
      "bouffer",
      "crever la faim",
      "déjeuner",
      "dîner",
      "prendre un repas",
      "commander à manger",
      "trouver un resto",
      "cuisiner",
    ],
  },
  {
    id: "hebergement",
    icon: BedDouble,
    label: "Hébergement",
    desc: "Hôtel, villa, appartement",
    color: "#10B981",
    keywords: [
      "hôtel",
      "hotel",
      "villa",
      "appartement",
      "chambre",
      "auberge",
      "location",
      "gîte",
      "hébergement",
      "airbnb",
      "nuitée",
    ],
    intents: [
      "dormir",
      "loger",
      "héberger",
      "passer la nuit",
      "séjourner",
      "me reposer",
      "trouver un endroit pour dormir",
      "réserver une chambre",
      "où dormir",
    ],
  },
  {
    id: "energie",
    icon: Zap,
    label: "Énergie",
    desc: "Solaire, groupes, installation",
    color: "#FBBF24",
    keywords: [
      "solaire",
      "groupe électrogène",
      "led",
      "installation",
      "panneau",
      "électricité",
      "énergie",
    ],
    intents: [
      "alimenter en électricité",
      "installer du solaire",
      "avoir du courant",
      "acheter un groupe",
    ],
  },
  {
    id: "ong",
    icon: HandHeart,
    label: "ONG / Don",
    desc: "Campagne, collecte, projet",
    color: "#10B981",
    keywords: [
      "don",
      "collecte",
      "campagne",
      "humanitaire",
      "ong",
      "solidarité",
      "projet",
      "association",
    ],
    intents: [
      "donner",
      "aider",
      "soutenir",
      "faire un don",
      "lancer une collecte",
      "créer une association",
    ],
  },
  {
    id: "video",
    icon: Video,
    label: "Vidéo / Reel",
    desc: "Partagez une vidéo ou un reel",
    color: "#EF4444",
    keywords: [
      "vidéo",
      "video",
      "reel",
      "film",
      "clip",
      "tutorial",
      "tournage",
    ],
    intents: [
      "filmer",
      "publier une vidéo",
      "créer un reel",
      "partager un clip",
      "tourner une vidéo",
    ],
  },
  {
    id: "live",
    icon: Radio,
    label: "Live",
    desc: "Diffusez en direct",
    color: "#EF4444",
    keywords: [
      "live",
      "direct",
      "streaming",
      "diffusion",
      "stream",
      "broadcast",
    ],
    intents: [
      "diffuser en direct",
      "lancer un live",
      "faire un live",
      "streamer",
      "passer en direct",
      "émettre en direct",
      "partager en direct",
    ],
  },
  {
    id: "article",
    icon: BookOpen,
    label: "Article",
    desc: "Écrivez un article ou blog",
    color: "#06B6D4",
    keywords: ["blog", "article", "rédaction", "publication", "éditorial"],
    intents: [
      "écrire",
      "rédiger",
      "publier un article",
      "tenir un blog",
      "raconter dans un texte",
    ],
  },
  {
    id: "sondage",
    icon: BarChart3,
    label: "Sondage",
    desc: "Créez un sondage",
    color: "#A855F7",
    keywords: ["sondage", "vote", "opinion", "question", "enquête"],
    intents: [
      "demander un avis",
      "lancer un vote",
      "poser une question",
      "consulter les gens",
    ],
  },
  {
    id: "marketplace",
    icon: ShoppingBag,
    label: "Produit",
    desc: "Vendez vos produits en ligne",
    color: "#F97316",
    keywords: [
      "produit",
      "e-commerce",
      "boutique",
      "vente",
      "article",
      "catalogue",
      "shop",
    ],
    intents: [
      "vendre en ligne",
      "ouvrir une boutique",
      "proposer un produit",
      "commercialiser",
    ],
    featured: {
      rank: 1,
      variant: "compact",
      tagline: "Vendez et développez votre activité.",
      ctaLabel: "Créer",
    },
  },
  {
    id: "network",
    icon: UserPlus,
    label: "Réseau",
    desc: "Profil pro, connexions, opportunités",
    color: "#6366F1",
    keywords: [
      "réseau",
      "profil",
      "professionnel",
      "connexion",
      "opportunité",
      "réseautage",
      "linkedin",
    ],
    intents: [
      "me faire connaître",
      "développer mon réseau",
      "rencontrer des pros",
      "trouver des partenaires",
    ],
  },
  {
    id: "voyages",
    icon: Plane,
    label: "Voyages",
    desc: "Billets, itinéraires, destinations",
    color: "#0EA5E9",
    keywords: [
      "voyage",
      "billet",
      "avion",
      "bus",
      "trajet",
      "destination",
      "itinéraire",
      "réservation",
      "vacances",
    ],
    intents: [
      "voyager",
      "partir en vacances",
      "réserver un billet",
      "prendre l'avion",
      "découvrir une destination",
    ],
  },
];

const CREATE_GROUPS: {
  label: string;
  icon: LucideIcon;
  color: string;
  ids: ExtendedPublicationType[];
}[] = [
  {
    label: "Commerce & Business",
    icon: ShoppingBag,
    color: "#F97316",
    ids: ["marketplace", "annonce", "restauration"],
  },
  {
    label: "Habitat & Mobilité",
    icon: Home,
    color: "#10B981",
    ids: ["immo", "hebergement", "energie", "transport", "voyages"],
  },
  {
    label: "Professionnel",
    icon: Briefcase,
    color: "#8B5CF6",
    ids: ["job", "service", "network"],
  },
  {
    label: "Communauté",
    icon: Users,
    color: "#3B82F6",
    ids: ["community", "evenement", "ong"],
  },
  {
    label: "Agriculture & Santé",
    icon: Leaf,
    color: "#84CC16",
    ids: ["agri", "sante"],
  },
  {
    label: "Média & Création",
    icon: Video,
    color: "#EF4444",
    ids: ["video", "live", "article", "sondage"],
  },
];

const QUICK_CREATE_IDS: ExtendedPublicationType[] = [
  "immo",
  "job",
  "service",
  "marketplace",
];

/**
 * Chips d'exemples sous la barre de recherche.
 * Un tap remplit la recherche avec le `prompt` associé.
 */
const SEARCH_EXAMPLE_CHIPS: { emoji: string; label: string; prompt: string }[] =
  [
    { emoji: "🛏️", label: "Dormir", prompt: "dormir" },
    { emoji: "🍽️", label: "Manger", prompt: "manger" },
    { emoji: "💼", label: "Travailler", prompt: "travailler" },
    { emoji: "🏠", label: "Habiter", prompt: "habiter" },
    { emoji: "🚕", label: "Me déplacer", prompt: "me déplacer" },
    { emoji: "💰", label: "Vendre", prompt: "vendre" },
  ];

const ENERGIE_CATS = [
  "Solaire",
  "Groupe électrogène",
  "LED",
  "Installation",
  "Maintenance",
  "Autre",
];

const ONG_CATS = [
  "Éducation",
  "Santé",
  "Environnement",
  "Humanitaire",
  "Sport",
  "Culture",
];

const VIDEO_CATS = [
  "Court",
  "Long",
  "Tutorial",
  "Divertissement",
  "Vlog",
  "Live replay",
];

const SONDAGE_CATS = [
  "Opinion",
  "Fun",
  "Business",
  "Communauté",
  "Sport",
  "Autre",
];

const AI_CONTENT_TYPE_MAP: Record<
  ExtendedPublicationType,
  | "post"
  | "job_description"
  | "property_description"
  | "product_description"
  | "event_description"
  | "bio"
> = {
  immo: "property_description",
  job: "job_description",
  service: "post",
  evenement: "event_description",
  community: "post",
  agri: "product_description",
  sante: "post",
  transport: "post",
  annonce: "product_description",
  restauration: "product_description",
  hebergement: "property_description",
  energie: "product_description",
  ong: "post",
  video: "post",
  live: "post",
  article: "post",
  sondage: "post",
  marketplace: "product_description",
  network: "bio",
  voyages: "post",
};

/* ----------------------------------------------------------------------------
 * FEATURED
 * ------------------------------------------------------------------------- */

const FEATURED_FLAGSHIP: CreateOption | null =
  CREATE_OPTIONS.find((option) => option.featured?.variant === "flagship") ??
  null;

const FEATURED_COMPACT: CreateOption[] = CREATE_OPTIONS.filter(
  (option) => option.featured?.variant === "compact",
).sort((a, b) => (a.featured?.rank ?? 99) - (b.featured?.rank ?? 99));

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function getOption(id: ExtendedPublicationType): CreateOption {
  const option = CREATE_OPTIONS.find((item) => item.id === id);
  if (!option) {
    throw new Error(`Create option not found: ${id}`);
  }
  return option;
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Découpe une requête en tokens utiles (>= 3 caractères, dédupliqués).
 */
function tokenize(value: string): string[] {
  const tokens = normalizeSearch(value)
    .replace(/[^\p{Letter}\p{Number}\s]+/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);

  return Array.from(new Set(tokens));
}

/**
 * Score une option contre une requête utilisateur.
 *
 * Priorités :
 *   1. Match exact sur le label
 *   2. Match exact sur un intent
 *   3. Match partiel sur intent (dans un sens ou l'autre)
 *   4. Match sur label
 *   5. Match sur keywords
 *   6. Match token par token (partiel multi-mots)
 *
 * Ce scoring permet à « où dormir » de matcher « hebergement »
 * (via l'intent « où dormir »), à « je veux bouffer » de matcher
 * « restauration » (via l'intent « bouffer »), etc.
 */
function rankOption(option: CreateOption, query: string): number {
  const q = normalizeSearch(query);
  if (!q) return 0;

  const qTokens = tokenize(query);
  const label = normalizeSearch(option.label);
  const desc = normalizeSearch(option.desc);
  const keywords = option.keywords.map(normalizeSearch);
  const intents = (option.intents ?? []).map(normalizeSearch);

  let score = 0;

  /* ---- 1. Label exact ---- */
  if (label === q) score = Math.max(score, 240);
  else if (label.startsWith(q)) score = Math.max(score, 190);
  else if (label.includes(q)) score = Math.max(score, 140);

  /* ---- 2. Intent exact ---- */
  for (const intent of intents) {
    if (intent === q) score = Math.max(score, 220);
    else if (intent.startsWith(q)) score = Math.max(score, 180);
    else if (intent.includes(q)) score = Math.max(score, 150);
    else if (q.includes(intent)) score = Math.max(score, 130);
  }

  /* ---- 3. Keyword ---- */
  for (const keyword of keywords) {
    if (keyword === q) score = Math.max(score, 160);
    else if (keyword.startsWith(q)) score = Math.max(score, 120);
    else if (keyword.includes(q)) score = Math.max(score, 100);
    else if (q.includes(keyword)) score = Math.max(score, 80);
  }

  /* ---- 4. Description ---- */
  if (desc.includes(q)) score = Math.max(score, 50);

  /* ---- 5. Token-level partial matching ---- */
  if (qTokens.length > 0) {
    let tokenScore = 0;

    for (const token of qTokens) {
      // Token vs intent
      const intentHit = intents.some(
        (intent) => intent.includes(token) || token.includes(intent),
      );
      if (intentHit) {
        tokenScore += 30;
        continue;
      }

      // Token vs keyword
      const keywordHit = keywords.some(
        (keyword) => keyword.includes(token) || token.includes(keyword),
      );
      if (keywordHit) {
        tokenScore += 22;
        continue;
      }

      // Token vs label
      if (label.includes(token) || token.includes(label)) {
        tokenScore += 20;
        continue;
      }

      // Token vs desc
      if (desc.includes(token)) {
        tokenScore += 10;
      }
    }

    // On ne fait remonter le score token que si au moins un token a matché
    if (tokenScore > 0) {
      score = Math.max(score, tokenScore);
    }
  }

  return score;
}

async function loadHistory(): Promise<ExtendedPublicationType[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((value): value is ExtendedPublicationType =>
      CREATE_OPTIONS.some((option) => option.id === value),
    );
  } catch {
    return [];
  }
}

async function persistHistory(
  history: ExtendedPublicationType[],
): Promise<void> {
  await AsyncStorage.setItem(
    HISTORY_STORAGE_KEY,
    JSON.stringify(history.slice(0, MAX_HISTORY)),
  );
}

async function addHistory(
  id: ExtendedPublicationType,
  current: ExtendedPublicationType[],
): Promise<ExtendedPublicationType[]> {
  const next = [id, ...current.filter((item) => item !== id)].slice(
    0,
    MAX_HISTORY,
  );
  try {
    await persistHistory(next);
  } catch {
    // L'historique est une préférence locale non critique.
  }
  return next;
}

/* ============================================================================
 * FADE UP — animation d'entrée
 * ========================================================================== */

function FadeUp({
  children,
  delay = 0,
  distance = 12,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: object;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: 420,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [distance, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}

/* ============================================================================
 * AMBIENT BACKDROP
 * ========================================================================== */

function AmbientBackdrop() {
  const orbA = useSharedValue(0);
  const orbB = useSharedValue(0);

  useEffect(() => {
    orbA.value = withRepeat(
      withSequence(
        withTiming(-36, { duration: 4500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    orbB.value = withRepeat(
      withSequence(
        withTiming(42, { duration: 5500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [orbA, orbB]);

  const orbAStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: orbA.value }],
  }));

  const orbBStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: orbB.value }],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[styles.ambientOrb, styles.ambientOrbA, orbAStyle]}
      />
      <Animated.View
        style={[styles.ambientOrb, styles.ambientOrbB, orbBStyle]}
      />
    </View>
  );
}

/* ============================================================================
 * SEARCH BAR — avec chips d'exemples
 * ========================================================================== */

function CreateSearchBar({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<TextInput | null>;
}) {
  const [focused, setFocused] = useState(false);

  const showChips = focused && value.trim().length === 0;

  return (
    <View style={styles.searchSection}>
      <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
        <Search size={18} color="rgba(255,255,255,0.45)" />

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder="Rechercher un module ou une action…"
          placeholderTextColor="rgba(255,255,255,0.30)"
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="sentences"
          returnKeyType="search"
          accessibilityLabel="Rechercher une action de création"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {value.length > 0 ? (
          <Pressable
            onPress={() => onChange("")}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Effacer la recherche"
            style={({ pressed }) => [
              styles.searchClear,
              pressed && styles.pressed,
            ]}
          >
            <X size={13} color="rgba(255,255,255,0.7)" />
          </Pressable>
        ) : null}
      </View>

      {showChips ? (
        <FadeUp delay={40}>
          <View style={styles.searchHintsWrap}>
            <Text style={styles.searchHintsLabel}>Suggestions rapides</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.searchHintsRow}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {SEARCH_EXAMPLE_CHIPS.map((chip) => (
                <Pressable
                  key={chip.prompt}
                  onPress={() => onChange(chip.prompt)}
                  accessibilityRole="button"
                  accessibilityLabel={`Rechercher ${chip.prompt}`}
                  style={({ pressed }) => [
                    styles.searchHintChip,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.searchHintChipEmoji}>{chip.emoji}</Text>
                  <Text style={styles.searchHintChipText}>{chip.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </FadeUp>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * HERO
 * ========================================================================== */

function CreateHero({ onAssistant }: { onAssistant: () => void }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const wandStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          pulse.value,
          [0, 1],
          [0, -4],
          Extrapolation.CLAMP,
        ),
      },
      {
        rotate: `${interpolate(pulse.value, [0, 1], [0, 2], Extrapolation.CLAMP)}deg`,
      },
    ],
  }));

  return (
    <FadeUp distance={14}>
      <View style={styles.heroCard}>
        <LinearGradient
          colors={[
            "rgba(139,92,246,0.24)",
            "rgba(76,29,149,0.08)",
            "rgba(15,7,32,0.94)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.heroBorder} pointerEvents="none" />
        <View style={styles.heroOrb1} pointerEvents="none" />
        <View style={styles.heroOrb2} pointerEvents="none" />

        <View style={styles.heroContent}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroTextWrap}>
              <View style={styles.heroBadge}>
                <Sparkles size={12} color="#C4B5FD" />
                <Text style={styles.heroBadgeText}>CREATE HUB</Text>
              </View>

              <Text style={styles.heroTitle}>Donnez vie à vos idées.</Text>

              <Text style={styles.heroSub}>
                Publiez, vendez, proposez un service, trouvez une opportunité ou
                partagez avec votre communauté.
              </Text>
            </View>

            <Animated.View style={wandStyle}>
              <LinearGradient
                colors={["#A78BFA", "#7C3AED", "#6366F1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroWand}
              >
                <Sparkles size={24} color="#fff" />
              </LinearGradient>
            </Animated.View>
          </View>

          <Pressable
            onPress={onAssistant}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir l'assistant de création"
            style={({ pressed }) => [
              styles.heroAIButton,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.heroAIIcon}>
              <Compass size={17} color="#C4B5FD" />
            </View>

            <View style={styles.heroAIText}>
              <Text style={styles.heroAITitle}>
                Je ne sais pas quoi choisir
              </Text>
              <Text style={styles.heroAISub}>
                Décrivez simplement votre objectif.
              </Text>
            </View>

            <ArrowRight size={17} color="rgba(255,255,255,0.55)" />
          </Pressable>
        </View>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * FEATURED SECTION
 * ========================================================================== */

function CreateFeaturedSection({
  onSelect,
}: {
  onSelect: (id: ExtendedPublicationType) => void;
}) {
  if (!FEATURED_FLAGSHIP && FEATURED_COMPACT.length === 0) {
    return null;
  }

  return (
    <View style={styles.featuredSectionBlock}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <Sparkles size={13} color="#C4B5FD" />
          <Text style={styles.sectionEyebrow}>À DÉCOUVRIR</Text>
        </View>
        <Text style={styles.sectionEyebrowDim}>Sélection</Text>
      </View>

      {FEATURED_FLAGSHIP ? (
        <CreateFeaturedFlagship
          option={FEATURED_FLAGSHIP}
          onSelect={onSelect}
        />
      ) : null}

      {FEATURED_COMPACT.length > 0 ? (
        <View style={styles.featuredPrimaryWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={MODULE_CARD_WIDTH + 10}
            snapToAlignment="start"
            contentContainerStyle={styles.moduleRowH}
            nestedScrollEnabled
          >
            {FEATURED_COMPACT.map((option, index) => (
              <FadeUp
                key={option.id}
                delay={180 + index * 25}
                style={styles.moduleCardWrap}
              >
                <CreateFeaturedMiniCard
                  option={option}
                  onPress={() => onSelect(option.id)}
                />
              </FadeUp>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function CreateFeaturedFlagship({
  option,
  onSelect,
}: {
  option: CreateOption;
  onSelect: (id: ExtendedPublicationType) => void;
}) {
  const Icon = option.icon;
  const featured = option.featured;
  const ctaLabel = featured?.ctaLabel ?? "Créer";
  const tagline = featured?.tagline ?? option.desc;

  return (
    <FadeUp delay={110}>
      <Pressable
        onPress={() => onSelect(option.id)}
        accessibilityRole="button"
        accessibilityLabel={`${ctaLabel} ${option.label}, module mis en avant`}
        style={({ pressed }) => [
          styles.flagshipCard,
          { borderColor: `${option.color}66` },
          pressed && styles.pressed,
        ]}
      >
        <LinearGradient
          colors={[
            `${option.color}40`,
            `${option.color}10`,
            "rgba(15,7,32,0.96)",
          ]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View
          pointerEvents="none"
          style={[
            styles.flagshipOrb,
            {
              backgroundColor: `${option.color}30`,
              top: -70,
              right: -70,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.flagshipOrbSmall,
            {
              backgroundColor: `${option.color}1F`,
              bottom: -40,
              left: -40,
            },
          ]}
        />

        <View style={styles.flagshipBody}>
          <View style={styles.flagshipHeaderRow}>
            <View
              style={[
                styles.flagshipIconWrap,
                {
                  backgroundColor: `${option.color}2E`,
                  borderColor: `${option.color}66`,
                },
              ]}
            >
              <Icon size={26} color={option.color} strokeWidth={2.2} />
            </View>

            <View style={styles.flagshipTag}>
              <Sparkles size={10} color="#C4B5FD" />
              <Text style={styles.flagshipTagText}>MIS EN AVANT</Text>
            </View>
          </View>

          <Text style={styles.flagshipTitle}>{option.label}</Text>

          <Text style={styles.flagshipTagline}>{tagline}</Text>

          <View style={styles.flagshipCta}>
            <Text style={[styles.flagshipCtaText, { color: option.color }]}>
              {ctaLabel}
            </Text>
            <ArrowRight size={15} color={option.color} />
          </View>
        </View>
      </Pressable>
    </FadeUp>
  );
}

function CreateFeaturedMiniCard({
  option,
  onPress,
}: {
  option: CreateOption;
  onPress: () => void;
}) {
  const Icon = option.icon;
  const featured = option.featured;
  const ctaLabel = featured?.ctaLabel ?? "Créer";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${ctaLabel} ${option.label}, module mis en avant`}
      style={({ pressed }) => [
        styles.featuredMiniCard,
        { borderColor: `${option.color}55` },
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={[`${option.color}1F`, "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.featuredMiniTopRow}>
        <View
          style={[
            styles.featuredMiniIcon,
            {
              backgroundColor: `${option.color}24`,
              borderColor: `${option.color}55`,
            },
          ]}
        >
          <Icon size={18} color={option.color} />
        </View>

        <View
          style={[
            styles.featuredStarBadge,
            {
              backgroundColor: `${option.color}24`,
              borderColor: `${option.color}55`,
            },
          ]}
        >
          <Text style={[styles.featuredStarText, { color: option.color }]}>
            ★
          </Text>
        </View>
      </View>

      <Text style={styles.featuredMiniTitle} numberOfLines={1}>
        {option.label}
      </Text>
      <Text style={styles.featuredMiniSub} numberOfLines={2}>
        {option.desc}
      </Text>

      <View style={styles.featuredMiniCta}>
        <Text style={[styles.featuredMiniCtaText, { color: option.color }]}>
          {ctaLabel}
        </Text>
        <ArrowRight size={12} color={option.color} />
      </View>
    </Pressable>
  );
}

/* ============================================================================
 * SEARCH RESULTS — meilleur résultat + autres suggestions
 * ========================================================================== */

function SearchResults({
  query,
  matches,
  onSelect,
  onClear,
}: {
  query: string;
  matches: CreateOption[];
  onSelect: (id: ExtendedPublicationType) => void;
  onClear: () => void;
}) {
  const topResult = matches[0] ?? null;
  const otherResults = matches.slice(1);

  if (!topResult) {
    return (
      <FadeUp>
        <View style={styles.noResultCard}>
          <View style={styles.noResultIcon}>
            <Search size={18} color="rgba(255,255,255,0.4)" />
          </View>

          <Text style={styles.noResultTitle}>
            Aucun module pour « {query} »
          </Text>

          <Text style={styles.noResultSub}>
            Essayez avec un verbe d'action : dormir, manger, vendre, travailler…
          </Text>

          <Pressable
            onPress={onClear}
            style={({ pressed }) => [
              styles.noResultBtn,
              pressed && styles.pressed,
            ]}
          >
            <X size={13} color="#fff" />
            <Text style={styles.noResultBtnText}>Effacer la recherche</Text>
          </Pressable>
        </View>
      </FadeUp>
    );
  }

  const TopIcon = topResult.icon;

  return (
    <View>
      {/* Meilleur résultat */}
      <FadeUp delay={40}>
        <View style={styles.searchTopSection}>
          <View style={styles.searchTopHeader}>
            <Sparkles size={12} color="#6EE7B7" />
            <Text style={styles.searchTopLabel}>MEILLEUR RÉSULTAT</Text>
          </View>

          <Pressable
            onPress={() => onSelect(topResult.id)}
            accessibilityRole="button"
            accessibilityLabel={`Ouvrir ${topResult.label}`}
            style={({ pressed }) => [
              styles.searchTopCard,
              { borderColor: `${topResult.color}66` },
              pressed && styles.pressed,
            ]}
          >
            <LinearGradient
              colors={[
                `${topResult.color}33`,
                `${topResult.color}0D`,
                "rgba(15,7,32,0.96)",
              ]}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View
              pointerEvents="none"
              style={[
                styles.searchTopOrb,
                {
                  backgroundColor: `${topResult.color}30`,
                  top: -50,
                  right: -50,
                },
              ]}
            />

            <View style={styles.searchTopBody}>
              <View
                style={[
                  styles.searchTopIconWrap,
                  {
                    backgroundColor: `${topResult.color}2E`,
                    borderColor: `${topResult.color}66`,
                  },
                ]}
              >
                <TopIcon size={24} color={topResult.color} strokeWidth={2.2} />
              </View>

              <View style={styles.searchTopText}>
                <Text style={styles.searchTopTitle}>{topResult.label}</Text>
                <Text style={styles.searchTopDesc} numberOfLines={2}>
                  {topResult.desc}
                </Text>
              </View>

              <View
                style={[
                  styles.searchTopArrow,
                  { backgroundColor: `${topResult.color}22` },
                ]}
              >
                <ArrowRight size={14} color={topResult.color} />
              </View>
            </View>
          </Pressable>
        </View>
      </FadeUp>

      {/* Autres suggestions */}
      {otherResults.length > 0 ? (
        <View>
          <View style={styles.searchOtherHeader}>
            <Compass size={12} color="rgba(255,255,255,0.5)" />
            <Text style={styles.searchOtherLabel}>
              AUTRES SUGGESTIONS ({otherResults.length})
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={MODULE_CARD_WIDTH + 10}
            snapToAlignment="start"
            contentContainerStyle={styles.moduleRowH}
            nestedScrollEnabled
          >
            {otherResults.map((option, index) => (
              <FadeUp
                key={option.id}
                delay={100 + index * 25}
                style={styles.moduleCardWrap}
              >
                <CreateGridCard
                  option={option}
                  onPress={() => onSelect(option.id)}
                />
              </FadeUp>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * QUICK ACTIONS
 * ========================================================================== */

function CreateQuickActions({
  history,
  onSelect,
}: {
  history: ExtendedPublicationType[];
  onSelect: (id: ExtendedPublicationType) => void;
}) {
  const historyOptions = history
    .map((id) => CREATE_OPTIONS.find((option) => option.id === id))
    .filter((option): option is CreateOption => Boolean(option));

  const fallbackOptions = QUICK_CREATE_IDS.map((id) =>
    CREATE_OPTIONS.find((option) => option.id === id),
  ).filter((option): option is CreateOption => Boolean(option));

  const options = [...historyOptions, ...fallbackOptions]
    .filter(
      (option, index, array) =>
        array.findIndex((item) => item.id === option.id) === index,
    )
    .slice(0, 6);

  return (
    <FadeUp delay={220}>
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <TrendingUp size={13} color="#6EE7B7" />
            <Text style={styles.sectionEyebrow}>
              {historyOptions.length ? "VOS RACCOURCIS" : "CRÉATION RAPIDE"}
            </Text>
          </View>
          <Text style={styles.sectionEyebrowDim}>1 tap</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={QUICK_CARD_WIDTH + 10}
          snapToAlignment="start"
          contentContainerStyle={styles.quickListH}
          nestedScrollEnabled
        >
          {options.map((option, index) => (
            <FadeUp
              key={option.id}
              delay={240 + index * 40}
              style={styles.quickCardWrap}
            >
              <CreateQuickCard
                option={option}
                onPress={() => onSelect(option.id)}
              />
            </FadeUp>
          ))}
        </ScrollView>
      </View>
    </FadeUp>
  );
}

function CreateQuickCard({
  option,
  onPress,
}: {
  option: CreateOption;
  onPress: () => void;
}) {
  const Icon = option.icon;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Créer : ${option.label}`}
      style={({ pressed }) => [
        styles.quickCardH,
        { borderColor: `${option.color}3A` },
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={[`${option.color}26`, "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.quickCardIconH,
          {
            backgroundColor: `${option.color}24`,
            borderColor: `${option.color}55`,
          },
        ]}
      >
        <Icon size={20} color={option.color} />
      </View>

      <Text style={styles.quickCardTitleH} numberOfLines={1}>
        {option.label}
      </Text>
      <Text style={styles.quickCardSubH} numberOfLines={2}>
        {option.desc}
      </Text>

      <View
        style={[
          styles.quickCardArrowH,
          { backgroundColor: `${option.color}22` },
        ]}
      >
        <ArrowRight size={12} color={option.color} />
      </View>
    </Pressable>
  );
}

/* ============================================================================
 * RECENT
 * ========================================================================== */

function CreateRecent({
  history,
  onSelect,
}: {
  history: ExtendedPublicationType[];
  onSelect: (id: ExtendedPublicationType) => void;
}) {
  if (history.length === 0) return null;

  return (
    <FadeUp delay={280}>
      <View style={styles.sectionBlockSmall}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Activity size={12} color="rgba(255,255,255,0.5)" />
            <Text style={styles.sectionEyebrow}>DERNIÈRES CRÉATIONS</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          contentContainerStyle={styles.recentRowH}
          nestedScrollEnabled
        >
          {history.map((id) => {
            const option = CREATE_OPTIONS.find((item) => item.id === id);
            if (!option) return null;
            const Icon = option.icon;

            return (
              <Pressable
                key={id}
                onPress={() => onSelect(id)}
                accessibilityRole="button"
                accessibilityLabel={`Reprendre ${option.label}`}
                style={({ pressed }) => [
                  styles.recentChipH,
                  {
                    backgroundColor: `${option.color}18`,
                    borderColor: `${option.color}3D`,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Icon size={13} color={option.color} />
                <Text style={[styles.recentChipTextH, { color: option.color }]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * EXPLORER PAR UNIVERS — grille 2 colonnes cliquable
 * ========================================================================== */

function CreateHubExplorer({
  selectedGroup,
  onSelectGroup,
  onShowAll,
}: {
  selectedGroup: string | null;
  onSelectGroup: (label: string | null) => void;
  onShowAll: () => void;
}) {
  return (
    <FadeUp delay={300}>
      <View style={styles.explorerBlock}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Compass size={13} color="#67E8F9" />
            <Text style={styles.sectionEyebrow}>EXPLORER PAR UNIVERS</Text>
          </View>
          <Text style={styles.sectionEyebrowDim}>
            Choisissez votre point de départ
          </Text>
        </View>

        <View style={styles.explorerGrid}>
          <Pressable
            onPress={() => onSelectGroup(null)}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedGroup === null }}
            accessibilityLabel="Recommandations pour vous"
            style={({ pressed }) => [
              styles.explorerTile,
              selectedGroup === null && {
                borderColor: "rgba(196,181,253,0.55)",
                backgroundColor: "rgba(167,139,250,0.14)",
              },
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.explorerTileIconWrap,
                selectedGroup === null && {
                  backgroundColor: "rgba(167,139,250,0.30)",
                  borderColor: "rgba(196,181,253,0.55)",
                },
              ]}
            >
              <Sparkles
                size={18}
                color={
                  selectedGroup === null ? "#E9D5FF" : "rgba(255,255,255,0.72)"
                }
              />
            </View>

            <View style={styles.explorerTileBody}>
              <Text
                style={[
                  styles.explorerTileTitle,
                  selectedGroup === null && { color: "#fff" },
                ]}
                numberOfLines={1}
              >
                Pour vous
              </Text>
              <Text style={styles.explorerTileMeta} numberOfLines={1}>
                Recommandations
              </Text>
            </View>

            <ChevronRight
              size={14}
              color={
                selectedGroup === null ? "#C4B5FD" : "rgba(255,255,255,0.35)"
              }
            />
          </Pressable>

          {CREATE_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            const active = selectedGroup === group.label;
            const count = group.ids.length;

            return (
              <Pressable
                key={group.label}
                onPress={() => onSelectGroup(group.label)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Explorer ${group.label}, ${count} module${count > 1 ? "s" : ""}`}
                style={({ pressed }) => [
                  styles.explorerTile,
                  active && {
                    borderColor: `${group.color}80`,
                    backgroundColor: `${group.color}1A`,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.explorerTileIconWrap,
                    active && {
                      backgroundColor: `${group.color}30`,
                      borderColor: `${group.color}66`,
                    },
                  ]}
                >
                  <GroupIcon
                    size={18}
                    color={active ? group.color : "rgba(255,255,255,0.72)"}
                  />
                </View>

                <View style={styles.explorerTileBody}>
                  <Text
                    style={[
                      styles.explorerTileTitle,
                      active && { color: "#fff" },
                    ]}
                    numberOfLines={1}
                  >
                    {group.label}
                  </Text>
                  <Text
                    style={[
                      styles.explorerTileMeta,
                      active && { color: `${group.color}` },
                    ]}
                    numberOfLines={1}
                  >
                    {count} module{count > 1 ? "s" : ""}
                  </Text>
                </View>

                <ChevronRight
                  size={14}
                  color={active ? group.color : "rgba(255,255,255,0.35)"}
                />
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={onShowAll}
          accessibilityRole="button"
          accessibilityLabel="Afficher tous les modules"
          style={({ pressed }) => [
            styles.explorerShowAll,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.explorerShowAllIcon}>
            <Sparkles size={14} color="#67E8F9" />
          </View>
          <Text style={styles.explorerShowAllText}>Tous les modules</Text>
          <ArrowRight size={14} color="#A5F3FC" />
        </Pressable>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * GROUPED GRID
 * ========================================================================== */

function CreateGroupedGrid({
  options,
  onSelect,
}: {
  options: CreateOption[];
  onSelect: (id: ExtendedPublicationType) => void;
}) {
  return (
    <View>
      {CREATE_GROUPS.map((group, groupIndex) => {
        const items = options.filter((option) => group.ids.includes(option.id));
        if (items.length === 0) return null;
        const GroupIcon = group.icon;

        return (
          <FadeUp key={group.label} delay={groupIndex * 45}>
            <View style={styles.groupBlock}>
              <View style={styles.groupHeaderRow}>
                <View style={styles.groupIconWrap}>
                  <GroupIcon size={13} color="rgba(255,255,255,0.65)" />
                </View>
                <View>
                  <Text style={styles.groupTitle}>{group.label}</Text>
                  <Text style={styles.groupCount}>
                    {items.length} option{items.length > 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={MODULE_CARD_WIDTH + 10}
                snapToAlignment="start"
                contentContainerStyle={styles.moduleRowH}
                nestedScrollEnabled
              >
                {items.map((option, index) => (
                  <FadeUp
                    key={option.id}
                    delay={groupIndex * 45 + index * 25}
                    style={styles.moduleCardWrap}
                  >
                    <CreateGridCard
                      option={option}
                      onPress={() => onSelect(option.id)}
                    />
                  </FadeUp>
                ))}
              </ScrollView>
            </View>
          </FadeUp>
        );
      })}
    </View>
  );
}

function CreateGridCard({
  option,
  onPress,
}: {
  option: CreateOption;
  onPress: () => void;
}) {
  const Icon = option.icon;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Créer ${option.label}`}
      style={({ pressed }) => [
        styles.gridCard,
        { borderColor: `${option.color}33` },
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={[`${option.color}14`, "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.gridCardTopRow}>
        <View
          style={[
            styles.gridCardIcon,
            {
              backgroundColor: `${option.color}22`,
              borderColor: `${option.color}55`,
            },
          ]}
        >
          <Icon size={19} color={option.color} />
        </View>
        <ArrowRight size={14} color="rgba(255,255,255,0.3)" />
      </View>

      <Text style={styles.gridCardTitle} numberOfLines={1}>
        {option.label}
      </Text>
      <Text style={styles.gridCardSub} numberOfLines={2}>
        {option.desc}
      </Text>
    </Pressable>
  );
}

/* ============================================================================
 * INPUTS
 * ========================================================================== */

function FieldInput({
  icon: Icon,
  color,
  placeholder,
  value,
  onChange,
  keyboardType,
}: {
  icon: LucideIcon;
  color: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.fieldShell,
        focused && {
          borderColor: `${color}66`,
          backgroundColor: `${color}0D`,
        },
      ]}
    >
      <Icon size={14} color={color} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.3)"
        style={styles.fieldInput}
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function FieldTextarea({
  icon: Icon,
  color,
  placeholder,
  value,
  onChange,
}: {
  icon: LucideIcon;
  color: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.fieldShell,
        styles.fieldShellTextarea,
        focused && {
          borderColor: `${color}66`,
          backgroundColor: `${color}0D`,
        },
      ]}
    >
      <View style={styles.textareaIcon}>
        <Icon size={14} color={color} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.3)"
        style={[styles.fieldInput, styles.textareaInput]}
        multiline
        textAlignVertical="top"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function CategoryPills({
  categories,
  active,
  color,
  onChange,
}: {
  categories: string[];
  active: string;
  color: string;
  onChange: (category: string) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <View style={styles.catsRow}>
      {categories.map((category) => {
        const selected = active === category;
        return (
          <Pressable
            key={category}
            onPress={() => onChange(category)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.catPill,
              selected && {
                backgroundColor: `${color}28`,
                borderColor: `${color}66`,
              },
              pressed && styles.pressed,
            ]}
          >
            {selected ? (
              <Check size={11} color={color} strokeWidth={3} />
            ) : null}
            <Text style={[styles.catPillText, selected && { color }]}>
              {category}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TagsInput({
  value,
  onChange,
  placeholder,
  color,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  color: string;
}) {
  const [input, setInput] = useState("");

  const addTag = useCallback(() => {
    const normalized = input.trim();
    if (!normalized) return;

    const exists = value.some(
      (tag) => normalizeSearch(tag) === normalizeSearch(normalized),
    );
    if (exists) {
      setInput("");
      return;
    }

    onChange([...value, normalized]);
    setInput("");
  }, [input, onChange, value]);

  return (
    <View style={styles.tagsShell}>
      {value.length > 0 ? (
        <View style={styles.tagsList}>
          {value.map((tag) => (
            <View
              key={tag}
              style={[styles.tagChip, { backgroundColor: `${color}22` }]}
            >
              <Text style={[styles.tagChipText, { color }]}>{tag}</Text>
              <Pressable
                onPress={() => onChange(value.filter((item) => item !== tag))}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Supprimer ${tag}`}
              >
                <X size={12} color={color} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.tagInputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={addTag}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          style={styles.fieldInput}
          returnKeyType="done"
        />
        <Pressable
          onPress={addTag}
          disabled={!input.trim()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Ajouter"
          style={({ pressed }) => [
            styles.tagAdd,
            !input.trim() && styles.tagAddDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Plus size={16} color={color} />
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================================
 * FORM WRAPPER
 * ========================================================================== */

function FormWrapper({
  title,
  color,
  onBack,
  onClose,
  children,
}: {
  title: string;
  color: string;
  onBack: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <View>
      <View style={styles.formHeader}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={({ pressed }) => [styles.iconBtnSm, pressed && styles.pressed]}
        >
          <ArrowLeft size={15} color="rgba(255,255,255,0.85)" />
        </Pressable>

        <View
          style={[styles.formHeaderTitleWrap, { borderColor: `${color}55` }]}
        >
          <Text style={styles.formHeaderTitle}>{title}</Text>
        </View>

        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          style={({ pressed }) => [styles.iconBtnSm, pressed && styles.pressed]}
        >
          <X size={15} color="rgba(255,255,255,0.75)" />
        </Pressable>
      </View>

      {children}
    </View>
  );
}

/* ============================================================================
 * SUBMIT
 * ========================================================================== */

function SubmitBtn({
  color,
  label,
  onPress,
  disabled,
  loading,
}: {
  color: string;
  label: string;
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pressIn = () => {
    scale.value = withSpring(0.97, { damping: 18, stiffness: 280 });
  };

  const pressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 280 });
  };

  const unavailable = disabled || loading;

  return (
    <Animated.View
      style={[
        styles.submitOuter,
        animatedStyle,
        unavailable && styles.submitDisabled,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={unavailable}
        accessibilityRole="button"
        accessibilityState={{ disabled: unavailable, busy: loading }}
      >
        <LinearGradient
          colors={
            unavailable
              ? ["#1E1E2F", "#16162A"]
              : [color, `${color}CC`, `${color}AA`]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.submitGradient}
        >
          {loading ? <Activity size={17} color="#fff" /> : null}
          <Text style={styles.submitText}>
            {loading ? "Publication en cours…" : label}
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * JOB FORM
 * ========================================================================== */

function JobForm({
  onBack,
  onClose,
  color,
}: {
  onBack: () => void;
  onClose: () => void;
  color: string;
}) {
  const createJob = useMutation(api.employment.createJob);

  const [form, setForm] = useState<{
    title: string;
    company: string;
    description: string;
    city: string;
    salaryMin: string;
    salaryMax: string;
    currency: string;
    contractType: ContractType;
    remote: boolean;
    skills: string[];
    benefits: string[];
    deadline: string;
  }>({
    title: "",
    company: "",
    description: "",
    city: "",
    salaryMin: "",
    salaryMax: "",
    currency: "USD",
    contractType: "cdi",
    remote: false,
    skills: [],
    benefits: [],
    deadline: "",
  });

  const [loading, setLoading] = useState(false);

  const setField = useCallback(
    <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
      setForm((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const submit = useCallback(async () => {
    if (
      !form.title.trim() ||
      !form.company.trim() ||
      !form.description.trim() ||
      !form.city.trim()
    ) {
      Alert.alert(
        "Champs requis",
        "Veuillez remplir le titre, l'entreprise, la description et la ville.",
      );
      return;
    }

    const salaryMin = form.salaryMin.trim()
      ? Number(form.salaryMin)
      : undefined;
    const salaryMax = form.salaryMax.trim()
      ? Number(form.salaryMax)
      : undefined;

    if (salaryMin !== undefined && !Number.isFinite(salaryMin)) {
      Alert.alert(
        "Salaire invalide",
        "Le salaire minimum doit être un nombre valide.",
      );
      return;
    }

    if (salaryMax !== undefined && !Number.isFinite(salaryMax)) {
      Alert.alert(
        "Salaire invalide",
        "Le salaire maximum doit être un nombre valide.",
      );
      return;
    }

    if (
      salaryMin !== undefined &&
      salaryMax !== undefined &&
      salaryMin > salaryMax
    ) {
      Alert.alert(
        "Salaire invalide",
        "Le salaire minimum ne peut pas dépasser le maximum.",
      );
      return;
    }

    setLoading(true);

    try {
      await createJob({
        title: form.title.trim(),
        description: form.description.trim(),
        company: form.company.trim(),
        category: form.contractType,
        contractType: form.contractType,
        salaryMin,
        salaryMax,
        currency: form.currency,
        city: form.city.trim(),
        remote: form.remote,
        skills: form.skills,
        deadline: form.deadline.trim() || undefined,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert("Publication réussie", "L'offre d'emploi a été publiée.", [
        { text: "OK", onPress: onClose },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Une erreur est survenue.";
      Alert.alert("Publication impossible", message);
    } finally {
      setLoading(false);
    }
  }, [createJob, form, onClose]);

  const contractTypes: { label: string; value: ContractType }[] = [
    { label: "CDI", value: "cdi" },
    { label: "CDD", value: "cdd" },
    { label: "Stage", value: "stage" },
    { label: "Freelance", value: "freelance" },
    { label: "Alternance", value: "alternance" },
    { label: "Bénévole", value: "benevole" },
  ];

  return (
    <FormWrapper
      title="Offre d'emploi"
      color={color}
      onBack={onBack}
      onClose={onClose}
    >
      <FieldInput
        icon={Briefcase}
        color={color}
        placeholder="Intitulé du poste *"
        value={form.title}
        onChange={(value) => setField("title", value)}
      />

      <FieldInput
        icon={Users}
        color={color}
        placeholder="Nom de l'entreprise *"
        value={form.company}
        onChange={(value) => setField("company", value)}
      />

      <FieldTextarea
        icon={FileText}
        color={color}
        placeholder="Description du poste *"
        value={form.description}
        onChange={(value) => setField("description", value)}
      />

      <FieldInput
        icon={MapPin}
        color={color}
        placeholder="Ville *"
        value={form.city}
        onChange={(value) => setField("city", value)}
      />

      <View style={styles.formSectionLabel}>
        <Text style={styles.formSectionLabelText}>TYPE DE CONTRAT</Text>
      </View>

      <View style={styles.catsRow}>
        {contractTypes.map((item) => {
          const selected = form.contractType === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => setField("contractType", item.value)}
              style={({ pressed }) => [
                styles.catPill,
                selected && {
                  backgroundColor: `${color}28`,
                  borderColor: `${color}66`,
                },
                pressed && styles.pressed,
              ]}
            >
              {selected ? (
                <Check size={11} color={color} strokeWidth={3} />
              ) : null}
              <Text style={[styles.catPillText, selected && { color }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.formSectionLabel}>
        <Text style={styles.formSectionLabelText}>RÉMUNÉRATION</Text>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <FieldInput
            icon={Tag}
            color={color}
            placeholder="Salaire min"
            value={form.salaryMin}
            keyboardType="decimal-pad"
            onChange={(value) => setField("salaryMin", value)}
          />
        </View>
        <View style={styles.column}>
          <FieldInput
            icon={Tag}
            color={color}
            placeholder="Salaire max"
            value={form.salaryMax}
            keyboardType="decimal-pad"
            onChange={(value) => setField("salaryMax", value)}
          />
        </View>
      </View>

      <View style={styles.currencyRow}>
        {["USD", "EUR", "CDF", "CFA"].map((currency) => {
          const selected = form.currency === currency;
          return (
            <Pressable
              key={currency}
              onPress={() => setField("currency", currency)}
              style={[
                styles.currencyPill,
                selected && {
                  backgroundColor: `${color}28`,
                  borderColor: `${color}66`,
                },
              ]}
            >
              <Text style={[styles.currencyPillText, selected && { color }]}>
                {currency}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => setField("remote", !form.remote)}
        style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}
      >
        <View
          style={[
            styles.checkBox,
            form.remote && { backgroundColor: color, borderColor: color },
          ]}
        >
          {form.remote ? (
            <Check size={12} color="#fff" strokeWidth={3} />
          ) : null}
        </View>
        <Text style={styles.checkLabel}>Télétravail possible</Text>
      </Pressable>

      <TagsInput
        value={form.skills}
        onChange={(value) => setField("skills", value)}
        placeholder="Compétences : React, Node.js…"
        color={color}
      />

      <FieldInput
        icon={Calendar}
        color={color}
        placeholder="Date limite (AAAA-MM-JJ)"
        value={form.deadline}
        onChange={(value) => setField("deadline", value)}
      />

      <SubmitBtn
        color={color}
        label="Publier l'offre"
        onPress={submit}
        disabled={
          !form.title.trim() ||
          !form.company.trim() ||
          !form.description.trim() ||
          !form.city.trim()
        }
        loading={loading}
      />
    </FormWrapper>
  );
}

/* ============================================================================
 * GENERIC PUBLICATION FORM
 * ========================================================================== */

function GenericForm({
  type,
  color,
  categories,
  titlePlaceholder,
  descriptionPlaceholder,
  pricePlaceholder,
  submitLabel,
  onBack,
  onClose,
  createPublication,
}: {
  type: GenericPublicationType;
  color: string;
  categories: string[];
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  pricePlaceholder: string;
  submitLabel: string;
  onBack: () => void;
  onClose: () => void;
  createPublication: CreatePublicationFn;
}) {
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    price: "",
    location: "",
    category: "",
    contact: "",
    condition: "",
  });

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const submit = useCallback(async () => {
    if (!form.title.trim() || !form.description.trim()) {
      Alert.alert(
        "Champs requis",
        "Le titre et la description sont obligatoires.",
      );
      return;
    }

    const metadata: Record<string, string> = {};

    if (type === "annonce" && form.condition) {
      metadata.condition = form.condition;
    }

    if (form.contact.trim()) {
      metadata.contact = form.contact.trim();
    }

    setLoading(true);

    try {
      await createPublication({
        type,
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price.trim() || undefined,
        location: form.location.trim() || undefined,
        category: form.category.trim() || undefined,
        images,
        tags: form.category ? [normalizeSearch(form.category)] : [],
        meta:
          Object.keys(metadata).length > 0
            ? JSON.stringify(metadata)
            : undefined,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert("Publication réussie", "Votre publication a été créée.", [
        { text: "OK", onPress: onClose },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Une erreur est survenue.";
      Alert.alert("Publication impossible", message);
    } finally {
      setLoading(false);
    }
  }, [createPublication, form, images, onClose, type]);

  return (
    <FormWrapper
      title={getOption(type).label}
      color={color}
      onBack={onBack}
      onClose={onClose}
    >
      <CategoryPills
        categories={categories}
        active={form.category}
        color={color}
        onChange={(value) => set("category", value)}
      />

      <FieldInput
        icon={Tag}
        color={color}
        placeholder={titlePlaceholder}
        value={form.title}
        onChange={(value) => set("title", value)}
      />

      <FieldTextarea
        icon={FileText}
        color={color}
        placeholder={descriptionPlaceholder}
        value={form.description}
        onChange={(value) => set("description", value)}
      />

      <AIWriteAssist
        contentType={AI_CONTENT_TYPE_MAP[type]}
        topic={form.title}
        description={form.description}
        category={form.category || undefined}
        color={color}
        onGenerated={(text) => set("description", text)}
        onTagsSuggested={() => undefined}
      />

      <ImageUploader images={images} onChange={setImages} color={color} />

      <FieldInput
        icon={Tag}
        color={color}
        placeholder={pricePlaceholder}
        value={form.price}
        onChange={(value) => set("price", value)}
      />

      <FieldInput
        icon={MapPin}
        color={color}
        placeholder="Localisation (ville, quartier)"
        value={form.location}
        onChange={(value) => set("location", value)}
      />

      {type === "annonce" ? (
        <View style={styles.conditionWrap}>
          {[
            { value: "", label: "État" },
            { value: "neuf", label: "Neuf" },
            { value: "comme-neuf", label: "Comme neuf" },
            { value: "tres-bon", label: "Très bon" },
            { value: "bon", label: "Bon" },
            { value: "acceptable", label: "Acceptable" },
          ].map((item) => {
            const selected = form.condition === item.value;
            return (
              <Pressable
                key={item.value || "empty"}
                onPress={() => set("condition", item.value)}
                style={[
                  styles.currencyPill,
                  selected && {
                    backgroundColor: `${color}28`,
                    borderColor: `${color}66`,
                  },
                ]}
              >
                <Text style={[styles.currencyPillText, selected && { color }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <FieldInput
        icon={Phone}
        color={color}
        placeholder="Contact (téléphone / email)"
        value={form.contact}
        onChange={(value) => set("contact", value)}
      />

      <SubmitBtn
        color={color}
        label={submitLabel}
        onPress={submit}
        disabled={!form.title.trim() || !form.description.trim()}
        loading={loading}
      />
    </FormWrapper>
  );
}

/* ============================================================================
 * AI ROUTER
 * ========================================================================== */

function CreationAssistant({
  query,
  setQuery,
  onBack,
  onSelect,
}: {
  query: string;
  setQuery: (value: string) => void;
  onBack: () => void;
  onSelect: (id: ExtendedPublicationType) => void;
}) {
  const ranked = useMemo(() => {
    const q = query.trim();
    if (!q) return [];

    return CREATE_OPTIONS.map((option) => ({
      option,
      score: rankOption(option, q),
    }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [query]);

  return (
    <View style={styles.aiWrap}>
      <Pressable
        onPress={onBack}
        hitSlop={8}
        style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}
      >
        <ArrowLeft size={15} color="rgba(255,255,255,0.75)" />
        <Text style={styles.backRowText}>Retour à Créer</Text>
      </Pressable>

      <FadeUp>
        <View style={styles.aiCard}>
          <LinearGradient
            colors={[
              "rgba(139,92,246,0.20)",
              "rgba(99,102,241,0.06)",
              "rgba(15,7,32,0.9)",
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.aiBorder} pointerEvents="none" />

          <View style={styles.aiIconBig}>
            <Sparkles size={25} color="#fff" />
          </View>

          <Text style={styles.aiTitle}>
            Dites-moi ce que vous voulez faire.
          </Text>

          <Text style={styles.aiSub}>
            Pas besoin de connaître le bon module. Décrivez simplement votre
            objectif.
          </Text>

          <View style={styles.aiInputWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={
                "Ex. Je veux vendre ma maison\nEx. Je cherche un emploi\nEx. Je veux proposer mon service"
              }
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={styles.aiInput}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </View>

          {ranked.length > 0 ? (
            <View style={styles.aiSuggestions}>
              <Text style={styles.aiSuggestionsTitle}>ESPACES SUGGÉRÉS</Text>

              {ranked.map(({ option }) => (
                <Pressable
                  key={option.id}
                  onPress={() => onSelect(option.id)}
                  style={({ pressed }) => [
                    styles.aiSuggestion,
                    { borderColor: `${option.color}35` },
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.aiSuggestionIcon,
                      { backgroundColor: `${option.color}22` },
                    ]}
                  >
                    <option.icon size={16} color={option.color} />
                  </View>

                  <View style={styles.aiSuggestionText}>
                    <Text style={styles.aiSuggestionTitle}>{option.label}</Text>
                    <Text style={styles.aiSuggestionSub}>{option.desc}</Text>
                  </View>

                  <ArrowRight size={15} color="rgba(255,255,255,0.4)" />
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.aiHint}>
              L'assistant utilise les intentions reconnues dans les espaces
              disponibles.
            </Text>
          )}
        </View>
      </FadeUp>
    </View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function CreateBottomSheet({
  isOpen,
  onClose,
  onNavigate,
}: CreateBottomSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const { isAuthenticated } = useFirebaseAuth();

  const createPublicationMutation = useMutation(
    api.publications.createPublication,
  );

  const createPublication: CreatePublicationFn = createPublicationMutation;

  const [activeType, setActiveType] = useState<ExtendedPublicationType | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<ExtendedPublicationType[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [assistantMode, setAssistantMode] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const sheetProgress = useSharedValue(0);
  const backdropProgress = useSharedValue(0);
  const lifecycleToken = useSharedValue(0);

  const searchRef = useRef<TextInput | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    lifecycleToken.value += 1;

    setActiveType(null);
    setSearchQuery("");
    setAssistantMode(false);
    setSelectedGroup(null);
    setHistoryLoaded(false);

    void loadHistory().then((loaded) => {
      if (cancelled) return;
      setHistory(loaded);
      setHistoryLoaded(true);
    });

    scrollRef.current?.scrollTo({ y: 0, animated: false });

    sheetProgress.value = withSpring(1, {
      damping: 24,
      stiffness: 240,
      mass: 0.9,
    });

    backdropProgress.value = withTiming(1, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });

    return () => {
      cancelled = true;
    };
  }, [backdropProgress, isOpen, lifecycleToken, sheetProgress]);

  const close = useCallback(() => {
    Keyboard.dismiss();

    const closeToken = lifecycleToken.value + 1;
    lifecycleToken.value = closeToken;

    sheetProgress.value = withTiming(
      0,
      { duration: 240, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished && lifecycleToken.value === closeToken) {
          runOnJS(onClose)();
        }
      },
    );

    backdropProgress.value = withTiming(0, {
      duration: 220,
      easing: Easing.in(Easing.cubic),
    });
  }, [backdropProgress, lifecycleToken, onClose, sheetProgress]);

  const selectType = useCallback(
    async (id: ExtendedPublicationType) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Cas particulier : Live n'ouvre pas de formulaire dans le sheet.
      // On ferme le sheet et on délègue la navigation à HomePage
      // (LiveStreamingPage possède déjà son propre GoLiveForm).
      if (id === "live") {
        onClose();
        onNavigate?.("live-streaming");
        return;
      }

      const nextHistory = await addHistory(id, history);

      setHistory(nextHistory);
      setAssistantMode(false);
      setSearchQuery("");
      setActiveType(id);
    },
    [history, onClose, onNavigate],
  );

  const backToHub = useCallback(() => {
    Keyboard.dismiss();
    setActiveType(null);
    setAssistantMode(false);
    setSearchQuery("");
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (activeType !== null || assistantMode) {
          backToHub();
          return true;
        }

        close();
        return true;
      },
    );

    return () => subscription.remove();
  }, [activeType, assistantMode, backToHub, close, isOpen]);

  /* ---- Résultats de recherche classés par score décroissant ---- */
  const searchMatches = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return [];

    return CREATE_OPTIONS.map((option) => ({
      option,
      score: rankOption(option, query),
    }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.option);
  }, [searchQuery]);

  const activeOption = activeType
    ? (CREATE_OPTIONS.find((option) => option.id === activeType) ?? null)
    : null;

  const formConfig: Record<
    GenericPublicationType,
    {
      categories: string[];
      titlePlaceholder: string;
      descriptionPlaceholder: string;
      pricePlaceholder: string;
      submitLabel: string;
    }
  > = {
    energie: {
      categories: ENERGIE_CATS,
      titlePlaceholder: "Produit / service énergie",
      descriptionPlaceholder: "Caractéristiques, puissance…",
      pricePlaceholder: "Prix ou devis",
      submitLabel: "Publier l'offre énergie",
    },
    ong: {
      categories: ONG_CATS,
      titlePlaceholder: "Nom de la campagne",
      descriptionPlaceholder: "Objectif, bénéficiaires…",
      pricePlaceholder: "Objectif collecte",
      submitLabel: "Lancer la campagne",
    },
    video: {
      categories: VIDEO_CATS,
      titlePlaceholder: "Titre de la vidéo",
      descriptionPlaceholder: "Décrivez votre vidéo…",
      pricePlaceholder: "Lien vidéo",
      submitLabel: "Publier la vidéo",
    },
    sondage: {
      categories: SONDAGE_CATS,
      titlePlaceholder: "Question du sondage",
      descriptionPlaceholder: "Options (une par ligne)",
      pricePlaceholder: "Durée",
      submitLabel: "Lancer le sondage",
    },
  };

  const renderActiveForm = () => {
    if (!activeType) return null;

    const option = getOption(activeType);
    const color = option.color;

    if (activeType === "video") {
      return <CreateReelSheet visible onClose={close} />;
    }

    if (activeType === "job") {
      return <JobForm onBack={backToHub} onClose={close} color={color} />;
    }

    if (activeType === "article") {
      return <ArticleForm onBack={backToHub} onClose={close} />;
    }

    if (activeType === "immo") {
      return <CreatePropertySheet onClose={close} onSuccess={close} />;
    }

    if (activeType === "annonce") {
      return <CreateAnnonceSheet isOpen onClose={close} onSuccess={close} />;
    }

    if (activeType === "service") {
      return <CreateServiceSheet isOpen onClose={close} onSuccess={close} />;
    }

    if (activeType === "community") {
      return <CreatePostSheet isOpen onClose={close} onSuccess={close} />;
    }

    if (activeType === "evenement") {
      return <CreateEventSheet onClose={close} onSuccess={close} />;
    }

    if (activeType === "marketplace") {
      return <CreateProductSheet isOpen onClose={close} onSuccess={close} />;
    }

    if (activeType === "sante") {
      return <CreateHealthSheet onClose={close} onSuccess={close} />;
    }

    if (activeType === "transport") {
      return (
        <CreateTransportSheet
          open
          onOpenChange={(open) => {
            if (!open) close();
          }}
          onSuccess={close}
        />
      );
    }

    if (activeType === "restauration") {
      return (
        <CreateRestaurantSheet
          open
          onOpenChange={(open) => {
            if (!open) close();
          }}
          onSuccess={close}
        />
      );
    }

    if (activeType === "hebergement") {
      return (
        <CreateAccommodationSheet
          open
          onOpenChange={(open) => {
            if (!open) close();
          }}
          onSuccess={close}
        />
      );
    }

    if (activeType === "agri") {
      return (
        <CreateAgriSheet
          open
          onOpenChange={(open) => {
            if (!open) close();
          }}
          onSuccess={close}
        />
      );
    }

    if (activeType === "network") {
      return <CreateNetworkSheet isOpen onClose={close} onSuccess={close} />;
    }

    if (activeType === "voyages") {
      return <CreateVoyageSheet isOpen onClose={close} onSuccess={close} />;
    }

    const genericType = activeType as GenericPublicationType;
    const config = formConfig[genericType];

    return (
      <GenericForm
        type={genericType}
        color={color}
        categories={config.categories}
        titlePlaceholder={config.titlePlaceholder}
        descriptionPlaceholder={config.descriptionPlaceholder}
        pricePlaceholder={config.pricePlaceholder}
        submitLabel={config.submitLabel}
        onBack={backToHub}
        onClose={close}
        createPublication={createPublication}
      />
    );
  };

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          sheetProgress.value,
          [0, 1],
          [screenHeight, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropProgress.value,
  }));

  if (!isOpen) {
    return null;
  }

  const sheetMaxHeight = Math.min(screenHeight * 0.94, 980);
  const sheetPaddingBottom = Math.max(insets.bottom, 0);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <View
      style={styles.root}
      pointerEvents="box-none"
      accessibilityViewIsModal
      accessibilityLabel="Espace de création"
    >
      <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
        <Pressable
          onPress={close}
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { height: sheetMaxHeight, maxHeight: sheetMaxHeight },
          sheetAnimatedStyle,
        ]}
      >
        <LinearGradient
          colors={["#0C0A1F", "#0A0818", "#070512"]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.topLine} pointerEvents="none" />
        <View style={styles.borderRing} pointerEvents="none" />

        <AmbientBackdrop />

        <View style={styles.handleWrap}>
          <View style={styles.handleBar} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 44 + sheetPaddingBottom },
            ]}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={Platform.OS === "android"}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
          >
            {!isAuthenticated ? (
              <NotAuthenticatedView onClose={close} />
            ) : activeType ? (
              <FadeUp>
                <View style={styles.activeFormWrap}>
                  <View
                    style={[
                      styles.activeFormHeader,
                      { borderColor: `${activeOption?.color ?? "#8B5CF6"}55` },
                    ]}
                  >
                    <Pressable
                      onPress={backToHub}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Retour"
                      style={({ pressed }) => [
                        styles.iconBtnSm,
                        pressed && styles.pressed,
                      ]}
                    >
                      <ArrowLeft size={15} color="rgba(255,255,255,0.85)" />
                    </Pressable>

                    {activeOption ? (
                      <>
                        <View
                          style={[
                            styles.activeFormIcon,
                            { backgroundColor: `${activeOption.color}22` },
                          ]}
                        >
                          <activeOption.icon
                            size={15}
                            color={activeOption.color}
                          />
                        </View>

                        <View style={styles.activeFormText}>
                          <Text
                            style={styles.activeFormTitle}
                            numberOfLines={1}
                          >
                            {activeOption.label}
                          </Text>
                          <Text style={styles.activeFormSub} numberOfLines={1}>
                            {activeOption.desc}
                          </Text>
                        </View>
                      </>
                    ) : null}

                    <Pressable
                      onPress={close}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Fermer"
                      style={({ pressed }) => [
                        styles.iconBtnSm,
                        pressed && styles.pressed,
                      ]}
                    >
                      <X size={15} color="rgba(255,255,255,0.75)" />
                    </Pressable>
                  </View>

                  {renderActiveForm()}
                </View>
              </FadeUp>
            ) : assistantMode ? (
              <CreationAssistant
                query={searchQuery}
                setQuery={setSearchQuery}
                onBack={backToHub}
                onSelect={selectType}
              />
            ) : (
              <View style={styles.hubWrap}>
                <View style={styles.hubHeader}>
                  <View style={styles.hubHeaderLeft}>
                    <LinearGradient
                      colors={["#A78BFA", "#6366F1"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.hubLogo}
                    >
                      <Plus size={16} color="#fff" strokeWidth={2.6} />
                    </LinearGradient>

                    <View>
                      <Text style={styles.hubTitle}>Créer</Text>
                      <Text style={styles.hubSub}>Votre espace d'action</Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={close}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Fermer"
                    style={({ pressed }) => [
                      styles.iconBtnSm,
                      pressed && styles.pressed,
                    ]}
                  >
                    <X size={16} color="rgba(255,255,255,0.75)" />
                  </Pressable>
                </View>

                <CreateHero
                  onAssistant={() => {
                    setAssistantMode(true);
                    setSearchQuery("");
                  }}
                />

                <CreateSearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  inputRef={searchRef}
                />

                {!isSearching ? (
                  <>
                    <CreateFeaturedSection onSelect={selectType} />

                    {historyLoaded ? (
                      <CreateQuickActions
                        history={history}
                        onSelect={selectType}
                      />
                    ) : null}

                    <CreateRecent history={history} onSelect={selectType} />

                    <CreateHubExplorer
                      selectedGroup={selectedGroup}
                      onSelectGroup={setSelectedGroup}
                      onShowAll={() => setSelectedGroup("__ALL__")}
                    />

                    {selectedGroup === "__ALL__" ? (
                      <CreateGroupedGrid
                        options={CREATE_OPTIONS}
                        onSelect={selectType}
                      />
                    ) : selectedGroup ? (
                      <CreateGroupedGrid
                        options={CREATE_OPTIONS.filter((option) =>
                          CREATE_GROUPS.some(
                            (group) =>
                              group.label === selectedGroup &&
                              group.ids.includes(option.id),
                          ),
                        )}
                        onSelect={selectType}
                      />
                    ) : null}
                  </>
                ) : (
                  <SearchResults
                    query={searchQuery.trim()}
                    matches={searchMatches}
                    onSelect={selectType}
                    onClear={() => setSearchQuery("")}
                  />
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

/* ============================================================================
 * AUTH
 * ========================================================================== */

function NotAuthenticatedView({ onClose }: { onClose: () => void }) {
  return (
    <FadeUp>
      <View style={styles.notAuthWrap}>
        <View style={styles.notAuthCloseRow}>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            style={({ pressed }) => [
              styles.iconBtnSm,
              pressed && styles.pressed,
            ]}
          >
            <X size={17} color="rgba(255,255,255,0.75)" />
          </Pressable>
        </View>

        <LinearGradient
          colors={[
            "rgba(139,92,246,0.18)",
            "rgba(99,102,241,0.06)",
            "rgba(15,7,32,0.88)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.notAuthCard}
        >
          <View style={styles.notAuthBorder} pointerEvents="none" />

          <LinearGradient
            colors={["#A78BFA", "#7C3AED", "#6366F1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.notAuthIcon}
          >
            <Sparkles size={27} color="#fff" />
          </LinearGradient>

          <Text style={styles.notAuthTitle}>
            Créez quelque chose de remarquable.
          </Text>

          <Text style={styles.notAuthSub}>
            Connectez-vous pour publier sur DébrouillePro.
          </Text>

          <View style={styles.signInWrap}>
            <SignInButton />
          </View>
        </LinearGradient>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    zIndex: 1000,
    elevation: 1000,
  },

  pressed: {
    opacity: 0.84,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,2,12,0.78)",
    zIndex: 1,
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    overflow: "hidden",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: "#0A0818",
    shadowColor: "#000",
    shadowOpacity: 0.8,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -20 },
    elevation: 24,
  },

  topLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(167,139,250,0.38)",
    zIndex: 30,
  },

  borderRing: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.16)",
    zIndex: 25,
  },

  ambientOrb: {
    position: "absolute",
    borderRadius: 9999,
  },

  ambientOrbA: {
    width: 340,
    height: 340,
    top: -160,
    left: -120,
    backgroundColor: "rgba(139,92,246,0.24)",
  },

  ambientOrbB: {
    width: 300,
    height: 300,
    bottom: -140,
    right: -100,
    backgroundColor: "rgba(99,102,241,0.20)",
  },

  handleWrap: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 7,
    zIndex: 20,
  },

  handleBar: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  keyboardContainer: {
    flex: 1,
    minHeight: 0,
  },

  scroll: {
    flex: 1,
    minHeight: 0,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 44,
  },

  /* HUB */

  hubWrap: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },

  hubHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  hubHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  hubLogo: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    shadowColor: "#6366F1",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  hubTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
  },

  hubSub: {
    marginTop: 2,
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
  },

  iconBtnSm: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  /* HERO */

  heroCard: {
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.32,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },

  heroBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
  },

  heroOrb1: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 999,
    top: -60,
    right: -60,
    backgroundColor: "rgba(139,92,246,0.25)",
  },

  heroOrb2: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 999,
    bottom: -60,
    left: -40,
    backgroundColor: "rgba(14,165,233,0.20)",
  },

  heroContent: {
    padding: 20,
  },

  heroHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },

  heroTextWrap: {
    flex: 1,
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(167,139,250,0.18)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    marginBottom: 12,
  },

  heroBadgeText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.75)",
  },

  heroTitle: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
  },

  heroSub: {
    marginTop: 8,
    maxWidth: 480,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "500",
  },

  heroWand: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },

  heroAIButton: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(16,16,34,0.88)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.34)",
  },

  heroAIIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.18)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },

  heroAIText: {
    flex: 1,
  },

  heroAITitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },

  heroAISub: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
  },

  /* SEARCH */

  searchSection: {
    marginBottom: 20,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  searchBarFocused: {
    borderColor: "rgba(139,92,246,0.55)",
    backgroundColor: "rgba(139,92,246,0.07)",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 2,
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },

  searchClear: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  searchHintsWrap: {
    marginTop: 12,
  },

  searchHintsLabel: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.35)",
    marginBottom: 8,
  },

  searchHintsRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 10,
  },

  searchHintChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  searchHintChipEmoji: {
    fontSize: 12,
  },

  searchHintChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.72)",
  },

  /* SEARCH RESULTS */

  searchTopSection: {
    marginBottom: 20,
  },

  searchTopHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
  },

  searchTopLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
    color: "#6EE7B7",
  },

  searchTopCard: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },

  searchTopOrb: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 999,
  },

  searchTopBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
  },

  searchTopIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  searchTopText: {
    flex: 1,
    minWidth: 0,
  },

  searchTopTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.4,
  },

  searchTopDesc: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },

  searchTopArrow: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  searchOtherHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
  },

  searchOtherLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.5)",
  },

  /* SECTIONS */

  sectionBlock: {
    marginBottom: 22,
  },

  sectionBlockSmall: {
    marginBottom: 20,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  sectionEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.5)",
  },

  sectionEyebrowDim: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "600",
  },

  /* FEATURED */

  featuredSectionBlock: {
    marginBottom: 24,
  },

  flagshipCard: {
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#3B82F6",
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },

  flagshipOrb: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 999,
  },

  flagshipOrbSmall: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 999,
  },

  flagshipBody: {
    padding: 20,
  },

  flagshipHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  flagshipIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  flagshipTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(196,181,253,0.14)",
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.32)",
  },

  flagshipTagText: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: "#C4B5FD",
  },

  flagshipTitle: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.8,
  },

  flagshipTagline: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
    maxWidth: 480,
  },

  flagshipCta: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  flagshipCtaText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  featuredPrimaryWrap: {
    marginTop: 4,
  },

  featuredMiniCard: {
    width: "100%",
    minHeight: 138,
    padding: 13,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  featuredMiniTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  featuredMiniIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  featuredStarBadge: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  featuredStarText: {
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 13,
  },

  featuredMiniTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255,255,255,0.95)",
  },

  featuredMiniSub: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },

  featuredMiniCta: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  featuredMiniCtaText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  /* EXPLORER */

  explorerBlock: {
    marginBottom: 22,
  },

  explorerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  explorerTile: {
    width: "48.8%",
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 11,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  explorerTileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  explorerTileBody: {
    flex: 1,
    minWidth: 0,
  },

  explorerTileTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.92)",
  },

  explorerTileMeta: {
    marginTop: 2,
    fontSize: 9.5,
    color: "rgba(255,255,255,0.42)",
    fontWeight: "600",
  },

  explorerShowAll: {
    marginTop: 10,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.25)",
    backgroundColor: "rgba(103,232,249,0.06)",
  },

  explorerShowAllIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(103,232,249,0.12)",
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.28)",
  },

  explorerShowAllText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    color: "#A5F3FC",
    letterSpacing: 0.3,
  },

  /* QUICK */

  quickListH: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 10,
  },

  quickCardWrap: {
    width: QUICK_CARD_WIDTH,
  },

  quickCardH: {
    width: QUICK_CARD_WIDTH,
    minHeight: 148,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  quickCardIconH: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 12,
  },

  quickCardTitleH: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },

  quickCardSubH: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 14,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },

  quickCardArrowH: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  /* RECENT */

  recentRowH: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 10,
  },

  recentChipH: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },

  recentChipTextH: {
    fontSize: 11,
    fontWeight: "800",
  },

  /* GROUPS */

  groupBlock: {
    marginBottom: 24,
  },

  groupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 10,
  },

  groupIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  groupTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "rgba(255,255,255,0.82)",
  },

  groupCount: {
    marginTop: 2,
    fontSize: 9.5,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "600",
  },

  moduleRowH: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 10,
  },

  moduleCardWrap: {
    width: MODULE_CARD_WIDTH,
  },

  gridCard: {
    width: "100%",
    minHeight: 120,
    padding: 13,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.028)",
  },

  gridCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  gridCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  gridCardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255,255,255,0.95)",
  },

  gridCardSub: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },

  /* RESULTS */

  resultsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },

  resultsText: {
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 1.1,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
  },

  /* EMPTY */

  noResultCard: {
    padding: 28,
    borderRadius: 24,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  noResultIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 12,
  },

  noResultTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
  },

  noResultSub: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },

  noResultBtn: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: "#6366F1",
  },

  noResultBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
  },

  /* AI */

  aiWrap: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
  },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },

  backRowText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
  },

  aiCard: {
    padding: 24,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(12,8,28,0.72)",
  },

  aiBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
  },

  aiIconBig: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
    backgroundColor: "rgba(124,58,237,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },

  aiTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.8,
  },

  aiSub: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },

  aiInputWrap: {
    marginTop: 24,
    minHeight: 115,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  aiInput: {
    minHeight: 82,
    fontSize: 13.5,
    lineHeight: 20,
    color: "#fff",
    fontWeight: "500",
  },

  aiHint: {
    marginTop: 14,
    fontSize: 10.5,
    lineHeight: 16,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
  },

  aiSuggestions: {
    marginTop: 20,
    gap: 8,
  },

  aiSuggestionsTitle: {
    marginBottom: 2,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.4)",
  },

  aiSuggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
  },

  aiSuggestionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  aiSuggestionText: {
    flex: 1,
  },

  aiSuggestionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
  },

  aiSuggestionSub: {
    marginTop: 2,
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
  },

  /* ACTIVE FORM */

  activeFormWrap: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },

  activeFormHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
  },

  activeFormIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  activeFormText: {
    flex: 1,
    minWidth: 0,
  },

  activeFormTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#fff",
  },

  activeFormSub: {
    marginTop: 2,
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
  },

  /* FORM */

  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },

  formHeaderTitleWrap: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  formHeaderTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#fff",
  },

  formSectionLabel: {
    marginTop: 7,
    marginBottom: 5,
  },

  formSectionLabelText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.34)",
  },

  fieldShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  fieldShellTextarea: {
    alignItems: "flex-start",
    paddingVertical: 12,
  },

  textareaIcon: {
    marginTop: 3,
  },

  fieldInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 13.5,
    color: "#fff",
    fontWeight: "500",
  },

  textareaInput: {
    minHeight: 72,
  },

  twoColumn: {
    flexDirection: "row",
    gap: 8,
  },

  column: {
    flex: 1,
  },

  catsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 8,
  },

  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  catPillText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
  },

  currencyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },

  currencyPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  currencyPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
  },

  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  checkLabel: {
    fontSize: 12.5,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },

  tagsShell: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },

  tagInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  tagChipText: {
    fontSize: 11,
    fontWeight: "700",
  },

  tagAdd: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  tagAddDisabled: {
    opacity: 0.4,
  },

  conditionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 8,
  },

  /* SUBMIT */

  submitOuter: {
    marginTop: 12,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  submitDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },

  submitGradient: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },

  submitText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },

  /* AUTH */

  notAuthWrap: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },

  notAuthCloseRow: {
    alignItems: "flex-end",
    marginBottom: 8,
  },

  notAuthCard: {
    padding: 28,
    borderRadius: 30,
    alignItems: "center",
    overflow: "hidden",
  },

  notAuthBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },

  notAuthIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#6366F1",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },

  notAuthTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.6,
  },

  notAuthSub: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },

  signInWrap: {
    marginTop: 24,
    width: "100%",
    alignItems: "center",
  },
});

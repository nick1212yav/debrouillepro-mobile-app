import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

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
  Compass,
  FileText,
  Globe,
  HandHeart,
  Heart,
  Home,
  Leaf,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  Plane,
  Plus,
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

import {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
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

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface CreateBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExtendedPublicationType = PublicationType | "network" | "voyages";

type GenericPublicationType = "energie" | "ong" | "video" | "sondage";

type ContractType =
  | "cdi"
  | "cdd"
  | "stage"
  | "freelance"
  | "alternance"
  | "benevole";

type CreateOption = {
  id: ExtendedPublicationType;
  icon: LucideIcon;
  label: string;
  desc: string;
  color: string;
  keywords: string[];
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
    ],
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
    ],
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
    ],
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
    ],
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
    ],
  },
  {
    id: "video",
    icon: Video,
    label: "Vidéo / Reel",
    desc: "Partagez une vidéo ou un reel",
    color: "#EF4444",
    keywords: ["vidéo", "video", "reel", "film", "clip", "tutorial"],
  },
  {
    id: "article",
    icon: BookOpen,
    label: "Article",
    desc: "Écrivez un article ou blog",
    color: "#06B6D4",
    keywords: ["blog", "article", "rédaction", "publication", "éditorial"],
  },
  {
    id: "sondage",
    icon: BarChart3,
    label: "Sondage",
    desc: "Créez un sondage",
    color: "#A855F7",
    keywords: ["sondage", "vote", "opinion", "question", "enquête"],
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
    ],
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
    ],
  },
];

const CREATE_GROUPS: {
  label: string;
  icon: LucideIcon;
  ids: ExtendedPublicationType[];
}[] = [
  {
    label: "Commerce & Business",
    icon: ShoppingBag,
    ids: ["marketplace", "annonce", "restauration"],
  },
  {
    label: "Habitat & Mobilité",
    icon: Home,
    ids: ["immo", "hebergement", "energie", "transport", "voyages"],
  },
  {
    label: "Professionnel",
    icon: Briefcase,
    ids: ["job", "service", "network"],
  },
  {
    label: "Communauté",
    icon: Users,
    ids: ["community", "evenement", "ong"],
  },
  {
    label: "Agriculture & Santé",
    icon: Leaf,
    ids: ["agri", "sante"],
  },
  {
    label: "Média & Création",
    icon: Video,
    ids: ["video", "article", "sondage"],
  },
];

const QUICK_CREATE_IDS: ExtendedPublicationType[] = [
  "immo",
  "job",
  "service",
  "marketplace",
];

const IMMO_CATS = [
  "Location",
  "Vente",
  "Colocation",
  "Terrain",
  "Bureau",
  "Commerce",
];

const SERVICE_CATS = [
  "Informatique",
  "Plomberie",
  "Électricité",
  "Éducation",
  "Design",
  "Transport",
  "Autre",
];

const EVENT_CATS = [
  "Concert",
  "Conférence",
  "Sport",
  "Culture",
  "Formation",
  "Fête",
  "Autre",
];

const COMMUNITY_CATS = [
  "Discussion",
  "Conseil",
  "Témoignage",
  "Question",
  "Info",
  "Humour",
];

const AGRI_CATS = [
  "Céréales",
  "Légumes",
  "Fruits",
  "Intrants",
  "Matériel",
  "Conseil",
];

const SANTE_CATS = [
  "Consultation",
  "Pharmacie",
  "Urgence",
  "Télémédecine",
  "Prévention",
  "Autre",
];

const ANNONCE_CATS = [
  "Électronique",
  "Vêtements",
  "Mobilier",
  "Véhicule",
  "Livres",
  "Autre",
];

const RESTO_CATS = [
  "Restaurant",
  "Traiteur",
  "Snack",
  "Livraison",
  "Café",
  "Fast-food",
];

const HEBERG_CATS = [
  "Hôtel",
  "Appartement",
  "Villa",
  "Chambre",
  "Auberge",
  "Studio",
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

const ARTICLE_CATS_FORM = [
  "Tech",
  "Société",
  "Culture",
  "Santé",
  "Business",
  "Éducation",
];

const SONDAGE_CATS = [
  "Opinion",
  "Fun",
  "Business",
  "Communauté",
  "Sport",
  "Autre",
];

const MARKETPLACE_CATS = [
  "Électronique",
  "Mode",
  "Maison & Jardin",
  "Véhicules",
  "Alimentation",
  "Artisanat",
  "Services",
  "Beauté & Santé",
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
  article: "post",
  sondage: "post",
  marketplace: "product_description",
  network: "bio",
  voyages: "post",
};

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

function rankOption(option: CreateOption, query: string): number {
  const q = normalizeSearch(query);

  if (!q) return 0;

  const label = normalizeSearch(option.label);
  const desc = normalizeSearch(option.desc);

  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (desc.includes(q)) return 40;

  const keywordMatch = option.keywords.some((keyword) =>
    normalizeSearch(keyword).includes(q),
  );

  return keywordMatch ? 30 : 0;
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
 * REUSABLE ANIMATION
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
    progress.value = withTiming(1, {
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
    });
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
 * IMPORT TYPE FOR REANIMATED VIEW
 * ========================================================================== */

import Animated from "react-native-reanimated";

/* ============================================================================
 * AMBIENT BACKDROP
 * ========================================================================== */

function AmbientBackdrop() {
  const orbA = useSharedValue(0);
  const orbB = useSharedValue(0);

  useEffect(() => {
    orbA.value = withRepeat(
      withSequence(
        withTiming(-36, {
          duration: 4500,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: 4500,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      false,
    );

    orbB.value = withRepeat(
      withSequence(
        withTiming(42, {
          duration: 5500,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: 5500,
          easing: Easing.inOut(Easing.sin),
        }),
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
 * HEADER SEARCH
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

  return (
    <FadeUp delay={80}>
      <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
        <Search size={18} color="rgba(255,255,255,0.45)" />

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder="Que voulez-vous créer ?"
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
    </FadeUp>
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
        withTiming(1, {
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
        }),
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
        rotate: `${interpolate(
          pulse.value,
          [0, 1],
          [0, 2],
          Extrapolation.CLAMP,
        )}deg`,
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
    .slice(0, 4);

  return (
    <FadeUp delay={130}>
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <TrendingUp size={13} color="#6EE7B7" />

            <Text style={styles.sectionEyebrow}>
              {historyOptions.length ? "VOS RACCOURCIS" : "CRÉATION RAPIDE"}
            </Text>
          </View>

          <Text style={styles.sectionEyebrowDim}>1 clic</Text>
        </View>

        <View style={styles.quickList}>
          {options.map((option, index) => (
            <FadeUp key={option.id} delay={170 + index * 45}>
              <CreateQuickCard
                option={option}
                onPress={() => onSelect(option.id)}
              />
            </FadeUp>
          ))}
        </View>
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
        styles.quickActionCard,
        {
          borderColor: `${option.color}33`,
        },
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={[`${option.color}18`, "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.quickActionIcon,
          {
            backgroundColor: `${option.color}22`,
            borderColor: `${option.color}55`,
          },
        ]}
      >
        <Icon size={16} color={option.color} />
      </View>

      <View style={styles.quickActionText}>
        <Text style={styles.quickActionTitle} numberOfLines={1}>
          {option.label}
        </Text>

        <Text style={styles.quickActionSub} numberOfLines={1}>
          {option.desc}
        </Text>
      </View>

      <ArrowRight size={14} color={`${option.color}AA`} />
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
    <FadeUp delay={210}>
      <View style={styles.sectionBlockSmall}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Activity size={12} color="rgba(255,255,255,0.5)" />

            <Text style={styles.sectionEyebrow}>DERNIÈRES CRÉATIONS</Text>
          </View>
        </View>

        <View style={styles.recentWrap}>
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
                  styles.recentChip,
                  pressed && styles.pressed,
                ]}
              >
                <Icon size={14} color="rgba(255,255,255,0.7)" />

                <Text style={styles.recentChipText}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
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
  const { width } = useWindowDimensions();
  const isWide = width >= 640;

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
                    {items.length} option
                    {items.length > 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              <View style={[styles.grid, isWide && styles.gridWide]}>
                {items.map((option, index) => (
                  <FadeUp
                    key={option.id}
                    delay={groupIndex * 45 + index * 25}
                    style={isWide ? styles.gridItemWide : undefined}
                  >
                    <CreateGridCard
                      option={option}
                      onPress={() => onSelect(option.id)}
                    />
                  </FadeUp>
                ))}
              </View>
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
        {
          borderColor: `${option.color}33`,
        },
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

      <Text style={styles.gridCardTitle}>{option.label}</Text>

      <Text style={styles.gridCardSub}>{option.desc}</Text>
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
            accessibilityState={{
              selected,
            }}
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
              style={[
                styles.tagChip,
                {
                  backgroundColor: `${color}22`,
                },
              ]}
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
          style={[
            styles.formHeaderTitleWrap,
            {
              borderColor: `${color}55`,
            },
          ]}
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
    scale.value = withSpring(0.97, {
      damping: 18,
      stiffness: 280,
    });
  };

  const pressOut = () => {
    scale.value = withSpring(1, {
      damping: 18,
      stiffness: 280,
    });
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
        accessibilityState={{
          disabled: unavailable,
          busy: loading,
        }}
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
      setForm((current) => ({
        ...current,
        [key]: value,
      }));
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
        {
          text: "OK",
          onPress: onClose,
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Une erreur est survenue.";

      Alert.alert("Publication impossible", message);
    } finally {
      setLoading(false);
    }
  }, [createJob, form, onClose]);

  const contractTypes: {
    label: string;
    value: ContractType;
  }[] = [
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
            form.remote && {
              backgroundColor: color,
              borderColor: color,
            },
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
      setForm((current) => ({
        ...current,
        [key]: value,
      }));
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
        {
          text: "OK",
          onPress: onClose,
        },
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
            {
              value: "",
              label: "État",
            },
            {
              value: "neuf",
              label: "Neuf",
            },
            {
              value: "comme-neuf",
              label: "Comme neuf",
            },
            {
              value: "tres-bon",
              label: "Très bon",
            },
            {
              value: "bon",
              label: "Bon",
            },
            {
              value: "acceptable",
              label: "Acceptable",
            },
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
                    {
                      borderColor: `${option.color}35`,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.aiSuggestionIcon,
                      {
                        backgroundColor: `${option.color}22`,
                      },
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
}: CreateBottomSheetProps) {
  const { height: screenHeight } = useWindowDimensions();

  const { isAuthenticated } = useFirebaseAuth();

  const createPublicationMutation = useMutation(
    api.publications.createPublication,
  );

  const createPublication =
    createPublicationMutation as unknown as CreatePublicationFn;

  const [activeType, setActiveType] = useState<ExtendedPublicationType | null>(
    null,
  );

  const [searchQuery, setSearchQuery] = useState("");

  const [history, setHistory] = useState<ExtendedPublicationType[]>([]);

  const [historyLoaded, setHistoryLoaded] = useState(false);

  const [assistantMode, setAssistantMode] = useState(false);

  const sheetProgress = useSharedValue(0);
  const backdropProgress = useSharedValue(0);

  const searchRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    setActiveType(null);
    setSearchQuery("");
    setAssistantMode(false);

    void loadHistory().then((loaded) => {
      if (cancelled) return;

      setHistory(loaded);
      setHistoryLoaded(true);
    });

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
  }, [backdropProgress, isOpen, sheetProgress]);

  const close = useCallback(() => {
    sheetProgress.value = withTiming(
      0,
      {
        duration: 240,
        easing: Easing.in(Easing.cubic),
      },
      () => undefined,
    );

    backdropProgress.value = withTiming(0, {
      duration: 180,
      easing: Easing.in(Easing.cubic),
    });

    setTimeout(onClose, 245);
  }, [backdropProgress, onClose, sheetProgress]);

  const selectType = useCallback(
    async (id: ExtendedPublicationType) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const nextHistory = await addHistory(id, history);

      setHistory(nextHistory);
      setAssistantMode(false);
      setSearchQuery("");
      setActiveType(id);
    },
    [history],
  );

  const backToHub = useCallback(() => {
    setActiveType(null);
    setAssistantMode(false);
    setSearchQuery("");
  }, []);

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim();

    if (!query) {
      return CREATE_OPTIONS;
    }

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

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={styles.root}>
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
            {
              maxHeight: Math.min(screenHeight * 0.94, 980),
            },
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
              ref={undefined}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
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
                        {
                          borderColor: `${activeOption?.color ?? "#8B5CF6"}55`,
                        },
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
                              {
                                backgroundColor: `${activeOption.color}22`,
                              },
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

                            <Text
                              style={styles.activeFormSub}
                              numberOfLines={1}
                            >
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

                  {!searchQuery.trim() ? (
                    <>
                      {historyLoaded ? (
                        <CreateQuickActions
                          history={history}
                          onSelect={selectType}
                        />
                      ) : null}

                      <CreateRecent history={history} onSelect={selectType} />
                    </>
                  ) : (
                    <FadeUp>
                      <View style={styles.resultsRow}>
                        <Compass size={13} color="#67E8F9" />

                        <Text style={styles.resultsText}>
                          {filteredOptions.length} résultat
                          {filteredOptions.length !== 1 ? "s" : ""}
                        </Text>
                      </View>
                    </FadeUp>
                  )}

                  {filteredOptions.length > 0 ? (
                    <CreateGroupedGrid
                      options={filteredOptions}
                      onSelect={selectType}
                    />
                  ) : (
                    <FadeUp>
                      <View style={styles.noResultCard}>
                        <View style={styles.noResultIcon}>
                          <Search size={18} color="rgba(255,255,255,0.4)" />
                        </View>

                        <Text style={styles.noResultTitle}>
                          Aucun espace trouvé
                        </Text>

                        <Text style={styles.noResultSub}>
                          Essayez un autre mot ou utilisez l'assistant.
                        </Text>

                        <Pressable
                          onPress={() => setAssistantMode(true)}
                          style={({ pressed }) => [
                            styles.noResultBtn,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Sparkles size={13} color="#fff" />

                          <Text style={styles.noResultBtnText}>
                            M'aider à choisir
                          </Text>
                        </Pressable>
                      </View>
                    </FadeUp>
                  )}
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
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
    flex: 1,
    justifyContent: "flex-end",
  },

  pressed: {
    opacity: 0.84,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,2,12,0.78)",
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: "#0A0818",
    shadowColor: "#000",
    shadowOpacity: 0.8,
    shadowRadius: 40,
    shadowOffset: {
      width: 0,
      height: -20,
    },
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
  },

  scroll: {
    flex: 1,
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
    shadowOffset: {
      width: 0,
      height: 6,
    },
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
    shadowOffset: {
      width: 0,
      height: 16,
    },
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
    marginBottom: 20,
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

  /* QUICK */

  quickList: {
    gap: 10,
  },

  quickActionCard: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  quickActionText: {
    flex: 1,
  },

  quickActionTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#fff",
  },

  quickActionSub: {
    marginTop: 2,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },

  /* RECENT */

  recentWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  recentChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.72)",
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

  grid: {
    gap: 10,
  },

  gridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  gridItemWide: {
    flexBasis: "48%",
    flexGrow: 1,
  },

  gridCard: {
    minHeight: 108,
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
    shadowOffset: {
      width: 0,
      height: 10,
    },
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
    shadowOffset: {
      width: 0,
      height: 12,
    },
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

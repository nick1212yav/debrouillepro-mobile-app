// src/pages/home/_components/CreateBottomSheet.tsx
import {
  View,
  Pressable,
  Text,
  TextInput,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  useWindowDimensions,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  X,
  Home,
  Briefcase,
  Calendar,
  Wrench,
  ArrowLeft,
  MapPin,
  Tag,
  FileText,
  Leaf,
  Truck,
  Megaphone,
  UtensilsCrossed,
  BedDouble,
  Zap,
  HandHeart,
  Users,
  Heart,
  Loader2,
  LocateFixed,
  Video,
  BookOpen,
  BarChart3,
  Plus,
  Check,
  Globe,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  ShoppingBag,
  Search,
  Clock,
  UserPlus,
  Plane,
  Sparkles,
  ArrowRight,
  Wand2,
  TrendingUp,
  Compass,
} from "lucide-react-native";
import ArticleForm from "./ArticleForm.tsx";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { toast } from "sonner";
import { SignInButton } from "@/components/ui/signin.tsx";
import type { PublicationType } from "@/hooks/use-publications.ts";
import AIWriteAssist from "@/components/AIWriteAssist.tsx";
import ImageUploader from "@/components/ImageUploader.tsx";
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
 * CONSTANTS
 * ========================================================================== */

const isBrowser = typeof window !== "undefined";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface CreateBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExtendedPublicationType = PublicationType | "network" | "voyages";

type CreateOption = {
  id: ExtendedPublicationType;
  icon: ComponentType<{ size: number; color?: string; style?: any }>;
  label: string;
  desc: string;
  color: string;
  keywords: string[];
};

/* ============================================================================
 * DATA
 * ========================================================================== */

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
    desc: "Offre, recherche, freelance",
    color: "#8B5CF6",
    keywords: [
      "travail",
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
    ],
  },
  {
    id: "community",
    icon: Users,
    label: "Community",
    desc: "Partagez avec la communauté",
    color: "#3B82F6",
    keywords: ["post", "discussion", "groupe", "partage", "conseil", "forum"],
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
      "urgences",
      "télémédecine",
      "vaccin",
      "hôpital",
      "clinique",
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
    ],
  },
  {
    id: "annonce",
    icon: Megaphone,
    label: "Annonce",
    desc: "Vente d'objet, échange",
    color: "#F59E0B",
    keywords: ["objet", "occasion", "vente", "échange", "troc", "matériel"],
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
      "villa",
      "appartement",
      "chambre",
      "auberge",
      "location",
      "gîte",
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
      "ONG",
      "solidarité",
    ],
  },
  {
    id: "video",
    icon: Video,
    label: "Vidéo / Reel",
    desc: "Partagez une vidéo ou reel",
    color: "#EF4444",
    keywords: ["vidéo", "reel", "tiktok", "youtube", "partage", "film"],
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
    desc: "Créez un sondage, votez",
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
      "carrière",
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
  icon: ComponentType<{ size: number; color?: string; style?: any }>;
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
  { label: "Communauté", icon: Users, ids: ["community", "evenement", "ong"] },
  { label: "Agriculture & Santé", icon: Leaf, ids: ["agri", "sante"] },
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

const HISTORY_STORAGE_KEY = "debrouille_create_history";
const MAX_HISTORY = 4;

const memoryStore: Record<string, string> = {};

const store = {
  get(k: string): string | null {
    if (isBrowser) {
      try {
        return window.localStorage.getItem(k);
      } catch {
        return null;
      }
    }
    return memoryStore[k] ?? null;
  },
  set(k: string, v: string) {
    if (isBrowser) {
      try {
        window.localStorage.setItem(k, v);
      } catch {}
    } else {
      memoryStore[k] = v;
    }
  },
};

function getCreationHistory(): ExtendedPublicationType[] {
  try {
    const raw = store.get(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ExtendedPublicationType[];
    return parsed.filter((id) => CREATE_OPTIONS.some((o) => o.id === id));
  } catch {
    return [];
  }
}

function addToHistory(id: ExtendedPublicationType): void {
  const current = getCreationHistory();
  const next = [id, ...current.filter((x) => x !== id)].slice(0, MAX_HISTORY);
  store.set(HISTORY_STORAGE_KEY, JSON.stringify(next));
}

/* ============================================================================
 * CATEGORIES
 * ========================================================================== */

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

type FormState = {
  title: string;
  description: string;
  price: string;
  location: string;
  category: string;
  contact: string;
  condition: string;
};

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
 * ANIMATION HELPERS
 * ========================================================================== */

function FadeUp({
  delay = 0,
  distance = 12,
  children,
  style,
}: {
  delay?: number;
  distance?: number;
  children: ReactNode;
  style?: any;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
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
 * AMBIENT BACKGROUND (orbs)
 * ========================================================================== */

function AmbientBackdrop() {
  const orbA = useRef(new Animated.Value(0)).current;
  const orbB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (v: Animated.Value, to: number, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: to,
            duration: dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    loop(orbA, -40, 9000);
    loop(orbB, 50, 11000);
  }, [orbA, orbB]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.ambientOrb,
          {
            width: 340,
            height: 340,
            top: -160,
            left: -120,
            backgroundColor: "rgba(139,92,246,0.4)",
            transform: [{ translateY: orbA }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ambientOrb,
          {
            width: 300,
            height: 300,
            bottom: -140,
            right: -100,
            backgroundColor: "rgba(99,102,241,0.32)",
            transform: [{ translateY: orbB }],
          },
        ]}
      />
    </View>
  );
}

/* ============================================================================
 * LOADING SPINNER
 * ========================================================================== */

function LoadingSpinner({
  color = "#fff",
  size = 16,
}: {
  color?: string;
  size?: number;
}) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotate]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
      <Loader2 size={size} color={color} />
    </Animated.View>
  );
}

/* ============================================================================
 * SEARCH BAR
 * ========================================================================== */

function CreateSearchBar({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  inputRef?: React.RefObject<TextInput>;
}) {
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focused, focusAnim]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.1)", "rgba(139,92,246,0.55)"],
  });

  return (
    <FadeUp delay={60}>
      <Animated.View style={[styles.searchBar, { borderColor }]}>
        <Search size={18} color="rgba(255,255,255,0.45)" />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Que voulez-vous créer ? Ex. maison, emploi, restaurant…"
          placeholderTextColor="rgba(255,255,255,0.3)"
          style={styles.searchInput}
          autoFocus
          accessibilityLabel="Recherche de création"
        />
        {value ? (
          <Pressable
            onPress={() => onChange("")}
            hitSlop={8}
            style={({ pressed }) => [
              styles.searchClear,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Effacer"
          >
            <X size={13} color="rgba(255,255,255,0.65)" />
          </Pressable>
        ) : null}
      </Animated.View>
    </FadeUp>
  );
}

/* ============================================================================
 * HERO
 * ========================================================================== */

function CreateHero({ onAI }: { onAI: () => void }) {
  const wand = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(wand, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(wand, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [wand]);

  const translateY = wand.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });
  const rotate = wand.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "2deg"],
  });

  return (
    <FadeUp distance={14}>
      <View style={styles.heroCard}>
        {/* Gradients + orbs */}
        <LinearGradient
          colors={[
            "rgba(139,92,246,0.22)",
            "rgba(76,29,149,0.08)",
            "rgba(15,7,32,0.85)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroTopLine} pointerEvents="none" />
        <View style={styles.heroBorder} pointerEvents="none" />
        <View style={styles.heroOrb1} pointerEvents="none" />
        <View style={styles.heroOrb2} pointerEvents="none" />

        <View style={{ padding: 20 }}>
          <View style={styles.heroHeaderRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
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

            <Animated.View
              style={[
                styles.heroWandWrap,
                { transform: [{ translateY }, { rotate }] },
              ]}
            >
              <LinearGradient
                colors={["#A78BFA", "#7C3AED", "#6366F1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroWand}
              >
                <Wand2 size={25} color="#fff" />
              </LinearGradient>
            </Animated.View>
          </View>

          <Pressable
            onPress={onAI}
            style={({ pressed }) => [
              styles.heroAIButtonOuter,
              pressed && styles.pressed,
            ]}
          >
            <LinearGradient
              colors={["rgba(167,139,250,0.5)", "rgba(99,102,241,0.5)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroAIButtonGradient}
            >
              <View style={styles.heroAIButtonInner}>
                <View style={styles.heroAIIconBox}>
                  <Sparkles size={16} color="#C4B5FD" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.heroAITitle}>
                    Je ne sais pas quoi choisir
                  </Text>
                  <Text style={styles.heroAISub} numberOfLines={1}>
                    Décrivez simplement ce que vous voulez faire…
                  </Text>
                </View>
                <ArrowRight size={17} color="rgba(255,255,255,0.55)" />
              </View>
            </LinearGradient>
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
    .map((id) => CREATE_OPTIONS.find((o) => o.id === id))
    .filter(Boolean) as CreateOption[];

  const fallbackOptions = QUICK_CREATE_IDS.map((id) =>
    CREATE_OPTIONS.find((o) => o.id === id),
  ).filter(Boolean) as CreateOption[];

  const options = [...historyOptions, ...fallbackOptions]
    .filter(
      (opt, index, arr) => arr.findIndex((x) => x.id === opt.id) === index,
    )
    .slice(0, 4);

  return (
    <FadeUp delay={120}>
      <View style={{ marginBottom: 24 }}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TrendingUp size={13} color="#6EE7B7" />
            <Text style={styles.sectionEyebrow}>
              {historyOptions.length ? "VOS RACCOURCIS" : "CRÉATION RAPIDE"}
            </Text>
          </View>
          <Text style={styles.sectionEyebrowDim}>1 clic</Text>
        </View>

        <View style={{ gap: 10 }}>
          {options.map((opt, index) => (
            <FadeUp key={opt.id} delay={160 + index * 45}>
              <Pressable
                onPress={() => onSelect(opt.id)}
                style={({ pressed }) => [
                  styles.quickActionCard,
                  { borderColor: `${opt.color}33` },
                  pressed && styles.pressed,
                ]}
              >
                <LinearGradient
                  colors={[`${opt.color}18`, "rgba(255,255,255,0)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View
                  style={[
                    styles.quickActionIcon,
                    {
                      backgroundColor: `${opt.color}22`,
                      borderColor: `${opt.color}55`,
                    },
                  ]}
                >
                  <opt.icon size={16} color={opt.color} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.quickActionTitle} numberOfLines={1}>
                    {opt.label}
                  </Text>
                  <Text style={styles.quickActionSub} numberOfLines={1}>
                    {opt.desc}
                  </Text>
                </View>
                <ArrowRight size={14} color={`${opt.color}AA`} />
              </Pressable>
            </FadeUp>
          ))}
        </View>
      </View>
    </FadeUp>
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

  const recentOptions = history
    .map((id) => CREATE_OPTIONS.find((o) => o.id === id))
    .filter(Boolean) as CreateOption[];

  return (
    <FadeUp delay={200}>
      <View style={{ marginBottom: 20 }}>
        <View style={styles.sectionHeaderRow}>
          <Clock size={12} color="rgba(255,255,255,0.5)" />
          <Text style={styles.sectionEyebrow}>DERNIÈRES CRÉATIONS</Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {recentOptions.map((opt) => (
            <Pressable
              key={opt.id}
              onPress={() => onSelect(opt.id)}
              style={({ pressed }) => [
                styles.recentChip,
                pressed && styles.pressed,
              ]}
            >
              <opt.icon size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.recentChipText}>{opt.label}</Text>
            </Pressable>
          ))}
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
        const items = options.filter((opt) => group.ids.includes(opt.id));
        if (!items.length) return null;

        return (
          <FadeUp key={group.label} delay={groupIndex * 50}>
            <View style={{ marginBottom: 24 }}>
              <View style={styles.groupHeaderRow}>
                <View style={styles.groupIconWrap}>
                  <group.icon size={13} color="rgba(255,255,255,0.65)" />
                </View>
                <View>
                  <Text style={styles.groupTitle}>{group.label}</Text>
                  <Text style={styles.groupCount}>
                    {items.length} option{items.length > 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  gap: 10,
                  flexDirection: isWide ? "row" : "column",
                  flexWrap: isWide ? "wrap" : "nowrap",
                }}
              >
                {items.map((opt, index) => (
                  <FadeUp
                    key={opt.id}
                    delay={groupIndex * 50 + index * 30}
                    style={
                      isWide ? { flexBasis: "48%", flexGrow: 1 } : undefined
                    }
                  >
                    <Pressable
                      onPress={() => onSelect(opt.id)}
                      style={({ pressed }) => [
                        styles.gridCard,
                        { borderColor: `${opt.color}33` },
                        pressed && styles.pressed,
                      ]}
                    >
                      <LinearGradient
                        colors={[`${opt.color}14`, "rgba(255,255,255,0)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.gridCardTopRow}>
                        <View
                          style={[
                            styles.gridCardIcon,
                            {
                              backgroundColor: `${opt.color}22`,
                              borderColor: `${opt.color}55`,
                            },
                          ]}
                        >
                          <opt.icon size={19} color={opt.color} />
                        </View>
                        <ArrowRight size={14} color="rgba(255,255,255,0.3)" />
                      </View>
                      <Text style={styles.gridCardTitle}>{opt.label}</Text>
                      <Text style={styles.gridCardSub}>{opt.desc}</Text>
                    </Pressable>
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

/* ============================================================================
 * FORM HELPERS
 * ========================================================================== */

function FieldInput({
  icon: Icon,
  color,
  placeholder,
  value,
  onChange,
}: {
  icon: ComponentType<{ size: number; color?: string }>;
  color: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focused, focusAnim]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.08)", `${color}66`],
  });
  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.045)", `${color}12`],
  });

  return (
    <Animated.View
      style={[styles.fieldShell, { borderColor, backgroundColor: bgColor }]}
    >
      <Icon size={14} color={color} />
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.3)"
        style={styles.fieldInput}
      />
    </Animated.View>
  );
}

function FieldTextarea({
  icon: Icon,
  color,
  placeholder,
  value,
  onChange,
}: {
  icon: ComponentType<{ size: number; color?: string }>;
  color: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focused, focusAnim]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.08)", `${color}66`],
  });

  return (
    <Animated.View
      style={[
        styles.fieldShell,
        { borderColor, alignItems: "flex-start", paddingVertical: 12 },
      ]}
    >
      <View style={{ marginTop: 3 }}>
        <Icon size={14} color={color} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.3)"
        style={[styles.fieldInput, { minHeight: 60 }]}
        multiline
        textAlignVertical="top"
      />
    </Animated.View>
  );
}

function CategoryPills({
  cats,
  active,
  color,
  onChange,
}: {
  cats: string[];
  active: string;
  color: string;
  onChange: (c: string) => void;
}) {
  return (
    <View style={styles.catsRow}>
      {cats.map((c) => {
        const isActive = active === c;
        return (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            style={({ pressed }) => [
              styles.catPill,
              isActive && {
                backgroundColor: `${color}28`,
                borderColor: `${color}66`,
              },
              pressed && styles.pressed,
            ]}
          >
            {isActive ? (
              <Check size={11} color={color} strokeWidth={3} />
            ) : null}
            <Text style={[styles.catPillText, isActive && { color }]}>{c}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

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
          style={({ pressed }) => [styles.iconBtnSm, pressed && styles.pressed]}
        >
          <X size={15} color="rgba(255,255,255,0.75)" />
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function SubmitBtn({
  color,
  label,
  onClick,
  disabled,
  loading,
}: {
  color: string;
  label: string;
  onClick: () => void;
  disabled: boolean;
  loading?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={{ transform: [{ scale }], marginTop: 12 }}>
      <Pressable
        onPress={onClick}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        style={[styles.submitOuter, isDisabled && styles.submitDisabled]}
      >
        <LinearGradient
          colors={
            isDisabled
              ? ["#1E1E2F", "#16162A"]
              : [`${color}`, `${color}CC`, `${color}AA`]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.submitGradient}
        >
          {loading ? <LoadingSpinner color="#fff" /> : null}
          <Text style={styles.submitText}>
            {loading ? "Publication en cours…" : label}
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
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

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput("");
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

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
              <Pressable onPress={() => removeTag(tag)} hitSlop={6}>
                <X size={12} color={color} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={addTag}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          style={styles.fieldInput}
        />
        <Pressable
          onPress={addTag}
          disabled={!input.trim()}
          hitSlop={8}
          style={({ pressed }) => [
            styles.tagAdd,
            pressed && styles.pressed,
            !input.trim() && { opacity: 0.4 },
          ]}
        >
          <Plus size={16} color={color} />
        </Pressable>
      </View>
    </View>
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

  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    city: "",
    country: "Congo",
    salaryMin: "",
    salaryMax: "",
    currency: "USD",
    contractType: "cdi",
    remote: false,
    skills: [] as string[],
    benefits: [] as string[],
    contactEmail: "",
    contactPhone: "",
    deadline: "",
  });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const setField = (key: keyof typeof form) => (value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const detectLocation = useCallback(() => {
    if (!isBrowser || !("geolocation" in navigator)) {
      toast.error("Géolocalisation non supportée");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          );
          const data = (await res.json()) as {
            address?: {
              city?: string;
              town?: string;
              village?: string;
              suburb?: string;
              state?: string;
              country?: string;
            };
          };
          const addr = data.address;
          const place =
            addr?.city ??
            addr?.town ??
            addr?.village ??
            addr?.suburb ??
            addr?.state ??
            "";
          const country = addr?.country ?? "";
          setField("city")(place);
          if (country) setField("country")(country);
          toast.success("Position détectée !");
        } catch {
          setField("city")(
            `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          );
        }
        setLocating(false);
      },
      () => {
        toast.error("Impossible de détecter la position");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.company || !form.description || !form.city) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      await createJob({
        title: form.title,
        description: form.description,
        company: form.company,
        category: form.contractType,
        contractType: form.contractType as any,
        salaryMin: form.salaryMin ? parseFloat(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? parseFloat(form.salaryMax) : undefined,
        currency: form.currency || "USD",
        city: form.city,
        remote: form.remote,
        skills: form.skills,
        deadline: form.deadline || undefined,
      });
      toast.success("Offre d'emploi publiée !");
      onClose();
    } catch {
      toast.error("Erreur lors de la publication");
    } finally {
      setLoading(false);
    }
  };

  const contractTypes = [
    { label: "CDI", value: "cdi" },
    { label: "CDD", value: "cdd" },
    { label: "Stage", value: "stage" },
    { label: "Freelance", value: "freelance" },
    { label: "Alternance", value: "alternance" },
    { label: "Bénévole", value: "benevole" },
  ];

  const currencies = ["USD", "EUR", "CDF", "CFA"];

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
        onChange={setField("title")}
      />
      <FieldInput
        icon={Users}
        color={color}
        placeholder="Nom de l'entreprise *"
        value={form.company}
        onChange={setField("company")}
      />
      <FieldTextarea
        icon={FileText}
        color={color}
        placeholder="Description du poste *"
        value={form.description}
        onChange={setField("description")}
      />

      <View style={styles.fieldShell}>
        <MapPin size={14} color={color} />
        <TextInput
          value={form.city}
          onChangeText={setField("city")}
          placeholder="Ville *"
          placeholderTextColor="rgba(255,255,255,0.3)"
          style={styles.fieldInput}
        />
        <Pressable
          onPress={detectLocation}
          disabled={locating}
          hitSlop={8}
          style={{ opacity: locating ? 0.5 : 1 }}
        >
          {locating ? (
            <LoadingSpinner color={color} size={14} />
          ) : (
            <LocateFixed size={14} color={color} />
          )}
        </Pressable>
      </View>

      <FieldInput
        icon={Globe}
        color={color}
        placeholder="Pays"
        value={form.country}
        onChange={setField("country")}
      />

      <View style={{ gap: 8, marginTop: 4 }}>
        <FieldInput
          icon={Tag}
          color={color}
          placeholder="Salaire min"
          value={form.salaryMin}
          onChange={setField("salaryMin")}
        />
        <FieldInput
          icon={Tag}
          color={color}
          placeholder="Salaire max"
          value={form.salaryMax}
          onChange={setField("salaryMax")}
        />
        <View style={styles.currencyRow}>
          {currencies.map((c) => {
            const isActive = form.currency === c;
            return (
              <Pressable
                key={c}
                onPress={() => setField("currency")(c)}
                style={[
                  styles.currencyPill,
                  isActive && {
                    backgroundColor: `${color}28`,
                    borderColor: `${color}66`,
                  },
                ]}
              >
                <Text style={[styles.currencyPillText, isActive && { color }]}>
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.catsRow}>
        {contractTypes.map((ct) => {
          const isActive = form.contractType === ct.value;
          return (
            <Pressable
              key={ct.value}
              onPress={() => setField("contractType")(ct.value)}
              style={[
                styles.catPill,
                isActive && {
                  backgroundColor: `${color}28`,
                  borderColor: `${color}66`,
                },
              ]}
            >
              <Text style={[styles.catPillText, isActive && { color }]}>
                {ct.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => setField("remote")(!form.remote)}
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
        onChange={setField("skills")}
        placeholder="Compétences (ex: React, Node.js…)"
        color={color}
      />

      <TagsInput
        value={form.benefits}
        onChange={setField("benefits")}
        placeholder="Avantages (ex: Mutuelle, Tickets resto…)"
        color={color}
      />

      <FieldInput
        icon={Mail}
        color={color}
        placeholder="Email de contact"
        value={form.contactEmail}
        onChange={setField("contactEmail")}
      />

      <FieldInput
        icon={Phone}
        color={color}
        placeholder="Téléphone de contact"
        value={form.contactPhone}
        onChange={setField("contactPhone")}
      />

      <View style={styles.fieldShell}>
        <CalendarIcon size={14} color={color} />
        <TextInput
          value={form.deadline}
          onChangeText={setField("deadline")}
          placeholder="Date limite (AAAA-MM-JJ)"
          placeholderTextColor="rgba(255,255,255,0.3)"
          style={styles.fieldInput}
        />
      </View>

      <SubmitBtn
        color={color}
        label="Publier l'offre"
        onPress={handleSubmit}
        disabled={
          !form.title || !form.company || !form.description || !form.city
        }
        loading={loading}
      />
    </FormWrapper>
  );
}

/* ============================================================================
 * GENERIC FORM
 * ========================================================================== */

function GenericForm({
  type,
  color,
  cats,
  titlePlaceholder,
  descPlaceholder,
  pricePlaceholder,
  submitLabel,
  onBack,
  onClose,
  createFn,
}: {
  type: ExtendedPublicationType;
  color: string;
  cats: string[];
  titlePlaceholder: string;
  descPlaceholder: string;
  pricePlaceholder: string;
  submitLabel: string;
  onBack: () => void;
  onClose: () => void;
  createFn: any;
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
  const [locating, setLocating] = useState(false);

  const set = (k: keyof FormState) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const detectLocation = useCallback(() => {
    if (!isBrowser || !("geolocation" in navigator)) {
      toast.error("Géolocalisation non supportée");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          );
          const data = (await res.json()) as {
            address?: {
              city?: string;
              town?: string;
              village?: string;
              suburb?: string;
              state?: string;
              country?: string;
            };
          };
          const addr = data.address;
          const place =
            addr?.city ??
            addr?.town ??
            addr?.village ??
            addr?.suburb ??
            addr?.state ??
            "";
          const country = addr?.country ?? "";
          set("location")(
            place
              ? `${place}, ${country}`
              : `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          );
          toast.success("Position détectée !");
        } catch {
          set("location")(
            `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          );
        }
        setLocating(false);
      },
      () => {
        toast.error("Impossible de détecter la position");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.description) return;
    setLoading(true);
    try {
      const meta: any = {};
      if (type === "annonce" && form.condition) meta.condition = form.condition;
      if (form.contact) meta.contact = form.contact;

      await createFn({
        type: type as any,
        title: form.title,
        description: form.description,
        price: form.price || undefined,
        location: form.location || undefined,
        category: form.category || undefined,
        images,
        tags: form.category ? [form.category.toLowerCase()] : [],
        meta: Object.keys(meta).length > 0 ? JSON.stringify(meta) : undefined,
      });
      toast.success("Publication créée avec succès !");
      onClose();
    } catch {
      toast.error("Erreur lors de la publication. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const optionConfig = CREATE_OPTIONS.find((o) => o.id === type);

  return (
    <FormWrapper
      title={optionConfig?.label ?? "Créer"}
      color={color}
      onBack={onBack}
      onClose={onClose}
    >
      <CategoryPills
        cats={cats}
        active={form.category}
        color={color}
        onChange={set("category")}
      />

      <FieldInput
        icon={Tag}
        color={color}
        placeholder={titlePlaceholder}
        value={form.title}
        onChange={set("title")}
      />
      <FieldTextarea
        icon={FileText}
        color={color}
        placeholder={descPlaceholder}
        value={form.description}
        onChange={set("description")}
      />

      <AIWriteAssist
        contentType={AI_CONTENT_TYPE_MAP[type]}
        topic={form.title}
        onGenerated={(text) => set("description")(text)}
        description={form.description}
        onTagsSuggested={(_tags: any) => {}}
        category={form.category || undefined}
        color={color}
      />

      <ImageUploader images={images} onChange={setImages} color={color} />

      <FieldInput
        icon={Tag}
        color={color}
        placeholder={pricePlaceholder}
        value={form.price}
        onChange={set("price")}
      />

      <View style={styles.fieldShell}>
        <MapPin size={14} color={color} />
        <TextInput
          value={form.location}
          onChangeText={set("location")}
          placeholder="Localisation (ville, quartier)"
          placeholderTextColor="rgba(255,255,255,0.3)"
          style={styles.fieldInput}
        />
        <Pressable
          onPress={detectLocation}
          disabled={locating}
          hitSlop={8}
          style={{ opacity: locating ? 0.5 : 1 }}
        >
          {locating ? (
            <LoadingSpinner color={color} size={14} />
          ) : (
            <LocateFixed size={14} color={color} />
          )}
        </Pressable>
      </View>

      {type === "annonce" ? (
        <View style={styles.fieldShell}>
          <Tag size={14} color={color} />
          <View
            style={{ flex: 1, flexDirection: "row", gap: 6, flexWrap: "wrap" }}
          >
            {[
              { value: "", label: "État (optionnel)" },
              { value: "neuf", label: "Neuf" },
              { value: "comme-neuf", label: "Comme neuf" },
              { value: "tres-bon", label: "Très bon" },
              { value: "bon", label: "Bon" },
              { value: "acceptable", label: "Acceptable" },
            ].map((opt) => {
              const isActive = form.condition === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => set("condition")(opt.value)}
                  style={[
                    styles.currencyPill,
                    isActive && {
                      backgroundColor: `${color}28`,
                      borderColor: `${color}66`,
                    },
                  ]}
                >
                  <Text
                    style={[styles.currencyPillText, isActive && { color }]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <FieldInput
        icon={Tag}
        color={color}
        placeholder="Contact (téléphone / email)"
        value={form.contact}
        onChange={set("contact")}
      />

      <SubmitBtn
        color={color}
        label={submitLabel}
        onPress={handleSubmit}
        disabled={!form.title || !form.description}
        loading={loading}
      />
    </FormWrapper>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function CreateBottomSheet({
  isOpen,
  onClose,
}: CreateBottomSheetProps) {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const { isAuthenticated } = useFirebaseAuth();
  const createPublication = useMutation(api.publications.createPublication);

  const [activeType, setActiveType] = useState<ExtendedPublicationType | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<ExtendedPublicationType[]>(() =>
    getCreationHistory(),
  );
  const [aiMode, setAiMode] = useState(false);
  const [mounted, setMounted] = useState(isOpen);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  /* ─── entrance / exit ─── */
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      backdropAnim.setValue(0);
      slideAnim.setValue(0);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* ─── reset on open ─── */
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setActiveType(null);
      setAiMode(false);
    }
  }, [isOpen]);

  /* ─── web keyboard ─── */
  useEffect(() => {
    if (!isOpen || !isBrowser) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === "Escape") {
        if (activeType || aiMode) {
          setActiveType(null);
          setAiMode(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, activeType, aiMode, onClose]);

  /* ─── actions ─── */
  const handleSelectType = useCallback((id: ExtendedPublicationType) => {
    addToHistory(id);
    setHistory(getCreationHistory());
    setAiMode(false);
    setActiveType(id);
  }, []);

  const handleClose = useCallback(() => {
    setActiveType(null);
    setAiMode(false);
    onClose();
  }, [onClose]);

  const handleBackToHub = useCallback(() => {
    setActiveType(null);
    setAiMode(false);
    setSearchQuery("");
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return CREATE_OPTIONS;
    const q = searchQuery.toLowerCase().trim();
    return CREATE_OPTIONS.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.desc.toLowerCase().includes(q) ||
        opt.keywords?.some((kw) => kw.toLowerCase().includes(q)),
    );
  }, [searchQuery]);

  const activeOption = activeType
    ? CREATE_OPTIONS.find((o) => o.id === activeType)
    : null;

  const formConfig: Record<
    Exclude<ExtendedPublicationType, "transport" | "voyages">,
    {
      cats: string[];
      titlePlaceholder: string;
      descPlaceholder: string;
      pricePlaceholder: string;
      submitLabel: string;
    }
  > = {
    immo: {
      cats: IMMO_CATS,
      titlePlaceholder: "Titre de l'annonce",
      descPlaceholder: "Décrivez le bien (surface, état, équipements…)",
      pricePlaceholder: "Prix ou loyer",
      submitLabel: "Publier l'annonce",
    },
    job: {
      cats: [],
      titlePlaceholder: "",
      descPlaceholder: "",
      pricePlaceholder: "",
      submitLabel: "",
    },
    service: {
      cats: SERVICE_CATS,
      titlePlaceholder: "Nom du service",
      descPlaceholder: "Décrivez votre service…",
      pricePlaceholder: "Tarif",
      submitLabel: "Publier le service",
    },
    evenement: {
      cats: EVENT_CATS,
      titlePlaceholder: "Nom de l'événement",
      descPlaceholder: "Programme, intervenants…",
      pricePlaceholder: "Prix d'entrée",
      submitLabel: "Publier l'événement",
    },
    community: {
      cats: COMMUNITY_CATS,
      titlePlaceholder: "Titre du post",
      descPlaceholder: "Quoi de neuf ?",
      pricePlaceholder: "Lien (optionnel)",
      submitLabel: "Publier le post",
    },
    agri: {
      cats: AGRI_CATS,
      titlePlaceholder: "Produit agricole",
      descPlaceholder: "Quantité, qualité…",
      pricePlaceholder: "Prix",
      submitLabel: "Publier l'offre agri",
    },
    sante: {
      cats: SANTE_CATS,
      titlePlaceholder: "Service de santé",
      descPlaceholder: "Spécialité, disponibilités…",
      pricePlaceholder: "Tarif consultation",
      submitLabel: "Publier l'annonce santé",
    },
    annonce: {
      cats: ANNONCE_CATS,
      titlePlaceholder: "Titre de l'annonce",
      descPlaceholder: "État, caractéristiques…",
      pricePlaceholder: "Prix demandé",
      submitLabel: "Publier l'annonce",
    },
    restauration: {
      cats: RESTO_CATS,
      titlePlaceholder: "Nom du restaurant / plat",
      descPlaceholder: "Menu, spécialités…",
      pricePlaceholder: "Fourchette de prix",
      submitLabel: "Publier la fiche",
    },
    hebergement: {
      cats: HEBERG_CATS,
      titlePlaceholder: "Nom de l'hébergement",
      descPlaceholder: "Équipements, règlement…",
      pricePlaceholder: "Tarif",
      submitLabel: "Publier l'hébergement",
    },
    energie: {
      cats: ENERGIE_CATS,
      titlePlaceholder: "Produit / service énergie",
      descPlaceholder: "Caractéristiques, puissance…",
      pricePlaceholder: "Prix ou devis",
      submitLabel: "Publier l'offre énergie",
    },
    ong: {
      cats: ONG_CATS,
      titlePlaceholder: "Nom de la campagne",
      descPlaceholder: "Objectif, bénéficiaires…",
      pricePlaceholder: "Objectif collecte",
      submitLabel: "Lancer la campagne",
    },
    video: {
      cats: VIDEO_CATS,
      titlePlaceholder: "Titre de la vidéo",
      descPlaceholder: "Décrivez votre vidéo…",
      pricePlaceholder: "Lien vidéo",
      submitLabel: "Publier la vidéo",
    },
    article: {
      cats: ARTICLE_CATS_FORM,
      titlePlaceholder: "Titre de l'article",
      descPlaceholder: "Rédigez votre article…",
      pricePlaceholder: "Temps de lecture",
      submitLabel: "Publier l'article",
    },
    sondage: {
      cats: SONDAGE_CATS,
      titlePlaceholder: "Question du sondage",
      descPlaceholder: "Options (une par ligne)",
      pricePlaceholder: "Durée",
      submitLabel: "Lancer le sondage",
    },
    marketplace: {
      cats: MARKETPLACE_CATS,
      titlePlaceholder: "Nom du produit",
      descPlaceholder: "Décrivez votre produit…",
      pricePlaceholder: "Prix",
      submitLabel: "Publier le produit",
    },
    network: {
      cats: [],
      titlePlaceholder: "",
      descPlaceholder: "",
      pricePlaceholder: "",
      submitLabel: "",
    },
  };

  const renderActiveForm = () => {
    if (!activeType) return null;
    const color = activeOption?.color ?? "#8B5CF6";

    if (activeType === "job") {
      return (
        <JobForm onBack={handleBackToHub} onClose={handleClose} color={color} />
      );
    }
    if (activeType === "article") {
      return <ArticleForm onBack={handleBackToHub} onClose={handleClose} />;
    }
    if (activeType === "immo") {
      return (
        <CreatePropertySheet
          onClose={handleClose}
          onSuccess={() => {
            toast.success("Bien publié !");
            handleClose();
          }}
        />
      );
    }
    if (activeType === "annonce") {
      return (
        <CreateAnnonceSheet
          isOpen={true}
          onClose={handleClose}
          onSuccess={() => {
            toast.success("Annonce publiée !");
            handleClose();
          }}
        />
      );
    }
    if (activeType === "service") {
      return (
        <CreateServiceSheet
          isOpen={true}
          onClose={handleClose}
          onSuccess={() => {
            toast.success("Service publié !");
            handleClose();
          }}
        />
      );
    }
    if (activeType === "community") {
      return (
        <CreatePostSheet
          isOpen={true}
          onClose={handleClose}
          onSuccess={() => {
            toast.success("Post publié !");
            handleClose();
          }}
        />
      );
    }
    if (activeType === "evenement") {
      return (
        <CreateEventSheet
          onClose={handleClose}
          onSuccess={() => {
            toast.success("Événement créé !");
            handleClose();
          }}
        />
      );
    }
    if (activeType === "marketplace") {
      return (
        <CreateProductSheet
          isOpen={true}
          onClose={handleClose}
          onSuccess={() => {
            toast.success("Produit publié !");
            handleClose();
          }}
        />
      );
    }
    if (activeType === "sante") {
      return (
        <CreateHealthSheet
          onClose={handleClose}
          onSuccess={() => {
            toast.success("Annonce santé publiée !");
            handleClose();
          }}
        />
      );
    }
    if (activeType === "transport") {
      return (
        <CreateTransportSheet
          open={true}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
          onSuccess={() => {
            toast.success("Trajet publié !");
            handleClose();
          }}
        />
      );
    }
    if (activeType === "restauration") {
      return (
        <CreateRestaurantSheet
          open={true}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
          onSuccess={() => {
            toast.success("Restaurant ajouté !");
            handleClose();
          }}
        />
      );
    }
    if (activeType === "hebergement") {
      return (
        <CreateAccommodationSheet
          open={true}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
          onSuccess={() => {
            toast.success("Hébergement ajouté !");
            handleClose();
          }}
        />
      );
    }
    if (activeType === "agri") {
      return (
        <CreateAgriSheet
          open={true}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
          onSuccess={() => {
            toast.success("Produit agricole publié !");
            handleClose();
          }}
        />
      );
    }
    if (activeType === "network") {
      return (
        <CreateNetworkSheet
          isOpen={true}
          onClose={handleClose}
          onSuccess={() => {
            toast.success("Publication réseau créée !");
            handleClose();
          }}
        />
      );
    }
    if (activeType === "voyages") {
      return (
        <CreateVoyageSheet
          isOpen={true}
          onClose={handleClose}
          onSuccess={() => {
            toast.success("Voyage créé !");
            handleClose();
          }}
        />
      );
    }

    return (
      <GenericForm
        type={activeType}
        color={color}
        createFn={createPublication}
        onBack={handleBackToHub}
        onClose={handleClose}
        {...formConfig[
          activeType as Exclude<
            ExtendedPublicationType,
            "transport" | "voyages"
          >
        ]}
      />
    );
  };

  if (!mounted) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable
          onPress={handleClose}
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Fermer"
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            maxHeight: Math.min(SCREEN_HEIGHT * 0.92, 980),
            transform: [{ translateY }],
          },
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

        {/* Handle */}
        <View style={styles.handleWrap}>
          <View style={styles.handleBar} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!isAuthenticated ? (
            <NotAuthenticatedView onClose={handleClose} />
          ) : (
            <>
              {/* ───── HUB ───── */}
              {!activeType && !aiMode ? (
                <View style={styles.hubWrap}>
                  <View style={styles.hubHeader}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
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
                      onPress={handleClose}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.iconBtnSm,
                        pressed && styles.pressed,
                      ]}
                    >
                      <X size={16} color="rgba(255,255,255,0.75)" />
                    </Pressable>
                  </View>

                  <CreateHero onAI={() => setAiMode(true)} />

                  <CreateSearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    inputRef={searchInputRef}
                  />

                  {!searchQuery.trim() ? (
                    <CreateQuickActions
                      history={history}
                      onSelect={handleSelectType}
                    />
                  ) : null}

                  {searchQuery.trim() ? (
                    <FadeUp>
                      <View style={styles.resultsRow}>
                        <Compass size={13} color="#67E8F9" />
                        <Text style={styles.resultsText}>
                          {filteredOptions.length} résultat
                          {filteredOptions.length > 1 ? "s" : ""} pour{" "}
                          <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                            “{searchQuery}”
                          </Text>
                        </Text>
                      </View>
                    </FadeUp>
                  ) : null}

                  {filteredOptions.length > 0 ? (
                    <CreateGroupedGrid
                      options={filteredOptions}
                      onSelect={handleSelectType}
                    />
                  ) : (
                    <FadeUp>
                      <View style={styles.noResultCard}>
                        <View style={styles.noResultIcon}>
                          <Search size={18} color="rgba(255,255,255,0.4)" />
                        </View>
                        <Text style={styles.noResultTitle}>Aucun résultat</Text>
                        <Text style={styles.noResultSub}>
                          Essayez un autre mot ou demandez à l'assistant.
                        </Text>
                        <Pressable
                          onPress={() => setAiMode(true)}
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

                  {history.length > 0 && !searchQuery.trim() ? (
                    <CreateRecent
                      history={history}
                      onSelect={handleSelectType}
                    />
                  ) : null}
                </View>
              ) : null}

              {/* ───── AI MODE ───── */}
              {aiMode && !activeType ? (
                <View style={styles.aiWrap}>
                  <View style={styles.hubHeader}>
                    <Pressable
                      onPress={handleBackToHub}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.backRow,
                        pressed && styles.pressed,
                      ]}
                    >
                      <ArrowLeft size={16} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.backRowText}>Retour</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleClose}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.iconBtnSm,
                        pressed && styles.pressed,
                      ]}
                    >
                      <X size={16} color="rgba(255,255,255,0.75)" />
                    </Pressable>
                  </View>

                  <FadeUp>
                    <View style={styles.aiCard}>
                      <LinearGradient
                        colors={[
                          "rgba(139,92,246,0.18)",
                          "rgba(99,102,241,0.06)",
                          "rgba(15,7,32,0.85)",
                        ]}
                        locations={[0, 0.5, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.aiBorder} pointerEvents="none" />

                      <View style={{ alignItems: "center" }}>
                        <LinearGradient
                          colors={["#A78BFA", "#7C3AED", "#6366F1"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.aiIconBig}
                        >
                          <Sparkles size={23} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.aiTitle}>
                          Dites-moi ce que vous voulez faire.
                        </Text>
                        <Text style={styles.aiSub}>
                          Pas besoin de connaître le bon module. Décrivez
                          simplement votre objectif.
                        </Text>
                      </View>

                      <View style={styles.aiInputWrap}>
                        <TextInput
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          autoFocus
                          placeholder={`Ex. « Je veux vendre ma maison à Kinshasa »\nEx. « Je cherche un chauffeur »\nEx. « Je veux publier mon service de plomberie »`}
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          style={styles.aiInput}
                          multiline
                          textAlignVertical="top"
                        />
                      </View>

                      <Text style={styles.aiHint}>
                        L'assistant de création vous aidera à choisir le bon
                        espace.
                      </Text>

                      <Pressable
                        disabled={!searchQuery.trim()}
                        onPress={() => {
                          const q = searchQuery.toLowerCase();
                          const match = CREATE_OPTIONS.find((opt) =>
                            opt.keywords.some((kw) => q.includes(kw)),
                          );
                          if (match) {
                            handleSelectType(match.id);
                          } else {
                            toast.info(
                              "Choisissez une catégorie dans le hub pour continuer.",
                            );
                            setAiMode(false);
                          }
                        }}
                        style={({ pressed }) => [
                          styles.aiSubmitOuter,
                          !searchQuery.trim() && { opacity: 0.4 },
                          pressed && styles.pressed,
                        ]}
                      >
                        <LinearGradient
                          colors={["#A78BFA", "#7C3AED", "#6366F1"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.aiSubmit}
                        >
                          <Wand2 size={16} color="#fff" />
                          <Text style={styles.aiSubmitText}>
                            Trouver le meilleur espace
                          </Text>
                          <ArrowRight size={16} color="#fff" />
                        </LinearGradient>
                      </Pressable>
                    </View>
                  </FadeUp>
                </View>
              ) : null}

              {/* ───── ACTIVE FORM ───── */}
              {activeType ? (
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
                        onPress={handleBackToHub}
                        hitSlop={8}
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
                          <View style={{ flex: 1, minWidth: 0 }}>
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
                        onPress={handleClose}
                        hitSlop={8}
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
              ) : null}
            </>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/* ============================================================================
 * NOT AUTHENTICATED
 * ========================================================================== */

function NotAuthenticatedView({ onClose }: { onClose: () => void }) {
  return (
    <FadeUp>
      <View style={styles.notAuthWrap}>
        <View style={{ alignItems: "flex-end", marginBottom: 8 }}>
          <Pressable
            onPress={onClose}
            hitSlop={8}
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
            "rgba(15,7,32,0.85)",
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

          <View style={{ marginTop: 24, width: "100%", alignItems: "center" }}>
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
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },

  ambientOrb: { position: "absolute", borderRadius: 9999 },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,2,12,0.76)",
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    backgroundColor: "#0A0818",
    shadowColor: "#000",
    shadowOpacity: 0.75,
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
    backgroundColor: "rgba(129,140,248,0.35)",
    zIndex: 30,
  },

  borderRing: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.15)",
    zIndex: 25,
  },

  handleWrap: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 6,
    zIndex: 10,
  },
  handleBar: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },

  // Hub
  hubWrap: { maxWidth: 900, width: "100%", alignSelf: "center" },
  hubHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
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
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  hubTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  hubSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
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

  // Hero
  heroCard: {
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  heroTopLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
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
    backgroundColor: "rgba(139,92,246,0.35)",
  },
  heroOrb2: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 999,
    bottom: -60,
    left: -40,
    backgroundColor: "rgba(14,165,233,0.28)",
  },
  heroHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
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
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
    lineHeight: 30,
  },
  heroSub: {
    marginTop: 8,
    maxWidth: 460,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "500",
  },
  heroWandWrap: {
    shadowColor: "#6366F1",
    shadowOpacity: 0.7,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  heroWand: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  heroAIButtonOuter: {
    marginTop: 20,
    borderRadius: 18,
    overflow: "hidden",
  },
  heroAIButtonGradient: {
    padding: 1,
    borderRadius: 18,
  },
  heroAIButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 17,
    backgroundColor: "#101022",
  },
  heroAIIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.2)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
  },
  heroAITitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.2,
  },
  heroAISub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
  },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    marginBottom: 20,
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

  // Section headers
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
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

  // Quick actions
  quickActionCard: {
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
  quickActionTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.2,
  },
  quickActionSub: {
    marginTop: 2,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },

  // Recent
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
    fontSize: 11.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
  },

  // Grouped grid
  groupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  groupIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  groupTitle: {
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
  },
  groupCount: {
    marginTop: 2,
    fontSize: 9.5,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "600",
  },

  gridCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  gridCardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
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
    letterSpacing: -0.2,
  },
  gridCardSub: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 15,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },

  // Results header
  resultsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
  },

  // No results
  noResultCard: {
    padding: 28,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
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
    color: "rgba(255,255,255,0.85)",
  },
  noResultSub: {
    marginTop: 6,
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    fontWeight: "500",
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
    shadowColor: "#6366F1",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  noResultBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
  },

  // AI mode
  aiWrap: { maxWidth: 700, width: "100%", alignSelf: "center" },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backRowText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
  },
  aiCard: {
    borderRadius: 28,
    padding: 24,
    overflow: "hidden",
    backgroundColor: "rgba(12,8,28,0.65)",
  },
  aiBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
  },
  aiIconBig: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#6366F1",
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  aiTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.8,
    textAlign: "center",
    lineHeight: 28,
  },
  aiSub: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    fontWeight: "500",
  },
  aiInputWrap: {
    marginTop: 24,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    minHeight: 110,
  },
  aiInput: {
    fontSize: 13.5,
    lineHeight: 20,
    color: "#fff",
    minHeight: 80,
    fontWeight: "500",
  },
  aiHint: {
    marginTop: 12,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    fontWeight: "500",
  },
  aiSubmitOuter: {
    marginTop: 20,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  aiSubmit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
  },
  aiSubmitText: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },

  // Active form wrapper
  activeFormWrap: { maxWidth: 720, width: "100%", alignSelf: "center" },
  activeFormHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    marginBottom: 16,
  },
  activeFormIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  activeFormTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.2,
  },
  activeFormSub: {
    marginTop: 2,
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },

  // Form header
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
    letterSpacing: -0.2,
  },

  // Fields
  fieldShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.045)",
    marginBottom: 8,
  },
  fieldInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 13.5,
    color: "#fff",
    paddingVertical: 0,
    fontWeight: "500",
  },

  // Categories
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
    letterSpacing: 0.2,
  },

  // Currency pills
  currencyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
    letterSpacing: 0.3,
  },

  // Checkbox
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginVertical: 8,
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

  // Tags
  tagsShell: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.045)",
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
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

  // Submit
  submitOuter: {
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  submitText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },

  // Not authenticated
  notAuthWrap: { maxWidth: 560, width: "100%", alignSelf: "center" },
  notAuthCard: {
    borderRadius: 30,
    padding: 28,
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "rgba(12,8,28,0.6)",
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
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.6,
    lineHeight: 28,
  },
  notAuthSub: {
    marginTop: 10,
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 19,
  },
});

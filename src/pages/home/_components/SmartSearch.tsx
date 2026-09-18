// src/pages/home/_components/SmartSearch.tsx

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
  Modal,
  Keyboard,
  useWindowDimensions,
  type GestureResponderEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Search,
  Mic,
  X,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Home,
  Briefcase,
  Stethoscope,
  Leaf,
  Newspaper,
  Calendar,
  Plane,
  ChevronRight,
  Sparkles,
  Package,
  LayoutGrid,
  Heart,
  BookOpen,
  Wallet,
  Users,
  Radio,
} from "lucide-react-native";

const isBrowser = typeof window !== "undefined";

/* ============================================================
 * TYPES
 * ============================================================ */

type ResultCategory =
  | "Immo"
  | "Jobs/Pro"
  | "Santé"
  | "Agri"
  | "Media"
  | "Événements"
  | "Voyages"
  | "Modules"
  | "Bien-être"
  | "Éducation"
  | "Finance"
  | "Communauté"
  | "Services";

interface SearchResult {
  id: string;
  category: ResultCategory;
  title: string;
  subtitle: string;
  meta: string;
  badge?: string;
  badgeColor?: string;
  page: string;
}

/* ============================================================
 * MODULE DIRECTORY
 * ============================================================ */

const MODULE_ENTRIES: SearchResult[] = [
  {
    id: "mod-immo",
    category: "Modules",
    title: "Immobilier",
    subtitle: "Locations, ventes, terrains",
    meta: "→ Ouvrir",
    badge: "Immo",
    badgeColor: "#34D399",
    page: "immo",
  },
  {
    id: "mod-logement",
    category: "Modules",
    title: "Logement social",
    subtitle: "Programmes sociaux & coopératives",
    meta: "→ Ouvrir",
    badge: "Logement",
    badgeColor: "#34D399",
    page: "logement",
  },
  {
    id: "mod-hebergement",
    category: "Modules",
    title: "Hébergement",
    subtitle: "Hôtels, AirBnB, auberges",
    meta: "→ Ouvrir",
    badge: "Hôtels",
    badgeColor: "#34D399",
    page: "hebergement",
  },
  {
    id: "mod-jobs",
    category: "Modules",
    title: "Emploi & Jobs",
    subtitle: "Offres d'emploi & recrutement",
    meta: "→ Ouvrir",
    badge: "Emploi",
    badgeColor: "#A78BFA",
    page: "jobs",
  },
  {
    id: "mod-marketplace",
    category: "Modules",
    title: "Marketplace",
    subtitle: "Achat & vente entre particuliers",
    meta: "→ Ouvrir",
    badge: "Market",
    badgeColor: "#F472B6",
    page: "marketplace",
  },
  {
    id: "mod-annonces",
    category: "Modules",
    title: "Annonces",
    subtitle: "Petites annonces & offres locales",
    meta: "→ Ouvrir",
    badge: "Annonces",
    badgeColor: "#FBBF24",
    page: "annonces",
  },
  {
    id: "mod-sante",
    category: "Modules",
    title: "Santé",
    subtitle: "Médecins, pharmacies, téléconsultation",
    meta: "→ Ouvrir",
    badge: "Santé",
    badgeColor: "#F87171",
    page: "sante",
  },
  {
    id: "mod-agri",
    category: "Modules",
    title: "Agriculture",
    subtitle: "Intrants, prix, alertes phytosanitaires",
    meta: "→ Ouvrir",
    badge: "Agri",
    badgeColor: "#A3E635",
    page: "agri",
  },
  {
    id: "mod-services",
    category: "Modules",
    title: "Services à la Personne",
    subtitle: "Aide à domicile, nettoyage, bricolage",
    meta: "→ Ouvrir",
    badge: "Services",
    badgeColor: "#818CF8",
    page: "services",
  },
  {
    id: "mod-evenements",
    category: "Modules",
    title: "Événements",
    subtitle: "Concerts, foires, sorties",
    meta: "→ Ouvrir",
    badge: "Events",
    badgeColor: "#F472B6",
    page: "evenements",
  },
  {
    id: "mod-voyages",
    category: "Modules",
    title: "Voyages",
    subtitle: "Billets de voyage inter-villes",
    meta: "→ Ouvrir",
    badge: "Voyages",
    badgeColor: "#818CF8",
    page: "voyages",
  },
  {
    id: "mod-apprendre",
    category: "Modules",
    title: "Apprendre",
    subtitle: "Cours en ligne & tutoriels",
    meta: "→ Ouvrir",
    badge: "Learn",
    badgeColor: "#818CF8",
    page: "apprendre",
  },
  {
    id: "mod-paiement",
    category: "Modules",
    title: "Paiements",
    subtitle: "Mobile money, cartes, crypto",
    meta: "→ Ouvrir",
    badge: "Pay",
    badgeColor: "#34D399",
    page: "paiement",
  },
  {
    id: "mod-community",
    category: "Modules",
    title: "Communauté",
    subtitle: "Forum, entraide & réseau local",
    meta: "→ Ouvrir",
    badge: "Community",
    badgeColor: "#F472B6",
    page: "community",
  },
  {
    id: "mod-messages",
    category: "Modules",
    title: "Messages",
    subtitle: "Chat privé & conversations",
    meta: "→ Ouvrir",
    badge: "Chat",
    badgeColor: "#818CF8",
    page: "messages",
  },
  {
    id: "mod-live",
    category: "Modules",
    title: "Live",
    subtitle: "Vidéos en direct & stories",
    meta: "→ Ouvrir",
    badge: "Live",
    badgeColor: "#F87171",
    page: "live",
  },
  {
    id: "mod-profile",
    category: "Modules",
    title: "Mon Profil",
    subtitle: "Votre identité, badge et QR Code",
    meta: "→ Ouvrir",
    badge: "Profil",
    badgeColor: "#A78BFA",
    page: "profile",
  },
];

/* ============================================================
 * SEARCH CONTENT
 * ============================================================ */

const CONTENT_RESULTS: SearchResult[] = [
  {
    id: "i1",
    category: "Immo",
    title: "Maison 3 ch. – Kolwezi",
    subtitle: "Quartier Joli Site",
    meta: "$450/mois",
    badge: "À louer",
    badgeColor: "#34D399",
    page: "immo",
  },
  {
    id: "j1",
    category: "Jobs/Pro",
    title: "Développeur React Senior",
    subtitle: "TechAfrique – Dakar",
    meta: "2 500 000 FCFA/mois",
    badge: "Urgent",
    badgeColor: "#F87171",
    page: "jobs",
  },
  {
    id: "j2",
    category: "Jobs/Pro",
    title: "Soudeur Métal expérimenté",
    subtitle: "Kolwezi Industries",
    meta: "$600/mois",
    badge: "CDI",
    badgeColor: "#34D399",
    page: "jobs",
  },
  {
    id: "s1",
    category: "Santé",
    title: "Consultation générale",
    subtitle: "Téléconsultation",
    meta: "Disponible",
    badge: "Santé",
    badgeColor: "#F87171",
    page: "sante",
  },
  {
    id: "a1",
    category: "Agri",
    title: "Sac de maïs 50kg",
    subtitle: "Agriculture",
    meta: "Stock disponible",
    badge: "Agri",
    badgeColor: "#A3E635",
    page: "agri",
  },
  {
    id: "e1",
    category: "Événements",
    title: "Événements à proximité",
    subtitle: "Concerts, foires, sorties",
    meta: "À découvrir",
    badge: "Events",
    badgeColor: "#F472B6",
    page: "evenements",
  },
  {
    id: "v1",
    category: "Voyages",
    title: "Voyages inter-villes",
    subtitle: "Transport & destinations",
    meta: "Réserver",
    badge: "Voyages",
    badgeColor: "#818CF8",
    page: "voyages",
  },
  {
    id: "sv1",
    category: "Services",
    title: "Services à proximité",
    subtitle: "Professionnels & artisans",
    meta: "Explorer",
    badge: "Services",
    badgeColor: "#FBBF24",
    page: "services",
  },
];

const ALL_RESULTS: SearchResult[] = [...MODULE_ENTRIES, ...CONTENT_RESULTS];

const TRENDING = [
  "Appartement",
  "Emploi",
  "Service",
  "Acheter",
  "Vendre",
  "Voyage",
];

const CATEGORY_COLORS: Record<ResultCategory, string> = {
  Immo: "#34D399",
  "Jobs/Pro": "#A78BFA",
  Santé: "#F87171",
  Agri: "#A3E635",
  Media: "#FB923C",
  Événements: "#F472B6",
  Voyages: "#818CF8",
  Modules: "#C4B5FD",
  "Bien-être": "#F9A8D4",
  Éducation: "#22D3EE",
  Finance: "#34D399",
  Communauté: "#FB7185",
  Services: "#FBBF24",
};

/* ============================================================
 * STORAGE
 * ============================================================ */

const HISTORY_KEY = "debrouille_search_history";

const memoryStore: Record<string, string> = {};

const store = {
  get(key: string): string | null {
    if (isBrowser) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }

    return memoryStore[key] ?? null;
  },

  set(key: string, value: string): void {
    if (isBrowser) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Storage unavailable: search remains fully usable in memory.
      }
    } else {
      memoryStore[key] = value;
    }
  },

  remove(key: string): void {
    if (isBrowser) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Storage unavailable.
      }
    } else {
      delete memoryStore[key];
    }
  },
};

function getHistory(): string[] {
  try {
    const raw = store.get(HISTORY_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

function saveHistory(value: string): void {
  const query = value.trim();

  if (!query) {
    return;
  }

  const previous = getHistory().filter((item) => item !== query);
  const next = [query, ...previous].slice(0, 8);

  store.set(HISTORY_KEY, JSON.stringify(next));
}

function removeHistory(value: string): void {
  store.set(
    HISTORY_KEY,
    JSON.stringify(getHistory().filter((item) => item !== value)),
  );
}

/* ============================================================
 * HELPERS
 * ============================================================ */

function normalizeSearchValue(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function categoryFromType(type: unknown): ResultCategory {
  const value = normalizeSearchValue(type);

  if (["job", "emploi", "employment"].includes(value)) {
    return "Jobs/Pro";
  }

  if (
    ["property", "immo", "immobilier", "realestate", "real_estate"].includes(
      value,
    )
  ) {
    return "Immo";
  }

  if (["sante", "health", "medical"].includes(value)) {
    return "Santé";
  }

  if (["agri", "agriculture"].includes(value)) {
    return "Agri";
  }

  if (["evenement", "evenements", "event", "events"].includes(value)) {
    return "Événements";
  }

  if (["voyage", "voyages", "travel"].includes(value)) {
    return "Voyages";
  }

  if (["education", "apprendre", "course", "cours"].includes(value)) {
    return "Éducation";
  }

  if (["finance", "paiement", "wallet", "pay"].includes(value)) {
    return "Finance";
  }

  if (["community", "communaute", "group", "groupe"].includes(value)) {
    return "Communauté";
  }

  if (["service", "services"].includes(value)) {
    return "Services";
  }

  if (["media", "article", "video", "podcast"].includes(value)) {
    return "Media";
  }

  if (
    ["fitness", "sport", "nutrition", "bienetre", "wellness"].includes(value)
  ) {
    return "Bien-être";
  }

  return "Services";
}

function getPageForCategory(category: ResultCategory): string {
  const pages: Partial<Record<ResultCategory, string>> = {
    Immo: "immo",
    "Jobs/Pro": "jobs",
    Santé: "sante",
    Agri: "agri",
    Media: "media",
    Événements: "evenements",
    Voyages: "voyages",
    "Bien-être": "bienetre",
    Éducation: "cours",
    Finance: "finances",
    Communauté: "community",
    Services: "services",
    Modules: "explorer",
  };

  return pages[category] ?? "explorer";
}

function getCategoryIcon(category: ResultCategory, size = 13): ReactNode {
  const props = {
    size,
    color: CATEGORY_COLORS[category],
  };

  switch (category) {
    case "Immo":
      return <Home {...props} />;

    case "Jobs/Pro":
      return <Briefcase {...props} />;

    case "Santé":
      return <Stethoscope {...props} />;

    case "Agri":
      return <Leaf {...props} />;

    case "Media":
      return <Newspaper {...props} />;

    case "Événements":
      return <Calendar {...props} />;

    case "Voyages":
      return <Plane {...props} />;

    case "Modules":
      return <LayoutGrid {...props} />;

    case "Bien-être":
      return <Heart {...props} />;

    case "Éducation":
      return <BookOpen {...props} />;

    case "Finance":
      return <Wallet {...props} />;

    case "Communauté":
      return <Users {...props} />;

    case "Services":
      return <Package {...props} />;

    default:
      return <Search {...props} />;
  }
}

/* ============================================================
 * FADE-UP
 * ============================================================ */

function FadeUp({
  delay = 0,
  distance = 8,
  children,
  style,
}: {
  delay?: number;
  distance?: number;
  children: ReactNode;
  style?: object;
}) {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 380,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animation, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
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

/* ============================================================
 * HOME SEARCH ACTION
 * ============================================================ */

interface HomeAction {
  id: string;
  label: string;
  query: string;
  icon: ReactNode;
}

const HOME_ACTIONS: HomeAction[] = [
  {
    id: "emploi",
    label: "Emploi",
    query: "emploi",
    icon: <Briefcase size={13} color="#A78BFA" strokeWidth={2} />,
  },
  {
    id: "service",
    label: "Service",
    query: "service",
    icon: <Package size={13} color="#FBBF24" strokeWidth={2} />,
  },
  {
    id: "acheter",
    label: "Acheter",
    query: "acheter",
    icon: <LayoutGrid size={13} color="#F472B6" strokeWidth={2} />,
  },
  {
    id: "vendre",
    label: "Vendre",
    query: "vendre",
    icon: <ArrowUpRight size={13} color="#34D399" strokeWidth={2} />,
  },
];

/* ============================================================
 * HOME TRIGGER
 * ============================================================ */

function HomeSearchTrigger({
  onOpen,
  onQuickSearch,
}: {
  onOpen: () => void;
  onQuickSearch: (value: string) => void;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  const sparkleScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <FadeUp delay={120} distance={8} style={styles.homeTriggerWrap}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel="Que veux-tu faire ?"
        accessibilityHint="Ouvre la recherche DébrouillePro"
        style={({ pressed }) => [
          styles.homeSearchCard,
          pressed && styles.homeSearchCardPressed,
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(167,139,250,0.11)",
            "rgba(255,255,255,0.035)",
            "rgba(99,102,241,0.10)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.homeSearchTopRow}>
          <View style={styles.homeSearchIcon}>
            <Search size={17} color="#C4B5FD" strokeWidth={2.4} />
          </View>

          <View style={styles.homeSearchTitleWrap}>
            <Text numberOfLines={1} style={styles.homeSearchTitle}>
              Que veux-tu faire ?
            </Text>

            <Text numberOfLines={1} style={styles.homeSearchHint}>
              Recherche intelligente dans DébrouillePro
            </Text>
          </View>

          <Animated.View
            style={{
              transform: [{ scale: sparkleScale }],
            }}
          >
            <View style={styles.homeSearchSparkle}>
              <Sparkles size={15} color="#C4B5FD" strokeWidth={2} />
            </View>
          </Animated.View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.homeActionRow}
          scrollEnabled
        >
          {HOME_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => onQuickSearch(action.query)}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              style={({ pressed }) => [
                styles.homeActionPill,
                pressed && styles.homeActionPillPressed,
              ]}
            >
              {action.icon}

              <Text style={styles.homeActionText}>{action.label}</Text>
            </Pressable>
          ))}

          <Pressable
            onPress={() => onQuickSearch("annonces")}
            accessibilityRole="button"
            accessibilityLabel="Annonces"
            style={({ pressed }) => [
              styles.homeActionPill,
              pressed && styles.homeActionPillPressed,
            ]}
          >
            <Newspaper size={13} color="#818CF8" strokeWidth={2} />

            <Text style={styles.homeActionText}>Annonces</Text>
          </Pressable>

          <Pressable
            onPress={() => onQuickSearch("voyage")}
            accessibilityRole="button"
            accessibilityLabel="Voyager"
            style={({ pressed }) => [
              styles.homeActionPill,
              pressed && styles.homeActionPillPressed,
            ]}
          >
            <Plane size={13} color="#818CF8" strokeWidth={2} />

            <Text style={styles.homeActionText}>Voyager</Text>
          </Pressable>

          <Pressable
            onPress={onOpen}
            accessibilityRole="button"
            accessibilityLabel="Plus d'actions"
            style={({ pressed }) => [
              styles.homeActionMore,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.homeActionMoreText}>…</Text>
          </Pressable>
        </ScrollView>
      </Pressable>
    </FadeUp>
  );
}

/* ============================================================
 * RESULT ROW
 * ============================================================ */

function ResultRow({
  result,
  index,
  compact = false,
  onSelect,
}: {
  result: SearchResult;
  index: number;
  compact?: boolean;
  onSelect: (result: SearchResult) => void;
}) {
  const color = result.badgeColor ?? CATEGORY_COLORS[result.category];

  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.99,
      useNativeDriver: true,
      speed: 40,
    }).start();
  }, [scale]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  }, [scale]);

  return (
    <FadeUp delay={Math.min(index * 25, 300)} distance={5}>
      <Animated.View
        style={{
          transform: [{ scale }],
        }}
      >
        <Pressable
          onPress={() => onSelect(result)}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityLabel={`${result.title} — ${result.category}`}
          style={[styles.resultRow, compact && styles.resultRowCompact]}
        >
          <LinearGradient
            colors={[`${color}14`, "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View
            style={[
              compact ? styles.resultIconCompact : styles.resultIcon,
              {
                backgroundColor: `${color}22`,
                borderColor: `${color}44`,
              },
            ]}
          >
            {getCategoryIcon(result.category, compact ? 13 : 14)}
          </View>

          <View
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <Text style={styles.resultTitle} numberOfLines={1}>
              {result.title}
            </Text>

            <Text style={styles.resultSubtitle} numberOfLines={1}>
              {result.subtitle}
            </Text>
          </View>

          <View style={styles.resultMetaCol}>
            {result.meta ? (
              <Text style={styles.resultMeta} numberOfLines={1}>
                {result.meta}
              </Text>
            ) : null}

            {result.badge ? (
              <View
                style={[
                  styles.resultBadge,
                  {
                    backgroundColor: `${color}22`,
                  },
                ]}
              >
                {result.badge === "En direct" ? (
                  <Radio size={8} color={color} />
                ) : null}

                <Text
                  style={[styles.resultBadgeText, { color }]}
                  numberOfLines={1}
                >
                  {result.badge}
                </Text>
              </View>
            ) : null}
          </View>

          <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
        </Pressable>
      </Animated.View>
    </FadeUp>
  );
}

/* ============================================================
 * SECTION LABEL
 * ============================================================ */

function SectionLabel({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionLabelRow}>
      {icon}

      <Text style={styles.sectionLabelText}>{children}</Text>
    </View>
  );
}

/* ============================================================
 * COMPONENT
 * ============================================================ */

interface SmartSearchProps {
  onNavigate: (page: string) => void;
  onAdvancedSearch?: () => void;
}

export default function SmartSearch({
  onNavigate,
  onAdvancedSearch,
}: SmartSearchProps) {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [history, setHistory] = useState<string[]>(() => getHistory());
  const [activeCategory, setActiveCategory] = useState<ResultCategory | "Tout">(
    "Tout",
  );
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const backdropAnim = useRef(new Animated.Value(0)).current;

  const panelAnim = useRef(new Animated.Value(0)).current;

  const liveData = useQuery(
    api.search.smartSearch,
    query.trim().length >= 2 ? { query: query.trim() } : "skip",
  );

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    setIsVoiceSupported(
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    );
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    backdropAnim.setValue(0);
    panelAnim.setValue(0);

    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(panelAnim, {
        toValue: 1,
        stiffness: 340,
        damping: 30,
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, backdropAnim, panelAnim]);

  const liveResults = useMemo<SearchResult[]>(() => {
    if (!liveData) {
      return [];
    }

    const mapped: SearchResult[] = [];

    for (const publication of liveData.publications) {
      const category = categoryFromType(publication.type);

      mapped.push({
        id: `live-pub-${publication._id}`,
        category,
        title: publication.title,
        subtitle:
          publication.location ?? publication.type ?? "Contenu DébrouillePro",
        meta: publication.price ?? "",
        badge: "En direct",
        badgeColor: CATEGORY_COLORS[category],
        page: getPageForCategory(category),
      });
    }

    for (const job of liveData.jobs) {
      mapped.push({
        id: `live-job-${job._id}`,
        category: "Jobs/Pro",
        title: job.title,
        subtitle: `${job.company} – ${job.city}`,
        meta: job.contractType.toUpperCase(),
        badge: "En direct",
        badgeColor: CATEGORY_COLORS["Jobs/Pro"],
        page: "jobs",
      });
    }

    for (const property of liveData.properties) {
      mapped.push({
        id: `live-prop-${property._id}`,
        category: "Immo",
        title: property.title,
        subtitle: `${property.type} – ${property.city}`,
        meta: `${property.price.toLocaleString()} FCFA`,
        badge: "En direct",
        badgeColor: CATEGORY_COLORS.Immo,
        page: "immo",
      });
    }

    for (const course of liveData.courses) {
      mapped.push({
        id: `live-course-${course._id}`,
        category: "Éducation",
        title: course.title,
        subtitle: course.category,
        meta: course.isFree
          ? "Gratuit"
          : `${course.price.toLocaleString()} FCFA`,
        badge: "En direct",
        badgeColor: CATEGORY_COLORS.Éducation,
        page: "cours",
      });
    }

    return mapped;
  }, [liveData]);

  const staticResults = useMemo<SearchResult[]>(() => {
    const normalizedQuery = normalizeSearchValue(query);

    if (normalizedQuery.length < 2) {
      return [];
    }

    return ALL_RESULTS.filter((result) => {
      if (activeCategory !== "Tout" && result.category !== activeCategory) {
        return false;
      }

      return [result.title, result.subtitle, result.category, result.badge]
        .filter(Boolean)
        .some((value) => normalizeSearchValue(value).includes(normalizedQuery));
    });
  }, [query, activeCategory]);

  const filteredLiveResults = useMemo(
    () =>
      activeCategory === "Tout"
        ? liveResults
        : liveResults.filter((result) => result.category === activeCategory),
    [activeCategory, liveResults],
  );

  const results = useMemo(
    () => [...filteredLiveResults, ...staticResults],
    [filteredLiveResults, staticResults],
  );

  const grouped = useMemo(
    () =>
      results.reduce<Partial<Record<ResultCategory, SearchResult[]>>>(
        (accumulator, result) => {
          (
            accumulator[result.category] ?? (accumulator[result.category] = [])
          ).push(result);

          return accumulator;
        },
        {},
      ),
    [results],
  );

  const allCategories: (ResultCategory | "Tout")[] = [
    "Tout",
    "Modules",
    "Immo",
    "Jobs/Pro",
    "Santé",
    "Agri",
    "Media",
    "Événements",
    "Voyages",
    "Bien-être",
    "Éducation",
    "Finance",
    "Communauté",
    "Services",
  ];

  const quickModules = MODULE_ENTRIES.slice(0, 12);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(panelAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOpen(false);
      setQuery("");
      setListening(false);
      setActiveCategory("Tout");
      Keyboard.dismiss();
    });
  }, [backdropAnim, panelAnim]);

  const handleOpen = useCallback(() => {
    setOpen(true);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
  }, []);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      saveHistory(result.title);
      setHistory(getHistory());
      handleClose();
      onNavigate(result.page);
    },
    [handleClose, onNavigate],
  );

  const handleQuickSearch = useCallback((value: string) => {
    setQuery(value);
    setActiveCategory("Tout");
    setOpen(true);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 220);
  }, []);

  const handleHistorySelect = useCallback((value: string) => {
    setQuery(value);
    setActiveCategory("Tout");

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, []);

  const handleRemoveHistory = useCallback(
    (value: string, event: GestureResponderEvent) => {
      event.stopPropagation?.();
      removeHistory(value);
      setHistory(getHistory());
    },
    [],
  );

  const handleSubmit = useCallback((value: string) => {
    const trimmed = value.trim();

    if (trimmed.length < 2) {
      return;
    }

    saveHistory(trimmed);
    setHistory(getHistory());
  }, []);

  const handleVoice = useCallback(() => {
    if (!isBrowser || !isVoiceSupported || listening) {
      return;
    }

    type SpeechRecognitionResultEvent = Event & {
      results?: {
        [index: number]: {
          [index: number]: {
            transcript?: string;
          };
        };
      };
    };

    type SpeechRecognitionInstance = {
      lang: string;
      interimResults: boolean;
      onstart?: () => void;
      onend?: () => void;
      onerror?: () => void;
      onresult?: (event: SpeechRecognitionResultEvent) => void;
      start: () => void;
    };

    type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

    const browserWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    const SpeechRecognitionAPI =
      browserWindow.webkitSpeechRecognition ?? browserWindow.SpeechRecognition;

    if (!SpeechRecognitionAPI) {
      return;
    }

    const recognition = new SpeechRecognitionAPI();

    recognition.lang = "fr-FR";
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);

    recognition.onend = () => setListening(false);

    recognition.onerror = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";

      setQuery(transcript);
      setActiveCategory("Tout");
    };

    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  }, [isVoiceSupported, listening]);

  useEffect(() => {
    if (!isBrowser || !open) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [handleClose, open]);

  const showResults = query.trim().length >= 2;

  const backdropOpacity = backdropAnim;

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.04, 0],
  });

  const panelScale = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1],
  });

  return (
    <>
      {/* ======================================================
       * HOME TRIGGER
       * ==================================================== */}

      <HomeSearchTrigger
        onOpen={handleOpen}
        onQuickSearch={handleQuickSearch}
      />

      {/* ======================================================
       * SEARCH MODAL
       * ==================================================== */}

      {open ? (
        <Modal
          transparent
          visible={open}
          animationType="none"
          onRequestClose={handleClose}
          statusBarTranslucent
        >
          <View style={StyleSheet.absoluteFill}>
            <Animated.View
              style={[
                styles.backdrop,
                {
                  opacity: backdropOpacity,
                },
              ]}
            >
              <Pressable
                onPress={handleClose}
                style={StyleSheet.absoluteFill}
                accessibilityLabel="Fermer"
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.panel,
                {
                  transform: [
                    {
                      translateY: panelTranslateY,
                    },
                    {
                      scale: panelScale,
                    },
                  ],
                },
              ]}
              accessibilityLabel="Recherche DébrouillePro"
            >
              <LinearGradient
                colors={["#06061A", "#0A0620", "#06061A"]}
                locations={[0, 0.5, 1]}
                start={{
                  x: 0,
                  y: 0,
                }}
                end={{
                  x: 1,
                  y: 1,
                }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.ambientGlowTop} pointerEvents="none" />

              <View style={styles.ambientGlowRight} pointerEvents="none" />

              {/* HEADER */}

              <View
                style={[
                  styles.header,
                  {
                    paddingTop: Platform.OS === "android" ? 20 : 40,
                  },
                ]}
              >
                <View style={styles.headerTopRow}>
                  <View
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Text style={styles.headerEyebrow}>
                      DÉBROUILLEPRO SEARCH
                    </Text>

                    <Text style={styles.headerTitle}>Que cherches-tu ?</Text>
                  </View>

                  <Pressable
                    onPress={handleClose}
                    hitSlop={8}
                    accessibilityLabel="Fermer la recherche"
                    style={({ pressed }) => [
                      styles.headerCloseBtn,
                      pressed && {
                        opacity: 0.75,
                      },
                    ]}
                  >
                    <X size={17} color="rgba(255,255,255,0.75)" />
                  </Pressable>
                </View>

                {/* SEARCH INPUT */}

                <View style={styles.searchBar}>
                  <Search size={18} color="#C4B5FD" strokeWidth={2.4} />

                  <TextInput
                    ref={inputRef}
                    value={query}
                    onChangeText={(value) => {
                      setQuery(value);
                      setActiveCategory("Tout");
                    }}
                    onSubmitEditing={() => handleSubmit(query)}
                    placeholder="Modules, services, emplois, contenus…"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={styles.searchInput}
                    autoComplete="off"
                    autoCapitalize="none"
                    accessibilityLabel="Rechercher"
                  />

                  {query ? (
                    <Pressable
                      onPress={() => setQuery("")}
                      hitSlop={6}
                      accessibilityLabel="Effacer la recherche"
                      style={({ pressed }) => [
                        styles.searchClearBtn,
                        pressed && {
                          opacity: 0.7,
                        },
                      ]}
                    >
                      <X size={15} color="rgba(255,255,255,0.6)" />
                    </Pressable>
                  ) : null}

                  {isVoiceSupported ? (
                    <Pressable
                      onPress={handleVoice}
                      accessibilityLabel={
                        listening
                          ? "Arrêter la dictée"
                          : "Rechercher avec la voix"
                      }
                      accessibilityState={{
                        selected: listening,
                      }}
                      hitSlop={6}
                      style={({ pressed }) => [
                        styles.searchMicBtn,
                        listening && styles.searchMicBtnActive,
                        pressed && {
                          opacity: 0.85,
                        },
                      ]}
                    >
                      <Mic
                        size={14}
                        color={listening ? "#FCA5A5" : "#fff"}
                        strokeWidth={2.4}
                      />
                    </Pressable>
                  ) : null}
                </View>

                {/* CATEGORIES */}

                {showResults && results.length > 0 ? (
                  <FadeUp distance={6}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chipsRow}
                    >
                      {allCategories.map((category) => {
                        const count =
                          category === "Tout"
                            ? results.length
                            : (grouped[category as ResultCategory]?.length ??
                              0);

                        if (category !== "Tout" && count === 0) {
                          return null;
                        }

                        const color =
                          category === "Tout"
                            ? "#C4B5FD"
                            : CATEGORY_COLORS[category as ResultCategory];

                        const active = activeCategory === category;

                        return (
                          <Pressable
                            key={category}
                            onPress={() => setActiveCategory(category)}
                            style={({ pressed }) => [
                              styles.chip,
                              {
                                backgroundColor: active
                                  ? `${color}30`
                                  : "rgba(255,255,255,0.04)",
                                borderColor: active
                                  ? `${color}66`
                                  : "rgba(255,255,255,0.08)",
                              },
                              pressed && {
                                opacity: 0.8,
                              },
                            ]}
                          >
                            {category !== "Tout"
                              ? getCategoryIcon(category as ResultCategory, 11)
                              : null}

                            <Text
                              style={[
                                styles.chipText,
                                active && {
                                  color: "#fff",
                                },
                              ]}
                            >
                              {category}
                            </Text>

                            <Text style={styles.chipCount}>{count}</Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </FadeUp>
                ) : null}
              </View>

              {/* BODY */}

              <ScrollView
                style={{
                  flex: 1,
                }}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {!showResults ? (
                  <View
                    style={{
                      gap: 28,
                      paddingTop: 12,
                    }}
                  >
                    {/* QUICK MODULES */}

                    <View>
                      <SectionLabel
                        icon={
                          <LayoutGrid
                            size={12}
                            color="rgba(255,255,255,0.45)"
                          />
                        }
                      >
                        Accès rapide
                      </SectionLabel>

                      <View style={styles.quickGrid}>
                        {quickModules.map((module, index) => (
                          <FadeUp
                            key={module.id}
                            delay={index * 25}
                            distance={8}
                            style={styles.quickGridItemWrap}
                          >
                            <Pressable
                              onPress={() => handleSelect(module)}
                              style={({ pressed }) => [
                                styles.quickModule,
                                pressed && {
                                  opacity: 0.85,
                                },
                              ]}
                            >
                              <LinearGradient
                                colors={[
                                  `${module.badgeColor ?? "#A78BFA"}22`,
                                  `${module.badgeColor ?? "#A78BFA"}08`,
                                ]}
                                start={{
                                  x: 0,
                                  y: 0,
                                }}
                                end={{
                                  x: 1,
                                  y: 1,
                                }}
                                style={[
                                  styles.quickModuleIcon,
                                  {
                                    borderColor: `${module.badgeColor ?? "#A78BFA"}44`,
                                  },
                                ]}
                              >
                                {getCategoryIcon("Modules", 15)}
                              </LinearGradient>

                              <Text
                                style={styles.quickModuleLabel}
                                numberOfLines={2}
                              >
                                {module.title}
                              </Text>
                            </Pressable>
                          </FadeUp>
                        ))}
                      </View>
                    </View>

                    {/* HISTORY */}

                    {history.length > 0 ? (
                      <FadeUp>
                        <View>
                          <View style={styles.historyHeader}>
                            <SectionLabel
                              icon={
                                <Clock
                                  size={12}
                                  color="rgba(255,255,255,0.45)"
                                />
                              }
                            >
                              Récent
                            </SectionLabel>

                            <Pressable
                              onPress={() => {
                                store.remove(HISTORY_KEY);
                                setHistory([]);
                              }}
                              hitSlop={6}
                            >
                              <Text style={styles.historyClear}>Effacer</Text>
                            </Pressable>
                          </View>

                          <View style={styles.historyCard}>
                            {history.map((item, index) => (
                              <Pressable
                                key={item}
                                onPress={() => handleHistorySelect(item)}
                                style={({ pressed }) => [
                                  styles.historyRow,
                                  index > 0 && styles.historyRowBorder,
                                  pressed && {
                                    backgroundColor: "rgba(255,255,255,0.04)",
                                  },
                                ]}
                              >
                                <Clock
                                  size={14}
                                  color="rgba(255,255,255,0.35)"
                                />

                                <Text
                                  style={styles.historyText}
                                  numberOfLines={1}
                                >
                                  {item}
                                </Text>

                                <Pressable
                                  onPress={(event) =>
                                    handleRemoveHistory(item, event)
                                  }
                                  hitSlop={8}
                                  accessibilityLabel={`Supprimer ${item}`}
                                >
                                  <X size={12} color="rgba(255,255,255,0.4)" />
                                </Pressable>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      </FadeUp>
                    ) : null}

                    {/* TRENDS */}

                    <FadeUp>
                      <View>
                        <SectionLabel
                          icon={
                            <TrendingUp
                              size={12}
                              color="rgba(255,255,255,0.45)"
                            />
                          }
                        >
                          Tendances
                        </SectionLabel>

                        <View style={styles.trendingRow}>
                          {TRENDING.map((item, index) => (
                            <FadeUp key={item} delay={index * 35} distance={6}>
                              <Pressable
                                onPress={() => setQuery(item)}
                                style={({ pressed }) => [
                                  styles.trendingChip,
                                  pressed && {
                                    opacity: 0.85,
                                  },
                                ]}
                              >
                                <TrendingUp
                                  size={11}
                                  color="rgba(251,146,60,0.85)"
                                />

                                <Text style={styles.trendingChipText}>
                                  {item}
                                </Text>
                              </Pressable>
                            </FadeUp>
                          ))}
                        </View>
                      </View>
                    </FadeUp>

                    {/* AI */}

                    <FadeUp>
                      <View style={styles.aiCard}>
                        <LinearGradient
                          colors={[
                            "rgba(139,92,246,0.2)",
                            "rgba(99,102,241,0.1)",
                            "rgba(15,7,32,0.6)",
                          ]}
                          locations={[0, 0.5, 1]}
                          start={{
                            x: 0,
                            y: 0,
                          }}
                          end={{
                            x: 1,
                            y: 1,
                          }}
                          style={StyleSheet.absoluteFill}
                        />

                        <View style={styles.aiCardRow}>
                          <View style={styles.aiCardIcon}>
                            <Sparkles size={16} color="#C4B5FD" />
                          </View>

                          <View
                            style={{
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <Text style={styles.aiCardEyebrow}>
                              DÉBROUILLE AI
                            </Text>

                            <Text style={styles.aiCardText}>
                              Je peux t'aider à trouver un emploi, un logement,
                              un service ou une opportunité plus rapidement.
                            </Text>

                            <Pressable
                              onPress={() => setQuery("emploi")}
                              style={({ pressed }) => [
                                styles.aiCardBtn,
                                pressed && {
                                  opacity: 0.7,
                                },
                              ]}
                            >
                              <Text style={styles.aiCardBtnText}>
                                Explorer les opportunités
                              </Text>

                              <ArrowUpRight size={11} color="#C4B5FD" />
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    </FadeUp>
                  </View>
                ) : null}

                {/* NO RESULTS */}

                {showResults && results.length === 0 ? (
                  <FadeUp>
                    <View style={styles.noResultsWrap}>
                      <View style={styles.noResultsIcon}>
                        <Search size={24} color="rgba(196,181,253,0.85)" />
                      </View>

                      <Text style={styles.noResultsTitle}>
                        Aucun résultat trouvé
                      </Text>

                      <Text style={styles.noResultsQuery} numberOfLines={1}>
                        « {query.trim()} »
                      </Text>

                      <Pressable
                        onPress={() => setQuery("")}
                        style={styles.noResultsButton}
                      >
                        <Text style={styles.noResultsButtonText}>
                          Nouvelle recherche
                        </Text>
                      </Pressable>
                    </View>
                  </FadeUp>
                ) : null}

                {/* RESULTS */}

                {showResults && results.length > 0 ? (
                  <View style={styles.resultsContainer}>
                    {(
                      Object.entries(grouped) as [
                        ResultCategory,
                        SearchResult[],
                      ][]
                    ).map(([category, categoryResults], categoryIndex) => (
                      <View key={category} style={styles.resultGroup}>
                        <SectionLabel icon={getCategoryIcon(category, 12)}>
                          {category}
                        </SectionLabel>

                        {categoryResults.map((result, resultIndex) => (
                          <ResultRow
                            key={result.id}
                            result={result}
                            index={categoryIndex + resultIndex}
                            onSelect={handleSelect}
                          />
                        ))}
                      </View>
                    ))}
                  </View>
                ) : null}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

/* ============================================================
 * STYLES
 * ============================================================ */

const styles = StyleSheet.create({
  /* HOME */

  homeTriggerWrap: {
    marginTop: 8,
    marginHorizontal: 16,
  },

  homeSearchCard: {
    minHeight: 112,
    overflow: "hidden",
    padding: 11,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  homeSearchCardPressed: {
    backgroundColor: "rgba(255,255,255,0.065)",
    borderColor: "rgba(196,181,253,0.20)",
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  homeSearchTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  homeSearchIcon: {
    width: 36,
    height: 36,
    marginRight: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.10)",
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.13)",
  },

  homeSearchTitleWrap: {
    flex: 1,
    minWidth: 0,
  },

  homeSearchTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "800",
    letterSpacing: -0.25,
  },

  homeSearchHint: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "600",
  },

  homeSearchSparkle: {
    width: 34,
    height: 34,
    marginLeft: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.08)",
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.12)",
  },

  homeActionRow: {
    paddingTop: 11,
    paddingRight: 4,
    gap: 7,
  },

  homeActionPill: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  homeActionPillPressed: {
    backgroundColor: "rgba(196,181,253,0.10)",
    borderColor: "rgba(196,181,253,0.18)",
  },

  homeActionText: {
    color: "#CBD5E1",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
  },

  homeActionMore: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  homeActionMoreText: {
    color: "#94A3B8",
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "800",
  },

  /* MODAL */

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,4,18,0.78)",
  },

  panel: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#06061A",
  },

  ambientGlowTop: {
    position: "absolute",
    top: -180,
    right: -80,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "rgba(124,58,237,0.08)",
  },

  ambientGlowRight: {
    position: "absolute",
    top: "35%",
    right: -160,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(79,70,229,0.06)",
  },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  headerTopRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
  },

  headerEyebrow: {
    color: "#8B5CF6",
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  headerTitle: {
    marginTop: 3,
    color: "#F8FAFC",
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  headerCloseBtn: {
    width: 38,
    height: 38,
    marginLeft: 10,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  searchBar: {
    minHeight: 54,
    paddingHorizontal: 14,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.14)",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  searchClearBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  searchMicBtn: {
    width: 31,
    height: 31,
    marginLeft: 4,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.10)",
  },

  searchMicBtnActive: {
    backgroundColor: "rgba(248,113,113,0.14)",
  },

  chipsRow: {
    paddingTop: 9,
    paddingRight: 8,
    gap: 7,
  },

  chip: {
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
  },

  chipText: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "700",
  },

  chipCount: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "800",
  },

  bodyContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  sectionLabelRow: {
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  sectionLabelText: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  quickGridItemWrap: {
    width: "22.5%",
  },

  quickModule: {
    minHeight: 78,
    alignItems: "center",
    justifyContent: "center",
  },

  quickModuleIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  quickModuleLabel: {
    marginTop: 7,
    color: "#CBD5E1",
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  historyClear: {
    color: "#8B5CF6",
    fontSize: 9,
    fontWeight: "700",
  },

  historyCard: {
    overflow: "hidden",
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  historyRow: {
    minHeight: 46,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  historyRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },

  historyText: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "600",
  },

  trendingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  trendingChip: {
    minHeight: 31,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  trendingChipText: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "700",
  },

  aiCard: {
    overflow: "hidden",
    padding: 14,
    borderRadius: 19,
    backgroundColor: "rgba(124,58,237,0.08)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.14)",
  },

  aiCardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  aiCardIcon: {
    width: 38,
    height: 38,
    marginRight: 11,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.16)",
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.16)",
  },

  aiCardEyebrow: {
    color: "#A78BFA",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.9,
  },

  aiCardText: {
    marginTop: 4,
    color: "#CBD5E1",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },

  aiCardBtn: {
    alignSelf: "flex-start",
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  aiCardBtnText: {
    color: "#C4B5FD",
    fontSize: 9,
    fontWeight: "800",
  },

  resultsContainer: {
    gap: 22,
    paddingTop: 12,
  },

  resultGroup: {
    gap: 7,
  },

  resultRow: {
    minHeight: 66,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  resultRowCompact: {
    minHeight: 56,
  },

  resultIcon: {
    width: 38,
    height: 38,
    marginRight: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  resultIconCompact: {
    width: 32,
    height: 32,
    marginRight: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  resultTitle: {
    color: "#F8FAFC",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
  },

  resultSubtitle: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "600",
  },

  resultMetaCol: {
    maxWidth: 75,
    marginLeft: 8,
    alignItems: "flex-end",
  },

  resultMeta: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "700",
  },

  resultBadge: {
    minHeight: 17,
    marginTop: 3,
    paddingHorizontal: 5,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  resultBadgeText: {
    fontSize: 7,
    fontWeight: "900",
  },

  noResultsWrap: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  noResultsIcon: {
    width: 64,
    height: 64,
    marginBottom: 14,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.10)",
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.13)",
  },

  noResultsTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
  },

  noResultsQuery: {
    maxWidth: "90%",
    marginTop: 5,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },

  noResultsButton: {
    minHeight: 38,
    marginTop: 17,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.18)",
  },

  noResultsButtonText: {
    color: "#C4B5FD",
    fontSize: 10,
    fontWeight: "800",
  },
});

// src/pages/home/_components/AdvancedSearch.tsx
import {
  View,
  Pressable,
  Text,
  TextInput,
  Image,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  type ReactNode,
  type ComponentType,
} from "react";
import {
  Search,
  X,
  TrendingUp,
  Clock,
  User,
  FileText,
  Layers,
  ChevronRight,
  MapPin,
  Sparkles,
  Flame,
  ArrowLeft,
  SlidersHorizontal,
  Mic,
  Command,
  ArrowUpRight,
  Building2,
  BriefcaseBusiness,
  HeartPulse,
  Car,
  Sprout,
  CalendarDays,
  ShoppingBag,
  WalletCards,
  History,
  Compass,
  Zap,
  Map,
} from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { useDebounce } from "@/hooks/use-debounce.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";

/* ============================================================================
 * STORAGE HELPERS — 100% safe (RN + web)
 * ========================================================================== */

const HISTORY_KEY = "adv_search_history";
const MAX_HISTORY = 10;

/**
 * Récupère un objet storage compatible (`localStorage`) depuis `globalThis`.
 * Retourne `null` si absent / invalide → aucun crash sur RN.
 */
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

function getHistory(): string[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function addToHistory(term: string) {
  const storage = getStorage();
  if (!storage) return;
  const normalized = term.trim();
  if (!normalized) return;
  const previous = getHistory().filter(
    (item) => item.toLowerCase() !== normalized.toLowerCase(),
  );
  try {
    storage.setItem(
      HISTORY_KEY,
      JSON.stringify([normalized, ...previous].slice(0, MAX_HISTORY)),
    );
  } catch {
    /* noop */
  }
}

function clearHistory() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(HISTORY_KEY);
  } catch {
    /* noop */
  }
}

/* ============================================================================
 * WEB API GUARDS
 * ========================================================================== */

/** Vrai seulement si on peut réellement utiliser `window.addEventListener`. */
function canUseWebKeyboard(): boolean {
  if (Platform.OS !== "web") return false;
  try {
    if (typeof globalThis === "undefined") return false;
    const w = (globalThis as { window?: Window }).window;
    if (!w) return false;
    if (
      typeof (w as unknown as { addEventListener?: unknown })
        .addEventListener !== "function"
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Retourne `window` si utilisable, sinon `null`. */
function getWindowSafe(): (Window & typeof globalThis) | null {
  try {
    if (typeof globalThis === "undefined") return null;
    const w = (globalThis as { window?: Window & typeof globalThis }).window;
    return w ?? null;
  } catch {
    return null;
  }
}

/** Langue du device — safe sur RN. */
function getSafeLanguage(): string {
  try {
    if (typeof globalThis === "undefined") return "fr-FR";
    const nav = (globalThis as { navigator?: { language?: string } }).navigator;
    return nav?.language ?? "fr-FR";
  } catch {
    return "fr-FR";
  }
}

/* ============================================================================
 * FILTERS
 * ========================================================================== */

const TYPE_FILTERS = [
  { label: "Tout", value: "", icon: Compass },
  { label: "Immo", value: "immo", icon: Building2 },
  { label: "Emploi", value: "job", icon: BriefcaseBusiness },
  { label: "Services", value: "service", icon: Zap },
  { label: "Événements", value: "evenement", icon: CalendarDays },
  { label: "Annonces", value: "annonce", icon: ShoppingBag },
  { label: "Agri", value: "agri", icon: Sprout },
  { label: "Santé", value: "sante", icon: HeartPulse },
  { label: "Transport", value: "transport", icon: Car },
] as const;

type FilterValue = (typeof TYPE_FILTERS)[number]["value"];

const TABS = ["Tout", "Publications", "Personnes", "Modules"] as const;
type TabType = (typeof TABS)[number];

const TYPE_COLORS: Record<string, string> = {
  immo: "#10B981",
  job: "#8B5CF6",
  service: "#F97316",
  evenement: "#EC4899",
  community: "#06B6D4",
  agri: "#84CC16",
  sante: "#EF4444",
  transport: "#3B82F6",
  annonce: "#F59E0B",
  restauration: "#F97316",
  hebergement: "#10B981",
  energie: "#FACC15",
  ong: "#A855F7",
};

const TYPE_LABELS: Record<string, string> = {
  immo: "Immobilier",
  job: "Emploi",
  service: "Service",
  evenement: "Événement",
  community: "Communauté",
  agri: "Agriculture",
  sante: "Santé",
  transport: "Transport",
  annonce: "Annonce",
  restauration: "Restauration",
  hebergement: "Hébergement",
  energie: "Énergie",
  ong: "ONG",
};

interface ModuleEntry {
  id: string;
  title: string;
  subtitle: string;
  page: string;
  category: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  accent: string;
}

const MODULES: ModuleEntry[] = [
  {
    id: "immo",
    title: "Immobilier",
    subtitle: "Locations, ventes, terrains",
    page: "immo",
    category: "Habitat",
    icon: Building2,
    accent: "#10B981",
  },
  {
    id: "jobs",
    title: "Emploi & Jobs",
    subtitle: "Offres d'emploi & recrutement",
    page: "jobs",
    category: "Emploi",
    icon: BriefcaseBusiness,
    accent: "#8B5CF6",
  },
  {
    id: "transport",
    title: "Transport",
    subtitle: "Bus, taxi, covoiturage",
    page: "transport",
    category: "Mobilité",
    icon: Car,
    accent: "#3B82F6",
  },
  {
    id: "sante",
    title: "Santé",
    subtitle: "Médecins, hôpitaux, pharmacies",
    page: "sante",
    category: "Santé",
    icon: HeartPulse,
    accent: "#EF4444",
  },
  {
    id: "agri",
    title: "Agriculture",
    subtitle: "Semences, marchés, météo agri",
    page: "agri",
    category: "Agri",
    icon: Sprout,
    accent: "#84CC16",
  },
  {
    id: "marketplace",
    title: "Marketplace",
    subtitle: "Achat & vente entre particuliers",
    page: "marketplace",
    category: "Commerce",
    icon: ShoppingBag,
    accent: "#F97316",
  },
  {
    id: "media",
    title: "Médias",
    subtitle: "Actualités, journaux, radio",
    page: "media",
    category: "Info",
    icon: FileText,
    accent: "#EC4899",
  },
  {
    id: "evenements",
    title: "Événements",
    subtitle: "Concerts, foires, expositions",
    page: "evenements",
    category: "Loisirs",
    icon: CalendarDays,
    accent: "#EC4899",
  },
  {
    id: "community",
    title: "Communauté",
    subtitle: "Groupes & forums locaux",
    page: "community",
    category: "Social",
    icon: User,
    accent: "#06B6D4",
  },
  {
    id: "finances",
    title: "Finances",
    subtitle: "Banque, épargne, investissement",
    page: "finances",
    category: "Finance",
    icon: WalletCards,
    accent: "#F59E0B",
  },
  {
    id: "business",
    title: "Business",
    subtitle: "Création et annuaire entreprises",
    page: "business",
    category: "Entreprise",
    icon: BriefcaseBusiness,
    accent: "#6366F1",
  },
  {
    id: "securite",
    title: "Sécurité",
    subtitle: "Alertes, police, urgences",
    page: "securite",
    category: "Sécurité",
    icon: Zap,
    accent: "#EF4444",
  },
  {
    id: "education",
    title: "Éducation",
    subtitle: "Cours, formations, certifications",
    page: "apprendre",
    category: "Éducation",
    icon: Sparkles,
    accent: "#6366F1",
  },
  {
    id: "energie",
    title: "Énergie",
    subtitle: "Électricité, eau, gaz",
    page: "energie",
    category: "Services",
    icon: Zap,
    accent: "#FACC15",
  },
  {
    id: "hebergement",
    title: "Hébergement",
    subtitle: "Hôtels, auberges, logements",
    page: "hebergement",
    category: "Tourisme",
    icon: Building2,
    accent: "#10B981",
  },
  {
    id: "restauration",
    title: "Restauration",
    subtitle: "Restaurants, livraison",
    page: "restauration",
    category: "Food",
    icon: ShoppingBag,
    accent: "#F97316",
  },
  {
    id: "wallet",
    title: "Wallet",
    subtitle: "Paiements mobiles & transferts",
    page: "wallet",
    category: "Finance",
    icon: WalletCards,
    accent: "#EAB308",
  },
  {
    id: "ong",
    title: "ONG & Associations",
    subtitle: "Projets sociaux & humanitaires",
    page: "ong",
    category: "Société",
    icon: HeartPulse,
    accent: "#A855F7",
  },
  {
    id: "map3d",
    title: "Carte 3D",
    subtitle: "Carte interactive de la ville",
    page: "map3d",
    category: "Carte",
    icon: Map,
    accent: "#14B8A6",
  },
  {
    id: "fitness",
    title: "Fitness",
    subtitle: "Sport, musculation, cardio",
    page: "fitness",
    category: "Bien-être",
    icon: Zap,
    accent: "#EF4444",
  },
];

interface AdvancedSearchProps {
  onClose: () => void;
  onNavigate: (page: string) => void;
  onViewProfile: (userId: Id<"users">) => void;
}

/* ============================================================================
 * AMBIENT BACKGROUND
 * ========================================================================== */

function AmbientBackground() {
  const { width: W, height: H } = useWindowDimensions();
  const orbA = useRef(new Animated.Value(0)).current;
  const orbB = useRef(new Animated.Value(0)).current;

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
    loopA.start();
    loopB.start();
    return () => {
      loopA.stop();
      loopB.stop();
    };
  }, [orbA, orbB]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["#07050F", "#0E0821", "#0A0518", "#120827"]}
        locations={[0, 0.4, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: Math.max(340, W * 0.85),
            height: Math.max(340, W * 0.85),
            top: -160,
            left: -140,
            backgroundColor: "rgba(99,102,241,0.42)",
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
            bottom: H * 0.1 - 160,
            right: -120,
            backgroundColor: "rgba(139,92,246,0.32)",
            transform: [{ translateY: orbB }],
          },
        ]}
      />
    </View>
  );
}

/* ============================================================================
 * ENTRANCE WRAPPER
 * ========================================================================== */

function FadeUp({
  delay = 0,
  distance = 10,
  children,
}: {
  delay?: number;
  distance?: number;
  children: ReactNode;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => {
      animation.stop();
    };
  }, [anim, delay]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [distance, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function AdvancedSearch({
  onClose,
  onNavigate,
  onViewProfile,
}: AdvancedSearchProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("Tout");
  const [typeFilter, setTypeFilter] = useState<FilterValue>("");
  const [history, setHistory] = useState<string[]>(getHistory);
  const [showFilters, setShowFilters] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedTrending, setSelectedTrending] = useState<string | null>(null);

  const searchInputRef = useRef<TextInput>(null);
  const [debouncedQuery] = useDebounce(query, 350);

  /* ─────────── BACKEND ─────────── */

  const pubResults = useQuery(
    api.search.searchPublications,
    debouncedQuery.length >= 2
      ? {
          q: debouncedQuery,
          ...(typeFilter
            ? { type: typeFilter as Exclude<FilterValue, ""> }
            : {}),
        }
      : "skip",
  );

  const userResults = useQuery(
    api.search.searchUsers,
    debouncedQuery.length >= 2 ? { q: debouncedQuery } : "skip",
  );

  const trendingTags = useQuery(api.search.getTrendingTags, {});

  /* ─────────── MODULE SEARCH ─────────── */

  const moduleResults = useMemo(() => {
    if (debouncedQuery.length < 2) return [];
    const normalized = debouncedQuery.toLowerCase();
    return MODULES.filter((module) =>
      [module.title, module.subtitle, module.category].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [debouncedQuery]);

  const isSearching = debouncedQuery.length >= 2;

  const isLoading =
    isSearching && (pubResults === undefined || userResults === undefined);

  const publicationCount = pubResults?.length ?? 0;
  const peopleCount = userResults?.length ?? 0;
  const moduleCount = moduleResults.length;
  const totalResults = publicationCount + peopleCount + moduleCount;

  const activeFilterLabel =
    TYPE_FILTERS.find((f) => f.value === typeFilter)?.label ?? "Tout";

  /* ─────────── ACTIONS ─────────── */

  const handleSearch = useCallback((term: string) => {
    const normalized = term.trim();
    if (!normalized) return;
    addToHistory(normalized);
    setHistory(getHistory());
    setSelectedTrending(null);
  }, []);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  const handleSuggestion = useCallback(
    (term: string) => {
      setQuery(term);
      handleSearch(term);
    },
    [handleSearch],
  );

  const handleModuleNavigation = useCallback(
    (page: string, title: string) => {
      addToHistory(title);
      onNavigate(page);
    },
    [onNavigate],
  );

  const clearSearch = useCallback(() => {
    setQuery("");
    setTypeFilter("");
    setSelectedTrending(null);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  /* ─────────── WEB KEYBOARD SHORTCUTS (safe) ─────────── */

  useEffect(() => {
    if (!canUseWebKeyboard()) return;
    const w = getWindowSafe();
    if (!w) return;

    const handler = (event: KeyboardEvent) => {
      if (!event || typeof event.key !== "string") return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault?.();
        searchInputRef.current?.focus();
        return;
      }
      if (event.key === "Escape") {
        if (query) clearSearch();
        else onClose();
      }
    };

    w.addEventListener("keydown", handler as EventListener);
    return () => {
      w.removeEventListener("keydown", handler as EventListener);
    };
  }, [clearSearch, onClose, query]);

  /* ─────────── VOICE SEARCH (safe) ─────────── */

  const startVoiceSearch = useCallback(() => {
    try {
      if (Platform.OS !== "web") return;
      const w = getWindowSafe() as
        | (Window & {
            SpeechRecognition?: new () => any;
            webkitSpeechRecognition?: new () => any;
          })
        | null;
      if (!w) return;

      const Recognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;
      if (!Recognition) return;

      const recognition = new Recognition();
      recognition.lang = getSafeLanguage();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript ?? "";
        if (transcript.trim()) {
          setQuery(transcript.trim());
          handleSearch(transcript);
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }, [handleSearch]);

  /* ─────────── AUTOFOCUS ─────────── */

  useEffect(() => {
    const t = setTimeout(() => searchInputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  /* ======================================================================
   * RENDER
   * ==================================================================== */

  const topPad = Math.max(insets.top, Platform.OS === "android" ? 24 : 44);

  return (
    <View style={styles.root}>
      <AmbientBackground />

      {/* ───────── HEADER ───────── */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={onClose}
          accessibilityLabel="Fermer la recherche"
          hitSlop={10}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <ArrowLeft size={17} color="rgba(255,255,255,0.8)" />
        </Pressable>

        <View style={[styles.searchBar, isSearching && styles.searchBarActive]}>
          <Search
            size={17}
            color={isSearching ? "#A5B4FC" : "rgba(255,255,255,0.4)"}
          />
          <TextInput
            ref={searchInputRef}
            autoFocus
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => {
              if (query.trim()) handleSearch(query);
            }}
            onKeyPress={(
              e: NativeSyntheticEvent<TextInputKeyPressEventData>,
            ) => {
              if (e.nativeEvent.key === "Enter" && query.trim()) {
                handleSearch(query);
              }
            }}
            placeholder="Rechercher dans DébrouillePro…"
            placeholderTextColor="rgba(255,255,255,0.32)"
            style={styles.searchInput}
            accessibilityLabel="Rechercher dans DébrouillePro"
            returnKeyType="search"
          />

          {Platform.OS === "web" ? (
            <Pressable
              onPress={startVoiceSearch}
              accessibilityLabel="Recherche vocale"
              hitSlop={8}
              style={({ pressed }) => [
                styles.micBtn,
                isListening && styles.micBtnActive,
                pressed && styles.pressed,
              ]}
            >
              <Mic
                size={13}
                color={isListening ? "#F87171" : "rgba(255,255,255,0.4)"}
              />
            </Pressable>
          ) : null}

          {!query && Platform.OS === "web" ? (
            <View style={styles.kbd}>
              <Command size={9} color="rgba(255,255,255,0.3)" />
              <Text style={styles.kbdText}>K</Text>
            </View>
          ) : null}

          {query ? (
            <Pressable
              onPress={clearSearch}
              accessibilityLabel="Effacer la recherche"
              hitSlop={8}
              style={({ pressed }) => [
                styles.clearBtn,
                pressed && styles.pressed,
              ]}
            >
              <X size={13} color="rgba(255,255,255,0.55)" />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => setShowFilters((v) => !v)}
          accessibilityLabel="Afficher les filtres"
          hitSlop={10}
          style={({ pressed }) => [
            styles.iconBtn,
            (showFilters || typeFilter) && styles.iconBtnActive,
            pressed && styles.pressed,
          ]}
        >
          <SlidersHorizontal
            size={16}
            color={
              showFilters || typeFilter ? "#C4B5FD" : "rgba(255,255,255,0.6)"
            }
          />
          {typeFilter ? <View style={styles.filterDot} /> : null}
        </Pressable>
      </View>

      {/* ───────── BRAND HERO ───────── */}
      {!isSearching ? (
        <FadeUp delay={60}>
          <View style={styles.brandHero}>
            <LinearGradient
              colors={["#A78BFA", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.brandLogo}
            >
              <Sparkles size={14} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandEyebrow}>RECHERCHE INTELLIGENTE</Text>
              <Text style={styles.brandSub}>Trouve ce dont tu as besoin.</Text>
            </View>
          </View>
        </FadeUp>
      ) : null}

      {/* ───────── TABS ───────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={({ pressed }) => [
                styles.tab,
                active && styles.tabActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ───────── TYPE FILTERS ───────── */}
      {(activeTab === "Tout" || activeTab === "Publications") &&
      (isSearching || showFilters) ? (
        <FadeUp>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            {TYPE_FILTERS.map(({ label, value, icon: Icon }) => {
              const active = typeFilter === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setTypeFilter(value)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    active && styles.filterChipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Icon
                    size={11}
                    color={active ? "#C4B5FD" : "rgba(255,255,255,0.5)"}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      active && { color: "#C4B5FD" },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </FadeUp>
      ) : null}

      {/* ───────── CONTENT ───────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.contentScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── IDLE STATE ─── */}
        {!isSearching ? (
          <View style={{ gap: 28 }}>
            {/* Recent */}
            {history.length > 0 ? (
              <FadeUp>
                <View>
                  <SectionHeader
                    icon={<History size={13} color="rgba(255,255,255,0.55)" />}
                    title="Recherches récentes"
                    subtitle="Reprends là où tu t'es arrêté"
                    right={
                      <Pressable onPress={handleClearHistory} hitSlop={8}>
                        <Text style={styles.clearLink}>Effacer</Text>
                      </Pressable>
                    }
                  />
                  <View style={styles.wrapRow}>
                    {history.map((term, index) => (
                      <FadeUp key={`${term}-${index}`} delay={index * 25}>
                        <Pressable
                          onPress={() => handleSuggestion(term)}
                          style={({ pressed }) => [
                            styles.historyChip,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Clock size={10} color="rgba(255,255,255,0.4)" />
                          <Text
                            style={styles.historyChipText}
                            numberOfLines={1}
                          >
                            {term}
                          </Text>
                          <ArrowUpRight
                            size={10}
                            color="rgba(255,255,255,0.35)"
                          />
                        </Pressable>
                      </FadeUp>
                    ))}
                  </View>
                </View>
              </FadeUp>
            ) : null}

            {/* Trending */}
            <FadeUp>
              <View>
                <SectionHeader
                  icon={
                    <View
                      style={[
                        styles.sectionIconBg,
                        { backgroundColor: "rgba(249,115,22,0.14)" },
                      ]}
                    >
                      <Flame size={13} color="#FB923C" />
                    </View>
                  }
                  title="Tendances"
                  subtitle="Ce que la communauté recherche"
                />

                {trendingTags === undefined ? (
                  <View style={styles.wrapRow}>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        style={{
                          height: 32,
                          width: 96,
                          borderRadius: 16,
                          backgroundColor: "rgba(255,255,255,0.05)",
                        }}
                      />
                    ))}
                  </View>
                ) : trendingTags.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <TrendingUp size={18} color="rgba(255,255,255,0.25)" />
                    <Text style={styles.emptyCardText}>
                      Les tendances arrivent bientôt.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.wrapRow}>
                    {trendingTags.map(({ tag, count }) => {
                      const selected = selectedTrending === tag;
                      return (
                        <Pressable
                          key={tag}
                          onPress={() => {
                            setSelectedTrending(tag);
                            handleSuggestion(tag);
                          }}
                          style={({ pressed }) => [
                            styles.trendChip,
                            selected && styles.trendChipActive,
                            pressed && styles.pressed,
                          ]}
                        >
                          <TrendingUp
                            size={10}
                            color={selected ? "#C4B5FD" : "#A5B4FC"}
                          />
                          <Text
                            style={[
                              styles.trendChipText,
                              selected && { color: "#C4B5FD" },
                            ]}
                          >
                            #{tag}
                          </Text>
                          <View style={styles.trendCount}>
                            <Text style={styles.trendCountText}>{count}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </FadeUp>

            {/* Modules discovery */}
            <FadeUp>
              <View>
                <SectionHeader
                  icon={
                    <View
                      style={[
                        styles.sectionIconBg,
                        { backgroundColor: "rgba(99,102,241,0.14)" },
                      ]}
                    >
                      <Sparkles size={13} color="#A5B4FC" />
                    </View>
                  }
                  title="Explorer DébrouillePro"
                  subtitle="Accède directement à un module"
                />
                <View style={{ gap: 8 }}>
                  {MODULES.slice(0, 8).map((module, index) => (
                    <FadeUp key={module.id} delay={index * 30}>
                      <Pressable
                        onPress={() =>
                          handleModuleNavigation(module.page, module.title)
                        }
                        style={({ pressed }) => [
                          styles.moduleRow,
                          pressed && styles.pressed,
                        ]}
                      >
                        <View
                          style={[
                            styles.moduleRowIcon,
                            { backgroundColor: `${module.accent}1A` },
                          ]}
                        >
                          <module.icon size={15} color={module.accent} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.moduleRowTitle} numberOfLines={1}>
                            {module.title}
                          </Text>
                          <Text style={styles.moduleRowSub} numberOfLines={1}>
                            {module.category}
                          </Text>
                        </View>
                        <ChevronRight size={12} color="rgba(255,255,255,0.3)" />
                      </Pressable>
                    </FadeUp>
                  ))}
                </View>
              </View>
            </FadeUp>

            {/* Idle hero card */}
            <FadeUp>
              <View style={styles.heroCard}>
                <LinearGradient
                  colors={["rgba(99,102,241,0.38)", "rgba(139,92,246,0.15)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroCardGlow}
                />
                <View style={styles.heroCardIcon}>
                  <Zap size={15} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroCardTitle}>
                    Recherche sans limites
                  </Text>
                  <Text style={styles.heroCardText}>
                    Publications, personnes, services, événements, logements,
                    emplois et modules — tout DébrouillePro au même endroit.
                  </Text>
                </View>
              </View>
            </FadeUp>
          </View>
        ) : null}

        {/* ─── LOADING ─── */}
        {isSearching && isLoading ? (
          <View style={{ gap: 12, paddingTop: 12 }}>
            <View style={styles.loadingRow}>
              <View style={styles.loadingDot} />
              <Text style={styles.loadingText}>
                Recherche dans DébrouillePro…
              </Text>
            </View>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={styles.skeletonCard}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Skeleton
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: "rgba(255,255,255,0.05)",
                    }}
                  />
                  <View style={{ flex: 1, gap: 8 }}>
                    <Skeleton
                      style={{
                        height: 12,
                        width: "60%",
                        borderRadius: 4,
                        backgroundColor: "rgba(255,255,255,0.05)",
                      }}
                    />
                    <Skeleton
                      style={{
                        height: 10,
                        width: "80%",
                        borderRadius: 4,
                        backgroundColor: "rgba(255,255,255,0.04)",
                      }}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* ─── RESULTS ─── */}
        {isSearching && !isLoading ? (
          <View style={{ gap: 28, paddingTop: 12 }}>
            {/* Summary */}
            <View style={styles.summary}>
              <View>
                <Text style={styles.summaryTitle}>Résultats</Text>
                <Text style={styles.summarySub}>
                  Pour{" "}
                  <Text style={{ color: "rgba(255,255,255,0.65)" }}>
                    “{debouncedQuery}”
                  </Text>
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {typeFilter ? (
                  <View style={styles.summaryChipActive}>
                    <Text style={styles.summaryChipActiveText}>
                      {activeFilterLabel}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.summaryChip}>
                  <Text style={styles.summaryChipText}>
                    {totalResults} résultat{totalResults !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>
            </View>

            {/* Publications */}
            {(activeTab === "Tout" || activeTab === "Publications") && (
              <View>
                {activeTab === "Tout" ? (
                  <SectionHeader
                    icon={<FileText size={13} color="rgba(255,255,255,0.55)" />}
                    title="Publications"
                    count={publicationCount}
                  />
                ) : null}
                {pubResults &&
                pubResults.length === 0 &&
                activeTab === "Publications" ? (
                  <EmptySection
                    icon={<FileText size={20} color="rgba(255,255,255,0.25)" />}
                    text="Aucune publication trouvée."
                  />
                ) : null}
                <View style={{ gap: 8 }}>
                  {pubResults
                    ?.slice(0, activeTab === "Tout" ? 4 : 30)
                    .map((publication, index) => {
                      const color = TYPE_COLORS[publication.type] ?? "#6366F1";
                      return (
                        <FadeUp
                          key={publication._id}
                          delay={index * 30}
                          distance={8}
                        >
                          <Pressable
                            onPress={() => handleSearch(debouncedQuery)}
                            style={({ pressed }) => [
                              styles.resultCard,
                              pressed && styles.pressed,
                            ]}
                          >
                            <View
                              style={[
                                styles.resultIconWrap,
                                { backgroundColor: `${color}1A` },
                              ]}
                            >
                              <FileText size={15} color={color} />
                              <View
                                style={[
                                  styles.resultIconDot,
                                  { backgroundColor: color },
                                ]}
                              />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <View style={styles.resultTitleRow}>
                                <Text
                                  style={styles.resultTitle}
                                  numberOfLines={1}
                                >
                                  {publication.title}
                                </Text>
                                <View
                                  style={[
                                    styles.resultBadge,
                                    { backgroundColor: `${color}1A` },
                                  ]}
                                >
                                  <Text
                                    style={[styles.resultBadgeText, { color }]}
                                  >
                                    {TYPE_LABELS[publication.type] ??
                                      publication.type}
                                  </Text>
                                </View>
                              </View>
                              {publication.description ? (
                                <Text
                                  style={styles.resultDescription}
                                  numberOfLines={1}
                                >
                                  {publication.description}
                                </Text>
                              ) : null}
                              <View style={styles.resultMetaRow}>
                                {publication.location ? (
                                  <View style={styles.resultMeta}>
                                    <MapPin
                                      size={9}
                                      color="rgba(255,255,255,0.4)"
                                    />
                                    <Text
                                      style={styles.resultMetaText}
                                      numberOfLines={1}
                                    >
                                      {publication.location}
                                    </Text>
                                  </View>
                                ) : null}
                                {publication.author?.name ? (
                                  <Text style={styles.resultAuthor}>
                                    par {publication.author.name}
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                            <ArrowUpRight
                              size={13}
                              color="rgba(255,255,255,0.3)"
                            />
                          </Pressable>
                        </FadeUp>
                      );
                    })}
                </View>
                {activeTab === "Tout" && publicationCount > 4 ? (
                  <Pressable
                    onPress={() => setActiveTab("Publications")}
                    style={({ pressed }) => [
                      styles.moreBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.moreBtnText}>
                      Voir toutes les publications
                    </Text>
                    <ChevronRight size={11} color="#A5B4FC" />
                  </Pressable>
                ) : null}
              </View>
            )}

            {/* People */}
            {(activeTab === "Tout" || activeTab === "Personnes") && (
              <View>
                {activeTab === "Tout" ? (
                  <SectionHeader
                    icon={<User size={13} color="rgba(255,255,255,0.55)" />}
                    title="Personnes"
                    count={peopleCount}
                  />
                ) : null}
                {userResults &&
                userResults.length === 0 &&
                activeTab === "Personnes" ? (
                  <EmptySection
                    icon={<User size={20} color="rgba(255,255,255,0.25)" />}
                    text="Aucun utilisateur trouvé."
                  />
                ) : null}
                <View style={{ gap: 8 }}>
                  {userResults
                    ?.slice(0, activeTab === "Tout" ? 4 : 20)
                    .map((user, index) => (
                      <FadeUp key={user._id} delay={index * 30} distance={8}>
                        <Pressable
                          onPress={() => onViewProfile(user._id)}
                          style={({ pressed }) => [
                            styles.resultCard,
                            pressed && styles.pressed,
                          ]}
                        >
                          <View style={styles.avatarWrap}>
                            {user.avatar ? (
                              <Image
                                source={{ uri: user.avatar }}
                                style={styles.avatar}
                                accessibilityLabel={user.name ?? "Utilisateur"}
                              />
                            ) : (
                              <View style={styles.avatarFallback}>
                                <User size={17} color="#A5B4FC" />
                              </View>
                            )}
                            <View style={styles.onlineDot} />
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.resultTitle} numberOfLines={1}>
                              {user.name ?? "Utilisateur"}
                            </Text>
                            {user.bio ? (
                              <Text
                                style={styles.resultDescription}
                                numberOfLines={1}
                              >
                                {user.bio}
                              </Text>
                            ) : null}
                            {user.city ? (
                              <View
                                style={[styles.resultMeta, { marginTop: 4 }]}
                              >
                                <MapPin
                                  size={9}
                                  color="rgba(255,255,255,0.4)"
                                />
                                <Text style={styles.resultMetaText}>
                                  {user.city}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <ChevronRight
                            size={13}
                            color="rgba(255,255,255,0.3)"
                          />
                        </Pressable>
                      </FadeUp>
                    ))}
                </View>
              </View>
            )}

            {/* Modules */}
            {(activeTab === "Tout" || activeTab === "Modules") && (
              <View>
                {activeTab === "Tout" ? (
                  <SectionHeader
                    icon={<Layers size={13} color="rgba(255,255,255,0.55)" />}
                    title="Modules"
                    count={moduleCount}
                  />
                ) : null}
                {moduleResults.length === 0 && activeTab === "Modules" ? (
                  <EmptySection
                    icon={<Layers size={20} color="rgba(255,255,255,0.25)" />}
                    text="Aucun module trouvé."
                  />
                ) : null}
                <View style={{ gap: 8 }}>
                  {moduleResults
                    .slice(0, activeTab === "Tout" ? 4 : 30)
                    .map((module, index) => (
                      <FadeUp key={module.id} delay={index * 30} distance={8}>
                        <Pressable
                          onPress={() =>
                            handleModuleNavigation(module.page, module.title)
                          }
                          style={({ pressed }) => [
                            styles.resultCard,
                            pressed && styles.pressed,
                          ]}
                        >
                          <View
                            style={[
                              styles.resultIconWrap,
                              { backgroundColor: `${module.accent}1A` },
                            ]}
                          >
                            <module.icon size={15} color={module.accent} />
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.resultTitle} numberOfLines={1}>
                              {module.title}
                            </Text>
                            <Text
                              style={styles.resultDescription}
                              numberOfLines={1}
                            >
                              {module.subtitle}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.resultBadge,
                              { backgroundColor: `${module.accent}14` },
                            ]}
                          >
                            <Text
                              style={[
                                styles.resultBadgeText,
                                { color: `${module.accent}CC` },
                              ]}
                            >
                              {module.category}
                            </Text>
                          </View>
                        </Pressable>
                      </FadeUp>
                    ))}
                </View>
              </View>
            )}

            {/* No results */}
            {activeTab === "Tout" && totalResults === 0 ? (
              <FadeUp>
                <View style={styles.noResultsCard}>
                  <LinearGradient
                    colors={["rgba(139,92,246,0.16)", "rgba(99,102,241,0.06)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.noResultsIcon}
                  >
                    <Search size={25} color="#A5B4FC" />
                  </LinearGradient>
                  <Text style={styles.noResultsTitle}>Aucun résultat</Text>
                  <Text style={styles.noResultsText}>
                    Rien ne correspond à{" "}
                    <Text style={{ color: "rgba(255,255,255,0.65)" }}>
                      “{debouncedQuery}”
                    </Text>
                    . Essaie un autre mot-clé ou explore les tendances.
                  </Text>
                  <View style={styles.wrapRow}>
                    {["logement", "emploi", "transport", "événement"].map(
                      (s) => (
                        <Pressable
                          key={s}
                          onPress={() => handleSuggestion(s)}
                          style={({ pressed }) => [
                            styles.suggestChip,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text style={styles.suggestChipText}>{s}</Text>
                        </Pressable>
                      ),
                    )}
                  </View>
                </View>
              </FadeUp>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

/* ============================================================================
 * SUB-COMPONENTS
 * ========================================================================== */

function SectionHeader({
  icon,
  title,
  subtitle,
  count,
  right,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  count?: number;
  right?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionIconBg}>{icon}</View>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {count !== undefined ? (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      ) : null}
      {right}
    </View>
  );
}

function EmptySection({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <View style={styles.emptySection}>
      {icon}
      <Text style={styles.emptySectionText}>{text}</Text>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#07050F",
  },

  orb: {
    position: "absolute",
    borderRadius: 9999,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
    zIndex: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  iconBtnActive: {
    borderColor: "rgba(99,102,241,0.45)",
    backgroundColor: "rgba(99,102,241,0.14)",
  },
  filterDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#A5B4FC",
    borderWidth: 2,
    borderColor: "#07050F",
  },
  pressed: { opacity: 0.75 },

  // Search bar
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  searchBarActive: {
    borderColor: "rgba(99,102,241,0.5)",
    backgroundColor: "rgba(99,102,241,0.08)",
    shadowColor: "#6366F1",
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: "#fff",
    fontSize: 14,
    paddingVertical: 0,
  },
  micBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  micBtnActive: {
    backgroundColor: "rgba(248,113,113,0.15)",
  },
  kbd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  kbdText: {
    fontSize: 9,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "700",
  },
  clearBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  // Brand hero
  brandHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  brandLogo: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366F1",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  brandEyebrow: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 2,
    color: "rgba(165,180,252,0.85)",
  },
  brandSub: {
    marginTop: 2,
    fontSize: 11.5,
    color: "rgba(255,255,255,0.45)",
  },

  // Tabs
  tabsRow: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  tabActive: {
    backgroundColor: "rgba(99,102,241,0.20)",
    borderColor: "rgba(99,102,241,0.5)",
  },
  tabText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: "#C4B5FD",
  },

  // Filters row
  filtersRow: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 6,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  filterChipActive: {
    backgroundColor: "rgba(99,102,241,0.22)",
    borderColor: "rgba(99,102,241,0.5)",
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.2,
  },

  // Content scroll
  contentScroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 4,
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIconBg: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    marginTop: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.45)",
  },
  clearLink: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.2,
  },

  // Chips
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  historyChip: {
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
  historyChipText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    maxWidth: 180,
    fontWeight: "600",
  },
  trendChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(99,102,241,0.1)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.22)",
  },
  trendChipActive: {
    backgroundColor: "rgba(99,102,241,0.24)",
    borderColor: "rgba(99,102,241,0.5)",
  },
  trendChipText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#A5B4FC",
  },
  trendCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  trendCountText: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.55)",
  },

  emptyCard: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    gap: 8,
  },
  emptyCardText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
  },

  // Module rows (idle)
  moduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  moduleRowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleRowTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.88)",
  },
  moduleRowSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
  },

  // Idle hero card
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.22)",
    backgroundColor: "rgba(99,102,241,0.05)",
    overflow: "hidden",
  },
  heroCardGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  heroCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
    shadowColor: "#6366F1",
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  heroCardTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },
  heroCardText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.55)",
  },

  // Loading
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#A5B4FC",
  },
  loadingText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
  skeletonCard: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },

  // Result summary
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },
  summarySub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    marginTop: 2,
  },
  summaryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  summaryChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.55)",
  },
  summaryChipActive: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.2)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.45)",
  },
  summaryChipActiveText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#C4B5FD",
  },

  // Result card
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  resultIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  resultIconDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 2,
    borderColor: "#07050F",
  },
  resultTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultTitle: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.92)",
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  resultBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  resultDescription: {
    marginTop: 3,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.45)",
  },
  resultMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    flexWrap: "wrap",
  },
  resultMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  resultMetaText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
  },
  resultAuthor: {
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
  },

  // Avatar
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "visible",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.15)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#34D399",
    borderWidth: 2,
    borderColor: "#07050F",
  },

  // More button
  moreBtn: {
    marginTop: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  moreBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#A5B4FC",
  },

  // Empty
  emptySection: {
    alignItems: "center",
    paddingVertical: 32,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(255,255,255,0.02)",
    gap: 8,
  },
  emptySectionText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
  },

  // No results
  noResultsCard: {
    padding: 28,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.025)",
    alignItems: "center",
    gap: 12,
  },
  noResultsIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
  },
  noResultsTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "rgba(255,255,255,0.88)",
    letterSpacing: 0.2,
  },
  noResultsText: {
    maxWidth: 320,
    fontSize: 11,
    lineHeight: 17,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
  },
  suggestChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  suggestChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
  },
});

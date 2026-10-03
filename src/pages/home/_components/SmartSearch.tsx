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
  KeyboardAvoidingView,
  StatusBar,
  ActivityIndicator,
  useWindowDimensions,
  type GestureResponderEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Component,
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
  BookOpen,
  Wallet,
  Users,
  Radio,
  Building2,
  Hotel,
  ShoppingBag,
  PlayCircle,
  MapPin,
} from "lucide-react-native";

/**
 * IMPORTANT : en React Native, `typeof window !== "undefined"` est VRAI
 * (window existe) mais `window.addEventListener` et `window.localStorage`
 * n'existent pas. L'ancien test `isBrowser` faisait donc planter l'ouverture
 * de la recherche. On se base uniquement sur Platform.OS.
 */
const isWeb = Platform.OS === "web";

/**
 * Hauteur de la barre d'état Android : le Modal est `statusBarTranslucent`,
 * le contenu passe sous la barre d'état.
 */
const TOP_INSET: number =
  Platform.OS === "android" ? (StatusBar.currentHeight ?? 28) : 44;

/* ============================================================
 * TYPES — alignés sur `searchV2`
 * ============================================================ */

type ParsedIntent = {
  raw: string;
  normalized: string;
  tokens: string[];
  meaningfulTokens: string[];
  actions: string[];
  primaryAction: string | null;
  entities: string[];
  primaryEntity: string | null;
  locations: string[];
  primaryLocation: string | null;
  domains: string[];
};

type ScoredHit = {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  badge?: string;
  badgeColor?: string;
  route: string;
  score: number;
  domain: string;
  fields: {
    title: string;
    description?: string;
    tags?: string[];
    city?: string;
    country?: string;
    category?: string;
    type?: string;
  };
};

type ResultGroup = {
  domain: string;
  label: string;
  route: string;
  color: string;
  description: string;
  totalCount: number;
  topResults: ScoredHit[];
};

type SearchV2Response = {
  parsed?: ParsedIntent;
  groups?: ResultGroup[];
  totalCount?: number;
};

/* ============================================================
 * QUICK MODULES (raccourcis + repli local de recherche)
 * ============================================================ */

interface QuickModule {
  id: string;
  title: string;
  color: string;
  route: string;
  keywords: string[];
}

const QUICK_MODULES: QuickModule[] = [
  {
    id: "mod-immo",
    title: "Immobilier",
    color: "#34D399",
    route: "immo",
    keywords: [
      "maison",
      "louer",
      "location",
      "appartement",
      "terrain",
      "logement",
      "villa",
      "studio",
      "habiter",
    ],
  },
  {
    id: "mod-jobs",
    title: "Emploi",
    color: "#A78BFA",
    route: "jobs",
    keywords: [
      "emploi",
      "travail",
      "travailler",
      "job",
      "stage",
      "recrutement",
      "poste",
      "mission",
      "freelance",
    ],
  },
  {
    id: "mod-market",
    title: "Marketplace",
    color: "#F472B6",
    route: "marketplace",
    keywords: [
      "marketplace",
      "boutique",
      "produit",
      "vendre",
      "acheter",
      "iphone",
      "telephone",
      "shop",
    ],
  },
  {
    id: "mod-annonces",
    title: "Annonces",
    color: "#FBBF24",
    route: "annonces",
    keywords: ["annonce", "annonces", "occasion", "vente", "troc"],
  },
  {
    id: "mod-sante",
    title: "Santé",
    color: "#F87171",
    route: "sante",
    keywords: [
      "sante",
      "medecin",
      "docteur",
      "pharmacie",
      "hopital",
      "clinique",
      "urgence",
    ],
  },
  {
    id: "mod-services",
    title: "Services",
    color: "#818CF8",
    route: "services",
    keywords: [
      "service",
      "services",
      "plombier",
      "electricien",
      "reparation",
      "artisan",
      "depannage",
      "chauffeur",
    ],
  },
  {
    id: "mod-evenements",
    title: "Événements",
    color: "#F472B6",
    route: "evenements",
    keywords: [
      "evenement",
      "evenements",
      "concert",
      "fete",
      "soiree",
      "festival",
    ],
  },
  {
    id: "mod-voyages",
    title: "Voyages",
    color: "#818CF8",
    route: "voyages",
    keywords: [
      "voyage",
      "voyager",
      "billet",
      "avion",
      "vol",
      "vacances",
      "destination",
    ],
  },
  {
    id: "mod-apprendre",
    title: "Cours",
    color: "#22D3EE",
    route: "cours",
    keywords: [
      "cours",
      "apprendre",
      "formation",
      "ecole",
      "javascript",
      "tutoriel",
    ],
  },
  {
    id: "mod-live",
    title: "Live",
    color: "#F87171",
    route: "live-streaming",
    keywords: ["live", "direct", "streaming", "diffusion"],
  },
  {
    id: "mod-agri",
    title: "Agri",
    color: "#A3E635",
    route: "agri",
    keywords: ["agri", "agriculture", "ferme", "recolte", "elevage", "champ"],
  },
  {
    id: "mod-community",
    title: "Communauté",
    color: "#FB7185",
    route: "community",
    keywords: ["communaute", "community", "groupe", "discussion", "forum"],
  },
];

/* ============================================================
 * TRENDING (queries suggérées)
 * ============================================================ */

const TRENDING = [
  "maison à louer",
  "chauffeur Kolwezi",
  "javascript",
  "plombier",
  "billet Lubumbashi",
  "iPhone",
  "live",
];

/* ============================================================
 * HELPERS
 * ============================================================ */

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Repli LOCAL : retrouve les modules de l'app correspondant à la requête,
 * sans dépendre du backend. Garantit que la recherche mène toujours quelque
 * part, même si `searchV2` est lent, vide ou en erreur.
 */
function buildModuleHits(rawQuery: string): ScoredHit[] {
  const tokens = normalizeText(rawQuery)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);

  if (tokens.length === 0) {
    return [];
  }

  const hits: ScoredHit[] = [];

  for (const mod of QUICK_MODULES) {
    const words = [mod.title, ...mod.keywords].map(normalizeText);

    let score = 0;

    for (const token of tokens) {
      for (const word of words) {
        if (word === token) {
          score += 3;
          break;
        }

        if (
          word.startsWith(token) ||
          (word.length >= 4 && token.startsWith(word))
        ) {
          score += 2;
          break;
        }
      }
    }

    if (score > 0) {
      hits.push({
        id: `module-${mod.id}`,
        title: mod.title,
        subtitle: "Ouvrir ce module",
        badge: "Module",
        badgeColor: mod.color,
        route: mod.route,
        score,
        domain: mod.route,
        fields: { title: mod.title },
      });
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, 4);
}

function getDomainIcon(
  domain: string,
  size = 14,
  color = "#C4B5FD",
): ReactNode {
  const props = { size, color };

  switch (domain) {
    case "immo":
      return <Home {...props} />;
    case "jobs":
      return <Briefcase {...props} />;
    case "apprendre":
    case "cours":
      return <BookOpen {...props} />;
    case "publications":
      return <Newspaper {...props} />;
    case "live":
    case "live-streaming":
      return <Radio {...props} />;
    case "hebergement":
      return <Hotel {...props} />;
    case "marketplace":
      return <ShoppingBag {...props} />;
    case "annonces":
      return <Newspaper {...props} />;
    case "sante":
      return <Stethoscope {...props} />;
    case "agri":
      return <Leaf {...props} />;
    case "services":
      return <Package {...props} />;
    case "evenements":
      return <Calendar {...props} />;
    case "voyages":
      return <Plane {...props} />;
    case "finance":
      return <Wallet {...props} />;
    case "community":
      return <Users {...props} />;
    case "business":
      return <Building2 {...props} />;
    case "media":
      return <Newspaper {...props} />;
    case "series":
      return <PlayCircle {...props} />;
    case "urban":
      return <Building2 {...props} />;
    default:
      return <Search {...props} />;
  }
}

/* ============================================================
 * HISTORIQUE (AsyncStorage — fonctionne sur Android, iOS et web)
 * ============================================================ */

const HISTORY_KEY = "debrouille_search_history";
const MAX_HISTORY = 8;

async function loadHistory(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((value): value is string => typeof value === "string")
      .slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

async function persistHistory(list: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    // L'historique est une préférence locale non critique.
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
    const running = Animated.timing(animation, {
      toValue: 1,
      duration: 380,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    running.start();

    return () => {
      running.stop();
    };
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
 * RESULT ROW
 * ============================================================ */

function ResultRow({
  hit,
  index,
  onSelect,
}: {
  hit: ScoredHit;
  index: number;
  onSelect: (hit: ScoredHit) => void;
}) {
  const color = hit.badgeColor ?? "#C4B5FD";
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
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={() => onSelect(hit)}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityLabel={`${hit.title} — ${hit.subtitle}`}
          style={styles.resultRow}
        >
          <LinearGradient
            colors={[`${color}14`, "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View
            style={[
              styles.resultIcon,
              {
                backgroundColor: `${color}22`,
                borderColor: `${color}44`,
              },
            ]}
          >
            {getDomainIcon(hit.domain, 14, color)}
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.resultTitle} numberOfLines={1}>
              {hit.title}
            </Text>
            <Text style={styles.resultSubtitle} numberOfLines={1}>
              {hit.subtitle}
            </Text>
          </View>

          <View style={styles.resultMetaCol}>
            {hit.meta ? (
              <Text style={styles.resultMeta} numberOfLines={1}>
                {hit.meta}
              </Text>
            ) : null}

            {hit.badge ? (
              <View
                style={[styles.resultBadge, { backgroundColor: `${color}22` }]}
              >
                <Text
                  style={[styles.resultBadgeText, { color }]}
                  numberOfLines={1}
                >
                  {hit.badge}
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
 * SECTION « MODULES » (repli local)
 * ============================================================ */

function ModuleHitsSection({
  hits,
  onSelect,
}: {
  hits: ScoredHit[];
  onSelect: (hit: ScoredHit) => void;
}) {
  if (hits.length === 0) {
    return null;
  }

  return (
    <View style={styles.resultGroup}>
      <SectionLabel icon={<LayoutGrid size={12} color="#C4B5FD" />}>
        Modules ({hits.length})
      </SectionLabel>

      {hits.map((hit, index) => (
        <ResultRow key={hit.id} hit={hit} index={index} onSelect={onSelect} />
      ))}
    </View>
  );
}

/* ============================================================
 * ERROR BOUNDARY
 *
 * Convex `useQuery` RELANCE dans le rendu toute erreur levée par la fonction
 * serveur (ou par un `api.search.searchV2` introuvable). Sans boundary, cela
 * fait planter toute l'application. Ici l'erreur reste confinée à la zone de
 * résultats, qui affiche un repli local.
 * ============================================================ */

type SearchBoundaryProps = {
  children: ReactNode;
  resetKey: string;
  fallback: (reset: () => void) => ReactNode;
};

type SearchBoundaryState = {
  hasError: boolean;
};

class SearchErrorBoundary extends Component<
  SearchBoundaryProps,
  SearchBoundaryState
> {
  state: SearchBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SearchBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(previous: SearchBoundaryProps): void {
    if (previous.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  reset = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback(this.reset);
    }

    return this.props.children;
  }
}

function SearchFallback({
  moduleHits,
  onSelectHit,
  onRetry,
}: {
  moduleHits: ScoredHit[];
  onSelectHit: (hit: ScoredHit) => void;
  onRetry: () => void;
}) {
  return (
    <View style={styles.resultsContainer}>
      <FadeUp>
        <View style={styles.fallbackBox}>
          <Text style={styles.fallbackTitle}>
            Recherche en ligne indisponible
          </Text>

          <Text style={styles.fallbackText}>
            Impossible de joindre le moteur de recherche pour le moment. Les
            modules ci-dessous restent accessibles.
          </Text>

          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Réessayer la recherche"
            style={styles.noResultsButton}
          >
            <Text style={styles.noResultsButtonText}>Réessayer</Text>
          </Pressable>
        </View>
      </FadeUp>

      <ModuleHitsSection hits={moduleHits} onSelect={onSelectHit} />
    </View>
  );
}

/* ============================================================
 * PANNEAU DE RÉSULTATS (appelle Convex — protégé par le boundary)
 * ============================================================ */

function SearchResultsPanel({
  query,
  moduleHits,
  onSelectHit,
  onSeeAll,
  onClear,
}: {
  query: string;
  moduleHits: ScoredHit[];
  onSelectHit: (hit: ScoredHit) => void;
  onSeeAll: (route: string) => void;
  onClear: () => void;
}) {
  const response = useQuery(api.search.searchV2, {
    query,
  }) as SearchV2Response | null | undefined;

  const [slow, setSlow] = useState(false);

  const loading = response === undefined;

  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }

    const timer = setTimeout(() => setSlow(true), 8000);

    return () => clearTimeout(timer);
  }, [loading]);

  const groups = useMemo<ResultGroup[]>(() => {
    if (!response || !Array.isArray(response.groups)) {
      return [];
    }

    return response.groups.filter(
      (group): group is ResultGroup =>
        Boolean(group) && Array.isArray(group.topResults),
    );
  }, [response]);

  const backendCount = groups.reduce(
    (sum, group) =>
      sum +
      (typeof group.totalCount === "number"
        ? group.totalCount
        : group.topResults.length),
    0,
  );

  const parsed = response?.parsed;

  const nothing = !loading && backendCount === 0 && moduleHits.length === 0;

  return (
    <View style={styles.resultsContainer}>
      {/* ─── INTENT CHIPS ─── */}
      {!loading && parsed && backendCount > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.chip,
              {
                backgroundColor: "rgba(196,181,253,0.18)",
                borderColor: "rgba(196,181,253,0.4)",
              },
            ]}
          >
            <Sparkles size={10} color="#C4B5FD" />
            <Text style={[styles.chipText, { color: "#fff" }]}>
              {backendCount} résultat{backendCount > 1 ? "s" : ""}
            </Text>
          </View>

          {parsed.primaryAction ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>⚡ {parsed.primaryAction}</Text>
            </View>
          ) : null}

          {parsed.primaryEntity ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{parsed.primaryEntity}</Text>
            </View>
          ) : null}

          {parsed.primaryLocation ? (
            <View style={styles.chip}>
              <MapPin size={10} color="#94A3B8" />
              <Text style={styles.chipText}>{parsed.primaryLocation}</Text>
            </View>
          ) : null}
        </ScrollView>
      ) : null}

      {/* ─── MODULES (repli local, immédiat) ─── */}
      <ModuleHitsSection hits={moduleHits} onSelect={onSelectHit} />

      {/* ─── CHARGEMENT ─── */}
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#C4B5FD" />

          <Text style={styles.loadingRowText}>
            {slow ? "La recherche est un peu lente…" : "Recherche…"}
          </Text>
        </View>
      ) : null}

      {/* ─── RÉSULTATS BACKEND ─── */}
      {!loading
        ? groups.map((group) => (
            <FadeUp key={group.domain}>
              <View style={styles.resultGroup}>
                <SectionLabel
                  icon={getDomainIcon(group.domain, 12, group.color)}
                >
                  {group.label} ({group.totalCount})
                </SectionLabel>

                {group.topResults.map((hit, index) => (
                  <ResultRow
                    key={hit.id}
                    hit={hit}
                    index={index}
                    onSelect={onSelectHit}
                  />
                ))}

                {group.totalCount > group.topResults.length ? (
                  <Pressable
                    onPress={() => onSeeAll(group.route)}
                    style={({ pressed }) => [
                      styles.seeAllBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={styles.seeAllBtnText}>
                      Voir les {group.totalCount} résultats dans {group.label}
                    </Text>
                    <ArrowUpRight size={11} color="#C4B5FD" />
                  </Pressable>
                ) : null}
              </View>
            </FadeUp>
          ))
        : null}

      {/* ─── AUCUN RÉSULTAT ─── */}
      {nothing ? (
        <FadeUp>
          <View style={styles.noResultsWrap}>
            <View style={styles.noResultsIcon}>
              <Search size={24} color="rgba(196,181,253,0.85)" />
            </View>

            <Text style={styles.noResultsTitle}>Aucun résultat</Text>

            <Text style={styles.noResultsQuery} numberOfLines={2}>
              « {query} »
            </Text>

            <Pressable onPress={onClear} style={styles.noResultsButton}>
              <Text style={styles.noResultsButtonText}>Nouvelle recherche</Text>
            </Pressable>
          </View>
        </FadeUp>
      ) : null}
    </View>
  );
}

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

          <Animated.View style={{ transform: [{ scale: sparkleScale }] }}>
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
          keyboardShouldPersistTaps="handled"
        >
          {[
            { id: "emploi", label: "Emploi", query: "emploi" },
            { id: "service", label: "Service", query: "service" },
            { id: "maison", label: "Maison", query: "maison" },
            { id: "annonces", label: "Annonces", query: "annonce" },
            { id: "voyage", label: "Voyager", query: "voyage" },
          ].map((action) => (
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
              <Text style={styles.homeActionText}>{action.label}</Text>
            </Pressable>
          ))}

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
 * COMPOSANT PRINCIPAL
 * ============================================================ */

interface SmartSearchProps {
  onNavigate: (page: string) => void;
  onAdvancedSearch?: () => void;
}

export default function SmartSearch({ onNavigate }: SmartSearchProps) {
  /**
   * Dimensions EXPLICITES : dans le Modal natif Android, `flex: 1` /
   * `absoluteFill` n'ont pas de parent aux dimensions définies et le contenu
   * s'effondrait en une bande étroite.
   */
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const historyRef = useRef<string[]>([]);
  const closingRef = useRef(false);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(0)).current;

  const trimmedQuery = query.trim();
  const showResults = trimmedQuery.length >= 2;
  const debouncePending = showResults && debouncedQuery !== trimmedQuery;

  const moduleHits = useMemo(
    () => (showResults ? buildModuleHits(trimmedQuery) : []),
    [showResults, trimmedQuery],
  );

  /* ─── HISTORY ─── */
  const commitHistory = useCallback((next: string[]) => {
    historyRef.current = next;
    setHistory(next);
    void persistHistory(next);
  }, []);

  const rememberQuery = useCallback(
    (value: string) => {
      const clean = value.trim();

      if (clean.length < 2) {
        return;
      }

      commitHistory(
        [clean, ...historyRef.current.filter((item) => item !== clean)].slice(
          0,
          MAX_HISTORY,
        ),
      );
    },
    [commitHistory],
  );

  useEffect(() => {
    let cancelled = false;

    void loadHistory().then((loaded) => {
      if (cancelled) {
        return;
      }

      historyRef.current = loaded;
      setHistory(loaded);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  /* ─── DEBOUNCE (évite une souscription Convex par frappe) ─── */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmedQuery);
    }, 280);

    return () => clearTimeout(timer);
  }, [trimmedQuery]);

  /* ─── VOICE SUPPORT DETECTION (web uniquement) ─── */
  useEffect(() => {
    if (!isWeb || typeof window === "undefined") {
      return;
    }

    setIsVoiceSupported(
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    );
  }, []);

  /* ─── ENTRANCE ANIMATION ─── */
  useEffect(() => {
    if (!open) {
      return;
    }

    closingRef.current = false;

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

  /* ─── HANDLERS ─── */

  const handleClose = useCallback(() => {
    if (closingRef.current) {
      return;
    }

    closingRef.current = true;

    Keyboard.dismiss();

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
      setDebouncedQuery("");
      setListening(false);
      closingRef.current = false;
    });
  }, [backdropAnim, panelAnim]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 260);
  }, []);

  const handleQuickSearch = useCallback((value: string) => {
    setQuery(value);
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 280);
  }, []);

  const handleSelectHit = useCallback(
    (hit: ScoredHit) => {
      rememberQuery(trimmedQuery);
      handleClose();
      onNavigate(hit.route);
    },
    [handleClose, onNavigate, rememberQuery, trimmedQuery],
  );

  const handleSeeAll = useCallback(
    (route: string) => {
      rememberQuery(trimmedQuery);
      handleClose();
      onNavigate(route);
    },
    [handleClose, onNavigate, rememberQuery, trimmedQuery],
  );

  const handleSelectModule = useCallback(
    (mod: QuickModule) => {
      handleClose();
      onNavigate(mod.route);
    },
    [handleClose, onNavigate],
  );

  const handleHistorySelect = useCallback((value: string) => {
    setQuery(value);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleRemoveHistory = useCallback(
    (value: string, event: GestureResponderEvent) => {
      event.stopPropagation?.();
      commitHistory(historyRef.current.filter((item) => item !== value));
    },
    [commitHistory],
  );

  const handleClearHistory = useCallback(() => {
    commitHistory([]);
  }, [commitHistory]);

  const handleSubmit = useCallback(() => {
    rememberQuery(trimmedQuery);
  }, [rememberQuery, trimmedQuery]);

  const handleVoice = useCallback(() => {
    if (!isWeb || typeof window === "undefined" || !isVoiceSupported) {
      return;
    }

    if (listening) {
      return;
    }

    type SpeechRecognitionResultEvent = Event & {
      results?: {
        [index: number]: { [index: number]: { transcript?: string } };
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
    };

    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  }, [isVoiceSupported, listening]);

  /* ─── WEB ESCAPE KEY (jamais sur natif) ─── */
  useEffect(() => {
    if (
      !isWeb ||
      !open ||
      typeof window === "undefined" ||
      typeof window.addEventListener !== "function"
    ) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, [handleClose, open]);

  /* ─── DERIVED ─── */
  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.04, 0],
  });

  const panelScale = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1],
  });

  /* ========================================================
   * RENDER
   * ====================================================== */

  return (
    <>
      {/* ═══════════ TRIGGER HOME ═══════════ */}
      <HomeSearchTrigger
        onOpen={handleOpen}
        onQuickSearch={handleQuickSearch}
      />

      {/* ═══════════ MODAL ═══════════ */}
      {open ? (
        <Modal
          transparent
          visible={open}
          animationType="none"
          onRequestClose={handleClose}
          statusBarTranslucent
        >
          <KeyboardAvoidingView
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
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
                    { translateY: panelTranslateY },
                    { scale: panelScale },
                  ],
                },
              ]}
              accessibilityLabel="Recherche DébrouillePro"
            >
              <LinearGradient
                colors={["#06061A", "#0A0620", "#06061A"]}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.ambientGlowTop} pointerEvents="none" />
              <View style={styles.ambientGlowRight} pointerEvents="none" />

              {/* HEADER */}
              <View style={[styles.header, { paddingTop: TOP_INSET + 8 }]}>
                <View style={styles.headerTopRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
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
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <X size={17} color="rgba(255,255,255,0.75)" />
                  </Pressable>
                </View>

                {/* SEARCH BAR */}
                <View style={styles.searchBar}>
                  <Search size={18} color="#C4B5FD" strokeWidth={2.4} />

                  <TextInput
                    ref={inputRef}
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSubmit}
                    placeholder="Que veux-tu faire ? (ex: maison à louer)"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={styles.searchInput}
                    autoComplete="off"
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="search"
                    accessibilityLabel="Rechercher"
                  />

                  {query ? (
                    <Pressable
                      onPress={() => setQuery("")}
                      hitSlop={6}
                      accessibilityLabel="Effacer la recherche"
                      style={({ pressed }) => [
                        styles.searchClearBtn,
                        pressed && { opacity: 0.7 },
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
                      accessibilityState={{ selected: listening }}
                      hitSlop={6}
                      style={({ pressed }) => [
                        styles.searchMicBtn,
                        listening && styles.searchMicBtnActive,
                        pressed && { opacity: 0.85 },
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
              </View>

              {/* BODY */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* ─── ÉTAT IDLE (pas de recherche) ─── */}
                {!showResults ? (
                  <View style={{ gap: 28, paddingTop: 12 }}>
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
                        {QUICK_MODULES.map((mod, index) => (
                          <FadeUp
                            key={mod.id}
                            delay={index * 25}
                            distance={8}
                            style={styles.quickGridItemWrap}
                          >
                            <Pressable
                              onPress={() => handleSelectModule(mod)}
                              accessibilityRole="button"
                              accessibilityLabel={mod.title}
                              style={({ pressed }) => [
                                styles.quickModule,
                                pressed && { opacity: 0.85 },
                              ]}
                            >
                              <LinearGradient
                                colors={[`${mod.color}22`, `${mod.color}08`]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[
                                  styles.quickModuleIcon,
                                  { borderColor: `${mod.color}44` },
                                ]}
                              >
                                {getDomainIcon(mod.route, 15, mod.color)}
                              </LinearGradient>
                              <Text
                                style={styles.quickModuleLabel}
                                numberOfLines={2}
                              >
                                {mod.title}
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

                            <Pressable onPress={handleClearHistory} hitSlop={6}>
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

                    {/* TRENDING */}
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
                                  pressed && { opacity: 0.85 },
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

                    {/* AI CARD */}
                    <FadeUp>
                      <View style={styles.aiCard}>
                        <LinearGradient
                          colors={[
                            "rgba(139,92,246,0.2)",
                            "rgba(99,102,241,0.1)",
                            "rgba(15,7,32,0.6)",
                          ]}
                          locations={[0, 0.5, 1]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                        />

                        <View style={styles.aiCardRow}>
                          <View style={styles.aiCardIcon}>
                            <Sparkles size={16} color="#C4B5FD" />
                          </View>

                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.aiCardEyebrow}>
                              DÉBROUILLE AI
                            </Text>
                            <Text style={styles.aiCardText}>
                              Décris ton besoin en langage naturel. Je trouve où
                              et comment le satisfaire.
                            </Text>
                            <Pressable
                              onPress={() => setQuery("maison à louer")}
                              style={({ pressed }) => [
                                styles.aiCardBtn,
                                pressed && { opacity: 0.7 },
                              ]}
                            >
                              <Text style={styles.aiCardBtnText}>
                                Essayer une recherche
                              </Text>
                              <ArrowUpRight size={11} color="#C4B5FD" />
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    </FadeUp>
                  </View>
                ) : null}

                {/* ─── RECHERCHE EN COURS DE SAISIE (debounce) ─── */}
                {showResults && debouncePending ? (
                  <View style={styles.resultsContainer}>
                    <ModuleHitsSection
                      hits={moduleHits}
                      onSelect={handleSelectHit}
                    />

                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#C4B5FD" />

                      <Text style={styles.loadingRowText}>Recherche…</Text>
                    </View>
                  </View>
                ) : null}

                {/* ─── RÉSULTATS (Convex isolé par un error boundary) ─── */}
                {showResults && !debouncePending ? (
                  <SearchErrorBoundary
                    resetKey={debouncedQuery}
                    fallback={(reset) => (
                      <SearchFallback
                        moduleHits={moduleHits}
                        onSelectHit={handleSelectHit}
                        onRetry={reset}
                      />
                    )}
                  >
                    <SearchResultsPanel
                      query={debouncedQuery}
                      moduleHits={moduleHits}
                      onSelectHit={handleSelectHit}
                      onSeeAll={handleSeeAll}
                      onClear={() => setQuery("")}
                    />
                  </SearchErrorBoundary>
                ) : null}
              </ScrollView>
            </Animated.View>
          </KeyboardAvoidingView>
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
  homeTriggerWrap: { marginTop: 8, marginHorizontal: 16 },
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
    transform: [{ scale: 0.99 }],
  },
  homeSearchTopRow: { flexDirection: "row", alignItems: "center" },
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
  homeSearchTitleWrap: { flex: 1, minWidth: 0 },
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
    alignItems: "center",
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
  panel: { flex: 1, overflow: "hidden", backgroundColor: "#06061A" },
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
  header: { paddingHorizontal: 16, paddingBottom: 12 },
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
  searchMicBtnActive: { backgroundColor: "rgba(248,113,113,0.14)" },

  chipsRow: { paddingRight: 8, gap: 7 },
  chip: {
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  chipText: { color: "#94A3B8", fontSize: 9, fontWeight: "700" },

  bodyContent: { paddingHorizontal: 16, paddingBottom: 40 },
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

  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  quickGridItemWrap: { width: "22.5%" },
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
  historyClear: { color: "#8B5CF6", fontSize: 9, fontWeight: "700" },
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

  trendingRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
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
  trendingChipText: { color: "#94A3B8", fontSize: 9, fontWeight: "700" },

  aiCard: {
    overflow: "hidden",
    padding: 14,
    borderRadius: 19,
    backgroundColor: "rgba(124,58,237,0.08)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.14)",
  },
  aiCardRow: { flexDirection: "row", alignItems: "flex-start" },
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
  aiCardBtnText: { color: "#C4B5FD", fontSize: 9, fontWeight: "800" },

  resultsContainer: { gap: 18, paddingTop: 12 },
  resultGroup: { gap: 7 },

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
  resultIcon: {
    width: 38,
    height: 38,
    marginRight: 10,
    borderRadius: 12,
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
  resultMetaCol: { maxWidth: 90, marginLeft: 8, alignItems: "flex-end" },
  resultMeta: { color: "#94A3B8", fontSize: 8, fontWeight: "700" },
  resultBadge: {
    minHeight: 17,
    marginTop: 3,
    paddingHorizontal: 5,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  resultBadgeText: { fontSize: 7, fontWeight: "900" },

  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  seeAllBtnText: {
    color: "#C4B5FD",
    fontSize: 10,
    fontWeight: "800",
  },

  loadingRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingRowText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
  },

  fallbackBox: {
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
    backgroundColor: "rgba(248,113,113,0.06)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.2)",
  },
  fallbackTitle: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  fallbackText: {
    marginTop: 6,
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "600",
    textAlign: "center",
  },

  noResultsWrap: {
    minHeight: 260,
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
  noResultsTitle: { color: "#F8FAFC", fontSize: 16, fontWeight: "800" },
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
  noResultsButtonText: { color: "#C4B5FD", fontSize: 10, fontWeight: "800" },
});

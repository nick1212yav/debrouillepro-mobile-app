import { View, Pressable, Text, Image, TextInput } from "react-native";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
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
  Hash,
  Compass,
  Zap,
  Map,
} from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";

/* ============================================================================
 * STORAGE
 * ========================================================================== */

const HISTORY_KEY = "adv_search_history";
const MAX_HISTORY = 10;

function getHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);

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
  const normalized = term.trim();

  if (!normalized) return;

  const previous = getHistory().filter(
    (item) => item.toLowerCase() !== normalized.toLowerCase(),
  );

  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify([normalized, ...previous].slice(0, MAX_HISTORY)),
  );
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

/* ============================================================================
 * FILTERS
 * ========================================================================== */

const TYPE_FILTERS = [
  {
    label: "Tout",
    value: "",
    icon: Compass,
  },
  {
    label: "Immo",
    value: "immo",
    icon: Building2,
  },
  {
    label: "Emploi",
    value: "job",
    icon: BriefcaseBusiness,
  },
  {
    label: "Services",
    value: "service",
    icon: Zap,
  },
  {
    label: "Événements",
    value: "evenement",
    icon: CalendarDays,
  },
  {
    label: "Annonces",
    value: "annonce",
    icon: ShoppingBag,
  },
  {
    label: "Agri",
    value: "agri",
    icon: Sprout,
  },
  {
    label: "Santé",
    value: "sante",
    icon: HeartPulse,
  },
  {
    label: "Transport",
    value: "transport",
    icon: Car,
  },
] as const;

type FilterValue = (typeof TYPE_FILTERS)[number]["value"];

const TABS = ["Tout", "Publications", "Personnes", "Modules"] as const;

type TabType = (typeof TABS)[number];

/* ============================================================================
 * COLORS / LABELS
 * ========================================================================== */

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

/* ============================================================================
 * MODULES
 * ========================================================================== */

interface ModuleEntry {
  id: string;
  title: string;
  subtitle: string;
  page: string;
  category: string;
  icon: typeof Layers;
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

/* ============================================================================
 * PROPS
 * ========================================================================== */

interface AdvancedSearchProps {
  onClose: () => void;
  onNavigate: (page: string) => void;
  onViewProfile: (userId: Id<"users">) => void;
}

/* ============================================================================
 * COMPONENT
 * ========================================================================== */

export default function AdvancedSearch({
  onClose,
  onNavigate,
  onViewProfile,
}: AdvancedSearchProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("Tout");

  const [typeFilter, setTypeFilter] = useState<FilterValue>("");

  const [history, setHistory] = useState<string[]>(getHistory);

  const [showFilters, setShowFilters] = useState(false);

  const [isListening, setIsListening] = useState(false);

  const [selectedTrending, setSelectedTrending] = useState<string | null>(null);

  const searchInputRef = useRef<TextInput>(null);

  const [debouncedQuery] = useDebounce(query, 350);

  /* --------------------------------------------------------------------------
   * BACKEND SEARCH
   * ------------------------------------------------------------------------ */

  const pubResults = useQuery(
    api.search.searchPublications,
    debouncedQuery.length >= 2
      ? {
          q: debouncedQuery,
          ...(typeFilter
            ? {
                type: typeFilter as Exclude<FilterValue, "">,
              }
            : {}),
        }
      : "skip",
  );

  const userResults = useQuery(
    api.search.searchUsers,
    debouncedQuery.length >= 2
      ? {
          q: debouncedQuery,
        }
      : "skip",
  );

  const trendingTags = useQuery(api.search.getTrendingTags, {});

  /* --------------------------------------------------------------------------
   * MODULE SEARCH
   * ------------------------------------------------------------------------ */

  const moduleResults = useMemo(() => {
    if (debouncedQuery.length < 2) {
      return [];
    }

    const normalized = debouncedQuery.toLowerCase();

    return MODULES.filter((module) =>
      [module.title, module.subtitle, module.category].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [debouncedQuery]);

  /* --------------------------------------------------------------------------
   * STATE
   * ------------------------------------------------------------------------ */

  const isSearching = debouncedQuery.length >= 2;

  const isLoading =
    isSearching && (pubResults === undefined || userResults === undefined);

  const publicationCount = pubResults?.length ?? 0;

  const peopleCount = userResults?.length ?? 0;

  const moduleCount = moduleResults.length;

  const totalResults = publicationCount + peopleCount + moduleCount;

  const activeFilterLabel =
    TYPE_FILTERS.find((filter) => filter.value === typeFilter)?.label ?? "Tout";

  /* --------------------------------------------------------------------------
   * SEARCH ACTIONS
   * ------------------------------------------------------------------------ */

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

    undefined;
  }, []);

  /* --------------------------------------------------------------------------
   * KEYBOARD SHORTCUT
   * ------------------------------------------------------------------------ */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        searchInputRef.current?.focus();
      }

      if (event.key === "Escape") {
        if (query) {
          clearSearch();
        } else {
          onClose();
        }
      }
    };

    undefined;

    return () => {
      undefined;
    };
  }, [clearSearch, onClose, query]);

  /* --------------------------------------------------------------------------
   * VOICE SEARCH
   * ------------------------------------------------------------------------ */

  const startVoiceSearch = useCallback(() => {
    const speechWindow = undefined as typeof undefined & {
      SpeechRecognition?: new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onresult:
          | ((event: {
              results: {
                [index: number]: {
                  [index: number]: {
                    transcript: string;
                  };
                };
              };
            }) => void)
          | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onresult:
          | ((event: {
              results: {
                [index: number]: {
                  [index: number]: {
                    transcript: string;
                  };
                };
              };
            }) => void)
          | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
    };

    const Recognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      return;
    }

    const recognition = new Recognition();

    recognition.lang = "en" || "fr-FR";

    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";

      if (transcript.trim()) {
        setQuery(transcript.trim());
        handleSearch(transcript);
      }

      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }, [handleSearch]);

  /* --------------------------------------------------------------------------
   * FOCUS
   * ------------------------------------------------------------------------ */

  useEffect(() => {
    const timer = undefined;

    return () => {
      undefined;
    };
  }, []);

  /* ==========================================================================
   * RENDER
   * ======================================================================== */

  return (
    <View
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{  }}
    >
      {/* =====================================================================
          AMBIENT BACKGROUND
      ====================================================================== */}

      <View
       
        className="absolute -top-44 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full"
        style={{  }}
      />

      <View
        className="absolute -bottom-52 -right-40 h-[30rem] w-[30rem] rounded-full"
        style={{  }}
      />

      {/* =====================================================================
          TOP HEADER
      ====================================================================== */}

      <View className="relative z-10 flex flex-shrink-0 items-center gap-2.5 px-3 pb-3 pt-[max(.8rem,env(safe-area-inset-top))] sm:px-5">
        {/* BACK */}
        <Pressable
          onPress={onClose}
          accessibilityLabel="Fermer la recherche"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.045] text-white/55"
        >
          <ArrowLeft size={17} />
        </Pressable>

        {/* SEARCH BAR */}
        <View
          className="relative flex min-w-0 flex-1 items-center gap-2 rounded-[22px] border px-3.5 py-2.5"
          style={{ backgroundColor: "rgba(255,255,255,.055)", borderColor: isSearching
                        ? "rgba(99,102,241,.35)"
                        : "rgba(255,255,255,.09)" }}
        >
          <Search
            size={17}
            className={
              isSearching
                ? "flex-shrink-0 text-indigo-400"
                : "flex-shrink-0 text-white/35"
            }
          />

          <TextInput
            ref={searchInputRef}
            autoFocus
            value={query}
            onChangeText={(text) => setQuery(text)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && query.trim()) {
                handleSearch(query);
              }
            }}
            placeholder="Rechercher dans DébrouillePro…"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/30 sm:text-sm"
            accessibilityLabel="Rechercher dans DébrouillePro"
          />

          {/* VOICE */}
          <Pressable
            onPress={startVoiceSearch}
            accessibilityLabel="Recherche vocale"
            className="hidden h-7 w-7 items-center justify-center rounded-xl bg-white/[0.04] sm:flex"
          >
            <>
              {isListening ? (
                <Text
                  key="listening"
                >
                  <Mic size={13} className="text-red-400" />
                </Text>
              ) : (
                <Text
                  key="idle"
                >
                  <Mic size={13} className="text-white/30" />
                </Text>
              )}
            </>
          </Pressable>

          {/* SHORTCUT */}
          {!query && (
            <View className="hidden items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.035] px-1.5 py-1 md:flex">
              <Command size={9} className="text-white/20" />
              <Text className="text-[8px] text-white/20">K</Text>
            </View>
          )}

          {query && (
            <Pressable
              onPress={clearSearch}
              accessibilityLabel="Effacer la recherche"
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white/40"
            >
              <X size={13} />
            </Pressable>
          )}
        </View>

        {/* FILTER */}
        <Pressable
          onPress={() => setShowFilters((value) => !value)}
          accessibilityLabel="Afficher les filtres"
          className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.045]"
        >
          <SlidersHorizontal
            size={16}
            className={
              showFilters || typeFilter ? "text-indigo-400" : "text-white/45"
            }
          />

          {typeFilter && (
            <Text className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-indigo-400 ring-2 ring-[#050719]" />
          )}
        </Pressable>
      </View>

      {/* =====================================================================
          BRAND / HERO
      ====================================================================== */}

      <>
        {!isSearching && (
          <View
            className="relative z-10 overflow-hidden"
          >
            <View className="px-5 pb-4 pt-1 sm:px-8">
              <View className="mx-auto max-w-5xl">
                <View className="flex items-center gap-2">
                  <View
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{  }}
                  >
                    <Sparkles size={14} className="text-white" />
                  </View>

                  <View>
                    <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-400/70">
                      Recherche intelligente
                    </Text>

                    <Text className="text-[11px] text-white/30">
                      Trouve ce dont tu as besoin.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </>

      {/* =====================================================================
          TABS
      ====================================================================== */}

      <View className="relative z-10 flex flex-shrink-0 gap-1 overflow-x-auto px-4 pb-2 sm:px-5 no-scrollbar">
        {TABS.map((tab) => {
          const active = activeTab === tab;

          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="relative flex-shrink-0 rounded-full px-3.5 py-1.5 text-[10px] font-bold sm:text-xs"
              style={{ backgroundColor: active
                                ? "rgba(99,102,241,.18)"
                                : "rgba(255,255,255,.035)", borderColor: "rgba(99,102,241,.28)", borderStyle: "solid" }}
            >
              {tab}

              {active && (
                <Text
                  className="absolute inset-x-3 -bottom-[3px] h-px rounded-full"
                  style={{  }}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* =====================================================================
          TYPE FILTERS
      ====================================================================== */}

      <>
        {(activeTab === "Tout" || activeTab === "Publications") &&
          (isSearching || showFilters) && (
            <View
              className="relative z-10 overflow-hidden"
            >
              <View className="flex gap-1.5 overflow-x-auto px-4 pb-3 pt-1 sm:px-5 no-scrollbar">
                {TYPE_FILTERS.map(({ label, value, icon: Icon }) => {
                  const active = typeFilter === value;

                  return (
                    <Pressable
                      key={value}
                      onPress={() => setTypeFilter(value)}
                      className="flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-bold sm:text-[10px]"
                      style={{ backgroundColor: active
                                                ? "rgba(99,102,241,.2)"
                                                : "rgba(255,255,255,.035)", borderColor: "rgba(99,102,241,.3)", borderStyle: "solid" }}
                    >
                      <Icon size={11} />
                      {label}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
      </>

      {/* =====================================================================
          CONTENT
      ====================================================================== */}

      <View className="relative z-10 flex-1 overflow-y-auto px-4 pb-10 sm:px-5">
        <View className="mx-auto max-w-5xl">
          {/* =================================================================
              IDLE STATE
          ================================================================== */}

          {!isSearching && (
            <View
              className="space-y-7 pt-2"
            >
              {/* RECENT */}
              {history.length > 0 && (
                <View>
                  <View className="mb-3 flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/[0.05]">
                        <History size={13} className="text-white/40" />
                      </View>

                      <View>
                        <Text className="text-xs font-bold text-white/65">
                          Recherches récentes
                        </Text>
                        <Text className="text-[9px] text-white/25">
                          Reprends là où tu t'es arrêté
                        </Text>
                      </View>
                    </View>

                    <Pressable
                     
                      onPress={handleClearHistory}
                      className="text-[10px] font-medium text-white/25"
                    >
                      <Text>Effacer</Text></Pressable>
                  </View>

                  <View className="flex flex-wrap gap-2">
                    {history.map((term, index) => (
                      <Pressable
                        key={`${term}-${index}`}
                        onPress={() => handleSuggestion(term)}
                        className="flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-[10px] text-white/55"
                      >
                        <Clock size={10} className="text-white/25" />

                        <Text className="max-w-[190px] truncate">{term}</Text>

                        <ArrowUpRight size={10} className="text-white/20" />
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* TRENDING */}
              <View>
                <View className="mb-3 flex items-center gap-2">
                  <View
                    className="flex h-7 w-7 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgba(249,115,22,.1)" }}
                  >
                    <Flame size={13} className="text-orange-400" />
                  </View>

                  <View>
                    <Text className="text-xs font-bold text-white/65">Tendances</Text>

                    <Text className="text-[9px] text-white/25">
                      Ce que la communauté recherche
                    </Text>
                  </View>
                </View>

                {trendingTags === undefined ? (
                  <View className="flex flex-wrap gap-2">
                    {Array.from({
                      length: 7,
                    }).map((_, index) => (
                      <Skeleton
                        key={index}
                        className="h-8 w-24 rounded-full bg-white/[0.05]"
                      />
                    ))}
                  </View>
                ) : trendingTags.length === 0 ? (
                  <View className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 text-center">
                    <TrendingUp size={18} className="mx-auto text-white/15" />

                    <Text className="mt-2 text-xs text-white/25">
                      Les tendances arrivent bientôt.
                    </Text>
                  </View>
                ) : (
                  <View className="flex flex-wrap gap-2">
                    {trendingTags.map(({ tag, count }) => {
                      const selected = selectedTrending === tag;

                      return (
                        <Pressable
                          key={tag}
                          onPress={() => {
                            setSelectedTrending(tag);
                            handleSuggestion(tag);
                          }}
                          className="flex items-center gap-1.5 rounded-2xl px-3 py-2 text-[10px] font-bold"
                          style={{ backgroundColor: selected
                                                        ? "rgba(99,102,241,.22)"
                                                        : "rgba(99,102,241,.08)", borderWidth: 1, borderColor: "rgba(99,102,241,.18)", borderStyle: "solid" }}
                        >
                          <TrendingUp size={10} />

                          <Text>#{tag}</Text>

                          <Text className="rounded-full bg-black/10 px-1.5 py-0.5 text-[8px] opacity-60">
                            {count}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* MODULE DISCOVERY */}
              <View>
                <View className="mb-3 flex items-center gap-2">
                  <View
                    className="flex h-7 w-7 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgba(99,102,241,.1)" }}
                  >
                    <Sparkles size={13} className="text-indigo-400" />
                  </View>

                  <View>
                    <Text className="text-xs font-bold text-white/65">
                      Explorer DébrouillePro
                    </Text>

                    <Text className="text-[9px] text-white/25">
                      Accède directement à un module
                    </Text>
                  </View>
                </View>

                <View className="gap-2">
                  {MODULES.slice(0, 8).map((module, index) => {
                    const Icon = module.icon;

                    return (
                      <Pressable
                        key={module.id}
                        onPress={() =>
                          handleModuleNavigation(module.page, module.title)
                        }
                        className="group flex items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3 text-left"
                      >
                        <View
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${module.accent}12`, borderStyle: "solid" }}
                        >
                          <Icon
                            size={15}
                            style={{
                              color: module.accent,
                            }}
                          />
                        </View>

                        <View className="min-w-0 flex-1">
                          <Text className="truncate text-[11px] font-bold text-white/75">
                            {module.title}
                          </Text>

                          <Text className="truncate text-[9px] text-white/25">
                            {module.category}
                          </Text>
                        </View>

                        <ChevronRight
                          size={12}
                          className="flex-shrink-0 text-white/15"
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* QUICK SEARCH IDEAS */}
              <View>
                <View className="rounded-3xl border border-indigo-400/[0.12] bg-indigo-500/[0.035] p-4">
                  <View className="flex items-start gap-3">
                    <View
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{  }}
                    >
                      <Zap size={15} className="text-white" />
                    </View>

                    <View className="min-w-0">
                      <Text className="text-xs font-black text-white">
                        Recherche sans limites
                      </Text>

                      <Text className="mt-1 text-[10px] leading-relaxed text-white/30">
                        Publications, personnes, services, événements,
                        logements, emplois et modules — tout DébrouillePro au
                        même endroit.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* =================================================================
              LOADING
          ================================================================== */}

          {isSearching && isLoading && (
            <View
              className="space-y-3 pt-3"
            >
              <View className="mb-5 flex items-center gap-2">
                <View className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />

                <Text className="text-[10px] text-white/30">
                  Recherche dans DébrouillePro…
                </Text>
              </View>

              {Array.from({
                length: 6,
              }).map((_, index) => (
                <View
                  key={index}
                  className="rounded-2xl border border-white/[0.05] bg-white/[0.025] p-3"
                >
                  <View className="flex gap-3">
                    <Skeleton className="h-10 w-10 flex-shrink-0 rounded-xl bg-white/[0.05]" />

                    <View className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-2/3 bg-white/[0.05]" />
                      <Skeleton className="h-2.5 w-4/5 bg-white/[0.04]" />
                      <Skeleton className="h-2 w-1/3 bg-white/[0.03]" />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* =================================================================
              RESULTS
          ================================================================== */}

          {isSearching && !isLoading && (
            <View
              className="space-y-7 pt-3"
            >
              {/* RESULT SUMMARY */}
              <View className="flex items-center justify-between">
                <View>
                  <Text className="text-sm font-bold text-white">Résultats</Text>

                  <Text className="mt-0.5 text-[10px] text-white/25">
                    Pour{" "}
                    <Text className="text-white/45">“{debouncedQuery}”</Text>
                  </Text>
                </View>

                <View className="flex items-center gap-2">
                  {typeFilter && (
                    <Text className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1 text-[9px] font-bold text-indigo-300">
                      {activeFilterLabel}
                    </Text>
                  )}

                  <Text className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-[9px] font-bold text-white/30">
                    {totalResults} résultat
                    {totalResults !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              {/* ===========================================================
                    PUBLICATIONS
                ============================================================ */}

              {(activeTab === "Tout" || activeTab === "Publications") && (
                <View>
                  {activeTab === "Tout" && (
                    <SectionHeader
                      icon={<FileText size={13} />}
                      title="Publications"
                      count={publicationCount}
                    />
                  )}

                  {pubResults &&
                    pubResults.length === 0 &&
                    activeTab === "Publications" && (
                      <EmptySection
                        icon={<FileText size={20} />}
                        text="Aucune publication trouvée."
                      />
                    )}

                  <View className="space-y-2">
                    {pubResults
                      ?.slice(0, activeTab === "Tout" ? 4 : 30)
                      .map((publication, index) => {
                        const color =
                          TYPE_COLORS[publication.type] ?? "#6366F1";

                        return (
                          <Pressable
                            key={publication._id}
                            onPress={() => handleSearch(debouncedQuery)}
                            className="group flex w-full items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3 text-left"
                          >
                            <View
                              className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                              style={{ backgroundColor: `${color}12`, borderStyle: "solid" }}
                            >
                              <FileText
                                size={15}
                                style={{
                                  color,
                                }}
                              />

                              <Text
                                className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-[#070817]"
                                style={{ backgroundColor: color }}
                              />
                            </View>

                            <View className="min-w-0 flex-1">
                              <View className="flex items-start justify-between gap-2">
                                <Text className="truncate text-xs font-bold text-white/85 sm:text-sm">
                                  {publication.title}
                                </Text>

                                <Text
                                  className="flex-shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold"
                                  style={{ backgroundColor: `${color}12`, color, borderStyle: "solid" }}
                                >
                                  {TYPE_LABELS[publication.type] ??
                                    publication.type}
                                </Text>
                              </View>

                              {publication.description && (
                                <Text className="mt-1 truncate text-[10px] text-white/35 sm:text-xs">
                                  {publication.description}
                                </Text>
                              )}

                              <View className="mt-1.5 flex items-center gap-3">
                                {publication.location && (
                                  <Text className="flex min-w-0 items-center gap-1 text-[9px] text-white/25">
                                    <MapPin size={9} />

                                    <Text className="truncate">
                                      {publication.location}
                                    </Text>
                                  </Text>
                                )}

                                {publication.author?.name && (
                                  <Text className="truncate text-[9px] text-white/20">
                                    par {publication.author.name}
                                  </Text>
                                )}
                              </View>
                            </View>

                            <ArrowUpRight
                              size={13}
                              className="mt-1 flex-shrink-0 text-white/15"
                            />
                          </Pressable>
                        );
                      })}
                  </View>

                  {activeTab === "Tout" && publicationCount > 4 && (
                    <Pressable
                     
                      onPress={() => setActiveTab("Publications")}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-2xl py-2.5 text-[10px] font-bold text-indigo-300/70"
                    >
                      <Text>Voir toutes les publications</Text><ChevronRight size={11} />
                    </Pressable>
                  )}
                </View>
              )}

              {/* ===========================================================
                    PEOPLE
                ============================================================ */}

              {(activeTab === "Tout" || activeTab === "Personnes") && (
                <View>
                  {activeTab === "Tout" && (
                    <SectionHeader
                      icon={<User size={13} />}
                      title="Personnes"
                      count={peopleCount}
                    />
                  )}

                  {userResults &&
                    userResults.length === 0 &&
                    activeTab === "Personnes" && (
                      <EmptySection
                        icon={<User size={20} />}
                        text="Aucun utilisateur trouvé."
                      />
                    )}

                  <View className="space-y-2">
                    {userResults
                      ?.slice(0, activeTab === "Tout" ? 4 : 20)
                      .map((user, index) => (
                        <Pressable
                          key={user._id}
                          onPress={() => onViewProfile(user._id)}
                          className="group flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3 text-left"
                        >
                          <View className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-white/[0.08] bg-indigo-500/10">
                            {user.avatar ? (
                              <Image
                               
                               
                                className="h-full w-full object-cover"
                               source={{ uri: user.avatar }} accessibilityLabel={user.name ?? "Utilisateur"}/>
                            ) : (
                              <View className="flex h-full w-full items-center justify-center">
                                <User size={17} className="text-indigo-300" />
                              </View>
                            )}

                            <Text className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#080919] bg-emerald-400" />
                          </View>

                          <View className="min-w-0 flex-1">
                            <Text className="truncate text-xs font-bold text-white/85 sm:text-sm">
                              {user.name ?? "Utilisateur"}
                            </Text>

                            {user.bio && (
                              <Text className="mt-0.5 truncate text-[10px] text-white/30 sm:text-xs">
                                {user.bio}
                              </Text>
                            )}

                            {user.city && (
                              <Text className="mt-1 flex items-center gap-1 text-[9px] text-white/20">
                                <MapPin size={9} />

                                {user.city}
                              </Text>
                            )}
                          </View>

                          <View className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.035]">
                            <ChevronRight
                              size={13}
                              className="text-white/20"
                            />
                          </View>
                        </Pressable>
                      ))}
                  </View>
                </View>
              )}

              {/* ===========================================================
                    MODULES
                ============================================================ */}

              {(activeTab === "Tout" || activeTab === "Modules") && (
                <View>
                  {activeTab === "Tout" && (
                    <SectionHeader
                      icon={<Layers size={13} />}
                      title="Modules"
                      count={moduleCount}
                    />
                  )}

                  {moduleResults.length === 0 && activeTab === "Modules" && (
                    <EmptySection
                      icon={<Layers size={20} />}
                      text="Aucun module trouvé."
                    />
                  )}

                  <View className="gap-2">
                    {moduleResults
                      .slice(0, activeTab === "Tout" ? 4 : 30)
                      .map((module, index) => {
                        const Icon = module.icon;

                        return (
                          <Pressable
                            key={module.id}
                            onPress={() =>
                              handleModuleNavigation(module.page, module.title)
                            }
                            className="group flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3 text-left"
                          >
                            <View
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                              style={{ backgroundColor: `${module.accent}12`, borderStyle: "solid" }}
                            >
                              <Icon
                                size={15}
                                style={{
                                  color: module.accent,
                                }}
                              />
                            </View>

                            <View className="min-w-0 flex-1">
                              <Text className="truncate text-xs font-bold text-white/85">
                                {module.title}
                              </Text>

                              <Text className="mt-0.5 truncate text-[10px] text-white/30">
                                {module.subtitle}
                              </Text>
                            </View>

                            <Text
                              className="hidden flex-shrink-0 rounded-full px-2 py-1 text-[8px] font-bold sm:block"
                              style={{ backgroundColor: `${module.accent}0D`, color: `${module.accent}B8` }}
                            >
                              {module.category}
                            </Text>

                            <ChevronRight
                              size={13}
                              className="flex-shrink-0 text-white/15"
                            />
                          </Pressable>
                        );
                      })}
                  </View>
                </View>
              )}

              {/* ===========================================================
                    NO RESULTS
                ============================================================ */}

              {activeTab === "Tout" && totalResults === 0 && (
                <View
                  className="flex flex-col items-center rounded-[28px] border border-white/[0.07] bg-white/[0.025] px-6 py-14 text-center"
                >
                  <View
                    className="flex h-16 w-16 items-center justify-center rounded-3xl"
                    style={{ borderWidth: 1, borderColor: "rgba(139,92,246,.12)", borderStyle: "solid" }}
                  >
                    <Search size={25} className="text-indigo-300/50" />
                  </View>

                  <Text className="mt-5 text-sm font-bold text-white/70">
                    Aucun résultat
                  </Text>

                  <Text className="mt-1 max-w-sm text-[10px] leading-relaxed text-white/25">
                    Rien ne correspond à{" "}
                    <Text className="text-white/45">“{debouncedQuery}”</Text>.
                    Essaie un autre mot-clé, une autre formulation ou explore
                    les tendances.
                  </Text>

                  <View className="mt-5 flex flex-wrap justify-center gap-2">
                    {["logement", "emploi", "transport", "événement"].map(
                      (suggestion) => (
                        <Pressable
                          key={suggestion}
                         
                          onPress={() => handleSuggestion(suggestion)}
                          className="rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-[9px] font-medium text-white/35"
                        >
                          {suggestion}
                        </Pressable>
                      ),
                    )}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* =====================================================================
          BOTTOM GLOW
      ====================================================================== */}

      <View
       
        className="absolute bottom-0 left-0 right-0 z-20 h-px"
        style={{  }}
      />
    </View>
  );
}

/* ============================================================================
 * SECTION HEADER
 * ========================================================================== */

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
}) {
  return (
    <View className="mb-3 flex items-center justify-between">
      <View className="flex items-center gap-2 text-white/45">
        <View className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.04]">
          {icon}
        </View>

        <Text className="text-[9px] font-black uppercase tracking-[0.16em]">
          {title}
        </Text>
      </View>

      <Text className="rounded-full bg-white/[0.035] px-2 py-0.5 text-[8px] font-bold text-white/20">
        {count}
      </Text>
    </View>
  );
}

/* ============================================================================
 * EMPTY SECTION
 * ========================================================================== */

function EmptySection({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View className="flex flex-col items-center rounded-2xl border border-white/[0.05] bg-white/[0.02] py-8 text-center">
      <View className="text-white/15">{icon}</View>

      <Text className="mt-2 text-[10px] text-white/25">{text}</Text>
    </View>
  );
}

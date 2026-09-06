import { View, Pressable, Text } from "react-native";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  ArrowRight,
  BriefcaseBusiness,
  Compass,
  GraduationCap,
  HeartPulse,
  Home,
  MapPin,
  MessageCircle,
  Sparkles,
  Store,
  Ticket,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react-native";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface SmartContextSuggestionsProps {
  onNavigate: (page: string) => void;
  onDismiss?: () => void;
}

/* ============================================================================
 * CONFIGURATION
 * ========================================================================== */

type SuggestionIcon = typeof BriefcaseBusiness;

interface Suggestion {
  id: string;
  title: string;
  description: string;
  action: string;
  route: string;
  icon: SuggestionIcon;
  accent: string;
  priority: number;
}

interface ModuleConfig {
  label: string;
  route: string;
  icon: SuggestionIcon;
  accent: string;
}

/**
 * Catalogue visuel des modules.
 *
 * IMPORTANT :
 * Ce catalogue ne crée aucune donnée.
 * Il sert uniquement à donner une identité visuelle aux modules
 * réellement présents dans le contexte utilisateur.
 */
const MODULE_CONFIG: Record<string, ModuleConfig> = {
  immo: {
    label: "Immobilier",
    route: "immo",
    icon: Home,
    accent: "#8B5CF6",
  },

  jobs: {
    label: "Emplois",
    route: "jobs",
    icon: BriefcaseBusiness,
    accent: "#10B981",
  },

  emploi: {
    label: "Emploi",
    route: "emploi",
    icon: BriefcaseBusiness,
    accent: "#10B981",
  },

  transport: {
    label: "Transport",
    route: "transport",
    icon: Compass,
    accent: "#3B82F6",
  },

  sante: {
    label: "Santé",
    route: "sante",
    icon: HeartPulse,
    accent: "#EF4444",
  },

  marketplace: {
    label: "Marketplace",
    route: "marketplace",
    icon: Store,
    accent: "#F97316",
  },

  community: {
    label: "Communauté",
    route: "community",
    icon: MessageCircle,
    accent: "#A855F7",
  },

  evenements: {
    label: "Événements",
    route: "evenements",
    icon: Ticket,
    accent: "#EC4899",
  },

  "evenements-pro": {
    label: "Événements pro",
    route: "evenements-pro",
    icon: Ticket,
    accent: "#EC4899",
  },

  voyages: {
    label: "Voyages",
    route: "voyages",
    icon: Compass,
    accent: "#14B8A6",
  },

  apprendre: {
    label: "Apprendre",
    route: "apprendre",
    icon: GraduationCap,
    accent: "#6366F1",
  },

  cours: {
    label: "Cours",
    route: "cours",
    icon: GraduationCap,
    accent: "#6366F1",
  },

  finances: {
    label: "Finances",
    route: "finances",
    icon: TrendingUp,
    accent: "#EAB308",
  },

  paiement: {
    label: "Paiement",
    route: "paiement",
    icon: Wallet,
    accent: "#F59E0B",
  },

  wallet: {
    label: "Wallet",
    route: "wallet",
    icon: Wallet,
    accent: "#EAB308",
  },

  agri: {
    label: "Agriculture",
    route: "agri",
    icon: TrendingUp,
    accent: "#22C55E",
  },
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function firstName(value: string): string {
  return value.trim().split(/\s+/)[0] ?? value;
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

/**
 * Trouve un module correspondant à un intérêt ou à une préférence.
 *
 * Aucun module n'est inventé : le résultat doit obligatoirement
 * correspondre au catalogue de modules connu du frontend.
 */
function findModuleForText(value: string): ModuleConfig | undefined {
  const normalized = normalize(value);

  const aliases: Record<string, string> = {
    immobilier: "immo",
    logement: "immo",
    maison: "immo",
    appartement: "immo",

    emploi: "jobs",
    emplois: "jobs",
    travail: "jobs",
    carrière: "jobs",
    carriere: "jobs",

    santé: "sante",
    sante: "sante",
    médical: "sante",
    medical: "sante",

    commerce: "marketplace",
    achat: "marketplace",
    achats: "marketplace",
    vente: "marketplace",
    marketplace: "marketplace",

    communauté: "community",
    communaute: "community",
    social: "community",

    événement: "evenements",
    événements: "evenements",
    evenement: "evenements",
    evenements: "evenements",

    voyage: "voyages",
    voyages: "voyages",
    tourisme: "voyages",

    formation: "apprendre",
    formations: "apprendre",
    éducation: "apprendre",
    education: "apprendre",
    apprentissage: "apprendre",

    finance: "finances",
    finances: "finances",
    argent: "finances",

    paiement: "paiement",
    paiements: "paiement",

    agriculture: "agri",
    agriculteur: "agri",
    agricole: "agri",
  };

  const moduleId = aliases[normalized] ?? normalized;

  return MODULE_CONFIG[moduleId];
}

/* ============================================================================
 * COMPONENT
 * ========================================================================== */

export default function SmartContextSuggestions({
  onNavigate,
  onDismiss,
}: SmartContextSuggestionsProps) {
  const context = useQuery(api.globalContext.getMyContext, {});

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!context) {
      return [];
    }

    const result: Suggestion[] = [];

    const favoriteModules = Array.isArray(context.home.favoriteModules)
      ? context.home.favoriteModules
      : [];

    const hiddenSections = new Set(
      Array.isArray(context.home.hiddenSections)
        ? context.home.hiddenSections
        : [],
    );

    const interests = Array.isArray(context.profile.interests)
      ? context.profile.interests
      : [];

    const profession = context.profile.profession?.trim() ?? "";

    /* ------------------------------------------------------------------------
     * 1. MODULES FAVORIS
     * ---------------------------------------------------------------------- */

    favoriteModules.forEach((moduleId, index) => {
      const config = MODULE_CONFIG[moduleId];

      if (!config) {
        return;
      }

      result.push({
        id: `favorite-${moduleId}`,
        title: config.label,
        description: "Votre espace favori est prêt à être découvert.",
        action: "Ouvrir",
        route: config.route,
        icon: config.icon,
        accent: config.accent,
        priority: 100 - index,
      });
    });

    /* ------------------------------------------------------------------------
     * 2. INTÉRÊTS
     * ---------------------------------------------------------------------- */

    interests.forEach((interest, index) => {
      const config = findModuleForText(interest);

      if (!config) {
        return;
      }

      const alreadyExists = result.some((item) => item.route === config.route);

      if (alreadyExists) {
        return;
      }

      result.push({
        id: `interest-${normalize(interest)}`,
        title: config.label,
        description: `Découvrez les possibilités liées à « ${interest} ».`,
        action: "Explorer",
        route: config.route,
        icon: config.icon,
        accent: config.accent,
        priority: 80 - index,
      });
    });

    /* ------------------------------------------------------------------------
     * 3. PROFESSION
     * ---------------------------------------------------------------------- */

    if (profession) {
      const jobConfig = MODULE_CONFIG.jobs;

      const alreadyExists = result.some(
        (item) => item.route === jobConfig.route,
      );

      if (!alreadyExists) {
        result.push({
          id: "profession-jobs",
          title: "Développez votre activité",
          description: `Des outils et espaces adaptés à votre profil professionnel.`,
          action: "Explorer",
          route: jobConfig.route,
          icon: BriefcaseBusiness,
          accent: jobConfig.accent,
          priority: 75,
        });
      }
    }

    /* ------------------------------------------------------------------------
     * 4. CONTEXTE LOCAL
     * ---------------------------------------------------------------------- */

    if (context.location.city || context.location.country) {
      const locationLabel = [context.location.city, context.location.country]
        .filter(Boolean)
        .join(", ");

      result.push({
        id: "local-discovery",
        title: "Autour de vous",
        description: locationLabel
          ? `Découvrez ce qui peut être pertinent à ${locationLabel}.`
          : "Découvrez ce qui peut être pertinent autour de vous.",
        action: "Découvrir",
        route: "explorer",
        icon: MapPin,
        accent: "#38BDF8",
        priority: 70,
      });
    }

    /* ------------------------------------------------------------------------
     * 5. ONBOARDING
     * ---------------------------------------------------------------------- */

    if (!context.onboardingCompleted) {
      result.push({
        id: "complete-profile",
        title: "Personnalisez votre expérience",
        description:
          "Complétez votre profil pour rendre votre Home plus pertinent.",
        action: "Commencer",
        route: "profile",
        icon: Sparkles,
        accent: "#A78BFA",
        priority: 120,
      });
    }

    /* ------------------------------------------------------------------------
     * 6. FILTRAGE
     * ---------------------------------------------------------------------- */

    const filtered = result.filter((item) => {
      /**
       * On respecte les sections explicitement masquées.
       *
       * Exemple :
       * - un module peut être favori
       * - mais une section peut avoir été volontairement masquée.
       *
       * On évite alors de le remettre dans le flux comme suggestion.
       */
      return !hiddenSections.has(item.route);
    });

    /* ------------------------------------------------------------------------
     * 7. DÉDUPLICATION + LIMITE
     * ---------------------------------------------------------------------- */

    const seen = new Set<string>();

    return filtered
      .sort((a, b) => b.priority - a.priority)
      .filter((item) => {
        if (seen.has(item.route)) {
          return false;
        }

        seen.add(item.route);
        return true;
      })
      .slice(0, 3);
  }, [context]);

  /* ==========================================================================
   * LOADING
   * ======================================================================== */

  if (context === undefined) {
    return (
      <View
        className="mx-5 mt-4"
      >
        <View
          className="relative overflow-hidden rounded-[28px] p-4"
          style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
        >
          <View className="flex items-center gap-3">
            <View
              className="h-10 w-10 shrink-0 rounded-2xl animate-pulse"
              style={{ backgroundColor: "rgba(139,92,246,.16)" }}
            />

            <View className="flex-1 space-y-2">
              <View
                className="h-3 w-28 rounded-full animate-pulse"
                style={{ backgroundColor: "rgba(255,255,255,.10)" }}
              />

              <View
                className="h-2.5 w-48 rounded-full animate-pulse"
                style={{ backgroundColor: "rgba(255,255,255,.06)" }}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  /* ==========================================================================
   * UNAUTHENTICATED / NO CONTEXT
   * ======================================================================== */

  if (!context || suggestions.length === 0) {
    return null;
  }

  const greetingName = firstName(context.identity.name);

  /* ==========================================================================
   * UI
   * ======================================================================== */

  return (
    <>
      <View
        className="mx-5 mt-4"
        accessibilityLabel="Suggestions personnalisées"
      >
        <View
          className="relative overflow-hidden rounded-[30px]"
          style={{ borderWidth: 1, borderColor: "rgba(167,139,250,.18)", borderStyle: "solid" }}
        >
          {/* ------------------------------------------------------------------
           * AMBIENT LIGHT
           * ---------------------------------------------------------------- */}

          <View
            className="absolute -right-20 -top-24 h-48 w-48 rounded-full"
            style={{  }}
          />

          <View
            className="absolute -bottom-24 -left-16 h-40 w-40 rounded-full"
            style={{  }}
          />

          {/* ------------------------------------------------------------------
           * HEADER
           * ---------------------------------------------------------------- */}

          <View className="relative px-4 pb-3 pt-4">
            <View className="flex items-start gap-3">
              <View
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                style={{  }}
              >
                <Sparkles size={18} strokeWidth={2.2} className="text-white" />

                <Text
                  className="absolute inset-0 rounded-2xl"
                  style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.28)", borderStyle: "solid" }}
                />
              </View>

              <View className="min-w-0 flex-1">
                <View className="flex items-center gap-2">
                  <Text className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-300">
                    Pour vous
                  </Text>

                  <Text
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: "#A78BFA" }}
                  />
                </View>

                <Text className="mt-0.5 truncate text-[15px] font-bold text-white">
                  {greetingName}, voici ce qui peut vous servir.
                </Text>

                <Text className="mt-1 text-[10px] leading-relaxed text-white/40">
                  Votre Home s’adapte progressivement à vos besoins.
                </Text>
              </View>

              {onDismiss && (
                <Pressable
                 
                  onPress={onDismiss}
                  accessibilityLabel="Masquer les suggestions"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-white/30"
                >
                  <X size={14} />
                </Pressable>
              )}
            </View>
          </View>

          {/* ------------------------------------------------------------------
           * SUGGESTIONS
           * ---------------------------------------------------------------- */}

          <View className="relative space-y-2 px-3 pb-3">
            {suggestions.map((suggestion, index) => {
              const Icon = suggestion.icon;

              return (
                <Pressable
                  key={suggestion.id}
                  type="button"
                  onPress={() => onNavigate(suggestion.route)}
                  className="group relative flex w-full items-center gap-3 overflow-hidden rounded-[22px] p-3 text-left"
                  style={{ backgroundColor: "rgba(255,255,255,.045)", borderWidth: 1, borderColor: "rgba(255,255,255,.065)", borderStyle: "solid" }}
                >
                  {/* Hover / accent wash */}
                  <Text
                    className="absolute inset-y-0 left-0 w-24 opacity-0"
                    style={{  }}
                  />

                  {/* Icon */}
                  <View
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[17px]"
                    style={{ backgroundColor: `${suggestion.accent}18`, borderStyle: "solid" }}
                  >
                    <Icon
                      size={18}
                      strokeWidth={2}
                      style={{
                        color: suggestion.accent,
                      }}
                    />

                    <Text
                      className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full"
                      style={{ backgroundColor: suggestion.accent }}
                    />
                  </View>

                  {/* Content */}
                  <View className="relative min-w-0 flex-1">
                    <View className="flex items-center gap-2">
                      <Text className="truncate text-[12px] font-bold text-white">
                        {suggestion.title}
                      </Text>

                      {index === 0 && (
                        <Text
                          className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide"
                          style={{ color: suggestion.accent, backgroundColor: `${suggestion.accent}15`, borderStyle: "solid" }}
                        >
                          Priorité
                        </Text>
                      )}
                    </View>

                    <Text className="mt-0.5 text-[10px] leading-relaxed text-white/40">
                      {suggestion.description}
                    </Text>
                  </View>

                  {/* CTA */}
                  <View className="relative flex shrink-0 items-center gap-1">
                    <Text
                      className="hidden text-[9px] font-bold sm:block"
                      style={{
                        color: suggestion.accent,
                      }}
                    >
                      {suggestion.action}
                    </Text>

                    <View
                      className="flex h-7 w-7 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${suggestion.accent}12` }}
                    >
                      <ArrowRight
                        size={13}
                        style={{
                          color: suggestion.accent,
                        }}
                      />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* ------------------------------------------------------------------
           * FOOTER
           * ---------------------------------------------------------------- */}

          <View
            className="relative flex items-center gap-2 border-t px-4 py-2.5"
            style={{
              borderColor: "rgba(255,255,255,.055)",
            }}
          >
            <Zap size={11} className="text-violet-300" fill="currentColor" />

            <Text className="text-[9px] font-medium text-white/30">
              Suggestions générées à partir de votre contexte
            </Text>

            <View className="ml-auto flex items-center gap-1">
              <Text className="h-1 w-1 rounded-full bg-emerald-400" />
              <Text className="text-[8px] font-semibold text-white/25">
                <Text>En direct</Text></Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );
}

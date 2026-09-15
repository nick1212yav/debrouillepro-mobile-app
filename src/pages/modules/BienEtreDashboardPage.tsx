import React, { memo, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Flame,
  Heart,
  Moon,
  Ruler,
  Salad,
  Sparkles,
  Target,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react-native";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api.js";

type TabId = "overview" | "progress" | "goals" | "recs";

type Props = {
  onBack: () => void;
  onNavigate: (page: string) => void;
};

type HealthSummary = {
  workoutCount?: number;
  meditationCount?: number;
  [key: string]: unknown;
};

type MetricConfig = {
  label: string;
  value: string;
  icon: typeof Dumbbell;
  accent: string;
  available: boolean;
};

const TABS: Array<{
  id: TabId;
  label: string;
  icon: typeof BarChart3;
}> = [
  {
    id: "overview",
    label: "Vue d'ensemble",
    icon: BarChart3,
  },
  {
    id: "progress",
    label: "Progression",
    icon: TrendingUp,
  },
  {
    id: "goals",
    label: "Objectifs",
    icon: Target,
  },
  {
    id: "recs",
    label: "Conseils",
    icon: Sparkles,
  },
];

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return null;
}

function formatNumber(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("fr-FR").format(value);
}

function getScore(values: Array<number | null>): number | null {
  const available = values.filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value),
  );

  if (available.length === 0) {
    return null;
  }

  return Math.round(
    available.reduce((sum, value) => sum + value, 0) / available.length,
  );
}

function getScorePresentation(score: number | null) {
  if (score === null) {
    return {
      label: "Données insuffisantes",
      accent: "#64748B",
    };
  }

  if (score >= 80) {
    return {
      label: "Excellent",
      accent: "#10B981",
    };
  }

  if (score >= 60) {
    return {
      label: "Bien",
      accent: "#8B5CF6",
    };
  }

  if (score >= 40) {
    return {
      label: "À améliorer",
      accent: "#F59E0B",
    };
  }

  return {
    label: "À améliorer",
    accent: "#EF4444",
  };
}

const EmptyState = memo(function EmptyState({
  title,
  description,
  icon: Icon = ActivityIndicator,
}: {
  title: string;
  description: string;
  icon?: typeof ActivityIndicator;
}) {
  return (
    <View className="items-center rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-8">
      <View className="mb-3 h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06]">
        <Icon size={20} color="rgba(255,255,255,0.55)" />
      </View>

      <Text className="text-center text-sm font-semibold text-white">
        {title}
      </Text>

      <Text className="mt-1 text-center text-xs leading-5 text-white/40">
        {description}
      </Text>
    </View>
  );
});

const Section = memo(function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      <View className="mb-3">
        <Text className="text-base font-bold text-white">{title}</Text>

        {subtitle ? (
          <Text className="mt-1 text-xs text-white/40">{subtitle}</Text>
        ) : null}
      </View>

      {children}
    </View>
  );
});

const MetricCard = memo(function MetricCard({
  metric,
}: {
  metric: MetricConfig;
}) {
  const Icon = metric.icon;

  return (
    <View className="flex-1 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <View
        className="mb-3 h-9 w-9 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${metric.accent}18`,
        }}
      >
        <Icon size={17} color={metric.accent} />
      </View>

      <Text className="text-[10px] font-medium uppercase tracking-wider text-white/35">
        {metric.label}
      </Text>

      <Text className="mt-1 text-xl font-black text-white">{metric.value}</Text>

      {!metric.available ? (
        <Text className="mt-1 text-[9px] text-white/25">
          Donnée indisponible
        </Text>
      ) : null}
    </View>
  );
});

const ScoreCard = memo(function ScoreCard({ score }: { score: number | null }) {
  const presentation = getScorePresentation(score);

  return (
    <View
      className="overflow-hidden rounded-3xl border p-5"
      style={{
        borderColor: `${presentation.accent}45`,
        backgroundColor: "rgba(255,255,255,0.035)",
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-xs font-medium uppercase tracking-wider text-white/40">
            Score bien-être
          </Text>

          <Text
            className="mt-1 text-3xl font-black"
            style={{
              color: presentation.accent,
            }}
          >
            {score === null ? "—" : score}
          </Text>

          <Text className="mt-1 text-sm font-semibold text-white">
            {presentation.label}
          </Text>

          <Text className="mt-2 text-xs leading-5 text-white/40">
            Le score est calculé uniquement à partir des données disponibles
            dans votre compte.
          </Text>
        </View>

        <View
          className="h-24 w-24 items-center justify-center rounded-full border"
          style={{
            borderColor: `${presentation.accent}55`,
            backgroundColor: `${presentation.accent}12`,
          }}
        >
          <Heart size={28} color={presentation.accent} />

          {score !== null ? (
            <Text
              className="mt-1 text-[10px] font-bold"
              style={{
                color: presentation.accent,
              }}
            >
              / 100
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
});

const NavigationTabs = memo(function NavigationTabs({
  activeTab,
  onChange,
}: {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        gap: 8,
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;

        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{
              selected: active,
            }}
            className="flex-row items-center gap-2 rounded-xl px-3.5 py-2.5"
            style={{
              backgroundColor: active
                ? "rgba(139,92,246,0.18)"
                : "rgba(255,255,255,0.05)",
              borderWidth: 1,
              borderColor: active
                ? "rgba(139,92,246,0.35)"
                : "rgba(255,255,255,0.06)",
            }}
          >
            <Icon
              size={14}
              color={active ? "#A78BFA" : "rgba(255,255,255,0.45)"}
            />

            <Text
              className="text-xs font-semibold"
              style={{
                color: active ? "#C4B5FD" : "rgba(255,255,255,0.55)",
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

const ActionRow = memo(function ActionRow({
  label,
  icon: Icon,
  accent,
  onPress,
}: {
  label: string;
  icon: typeof Dumbbell;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-2 flex-row items-center rounded-2xl border border-white/10 bg-white/[0.035] p-3.5"
      accessibilityRole="button"
    >
      <View
        className="mr-3 h-9 w-9 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${accent}18`,
        }}
      >
        <Icon size={16} color={accent} />
      </View>

      <Text className="flex-1 text-sm font-medium text-white/80">{label}</Text>

      <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
    </Pressable>
  );
});

export default function BienEtreDashboardPage({ onBack, onNavigate }: Props) {
  const [tab, setTab] = useState<TabId>("overview");

  /*
   * SOURCE UNIQUE DE VÉRITÉ :
   * les données viennent du backend Convex.
   *
   * Aucune donnée locale fictive.
   * Aucune valeur inventée.
   */
  const healthSummary = useQuery(api.health.getHealthSummary, {}) as
    | HealthSummary
    | undefined;

  const isLoading = healthSummary === undefined;

  const workoutCount = useMemo(
    () => asNumber(healthSummary?.workoutCount),
    [healthSummary],
  );

  const meditationCount = useMemo(
    () => asNumber(healthSummary?.meditationCount),
    [healthSummary],
  );

  /*
   * Les métriques nutritionnelles restent volontairement
   * indisponibles tant qu'une source backend réelle ne les
   * fournit pas.
   */
  const nutritionWater = useMemo(
    () => asNumber(healthSummary?.waterGlasses),
    [healthSummary],
  );

  const meditationMinutes = useMemo(
    () => asNumber(healthSummary?.totalMinutes),
    [healthSummary],
  );

  const fitnessScore = useMemo(() => {
    if (workoutCount === null) {
      return null;
    }

    return Math.min(100, Math.round((workoutCount / 5) * 100));
  }, [workoutCount]);

  const nutritionScore = useMemo(() => {
    if (nutritionWater === null) {
      return null;
    }

    return Math.min(100, Math.round((nutritionWater / 8) * 100));
  }, [nutritionWater]);

  const meditationScore = useMemo(() => {
    if (meditationMinutes === null) {
      return null;
    }

    return Math.min(100, Math.round((meditationMinutes / 70) * 100));
  }, [meditationMinutes]);

  const globalScore = useMemo(
    () => getScore([fitnessScore, nutritionScore, meditationScore]),
    [fitnessScore, nutritionScore, meditationScore],
  );

  const metrics: MetricConfig[] = useMemo(
    () => [
      {
        label: "Fitness",
        value: formatNumber(workoutCount),
        icon: Dumbbell,
        accent: "#E17055",
        available: workoutCount !== null,
      },
      {
        label: "Hydratation",
        value:
          nutritionWater === null
            ? "—"
            : `${formatNumber(nutritionWater)} verres`,
        icon: Salad,
        accent: "#3B82F6",
        available: nutritionWater !== null,
      },
      {
        label: "Méditation",
        value: formatNumber(meditationMinutes),
        icon: Moon,
        accent: "#8B5CF6",
        available: meditationMinutes !== null,
      },
    ],
    [workoutCount, nutritionWater, meditationMinutes],
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#050812]">
        <View className="items-center">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <ActivityIndicator size="small" color="#A78BFA" />
          </View>

          <Text className="text-sm font-semibold text-white">
            Chargement de vos données
          </Text>

          <Text className="mt-1 text-xs text-white/40">
            Synchronisation avec votre espace personnel
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#050812]">
      {/* Header */}
      <View className="border-b border-white/5 px-4 pb-3 pt-4">
        <View className="flex-row items-center">
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            className="mr-3 h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>

          <View className="flex-1">
            <Text className="text-lg font-bold text-white">Bien-être</Text>

            <Text className="mt-0.5 text-xs text-white/40">
              Votre espace personnel
            </Text>
          </View>

          <View
            className="items-center rounded-xl border px-3 py-1.5"
            style={{
              borderColor: `${getScorePresentation(globalScore).accent}35`,
              backgroundColor: `${getScorePresentation(globalScore).accent}12`,
            }}
          >
            <Text
              className="text-sm font-black"
              style={{
                color: getScorePresentation(globalScore).accent,
              }}
            >
              {globalScore === null ? "—" : globalScore}
            </Text>
          </View>
        </View>
      </View>

      {/* Navigation */}
      <View className="py-3">
        <NavigationTabs activeTab={tab} onChange={setTab} />
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {tab === "overview" ? (
          <>
            <Section
              title="Vue d'ensemble"
              subtitle="Données actuellement disponibles"
            >
              <ScoreCard score={globalScore} />
            </Section>

            <Section
              title="Vos indicateurs"
              subtitle="Synchronisés avec vos données réelles"
            >
              <View className="flex-row gap-3">
                {metrics.map((metric) => (
                  <MetricCard key={metric.label} metric={metric} />
                ))}
              </View>
            </Section>

            <Section
              title="Activité"
              subtitle="Accédez directement à vos modules"
            >
              <ActionRow
                label="Ouvrir Fitness"
                icon={Dumbbell}
                accent="#E17055"
                onPress={() => onNavigate("fitness")}
              />

              <ActionRow
                label="Ouvrir Nutrition"
                icon={Salad}
                accent="#3B82F6"
                onPress={() => onNavigate("nutrition")}
              />

              <ActionRow
                label="Ouvrir Méditation"
                icon={Moon}
                accent="#8B5CF6"
                onPress={() => onNavigate("meditation")}
              />
            </Section>

            <Section title="Activité récente">
              <EmptyState
                title="Historique détaillé indisponible"
                description="Aucun historique détaillé n'est exposé par la source de données actuelle."
                icon={CalendarDays}
              />
            </Section>
          </>
        ) : null}

        {tab === "progress" ? (
          <>
            <Section
              title="Progression"
              subtitle="Analyse basée uniquement sur les données synchronisées"
            >
              <EmptyState
                title="Historique insuffisant"
                description="L'historique temporel n'est pas généré artificiellement. Il apparaîtra lorsqu'une source backend réelle fournira les événements nécessaires."
                icon={TrendingUp}
              />
            </Section>

            <Section title="Indicateurs disponibles">
              <View className="gap-3">
                <MetricCard
                  metric={{
                    label: "Séances fitness",
                    value: formatNumber(workoutCount),
                    icon: Dumbbell,
                    accent: "#E17055",
                    available: workoutCount !== null,
                  }}
                />

                <MetricCard
                  metric={{
                    label: "Sessions méditation",
                    value: formatNumber(meditationCount),
                    icon: Moon,
                    accent: "#8B5CF6",
                    available: meditationCount !== null,
                  }}
                />
              </View>
            </Section>
          </>
        ) : null}

        {tab === "goals" ? (
          <>
            <Section
              title="Objectifs"
              subtitle="Aucun objectif fictif n'est affiché"
            >
              <EmptyState
                title="Objectifs personnalisés non disponibles"
                description="Les objectifs seront affichés lorsqu'ils seront fournis par le backend de votre compte."
                icon={Target}
              />
            </Section>

            <Section title="Modules">
              <ActionRow
                label="Gérer mes objectifs Fitness"
                icon={Dumbbell}
                accent="#E17055"
                onPress={() => onNavigate("fitness")}
              />

              <ActionRow
                label="Gérer mes objectifs Nutrition"
                icon={Salad}
                accent="#3B82F6"
                onPress={() => onNavigate("nutrition")}
              />

              <ActionRow
                label="Gérer mes objectifs Méditation"
                icon={Moon}
                accent="#8B5CF6"
                onPress={() => onNavigate("meditation")}
              />
            </Section>
          </>
        ) : null}

        {tab === "recs" ? (
          <>
            <Section
              title="Conseils personnalisés"
              subtitle="Aucune recommandation inventée"
            >
              <EmptyState
                title="Conseils IA en attente de données"
                description="Les recommandations personnalisées seront générées à partir des données réelles disponibles dans votre espace."
                icon={Sparkles}
              />
            </Section>

            <Section title="Actions rapides">
              <ActionRow
                label="Lancer une séance Fitness"
                icon={Dumbbell}
                accent="#E17055"
                onPress={() => onNavigate("fitness")}
              />

              <ActionRow
                label="Journaliser un repas"
                icon={Salad}
                accent="#10B981"
                onPress={() => onNavigate("nutrition")}
              />

              <ActionRow
                label="Démarrer une méditation"
                icon={Moon}
                accent="#8B5CF6"
                onPress={() => onNavigate("meditation")}
              />

              <ActionRow
                label="Exercice de respiration"
                icon={Wind}
                accent="#6366F1"
                onPress={() => onNavigate("meditation")}
              />
            </Section>
          </>
        ) : null}

        {/* Backend status */}
        <View className="mt-2 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
          <View className="flex-row items-center">
            <CheckCircle2 size={16} color="#34D399" />

            <Text className="ml-2 text-xs font-semibold text-emerald-300">
              Données synchronisées
            </Text>
          </View>

          <Text className="mt-2 text-[10px] leading-4 text-white/35">
            Ce tableau de bord n'utilise aucune donnée fictive. Une métrique
            absente du backend reste volontairement indisponible.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

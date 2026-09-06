import { View, Pressable, Text } from "react-native";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { api } from "@/convex/_generated/api.js";
import { ArrowUpRight, ChevronRight, Sparkles, Wand2 } from "lucide-react-native";

const MODULE_LABELS: Record<string, string> = {
  immo: "Immobilier",
  jobs: "Emplois",
  transport: "Transport",
  sante: "Santé",
  paiement: "Paiement",
  marketplace: "Marché",
  agri: "Agriculture",
  community: "Communauté",
  evenements: "Événements",
  voyages: "Voyages",
  apprendre: "Apprendre",
  fitness: "Fitness",
  media: "Médias",
  wallet: "Wallet",
  dashboard: "Dashboard",
};

const MODULE_COLORS: Record<string, string> = {
  immo: "#6366F1",
  jobs: "#10B981",
  transport: "#3B82F6",
  sante: "#EF4444",
  paiement: "#F59E0B",
  marketplace: "#F97316",
  agri: "#22C55E",
  community: "#8B5CF6",
  evenements: "#EC4899",
  voyages: "#14B8A6",
  apprendre: "#6366F1",
  fitness: "#EF4444",
  media: "#EC4899",
  wallet: "#EAB308",
  dashboard: "#8B5CF6",
};

const MODULE_ICONS: Record<string, string> = {
  immo: "⌂",
  jobs: "↗",
  transport: "⇄",
  sante: "✚",
  paiement: "₿",
  marketplace: "◇",
  agri: "✦",
  community: "◎",
  evenements: "✦",
  voyages: "✈",
  apprendre: "⌘",
  fitness: "◈",
  media: "▶",
  wallet: "◒",
  dashboard: "◫",
};

interface Props {
  onNavigate: (page: string) => void;
  onOpenStudio: () => void;
}

export default function AIPersonalizedSuggestion({
  onNavigate,
  onOpenStudio,
}: Props) {
  const { isAuthenticated } = useFirebaseAuth();

  const prefs = useQuery(
    api.aiPreferences.getMyPreferences,
    isAuthenticated ? {} : "skip",
  );

  const modules = useMemo(
    () => (prefs?.recommendedModules ?? []).slice(0, 3),
    [prefs?.recommendedModules],
  );

  const tags = useMemo(
    () => (prefs?.recommendedTags ?? []).slice(0, 5),
    [prefs?.recommendedTags],
  );

  /*
   * Rien à afficher tant que l'utilisateur n'a
   * aucune personnalisation IA exploitable.
   *
   * Aucun mock.
   */
  if (
    !prefs ||
    (!prefs.recommendedModules?.length &&
      !prefs.recommendedTags?.length &&
      !prefs.welcomeMessage)
  ) {
    return null;
  }

  return (
    <View
      className="relative mx-5 mt-3 overflow-hidden rounded-[28px]"
      accessibilityLabel="Suggestions personnalisées par IA"
    >
      {/* ─────────────────────────────────────────
          AMBIENT AI LIGHT
      ───────────────────────────────────────── */}

      <View
        accessibilityElementsHidden={true}
        className="absolute -right-20 -top-24 h-56 w-56 rounded-full"
        style={{  }}
      />

      <View
        accessibilityElementsHidden={true}
        className="absolute -bottom-24 -left-16 h-48 w-48 rounded-full"
        style={{  }}
      />

      {/* Premium glass surface */}
      <View
        className="relative overflow-hidden"
        style={{ borderWidth: 1, borderColor: "rgba(236,72,153,.20)", borderStyle: "solid" }}
      >
        {/* ───────────────────────────────────────
            HEADER
        ─────────────────────────────────────── */}

        <View className="flex items-center gap-3 px-4 pb-3 pt-4">
          <View
            className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl"
            style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.16)", borderStyle: "solid" }}
          >
            <Sparkles size={16} className="text-white" strokeWidth={2.2} />

            <Text
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "#F9A8D4" }}
            />
          </View>

          <View className="min-w-0 flex-1">
            <View className="flex items-center gap-2">
              <Text className="text-[11px] font-black uppercase tracking-[0.12em] text-pink-200/90">
                Pour vous
              </Text>

              <Text
                className="rounded-full px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider"
                style={{ color: "#F5D0FE", backgroundColor: "rgba(236,72,153,.12)", borderWidth: 1, borderColor: "rgba(236,72,153,.18)", borderStyle: "solid" }}
              >
                IA
              </Text>
            </View>

            <Text className="mt-0.5 truncate text-[9px] text-white/30">
              Une sélection construite pour vous
            </Text>
          </View>

          <Pressable
            type="button"
            onPress={onOpenStudio}
            accessibilityLabel="Personnaliser les suggestions IA"
            className="flex flex-shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-[9px] font-bold"
            style={{ backgroundColor: "rgba(236,72,153,.09)", borderWidth: 1, borderColor: "rgba(236,72,153,.16)", borderStyle: "solid" }}
          >
            <Wand2 size={10} />
            <Text className="hidden sm:inline">Personnaliser</Text>
          </Pressable>
        </View>

        {/* ───────────────────────────────────────
            WELCOME MESSAGE
        ─────────────────────────────────────── */}

        {prefs.welcomeMessage && (
          <View className="px-4 pb-4">
            <View
              className="relative overflow-hidden rounded-2xl px-3.5 py-3"
              style={{ backgroundColor: "rgba(255,255,255,.035)", borderWidth: 1, borderColor: "rgba(255,255,255,.055)", borderStyle: "solid" }}
            >
              <View
               
                className="absolute left-0 top-0 h-full w-0.5"
                style={{  }}
              />

              <Text className="text-[11px] leading-[1.55] text-white/65">
                {prefs.welcomeMessage}
              </Text>
            </View>
          </View>
        )}

        {/* ───────────────────────────────────────
            MODULE RECOMMENDATIONS
        ─────────────────────────────────────── */}

        {modules.length > 0 && (
          <View className="px-4 pb-4">
            <View className="mb-2 flex items-center justify-between">
              <Text className="text-[8px] font-black uppercase tracking-[0.16em] text-white/22">
                À découvrir maintenant
              </Text>

              <Text className="text-[8px] font-medium text-white/18">
                {modules.length} suggestion
                {modules.length > 1 ? "s" : ""}
              </Text>
            </View>

            <View className="gap-2">
              {modules.map((moduleId, index) => {
                const color = MODULE_COLORS[moduleId] ?? "#8B5CF6";

                const label = MODULE_LABELS[moduleId] ?? moduleId;

                const icon = MODULE_ICONS[moduleId] ?? "✦";

                return (
                  <Pressable
                    key={`${moduleId}-${index}`}
                    type="button"
                    onPress={() => onNavigate(moduleId)}
                    className="group relative flex min-w-0 items-center gap-2.5 overflow-hidden rounded-2xl p-2.5 text-left"
                    style={{ backgroundColor: `${color}0D`, borderStyle: "solid" }}
                  >
                    {/* Hover glow */}
                    <View
                     
                      className="absolute -right-5 -top-5 h-16 w-16 rounded-full opacity-0"
                      style={{ backgroundColor: color }}
                    />

                    <View
                      className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black"
                      style={{ backgroundColor: `${color}15`, borderStyle: "solid" }}
                    >
                      {icon}
                    </View>

                    <View className="relative min-w-0 flex-1">
                      <Text className="block truncate text-[10px] font-bold text-white/75">
                        {label}
                      </Text>

                      <Text
                        className="mt-0.5 block text-[8px] font-medium"
                        style={{
                          color: `${color}AA`,
                        }}
                      >
                        Recommandé pour vous
                      </Text>
                    </View>

                    <ChevronRight
                      size={13}
                      className="relative flex-shrink-0 text-white/20"
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ───────────────────────────────────────
            PERSONALIZATION TAGS
        ─────────────────────────────────────── */}

        {tags.length > 0 && (
          <View
            className="flex items-center gap-2 overflow-hidden px-4 py-3"
            style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,.045)", borderTopStyle: "solid", backgroundColor: "rgba(0,0,0,.08)" }}
          >
            <Text className="flex-shrink-0 text-[8px] font-black uppercase tracking-[0.12em] text-white/18">
              Vos intérêts
            </Text>

            <View
              className="flex min-w-0 gap-1.5 overflow-x-auto"
              style={{  }}
            >
              {tags.map((tag) => (
                <Text
                  key={tag}
                  className="flex-shrink-0 rounded-full px-2 py-1 text-[8px] font-bold"
                  style={{ backgroundColor: "rgba(245,158,11,.07)", color: "rgba(252,211,77,.72)", borderWidth: 1, borderColor: "rgba(245,158,11,.14)", borderStyle: "solid" }}
                >
                  <Text>#</Text>{tag}
                </Text>
              ))}
            </View>

            <Pressable
              type="button"
              onPress={onOpenStudio}
              accessibilityLabel="Modifier vos intérêts"
              className="ml-auto flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white/25"
            >
              <ArrowUpRight size={11} />
            </Pressable>
          </View>
        )}

        {/* ───────────────────────────────────────
            BOTTOM SHIMMER
        ─────────────────────────────────────── */}

        <View
          accessibilityElementsHidden={true}
          className="absolute bottom-0 left-0 h-px w-full"
          style={{  }}
        />
      </View>
    </View>
  );
}

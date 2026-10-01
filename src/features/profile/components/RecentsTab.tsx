// src/features/profile/components/RecentsTab.tsx

import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight, History } from "lucide-react-native";

import { useActivity } from "@/hooks/use-activity.ts";

interface RecentsTabProps {
  onNavigate: (path: string) => void;
  accentHex: string;
}

const MAX_RECENT_MODULES = 10;

function normalizeAccent(value: string): string {
  const accent = value.trim();

  if (/^#[0-9A-Fa-f]{6}$/.test(accent)) {
    return accent;
  }

  if (/^#[0-9A-Fa-f]{3}$/.test(accent)) {
    const [, r, g, b] = accent;

    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return "#6366F1";
}

function formatActivityDate(timestamp: number): string {
  if (!Number.isFinite(timestamp)) {
    return "Date indisponible";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Date indisponible";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RecentsTab({ onNavigate, accentHex }: RecentsTabProps) {
  const { entries, isLoading } = useActivity();

  const accent = normalizeAccent(accentHex);

  const recentModules = useMemo(() => {
    const seen = new Set<string>();

    return entries
      .filter(
        (entry) =>
          entry.type === "view_module" &&
          typeof entry.target === "string" &&
          entry.target.trim().length > 0,
      )
      .filter((entry) => {
        const target = entry.target?.trim();

        if (!target || seen.has(target)) {
          return false;
        }

        seen.add(target);
        return true;
      })
      .slice(0, MAX_RECENT_MODULES);
  }, [entries]);

  const handleNavigate = (target: string | undefined) => {
    const path = target?.trim();

    if (!path) {
      return;
    }

    onNavigate(path);
  };

  return (
    <View>
      {/* Section header */}
      <View className="mb-3 flex-row items-center">
        <History size={15} color="rgba(255,255,255,0.42)" strokeWidth={2} />

        <Text className="ml-2 text-xs font-bold uppercase tracking-wider text-white/50">
          Modules consultés récemment
        </Text>
      </View>

      {/* Loading */}
      {isLoading ? (
        <View>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              className="mb-2 h-14 w-full overflow-hidden rounded-2xl border border-white/5 bg-white/[0.04]"
            >
              <View className="flex-1 flex-row items-center px-3">
                <View className="h-9 w-9 rounded-xl bg-white/10" />

                <View className="ml-3 flex-1">
                  <View className="h-3 w-32 rounded-full bg-white/10" />
                  <View className="mt-2 h-2.5 w-20 rounded-full bg-white/5" />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : recentModules.length === 0 ? (
        /* Empty state */
        <View className="items-center justify-center rounded-2xl border border-white/5 bg-white/[0.025] px-6 py-10">
          <View
            className="mb-3 h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: `${accent}12`,
              borderWidth: 1,
              borderColor: `${accent}25`,
            }}
          >
            <History size={24} color={`${accent}80`} strokeWidth={1.8} />
          </View>

          <Text className="text-center text-sm font-semibold text-white/65">
            Aucun module consulté
          </Text>

          <Text className="mt-1 text-center text-xs leading-5 text-white/30">
            Votre historique apparaîtra ici lorsque vous naviguerez dans
            l’application.
          </Text>
        </View>
      ) : (
        /* Recent modules */
        <View>
          {recentModules.map((entry) => {
            const target = entry.target?.trim();

            if (!target) {
              return null;
            }

            return (
              <Pressable
                key={entry._id}
                onPress={() => {
                  handleNavigate(target);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Ouvrir ${
                  entry.label?.trim() || "ce module"
                }`}
                className="mb-2 flex-row items-center rounded-2xl border border-white/[0.07] bg-white/[0.04] p-3 active:bg-white/[0.07]"
              >
                {/* Module icon */}
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${accent}18`,
                    borderWidth: 1,
                    borderColor: `${accent}25`,
                  }}
                >
                  <Text
                    accessible
                    accessibilityLabel="Module"
                    className="text-base"
                  >
                    📱
                  </Text>
                </View>

                {/* Information */}
                <View className="ml-3 flex-1">
                  <Text
                    className="text-sm font-semibold text-white"
                    numberOfLines={1}
                  >
                    {entry.label?.trim() || "Module"}
                  </Text>

                  <Text
                    className="mt-1 text-xs text-white/35"
                    numberOfLines={1}
                  >
                    {formatActivityDate(entry._creationTime)}
                  </Text>
                </View>

                {/* Navigation */}
                <ChevronRight
                  size={16}
                  color="rgba(255,255,255,0.28)"
                  strokeWidth={2}
                />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

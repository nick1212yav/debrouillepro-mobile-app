import { View, Text, Pressable } from "react-native";
import { ArrowLeft, Zap, TrendingUp, Lock } from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton";
import { BADGE_DEFINITIONS, LEVELS } from "@/constants/badges";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

import type { BadgeDef } from "@/constants/badges";

// ── Level helpers ─────────────────────────────────────────────────────────────
function getLevel(xp: number) {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.min) current = lvl;
  }
  return current;
}

function getLevelProgress(xp: number) {
  const current = getLevel(xp);
  const idx = LEVELS.findIndex((l) => l.name === current.name);
  const next = LEVELS[idx + 1] ?? null;
  if (!next) return { progress: 100, pointsToNext: 0, next: null };
  const progress = Math.round(
    ((xp - current.min) / (next.min - current.min)) * 100,
  );
  return { progress, pointsToNext: next.min - xp, next };
}

// ── Category labels ───────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  publication: "Publications",
  social: "Social",
  exploration: "Exploration",
  engagement: "Engagement",
  special: "Spécial",
};

// ── Single badge card ─────────────────────────────────────────────────────────
function BadgeCard({
  def,
  unlockedAt,
}: {
  def: BadgeDef;
  unlockedAt?: string;
}) {
  const locked = !unlockedAt;
  return (
    <View
      className="flex flex-col items-center gap-2 p-3 rounded-2xl text-center"
      style={{ backgroundColor: locked ? "rgba(255,255,255,0.03)" : `${def.color}15`, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid", opacity: locked ? 0.45 : 1 }}
    >
      <View
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl relative"
        style={{ backgroundColor: locked ? "rgba(255,255,255,0.05)" : `${def.color}25` }}
      >
        {locked ? (
          <Lock className="w-5 h-5 text-white/20" />
        ) : (
          <Text>{def.emoji}</Text>
        )}
        {!locked && (
          <View
            className="absolute inset-0 rounded-2xl"
            style={{  }}
          />
        )}
      </View>
      <View>
        <Text className="text-white text-xs font-semibold leading-tight">
          {def.label}
        </Text>
        <Text className="text-white/40 text-[10px] leading-tight mt-0.5">
          {def.description}
        </Text>
        {!locked && def.xpReward > 0 && (
          <Text
            className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${def.color}25`, color: def.color }}
          >
            <Zap className="w-2.5 h-2.5" />+{def.xpReward} XP
          </Text>
        )}
      </View>
    </View>
  );
}

// ── XP progress bar ───────────────────────────────────────────────────────────
function XpBar({ xp }: { xp: number }) {
  const level = getLevel(xp);
  const { progress, pointsToNext, next } = getLevelProgress(xp);

  return (
    <View
      className="mx-4 rounded-3xl p-4 mb-4"
      style={{ borderStyle: "solid" }}
    >
      <View className="flex items-center justify-between mb-2">
        <View className="flex items-center gap-2">
          <Text className="text-2xl">{level.emoji}</Text>
          <View>
            <Text className="text-white font-bold text-sm">{level.name}</Text>
            <Text className="text-white/50 text-xs">
              {xp.toLocaleString()} XP total
            </Text>
          </View>
        </View>
        {next && (
          <View className="text-right">
            <Text className="text-white/40 text-xs">{next.name}</Text>
            <Text className="text-xs font-semibold" style={{ color: next.color }}>
              +{pointsToNext} XP
            </Text>
          </View>
        )}
      </View>
      <View
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
      >
        <View
          className="h-full rounded-full"
          style={{  }}
        />
      </View>
      <Text className="text-white/30 text-[10px] mt-1 text-right">
        {progress}% vers {next?.name ?? "Max"}
      </Text>
    </View>
  );
}

// ── Inner content (authenticated) ────────────────────────────────────────────
function BadgesContent({ email }: { email: string }) {
  const xpData = useQuery(api.badges.getMyXp, email ? { email } : "skip");
  const myBadges = useQuery(api.badges.getMyBadges, email ? { email } : "skip");

  const unlockedIds = new Set((myBadges ?? []).map((b) => b.badgeId));
  const unlockedMap = new Map(
    (myBadges ?? []).map((b) => [b.badgeId, b.unlockedAt]),
  );

  const xp = xpData?.total ?? 0;

  // Group badges by category
  const categories = [
    "publication",
    "social",
    "exploration",
    "engagement",
    "special",
  ] as const;

  if (xpData === undefined || myBadges === undefined) {
    return (
      <View className="px-4 space-y-3">
        <Skeleton className="h-20 w-full rounded-3xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </View>
    );
  }

  return (
    <>
      {/* XP Bar */}
      <XpBar xp={xp} />

      {/* Recent XP */}
      {xpData.recent.length > 0 && (
        <View className="mx-4 mb-4">
          <View className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider">
              XP récents
            </Text>
          </View>
          <View className="space-y-1.5">
            {xpData.recent.slice(0, 5).map((log, i) => (
              <View
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
              >
                <Text className="text-white/60 text-xs truncate">{log.reason}</Text>
                <Text className="text-emerald-400 text-xs font-bold shrink-0 ml-2">
                  +{log.amount} XP
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Badges by category */}
      {categories.map((cat) => {
        const defs = BADGE_DEFINITIONS.filter((b) => b.category === cat);
        const unlocked = defs.filter((b) => unlockedIds.has(b.id));
        return (
          <View key={cat} className="mx-4 mb-5">
            <View className="flex items-center justify-between mb-2">
              <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                {CATEGORY_LABELS[cat]}
              </Text>
              <Text className="text-white/30 text-xs">
                {unlocked.length}/{defs.length}
              </Text>
            </View>
            <View className="gap-2">
              {defs.map((def) => (
                <BadgeCard
                  key={def.id}
                  def={def}
                  unlockedAt={unlockedMap.get(def.id)}
                />
              ))}
            </View>
          </View>
        );
      })}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
interface BadgesPageProps {
  onBack: () => void;
}

export default function BadgesPage({ onBack }: BadgesPageProps) {
  const { isAuthenticated, user } = useFirebaseAuth();
  const email = user?.email;

  return (
    <View
      className="h-full w-full flex flex-col overflow-hidden"
      style={{  }}
    >
      {/* Header */}
      <View className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Pressable
          onPress={onBack}
          className="p-2 rounded-full text-white/60"
        >
          <ArrowLeft className="w-5 h-5" />
        </Pressable>
        <View>
          <Text className="text-white font-bold text-lg">Badges & XP</Text>
          <Text className="text-white/40 text-xs">
            Débloquez des récompenses en utilisant l'app
          </Text>
        </View>
      </View>

      {/* Scrollable content */}
      <View className="flex-1 overflow-y-auto pb-8">
        {isAuthenticated && email ? (
          <BadgesContent email={email} />
        ) : (
          <View className="flex flex-col items-center justify-center h-48 gap-3">
            <Zap className="w-10 h-10 text-indigo-400 opacity-50" />
            <Text className="text-white/40 text-sm text-center px-8">
              <Text>Connectez-vous pour voir vos badges et votre XP</Text></Text>
          </View>
        )}
      </View>
    </View>
  );
}

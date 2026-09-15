// src/pages/modules/BadgesPage.tsx
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Award,
  Lock,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { BADGE_DEFINITIONS, LEVELS } from "@/constants/badges";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import type { BadgeDef } from "@/constants/badges";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface BadgesPageProps {
  onBack: () => void;
}

type XpLog = { reason: string; amount: number; createdAt?: number };

type BadgeUnlock = { badgeId: string; unlockedAt: string };

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */

const T = {
  bg: "#07070C",
  card: "rgba(255,255,255,0.045)",
  cardUp: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.08)",
  borderUp: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.58)",
  faint: "rgba(255,255,255,0.32)",
  ghost: "rgba(255,255,255,0.18)",
  primary: "#8B5CF6",
  primarySoft: "#C4B5FD",
  success: "#10B981",
  amber: "#F59E0B",
  amberSoft: "#FCD34D",
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  publication: "Publications",
  social: "Social",
  exploration: "Exploration",
  engagement: "Engagement",
  special: "Spécial",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  publication: Award,
  social: Sparkles,
  exploration: TrendingUp,
  engagement: Zap,
  special: Trophy,
};

const SCREEN_W = Dimensions.get("window").width;

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

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
  return {
    progress: Math.max(0, Math.min(100, progress)),
    pointsToNext: next.min - xp,
    next,
  };
}

/* ════════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ════════════════════════════════════════════════════════════════════════════ */

function Skeleton({
  style,
}: {
  style?: React.ComponentProps<typeof Animated.View>["style"];
}) {
  const opacity = useRef(new Animated.Value(0.28)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.65,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.28,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[
        {
          backgroundColor: "rgba(255,255,255,0.06)",
          borderRadius: 18,
          opacity,
        },
        style,
      ]}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   XP BAR — carte hero du niveau
   ════════════════════════════════════════════════════════════════════════════ */

function XpHeroCard({ xp }: { xp: number }) {
  const level = getLevel(xp);
  const { progress, pointsToNext, next } = getLevelProgress(xp);
  const levelColor = level.color ?? T.primary;

  const widthAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 900,
      useNativeDriver: false,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, widthAnim, glowAnim]);

  return (
    <View
      style={[
        styles.xpHero,
        {
          borderColor: alpha(levelColor, 0.32),
          backgroundColor: alpha(levelColor, 0.08),
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.xpHeroGlow,
          {
            backgroundColor: levelColor,
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.06, 0.16],
            }),
          },
        ]}
      />

      <View style={styles.xpHeroHead}>
        <View
          style={[
            styles.xpHeroEmoji,
            {
              backgroundColor: alpha(levelColor, 0.2),
              borderColor: alpha(levelColor, 0.42),
            },
          ]}
        >
          <Text style={{ fontSize: 28 }}>{level.emoji}</Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.xpHeroLabel}>NIVEAU ACTUEL</Text>
          <Text style={styles.xpHeroName} numberOfLines={1}>
            {level.name}
          </Text>
          <Text style={styles.xpHeroXp}>{xp.toLocaleString()} XP au total</Text>
        </View>

        {next && (
          <View style={styles.xpHeroNextPill}>
            <Text style={styles.xpHeroNextLabel}>Suivant</Text>
            <Text
              style={[
                styles.xpHeroNextName,
                { color: next.color ?? T.primary },
              ]}
            >
              {next.name}
            </Text>
          </View>
        )}
      </View>

      {/* Barre */}
      <View style={styles.xpTrack}>
        <Animated.View
          style={[
            styles.xpFill,
            {
              backgroundColor: levelColor,
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>

      <View style={styles.xpFootRow}>
        <Text style={styles.xpFootText}>
          {progress}% vers {next?.name ?? "le max"}
        </Text>
        {next && pointsToNext > 0 && (
          <View style={styles.xpPointsPill}>
            <Zap size={10} color={levelColor} />
            <Text style={[styles.xpPointsText, { color: levelColor }]}>
              +{pointsToNext} XP
            </Text>
          </View>
        )}
        {!next && (
          <View
            style={[
              styles.xpPointsPill,
              { backgroundColor: alpha(T.amber, 0.18) },
            ]}
          >
            <Trophy size={10} color={T.amberSoft} />
            <Text style={[styles.xpPointsText, { color: T.amberSoft }]}>
              Niveau max
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   XP LOG ROW
   ════════════════════════════════════════════════════════════════════════════ */

function XpLogRow({ log, index }: { log: XpLog; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View
      style={[
        styles.xpLogRow,
        {
          opacity: anim,
          transform: [
            {
              translateX: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.xpLogDot} />
      <Text numberOfLines={1} style={styles.xpLogReason}>
        {log.reason}
      </Text>
      <View style={styles.xpLogAmountPill}>
        <Text style={styles.xpLogAmountText}>+{log.amount}</Text>
        <Text style={styles.xpLogAmountXp}>XP</Text>
      </View>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   BADGE CARD — pièce maîtresse
   ════════════════════════════════════════════════════════════════════════════ */

function BadgeCard({
  def,
  unlockedAt,
  index,
}: {
  def: BadgeDef;
  unlockedAt?: string;
  index: number;
}) {
  const locked = !unlockedAt;
  const color = def.color ?? T.primary;

  const enterAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 380,
      delay: index * 50,
      useNativeDriver: true,
    }).start();

    if (!locked) {
      const loop = Animated.loop(
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 3200,
          useNativeDriver: true,
        }),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [enterAnim, shineAnim, index, locked]);

  const shineTranslate = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 80],
  });

  return (
    <Animated.View
      style={[
        styles.badgeCard,
        {
          backgroundColor: locked
            ? "rgba(255,255,255,0.03)"
            : alpha(color, 0.09),
          borderColor: locked ? T.border : alpha(color, 0.32),
          opacity: enterAnim,
          transform: [
            {
              translateY: enterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
            {
              scale: enterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.96, 1],
              }),
            },
          ],
        },
      ]}
    >
      {/* Emblème */}
      <View
        style={[
          styles.badgeEmblem,
          {
            backgroundColor: locked
              ? "rgba(255,255,255,0.05)"
              : alpha(color, 0.18),
            borderColor: locked ? T.border : alpha(color, 0.4),
          },
        ]}
      >
        {locked ? (
          <Lock size={20} color={T.faint} />
        ) : (
          <Text style={{ fontSize: 26 }}>{def.emoji}</Text>
        )}

        {/* Effet de brillance rotative */}
        {!locked && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.badgeShine,
              { transform: [{ translateX: shineTranslate }] },
            ]}
          />
        )}
      </View>

      {/* Texte */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.badgeTitleRow}>
          <Text
            numberOfLines={1}
            style={[styles.badgeLabel, { color: locked ? T.dim : T.text }]}
          >
            {def.label}
          </Text>
          {!locked && (
            <View
              style={[styles.badgeUnlockedDot, { backgroundColor: color }]}
            />
          )}
        </View>

        <Text
          numberOfLines={2}
          style={[styles.badgeDesc, { color: locked ? T.faint : T.dim }]}
        >
          {def.description}
        </Text>

        {/* Récompense XP */}
        {def.xpReward > 0 && (
          <View
            style={[
              styles.badgeXpPill,
              {
                backgroundColor: locked
                  ? "rgba(255,255,255,0.04)"
                  : alpha(color, 0.16),
                borderColor: locked ? T.border : alpha(color, 0.3),
              },
            ]}
          >
            <Zap
              size={10}
              color={locked ? T.faint : color}
              fill={locked ? "transparent" : color}
            />
            <Text
              style={[styles.badgeXpText, { color: locked ? T.faint : color }]}
            >
              +{def.xpReward} XP
            </Text>
          </View>
        )}
      </View>

      {/* Statut */}
      {locked ? (
        <View style={styles.badgeLockPill}>
          <Text style={styles.badgeLockText}>À débloquer</Text>
        </View>
      ) : (
        <View style={[styles.badgeCheck, { backgroundColor: color }]}>
          <Trophy size={12} color="#fff" fill="#fff" />
        </View>
      )}
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SECTION HEADER
   ════════════════════════════════════════════════════════════════════════════ */

function SectionHeader({
  category,
  unlocked,
  total,
  accent,
}: {
  category: string;
  unlocked: number;
  total: number;
  accent: string;
}) {
  const Icon = CATEGORY_ICONS[category] ?? Award;
  const ratio = total > 0 ? unlocked / total : 0;

  return (
    <View style={styles.sectionHead}>
      <View
        style={[styles.sectionIcon, { backgroundColor: alpha(accent, 0.15) }]}
      >
        <Icon size={14} color={accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.sectionTitle} numberOfLines={1}>
          {CATEGORY_LABELS[category] ?? category}
        </Text>
        <View style={styles.sectionSubRow}>
          <View style={styles.sectionProgressTrack}>
            <View
              style={[
                styles.sectionProgressFill,
                {
                  width: `${Math.round(ratio * 100)}%`,
                  backgroundColor: accent,
                },
              ]}
            />
          </View>
          <Text style={styles.sectionSubText}>
            {unlocked}/{total}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CONTENU (auth)
   ════════════════════════════════════════════════════════════════════════════ */

function BadgesContent({ email }: { email: string }) {
  const xpData = useQuery(api.badges.getMyXp, email ? { email } : "skip");
  const myBadges = useQuery(api.badges.getMyBadges, email ? { email } : "skip");

  const unlockedIds = useMemo(
    () => new Set((myBadges ?? []).map((b) => b.badgeId)),
    [myBadges],
  );
  const unlockedMap = useMemo(
    () =>
      new Map<string, string>(
        (myBadges ?? []).map((b: BadgeUnlock) => [b.badgeId, b.unlockedAt]),
      ),
    [myBadges],
  );

  const xp = xpData?.total ?? 0;

  const categories = [
    "publication",
    "social",
    "exploration",
    "engagement",
    "special",
  ] as const;

  if (xpData === undefined || myBadges === undefined) {
    return (
      <View style={{ paddingHorizontal: 20, gap: 14 }}>
        <Skeleton style={{ height: 130, borderRadius: 26 }} />
        <Skeleton style={{ height: 40, borderRadius: 14 }} />
        <Skeleton style={{ height: 90, borderRadius: 20 }} />
        <Skeleton style={{ height: 90, borderRadius: 20 }} />
        <Skeleton style={{ height: 90, borderRadius: 20 }} />
      </View>
    );
  }

  const recentXp = (xpData.recent ?? []) as XpLog[];
  const totalUnlocked = unlockedIds.size;
  const totalBadges = BADGE_DEFINITIONS.length;

  return (
    <View style={{ gap: 22 }}>
      {/* Hero XP */}
      <XpHeroCard xp={xp} />

      {/* Résumé global */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: alpha(T.primary, 0.15) },
            ]}
          >
            <Trophy size={14} color={T.primarySoft} />
          </View>
          <Text style={styles.summaryValue}>
            {totalUnlocked}
            <Text style={styles.summaryValueSub}>/{totalBadges}</Text>
          </Text>
          <Text style={styles.summaryLabel}>Badges débloqués</Text>
        </View>

        <View style={styles.summaryCard}>
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: alpha(T.amber, 0.15) },
            ]}
          >
            <Zap size={14} color={T.amberSoft} />
          </View>
          <Text style={styles.summaryValue}>{xp.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>XP total</Text>
        </View>

        <View style={styles.summaryCard}>
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: alpha(T.success, 0.15) },
            ]}
          >
            <Sparkles size={14} color={T.success} />
          </View>
          <Text style={styles.summaryValue}>
            {Math.round((totalUnlocked / Math.max(1, totalBadges)) * 100)}%
          </Text>
          <Text style={styles.summaryLabel}>Complétion</Text>
        </View>
      </View>

      {/* XP récents */}
      {recentXp.length > 0 && (
        <View>
          <View style={styles.sectionHead}>
            <View
              style={[
                styles.sectionIcon,
                { backgroundColor: alpha("#818CF8", 0.15) },
              ]}
            >
              <TrendingUp size={14} color="#A5B4FC" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>XP récents</Text>
              <Text style={styles.sectionSubtitle}>
                Tes dernières récompenses
              </Text>
            </View>
          </View>

          <View style={{ gap: 8, marginTop: 12 }}>
            {recentXp.slice(0, 5).map((log, i) => (
              <XpLogRow key={i} log={log} index={i} />
            ))}
          </View>
        </View>
      )}

      {/* Badges par catégorie */}
      {categories.map((cat) => {
        const defs = BADGE_DEFINITIONS.filter((b) => b.category === cat);
        if (defs.length === 0) return null;
        const unlocked = defs.filter((b) => unlockedIds.has(b.id));
        const accent = defs[0]?.color ?? T.primary;

        return (
          <View key={cat}>
            <SectionHeader
              category={cat}
              unlocked={unlocked.length}
              total={defs.length}
              accent={accent}
            />

            <View style={{ gap: 10, marginTop: 12 }}>
              {defs.map((def, i) => (
                <BadgeCard
                  key={def.id}
                  def={def}
                  unlockedAt={unlockedMap.get(def.id)}
                  index={i}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ════════════════════════════════════════════════════════════════════════════ */

export default function BadgesPage({ onBack }: BadgesPageProps) {
  const { isAuthenticated, user } = useFirebaseAuth();
  const email = user?.email;

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glow} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
            >
              <Trophy size={16} color={T.amberSoft} />
              <Text style={styles.title}>Badges & XP</Text>
            </View>
            <Text style={styles.subtitle}>
              Débloque des récompenses en utilisant l'app
            </Text>
          </View>
        </View>
      </View>

      {/* Contenu */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isAuthenticated && email ? (
          <BadgesContent email={email} />
        ) : (
          <View style={styles.authGate}>
            <View style={styles.authIcon}>
              <Zap size={30} color={T.primarySoft} />
            </View>
            <Text style={styles.authTitle}>Tes badges t'attendent</Text>
            <Text style={styles.authText}>
              Connecte-toi pour suivre ton XP, débloquer des badges et suivre ta
              progression dans la communauté.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  glow: {
    position: "absolute",
    top: -150,
    left: -80,
    right: -80,
    height: 320,
    borderRadius: 220,
    backgroundColor: alpha(T.primary, 0.12),
  },

  /* Header */
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 6 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  title: {
    color: T.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: { color: T.faint, fontSize: 11.5, marginTop: 2 },

  /* Content */
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 60,
  },

  /* XP Hero */
  xpHero: {
    padding: 18,
    borderRadius: 26,
    borderWidth: 1,
    overflow: "hidden",
    gap: 14,
  },
  xpHeroGlow: {
    position: "absolute",
    top: -80,
    left: -40,
    right: -40,
    height: 200,
    borderRadius: 200,
  },
  xpHeroHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  xpHeroEmoji: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  xpHeroLabel: {
    color: T.faint,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  xpHeroName: {
    color: T.text,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginTop: 3,
  },
  xpHeroXp: {
    color: T.dim,
    fontSize: 11.5,
    fontWeight: "700",
    marginTop: 3,
  },
  xpHeroNextPill: {
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
  },
  xpHeroNextLabel: {
    color: T.faint,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  xpHeroNextName: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },
  xpTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    borderRadius: 999,
  },
  xpFootRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  xpFootText: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "700",
  },
  xpPointsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  xpPointsText: {
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  /* Summary row */
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    gap: 8,
    alignItems: "center",
  },
  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryValue: {
    color: T.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  summaryValueSub: {
    color: T.faint,
    fontSize: 13,
    fontWeight: "800",
  },
  summaryLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  /* Section header */
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: T.text,
    fontSize: 14.5,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  sectionSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  sectionProgressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  sectionProgressFill: {
    height: "100%",
    borderRadius: 999,
  },
  sectionSubText: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    color: T.faint,
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },

  /* XP log */
  xpLogRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  xpLogDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.success,
  },
  xpLogReason: {
    color: T.dim,
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  xpLogAmountPill: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: alpha(T.success, 0.14),
    borderWidth: 1,
    borderColor: alpha(T.success, 0.3),
  },
  xpLogAmountText: {
    color: "#34D399",
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  xpLogAmountXp: {
    color: alpha(T.success, 0.7),
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  /* Badge card */
  badgeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  badgeEmblem: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  badgeShine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: "rgba(255,255,255,0.22)",
    transform: [{ skewX: "-20deg" }],
  },
  badgeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  badgeLabel: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  badgeUnlockedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 4,
    fontWeight: "600",
  },
  badgeXpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 8,
  },
  badgeXpText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  badgeLockPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
  },
  badgeLockText: {
    color: T.faint,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  badgeCheck: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Auth gate */
  authGate: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 14,
  },
  authIcon: {
    width: 78,
    height: 78,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.14),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.32),
    marginBottom: 6,
  },
  authTitle: {
    color: T.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  authText: {
    color: T.dim,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 300,
  },
});

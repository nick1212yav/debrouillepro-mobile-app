import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  Check,
  Crown,
  Lock,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react-native";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api.js";
import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin.tsx";
import { getLevel, getLevelProgress, LEVEL_ORDER } from "@/hooks/use-points.ts";
import type { Level } from "@/hooks/use-points.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RecompensesPageProps {
  onBack: () => void;
}

type Tab = "overview" | "history";

interface XpHistoryEntry {
  id: string;
  amount: number;
  reason: string;
  sourceType: string;
  createdAt: string;
}

interface RewardsData {
  totalXp: number;
  xpHistory: XpHistoryEntry[];
  badgeCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = {
  background: "#050812",
  surface: "rgba(255,255,255,0.045)",
  surfaceStrong: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.09)",
  borderStrong: "rgba(139,92,246,0.28)",
  white: "#FFFFFF",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.62)",
  textMuted: "rgba(255,255,255,0.38)",
  purple: "#8B5CF6",
  purpleBright: "#A78BFA",
  green: "#34D399",
  yellow: "#FACC15",
  orange: "#FB923C",
  red: "#F87171",
};

// ─────────────────────────────────────────────────────────────────────────────
// Level metadata
// ─────────────────────────────────────────────────────────────────────────────

const LEVEL_META: Record<
  Level,
  {
    icon: string;
    from: string;
    to: string;
    text: string;
    glow: string;
    threshold: number;
  }
> = {
  Bronze: {
    icon: "🥉",
    from: "#CD7F32",
    to: "#A0522D",
    text: "#CD7F32",
    glow: "rgba(205,127,50,0.38)",
    threshold: 0,
  },
  Argent: {
    icon: "🥈",
    from: "#C0C0C0",
    to: "#A8A8A8",
    text: "#D1D5DB",
    glow: "rgba(192,192,192,0.34)",
    threshold: 500,
  },
  Or: {
    icon: "🥇",
    from: "#FFD700",
    to: "#FFA500",
    text: "#FFD700",
    glow: "rgba(255,215,0,0.42)",
    threshold: 1500,
  },
  Diamant: {
    icon: "💎",
    from: "#B9F2FF",
    to: "#7DD3FC",
    text: "#7DD3FC",
    glow: "rgba(125,211,252,0.45)",
    threshold: 4000,
  },
};

const SOURCE_TYPE_META: Record<
  string,
  {
    emoji: string;
    label: string;
  }
> = {
  publication: {
    emoji: "📝",
    label: "Publication",
  },
  like: {
    emoji: "❤️",
    label: "Interaction",
  },
  comment: {
    emoji: "💬",
    label: "Commentaire",
  },
  follow: {
    emoji: "👥",
    label: "Réseau",
  },
  module_visit: {
    emoji: "🏠",
    label: "Navigation",
  },
  badge: {
    emoji: "🏅",
    label: "Badge",
  },
  onboarding: {
    emoji: "🎉",
    label: "Profil",
  },
  daily_streak: {
    emoji: "🔥",
    label: "Streak",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatNumber(value: number): string {
  return value.toLocaleString("fr-FR");
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date indisponible";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSourceMeta(sourceType: string) {
  return (
    SOURCE_TYPE_META[sourceType] ?? {
      emoji: "⚡",
      label: "Activité",
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI
// ─────────────────────────────────────────────────────────────────────────────

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Retour"
      onPress={onBack}
      style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
    >
      <ArrowLeft size={20} color={COLORS.white} />
    </Pressable>
  );
}

function PageHeader({ onBack, total }: { onBack: () => void; total?: number }) {
  return (
    <View style={styles.header}>
      <BackButton onBack={onBack} />

      <View style={styles.headerCopy}>
        <Text style={styles.headerTitle}>Récompenses</Text>
        <Text style={styles.headerSubtitle}>
          Votre progression réelle dans Débrouille Pro
        </Text>
      </View>

      {typeof total === "number" ? (
        <View style={styles.xpPill}>
          <Zap size={14} color={COLORS.yellow} />
          <Text style={styles.xpPillValue}>{formatNumber(total)}</Text>
          <Text style={styles.xpPillLabel}>XP</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Level card
// ─────────────────────────────────────────────────────────────────────────────

function LevelCard({ total }: { total: number }) {
  const { level, nextLevel, progress, pointsToNext } = getLevelProgress(total);

  const meta = LEVEL_META[level];

  return (
    <View style={styles.levelCard}>
      <View style={styles.levelGlow} />

      <View style={styles.levelTopRow}>
        <View style={styles.levelIdentity}>
          <View
            style={[
              styles.levelIcon,
              {
                borderColor: `${meta.text}55`,
                backgroundColor: `${meta.from}18`,
              },
            ]}
          >
            <Text style={styles.levelEmoji}>{meta.icon}</Text>
          </View>

          <View style={styles.levelIdentityText}>
            <Text style={styles.levelEyebrow}>Niveau actuel</Text>
            <Text style={[styles.levelName, { color: meta.text }]}>
              {level}
            </Text>
          </View>
        </View>

        <View style={styles.totalXpBlock}>
          <Text style={styles.totalXpValue}>{formatNumber(total)}</Text>
          <Text style={styles.totalXpLabel}>points XP</Text>
        </View>
      </View>

      {nextLevel ? (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Progression vers {LEVEL_META[nextLevel].icon} {nextLevel}
            </Text>

            <Text style={[styles.progressValue, { color: meta.text }]}>
              {progress}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(Math.max(progress, 0), 100)}%`,
                  backgroundColor: meta.from,
                },
              ]}
            />
          </View>

          <Text style={styles.remainingText}>
            {formatNumber(pointsToNext)} points avant le prochain niveau
          </Text>
        </View>
      ) : (
        <View style={styles.maximumLevel}>
          <Crown size={16} color={meta.text} />
          <Text style={[styles.maximumLevelText, { color: meta.text }]}>
            Niveau maximum atteint
          </Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Level roadmap
// ─────────────────────────────────────────────────────────────────────────────

function LevelRoadmap({ total }: { total: number }) {
  const currentLevel = getLevel(total);
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel);

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderIcon}>
          <TrendingUp size={15} color={COLORS.purpleBright} />
        </View>

        <View>
          <Text style={styles.sectionTitle}>Parcours XP</Text>
          <Text style={styles.sectionSubtitle}>
            Votre progression entre les niveaux
          </Text>
        </View>
      </View>

      <View style={styles.roadmap}>
        {LEVEL_ORDER.map((level, index) => {
          const meta = LEVEL_META[level];
          const reached = currentIndex >= index;
          const current = currentLevel === level;

          return (
            <React.Fragment key={level}>
              <View style={styles.roadmapItem}>
                <View
                  style={[
                    styles.roadmapIcon,
                    {
                      backgroundColor: reached
                        ? `${meta.from}22`
                        : "rgba(255,255,255,0.035)",
                      borderColor: reached ? `${meta.text}66` : COLORS.border,
                    },
                    current && {
                      shadowColor: meta.text,
                      shadowOpacity: 0.45,
                      shadowRadius: 14,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: 8,
                    },
                  ]}
                >
                  <Text style={styles.roadmapEmoji}>{meta.icon}</Text>

                  {reached && !current ? (
                    <View
                      style={[
                        styles.checkBadge,
                        { backgroundColor: meta.from },
                      ]}
                    >
                      <Check size={9} color="#050505" strokeWidth={3} />
                    </View>
                  ) : null}
                </View>

                <Text
                  style={[
                    styles.roadmapName,
                    {
                      color: reached ? meta.text : COLORS.textMuted,
                    },
                  ]}
                >
                  {level}
                </Text>

                <Text style={styles.roadmapThreshold}>
                  {formatNumber(meta.threshold)}
                </Text>
              </View>

              {index < LEVEL_ORDER.length - 1 ? (
                <View
                  style={[
                    styles.roadmapConnector,
                    {
                      backgroundColor:
                        currentIndex > index
                          ? COLORS.purple
                          : "rgba(255,255,255,0.08)",
                    },
                  ]}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Honest reward availability card
// ─────────────────────────────────────────────────────────────────────────────

function RewardsAvailabilityCard() {
  return (
    <View style={styles.availabilityCard}>
      <View style={styles.availabilityIcon}>
        <Lock size={20} color={COLORS.purpleBright} />
      </View>

      <View style={styles.availabilityCopy}>
        <Text style={styles.availabilityTitle}>
          Catalogue de récompenses sécurisé
        </Text>

        <Text style={styles.availabilityText}>
          Les avantages échangeables ne sont pas encore reliés à une source de
          vérité transactionnelle. Aucun avantage fictif n’est affiché.
        </Text>

        <View style={styles.comingSoonPill}>
          <Sparkles size={12} color={COLORS.purpleBright} />
          <Text style={styles.comingSoonText}>Service en préparation</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// History
// ─────────────────────────────────────────────────────────────────────────────

function HistoryTab({
  history,
  badgeCount,
}: {
  history: XpHistoryEntry[];
  badgeCount: number;
}) {
  const totalEarned = useMemo(
    () =>
      history.reduce(
        (sum, entry) => sum + (entry.amount > 0 ? entry.amount : 0),
        0,
      ),
    [history],
  );

  return (
    <View>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: COLORS.purpleBright }]}>
            {formatNumber(totalEarned)}
          </Text>
          <Text style={styles.statLabel}>XP gagnés</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: COLORS.green }]}>
            {formatNumber(history.length)}
          </Text>
          <Text style={styles.statLabel}>événements</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: COLORS.orange }]}>
            {formatNumber(badgeCount)}
          </Text>
          <Text style={styles.statLabel}>badges</Text>
        </View>
      </View>

      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <View>
            <Text style={styles.sectionTitle}>Historique XP</Text>
            <Text style={styles.sectionSubtitle}>
              Événements provenant de votre activité
            </Text>
          </View>

          <View style={styles.verifiedBadge}>
            <Check size={11} color={COLORS.green} />
            <Text style={styles.verifiedText}>Source réelle</Text>
          </View>
        </View>

        {history.length === 0 ? (
          <EmptyHistory />
        ) : (
          <View style={styles.historyList}>
            {history.map((entry) => {
              const meta = getSourceMeta(entry.sourceType);
              const positive = entry.amount > 0;

              return (
                <View key={entry.id} style={styles.historyItem}>
                  <View style={styles.historyIcon}>
                    <Text style={styles.historyEmoji}>{meta.emoji}</Text>
                  </View>

                  <View style={styles.historyContent}>
                    <Text style={styles.historyReason} numberOfLines={2}>
                      {entry.reason}
                    </Text>

                    <Text style={styles.historyMeta}>
                      {meta.label} · {formatDate(entry.createdAt)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.historyAmount,
                      {
                        color: positive ? COLORS.green : COLORS.red,
                      },
                    ]}
                  >
                    {positive ? "+" : ""}
                    {formatNumber(entry.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

function EmptyHistory() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Zap size={22} color={COLORS.textMuted} />
      </View>

      <Text style={styles.emptyTitle}>Aucune activité XP</Text>

      <Text style={styles.emptyText}>
        Aucun événement XP réel n’est actuellement disponible pour votre compte.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview
// ─────────────────────────────────────────────────────────────────────────────

function OverviewTab({
  total,
  badgeCount,
}: {
  total: number;
  badgeCount: number;
}) {
  return (
    <View>
      <View style={styles.quickStats}>
        <View style={styles.quickStat}>
          <View
            style={[
              styles.quickStatIcon,
              { backgroundColor: "rgba(139,92,246,0.14)" },
            ]}
          >
            <Zap size={17} color={COLORS.purpleBright} />
          </View>

          <View>
            <Text style={styles.quickStatValue}>{formatNumber(total)}</Text>
            <Text style={styles.quickStatLabel}>XP total</Text>
          </View>
        </View>

        <View style={styles.quickStat}>
          <View
            style={[
              styles.quickStatIcon,
              { backgroundColor: "rgba(251,146,60,0.14)" },
            ]}
          >
            <Text style={styles.quickStatEmoji}>🏅</Text>
          </View>

          <View>
            <Text style={styles.quickStatValue}>
              {formatNumber(badgeCount)}
            </Text>
            <Text style={styles.quickStatLabel}>Badges obtenus</Text>
          </View>
        </View>
      </View>

      <RewardsAvailabilityCard />

      <View style={styles.integrityCard}>
        <View style={styles.integrityIcon}>
          <Check size={16} color={COLORS.green} />
        </View>

        <View style={styles.integrityCopy}>
          <Text style={styles.integrityTitle}>Programme transparent</Text>
          <Text style={styles.integrityText}>
            Cette page affiche uniquement les informations disponibles depuis la
            source de données du compte. Aucun solde, avantage ou événement
            n’est inventé pour remplir l’interface.
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Authenticated content
// ─────────────────────────────────────────────────────────────────────────────

function RecompensesContent({ onBack }: { onBack: () => void }) {
  const rewardsData = useQuery(api.utility.getUserRewardsData, {});

  const [tab, setTab] = useState<Tab>("overview");

  if (rewardsData === undefined) {
    return <LoadingState onBack={onBack} />;
  }

  const data = rewardsData as RewardsData;

  const total = Number.isFinite(data.totalXp) ? data.totalXp : 0;
  const badgeCount = Number.isFinite(data.badgeCount) ? data.badgeCount : 0;

  const history = Array.isArray(data.xpHistory) ? data.xpHistory : [];

  return (
    <View style={styles.screen}>
      <PageHeader onBack={onBack} total={total} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LevelCard total={total} />

        <LevelRoadmap total={total} />

        <View style={styles.tabs}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === "overview" }}
            onPress={() => setTab("overview")}
            style={({ pressed }) => [
              styles.tab,
              tab === "overview" && styles.tabActive,
              pressed && styles.pressed,
            ]}
          >
            <Sparkles
              size={14}
              color={
                tab === "overview" ? COLORS.purpleBright : COLORS.textMuted
              }
            />
            <Text
              style={[
                styles.tabText,
                tab === "overview" && styles.tabTextActive,
              ]}
            >
              Récompenses
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === "history" }}
            onPress={() => setTab("history")}
            style={({ pressed }) => [
              styles.tab,
              tab === "history" && styles.tabActive,
              pressed && styles.pressed,
            ]}
          >
            <TrendingUp
              size={14}
              color={tab === "history" ? COLORS.purpleBright : COLORS.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                tab === "history" && styles.tabTextActive,
              ]}
            >
              Historique
            </Text>
          </Pressable>
        </View>

        {tab === "overview" ? (
          <OverviewTab total={total} badgeCount={badgeCount} />
        ) : (
          <HistoryTab history={history} badgeCount={badgeCount} />
        )}

        <View style={styles.footerNote}>
          <Lock size={12} color={COLORS.textMuted} />
          <Text style={styles.footerText}>
            Les données XP affichées sont liées au compte authentifié.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading
// ─────────────────────────────────────────────────────────────────────────────

function LoadingState({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <View style={styles.loadingHeader}>
        <BackButton onBack={onBack} />

        <View style={styles.loadingHeaderCopy}>
          <Text style={styles.headerTitle}>Récompenses</Text>
          <Text style={styles.headerSubtitle}>
            Vérification de vos données…
          </Text>
        </View>
      </View>

      <View style={styles.loadingBody}>
        <ActivityIndicator size="large" color={COLORS.purpleBright} />

        <Text style={styles.loadingTitle}>Chargement des données XP</Text>

        <Text style={styles.loadingText}>
          Nous récupérons les informations réelles de votre compte.
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Unauthenticated
// ─────────────────────────────────────────────────────────────────────────────

function UnauthenticatedState({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <View style={styles.unauthBack}>
        <BackButton onBack={onBack} />
      </View>

      <View style={styles.unauthenticated}>
        <View style={styles.unauthIcon}>
          <Text style={styles.unauthEmoji}>🏆</Text>
        </View>

        <Text style={styles.unauthTitle}>Récompenses</Text>

        <Text style={styles.unauthText}>
          Connectez-vous pour accéder à vos données XP, votre progression et vos
          badges.
        </Text>

        <SignInButton />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth loading
// ─────────────────────────────────────────────────────────────────────────────

function AuthenticationLoadingState({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <View style={styles.loadingHeader}>
        <BackButton onBack={onBack} />

        <View style={styles.loadingHeaderCopy}>
          <Text style={styles.headerTitle}>Récompenses</Text>
          <Text style={styles.headerSubtitle}>Vérification de la session…</Text>
        </View>
      </View>

      <View style={styles.loadingBody}>
        <ActivityIndicator size="large" color={COLORS.purpleBright} />

        <Text style={styles.loadingTitle}>Vérification de votre compte</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function RecompensesPage({ onBack }: RecompensesPageProps) {
  return (
    <>
      <Authenticated>
        <RecompensesContent onBack={onBack} />
      </Authenticated>

      <Unauthenticated>
        <UnauthenticatedState onBack={onBack} />
      </Unauthenticated>

      <AuthLoading>
        <AuthenticationLoadingState onBack={onBack} />
      </AuthLoading>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 36,
  },

  // Header

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 12,
  },

  loadingHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 12,
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,
  },

  loadingHeaderCopy: {
    flex: 1,
  },

  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 3,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.075)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pressed: {
    opacity: 0.68,
    transform: [{ scale: 0.97 }],
  },

  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 13,
    backgroundColor: "rgba(250,204,21,0.10)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.20)",
  },

  xpPillValue: {
    color: COLORS.yellow,
    fontSize: 14,
    fontWeight: "900",
  },

  xpPillLabel: {
    color: "rgba(250,204,21,0.58)",
    fontSize: 10,
    fontWeight: "700",
  },

  // Level

  levelCard: {
    position: "relative",
    overflow: "hidden",
    padding: 20,
    marginBottom: 14,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  levelGlow: {
    position: "absolute",
    width: 170,
    height: 170,
    right: -80,
    top: -95,
    borderRadius: 100,
    backgroundColor: "rgba(139,92,246,0.12)",
  },

  levelTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  levelIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  levelIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  levelEmoji: {
    fontSize: 29,
  },

  levelIdentityText: {
    flex: 1,
  },

  levelEyebrow: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  levelName: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },

  totalXpBlock: {
    alignItems: "flex-end",
  },

  totalXpValue: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
  },

  totalXpLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 1,
  },

  progressSection: {
    marginTop: 22,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  progressLabel: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },

  progressValue: {
    fontSize: 12,
    fontWeight: "900",
  },

  progressTrack: {
    height: 9,
    overflow: "hidden",
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 99,
  },

  remainingText: {
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: "right",
    marginTop: 6,
  },

  maximumLevel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 18,
  },

  maximumLevelText: {
    fontSize: 11,
    fontWeight: "800",
  },

  // Roadmap

  sectionCard: {
    padding: 16,
    marginBottom: 14,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },

  sectionHeaderIcon: {
    width: 31,
    height: 31,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.12)",
  },

  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },

  roadmap: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },

  roadmapItem: {
    flex: 1,
    alignItems: "center",
  },

  roadmapIcon: {
    position: "relative",
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  roadmapEmoji: {
    fontSize: 21,
  },

  checkBadge: {
    position: "absolute",
    right: -4,
    top: -4,
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  roadmapName: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 6,
  },

  roadmapThreshold: {
    color: COLORS.textMuted,
    fontSize: 8,
    marginTop: 2,
  },

  roadmapConnector: {
    width: 12,
    height: 2,
    marginTop: 21,
    borderRadius: 2,
  },

  // Tabs

  tabs: {
    flexDirection: "row",
    gap: 5,
    padding: 4,
    marginBottom: 14,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  tab: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 13,
  },

  tabActive: {
    backgroundColor: "rgba(139,92,246,0.16)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.24)",
  },

  tabText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },

  tabTextActive: {
    color: COLORS.purpleBright,
  },

  // Overview

  quickStats: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  quickStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  quickStatIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  quickStatEmoji: {
    fontSize: 17,
  },

  quickStatValue: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },

  quickStatLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },

  // Availability

  availabilityCard: {
    flexDirection: "row",
    gap: 13,
    padding: 16,
    marginBottom: 12,
    borderRadius: 22,
    backgroundColor: "rgba(139,92,246,0.07)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
  },

  availabilityIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.12)",
  },

  availabilityCopy: {
    flex: 1,
  },

  availabilityTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },

  availabilityText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  comingSoonPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 9,
    borderRadius: 9,
    backgroundColor: "rgba(139,92,246,0.12)",
  },

  comingSoonText: {
    color: COLORS.purpleBright,
    fontSize: 9,
    fontWeight: "800",
  },

  integrityCard: {
    flexDirection: "row",
    gap: 11,
    padding: 14,
    borderRadius: 19,
    backgroundColor: "rgba(52,211,153,0.045)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.16)",
  },

  integrityIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52,211,153,0.10)",
  },

  integrityCopy: {
    flex: 1,
  },

  integrityTitle: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "800",
  },

  integrityText: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  // History

  statsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statValue: {
    fontSize: 17,
    fontWeight: "900",
  },

  statLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 3,
  },

  historyCard: {
    padding: 15,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(52,211,153,0.08)",
  },

  verifiedText: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: "800",
  },

  historyList: {
    gap: 7,
  },

  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.11)",
  },

  historyEmoji: {
    fontSize: 17,
  },

  historyContent: {
    flex: 1,
    minWidth: 0,
  },

  historyReason: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "700",
  },

  historyMeta: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 3,
  },

  historyAmount: {
    fontSize: 12,
    fontWeight: "900",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 38,
    paddingHorizontal: 20,
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "800",
  },

  emptyText: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 5,
  },

  // Footer

  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 18,
  },

  footerText: {
    color: COLORS.textMuted,
    fontSize: 9,
  },

  // Loading

  loadingBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },

  loadingTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 15,
  },

  loadingText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
    marginTop: 6,
  },

  // Unauthenticated

  unauthBack: {
    position: "absolute",
    top: 18,
    left: 20,
    zIndex: 10,
  },

  unauthenticated: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },

  unauthIcon: {
    width: 78,
    height: 78,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    backgroundColor: "rgba(139,92,246,0.11)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.25)",
  },

  unauthEmoji: {
    fontSize: 38,
  },

  unauthTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: "900",
  },

  unauthText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
});

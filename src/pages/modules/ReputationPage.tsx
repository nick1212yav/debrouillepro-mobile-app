import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Crown,
  Flame,
  Gift,
  Heart,
  MessageCircle,
  ShieldCheck,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react-native";

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api";
import { SignInButton } from "@/components/ui/signin";

type ReputationEventType =
  | "publication_liked"
  | "comment_liked"
  | "followed"
  | "review_received"
  | "sale_completed"
  | "badge_earned"
  | "verified";

type Tab = "overview" | "history" | "ranking";

type LevelDefinition = {
  min: number;
  max: number | null;
  name: string;
  emoji: string;
  description: string;
};

const LEVELS: readonly LevelDefinition[] = [
  {
    min: 0,
    max: 500,
    name: "Débutant",
    emoji: "🌱",
    description: "Vous commencez votre parcours sur Débrouille Pro.",
  },
  {
    min: 500,
    max: 1500,
    name: "Actif",
    emoji: "⚡",
    description: "Votre présence commence à créer de la valeur.",
  },
  {
    min: 1500,
    max: 3000,
    name: "Contributeur",
    emoji: "🔥",
    description: "Vous contribuez régulièrement à l'écosystème.",
  },
  {
    min: 3000,
    max: 6000,
    name: "Expert",
    emoji: "💜",
    description: "Votre activité démontre une contribution significative.",
  },
  {
    min: 6000,
    max: 12000,
    name: "Maître",
    emoji: "👑",
    description: "Votre réputation repose sur une forte contribution.",
  },
  {
    min: 12000,
    max: null,
    name: "Légende",
    emoji: "🌟",
    description: "Le niveau supérieur de contribution actuellement défini.",
  },
];

const EVENT_META: Record<
  ReputationEventType,
  {
    icon: typeof Star;
    label: string;
    color: string;
  }
> = {
  publication_liked: {
    icon: MessageCircle,
    label: "Publication appréciée",
    color: "#8B5CF6",
  },
  comment_liked: {
    icon: Heart,
    label: "Commentaire apprécié",
    color: "#EF4444",
  },
  followed: {
    icon: Users,
    label: "Nouveau suivi",
    color: "#10B981",
  },
  review_received: {
    icon: Star,
    label: "Avis reçu",
    color: "#F59E0B",
  },
  sale_completed: {
    icon: Zap,
    label: "Vente réalisée",
    color: "#F97316",
  },
  badge_earned: {
    icon: Award,
    label: "Badge obtenu",
    color: "#A78BFA",
  },
  verified: {
    icon: ShieldCheck,
    label: "Compte vérifié",
    color: "#22C55E",
  },
};

function getLevel(points: number): LevelDefinition {
  for (let index = LEVELS.length - 1; index >= 0; index -= 1) {
    const level = LEVELS[index];

    if (points >= level.min) {
      return level;
    }
  }

  return LEVELS[0];
}

function getLevelProgress(points: number): {
  percentage: number;
  remaining: number;
  next: LevelDefinition | null;
} {
  const level = getLevel(points);
  const index = LEVELS.findIndex((candidate) => candidate.name === level.name);

  const next = LEVELS[index + 1] ?? null;

  if (!next) {
    return {
      percentage: 100,
      remaining: 0,
      next: null,
    };
  }

  const range = next.min - level.min;
  const current = Math.max(0, points - level.min);
  const percentage = Math.min(100, Math.round((current / range) * 100));

  return {
    percentage,
    remaining: Math.max(0, next.min - points),
    next,
  };
}

function formatRelativeTime(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);

  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) {
    return "À l'instant";
  }

  if (minutes < 60) {
    return `Il y a ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Il y a ${hours} h`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `Il y a ${days} j`;
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return `Il y a ${months} mois`;
  }

  return `Il y a ${Math.floor(months / 12)} an`;
}

function ReputationSkeleton(): React.ReactElement {
  return (
    <View style={styles.screen}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonCircle} />
        <View style={styles.skeletonLineLarge} />
      </View>

      <View style={styles.skeletonHero}>
        <View style={styles.skeletonAvatar} />

        <View style={styles.skeletonTextColumn}>
          <View style={styles.skeletonLineMedium} />
          <View style={styles.skeletonLineSmall} />
          <View style={styles.skeletonLineTiny} />
        </View>
      </View>

      <View style={styles.skeletonStats}>
        <View style={styles.skeletonStat} />
        <View style={styles.skeletonStat} />
        <View style={styles.skeletonStat} />
      </View>

      <View style={styles.skeletonCard} />
      <View style={styles.skeletonCard} />
      <View style={styles.skeletonCard} />
    </View>
  );
}

function Header({
  onBack,
  title,
  subtitle,
}: {
  onBack: () => void;
  title: string;
  subtitle?: string;
}): React.ReactElement {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        hitSlop={10}
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <ArrowLeft size={19} color="#FFFFFF" />
      </Pressable>

      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>{title}</Text>

        {subtitle ? (
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

function LevelProgress({ points }: { points: number }): React.ReactElement {
  const level = getLevel(points);
  const progress = getLevelProgress(points);

  return (
    <View style={styles.progressSection}>
      <View style={styles.progressHeader}>
        <View>
          <Text style={styles.progressEyebrow}>PROGRESSION</Text>

          <Text style={styles.progressLevel}>
            {level.emoji} {level.name}
          </Text>
        </View>

        {progress.next ? (
          <Text style={styles.progressRemaining}>
            {progress.remaining.toLocaleString()} XP
          </Text>
        ) : (
          <Text style={styles.progressRemaining}>Niveau maximal</Text>
        )}
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress.percentage}%`,
            },
          ]}
        />
      </View>

      <View style={styles.progressFooter}>
        <Text style={styles.progressDescription}>{level.description}</Text>

        {progress.next ? (
          <Text style={styles.nextLevelText}>
            Prochain : {progress.next.emoji} {progress.next.name}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function ReputationHero({
  profile,
  eventCount,
  rank,
}: {
  profile: {
    name?: string;
    avatar?: string;
    reputationScore?: number;
    badgeCount?: number;
  };
  eventCount: number;
  rank: number | null;
}): React.ReactElement {
  const points = profile.reputationScore ?? 0;
  const level = getLevel(points);

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroGlowOne} />
      <View style={styles.heroGlowTwo} />

      <View style={styles.identityRow}>
        <View style={styles.avatarWrapper}>
          {profile.avatar ? (
            <Image
              source={{ uri: profile.avatar }}
              style={styles.avatar}
              accessibilityLabel={`Photo de ${profile.name ?? "l'utilisateur"}`}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {(profile.name?.trim().charAt(0) ?? "U").toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.levelOrb}>
            <Text style={styles.levelOrbText}>{level.emoji}</Text>
          </View>
        </View>

        <View style={styles.identityContent}>
          <Text style={styles.userName}>{profile.name ?? "Utilisateur"}</Text>

          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{level.name}</Text>
          </View>

          <Text style={styles.identityDescription}>
            Réputation basée sur vos contributions réelles.
          </Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreValue}>{points.toLocaleString()}</Text>

          <Text style={styles.scoreLabel}>POINTS</Text>
        </View>

        <View style={styles.scoreDivider} />

        <View style={styles.scoreBlock}>
          <Text style={styles.scoreValue}>{profile.badgeCount ?? 0}</Text>

          <Text style={styles.scoreLabel}>BADGES</Text>
        </View>

        <View style={styles.scoreDivider} />

        <View style={styles.scoreBlock}>
          <Text style={styles.scoreValue}>{rank ? `#${rank}` : "—"}</Text>

          <Text style={styles.scoreLabel}>RANG</Text>
        </View>

        <View style={styles.scoreDivider} />

        <View style={styles.scoreBlock}>
          <Text style={styles.scoreValue}>{eventCount}</Text>

          <Text style={styles.scoreLabel}>ACTIONS</Text>
        </View>
      </View>

      <LevelProgress points={points} />
    </View>
  );
}

function TabBar({
  activeTab,
  onChange,
}: {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}): React.ReactElement {
  const tabs: Array<{
    id: Tab;
    label: string;
    icon: typeof Award;
  }> = [
    {
      id: "overview",
      label: "Vue d'ensemble",
      icon: Award,
    },
    {
      id: "history",
      label: "Historique",
      icon: Clock3,
    },
    {
      id: "ranking",
      label: "Classement",
      icon: Trophy,
    },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;

        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(tab.id)}
            style={({ pressed }) => [
              styles.tab,
              active && styles.tabActive,
              pressed && styles.pressed,
            ]}
          >
            <Icon
              size={15}
              color={active ? "#FBBF24" : "rgba(255,255,255,0.45)"}
            />

            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Star;
  label: string;
  value: number;
  accent: string;
}): React.ReactElement {
  return (
    <View style={styles.statCard}>
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor: `${accent}18`,
          },
        ]}
      >
        <Icon size={16} color={accent} />
      </View>

      <Text style={styles.statValue}>{value.toLocaleString()}</Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function OverviewTab({
  events,
  points,
  badgeCount,
}: {
  events: Array<{
    _id: string;
    type: ReputationEventType;
    points: number;
    description: string;
    _creationTime: number;
  }>;
  points: number;
  badgeCount: number;
}): React.ReactElement {
  const counters = useMemo(() => {
    const values: Record<ReputationEventType, number> = {
      publication_liked: 0,
      comment_liked: 0,
      followed: 0,
      review_received: 0,
      sale_completed: 0,
      badge_earned: 0,
      verified: 0,
    };

    for (const event of events) {
      values[event.type] += 1;
    }

    return values;
  }, [events]);

  const weekXp = useMemo(() => {
    const threshold = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return events
      .filter((event) => event._creationTime >= threshold)
      .reduce((total, event) => total + event.points, 0);
  }, [events]);

  return (
    <View style={styles.content}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Votre empreinte</Text>

          <Text style={styles.sectionSubtitle}>
            Ce que votre activité réelle génère.
          </Text>
        </View>

        <TrendingUp size={20} color="#22C55E" />
      </View>

      <View style={styles.statGrid}>
        <StatCard icon={Star} label="Points" value={points} accent="#FBBF24" />

        <StatCard
          icon={Award}
          label="Badges"
          value={badgeCount}
          accent="#A78BFA"
        />

        <StatCard
          icon={Heart}
          label="Avis reçus"
          value={counters.review_received}
          accent="#F87171"
        />

        <StatCard
          icon={Zap}
          label="Ventes"
          value={counters.sale_completed}
          accent="#FB923C"
        />

        <StatCard
          icon={Users}
          label="Suivis"
          value={counters.followed}
          accent="#34D399"
        />

        <StatCard
          icon={MessageCircle}
          label="Interactions"
          value={counters.publication_liked + counters.comment_liked}
          accent="#818CF8"
        />
      </View>

      <View style={styles.insightCard}>
        <View style={styles.insightIcon}>
          <Flame size={20} color="#FB923C" />
        </View>

        <View style={styles.insightContent}>
          <Text style={styles.insightTitle}>Cette semaine</Text>

          <Text style={styles.insightValue}>+{weekXp.toLocaleString()} XP</Text>

          <Text style={styles.insightDescription}>
            Points générés par les événements enregistrés sur votre compte.
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Comment fonctionne la réputation ?
          </Text>

          <Text style={styles.sectionSubtitle}>
            Votre réputation se construit avec des actions vérifiables.
          </Text>
        </View>
      </View>

      <View style={styles.principlesCard}>
        <Principle
          icon={ShieldCheck}
          title="Authentique"
          text="Les points doivent provenir d'événements enregistrés par le backend."
        />

        <Principle
          icon={TrendingUp}
          title="Progressive"
          text="Votre niveau évolue avec votre contribution cumulée."
        />

        <Principle
          icon={Users}
          title="Communautaire"
          text="Les interactions utiles avec les autres membres participent à votre historique."
        />

        <Principle
          icon={Crown}
          title="Évolutive"
          text="Le système peut intégrer progressivement de nouveaux événements métier."
        />
      </View>
    </View>
  );
}

function Principle({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}): React.ReactElement {
  return (
    <View style={styles.principleRow}>
      <View style={styles.principleIcon}>
        <Icon size={17} color="#A78BFA" />
      </View>

      <View style={styles.principleContent}>
        <Text style={styles.principleTitle}>{title}</Text>

        <Text style={styles.principleText}>{text}</Text>
      </View>
    </View>
  );
}

function HistoryTab({
  events,
}: {
  events: Array<{
    _id: string;
    type: ReputationEventType;
    points: number;
    description: string;
    _creationTime: number;
  }>;
}): React.ReactElement {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={Clock3}
        title="Aucun événement"
        text="Votre historique apparaîtra dès qu'une contribution réelle sera enregistrée."
      />
    );
  }

  return (
    <View style={styles.content}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Historique</Text>

          <Text style={styles.sectionSubtitle}>
            Vos événements de réputation enregistrés.
          </Text>
        </View>

        <Text style={styles.eventCount}>{events.length}</Text>
      </View>

      <View style={styles.historyCard}>
        {events.map((event, index) => {
          const metadata = EVENT_META[event.type];
          const Icon = metadata.icon;

          return (
            <View
              key={event._id}
              style={[
                styles.eventRow,
                index < events.length - 1 && styles.eventRowBorder,
              ]}
            >
              <View
                style={[
                  styles.eventIcon,
                  {
                    backgroundColor: `${metadata.color}18`,
                  },
                ]}
              >
                <Icon size={17} color={metadata.color} />
              </View>

              <View style={styles.eventBody}>
                <Text style={styles.eventType}>{metadata.label}</Text>

                <Text numberOfLines={2} style={styles.eventDescription}>
                  {event.description}
                </Text>

                <Text style={styles.eventTime}>
                  {formatRelativeTime(event._creationTime)}
                </Text>
              </View>

              <View style={styles.eventPoints}>
                <Text style={styles.eventPointsValue}>
                  {event.points >= 0 ? "+" : ""}
                  {event.points}
                </Text>

                <Text style={styles.eventPointsLabel}>XP</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function RankingTab({
  leaderboard,
  currentUserId,
}: {
  leaderboard: Array<{
    userId: string;
    name?: string;
    avatar?: string;
    totalPoints: number;
    badgeCount: number;
    level: string;
  }>;
  currentUserId?: string;
}): React.ReactElement {
  if (leaderboard.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Classement indisponible"
        text="Le classement apparaîtra lorsque des données de réputation seront disponibles."
      />
    );
  }

  return (
    <View style={styles.content}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Classement</Text>

          <Text style={styles.sectionSubtitle}>
            Classement calculé à partir des points enregistrés.
          </Text>
        </View>

        <Trophy size={20} color="#FBBF24" />
      </View>

      <View style={styles.rankingCard}>
        {leaderboard.map((entry, index) => {
          const rank = index + 1;
          const isMe = entry.userId === currentUserId;

          return (
            <View
              key={entry.userId}
              style={[styles.rankingRow, isMe && styles.rankingRowMe]}
            >
              <View style={styles.rankContainer}>
                {rank <= 3 ? (
                  <Text style={styles.medal}>
                    {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                  </Text>
                ) : (
                  <Text style={styles.rankNumber}>#{rank}</Text>
                )}
              </View>

              {entry.avatar ? (
                <Image
                  source={{ uri: entry.avatar }}
                  style={styles.rankAvatar}
                  accessibilityLabel={entry.name ?? "Utilisateur"}
                />
              ) : (
                <View style={styles.rankAvatarFallback}>
                  <Text style={styles.rankAvatarText}>
                    {(entry.name?.trim().charAt(0) ?? "U").toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.rankIdentity}>
                <View style={styles.rankNameRow}>
                  <Text numberOfLines={1} style={styles.rankName}>
                    {entry.name ?? "Utilisateur"}
                  </Text>

                  {isMe ? (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>VOUS</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.rankLevel}>
                  {entry.level} · {entry.badgeCount} badge
                  {entry.badgeCount === 1 ? "" : "s"}
                </Text>
              </View>

              <View style={styles.rankScore}>
                <Text
                  style={[
                    styles.rankScoreValue,
                    rank <= 3 && styles.rankScoreTop,
                  ]}
                >
                  {entry.totalPoints.toLocaleString()}
                </Text>

                <Text style={styles.rankScoreLabel}>XP</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Award;
  title: string;
  text: string;
}): React.ReactElement {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon size={28} color="rgba(255,255,255,0.35)" />
      </View>

      <Text style={styles.emptyTitle}>{title}</Text>

      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function ReputationPageInner({
  onBack,
}: {
  onBack: () => void;
}): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const profile = useQuery(api.reputation.getReputationProfile, {});

  const events = useQuery(api.reputation.getMyReputationEvents, {});

  const leaderboard = useQuery(api.reputation.getLeaderboard, {});

  const normalizedEvents = useMemo(() => {
    if (!events) {
      return [];
    }

    return [...events].sort((a, b) => b._creationTime - a._creationTime);
  }, [events]);

  const normalizedLeaderboard = useMemo(() => {
    if (!leaderboard) {
      return [];
    }

    return [...leaderboard];
  }, [leaderboard]);

  const currentUserId = profile?.userId;

  const rank = useMemo(() => {
    if (!currentUserId) {
      return null;
    }

    const index = normalizedLeaderboard.findIndex(
      (entry) => entry.userId === currentUserId,
    );

    return index >= 0 ? index + 1 : null;
  }, [currentUserId, normalizedLeaderboard]);

  if (profile === undefined) {
    return <ReputationSkeleton />;
  }

  const points = profile.reputationScore ?? 0;

  const badgeCount = profile.badgeCount ?? 0;

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      <Header
        onBack={onBack}
        title="Réputation"
        subtitle="Votre valeur dans l'écosystème"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ReputationHero
          profile={profile}
          eventCount={normalizedEvents.length}
          rank={rank}
        />

        <TabBar activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "overview" ? (
          <OverviewTab
            events={normalizedEvents}
            points={points}
            badgeCount={badgeCount}
          />
        ) : null}

        {activeTab === "history" ? (
          <HistoryTab events={normalizedEvents} />
        ) : null}

        {activeTab === "ranking" ? (
          <RankingTab
            leaderboard={normalizedLeaderboard}
            currentUserId={currentUserId}
          />
        ) : null}

        <View style={styles.trustBanner}>
          <ShieldCheck size={18} color="#22C55E" />

          <View style={styles.trustContent}>
            <Text style={styles.trustTitle}>Réputation vérifiable</Text>

            <Text style={styles.trustText}>
              Les informations affichées ici proviennent des données de
              réputation disponibles dans Convex.
            </Text>
          </View>

          <ChevronRight size={17} color="rgba(255,255,255,0.25)" />
        </View>
      </ScrollView>
    </View>
  );
}

export default function ReputationPage({
  onBack,
}: {
  onBack: () => void;
}): React.ReactElement {
  return (
    <View style={styles.screen}>
      <AuthLoading>
        <ReputationSkeleton />
      </AuthLoading>

      <Unauthenticated>
        <View style={styles.authState}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={onBack}
            style={styles.backButton}
          >
            <ArrowLeft size={19} color="#FFFFFF" />
          </Pressable>

          <View style={styles.authIcon}>
            <Award size={36} color="#FBBF24" />
          </View>

          <Text style={styles.authTitle}>Votre réputation</Text>

          <Text style={styles.authText}>
            Connectez-vous pour accéder à votre historique, vos points et votre
            classement.
          </Text>

          <SignInButton />
        </View>
      </Unauthenticated>

      <Authenticated>
        <ReputationPageInner onBack={onBack} />
      </Authenticated>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  backgroundGlowTop: {
    position: "absolute",
    top: -120,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(99,102,241,0.08)",
  },

  backgroundGlowBottom: {
    position: "absolute",
    bottom: -140,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(139,92,246,0.06)",
  },

  header: {
    minHeight: 72,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(5,8,18,0.96)",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  headerSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "500",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  heroCard: {
    position: "relative",
    overflow: "hidden",
    padding: 18,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  heroGlowOne: {
    position: "absolute",
    top: -80,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(139,92,246,0.12)",
  },

  heroGlowTwo: {
    position: "absolute",
    bottom: -90,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(59,130,246,0.07)",
  },

  identityRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarWrapper: {
    position: "relative",
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 2,
    borderColor: "rgba(139,92,246,0.4)",
  },

  avatarFallback: {
    width: 70,
    height: 70,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.16)",
    borderWidth: 2,
    borderColor: "rgba(139,92,246,0.35)",
  },

  avatarFallbackText: {
    color: "#C4B5FD",
    fontSize: 25,
    fontWeight: "900",
  },

  levelOrb: {
    position: "absolute",
    right: -6,
    bottom: -6,
    width: 29,
    height: 29,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#11162B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  levelOrbText: {
    fontSize: 14,
  },

  identityContent: {
    flex: 1,
    marginLeft: 14,
  },

  userName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  levelBadge: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },

  levelBadgeText: {
    color: "#FBBF24",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  identityDescription: {
    marginTop: 7,
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    lineHeight: 16,
  },

  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  scoreBlock: {
    flex: 1,
    alignItems: "center",
  },

  scoreValue: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  scoreLabel: {
    marginTop: 3,
    color: "rgba(255,255,255,0.3)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  scoreDivider: {
    width: 1,
    height: 27,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  progressSection: {
    marginTop: 18,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  progressEyebrow: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  progressLevel: {
    marginTop: 4,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  progressRemaining: {
    color: "#FBBF24",
    fontSize: 10,
    fontWeight: "800",
  },

  progressTrack: {
    height: 8,
    marginTop: 10,
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#8B5CF6",
  },

  progressFooter: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  progressDescription: {
    flex: 1,
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    lineHeight: 14,
  },

  nextLevelText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    textAlign: "right",
  },

  tabBar: {
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
    padding: 5,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  tabActive: {
    backgroundColor: "rgba(245,158,11,0.13)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },

  tabText: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 9,
    fontWeight: "800",
  },

  tabTextActive: {
    color: "#FBBF24",
  },

  content: {
    marginTop: 18,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.36)",
    fontSize: 10,
    lineHeight: 15,
  },

  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  statCard: {
    width: "31.8%",
    minHeight: 102,
    padding: 12,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  statIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: {
    marginTop: 7,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  statLabel: {
    marginTop: 2,
    color: "rgba(255,255,255,0.32)",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
  },

  insightCard: {
    marginTop: 12,
    padding: 15,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(251,146,60,0.065)",
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.14)",
  },

  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,146,60,0.12)",
  },

  insightContent: {
    flex: 1,
    marginLeft: 12,
  },

  insightTitle: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 9,
    fontWeight: "800",
  },

  insightValue: {
    marginTop: 2,
    color: "#FB923C",
    fontSize: 21,
    fontWeight: "900",
  },

  insightDescription: {
    marginTop: 2,
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    lineHeight: 14,
  },

  principlesCard: {
    padding: 15,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  principleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
  },

  principleIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.1)",
  },

  principleContent: {
    flex: 1,
    marginLeft: 11,
  },

  principleTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  principleText: {
    marginTop: 3,
    color: "rgba(255,255,255,0.38)",
    fontSize: 9,
    lineHeight: 14,
  },

  historyCard: {
    overflow: "hidden",
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  eventRow: {
    minHeight: 90,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  eventRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.055)",
  },

  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  eventBody: {
    flex: 1,
    marginHorizontal: 11,
  },

  eventType: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  eventDescription: {
    marginTop: 3,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    lineHeight: 15,
  },

  eventTime: {
    marginTop: 5,
    color: "rgba(255,255,255,0.25)",
    fontSize: 8,
  },

  eventPoints: {
    minWidth: 45,
    alignItems: "flex-end",
  },

  eventPointsValue: {
    color: "#FBBF24",
    fontSize: 12,
    fontWeight: "900",
  },

  eventPointsLabel: {
    marginTop: 1,
    color: "rgba(255,255,255,0.25)",
    fontSize: 7,
    fontWeight: "900",
  },

  eventCount: {
    minWidth: 27,
    height: 27,
    borderRadius: 9,
    textAlign: "center",
    textAlignVertical: "center",
    color: "#A78BFA",
    backgroundColor: "rgba(139,92,246,0.12)",
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
  },

  rankingCard: {
    overflow: "hidden",
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  rankingRow: {
    minHeight: 76,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.055)",
  },

  rankingRowMe: {
    backgroundColor: "rgba(139,92,246,0.08)",
  },

  rankContainer: {
    width: 35,
    alignItems: "center",
    justifyContent: "center",
  },

  medal: {
    fontSize: 19,
  },

  rankNumber: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    fontWeight: "900",
  },

  rankAvatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  rankAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.13)",
  },

  rankAvatarText: {
    color: "#C4B5FD",
    fontSize: 14,
    fontWeight: "900",
  },

  rankIdentity: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },

  rankNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  rankName: {
    flexShrink: 1,
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  youBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: "rgba(139,92,246,0.16)",
  },

  youBadgeText: {
    color: "#A78BFA",
    fontSize: 6,
    fontWeight: "900",
  },

  rankLevel: {
    marginTop: 4,
    color: "rgba(255,255,255,0.3)",
    fontSize: 8,
  },

  rankScore: {
    alignItems: "flex-end",
  },

  rankScoreValue: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "900",
  },

  rankScoreTop: {
    color: "#FBBF24",
  },

  rankScoreLabel: {
    marginTop: 1,
    color: "rgba(255,255,255,0.25)",
    fontSize: 7,
    fontWeight: "900",
  },

  trustBanner: {
    marginTop: 18,
    padding: 14,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34,197,94,0.055)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.13)",
  },

  trustContent: {
    flex: 1,
    marginHorizontal: 10,
  },

  trustTitle: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  trustText: {
    marginTop: 3,
    color: "rgba(255,255,255,0.35)",
    fontSize: 8,
    lineHeight: 13,
  },

  emptyState: {
    marginTop: 18,
    minHeight: 260,
    padding: 25,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  emptyTitle: {
    marginTop: 15,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyText: {
    maxWidth: 290,
    marginTop: 7,
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },

  authState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },

  authIcon: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },

  authTitle: {
    marginTop: 18,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },

  authText: {
    maxWidth: 310,
    marginTop: 8,
    marginBottom: 20,
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },

  skeletonHeader: {
    height: 72,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  skeletonCircle: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  skeletonLineLarge: {
    width: 170,
    height: 13,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  skeletonHero: {
    marginHorizontal: 16,
    height: 280,
    borderRadius: 28,
    padding: 18,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  skeletonAvatar: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  skeletonTextColumn: {
    flex: 1,
    marginLeft: 14,
  },

  skeletonLineMedium: {
    width: "65%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  skeletonLineSmall: {
    width: "40%",
    height: 10,
    marginTop: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  skeletonLineTiny: {
    width: "80%",
    height: 8,
    marginTop: 10,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  skeletonStats: {
    marginTop: 12,
    marginHorizontal: 16,
    flexDirection: "row",
    gap: 8,
  },

  skeletonStat: {
    flex: 1,
    height: 90,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  skeletonCard: {
    height: 90,
    marginTop: 10,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
});

import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  BarChart2,
  Building2,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  Flame,
  Link2,
  Lock,
  MapPin,
  Play,
  Share2,
  Shield,
  Star,
  TrendingUp,
  UserX,
  Zap,
} from "lucide-react-native";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";

import { usePoints, getLevelProgress } from "@/hooks/use-points.ts";
import { useCurrentUser, getDisplayName } from "@/hooks/use-current-user.ts";
import { useActivity } from "@/hooks/use-activity.ts";
import { usePreferences } from "@/hooks/use-preferences.ts";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

import { SignInButton } from "@/components/ui/signin.tsx";
import UserAvatar from "@/components/ui/user-avatar.tsx";

import type { ProfileTab } from "@/features/profile";
import {
  QRCardModal,
  EditProfileSheet,
  CompletionBar,
  RecentsTab,
  ActivityTimeline,
} from "@/features/profile";

interface ProfilePageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

function formatCompactNumber(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }

  return String(value);
}

function formatMemberSince(value: string | number | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const date = typeof value === "number" ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `Membre depuis ${date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
  })}`;
}

function getInitials(name: string): string {
  const normalized = name.trim();

  if (!normalized) {
    return "?";
  }

  const parts = normalized.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: IconComponent;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor: `${color}16`,
          },
        ]}
      >
        <Icon size={17} color={color} strokeWidth={2} />
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProfilePageInner({ onBack, onNavigate }: ProfilePageProps) {
  const [tab, setTab] = useState<ProfileTab>("apercu");
  const [showQR, setShowQR] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const { total } = usePoints();
  const { level } = getLevelProgress(total);

  const user = useCurrentUser();

  const { user: firebaseUser, isAuthenticated } = useFirebaseAuth();

  const { prefs } = usePreferences();
  const { entries } = useActivity();

  /*
   * Données réelles de suivi.
   * On ne fournit aucun fallback chiffré.
   */
  const followStats = useQuery(
    api.follows.getMyFollowStats,
    firebaseUser?.email
      ? {
          email: firebaseUser.email,
        }
      : "skip",
  );

  /*
   * Streak réel.
   */
  const myStreak = useQuery(
    api.streaks.getMyStreak,
    isAuthenticated ? {} : "skip",
  );

  /*
   * Classement réel.
   */
  const leaderboard = useQuery(
    api.utility.getLeaderboard,
    isAuthenticated ? {} : "skip",
  );

  /*
   * Activité récente réelle.
   */
  const hasRecentActivity = entries.some(
    (entry) => entry.type === "view_module",
  );

  /*
   * L'apparence vient de la configuration utilisateur.
   * Aucun accès DOM/document.
   */
  const accentHex = "#8B5CF6";

  const displayName = getDisplayName(user);

  const safeDisplayName =
    displayName?.trim() || user?.email?.split("@")[0] || "Utilisateur";

  const slug = useMemo(
    () =>
      safeDisplayName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9À-ÿ]+/gi, "-")
        .replace(/^-+|-+$/g, ""),
    [safeDisplayName],
  );

  /*
   * IMPORTANT :
   * aucune bio fictive.
   */
  const bio =
    typeof user?.bio === "string" && user.bio.trim().length > 0
      ? user.bio.trim()
      : null;

  /*
   * Utilise uniquement les données réellement disponibles.
   *
   * Le type utilisateur peut évoluer selon le schema Convex.
   * On ne force donc pas de champs qui ne sont pas garantis.
   */
  const userRecord = user as
    | (typeof user & {
        image?: string | null;
        avatar?: string | null;
        coverImage?: string | null;
        coverUrl?: string | null;
        city?: string | null;
        country?: string | null;
        createdAt?: string | number | null;
        _creationTime?: number;
      })
    | null
    | undefined;

  const avatarUri = userRecord?.image || userRecord?.avatar || undefined;

  const coverUri = userRecord?.coverImage || userRecord?.coverUrl || undefined;

  const locationLabel = [userRecord?.city, userRecord?.country]
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    )
    .join(", ");

  const memberSince = formatMemberSince(
    userRecord?.createdAt ?? userRecord?._creationTime,
  );

  const favoriteModules = Array.isArray(prefs.favoriteModules)
    ? prefs.favoriteModules.filter(
        (module): module is string =>
          typeof module === "string" && module.trim().length > 0,
      )
    : [];

  const enabledProfileData = [
    Boolean(user?.name),
    Boolean(user?.bio),
    Boolean(locationLabel),
    Boolean(user?.email),
  ].filter(Boolean).length;

  const completionPercent = Math.round((enabledProfileData / 4) * 100);

  const shareProfile = async () => {
    /*
     * Le vrai partage peut être branché à ShareProfile/Expo Share.
     * On ne fabrique pas une URL publique si le backend ne l'a pas fournie.
     */
    Alert.alert(
      "Partager mon profil",
      "Le partage public du profil doit utiliser l'identifiant ou l'URL officielle générée par le backend.",
    );
  };

  const openAddLink = () => {
    Alert.alert(
      "Liens du profil",
      "La gestion des liens externes doit être connectée au modèle de profil avant d'être activée.",
    );
  };

  const tabs: Array<[ProfileTab, string]> = [
    ["apercu", "Aperçu"],
    ["activite", "Activité"],
    ["recents", "Récents"],
    ["classement", "Classement"],
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================================
            COVER / HEADER
        ========================================================== */}

        <View style={styles.coverContainer}>
          {coverUri ? (
            <Image
              source={{ uri: coverUri }}
              style={styles.coverImage}
              resizeMode="cover"
              accessibilityLabel="Image de couverture du profil"
            />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Shield
                size={42}
                color="rgba(255,255,255,0.16)"
                strokeWidth={1.5}
              />
            </View>
          )}

          <View style={styles.coverOverlay} />

          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft size={19} color="#ffffff" />
          </Pressable>

          <Pressable
            onPress={() => setShowEdit(true)}
            accessibilityRole="button"
            accessibilityLabel="Modifier le profil"
            style={({ pressed }) => [
              styles.headerButton,
              styles.headerButtonRight,
              pressed && styles.pressed,
            ]}
          >
            <Edit3 size={17} color="#ffffff" />
          </Pressable>
        </View>

        {/* =========================================================
            IDENTITY
        ========================================================== */}

        <View style={styles.profileContainer}>
          <View style={styles.identityRow}>
            <View style={styles.avatarWrapper}>
              <UserAvatar user={user} size="w-20 h-20" className="border-4" />

              {hasRecentActivity && (
                <View
                  style={[
                    styles.activityDot,
                    {
                      borderColor: "#050812",
                    },
                  ]}
                />
              )}

              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{level}</Text>
              </View>
            </View>

            <View style={styles.profileActions}>
              <Pressable
                onPress={() => setShowQR(true)}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  {
                    borderColor: `${accentHex}40`,
                    backgroundColor: `${accentHex}18`,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Share2 size={14} color={accentHex} />
                <Text style={[styles.actionText, { color: accentHex }]}>
                  Carte
                </Text>
              </Pressable>

              <Pressable
                onPress={shareProfile}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && styles.pressed,
                ]}
              >
                <Share2 size={14} color="#cbd5e1" />
                <Text style={styles.actionText}>Partager</Text>
              </Pressable>
            </View>
          </View>

          {/* Name */}
          <View style={styles.nameRow}>
            <Text style={styles.name}>{safeDisplayName}</Text>

            {user?.email ? (
              <View style={styles.accountIndicator}>
                <Shield size={12} color="#60a5fa" strokeWidth={2} />
              </View>
            ) : null}
          </View>

          {/* Bio */}
          {bio ? (
            <Text style={styles.bio}>{bio}</Text>
          ) : (
            <Pressable
              onPress={() => setShowEdit(true)}
              style={({ pressed }) => [
                styles.completePrompt,
                pressed && styles.pressed,
              ]}
            >
              <Edit3 size={13} color={accentHex} />
              <Text style={[styles.completePromptText, { color: accentHex }]}>
                Ajouter une bio
              </Text>
            </Pressable>
          )}

          {/* Metadata */}
          <View style={styles.metadataRow}>
            {locationLabel ? (
              <View style={styles.metadataItem}>
                <MapPin size={12} color="#64748b" />
                <Text style={styles.metadataText}>{locationLabel}</Text>
              </View>
            ) : null}

            {memberSince ? (
              <View style={styles.metadataItem}>
                <Clock size={12} color="#64748b" />
                <Text style={styles.metadataText}>{memberSince}</Text>
              </View>
            ) : null}

            {user?.email ? (
              <View style={styles.metadataItem}>
                <Lock size={12} color="#64748b" />
                <Text style={styles.metadataText}>Compte protégé</Text>
              </View>
            ) : null}
          </View>

          {/* =======================================================
              REAL FOLLOW STATS
          ======================================================== */}

          <View style={styles.followStats}>
            <View style={styles.followStat}>
              <Text style={styles.followValue}>
                {formatCompactNumber(followStats?.followerCount)}
              </Text>
              <Text style={styles.followLabel}>Abonnés</Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.followStat}>
              <Text style={styles.followValue}>
                {followStats
                  ? formatCompactNumber(followStats.followingCount)
                  : "—"}
              </Text>
              <Text style={styles.followLabel}>Abonnements</Text>
            </View>

            {myStreak && myStreak.currentStreak > 0 ? (
              <>
                <View style={styles.separator} />

                <View style={styles.streakBadge}>
                  <Flame size={15} color="#fb923c" />
                  <Text style={styles.streakText}>
                    {myStreak.currentStreak} j
                  </Text>
                </View>
              </>
            ) : null}
          </View>

          {/* =======================================================
              NAVIGATION
          ======================================================== */}

          <View style={styles.tabs}>
            {tabs.map(([tabId, label]) => {
              const selected = tab === tabId;

              return (
                <Pressable
                  key={tabId}
                  onPress={() => setTab(tabId)}
                  accessibilityRole="tab"
                  accessibilityState={{
                    selected,
                  }}
                  style={({ pressed }) => [
                    styles.tab,
                    selected && {
                      backgroundColor: `${accentHex}25`,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selected && {
                        color: "#ffffff",
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* =========================================================
            CONTENT
        ========================================================== */}

        <View style={styles.content}>
          {tab === "apercu" && (
            <View>
              {/* Completion */}
              <View style={styles.sectionSpacing}>
                <CompletionBar
                  accentHex={accentHex}
                  hasName={Boolean(user?.name)}
                  hasBio={Boolean(user?.bio)}
                />
              </View>

              {/* Real profile stats */}
              <View style={styles.statsGrid}>
                <StatCard
                  icon={Star}
                  label="Abonnés"
                  value={formatCompactNumber(followStats?.followerCount)}
                  color="#8B5CF6"
                />

                <StatCard
                  icon={TrendingUp}
                  label="Abonnements"
                  value={formatCompactNumber(followStats?.followingCount)}
                  color="#10B981"
                />

                <StatCard
                  icon={Zap}
                  label="XP"
                  value={formatCompactNumber(total)}
                  color="#F59E0B"
                />

                <StatCard
                  icon={BarChart2}
                  label="Profil"
                  value={`${completionPercent}%`}
                  color="#3B82F6"
                />
              </View>

              {/* ===================================================
                  FAVORITE MODULES
              ==================================================== */}

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Modules préférés</Text>
                    <Text style={styles.cardSubtitle}>
                      Tes préférences enregistrées
                    </Text>
                  </View>
                </View>

                {favoriteModules.length > 0 ? (
                  <View style={styles.modulesWrap}>
                    {favoriteModules.slice(0, 12).map((module) => (
                      <View
                        key={module}
                        style={[
                          styles.moduleChip,
                          {
                            backgroundColor: `${accentHex}14`,
                            borderColor: `${accentHex}28`,
                          },
                        ]}
                      >
                        <Text style={styles.moduleEmoji}>📱</Text>

                        <Text
                          style={[
                            styles.moduleText,
                            {
                              color: "#dbeafe",
                            },
                          ]}
                        >
                          {module.charAt(0).toUpperCase() + module.slice(1)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Eye size={18} color="#64748b" />
                    <Text style={styles.emptyText}>
                      Aucun module favori enregistré.
                    </Text>
                  </View>
                )}
              </View>

              {/* ===================================================
                  XP / LEVEL
              ==================================================== */}

              <View style={styles.card}>
                <View style={styles.xpHeader}>
                  <View style={styles.xpIcon}>
                    <Zap size={20} color="#f59e0b" />
                  </View>

                  <View style={styles.xpBody}>
                    <Text style={styles.cardTitle}>Progression</Text>

                    <Text style={styles.xpValue}>
                      {formatCompactNumber(total)} XP
                    </Text>

                    <Text style={styles.xpLevel}>Niveau {level}</Text>
                  </View>
                </View>

                <View style={styles.xpActions}>
                  <Pressable
                    onPress={() => onNavigate("recompenses")}
                    style={styles.linkButton}
                  >
                    <Text style={styles.linkText}>Récompenses</Text>
                    <ChevronRight size={14} color={accentHex} />
                  </Pressable>

                  <Pressable
                    onPress={() => onNavigate("badges")}
                    style={styles.linkButton}
                  >
                    <Text
                      style={[
                        styles.linkText,
                        {
                          color: "#818cf8",
                        },
                      ]}
                    >
                      Badges
                    </Text>
                    <ChevronRight size={14} color="#818cf8" />
                  </Pressable>

                  <Pressable
                    onPress={() => onNavigate("analytics")}
                    style={styles.linkButton}
                  >
                    <Text
                      style={[
                        styles.linkText,
                        {
                          color: "#34d399",
                        },
                      ]}
                    >
                      Analytics
                    </Text>
                    <ChevronRight size={14} color="#34d399" />
                  </Pressable>
                </View>
              </View>

              {/* ===================================================
                  PRIVACY / SECURITY
              ==================================================== */}

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderIcon}>
                    <Shield size={18} color="#60a5fa" />
                  </View>

                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitle}>Sécurité du compte</Text>

                    <Text style={styles.cardSubtitle}>
                      Paramètres de confidentialité et de sécurité
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => onNavigate("privacy")}
                  style={({ pressed }) => [
                    styles.rowAction,
                    pressed && styles.pressed,
                  ]}
                >
                  <View>
                    <Text style={styles.rowTitle}>Confidentialité</Text>
                    <Text style={styles.rowDescription}>
                      Gérer la visibilité et les données du compte.
                    </Text>
                  </View>

                  <ChevronRight size={17} color="#64748b" />
                </Pressable>

                <Pressable
                  onPress={() => onNavigate("documents")}
                  style={({ pressed }) => [
                    styles.rowAction,
                    pressed && styles.pressed,
                  ]}
                >
                  <View>
                    <Text style={styles.rowTitle}>Coffre documentaire</Text>
                    <Text style={styles.rowDescription}>
                      Accéder à tes documents enregistrés.
                    </Text>
                  </View>

                  <ChevronRight size={17} color="#64748b" />
                </Pressable>
              </View>

              {/* ===================================================
                  PROFILE TOOLS
              ==================================================== */}

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Outils du profil</Text>
                </View>

                <Pressable
                  onPress={() => onNavigate("dashboard")}
                  style={({ pressed }) => [
                    styles.toolRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <BarChart2 size={18} color="#8B5CF6" />

                  <Text style={styles.toolText}>Tableau de bord</Text>

                  <ChevronRight size={17} color="#64748b" />
                </Pressable>

                <Pressable
                  onPress={() => onNavigate("export")}
                  style={({ pressed }) => [
                    styles.toolRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <Share2 size={18} color="#f59e0b" />

                  <Text style={styles.toolText}>Exporter mes données</Text>

                  <ChevronRight size={17} color="#64748b" />
                </Pressable>

                <Pressable
                  onPress={() => onNavigate("reels")}
                  style={({ pressed }) => [
                    styles.toolRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <Play size={18} color="#ec4899" />

                  <Text style={styles.toolText}>Mes Reels</Text>

                  <ChevronRight size={17} color="#64748b" />
                </Pressable>

                <Pressable
                  onPress={() => onNavigate("creator-dashboard")}
                  style={({ pressed }) => [
                    styles.toolRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <Zap size={18} color="#f59e0b" />

                  <Text style={styles.toolText}>Espace créateur</Text>

                  <ChevronRight size={17} color="#64748b" />
                </Pressable>
              </View>

              {/* ===================================================
                  LINKS
              ==================================================== */}

              <View style={styles.card}>
                <View style={styles.linksHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Liens publics</Text>

                    <Text style={styles.cardSubtitle}>
                      Réseaux et liens associés au profil
                    </Text>
                  </View>

                  <Pressable
                    onPress={openAddLink}
                    accessibilityRole="button"
                    accessibilityLabel="Ajouter un lien"
                    style={({ pressed }) => [
                      styles.addButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.addButtonText,
                        {
                          color: accentHex,
                        },
                      ]}
                    >
                      Ajouter
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.emptyState}>
                  <Link2 size={19} color="#64748b" />

                  <Text style={styles.emptyText}>
                    Aucun lien public enregistré.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* =======================================================
              ACTIVITY
          ======================================================== */}

          {tab === "activite" && (
            <View>
              <View style={styles.activitySummary}>
                <View style={styles.activityIcon}>
                  <Zap size={24} color="#f59e0b" />
                </View>

                <View style={styles.activityBody}>
                  <Text style={styles.activityXp}>
                    {formatCompactNumber(total)} XP
                  </Text>

                  <Text style={styles.activityLevel}>Niveau {level}</Text>

                  {myStreak && myStreak.currentStreak > 0 ? (
                    <View style={styles.streakLine}>
                      <Flame size={14} color="#fb923c" />

                      <Text style={styles.streakLineText}>
                        Streak actuel : {myStreak.currentStreak} jours
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <ActivityTimeline accentHex={accentHex} />
            </View>
          )}

          {/* =======================================================
              RECENTS
          ======================================================== */}

          {tab === "recents" && (
            <RecentsTab onNavigate={onNavigate} accentHex={accentHex} />
          )}

          {/* =======================================================
              LEADERBOARD
          ======================================================== */}

          {tab === "classement" && (
            <View>
              <Text style={styles.sectionEyebrow}>CLASSEMENT XP</Text>

              {!leaderboard ? (
                <View style={styles.loadingCard}>
                  <Text style={styles.loadingText}>
                    Chargement du classement…
                  </Text>
                </View>
              ) : leaderboard.length === 0 ? (
                <View style={styles.emptyCard}>
                  <BarChart2 size={22} color="#64748b" />

                  <Text style={styles.emptyTitle}>Classement indisponible</Text>

                  <Text style={styles.emptyText}>
                    Aucun classement à afficher pour le moment.
                  </Text>
                </View>
              ) : (
                <View style={styles.leaderboard}>
                  {leaderboard.map((entry, index) => {
                    const isMe = entry.name === safeDisplayName;

                    const rank =
                      index === 0
                        ? "🥇"
                        : index === 1
                          ? "🥈"
                          : index === 2
                            ? "🥉"
                            : `#${entry.rank}`;

                    return (
                      <View
                        key={entry.userId}
                        style={[
                          styles.leaderboardRow,
                          isMe && {
                            borderColor: `${accentHex}45`,
                            backgroundColor: `${accentHex}12`,
                          },
                        ]}
                      >
                        <Text style={styles.rank}>{rank}</Text>

                        <View
                          style={[
                            styles.initialAvatar,
                            {
                              backgroundColor: `${accentHex}20`,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.initialAvatarText,
                              {
                                color: accentHex,
                              },
                            ]}
                          >
                            {getInitials(entry.name)}
                          </Text>
                        </View>

                        <View style={styles.leaderInfo}>
                          <Text numberOfLines={1} style={styles.leaderName}>
                            {entry.name}
                            {isMe ? (
                              <Text
                                style={[
                                  styles.meLabel,
                                  {
                                    color: accentHex,
                                  },
                                ]}
                              >
                                {"  "}VOUS
                              </Text>
                            ) : null}
                          </Text>

                          <Text style={styles.leaderLevel}>
                            Niveau {entry.level}
                          </Text>
                        </View>

                        <View style={styles.leaderXp}>
                          <Zap size={12} color="#f59e0b" />

                          <Text style={styles.leaderXpText}>
                            {formatCompactNumber(entry.totalXp)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {myStreak && myStreak.currentStreak > 0 ? (
                <View style={styles.personalStreak}>
                  <Flame size={22} color="#fb923c" />

                  <View style={styles.personalStreakBody}>
                    <Text style={styles.personalStreakTitle}>Ton streak</Text>

                    <Text style={styles.personalStreakText}>
                      {myStreak.currentStreak} jours
                    </Text>

                    <Text style={styles.personalStreakRecord}>
                      Record personnel : {myStreak.longestStreak} jours
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ===========================================================
          MODALS / FEATURE COMPONENTS
      ============================================================ */}

      {showQR ? (
        <QRCardModal
          onClose={() => setShowQR(false)}
          accentHex={accentHex}
          displayName={safeDisplayName}
          slug={slug}
        />
      ) : null}

      {showEdit ? (
        <EditProfileSheet
          onClose={() => setShowEdit(false)}
          accentHex={accentHex}
        />
      ) : null}
    </View>
  );
}

export default function ProfilePage(props: ProfilePageProps) {
  const { isAuthenticated } = useFirebaseAuth();

  if (!isAuthenticated) {
    return (
      <View style={styles.authScreen}>
        <Pressable
          onPress={props.onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={({ pressed }) => [
            styles.authBackButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={19} color="#ffffff" />
        </Pressable>

        <UserAvatar user={null} size="w-20 h-20" />

        <View style={styles.authTextBlock}>
          <Text style={styles.authTitle}>Mon profil</Text>

          <Text style={styles.authDescription}>
            Connectez-vous pour consulter et gérer votre profil, vos préférences
            et votre activité.
          </Text>
        </View>

        <SignInButton />
      </View>
    );
  }

  return <ProfilePageInner {...props} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  coverContainer: {
    height: 190,
    position: "relative",
    overflow: "hidden",
  },

  coverImage: {
    width: "100%",
    height: "100%",
  },

  coverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0c1022",
  },

  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,4,12,0.55)",
  },

  headerButton: {
    position: "absolute",
    top: 18,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  headerButtonRight: {
    left: undefined,
    right: 16,
  },

  profileContainer: {
    paddingHorizontal: 18,
    marginTop: -38,
  },

  identityRow: {
    minHeight: 100,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  avatarWrapper: {
    width: 88,
    height: 88,
    position: "relative",
  },

  activityDot: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22c55e",
    borderWidth: 3,
  },

  levelBadge: {
    position: "absolute",
    left: -4,
    top: -3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: "rgba(2,6,23,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
  },

  levelBadgeText: {
    color: "#e2e8f0",
    fontSize: 9,
    fontWeight: "800",
  },

  profileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingBottom: 3,
  },

  secondaryAction: {
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  actionText: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 11,
  },

  name: {
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  accountIndicator: {
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.12)",
  },

  bio: {
    color: "#a7b1c2",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
  },

  completePrompt: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 7,
    paddingVertical: 4,
  },

  completePromptText: {
    fontSize: 12,
    fontWeight: "700",
  },

  metadataRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginTop: 11,
  },

  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metadataText: {
    color: "#64748b",
    fontSize: 11,
  },

  followStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 17,
    gap: 16,
  },

  followStat: {
    alignItems: "flex-start",
  },

  followValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },

  followLabel: {
    color: "#64748b",
    fontSize: 10,
    marginTop: 2,
  },

  separator: {
    width: 1,
    height: 25,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
    backgroundColor: "rgba(249,115,22,0.10)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.20)",
  },

  streakText: {
    color: "#fb923c",
    fontSize: 11,
    fontWeight: "900",
  },

  tabs: {
    flexDirection: "row",
    marginTop: 18,
    padding: 4,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  tab: {
    flex: 1,
    minHeight: 39,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },

  tabText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "800",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },

  sectionSpacing: {
    marginBottom: 12,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  statCard: {
    width: "48.8%",
    minHeight: 105,
    padding: 13,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  statValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },

  statLabel: {
    color: "#64748b",
    fontSize: 10,
    marginTop: 2,
  },

  card: {
    marginBottom: 12,
    borderRadius: 18,
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  cardHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.10)",
    marginRight: 10,
  },

  cardHeaderText: {
    flex: 1,
  },

  cardTitle: {
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: "800",
  },

  cardSubtitle: {
    color: "#64748b",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
  },

  modulesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  moduleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
    borderWidth: 1,
  },

  moduleEmoji: {
    fontSize: 11,
  },

  moduleText: {
    fontSize: 11,
    fontWeight: "700",
  },

  emptyState: {
    minHeight: 65,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  emptyText: {
    color: "#64748b",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  xpHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  xpIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,158,11,0.10)",
    marginRight: 12,
  },

  xpBody: {
    flex: 1,
  },

  xpValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },

  xpLevel: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 2,
  },

  xpActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 13,
    marginTop: 15,
  },

  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  linkText: {
    color: "#a78bfa",
    fontSize: 11,
    fontWeight: "800",
  },

  rowAction: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.055)",
  },

  rowTitle: {
    color: "#dbe4f0",
    fontSize: 12,
    fontWeight: "750",
  },

  rowDescription: {
    color: "#64748b",
    fontSize: 10,
    marginTop: 3,
  },

  toolRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.055)",
  },

  toolText: {
    flex: 1,
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
  },

  linksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  addButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(139,92,246,0.10)",
  },

  addButtonText: {
    fontSize: 10,
    fontWeight: "800",
  },

  activitySummary: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: "rgba(139,92,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.18)",
  },

  activityIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,158,11,0.10)",
    marginRight: 13,
  },

  activityBody: {
    flex: 1,
  },

  activityXp: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "900",
  },

  activityLevel: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 2,
  },

  streakLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
  },

  streakLineText: {
    color: "#fb923c",
    fontSize: 10,
    fontWeight: "700",
  },

  sectionEyebrow: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  loadingCard: {
    minHeight: 100,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  loadingText: {
    color: "#64748b",
    fontSize: 12,
  },

  emptyCard: {
    minHeight: 150,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  emptyTitle: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 9,
  },

  leaderboard: {
    gap: 8,
  },

  leaderboardRow: {
    minHeight: 64,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  rank: {
    width: 36,
    color: "#e2e8f0",
    fontSize: 17,
    textAlign: "center",
  },

  initialAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 9,
  },

  initialAvatarText: {
    fontSize: 11,
    fontWeight: "900",
  },

  leaderInfo: {
    flex: 1,
    minWidth: 0,
  },

  leaderName: {
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "800",
  },

  meLabel: {
    fontSize: 8,
    fontWeight: "900",
  },

  leaderLevel: {
    color: "#64748b",
    fontSize: 9,
    marginTop: 3,
  },

  leaderXp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 8,
  },

  leaderXpText: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "900",
  },

  personalStreak: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: "rgba(249,115,22,0.09)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.18)",
  },

  personalStreakBody: {
    marginLeft: 11,
  },

  personalStreakTitle: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },

  personalStreakText: {
    color: "#fb923c",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },

  personalStreakRecord: {
    color: "#64748b",
    fontSize: 9,
    marginTop: 2,
  },

  authScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#050812",
  },

  authBackButton: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  authTextBlock: {
    alignItems: "center",
    marginTop: 18,
    marginBottom: 22,
  },

  authTitle: {
    color: "#ffffff",
    fontSize: 25,
    fontWeight: "900",
  },

  authDescription: {
    maxWidth: 340,
    color: "#64748b",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },

  pressed: {
    opacity: 0.7,
  },
});

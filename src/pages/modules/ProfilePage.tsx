import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  BarChart2,
  Camera,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  Flame,
  Instagram,
  Link2,
  Linkedin,
  Lock,
  MapPin,
  Play,
  Send,
  Shield,
  Star,
  TrendingUp,
  Twitter,
  Youtube,
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
  SocialLinksSheet,
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

type SocialLink = {
  key: string;
  label: string;
  url: string;
  icon: IconComponent;
};

type SocialLinksSource = {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  whatsapp?: string;
  telegram?: string;
};

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

function formatMemberSince(
  value: string | number | undefined | null,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const date = new Date(value);

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

  return `${parts[0][0] ?? ""}${
    parts[parts.length - 1][0] ?? ""
  }`.toUpperCase();
}

function normalizeSocialLinks(
  socialLinks: SocialLinksSource | undefined,
): SocialLink[] {
  if (!socialLinks) {
    return [];
  }

  const candidates: Array<{
    key: string;
    label: string;
    url: string | undefined;
    icon: IconComponent;
  }> = [
    {
      key: "instagram",
      label: "Instagram",
      url: socialLinks.instagram,
      icon: Instagram,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      url: socialLinks.linkedin,
      icon: Linkedin,
    },
    {
      key: "twitter",
      label: "X / Twitter",
      url: socialLinks.twitter,
      icon: Twitter,
    },
    {
      key: "youtube",
      label: "YouTube",
      url: socialLinks.youtube,
      icon: Youtube,
    },
    {
      key: "facebook",
      label: "Facebook",
      url: socialLinks.facebook,
      icon: Send,
    },
    {
      key: "tiktok",
      label: "TikTok",
      url: socialLinks.tiktok,
      icon: Play,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      url: socialLinks.whatsapp,
      icon: Send,
    },
    {
      key: "telegram",
      label: "Telegram",
      url: socialLinks.telegram,
      icon: Send,
    },
  ];

  return candidates
    .filter(
      (
        item,
      ): item is {
        key: string;
        label: string;
        url: string;
        icon: IconComponent;
      } => typeof item.url === "string" && item.url.trim().length > 0,
    )
    .map((item) => ({
      key: item.key,
      label: item.label,
      url: item.url.trim(),
      icon: item.icon,
    }));
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
  const [showSocialLinks, setShowSocialLinks] = useState(false);

  const accentHex = "#8B5CF6";

  const { total } = usePoints();
  const { level } = getLevelProgress(total);

  const user = useCurrentUser();
  const { isAuthenticated } = useFirebaseAuth();
  const { prefs } = usePreferences();
  const { entries } = useActivity();

  /*
   * Contract backend réel :
   * getMyFollowStats ne reçoit plus d'email côté client.
   * L'utilisateur courant est résolu côté Convex depuis l'identité.
   */
  const followStats = useQuery(
    api.follows.getMyFollowStats,
    isAuthenticated ? {} : "skip",
  );

  /*
   * Profil public réel.
   * Aucun profil n'est reconstruit artificiellement côté frontend.
   */
  const publicProfile = useQuery(
    api.network.getPublicProfile,
    isAuthenticated && user?._id
      ? {
          userId: user._id,
        }
      : "skip",
  );

  const myStreak = useQuery(
    api.streaks.getMyStreak,
    isAuthenticated ? {} : "skip",
  );

  const leaderboard = useQuery(
    api.utility.getLeaderboard,
    isAuthenticated ? {} : "skip",
  );

  const displayName = getDisplayName(user);

  const safeDisplayName =
    displayName?.trim() ||
    user?.name?.trim() ||
    user?.email?.split("@")[0]?.trim() ||
    "Utilisateur";

  /*
   * Le slug doit rester canonique.
   * Aucun slug n'est généré localement.
   */
  const slug = publicProfile?.slug?.trim() || user?.slug?.trim() || "";

  const bio =
    typeof publicProfile?.bio === "string" &&
    publicProfile.bio.trim().length > 0
      ? publicProfile.bio.trim()
      : typeof user?.bio === "string" && user.bio.trim().length > 0
        ? user.bio.trim()
        : null;

  const avatarUri =
    typeof user?.avatar === "string" && user.avatar.trim().length > 0
      ? user.avatar.trim()
      : undefined;

  const coverUri =
    typeof publicProfile?.coverUrl === "string" &&
    publicProfile.coverUrl.trim().length > 0
      ? publicProfile.coverUrl.trim()
      : undefined;

  const publicLocation = publicProfile?.publicLocation;

  const locationLabel = [
    publicLocation?.city,
    publicLocation?.province,
    publicLocation?.country,
  ]
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    )
    .map((value) => value.trim())
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(", ");

  /*
   * _creationTime vient de l'utilisateur réel.
   * On ne dépend pas d'un champ que le DTO public n'est pas
   * obligé d'exposer.
   */
  const memberSince = formatMemberSince(user?._creationTime);

  const favoriteModules = Array.isArray(prefs.favoriteModules)
    ? prefs.favoriteModules.filter(
        (module): module is string =>
          typeof module === "string" && module.trim().length > 0,
      )
    : [];

  const socialLinks = useMemo(
    () => normalizeSocialLinks(publicProfile?.socialLinks),
    [publicProfile?.socialLinks],
  );

  /*
   * Progression réellement dérivée des informations
   * disponibles ici.
   *
   * Aucun "verified", "photo", "skills" ou autre état
   * n'est inventé.
   */
  const completionFields = [
    Boolean(user?.name?.trim()),
    Boolean(bio),
    Boolean(locationLabel),
    Boolean(socialLinks.length > 0),
  ];

  const completionPercent = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100,
  );

  const followerCount =
    publicProfile?.followerCount ?? followStats?.followerCount;

  const followingCount =
    publicProfile?.followingCount ?? followStats?.followingCount;

  const shareProfile = async () => {
    const profileReference = slug ? `@${slug}` : safeDisplayName;

    try {
      await Share.share({
        title: `Profil de ${safeDisplayName}`,
        message: `Découvrez le profil de ${safeDisplayName} sur DébrouillePro : ${profileReference}`,
      });
    } catch (error) {
      if (error instanceof Error && error.message.trim().length > 0) {
        Alert.alert("Partage indisponible", error.message);
        return;
      }

      Alert.alert("Partage indisponible", "Le partage n'a pas pu être ouvert.");
    }
  };

  const openSocialLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert("Lien indisponible", "Ce lien ne peut pas être ouvert.");
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error("Profile.openSocialLink:", error);

      Alert.alert("Lien indisponible", "Impossible d'ouvrir ce lien.");
    }
  };

  const openAddLink = () => {
    setShowSocialLinks(true);
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
        keyboardShouldPersistTaps="handled"
      >
        {/* ───────────────── COVER ───────────────── */}

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

              <Text style={styles.coverEmptyText}>Ajoutez une couverture</Text>
            </View>
          )}

          <View style={styles.coverOverlay} />

          <Pressable
            onPress={() => setShowEdit(true)}
            accessibilityRole="button"
            accessibilityLabel="Modifier la photo de couverture"
            hitSlop={8}
            style={({ pressed }) => [
              styles.coverEditButton,
              pressed && styles.pressed,
            ]}
          >
            <Camera size={15} color="#ffffff" strokeWidth={2.2} />
            <Text style={styles.coverEditButtonText}>Modifier</Text>
          </Pressable>

          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={8}
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
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerButton,
              styles.headerButtonRight,
              pressed && styles.pressed,
            ]}
          >
            <Edit3 size={17} color="#ffffff" />
          </Pressable>
        </View>

        {/* ───────────────── IDENTITY ───────────────── */}

        <View style={styles.profileContainer}>
          <View style={styles.identityRow}>
            <View style={styles.avatarWrapper}>
              <Pressable
                onPress={() => setShowEdit(true)}
                accessibilityRole="button"
                accessibilityLabel="Modifier la photo de profil"
                hitSlop={8}
                style={({ pressed }) => [
                  styles.avatarPressable,
                  pressed && styles.pressed,
                ]}
              >
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                    accessibilityLabel={`Photo de profil de ${safeDisplayName}`}
                  />
                ) : (
                  <UserAvatar
                    user={user}
                    size="w-20 h-20"
                    className="border-4"
                  />
                )}
              </Pressable>

              <Pressable
                onPress={() => setShowEdit(true)}
                accessibilityRole="button"
                accessibilityLabel="Modifier la photo de profil"
                hitSlop={6}
                style={({ pressed }) => [
                  styles.avatarEditButton,
                  pressed && styles.pressed,
                ]}
              >
                <Camera size={13} color="#ffffff" strokeWidth={2.3} />
              </Pressable>

              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{level}</Text>
              </View>
            </View>

            <View style={styles.profileActions}>
              <Pressable
                onPress={() => setShowQR(true)}
                accessibilityRole="button"
                accessibilityLabel="Afficher ma carte QR"
                style={({ pressed }) => [
                  styles.secondaryAction,
                  {
                    borderColor: `${accentHex}40`,
                    backgroundColor: `${accentHex}18`,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Link2 size={14} color={accentHex} />

                <Text
                  style={[
                    styles.actionText,
                    {
                      color: accentHex,
                    },
                  ]}
                >
                  Carte
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void shareProfile();
                }}
                accessibilityRole="button"
                accessibilityLabel="Partager mon profil"
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && styles.pressed,
                ]}
              >
                <Send size={14} color="#cbd5e1" />

                <Text style={styles.actionText}>Partager</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name} accessibilityRole="header">
              {safeDisplayName}
            </Text>

            {isAuthenticated ? (
              <View
                style={styles.accountIndicator}
                accessibilityLabel="Compte authentifié"
              >
                <Shield size={12} color="#60a5fa" strokeWidth={2} />
              </View>
            ) : null}
          </View>

          {bio ? (
            <Text style={styles.bio}>{bio}</Text>
          ) : (
            <Pressable
              onPress={() => setShowEdit(true)}
              accessibilityRole="button"
              accessibilityLabel="Ajouter une bio"
              style={({ pressed }) => [
                styles.completePrompt,
                pressed && styles.pressed,
              ]}
            >
              <Edit3 size={13} color={accentHex} />

              <Text
                style={[
                  styles.completePromptText,
                  {
                    color: accentHex,
                  },
                ]}
              >
                Ajouter une bio
              </Text>
            </Pressable>
          )}

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

            {isAuthenticated ? (
              <View style={styles.metadataItem}>
                <Lock size={12} color="#64748b" />

                <Text style={styles.metadataText}>Compte protégé</Text>
              </View>
            ) : null}
          </View>

          {/* ───────────────── FOLLOW STATS ───────────────── */}

          <View style={styles.followStats}>
            <View style={styles.followStat}>
              <Text style={styles.followValue}>
                {formatCompactNumber(followerCount)}
              </Text>

              <Text style={styles.followLabel}>Abonnés</Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.followStat}>
              <Text style={styles.followValue}>
                {formatCompactNumber(followingCount)}
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

          {/* ───────────────── TABS ───────────────── */}

          <View
            style={styles.tabs}
            accessibilityRole="tablist"
            accessibilityLabel="Navigation du profil"
          >
            {tabs.map(([tabId, label]) => {
              const selected = tab === tabId;

              return (
                <Pressable
                  key={tabId}
                  onPress={() => setTab(tabId)}
                  accessibilityRole="tab"
                  accessibilityLabel={label}
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

        {/* ───────────────── CONTENT ───────────────── */}

        <View style={styles.content}>
          {/* ═════════════════ APERÇU ═════════════════ */}

          {tab === "apercu" ? (
            <View>
              <View style={styles.sectionSpacing}>
                <CompletionBar
                  accentHex={accentHex}
                  hasName={Boolean(user?.name?.trim())}
                  hasBio={Boolean(bio)}
                />
              </View>

              {/* ───────── STATS ───────── */}

              <View style={styles.statsGrid}>
                <StatCard
                  icon={Star}
                  label="Abonnés"
                  value={formatCompactNumber(followerCount)}
                  color="#8B5CF6"
                />

                <StatCard
                  icon={TrendingUp}
                  label="Abonnements"
                  value={formatCompactNumber(followingCount)}
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

              {/* ───────── MODULES ───────── */}

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
                        <Text style={styles.moduleEmoji}>◈</Text>

                        <Text style={styles.moduleText}>
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

              {/* ───────── XP ───────── */}

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
                    accessibilityRole="button"
                    style={styles.linkButton}
                  >
                    <Text style={styles.linkText}>Récompenses</Text>

                    <ChevronRight size={14} color={accentHex} />
                  </Pressable>

                  <Pressable
                    onPress={() => onNavigate("badges")}
                    accessibilityRole="button"
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
                    accessibilityRole="button"
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

              {/* ───────── SECURITY ───────── */}

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
                  accessibilityRole="button"
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
                  accessibilityRole="button"
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

              {/* ───────── TOOLS ───────── */}

              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Outils du profil</Text>
                </View>

                <Pressable
                  onPress={() => onNavigate("dashboard")}
                  accessibilityRole="button"
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
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.toolRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <Send size={18} color="#f59e0b" />

                  <Text style={styles.toolText}>Exporter mes données</Text>

                  <ChevronRight size={17} color="#64748b" />
                </Pressable>

                {/*
                 * Mes Reels — route distincte du flux public de Reels.
                 *
                 *   Home   → "reels"       → api.shortVideos.list
                 *   Profil → "reels-mine"  → api.shortVideos.listMine
                 *
                 * Cette séparation permet au créateur de voir ses Reels
                 * dans tous leurs états de modération (pending, approved,
                 * rejected) sans exposer ces contenus au feed public.
                 */}
                <Pressable
                  onPress={() => onNavigate("reels-mine")}
                  accessibilityRole="button"
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
                  accessibilityRole="button"
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

              {/* ───────── SOCIAL LINKS ───────── */}

              <View style={styles.card}>
                <View style={styles.linksHeader}>
                  <View style={styles.linksTitleBlock}>
                    <Text style={styles.cardTitle}>Liens publics</Text>

                    <Text style={styles.cardSubtitle}>
                      Tes réseaux et liens associés au profil
                    </Text>
                  </View>

                  <Pressable
                    onPress={openAddLink}
                    accessibilityRole="button"
                    accessibilityLabel="Gérer les liens publics"
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
                      {socialLinks.length > 0 ? "Gérer" : "Ajouter"}
                    </Text>
                  </Pressable>
                </View>

                {socialLinks.length > 0 ? (
                  <View style={styles.socialLinks}>
                    {socialLinks.map(({ key, label, url, icon: Icon }) => (
                      <Pressable
                        key={key}
                        onPress={() => {
                          void openSocialLink(url);
                        }}
                        accessibilityRole="link"
                        accessibilityLabel={`Ouvrir ${label}`}
                        style={({ pressed }) => [
                          styles.socialLinkRow,
                          pressed && styles.pressed,
                        ]}
                      >
                        <View style={styles.socialLinkIcon}>
                          <Icon size={16} color="#cbd5e1" />
                        </View>

                        <View style={styles.socialLinkBody}>
                          <Text style={styles.socialLinkLabel}>{label}</Text>

                          <Text numberOfLines={1} style={styles.socialLinkUrl}>
                            {url}
                          </Text>
                        </View>

                        <ChevronRight size={16} color="#64748b" />
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Link2 size={19} color="#64748b" />

                    <Text style={styles.emptyText}>
                      Aucun lien public enregistré.
                    </Text>

                    <Text style={styles.emptyHint}>
                      Ajoute tes réseaux depuis la modification du profil.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : null}

          {/* ═════════════════ ACTIVITÉ ═════════════════ */}

          {tab === "activite" ? (
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
          ) : null}

          {/* ═════════════════ RÉCENTS ═════════════════ */}

          {tab === "recents" ? (
            <RecentsTab onNavigate={onNavigate} accentHex={accentHex} />
          ) : null}

          {/* ═════════════════ CLASSEMENT ═════════════════ */}

          {tab === "classement" ? (
            <View>
              <Text style={styles.sectionEyebrow}>CLASSEMENT XP</Text>

              {leaderboard === undefined ? (
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
                    const isMe =
                      user?._id !== undefined && entry.userId === user._id;

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
                                {"  "}
                                VOUS
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
          ) : null}
        </View>
      </ScrollView>

      {/* ───────────────── MODALS / SHEETS ───────────────── */}

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

      {showSocialLinks ? (
        <SocialLinksSheet
          visible
          onClose={() => setShowSocialLinks(false)}
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
          hitSlop={8}
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

  /* ───────────────── COVER ───────────────── */

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

  coverEmptyText: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 8,
  },

  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,4,12,0.55)",
  },

  coverEditButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "rgba(2,6,23,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  coverEditButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
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

  /* ───────────────── PROFILE ───────────────── */

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

  avatarPressable: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },

  avatarEditButton: {
    position: "absolute",
    right: 3,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7c3aed",
    borderWidth: 2,
    borderColor: "#050812",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },

  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#050812",
    backgroundColor: "#0c1022",
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

  /* ───────────────── TABS ───────────────── */

  tabs: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 18,
    padding: 4,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    paddingHorizontal: 4,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  tabText: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },

  /* ───────────────── CONTENT ───────────────── */

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

  /* ───────────────── MODULES ───────────────── */

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
    color: "#a78bfa",
    fontSize: 11,
  },

  moduleText: {
    color: "#dbeafe",
    fontSize: 11,
    fontWeight: "700",
  },

  emptyState: {
    minHeight: 82,
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

  emptyHint: {
    color: "#475569",
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
  },

  /* ───────────────── XP ───────────────── */

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

  /* ───────────────── SECURITY ───────────────── */

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
    fontWeight: "700",
  },

  rowDescription: {
    color: "#64748b",
    fontSize: 10,
    marginTop: 3,
  },

  /* ───────────────── TOOLS ───────────────── */

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

  /* ───────────────── LINKS ───────────────── */

  linksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  linksTitleBlock: {
    flex: 1,
    paddingRight: 10,
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

  socialLinks: {
    gap: 7,
  },

  socialLinkRow: {
    minHeight: 58,
    paddingHorizontal: 9,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.045)",
  },

  socialLinkIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.10)",
    marginRight: 10,
  },

  socialLinkBody: {
    flex: 1,
    minWidth: 0,
  },

  socialLinkLabel: {
    color: "#dbe4f0",
    fontSize: 11,
    fontWeight: "800",
  },

  socialLinkUrl: {
    color: "#64748b",
    fontSize: 9,
    marginTop: 3,
  },

  /* ───────────────── ACTIVITY ───────────────── */

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

  /* ───────────────── LEADERBOARD ───────────────── */

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

  /* ───────────────── AUTH ───────────────── */

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

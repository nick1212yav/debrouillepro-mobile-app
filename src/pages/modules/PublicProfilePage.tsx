import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  FileText,
  Globe2,
  Grid3X3,
  Lock,
  MapPin,
  Share2,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react-native";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";

import { SignInButton } from "@/components/ui/signin.tsx";

import type { Id } from "@/convex/_generated/dataModel";
import type { PublicationType } from "@/hooks/use-publications.ts";

import {
  Avatar,
  FollowButton,
  MiniPubCard,
  FollowersList,
} from "@/features/profile";

interface PublicProfilePageProps {
  userId: Id<"users">;
  onBack: () => void;
}

type PublicProfile = {
  _id?: Id<"users">;
  name?: string | null;
  avatar?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  interests?: string[];
  roles?: string[];
  followerCount?: number;
  followingCount?: number;
  publicationCount?: number;
  isFollowedByMe?: boolean;
  coverImage?: string | null;
  coverUrl?: string | null;
};

function formatCompact(value: number | undefined): string {
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

function StatChip({
  value,
  label,
  onPress,
}: {
  value: number | undefined;
  label: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.statChip}>
      <Text style={styles.statValue}>{formatCompact(value)}</Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${formatCompact(value)}`}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

function RoleBadge({ role }: { role?: string }) {
  if (!role) {
    return null;
  }

  const normalized = role.toLowerCase();

  if (normalized === "entreprise") {
    return (
      <View style={[styles.roleBadge, styles.companyRole]}>
        <Text style={styles.companyRoleText}>Entreprise</Text>
      </View>
    );
  }

  if (normalized === "professionnel" || normalized === "professional") {
    return (
      <View style={[styles.roleBadge, styles.professionalRole]}>
        <Text style={styles.professionalRoleText}>Professionnel</Text>
      </View>
    );
  }

  if (normalized === "particulier" || normalized === "individual") {
    return (
      <View style={[styles.roleBadge, styles.individualRole]}>
        <Text style={styles.individualRoleText}>Particulier</Text>
      </View>
    );
  }

  return (
    <View style={styles.roleBadge}>
      <Text style={styles.genericRoleText}>{role}</Text>
    </View>
  );
}

function PublicProfileInner({ userId, onBack }: PublicProfilePageProps) {
  const [listType, setListType] = useState<"followers" | "following" | null>(
    null,
  );

  const profileQuery = useQuery(api.follows.getPublicProfile, {
    userId,
  });

  const publications = useQuery(api.follows.getPublicPublications, {
    userId,
  });

  const profile = profileQuery as PublicProfile | null | undefined;

  const isLoading = profileQuery === undefined;

  const role = profile?.roles?.[0];

  const displayName = profile?.name?.trim() || "Utilisateur";

  const bio = profile?.bio?.trim() || null;

  const location = [profile?.city, profile?.country]
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    )
    .join(", ");

  const interests = useMemo(
    () =>
      Array.isArray(profile?.interests)
        ? profile.interests.filter(
            (item): item is string =>
              typeof item === "string" && item.trim().length > 0,
          )
        : [],
    [profile?.interests],
  );

  const coverUri = profile?.coverImage || profile?.coverUrl || null;

  const handleShare = async () => {
    if (!profile) {
      return;
    }

    try {
      /*
       * On ne fabrique pas d'URL publique.
       * Le partage utilise uniquement les informations
       * réellement disponibles.
       */
      await Share.share({
        title: displayName,
        message: `Découvrez le profil de ${displayName} sur DébrouillePro.`,
      });
    } catch (error) {
      console.error("PublicProfile.share:", error);
    }
  };

  if (!isLoading && !profile) {
    return (
      <View style={styles.errorScreen}>
        <ShieldCheck size={42} color="#64748b" />

        <Text style={styles.errorTitle}>Profil indisponible</Text>

        <Text style={styles.errorText}>
          Ce profil n'est pas disponible ou n'est pas accessible publiquement.
        </Text>

        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={17} color="#ffffff" />

          <Text style={styles.primaryButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =====================================================
            COVER
        ====================================================== */}

        <View style={styles.cover}>
          {coverUri ? (
            <Image
              source={{
                uri: coverUri,
              }}
              style={styles.coverImage}
              resizeMode="cover"
              accessibilityLabel="Couverture du profil"
            />
          ) : (
            <View style={styles.coverFallback}>
              <Globe2
                size={52}
                color="rgba(255,255,255,0.12)"
                strokeWidth={1.2}
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
              styles.leftHeaderButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft size={19} color="#ffffff" />
          </Pressable>

          <Pressable
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Partager le profil"
            style={({ pressed }) => [
              styles.headerButton,
              styles.rightHeaderButton,
              pressed && styles.pressed,
            ]}
          >
            <Share2 size={17} color="#ffffff" />
          </Pressable>
        </View>

        {/* =====================================================
            PROFILE IDENTITY
        ====================================================== */}

        <View style={styles.profile}>
          <View style={styles.topIdentityRow}>
            <View style={styles.avatarContainer}>
              {isLoading ? (
                <View style={styles.avatarSkeleton}>
                  <ActivityIndicator size="small" color="#94a3b8" />
                </View>
              ) : (
                <Avatar
                  name={profile?.name}
                  avatar={profile?.avatar}
                  size={76}
                />
              )}
            </View>

            <View style={styles.followArea}>
              <Authenticated>
                {!isLoading && profile ? (
                  <FollowButton
                    userId={userId}
                    isFollowing={Boolean(profile.isFollowedByMe)}
                  />
                ) : null}
              </Authenticated>

              <Unauthenticated>
                <SignInButton />
              </Unauthenticated>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingIdentity}>
              <View style={styles.loadingLineLarge} />
              <View style={styles.loadingLineSmall} />
            </View>
          ) : (
            <>
              {/* NAME */}
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={2}>
                  {displayName}
                </Text>

                {role === "professionnel" || role === "entreprise" ? (
                  <BadgeCheck size={19} color="#60a5fa" strokeWidth={2} />
                ) : null}

                <RoleBadge role={role} />
              </View>

              {/* BIO */}
              {bio ? <Text style={styles.bio}>{bio}</Text> : null}

              {/* LOCATION */}
              <View style={styles.metaRow}>
                {location ? (
                  <View style={styles.metaItem}>
                    <MapPin size={13} color="#64748b" />

                    <Text style={styles.metaText} numberOfLines={1}>
                      {location}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.metaItem}>
                  <Globe2 size={13} color="#64748b" />

                  <Text style={styles.metaText}>Profil public</Text>
                </View>
              </View>

              {/* =================================================
                  STATS
              ================================================== */}

              <View style={styles.statsRow}>
                <StatChip
                  value={profile?.followerCount}
                  label="Abonnés"
                  onPress={() => setListType("followers")}
                />

                <View style={styles.statSeparator} />

                <StatChip
                  value={profile?.followingCount}
                  label="Abonnements"
                  onPress={() => setListType("following")}
                />

                <View style={styles.statSeparator} />

                <StatChip
                  value={profile?.publicationCount}
                  label="Publications"
                />
              </View>

              {/* =================================================
                  INTERESTS
              ================================================== */}

              {interests.length > 0 ? (
                <View style={styles.interestsSection}>
                  <View style={styles.sectionHeading}>
                    <Sparkles size={14} color="#818cf8" />

                    <Text style={styles.sectionHeadingText}>
                      Centres d'intérêt
                    </Text>
                  </View>

                  <View style={styles.interestsWrap}>
                    {interests.map((interest) => (
                      <View key={interest} style={styles.interestChip}>
                        <Text style={styles.interestText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </>
          )}

          {/* =====================================================
              PUBLICATIONS HEADER
          ====================================================== */}

          <View style={styles.publicationsHeader}>
            <View style={styles.publicationsTitleRow}>
              <Grid3X3 size={16} color="#94a3b8" />

              <Text style={styles.publicationsTitle}>Publications</Text>

              {publications ? (
                <Text style={styles.publicationsCount}>
                  {publications.length}
                </Text>
              ) : null}
            </View>

            <View style={styles.publicLabel}>
              <Lock size={10} color="#64748b" />

              <Text style={styles.publicLabelText}>Public</Text>
            </View>
          </View>

          {/* =====================================================
              PUBLICATIONS
          ====================================================== */}

          {publications === undefined ? (
            <View style={styles.publicationLoading}>
              {[0, 1, 2].map((index) => (
                <View key={index} style={styles.publicationSkeleton}>
                  <ActivityIndicator size="small" color="#64748b" />
                </View>
              ))}
            </View>
          ) : publications.length === 0 ? (
            <View style={styles.emptyPublications}>
              <View style={styles.emptyPublicationIcon}>
                <FileText size={25} color="#475569" />
              </View>

              <Text style={styles.emptyPublicationTitle}>
                Aucune publication
              </Text>

              <Text style={styles.emptyPublicationText}>
                Ce profil n'a encore aucune publication publique.
              </Text>
            </View>
          ) : (
            <View style={styles.publicationList}>
              {publications.map((pub) => (
                <View key={pub._id} style={styles.publicationItem}>
                  <MiniPubCard
                    pub={
                      pub as typeof pub & {
                        type: PublicationType;
                      }
                    }
                  />
                </View>
              ))}
            </View>
          )}

          {/* =====================================================
              PUBLIC PROFILE PRINCIPLES
          ====================================================== */}

          <View style={styles.transparencyCard}>
            <View style={styles.transparencyIcon}>
              <ShieldCheck size={19} color="#60a5fa" />
            </View>

            <View style={styles.transparencyBody}>
              <Text style={styles.transparencyTitle}>
                Profil public contrôlé
              </Text>

              <Text style={styles.transparencyText}>
                Seules les informations rendues publiques par le compte et les
                fonctionnalités autorisées sont affichées ici.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* =======================================================
          FOLLOWERS / FOLLOWING
      ======================================================== */}

      {listType ? (
        <FollowersList
          userId={userId}
          type={listType}
          onClose={() => setListType(null)}
        />
      ) : null}
    </View>
  );
}

export default function PublicProfilePage({
  userId,
  onBack,
}: PublicProfilePageProps) {
  return <PublicProfileInner userId={userId} onBack={onBack} />;
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

  cover: {
    height: 205,
    position: "relative",
    overflow: "hidden",
  },

  coverImage: {
    width: "100%",
    height: "100%",
  },

  coverFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0c1022",
  },

  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,6,23,0.54)",
  },

  headerButton: {
    position: "absolute",
    top: 18,
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  leftHeaderButton: {
    left: 16,
  },

  rightHeaderButton: {
    right: 16,
  },

  profile: {
    paddingHorizontal: 18,
    marginTop: -42,
  },

  topIdentityRow: {
    minHeight: 95,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  avatarContainer: {
    width: 86,
    height: 86,
  },

  avatarSkeleton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 4,
    borderColor: "#050812",
  },

  followArea: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 4,
  },

  loadingIdentity: {
    marginTop: 13,
    marginBottom: 15,
    gap: 8,
  },

  loadingLineLarge: {
    width: 180,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  loadingLineSmall: {
    width: 250,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
  },

  name: {
    color: "#ffffff",
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    borderWidth: 1,
  },

  companyRole: {
    backgroundColor: "rgba(249,115,22,0.10)",
    borderColor: "rgba(249,115,22,0.20)",
  },

  professionalRole: {
    backgroundColor: "rgba(99,102,241,0.10)",
    borderColor: "rgba(99,102,241,0.20)",
  },

  individualRole: {
    backgroundColor: "rgba(16,185,129,0.10)",
    borderColor: "rgba(16,185,129,0.20)",
  },

  companyRoleText: {
    color: "#fb923c",
    fontSize: 9,
    fontWeight: "800",
  },

  professionalRoleText: {
    color: "#818cf8",
    fontSize: 9,
    fontWeight: "800",
  },

  individualRoleText: {
    color: "#34d399",
    fontSize: 9,
    fontWeight: "800",
  },

  genericRoleText: {
    color: "#94a3b8",
    fontSize: 9,
    fontWeight: "800",
  },

  bio: {
    color: "#a7b1c2",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: "100%",
  },

  metaText: {
    color: "#64748b",
    fontSize: 11,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 16,
  },

  statChip: {
    minWidth: 72,
    alignItems: "center",
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

  statSeparator: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 6,
  },

  interestsSection: {
    marginBottom: 18,
  },

  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 9,
  },

  sectionHeadingText: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  interestsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  interestChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 11,
    backgroundColor: "rgba(99,102,241,0.10)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.20)",
  },

  interestText: {
    color: "#a5b4fc",
    fontSize: 10,
    fontWeight: "700",
  },

  publicationsHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },

  publicationsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  publicationsTitle: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  publicationsCount: {
    color: "#64748b",
    fontSize: 10,
  },

  publicLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  publicLabelText: {
    color: "#64748b",
    fontSize: 9,
    fontWeight: "700",
  },

  publicationLoading: {
    gap: 9,
    paddingTop: 12,
  },

  publicationSkeleton: {
    minHeight: 120,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  publicationList: {
    gap: 10,
    paddingTop: 12,
  },

  publicationItem: {
    width: "100%",
  },

  emptyPublications: {
    minHeight: 190,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  emptyPublicationIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    marginBottom: 11,
  },

  emptyPublicationTitle: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "800",
  },

  emptyPublicationText: {
    color: "#64748b",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 5,
  },

  transparencyCard: {
    flexDirection: "row",
    padding: 14,
    marginTop: 14,
    borderRadius: 17,
    backgroundColor: "rgba(59,130,246,0.07)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.13)",
  },

  transparencyIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.10)",
    marginRight: 10,
  },

  transparencyBody: {
    flex: 1,
  },

  transparencyTitle: {
    color: "#dbeafe",
    fontSize: 12,
    fontWeight: "800",
  },

  transparencyText: {
    color: "#718096",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  primaryButton: {
    minHeight: 44,
    marginTop: 18,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#2563eb",
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },

  errorScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#050812",
  },

  errorTitle: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 15,
  },

  errorText: {
    maxWidth: 330,
    color: "#64748b",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 7,
  },

  pressed: {
    opacity: 0.68,
  },
});

// src/pages/home/_components/HomeContextualHero.tsx

import React, { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowRight,
  BellRing,
  ChevronRight,
  Eye,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react-native";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface HomeContextualHeroProps {
  onNavigate: (page: string) => void;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatCompactNumber(value: number): string {
  if (value < 1000) {
    return value.toString();
  }

  if (value < 1_000_000) {
    const thousands = value / 1000;
    return `${thousands >= 10 ? Math.round(thousands) : thousands.toFixed(1)}k`;
  }

  if (value < 1_000_000_000) {
    const millions = value / 1_000_000;
    return `${millions >= 10 ? Math.round(millions) : millions.toFixed(1)}M`;
  }

  const billions = value / 1_000_000_000;

  return `${billions >= 10 ? Math.round(billions) : billions.toFixed(1)}Md`;
}

/* -------------------------------------------------------------------------- */
/* Section header                                                             */
/* -------------------------------------------------------------------------- */

const SectionHeader = memo(function SectionHeader() {
  return (
    <View accessibilityRole="header" style={styles.sectionHeader}>
      <View accessible={false} style={styles.sectionIcon}>
        <Zap size={14} color="#C4B5FD" fill="#C4B5FD" strokeWidth={1.6} />
      </View>

      <View style={styles.sectionHeaderContent}>
        <Text style={styles.sectionEyebrow}>POUR TOI, MAINTENANT</Text>

        <Text style={styles.sectionHeading}>Ton point de départ</Text>
      </View>
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

function HomeContextualHeroComponent({ onNavigate }: HomeContextualHeroProps) {
  const { user } = useFirebaseAuth();

  const email = user?.email ?? "";

  const unreadMessages = useQuery(
    api.messages.conversations.getUnreadCount,
    {},
  );

  const creatorStats = useQuery(
    api.publications.getMyCreatorStats,
    email.length > 0 ? { email } : "skip",
  );

  const state = useMemo(() => {
    const messagesReady = unreadMessages !== undefined;
    const creatorReady = email.length === 0 || creatorStats !== undefined;

    if (!messagesReady || !creatorReady) {
      return {
        kind: "loading" as const,
        unreadMessages: 0,
        totalViews: 0,
      };
    }

    if (unreadMessages > 0) {
      return {
        kind: "messages" as const,
        unreadMessages,
        totalViews: 0,
      };
    }

    if (creatorStats?.isActiveCreator) {
      return {
        kind: "creator" as const,
        unreadMessages: 0,
        totalViews: creatorStats.totalViews,
      };
    }

    return {
      kind: "empty" as const,
      unreadMessages: 0,
      totalViews: 0,
    };
  }, [creatorStats, email, unreadMessages]);

  /* ------------------------------------------------------------------------ */
  /* Empty                                                                    */
  /* ------------------------------------------------------------------------ */

  if (state.kind === "empty") {
    return null;
  }

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (state.kind === "loading") {
    return (
      <View
        accessibilityLabel="Chargement de votre espace personnel"
        style={styles.loadingCard}
      >
        <View style={styles.loadingIcon}>
          <Sparkles size={20} color="#94A3B8" />
        </View>

        <View style={styles.loadingContent}>
          <View style={styles.loadingTitle} />
          <View style={styles.loadingSubtitle} />
        </View>
      </View>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Messages                                                                 */
  /* ------------------------------------------------------------------------ */

  if (state.kind === "messages") {
    return (
      <View style={styles.section}>
        <SectionHeader />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${state.unreadMessages} message${
            state.unreadMessages > 1 ? "s" : ""
          } non lu${state.unreadMessages > 1 ? "s" : ""}`}
          accessibilityHint="Ouvre votre messagerie"
          onPress={() => onNavigate("messages")}
          style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        >
          <LinearGradient
            colors={["#172554", "#111827", "#0B1020"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.glow} />

            <View style={styles.iconShell}>
              <MessageCircle size={22} color="#BFDBFE" strokeWidth={2.2} />

              <View style={styles.notificationDot}>
                <BellRing size={10} color="#FFFFFF" strokeWidth={2.4} />
              </View>
            </View>

            <View style={styles.content}>
              <View style={styles.eyebrowRow}>
                <Text style={styles.eyebrow}>À NE PAS MANQUER</Text>

                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />

                  <Text style={styles.liveText}>Nouveau</Text>
                </View>
              </View>

              <Text style={styles.title}>
                Vous avez {state.unreadMessages} message
                {state.unreadMessages > 1 ? "s" : ""} en attente
              </Text>

              <Text style={styles.description}>
                Reprenez la conversation là où vous l'avez laissée.
              </Text>
            </View>

            <View style={styles.action}>
              <ArrowRight size={20} color="#E0E7FF" strokeWidth={2.2} />
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Creator                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <View style={styles.section}>
      <SectionHeader />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voir les performances de vos publications"
        accessibilityHint="Ouvre votre tableau de bord créateur"
        onPress={() => onNavigate("creator-dashboard")}
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={["#1E1B4B", "#111827", "#0B1020"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.glowCreator} />

          <View style={styles.iconShellCreator}>
            <TrendingUp size={22} color="#DDD6FE" strokeWidth={2.2} />
          </View>

          <View style={styles.content}>
            <View style={styles.eyebrowRow}>
              <Text style={styles.eyebrow}>VOTRE IMPACT</Text>

              <View style={styles.creatorBadge}>
                <Sparkles size={10} color="#EDE9FE" strokeWidth={2.3} />

                <Text style={styles.creatorBadgeText}>Créateur</Text>
              </View>
            </View>

            <Text style={styles.title}>
              Vos publications continuent de circuler
            </Text>

            <View style={styles.metricRow}>
              <Eye size={15} color="#A5B4FC" strokeWidth={2} />

              <Text style={styles.metricValue}>
                {formatCompactNumber(state.totalViews)}
              </Text>

              <Text style={styles.metricLabel}>vues cumulées</Text>
            </View>
          </View>

          <View style={styles.action}>
            <ChevronRight size={20} color="#EDE9FE" strokeWidth={2.2} />
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export const HomeContextualHero = memo(HomeContextualHeroComponent);

HomeContextualHero.displayName = "HomeContextualHero";

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  /* ------------------------------------------------------------------------ */
  /* Section                                                                  */
  /* ------------------------------------------------------------------------ */

  section: {
    marginHorizontal: 16,
    marginTop: 10,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.13)",
  },

  sectionHeaderContent: {
    flex: 1,
    minWidth: 0,
  },

  sectionEyebrow: {
    color: "#94A3B8",
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "800",
    letterSpacing: 1.05,
  },

  sectionHeading: {
    marginTop: 1,
    color: "#F8FAFC",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
    letterSpacing: -0.25,
  },

  /* ------------------------------------------------------------------------ */
  /* Main card                                                                */
  /* ------------------------------------------------------------------------ */

  container: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#0B1020",
  },

  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.992 }],
  },

  gradient: {
    minHeight: 112,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    position: "relative",
    overflow: "hidden",
  },

  glow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -55,
    top: -65,
    backgroundColor: "rgba(59,130,246,0.12)",
  },

  glowCreator: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    right: -70,
    top: -80,
    backgroundColor: "rgba(139,92,246,0.13)",
  },

  /* ------------------------------------------------------------------------ */
  /* Icons                                                                    */
  /* ------------------------------------------------------------------------ */

  iconShell: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    backgroundColor: "rgba(59,130,246,0.15)",
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.14)",
    position: "relative",
  },

  iconShellCreator: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    backgroundColor: "rgba(139,92,246,0.15)",
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.14)",
  },

  notificationDot: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    borderWidth: 2,
    borderColor: "#111827",
  },

  /* ------------------------------------------------------------------------ */
  /* Content                                                                  */
  /* ------------------------------------------------------------------------ */

  content: {
    flex: 1,
    minWidth: 0,
  },

  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 5,
  },

  eyebrow: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.05,
  },

  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(37,99,235,0.13)",
  },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#60A5FA",
  },

  liveText: {
    color: "#BFDBFE",
    fontSize: 9,
    fontWeight: "700",
  },

  creatorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(139,92,246,0.14)",
  },

  creatorBadgeText: {
    color: "#DDD6FE",
    fontSize: 9,
    fontWeight: "700",
  },

  title: {
    color: "#F8FAFC",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  description: {
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  /* ------------------------------------------------------------------------ */
  /* Creator metrics                                                          */
  /* ------------------------------------------------------------------------ */

  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    gap: 5,
  },

  metricValue: {
    color: "#E0E7FF",
    fontSize: 13,
    fontWeight: "800",
  },

  metricLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "500",
  },

  /* ------------------------------------------------------------------------ */
  /* Action                                                                   */
  /* ------------------------------------------------------------------------ */

  action: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  loadingCard: {
    marginHorizontal: 16,
    marginTop: 10,
    minHeight: 88,
    borderRadius: 24,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  loadingIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  loadingContent: {
    flex: 1,
    gap: 9,
  },

  loadingTitle: {
    width: "62%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  loadingSubtitle: {
    width: "82%",
    height: 9,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
});

export default HomeContextualHero;

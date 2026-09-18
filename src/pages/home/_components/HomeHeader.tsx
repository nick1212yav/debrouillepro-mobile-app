// src/pages/home/_components/HomeHeader.tsx

import React, { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "convex/react";
import { Bell, MapPin, User } from "lucide-react-native";

import { api } from "@/convex/_generated/api.js";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

export interface HomeHeaderProps {
  onNavigate: (page: string) => void;
}

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return "Bonjour";
  }

  if (hour >= 12 && hour < 18) {
    return "Bon après-midi";
  }

  if (hour >= 18 && hour < 23) {
    return "Bonsoir";
  }

  return "Bonne nuit";
}

function getFirstName(
  name: string | undefined,
  email: string | undefined,
): string | undefined {
  const normalizedName = name?.trim();

  if (normalizedName) {
    const firstName = normalizedName.split(/\s+/)[0]?.trim();

    if (firstName) {
      return firstName;
    }
  }

  const normalizedEmail = email?.trim();

  if (normalizedEmail) {
    const localPart = normalizedEmail.split("@")[0]?.trim();

    if (localPart) {
      return localPart;
    }
  }

  return undefined;
}

function HomeHeaderComponent({ onNavigate }: HomeHeaderProps) {
  const { user } = useFirebaseAuth();

  const currentUser = useQuery(api.users.getCurrentUser, {});

  const unreadNotifications = useQuery(api.notifications.unreadCount, {});

  const greeting = useMemo(() => getGreeting(new Date().getHours()), []);

  /*
   * Convex = source de vérité pour le profil applicatif.
   * Firebase = fallback uniquement pour l'email.
   *
   * Le backend peut retourner null.
   * On normalise donc null → undefined.
   */
  const name = currentUser?.name ?? undefined;
  const email = currentUser?.email ?? user?.email ?? undefined;
  const city = currentUser?.city?.trim() || undefined;

  const firstName = getFirstName(name, email);

  const handleProfilePress = useCallback(() => {
    onNavigate("profile");
  }, [onNavigate]);

  const handleNotificationsPress = useCallback(() => {
    onNavigate("notifications");
  }, [onNavigate]);

  const notificationCount =
    typeof unreadNotifications === "number" && unreadNotifications > 0
      ? unreadNotifications
      : 0;

  const notificationAccessibilityLabel =
    notificationCount > 0
      ? `${notificationCount} notification${
          notificationCount === 1 ? "" : "s"
        } non lue${notificationCount === 1 ? "" : "s"}`
      : "Ouvrir les notifications";

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          firstName ? `Ouvrir le profil de ${firstName}` : "Ouvrir votre profil"
        }
        accessibilityHint="Affiche votre profil"
        onPress={handleProfilePress}
        style={({ pressed }) =>
          pressed ? styles.identityPressed : styles.identityButton
        }
      >
        <View style={styles.identityContent}>
          <Text numberOfLines={1} style={styles.identityTitle}>
            {greeting}
            {firstName ? ` ${firstName}` : ""}
          </Text>

          {city ? (
            <View style={styles.cityRow}>
              <MapPin size={11} color="#8B5CF6" strokeWidth={2.2} />

              <Text numberOfLines={1} style={styles.cityText}>
                {city}
              </Text>
            </View>
          ) : null}

          <Text numberOfLines={1} style={styles.tagline}>
            Qu&apos;est-ce qu&apos;on règle aujourd&apos;hui ?
          </Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={notificationAccessibilityLabel}
          accessibilityHint="Ouvre vos notifications"
          onPress={handleNotificationsPress}
          style={({ pressed }) =>
            pressed ? styles.actionPressed : styles.actionButton
          }
        >
          <Bell size={20} color="#CBD5E1" strokeWidth={1.9} />

          {notificationCount > 0 ? (
            <View accessible={false} style={styles.badge}>
              <Text style={styles.badgeText}>
                {notificationCount > 9 ? "9+" : String(notificationCount)}
              </Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            firstName
              ? `Ouvrir le profil de ${firstName}`
              : "Ouvrir votre profil"
          }
          accessibilityHint="Affiche votre profil"
          onPress={handleProfilePress}
          style={({ pressed }) =>
            pressed ? styles.actionPressed : styles.actionButton
          }
        >
          <User size={20} color="#CBD5E1" strokeWidth={1.9} />
        </Pressable>
      </View>
    </View>
  );
}

export const HomeHeader = memo(HomeHeaderComponent);

HomeHeader.displayName = "HomeHeader";

const styles = StyleSheet.create({
  container: {
    minHeight: 68,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  identityButton: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },

  identityPressed: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
    opacity: 0.72,
  },

  identityContent: {
    minWidth: 0,
  },

  identityTitle: {
    color: "#F8FAFC",
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "800",
    letterSpacing: -0.35,
  },

  cityRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  cityText: {
    flexShrink: 1,
    color: "#8B5CF6",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    letterSpacing: 0.1,
  },

  tagline: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
    fontStyle: "italic",
    letterSpacing: 0.05,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  actionPressed: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },

  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
    borderWidth: 2,
    borderColor: "#050812",
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
});

export default HomeHeader;

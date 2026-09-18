// src/pages/home/_components/SideDrawer.tsx

import {
  View,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
  Text,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useRef, useState } from "react";

import { useCurrentUser, getDisplayName } from "@/hooks/use-current-user.ts";

import {
  DrawerHeader,
  DrawerSection,
  DrawerFooter,
} from "@/navigation/components";

import { useNavigation } from "@/navigation/hooks";

/* ============================================================================
 * PROPS
 * ========================================================================== */

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;

  /**
   * Ouvre le panneau de personnalisation de la Home.
   *
   * Le drawer ne possède pas directement le HomePersonalizationSheet :
   * le parent conserve le contrôle de l'overlay afin d'éviter que le sheet
   * soit démonté lorsque le drawer se ferme.
   */
  onOpenHomePersonalization?: () => void;
}

/* ============================================================================
 * COMPONENT
 * ========================================================================== */

export default function SideDrawer({
  isOpen,
  onClose,
  onNavigate,
  onOpenHomePersonalization,
}: SideDrawerProps) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const drawerWidth = Math.min(SCREEN_WIDTH * 0.78, 380);

  const user = useCurrentUser();

  const displayName = getDisplayName(user);
  const email = user?.email ?? "";

  const { navSections, badges } = useNavigation();

  /* ───── animations ───── */

  const [mounted, setMounted] = useState(isOpen);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const contentStagger = useRef(new Animated.Value(0)).current;

  /* ───── mount / unmount lifecycle ───── */

  useEffect(() => {
    if (isOpen) {
      setMounted(true);

      slideAnim.setValue(0);
      backdropAnim.setValue(0);
      contentStagger.setValue(0);

      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.spring(slideAnim, {
          toValue: 1,
          damping: 30,
          stiffness: 300,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(contentStagger, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
      });
    }

    // Les refs Animated sont stables pendant la durée de vie du composant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* ───── web escape key ───── */

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [isOpen, onClose]);

  /* ───── handlers ───── */

  /**
   * Navigation centralisée.
   *
   * On transmet l'identifiant au routeur/page parent,
   * puis on ferme immédiatement le drawer.
   */
  const handleNav = (id: string) => {
    onNavigate(id);
    onClose();
  };

  /**
   * Point d'entrée vers "Ma Home".
   *
   * Le parent possède le HomePersonalizationSheet.
   * Le drawer se contente donc d'émettre l'intention.
   */
  const handleOpenHomePersonalization = () => {
    if (!onOpenHomePersonalization) {
      return;
    }

    onClose();
    onOpenHomePersonalization();
  };

  /**
   * Déconnexion Firebase.
   *
   * Firebase reste la source d'authentification.
   * Convex récupère ensuite l'identité correspondante
   * via son intégration d'authentification.
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      console.error("[SideDrawer] Erreur lors de la déconnexion :", error);
    }
  };

  /* ───── derived animations ───── */

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth, 0],
  });

  const contentTranslateX = contentStagger.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  if (!mounted) {
    return null;
  }

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      accessibilityLabel="Menu DébrouillePro"
    >
      {/* ═══════════ BACKDROP ═══════════ */}

      <Animated.View
        pointerEvents="auto"
        style={[
          styles.backdrop,
          {
            opacity: backdropAnim,
          },
        ]}
      >
        <Pressable
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Fermer le menu"
        />
      </Animated.View>

      {/* ═══════════ DRAWER ═══════════ */}

      <Animated.View
        style={[
          styles.drawer,
          {
            width: drawerWidth,
            transform: [{ translateX }],
          },
        ]}
        accessibilityRole="menu"
      >
        {/* Base gradient */}

        <LinearGradient
          colors={["#0C0A1F", "#0A0818", "#070512"]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Ambient orbs */}

        <View style={styles.orbTop} pointerEvents="none" />

        <View style={styles.orbBottom} pointerEvents="none" />

        {/* Right border ring */}

        <View style={styles.borderRing} pointerEvents="none" />

        {/* Top light line */}

        <View style={styles.topLine} pointerEvents="none" />

        {/* ═══════════ HEADER ═══════════ */}

        <Animated.View
          style={{
            opacity: contentStagger,
            transform: [{ translateX: contentTranslateX }],
          }}
        >
          <DrawerHeader
            user={user ?? null}
            displayName={displayName}
            email={email}
            onClose={onClose}
            onProfile={() => handleNav("profile")}
          />
        </Animated.View>

        {/* ═══════════ NAVIGATION ═══════════ */}

        <Animated.View
          style={[
            styles.navigationWrap,
            {
              opacity: contentStagger,
              transform: [{ translateX: contentTranslateX }],
            },
          ]}
        >
          <ScrollView
            style={styles.navigationScroll}
            contentContainerStyle={styles.navigationContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {navSections.map((section) => (
              <DrawerSection
                key={section.title}
                section={section}
                onItemClick={handleNav}
                badges={badges}
              />
            ))}

            {/* ═══════════ MA HOME ═══════════ */}

            {onOpenHomePersonalization ? (
              <View style={styles.personalizationSection}>
                <Text style={styles.personalizationEyebrow}>MA HOME</Text>

                <Pressable
                  onPress={handleOpenHomePersonalization}
                  accessibilityRole="button"
                  accessibilityLabel="Personnaliser ma Home"
                  accessibilityHint="Ouvre les réglages de personnalisation de votre Home"
                  style={({ pressed }) => [
                    styles.personalizationButton,
                    pressed && styles.personalizationButtonPressed,
                  ]}
                >
                  <LinearGradient
                    colors={["rgba(99,102,241,0.20)", "rgba(139,92,246,0.12)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />

                  <View style={styles.personalizationIcon}>
                    <Text style={styles.personalizationIconText}>✦</Text>
                  </View>

                  <View style={styles.personalizationCopy}>
                    <Text numberOfLines={1} style={styles.personalizationTitle}>
                      Personnaliser ma Home
                    </Text>

                    <Text
                      numberOfLines={2}
                      style={styles.personalizationSubtitle}
                    >
                      Modules, ordre et alertes
                    </Text>
                  </View>

                  <Text
                    accessibilityElementsHidden
                    style={styles.personalizationArrow}
                  >
                    ›
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>

          {/* Bottom fade over scroll content */}

          <LinearGradient
            colors={["rgba(10,6,24,0)", "rgba(10,6,24,0.9)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.bottomFade}
            pointerEvents="none"
          />
        </Animated.View>

        {/* ═══════════ FOOTER ═══════════ */}

        <Animated.View
          style={{
            opacity: contentStagger,
            transform: [{ translateX: contentTranslateX }],
          }}
        >
          <DrawerFooter onLogout={handleLogout} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  /* ── Backdrop ───────────────────────────────────── */

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  /* ── Drawer ─────────────────────────────────────── */

  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    overflow: "hidden",
    backgroundColor: "#0A0818",
    shadowColor: "#000",
    shadowOpacity: 0.75,
    shadowRadius: 40,
    shadowOffset: {
      width: 20,
      height: 0,
    },
    elevation: 28,
  },

  /* ── Ambient orbs ───────────────────────────────── */

  orbTop: {
    position: "absolute",
    top: -80,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 9999,
    backgroundColor: "rgba(139,92,246,0.22)",
  },

  orbBottom: {
    position: "absolute",
    bottom: -100,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 9999,
    backgroundColor: "rgba(99,102,241,0.16)",
  },

  /* ── Border ring ────────────────────────────────── */

  borderRing: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 1,
    backgroundColor: "rgba(167,139,250,0.18)",
  },

  /* ── Top light line ─────────────────────────────── */

  topLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  /* ── Navigation ─────────────────────────────────── */

  navigationWrap: {
    flex: 1,
    minHeight: 0,
    position: "relative",
  },

  navigationScroll: {
    flex: 1,
  },

  navigationContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 32,
  },

  /* ── Home personalization ───────────────────────── */

  personalizationSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },

  personalizationEyebrow: {
    marginBottom: 9,
    paddingHorizontal: 4,
    color: "rgba(196,181,253,0.68)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  personalizationButton: {
    minHeight: 68,
    position: "relative",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  personalizationButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },

  personalizationIcon: {
    width: 38,
    height: 38,
    marginRight: 11,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.22)",
    backgroundColor: "rgba(99,102,241,0.14)",
  },

  personalizationIconText: {
    color: "#C4B5FD",
    fontSize: 20,
    fontWeight: "700",
  },

  personalizationCopy: {
    flex: 1,
    minWidth: 0,
  },

  personalizationTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.1,
  },

  personalizationSubtitle: {
    marginTop: 3,
    color: "rgba(203,213,225,0.62)",
    fontSize: 11,
    lineHeight: 15,
  },

  personalizationArrow: {
    marginLeft: 8,
    color: "rgba(196,181,253,0.72)",
    fontSize: 25,
    fontWeight: "300",
    lineHeight: 28,
  },
});

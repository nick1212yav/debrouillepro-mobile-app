// src/pages/home/_components/TabBar.tsx

import React, { memo, useCallback, useEffect, useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  Compass,
  Home,
  MessageCircle,
  Plus,
  Sparkles,
  Zap,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

/* ============================================================================
 * TYPES
 * ========================================================================== */

export type TabId = "home" | "explorer" | "actions" | "messages" | "create";

interface TabDefinition {
  id: Exclude<TabId, "create">;
  label: string;
  icon: LucideIcon;
}

interface TabBarProps {
  active: TabId | string;
  onChange: (tab: TabId) => void;
  hidden?: boolean;
}

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const COLORS = {
  background: "#050711",
  backgroundSecondary: "#0B0A1D",

  violet: "#8B5CF6",
  violetLight: "#C4B5FD",
  indigo: "#6366F1",

  white: "#FFFFFF",
  whiteSoft: "rgba(255,255,255,0.72)",
  whiteMuted: "rgba(255,255,255,0.46)",
  whiteFaint: "rgba(255,255,255,0.22)",

  border: "rgba(255,255,255,0.09)",
  borderStrong: "rgba(167,139,250,0.24)",
};

const BASE_TABS: readonly TabDefinition[] = [
  {
    id: "home",
    label: "Accueil",
    icon: Home,
  },
  {
    id: "explorer",
    label: "Explorer",
    icon: Compass,
  },
  {
    id: "actions",
    label: "Actions",
    icon: Zap,
  },
  {
    id: "messages",
    label: "Messages",
    icon: MessageCircle,
  },
];

/* ============================================================================
 * PREMIUM ACTIVE INDICATOR
 * ========================================================================== */

const ActiveIndicator = memo(function ActiveIndicator() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.65, 1], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(pulse.value, [0, 1], [1, 1.35], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.activeIndicator, animatedStyle]}
    />
  );
});

/* ============================================================================
 * TAB ITEM
 * ========================================================================== */

interface TabItemProps {
  tab: TabDefinition;
  active: boolean;
  onPress: () => void;
}

const TabItem = memo(function TabItem({ tab, active, onPress }: TabItemProps) {
  const Icon = tab.icon;

  const pressed = useSharedValue(0);
  const activeProgress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    activeProgress.value = withSpring(active ? 1 : 0, {
      damping: 18,
      stiffness: 260,
      mass: 0.7,
    });
  }, [active, activeProgress]);

  const onPressIn = useCallback(() => {
    pressed.value = withSpring(1, {
      damping: 18,
      stiffness: 500,
      mass: 0.5,
    });
  }, [pressed]);

  const onPressOut = useCallback(() => {
    pressed.value = withSpring(0, {
      damping: 16,
      stiffness: 420,
      mass: 0.5,
    });
  }, [pressed]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          pressed.value,
          [0, 1],
          [1, 0.92],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const activeBackgroundStyle = useAnimatedStyle(() => ({
    opacity: activeProgress.value,
    transform: [
      {
        scale: interpolate(
          activeProgress.value,
          [0, 1],
          [0.82, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          activeProgress.value,
          [0, 1],
          [1, -1],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          activeProgress.value,
          [0, 1],
          [1, 1.06],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.tabItemContainer, containerAnimatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="tab"
        accessibilityLabel={tab.label}
        accessibilityState={{ selected: active }}
        hitSlop={8}
        style={styles.tabPressable}
      >
        {/* Active glass plate */}
        <Animated.View
          pointerEvents="none"
          style={[styles.activePlate, activeBackgroundStyle]}
        >
          <LinearGradient
            colors={[
              "rgba(139,92,246,0.24)",
              "rgba(99,102,241,0.12)",
              "rgba(139,92,246,0.05)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.activePlateBorder} />
        </Animated.View>

        {/* Icon */}
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          <Icon
            size={21}
            color={active ? COLORS.violetLight : COLORS.whiteMuted}
            strokeWidth={active ? 2.5 : 1.9}
          />
        </Animated.View>

        {/* Label */}
        <Text
          numberOfLines={1}
          style={[
            styles.tabLabel,
            active ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          {tab.label}
        </Text>

        {/* Live active point */}
        {active ? <ActiveIndicator /> : null}
      </Pressable>
    </Animated.View>
  );
});

/* ============================================================================
 * CREATE BUTTON
 * ========================================================================== */

interface CreateButtonProps {
  active: boolean;
  onPress: () => void;
}

const CreateButton = memo(function CreateButton({
  active,
  onPress,
}: CreateButtonProps) {
  const pressed = useSharedValue(0);
  const activeProgress = useSharedValue(active ? 1 : 0);
  const ambient = useSharedValue(0);
  const shine = useSharedValue(0);

  useEffect(() => {
    activeProgress.value = withSpring(active ? 1 : 0, {
      damping: 17,
      stiffness: 240,
      mass: 0.7,
    });
  }, [active, activeProgress]);

  useEffect(() => {
    ambient.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );
  }, [ambient]);

  useEffect(() => {
    shine.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: 0,
        }),
        withTiming(0, {
          duration: 1300,
        }),
      ),
      -1,
      false,
    );
  }, [shine]);

  const onPressIn = useCallback(() => {
    pressed.value = withSpring(1, {
      damping: 14,
      stiffness: 500,
      mass: 0.5,
    });
  }, [pressed]);

  const onPressOut = useCallback(() => {
    pressed.value = withSpring(0, {
      damping: 14,
      stiffness: 430,
      mass: 0.5,
    });
  }, [pressed]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          pressed.value,
          [0, 1],
          [1, 0.91],
          Extrapolation.CLAMP,
        ),
      },
      {
        translateY: interpolate(
          activeProgress.value,
          [0, 1],
          [0, -2],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      ambient.value,
      [0, 1],
      [0.35, 0.72],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          ambient.value,
          [0, 1],
          [0.96, 1.14],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const activeRingStyle = useAnimatedStyle(() => ({
    opacity: activeProgress.value,
    transform: [
      {
        scale: interpolate(
          activeProgress.value,
          [0, 1],
          [0.86, 1.08],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const shineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      shine.value,
      [0, 0.35, 0.65, 1],
      [0, 0.08, 0.26, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateX: interpolate(
          shine.value,
          [0, 1],
          [-85, 85],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const plusAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(
          activeProgress.value,
          [0, 1],
          [0, 45],
          Extrapolation.CLAMP,
        )}deg`,
      },
      {
        scale: interpolate(
          activeProgress.value,
          [0, 1],
          [1, 1.04],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View style={styles.createArea}>
      {/* Ambient aura */}
      <Animated.View
        pointerEvents="none"
        style={[styles.createAura, glowAnimatedStyle]}
      >
        <LinearGradient
          colors={[
            "rgba(167,139,250,0.55)",
            "rgba(99,102,241,0.28)",
            "rgba(99,102,241,0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Button */}
      <Animated.View style={[styles.createButtonShadow, buttonAnimatedStyle]}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityLabel={active ? "Fermer le menu de création" : "Créer"}
          accessibilityState={{ expanded: active }}
          hitSlop={8}
          style={styles.createButtonPressable}
        >
          <LinearGradient
            colors={
              active
                ? ["#C4B5FD", "#8B5CF6", "#6366F1"]
                : ["#A78BFA", "#7C3AED", "#5B5BD6"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createButtonGradient}
          >
            {/* Inner glass */}
            <View pointerEvents="none" style={styles.createButtonInner} />

            {/* Moving light */}
            <Animated.View
              pointerEvents="none"
              style={[styles.createButtonShine, shineAnimatedStyle]}
            />

            {/* Active ring */}
            <Animated.View
              pointerEvents="none"
              style={[styles.createActiveRing, activeRingStyle]}
            />

            {/* Icon */}
            <Animated.View style={plusAnimatedStyle}>
              <Plus size={29} color={COLORS.white} strokeWidth={2.35} />
            </Animated.View>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      <View pointerEvents="none" style={styles.createLabelRow}>
        <Sparkles size={9} color="rgba(196,181,253,0.72)" strokeWidth={2.5} />
        <Text style={styles.createLabel}>Créer</Text>
      </View>
    </View>
  );
});

/* ============================================================================
 * MAIN TAB BAR
 * ========================================================================== */

function TabBar({ active, onChange, hidden = false }: TabBarProps) {
  const { width } = useWindowDimensions();

  const visibility = useSharedValue(hidden ? 0 : 1);

  useEffect(() => {
    visibility.value = withSpring(hidden ? 0 : 1, {
      damping: 24,
      stiffness: 260,
      mass: 0.8,
    });
  }, [hidden, visibility]);

  const tabs = useMemo(() => BASE_TABS, []);

  const leftTabs = useMemo(() => tabs.slice(0, 2), [tabs]);

  const rightTabs = useMemo(() => tabs.slice(2, 4), [tabs]);

  const maxWidth = Math.min(Math.max(width - 20, 320), 680);

  const rootAnimatedStyle = useAnimatedStyle(() => ({
    opacity: visibility.value,
    transform: [
      {
        translateY: interpolate(
          visibility.value,
          [0, 1],
          [110, 0],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          visibility.value,
          [0, 1],
          [0.96, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const handleChange = useCallback(
    (tab: TabId) => {
      onChange(tab);
    },
    [onChange],
  );

  if (hidden) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      accessibilityLabel="Navigation principale"
      style={[styles.root, rootAnimatedStyle]}
    >
      <View
        style={[
          styles.container,
          {
            maxWidth,
          },
        ]}
      >
        {/* ================================================================
         * AMBIENT BACKLIGHT
         * ============================================================ */}

        <View pointerEvents="none" style={styles.ambientBacklight}>
          <LinearGradient
            colors={[
              "rgba(99,102,241,0)",
              "rgba(139,92,246,0.18)",
              "rgba(99,102,241,0.10)",
              "rgba(99,102,241,0)",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* ================================================================
         * GLASS SHELL
         * ============================================================ */}

        <View style={styles.shell}>
          <LinearGradient
            colors={[
              "rgba(15,12,34,0.97)",
              "rgba(7,8,23,0.96)",
              "rgba(12,8,30,0.98)",
            ]}
            locations={[0, 0.52, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Outer border */}
          <View pointerEvents="none" style={styles.shellBorder} />

          {/* Top light */}
          <View pointerEvents="none" style={styles.topLight}>
            <LinearGradient
              colors={[
                "rgba(255,255,255,0)",
                "rgba(255,255,255,0.18)",
                "rgba(167,139,250,0.22)",
                "rgba(255,255,255,0)",
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </View>

          {/* Content */}
          <View style={styles.contentRow}>
            {/* LEFT */}
            <View style={styles.tabsGroup}>
              {leftTabs.map((tab) => (
                <TabItem
                  key={tab.id}
                  tab={tab}
                  active={active === tab.id}
                  onPress={() => handleChange(tab.id)}
                />
              ))}
            </View>

            {/* CENTER */}
            <CreateButton
              active={active === "create"}
              onPress={() => handleChange("create")}
            />

            {/* RIGHT */}
            <View style={styles.tabsGroup}>
              {rightTabs.map((tab) => (
                <TabItem
                  key={tab.id}
                  tab={tab}
                  active={active === tab.id}
                  onPress={() => handleChange(tab.id)}
                />
              ))}
            </View>
          </View>

          {/* Bottom signature */}
          <View pointerEvents="none" style={styles.bottomSignature}>
            <LinearGradient
              colors={[
                "rgba(139,92,246,0)",
                "rgba(167,139,250,0.52)",
                "rgba(139,92,246,0)",
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default memo(TabBar);

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  /* --------------------------------------------------------------------------
   * ROOT
   * ------------------------------------------------------------------------ */

  root: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
    paddingHorizontal: 10,
    paddingBottom: 12,
  },

  container: {
    width: "100%",
    alignSelf: "center",
    position: "relative",
  },

  /* --------------------------------------------------------------------------
   * AMBIENT BACKLIGHT
   * ------------------------------------------------------------------------ */

  ambientBacklight: {
    position: "absolute",
    left: -22,
    right: -22,
    bottom: -15,
    height: 115,
    borderRadius: 42,
    overflow: "hidden",
    opacity: 0.9,
  },

  /* --------------------------------------------------------------------------
   * SHELL
   * ------------------------------------------------------------------------ */

  shell: {
    height: 76,
    borderRadius: 28,
    overflow: "visible",

    shadowColor: "#000",
    shadowOpacity: 0.42,
    shadowRadius: 28,
    shadowOffset: {
      width: 0,
      height: 15,
    },

    elevation: 18,
  },

  shellBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  topLight: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    overflow: "hidden",
    borderRadius: 1,
  },

  bottomSignature: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    width: 100,
    height: 1,
    marginLeft: -50,
    overflow: "hidden",
  },

  /* --------------------------------------------------------------------------
   * CONTENT
   * ------------------------------------------------------------------------ */

  contentRow: {
    height: 76,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 7,
    paddingBottom: 3,
  },

  tabsGroup: {
    flex: 1,
    minWidth: 0,
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  /* --------------------------------------------------------------------------
   * TAB
   * ------------------------------------------------------------------------ */

  tabItemContainer: {
    width: 76,
    height: 66,
  },

  tabPressable: {
    position: "relative",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },

  activePlate: {
    position: "absolute",
    left: 7,
    right: 7,
    top: 7,
    height: 40,
    borderRadius: 15,
    overflow: "hidden",
  },

  activePlateBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },

  iconContainer: {
    width: 32,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  tabLabel: {
    maxWidth: 70,
    marginTop: 3,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.15,
    textAlign: "center",
    zIndex: 2,
  },

  tabLabelActive: {
    color: COLORS.violetLight,
    fontWeight: "800",
  },

  tabLabelInactive: {
    color: COLORS.whiteMuted,
    fontWeight: "600",
  },

  activeIndicator: {
    position: "absolute",
    bottom: 1,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.violetLight,

    shadowColor: COLORS.violet,
    shadowOpacity: 0.9,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },

  /* --------------------------------------------------------------------------
   * CREATE
   * ------------------------------------------------------------------------ */

  createArea: {
    position: "relative",
    width: 86,
    height: 76,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  createAura: {
    position: "absolute",
    top: -9,
    left: "50%",
    width: 78,
    height: 78,
    marginLeft: -39,
    borderRadius: 27,
    overflow: "hidden",
  },

  createButtonShadow: {
    marginTop: -19,

    shadowColor: COLORS.violet,
    shadowOpacity: 0.55,
    shadowRadius: 23,
    shadowOffset: {
      width: 0,
      height: 12,
    },

    elevation: 16,
  },

  createButtonPressable: {
    width: 60,
    height: 60,
    borderRadius: 22,
    overflow: "hidden",
  },

  createButtonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },

  createButtonInner: {
    position: "absolute",
    top: 1,
    left: 1,
    right: 1,
    height: 26,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.11)",
  },

  createButtonShine: {
    position: "absolute",
    top: -12,
    bottom: -12,
    width: 30,
    backgroundColor: "rgba(255,255,255,0.42)",
    transform: [{ skewX: "-18deg" }],
  },

  createActiveRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.52)",
  },

  createLabelRow: {
    position: "absolute",
    bottom: -1,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  createLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "800",
    letterSpacing: 0.45,
    color: COLORS.violetLight,
  },
});

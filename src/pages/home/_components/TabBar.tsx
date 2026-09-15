// src/pages/home/_components/TabBar.tsx
import {
  View,
  Pressable,
  Text,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { Compass, Home, MessageCircle, Plus, Zap } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface TabDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface TabBarProps {
  active: string;
  onChange: (tab: string) => void;
  hidden?: boolean;
}

const BASE_TABS: TabDefinition[] = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "explorer", label: "Explorer", icon: Compass },
  { id: "actions", label: "Actions", icon: Zap },
  { id: "messages", label: "Messages", icon: MessageCircle },
];

/* ============================================================================
 * ANIMATED BADGE
 * ========================================================================== */

function AnimatedBadge({ value }: { value: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      stiffness: 420,
      damping: 18,
      useNativeDriver: true,
    }).start();
  }, [value, anim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });
  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  return (
    <Animated.View style={[styles.badgeWrap, { transform: [{ scale }] }]}>
      <Animated.View
        style={[
          styles.badgeGlow,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />
      <LinearGradient
        colors={["#FB7185", "#F43F5E", "#E11D48"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.badgeGradient}
      >
        <Text style={styles.badgeText}>
          {value > 99 ? "99+" : String(value)}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

/* ============================================================================
 * ACTIVE DOT
 * ========================================================================== */

function ActiveDot() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.7],
  });

  return (
    <Animated.View
      style={[styles.activeDot, { transform: [{ scale }], opacity }]}
    />
  );
}

/* ============================================================================
 * TAB ITEM
 * ========================================================================== */

function TabItem({
  tab,
  isActive,
  onPress,
}: {
  tab: TabDefinition;
  isActive: boolean;
  onPress: () => void;
}) {
  const Icon = tab.icon;
  const scale = useRef(new Animated.Value(1)).current;
  const activeAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(activeAnim, {
      toValue: isActive ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isActive, activeAnim]);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const activeBgOpacity = activeAnim;
  const activeBorderOpacity = activeAnim;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityLabel={tab.label}
        accessibilityState={{ selected: isActive }}
        style={styles.tabItem}
      >
        {/* Active background */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tabActiveBg,
            {
              opacity: activeBgOpacity,
              transform: [
                {
                  scale: activeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(139,92,246,0.2)", "rgba(167,139,250,0.08)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View
            style={[styles.tabActiveBorder, { opacity: activeBorderOpacity }]}
            pointerEvents="none"
          />
        </Animated.View>

        {/* Icon */}
        <View style={styles.tabIconWrap}>
          <Icon
            size={20}
            color={isActive ? "#C4B5FD" : "rgba(255,255,255,0.55)"}
            strokeWidth={isActive ? 2.45 : 1.85}
          />
        </View>

        {/* Label */}
        <Text
          style={[
            styles.tabLabel,
            {
              color: isActive ? "rgb(196,181,253)" : "rgba(255,255,255,0.42)",
              fontWeight: isActive ? "800" : "600",
            },
          ]}
        >
          {tab.label}
        </Text>

        {/* Active dot */}
        {isActive ? <ActiveDot /> : null}

        {/* Badge */}
        {typeof tab.badge === "number" && tab.badge > 0 ? (
          <AnimatedBadge value={tab.badge} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * CREATE BUTTON
 * ========================================================================== */

function CreateButton({
  active,
  onPress,
}: {
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const shine = useRef(new Animated.Value(0)).current;

  /* Pulsing glow */
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [glow]);

  /* Rotate when active */
  useEffect(() => {
    Animated.timing(rotate, {
      toValue: active ? 1 : 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [active, rotate]);

  /* Shine sweep */
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shine, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(1600),
        Animated.timing(shine, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [shine]);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const glowScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });
  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.7],
  });

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const shineTranslateX = shine.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 200],
  });

  return (
    <View style={styles.createWrap}>
      {/* Ambient glow */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.createGlow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(139,92,246,0.5)",
            "rgba(139,92,246,0.2)",
            "rgba(139,92,246,0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Button */}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityLabel={active ? "Fermer le menu de création" : "Créer"}
          accessibilityState={{ selected: active }}
          style={styles.createBtnOuter}
        >
          <LinearGradient
            colors={["#A78BFA", "#7C3AED", "#6366F1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createBtnGradient}
          >
            {/* Glass shine */}
            <View style={styles.createBtnShine} pointerEvents="none" />

            {/* Shine sweep */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.createBtnSweep,
                {
                  transform: [
                    { translateX: shineTranslateX },
                    { skewX: "-20deg" },
                  ],
                },
              ]}
            />

            {/* Active ring */}
            {active ? (
              <View style={styles.createBtnActiveRing} pointerEvents="none" />
            ) : null}

            {/* Icon */}
            <Animated.View style={{ transform: [{ rotate: rotation }] }}>
              <Plus size={29} color="#FFFFFF" strokeWidth={2.4} />
            </Animated.View>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Label */}
      <Text style={[styles.createLabel, { opacity: active ? 1 : 0.5 }]}>
        Créer
      </Text>
    </View>
  );
}

/* ============================================================================
 * MAIN TAB BAR
 * ========================================================================== */

export default function TabBar({
  active,
  onChange,
  hidden = false,
}: TabBarProps) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const msgUnread = 0;

  const tabs = useMemo<TabDefinition[]>(
    () =>
      BASE_TABS.map((tab) => ({
        ...tab,
        badge: tab.id === "messages" ? msgUnread : undefined,
      })),
    [msgUnread],
  );

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: hidden ? 0 : 1,
      stiffness: 320,
      damping: 28,
      useNativeDriver: true,
    }).start();
  }, [hidden, slideAnim]);

  if (hidden) return null;

  const maxWidth = Math.min(SCREEN_WIDTH - 16, 640);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 0],
  });
  const opacity = slideAnim;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.root,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
      accessibilityLabel="Navigation principale"
    >
      <View style={[styles.inner, { maxWidth }]}>
        {/* Outer glow */}
        <View style={styles.outerGlow} pointerEvents="none">
          <LinearGradient
            colors={[
              "rgba(139,92,246,0)",
              "rgba(139,92,246,0.18)",
              "rgba(139,92,246,0)",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </View>

        {/* Shell */}
        <View style={styles.shell}>
          {/* Base gradient */}
          <LinearGradient
            colors={[
              "rgba(12,8,30,0.95)",
              "rgba(5,7,20,0.92)",
              "rgba(8,5,24,0.95)",
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Border ring */}
          <View style={styles.shellBorder} pointerEvents="none" />

          {/* Top hairline */}
          <View style={styles.topHairline} pointerEvents="none">
            <LinearGradient
              colors={[
                "rgba(255,255,255,0)",
                "rgba(255,255,255,0.2)",
                "rgba(255,255,255,0)",
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1 }}
            />
          </View>

          {/* Content */}
          <View style={styles.contentRow}>
            {/* Left tabs */}
            <View style={styles.tabsGroup}>
              {tabs.slice(0, 2).map((tab) => (
                <TabItem
                  key={tab.id}
                  tab={tab}
                  isActive={active === tab.id}
                  onPress={() => onChange(tab.id)}
                />
              ))}
            </View>

            {/* Center create */}
            <CreateButton
              active={active === "create"}
              onPress={() => onChange("create")}
            />

            {/* Right tabs */}
            <View style={styles.tabsGroup}>
              {tabs.slice(2).map((tab) => (
                <TabItem
                  key={tab.id}
                  tab={tab}
                  isActive={active === tab.id}
                  onPress={() => onChange(tab.id)}
                />
              ))}
            </View>
          </View>

          {/* Bottom hairline */}
          <View style={styles.bottomHairline} pointerEvents="none">
            <LinearGradient
              colors={[
                "rgba(167,139,250,0)",
                "rgba(167,139,250,0.5)",
                "rgba(167,139,250,0)",
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  /* ── Root ────────────────────────────────────────── */
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === "android" ? 12 : 20,
  },
  inner: {
    width: "100%",
    alignSelf: "center",
    position: "relative",
  },

  /* ── Outer glow ──────────────────────────────────── */
  outerGlow: {
    position: "absolute",
    left: -16,
    right: -16,
    bottom: -8,
    height: 120,
    borderRadius: 40,
    overflow: "hidden",
    opacity: 0.9,
  },

  /* ── Shell ───────────────────────────────────────── */
  shell: {
    borderRadius: 30,
    overflow: "visible",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  shellBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  topHairline: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
  },
  bottomHairline: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    marginLeft: -40,
    width: 80,
    height: 1,
  },

  /* ── Content row ─────────────────────────────────── */
  contentRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 4,
    height: 70,
  },
  tabsGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  /* ── Tab item ────────────────────────────────────── */
  tabItem: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    height: 62,
    width: 70,
  },
  tabActiveBg: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 4,
    height: 39,
    borderRadius: 14,
    overflow: "hidden",
  },
  tabActiveBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.22)",
  },
  tabIconWrap: {
    height: 28,
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  tabLabel: {
    marginTop: 4,
    fontSize: 9,
    letterSpacing: 0.2,
    zIndex: 10,
  },

  /* ── Active dot ──────────────────────────────────── */
  activeDot: {
    position: "absolute",
    bottom: 2,
    height: 4,
    width: 4,
    borderRadius: 2,
    backgroundColor: "#C4B5FD",
    shadowColor: "#C4B5FD",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },

  /* ── Badge ───────────────────────────────────────── */
  badgeWrap: {
    position: "absolute",
    right: 5,
    top: 2,
    height: 18,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  badgeGlow: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 9,
    backgroundColor: "#F43F5E",
  },
  badgeGradient: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#080B1D",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.1,
    lineHeight: 11,
  },

  /* ── Create button ───────────────────────────────── */
  createWrap: {
    position: "relative",
    width: 82,
    alignItems: "center",
    justifyContent: "center",
  },
  createGlow: {
    position: "absolute",
    top: -8,
    left: "50%",
    marginLeft: -36,
    width: 72,
    height: 72,
    borderRadius: 22,
    overflow: "hidden",
  },
  createBtnOuter: {
    marginTop: -20,
    height: 58,
    width: 58,
    borderRadius: 21,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  createBtnGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  createBtnShine: {
    position: "absolute",
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  createBtnSweep: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: "rgba(255,255,255,0.28)",
    opacity: 0.75,
  },
  createBtnActiveRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  createLabel: {
    position: "absolute",
    bottom: -2,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "#C4B5FD",
  },
});

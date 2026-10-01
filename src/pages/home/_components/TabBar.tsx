// src/pages/home/_components/TabBar.tsx

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import {
  Compass,
  Home,
  MessageCircle,
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

interface TabLayout {
  x: number;
  width: number;
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

const RIPPLE_COLOR_TAB = "rgba(139,92,246,0.18)";
const RIPPLE_COLOR_CREATE = "rgba(255,255,255,0.22)";

const BASE_TABS: readonly TabDefinition[] = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "explorer", label: "Explorer", icon: Compass },
  { id: "actions", label: "Actions", icon: Zap },
  { id: "messages", label: "Messages", icon: MessageCircle },
];

const SHELL_GRADIENT_COLORS: readonly [string, string, string] =
  Platform.OS === "ios"
    ? ["rgba(15,12,34,0.72)", "rgba(7,8,23,0.72)", "rgba(12,8,30,0.78)"]
    : ["rgba(15,12,34,0.97)", "rgba(7,8,23,0.96)", "rgba(12,8,30,0.98)"];

const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;
const BURST_DISTANCE = 46;

const PILL_INSET_X = 5;
const PILL_HEIGHT = 40;
const PILL_TOP = 7;
const PILL_RADIUS = 15;

/* ============================================================================
 * TAB ITEM
 * ========================================================================== */

interface TabItemProps {
  tab: TabDefinition;
  active: boolean;
  onPress: () => void;
  onMeasure: (id: TabDefinition["id"], layout: TabLayout) => void;
}

const TabItem = memo(function TabItem({
  tab,
  active,
  onPress,
  onMeasure,
}: TabItemProps) {
  const Icon = tab.icon;
  const reducedMotion = useReducedMotion();

  const pressed = useSharedValue(0);
  const activeProgress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      activeProgress.value = active ? 1 : 0;
      return;
    }

    activeProgress.value = withSpring(active ? 1 : 0, {
      damping: 18,
      stiffness: 260,
      mass: 0.7,
    });
  }, [active, activeProgress, reducedMotion]);

  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { x: number; width: number } } }) => {
      const { x, width } = event.nativeEvent.layout;
      onMeasure(tab.id, { x, width });
    },
    [onMeasure, tab.id],
  );

  const onPressIn = useCallback(() => {
    if (reducedMotion) return;

    pressed.value = withSpring(1, {
      damping: 18,
      stiffness: 500,
      mass: 0.5,
    });
  }, [pressed, reducedMotion]);

  const onPressOut = useCallback(() => {
    if (reducedMotion) return;

    pressed.value = withSpring(0, {
      damping: 16,
      stiffness: 420,
      mass: 0.5,
    });
  }, [pressed, reducedMotion]);

  const handlePress = useCallback(() => {
    void Haptics.selectionAsync();
    onPress();
  }, [onPress]);

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
        onLayout={handleLayout}
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="tab"
        accessibilityLabel={tab.label}
        accessibilityState={{ selected: active }}
        hitSlop={8}
        android_ripple={{
          color: RIPPLE_COLOR_TAB,
          borderless: true,
          radius: 30,
        }}
        style={styles.tabPressable}
      >
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          <Icon
            size={21}
            color={active ? COLORS.violetLight : COLORS.whiteMuted}
            strokeWidth={active ? 2.5 : 1.9}
          />
        </Animated.View>

        <Text
          numberOfLines={1}
          style={[
            styles.tabLabel,
            active ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          {tab.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

/* ============================================================================
 * TABS GROUP
 * ========================================================================== */

interface TabsGroupProps {
  tabs: readonly TabDefinition[];
  activeId: string;
  onSelect: (id: TabDefinition["id"]) => void;
}

function TabsGroup({ tabs, activeId, onSelect }: TabsGroupProps) {
  const reducedMotion = useReducedMotion();

  const [layouts, setLayouts] = useState<
    Partial<Record<TabDefinition["id"], TabLayout>>
  >({});

  const handleMeasure = useCallback(
    (id: TabDefinition["id"], layout: TabLayout) => {
      setLayouts((current) => {
        const previous = current[id];
        if (
          previous &&
          Math.abs(previous.x - layout.x) < 0.5 &&
          Math.abs(previous.width - layout.width) < 0.5
        ) {
          return current;
        }
        return { ...current, [id]: layout };
      });
    },
    [],
  );

  const activeInGroup = tabs.some((tab) => tab.id === activeId);

  const pillX = useSharedValue(0);
  const pillOpacity = useSharedValue(0);

  useEffect(() => {
    const target = layouts[activeId as TabDefinition["id"]];

    if (!target || !activeInGroup) {
      pillOpacity.value = withTiming(0, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    pillOpacity.value = withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });

    if (reducedMotion) {
      pillX.value = target.x;
      return;
    }

    pillX.value = withSpring(target.x, {
      damping: 22,
      stiffness: 260,
      mass: 0.7,
    });
  }, [activeId, activeInGroup, layouts, pillOpacity, pillX, reducedMotion]);

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    opacity: pillOpacity.value,
  }));

  return (
    <View style={styles.tabsGroup}>
      <Animated.View
        pointerEvents="none"
        style={[styles.slidingPill, pillAnimatedStyle]}
      >
        <LinearGradient
          colors={[
            "rgba(139,92,246,0.32)",
            "rgba(99,102,241,0.16)",
            "rgba(139,92,246,0.06)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <LinearGradient
          colors={[
            "rgba(255,255,255,0)",
            "rgba(255,255,255,0.22)",
            "rgba(255,255,255,0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.slidingPillInnerLight}
        />

        <View style={styles.slidingPillBorder} />
      </Animated.View>

      {tabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          active={activeId === tab.id}
          onPress={() => onSelect(tab.id)}
          onMeasure={handleMeasure}
        />
      ))}
    </View>
  );
}

/* ============================================================================
 * BURST PARTICLE
 * ========================================================================== */

interface BurstParticleProps {
  angle: number;
  progress: SharedValue<number>;
}

const BurstParticle = memo(function BurstParticle({
  angle,
  progress,
}: BurstParticleProps) {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);

  const animatedStyle = useAnimatedStyle(() => {
    const distance = interpolate(
      progress.value,
      [0, 1],
      [0, BURST_DISTANCE],
      Extrapolation.CLAMP,
    );

    return {
      opacity: interpolate(
        progress.value,
        [0, 0.15, 0.7, 1],
        [0, 1, 0.6, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        { translateX: dx * distance },
        { translateY: dy * distance },
        {
          scale: interpolate(
            progress.value,
            [0, 1],
            [1, 0.2],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return <Animated.View style={[styles.burstParticle, animatedStyle]} />;
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
  const reducedMotion = useReducedMotion();

  const pressed = useSharedValue(0);
  const activeProgress = useSharedValue(active ? 1 : 0);
  const ambient = useSharedValue(0.5);
  const shine = useSharedValue(0);
  const burst = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      activeProgress.value = active ? 1 : 0;
      return;
    }

    activeProgress.value = withSpring(active ? 1 : 0, {
      damping: 17,
      stiffness: 240,
      mass: 0.7,
    });
  }, [active, activeProgress, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      ambient.value = 0.5;
      return;
    }

    ambient.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [ambient, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      shine.value = 0;
      return;
    }

    shine.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        withDelay(1300, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, [shine, reducedMotion]);

  const onPressIn = useCallback(() => {
    if (reducedMotion) return;

    pressed.value = withSpring(1, {
      damping: 14,
      stiffness: 500,
      mass: 0.5,
    });
  }, [pressed, reducedMotion]);

  const onPressOut = useCallback(() => {
    if (reducedMotion) return;

    pressed.value = withSpring(0, {
      damping: 14,
      stiffness: 430,
      mass: 0.5,
    });
  }, [pressed, reducedMotion]);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!reducedMotion) {
      burst.value = 0;
      burst.value = withTiming(
        1,
        { duration: 700, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) {
            burst.value = 0;
          }
        },
      );
    }

    onPress();
  }, [onPress, burst, reducedMotion]);

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

  const innerAuraAnimatedStyle = useAnimatedStyle(() => {
    const inverse = 1 - ambient.value;
    return {
      opacity: interpolate(inverse, [0, 1], [0.25, 0.55], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(
            inverse,
            [0, 1],
            [0.88, 1.02],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

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

  const barAAnimatedStyle = useAnimatedStyle(() => ({
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
          [1, 0.95],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const barBAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(
          activeProgress.value,
          [0, 1],
          [90, 135],
          Extrapolation.CLAMP,
        )}deg`,
      },
      {
        scale: interpolate(
          activeProgress.value,
          [0, 1],
          [1, 0.95],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View style={styles.createArea}>
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

      <Animated.View
        pointerEvents="none"
        style={[styles.createAuraInner, innerAuraAnimatedStyle]}
      >
        <LinearGradient
          colors={[
            "rgba(196,181,253,0.42)",
            "rgba(139,92,246,0.18)",
            "rgba(99,102,241,0)",
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[styles.createButtonShadow, buttonAnimatedStyle]}>
        <View pointerEvents="none" style={styles.burstContainer}>
          {BURST_ANGLES.map((angle) => (
            <BurstParticle key={angle} angle={angle} progress={burst} />
          ))}
        </View>

        <Pressable
          onPress={handlePress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityLabel={active ? "Fermer le menu de création" : "Créer"}
          accessibilityState={{ expanded: active }}
          hitSlop={8}
          android_ripple={{
            color: RIPPLE_COLOR_CREATE,
            borderless: true,
            radius: 32,
          }}
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
            <View pointerEvents="none" style={styles.createButtonInner} />

            <Animated.View
              pointerEvents="none"
              style={[styles.createButtonShine, shineAnimatedStyle]}
            />

            <Animated.View
              pointerEvents="none"
              style={[styles.createActiveRing, activeRingStyle]}
            />

            <View style={styles.plusContainer} pointerEvents="none">
              <Animated.View style={[styles.plusBar, barAAnimatedStyle]} />
              <Animated.View style={[styles.plusBar, barBAnimatedStyle]} />
            </View>
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
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const visibility = useSharedValue(hidden ? 0 : 1);

  useEffect(() => {
    if (reducedMotion) {
      visibility.value = hidden ? 0 : 1;
      return;
    }

    visibility.value = withSpring(hidden ? 0 : 1, {
      damping: 24,
      stiffness: 260,
      mass: 0.8,
    });
  }, [hidden, reducedMotion, visibility]);

  const flash = useSharedValue(0);
  const isFirstActiveRef = useRef(true);

  useEffect(() => {
    if (isFirstActiveRef.current) {
      isFirstActiveRef.current = false;
      return;
    }

    if (reducedMotion) {
      flash.value = 0;
      return;
    }

    flash.value = withSequence(
      withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 520, easing: Easing.in(Easing.cubic) }),
    );
  }, [active, flash, reducedMotion]);

  const topLightAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flash.value, [0, 1], [0.72, 1], Extrapolation.CLAMP),
  }));

  const bottomSignatureAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flash.value, [0, 1], [0.6, 1], Extrapolation.CLAMP),
    transform: [
      {
        scaleX: interpolate(flash.value, [0, 1], [1, 1.6], Extrapolation.CLAMP),
      },
    ],
  }));

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

  const bottomInset = Math.max(insets.bottom, 0);
  const dynamicPaddingBottom = 12 + bottomInset;

  return (
    <Animated.View
      pointerEvents={hidden ? "none" : "box-none"}
      accessibilityLabel="Navigation principale"
      style={[
        styles.root,
        { paddingBottom: dynamicPaddingBottom },
        rootAnimatedStyle,
      ]}
    >
      <View style={[styles.container, { maxWidth }]}>
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

        <View style={styles.shell}>
          {/* Background layer — clipped to rounded shell */}
          <View pointerEvents="none" style={styles.shellBackground}>
            {Platform.OS === "ios" ? (
              <BlurView
                intensity={50}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            ) : null}

            <LinearGradient
              colors={SHELL_GRADIENT_COLORS}
              locations={[0, 0.52, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>

          {/* Border overlay */}
          <View pointerEvents="none" style={styles.shellBorder} />

          {/* Top light — flash on tab change */}
          <Animated.View
            pointerEvents="none"
            style={[styles.topLight, topLightAnimatedStyle]}
          >
            <LinearGradient
              colors={[
                "rgba(255,255,255,0)",
                "rgba(255,255,255,0.22)",
                "rgba(167,139,250,0.34)",
                "rgba(255,255,255,0)",
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Content (not clipped — Create button can extend above) */}
          <View style={styles.contentRow}>
            <TabsGroup
              tabs={leftTabs}
              activeId={active}
              onSelect={handleChange}
            />

            <CreateButton
              active={active === "create"}
              onPress={() => handleChange("create")}
            />

            <TabsGroup
              tabs={rightTabs}
              activeId={active}
              onSelect={handleChange}
            />
          </View>

          {/* Bottom signature — flash on tab change */}
          <Animated.View
            pointerEvents="none"
            style={[styles.bottomSignature, bottomSignatureAnimatedStyle]}
          >
            <LinearGradient
              colors={[
                "rgba(139,92,246,0)",
                "rgba(167,139,250,0.72)",
                "rgba(139,92,246,0)",
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
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
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
    paddingHorizontal: 10,
  },

  container: {
    width: "100%",
    alignSelf: "center",
    position: "relative",
  },

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

  shell: {
    height: 76,
    borderRadius: 28,
    // Pas d'overflow: hidden → le bouton Create peut dépasser.
    // Pas de border ici → shellBorder la dessine.
    shadowColor: "#000",
    shadowOpacity: 0.42,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 15 },
    elevation: 18,
  },

  shellBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: "hidden",
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

  contentRow: {
    height: 76,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingBottom: 3,
  },

  tabsGroup: {
    flex: 1,
    minWidth: 0,
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    position: "relative",
  },

  slidingPill: {
    position: "absolute",
    left: PILL_INSET_X,
    top: PILL_TOP,
    width: 52,
    height: PILL_HEIGHT,
    borderRadius: PILL_RADIUS,
    overflow: "hidden",
  },

  slidingPillInnerLight: {
    position: "absolute",
    top: 0,
    left: 8,
    right: 8,
    height: 1,
    borderRadius: 1,
  },

  slidingPillBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: PILL_RADIUS,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },

  tabItemContainer: {
    width: 62,
    height: 66,
  },

  tabPressable: {
    position: "relative",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    overflow: "hidden",
  },

  iconContainer: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  tabLabel: {
    maxWidth: 58,
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

  createArea: {
    position: "relative",
    width: 76,
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

  createAuraInner: {
    position: "absolute",
    top: -2,
    left: "50%",
    width: 64,
    height: 64,
    marginLeft: -32,
    borderRadius: 22,
    overflow: "hidden",
  },

  createButtonShadow: {
    marginTop: -19,

    shadowColor: COLORS.violet,
    shadowOpacity: 0.55,
    shadowRadius: 23,
    shadowOffset: { width: 0, height: 12 },
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

  plusContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  plusBar: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 22,
    height: 2.5,
    marginTop: -1.25,
    marginLeft: -11,
    borderRadius: 1.25,
    backgroundColor: COLORS.white,
  },

  burstContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },

  burstParticle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C4B5FD",
    shadowColor: "#A78BFA",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});

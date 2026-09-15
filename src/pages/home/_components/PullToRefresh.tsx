// src/pages/home/_components/PullToRefresh.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RefreshCw, Sparkles } from "lucide-react-native";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

/* ============================================================================
 * CUSTOM REFRESH OVERLAY
 * ========================================================================== */

function RefreshOverlay({ active }: { active: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-14)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          stiffness: 340,
          damping: 26,
          useNativeDriver: true,
        }),
      ]).start();

      rotate.setValue(0);
      Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();

      pulse.setValue(0);
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
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -14,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [active, opacity, translateY, rotate, pulse]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.85],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.overlayWrapper,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.overlayCard}>
        <LinearGradient
          colors={[
            "rgba(167,139,250,0.22)",
            "rgba(15,7,32,0.85)",
            "rgba(10,6,24,0.95)",
          ]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.overlayBorder} pointerEvents="none" />

        {/* Pulsing glow behind */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.overlayGlow,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {/* Spinner */}
        <Animated.View
          style={[styles.spinnerWrap, { transform: [{ rotate: rotation }] }]}
        >
          <RefreshCw size={14} color="#C4B5FD" strokeWidth={2.4} />
        </Animated.View>

        {/* Text */}
        <Text style={styles.overlayText}>Actualisation…</Text>

        {/* Sparkle */}
        <Sparkles size={11} color="#A78BFA" strokeWidth={2.4} />
      </View>
    </Animated.View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function PullToRefresh({
  onRefresh,
  children,
  className,
}: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error("[PullToRefresh] Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  return (
    <View style={styles.root}>
      <ScrollView
        style={[styles.scrollView, className ? { flex: 1 } : undefined]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#A78BFA"
            colors={["#A78BFA", "#7C3AED"]}
            progressBackgroundColor="#0A0616"
            title="Tirer pour actualiser"
            titleColor="rgba(255,255,255,0.45)"
          />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        {children}
      </ScrollView>

      {/* Custom overlay on top when refreshing */}
      <RefreshOverlay active={refreshing} />
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
  },
  content: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  /* ── Overlay ────────────────────────────────────── */
  overlayWrapper: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 50,
  },
  overlayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  overlayBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.32)",
  },
  overlayGlow: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(167,139,250,0.35)",
    left: 12,
  },
  spinnerWrap: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },
});

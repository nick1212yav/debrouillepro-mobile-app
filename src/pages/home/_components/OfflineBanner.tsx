// src/pages/home/_components/OfflineBanner.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check, RefreshCw, Wifi, WifiOff } from "lucide-react-native";

// ── NetInfo (avec fallback si le package n'est pas installé) ────────────
let NetInfo: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  NetInfo =
    require("@react-native-community/netinfo").default ??
    require("@react-native-community/netinfo");
} catch {
  NetInfo = null;
}

type ConnectionState = "online" | "offline" | "reconnected";

const RECONNECTED_DISPLAY_MS = 2600;

function getInitialState(): ConnectionState {
  return "online";
}

function formatOfflineDuration(startedAt: number): string {
  const elapsed = Math.max(0, Date.now() - startedAt);
  const seconds = Math.floor(elapsed / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} h`;
  return `${hours} h ${remainingMinutes} min`;
}

/* ============================================================================
 * PULSING STATUS DOT
 * ========================================================================== */

function PulsingDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.6],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 0],
  });

  return (
    <View style={styles.dotWrap}>
      <Animated.View
        style={[
          styles.dotPulse,
          { backgroundColor: color, opacity, transform: [{ scale }] },
        ]}
      />
      <View
        style={[
          styles.dotCore,
          {
            backgroundColor: color,
            shadowColor: color,
          },
        ]}
      />
    </View>
  );
}

/* ============================================================================
 * SIGNAL WAVES (reconnected)
 * ========================================================================== */

function SignalWaves({ color }: { color: string }) {
  const waves = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    waves.forEach((wave, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(wave, {
            toValue: 1,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(wave, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.delay((2 - i) * 200),
        ]),
      ).start();
    });
  }, [waves]);

  return (
    <View style={styles.wavesWrap} pointerEvents="none">
      {waves.map((wave, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveRing,
            {
              borderColor: color,
              opacity: wave.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 0],
              }),
              transform: [
                {
                  scale: wave.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 2.2],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

/* ============================================================================
 * ANIMATED PROGRESS BAR
 * ========================================================================== */

function AnimatedProgressBar({
  active,
  color,
}: {
  active: boolean;
  color: string;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      progress.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    }
  }, [active, progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            width,
            backgroundColor: color,
            shadowColor: color,
          },
        ]}
      />
    </View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function OfflineBanner() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>(getInitialState);
  const [offlineDuration, setOfflineDuration] = useState("0s");

  const offlineStartedAt = useRef<number | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animations
  const offlineOpacity = useRef(new Animated.Value(0)).current;
  const offlineTranslate = useRef(new Animated.Value(24)).current;
  const offlineScale = useRef(new Animated.Value(0.96)).current;
  const reconnectedOpacity = useRef(new Animated.Value(0)).current;
  const reconnectedTranslate = useRef(new Animated.Value(20)).current;
  const reconnectedScale = useRef(new Animated.Value(0.96)).current;
  const retryRotate = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  }, []);

  const clearDurationTimer = useCallback(() => {
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }
  }, []);

  const startOfflineClock = useCallback(() => {
    offlineStartedAt.current = Date.now();
    setOfflineDuration("0s");
    clearDurationTimer();
    durationTimer.current = setInterval(() => {
      if (!offlineStartedAt.current) return;
      setOfflineDuration(formatOfflineDuration(offlineStartedAt.current));
    }, 1000);
  }, [clearDurationTimer]);

  const handleOffline = useCallback(() => {
    clearReconnectTimer();
    setConnectionState("offline");
    startOfflineClock();
  }, [clearReconnectTimer, startOfflineClock]);

  const handleOnline = useCallback(() => {
    clearReconnectTimer();
    clearDurationTimer();
    setConnectionState("reconnected");
    offlineStartedAt.current = null;
    reconnectTimer.current = setTimeout(() => {
      setConnectionState("online");
    }, RECONNECTED_DISPLAY_MS);
  }, [clearDurationTimer, clearReconnectTimer]);

  /* ───── NetInfo listener ───── */
  useEffect(() => {
    if (!NetInfo) {
      console.warn(
        "[OfflineBanner] @react-native-community/netinfo non installé.",
      );
      return;
    }

    const unsubscribe = NetInfo.addEventListener((state: any) => {
      if (state.isConnected === false) {
        handleOffline();
      } else if (state.isConnected === true) {
        handleOnline();
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
      clearReconnectTimer();
      clearDurationTimer();
    };
  }, [clearReconnectTimer, clearDurationTimer, handleOffline, handleOnline]);

  /* ───── Offline entrance ───── */
  useEffect(() => {
    if (connectionState === "offline") {
      offlineOpacity.setValue(0);
      offlineTranslate.setValue(24);
      offlineScale.setValue(0.96);

      Animated.parallel([
        Animated.timing(offlineOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(offlineTranslate, {
          toValue: 0,
          stiffness: 380,
          damping: 30,
          useNativeDriver: true,
        }),
        Animated.spring(offlineScale, {
          toValue: 1,
          stiffness: 380,
          damping: 30,
          useNativeDriver: true,
        }),
      ]).start();

      // Retry spinner rotation
      retryRotate.setValue(0);
      Animated.loop(
        Animated.timing(retryRotate, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    }
  }, [
    connectionState,
    offlineOpacity,
    offlineTranslate,
    offlineScale,
    retryRotate,
  ]);

  /* ───── Reconnected entrance ───── */
  useEffect(() => {
    if (connectionState === "reconnected") {
      reconnectedOpacity.setValue(0);
      reconnectedTranslate.setValue(20);
      reconnectedScale.setValue(0.96);
      checkScale.setValue(0);

      Animated.parallel([
        Animated.timing(reconnectedOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(reconnectedTranslate, {
          toValue: 0,
          stiffness: 400,
          damping: 30,
          useNativeDriver: true,
        }),
        Animated.spring(reconnectedScale, {
          toValue: 1,
          stiffness: 400,
          damping: 30,
          useNativeDriver: true,
        }),
        Animated.spring(checkScale, {
          toValue: 1,
          stiffness: 420,
          damping: 14,
          delay: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [
    connectionState,
    reconnectedOpacity,
    reconnectedTranslate,
    reconnectedScale,
    checkScale,
  ]);

  const handleRetry = useCallback(() => {
    // Petit feedback visuel : rotation complète du bouton
    retryRotate.setValue(0);
    Animated.timing(retryRotate, {
      toValue: 1,
      duration: 700,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    if (NetInfo?.fetch) {
      NetInfo.fetch().then((state: any) => {
        if (state.isConnected) handleOnline();
      });
    }
  }, [handleOnline, retryRotate]);

  const isOffline = connectionState === "offline";
  const isReconnected = connectionState === "reconnected";

  const retryRotation = retryRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View pointerEvents="box-none" style={styles.root}>
      {/* ═══════════ OFFLINE ═══════════ */}
      {isOffline ? (
        <Animated.View
          style={[
            styles.bannerWrapper,
            {
              opacity: offlineOpacity,
              transform: [
                { translateY: offlineTranslate },
                { scale: offlineScale },
              ],
            },
          ]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <View style={styles.offlineBanner}>
            {/* Base gradient */}
            <LinearGradient
              colors={[
                "rgba(239,68,68,0.18)",
                "rgba(15,7,20,0.9)",
                "rgba(10,6,15,0.98)",
              ]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Top accent bar */}
            <LinearGradient
              colors={["#EF4444", "#F87171", "#FB923C"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.offlineTopBar}
            />

            {/* Corner orb */}
            <View style={styles.offlineOrb} pointerEvents="none" />

            {/* Border ring */}
            <View style={styles.offlineBorder} pointerEvents="none" />

            <View style={styles.bannerContent}>
              {/* Icon with halo */}
              <View style={styles.iconOuter}>
                <View style={styles.offlineIconHalo} pointerEvents="none" />
                <LinearGradient
                  colors={["rgba(248,113,113,0.28)", "rgba(239,68,68,0.1)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconInner}
                >
                  <WifiOff size={19} color="#FCA5A5" strokeWidth={2.4} />
                </LinearGradient>
              </View>

              {/* Text */}
              <View style={styles.textColumn}>
                <View style={styles.titleRow}>
                  <Text style={styles.titleText}>Vous êtes hors ligne</Text>
                  <PulsingDot color="#F87171" />
                </View>
                <Text style={styles.bodyText}>
                  Les fonctionnalités nécessitant Internet peuvent être
                  temporairement indisponibles.
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabelRed}>HORS LIGNE</Text>
                  <View style={styles.metaSeparator} />
                  <Text style={styles.metaValue}>{offlineDuration}</Text>
                </View>
              </View>

              {/* Retry button */}
              <Pressable
                onPress={handleRetry}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.retryButtonPressed,
                ]}
                accessibilityLabel="Vérifier la connexion"
              >
                <Animated.View
                  style={{ transform: [{ rotate: retryRotation }] }}
                >
                  <RefreshCw
                    size={16}
                    color="rgba(255,255,255,0.7)"
                    strokeWidth={2.3}
                  />
                </Animated.View>
              </Pressable>
            </View>

            {/* Animated progress bar */}
            <AnimatedProgressBar active={isOffline} color="#F87171" />
          </View>
        </Animated.View>
      ) : null}

      {/* ═══════════ RECONNECTED ═══════════ */}
      {isReconnected ? (
        <Animated.View
          style={[
            styles.bannerWrapper,
            {
              opacity: reconnectedOpacity,
              transform: [
                { translateY: reconnectedTranslate },
                { scale: reconnectedScale },
              ],
            },
          ]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <View style={styles.reconnectedBanner}>
            {/* Base gradient */}
            <LinearGradient
              colors={[
                "rgba(52,211,153,0.2)",
                "rgba(15,20,17,0.9)",
                "rgba(10,15,12,0.98)",
              ]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Top accent bar */}
            <LinearGradient
              colors={["#34D399", "#6EE7B7", "#A7F3D0"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.reconnectedTopBar}
            />

            {/* Corner orb */}
            <View style={styles.reconnectedOrb} pointerEvents="none" />

            {/* Border ring */}
            <View style={styles.reconnectedBorder} pointerEvents="none" />

            <View style={styles.bannerContent}>
              {/* Icon with signal waves */}
              <View style={styles.iconOuter}>
                <SignalWaves color="#34D399" />
                <LinearGradient
                  colors={["rgba(52,211,153,0.32)", "rgba(16,185,129,0.12)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconInner}
                >
                  <Wifi size={19} color="#6EE7B7" strokeWidth={2.4} />
                </LinearGradient>
              </View>

              {/* Text */}
              <View style={styles.textColumn}>
                <Text style={styles.titleText}>Connexion rétablie</Text>
                <Text style={styles.bodyText}>
                  DébrouillePro est de nouveau connecté.
                </Text>
              </View>

              {/* Check circle */}
              <Animated.View
                style={[
                  styles.checkCircle,
                  { transform: [{ scale: checkScale }] },
                ]}
              >
                <LinearGradient
                  colors={["rgba(52,211,153,0.35)", "rgba(16,185,129,0.14)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Check size={14} color="#6EE7B7" strokeWidth={3} />
              </Animated.View>
            </View>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    pointerEvents: "box-none",
    zIndex: 100,
  },
  bannerWrapper: {
    width: "100%",
    maxWidth: 420,
  },

  /* ── Shared dot ─────────────────────────────────── */
  dotWrap: {
    width: 8,
    height: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dotPulse: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  /* ── Signal waves ───────────────────────────────── */
  wavesWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  waveRing: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
  },

  /* ── Offline ────────────────────────────────────── */
  offlineBanner: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#0A0610",
    shadowColor: "#EF4444",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  offlineTopBar: {
    height: 2,
    width: "100%",
  },
  offlineBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.24)",
  },
  offlineOrb: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 9999,
    backgroundColor: "rgba(239,68,68,0.22)",
  },

  /* ── Reconnected ────────────────────────────────── */
  reconnectedBanner: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#0A0F0C",
    shadowColor: "#10B981",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  reconnectedTopBar: {
    height: 2,
    width: "100%",
  },
  reconnectedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.24)",
  },
  reconnectedOrb: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 9999,
    backgroundColor: "rgba(16,185,129,0.22)",
  },

  /* ── Layout ─────────────────────────────────────── */
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
  },
  iconOuter: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  offlineIconHalo: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: "rgba(248,113,113,0.28)",
  },
  iconInner: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  bodyText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  metaLabelRed: {
    color: "rgba(252,165,165,0.7)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  metaSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  metaValue: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  retryButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  retryButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.9 }],
  },

  /* ── Check circle ───────────────────────────────── */
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.35)",
    shadowColor: "#10B981",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },

  /* ── Progress bar ───────────────────────────────── */
  progressTrack: {
    marginHorizontal: 14,
    marginBottom: 12,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});

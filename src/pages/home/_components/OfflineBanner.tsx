// src/pages/home/_components/OfflineBanner.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { Check, RefreshCw, Wifi, WifiOff } from "lucide-react-native";

type ConnectionState = "online" | "offline" | "reconnected";

const RECONNECTED_DISPLAY_MS = 2600;

function formatOfflineDuration(startedAt: number): string {
  const elapsed = Math.max(0, Date.now() - startedAt);
  const seconds = Math.floor(elapsed / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
}

function isConnectionAvailable(state: {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}): boolean {
  if (state.isConnected !== true) {
    return false;
  }

  return state.isInternetReachable !== false;
}

export default function OfflineBanner() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("online");

  const [offlineDuration, setOfflineDuration] = useState("0s");

  const offlineStartedAtRef = useRef<number | null>(null);
  const connectionInitializedRef = useRef(false);
  const wasOfflineRef = useRef(false);

  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const offlineOpacity = useRef(new Animated.Value(0)).current;
  const offlineTranslateY = useRef(new Animated.Value(24)).current;
  const offlineScale = useRef(new Animated.Value(0.96)).current;

  const reconnectedOpacity = useRef(new Animated.Value(0)).current;
  const reconnectedTranslateY = useRef(new Animated.Value(20)).current;
  const reconnectedScale = useRef(new Animated.Value(0.96)).current;

  const iconPulse = useRef(new Animated.Value(1)).current;
  const progressTranslate = useRef(new Animated.Value(-120)).current;

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const clearDurationTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  const startOfflineClock = useCallback(() => {
    const startedAt = Date.now();

    offlineStartedAtRef.current = startedAt;
    setOfflineDuration("0s");

    clearDurationTimer();

    durationTimerRef.current = setInterval(() => {
      const currentStartedAt = offlineStartedAtRef.current;

      if (!currentStartedAt) {
        return;
      }

      setOfflineDuration(formatOfflineDuration(currentStartedAt));
    }, 1000);
  }, [clearDurationTimer]);

  const startOfflineAnimations = useCallback(() => {
    offlineOpacity.setValue(0);
    offlineTranslateY.setValue(24);
    offlineScale.setValue(0.96);

    Animated.parallel([
      Animated.timing(offlineOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      Animated.spring(offlineTranslateY, {
        toValue: 0,
        stiffness: 380,
        damping: 30,
        mass: 0.8,
        useNativeDriver: true,
      }),

      Animated.spring(offlineScale, {
        toValue: 1,
        stiffness: 380,
        damping: 30,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();

    iconPulse.setValue(1);

    Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1.08,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    progressTranslate.setValue(-120);

    Animated.loop(
      Animated.timing(progressTranslate, {
        toValue: 360,
        duration: 2200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, [
    iconPulse,
    offlineOpacity,
    offlineScale,
    offlineTranslateY,
    progressTranslate,
  ]);

  const startReconnectedAnimation = useCallback(() => {
    reconnectedOpacity.setValue(0);
    reconnectedTranslateY.setValue(20);
    reconnectedScale.setValue(0.96);

    Animated.parallel([
      Animated.timing(reconnectedOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      Animated.spring(reconnectedTranslateY, {
        toValue: 0,
        stiffness: 400,
        damping: 30,
        useNativeDriver: true,
      }),

      Animated.spring(reconnectedScale, {
        toValue: 1,
        stiffness: 400,
        damping: 22,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reconnectedOpacity, reconnectedScale, reconnectedTranslateY]);

  const handleOffline = useCallback(() => {
    clearReconnectTimer();

    setConnectionState("offline");
    wasOfflineRef.current = true;

    if (!offlineStartedAtRef.current) {
      startOfflineClock();
    }
  }, [clearReconnectTimer, startOfflineClock]);

  const handleOnline = useCallback(() => {
    clearReconnectTimer();
    clearDurationTimer();

    offlineStartedAtRef.current = null;

    if (!wasOfflineRef.current) {
      setConnectionState("online");
      return;
    }

    setConnectionState("reconnected");

    reconnectTimerRef.current = setTimeout(() => {
      setConnectionState("online");
      wasOfflineRef.current = false;
      reconnectTimerRef.current = null;
    }, RECONNECTED_DISPLAY_MS);
  }, [clearDurationTimer, clearReconnectTimer]);

  useEffect(() => {
    if (connectionState === "offline") {
      startOfflineAnimations();
    }
  }, [connectionState, startOfflineAnimations]);

  useEffect(() => {
    if (connectionState === "reconnected") {
      startReconnectedAnimation();
    }
  }, [connectionState, startReconnectedAnimation]);

  useEffect(() => {
    let mounted = true;

    const updateConnectionState = (state: {
      isConnected: boolean | null;
      isInternetReachable: boolean | null;
    }) => {
      if (!mounted) {
        return;
      }

      const connected = isConnectionAvailable(state);

      if (!connectionInitializedRef.current) {
        connectionInitializedRef.current = true;

        if (connected) {
          setConnectionState("online");
          return;
        }

        wasOfflineRef.current = true;
        setConnectionState("offline");
        startOfflineClock();

        return;
      }

      if (connected) {
        handleOnline();
      } else {
        handleOffline();
      }
    };

    void NetInfo.fetch().then(updateConnectionState);

    const unsubscribe = NetInfo.addEventListener(updateConnectionState);

    return () => {
      mounted = false;

      unsubscribe();

      clearReconnectTimer();
      clearDurationTimer();

      offlineOpacity.stopAnimation();
      offlineTranslateY.stopAnimation();
      offlineScale.stopAnimation();

      reconnectedOpacity.stopAnimation();
      reconnectedTranslateY.stopAnimation();
      reconnectedScale.stopAnimation();

      iconPulse.stopAnimation();
      progressTranslate.stopAnimation();
    };
  }, [
    clearDurationTimer,
    clearReconnectTimer,
    handleOffline,
    handleOnline,
    iconPulse,
    offlineOpacity,
    offlineScale,
    offlineTranslateY,
    progressTranslate,
    reconnectedOpacity,
    reconnectedScale,
    reconnectedTranslateY,
    startOfflineClock,
  ]);

  const handleRetry = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();

      if (isConnectionAvailable(state)) {
        handleOnline();
        return;
      }

      if (offlineStartedAtRef.current) {
        setOfflineDuration(formatOfflineDuration(offlineStartedAtRef.current));
      }
    } catch {
      // La bannière reste en état hors ligne.
    }
  }, [handleOnline]);

  const isOffline = connectionState === "offline";
  const isReconnected = connectionState === "reconnected";

  if (!isOffline && !isReconnected) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={styles.container}
      accessibilityLiveRegion="polite"
    >
      {isOffline && (
        <Animated.View
          accessibilityRole="alert"
          style={[
            styles.banner,
            styles.offlineBanner,
            {
              opacity: offlineOpacity,
              transform: [
                {
                  translateY: offlineTranslateY,
                },
                {
                  scale: offlineScale,
                },
              ],
            },
          ]}
        >
          <View style={styles.offlineContent}>
            <Animated.View
              style={[
                styles.iconContainer,
                styles.offlineIconContainer,
                {
                  transform: [
                    {
                      scale: iconPulse,
                    },
                  ],
                },
              ]}
            >
              <WifiOff size={20} strokeWidth={2.1} color="#fca5a5" />
            </Animated.View>

            <View style={styles.messageContainer}>
              <View style={styles.titleRow}>
                <Text numberOfLines={1} style={styles.title}>
                  Vous êtes hors ligne
                </Text>

                <View style={styles.offlineDot} />
              </View>

              <Text style={styles.description}>
                Les fonctionnalités nécessitant Internet peuvent être
                temporairement indisponibles.
              </Text>

              <View style={styles.statusRow}>
                <Text style={styles.offlineLabel}>Hors ligne</Text>

                <View style={styles.separatorDot} />

                <Text style={styles.durationText}>{offlineDuration}</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Vérifier la connexion"
              onPress={() => {
                void handleRetry();
              }}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
            >
              <RefreshCw size={17} color="rgba(255,255,255,0.65)" />
            </Pressable>
          </View>

          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressIndicator,
                {
                  transform: [
                    {
                      translateX: progressTranslate,
                    },
                  ],
                },
              ]}
            />
          </View>
        </Animated.View>
      )}

      {isReconnected && (
        <Animated.View
          accessibilityRole="alert"
          style={[
            styles.banner,
            styles.reconnectedBanner,
            {
              opacity: reconnectedOpacity,
              transform: [
                {
                  translateY: reconnectedTranslateY,
                },
                {
                  scale: reconnectedScale,
                },
              ],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Wifi size={20} strokeWidth={2.1} color="#6ee7b7" />
          </View>

          <View style={styles.messageContainer}>
            <Text style={styles.title}>Connexion rétablie</Text>

            <Text style={styles.description}>
              DébrouillePro est de nouveau connecté.
            </Text>
          </View>

          <View style={styles.successIcon}>
            <Check size={15} strokeWidth={3} color="#6ee7b7" />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    zIndex: 100,
    elevation: 100,
  },

  banner: {
    width: "100%",
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,

    shadowColor: "#000",
    shadowOpacity: 0.42,
    shadowRadius: 30,
    shadowOffset: {
      width: 0,
      height: 16,
    },

    elevation: 18,
  },

  offlineBanner: {
    backgroundColor: "#11121e",
    borderColor: "rgba(248,113,113,0.22)",
  },

  reconnectedBanner: {
    backgroundColor: "#081412",
    borderColor: "rgba(52,211,153,0.22)",

    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  offlineContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(52,211,153,0.10)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.20)",
  },

  offlineIconContainer: {
    backgroundColor: "rgba(248,113,113,0.10)",
    borderColor: "rgba(248,113,113,0.20)",
  },

  messageContainer: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  title: {
    flexShrink: 1,

    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,

    backgroundColor: "#f87171",
  },

  description: {
    marginTop: 3,

    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    lineHeight: 16,
  },

  statusRow: {
    marginTop: 6,

    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  offlineLabel: {
    color: "rgba(252,165,165,0.75)",

    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,

    textTransform: "uppercase",
  },

  separatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,

    backgroundColor: "rgba(255,255,255,0.18)",
  },

  durationText: {
    color: "rgba(255,255,255,0.35)",

    fontSize: 10,
    fontWeight: "500",
  },

  retryButton: {
    width: 40,
    height: 40,
    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  retryButtonPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.94,
      },
    ],
  },

  progressTrack: {
    height: 2,

    marginTop: 12,

    overflow: "hidden",
    borderRadius: 999,

    backgroundColor: "rgba(255,255,255,0.06)",
  },

  progressIndicator: {
    width: "34%",
    height: "100%",
    borderRadius: 999,

    backgroundColor: "rgba(248,113,113,0.65)",
  },

  successIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(52,211,153,0.15)",
  },
});

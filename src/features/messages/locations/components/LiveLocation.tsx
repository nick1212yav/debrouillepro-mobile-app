// src/features/messages/locations/components/LiveLocation.tsx

import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Id } from "../../../../../convex/_generated/dataModel";

import { useLocation, useLiveLocation } from "../hooks/useLocation";
import { formatLiveDuration } from "../services/locations.service";

export interface LiveLocationProps {
  messageId: Id<"messages"> | undefined;
  onStopped?: () => void;
}

export function LiveLocation({ messageId, onStopped }: LiveLocationProps) {
  const liveMessage = useLiveLocation(messageId);

  const {
    currentPosition,
    startWatching,
    stopWatching,
    updateLiveLocation,
    stopLiveLocation,
  } = useLocation();

  const [elapsed, setElapsed] = useState(0);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!messageId) {
      return;
    }

    startWatching();

    return () => {
      stopWatching();
    };
  }, [messageId, startWatching, stopWatching]);

  useEffect(() => {
    if (!messageId || !currentPosition) {
      return;
    }

    const now = Date.now();

    if (now - lastUpdateRef.current < 3000) {
      return;
    }

    lastUpdateRef.current = now;

    void updateLiveLocation({
      messageId,
      coordinates: currentPosition,
    });
  }, [messageId, currentPosition, updateLiveLocation]);

  useEffect(() => {
    const startedAt = liveMessage?.metadata?.startedAt;

    if (!startedAt) {
      return;
    }

    const update = () => {
      setElapsed(Math.max(0, (Date.now() - startedAt) / 1000));
    };

    update();

    const interval = setInterval(update, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [liveMessage?.metadata?.startedAt]);

  if (!messageId) {
    return null;
  }

  const metadata = liveMessage?.metadata;
  const active = metadata?.isActive ?? false;
  const expiresAt = metadata?.expiresAt;

  const expired = expiresAt !== undefined && Date.now() >= expiresAt;

  const isLive = active && !expired;

  const handleStop = async () => {
    await stopLiveLocation({ messageId });
    onStopped?.();
  };

  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel={
        isLive ? "Position en direct active" : "Partage de position terminé"
      }
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>📡 Position en direct</Text>

          <Text style={styles.subtitle}>
            {isLive
              ? `Active depuis ${formatLiveDuration(elapsed)}`
              : "Partage terminé"}
          </Text>
        </View>

        {isLive ? (
          <View
            style={styles.liveIndicator}
            accessibilityLabel="Position en direct active"
          >
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>LIVE</Text>
          </View>
        ) : null}
      </View>

      {metadata ? (
        <View style={styles.coordinatesCard}>
          <Text style={styles.coordinatesLabel}>Position actuelle</Text>

          <Text style={styles.coords}>
            {metadata.latitude.toFixed(6)}
            {" · "}
            {metadata.longitude.toFixed(6)}
          </Text>

          {metadata.accuracy !== undefined ? (
            <Text style={styles.accuracy}>
              Précision ±{Math.round(metadata.accuracy)} m
            </Text>
          ) : null}
        </View>
      ) : null}

      {isLive ? (
        <Pressable
          onPress={() => void handleStop()}
          accessibilityRole="button"
          accessibilityLabel="Arrêter le partage de position"
          style={({ pressed }) => [
            styles.stopButton,
            pressed && styles.stopButtonPressed,
          ]}
        >
          <Text style={styles.stopButtonText}>🛑 Arrêter le partage</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.22)",
    borderRadius: 14,
    backgroundColor: "rgba(30,58,138,0.22)",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },

  subtitle: {
    marginTop: 3,
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },

  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.12)",
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },

  liveLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#4ade80",
  },

  coordinatesCard: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.12)",
  },

  coordinatesLabel: {
    marginBottom: 3,
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.40)",
  },

  coords: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.72)",
  },

  accuracy: {
    marginTop: 3,
    fontSize: 10,
    color: "rgba(255,255,255,0.42)",
  },

  stopButton: {
    width: "100%",
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.20)",
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.10)",
  },

  stopButtonPressed: {
    opacity: 0.78,
  },

  stopButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#f87171",
  },
});

export default LiveLocation;

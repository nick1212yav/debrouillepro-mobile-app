import { Pressable, View, Text } from "react-native";
// src/features/messages/locations/components/LiveLocation.tsx

import { useEffect, useRef, useState } from "react";

import type { Id } from "../../../../../convex/_generated/dataModel";

import { formatLiveDuration } from "../services/locations.service";

import { useLocation, useLiveLocation } from "../hooks/useLocation";
import { usePathname } from "expo-router";

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
  } = usePathname();

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

  /**
   * Envoie les nouvelles coordonnées
   * au backend au maximum toutes les 3 secondes.
   */
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

  /**
   * Compteur local.
   */
  useEffect(() => {
    const startedAt = liveMessage?.metadata?.startedAt;

    if (!startedAt) {
      return;
    }

    const update = () => {
      setElapsed(Math.max(0, (Date.now() - startedAt) / 1000));
    };

    update();

    const interval = undefined;

    return () => undefined;
  }, [liveMessage?.metadata?.startedAt]);

  if (!messageId) {
    return null;
  }

  const metadata = liveMessage?.metadata;

  const active = metadata?.isActive ?? false;

  const expiresAt = metadata?.expiresAt;

  const expired = expiresAt !== undefined && Date.now() >= expiresAt;

  const handleStop = async () => {
    await stopLiveLocation({
      messageId,
    });

    onStopped?.();
  };

  return (
    <View
      style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: "#bfdbfe", borderStyle: "solid", backgroundColor: "#eff6ff" }}
    >
      <View
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <View>
          <View
            style={{  }}
          >
            <Text>📡 Position en direct</Text></View>

          <View
            style={{ marginTop: 3 }}
          >
            {active && !expired
              ? `Active depuis ${formatLiveDuration(elapsed)}`
              : "Partage terminé"}
          </View>
        </View>

        {active && !expired && (
          <Text
            style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: "#22c55e" }}
          />
        )}
      </View>

      {metadata && (
        <View
          style={{  }}
        >
          {metadata.latitude.toFixed(6)}
          {" · "}
          {metadata.longitude.toFixed(6)}

          {metadata.accuracy !== undefined && (
            <>
              {" · précision ±"}
              {Math.round(metadata.accuracy)}<Text>m</Text></>
          )}
        </View>
      )}

      {active && !expired && (
        <Pressable
          onPress={() => void handleStop()}
          style={{ width: "100%", paddingVertical: 9, paddingHorizontal: 12, borderWidth: 0, borderRadius: 10, backgroundColor: "#fff" }}
        >
          <Text>🛑 Arrêter le partage</Text></Pressable>
      )}
    </View>
  );
}

export default LiveLocation;

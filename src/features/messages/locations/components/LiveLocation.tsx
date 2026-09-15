import { View, Text, Pressable } from "react-native";

// src/features/messages/locations/components/LiveLocation.tsx

import { useEffect, useRef, useState } from "react";

import type { Id } from "../../../../../convex/_generated/dataModel";

import { formatLiveDuration } from "../services/locations.service";

import { useLocation, useLiveLocation } from "../hooks/useLocation";

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

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
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
    <View style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: "#bfdbfe", borderStyle: "solid", backgroundColor: "#eff6ff" }}><View style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}><View><View style={{ fontWeight: 800, fontSize: 13 }}><Text>📡 Position en direct</Text></View><View style={{ marginTop: 3, fontSize: 11 }}>{active && !expired
              ? `Active depuis ${formatLiveDuration(elapsed)}`
              : "Partage terminé"}</View></View>{active && !expired && (
          <Text style={{ width: 9, height: 9, borderRadius: 50, backgroundColor: "#22c55e", boxShadow: "0 0 0 4px rgba(34,197,94,.15)" }} />
        )}</View>{metadata && (
        <View style={{ fontSize: 11 }}>
          {metadata.latitude.toFixed(6)}
          {" · "}
          {metadata.longitude.toFixed(6)}

          {metadata.accuracy !== undefined && (
            <>
              {" · précision ±"}
              {Math.round(metadata.accuracy)}m
            </>
          )}
        </View>
      )}{active && !expired && (
        <Pressable onPress={() => void handleStop()} style={{ width: "100%", paddingVertical: 9, paddingHorizontal: 12, borderWidth: 0, borderRadius: 10, backgroundColor: "#fff", fontWeight: 800, fontSize: 12 }}>
          🛑 Arrêter le partage
        </Pressable>
      )}</View>
  );
}

export default LiveLocation;

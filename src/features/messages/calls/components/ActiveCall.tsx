// src/features/messages/calls/components/ActiveCall.tsx

import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import type { Id } from "@/convex/_generated/dataModel";

import { useCall } from "../hooks/useCall";
import { useWebRTC } from "../hooks/useWebRTC";
import { CallControls } from "./CallControls";
import { VideoGrid } from "./VideoGrid";

interface ActiveCallProps {
  callId: Id<"calls">;
  onEnded?: () => void;
}

export function ActiveCall({ callId, onEnded }: ActiveCallProps) {
  const { call, endCall } = useCall({
    callId,
  });

  const type = call?.type ?? "audio";
  const isVideoCall = type === "video";

  const {
    localStream,
    remoteStream,
    startLocalStream,
    toggleMicrophone,
    toggleCamera,
    stop,
    isConnected,
    isConnecting,
  } = useWebRTC(type);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(isVideoCall);

  const [isEnding, setIsEnding] = useState(false);

  /*
   * Initialise le flux local uniquement lorsque l'appel
   * existe réellement.
   */
  useEffect(() => {
    if (!call) {
      return;
    }

    let cancelled = false;

    const start = async () => {
      try {
        await startLocalStream();

        if (cancelled) {
          stop();
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "[ActiveCall] Impossible de démarrer le flux local:",
            error,
          );
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [call, startLocalStream, stop]);

  const handleToggleMute = useCallback(() => {
    try {
      const enabled = toggleMicrophone();

      setIsMuted(!enabled);
    } catch (error) {
      console.error("[ActiveCall] Erreur microphone:", error);
    }
  }, [toggleMicrophone]);

  const handleToggleCamera = useCallback(() => {
    if (!isVideoCall) {
      return;
    }

    try {
      const enabled = toggleCamera();

      setIsCameraEnabled(enabled);
    } catch (error) {
      console.error("[ActiveCall] Erreur caméra:", error);
    }
  }, [isVideoCall, toggleCamera]);

  const handleEnd = useCallback(async () => {
    if (isEnding) {
      return;
    }

    setIsEnding(true);

    try {
      await endCall(callId);
    } catch (error) {
      console.error("[ActiveCall] Erreur lors de la fin de l'appel:", error);
    } finally {
      stop();
      onEnded?.();
      setIsEnding(false);
    }
  }, [callId, endCall, isEnding, onEnded, stop]);

  /*
   * État de chargement avant que Convex retourne l'appel.
   */
  if (!call) {
    return (
      <View
        style={styles.loadingContainer}
        accessibilityLabel="Chargement de l'appel"
      >
        <View style={styles.loadingIcon}>
          <ActivityIndicator size="small" color="#A5B4FC" />
        </View>

        <Text style={styles.loadingTitle}>Chargement de l'appel</Text>

        <Text style={styles.loadingSubtitle}>
          Préparation de la connexion...
        </Text>
      </View>
    );
  }

  const statusLabel = isConnected
    ? "Connecté"
    : isConnecting
      ? "Connexion..."
      : "En attente";

  const statusColor = isConnected
    ? "#4ADE80"
    : isConnecting
      ? "#FBBF24"
      : "#A1A1AA";

  return (
    <View
      style={styles.container}
      accessibilityViewIsModal
      accessibilityLabel={`Appel ${isVideoCall ? "vidéo" : "audio"}`}
    >
      {/* ==================================================================
          HEADER
         ================================================================== */}

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={1}>
            {isVideoCall ? "Appel vidéo" : "Appel audio"}
          </Text>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: statusColor,
                },
              ]}
            />

            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        {isEnding ? <ActivityIndicator size="small" color="#A5B4FC" /> : null}
      </View>

      {/* ==================================================================
          MEDIA
         ================================================================== */}

      <View style={styles.mediaArea}>
        {isVideoCall ? (
          <VideoGrid localStream={localStream} remoteStream={remoteStream} />
        ) : (
          <View style={styles.audioArea}>
            <View style={styles.audioAvatarOuter}>
              <View style={styles.audioAvatarInner}>
                <Text style={styles.audioIcon}>☎</Text>
              </View>
            </View>

            <Text style={styles.audioTitle}>
              {isConnected ? "Communication en cours" : "Appel audio"}
            </Text>

            <Text style={styles.audioStatus}>{statusLabel}</Text>
          </View>
        )}
      </View>

      {/* ==================================================================
          CONTROLS
         ================================================================== */}

      <View style={styles.controlsContainer}>
        <CallControls
          isMuted={isMuted}
          isCameraEnabled={isCameraEnabled}
          isVideoCall={isVideoCall}
          onToggleMute={handleToggleMute}
          onToggleCamera={handleToggleCamera}
          onEnd={() => void handleEnd()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minHeight: 500,
    flex: 1,

    overflow: "hidden",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,

    backgroundColor: "#07070B",
  },

  loadingContainer: {
    width: "100%",
    minHeight: 300,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 24,
    paddingVertical: 32,

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,

    backgroundColor: "#07070B",
  },

  loadingIcon: {
    width: 52,
    height: 52,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 16,

    borderRadius: 26,

    backgroundColor: "rgba(129,140,248,0.12)",
  },

  loadingTitle: {
    fontSize: 15,
    lineHeight: 20,

    fontWeight: "700",

    color: "#FFFFFF",
  },

  loadingSubtitle: {
    marginTop: 5,

    fontSize: 12,
    lineHeight: 17,

    color: "rgba(255,255,255,0.42)",
  },

  header: {
    width: "100%",
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 18,
    paddingVertical: 12,

    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.09)",

    backgroundColor: "#0B0B10",
  },

  headerContent: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: 15,
    lineHeight: 20,

    fontWeight: "700",

    color: "#FFFFFF",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 4,
  },

  statusDot: {
    width: 6,
    height: 6,

    marginRight: 6,

    borderRadius: 3,
  },

  statusText: {
    fontSize: 11,
    lineHeight: 15,

    color: "rgba(255,255,255,0.46)",
  },

  mediaArea: {
    flex: 1,
    minHeight: 320,

    overflow: "hidden",

    backgroundColor: "#030305",
  },

  audioArea: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 24,
  },

  audioAvatarOuter: {
    width: 144,
    height: 144,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.20)",
    borderRadius: 72,

    backgroundColor: "rgba(99,102,241,0.07)",
  },

  audioAvatarInner: {
    width: 104,
    height: 104,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 52,

    backgroundColor: "rgba(99,102,241,0.16)",
  },

  audioIcon: {
    fontSize: 36,
    lineHeight: 44,

    color: "#A5B4FC",
  },

  audioTitle: {
    marginTop: 24,

    fontSize: 17,
    lineHeight: 22,

    fontWeight: "700",

    textAlign: "center",

    color: "#FFFFFF",
  },

  audioStatus: {
    marginTop: 6,

    fontSize: 12,
    lineHeight: 17,

    color: "rgba(255,255,255,0.44)",
  },

  controlsContainer: {
    width: "100%",

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,

    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.09)",

    backgroundColor: "#0B0B10",
  },
});

export default ActiveCall;

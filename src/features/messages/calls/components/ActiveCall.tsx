import { useEffect, useState } from "react";
import { Text, View } from "react-native";

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
  const { call, endCall } = useCall({ callId });

  const type = call?.type ?? "audio";

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
  const [isCameraEnabled, setIsCameraEnabled] = useState(type === "video");

  useEffect(() => {
    void startLocalStream().catch(console.error);

    return () => {
      stop();
    };
  }, [startLocalStream, stop]);

  const handleToggleMute = () => {
    const enabled = toggleMicrophone();
    setIsMuted(!enabled);
  };

  const handleToggleCamera = () => {
    const enabled = toggleCamera();
    setIsCameraEnabled(enabled);
  };

  const handleEnd = async () => {
    try {
      await endCall(callId);
    } finally {
      stop();
      onEnded?.();
    }
  };

  if (!call) {
    return (
      <View className="min-h-[300px] items-center justify-center rounded-2xl bg-zinc-950">
        <Text className="text-sm text-white/50">Chargement de l'appel...</Text>
      </View>
    );
  }

  const statusLabel = isConnected
    ? "Connecté"
    : isConnecting
      ? "Connexion..."
      : "En attente";

  return (
    <View className="min-h-[500px] flex-1 overflow-hidden rounded-2xl bg-zinc-950">
      <View className="flex-row items-center justify-between border-b border-white/10 px-5 py-4">
        <View className="min-w-0 flex-1">
          <Text className="font-semibold text-white">
            {call.type === "video" ? "Appel vidéo" : "Appel audio"}
          </Text>

          <Text className="mt-1 text-xs text-white/50">{statusLabel}</Text>
        </View>
      </View>

      <View className="flex-1 p-4">
        {type === "video" ? (
          <VideoGrid localStream={localStream} remoteStream={remoteStream} />
        ) : (
          <View className="min-h-[320px] flex-1 items-center justify-center">
            <View className="h-32 w-32 items-center justify-center rounded-full bg-white/10">
              <Text className="text-5xl">📞</Text>
            </View>
          </View>
        )}
      </View>

      <View className="border-t border-white/10 p-5">
        <CallControls
          isMuted={isMuted}
          isCameraEnabled={isCameraEnabled}
          isVideoCall={type === "video"}
          onToggleMute={handleToggleMute}
          onToggleCamera={handleToggleCamera}
          onEnd={handleEnd}
        />
      </View>
    </View>
  );
}

export default ActiveCall;

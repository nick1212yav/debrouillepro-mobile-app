import { View, Text } from "react-native";
import { useEffect, useState } from "react";

import { useCall } from "../hooks/useCall";
import { useWebRTC } from "../hooks/useWebRTC";
import { CallControls } from "./CallControls";
import { VideoGrid } from "./VideoGrid";

import type { Id } from "@/convex/_generated/dataModel";

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
      <View className="flex min-h-[300px] items-center justify-center rounded-2xl bg-zinc-950 text-white/50"><Text>Chargement de l'appel...</Text></View>
    );
  }

  return (
    <View className="flex min-h-[500px] flex-col overflow-hidden rounded-2xl bg-zinc-950"><View className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white"><View><Text className="font-semibold">{call.type === "video" ? "Appel vidéo" : "Appel audio"}</Text><Text className="text-xs text-white/50">{isConnected
              ? "Connecté"
              : isConnecting
                ? "Connexion..."
                : "En attente"}</Text></View></View><View className="flex-1 p-4">{type === "video" ? (
          <VideoGrid localStream={localStream} remoteStream={remoteStream} />
        ) : (
          <View className="flex h-full min-h-[320px] items-center justify-center"><View className="flex h-32 w-32 items-center justify-center rounded-full bg-white/10 text-5xl"><Text>📞</Text></View></View>
        )}</View><View className="border-t border-white/10 p-5"><CallControls isMuted={isMuted} isCameraEnabled={isCameraEnabled} isVideoCall={type === "video"} onToggleMute={handleToggleMute} onToggleCamera={handleToggleCamera} onEnd={handleEnd} /></View></View>
  );
}

export default ActiveCall;

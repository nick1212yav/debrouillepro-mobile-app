import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";
// src/features/marketplace/components/SellerVideoCall.tsx
import { useState } from "react";
import { Video, VideoOff, Mic, MicOff, PhoneOff, X } from "lucide-react-native";

interface Props {
  sellerName: string;
  onClose: () => void;
}

export function SellerVideoCall({ sellerName, onClose }: Props) {
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const startCall = () => {
    setIsConnected(true);
    UIService.openToast("Appel vidéo connecté", "success");
  };

  const endCall = () => {
    setIsConnected(false);
    UIService.openToast("Appel vidéo terminé", "info");
    onClose();
  };

  return (
    <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <View
        className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="relative aspect-video bg-black/60 flex items-center justify-center">
          {isConnected ? (
            <View className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-pink-900/50">
              <View className="text-center">
                <View className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-white bg-orange-500">
                  {sellerName[0]}
                </View>
                <Text className="text-white font-medium">{sellerName}</Text>
                <Text className="text-green-400 text-sm">En ligne</Text>
              </View>
            </View>
          ) : (
            <View className="text-center">
              <Video size={48} className="text-white/20 mx-auto mb-4" />
              <Text className="text-white text-lg">
                Appel vidéo avec {sellerName}
              </Text>
              <Text className="text-white/40 text-sm">
                Cliquez sur Appeler pour démarrer
              </Text>
            </View>
          )}
          <Pressable
            onPress={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-black/50"
          >
            <X size={16} className="text-white" />
          </Pressable>
        </View>
        <View className="p-4 flex items-center justify-center gap-4">
          <Pressable
            onPress={() => setMuted(!muted)}
            className="p-3 rounded-full bg-white/10"
          >
            {muted ? (
              <MicOff size={20} className="text-red-400" />
            ) : (
              <Mic size={20} className="text-white" />
            )}
          </Pressable>
          <Pressable
            onPress={startCall}
            className="p-4 rounded-full bg-green-500"
          >
            <Video size={24} className="text-white" />
          </Pressable>
          <Pressable
            onPress={() => setVideoEnabled(!videoEnabled)}
            className="p-3 rounded-full bg-white/10"
          >
            {videoEnabled ? (
              <Video size={20} className="text-white" />
            ) : (
              <VideoOff size={20} className="text-red-400" />
            )}
          </Pressable>
          <Pressable
            onPress={endCall}
            className="p-4 rounded-full bg-red-500"
          >
            <PhoneOff size={24} className="text-white" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

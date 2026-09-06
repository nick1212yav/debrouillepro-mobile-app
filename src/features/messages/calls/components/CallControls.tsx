import { Pressable, View } from "react-native";

interface CallControlsProps {
  isMuted: boolean;
  isCameraEnabled: boolean;
  isVideoCall: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEnd: () => void;
}

export function CallControls({
  isMuted,
  isCameraEnabled,
  isVideoCall,
  onToggleMute,
  onToggleCamera,
  onEnd,
}: CallControlsProps) {
  return (
    <View className="flex items-center justify-center gap-3">
      <Pressable
        onPress={onToggleMute}
        className="rounded-full bg-white/10 px-4 py-3 text-sm text-white"
        accessibilityLabel={isMuted ? "Activer le microphone" : "Couper le microphone"}
      >
        {isMuted ? "🔇" : "🎙️"}
      </Pressable>

      {isVideoCall && (
        <Pressable
          onPress={onToggleCamera}
          className="rounded-full bg-white/10 px-4 py-3 text-sm text-white"
          accessibilityLabel={
            isCameraEnabled ? "Désactiver la caméra" : "Activer la caméra"
          }
        >
          {isCameraEnabled ? "📹" : "🚫"}
        </Pressable>
      )}

      <Pressable
        onPress={onEnd}
        className="rounded-full bg-red-600 px-5 py-3 text-sm font-medium text-white"
        accessibilityLabel="Terminer l'appel"
      >
        ☎ Terminer
      </Pressable>
    </View>
  );
}

export default CallControls;

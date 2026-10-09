import { Pressable, Text, View } from "react-native";

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
    <View className="flex-row items-center justify-center gap-3">
      <Pressable
        onPress={onToggleMute}
        accessibilityRole="button"
        accessibilityLabel={
          isMuted ? "Activer le microphone" : "Couper le microphone"
        }
        accessibilityState={{ selected: isMuted }}
        className="h-12 w-12 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
      >
        <Text className="text-lg">{isMuted ? "🔇" : "🎙️"}</Text>
      </Pressable>

      {isVideoCall ? (
        <Pressable
          onPress={onToggleCamera}
          accessibilityRole="button"
          accessibilityLabel={
            isCameraEnabled ? "Désactiver la caméra" : "Activer la caméra"
          }
          accessibilityState={{ selected: isCameraEnabled }}
          className="h-12 w-12 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
        >
          <Text className="text-lg">{isCameraEnabled ? "📹" : "🚫"}</Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={onEnd}
        accessibilityRole="button"
        accessibilityLabel="Terminer l'appel"
        className="h-12 flex-row items-center justify-center rounded-full bg-red-600 px-5 active:bg-red-700"
      >
        <Text className="text-sm font-semibold text-white">☎ Terminer</Text>
      </Pressable>
    </View>
  );
}

export default CallControls;

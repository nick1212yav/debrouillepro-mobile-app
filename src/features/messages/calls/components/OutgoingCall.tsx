import { Pressable, Text, View, Image } from "react-native";
import type { Call } from "../types/call.types";

interface OutgoingCallProps {
  call: Call;
  recipientName?: string;
  recipientAvatar?: string;
  onCancel: () => void;
}

export function OutgoingCall({
  call,
  recipientName = "Appel",
  recipientAvatar,
  onCancel,
}: OutgoingCallProps) {
  return (
    <View className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl bg-zinc-950 p-8 text-white">
      {recipientAvatar ? (
        <Image
          className="h-24 w-24 rounded-full object-cover" source={{ uri: recipientAvatar }} accessibilityLabel={recipientName}
        />
      ) : (
        <View className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-3xl">
          {call.type === "video" ? "📹" : "📞"}
        </View>
      )}

      <Text className="mt-5 text-xl font-semibold">{recipientName}</Text>

      <Text className="mt-1 text-sm text-white/50">
        Appel {call.type === "video" ? "vidéo" : "audio"} en cours...
      </Text>

      <Pressable
        type="button"
        onPress={onCancel}
        className="mt-8 rounded-full bg-red-600 px-6 py-3 font-medium"
      >
        Annuler
      </Pressable>
    </View>
  );
}

export default OutgoingCall;

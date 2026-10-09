import { Image, Pressable, Text, View } from "react-native";

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
  const isVideoCall = call.type === "video";

  return (
    <View className="min-h-[320px] items-center justify-center rounded-2xl bg-zinc-950 p-8">
      {recipientAvatar ? (
        <Image
          source={{ uri: recipientAvatar }}
          accessibilityLabel={recipientName}
          className="h-24 w-24 rounded-full"
        />
      ) : (
        <View className="h-24 w-24 items-center justify-center rounded-full bg-white/10">
          <Text className="text-3xl">{isVideoCall ? "📹" : "📞"}</Text>
        </View>
      )}

      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        className="mt-5 max-w-full text-center text-xl font-semibold text-white"
      >
        {recipientName}
      </Text>

      <Text className="mt-1 text-center text-sm text-white/50">
        Appel {isVideoCall ? "vidéo" : "audio"} en cours...
      </Text>

      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Annuler l'appel"
        className="mt-8 rounded-full bg-red-600 px-6 py-3 active:bg-red-700"
      >
        <Text className="font-semibold text-white">Annuler</Text>
      </Pressable>
    </View>
  );
}

export default OutgoingCall;

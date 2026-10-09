import { Image, Pressable, Text, View } from "react-native";

import type { Call } from "../types/call.types";

interface IncomingCallProps {
  call: Call;
  callerName?: string;
  callerAvatar?: string;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCall({
  call,
  callerName = "Appel entrant",
  callerAvatar,
  onAccept,
  onReject,
}: IncomingCallProps) {
  const isVideoCall = call.type === "video";

  return (
    <View className="mx-4 mt-4 rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl">
      <View className="flex-row items-center gap-4">
        {callerAvatar ? (
          <Image
            source={{ uri: callerAvatar }}
            accessibilityLabel={callerName}
            className="h-14 w-14 rounded-full"
          />
        ) : (
          <View className="h-14 w-14 items-center justify-center rounded-full bg-white/10">
            <Text className="text-xl">{isVideoCall ? "📹" : "📞"}</Text>
          </View>
        )}

        <View className="min-w-0 flex-1">
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="font-semibold text-white"
          >
            {callerName}
          </Text>

          <Text className="mt-1 text-sm text-white/50">
            {isVideoCall ? "Appel vidéo entrant" : "Appel audio entrant"}
          </Text>
        </View>
      </View>

      <View className="mt-5 flex-row gap-3">
        <Pressable
          onPress={onReject}
          accessibilityRole="button"
          accessibilityLabel="Refuser l'appel"
          className="flex-1 items-center justify-center rounded-xl bg-red-600 px-4 py-3 active:bg-red-700"
        >
          <Text className="font-semibold text-white">Refuser</Text>
        </Pressable>

        <Pressable
          onPress={onAccept}
          accessibilityRole="button"
          accessibilityLabel="Accepter l'appel"
          className="flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 active:bg-emerald-700"
        >
          <Text className="font-semibold text-white">Accepter</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default IncomingCall;

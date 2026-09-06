import { Pressable, View, Text, Image } from "react-native";
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
  return (
    <View className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl">
      <View className="flex items-center gap-4">
        {callerAvatar ? (
          <Image
           
           
            className="h-14 w-14 rounded-full object-cover"
           source={{ uri: callerAvatar }} accessibilityLabel={callerName}/>
        ) : (
          <View className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-xl">
            {call.type === "video" ? "📹" : "📞"}
          </View>
        )}

        <View className="min-w-0 flex-1">
          <Text className="font-semibold text-white">{callerName}</Text>
          <Text className="text-sm text-white/50">
            {call.type === "video"
              ? "Appel vidéo entrant"
              : "Appel audio entrant"}
          </Text>
        </View>
      </View>

      <View className="mt-5 flex gap-3">
        <Pressable
          onPress={onReject}
          className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-medium text-white"
        >
          <Text>Refuser</Text></Pressable>

        <Pressable
          onPress={onAccept}
          className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white"
        >
          <Text>Accepter</Text></Pressable>
      </View>
    </View>
  );
}

export default IncomingCall;

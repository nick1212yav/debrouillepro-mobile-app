import { View, Text, Image } from "react-native";
import type { CallWithInitiator } from "../types/call.types";

interface CallHistoryProps {
  calls: CallWithInitiator[];
  isLoading?: boolean;
}

function statusLabel(status: CallWithInitiator["status"]) {
  switch (status) {
    case "active":
      return "En cours";
    case "pending":
      return "En attente";
    case "missed":
      return "Manqué";
    case "ended":
      return "Terminé";
  }
}

export function CallHistory({ calls, isLoading = false }: CallHistoryProps) {
  if (isLoading) {
    return (
      <View className="p-4 text-sm text-white/50">
        <Text>Chargement de l'historique...</Text></View>
    );
  }

  if (calls.length === 0) {
    return (
      <View className="p-6 text-center text-sm text-white/50"><Text>Aucun appel.</Text></View>
    );
  }

  return (
    <View className="divide-y divide-white/10">
      {calls.map((call) => (
        <View key={call._id} className="flex items-center gap-3 px-4 py-3">
          {call.initiator?.avatar ? (
            <Image
             
             
              className="h-10 w-10 rounded-full object-cover"
             source={{ uri: call.initiator.avatar }} accessibilityLabel={call.initiator.name}/>
          ) : (
            <View className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              {call.type === "video" ? "📹" : "📞"}
            </View>
          )}

          <View className="min-w-0 flex-1">
            <Text className="truncate text-sm font-medium text-white">
              {call.initiator?.name ?? "Utilisateur"}
            </Text>

            <Text className="text-xs text-white/50">
              {call.type === "video" ? "Vidéo" : "Audio"} <Text>·</Text>{" "}
              {statusLabel(call.status)}
            </Text>
          </View>

          <time className="text-xs text-white/40">
            {new Date(call.startedAt).toLocaleDateString("fr-FR")}
          </time>
        </View>
      ))}
    </View>
  );
}

export default CallHistory;

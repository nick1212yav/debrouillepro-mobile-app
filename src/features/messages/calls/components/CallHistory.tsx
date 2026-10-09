import { Image, Text, View } from "react-native";

import type { CallWithInitiator } from "../types/call.types";

interface CallHistoryProps {
  calls: CallWithInitiator[];
  isLoading?: boolean;
}

function statusLabel(status: CallWithInitiator["status"]): string {
  switch (status) {
    case "active":
      return "En cours";
    case "pending":
      return "En attente";
    case "missed":
      return "Manqué";
    case "ended":
      return "Terminé";
    default:
      return "Inconnu";
  }
}

export function CallHistory({ calls, isLoading = false }: CallHistoryProps) {
  if (isLoading) {
    return (
      <View className="items-center justify-center px-4 py-8">
        <Text className="text-sm text-white/50">
          Chargement de l'historique...
        </Text>
      </View>
    );
  }

  if (calls.length === 0) {
    return (
      <View className="items-center justify-center px-6 py-10">
        <Text className="text-center text-sm text-white/50">Aucun appel.</Text>
      </View>
    );
  }

  return (
    <View>
      {calls.map((call, index) => (
        <View
          key={call._id}
          className={`flex-row items-center gap-3 px-4 py-3 ${
            index > 0 ? "border-t border-white/10" : ""
          }`}
        >
          {call.initiator?.avatar ? (
            <Image
              source={{ uri: call.initiator.avatar }}
              accessibilityLabel={call.initiator.name ?? "Utilisateur"}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Text className="text-base">
                {call.type === "video" ? "📹" : "📞"}
              </Text>
            </View>
          )}

          <View className="min-w-0 flex-1">
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              className="text-sm font-medium text-white"
            >
              {call.initiator?.name ?? "Utilisateur"}
            </Text>

            <Text className="mt-1 text-xs text-white/50">
              {call.type === "video" ? "Vidéo" : "Audio"} ·{" "}
              {statusLabel(call.status)}
            </Text>
          </View>

          <Text className="shrink-0 text-xs text-white/40">
            {new Date(call.startedAt).toLocaleDateString("fr-FR")}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default CallHistory;

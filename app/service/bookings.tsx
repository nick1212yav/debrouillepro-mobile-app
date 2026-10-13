import { useRouter } from "expo-router";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { ArrowLeft, Calendar } from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function MyBookingsScreen() {
  const router = useRouter();
  const bookings = useQuery(api.services.bookings.getMyBookings, {});

  if (bookings === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0D1117]">
        <ActivityIndicator color="#F97316" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0D1117]">
      <View className="flex-row items-center gap-3 px-4 pt-12 pb-4 border-b border-white/5">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-xl bg-white/5 active:bg-white/10"
        >
          <ArrowLeft size={18} color="white" />
        </Pressable>
        <Text className="text-white font-bold text-lg">Mes réservations</Text>
      </View>

      {bookings.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Calendar size={40} color="rgba(255,255,255,0.2)" />
          <Text className="text-white/50 text-sm mt-4 text-center">
            Aucune réservation pour le moment.
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          renderItem={({ item }) => {
            const statusLabel: Record<string, string> = {
              pending: "En attente",
              confirmed: "Confirmée",
              in_progress: "En cours",
              done: "Terminée",
              cancelled: "Annulée",
              disputed: "En litige",
            };

            return (
              <View className="rounded-2xl bg-white/5 border border-white/5 p-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text
                    className="text-white font-semibold text-sm flex-1"
                    numberOfLines={1}
                  >
                    {item.provider?.name ?? "Prestataire"}
                  </Text>
                  <View className="px-2 py-0.5 rounded-full bg-orange-500/20">
                    <Text className="text-[10px] font-bold text-orange-400">
                      {statusLabel[item.status] ?? item.status}
                    </Text>
                  </View>
                </View>
                <Text className="text-white/50 text-xs" numberOfLines={2}>
                  {item.message}
                </Text>
                {item.scheduledAt && (
                  <Text className="text-white/40 text-xs mt-1">
                    📅 {item.scheduledAt}
                  </Text>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

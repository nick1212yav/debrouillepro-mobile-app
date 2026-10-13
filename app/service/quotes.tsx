import { useRouter } from "expo-router";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { ArrowLeft, FileText } from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function MyQuotesScreen() {
  const router = useRouter();
  const quotes = useQuery(api.services.quotes.listMyQuotes, {});

  if (quotes === undefined) {
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
        <Text className="text-white font-bold text-lg">Mes devis</Text>
      </View>

      {quotes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <FileText size={40} color="rgba(255,255,255,0.2)" />
          <Text className="text-white/50 text-sm mt-4 text-center">
            Aucun devis pour le moment.
          </Text>
        </View>
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          renderItem={({ item }) => {
            const statusLabel: Record<string, string> = {
              pending: "En attente",
              accepted: "Accepté",
              rejected: "Refusé",
              expired: "Expiré",
              converted: "Converti",
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
                  <View className="px-2 py-0.5 rounded-full bg-purple-500/20">
                    <Text className="text-[10px] font-bold text-purple-400">
                      {statusLabel[item.status] ?? item.status}
                    </Text>
                  </View>
                </View>
                <Text className="text-white/50 text-xs" numberOfLines={2}>
                  {item.message}
                </Text>
                {item.amount !== undefined && item.currency && (
                  <Text className="text-orange-400 text-xs font-bold mt-1">
                    {item.amount} {item.currency}
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

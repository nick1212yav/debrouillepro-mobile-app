import { useRouter } from "expo-router";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { ArrowLeft, Receipt } from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function MyInvoicesScreen() {
  const router = useRouter();
  const invoices = useQuery(api.services.invoices.listMyInvoices, {});

  if (invoices === undefined) {
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
        <Text className="text-white font-bold text-lg">Mes factures</Text>
      </View>

      {invoices.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Receipt size={40} color="rgba(255,255,255,0.2)" />
          <Text className="text-white/50 text-sm mt-4 text-center">
            Aucune facture pour le moment.
          </Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          renderItem={({ item }) => {
            const statusLabel: Record<string, string> = {
              draft: "Brouillon",
              issued: "Émise",
              paid: "Payée",
              cancelled: "Annulée",
            };

            return (
              <View className="rounded-2xl bg-white/5 border border-white/5 p-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white font-semibold text-sm">
                    {item.number}
                  </Text>
                  <View className="px-2 py-0.5 rounded-full bg-blue-500/20">
                    <Text className="text-[10px] font-bold text-blue-400">
                      {statusLabel[item.status] ?? item.status}
                    </Text>
                  </View>
                </View>
                <Text className="text-orange-400 text-base font-bold">
                  {item.amount} {item.currency}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

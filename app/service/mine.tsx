import { useRouter } from "expo-router";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { ArrowLeft, Plus, Wrench } from "lucide-react-native";
import { useState } from "react";
import { useMyProviders } from "@/features/service/hooks";
import { CreateServiceSheet } from "@/features/service/sheets/CreateServiceSheet";

export default function MyServicesScreen() {
  const router = useRouter();
  const { providers, loading } = useMyProviders();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <View className="flex-1 bg-[#0D1117]">
      <View className="flex-row items-center gap-3 px-4 pt-12 pb-4 border-b border-white/5">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-xl bg-white/5 active:bg-white/10"
        >
          <ArrowLeft size={18} color="white" />
        </Pressable>
        <Text className="text-white font-bold text-lg flex-1">
          Mes services
        </Text>
        <Pressable
          onPress={() => setShowCreate(true)}
          className="h-9 px-3 flex-row items-center gap-1 rounded-xl bg-orange-500 active:bg-orange-600"
        >
          <Plus size={16} color="white" />
          <Text className="text-white font-bold text-sm">Créer</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#F97316" />
        </View>
      ) : providers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Wrench size={40} color="rgba(255,255,255,0.2)" />
          <Text className="text-white/50 text-sm mt-4 text-center">
            Tu n'as pas encore publié de service.
          </Text>
          <Pressable
            onPress={() => setShowCreate(true)}
            className="mt-5 rounded-xl bg-orange-500 px-5 py-3 active:bg-orange-600"
          >
            <Text className="text-white font-bold">
              Publier mon premier service
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          renderItem={({ item }) => {
            const status = item.status ?? "active";
            const isArchived = status === "archived";
            const isPaused = status === "paused";

            return (
              <Pressable
                onPress={() => router.push(`/service/${item._id}`)}
                className="flex-row items-center gap-3 rounded-2xl bg-white/5 border border-white/5 p-3 active:bg-white/10"
              >
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    className="h-14 w-14 rounded-xl"
                  />
                ) : (
                  <View className="h-14 w-14 rounded-xl bg-orange-500/20 items-center justify-center">
                    <Wrench size={20} color="#FB923C" />
                  </View>
                )}

                <View className="flex-1 min-w-0">
                  <Text
                    className="text-white font-semibold text-sm"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    className="text-white/50 text-xs mt-0.5"
                    numberOfLines={1}
                  >
                    {item.specialty}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <View
                      className={`px-2 py-0.5 rounded-full ${
                        isArchived
                          ? "bg-red-500/20"
                          : isPaused
                            ? "bg-amber-500/20"
                            : "bg-emerald-500/20"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          isArchived
                            ? "text-red-400"
                            : isPaused
                              ? "text-amber-400"
                              : "text-emerald-400"
                        }`}
                      >
                        {isArchived
                          ? "Archivé"
                          : isPaused
                            ? "En pause"
                            : "Actif"}
                      </Text>
                    </View>
                    {item.isDemo && (
                      <View className="px-2 py-0.5 rounded-full bg-amber-500/20">
                        <Text className="text-[10px] font-bold text-amber-400">
                          Démo
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <CreateServiceSheet
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => setShowCreate(false)}
      />
    </View>
  );
}

import { useRouter } from "expo-router";
import { View, Text, Pressable, Image } from "react-native";
// src/pages/modules/TelemedicinePage.tsx
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, Video, Loader2 } from "lucide-react-native";
import { Skeleton } from "@/components/ui/skeleton";

export default function TelemedicinePage() {
  const router = useRouter();
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const doctors = useQuery(api.health.listProfessionals, { online: true });

  return (
    <View
      className="h-full flex flex-col"
      style={{  }}
    >
      <View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3">
        <Pressable
          onPress={() => router(-1)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
        >
          <ArrowLeft size={20} className="text-white" />
        </Pressable>
        <Text className="text-white font-bold text-lg flex-1 truncate">
          Téléconsultation
        </Text>
        <Text className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
          En direct
        </Text>
      </View>

      <View
        className="flex-1 overflow-y-auto px-4 pb-8 space-y-4"
        style={{  }}
      >
        <View className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
          <Text className="text-white/60 text-sm">
            Médecins disponibles en consultation vidéo
          </Text>
        </View>

        {doctors === undefined ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : doctors.length === 0 ? (
          <Text className="text-white/30 text-sm text-center py-8">
            Aucun médecin disponible en ce moment
          </Text>
        ) : (
          doctors.map((doc: any) => (
            <View
              key={doc._id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10"
            >
              <Image
               
               
                className="w-12 h-12 rounded-2xl object-cover"
               source={{ uri: doc.images?.[0] }} accessibilityLabel={doc.name}/>
              <View className="flex-1">
                <Text className="text-white font-semibold text-sm">{doc.name}</Text>
                <Text className="text-white/40 text-xs">{doc.specialty}</Text>
                <View className="flex items-center gap-2 mt-0.5">
                  <Text className="text-[10px] text-green-400 flex items-center gap-0.5">
                    <View className="w-1.5 h-1.5 rounded-full bg-green-400" /> En
                    ligne
                  </Text>
                  <Text className="text-[10px] text-white/30">
                    {doc.waitTime || "5"} min d'attente
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setActiveCall(doc._id)}
                className="px-4 py-2 rounded-xl bg-green-500 text-white text-xs font-medium flex items-center gap-1"
              >
                <Video size={14} /> <Text>Appeler</Text></Pressable>
            </View>
          ))
        )}
      </View>

      {activeCall && (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
          <View className="w-full max-w-md p-4">
            <View className="aspect-video rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center">
              <View className="text-center">
                <Video size={48} className="mx-auto text-white/20 mb-4" />
                <Text className="text-white/60"><Text>Appel en cours...</Text></Text>
                <Pressable
                  onPress={() => setActiveCall(null)}
                  className="mt-6 px-6 py-2 rounded-xl bg-red-500 text-white font-medium"
                >
                  <Text>Raccrocher</Text></Pressable>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, Pressable, Alert } from "react-native";
// src/pages/modules/LaboratoryDetailPage.tsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Loader2,
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  Star,
  Heart,
  Share2,
  FlaskRound,
  Microscope,
  Calendar,
} from "lucide-react-native";
import {
  HealthGallery,
  DoctorLocation,
  DoctorMap,
  DoctorDirections,
} from "@/features/sante/components";
import type { Id } from "@/convex/_generated/dataModel";

export default function LaboratoryDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const labId = id as Id<"laboratories">;
  const lab = useQuery(api.health.getLaboratory, { id: labId });

  if (!lab) {
    return (
      <View
        className="h-full flex items-center justify-center"
        style={{  }}
      >
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </View>
    );
  }

  return (
    <View
      className="h-full flex flex-col"
      style={{  }}
    >
      <View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
        >
          <ArrowLeft size={20} className="text-white" />
        </Pressable>
        <Text className="text-white font-bold text-lg flex-1 truncate">
          {lab.name}
        </Text>
        <View className="flex items-center gap-1.5">
          <Pressable className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5">
            <Heart size={18} className="text-white/60" />
          </Pressable>
          <Pressable className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5">
            <Share2 size={18} className="text-white/60" />
          </Pressable>
        </View>
      </View>

      <View
        className="flex-1 overflow-y-auto px-4 pb-8 space-y-5"
        style={{  }}
      >
        <HealthGallery images={lab.images || []} title={lab.name} />
        <View className="space-y-3">
          <View className="flex items-start justify-between">
            <View>
              <Text className="text-white text-xl font-bold">{lab.name}</Text>
              <View className="flex items-center gap-2 mt-1">
                <Text className="text-white/40 text-sm">Laboratoire</Text>
                {lab.rating && (
                  <Text className="flex items-center gap-0.5 text-yellow-400 text-sm">
                    <Star size={14} fill="currentColor" />{" "}
                    {lab.rating.toFixed(1)}
                  </Text>
                )}
              </View>
            </View>
            <Text
              className={`text-xs ${lab.open ? "text-green-400" : "text-red-400"}`}
            >
              {lab.open ? "Ouvert" : "Fermé"}
            </Text>
          </View>

          <View className="flex flex-wrap gap-3 text-sm text-white/60">
            <View className="flex items-center gap-1">
              <MapPin size={14} /> {lab.address}
            </View>
            <View className="flex items-center gap-1">
              <Phone size={14} /> {lab.phone}
            </View>
            <View className="flex items-center gap-1">
              <Clock size={14} /> {lab.hours}
            </View>
          </View>

          <View className="gap-2">
            <View className="p-3 rounded-xl bg-white/5 text-center">
              <FlaskRound size={20} className="mx-auto text-white/40" />
              <Text className="text-white font-bold text-sm">{lab.tests}</Text>
              <Text className="text-white/40 text-[10px]">Analyses</Text>
            </View>
            <View className="p-3 rounded-xl bg-white/5 text-center">
              <Microscope size={20} className="mx-auto text-white/40" />
              <Text className="text-white font-bold text-sm">{lab.equipment}</Text>
              <Text className="text-white/40 text-[10px]">Équipements</Text>
            </View>
          </View>

          <View className="p-3 rounded-xl bg-white/5 border border-white/10">
            <Text className="text-white/40 text-xs">Tests disponibles</Text>
            <View className="flex flex-wrap gap-2 mt-1">
              {lab.testsList?.map((t: string) => (
                <Text
                  key={t}
                  className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-white/60"
                >
                  {t}
                </Text>
              ))}
            </View>
          </View>

          <Pressable
            onPress={() => Alert.alert("Fonctionnalité de réservation à venir")}
            className="w-full py-3 rounded-xl bg-purple-500 text-white font-medium flex items-center justify-center gap-2"
          >
            <Calendar size={18} /> <Text>Prendre un RDV</Text></Pressable>

          <DoctorLocation
            address={lab.address}
            city={lab.city}
            country={lab.country}
            latitude={lab.latitude}
            longitude={lab.longitude}
          />
          <DoctorMap
            latitude={lab.latitude}
            longitude={lab.longitude}
            name={lab.name}
            address={lab.address}
          />
          <DoctorDirections
            latitude={lab.latitude}
            longitude={lab.longitude}
            address={lab.address}
          />
        </View>
      </View>
    </View>
  );
}

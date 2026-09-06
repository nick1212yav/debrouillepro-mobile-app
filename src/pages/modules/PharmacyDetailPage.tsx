import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, Pressable, Alert } from "react-native";
// src/pages/modules/PharmacyDetailPage.tsx
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
  Pill,
  ShoppingCart,
} from "lucide-react-native";
import {
  HealthGallery,
  DoctorLocation,
  DoctorMap,
  DoctorDirections,
} from "@/features/sante/components";
import type { Id } from "@/convex/_generated/dataModel";

export default function PharmacyDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const pharmacyId = id as Id<"pharmacies">;
  const pharmacy = useQuery(api.health.getPharmacy, { id: pharmacyId });

  if (!pharmacy) {
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
          {pharmacy.name}
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
        <HealthGallery images={pharmacy.images || []} title={pharmacy.name} />
        <View className="space-y-3">
          <View className="flex items-start justify-between">
            <View>
              <Text className="text-white text-xl font-bold">{pharmacy.name}</Text>
              <View className="flex items-center gap-2 mt-1">
                <Text className="text-white/40 text-sm">Pharmacie</Text>
                {pharmacy.rating && (
                  <Text className="flex items-center gap-0.5 text-yellow-400 text-sm">
                    <Star size={14} fill="currentColor" />{" "}
                    {pharmacy.rating.toFixed(1)}
                  </Text>
                )}
              </View>
            </View>
            <Text
              className={`text-xs ${pharmacy.open ? "text-green-400" : "text-red-400"}`}
            >
              {pharmacy.open ? "Ouvert" : "Fermé"}
            </Text>
          </View>

          <View className="flex flex-wrap gap-3 text-sm text-white/60">
            <View className="flex items-center gap-1">
              <MapPin size={14} /> {pharmacy.address}
            </View>
            <View className="flex items-center gap-1">
              <Phone size={14} /> {pharmacy.phone}
            </View>
            <View className="flex items-center gap-1">
              <Clock size={14} /> {pharmacy.hours}
            </View>
          </View>

          <View className="p-3 rounded-xl bg-white/5 border border-white/10">
            <Text className="text-white/40 text-xs">Services</Text>
            <View className="flex flex-wrap gap-2 mt-1">
              {pharmacy.services?.map((s: string) => (
                <Text
                  key={s}
                  className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-white/60"
                >
                  {s}
                </Text>
              ))}
            </View>
          </View>

          <View className="space-y-2">
            <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider">
              Produits en stock
            </Text>
            {pharmacy.products?.map((p: any) => (
              <View
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <View>
                  <Text className="text-white font-medium text-sm">{p.name}</Text>
                  <Text className="text-white/40 text-xs">{p.dosage}</Text>
                </View>
                <View className="text-right">
                  <Text className="text-orange-400 font-bold text-sm">
                    {p.price} {p.currency}
                  </Text>
                  <Text className="text-white/30 text-[10px]"><Text>Stock:</Text>{p.stock}</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => Alert.alert("Fonctionnalité de commande à venir")}
            className="w-full py-3 rounded-xl bg-orange-500 text-white font-medium flex items-center justify-center gap-2"
          >
            <ShoppingCart size={18} /> <Text>Commander</Text></Pressable>

          <DoctorLocation
            address={pharmacy.address}
            city={pharmacy.city}
            country={pharmacy.country}
            latitude={pharmacy.latitude}
            longitude={pharmacy.longitude}
          />
          <DoctorMap
            latitude={pharmacy.latitude}
            longitude={pharmacy.longitude}
            name={pharmacy.name}
            address={pharmacy.address}
          />
          <DoctorDirections
            latitude={pharmacy.latitude}
            longitude={pharmacy.longitude}
            address={pharmacy.address}
          />
        </View>
      </View>
    </View>
  );
}

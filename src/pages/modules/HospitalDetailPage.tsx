import { View, Pressable, Text, Linking } from "react-native";

// src/pages/modules/HospitalDetailPage.tsx
import { useParams, useNavigate } from "react-router-dom";
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
  Building,
  Bed,
  Users,
  Stethoscope,
  Ambulance,
} from "lucide-react-native";
import {
  HealthGallery,
  DoctorLocation,
  DoctorMap,
  DoctorDirections,
  DoctorReviews,
  DoctorCommunity,
} from "@/features/sante/components";
import type { Id } from "@/convex/_generated/dataModel";

export default function HospitalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const hospitalId = id as Id<"hospitals">;
  const hospital = useQuery(api.health.getHospital, { id: hospitalId });

  if (!hospital) {
    return (
      <View className="h-full flex items-center justify-center" style={{  }}><Loader2 className="w-8 h-8 text-white/40 animate-spin" /></View>
    );
  }

  return (
    <View className="h-full flex flex-col" style={{  }}><View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3"><Pressable onPress={() => navigate(-1)} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 transition-colors"><ArrowLeft size={20} className="text-white" /></Pressable><Text className="text-white font-bold text-lg flex-1 truncate">{hospital.name}</Text><View className="flex items-center gap-1.5"><Pressable className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 transition-colors"><Heart size={18} className="text-white/60" /></Pressable><Pressable className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 transition-colors"><Share2 size={18} className="text-white/60" /></Pressable></View></View><View className="flex-1 overflow-y-auto px-4 pb-8 space-y-5" style={{  }}><HealthGallery images={hospital.images || []} title={hospital.name} /><View className="space-y-3"><View className="flex items-start justify-between"><View><Text className="text-white text-xl font-bold">{hospital.name}</Text><View className="flex items-center gap-2 mt-1"><Text className="text-white/40 text-sm">{hospital.type}</Text>{hospital.rating && (
                  <Text className="flex items-center gap-0.5 text-yellow-400 text-sm"><Star size={14} fill="currentColor" />{" "}{hospital.rating.toFixed(1)}</Text>
                )}</View></View><View className="text-right"><Text className="text-sm font-black text-orange-400">{hospital.priceRange}</Text><Text className={`text-xs ${hospital.open ? "text-green-400" : "text-red-400"}`}>{hospital.open ? "Ouvert" : "Fermé"}</Text></View></View><View className="flex flex-wrap gap-3 text-sm text-white/60"><View className="flex items-center gap-1"><MapPin size={14} />{hospital.address}</View><View className="flex items-center gap-1"><Phone size={14} />{hospital.phone}</View><View className="flex items-center gap-1"><Clock size={14} />{hospital.hours}</View></View><View className="gap-2"><View className="p-3 rounded-xl bg-white/5 text-center"><Bed size={20} className="mx-auto text-white/40" /><Text className="text-white font-bold text-sm">{hospital.beds}</Text><Text className="text-white/40 text-[10px]">Lits</Text></View><View className="p-3 rounded-xl bg-white/5 text-center"><Users size={20} className="mx-auto text-white/40" /><Text className="text-white font-bold text-sm">{hospital.doctors}</Text><Text className="text-white/40 text-[10px]">Médecins</Text></View><View className="p-3 rounded-xl bg-white/5 text-center"><Stethoscope size={20} className="mx-auto text-white/40" /><Text className="text-white font-bold text-sm">{hospital.specialties}</Text><Text className="text-white/40 text-[10px]">Spécialités</Text></View></View><Text className="text-white/70 text-sm leading-relaxed">{hospital.description}</Text><View className="flex flex-wrap gap-2">{hospital.services?.map((s: string) => (
              <Text key={s} className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-white/60">
                {s}
              </Text>
            ))}</View><DoctorLocation address={hospital.address} city={hospital.city} country={hospital.country} latitude={hospital.latitude} longitude={hospital.longitude} /><DoctorMap latitude={hospital.latitude} longitude={hospital.longitude} name={hospital.name} address={hospital.address} /><DoctorDirections latitude={hospital.latitude} longitude={hospital.longitude} address={hospital.address} /><Pressable onPress={() => (Linking.openURL("tel:15"))} className="w-full py-3 rounded-xl bg-red-500 text-white font-medium flex items-center justify-center gap-2 transition-colors"><Ambulance size={18} />Urgences
          </Pressable>{}<DoctorReviews reviews={[]} averageRating={hospital.rating} /><DoctorCommunity reviews={hospital.reviewCount || 0} questions={0} followers={0} /></View></View></View>
  );
}

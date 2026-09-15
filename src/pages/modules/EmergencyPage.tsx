import { View, Pressable, Text, Linking } from "react-native";

// src/pages/modules/EmergencyPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ArrowLeft,
  Phone,
  Ambulance,
  AlertTriangle,
  Heart,
  MapPin,
  Clock,
  Shield,
} from "lucide-react-native";
import { toast } from "sonner";
import { Loader2 } from "lucide-react-native";

export default function EmergencyPage() {
  const navigate = useNavigate();
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const nearbyEmergencies = useQuery(
    api.health.getNearbyEmergencyCenters,
    position ? { lat: position.lat, lng: position.lng } : "skip",
  );

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => toast.error("Impossible de récupérer votre position"),
      );
    }
  }, []);

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <View className="h-full flex flex-col" style={{  }}><View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3"><Pressable onPress={() => navigate(-1)} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 transition-colors"><ArrowLeft size={20} className="text-white" /></Pressable><Text className="text-white font-bold text-lg flex-1 truncate">Urgences
        </Text><Pressable className="w-10 h-10 rounded-2xl flex items-center justify-center bg-red-500/20 transition-colors"><Phone size={18} className="text-red-400" /></Pressable></View><View className="flex-1 overflow-y-auto px-4 pb-8 space-y-4" style={{  }}>{}<View initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="p-4 rounded-3xl bg-red-500/10 border-2 border-red-500/30 text-center"><AlertTriangle size={32} className="mx-auto text-red-400 mb-2" /><Text className="text-white font-bold text-lg">Urgence médicale</Text><Text className="text-white/50 text-sm">En cas de danger vital, appelez immédiatement
          </Text><Pressable onPress={() => handleCall("15")} className="mt-3 w-full py-3 rounded-2xl bg-red-500 text-white font-black text-lg flex items-center justify-center gap-2 transition-colors"><Phone size={20} /><Text>Appeler le 15</Text></Pressable></View>{}<View className="gap-3">{[
            { label: "SAMU", number: "15", icon: Ambulance, color: "#EF4444" },
            {
              label: "Pompiers",
              number: "18",
              icon: AlertTriangle,
              color: "#F97316",
            },
            { label: "Police", number: "17", icon: Shield, color: "#3B82F6" },
            {
              label: "Croix-Rouge",
              number: "1515",
              icon: Heart,
              color: "#EF4444",
            },
          ].map((em) => (
            <Pressable key={em.number} onPress={() => handleCall(em.number)} className="p-4 rounded-2xl text-center transition-transform" style={{ backgroundColor: `${em.color}15`, borderStyle: "solid" }}><em.icon size={24} className="mx-auto" style={{  }} /><Text className="text-white font-black text-lg mt-1">{em.number}</Text><Text className="text-white/40 text-xs">{em.label}</Text></Pressable>
          ))}</View>{}<Text className="text-white/60 text-xs font-semibold uppercase tracking-wider mt-4">Centres d'urgence à proximité
        </Text>{nearbyEmergencies === undefined ? (
          <View className="flex justify-center py-4"><Loader2 className="w-6 h-6 text-white/40 animate-spin" /></View>
        ) : nearbyEmergencies.length === 0 ? (
          <Text className="text-white/30 text-xs text-center py-4">Aucun centre trouvé à proximité
          </Text>
        ) : (
          nearbyEmergencies.map((center: any) => (
            <View key={center._id} className="p-4 rounded-2xl bg-white/5 border border-white/10"><View className="flex items-start gap-3"><View className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center"><Hospital size={18} className="text-red-400" /></View><View className="flex-1"><Text className="text-white font-semibold">{center.name}</Text><Text className="text-white/40 text-xs">{center.address}</Text><Text className="text-white/30 text-xs flex items-center gap-1 mt-0.5"><Clock size={10} />{center.distance}km · {center.eta}min
                  </Text></View><Pressable onPress={() => navigate(`/sante/hospital/${center._id}`)} className="px-3 py-1.5 rounded-xl bg-white/10 text-white/60 text-xs transition-colors">Voir
                </Pressable></View></View>
          ))
        )}</View></View>
  );
}

// Composant temporaire pour l'icône Hospital (car non importé)
const Hospital = Ambulance;

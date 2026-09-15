import { View, Text, Pressable } from "react-native";

// src/features/marketplace/components/ProductPickup.tsx
import { useState } from "react";
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  CheckCircle,
  X,
  Loader2,
} from "lucide-react-native";

interface PickupPoint {
  id: string;
  name: string;
  address: string;
  distance: string;
  openingHours: string;
  phone: string;
  available: boolean;
}

interface ProductPickupProps {
  onSelect?: (point: PickupPoint) => void;
  selectedId?: string;
}

const MOCK_PICKUP_POINTS: PickupPoint[] = [
  {
    id: "1",
    name: "Point Relais Central",
    address: "123 Avenue de la République, Kinshasa",
    distance: "1.2 km",
    openingHours: "Lun-Sam 8h-20h",
    phone: "+243 999 999 999",
    available: true,
  },
  {
    id: "2",
    name: "Agence Express",
    address: "45 Boulevard du Commerce, Kinshasa",
    distance: "3.5 km",
    openingHours: "Lun-Ven 9h-18h, Sam 9h-13h",
    phone: "+243 888 888 888",
    available: true,
  },
  {
    id: "3",
    name: "Dépôt Central",
    address: "78 Rue des Artisans, Kinshasa",
    distance: "5.8 km",
    openingHours: "Lun-Sam 7h-21h",
    phone: "+243 777 777 777",
    available: false,
  },
];

export function ProductPickup({ onSelect, selectedId }: ProductPickupProps) {
  const [selected, setSelected] = useState<string | null>(selectedId || null);
  const [loading, setLoading] = useState(false);

  const handleSelect = (point: PickupPoint) => {
    setSelected(point.id);
    if (onSelect) {
      onSelect(point);
    }
  };

  return (
    <View className="space-y-4">{}<View className="flex items-start justify-between"><View><Text className="text-white font-medium">Points de retrait</Text><Text className="text-white/40 text-xs">Choisissez un point pour récupérer votre produit
          </Text></View>{loading && (
          <Loader2 size={16} className="text-orange-400 animate-spin" />
        )}</View>{}<View className="space-y-2.5">{MOCK_PICKUP_POINTS.map((point) => (
          <View key={point.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} onPress={() => point.available && handleSelect(point)} className={`
              relative rounded-2xl p-4 cursor-pointer transition-all
              ${!point.available && "opacity-50 cursor-not-allowed"}
              ${
                selected === point.id
                  ? "bg-orange-500/20 border border-orange-500/40"
                  : "bg-white/5 border border-white/5 hover:bg-white/10"
              }
            `}>
            <View className="flex items-start gap-3"><View className="flex-1 min-w-0"><View className="flex items-center gap-2"><Text className="text-white font-medium text-sm">{point.name}</Text>{point.available ? (
                    <Text className="text-[10px] text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">Disponible
                    </Text>
                  ) : (
                    <Text className="text-[10px] text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full">Indisponible
                    </Text>
                  )}</View><View className="flex items-center gap-1.5 mt-1"><MapPin size={12} className="text-white/30 flex-shrink-0" /><Text className="text-white/60 text-xs truncate">{point.address}</Text></View><View className="flex items-center gap-3 mt-1.5 flex-wrap"><View className="flex items-center gap-1"><Clock size={10} className="text-white/30" /><Text className="text-white/40 text-[10px]">{point.openingHours}</Text></View><View className="flex items-center gap-1"><Navigation size={10} className="text-white/30" /><Text className="text-white/40 text-[10px]">{point.distance}</Text></View>{point.phone && (
                    <View className="flex items-center gap-1">
                      <Phone size={10} className="text-white/30" />
                      <Text className="text-white/40 text-[10px]">
                        {point.phone}
                      </Text>
                    </View>
                  )}</View></View>{selected === point.id && (
                <CheckCircle
                  size={20}
                  className="text-orange-400 flex-shrink-0 mt-1"
                />
              )}</View>
          </View>
        ))}</View>{}<Pressable onPress={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 1000);
          // Simuler ouverture d'une carte / géolocalisation
        }} className="w-full py-2.5 rounded-xl bg-orange-500/20 text-orange-400 text-sm font-medium transition-colors flex items-center justify-center gap-2" disabled={loading}>{loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            <Navigation size={14} />
            Trouver un point près de moi
          </>
        )}</Pressable>{}<Text className="text-white/30 text-[10px] text-center">Les horaires peuvent varier selon les jours fériés
      </Text></View>
  );
}

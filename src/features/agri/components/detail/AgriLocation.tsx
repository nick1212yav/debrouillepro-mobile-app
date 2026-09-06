import { View, Text } from "react-native";
// src/features/agri/components/detail/AgriLocation.tsx
import { MapPin, Globe } from "lucide-react-native";

interface AgriLocationProps {
  location: {
    country: string;
    province?: string;
    city: string;
    territory?: string;
  };
}

export function AgriLocation({ location }: AgriLocationProps) {
  return (
    <View className="rounded-[24px] p-4 bg-white/[0.02] border border-white/5 space-y-3.5">
      <Text className="text-xs font-bold text-white/40 uppercase tracking-widest">
        Localisation géographique
      </Text>

      <View className="space-y-3">
        <View className="flex items-center gap-3">
          <View className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/60">
            <MapPin size={15} />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-xs text-white/80 font-semibold truncate">
              {location.city}
            </Text>
            {location.province && (
              <Text className="text-[10px] text-white/40 truncate">
                Province : {location.province}
              </Text>
            )}
          </View>
        </View>

        {location.territory && (
          <View className="flex items-center gap-3">
            <View className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/60">
              <Globe size={15} />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-xs text-white/80 font-semibold truncate">
                <Text>Territoire / Zone de récolte</Text></Text>
              <Text className="text-[10px] text-white/40 truncate">
                {location.territory}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

import { View, Text, Image, Pressable } from "react-native";
import { Star, Shield, Award } from "lucide-react-native";
import type { ChefProfile } from "../../types/chef.types";

interface ChefCardProps {
  chef: ChefProfile;
  onSelect?: () => void;
}

export function ChefCard({ chef, onSelect }: ChefCardProps) {
  return (
    <Pressable
      onPress={onSelect}
      className={`p-4 rounded-2xl flex gap-4 text-left ${
        onSelect ? "cursor-pointer hover:bg-white/[0.05] transition-all" : ""
      }`}
      style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
    >
      <View className="relative shrink-0">
        <Image
         
         
          className="w-16 h-16 rounded-full object-cover border-2 border-amber-400/40"
         source={{ uri: chef.avatar }} accessibilityLabel={chef.name}/>
        {chef.available && (
          <Text className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#020617]" />
        )}
      </View>

      <View className="flex-1 min-w-0">
        <View className="flex items-center gap-1.5 flex-wrap">
          <Text className="font-extrabold text-sm text-white truncate">
            {chef.name}
          </Text>
          {chef.experienceYears >= 10 && (
            <Text className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10">
              <Award size={9} /> Élite
            </Text>
          )}
        </View>

        <Text className="text-[10px] text-white/40 font-semibold mt-0.5 uppercase tracking-wider">
          Spécialités : {chef.specialties.slice(0, 2).join(", ")}
        </Text>

        <Text className="text-white/50 text-xs mt-1 leading-snug font-normal">
          {chef.bio}
        </Text>

        <View className="flex justify-between items-center mt-3 pt-2.5 border-t border-white/[0.04]">
          <View className="flex items-center gap-1">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            <Text className="text-[11px] font-bold text-white">
              {chef.rating.toFixed(1)}
            </Text>
            <Text className="text-[10px] text-white/30">
              ({chef.experienceYears} ans exp.)
            </Text>
          </View>
          <Text className="text-xs font-black text-amber-400">
            {chef.dailyRate.toLocaleString()} FCFA{" "}
            <Text className="text-[9px] text-white/40 font-normal">/ jour</Text>
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

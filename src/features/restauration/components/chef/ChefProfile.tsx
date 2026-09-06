import { View, Text, Image } from "react-native";
import { Star, ShieldCheck, ChefHat, CalendarCheck } from "lucide-react-native";
import type { ChefProfile as ProfileType } from "../../types/chef.types";

interface ChefProfileProps {
  chef: ProfileType;
  onBook: () => void;
}

export function ChefProfile({ chef, onBook }: ChefProfileProps) {
  return (
    <View className="p-5 rounded-3xl space-y-5 text-left bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.06]">
      <View className="flex gap-4 items-center">
        <Image
         
         
          className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400/30 shrink-0"
         source={{ uri: chef.avatar }} accessibilityLabel={chef.name}/>
        <View className="min-w-0">
          <View className="flex items-center gap-2">
            <Text className="text-lg font-black text-white truncate">
              {chef.name}
            </Text>
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
          </View>
          <Text className="text-xs text-orange-400 font-semibold uppercase tracking-wider block mt-0.5">
            {chef.experienceYears} ans d'expérience culinaire
          </Text>
          <View className="flex items-center gap-1.5 mt-1.5">
            <Star size={13} className="text-amber-400 fill-amber-400" />
            <Text className="text-xs font-bold text-white">
              {chef.rating.toFixed(1)} / 5
            </Text>
          </View>
        </View>
      </View>

      <View className="space-y-1.5">
        <Text className="text-[10px] uppercase font-black tracking-wider text-white/40 flex items-center gap-1">
          <ChefHat size={12} /> Biographie & Philosophie
        </Text>
        <Text className="text-xs text-white/70 leading-relaxed font-normal">
          {chef.bio}
        </Text>
      </View>

      <View className="space-y-2">
        <Text className="text-[10px] uppercase font-black tracking-wider text-white/40">
          Spécialités de cuisine
        </Text>
        <View className="flex flex-wrap gap-1.5">
          {chef.specialties.map((spec) => (
            <Text
              key={spec}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-white/5 border border-white/[0.06]"
            >
              {spec}
            </Text>
          ))}
        </View>
      </View>

      <View className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-4">
        <View>
          <Text className="block text-[9px] text-white/30 uppercase font-bold">
            Tarification journalière
          </Text>
          <Text className="text-base font-black text-amber-400">
            {chef.dailyRate.toLocaleString()} FCFA{" "}
            <Text className="text-xs text-white/40 font-normal">/ jour</Text>
          </Text>
        </View>

        <Pressable
          onPress={onBook}
          disabled={!chef.available}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 disabled:bg-white/5 disabled:text-white/25 disabled:border-transparent text-[#020617] font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/10"
        >
          <CalendarCheck size={14} />
          {chef.available ? "Réserver le Chef" : "Indisponible"}
        </Pressable>
      </View>
    </View>
  );
}

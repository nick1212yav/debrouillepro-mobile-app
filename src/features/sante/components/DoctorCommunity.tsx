import { View, Text } from "react-native";
// src/features/sante/components/DoctorCommunity.tsx
import { Users, MessageCircle, Star } from "lucide-react-native";

interface DoctorCommunityProps {
  reviews: number;
  questions: number;
  followers: number;
}

export function DoctorCommunity({
  reviews,
  questions,
  followers,
}: DoctorCommunityProps) {
  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
        <Users size={14} /> Communauté
      </Text>
      <View className="gap-2">
        <View className="text-center p-2 rounded-xl bg-white/5">
          <Star size={16} className="mx-auto text-yellow-400" />
          <Text className="text-white font-bold text-sm">{reviews}</Text>
          <Text className="text-white/30 text-[10px]">Avis</Text>
        </View>
        <View className="text-center p-2 rounded-xl bg-white/5">
          <MessageCircle size={16} className="mx-auto text-blue-400" />
          <Text className="text-white font-bold text-sm">{questions}</Text>
          <Text className="text-white/30 text-[10px]">Questions</Text>
        </View>
        <View className="text-center p-2 rounded-xl bg-white/5">
          <Users size={16} className="mx-auto text-green-400" />
          <Text className="text-white font-bold text-sm">{followers}</Text>
          <Text className="text-white/30 text-[10px]"><Text>Abonnés</Text></Text>
        </View>
      </View>
    </View>
  );
}

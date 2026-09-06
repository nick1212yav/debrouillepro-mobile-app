import { View, Text } from "react-native";
import { DollarSign, TrendingUp, Users, Award, Zap } from "lucide-react-native";

interface Props {
  earnings: number;
  currency: string;
  followers: number;
  engagementRate: number;
  boostAvailable: boolean;
  onBoost: () => void;
}

export function CommunityMonetization({
  earnings,
  currency,
  followers,
  engagementRate,
  boostAvailable,
  onBoost,
}: Props) {
  return (
    <View className="space-y-3">
      <View className="flex items-center gap-2">
        <DollarSign size={16} className="text-white/30" />
        <Text className="text-sm font-medium text-white/50">Monétisation</Text>
      </View>

      <View className="gap-2">
        <View className="p-3 rounded-xl bg-white/5 border border-white/5">
          <View className="flex items-center gap-2">
            <DollarSign size={14} className="text-green-400" />
            <Text className="text-white/40 text-xs">Gains totaux</Text>
          </View>
          <Text className="text-white font-bold text-lg mt-1">
            {earnings} {currency}
          </Text>
        </View>
        <View className="p-3 rounded-xl bg-white/5 border border-white/5">
          <View className="flex items-center gap-2">
            <Users size={14} className="text-blue-400" />
            <Text className="text-white/40 text-xs">Abonnés</Text>
          </View>
          <Text className="text-white font-bold text-lg mt-1">{followers}</Text>
        </View>
        <View className="p-3 rounded-xl bg-white/5 border border-white/5">
          <View className="flex items-center gap-2">
            <TrendingUp size={14} className="text-purple-400" />
            <Text className="text-white/40 text-xs">Engagement</Text>
          </View>
          <Text className="text-white font-bold text-lg mt-1">{engagementRate}%</Text>
        </View>
        <View className="p-3 rounded-xl bg-white/5 border border-white/5">
          <View className="flex items-center gap-2">
            <Award size={14} className="text-yellow-400" />
            <Text className="text-white/40 text-xs"><Text>Statut</Text></Text>
          </View>
          <Text className="text-white font-bold text-lg mt-1"><Text>⭐ Créateur</Text></Text>
        </View>
      </View>

      {boostAvailable && (
        <Pressable
          onPress={onBoost}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center gap-2"
        >
          <Zap size={14} /> <Text>Booster votre contenu</Text></Pressable>
      )}
    </View>
  );
}

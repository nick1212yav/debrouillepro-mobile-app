import { View, Text } from "react-native";

// src/features/marketplace/components/SellerBadges.tsx
import { Award, CheckCircle } from "lucide-react-native";

interface Badge {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface Props {
  badges: Badge[];
  verified: boolean;
}

export function SellerBadges({ badges, verified }: Props) {
  if (!verified && badges.length === 0) return null;

  return (
    <View className="flex flex-wrap gap-2">{verified && (
        <Text className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/20"><CheckCircle size={12} />Vendeur vérifié
        </Text>
      )}{badges.map((badge) => (
        <Text key={badge.id} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border" style={{ backgroundColor: `${badge.color}20`, color: badge.color, borderColor: `${badge.color}30` }}><Text>{badge.icon}</Text>{badge.label}</Text>
      ))}</View>
  );
}

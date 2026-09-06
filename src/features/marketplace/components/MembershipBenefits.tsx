import { View, Text } from "react-native";
// src/features/marketplace/components/MembershipBenefits.tsx
import { Crown, Star, Zap, Gift, Truck, Shield } from "lucide-react-native";

interface Benefit {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  included: boolean;
}

interface Props {
  tier: "standard" | "premium" | "business";
  benefits: Benefit[];
}

const TIER_LABELS = {
  standard: "Standard",
  premium: "Premium",
  business: "Business",
};

const TIER_COLORS = {
  standard: "#8B5CF6",
  premium: "#F59E0B",
  business: "#10B981",
};

export function MembershipBenefits({ tier, benefits }: Props) {
  const color = TIER_COLORS[tier];

  return (
    <View className="space-y-3">
      <View className="flex items-center gap-2">
        <Crown size={18} style={{ color }} />
        <Text className="text-white font-bold text-sm">
          {TIER_LABELS[tier]}
        </Text>
        <Text className="text-xs text-white/40">— Avantages</Text>
      </View>
      <View className="gap-2">
        {benefits.map((benefit) => (
          <View
            key={benefit.id}
            className={`flex items-start gap-2 p-2 rounded-xl border ${
              benefit.included
                ? "bg-white/5 border-white/10"
                : "bg-white/5 border-white/5 opacity-40"
            }`}
          >
            <Text
              style={{
                color: benefit.included ? color : "rgba(255,255,255,0.3)",
              }}
            >
              {benefit.icon}
            </Text>
            <View>
              <Text className="text-white text-xs font-medium">{benefit.label}</Text>
              <Text className="text-white/30 text-[10px]">{benefit.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

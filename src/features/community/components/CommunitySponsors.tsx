import { Pressable, View, Text, Image } from "react-native";
import { Award, Star, Users, TrendingUp } from "lucide-react-native";

interface Sponsor {
  id: string;
  name: string;
  logo?: string;
  description: string;
  tier: "gold" | "silver" | "bronze";
  link?: string;
}

interface Props {
  sponsors: Sponsor[];
  onSelect: (sponsorId: string) => void;
}

const TIER_COLORS = {
  gold: "#F59E0B",
  silver: "#9CA3AF",
  bronze: "#D97706",
};

const TIER_LABELS = {
  gold: "⭐ Partenaire Or",
  silver: "🤝 Partenaire Argent",
  bronze: "🥉 Partenaire Bronze",
};

export function CommunitySponsors({ sponsors, onSelect }: Props) {
  if (!sponsors || sponsors.length === 0) return null;

  return (
    <View className="space-y-3">
      <View className="flex items-center gap-2">
        <Award size={16} className="text-white/30" />
        <Text className="text-sm font-medium text-white/50">Sponsors</Text>
      </View>
      <View className="space-y-2">
        {sponsors.map((sponsor) => {
          const color = TIER_COLORS[sponsor.tier];
          return (
            <Pressable
              key={sponsor.id}
              onPress={() => onSelect(sponsor.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left bg-white/5 border border-white/5"
            >
              {sponsor.logo ? (
                <Image
                 
                 
                  className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                 source={{ uri: sponsor.logo }} accessibilityLabel={sponsor.name}/>
              ) : (
                <View
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Award size={16} style={{ color }} />
                </View>
              )}
              <View className="flex-1 min-w-0">
                <Text className="text-white/80 text-sm font-medium truncate">
                  {sponsor.name}
                </Text>
                <Text className="text-white/40 text-xs truncate">
                  {sponsor.description}
                </Text>
                <Text className="text-[10px]" style={{ color }}>
                  {TIER_LABELS[sponsor.tier]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

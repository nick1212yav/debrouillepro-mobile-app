import { Pressable, View, Text, Image } from "react-native";
// src/features/events/components/EventSponsors.tsx
interface Sponsor {
  name: string;
  logo: string;
  website: string;
}

interface Props {
  sponsors: Sponsor[];
}

export function EventSponsors({ sponsors }: Props) {
  if (!sponsors || sponsors.length === 0) return null;

  return (
    <View className="space-y-3">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Sponsors
      </Text>
      <View className="flex flex-wrap gap-3">
        {sponsors.map((sponsor) => (
          <Pressable
            key={sponsor.name}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/5" accessibilityHint={sponsor.website}
          >
            <Image
             
             
              className="h-8 object-contain"
             source={{ uri: sponsor.logo }} accessibilityLabel={sponsor.name}/>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

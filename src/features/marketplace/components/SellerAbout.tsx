import { View, Text } from "react-native";
// src/features/marketplace/components/SellerAbout.tsx
import { User } from "lucide-react-native";

interface Props {
  bio: string;
  joinedAt: number;
  languages?: string[];
}

export function SellerAbout({ bio, joinedAt, languages }: Props) {
  const joinedDate = new Date(joinedAt).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <View className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5">
      <View className="flex items-center gap-2">
        <User size={16} className="text-purple-400" />
        <Text className="text-white font-medium">À propos du vendeur</Text>
      </View>
      <Text className="text-white/70 text-sm leading-relaxed">
        {bio || "Aucune description"}
      </Text>
      <View className="flex items-center gap-4 text-xs text-white/40">
        <Text><Text>Membre depuis</Text>{joinedDate}</Text>
        {languages && languages.length > 0 && (
          <Text><Text>Langues:</Text>{languages.join(", ")}</Text>
        )}
      </View>
    </View>
  );
}

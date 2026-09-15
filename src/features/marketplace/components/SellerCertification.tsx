import { View, Text } from "react-native";

// src/features/marketplace/components/SellerCertification.tsx
import { Award, CheckCircle } from "lucide-react-native";

interface Props {
  certifications: string[];
  verified: boolean;
}

export function SellerCertification({ certifications, verified }: Props) {
  if (!verified && (!certifications || certifications.length === 0))
    return null;

  return (
    <View className="space-y-2"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Certifications
      </Text><View className="flex flex-wrap gap-2">{verified && (
          <Text className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/20">
            <CheckCircle size={12} /> Vendeur vérifié
          </Text>
        )}{certifications.map((cert) => (
          <Text key={cert} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/20">
            <Award size={12} /> {cert}
          </Text>
        ))}</View></View>
  );
}

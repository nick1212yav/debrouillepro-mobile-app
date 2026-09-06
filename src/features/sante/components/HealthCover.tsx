import { View, Text, Image } from "react-native";
// src/features/sante/components/HealthCover.tsx
interface HealthCoverProps {
  imageUrl?: string;
  title: string;
  subtitle?: string;
}

export function HealthCover({ imageUrl, title, subtitle }: HealthCoverProps) {
  return (
    <View className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden">
      {imageUrl ? (
        <Image
         
         
          className="w-full h-full object-cover"
         source={{ uri: imageUrl }} accessibilityLabel={title}/>
      ) : (
        <View className="w-full h-full bg-gradient-to-br from-red-500/20 to-blue-500/20" />
      )}
      <View className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4">
        <Text className="text-white text-xl font-bold">{title}</Text>
        {subtitle && <Text className="text-white/70 text-sm">{subtitle}</Text>}
      </View>
    </View>
  );
}

import { Text, View, Image } from "react-native";
import { useState } from "react";
import { X, Loader2 } from "lucide-react-native";

interface Props {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export function CommunityImage({ src, alt, className = "", onClick }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!src) return null;

  return (
    <View className={`relative overflow-hidden ${className}`}>
      {isLoading && !hasError && (
        <View className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
        </View>
      )}
      {hasError ? (
        <View className="w-full h-full flex items-center justify-center bg-white/5">
          <Text className="text-white/20 text-4xl">🖼️</Text>
        </View>
      ) : (
        <Image
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          } ${onClick ? "cursor-pointer" : ""}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          onPress={onClick} source={{ uri: src }} accessibilityLabel={alt}
        />
      )}
    </View>
  );
}

import { View, Text, Pressable, Image } from "react-native";
import { useState } from "react";
import { Play, X, Loader2 } from "lucide-react-native";

interface Props {
  src: string;
  title: string;
  thumbnail?: string;
  className?: string;
}

export function CommunityVideo({
  src,
  title,
  thumbnail,
  className = "",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!src) return null;

  return (
    <>
      {/* Miniature cliquable */}
      <Pressable
        onPress={() => setIsOpen(true)}
        className={`relative rounded-xl overflow-hidden group cursor-pointer ${className}`}
      >
        {thumbnail ? (
          <Image
           
           
            className="w-full h-full object-cover"
           source={{ uri: thumbnail }} accessibilityLabel={title}/>
        ) : (
          <View
            src={src}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
        )}
        <View className="absolute inset-0 flex items-center justify-center bg-black/30">
          <View className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <Play size={28} className="text-white ml-1" />
          </View>
        </View>
      </Pressable>

      {/* Modal lecteur vidéo */}
      {isOpen && (
        <Pressable
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onPress={() => setIsOpen(false)}
        >
          <Pressable
            onPress={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white/70 z-10"
          >
            <X size={28} />
          </Pressable>
          <View className="relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden bg-black/50">
            {isLoading && (
              <View className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-white/60 animate-spin" />
              </View>
            )}
            {hasError ? (
              <View className="w-full h-full flex items-center justify-center">
                <Text className="text-white/40"><Text>Impossible de charger la vidéo</Text></Text>
              </View>
            ) : (
              <Pressable
                src={src}
                controls
                autoPlay
                className="w-full h-full"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                onPress={(e) => e.stopPropagation()}
              />
            )}
          </View>
        </Pressable>
      )}
    </>
  );
}

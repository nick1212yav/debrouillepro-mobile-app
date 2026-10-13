import { Pressable, Text, View, Image, Modal } from "react-native";
import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Loader2,
} from "lucide-react-native";

interface Props {
  images: string[];
  title: string;
}

export function ServiceGallery({ images, title }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});

  const validImages = images?.filter((img) => img && img.trim() !== "") ?? [];

  useEffect(() => {
    setCurrentIndex(0);
    setImgError({});
    setIsLoading({});
  }, [validImages.length]);

  if (validImages.length === 0) {
    return (
      <View className="relative h-64 rounded-2xl overflow-hidden bg-black/20 items-center justify-center">
        <Text className="text-white/20 text-4xl">🖼️</Text>
        <Text className="absolute bottom-4 text-white/30 text-sm">
          Aucune image
        </Text>
      </View>
    );
  }

  const currentImage = validImages[currentIndex];
  const hasError = imgError[currentIndex] === true;
  const isLoadingImg = isLoading[currentIndex] !== false;

  const goToPrevious = () => {
    setCurrentIndex((previous) =>
      previous > 0 ? previous - 1 : validImages.length - 1,
    );
  };

  const goToNext = () => {
    setCurrentIndex((previous) =>
      previous < validImages.length - 1 ? previous + 1 : 0,
    );
  };

  const handleImageError = (index: number) => {
    setImgError((previous) => ({ ...previous, [index]: true }));
    setIsLoading((previous) => ({ ...previous, [index]: false }));
  };

  const handleImageLoad = (index: number) => {
    setIsLoading((previous) => ({ ...previous, [index]: false }));
  };

  return (
    <>
      <View className="relative h-64 rounded-2xl overflow-hidden bg-black/20">
        <Pressable
          onPress={() => setIsFullscreen(true)}
          className="w-full h-full"
          accessibilityRole="image"
          accessibilityLabel={`${title} - ${currentIndex + 1}`}
        >
          {hasError ? (
            <View className="w-full h-full items-center justify-center bg-white/5">
              <Text className="text-white/20 text-4xl">🖼️</Text>
              <Text className="absolute bottom-4 text-white/30 text-xs">
                Image indisponible
              </Text>
            </View>
          ) : (
            <View className="relative w-full h-full">
              {isLoadingImg && (
                <View className="absolute inset-0 z-10 items-center justify-center bg-black/30">
                  <Loader2 size={32} color="rgba(255,255,255,0.6)" />
                </View>
              )}

              <Image
                key={`${currentImage}-${currentIndex}`}
                className={`w-full h-full ${
                  isLoadingImg ? "opacity-0" : "opacity-100"
                }`}
                resizeMode="cover"
                onError={() => handleImageError(currentIndex)}
                onLoad={() => handleImageLoad(currentIndex)}
                source={{ uri: currentImage }}
                accessibilityLabel={`${title} - ${currentIndex + 1}`}
              />
            </View>
          )}
        </Pressable>

        {validImages.length > 1 && (
          <>
            <Pressable
              onPress={goToPrevious}
              accessibilityRole="button"
              accessibilityLabel="Image précédente"
              className="absolute left-2 top-1/2 w-9 h-9 rounded-full bg-black/60 items-center justify-center z-10 active:opacity-70"
              style={{ marginTop: -18 }}
            >
              <ChevronLeft size={18} color="white" />
            </Pressable>

            <Pressable
              onPress={goToNext}
              accessibilityRole="button"
              accessibilityLabel="Image suivante"
              className="absolute right-2 top-1/2 w-9 h-9 rounded-full bg-black/60 items-center justify-center z-10 active:opacity-70"
              style={{ marginTop: -18 }}
            >
              <ChevronRight size={18} color="white" />
            </Pressable>

            <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5 z-10">
              {validImages.map((_, index) => (
                <Pressable
                  key={`${index}-${validImages[index]}`}
                  onPress={() => setCurrentIndex(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Aller à l'image ${index + 1}`}
                  className={`h-2 rounded-full ${
                    index === currentIndex ? "w-4 bg-white" : "w-2 bg-white/40"
                  }`}
                />
              ))}
            </View>

            <View className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-full z-10">
              <Text className="text-white text-xs">
                {currentIndex + 1} / {validImages.length}
              </Text>
            </View>

            <Pressable
              onPress={() => setIsFullscreen(true)}
              accessibilityRole="button"
              accessibilityLabel="Plein écran"
              className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/60 items-center justify-center z-10 active:opacity-70"
            >
              <Maximize2 size={14} color="white" />
            </Pressable>
          </>
        )}
      </View>

      <Modal
        visible={isFullscreen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFullscreen(false)}
        statusBarTranslucent
      >
        <View className="flex-1 bg-black/95 items-center justify-center p-4">
          <Pressable
            onPress={() => setIsFullscreen(false)}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            className="absolute top-12 right-4 w-10 h-10 rounded-full bg-white/10 items-center justify-center z-10 active:opacity-70"
          >
            <X size={22} color="rgba(255,255,255,0.85)" />
          </Pressable>

          <View className="w-full flex-1 items-center justify-center">
            {hasError ? (
              <Text className="text-white/20 text-6xl">🖼️</Text>
            ) : (
              <Image
                key={`fullscreen-${currentImage}-${currentIndex}`}
                className="w-full h-4/5"
                resizeMode="contain"
                onError={() => handleImageError(currentIndex)}
                source={{ uri: currentImage }}
                accessibilityLabel={`${title} - ${currentIndex + 1}`}
              />
            )}
          </View>

          {validImages.length > 1 && (
            <View className="flex-row items-center gap-4 mb-6 z-10">
              <Pressable
                onPress={goToPrevious}
                accessibilityRole="button"
                accessibilityLabel="Précédent"
                className="w-10 h-10 rounded-full bg-white/10 items-center justify-center active:opacity-70"
              >
                <ChevronLeft size={20} color="white" />
              </Pressable>

              <Text className="text-white/60 text-sm font-medium">
                {currentIndex + 1} / {validImages.length}
              </Text>

              <Pressable
                onPress={goToNext}
                accessibilityRole="button"
                accessibilityLabel="Suivant"
                className="w-10 h-10 rounded-full bg-white/10 items-center justify-center active:opacity-70"
              >
                <ChevronRight size={20} color="white" />
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

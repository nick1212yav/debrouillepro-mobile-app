import { Pressable, Text, View, Image } from "react-native";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2, Loader2 } from "lucide-react-native";

interface Props {
  images: string[];
  title: string;
}

export function ServiceGallery({ images, title }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});

  // ✅ Filtrer les images vides ou undefined
  const validImages = images?.filter((img) => img && img.trim() !== "") || [];

  // ✅ Log de debug pour voir ce qui arrive
  console.log("🔍 ServiceGallery - images reçues:", images);
  console.log("🔍 ServiceGallery - validImages:", validImages);

  // Réinitialiser l'index si les images changent
  useEffect(() => {
    setCurrentIndex(0);
  }, [validImages.length]);

  if (validImages.length === 0) {
    return (
      <View className="relative rounded-2xl overflow-hidden h-64 bg-black/20 flex items-center justify-center">
        <Text className="text-white/20 text-4xl">🖼️</Text>
        <Text className="absolute bottom-4 text-white/30 text-sm">Aucune image</Text>
      </View>
    );
  }

  const currentImage = validImages[currentIndex];
  const hasError = imgError[currentIndex];
  const isLoadingImg = isLoading[currentIndex] !== false;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
  };

  const handleImageError = (index: number) => {
    setImgError((prev) => ({ ...prev, [index]: true }));
    setIsLoading((prev) => ({ ...prev, [index]: false }));
  };

  const handleImageLoad = (index: number) => {
    setIsLoading((prev) => ({ ...prev, [index]: false }));
  };

  return (
    <>
      <View className="relative rounded-2xl overflow-hidden h-64 bg-black/20">
        {hasError ? (
          <View className="w-full h-full flex items-center justify-center bg-white/5">
            <Text className="text-white/20 text-4xl">🖼️</Text>
            <Text className="absolute bottom-4 text-white/30 text-xs">
              Image indisponible
            </Text>
          </View>
        ) : (
          <View className="relative w-full h-full">
            {isLoadingImg && (
              <View className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
              </View>
            )}
            <Image
              key={currentImage || `img-${currentIndex}`}
              className={`w-full h-full object-cover cursor-pointer transition-opacity duration-300 ${
                isLoadingImg ? "opacity-0" : "opacity-100"
              }`}
              onPress={() => setIsFullscreen(true)}
              onLoad={() => handleImageLoad(currentIndex)}
              onError={() => handleImageError(currentIndex)} source={{ uri: currentImage }} accessibilityLabel={`${title} - ${currentIndex + 1}`}
            />
          </View>
        )}

        {validImages.length > 1 && (
          <>
            <Pressable
              onPress={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center z-10"
              accessibilityLabel="Image précédente"
            >
              <ChevronLeft size={18} />
            </Pressable>
            <Pressable
              onPress={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center z-10"
              accessibilityLabel="Image suivante"
            >
              <ChevronRight size={18} />
            </Pressable>
            <View className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {validImages.map((_, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? "bg-white w-4"
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                  accessibilityLabel={`Aller à l'image ${idx + 1}`}
                />
              ))}
            </View>
            <View className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10">
              {currentIndex + 1} / {validImages.length}
            </View>
            <Pressable
              onPress={() => setIsFullscreen(true)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center z-10"
              accessibilityLabel="Plein écran"
            >
              <Maximize2 size={14} />
            </Pressable>
          </>
        )}
      </View>

      {/* Modal plein écran */}
      <>
        {isFullscreen && (
          <>
            <Pressable
              onPress={() => setIsFullscreen(false)}
              className="fixed inset-0 z-50 bg-black/95"
            />
            <View
              className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
            >
              <Pressable
                onPress={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 text-white/70 z-10"
                accessibilityLabel="Fermer"
              >
                <X size={28} />
              </Pressable>

              <View className="relative w-full max-w-5xl h-[80vh]">
                {hasError ? (
                  <View className="w-full h-full flex items-center justify-center">
                    <Text className="text-white/20 text-6xl">🖼️</Text>
                  </View>
                ) : (
                  <Image
                    key={currentImage || `fullscreen-${currentIndex}`}
                    className="w-full h-full object-contain"
                    onError={() => handleImageError(currentIndex)} source={{ uri: currentImage }} accessibilityLabel={`${title} - ${currentIndex + 1}`}
                  />
                )}
              </View>

              {validImages.length > 1 && (
                <View className="flex items-center gap-4 mt-4 z-10">
                  <Pressable
                    onPress={goToPrevious}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
                    accessibilityLabel="Précédent"
                  >
                    <ChevronLeft size={20} />
                  </Pressable>
                  <Text className="text-white/60 text-sm font-medium">
                    {currentIndex + 1} / {validImages.length}
                  </Text>
                  <Pressable
                    onPress={goToNext}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
                    accessibilityLabel="Suivant"
                  >
                    <ChevronRight size={20} />
                  </Pressable>
                </View>
              )}
            </View>
          </>
        )}
      </>
    </>
  );
}

import { View, Text, Pressable, Image } from "react-native";

// src/features/events/components/EventGallery.tsx
import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Loader2,
  ImageOff,
} from "lucide-react-native";

interface Props {
  images: string[];
  title: string;
  coverImage?: string;
}

export function EventGallery({ images, title, coverImage }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const containerRef = useRef<View>(null);

  // 🔍 LOGS DE DÉBOGAGE
  console.log("🔍 EventGallery - images reçues:", images);
  console.log("🔍 EventGallery - coverImage reçue:", coverImage);
  console.log("🔍 EventGallery - title:", title);

  // Construire la liste complète des images : cover en premier, puis la galerie
  const allImages = coverImage ? [coverImage, ...images] : images;
  const validImages =
    allImages?.filter((img) => img && img.trim() !== "") || [];

  console.log("🔍 EventGallery - allImages:", allImages);
  console.log("🔍 EventGallery - validImages:", validImages);

  // Réinitialiser l'index quand les images changent
  useEffect(() => {
    setCurrentIndex(0);
    setImgError({});
    setIsLoading({});
  }, [validImages.length]);

  if (validImages.length === 0) {
    return (
      <View className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-black/20 flex flex-col items-center justify-center">
        <ImageOff size={32} className="text-white/20 mb-2" />
        <Text className="text-white/30 text-sm">Aucune image disponible</Text>
        <Text className="text-white/20 text-xs mt-1">
          (images: {images?.length || 0}, cover: {coverImage ? "oui" : "non"})
        </Text>
      </View>
    );
  }

  const currentImage = validImages[currentIndex];
  const hasError = imgError[currentIndex] || false;
  const isLoadingImg = isLoading[currentIndex] !== false;

  console.log("🔍 EventGallery - currentImage:", currentImage);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
  };

  const handleImageError = (index: number) => {
    console.error(
      "❌ Erreur de chargement image index",
      index,
      validImages[index],
    );
    setImgError((prev) => ({ ...prev, [index]: true }));
    setIsLoading((prev) => ({ ...prev, [index]: false }));
  };

  const handleImageLoad = (index: number) => {
    console.log("✅ Image chargée index", index);
    setIsLoading((prev) => ({ ...prev, [index]: false }));
  };

  // Gestion du swipe tactile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || validImages.length <= 1) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrevious();
    }
    setTouchStartX(null);
  };

  return (
    <>
      <View
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-black/20 group"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {hasError ? (
          <View className="w-full h-full flex items-center justify-center bg-white/5">
            <View className="flex flex-col items-center gap-2">
              <ImageOff size={32} className="text-white/20" />
              <Text className="text-white/20 text-xs"><Text>Image indisponible</Text></Text>
            </View>
          </View>
        ) : (
          <View className="relative w-full h-full">
            {isLoadingImg && (
              <View className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
              </View>
            )}
            <Image
              key={currentIndex}
             
             
              className={`w-full h-full object-cover cursor-pointer transition-opacity duration-300 ${
                isLoadingImg ? "opacity-0" : "opacity-100"
              }`}
              onPress={() => setIsFullscreen(true)}
              onLoad={() => handleImageLoad(currentIndex)}
              onError={() => handleImageError(currentIndex)}
              loading="lazy"
             source={{ uri: currentImage }} accessibilityLabel={`${title} - ${currentIndex + 1}`}/>
          </View>
        )}

        {validImages.length > 1 && (
          <>
            <Pressable
              onPress={(e) => {
                goToPrevious();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center z-10 opacity-0"
              accessibilityLabel="Image précédente"
            >
              <ChevronLeft size={20} />
            </Pressable>
            <Pressable
              onPress={(e) => {
                goToNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center z-10 opacity-0"
              accessibilityLabel="Image suivante"
            >
              <ChevronRight size={20} />
            </Pressable>

            <View className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {validImages.map((_, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex
                      ? "bg-white w-5"
                      : "bg-white/40 w-1.5 hover:bg-white/60"
                  }`}
                  accessibilityLabel={`Image ${idx + 1}`}
                />
              ))}
            </View>

            <View className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full z-10">
              {currentIndex + 1} <Text>/</Text>{validImages.length}
            </View>

            <Pressable
              onPress={() => setIsFullscreen(true)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center z-10 opacity-70"
              accessibilityLabel="Plein écran"
            >
              <Maximize2 size={14} />
            </Pressable>
          </>
        )}
      </View>

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

              <View className="relative w-full max-w-5xl h-[80vh] flex items-center justify-center">
                {hasError ? (
                  <View className="flex flex-col items-center gap-4">
                    <ImageOff size={48} className="text-white/20" />
                    <Text className="text-white/30 text-sm">
                      Image indisponible
                    </Text>
                  </View>
                ) : (
                  <Image
                   
                   
                    className="w-full h-full object-contain"
                    onError={() => handleImageError(currentIndex)}
                   source={{ uri: currentImage }} accessibilityLabel={`${title} - ${currentIndex + 1}`}/>
                )}

                {validImages.length > 1 && (
                  <>
                    <Pressable
                      onPress={goToPrevious}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white z-10"
                      accessibilityLabel="Précédent"
                    >
                      <ChevronLeft size={24} />
                    </Pressable>
                    <Pressable
                      onPress={goToNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white z-10"
                      accessibilityLabel="Suivant"
                    >
                      <ChevronRight size={24} />
                    </Pressable>
                    <View className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {validImages.map((_, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => setCurrentIndex(idx)}
                          className={`h-2 rounded-full transition-all ${
                            idx === currentIndex
                              ? "bg-white w-6"
                              : "bg-white/40 w-2 hover:bg-white/60"
                          }`}
                          accessibilityLabel={`Image ${idx + 1}`}
                        />
                      ))}
                    </View>
                    <View className="absolute bottom-4 right-4 text-white/60 text-sm font-medium z-10">
                      {currentIndex + 1} / {validImages.length}
                    </View>
                  </>
                )}
              </View>
            </View>
          </>
        )}
      </>
    </>
  );
}

import { View, Text, Pressable, Image } from "react-native";

// src/features/immo/components/PropertyGallery.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2, Loader2 } from "lucide-react-native";

interface Props {
  images: string[];
  title: string;
}

/**
 * Galerie d'images avec :
 * - Navigation (flèches, miniatures, swipe)
 * - Plein écran avec animations
 * - Chargement progressif
 * - Gestion des erreurs
 * - Accessibilité clavier
 */
export function PropertyGallery({ images, title }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // ✅ Normaliser les images : si une image est une chaîne avec des virgules, on la découpe
  const normalizeImage = (img: string): string[] => {
    if (!img) return [];
    // Si la chaîne contient des virgules, on la découpe
    if (img.includes(",")) {
      return img
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [img];
  };

  // ✅ Aplatir les images en cas de chaînes avec virgules
  const rawImages = Array.isArray(images) ? images : [];
  const flatImages = rawImages.flatMap(normalizeImage);

  const validImages = flatImages.filter((img) => img && img.trim() !== "");
  if (validImages.length === 0) return null;

  const currentImage = validImages[currentIndex];
  const hasError = imgError[currentIndex];

  // Navigation
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
  }, [validImages.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
  }, [validImages.length]);

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  // Gestion des erreurs et chargement
  const handleImageError = (index: number) => {
    setImgError((prev) => ({ ...prev, [index]: true }));
    setIsLoading((prev) => ({ ...prev, [index]: false }));
  };

  const handleImageLoad = (index: number) => {
    setIsLoading((prev) => ({ ...prev, [index]: false }));
  };

  // Swipe tactile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) goToNext();
      else goToPrevious();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Navigation clavier (plein écran)
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      else if (e.key === "ArrowRight") goToNext();
      else if (e.key === "Escape") setIsFullscreen(false);
    };
    undefined;
    return () => undefined;
  }, [isFullscreen, goToPrevious, goToNext]);

  // Préchargement de l'image suivante pour une meilleure expérience
  useEffect(() => {
    const nextIndex = (currentIndex + 1) % validImages.length;
    const img = new Image();
    img.src = validImages[nextIndex];
  }, [currentIndex, validImages]);

  // Composant d'affichage de l'image avec gestion du chargement
  const renderImage = (src: string, index: number, className: string) => {
    const isLoadingImage = isLoading[index] !== false;
    const isError = imgError[index];

    if (isError) {
      return (
        <View className="w-full h-full flex items-center justify-center bg-white/5">
          <Text className="text-white/20 text-4xl">🖼️</Text>
        </View>
      );
    }

    return (
      <>
        {isLoadingImage && (
          <View className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
          </View>
        )}
        <Image
          key={src}
         
         
          className={`${className} ${isLoadingImage ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
          loading={index === 0 ? "eager" : "lazy"}
          onLoad={() => handleImageLoad(index)}
          onError={() => handleImageError(index)}
          onPress={() => setIsFullscreen(true)}
         source={{ uri: src }} accessibilityLabel={`${title} - ${index + 1}`}/>
      </>
    );
  };

  return (
    <>
      {/* Miniature principale avec navigation */}
      <View
        className="relative rounded-2xl overflow-hidden h-64 bg-black/20"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <View className="relative w-full h-full">
          {renderImage(
            currentImage,
            currentIndex,
            "w-full h-full object-cover cursor-pointer",
          )}
        </View>

        {/* Contrôles de navigation (si plus d'une image) */}
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

            {/* Miniatures en bas */}
            <View className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {validImages.map((_, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => goToIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? "bg-white w-4"
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                  accessibilityLabel={`Aller à l'image ${idx + 1}`}
                />
              ))}
            </View>

            {/* Compteur */}
            <View className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10">
              {currentIndex + 1} <Text>/</Text>{validImages.length}
            </View>

            {/* Bouton plein écran */}
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
            {/* Overlay */}
            <Pressable
              onPress={() => setIsFullscreen(false)}
              className="fixed inset-0 z-50 bg-black/95"
            />

            {/* Contenu modal */}
            <View
              className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Bouton fermer */}
              <Pressable
                onPress={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 text-white/70 z-20"
                accessibilityLabel="Fermer"
              >
                <X size={28} />
              </Pressable>

              {/* Image en grand */}
              <View className="relative w-full max-w-5xl h-[80vh]">
                {renderImage(
                  currentImage,
                  currentIndex,
                  "w-full h-full object-contain",
                )}
              </View>

              {/* Commandes de navigation */}
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

              {/* Miniatures sous l'image (optionnel) */}
              {validImages.length > 1 && (
                <View className="flex gap-2 mt-3 overflow-x-auto max-w-full px-4 pb-2">
                  {validImages.map((img, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => goToIndex(idx)}
                      className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentIndex
                          ? "border-white"
                          : "border-transparent opacity-50 hover:opacity-80"
                      }`}
                    >
                      <Image
                       
                       
                        className="w-full h-full object-cover"
                        loading="lazy"
                       source={{ uri: img }} accessibilityLabel={`Miniature ${idx + 1}`}/>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </>
    </>
  );
}

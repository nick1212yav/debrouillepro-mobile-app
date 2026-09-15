import { View, Pressable, Text, Image } from "react-native";

// src/features/marketplace/components/ProductGallery.tsx
import { useState, useMemo, useEffect } from "react";
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
}

export function ProductGallery({ images, title }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});

  // 🔍 LOG CRITIQUE
  console.log("🔍 [ProductGallery] images reçues:", images);
  console.log("🔍 [ProductGallery] type de images:", typeof images);
  console.log("🔍 [ProductGallery] images.length:", images?.length);

  // Filtrer les images valides (non vides)
  const validImages = useMemo(() => {
    const filtered = (images || []).filter((img) => img && img.trim() !== "");
    console.log("🔍 [ProductGallery] validImages après filtrage:", filtered);
    return filtered;
  }, [images]);

  // 🔍 LOG quand validImages change
  useEffect(() => {
    console.log("🔍 [ProductGallery] validImages.length:", validImages.length);
    if (validImages.length > 0) {
      console.log("🔍 [ProductGallery] première image:", validImages[0]);
    }
  }, [validImages]);

  // Réinitialiser les erreurs et les états de chargement quand la liste d'images change
  useEffect(() => {
    if (validImages.length === 0) return;
    setImgError({});
    setIsLoading({});
    setCurrentIndex(0);
  }, [validImages]);

  // Si aucune image valide
  if (validImages.length === 0) {
    console.log(
      "🔍 [ProductGallery] ❌ Aucune image valide, affichage du fallback",
    );
    return (
      <View className="relative rounded-2xl overflow-hidden aspect-square bg-black/20 flex flex-col items-center justify-center border border-white/5">
        <ImageOff size={32} className="text-white/20 mb-2" />
        <Text className="text-white/30 text-sm">Aucune image</Text>
      </View>
    );
  }

  const currentImage = validImages[currentIndex];
  console.log("🔍 [ProductGallery] currentImage:", currentImage);
  const hasError = imgError[currentIndex] || false;
  const isLoadingImg = isLoading[currentIndex] !== false;

  // Navigation
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
  };

  const handleImageError = (index: number) => {
    console.log(
      "🔍 [ProductGallery] ❌ Erreur de chargement pour l'image",
      index,
      validImages[index],
    );
    setImgError((prev) => ({ ...prev, [index]: true }));
    setIsLoading((prev) => ({ ...prev, [index]: false }));
  };

  const handleImageLoad = (index: number) => {
    console.log(
      "🔍 [ProductGallery] ✅ Image chargée avec succès",
      index,
      validImages[index],
    );
    setIsLoading((prev) => ({ ...prev, [index]: false }));
  };

  return (
    <>
      <View className="relative rounded-2xl overflow-hidden aspect-square bg-black/20 group border border-white/5">
        {hasError ? (
          <View className="w-full h-full flex flex-col items-center justify-center bg-white/5 p-4 text-center">
            <ImageOff size={32} className="text-white/20 mb-2" />
            <Text className="text-white/40 text-xs">Image indisponible</Text>
          </View>
        ) : (
          <View className="relative w-full h-full">
            {/* Indicateur de chargement */}
            {isLoadingImg && (
              <View className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
              </View>
            )}
            {/* Image principale */}
            <Image key={currentIndex} className={`w-full h-full object-cover cursor-pointer transition-opacity duration-300 ${
                isLoadingImg ? "opacity-0" : "opacity-100"
              }`} onPress={() => setIsFullscreen(true)}  source={{ uri: currentImage }} accessibilityLabel={`${title} - ${currentIndex + 1}`} />
          </View>
        )}

        {/* Contrôles de navigation (si > 1 image) */}
        {validImages.length > 1 && (
          <>
            <Pressable onPress={goToPrevious} accessibilityLabel="Image précédente" className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center transition-all z-10 opacity-0 focus:opacity-100 active:scale-95">
              <ChevronLeft size={20} />
            </Pressable>
            <Pressable onPress={goToNext} accessibilityLabel="Image suivante" className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center transition-all z-10 opacity-0 focus:opacity-100 active:scale-95">
              <ChevronRight size={20} />
            </Pressable>

            {/* Indicateurs de progression */}
            <View className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {validImages.map((_, idx) => (
                <Pressable key={idx} onPress={() => setCurrentIndex(idx)} className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex
                      ? "bg-white w-5"
                      : "bg-white/40 w-1.5 hover:bg-white/60"
                  }`} accessibilityLabel={`Image ${idx + 1}`} />
              ))}
            </View>

            {/* Compteur */}
            <View className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full z-10">
              {currentIndex + 1} / {validImages.length}
            </View>

            {/* Bouton plein écran */}
            <Pressable onPress={() => setIsFullscreen(true)} accessibilityLabel="Plein écran" className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center transition-all z-10">
              <Maximize2 size={14} />
            </Pressable>
          </>
        )}
      </View>

      {/* Modal plein écran */}
<View>
        {isFullscreen && (
          <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onPress={() => setIsFullscreen(false)}>
            <Pressable onPress={() => setIsFullscreen(false)} className="absolute top-4 right-4 text-white/70 z-10 transition-colors" accessibilityLabel="Fermer">
              <X size={28} />
            </Pressable>

            <View className="relative w-full max-w-4xl max-h-[80vh]">
              {hasError ? (
                <View className="w-full h-full flex items-center justify-center">
                  <ImageOff size={48} className="text-white/20" />
                </View>
              ) : (
                <Image className="w-full h-full object-contain" source={{ uri: currentImage }} accessibilityLabel={title} />
              )}

              {/* Indicateurs en plein écran */}
              {validImages.length > 1 && !hasError && (
                <View className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {validImages.map((_, idx) => (
                    <Pressable key={idx} onPress={() => setCurrentIndex(idx)} className={`h-2 rounded-full transition-all ${
                        idx === currentIndex
                          ? "bg-white w-6"
                          : "bg-white/40 w-2 hover:bg-white/60"
                      }`} accessibilityLabel={`Image ${idx + 1}`} />
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </>
  );
}

import { View, Text, Pressable, Image, GestureResponderEvent } from "react-native";

// src/features/community/components/CommunityGallery.tsx
import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, X, Maximize2, Loader2 } from "lucide-react-native";

interface Props {
  images: string[];
  title: string;
}

export function CommunityGallery({ images, title }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const containerRef = useRef<View>(null);

  const validImages = images?.filter((img) => img && img.trim() !== "") || [];

  useEffect(() => {
    setCurrentIndex(0);
  }, [validImages.length]);

  if (validImages.length === 0) {
    return (
      <View className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-black/20 flex items-center justify-center"><Text className="text-white/20 text-4xl">🖼️</Text><Text className="absolute bottom-4 text-white/30 text-sm">Aucune image</Text></View>
    );
  }

  const currentImage = validImages[currentIndex];
  const hasError = imgError[currentIndex];
  const isLoadingImg = isLoading[currentIndex] !== false;

  // Navigation
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
  };

  // Gestion du swipe tactile
  const handleTouchStart = (e: GestureResponderEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: GestureResponderEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrevious();
    }
    setTouchStartX(null);
  };

  // Gestion des erreurs / chargement
  const handleImageError = (index: number) => {
    setImgError((prev) => ({ ...prev, [index]: true }));
    setIsLoading((prev) => ({ ...prev, [index]: false }));
  };

  const handleImageLoad = (index: number) => {
    setIsLoading((prev) => ({ ...prev, [index]: false }));
  };

  // Composant : indicateur de pagination
  const PaginationDots = () => (
    <View className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">{validImages.map((_, idx) => (
        <Pressable key={idx} onPress={() => setCurrentIndex(idx)} className={`h-1.5 rounded-full transition-all ${
            idx === currentIndex
              ? "bg-white w-5"
              : "bg-white/40 w-1.5 hover:bg-white/60"
          }`} accessibilityLabel={`Image ${idx + 1}`} />
      ))}</View>
  );

  // Composant : compteur
  const Counter = () => (
    <View className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full z-10">{currentIndex + 1}<Text>/</Text>{validImages.length}</View>
  );

  // Rendu de l'image avec transition slide
  const ImageSlide = ({ index }: { index: number }) => {
    const image = validImages[index];
    const isActive = index === currentIndex;
    const direction = index > currentIndex ? 1 : -1;

    return (
      <View key={index} initial={isActive ? undefined : { x: direction * 50, opacity: 0 }} animate={isActive ? { x: 0, opacity: 1 } : { x: 0, opacity: 0 }} exit={!isActive ? { x: -direction * 50, opacity: 0 } : undefined} transition={{ duration: 0.3, ease: "easeInOut" }} className="absolute inset-0 w-full h-full">
        {imgError[index] ? (
          <View className="w-full h-full flex items-center justify-center bg-white/5"><Text className="text-white/20 text-4xl">🖼️</Text></View>
        ) : (
          <>
            {isLoading[index] !== false && (
              <View className="absolute inset-0 flex items-center justify-center bg-black/30 z-10"><Loader2 className="w-8 h-8 text-white/60 animate-spin" /></View>
            )}
            <Image className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoading[index] !== false ? "opacity-0" : "opacity-100"
              }`} onPress={() => setIsFullscreen(true)} source={{ uri: image }} accessibilityLabel={`${title} - ${index + 1}`} />
          </>
        )}
      </View>
    );
  };

  return (
    <>
      {/* Miniature (affichage principal) */}
      <View ref={containerRef} className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-black/20 group" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>{}<View className="relative w-full h-full"><View><ImageSlide index={currentIndex} /></View></View>{}{validImages.length > 1 && (
          <>
            <Pressable onPress={goToPrevious} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center transition-all z-10 opacity-0 focus:opacity-100 active:scale-95" accessibilityLabel="Précédent"><ChevronLeft size={20} /></Pressable>
            <Pressable onPress={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center transition-all z-10 opacity-0 focus:opacity-100 active:scale-95" accessibilityLabel="Suivant"><ChevronRight size={20} /></Pressable>

            <PaginationDots />
            <Counter />

            <Pressable onPress={() => setIsFullscreen(true)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center transition-all z-10 opacity-70 active:scale-95" accessibilityLabel="Plein écran"><Maximize2 size={14} /></Pressable>
          </>
        )}</View>

      {/* Mode plein écran */}
<View>
        {isFullscreen && (
          <>
            <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={() => setIsFullscreen(false)} className="fixed inset-0 z-50 bg-black/95" />
            <View initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <Pressable onPress={() => setIsFullscreen(false)} className="absolute top-4 right-4 text-white/70 z-10 transition-colors active:scale-95" accessibilityLabel="Fermer"><X size={28} /></Pressable>

              <View className="relative w-full max-w-5xl h-[80vh]"><View className="relative w-full h-full"><AnimatePresence mode="wait"><View key={currentIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="w-full h-full">{imgError[currentIndex] ? (
                        <View className="w-full h-full flex items-center justify-center">
                          <Text className="text-white/20 text-6xl">🖼️</Text>
                        </View>
                      ) : (
                        <Image className="w-full h-full object-contain" source={{ uri: currentImage }} accessibilityLabel={`${title} - ${currentIndex + 1}`} />
                      )}</View></AnimatePresence></View>{validImages.length > 1 && (
                  <>
                    <Pressable onPress={goToPrevious} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white transition-colors active:scale-95 z-10">
                      <ChevronLeft size={24} />
                    </Pressable>
                    <Pressable onPress={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white transition-colors active:scale-95 z-10">
                      <ChevronRight size={24} />
                    </Pressable>
                    <View className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {validImages.map((_, idx) => (
                        <Pressable key={idx} onPress={() => setCurrentIndex(idx)} className={`h-2 rounded-full transition-all ${
                            idx === currentIndex
                              ? "bg-white w-6"
                              : "bg-white/40 w-2 hover:bg-white/60"
                          }`} accessibilityLabel={`Image ${idx + 1}`} />
                      ))}
                    </View>
                    <View className="absolute bottom-4 right-4 text-white/60 text-sm font-medium z-10">
                      {currentIndex + 1} / {validImages.length}
                    </View>
                  </>
                )}</View>
            </View>
          </>
        )}
      </View>
    </>
  );
}

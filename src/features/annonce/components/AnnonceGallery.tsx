import { View, Text, Pressable, Image } from "react-native";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2, Loader2 } from "lucide-react-native";

interface Props {
  images: string[];
  title: string;
  video?: string;
}

export function AnnonceGallery({ images, title, video }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});

  const validImages = images.filter((img) => img && img.trim() !== "");
  const hasImages = validImages.length > 0;
  const hasVideo = video && video.trim() !== "";

  if (!hasImages && !hasVideo) return null;

  const currentImage = hasImages ? validImages[currentIndex] : null;
  const hasError = currentImage ? imgError[currentIndex] : false;
  const totalMedia = (hasImages ? validImages.length : 0) + (hasVideo ? 1 : 0);

  const goToPrevious = () => {
    if (!hasImages) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
  };

  const goToNext = () => {
    if (!hasImages) return;
    setCurrentIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
  };

  const handleImageError = (index: number) => {
    setImgError((prev) => ({ ...prev, [index]: true }));
    setIsLoading((prev) => ({ ...prev, [index]: false }));
  };

  const handleImageLoad = (index: number) => {
    setIsLoading((prev) => ({ ...prev, [index]: false }));
  };

  const renderMedia = (className: string) => {
    if (hasVideo && currentIndex === 0) {
      return (
        <video
          src={video}
          className={className}
          controls
          autoPlay={isFullscreen}
          playsInline
        />
      );
    }

    const imgIndex = hasVideo ? currentIndex - 1 : currentIndex;
    const src = validImages[imgIndex];
    const isLoadingImg = isLoading[imgIndex] !== false;
    const isError = imgError[imgIndex];

    if (isError) {
      return (
        <View className="w-full h-full flex items-center justify-center bg-white/5"><Text className="text-white/20 text-4xl">🖼️</Text></View>
      );
    }

    return (
      <>
        {isLoadingImg && (
          <View className="absolute inset-0 flex items-center justify-center bg-black/30"><Loader2 className="w-8 h-8 text-white/60 animate-spin" /></View>
        )}
        <Image className={`${className} ${isLoadingImg ? "opacity-0" : "opacity-100"} transition-opacity duration-300`} onPress={() => setIsFullscreen(true)} source={{ uri: src }} accessibilityLabel={title} />
      </>
    );
  };

  return (
    <>
      <View className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-black/20"><View className="relative w-full h-full">{renderMedia("w-full h-full object-cover cursor-pointer")}</View>{totalMedia > 1 && (
          <>
            <Pressable onPress={goToPrevious} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center transition-colors z-10">
              <ChevronLeft size={18} />
            </Pressable>
            <Pressable onPress={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center transition-colors z-10">
              <ChevronRight size={18} />
            </Pressable>

            <View className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {Array.from({ length: totalMedia }).map((_, idx) => (
                <Pressable key={idx} onPress={() => setCurrentIndex(idx)} className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? "bg-white w-4"
                      : "bg-white/40 hover:bg-white/60"
                  }`} />
              ))}
            </View>

            <View className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full z-10">
              {currentIndex + 1} / {totalMedia}
            </View>

            <Pressable onPress={() => setIsFullscreen(true)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center transition-colors z-10">
              <Maximize2 size={14} />
            </Pressable>
          </>
        )}</View>

      {/* Modal plein écran */}
<View>
        {isFullscreen && (
          <>
            <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={() => setIsFullscreen(false)} className="fixed inset-0 z-50 bg-black/95" />
            <View initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
              <Pressable onPress={() => setIsFullscreen(false)} className="absolute top-4 right-4 text-white/70 z-20 transition-colors">
                <X size={28} />
              </Pressable>
              <View className="relative w-full max-w-5xl h-[80vh]">
                {renderMedia("w-full h-full object-contain")}
              </View>
              {totalMedia > 1 && (
                <View className="flex items-center gap-4 mt-4 z-10">
                  <Pressable onPress={goToPrevious} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white transition-colors">
                    <ChevronLeft size={20} />
                  </Pressable>
                  <Text className="text-white/60 text-sm font-medium">
                    {currentIndex + 1} / {totalMedia}
                  </Text>
                  <Pressable onPress={goToNext} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white transition-colors">
                    <ChevronRight size={20} />
                  </Pressable>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </>
  );
}

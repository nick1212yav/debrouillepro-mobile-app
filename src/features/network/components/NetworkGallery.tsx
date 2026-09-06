import { View, Pressable, Image } from "react-native";
// src/features/network/components/NetworkGallery.tsx
import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react-native";

interface NetworkGalleryProps {
  images: string[];
  alt?: string;
}

export function NetworkGallery({ images, alt = "" }: NetworkGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const count = images.length;
  const display = images.slice(0, 4);
  const remaining = Math.max(0, count - 4);

  const renderImage = (src: string, idx: number, className = "") => {
    return (
      <Image
        key={`${src}-${idx}`}
       
       
        className={`w-full h-full object-contain bg-black/10 ${className}`}
        loading="lazy"
        onPress={(e) => {
          setSelectedIndex(idx);
        }}
        onError={(e) => {
          console.error("❌ NetworkGallery image error:", src);
          e.currentTarget.style.display = "none";
        }}
       source={{ uri: src }} accessibilityLabel={`${alt} ${idx + 1}`}/>
    );
  };

  // ─── 1 image ──────────────────────────────────────────────────────────────
  if (count === 1) {
    return (
      <>
        <View className="overflow-hidden rounded-2xl bg-white/5 border border-white/10">
          <View className="max-h-[560px] min-h-[240px] overflow-hidden">
            {renderImage(display[0], 0, "object-cover")}
          </View>
        </View>
        {selectedIndex !== null && (
          <ImageModal
            images={images}
            initialIndex={selectedIndex}
            onClose={() => setSelectedIndex(null)}
          />
        )}
      </>
    );
  }

  // ─── 2 images ──────────────────────────────────────────────────────────────
  if (count === 2) {
    return (
      <>
        <View className="gap-2 overflow-hidden rounded-2xl">
          {display.map((src, i) => (
            <View
              key={i}
              className="aspect-square overflow-hidden rounded-xl bg-white/5 border border-white/5"
            >
              {renderImage(src, i)}
            </View>
          ))}
        </View>
        {selectedIndex !== null && (
          <ImageModal
            images={images}
            initialIndex={selectedIndex}
            onClose={() => setSelectedIndex(null)}
          />
        )}
      </>
    );
  }

  // ─── 3 images ──────────────────────────────────────────────────────────────
  if (count === 3) {
    return (
      <>
        <View className="gap-2 overflow-hidden rounded-2xl auto-rows-[1fr]">
          <View className="overflow-hidden rounded-xl bg-white/5 border border-white/5">
            {renderImage(display[0], 0)}
          </View>
          <View className="aspect-square overflow-hidden rounded-xl bg-white/5 border border-white/5">
            {renderImage(display[1], 1)}
          </View>
          <View className="aspect-square overflow-hidden rounded-xl bg-white/5 border border-white/5">
            {renderImage(display[2], 2)}
          </View>
        </View>
        {selectedIndex !== null && (
          <ImageModal
            images={images}
            initialIndex={selectedIndex}
            onClose={() => setSelectedIndex(null)}
          />
        )}
      </>
    );
  }

  // ─── 4+ images ─────────────────────────────────────────────────────────────
  return (
    <>
      <View className="gap-2 overflow-hidden rounded-2xl">
        {display.map((src, i) => (
          <View
            key={i}
            className="relative aspect-square overflow-hidden rounded-xl bg-white/5 border border-white/5"
          >
            {renderImage(src, i)}
            {i === 3 && remaining > 0 && (
              <Pressable
                type="button"
                className="absolute inset-0 flex items-center justify-center bg-black/60 text-2xl font-bold text-white"
                onPress={(e) => {
                  setSelectedIndex(3);
                }}
              >
                +{remaining}
              </Pressable>
            )}
          </View>
        ))}
      </View>
      {selectedIndex !== null && (
        <ImageModal
          images={images}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}

// ─── Modal de visualisation ───────────────────────────────────────────────────
function ImageModal({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goPrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <Pressable
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onPress={onClose}
    >
      <Pressable
        type="button"
        onPress={onClose}
        className="absolute right-5 top-5 z-10 rounded-full bg-white/10 px-4 py-2 text-xl text-white"
      >
        <X size={24} />
      </Pressable>

      {images.length > 1 && (
        <>
          <Pressable
            type="button"
            onPress={(e) => {
              goPrev();
            }}
            className="absolute left-5 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-3 text-white"
          >
            <ChevronLeft size={28} />
          </Pressable>
          <Pressable
            type="button"
            onPress={(e) => {
              goNext();
            }}
            className="absolute right-5 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-3 text-white"
          >
            <ChevronRight size={28} />
          </Pressable>
          <View className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {images.map((_, i) => (
              <Pressable
                key={i}
               
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? "bg-white" : "bg-white/30"
                }`}
                onPress={(e) => {
                  setCurrentIndex(i);
                }}
              />
            ))}
          </View>
        </>
      )}

      <Image
       
       
        className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"
        onPress={(e) => e.stopPropagation()}
       source={{ uri: images[currentIndex] }} accessibilityLabel={`Image ${currentIndex + 1}`}/>
    </Pressable>
  );
}

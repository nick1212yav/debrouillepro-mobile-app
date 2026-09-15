import { View, Image, Text, Pressable, GestureResponderEvent } from "react-native";

// src/features/marketplace/components/Product360Viewer.tsx
import { useState, useRef } from "react";
import { RotateCw, ZoomIn, ZoomOut, X } from "lucide-react-native";

interface Props {
  images: string[];
  title: string;
}

export function Product360Viewer({ images, title }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<View>(null);

  if (!images || images.length < 4) return null;

  const handleMouseDown = (e: GestureResponderEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: GestureResponderEvent) => {
    if (!isDragging) return;
    const diff = startX - e.clientX;
    if (Math.abs(diff) > 20) {
      const newIndex =
        diff > 0
          ? (currentIndex + 1) % images.length
          : (currentIndex - 1 + images.length) % images.length;
      setCurrentIndex(newIndex);
      setStartX(e.clientX);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <>
      <View ref={containerRef} className="relative rounded-2xl overflow-hidden aspect-square bg-black/20 group"><Image className="w-full h-full object-cover" source={{ uri: images[currentIndex] }} accessibilityLabel={`${title} - Vue 360° ${currentIndex + 1}`} /><View className="absolute inset-0 flex items-center justify-between pointer-events-none"><View className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-auto"><RotateCw size={20} className="text-white/60 animate-spin-slow" /></View></View><View className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-white/60 text-xs">{currentIndex + 1}<Text>/</Text>{images.length}</View><Pressable onPress={() => setIsFullscreen(true)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 transition-opacity"><ZoomIn size={14} className="text-white" /></Pressable></View>

      {isFullscreen && (
        <View className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"><Pressable onPress={() => setIsFullscreen(false)} className="absolute top-4 right-4 text-white/70 transition-colors"><X size={28} /></Pressable><View className="relative w-full max-w-4xl aspect-square"><Image className="w-full h-full object-contain" source={{ uri: images[currentIndex] }} accessibilityLabel={title} /><View className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">{images.map((_, idx) => (
                <Pressable key={idx} onPress={() => setCurrentIndex(idx)} className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex ? "bg-white w-6" : "bg-white/40"
                  }`} />
              ))}</View></View></View>
      )}
    </>
  );
}

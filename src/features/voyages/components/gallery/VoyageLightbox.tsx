import { View, Pressable, Image, Linking, NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";

// src/features/voyages/components/gallery/VoyageLightbox.tsx
import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react-native";
import { VoyageGalleryCounter } from "./VoyageGalleryCounter";
import { cn } from "@/lib/utils";

interface VoyageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
  className?: string;
}

export function VoyageLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  alt = "",
  className = "",
}: VoyageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  if (!isOpen || images.length === 0) return null;

  const goPrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `voyage-photo-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      // fallback: ouvrir dans un nouvel onglet
      Linking.openURL(String(url));
    }
  };

  return (
<View>
      {isOpen && (
        <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4",
            className,
          )} onPress={onClose}>
          {/* Fermeture */}
          <Pressable onPress={onClose} className="absolute top-5 right-5 z-10 p-2 rounded-full bg-white/10 transition text-white/80">
            <X size={24} />
          </Pressable>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <Pressable onPress={(e) => {
                  goPrev();
                }} className="absolute left-5 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 transition text-white/80">
                <ChevronLeft size={28} />
              </Pressable>
              <Pressable onPress={(e) => {
                  goNext();
                }} className="absolute right-5 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 transition text-white/80">
                <ChevronRight size={28} />
              </Pressable>
            </>
          )}

          {/* Compteur */}
          <View className="absolute top-5 left-1/2 -translate-x-1/2 z-10">
            <VoyageGalleryCounter
              current={currentIndex + 1}
              total={images.length}
            />
          </View>

          {/* Téléchargement */}
          <Pressable onPress={(e) => {
              handleDownload(images[currentIndex]);
            }} className="absolute bottom-5 right-5 z-10 p-2 rounded-full bg-white/10 transition text-white/60">
            <Download size={20} />
          </Pressable>

          {/* Indicateurs de progression (dots) */}
          {images.length > 1 && (
            <View className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              {images.map((_, i) => (
                <Pressable key={i} className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    i === currentIndex ? "bg-white" : "bg-white/30",
                  )} onPress={(e) => {
                    setCurrentIndex(i);
                  }} />
              ))}
            </View>
          )}

          {/* Image */}
          <Image key={currentIndex} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} src={images[currentIndex]} alt={`${alt} ${currentIndex + 1}`} className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl" onPress={(e) => e.stopPropagation()} />
        </View>
      )}
    </View>
  );
}

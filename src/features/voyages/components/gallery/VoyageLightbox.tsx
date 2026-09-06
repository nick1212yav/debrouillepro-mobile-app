// src/features/voyages/components/gallery/VoyageLightbox.tsx

import {
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";
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
  const { width, height } = useWindowDimensions();

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (images.length === 0) {
      return 0;
    }

    return Math.min(Math.max(initialIndex, 0), images.length - 1);
  });

  useEffect(() => {
    if (images.length === 0) {
      setCurrentIndex(0);
      return;
    }

    setCurrentIndex(Math.min(Math.max(initialIndex, 0), images.length - 1));
  }, [images.length, initialIndex]);

  const goPrev = useCallback(() => {
    if (images.length <= 1) {
      return;
    }

    setCurrentIndex((previous) =>
      previous > 0 ? previous - 1 : images.length - 1,
    );
  }, [images.length]);

  const goNext = useCallback(() => {
    if (images.length <= 1) {
      return;
    }

    setCurrentIndex((previous) =>
      previous < images.length - 1 ? previous + 1 : 0,
    );
  }, [images.length]);

  const handleDownload = useCallback(async () => {
    const imageUrl = images[currentIndex];

    if (!imageUrl) {
      return;
    }

    try {
      const supported = await Linking.canOpenURL(imageUrl);

      if (!supported) {
        return;
      }

      await Linking.openURL(imageUrl);
    } catch (error) {
      console.error(
        "Impossible d'ouvrir l'image pour le téléchargement :",
        error,
      );
    }
  }, [currentIndex, images]);

  if (!isOpen || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  const imageWidth = Math.min(width * 0.9, 900);
  const imageHeight = Math.min(height * 0.8, 800);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(150)}
        className={cn(
          "flex-1 items-center justify-center bg-black/95 p-4",
          className,
        )}
      >
        {/* BACKDROP */}

        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer la galerie"
        />

        {/* CLOSE */}

        <Pressable
          onPress={onClose}
          hitSlop={10}
          className="absolute right-5 top-14 z-20 h-11 w-11 items-center justify-center rounded-full bg-white/10"
          accessibilityRole="button"
          accessibilityLabel="Fermer"
        >
          <X size={24} color="rgba(255,255,255,0.9)" />
        </Pressable>

        {/* COUNTER */}

        <View className="absolute left-0 right-0 top-14 z-20 items-center">
          <VoyageGalleryCounter
            current={currentIndex + 1}
            total={images.length}
          />
        </View>

        {/* PREVIOUS */}

        {images.length > 1 && (
          <Pressable
            onPress={goPrev}
            hitSlop={10}
            className="absolute left-4 top-1/2 z-20 h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10"
            accessibilityRole="button"
            accessibilityLabel="Image précédente"
          >
            <ChevronLeft size={28} color="rgba(255,255,255,0.9)" />
          </Pressable>
        )}

        {/* NEXT */}

        {images.length > 1 && (
          <Pressable
            onPress={goNext}
            hitSlop={10}
            className="absolute right-4 top-1/2 z-20 h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10"
            accessibilityRole="button"
            accessibilityLabel="Image suivante"
          >
            <ChevronRight size={28} color="rgba(255,255,255,0.9)" />
          </Pressable>
        )}

        {/* IMAGE */}

        <View
          style={{
            width: imageWidth,
            height: imageHeight,
          }}
          className="items-center justify-center"
          accessible
          accessibilityLabel={`${alt || "Photo du voyage"} ${
            currentIndex + 1
          } sur ${images.length}`}
        >
          <Animated.View
            key={`${currentImage}-${currentIndex}`}
            entering={ZoomIn.duration(180)}
            exiting={ZoomOut.duration(150)}
            className="h-full w-full items-center justify-center"
          >
            <Image
              source={{ uri: currentImage }}
              resizeMode="contain"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 16,
              }}
            />
          </Animated.View>
        </View>

        {/* DOWNLOAD */}

        <Pressable
          onPress={() => {
            void handleDownload();
          }}
          hitSlop={10}
          className="absolute bottom-8 right-5 z-20 h-11 w-11 items-center justify-center rounded-full bg-white/10"
          accessibilityRole="button"
          accessibilityLabel="Ouvrir l'image"
        >
          <Download size={20} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {/* DOTS */}

        {images.length > 1 && (
          <View className="absolute bottom-10 left-0 right-0 z-20 flex-row items-center justify-center gap-2 px-16">
            {images.map((image, index) => (
              <Pressable
                key={`${image}-${index}`}
                onPress={() => setCurrentIndex(index)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Afficher l'image ${index + 1}`}
                accessibilityState={{
                  selected: index === currentIndex,
                }}
              >
                <View
                  className={[
                    "h-2 w-2 rounded-full",
                    index === currentIndex ? "bg-white" : "bg-white/30",
                  ].join(" ")}
                />
              </Pressable>
            ))}
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

export default VoyageLightbox;

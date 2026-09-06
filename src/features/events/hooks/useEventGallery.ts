// src/features/events/hooks/useEventGallery.ts
import { useState, useEffect } from "react";

export function useEventGallery(images: string[], initialIndex: number = 0) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, images.length]);

  const goToPrevious = () =>
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  const goToNext = () =>
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));

  return {
    currentIndex,
    setCurrentIndex,
    isFullscreen,
    setIsFullscreen,
    goToPrevious,
    goToNext,
  };
}

// src/features/voyages/hooks/useVoyageGallery.ts
import { useState, useCallback } from "react";
import type { VoyageTrip } from "../types";

/**
 * Gère l'état de la galerie d'images pour un voyage.
 */
export function useVoyageGallery(trip: VoyageTrip | null | undefined) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openGallery = useCallback((index: number = 0) => {
    setCurrentIndex(index);
    setIsOpen(true);
  }, []);

  const closeGallery = useCallback(() => {
    setIsOpen(false);
  }, []);

  const nextImage = useCallback(() => {
    const images = trip?.imageUrl ? [trip.imageUrl] : [];
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [trip]);

  const prevImage = useCallback(() => {
    const images = trip?.imageUrl ? [trip.imageUrl] : [];
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [trip]);

  return {
    isOpen,
    currentIndex,
    openGallery,
    closeGallery,
    nextImage,
    prevImage,
    hasImages: trip?.imageUrl ? true : false,
    imageCount: trip?.imageUrl ? 1 : 0,
  };
}

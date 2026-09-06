import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";
// src/pages/modules/VoyagesDetailPage.tsx
import { useCallback, useState } from "react";
import { ArrowLeft, Heart, Share2, Loader2, AlertCircle } from "lucide-react-native";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api.js";

// Composants du module Voyages importés depuis leurs dossiers réels
import { VoyageHero } from "@/features/voyages/components/detail/VoyageHero";
import { VoyageGallery } from "@/features/voyages/components/detail/VoyageGallery";
import { VoyageRoute } from "@/features/voyages/components/detail/VoyageRoute";
import { VoyageInfo } from "@/features/voyages/components/detail/VoyageInfo";
import { VoyageAmenities } from "@/features/voyages/components/detail/VoyageAmenities";
import { VoyageAvailability } from "@/features/voyages/components/detail/VoyageAvailability";
import { VoyageOperator } from "@/features/voyages/components/detail/VoyageOperator";
import { VoyageMap } from "@/features/voyages/components/detail/VoyageMap";
import { VoyageNearby } from "@/features/voyages/components/detail/VoyageNearby";
import { VoyageSimilar } from "@/features/voyages/components/detail/VoyageSimilar";
import { VoyageStickyBar } from "@/features/voyages/components/detail/VoyageStickyBar";
import { VoyageSafety } from "@/features/voyages/components/detail/VoyageSafety";
import { VoyagePolicies } from "@/features/voyages/components/detail/VoyagePolicies";
import { VoyageReviews } from "@/features/voyages/components/detail/VoyageReviews";

// Hooks du module Voyages
import { useVoyageBooking } from "@/features/voyages/hooks/useVoyageBooking";
import { useVoyageFavorites } from "@/features/voyages/hooks/useVoyageFavorites";
import { useVoyageShare } from "@/features/voyages/hooks/useVoyageShare";

// ─── Interface des props ──────────────────────────────────────────────────

interface VoyagesDetailPageProps {
  tripId: string;
  onBack: () => void;
}

// ─── Composant principal ──────────────────────────────────────────────────

export default function VoyagesDetailPage({
  tripId,
  onBack,
}: VoyagesDetailPageProps) {
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showBooking, setShowBooking] = useState(false);

  // Récupération du voyage via Convex avec l'ID fourni en prop
  const trip = useQuery(
    api.voyages.getTrip,
    tripId ? { id: tripId as any } : "skip",
  );

  const { isFavorite, toggle } = useVoyageFavorites();
  const { startBooking } = useVoyageBooking();
  const { share } = useVoyageShare();

  const loading = trip === undefined;
  const notFound = trip === null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  const handleFavorite = useCallback(async () => {
    if (!trip) return;
    try {
      const added = await toggle(trip._id as any);
      UIService.openToast(added ? "Voyage ajouté aux favoris" : "Voyage retiré des favoris", "success");
    } catch {
      UIService.openToast("Impossible de modifier les favoris", "error");
    }
  }, [trip, toggle]);

  const handleShare = useCallback(async () => {
    if (!trip) return;
    try {
      await share({
        title: `${trip.from} → ${trip.to}`,
        text: `${trip.operator} • ${trip.type}`,
        url: undefined.href,
      });
    } catch {
      UIService.openToast("Impossible de partager ce voyage", "error");
    }
  }, [trip, share]);

  const handleBook = useCallback(() => {
    if (!trip) return;
    setShowBooking(true);
    startBooking(trip._id);
  }, [trip, startBooking]);

  // ── Affichage du chargement ─────────────────────────────────────────────

  if (loading) {
    return (
      <View className="min-h-screen bg-[#020412] text-white">
        <View className="sticky top-0 z-50 px-4 py-4 bg-[#020412]/80 border-b border-white/10">
          <Pressable
            onPress={handleBack}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </Pressable>
        </View>
        <View className="min-h-[70vh] flex items-center justify-center">
          <View className="text-center">
            <Loader2
              size={34}
              className="animate-spin text-indigo-400 mx-auto mb-4"
            />
            <Text className="text-white/60">Chargement du voyage...</Text>
          </View>
        </View>
      </View>
    );
  }

  // ── Affichage "introuvable" ─────────────────────────────────────────────

  if (notFound) {
    return (
      <View className="min-h-screen bg-[#020412] text-white flex items-center justify-center px-6">
        <View className="max-w-md w-full text-center">
          <View className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <AlertCircle size={30} className="text-red-400" />
          </View>
          <Text className="text-xl font-bold mb-2">Voyage introuvable</Text>
          <Text className="text-white/50 text-sm mb-6">
            Ce trajet n'existe plus ou n'est plus disponible.
          </Text>
          <Pressable
            onPress={handleBack}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 font-semibold"
          >
            <Text>Retour aux voyages</Text></Pressable>
        </View>
      </View>
    );
  }

  // ── Contenu principal ──────────────────────────────────────────────────

  return (
    <View className="min-h-screen bg-gradient-to-br from-[#050812] via-[#0c1022] to-[#020412] text-white pb-32">
      {/* Ambient glow */}
      <View className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/10" />

      {/* Header */}
      <View className="sticky top-0 z-40 bg-[#050812]/80 border-b border-white/10">
        <View className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Pressable
            onPress={handleBack}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <ArrowLeft size={19} />
          </Pressable>

          <View className="flex-1 min-w-0">
            <Text className="text-sm font-semibold truncate">
              {trip.from} → {trip.to}
            </Text>
            <Text className="text-[11px] text-white/40">{trip.operator}</Text>
          </View>

          <Pressable
            onPress={handleFavorite}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <Heart
              size={18}
              className={
                isFavorite(trip._id as any)
                  ? "fill-red-400 text-red-400"
                  : "text-white/70"
              }
            />
          </Pressable>

          <Pressable
            onPress={handleShare}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <Share2 size={18} />
          </Pressable>
        </View>
      </View>

      {/* Corps */}
      <View className="relative max-w-6xl mx-auto">
        {/* Hero */}
        <VoyageHero trip={trip} onGallery={() => setShowGallery(true)} />

        {/* Galerie miniature */}
        <View className="px-4 mt-4">
          <VoyageGallery
            trip={trip}
            selectedIndex={galleryIndex}
            onSelect={setGalleryIndex}
            onOpen={() => setShowGallery(true)}
          />
        </View>

        {/* Grille principale */}
        <View className="gap-6 px-4 mt-6">
          <View className="space-y-5">
            <VoyageRoute trip={trip} />
            <VoyageInfo trip={trip} />
            <VoyageAmenities amenities={trip.amenities} />
            <VoyageOperator trip={trip} />
            <VoyageAvailability trip={trip} />
            <VoyageMap trip={trip} />
            <VoyageSafety trip={trip} />
            <VoyagePolicies trip={trip} />
            <VoyageReviews trip={trip} />
            <VoyageNearby trip={trip} />
            <VoyageSimilar trip={trip} />
          </View>

          {/* Barre sticky (desktop) */}
          <View className="hidden lg:block">
            <View className="sticky top-24">
              <VoyageStickyBar trip={trip} onBook={handleBook} />
            </View>
          </View>
        </View>
      </View>

      {/* Barre sticky mobile */}
      <View className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <VoyageStickyBar trip={trip} onBook={handleBook} />
      </View>

      {/* Lightbox galerie */}
      {showGallery && (
        <VoyageGallery
          trip={trip}
          selectedIndex={galleryIndex}
          onSelect={setGalleryIndex}
          onOpen={() => {}}
          fullscreen
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* Booking sheet */}
      {showBooking && (
        <View>
          {/* À implémenter : VoyageBookingSheet avec ses sous-composants */}
        </View>
      )}
    </View>
  );
}

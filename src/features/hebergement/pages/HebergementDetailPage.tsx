import { useLocalSearchParams, useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, Image, TextInput } from "react-native";
import { useState, useCallback } from "react";
import { ArrowLeft, Heart, Share2, X, Loader2 } from "lucide-react-native";

// Hooks du module
import { useAccommodation } from "../hooks/useAccommodation";
import { useAccommodationFavorite } from "../hooks/useAccommodationFavorite";
import { useAccommodationBooking } from "../hooks/useAccommodationBooking";
import { useAccommodationReviews } from "../hooks/useAccommodationReviews";

// Composants de détail
import {
  AccommodationHero,
  AccommodationInfo,
  AccommodationDescription,
  AccommodationAmenities,
  AccommodationLocation,
  AccommodationMap,
  AccommodationHost,
  AccommodationReviews,
  AccommodationSimilar,
  AccommodationStickyBar,
} from "../components/detail";

export default function HebergementDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Hooks
  const { accommodation, loading, error } = useAccommodation(id);
  const { isFavorite, toggleFavorite } = useAccommodationFavorite();
  const { createBooking } = useAccommodationBooking();
  const { reviews, addReview } = useAccommodationReviews(id);

  const [showGallery, setShowGallery] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleToggleFavorite = useCallback(async () => {
    if (!accommodation) return;
    const added = await toggleFavorite(accommodation.id);
    UIService.openToast(added ? "Ajouté aux favoris" : "Retiré des favoris", "success");
  }, [accommodation, toggleFavorite]);

  const handleShare = useCallback(() => {
    if (undefined && accommodation) {
      undefined;
    } else {
      undefined.writeText(undefined.href);
      UIService.openToast("Lien copié !", "success");
    }
  }, [accommodation]);

  const handleBooking = useCallback(
    async (data: any) => {
      if (!accommodation) return;
      const result = await createBooking({
        accommodationId: accommodation.id,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: data.guests,
      });
      if (result.success) {
        UIService.openToast("Réservation confirmée !", "success");
        setShowBookingModal(false);
      } else {
        UIService.openToast(result.error || "Erreur lors de la réservation", "error");
      }
    },
    [accommodation, createBooking],
  );

  if (loading) {
    return (
      <View className="h-full flex flex-col bg-[#020617]">
        <View className="flex-shrink-0 px-4 pt-12 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5"
          >
            <ArrowLeft size={20} className="text-white" />
          </Pressable>
        </View>
        <View className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="text-indigo-400 animate-spin" />
        </View>
      </View>
    );
  }

  if (error || !accommodation) {
    return (
      <View className="h-full flex flex-col items-center justify-center bg-[#020617]">
        <Text className="text-white/60 text-sm">
          {error || "Logement introuvable"}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-6 py-2 rounded-xl bg-indigo-500 text-white"
        >
          <Text>Retour</Text></Pressable>
      </View>
    );
  }

  return (
    <View className="h-full flex flex-col relative overflow-hidden bg-[#020617]">
      {/* Header flottant */}
      <View className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 flex items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/50"
        >
          <ArrowLeft size={20} className="text-white" />
        </Pressable>
        <View className="flex gap-2">
          <Pressable
            onPress={handleToggleFavorite}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/50"
          >
            <Heart
              size={20}
              className={
                isFavorite(accommodation.id)
                  ? "fill-rose-500 text-rose-500"
                  : "text-white"
              }
            />
          </Pressable>
          <Pressable
            onPress={handleShare}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/50"
          >
            <Share2 size={20} className="text-white" />
          </Pressable>
        </View>
      </View>

      {/* Contenu défilant */}
      <View className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        {/* Hero / Galerie */}
        <AccommodationHero
          images={accommodation.images}
          title={accommodation.title}
          onOpenGallery={() => setShowGallery(true)}
        />

        {/* Informations */}
        <AccommodationInfo
          title={accommodation.title}
          type={accommodation.type}
          location={accommodation.location}
          rating={accommodation.rating}
          reviewsCount={accommodation.reviewsCount}
          rooms={accommodation.rooms}
          capacity={accommodation.capacity}
          area={accommodation.area}
        />

        {/* Description */}
        <AccommodationDescription description={accommodation.description} />

        {/* Équipements */}
        <AccommodationAmenities amenities={accommodation.amenities} />

        {/* Localisation */}
        <AccommodationLocation location={accommodation.location} />
        <AccommodationMap location={accommodation.location} />

        {/* Hôte */}
        <AccommodationHost host={accommodation.host} />

        {/* Avis */}
        <AccommodationReviews
          reviews={reviews}
          rating={accommodation.rating}
          reviewsCount={accommodation.reviewsCount}
          onAddReview={addReview}
        />

        {/* Logements similaires */}
        <AccommodationSimilar currentId={accommodation.id} />
      </View>

      {/* Barre de réservation collante */}
      <AccommodationStickyBar
        price={accommodation.pricing}
        onBook={() => setShowBookingModal(true)}
      />

      {/* Galerie modale */}
      <>
        {showGallery && (
          <Pressable
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onPress={() => setShowGallery(false)}
          >
            <Pressable
              onPress={() => setShowGallery(false)}
              className="absolute top-12 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <X size={24} />
            </Pressable>
            <View className="relative w-full max-w-4xl max-h-[80vh]">
              <Image
               
               
                className="w-full h-full object-contain"
               source={{ uri: accommodation.images[selectedImageIndex] }} accessibilityLabel={accommodation.title}/>
              <View className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {accommodation.images.map((_, i) => (
                  <Pressable
                    key={i}
                    onPress={(e) => {
                      setSelectedImageIndex(i);
                    }}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      i === selectedImageIndex ? "bg-white w-4" : "bg-white/30"
                    }`}
                  />
                ))}
              </View>
            </View>
          </Pressable>
        )}
      </>

      {/* Modal de réservation */}
      <>
        {showBookingModal && (
          <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
            <View
              className="w-full max-w-lg rounded-t-[32px] p-6 text-white flex flex-col max-h-[85vh] overflow-y-auto"
              style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)", }}
            >
              <View className="flex items-center justify-between mb-4">
                <Text className="text-lg font-bold">Réserver</Text>
                <Pressable
                  onPress={() => setShowBookingModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
                >
                  <X size={18} className="text-white/60" />
                </Pressable>
              </View>

              <View className="space-y-4">
                <View className="gap-3">
                  <View>
                    <Text className="text-white/40 text-xs block mb-1">
                      Arrivée
                    </Text>
                    <TextInput
                     
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                    />
                  </View>
                  <View>
                    <Text className="text-white/40 text-xs block mb-1">
                      Départ
                    </Text>
                    <TextInput
                     
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-white/40 text-xs block mb-1">
                    Voyageurs
                  </Text>
                  <Picker className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm">
                    <Picker.Item label="1 voyageur" value="1" />
                    <Picker.Item label="2 voyageurs" value="2" />
                    <Picker.Item label="3 voyageurs" value="3" />
                    <Picker.Item label="4 voyageurs" value="4" />
                  </Picker>
                </View>

                <Pressable
                  onPress={() => handleBooking({})}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold"
                >
                  <Text>Confirmer la réservation</Text></Pressable>
              </View>
            </View>
          </View>
        )}
      </>
    </View>
  );
}

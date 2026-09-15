import { Picker } from "@react-native-picker/picker";
import { View, Pressable, Text, Image, TextInput, Share } from "react-native";
import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
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
import { Clipboard } from "@react-native-clipboard/clipboard";

export default function HebergementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
    toast.success(added ? "Ajouté aux favoris" : "Retiré des favoris");
  }, [accommodation, toggleFavorite]);

  const handleShare = useCallback(() => {
    if (navigator.share && accommodation) {
      Share.share({ message: String(accommodation.description) + "\n" + "\n" + String(window.location.href), title: accommodation.title });
    } else {
      Clipboard.setString(window.location.href);
      toast.success("Lien copié !");
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
        toast.success("Réservation confirmée !");
        setShowBookingModal(false);
      } else {
        toast.error(result.error || "Erreur lors de la réservation");
      }
    },
    [accommodation, createBooking],
  );

  if (loading) {
    return (
      <View className="h-full flex flex-col bg-[#020617]"><View className="flex-shrink-0 px-4 pt-12 pb-4"><Pressable onPress={() => navigate(-1)} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5"><ArrowLeft size={20} className="text-white" /></Pressable></View><View className="flex-1 flex items-center justify-center"><Loader2 size={32} className="text-indigo-400 animate-spin" /></View></View>
    );
  }

  if (error || !accommodation) {
    return (
      <View className="h-full flex flex-col items-center justify-center bg-[#020617]"><Text className="text-white/60 text-sm">{error || "Logement introuvable"}</Text><Pressable onPress={() => navigate(-1)} className="mt-4 px-6 py-2 rounded-xl bg-indigo-500 text-white"><Text>Retour</Text></Pressable></View>
    );
  }

  return (
    <View className="h-full flex flex-col relative overflow-hidden bg-[#020617]">{}<View className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 flex items-center justify-between pointer-events-none"><Pressable onPress={() => navigate(-1)} className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/50 backdrop-blur-md pointer-events-auto"><ArrowLeft size={20} className="text-white" /></Pressable><View className="flex gap-2 pointer-events-auto"><Pressable onPress={handleToggleFavorite} className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/50 backdrop-blur-md"><Heart size={20} className={
                isFavorite(accommodation.id)
                  ? "fill-rose-500 text-rose-500"
                  : "text-white"
              } /></Pressable><Pressable onPress={handleShare} className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/50 backdrop-blur-md"><Share2 size={20} className="text-white" /></Pressable></View></View>{}<View className="flex-1 overflow-y-auto pb-32 no-scrollbar">{}<AccommodationHero images={accommodation.images} title={accommodation.title} onOpenGallery={() => setShowGallery(true)} />{}<AccommodationInfo title={accommodation.title} type={accommodation.type} location={accommodation.location} rating={accommodation.rating} reviewsCount={accommodation.reviewsCount} rooms={accommodation.rooms} capacity={accommodation.capacity} area={accommodation.area} />{}<AccommodationDescription description={accommodation.description} />{}<AccommodationAmenities amenities={accommodation.amenities} />{}<AccommodationLocation location={accommodation.location} /><AccommodationMap location={accommodation.location} />{}<AccommodationHost host={accommodation.host} />{}<AccommodationReviews reviews={reviews} rating={accommodation.rating} reviewsCount={accommodation.reviewsCount} onAddReview={addReview} />{}<AccommodationSimilar currentId={accommodation.id} /></View>{}<AccommodationStickyBar price={accommodation.pricing} onBook={() => setShowBookingModal(true)} />{}<View>{showGallery && (
          <View className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onPress={() => setShowGallery(false)}><Pressable onPress={() => setShowGallery(false)} className="absolute top-12 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"><X size={24} /></Pressable><View className="relative w-full max-w-4xl max-h-[80vh]"><Image className="w-full h-full object-contain" source={{ uri: accommodation.images[selectedImageIndex] }} accessibilityLabel={accommodation.title} /><View className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">{accommodation.images.map((_, i) => (
                  <Pressable key={i} onPress={(e) => {
                      setSelectedImageIndex(i);
                    }} className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      i === selectedImageIndex ? "bg-white w-4" : "bg-white/30"
                    }`} />
                ))}</View></View></View>
        )}</View>{}<View>{showBookingModal && (
          <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"><View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }} className="w-full max-w-lg rounded-t-[32px] p-6 text-white flex flex-col max-h-[85vh] overflow-y-auto" style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)" }}><View className="flex items-center justify-between mb-4"><Text className="text-lg font-bold">Réserver</Text><Pressable onPress={() => setShowBookingModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><X size={18} className="text-white/60" /></Pressable></View><View className="space-y-4"><View className="gap-3"><View><Text className="text-white/40 text-xs block mb-1">Arrivée
                    </Text><TextInput className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm" /></View><View><Text className="text-white/40 text-xs block mb-1">Départ
                    </Text><TextInput className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm" /></View></View><View><Text className="text-white/40 text-xs block mb-1">Voyageurs
                  </Text><Picker className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"><Picker.Item label="1 voyageur" value="1" /><Picker.Item label="2 voyageurs" value="2" /><Picker.Item label="3 voyageurs" value="3" /><Picker.Item label="4 voyageurs" value="4" /></Picker></View><Pressable onPress={() => handleBooking({})} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold">Confirmer la réservation
                </Pressable></View></View></View>
        )}</View></View>
  );
}

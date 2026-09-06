import { useLocalSearchParams, useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { View } from "react-native";
// src/features/transport/pages/TransportDetailPage.tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react-native";
import { useState } from "react";

// ─── Importations des 17 composants de l'architecture Premium ───
import { TransportHero } from "../components/detail/TransportHero";
import { TransportGallery } from "../components/detail/TransportGallery";
import { TransportLiveMap } from "../components/detail/TransportLiveMap";
import { TransportETA } from "../components/detail/TransportETA";
import { TransportDriverCard } from "../components/detail/TransportDriverCard";
import { TransportVehicle } from "../components/detail/TransportVehicle";
import { TransportFeatures } from "../components/detail/TransportFeatures";
import { TransportTimeline } from "../components/detail/TransportTimeline";
import { TransportAvailability } from "../components/detail/TransportAvailability";
import { TransportSafety } from "../components/detail/TransportSafety";
import { TransportReviews } from "../components/detail/TransportReviews";
import { TransportCompany } from "../components/detail/TransportCompany";
import { TransportStats } from "../components/detail/TransportStats";
import { TransportAI } from "../components/detail/TransportAI";
import { TransportRecommendations } from "../components/detail/TransportRecommendations";
import { TransportNearby } from "../components/detail/TransportNearby";
import { TransportStickyBar } from "../components/detail/TransportStickyBar";

export default function TransportDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [bookingLoading, setBookingLoading] = useState(false);

  // Récupération des données depuis l'API Convex
  const route = useQuery(
    api.transport.getTransportRoute,
    id ? { id: id as any } : "skip",
  );
  const bookRoute = useMutation(api.transport.bookTransportRoute);

  const handleBookingConfirm = async (paymentMethod: string) => {
    if (!route) return;
    setBookingLoading(true);
    try {
      await bookRoute({ routeId: route._id, seats: 1 });

      const methodLabel =
        paymentMethod === "momo"
          ? "Mobile Money"
          : paymentMethod === "crypto"
            ? "Cryptomonnaie USDT"
            : paymentMethod === "card"
              ? "Carte bancaire"
              : "Portefeuille DébrouillePay";

      UIService.openToast(`Place réservée avec succès via ${methodLabel} !`, "success");
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : "Erreur lors du traitement";
      UIService.openToast(errorMsg, "error");
    } finally {
      setBookingLoading(false);
    }
  };

  if (!route) {
    return (
      <View className="h-full min-h-screen flex items-center justify-center bg-[#02040c]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </View>
    );
  }

  return (
    <View className="min-h-screen flex flex-col bg-gradient-to-b from-[#020412] to-[#040618] text-white">
      {/* 1. Hero */}
      <TransportHero
        origin={route.origin}
        destination={route.destination}
        departureTime={route.departureTime}
        driverRating={route.driverRating || 4.9}
        vehicleModel={route.vehicleModel}
        vehiclePlate={route.vehiclePlate}
        price={route.pricePerSeat}
        currency={route.currency}
        onBack={() => router.back()}
      />

      {/* Main Container Scrollable */}
      <View
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-40"
        style={{  }}
      >
        {/* 2. Galerie */}
        <TransportGallery />

        {/* 3. Carte GPS */}
        <TransportLiveMap
          origin={route.origin}
          destination={route.destination}
        />

        {/* 4. ETA */}
        <TransportETA />

        {/* 5. Chauffeur */}
        <TransportDriverCard
          name={route.driverName}
          phone={route.driverPhone}
          rating={route.driverRating || 4.9}
        />

        {/* 6. Véhicule */}
        <TransportVehicle
          vehicleModel={route.vehicleModel}
          vehiclePlate={route.vehiclePlate}
        />

        {/* 7. Équipements */}
        <TransportFeatures />

        {/* 8. Chronologie */}
        <TransportTimeline
          origin={route.origin}
          destination={route.destination}
        />

        {/* 9. Disponibilité */}
        <TransportAvailability seatsAvailable={route.seatsAvailable} />

        {/* 10. Sécurité */}
        <TransportSafety />

        {/* 11. Avis */}
        <TransportReviews />

        {/* 12. Société */}
        <TransportCompany />

        {/* 13. Statistiques */}
        <TransportStats />

        {/* 14. IA */}
        <TransportAI />

        {/* 15. Suggestions */}
        <TransportRecommendations origin={route.origin} />

        {/* 16. Stations proches */}
        <TransportNearby />
      </View>

      {/* 17. Sticky Bar */}
      <TransportStickyBar
        price={route.pricePerSeat}
        currency={route.currency}
        seatsAvailable={route.seatsAvailable}
        isLoading={bookingLoading}
        onBook={handleBookingConfirm}
      />
    </View>
  );
}

import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";

// src/features/transport/pages/TransportDetailPage.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react-native";
import { useState } from "react";

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

function readRouteId(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string" && item.trim());
    return typeof first === "string" ? first.trim() : "";
  }
  return "";
}

export default function TransportDetailPage() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = readRouteId(params.id);
  const router = useRouter();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };
  const [bookingLoading, setBookingLoading] = useState(false);

  const route = useQuery(
    api.transport.getTransportRoute,
    id ? { id } : "skip",
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

      toast.success(`Place réservée avec succès via ${methodLabel} !`);
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : "Erreur lors du traitement";
      toast.error(errorMsg);
    } finally {
      setBookingLoading(false);
    }
  };

  if (!id) {
    return (
      <MissingTrip
        message="Aucun identifiant de trajet n'a été transmis."
        onBack={goBack}
      />
    );
  }

  if (route === undefined) {
    return (
      <View style={styles.loading}>
        <Loader2 size={32} color="#8B5CF6" />
      </View>
    );
  }

  if (route === null) {
    return (
      <MissingTrip
        message="Ce trajet est introuvable ou n'est plus disponible."
        onBack={goBack}
      />
    );
  }

  const price =
    typeof route.pricePerSeat === "number" ? route.pricePerSeat : 0;
  const rating =
    typeof route.driverRating === "number" ? route.driverRating : 4.9;
  const seats =
    typeof route.seatsAvailable === "number" ? route.seatsAvailable : 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TransportHero
          origin={route.origin}
          destination={route.destination}
          departureTime={route.departureTime}
          driverRating={rating}
          vehicleModel={route.vehicleModel}
          vehiclePlate={route.vehiclePlate}
          price={price}
          currency={route.currency}
          onBack={goBack}
        />
        <View style={styles.sections}>
          <TransportGallery />
          <TransportLiveMap
            origin={route.origin}
            destination={route.destination}
          />
          <TransportETA />
          <TransportDriverCard
            name={route.driverName || "Chauffeur"}
            phone={route.driverPhone || route.phone || ""}
            rating={rating}
          />
          <TransportVehicle
            vehicleModel={route.vehicleModel}
            vehiclePlate={route.vehiclePlate}
          />
          <TransportFeatures />
          <TransportTimeline
            origin={route.origin}
            destination={route.destination}
          />
          <TransportAvailability seatsAvailable={seats} />
          <TransportSafety />
          <TransportReviews />
          <TransportCompany />
          <TransportStats />
          <TransportAI />
          <TransportRecommendations origin={route.origin} />
          <TransportNearby />
        </View>
      </ScrollView>
      <TransportStickyBar
        price={price}
        currency={route.currency}
        seatsAvailable={seats}
        isLoading={bookingLoading}
        onBook={handleBookingConfirm}
      />
    </View>
  );
}

function MissingTrip({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.missing}>
      <Pressable
        onPress={onBack}
        style={styles.back}
        accessibilityRole="button"
      >
        <ArrowLeft size={18} color="#FFFFFF" />
      </Pressable>
      <Text style={styles.missingTitle}>Trajet indisponible</Text>
      <Text style={styles.missingBody}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020412",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020412",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  sections: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 24,
  },
  missing: {
    flex: 1,
    backgroundColor: "#020412",
    paddingHorizontal: 24,
    paddingTop: 56,
    gap: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  missingTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },
  missingBody: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    lineHeight: 20,
  },
});

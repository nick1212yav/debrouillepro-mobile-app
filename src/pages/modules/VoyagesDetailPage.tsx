import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AlertCircle, ArrowLeft, Heart, Share2 } from "lucide-react-native";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// ─── Composants métier réels du module Voyages ────────────────────────────

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

// ─── Hooks métier réels ───────────────────────────────────────────────────

import { useVoyageBooking } from "@/features/voyages/hooks/useVoyageBooking";
import { useVoyageFavorites } from "@/features/voyages/hooks/useVoyageFavorites";
import { useVoyageShare } from "@/features/voyages/hooks/useVoyageShare";

// ─── Props ─────────────────────────────────────────────────────────────────

interface VoyagesDetailPageProps {
  tripId: string;
  onBack: () => void;
}

// ─── Types locaux ─────────────────────────────────────────────────────────

type PageState = "loading" | "ready" | "not-found" | "error";

function isConvexTripId(value: string): value is Id<"trips"> {
  return value.length > 0;
}

// ─── Composant principal ──────────────────────────────────────────────────

export default function VoyagesDetailPage({
  tripId,
  onBack,
}: VoyagesDetailPageProps) {
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [bookingStarted, setBookingStarted] = useState(false);

  /*
   * ========================================================================
   * BACKEND — SOURCE DE VÉRITÉ DU VOYAGE
   * ========================================================================
   *
   * Le voyage affiché vient directement de Convex.
   *
   * Aucun voyage local fictif.
   * Aucun fallback silencieux.
   * Aucun objet de démonstration.
   */

  const validTripId = isConvexTripId(tripId);

  const trip = useQuery(
    api.voyages.getTrip,
    validTripId
      ? {
          id: tripId as Id<"trips">,
        }
      : "skip",
  );

  /*
   * ========================================================================
   * DOMAIN HOOKS
   * ========================================================================
   */

  const { isFavorite, toggle } = useVoyageFavorites();

  const { startBooking } = useVoyageBooking();

  const { share } = useVoyageShare();

  /*
   * ========================================================================
   * PAGE STATE
   * ========================================================================
   */

  const pageState: PageState = !validTripId
    ? "not-found"
    : trip === undefined
      ? "loading"
      : trip === null
        ? "not-found"
        : "ready";

  /*
   * ========================================================================
   * NAVIGATION
   * ========================================================================
   */

  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  /*
   * ========================================================================
   * FAVORITES
   * ========================================================================
   */

  const handleFavorite = useCallback(async () => {
    if (!trip) return;

    try {
      await toggle(trip._id);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de modifier les favoris.";

      Alert.alert("Favoris", message);
    }
  }, [trip, toggle]);

  /*
   * ========================================================================
   * SHARE
   * ========================================================================
   */

  const handleShare = useCallback(async () => {
    if (!trip) return;

    try {
      await share({
        title: `${trip.from} → ${trip.to}`,
        text: `${trip.operator} • ${trip.type}`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de partager ce voyage.";

      Alert.alert("Partage", message);
    }
  }, [trip, share]);

  /*
   * ========================================================================
   * BOOKING
   * ========================================================================
   *
   * IMPORTANT :
   * on ne fabrique aucune réservation locale.
   *
   * Le hook métier reste la source d'action.
   * Si le backend / booking flow refuse l'opération,
   * on affiche l'erreur réelle.
   */

  const handleBook = useCallback(() => {
    if (!trip || bookingStarted) return;

    try {
      setBookingStarted(true);

      startBooking(trip._id);
    } catch (error) {
      setBookingStarted(false);

      const message =
        error instanceof Error
          ? error.message
          : "Impossible de démarrer la réservation.";

      Alert.alert("Réservation indisponible", message);
    }
  }, [trip, bookingStarted, startBooking]);

  /*
   * ========================================================================
   * GALLERY
   * ========================================================================
   */

  const handleOpenGallery = useCallback((index = 0) => {
    setGalleryIndex(index);
    setShowGallery(true);
  }, []);

  const handleCloseGallery = useCallback(() => {
    setShowGallery(false);
  }, []);

  /*
   * ========================================================================
   * LOADING
   * ========================================================================
   */

  if (pageState === "loading") {
    return (
      <View style={styles.centerScreen}>
        <View style={styles.loadingOrb}>
          <ActivityIndicator size="large" color="#A5B4FC" />
        </View>

        <Text style={styles.stateTitle}>Chargement du voyage</Text>

        <Text style={styles.stateDescription}>
          Récupération des informations depuis la source officielle.
        </Text>

        <View style={styles.loadingBar}>
          <View style={styles.loadingBarProgress} />
        </View>
      </View>
    );
  }

  /*
   * ========================================================================
   * NOT FOUND
   * ========================================================================
   */

  if (pageState === "not-found") {
    return (
      <View style={styles.centerScreen}>
        <View style={styles.errorOrb}>
          <AlertCircle size={30} color="#FCA5A5" />
        </View>

        <Text style={styles.stateTitle}>Voyage introuvable</Text>

        <Text style={styles.stateDescription}>
          Ce trajet n'existe plus, son identifiant est invalide ou il n'est plus
          disponible.
        </Text>

        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Retour aux voyages"
          style={({ pressed }) => [
            styles.statePrimaryButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={17} color="#FFFFFF" />

          <Text style={styles.statePrimaryButtonText}>Retour aux voyages</Text>
        </Pressable>
      </View>
    );
  }

  /*
   * ========================================================================
   * SAFETY GUARD
   * ========================================================================
   */

  if (!trip) {
    return (
      <View style={styles.centerScreen}>
        <View style={styles.errorOrb}>
          <AlertCircle size={30} color="#FCA5A5" />
        </View>

        <Text style={styles.stateTitle}>Données indisponibles</Text>

        <Text style={styles.stateDescription}>
          Les informations de ce voyage ne sont pas disponibles actuellement.
        </Text>

        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={({ pressed }) => [
            styles.statePrimaryButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={17} color="#FFFFFF" />

          <Text style={styles.statePrimaryButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  /*
   * ========================================================================
   * MAIN
   * ========================================================================
   */

  const favorite = isFavorite(trip._id);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* ================================================================
            PREMIUM HEADER
        ================================================================ */}

        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Retour aux voyages"
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft size={19} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerRoute} numberOfLines={1}>
              {trip.from} → {trip.to}
            </Text>

            <Text style={styles.headerOperator} numberOfLines={1}>
              {trip.operator}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={handleFavorite}
              accessibilityRole="button"
              accessibilityLabel={
                favorite ? "Retirer des favoris" : "Ajouter aux favoris"
              }
              accessibilityState={{
                selected: favorite,
              }}
              style={({ pressed }) => [
                styles.headerButton,
                favorite && styles.headerButtonActive,
                pressed && styles.pressed,
              ]}
            >
              <Heart
                size={18}
                color={favorite ? "#FB7185" : "#CBD5E1"}
                fill={favorite ? "#FB7185" : "transparent"}
              />
            </Pressable>

            <Pressable
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Partager ce voyage"
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.pressed,
              ]}
            >
              <Share2 size={18} color="#CBD5E1" />
            </Pressable>
          </View>
        </View>

        {/* ================================================================
            HERO
        ================================================================ */}

        <View style={styles.heroSection}>
          <VoyageHero trip={trip} onGallery={() => handleOpenGallery(0)} />
        </View>

        {/* ================================================================
            GALLERY
        ================================================================ */}

        <View style={styles.section}>
          <VoyageGallery
            trip={trip}
            selectedIndex={galleryIndex}
            onSelect={setGalleryIndex}
            onOpen={() => handleOpenGallery(galleryIndex)}
          />
        </View>

        {/* ================================================================
            PRIMARY INFORMATION
        ================================================================ */}

        <View style={styles.sectionStack}>
          <VoyageRoute trip={trip} />

          <VoyageInfo trip={trip} />

          <VoyageAmenities amenities={trip.amenities} />

          <VoyageAvailability trip={trip} />

          <VoyageOperator trip={trip} />
        </View>

        {/* ================================================================
            TRUST / SAFETY
        ================================================================ */}

        <View style={styles.sectionStack}>
          <VoyageSafety trip={trip} />

          <VoyagePolicies trip={trip} />
        </View>

        {/* ================================================================
            LOCATION
        ================================================================ */}

        <View style={styles.sectionStack}>
          <VoyageMap trip={trip} />

          <VoyageNearby trip={trip} />
        </View>

        {/* ================================================================
            SOCIAL PROOF
        ================================================================ */}

        <View style={styles.sectionStack}>
          <VoyageReviews trip={trip} />

          <VoyageSimilar trip={trip} />
        </View>

        {/* ================================================================
            BOOKING EXPLANATION
        ================================================================ */}

        <View style={styles.bookingTrustCard}>
          <View style={styles.bookingTrustIcon}>
            <Text style={styles.bookingTrustIconText}>✓</Text>
          </View>

          <View style={styles.bookingTrustContent}>
            <Text style={styles.bookingTrustTitle}>Réservation sécurisée</Text>

            <Text style={styles.bookingTrustText}>
              La réservation est déclenchée par le parcours métier Voyages.
              DébrouillePro ne crée pas artificiellement une réservation si le
              service réel n'est pas disponible.
            </Text>
          </View>
        </View>

        {/* ================================================================
            MOBILE SPACER FOR STICKY BAR
        ================================================================ */}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ================================================================
          NATIVE STICKY BOOKING BAR
      ================================================================ */}

      <View style={styles.bottomBar}>
        <VoyageStickyBar trip={trip} onBook={handleBook} />
      </View>

      {/* ================================================================
          FULLSCREEN GALLERY
      ================================================================ */}

      {showGallery ? (
        <View style={styles.galleryOverlay}>
          <View style={styles.galleryHeader}>
            <Pressable
              onPress={handleCloseGallery}
              accessibilityRole="button"
              accessibilityLabel="Fermer la galerie"
              style={({ pressed }) => [
                styles.galleryCloseButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.galleryCloseText}>×</Text>
            </Pressable>

            <Text style={styles.galleryTitle}>Galerie du voyage</Text>

            <View style={styles.galleryHeaderSpacer} />
          </View>

          <View style={styles.galleryContent}>
            <VoyageGallery
              trip={trip}
              selectedIndex={galleryIndex}
              onSelect={setGalleryIndex}
              onOpen={() => undefined}
              fullscreen
              onClose={handleCloseGallery}
            />
          </View>
        </View>
      ) : null}

      {/* ================================================================
          BOOKING PROCESSING INDICATOR
      ================================================================ */}

      {bookingStarted ? (
        <View style={styles.bookingProcessingOverlay}>
          <View style={styles.bookingProcessingCard}>
            <ActivityIndicator size="large" color="#A5B4FC" />

            <Text style={styles.bookingProcessingTitle}>
              Préparation de votre réservation
            </Text>

            <Text style={styles.bookingProcessingText}>
              Vérification du parcours de réservation…
            </Text>

            <Pressable
              onPress={() => setBookingStarted(false)}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              style={({ pressed }) => [
                styles.processingCloseButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.processingCloseText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/*
 * ============================================================================
 * STYLES — DARK PREMIUM / GLASS / NATIVE
 * ============================================================================
 */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020412",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 25,
  },

  header: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  headerCenter: {
    flex: 1,
    marginHorizontal: 11,
  },

  headerRoute: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },

  headerOperator: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerButtonActive: {
    backgroundColor: "rgba(251,113,133,0.08)",
    borderColor: "rgba(251,113,133,0.20)",
  },

  heroSection: {
    marginTop: 4,
  },

  section: {
    marginTop: 12,
  },

  sectionStack: {
    marginTop: 18,
    gap: 14,
  },

  bookingTrustCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 22,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(99,102,241,0.045)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.12)",
  },

  bookingTrustIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.12)",
  },

  bookingTrustIconText: {
    color: "#A5B4FC",
    fontSize: 17,
    fontWeight: "900",
  },

  bookingTrustContent: {
    flex: 1,
    marginLeft: 11,
  },

  bookingTrustTitle: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "900",
  },

  bookingTrustText: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },

  bottomSpacer: {
    height: 95,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "rgba(2,4,18,0.96)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },

  centerScreen: {
    flex: 1,
    minHeight: 500,
    backgroundColor: "#020412",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingOrb: {
    width: 68,
    height: 68,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.10)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.18)",
  },

  errorOrb: {
    width: 68,
    height: 68,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.16)",
  },

  stateTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 17,
  },

  stateDescription: {
    maxWidth: 330,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 7,
  },

  loadingBar: {
    width: 150,
    height: 3,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: 20,
  },

  loadingBarProgress: {
    width: "45%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#6366F1",
  },

  statePrimaryButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 17,
    borderRadius: 15,
    backgroundColor: "#4F46E5",
    borderWidth: 1,
    borderColor: "rgba(165,180,252,0.25)",
    marginTop: 20,
  },

  statePrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 8,
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },

  galleryOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#020412",
    zIndex: 100,
  },

  galleryHeader: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  galleryCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  galleryCloseText: {
    color: "#FFFFFF",
    fontSize: 29,
    lineHeight: 31,
    fontWeight: "300",
  },

  galleryTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
    marginHorizontal: 10,
  },

  galleryHeaderSpacer: {
    width: 42,
  },

  galleryContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  bookingProcessingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(2,4,18,0.82)",
    zIndex: 200,
  },

  bookingProcessingCard: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    padding: 25,
    borderRadius: 25,
    backgroundColor: "#0B1020",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.18)",
  },

  bookingProcessingTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 17,
  },

  bookingProcessingText: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 6,
  },

  processingCloseButton: {
    minHeight: 42,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginTop: 18,
  },

  processingCloseText: {
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "900",
  },
});

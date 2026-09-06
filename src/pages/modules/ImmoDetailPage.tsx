// src/pages/modules/ImmoDetailPage.tsx

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
import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, CalendarDays, Phone } from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";

// Navigation : React Navigation
import { useNavigation, useRoute } from "@react-navigation/native";

// Composants du module immobilier
import {
  PropertyGallery,
  PropertyVideos,
  PropertyOwner,
  PropertyMap,
  PropertyDescription,
  PropertyFeatures,
  PropertyLocation,
  PropertyNeighborhood,
  PropertyNearby,
  PropertyReviews,
  PropertyHistory,
  PropertyVisitScheduler,
  PropertyShare,
  PropertyFavorite,
  Property360Viewer,
  PropertyVirtualTour,
  PropertyFloorPlan,
} from "@/features/immo/components";

import type { Property } from "@/features/immo/types";

// -----------------------------------------------------------------------------
// Labels
// -----------------------------------------------------------------------------

const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartement",
  maison: "Maison",
  villa: "Villa",
  studio: "Studio",
  bureau: "Bureau",
  terrain: "Terrain",
  chambre: "Chambre",
  entrepot: "Entrepôt",
};

const TRANSACTION_LABELS: Record<string, string> = {
  location: "📍 À louer",
  vente: "💰 À vendre",
};

const STATUS_LABELS: Record<string, string> = {
  available: "✅ Disponible",
  rented: "🔴 Loué",
  sold: "🔴 Vendu",
  archived: "📦 Archivé",
};

const STATUS_COLORS: Record<string, string> = {
  available: "#10B981",
  rented: "#EF4444",
  sold: "#EF4444",
  archived: "#6B7280",
};

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function ImmoDetailPage() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const propertyId =
    route.params?.id ?? route.params?.propertyId ?? route.params?.property?._id;

  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const property = useQuery(
    api.realestate.getProperty,
    propertyId
      ? {
          id: propertyId as any,
        }
      : "skip",
  ) as Property | null | undefined;

  const trackView = useMutation(api.realestate.trackPropertyView);

  // ---------------------------------------------------------------------------
  // Tracking de la vue
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!property?._id) {
      return;
    }

    void trackView({
      propertyId: property._id,
    }).catch((error) => {
      if (__DEV__) {
        console.warn("Erreur de tracking de la propriété :", error);
      }
    });
  }, [property?._id, trackView]);

  // ---------------------------------------------------------------------------
  // ID invalide
  // ---------------------------------------------------------------------------

  if (!propertyId) {
    return (
      <View style={styles.centeredScreen}>
        <Text style={styles.emptyText}>ID du bien invalide</Text>

        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backTextButton}
        >
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Chargement
  // ---------------------------------------------------------------------------

  if (property === undefined) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97316" />

          <Text style={styles.loadingText}>
            Chargement du bien immobilier...
          </Text>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Bien introuvable
  // ---------------------------------------------------------------------------

  if (!property) {
    return (
      <View style={styles.centeredScreen}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.iconButton, styles.notFoundBackButton]}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.emptyText}>Bien introuvable</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Extraction des données
  // ---------------------------------------------------------------------------

  const statusColor = STATUS_COLORS[property.status] ?? "#6B7280";

  const transactionLabel =
    TRANSACTION_LABELS[property.transactionType] ?? property.transactionType;

  const allImages = property.images ?? [];
  const allVideos = property.videos ?? [];
  const amenities = property.amenities ?? [];

  const ownerName = property.ownerName;
  const ownerAvatar = property.ownerAvatar;

  const phone = property.phone ?? property.ownerPhone ?? undefined;

  const ownerId = (property as any).ownerId;

  const city = property.city ?? "";
  const neighborhood = property.neighborhood ?? null;
  const address = property.address ?? null;

  const latitude = property.latitude ?? undefined;
  const longitude = property.longitude ?? undefined;

  const createdAt = property._creationTime;

  const price = property.price;
  const currency = property.currency ?? "USD";

  const type = property.type;

  const surface = property.surface ?? null;
  const rooms = property.rooms ?? null;
  const bathrooms = property.bathrooms ?? null;

  const description = property.description ?? "";

  const virtualTourUrl = property.virtualTourUrl;

  const floorPlanUrl = property.floorPlanUrl;

  const tour360Images = property.tour360Images ?? [];

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const handleCall = async () => {
    if (!phone) {
      Alert.alert(
        "Téléphone indisponible",
        "Aucun numéro de téléphone n'est disponible pour ce bien.",
      );

      return;
    }

    const url = `tel:${phone}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          "Appel indisponible",
          "Votre appareil ne peut pas ouvrir l'application téléphonique.",
        );

        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert("Erreur", "Impossible de démarrer l'appel.");
    }
  };

  const handleVisit = () => {
    navigation.navigate("PropertyVisitScheduler", {
      propertyId: property._id,
    });
  };

  const handleBookmark = () => {
    setIsBookmarked((previous) => !previous);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.screen}>
      {/* --------------------------------------------------------------------- */}
      {/* Header */}
      {/* --------------------------------------------------------------------- */}

      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <Text numberOfLines={1} style={styles.headerTitle}>
          {property.title}
        </Text>
      </View>

      {/* --------------------------------------------------------------------- */}
      {/* Contenu */}
      {/* --------------------------------------------------------------------- */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Galerie */}
        <View style={styles.galleryContainer}>
          <PropertyGallery images={allImages} title={property.title} />

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: `${statusColor}25`,
                borderColor: `${statusColor}50`,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: statusColor,
                },
              ]}
            >
              {STATUS_LABELS[property.status] ?? property.status}
            </Text>
          </View>

          <View style={styles.galleryActions}>
            <PropertyFavorite
              propertyId={property._id}
              isFavorited={isLiked}
              onToggle={setIsLiked}
            />

            <Pressable
              onPress={handleBookmark}
              style={styles.bookmarkButton}
              accessibilityRole="button"
              accessibilityLabel={
                isBookmarked ? "Retirer des favoris" : "Ajouter aux favoris"
              }
            >
              <Bookmark
                size={18}
                color={isBookmarked ? "#FBBF24" : "#FFFFFF"}
                fill={isBookmarked ? "#FBBF24" : "transparent"}
              />
            </Pressable>
          </View>
        </View>

        {/* Vidéos */}
        {allVideos.length > 0 && (
          <PropertyVideos videos={allVideos} title={property.title} />
        )}

        {/* Titre */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{property.title}</Text>

          <View style={styles.metadataRow}>
            <Text style={styles.metadataText}>
              {TYPE_LABELS[property.type] ?? property.type}
            </Text>

            <Text style={styles.metadataSeparator}>·</Text>

            <Text style={styles.transactionText}>{transactionLabel}</Text>

            {property.neighborhood ? (
              <>
                <Text style={styles.metadataSeparator}>·</Text>

                <Text style={styles.metadataText}>{property.neighborhood}</Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Prix */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            {Number(price).toLocaleString()} {currency}
            {property.transactionType === "location" ? "/mois" : ""}
          </Text>
        </View>

        {/* Description */}
        <PropertyDescription description={description} maxLength={600} />

        {/* Caractéristiques */}
        <PropertyFeatures
          type={type}
          surface={surface}
          rooms={rooms}
          bathrooms={bathrooms}
          amenities={amenities}
        />

        {/* Localisation */}
        <PropertyLocation
          city={city}
          neighborhood={neighborhood}
          address={address}
        />

        {/* Carte */}
        <PropertyMap
          city={city}
          address={address ?? undefined}
          latitude={latitude}
          longitude={longitude}
        />

        {/* Quartier */}
        <PropertyNeighborhood city={city} />

        {/* À proximité */}
        <PropertyNearby city={city} />

        {/* Propriétaire */}
        <PropertyOwner
          ownerName={ownerName}
          ownerAvatar={ownerAvatar}
          ownerPhone={phone}
          ownerId={ownerId}
          createdAt={createdAt}
          rating={4.8}
          reviewCount={24}
        />

        {/* Planification de visite */}
        <PropertyVisitScheduler propertyId={property._id} />

        {/* Historique */}
        <PropertyHistory
          price={price}
          currency={currency}
          createdAt={createdAt}
          priceHistory={[
            {
              date: createdAt - 86400000 * 30,
              price: price * 0.95,
            },
            {
              date: createdAt - 86400000 * 60,
              price: price * 0.97,
            },
          ]}
        />

        {/* Visites virtuelles */}
        {(virtualTourUrl || tour360Images.length > 0 || floorPlanUrl) && (
          <View style={styles.virtualTours}>
            {virtualTourUrl ? (
              <Property360Viewer url={virtualTourUrl} title="Visite 360°" />
            ) : null}

            {tour360Images.length > 0 ? (
              <PropertyVirtualTour
                url={tour360Images[0]}
                title="Visite virtuelle"
              />
            ) : null}

            {floorPlanUrl ? (
              <PropertyFloorPlan floorPlanUrl={floorPlanUrl} title="Plan" />
            ) : null}
          </View>
        )}

        {/* Avis */}
        <PropertyReviews
          reviews={[
            {
              id: "1",
              reviewerName: "Jean K.",
              rating: 5,
              comment: "Très beau bien, conforme à l'annonce.",
              date: new Date().toISOString(),
            },
            {
              id: "2",
              reviewerName: "Marie L.",
              rating: 4,
              comment: "Bon emplacement, propriétaire réactif.",
              date: new Date(Date.now() - 86400000 * 2).toISOString(),
            },
          ]}
        />

        {/* Partage */}
        <View style={styles.shareSection}>
          <PropertyShare
            title={property.title}
            url={`property:${String(property._id)}`}
          />
        </View>

        {/* ------------------------------------------------------------------- */}
        {/* Actions rapides */}
        {/* ------------------------------------------------------------------- */}

        <View style={styles.quickActions}>
          <Pressable
            onPress={() => void handleCall()}
            style={[styles.quickActionButton, styles.callButton]}
          >
            <Phone size={17} color="#34D399" />

            <Text style={styles.callButtonText}>Appeler</Text>
          </Pressable>

          <Pressable
            onPress={handleVisit}
            style={[styles.quickActionButton, styles.visitButton]}
          >
            <CalendarDays size={17} color="#FFFFFF" />

            <Text style={styles.visitButtonText}>Visiter</Text>
          </Pressable>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020617",
  },

  centeredScreen: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },

  headerTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  notFoundBackButton: {
    position: "absolute",
    top: 24,
    left: 20,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 20,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },

  loadingText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
  },

  emptyText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
  },

  backTextButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  backText: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "700",
  },

  galleryContainer: {
    position: "relative",
  },

  statusBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  galleryActions: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  bookmarkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },

  titleSection: {
    gap: 6,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "700",
  },

  metadataRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },

  metadataText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
  },

  metadataSeparator: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 13,
  },

  transactionText: {
    color: "#FB923C",
    fontSize: 13,
    fontWeight: "500",
  },

  priceContainer: {
    marginTop: -8,
  },

  price: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
  },

  virtualTours: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  shareSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },

  quickActions: {
    flexDirection: "row",
    gap: 12,
  },

  quickActionButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  callButton: {
    backgroundColor: "rgba(16,185,129,0.18)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.25)",
  },

  callButtonText: {
    color: "#34D399",
    fontSize: 14,
    fontWeight: "700",
  },

  visitButton: {
    backgroundColor: "#F97316",
  },

  visitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  bottomSpacer: {
    height: 24,
  },
});

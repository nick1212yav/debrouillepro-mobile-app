// src/pages/modules/ImmoDetailPage.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Heart,
  MapPin,
  Phone,
  Share2,
} from "lucide-react-native";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

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
  PropertyVisitScheduler,
  PropertyShare,
  PropertyFavorite,
  Property360Viewer,
  PropertyVirtualTour,
  PropertyFloorPlan,
} from "@/features/immo/components";

import type { Property } from "@/features/immo/types";

const COLORS = {
  background: "#050812",
  backgroundSecondary: "#0C1022",
  card: "rgba(255,255,255,0.055)",
  cardStrong: "rgba(255,255,255,0.085)",
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.16)",
  text: "#FFFFFF",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  textFaint: "#64748B",
  primary: "#2563EB",
  primaryDark: "#4338CA",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
};

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
  location: "À louer",
  vente: "À vendre",
};

const STATUS_LABELS: Record<string, string> = {
  available: "Disponible",
  rented: "Loué",
  sold: "Vendu",
  archived: "Archivé",
};

const STATUS_COLORS: Record<string, string> = {
  available: COLORS.success,
  rented: COLORS.danger,
  sold: COLORS.danger,
  archived: COLORS.textFaint,
};

function formatPrice(
  price: number,
  currency: string,
  transactionType: string,
): string {
  const safeCurrency = currency?.trim() || "USD";

  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(price);

  return `${formatted} ${safeCurrency}${
    transactionType === "location" ? " / mois" : ""
  }`;
}

function isValidCoordinate(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): latitude is number {
  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

function DetailSkeleton() {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.skeletonIcon} />
        <View style={styles.skeletonTitle} />
      </View>

      <ScrollView
        contentContainerStyle={styles.skeletonContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.skeletonHero} />
        <View style={styles.skeletonLineLarge} />
        <View style={styles.skeletonLineMedium} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </ScrollView>
    </View>
  );
}

function ErrorState({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.centerState}>
      <View style={styles.errorIcon}>
        <MapPin size={26} color={COLORS.textMuted} />
      </View>

      <Text style={styles.errorTitle}>{message}</Text>

      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
        ]}
      >
        <ArrowLeft size={18} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Retour</Text>
      </Pressable>
    </View>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export default function ImmoDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const propertyId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const trackedPropertyIdRef = useRef<string | null>(null);

  const property = useQuery(
    api.realestate.getProperty,
    propertyId
      ? {
          id: propertyId as Id<"properties">,
        }
      : "skip",
  ) as Property | null | undefined;

  const trackView = useMutation(api.realestate.trackPropertyView);

  useEffect(() => {
    if (!property?._id) return;

    const propertyIdString = String(property._id);

    if (trackedPropertyIdRef.current === propertyIdString) {
      return;
    }

    trackedPropertyIdRef.current = propertyIdString;

    void trackView({
      propertyId: property._id,
    }).catch((error) => {
      if (__DEV__) {
        console.warn("[ImmoDetailPage] View tracking failed:", error);
      }

      // Le tracking ne doit jamais bloquer l'affichage du bien.
    });
  }, [property?._id, trackView]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/" as never);
  };

  if (!propertyId) {
    return (
      <ErrorState message="Identifiant du bien invalide." onBack={goBack} />
    );
  }

  if (property === undefined) {
    return <DetailSkeleton />;
  }

  if (!property) {
    return (
      <ErrorState
        message="Ce bien immobilier est introuvable ou n'est plus disponible."
        onBack={goBack}
      />
    );
  }

  const statusColor = STATUS_COLORS[property.status] ?? COLORS.textFaint;

  const statusLabel = STATUS_LABELS[property.status] ?? property.status;

  const transactionLabel =
    TRANSACTION_LABELS[property.transactionType] ?? property.transactionType;

  const typeLabel = TYPE_LABELS[property.type] ?? property.type;

  const allImages = property.images ?? [];
  const allVideos = property.videos ?? [];
  const amenities = property.amenities ?? [];

  const ownerName = property.ownerName;
  const ownerAvatar = property.ownerAvatar;
  const ownerPhone = property.phone ?? property.ownerPhone ?? undefined;

  const ownerId = property.ownerId;
  const city = property.city ?? "";
  const neighborhood = property.neighborhood ?? null;
  const address = property.address ?? null;

  const latitude = property.latitude;
  const longitude = property.longitude;

  const coordinatesAvailable = isValidCoordinate(latitude, longitude);

  const createdAt = property._creationTime;
  const price = property.price;
  const currency = property.currency ?? "USD";

  const surface = property.surface ?? null;
  const rooms = property.rooms ?? null;
  const bathrooms = property.bathrooms ?? null;

  const description = property.description ?? "";

  const virtualTourUrl = property.virtualTourUrl;
  const floorPlanUrl = property.floorPlanUrl;
  const tour360Images = property.tour360Images ?? [];

  const shareTitle = property.title;

  const handleShare = async () => {
    try {
      await Share.share({
        title: shareTitle,
        message: `${shareTitle}${city ? ` — ${city}` : ""}`,
      });
    } catch (error) {
      if (__DEV__) {
        console.warn("[ImmoDetailPage] Share failed:", error);
      }
    }
  };

  const handleCall = async () => {
    if (!ownerPhone) {
      Alert.alert(
        "Téléphone indisponible",
        "Aucun numéro de téléphone n'est associé à ce bien.",
      );
      return;
    }

    const phone = normalizePhone(ownerPhone);
    const url = `tel:${phone}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          "Appel indisponible",
          "Cet appareil ne permet pas de lancer un appel téléphonique.",
        );
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Impossible d'appeler",
        "Le téléphone n'a pas pu être ouvert.",
      );
    }
  };

  const handleBookmark = () => {
    setIsBookmarked((current) => !current);

    /*
     * Important :
     * Le fichier source ne fournit aucune mutation Convex
     * vérifiée pour les favoris/sauvegardes.
     *
     * On conserve donc uniquement l'état UI local.
     * Aucune donnée backend n'est inventée.
     */
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={goBack}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {property.title}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Partager le bien"
          onPress={handleShare}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <Share2 size={19} color={COLORS.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Gallery */}
        <View style={styles.heroCard}>
          <PropertyGallery images={allImages} title={property.title} />

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: `${statusColor}22`,
                borderColor: `${statusColor}55`,
              },
            ]}
          >
            <CheckCircle2 size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>

          <View style={styles.heroActions}>
            <PropertyFavorite
              propertyId={property._id}
              isFavorited={isLiked}
              onToggle={setIsLiked}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isBookmarked
                  ? "Retirer des favoris locaux"
                  : "Ajouter aux favoris locaux"
              }
              onPress={handleBookmark}
              style={({ pressed }) => [
                styles.roundAction,
                pressed && styles.pressed,
              ]}
            >
              <Bookmark
                size={18}
                color={isBookmarked ? COLORS.warning : COLORS.text}
                fill={isBookmarked ? COLORS.warning : "transparent"}
              />
            </Pressable>
          </View>
        </View>

        {/* Videos */}
        {allVideos.length > 0 ? (
          <View style={styles.section}>
            <PropertyVideos videos={allVideos} title={property.title} />
          </View>
        ) : null}

        {/* Main identity */}
        <View style={styles.identityCard}>
          <View style={styles.identityTopRow}>
            <View style={styles.identityText}>
              <Text style={styles.title}>{property.title}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{typeLabel}</Text>

                <View style={styles.metaDot} />

                <Text style={styles.transactionText}>{transactionLabel}</Text>

                {neighborhood ? (
                  <>
                    <View style={styles.metaDot} />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {neighborhood}
                    </Text>
                  </>
                ) : null}
              </View>
            </View>
          </View>

          <Text style={styles.price}>
            {formatPrice(price, currency, property.transactionType)}
          </Text>

          {city ? (
            <View style={styles.locationRow}>
              <MapPin size={15} color={COLORS.textMuted} />
              <Text style={styles.locationText} numberOfLines={2}>
                {address ? `${address}, ` : ""}
                {city}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Description */}
        {description.trim() ? (
          <View style={styles.section}>
            <SectionHeader title="Description" />
            <View style={styles.card}>
              <PropertyDescription description={description} maxLength={600} />
            </View>
          </View>
        ) : null}

        {/* Features */}
        <View style={styles.section}>
          <SectionHeader title="Caractéristiques" />

          <View style={styles.card}>
            <PropertyFeatures
              type={property.type}
              surface={surface}
              rooms={rooms}
              bathrooms={bathrooms}
              amenities={amenities}
            />
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <SectionHeader title="Localisation" />

          <View style={styles.card}>
            <PropertyLocation
              city={city}
              neighborhood={neighborhood}
              address={address}
            />

            <View style={styles.separator} />

            <PropertyMap
              city={city}
              address={address || undefined}
              latitude={coordinatesAvailable ? latitude : undefined}
              longitude={coordinatesAvailable ? longitude : undefined}
            />
          </View>
        </View>

        {/* Neighborhood */}
        {city ? (
          <View style={styles.section}>
            <SectionHeader title="Quartier et environnement" />

            <View style={styles.card}>
              <PropertyNeighborhood city={city} />
              <View style={styles.separator} />
              <PropertyNearby city={city} />
            </View>
          </View>
        ) : null}

        {/* Owner */}
        <View style={styles.section}>
          <SectionHeader title="Propriétaire / annonceur" />

          <View style={styles.card}>
            <PropertyOwner
              ownerName={ownerName}
              ownerAvatar={ownerAvatar}
              ownerPhone={ownerPhone}
              ownerId={ownerId}
              createdAt={createdAt}
            />
          </View>
        </View>

        {/* Visit */}
        <View style={styles.section}>
          <SectionHeader
            title="Organiser une visite"
            subtitle="Choisissez un créneau disponible via le module de réservation."
          />

          <View style={styles.card}>
            <PropertyVisitScheduler propertyId={property._id} />
          </View>
        </View>

        {/* Media / documents */}
        {virtualTourUrl || tour360Images.length > 0 || floorPlanUrl ? (
          <View style={styles.section}>
            <SectionHeader title="Visite & documents" />

            <View style={styles.mediaGrid}>
              {virtualTourUrl ? (
                <View style={styles.mediaItem}>
                  <Property360Viewer url={virtualTourUrl} title="Visite 360°" />
                </View>
              ) : null}

              {tour360Images.length > 0 ? (
                <View style={styles.mediaItem}>
                  <PropertyVirtualTour
                    url={tour360Images[0]}
                    title="Visite virtuelle"
                  />
                </View>
              ) : null}

              {floorPlanUrl ? (
                <View style={styles.mediaItem}>
                  <PropertyFloorPlan
                    floorPlanUrl={floorPlanUrl}
                    title="Plan du bien"
                  />
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Property history
            IMPORTANT:
            On ne génère plus d'historique artificiel.
            PropertyHistory ne reçoit que des données réellement
            disponibles dans le backend/source. */}
        <View style={styles.section}>
          <SectionHeader title="Historique du bien" />

          <View style={styles.card}>
            <PropertyHistory
              price={price}
              currency={currency}
              createdAt={createdAt}
            />
          </View>
        </View>

        {/* Reviews
            Le fichier source contenait deux faux avis.
            Ils sont volontairement supprimés.
            Aucune note ou avis n'est inventé. */}
        <View style={styles.section}>
          <SectionHeader title="Avis" />

          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Heart size={20} color={COLORS.textMuted} />
            </View>

            <Text style={styles.emptyTitle}>Avis vérifiés</Text>

            <Text style={styles.emptyText}>
              Les avis affichés ici doivent provenir exclusivement des données
              réelles du système.
            </Text>
          </View>
        </View>

        {/* Share */}
        <View style={styles.section}>
          <SectionHeader title="Partager ce bien" />

          <View style={styles.card}>
            <PropertyShare url="" title={shareTitle} />
          </View>
        </View>

        {/* Integrity */}
        <View style={styles.integrityCard}>
          <CheckCircle2 size={19} color={COLORS.success} />

          <View style={styles.integrityText}>
            <Text style={styles.integrityTitle}>Informations de l'annonce</Text>

            <Text style={styles.integrityDescription}>
              Les informations présentées proviennent des données disponibles
              pour ce bien. Vérifiez les documents et les conditions avant toute
              transaction.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Appeler l'annonceur"
          onPress={handleCall}
          style={({ pressed }) => [
            styles.secondaryAction,
            pressed && styles.pressed,
          ]}
        >
          <Phone size={18} color={COLORS.success} />
          <Text style={styles.secondaryActionText}>Appeler</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Organiser une visite"
          onPress={() => {
            Alert.alert(
              "Visite",
              "Utilisez le module « Organiser une visite » présent dans la fiche du bien.",
            );
          }}
          style={({ pressed }) => [
            styles.primaryAction,
            pressed && styles.pressed,
          ]}
        >
          <CalendarDays size={18} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Visiter</Text>
          <ChevronRight size={17} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: "rgba(5,8,18,0.96)",
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statusBadge: {
    position: "absolute",
    left: 12,
    top: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  heroActions: {
    position: "absolute",
    right: 12,
    top: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  roundAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  section: {
    marginTop: 20,
  },

  sectionHeader: {
    marginBottom: 10,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },

  sectionSubtitle: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },

  identityCard: {
    marginTop: 16,
    padding: 18,
    borderRadius: 22,
    backgroundColor: COLORS.cardStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  identityTopRow: {
    flexDirection: "row",
  },

  identityText: {
    flex: 1,
  },

  title: {
    color: COLORS.text,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "800",
  },

  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },

  metaText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },

  transactionText: {
    color: "#FB923C",
    fontSize: 12,
    fontWeight: "700",
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.textFaint,
  },

  price: {
    marginTop: 18,
    color: COLORS.text,
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  locationRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  locationText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },

  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  separator: {
    height: 1,
    marginVertical: 16,
    backgroundColor: COLORS.border,
  },

  mediaGrid: {
    gap: 10,
  },

  mediaItem: {
    borderRadius: 18,
    overflow: "hidden",
  },

  emptyCard: {
    padding: 20,
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },

  emptyText: {
    marginTop: 6,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  integrityCard: {
    marginTop: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 18,
    backgroundColor: "rgba(16,185,129,0.07)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.18)",
  },

  integrityText: {
    flex: 1,
  },

  integrityTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },

  integrityDescription: {
    marginTop: 5,
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 17,
  },

  bottomSpace: {
    height: 110,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(5,8,18,0.97)",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  secondaryAction: {
    flex: 0.8,
    minHeight: 50,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(16,185,129,0.10)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.24)",
  },

  secondaryActionText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: "800",
  },

  primaryAction: {
    flex: 1.2,
    minHeight: 50,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.25)",
  },

  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  primaryButton: {
    marginTop: 18,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },

  centerState: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  errorIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  errorTitle: {
    marginTop: 14,
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },

  skeletonContent: {
    padding: 16,
  },

  skeletonIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.cardStrong,
  },

  skeletonTitle: {
    width: 150,
    height: 18,
    borderRadius: 8,
    backgroundColor: COLORS.cardStrong,
  },

  skeletonHero: {
    height: 270,
    borderRadius: 24,
    backgroundColor: COLORS.cardStrong,
  },

  skeletonLineLarge: {
    marginTop: 18,
    width: "80%",
    height: 26,
    borderRadius: 8,
    backgroundColor: COLORS.cardStrong,
  },

  skeletonLineMedium: {
    marginTop: 10,
    width: "55%",
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.cardStrong,
  },

  skeletonCard: {
    marginTop: 16,
    height: 120,
    borderRadius: 20,
    backgroundColor: COLORS.cardStrong,
  },
});

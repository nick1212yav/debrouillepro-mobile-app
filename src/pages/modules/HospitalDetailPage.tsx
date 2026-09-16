import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
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
import { useQuery } from "convex/react";

import {
  Ambulance,
  ArrowLeft,
  Bed,
  Clock,
  Heart,
  MapPin,
  Phone,
  Share2,
  Stethoscope,
  Users,
} from "lucide-react-native";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import {
  HealthGallery,
  DoctorCommunity,
  DoctorDirections,
  DoctorLocation,
  DoctorMap,
  DoctorReviews,
} from "@/features/sante/components";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface HospitalDetailPageProps {
  id?: string;
  onBack?: () => void;
}

type HospitalLike = {
  _id: Id<"hospitals">;
  name: string;
  type?: string;
  rating?: number;
  priceRange?: string;
  open?: boolean;
  address?: string;
  phone?: string;
  hours?: string;
  beds?: number;
  doctors?: number;
  specialties?: number | string;
  description?: string;
  services?: string[];
  images?: string[];
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  reviewCount?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Theme
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = {
  background: "#050812",
  surface: "rgba(255,255,255,0.045)",
  surfaceStrong: "rgba(255,255,255,0.065)",
  border: "rgba(255,255,255,0.09)",
  borderSoft: "rgba(255,255,255,0.065)",
  text: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.68)",
  textMuted: "rgba(255,255,255,0.42)",
  textFaint: "rgba(255,255,255,0.27)",
  primary: "#6366F1",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isValidCoordinate(
  value: unknown,
  min: number,
  max: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}

function formatRating(rating?: number): string | null {
  if (typeof rating !== "number" || !Number.isFinite(rating)) {
    return null;
  }

  return rating.toFixed(1);
}

function formatValue(value: number | string | undefined): string {
  if (value === undefined || value === null) {
    return "—";
  }

  if (typeof value === "number") {
    return value.toLocaleString();
  }

  return value;
}

async function callPhone(phone?: string): Promise<void> {
  if (!phone?.trim()) {
    Alert.alert(
      "Numéro indisponible",
      "Aucun numéro de téléphone n'est renseigné pour cet établissement.",
    );
    return;
  }

  const sanitized = phone.trim();
  const url = `tel:${sanitized}`;

  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert(
        "Appel indisponible",
        `Impossible d'ouvrir l'application téléphone avec le numéro ${sanitized}.`,
      );
      return;
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert(
      "Appel indisponible",
      "Une erreur est survenue lors de l'ouverture du téléphone.",
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading
// ─────────────────────────────────────────────────────────────────────────────

function HospitalDetailLoading() {
  return (
    <View style={styles.loadingPage}>
      <ActivityIndicator size="large" color={COLORS.primary} />

      <Text style={styles.loadingText}>Chargement de l'établissement...</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Error / Empty
// ─────────────────────────────────────────────────────────────────────────────

function HospitalDetailEmpty({
  onBack,
  message,
}: {
  onBack: () => void;
  message: string;
}) {
  return (
    <View style={styles.emptyPage}>
      <View style={styles.emptyIcon}>
        <MapPin size={30} color={COLORS.textMuted} strokeWidth={1.8} />
      </View>

      <Text style={styles.emptyTitle}>Établissement indisponible</Text>

      <Text style={styles.emptyDescription}>{message}</Text>

      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.backToListButton,
          pressed && styles.pressed,
        ]}
      >
        <ArrowLeft size={16} color="#FFFFFF" strokeWidth={2.2} />

        <Text style={styles.backToListText}>Retour</Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Header Action
// ─────────────────────────────────────────────────────────────────────────────

function HeaderButton({
  icon: Icon,
  label,
  onPress,
  active = false,
}: {
  icon: React.ElementType;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.headerButton,
        active && styles.headerButtonActive,
        pressed && styles.pressed,
      ]}
    >
      <Icon
        size={18}
        color={active ? "#F87171" : "rgba(255,255,255,0.68)"}
        strokeWidth={2}
      />
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Info Row
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  value,
  onPress,
}: {
  icon: React.ElementType;
  value?: string;
  onPress?: () => void;
}) {
  if (!value?.trim()) {
    return null;
  }

  const content = (
    <>
      <View style={styles.infoIcon}>
        <Icon size={15} color={COLORS.textMuted} strokeWidth={2} />
      </View>

      <Text numberOfLines={3} style={styles.infoText}>
        {value}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.infoRow, pressed && styles.infoPressed]}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.infoRow}>{content}</View>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric Card
// ─────────────────────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: number | string | undefined;
  label: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Icon size={18} color={COLORS.textMuted} strokeWidth={1.9} />
      </View>

      <Text style={styles.metricValue}>{formatValue(value)}</Text>

      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ open }: { open?: boolean }) {
  if (typeof open !== "boolean") {
    return null;
  }

  return (
    <View
      style={[
        styles.statusBadge,
        open ? styles.statusOpen : styles.statusClosed,
      ]}
    >
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: open ? COLORS.success : COLORS.danger,
          },
        ]}
      />

      <Text
        style={[
          styles.statusText,
          {
            color: open ? "#6EE7B7" : "#FCA5A5",
          },
        ]}
      >
        {open ? "Ouvert" : "Fermé"}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Services
// ─────────────────────────────────────────────────────────────────────────────

function ServicesSection({ services }: { services?: string[] }) {
  const validServices = useMemo(
    () =>
      Array.isArray(services)
        ? services.filter(
            (service): service is string =>
              typeof service === "string" && service.trim().length > 0,
          )
        : [],
    [services],
  );

  if (validServices.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Services</Text>

        <Text style={styles.sectionCount}>{validServices.length}</Text>
      </View>

      <View style={styles.servicesContainer}>
        {validServices.map((service) => (
          <View key={service} style={styles.serviceChip}>
            <View style={styles.serviceDot} />

            <Text style={styles.serviceText}>{service}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export default function HospitalDetailPage({
  id: propId,
  onBack: propOnBack,
}: HospitalDetailPageProps = {}) {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const routeId = Array.isArray(params.id) ? params.id[0] : params.id;

  const id = propId ?? routeId;

  const goBack = useCallback(() => {
    if (propOnBack) {
      propOnBack();
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  }, [propOnBack, router]);

  const hospitalId = id as Id<"hospitals">;

  const hospitalQuery = useQuery(
    api.health.getHospital,
    id ? { id: hospitalId } : "skip",
  );

  const hospital = hospitalQuery as HospitalLike | null | undefined;

  const coordinatesAvailable =
    hospital !== null &&
    hospital !== undefined &&
    isValidCoordinate(hospital.latitude, -90, 90) &&
    isValidCoordinate(hospital.longitude, -180, 180);

  const rating = formatRating(hospital?.rating);

  const handleShare = useCallback(async () => {
    if (!hospital) {
      return;
    }

    const shareMessage = [
      hospital.name,
      hospital.type ? `Type : ${hospital.type}` : null,
      hospital.address ? `Adresse : ${hospital.address}` : null,
      hospital.city ? `Ville : ${hospital.city}` : null,
      hospital.phone ? `Téléphone : ${hospital.phone}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await Share.share({
        title: hospital.name,
        message: shareMessage,
      });
    } catch {
      // User cancelled or native share unavailable.
    }
  }, [hospital]);

  const handleEmergency = useCallback(() => {
    Alert.alert(
      "Urgences",
      "Utilisez ce numéro uniquement s'il correspond au service d'urgence que votre établissement ou votre configuration locale a confirmé.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Appeler",
          style: "destructive",
          onPress: () => {
            void callPhone("15");
          },
        },
      ],
    );
  }, []);

  if (!id) {
    return (
      <HospitalDetailEmpty
        onBack={goBack}
        message="Identifiant de l'établissement manquant."
      />
    );
  }

  if (hospitalQuery === undefined) {
    return <HospitalDetailLoading />;
  }

  if (!hospital) {
    return (
      <HospitalDetailEmpty
        onBack={goBack}
        message="Les informations de cet établissement ne sont pas disponibles."
      />
    );
  }

  return (
    <View style={styles.page}>
      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* Header */}
      {/* ───────────────────────────────────────────────────────────────────── */}

      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.headerTitle}
          >
            {hospital.name}
          </Text>

          {hospital.city ? (
            <Text numberOfLines={1} style={styles.headerSubtitle}>
              {hospital.city}
            </Text>
          ) : null}
        </View>

        <View style={styles.headerActions}>
          <HeaderButton
            icon={Heart}
            label="Ajouter aux favoris"
            onPress={() => {
              Alert.alert(
                "Favoris",
                "La gestion des favoris n'est pas reliée à une mutation backend dans cette page.",
              );
            }}
          />

          <HeaderButton
            icon={Share2}
            label="Partager"
            onPress={() => void handleShare()}
          />
        </View>
      </View>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* Content */}
      {/* ───────────────────────────────────────────────────────────────────── */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Gallery */}
        <View style={styles.galleryContainer}>
          <HealthGallery images={hospital.images ?? []} title={hospital.name} />
        </View>

        {/* Identity */}
        <View style={styles.identityCard}>
          <View style={styles.identityTop}>
            <View style={styles.identityMain}>
              <Text style={styles.hospitalName}>{hospital.name}</Text>

              <View style={styles.identityMeta}>
                {hospital.type ? (
                  <Text style={styles.typeText}>{hospital.type}</Text>
                ) : null}

                {rating ? (
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingStar}>★</Text>

                    <Text style={styles.ratingText}>{rating}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.statusContainer}>
              {hospital.priceRange ? (
                <Text style={styles.priceRange}>{hospital.priceRange}</Text>
              ) : null}

              <StatusBadge open={hospital.open} />
            </View>
          </View>

          <View style={styles.infoContainer}>
            <InfoRow icon={MapPin} value={hospital.address} />

            <InfoRow
              icon={Phone}
              value={hospital.phone}
              onPress={
                hospital.phone
                  ? () => void callPhone(hospital.phone)
                  : undefined
              }
            />

            <InfoRow icon={Clock} value={hospital.hours} />
          </View>

          {hospital.phone ? (
            <Pressable
              onPress={() => void callPhone(hospital.phone)}
              style={({ pressed }) => [
                styles.callButton,
                pressed && styles.pressed,
              ]}
            >
              <Phone size={16} color="#FFFFFF" strokeWidth={2.3} />

              <Text style={styles.callButtonText}>Appeler l'établissement</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Metrics */}
        <View style={styles.metricsGrid}>
          <MetricCard icon={Bed} value={hospital.beds} label="Lits" />

          <MetricCard icon={Users} value={hospital.doctors} label="Médecins" />

          <MetricCard
            icon={Stethoscope}
            value={hospital.specialties}
            label="Spécialités"
          />
        </View>

        {/* Description */}
        {hospital.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>À propos</Text>

            <View style={styles.descriptionCard}>
              <Text style={styles.description}>{hospital.description}</Text>
            </View>
          </View>
        ) : null}

        {/* Services */}
        <ServicesSection services={hospital.services} />

        {/* Location */}
        {hospital.address || hospital.city || hospital.country ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localisation</Text>

            <View style={styles.locationCard}>
              <DoctorLocation
                address={hospital.address}
                city={hospital.city}
                country={hospital.country}
                latitude={hospital.latitude}
                longitude={hospital.longitude}
              />

              {coordinatesAvailable ? (
                <>
                  <View style={styles.componentSeparator} />

                  <DoctorMap
                    latitude={hospital.latitude}
                    longitude={hospital.longitude}
                    name={hospital.name}
                    address={hospital.address}
                  />

                  <View style={styles.componentSeparator} />

                  <DoctorDirections
                    latitude={hospital.latitude}
                    longitude={hospital.longitude}
                    address={hospital.address}
                  />
                </>
              ) : (
                <View style={styles.locationNotice}>
                  <MapPin size={15} color={COLORS.textMuted} strokeWidth={2} />

                  <Text style={styles.locationNoticeText}>
                    Les coordonnées GPS de cet établissement ne sont pas
                    disponibles.
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : null}

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Avis</Text>

              {typeof hospital.reviewCount === "number" ? (
                <Text style={styles.sectionSubtitle}>
                  {hospital.reviewCount.toLocaleString()} avis
                </Text>
              ) : null}
            </View>

            {rating ? (
              <View style={styles.sectionRating}>
                <Text style={styles.sectionRatingStar}>★</Text>

                <Text style={styles.sectionRatingValue}>{rating}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.componentCard}>
            <DoctorReviews reviews={[]} averageRating={hospital.rating} />

            <View style={styles.reviewNotice}>
              <Text style={styles.reviewNoticeText}>
                Les avis détaillés seront affichés lorsqu'ils seront fournis par
                le backend.
              </Text>
            </View>
          </View>
        </View>

        {/* Community */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communauté</Text>

          <View style={styles.componentCard}>
            <DoctorCommunity
              reviews={
                typeof hospital.reviewCount === "number"
                  ? hospital.reviewCount
                  : 0
              }
              questions={0}
              followers={0}
            />

            <View style={styles.communityNotice}>
              <Text style={styles.communityNoticeText}>
                Les compteurs de questions et d'abonnés ne sont pas fournis par
                les données de cet établissement.
              </Text>
            </View>
          </View>
        </View>

        {/* Emergency */}
        <View style={styles.emergencySection}>
          <View style={styles.emergencyHeader}>
            <View style={styles.emergencyIcon}>
              <Ambulance size={20} color="#FCA5A5" strokeWidth={2} />
            </View>

            <View style={styles.emergencyTextContainer}>
              <Text style={styles.emergencyTitle}>Urgences</Text>

              <Text style={styles.emergencyDescription}>
                En cas d'urgence, utilisez uniquement un numéro d'urgence que
                vous avez confirmé pour votre zone.
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleEmergency}
            style={({ pressed }) => [
              styles.emergencyButton,
              pressed && styles.pressed,
            ]}
          >
            <Ambulance size={17} color="#FFFFFF" strokeWidth={2.2} />

            <Text style={styles.emergencyButtonText}>Appeler les urgences</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Informations fournies par le service de santé.
          </Text>

          <Text style={styles.footerSubtext}>
            Vérifiez les informations critiques directement auprès de
            l'établissement avant de vous déplacer.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 42,
  },

  // Loading
  loadingPage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: 30,
  },

  loadingText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 12,
  },

  // Empty
  emptyPage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: 28,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    marginBottom: 16,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyDescription: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
  },

  backToListButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    marginTop: 18,
  },

  backToListText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  // Header
  header: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  headerButtonActive: {
    backgroundColor: "rgba(239,68,68,0.10)",
    borderColor: "rgba(239,68,68,0.20)",
  },

  headerTitleContainer: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "850",
  },

  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 1,
  },

  headerActions: {
    flexDirection: "row",
    gap: 7,
  },

  // Gallery
  galleryContainer: {
    marginTop: 12,
    overflow: "hidden",
    borderRadius: 20,
  },

  // Identity
  identityCard: {
    padding: 16,
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  identityTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  identityMain: {
    flex: 1,
    minWidth: 0,
  },

  hospitalName: {
    color: COLORS.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
    letterSpacing: -0.35,
  },

  identityMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 5,
  },

  typeText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },

  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(245,158,11,0.10)",
  },

  ratingStar: {
    color: COLORS.warning,
    fontSize: 12,
  },

  ratingText: {
    color: "#FCD34D",
    fontSize: 10,
    fontWeight: "800",
  },

  statusContainer: {
    alignItems: "flex-end",
    gap: 6,
  },

  priceRange: {
    color: "#FB923C",
    fontSize: 11,
    fontWeight: "900",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
  },

  statusOpen: {
    backgroundColor: "rgba(16,185,129,0.09)",
    borderColor: "rgba(16,185,129,0.18)",
  },

  statusClosed: {
    backgroundColor: "rgba(239,68,68,0.09)",
    borderColor: "rgba(239,68,68,0.18)",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },

  infoContainer: {
    gap: 9,
    marginTop: 17,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
  },

  infoRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  infoPressed: {
    opacity: 0.7,
  },

  infoIcon: {
    width: 27,
    height: 27,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  infoText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },

  callButton: {
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 15,
    borderRadius: 13,
    backgroundColor: "#166534",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.25)",
  },

  callButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "850",
  },

  // Metrics
  metricsGrid: {
    flexDirection: "row",
    gap: 9,
    marginTop: 12,
  },

  metricCard: {
    flex: 1,
    minHeight: 104,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 7,
  },

  metricValue: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "900",
  },

  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },

  // Sections
  section: {
    marginTop: 22,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 9,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },

  sectionCount: {
    minWidth: 22,
    height: 21,
    paddingHorizontal: 6,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    color: COLORS.textMuted,
    backgroundColor: "rgba(255,255,255,0.055)",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
    overflow: "hidden",
  },

  // Description
  descriptionCard: {
    padding: 15,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  description: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },

  // Services
  servicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  serviceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  serviceDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.primary,
  },

  serviceText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "600",
  },

  // Location
  locationCard: {
    overflow: "hidden",
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    marginTop: 1,
  },

  componentSeparator: {
    height: 1,
    backgroundColor: COLORS.borderSoft,
    marginHorizontal: 14,
  },

  locationNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },

  locationNoticeText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 15,
  },

  // Reviews / community
  componentCard: {
    overflow: "hidden",
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  sectionRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: "rgba(245,158,11,0.10)",
  },

  sectionRatingStar: {
    color: COLORS.warning,
    fontSize: 12,
  },

  sectionRatingValue: {
    color: "#FCD34D",
    fontSize: 10,
    fontWeight: "900",
  },

  reviewNotice: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },

  reviewNoticeText: {
    color: COLORS.textFaint,
    fontSize: 9,
    lineHeight: 14,
  },

  communityNotice: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },

  communityNoticeText: {
    color: COLORS.textFaint,
    fontSize: 9,
    lineHeight: 14,
  },

  // Emergency
  emergencySection: {
    marginTop: 22,
    padding: 15,
    borderRadius: 20,
    backgroundColor: "rgba(239,68,68,0.065)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.18)",
  },

  emergencyHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },

  emergencyIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
  },

  emergencyTextContainer: {
    flex: 1,
  },

  emergencyTitle: {
    color: "#FCA5A5",
    fontSize: 13,
    fontWeight: "900",
  },

  emergencyDescription: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  emergencyButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 13,
    borderRadius: 13,
    backgroundColor: "#B91C1C",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.35)",
  },

  emergencyButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 24,
  },

  footerText: {
    color: "rgba(255,255,255,0.23)",
    fontSize: 9,
    textAlign: "center",
  },

  footerSubtext: {
    color: "rgba(255,255,255,0.15)",
    fontSize: 8,
    lineHeight: 13,
    textAlign: "center",
    marginTop: 4,
  },

  // Interaction
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
});

// src/pages/modules/LaboratoryDetailPage.tsx

import React from "react";
import {
  Alert,
  Linking,
  Platform,
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
  ArrowLeft,
  Calendar,
  Clock,
  FlaskRound,
  Heart,
  MapPin,
  Microscope,
  Navigation,
  Phone,
  Share2,
  Star,
} from "lucide-react-native";

import {
  HealthGallery,
  DoctorDirections,
  DoctorLocation,
  DoctorMap,
} from "@/features/sante/components";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type Laboratory = {
  _id: Id<"laboratories">;
  name: string;

  images?: string[];

  rating?: number | null;

  open?: boolean | null;

  address?: string | null;
  phone?: string | null;
  hours?: string | null;

  tests?: string | number | null;
  equipment?: string | number | null;

  testsList?: string[];

  city?: string | null;
  country?: string | null;

  latitude?: number | null;
  longitude?: number | null;
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function hasValidCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): latitude is number {
  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude)
  );
}

function cleanValue(
  value: string | number | null | undefined,
  fallback = "—",
): string {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }

  return String(value);
}

function buildLaboratoryLocation(lab: Laboratory): string {
  return [lab.address, lab.city, lab.country]
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    )
    .join(", ");
}

/* ============================================================================
 * LOADING
 * ========================================================================== */

function LaboratoryLoading() {
  return (
    <View style={styles.loadingScreen}>
      <View style={styles.loadingHero} />

      <View style={styles.loadingLineLarge} />
      <View style={styles.loadingLineMedium} />
      <View style={styles.loadingLineSmall} />

      <View style={styles.loadingCard} />
      <View style={styles.loadingCard} />
      <View style={styles.loadingCard} />
    </View>
  );
}

/* ============================================================================
 * NOT FOUND
 * ========================================================================== */

function LaboratoryNotFound({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.emptyScreen}>
      <View style={styles.emptyIcon}>
        <FlaskRound size={30} color="#94A3B8" />
      </View>

      <Text style={styles.emptyTitle}>Laboratoire introuvable</Text>

      <Text style={styles.emptyDescription}>
        Ce laboratoire n'est pas disponible ou l'identifiant fourni n'est plus
        valide.
      </Text>

      <Pressable onPress={onBack} style={styles.primaryButton}>
        <ArrowLeft size={17} color="#FFFFFF" />

        <Text style={styles.primaryButtonText}>Retour</Text>
      </Pressable>
    </View>
  );
}

/* ============================================================================
 * INFORMATION ROW
 * ========================================================================== */

function InformationRow({
  icon: Icon,
  label,
  value,
  onPress,
}: {
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.infoIcon}>
        <Icon size={16} color="#94A3B8" />
      </View>

      <View style={styles.infoIdentity}>
        <Text style={styles.infoLabel}>{label}</Text>

        <Text style={[styles.infoValue, onPress && styles.infoValueAction]}>
          {value}
        </Text>
      </View>

      {onPress ? <Navigation size={15} color="#64748B" /> : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.infoRow}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.infoRow, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

/* ============================================================================
 * STAT CARD
 * ========================================================================== */

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Icon size={18} color="#A78BFA" />
      </View>

      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function LaboratoryDetailPage() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;

  const laboratoryId = rawId as Id<"laboratories"> | undefined;

  const laboratory = useQuery(
    api.health.getLaboratory,
    laboratoryId
      ? {
          id: laboratoryId,
        }
      : "skip",
  ) as Laboratory | null | undefined;

  /* --------------------------------------------------------------------------
   * ACTIONS
   * ------------------------------------------------------------------------ */

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  };

  const handleCall = async () => {
    const phone = laboratory?.phone?.trim();

    if (!phone) {
      Alert.alert(
        "Téléphone indisponible",
        "Aucun numéro de téléphone n'est actuellement fourni pour ce laboratoire.",
      );
      return;
    }

    const url = `tel:${phone}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          "Appel indisponible",
          "Votre appareil ne permet pas d'effectuer cet appel.",
        );
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert("Erreur", "Impossible d'ouvrir l'application téléphone.");
    }
  };

  const handleShare = async () => {
    if (!laboratory) {
      return;
    }

    const location = buildLaboratoryLocation(laboratory);

    const message = [
      laboratory.name,
      "Laboratoire",
      location || undefined,
      laboratory.phone || undefined,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await Share.share({
        title: laboratory.name,
        message,
      });
    } catch {
      // Annulation du partage ou absence
      // d'application compatible : aucun toast
      // artificiel n'est nécessaire.
    }
  };

  const handleAppointment = () => {
    /*
     * Aucun endpoint de réservation n'a été fourni
     * dans le contrat actuel de cette page.
     *
     * Nous ne simulons donc pas une réservation.
     */
    Alert.alert(
      "Prise de rendez-vous",
      "La réservation doit être reliée au service de rendez-vous réel du backend avant d'être activée.",
    );
  };

  /* --------------------------------------------------------------------------
   * LOADING
   * ------------------------------------------------------------------------ */

  if (laboratory === undefined) {
    return <LaboratoryLoading />;
  }

  /* --------------------------------------------------------------------------
   * NOT FOUND
   * ------------------------------------------------------------------------ */

  if (laboratory === null) {
    return <LaboratoryNotFound onBack={handleBack} />;
  }

  const coordinatesAvailable =
    hasValidCoordinates(laboratory.latitude, laboratory.longitude) &&
    typeof laboratory.longitude === "number";

  const location = buildLaboratoryLocation(laboratory);

  const rating =
    typeof laboratory.rating === "number" && Number.isFinite(laboratory.rating)
      ? laboratory.rating.toFixed(1)
      : null;

  const tests = cleanValue(laboratory.tests, "Non renseigné");

  const equipment = cleanValue(laboratory.equipment, "Non renseigné");

  const images = Array.isArray(laboratory.images) ? laboratory.images : [];

  const testsList = Array.isArray(laboratory.testsList)
    ? laboratory.testsList.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];

  return (
    <View style={styles.screen}>
      {/* ======================================================================
       * HEADER
       * ==================================================================== */}

      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerIdentity}>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {laboratory.name}
          </Text>

          <Text numberOfLines={1} style={styles.headerSubtitle}>
            Laboratoire
            {laboratory.country ? ` · ${laboratory.country}` : ""}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Favori"
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <Heart size={18} color="#CBD5E1" />
          </Pressable>

          <Pressable
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Partager"
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <Share2 size={18} color="#CBD5E1" />
          </Pressable>
        </View>
      </View>

      {/* ======================================================================
       * BODY
       * ==================================================================== */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* --------------------------------------------------------------------
         * GALLERY
         * ------------------------------------------------------------------ */}

        <View style={styles.galleryContainer}>
          <HealthGallery images={images} title={laboratory.name} />
        </View>

        {/* --------------------------------------------------------------------
         * TITLE / STATUS
         * ------------------------------------------------------------------ */}

        <View style={styles.identitySection}>
          <View style={styles.identityTopRow}>
            <View style={styles.identityTitleContainer}>
              <Text style={styles.laboratoryName}>{laboratory.name}</Text>

              <View style={styles.identityMeta}>
                <View style={styles.typeBadge}>
                  <FlaskRound size={12} color="#A78BFA" />

                  <Text style={styles.typeBadgeText}>Laboratoire</Text>
                </View>

                {rating ? (
                  <View style={styles.ratingContainer}>
                    <Star size={13} color="#FBBF24" fill="#FBBF24" />

                    <Text style={styles.ratingText}>{rating}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {typeof laboratory.open === "boolean" ? (
              <View
                style={[
                  styles.statusBadge,
                  laboratory.open ? styles.statusOpen : styles.statusClosed,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    laboratory.open
                      ? styles.statusDotOpen
                      : styles.statusDotClosed,
                  ]}
                />

                <Text
                  style={[
                    styles.statusText,
                    laboratory.open
                      ? styles.statusTextOpen
                      : styles.statusTextClosed,
                  ]}
                >
                  {laboratory.open ? "Ouvert" : "Fermé"}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* --------------------------------------------------------------------
         * CONTACT / LOCATION
         * ------------------------------------------------------------------ */}

        <View style={styles.sectionCard}>
          {location ? (
            <InformationRow icon={MapPin} label="Adresse" value={location} />
          ) : null}

          {laboratory.phone ? (
            <InformationRow
              icon={Phone}
              label="Téléphone"
              value={laboratory.phone}
              onPress={handleCall}
            />
          ) : null}

          {laboratory.hours ? (
            <InformationRow
              icon={Clock}
              label="Horaires"
              value={laboratory.hours}
            />
          ) : null}
        </View>

        {/* --------------------------------------------------------------------
         * STATS
         * ------------------------------------------------------------------ */}

        <View style={styles.statsGrid}>
          <StatCard icon={FlaskRound} value={tests} label="Analyses" />

          <StatCard icon={Microscope} value={equipment} label="Équipements" />
        </View>

        {/* --------------------------------------------------------------------
         * TESTS
         * ------------------------------------------------------------------ */}

        {testsList.length > 0 ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderIcon}>
                <FlaskRound size={16} color="#A78BFA" />
              </View>

              <View style={styles.sectionHeaderIdentity}>
                <Text style={styles.sectionTitle}>Analyses disponibles</Text>

                <Text style={styles.sectionSubtitle}>
                  Informations déclarées par le laboratoire
                </Text>
              </View>
            </View>

            <View style={styles.tagsContainer}>
              {testsList.map((test) => (
                <View key={test} style={styles.testTag}>
                  <Text style={styles.testTagText}>{test}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* --------------------------------------------------------------------
         * APPOINTMENT
         * ------------------------------------------------------------------ */}

        <Pressable
          onPress={handleAppointment}
          style={({ pressed }) => [
            styles.appointmentButton,
            pressed && styles.pressed,
          ]}
        >
          <Calendar size={18} color="#FFFFFF" />

          <Text style={styles.appointmentButtonText}>
            Prendre un rendez-vous
          </Text>
        </Pressable>

        {/* --------------------------------------------------------------------
         * LOCATION
         * ------------------------------------------------------------------ */}

        {laboratory.address || laboratory.city || laboratory.country ? (
          <View style={styles.componentSection}>
            <DoctorLocation
              address={laboratory.address}
              city={laboratory.city}
              country={laboratory.country}
              latitude={laboratory.latitude}
              longitude={laboratory.longitude}
            />
          </View>
        ) : null}

        {/* --------------------------------------------------------------------
         * MAP
         * ------------------------------------------------------------------ */}

        {coordinatesAvailable ? (
          <View style={styles.componentSection}>
            <DoctorMap
              latitude={laboratory.latitude as number}
              longitude={laboratory.longitude as number}
              name={laboratory.name}
              address={laboratory.address ?? undefined}
            />
          </View>
        ) : (
          <View style={styles.locationUnavailable}>
            <MapPin size={18} color="#64748B" />

            <Text style={styles.locationUnavailableTitle}>
              Position géographique indisponible
            </Text>

            <Text style={styles.locationUnavailableText}>
              Les coordonnées de ce laboratoire ne sont pas actuellement
              disponibles.
            </Text>
          </View>
        )}

        {/* --------------------------------------------------------------------
         * DIRECTIONS
         * ------------------------------------------------------------------ */}

        {coordinatesAvailable ? (
          <View style={styles.componentSection}>
            <DoctorDirections
              latitude={laboratory.latitude as number}
              longitude={laboratory.longitude as number}
              address={laboratory.address ?? undefined}
            />
          </View>
        ) : null}

        {/* --------------------------------------------------------------------
         * DATA / TRUST NOTICE
         * ------------------------------------------------------------------ */}

        <View style={styles.trustCard}>
          <View style={styles.trustIcon}>
            <FlaskRound size={17} color="#06B6D4" />
          </View>

          <View style={styles.trustIdentity}>
            <Text style={styles.trustTitle}>Informations du laboratoire</Text>

            <Text style={styles.trustText}>
              Les informations affichées correspondent aux données disponibles
              dans le service de santé. La disponibilité réelle d'une analyse,
              d'un équipement ou d'un service doit être confirmée directement
              auprès du laboratoire.
            </Text>
          </View>
        </View>

        {/* --------------------------------------------------------------------
         * FOOTER
         * ------------------------------------------------------------------ */}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Santé · Informations internationales
          </Text>

          <Text style={styles.footerSubtext}>
            La réglementation, les services disponibles et les pratiques
            médicales peuvent varier selon le pays et la juridiction.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  /* --------------------------------------------------------------------------
   * HEADER
   * ------------------------------------------------------------------------ */

  header: {
    minHeight: 74,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    paddingBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#0C1022",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  headerIdentity: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  headerSubtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 9.5,
    fontWeight: "600",
  },

  headerActions: {
    flexDirection: "row",
    gap: 6,
  },

  /* --------------------------------------------------------------------------
   * CONTENT
   * ------------------------------------------------------------------------ */

  contentContainer: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 36,
  },

  galleryContainer: {
    overflow: "hidden",
    borderRadius: 22,
  },

  identitySection: {
    marginTop: 15,
  },

  identityTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  identityTitleContainer: {
    flex: 1,
  },

  laboratoryName: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.45,
  },

  identityMeta: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(139,92,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.18)",
  },

  typeBadgeText: {
    color: "#A78BFA",
    fontSize: 8.5,
    fontWeight: "800",
  },

  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  ratingText: {
    color: "#F8FAFC",
    fontSize: 10.5,
    fontWeight: "800",
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
  },

  statusOpen: {
    backgroundColor: "rgba(16,185,129,0.09)",
    borderColor: "rgba(16,185,129,0.18)",
  },

  statusClosed: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderColor: "rgba(239,68,68,0.18)",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },

  statusDotOpen: {
    backgroundColor: "#10B981",
  },

  statusDotClosed: {
    backgroundColor: "#EF4444",
  },

  statusText: {
    fontSize: 8.5,
    fontWeight: "850",
  },

  statusTextOpen: {
    color: "#34D399",
  },

  statusTextClosed: {
    color: "#F87171",
  },

  /* --------------------------------------------------------------------------
   * INFORMATION
   * ------------------------------------------------------------------------ */

  sectionCard: {
    marginTop: 12,
    padding: 6,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  infoRow: {
    minHeight: 60,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.055)",
  },

  infoIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  infoIdentity: {
    flex: 1,
  },

  infoLabel: {
    color: "#64748B",
    fontSize: 8.5,
    fontWeight: "700",
  },

  infoValue: {
    marginTop: 3,
    color: "#CBD5E1",
    fontSize: 10.5,
    lineHeight: 15,
  },

  infoValueAction: {
    color: "#A5B4FC",
  },

  /* --------------------------------------------------------------------------
   * STATS
   * ------------------------------------------------------------------------ */

  statsGrid: {
    marginTop: 12,
    flexDirection: "row",
    gap: 9,
  },

  statCard: {
    flex: 1,
    minHeight: 105,
    padding: 12,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.09)",
  },

  statValue: {
    marginTop: 7,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },

  statLabel: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 8.5,
    fontWeight: "700",
  },

  /* --------------------------------------------------------------------------
   * SECTION
   * ------------------------------------------------------------------------ */

  sectionHeader: {
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  sectionHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.09)",
  },

  sectionHeaderIdentity: {
    flex: 1,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "850",
  },

  sectionSubtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 8.5,
    lineHeight: 13,
  },

  tagsContainer: {
    padding: 9,
    paddingTop: 3,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  testTag: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  testTagText: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "650",
  },

  /* --------------------------------------------------------------------------
   * APPOINTMENT
   * ------------------------------------------------------------------------ */

  appointmentButton: {
    minHeight: 52,
    marginTop: 12,
    paddingHorizontal: 15,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#7C3AED",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
  },

  appointmentButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  /* --------------------------------------------------------------------------
   * COMPONENTS
   * ------------------------------------------------------------------------ */

  componentSection: {
    marginTop: 12,
    overflow: "hidden",
    borderRadius: 19,
  },

  locationUnavailable: {
    marginTop: 12,
    padding: 17,
    borderRadius: 18,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  locationUnavailableTitle: {
    marginTop: 8,
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },

  locationUnavailableText: {
    maxWidth: 320,
    marginTop: 4,
    color: "#64748B",
    fontSize: 9.5,
    lineHeight: 14,
    textAlign: "center",
  },

  /* --------------------------------------------------------------------------
   * TRUST
   * ------------------------------------------------------------------------ */

  trustCard: {
    marginTop: 13,
    padding: 13,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(6,182,212,0.055)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.14)",
  },

  trustIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6,182,212,0.08)",
  },

  trustIdentity: {
    flex: 1,
  },

  trustTitle: {
    color: "#67E8F9",
    fontSize: 10.5,
    fontWeight: "850",
  },

  trustText: {
    marginTop: 4,
    color: "#94A3B8",
    fontSize: 9.5,
    lineHeight: 15,
  },

  /* --------------------------------------------------------------------------
   * FOOTER
   * ------------------------------------------------------------------------ */

  footer: {
    paddingTop: 20,
    alignItems: "center",
  },

  footerText: {
    color: "#64748B",
    fontSize: 8.5,
    fontWeight: "750",
    textAlign: "center",
  },

  footerSubtext: {
    maxWidth: 330,
    marginTop: 4,
    color: "#475569",
    fontSize: 8,
    lineHeight: 13,
    textAlign: "center",
  },

  /* --------------------------------------------------------------------------
   * LOADING
   * ------------------------------------------------------------------------ */

  loadingScreen: {
    flex: 1,
    padding: 15,
    backgroundColor: "#050812",
  },

  loadingHero: {
    height: 240,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  loadingLineLarge: {
    width: "75%",
    height: 22,
    marginTop: 17,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  loadingLineMedium: {
    width: "45%",
    height: 13,
    marginTop: 8,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  loadingLineSmall: {
    width: "60%",
    height: 12,
    marginTop: 7,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  loadingCard: {
    height: 70,
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  /* --------------------------------------------------------------------------
   * EMPTY
   * ------------------------------------------------------------------------ */

  emptyScreen: {
    flex: 1,
    paddingHorizontal: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050812",
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  emptyTitle: {
    marginTop: 15,
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 330,
    marginTop: 7,
    color: "#64748B",
    fontSize: 10.5,
    lineHeight: 16,
    textAlign: "center",
  },

  primaryButton: {
    minHeight: 48,
    marginTop: 18,
    paddingHorizontal: 20,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563EB",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});

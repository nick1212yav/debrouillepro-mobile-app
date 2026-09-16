// src/pages/modules/PharmacyDetailPage.tsx

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
import { useState } from "react";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import {
  ArrowLeft,
  Clock,
  Heart,
  MapPin,
  Phone,
  Pill,
  Share2,
  ShoppingCart,
  Star,
} from "lucide-react-native";

import {
  DoctorDirections,
  DoctorLocation,
  DoctorMap,
  HealthGallery,
} from "@/features/sante/components";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface PharmacyProduct {
  id: string;
  name: string;
  dosage?: string;
  price?: number;
  currency?: string;
  stock?: number;
}

interface PharmacyLike {
  _id: Id<"pharmacies">;
  name: string;
  images?: string[];
  rating?: number;
  open?: boolean;
  address?: string;
  phone?: string;
  hours?: string;
  services?: string[];
  products?: PharmacyProduct[];
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function isValidCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizePhone(phone?: string): string | null {
  if (typeof phone !== "string" || phone.trim().length === 0) {
    return null;
  }

  return phone.trim();
}

function formatPrice(price?: number, currency?: string): string {
  if (typeof price !== "number" || !Number.isFinite(price)) {
    return "Prix non communiqué";
  }

  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(price);

  return `${formatted}${currency ? ` ${currency}` : ""}`;
}

function formatStock(stock?: number): string {
  if (typeof stock !== "number" || !Number.isFinite(stock)) {
    return "Stock non communiqué";
  }

  return `Stock : ${stock}`;
}

/* ============================================================================
 * LOADING
 * ========================================================================== */

function PharmacyLoading({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={styles.headerButton}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.loadingHeaderBlock}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonSubtitle} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.loadingContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.skeletonGallery} />

        <View style={styles.skeletonLineLarge} />
        <View style={styles.skeletonLineMedium} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </ScrollView>
    </View>
  );
}

/* ============================================================================
 * NOT FOUND
 * ========================================================================== */

function PharmacyNotFound({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={styles.headerButton}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle}>Pharmacie</Text>
      </View>

      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Pill size={32} color="rgba(255,255,255,0.42)" />
        </View>

        <Text style={styles.emptyTitle}>Pharmacie introuvable</Text>

        <Text style={styles.emptyDescription}>
          Cette pharmacie n'est pas disponible ou l'identifiant fourni n'est pas
          valide.
        </Text>

        <Pressable onPress={onBack} style={styles.emptyButton}>
          <Text style={styles.emptyButtonText}>Retour</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================================
 * INFO ROW
 * ========================================================================== */

function InfoRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const content = (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>{icon}</View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>

        <Text
          style={[styles.infoValue, onPress && styles.infoValueAction]}
          numberOfLines={3}
        >
          {value}
        </Text>
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
  );
}

/* ============================================================================
 * PRODUCT CARD
 * ========================================================================== */

function ProductCard({ product }: { product: PharmacyProduct }) {
  return (
    <View style={styles.productCard}>
      <View style={styles.productIcon}>
        <Pill size={18} color="#FB923C" />
      </View>

      <View style={styles.productMain}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        {product.dosage ? (
          <Text style={styles.productDosage} numberOfLines={2}>
            {product.dosage}
          </Text>
        ) : null}

        <Text style={styles.productStock}>{formatStock(product.stock)}</Text>
      </View>

      <View style={styles.productRight}>
        <Text style={styles.productPrice} numberOfLines={2}>
          {formatPrice(product.price, product.currency)}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * SERVICES
 * ========================================================================== */

function ServicesCard({ services }: { services?: string[] }) {
  const validServices = Array.isArray(services)
    ? services.filter(
        (service) => typeof service === "string" && service.trim().length > 0,
      )
    : [];

  if (validServices.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderIcon}>
          <Pill size={16} color="#FB923C" />
        </View>

        <Text style={styles.cardTitle}>Services</Text>
      </View>

      <View style={styles.serviceList}>
        {validServices.map((service) => (
          <View key={service} style={styles.serviceBadge}>
            <Text style={styles.serviceText}>{service}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ============================================================================
 * PRODUCTS
 * ========================================================================== */

function ProductsCard({ products }: { products?: PharmacyProduct[] }) {
  const validProducts = Array.isArray(products)
    ? products.filter(
        (product) =>
          product &&
          typeof product.id === "string" &&
          typeof product.name === "string" &&
          product.name.trim().length > 0,
      )
    : [];

  if (validProducts.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderIcon}>
            <Pill size={16} color="#FB923C" />
          </View>

          <Text style={styles.cardTitle}>Produits en stock</Text>
        </View>

        <View style={styles.inlineEmpty}>
          <Text style={styles.inlineEmptyText}>
            Aucun produit en stock n'est communiqué pour cette pharmacie.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderIcon}>
          <Pill size={16} color="#FB923C" />
        </View>

        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>Produits en stock</Text>

          <Text style={styles.cardSubtitle}>
            {validProducts.length} produit
            {validProducts.length > 1 ? "s" : ""} communiqué
            {validProducts.length > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <View style={styles.productsList}>
        {validProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </View>
    </View>
  );
}

/* ============================================================================
 * MAIN PAGE
 * ========================================================================== */

export default function PharmacyDetailPage() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string;
  }>();

  const pharmacyId =
    typeof params.id === "string" && params.id.trim().length > 0
      ? params.id
      : undefined;

  const pharmacy = useQuery(
    api.health.getPharmacy,
    pharmacyId
      ? {
          id: pharmacyId as Id<"pharmacies">,
        }
      : "skip",
  ) as PharmacyLike | null | undefined;

  const [favorite, setFavorite] = useState(false);

  const goBack = () => {
    router.back();
  };

  if (pharmacyId && pharmacy === undefined) {
    return <PharmacyLoading onBack={goBack} />;
  }

  if (!pharmacy) {
    return <PharmacyNotFound onBack={goBack} />;
  }

  const phone = normalizePhone(pharmacy.phone);

  const hasCoordinates =
    isValidCoordinate(pharmacy.latitude) &&
    isValidCoordinate(pharmacy.longitude);

  const handleCall = async () => {
    if (!phone) {
      Alert.alert(
        "Téléphone indisponible",
        "Aucun numéro de téléphone valide n'est communiqué pour cette pharmacie.",
      );
      return;
    }

    const url = `tel:${phone}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          "Appel indisponible",
          "Cet appareil ne permet pas d'ouvrir le service téléphonique.",
        );
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Appel impossible",
        "Impossible d'ouvrir l'application téléphonique.",
      );
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: pharmacy.name,
        message: pharmacy.address
          ? `${pharmacy.name}\n${pharmacy.address}`
          : pharmacy.name,
      });
    } catch {
      /*
       * L'annulation du partage par l'utilisateur
       * n'est pas une erreur applicative.
       */
    }
  };

  const handleOrder = () => {
    /*
     * Le contrat fourni expose des produits et leurs stocks,
     * mais aucune mutation de commande/pharmacie n'est fournie
     * dans ce module.
     *
     * On ne simule donc pas une commande.
     */
    Alert.alert(
      "Commande indisponible",
      "Le catalogue de cette pharmacie est consultable, mais le contrat backend fourni ne permet pas encore de créer une commande.",
    );
  };

  return (
    <View style={styles.screen}>
      {/* ====================================================================
       * HEADER
       * ================================================================== */}

      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={styles.headerButton}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {pharmacy.name}
        </Text>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setFavorite((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={
              favorite ? "Retirer des favoris" : "Ajouter aux favoris"
            }
            style={styles.headerButton}
          >
            <Heart
              size={19}
              color={favorite ? "#FB923C" : "rgba(255,255,255,0.65)"}
              fill={favorite ? "#FB923C" : "transparent"}
            />
          </Pressable>

          <Pressable
            onPress={() => {
              void handleShare();
            }}
            accessibilityRole="button"
            accessibilityLabel="Partager la pharmacie"
            style={styles.headerButton}
          >
            <Share2 size={18} color="rgba(255,255,255,0.65)" />
          </Pressable>
        </View>
      </View>

      {/* ====================================================================
       * CONTENT
       * ================================================================== */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================
         * GALLERY
         * ============================================================== */}

        <HealthGallery
          images={Array.isArray(pharmacy.images) ? pharmacy.images : []}
          title={pharmacy.name}
        />

        {/* ================================================================
         * IDENTITY
         * ============================================================== */}

        <View style={styles.identitySection}>
          <View style={styles.identityTop}>
            <View style={styles.identityMain}>
              <View style={styles.pharmacyIcon}>
                <Pill size={22} color="#FB923C" />
              </View>

              <View style={styles.identityText}>
                <Text style={styles.pharmacyName} numberOfLines={2}>
                  {pharmacy.name}
                </Text>

                <View style={styles.identityMeta}>
                  <Text style={styles.categoryLabel}>Pharmacie</Text>

                  {typeof pharmacy.rating === "number" &&
                    Number.isFinite(pharmacy.rating) && (
                      <>
                        <View style={styles.metaDot} />

                        <Star size={14} color="#FBBF24" fill="#FBBF24" />

                        <Text style={styles.ratingText}>
                          {pharmacy.rating.toFixed(1)}
                        </Text>
                      </>
                    )}
                </View>
              </View>
            </View>

            {typeof pharmacy.open === "boolean" && (
              <View
                style={[
                  styles.openBadge,
                  {
                    backgroundColor: pharmacy.open
                      ? "rgba(34,197,94,0.12)"
                      : "rgba(239,68,68,0.12)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: pharmacy.open ? "#4ADE80" : "#F87171",
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.openText,
                    {
                      color: pharmacy.open ? "#4ADE80" : "#F87171",
                    },
                  ]}
                >
                  {pharmacy.open ? "Ouvert" : "Fermé"}
                </Text>
              </View>
            )}
          </View>

          {/* ================================================================
           * CONTACT INFORMATION
           * ============================================================== */}

          <View style={styles.infoCard}>
            <InfoRow
              icon={<MapPin size={17} color="#A78BFA" />}
              label="Adresse"
              value={pharmacy.address}
            />

            <InfoRow
              icon={<Phone size={17} color="#4ADE80" />}
              label="Téléphone"
              value={phone ?? undefined}
              onPress={
                phone
                  ? () => {
                      void handleCall();
                    }
                  : undefined
              }
            />

            <InfoRow
              icon={<Clock size={17} color="#FBBF24" />}
              label="Horaires"
              value={pharmacy.hours}
            />
          </View>
        </View>

        {/* ================================================================
         * SERVICES
         * ============================================================== */}

        <ServicesCard services={pharmacy.services} />

        {/* ================================================================
         * PRODUCTS
         * ============================================================== */}

        <ProductsCard products={pharmacy.products} />

        {/* ================================================================
         * LOCATION
         * ============================================================== */}

        <View style={styles.locationSection}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <MapPin size={16} color="#A78BFA" />
            </View>

            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Localisation</Text>

              {pharmacy.city || pharmacy.country ? (
                <Text style={styles.cardSubtitle}>
                  {[pharmacy.city, pharmacy.country].filter(Boolean).join(", ")}
                </Text>
              ) : null}
            </View>
          </View>

          <DoctorLocation
            address={pharmacy.address}
            city={pharmacy.city}
            country={pharmacy.country}
            latitude={pharmacy.latitude}
            longitude={pharmacy.longitude}
          />

          {hasCoordinates ? (
            <>
              <View style={styles.mapContainer}>
                <DoctorMap
                  latitude={pharmacy.latitude!}
                  longitude={pharmacy.longitude!}
                  name={pharmacy.name}
                  address={pharmacy.address}
                />
              </View>

              <DoctorDirections
                latitude={pharmacy.latitude!}
                longitude={pharmacy.longitude!}
                address={pharmacy.address}
              />
            </>
          ) : (
            <View style={styles.locationNotice}>
              <MapPin size={17} color="rgba(255,255,255,0.35)" />

              <Text style={styles.locationNoticeText}>
                Les coordonnées GPS de cette pharmacie ne sont pas disponibles.
              </Text>
            </View>
          )}
        </View>

        {/* ================================================================
         * TRANSPARENCY
         * ============================================================== */}

        <View style={styles.transparencyCard}>
          <View style={styles.transparencyIcon}>
            <CheckIcon />
          </View>

          <View style={styles.transparencyContent}>
            <Text style={styles.transparencyTitle}>
              Informations de l'établissement
            </Text>

            <Text style={styles.transparencyText}>
              Les informations présentées correspondent aux données actuellement
              fournies par le service pharmacie.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* ====================================================================
       * ACTION BAR
       * ================================================================== */}

      <View style={styles.actionBar}>
        <Pressable
          onPress={() => {
            void handleCall();
          }}
          disabled={!phone}
          accessibilityRole="button"
          accessibilityLabel="Appeler la pharmacie"
          style={[styles.secondaryAction, !phone && styles.actionDisabled]}
        >
          <Phone
            size={18}
            color={phone ? "#FFFFFF" : "rgba(255,255,255,0.25)"}
          />

          <Text
            style={[
              styles.secondaryActionText,
              !phone && styles.actionTextDisabled,
            ]}
          >
            Appeler
          </Text>
        </Pressable>

        <Pressable
          onPress={handleOrder}
          accessibilityRole="button"
          accessibilityLabel="Commander"
          style={styles.primaryAction}
        >
          <ShoppingCart size={18} color="#FFFFFF" />

          <Text style={styles.primaryActionText}>Commander</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================================
 * SMALL ICON
 * ========================================================================== */

function CheckIcon() {
  return (
    <View style={styles.checkIconCircle}>
      <Text style={styles.checkIconText}>✓</Text>
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

  scroll: {
    flex: 1,
  },

  content: {
    paddingBottom: 120,
  },

  header: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(5,8,18,0.98)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  headerTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  headerActions: {
    flexDirection: "row",
    gap: 7,
  },

  loadingHeaderBlock: {
    flex: 1,
  },

  skeletonTitle: {
    width: 170,
    height: 14,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  skeletonSubtitle: {
    width: 100,
    height: 8,
    marginTop: 6,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  loadingContent: {
    padding: 16,
    gap: 14,
  },

  skeletonGallery: {
    width: "100%",
    height: 230,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  skeletonLineLarge: {
    width: "72%",
    height: 20,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  skeletonLineMedium: {
    width: "45%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  skeletonCard: {
    width: "100%",
    height: 90,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  emptyState: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  emptyTitle: {
    marginTop: 18,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 360,
    marginTop: 8,
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },

  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 22,
    minHeight: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C2410C",
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  identitySection: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },

  identityTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  identityMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  pharmacyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,146,60,0.12)",
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.2)",
  },

  identityText: {
    flex: 1,
  },

  pharmacyName: {
    color: "#FFFFFF",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  identityMeta: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  categoryLabel: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "700",
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  ratingText: {
    color: "#FBBF24",
    fontSize: 11,
    fontWeight: "900",
  },

  openBadge: {
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: 99,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  openText: {
    fontSize: 10,
    fontWeight: "900",
  },

  infoCard: {
    marginTop: 15,
    padding: 12,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  infoRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  infoValue: {
    marginTop: 3,
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },

  infoValueAction: {
    color: "#86EFAC",
  },

  card: {
    marginHorizontal: 16,
    marginTop: 18,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  cardHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,146,60,0.1)",
  },

  cardHeaderText: {
    flex: 1,
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  cardSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontWeight: "600",
  },

  serviceList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  serviceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  serviceText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 10,
    fontWeight: "700",
  },

  productsList: {
    gap: 8,
  },

  productCard: {
    minHeight: 76,
    padding: 11,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  productIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,146,60,0.1)",
  },

  productMain: {
    flex: 1,
    minWidth: 0,
  },

  productName: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
  },

  productDosage: {
    marginTop: 2,
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
  },

  productStock: {
    marginTop: 4,
    color: "rgba(255,255,255,0.25)",
    fontSize: 8,
    fontWeight: "700",
  },

  productRight: {
    maxWidth: 105,
    alignItems: "flex-end",
  },

  productPrice: {
    color: "#FB923C",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "900",
    textAlign: "right",
  },

  inlineEmpty: {
    paddingVertical: 10,
  },

  inlineEmptyText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    lineHeight: 16,
  },

  locationSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },

  mapContainer: {
    marginTop: 12,
    overflow: "hidden",
    borderRadius: 18,
  },

  locationNotice: {
    marginTop: 10,
    padding: 12,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  locationNoticeText: {
    flex: 1,
    color: "rgba(255,255,255,0.32)",
    fontSize: 10,
    lineHeight: 15,
  },

  transparencyCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 14,
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(34,197,94,0.055)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.13)",
  },

  transparencyIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.11)",
  },

  checkIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  checkIconText: {
    color: "#4ADE80",
    fontSize: 15,
    fontWeight: "900",
  },

  transparencyContent: {
    flex: 1,
  },

  transparencyTitle: {
    color: "#86EFAC",
    fontSize: 11,
    fontWeight: "900",
  },

  transparencyText: {
    marginTop: 4,
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    lineHeight: 15,
  },

  bottomSpace: {
    height: 20,
  },

  actionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16,
    flexDirection: "row",
    gap: 9,
    backgroundColor: "rgba(5,8,18,0.97)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },

  secondaryAction: {
    flex: 0.8,
    minHeight: 50,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  primaryAction: {
    flex: 1.2,
    minHeight: 50,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#C2410C",
  },

  secondaryActionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  actionDisabled: {
    opacity: 0.5,
  },

  actionTextDisabled: {
    color: "rgba(255,255,255,0.25)",
  },
});

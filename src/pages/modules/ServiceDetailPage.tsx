import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useQuery, useMutation } from "convex/react";
import { Clipboard } from "@react-native-clipboard/clipboard";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import {
  ServiceActions,
  ServiceAIAssistant,
  ServiceAvailability,
  ServiceBooking,
  ServiceCertificates,
  ServiceDescription,
  ServiceFooter,
  ServiceGallery,
  ServiceHeader,
  ServiceHistory,
  ServiceLocation,
  ServiceMap,
  ServicePayment,
  ServicePortfolio,
  ServicePricing,
  ServiceRecommendations,
  ServiceReviews,
  ServiceSafety,
  ServiceStatistics,
} from "@/features/service/components";

import { useServiceFavorite } from "@/features/service/hooks";

import { adaptServiceProvider } from "@/features/service/adapter";
import type { ServiceProvider } from "@/features/service/types";

type ServiceId = Id<"serviceProviders">;

interface ServiceDetailPageProps {
  serviceId?: string;
  onBack?: () => void;
  onMessage?: (userId: string) => void;
}

function isValidServiceId(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

function parseServicePrice(value: string | number | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const normalized = value
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function getProviderPhone(provider: ServiceProvider): string | null {
  const candidate = provider as ServiceProvider & {
    phone?: string | null;
    phoneNumber?: string | null;
    whatsapp?: string | null;
    whatsappNumber?: string | null;
  };

  const phone =
    candidate.phone ??
    candidate.phoneNumber ??
    candidate.whatsapp ??
    candidate.whatsappNumber ??
    null;

  if (!phone || phone.trim().length === 0) {
    return null;
  }

  return phone.trim();
}

function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

function LoadingState() {
  return (
    <View style={styles.centerState}>
      <ActivityIndicator size="large" />
      <Text style={styles.stateTitle}>Chargement du service…</Text>
      <Text style={styles.stateDescription}>
        Nous récupérons les informations depuis la plateforme.
      </Text>
    </View>
  );
}

function EmptyState({ onBack }: { onBack?: () => void }) {
  return (
    <View style={styles.centerState}>
      <Text style={styles.stateIcon}>🔎</Text>

      <Text style={styles.stateTitle}>Service introuvable</Text>

      <Text style={styles.stateDescription}>
        Ce service n'existe plus, n'est pas disponible ou son identifiant est
        invalide.
      </Text>

      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ErrorState({
  onRetry,
  onBack,
}: {
  onRetry: () => void;
  onBack?: () => void;
}) {
  return (
    <View style={styles.centerState}>
      <Text style={styles.stateIcon}>⚠️</Text>

      <Text style={styles.stateTitle}>Impossible de charger ce service</Text>

      <Text style={styles.stateDescription}>
        Une erreur est survenue lors de la récupération des données. Vérifiez
        votre connexion puis réessayez.
      </Text>

      <View style={styles.stateActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Réessayer"
          onPress={onRetry}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Réessayer</Text>
        </Pressable>

        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={onBack}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Retour</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function ServiceDetailPage({
  serviceId,
  onBack,
  onMessage,
}: ServiceDetailPageProps) {
  const [showBooking, setShowBooking] = useState(false);

  /*
   * Important:
   * Le paiement n'est PAS ouvert avec un faux orderId.
   *
   * Un paiement réel doit être lié à une commande/booking réellement créée
   * par le backend. Tant que le composant de réservation ne nous retourne
   * pas cet identifiant, nous ne fabriquons aucune transaction.
   */
  const [paymentOrderId, setPaymentOrderId] = useState<Id<"orders"> | null>(
    null,
  );

  const [queryVersion, setQueryVersion] = useState(0);

  const validId = useMemo(() => isValidServiceId(serviceId), [serviceId]);

  const providerId = validId ? (serviceId as ServiceId) : undefined;

  const doc = useQuery(
    api.serviceProviders.get,
    providerId ? { id: providerId } : "skip",
  );

  const provider = useMemo<ServiceProvider | null>(() => {
    if (!doc) {
      return null;
    }

    return adaptServiceProvider(doc);
  }, [doc, queryVersion]);

  const { isFavorited, toggle } = useServiceFavorite(providerId, false);

  const trackView = useMutation(api.serviceProviders.trackView);

  /*
   * Vue du service.
   *
   * La mutation est déclenchée uniquement lorsque le document réel
   * existe et possède son identifiant Convex.
   */
  useEffect(() => {
    if (!provider?._id) {
      return;
    }

    let cancelled = false;

    const track = async () => {
      try {
        if (!cancelled) {
          await trackView({
            providerId: provider._id,
          });
        }
      } catch {
        /*
         * Le tracking de vue ne doit jamais empêcher l'affichage
         * du service. L'échec est volontairement non bloquant.
         */
      }
    };

    void track();

    return () => {
      cancelled = true;
    };
  }, [provider?._id, trackView, queryVersion]);

  const handleRetry = useCallback(() => {
    setQueryVersion((value) => value + 1);
  }, []);

  const handleShare = useCallback(async () => {
    if (!provider) {
      return;
    }

    try {
      const result = await Share.share({
        title: provider.name,
        message: `Découvrez ${provider.name} sur DébrouillePro.`,
      });

      if (result.action === Share.dismissedAction) {
        return;
      }
    } catch {
      /*
       * Fallback honnête : le lien réel dépend de la navigation de
       * l'application. On ne fabrique donc pas une URL web.
       */
      try {
        await Clipboard.setString(provider.name);

        Alert.alert(
          "Partage",
          "Le partage système n'a pas pu être ouvert. Le nom du service a été copié.",
        );
      } catch {
        Alert.alert(
          "Partage indisponible",
          "Impossible d'ouvrir le partage sur cet appareil.",
        );
      }
    }
  }, [provider]);

  const handleCall = useCallback(async () => {
    if (!provider) {
      return;
    }

    const phone = getProviderPhone(provider);

    if (!phone) {
      Alert.alert(
        "Téléphone indisponible",
        "Aucun numéro de téléphone professionnel n'est renseigné pour ce prestataire.",
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
      Alert.alert(
        "Appel impossible",
        "Impossible d'ouvrir l'application téléphone.",
      );
    }
  }, [provider]);

  const handleWhatsApp = useCallback(async () => {
    if (!provider) {
      return;
    }

    const phone = getProviderPhone(provider);

    if (!phone) {
      Alert.alert(
        "WhatsApp indisponible",
        "Aucun numéro WhatsApp professionnel n'est renseigné pour ce prestataire.",
      );
      return;
    }

    const normalizedPhone = normalizePhoneForWhatsApp(phone);

    if (!normalizedPhone) {
      Alert.alert(
        "Numéro invalide",
        "Le numéro WhatsApp enregistré pour ce prestataire est invalide.",
      );
      return;
    }

    const whatsappUrl = `https://wa.me/${normalizedPhone}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);

      if (!supported) {
        Alert.alert(
          "WhatsApp indisponible",
          "WhatsApp n'est pas disponible sur cet appareil.",
        );
        return;
      }

      await Linking.openURL(whatsappUrl);
    } catch {
      Alert.alert("WhatsApp impossible", "Impossible d'ouvrir WhatsApp.");
    }
  }, [provider]);

  const handleMessage = useCallback(() => {
    if (!provider?.userId) {
      Alert.alert(
        "Messagerie indisponible",
        "Ce prestataire n'est actuellement pas relié à un compte de messagerie.",
      );
      return;
    }

    if (onMessage) {
      onMessage(String(provider.userId));
      return;
    }

    Alert.alert(
      "Messagerie",
      "La navigation vers la conversation doit être fournie par le routeur natif de l'application.",
    );
  }, [onMessage, provider]);

  const handleBooking = useCallback(() => {
    if (!provider?._id) {
      return;
    }

    setShowBooking(true);
  }, [provider?._id]);

  const handlePayment = useCallback(() => {
    /*
     * Protection anti-fausse transaction.
     *
     * On ne transmet jamais provider._id comme orderId.
     */
    if (!paymentOrderId) {
      Alert.alert(
        "Paiement",
        "Le paiement sera disponible après la création d'une réservation réelle.",
      );
      return;
    }
  }, [paymentOrderId]);

  if (!validId) {
    return <EmptyState onBack={onBack} />;
  }

  if (doc === undefined) {
    return <LoadingState />;
  }

  if (doc === null) {
    return <EmptyState onBack={onBack} />;
  }

  if (!provider) {
    return <ErrorState onRetry={handleRetry} onBack={onBack} />;
  }

  const galleryImages =
    provider.portfolio && provider.portfolio.length > 0
      ? provider.portfolio
      : provider.imageUrl
        ? [provider.imageUrl]
        : [];

  const portfolioImages = provider.portfolio ?? [];

  const price = parseServicePrice(provider.price);

  const currency = provider.currency?.trim() || "USD";

  const skills = Array.isArray(provider.skills)
    ? provider.skills.filter(
        (skill): skill is string =>
          typeof skill === "string" && skill.trim().length > 0,
      )
    : [];

  const certificates = Array.isArray(provider.certificates)
    ? provider.certificates
    : [];

  return (
    <View style={styles.screen}>
      <ServiceHeader
        provider={provider}
        isFavorited={isFavorited}
        onFavorite={toggle}
        onShare={handleShare}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ServiceGallery images={galleryImages} title={provider.name} />

        <View style={styles.hero}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.serviceName}>{provider.name}</Text>

              {provider.specialty ? (
                <Text style={styles.specialty}>{provider.specialty}</Text>
              ) : null}
            </View>

            {provider.verified ? (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
                <Text style={styles.verifiedText}>Vérifié</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.statusRow}>
            {provider.urgent ? (
              <View style={styles.urgentBadge}>
                <Text style={styles.badgeText}>⚡ Urgence 24h</Text>
              </View>
            ) : null}

            {provider.available ? (
              <View style={styles.availableBadge}>
                <Text style={styles.availableText}>● Disponible</Text>
              </View>
            ) : (
              <View style={styles.unavailableBadge}>
                <Text style={styles.unavailableText}>● Indisponible</Text>
              </View>
            )}
          </View>
        </View>

        <Section title="À propos">
          <ServiceDescription description={provider.description} />
        </Section>

        {skills.length > 0 ? (
          <Section title="Compétences">
            <View style={styles.skillsContainer}>
              {skills.map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        <Section title="Tarification">
          <ServicePricing price={provider.price} currency={currency} />
        </Section>

        <Section title="Disponibilité">
          <ServiceAvailability providerId={provider._id} />
        </Section>

        <Section title="Localisation">
          <ServiceLocation location={provider.location} />

          <View style={styles.mapSpacing}>
            <ServiceMap location={provider.location} />
          </View>
        </Section>

        <Section title="Actions">
          <ServiceActions
            onCall={handleCall}
            onWhatsApp={handleWhatsApp}
            onMessage={handleMessage}
            onBook={handleBooking}
            onPay={handlePayment}
          />
        </Section>

        {portfolioImages.length > 1 ? (
          <Section title="Portfolio">
            <ServicePortfolio images={portfolioImages} />
          </Section>
        ) : null}

        {certificates.length > 0 ? (
          <Section title="Certifications">
            <ServiceCertificates certificates={certificates} />
          </Section>
        ) : null}

        <Section title="Sécurité & confiance">
          <ServiceSafety
            isVerified={provider.verified === true}
            hasInsurance={provider.insurance === true}
            hasWarranty={provider.warranty === true}
          />
        </Section>

        <Section title="Performance du prestataire">
          <ServiceStatistics
            reviews={provider.reviewCount}
            rating={provider.rating}
            responseTime={provider.responseTime}
          />
        </Section>

        <Section title="Avis clients">
          <ServiceReviews providerId={provider._id} />
        </Section>

        <Section title="Assistant DébrouilleAI">
          <ServiceAIAssistant providerId={provider._id} />
        </Section>

        <Section title="Historique">
          <ServiceHistory providerId={provider._id} />
        </Section>

        <Section title="Services similaires">
          <ServiceRecommendations providerId={provider._id} />
        </Section>

        <View style={styles.footerSpacing}>
          <ServiceFooter
            onLike={toggle}
            onShare={handleShare}
            isLiked={isFavorited}
          />
        </View>
      </ScrollView>

      <ServiceBooking
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
        providerId={provider._id}
      />

      {paymentOrderId ? (
        <ServicePayment
          isOpen={true}
          onClose={() => setPaymentOrderId(null)}
          amount={price}
          currency={currency}
          orderId={paymentOrderId}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  hero: {
    marginTop: 18,
    marginBottom: 8,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  titleContainer: {
    flex: 1,
  },

  serviceName: {
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  specialty: {
    marginTop: 6,
    color: "#FB923C",
    fontSize: 14,
    fontWeight: "600",
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.22)",
  },

  verifiedIcon: {
    color: "#4ADE80",
    fontSize: 14,
    fontWeight: "900",
    marginRight: 5,
  },

  verifiedText: {
    color: "#4ADE80",
    fontSize: 12,
    fontWeight: "700",
  },

  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },

  urgentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(239,68,68,0.14)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.20)",
  },

  badgeText: {
    color: "#F87171",
    fontSize: 12,
    fontWeight: "700",
  },

  availableBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.20)",
  },

  availableText: {
    color: "#4ADE80",
    fontSize: 12,
    fontWeight: "700",
  },

  unavailableBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(148,163,184,0.10)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.16)",
  },

  unavailableText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },

  section: {
    marginTop: 20,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },

  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  skillText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
  },

  mapSpacing: {
    marginTop: 12,
  },

  footerSpacing: {
    marginTop: 24,
  },

  centerState: {
    flex: 1,
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#050812",
  },

  stateIcon: {
    fontSize: 38,
    marginBottom: 14,
  },

  stateTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
  },

  stateDescription: {
    marginTop: 8,
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 420,
  },

  stateActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 22,
  },

  backButton: {
    marginTop: 22,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  primaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#4F46E5",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  secondaryButtonText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.72,
  },
});

import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Navigation,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Truck,
  Weight,
  X,
  Zap,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.js";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin.tsx";

type Delivery = Doc<"deliveries">;

type PageView = "list" | "new";

type StatusMeta = {
  label: string;
  color: string;
  background: string;
  icon: "clock" | "truck" | "package" | "check" | "error";
};

const STATUS_META: Record<string, StatusMeta> = {
  pending: {
    label: "En attente",
    color: "#F59E0B",
    background: "rgba(245,158,11,0.10)",
    icon: "clock",
  },
  assigned: {
    label: "Coursier assigné",
    color: "#60A5FA",
    background: "rgba(96,165,250,0.10)",
    icon: "truck",
  },
  picked_up: {
    label: "Pris en charge",
    color: "#A78BFA",
    background: "rgba(167,139,250,0.10)",
    icon: "package",
  },
  in_transit: {
    label: "En transit",
    color: "#818CF8",
    background: "rgba(129,140,248,0.10)",
    icon: "truck",
  },
  delivered: {
    label: "Livré",
    color: "#34D399",
    background: "rgba(52,211,153,0.10)",
    icon: "check",
  },
  failed: {
    label: "Échec",
    color: "#F87171",
    background: "rgba(248,113,113,0.10)",
    icon: "error",
  },
};

function getStatusMeta(status: string): StatusMeta {
  return (
    STATUS_META[status] ?? {
      label: status,
      color: "#94A3B8",
      background: "rgba(148,163,184,0.10)",
      icon: "package",
    }
  );
}

function StatusIcon({ status, size = 15 }: { status: string; size?: number }) {
  const meta = getStatusMeta(status);

  if (meta.icon === "clock") {
    return <Clock3 size={size} color={meta.color} />;
  }

  if (meta.icon === "truck") {
    return <Truck size={size} color={meta.color} />;
  }

  if (meta.icon === "check") {
    return <CheckCircle2 size={size} color={meta.color} />;
  }

  if (meta.icon === "error") {
    return <X size={size} color={meta.color} />;
  }

  return <Package size={size} color={meta.color} />;
}

function normalizeText(value: string): string {
  return value.trim();
}

function parseWeight(value: string): number | undefined {
  const normalized = value.replace(",", ".").trim();

  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function DeliveryCard({
  delivery,
  onPress,
}: {
  delivery: Delivery;
  onPress: () => void;
}) {
  const meta = getStatusMeta(delivery.status);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Voir la livraison ${delivery.trackingCode}`}
      style={({ pressed }) => [styles.deliveryCard, pressed && styles.pressed]}
    >
      <View style={styles.deliveryCardTop}>
        <View style={styles.deliveryIdentity}>
          <View
            style={[
              styles.packageIcon,
              {
                backgroundColor: meta.background,
              },
            ]}
          >
            <StatusIcon status={delivery.status} size={17} />
          </View>

          <View style={styles.deliveryCodeBlock}>
            <Text style={styles.trackingCode} numberOfLines={1}>
              {delivery.trackingCode}
            </Text>

            {typeof delivery.weightKg === "number" ? (
              <View style={styles.weightRow}>
                <Weight size={10} color="#64748B" />

                <Text style={styles.weightText}>{delivery.weightKg} kg</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: meta.background,
            },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              {
                color: meta.color,
              },
            ]}
          >
            {meta.label}
          </Text>
        </View>
      </View>

      <View style={styles.route}>
        <View style={styles.routeLine}>
          <View style={styles.originDot} />
          <View style={styles.routeConnector} />
          <View style={styles.destinationDot} />
        </View>

        <View style={styles.routeAddresses}>
          <Text style={styles.routeLabel}>Départ</Text>

          <Text style={styles.routeAddress} numberOfLines={2}>
            {delivery.pickupAddress}
          </Text>

          <View style={styles.routeSpacer} />

          <Text style={styles.routeLabel}>Destination</Text>

          <Text style={styles.routeAddress} numberOfLines={2}>
            {delivery.deliveryAddress}
          </Text>
        </View>

        <ChevronRight size={16} color="#475569" />
      </View>
    </Pressable>
  );
}

function NewDeliveryForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const createDelivery = useMutation(api.mobility.createDelivery);

  const [from, setFrom] = useState("");

  const [to, setTo] = useState("");

  const [description, setDescription] = useState("");

  const [weight, setWeight] = useState("");

  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const pickup = normalizeText(from);

    const destination = normalizeText(to);

    const cleanDescription = normalizeText(description);

    if (!pickup) {
      Alert.alert("Adresse de départ", "Indiquez l'adresse de départ.");
      return;
    }

    if (!destination) {
      Alert.alert("Destination", "Indiquez l'adresse de destination.");
      return;
    }

    if (!cleanDescription) {
      Alert.alert("Colis", "Décrivez le contenu ou la nature du colis.");
      return;
    }

    const parsedWeight = parseWeight(weight);

    if (weight.trim() && parsedWeight === undefined) {
      Alert.alert("Poids invalide", "Saisissez un poids supérieur à 0 kg.");
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await createDelivery({
        pickupAddress: pickup,
        deliveryAddress: destination,
        description: cleanDescription,
        weightKg: parsedWeight,
      });

      onCreated();
    } catch {
      Alert.alert(
        "Création impossible",
        "La livraison n'a pas pu être créée. Vérifiez votre connexion puis réessayez.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.newDeliveryContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.formContent}
      >
        <View style={styles.formHero}>
          <View style={styles.formHeroIcon}>
            <Package size={25} color="#A5B4FC" />
          </View>

          <View style={styles.formHeroBody}>
            <Text style={styles.formHeroTitle}>Nouvelle livraison</Text>

            <Text style={styles.formHeroText}>
              Préparez votre expédition avec les informations réellement
              nécessaires au traitement.
            </Text>
          </View>
        </View>

        <FormField
          label="Adresse de départ"
          required
          icon={<MapPin size={15} color="#FB923C" />}
          value={from}
          onChangeText={setFrom}
          placeholder="Adresse, point relais ou lieu de collecte"
          autoCapitalize="sentences"
        />

        <FormField
          label="Adresse de destination"
          required
          icon={<Navigation size={15} color="#34D399" />}
          value={to}
          onChangeText={setTo}
          placeholder="Adresse complète du destinataire"
          autoCapitalize="sentences"
        />

        <FormField
          label="Description du colis"
          required
          icon={<Package size={15} color="#818CF8" />}
          value={description}
          onChangeText={setDescription}
          placeholder="Nature ou contenu du colis"
          autoCapitalize="sentences"
          multiline
        />

        <FormField
          label="Poids"
          icon={<Weight size={15} color="#FBBF24" />}
          value={weight}
          onChangeText={setWeight}
          placeholder="Ex. 2.5"
          keyboardType="decimal-pad"
        />

        <View style={styles.formNotice}>
          <ShieldCheck size={16} color="#A5B4FC" />

          <Text style={styles.formNoticeText}>
            Les informations saisies sont transmises au service de livraison via
            le backend réel.
          </Text>
        </View>

        <Pressable
          onPress={() => void submit()}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Confirmer la livraison"
          style={[styles.confirmButton, loading && styles.disabled]}
        >
          <Truck size={17} color="#FFFFFF" />

          <Text style={styles.confirmButtonText}>
            {loading ? "Création…" : "Confirmer la livraison"}
          </Text>
        </Pressable>

        <Text style={styles.formFooterText}>
          Les tarifs, modes de paiement, assurance et attribution du coursier ne
          sont pas simulés ici : ils doivent être fournis par les services
          backend correspondants.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FormField({
  label,
  required,
  icon,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = "none",
  keyboardType = "default",
  multiline = false,
}: {
  label: string;
  required?: boolean;
  icon: React.ReactNode;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoCapitalize?: "none" | "sentences" | "words";
  keyboardType?: "default" | "decimal-pad" | "numeric";
  multiline?: boolean;
}) {
  return (
    <View style={styles.formField}>
      <View style={styles.fieldLabelRow}>
        {icon}

        <Text style={styles.fieldLabel}>
          {label}
          {required ? " *" : ""}
        </Text>
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#475569"
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.textInput, multiline && styles.multilineInput]}
      />
    </View>
  );
}

function DeliveryDetails({
  delivery,
  onClose,
}: {
  delivery: Delivery;
  onClose: () => void;
}) {
  const meta = getStatusMeta(delivery.status);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalDismiss} onPress={onClose} />

        <View style={styles.detailsSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.detailsHeader}>
            <View style={styles.detailsHeaderIdentity}>
              <Text style={styles.detailsTracking}>
                {delivery.trackingCode}
              </Text>

              <View style={styles.detailsStatusRow}>
                <StatusIcon status={delivery.status} size={13} />

                <Text
                  style={[
                    styles.detailsStatus,
                    {
                      color: meta.color,
                    },
                  ]}
                >
                  {meta.label}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer les détails"
              style={styles.closeButton}
            >
              <X size={17} color="#94A3B8" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.detailsContent}
          >
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>État de l'expédition</Text>

                <Text
                  style={[
                    styles.progressStatus,
                    {
                      color: meta.color,
                    },
                  ]}
                >
                  {meta.label}
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: meta.color,
                      width:
                        delivery.status === "pending"
                          ? "18%"
                          : delivery.status === "assigned"
                            ? "35%"
                            : delivery.status === "picked_up"
                              ? "52%"
                              : delivery.status === "in_transit"
                                ? "75%"
                                : delivery.status === "delivered"
                                  ? "100%"
                                  : "100%",
                    },
                  ]}
                />
              </View>

              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>Créée</Text>

                <Text style={styles.progressLabel}>Prise en charge</Text>

                <Text style={styles.progressLabel}>Livrée</Text>
              </View>
            </View>

            <View style={styles.routeDetailsCard}>
              <RouteDetail
                label="Collecte"
                value={delivery.pickupAddress}
                color="#FB923C"
                icon={<MapPin size={16} color="#FB923C" />}
              />

              <View style={styles.routeDetailDivider} />

              <RouteDetail
                label="Destination"
                value={delivery.deliveryAddress}
                color="#34D399"
                icon={<Navigation size={16} color="#34D399" />}
              />
            </View>

            <View style={styles.packageDetailsCard}>
              <DetailItem label="Description" value={delivery.description} />

              {typeof delivery.weightKg === "number" ? (
                <DetailItem label="Poids" value={`${delivery.weightKg} kg`} />
              ) : null}
            </View>

            <View style={styles.trustCard}>
              <ShieldCheck size={17} color="#A5B4FC" />

              <View style={styles.trustBody}>
                <Text style={styles.trustTitle}>
                  Suivi basé sur les données réelles
                </Text>

                <Text style={styles.trustText}>
                  Le statut et les informations affichés correspondent aux
                  données disponibles pour cette livraison.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function RouteDetail({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.routeDetail}>
      <View
        style={[
          styles.routeDetailIcon,
          {
            backgroundColor: `${color}15`,
          },
        ]}
      >
        {icon}
      </View>

      <View style={styles.routeDetailBody}>
        <Text style={styles.routeDetailLabel}>{label}</Text>

        <Text style={styles.routeDetailValue}>{value}</Text>
      </View>
    </View>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailItemLabel}>{label}</Text>

      <Text style={styles.detailItemValue}>{value}</Text>
    </View>
  );
}

function LivraisonContent({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<PageView>("list");

  const [trackCode, setTrackCode] = useState("");

  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null,
  );

  const myDeliveries = useQuery(api.mobility.getMyDeliveries, {}) as
    | Delivery[]
    | undefined;

  const normalizedTrackCode = trackCode.trim().toUpperCase();

  const trackedDelivery = useQuery(
    api.mobility.trackDelivery,
    normalizedTrackCode.length >= 8
      ? {
          trackingCode: normalizedTrackCode,
        }
      : "skip",
  ) as Delivery | null | undefined;

  const statistics = useMemo(() => {
    const deliveries = myDeliveries ?? [];

    return {
      total: deliveries.length,
      active: deliveries.filter(
        (delivery) =>
          delivery.status !== "delivered" && delivery.status !== "failed",
      ).length,
      delivered: deliveries.filter(
        (delivery) => delivery.status === "delivered",
      ).length,
    };
  }, [myDeliveries]);

  const isLoading = myDeliveries === undefined;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={view === "new" ? () => setView("list") : onBack}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={styles.backButton}
          >
            <ArrowLeft size={18} color="#FFFFFF" />
          </Pressable>

          <View>
            <Text style={styles.title}>Livraison Pro</Text>

            <Text style={styles.subtitle}>
              {view === "new"
                ? "Nouvelle expédition"
                : isLoading
                  ? "Chargement de vos expéditions…"
                  : `${statistics.total} expédition${statistics.total !== 1 ? "s" : ""}`}
            </Text>
          </View>
        </View>

        {view === "list" ? (
          <Pressable
            onPress={() => setView("new")}
            accessibilityRole="button"
            accessibilityLabel="Créer une livraison"
            style={styles.sendButton}
          >
            <Plus size={15} color="#FFFFFF" />

            <Text style={styles.sendButtonText}>Envoyer</Text>
          </Pressable>
        ) : null}
      </View>

      {view === "new" ? (
        <NewDeliveryForm
          onClose={() => setView("list")}
          onCreated={() => {
            setView("list");
          }}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Truck size={27} color="#A5B4FC" />
            </View>

            <Text style={styles.heroTitle}>Vos expéditions</Text>

            <Text style={styles.heroText}>
              Créez, retrouvez et suivez vos livraisons depuis un seul espace.
            </Text>
          </View>

          <View style={styles.trackingCard}>
            <View style={styles.trackingHeader}>
              <View style={styles.trackingIcon}>
                <Search size={17} color="#C4B5FD" />
              </View>

              <View style={styles.trackingHeaderBody}>
                <Text style={styles.trackingTitle}>Suivre un colis</Text>

                <Text style={styles.trackingSubtitle}>
                  Entrez votre code de suivi
                </Text>
              </View>
            </View>

            <View style={styles.trackingInputRow}>
              <TextInput
                value={trackCode}
                onChangeText={(value) => setTrackCode(value.toUpperCase())}
                placeholder="Code de suivi"
                placeholderTextColor="#475569"
                autoCapitalize="characters"
                autoCorrect={false}
                style={styles.trackingInput}
              />

              <View style={styles.trackingSearchButton}>
                <Search size={15} color="#FFFFFF" />
              </View>
            </View>

            {normalizedTrackCode.length >= 8 && trackedDelivery ? (
              <Pressable
                onPress={() => setSelectedDelivery(trackedDelivery)}
                accessibilityRole="button"
                style={styles.trackedResult}
              >
                <View style={styles.trackedResultStatus}>
                  <StatusIcon status={trackedDelivery.status} size={14} />

                  <Text
                    style={[
                      styles.trackedResultStatusText,
                      {
                        color: getStatusMeta(trackedDelivery.status).color,
                      },
                    ]}
                  >
                    {getStatusMeta(trackedDelivery.status).label}
                  </Text>
                </View>

                <Text style={styles.trackedResultRoute} numberOfLines={2}>
                  {trackedDelivery.pickupAddress}
                  {"  →  "}
                  {trackedDelivery.deliveryAddress}
                </Text>

                <ChevronRight size={15} color="#64748B" />
              </Pressable>
            ) : normalizedTrackCode.length >= 8 && trackedDelivery === null ? (
              <View style={styles.notFound}>
                <Text style={styles.notFoundText}>
                  Aucun colis trouvé avec ce code.
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              label="Total"
              value={isLoading ? "—" : String(statistics.total)}
              icon={<Package size={16} color="#A78BFA" />}
            />

            <StatCard
              label="En cours"
              value={isLoading ? "—" : String(statistics.active)}
              icon={<Truck size={16} color="#FBBF24" />}
            />

            <StatCard
              label="Livrés"
              value={isLoading ? "—" : String(statistics.delivered)}
              icon={<CheckCircle2 size={16} color="#34D399" />}
            />
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Mes expéditions</Text>

              <Text style={styles.sectionSubtitle}>
                Historique provenant de votre compte
              </Text>
            </View>

            {!isLoading && statistics.total > 0 ? (
              <Text style={styles.sectionCount}>{statistics.total}</Text>
            ) : null}
          </View>

          {isLoading ? (
            <View style={styles.loadingList}>
              {[0, 1, 2].map((item) => (
                <View key={item} style={styles.loadingCard}>
                  <View style={styles.loadingIcon} />

                  <View style={styles.loadingLines}>
                    <View style={styles.loadingLineLarge} />

                    <View style={styles.loadingLineSmall} />

                    <View style={styles.loadingLineSmall} />
                  </View>
                </View>
              ))}
            </View>
          ) : myDeliveries?.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Package size={32} color="#64748B" />
              </View>

              <Text style={styles.emptyTitle}>Aucune expédition</Text>

              <Text style={styles.emptyText}>
                Vos livraisons apparaîtront ici dès qu'une expédition réelle
                sera créée.
              </Text>

              <Pressable
                onPress={() => setView("new")}
                style={styles.emptyAction}
              >
                <Plus size={15} color="#FFFFFF" />

                <Text style={styles.emptyActionText}>Créer une livraison</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.deliveryList}>
              {myDeliveries?.map((delivery) => (
                <DeliveryCard
                  key={delivery._id}
                  delivery={delivery}
                  onPress={() => setSelectedDelivery(delivery)}
                />
              ))}
            </View>
          )}

          <View style={styles.securityCard}>
            <View style={styles.securityIcon}>
              <ShieldCheck size={17} color="#A5B4FC" />
            </View>

            <View style={styles.securityBody}>
              <Text style={styles.securityTitle}>Expédition suivie</Text>

              <Text style={styles.securityText}>
                Les statuts et codes affichés sont issus des données de
                livraison disponibles dans le backend.
              </Text>
            </View>
          </View>

          <View style={styles.capabilityCard}>
            <Zap size={16} color="#FBBF24" />

            <Text style={styles.capabilityText}>
              Cette interface est prête à accueillir les services
              supplémentaires lorsqu'ils seront exposés par le backend : tarif,
              paiement, attribution du coursier, géolocalisation temps réel et
              preuve de livraison.
            </Text>
          </View>
        </ScrollView>
      )}

      {selectedDelivery ? (
        <DeliveryDetails
          delivery={selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
        />
      ) : null}
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>

      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function LivraisonPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <AuthLoading>
        <View style={styles.authLoading}>
          <View style={styles.authLoadingIcon}>
            <Truck size={25} color="#818CF8" />
          </View>

          <Text style={styles.authLoadingTitle}>
            Préparation de Livraison Pro…
          </Text>
        </View>
      </AuthLoading>

      <Unauthenticated>
        <View style={styles.unauthenticated}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={styles.backButton}
          >
            <ArrowLeft size={18} color="#FFFFFF" />
          </Pressable>

          <View style={styles.unauthenticatedIcon}>
            <Package size={37} color="#818CF8" />
          </View>

          <Text style={styles.unauthenticatedTitle}>
            Vos livraisons, au même endroit
          </Text>

          <Text style={styles.unauthenticatedText}>
            Connectez-vous pour créer une expédition, consulter votre historique
            et suivre vos colis.
          </Text>

          <SignInButton />
        </View>
      </Unauthenticated>

      <Authenticated>
        <LivraisonContent onBack={onBack} />
      </Authenticated>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  header: {
    minHeight: 78,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(5,8,18,0.97)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  subtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 8,
    fontWeight: "700",
  },

  sendButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#4F46E5",
  },

  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "900",
  },

  scroll: {
    flex: 1,
  },

  content: {
    width: "100%",
    maxWidth: 820,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 35,
  },

  hero: {
    padding: 17,
    borderRadius: 21,
    backgroundColor: "rgba(99,102,241,0.065)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.14)",
  },

  heroIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.12)",
  },

  heroTitle: {
    marginTop: 11,
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "900",
  },

  heroText: {
    marginTop: 5,
    maxWidth: 520,
    color: "#64748B",
    fontSize: 8.5,
    lineHeight: 14,
  },

  trackingCard: {
    marginTop: 11,
    padding: 13,
    borderRadius: 19,
    backgroundColor: "rgba(139,92,246,0.055)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.14)",
  },

  trackingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  trackingIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.12)",
  },

  trackingHeaderBody: {
    flex: 1,
  },

  trackingTitle: {
    color: "#CBD5E1",
    fontSize: 9.5,
    fontWeight: "900",
  },

  trackingSubtitle: {
    marginTop: 3,
    color: "#475569",
    fontSize: 7.5,
  },

  trackingInputRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 7,
  },

  trackingInput: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  trackingSearchButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
  },

  trackedResult: {
    marginTop: 9,
    padding: 10,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  trackedResultStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  trackedResultStatusText: {
    fontSize: 7.5,
    fontWeight: "900",
  },

  trackedResultRoute: {
    flex: 1,
    color: "#94A3B8",
    fontSize: 7.5,
    lineHeight: 12,
  },

  notFound: {
    marginTop: 9,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(248,113,113,0.06)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.12)",
  },

  notFoundText: {
    color: "#94A3B8",
    fontSize: 8,
    textAlign: "center",
  },

  statsGrid: {
    marginTop: 11,
    flexDirection: "row",
    gap: 7,
  },

  statCard: {
    flex: 1,
    minHeight: 91,
    padding: 11,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  statIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  statValue: {
    marginTop: 5,
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "950",
  },

  statLabel: {
    marginTop: 2,
    color: "#475569",
    fontSize: 7,
    fontWeight: "750",
  },

  sectionHeader: {
    marginTop: 19,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  sectionTitle: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 3,
    color: "#475569",
    fontSize: 7.5,
  },

  sectionCount: {
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    color: "#A5B4FC",
    fontSize: 7,
    fontWeight: "900",
    textAlign: "center",
    backgroundColor: "rgba(99,102,241,0.10)",
  },

  deliveryList: {
    gap: 9,
  },

  deliveryCard: {
    padding: 13,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  deliveryCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  deliveryIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  packageIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  deliveryCodeBlock: {
    flex: 1,
    minWidth: 0,
  },

  trackingCode: {
    color: "#F8FAFC",
    fontSize: 9.5,
    fontWeight: "900",
  },

  weightRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  weightText: {
    color: "#64748B",
    fontSize: 7.5,
    fontWeight: "650",
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 6.8,
    fontWeight: "900",
  },

  route: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  routeLine: {
    width: 12,
    height: 74,
    alignItems: "center",
    justifyContent: "space-between",
  },

  originDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#FB923C",
  },

  destinationDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#34D399",
  },

  routeConnector: {
    width: 1,
    flex: 1,
    marginVertical: 4,
    backgroundColor: "rgba(148,163,184,0.18)",
  },

  routeAddresses: {
    flex: 1,
    minWidth: 0,
  },

  routeLabel: {
    color: "#475569",
    fontSize: 6.5,
    fontWeight: "850",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  routeAddress: {
    marginTop: 2,
    color: "#94A3B8",
    fontSize: 8,
    lineHeight: 13,
  },

  routeSpacer: {
    height: 8,
  },

  emptyState: {
    paddingVertical: 36,
    paddingHorizontal: 22,
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  emptyTitle: {
    marginTop: 12,
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "900",
  },

  emptyText: {
    maxWidth: 310,
    marginTop: 5,
    color: "#475569",
    fontSize: 8,
    lineHeight: 13,
    textAlign: "center",
  },

  emptyAction: {
    marginTop: 13,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#4F46E5",
  },

  emptyActionText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },

  securityCard: {
    marginTop: 14,
    padding: 12,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(99,102,241,0.045)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.11)",
  },

  securityIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.10)",
  },

  securityBody: {
    flex: 1,
  },

  securityTitle: {
    color: "#CBD5E1",
    fontSize: 8.5,
    fontWeight: "850",
  },

  securityText: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 7.5,
    lineHeight: 12,
  },

  capabilityCard: {
    marginTop: 8,
    padding: 11,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: "rgba(245,158,11,0.035)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.08)",
  },

  capabilityText: {
    flex: 1,
    color: "#475569",
    fontSize: 7,
    lineHeight: 11,
  },

  /* FORM */

  newDeliveryContainer: {
    flex: 1,
  },

  formContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 35,
  },

  formHero: {
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(99,102,241,0.06)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.13)",
  },

  formHeroIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.12)",
  },

  formHeroBody: {
    flex: 1,
  },

  formHeroTitle: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "900",
  },

  formHeroText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 8,
    lineHeight: 13,
  },

  formField: {
    marginTop: 12,
  },

  fieldLabelRow: {
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  fieldLabel: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "850",
  },

  textInput: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 13,
    color: "#FFFFFF",
    fontSize: 9.5,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  multilineInput: {
    minHeight: 92,
    paddingTop: 11,
  },

  formNotice: {
    marginTop: 13,
    padding: 11,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: "rgba(99,102,241,0.05)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.11)",
  },

  formNoticeText: {
    flex: 1,
    color: "#64748B",
    fontSize: 7.5,
    lineHeight: 12,
  },

  confirmButton: {
    marginTop: 13,
    minHeight: 49,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#4F46E5",
  },

  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "950",
  },

  formFooterText: {
    marginTop: 8,
    color: "#334155",
    fontSize: 7,
    lineHeight: 11,
    textAlign: "center",
  },

  /* DETAILS */

  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.74)",
  },

  modalDismiss: {
    flex: 1,
  },

  detailsSheet: {
    maxHeight: "87%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#090D19",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  sheetHandle: {
    width: 38,
    height: 4,
    marginTop: 9,
    alignSelf: "center",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  detailsHeader: {
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.055)",
  },

  detailsHeaderIdentity: {
    flex: 1,
  },

  detailsTracking: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "950",
  },

  detailsStatusRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  detailsStatus: {
    fontSize: 8,
    fontWeight: "850",
  },

  closeButton: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  detailsContent: {
    padding: 15,
    paddingBottom: 30,
  },

  progressCard: {
    padding: 13,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  progressTitle: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "850",
  },

  progressStatus: {
    fontSize: 8,
    fontWeight: "900",
  },

  progressTrack: {
    height: 5,
    marginTop: 13,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  progressLabels: {
    marginTop: 7,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  progressLabel: {
    color: "#475569",
    fontSize: 6.5,
    fontWeight: "700",
  },

  routeDetailsCard: {
    marginTop: 10,
    padding: 13,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  routeDetail: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },

  routeDetailIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  routeDetailBody: {
    flex: 1,
  },

  routeDetailLabel: {
    color: "#475569",
    fontSize: 6.5,
    fontWeight: "850",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  routeDetailValue: {
    marginTop: 3,
    color: "#94A3B8",
    fontSize: 8.5,
    lineHeight: 13,
  },

  routeDetailDivider: {
    height: 1,
    marginVertical: 11,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  packageDetailsCard: {
    marginTop: 10,
    padding: 13,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  detailItem: {
    paddingVertical: 4,
  },

  detailItemLabel: {
    color: "#475569",
    fontSize: 7,
    fontWeight: "800",
  },

  detailItemValue: {
    marginTop: 3,
    color: "#CBD5E1",
    fontSize: 8.5,
    lineHeight: 13,
  },

  trustCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(99,102,241,0.05)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.11)",
  },

  trustBody: {
    flex: 1,
  },

  trustTitle: {
    color: "#CBD5E1",
    fontSize: 8,
    fontWeight: "850",
  },

  trustText: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 7.5,
    lineHeight: 12,
  },

  /* AUTH */

  authLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050812",
  },

  authLoadingIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.10)",
  },

  authLoadingTitle: {
    marginTop: 12,
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "850",
  },

  unauthenticated: {
    flex: 1,
    paddingHorizontal: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050812",
  },

  unauthenticatedIcon: {
    width: 78,
    height: 78,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.08)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.14)",
  },

  unauthenticatedTitle: {
    marginTop: 15,
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },

  unauthenticatedText: {
    maxWidth: 330,
    marginTop: 6,
    marginBottom: 15,
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
  },

  /* LOADING / GENERAL */

  loadingList: {
    gap: 9,
  },

  loadingCard: {
    height: 130,
    padding: 13,
    borderRadius: 19,
    flexDirection: "row",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  loadingIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  loadingLines: {
    flex: 1,
    gap: 9,
    paddingTop: 3,
  },

  loadingLineLarge: {
    width: "45%",
    height: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  loadingLineSmall: {
    width: "82%",
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  disabled: {
    opacity: 0.45,
  },
});

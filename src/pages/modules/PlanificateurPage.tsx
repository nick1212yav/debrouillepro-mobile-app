// src/pages/modules/PlanificateurPage.tsx

import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMemo, useState } from "react";

import {
  ArrowLeft,
  Calendar,
  Camera,
  Car,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  Navigation,
  Plane,
  Plus,
  Share2,
  Sparkles,
  Train,
  Users,
  X,
} from "lucide-react-native";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";

import { Skeleton } from "@/components/ui/skeleton.tsx";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type TransportMode = "plane" | "train" | "car" | "other";

type ActiveTab = "itinerary" | "checklist";

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

type Props = {
  onBack: () => void;
};

type TravelPlan = {
  _id: string;
  title?: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  coverImage?: string | null;
  entriesCount?: number;
  status?: string;
  totalBudget?: number;
  expensesTotal?: number;
  currency?: string;
};

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

/**
 * Checklist générique internationale.
 *
 * Aucun pays n'est présupposé.
 * Les exigences de visa, santé et documents dépendent
 * du pays de départ, du pays de destination et du profil
 * du voyageur : elles doivent être vérifiées auprès des
 * autorités compétentes.
 */
const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {
    id: "passport",
    label: "Vérifier passeport et documents de voyage",
    done: false,
  },
  {
    id: "visa",
    label: "Vérifier les exigences de visa / entrée",
    done: false,
  },
  {
    id: "ticket",
    label: "Billets et réservations de transport",
    done: false,
  },
  {
    id: "insurance",
    label: "Vérifier l'assurance voyage",
    done: false,
  },
  {
    id: "accommodation",
    label: "Hébergement",
    done: false,
  },
  {
    id: "currency",
    label: "Préparer les moyens de paiement et devises",
    done: false,
  },
  {
    id: "offline",
    label: "Préparer cartes et informations hors ligne",
    done: false,
  },
  {
    id: "health",
    label: "Vérifier les exigences sanitaires du voyage",
    done: false,
  },
];

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function parseDate(value: string): Date | null {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDate(
  value: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = parseDate(value);

  if (!date) {
    return "Date non disponible";
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    options ?? {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function formatDateRange(start: string, end: string): string {
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  if (!startDate || !endDate) {
    return "Dates non disponibles";
  }

  const sameYear = startDate.getFullYear() === endDate.getFullYear();

  const startText = new Intl.DateTimeFormat(
    "fr-FR",
    sameYear
      ? {
          day: "numeric",
          month: "short",
        }
      : {
          day: "numeric",
          month: "short",
          year: "numeric",
        },
  ).format(startDate);

  const endText = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(endDate);

  return `${startText} – ${endText}`;
}

function formatMoney(value: number, currency?: string): string {
  const amount = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(value);

  return `${amount}${currency ? ` ${currency}` : ""}`;
}

function getStatusLabel(status?: string): string {
  switch (status) {
    case "draft":
      return "Brouillon";

    case "confirmed":
      return "Confirmé";

    case "completed":
    case "finished":
      return "Terminé";

    case "cancelled":
      return "Annulé";

    default:
      return status || "Statut non communiqué";
  }
}

function getTransportLabel(mode: TransportMode): string {
  switch (mode) {
    case "plane":
      return "Avion";

    case "train":
      return "Train";

    case "car":
      return "Voiture";

    default:
      return "Autre";
  }
}

/* ============================================================================
 * TRANSPORT ICON
 * ========================================================================== */

function TransportIcon({
  mode,
  size = 19,
  color = "#A78BFA",
}: {
  mode: TransportMode;
  size?: number;
  color?: string;
}) {
  if (mode === "plane") {
    return <Plane size={size} color={color} />;
  }

  if (mode === "train") {
    return <Train size={size} color={color} />;
  }

  if (mode === "car") {
    return <Car size={size} color={color} />;
  }

  return <Navigation size={size} color={color} />;
}

/* ============================================================================
 * AUTH LOADING
 * ========================================================================== */

function PlannerLoading({ onBack }: Props) {
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

        <View style={styles.headerIdentity}>
          <View style={styles.loadingIcon} />

          <View>
            <View style={styles.loadingTitle} />
            <View style={styles.loadingSubtitle} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.loadingContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.loadingHero} />

        <View style={styles.loadingCard} />

        <View style={styles.loadingCard} />

        <View style={styles.loadingCard} />
      </ScrollView>
    </View>
  );
}

/* ============================================================================
 * UNAUTHENTICATED
 * ========================================================================== */

function PlannerUnauthenticated({ onBack }: Props) {
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

        <Text style={styles.headerTitle}>Planificateur</Text>
      </View>

      <View style={styles.emptyCenter}>
        <View style={styles.emptyIcon}>
          <Calendar size={32} color="#A78BFA" />
        </View>

        <Text style={styles.emptyTitle}>Planifiez vos voyages</Text>

        <Text style={styles.emptyText}>
          Connectez-vous pour créer et consulter vos voyages depuis votre espace
          personnel.
        </Text>

        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={16} color="#FFFFFF" />

          <Text style={styles.backButtonText}>Retour</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================================
 * TRIP CARD
 * ========================================================================== */

function TripCard({
  trip,
  onPress,
}: {
  trip: TravelPlan;
  onPress: () => void;
}) {
  const entries = typeof trip.entriesCount === "number" ? trip.entriesCount : 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir le voyage ${trip.destination}`}
      style={({ pressed }) => [
        styles.tripCard,
        pressed && styles.tripCardPressed,
      ]}
    >
      {trip.coverImage ? (
        <Image
          source={{
            uri: trip.coverImage,
          }}
          style={styles.tripImage}
          accessibilityLabel={trip.destination}
        />
      ) : (
        <View style={styles.tripPlaceholder}>
          <MapPin size={42} color="rgba(255,255,255,0.2)" />
        </View>
      )}

      <View style={styles.tripOverlay} />

      <View style={styles.tripTopBadge}>
        <CheckCircle2 size={12} color="#4ADE80" />

        <Text style={styles.tripTopBadgeText}>
          {entries} entrée
          {entries !== 1 ? "s" : ""}
        </Text>
      </View>

      <View style={styles.tripBottom}>
        <View style={styles.tripBottomMain}>
          <Text style={styles.tripDestination} numberOfLines={1}>
            {trip.destination}
          </Text>

          <View style={styles.tripDateRow}>
            <Calendar size={12} color="rgba(255,255,255,0.72)" />

            <Text style={styles.tripDate} numberOfLines={1}>
              {formatDateRange(trip.startDate, trip.endDate)}
            </Text>
          </View>
        </View>

        <View style={styles.travelersBadge}>
          <Users size={14} color="#FFFFFF" />

          <Text style={styles.travelersNumber}>{trip.travelers}</Text>

          <Text style={styles.travelersLabel}>
            voyageur
            {trip.travelers !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/* ============================================================================
 * NEW TRIP MODAL
 * ========================================================================== */

function NewTripModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (destination: string) => void;
}) {
  const createTrip = useMutation(api.travel.createTravelPlan);

  const [destination, setDestination] = useState("");

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  const [travelers, setTravelers] = useState("1");

  const [transport, setTransport] = useState<TransportMode>("plane");

  const [saving, setSaving] = useState(false);

  const reset = () => {
    setDestination("");
    setStartDate("");
    setEndDate("");
    setTravelers("1");
    setTransport("plane");
    setSaving(false);
  };

  const close = () => {
    if (saving) {
      return;
    }

    reset();
    onClose();
  };

  const submit = async () => {
    const cleanDestination = destination.trim();

    const cleanStart = startDate.trim();

    const cleanEnd = endDate.trim();

    if (!cleanDestination || !cleanStart || !cleanEnd) {
      Alert.alert(
        "Informations manquantes",
        "Veuillez renseigner la destination et les deux dates.",
      );
      return;
    }

    const start = parseDate(cleanStart);

    const end = parseDate(cleanEnd);

    if (!start || !end) {
      Alert.alert(
        "Dates invalides",
        "Utilisez un format de date valide, par exemple 2026-10-15.",
      );
      return;
    }

    if (end.getTime() < start.getTime()) {
      Alert.alert(
        "Dates invalides",
        "La date de retour doit être postérieure ou égale à la date de départ.",
      );
      return;
    }

    const travelerCount = Number.parseInt(travelers, 10);

    if (!Number.isFinite(travelerCount) || travelerCount < 1) {
      Alert.alert(
        "Nombre de voyageurs invalide",
        "Le nombre de voyageurs doit être au moins égal à 1.",
      );
      return;
    }

    setSaving(true);

    try {
      /*
       * IMPORTANT :
       *
       * Le backend fourni accepte actuellement :
       * title, destination, startDate, endDate,
       * travelers.
       *
       * Le transport sélectionné est donc conservé
       * dans l'interface pour préparer l'expérience,
       * mais n'est PAS envoyé à Convex car le contrat
       * fourni ne l'expose pas.
       */
      await createTrip({
        title: cleanDestination,
        destination: cleanDestination,
        startDate: cleanStart,
        endDate: cleanEnd,
        travelers: travelerCount,
      });

      const createdDestination = cleanDestination;

      reset();
      onClose();
      onCreated(createdDestination);
    } catch {
      setSaving(false);

      Alert.alert(
        "Création impossible",
        "Le voyage n'a pas pu être créé. Vérifiez votre connexion puis réessayez.",
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={close}
          disabled={saving}
        />

        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Nouveau voyage</Text>

              <Text style={styles.modalSubtitle}>
                Créez votre espace de voyage
              </Text>
            </View>

            <Pressable
              onPress={close}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              style={styles.modalClose}
            >
              <X size={19} color="rgba(255,255,255,0.72)" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.formContent}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Destination</Text>

              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder="Ville, région ou pays"
                placeholderTextColor="rgba(255,255,255,0.25)"
                style={styles.input}
                autoCapitalize="words"
                editable={!saving}
              />
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.inputLabel}>Départ</Text>

                <TextInput
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="numbers-and-punctuation"
                  editable={!saving}
                />
              </View>

              <View style={styles.dateField}>
                <Text style={styles.inputLabel}>Retour</Text>

                <TextInput
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="numbers-and-punctuation"
                  editable={!saving}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Voyageurs</Text>

              <TextInput
                value={travelers}
                onChangeText={setTravelers}
                placeholder="1"
                placeholderTextColor="rgba(255,255,255,0.25)"
                style={styles.input}
                keyboardType="number-pad"
                editable={!saving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Transport principal</Text>

              <View style={styles.transportGrid}>
                {(["plane", "train", "car", "other"] as TransportMode[]).map(
                  (mode) => {
                    const selected = transport === mode;

                    return (
                      <Pressable
                        key={mode}
                        onPress={() => setTransport(mode)}
                        disabled={saving}
                        accessibilityRole="button"
                        accessibilityState={{
                          selected,
                        }}
                        style={[
                          styles.transportOption,
                          selected && styles.transportOptionActive,
                        ]}
                      >
                        <TransportIcon
                          mode={mode}
                          color={
                            selected ? "#A78BFA" : "rgba(255,255,255,0.48)"
                          }
                        />

                        <Text
                          style={[
                            styles.transportText,
                            selected && styles.transportTextActive,
                          ]}
                        >
                          {getTransportLabel(mode)}
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </View>

              <Text style={styles.contractNotice}>
                Le transport sera intégré aux détails du voyage lorsqu'un champ
                correspondant sera disponible dans le backend.
              </Text>
            </View>

            <Pressable
              onPress={() => {
                void submit();
              }}
              disabled={saving}
              accessibilityRole="button"
              style={[
                styles.createButton,
                saving && styles.createButtonDisabled,
              ]}
            >
              <Plus size={18} color="#FFFFFF" />

              <Text style={styles.createButtonText}>
                {saving ? "Création..." : "Créer le voyage"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * TRIP DETAILS
 * ========================================================================== */

function TripDetails({
  trip,
  onBack,
}: {
  trip: TravelPlan;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("itinerary");

  const [checklist, setChecklist] =
    useState<ChecklistItem[]>(DEFAULT_CHECKLIST);

  const doneCount = useMemo(
    () => checklist.filter((item) => item.done).length,
    [checklist],
  );

  const progress =
    checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;

  const toggleChecklistItem = (id: string) => {
    setChecklist((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              done: !item.done,
            }
          : item,
      ),
    );
  };

  const shareTrip = async () => {
    try {
      await Share.share({
        title: trip.destination,
        message:
          `${trip.destination}\n` +
          `${formatDateRange(trip.startDate, trip.endDate)}\n` +
          `${trip.travelers} voyage${trip.travelers !== 1 ? "urs" : "ur"}`,
      });
    } catch {
      // Annulation du partage : aucune action nécessaire.
    }
  };

  const hasBudget =
    typeof trip.totalBudget === "number" && Number.isFinite(trip.totalBudget);

  return (
    <View style={styles.screen}>
      {/* ====================================================================
       * DETAIL HEADER
       * ================================================================== */}

      <View style={styles.detailHero}>
        {trip.coverImage ? (
          <Image
            source={{
              uri: trip.coverImage,
            }}
            style={styles.detailHeroImage}
            accessibilityLabel={trip.destination}
          />
        ) : (
          <View style={styles.detailHeroPlaceholder}>
            <MapPin size={50} color="rgba(255,255,255,0.2)" />
          </View>
        )}

        <View style={styles.detailHeroOverlay} />

        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour aux voyages"
          style={styles.heroButton}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <Pressable
          onPress={() => {
            void shareTrip();
          }}
          accessibilityRole="button"
          accessibilityLabel="Partager le voyage"
          style={[styles.heroButton, styles.heroShareButton]}
        >
          <Share2 size={18} color="#FFFFFF" />
        </Pressable>

        <View style={styles.detailHeroBottom}>
          <View style={styles.detailHeroIdentity}>
            <Text style={styles.detailDestination} numberOfLines={2}>
              {trip.destination}
            </Text>

            <View style={styles.detailDateRow}>
              <Calendar size={13} color="rgba(255,255,255,0.72)" />

              <Text style={styles.detailDate}>
                {formatDateRange(trip.startDate, trip.endDate)}
              </Text>

              <View style={styles.heroSeparator} />

              <Users size={13} color="rgba(255,255,255,0.72)" />

              <Text style={styles.detailDate}>{trip.travelers}</Text>
            </View>
          </View>

          {typeof trip.entriesCount === "number" && (
            <View style={styles.entriesBadge}>
              <Text style={styles.entriesNumber}>{trip.entriesCount}</Text>

              <Text style={styles.entriesLabel}>entrées</Text>
            </View>
          )}
        </View>
      </View>

      {/* ====================================================================
       * TABS
       * ================================================================== */}

      <View style={styles.tabs}>
        <Pressable
          onPress={() => setActiveTab("itinerary")}
          accessibilityRole="button"
          accessibilityState={{
            selected: activeTab === "itinerary",
          }}
          style={[styles.tab, activeTab === "itinerary" && styles.tabActive]}
        >
          <Calendar
            size={16}
            color={
              activeTab === "itinerary" ? "#A78BFA" : "rgba(255,255,255,0.38)"
            }
          />

          <Text
            style={[
              styles.tabText,
              activeTab === "itinerary" && styles.tabTextActive,
            ]}
          >
            Voyage
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("checklist")}
          accessibilityRole="button"
          accessibilityState={{
            selected: activeTab === "checklist",
          }}
          style={[styles.tab, activeTab === "checklist" && styles.tabActive]}
        >
          <CheckCircle2
            size={16}
            color={
              activeTab === "checklist" ? "#A78BFA" : "rgba(255,255,255,0.38)"
            }
          />

          <Text
            style={[
              styles.tabText,
              activeTab === "checklist" && styles.tabTextActive,
            ]}
          >
            Checklist
          </Text>

          <View style={styles.tabCounter}>
            <Text style={styles.tabCounterText}>{doneCount}</Text>
          </View>
        </Pressable>
      </View>

      {/* ====================================================================
       * TAB CONTENT
       * ================================================================== */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.detailContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "itinerary" && (
          <>
            <View style={styles.sectionCard}>
              <View style={styles.sectionCardHeader}>
                <View style={styles.sectionCardIcon}>
                  <Navigation size={16} color="#A78BFA" />
                </View>

                <View>
                  <Text style={styles.sectionCardTitle}>
                    Informations du voyage
                  </Text>

                  <Text style={styles.sectionCardSubtitle}>
                    Données enregistrées
                  </Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <InfoTile
                  icon={<MapPin size={15} color="#A78BFA" />}
                  label="Destination"
                  value={trip.destination}
                />

                <InfoTile
                  icon={<Calendar size={15} color="#60A5FA" />}
                  label="Départ"
                  value={formatDate(trip.startDate)}
                />

                <InfoTile
                  icon={<Calendar size={15} color="#60A5FA" />}
                  label="Retour"
                  value={formatDate(trip.endDate)}
                />

                <InfoTile
                  icon={<Users size={15} color="#4ADE80" />}
                  label="Voyageurs"
                  value={String(trip.travelers)}
                />

                <InfoTile
                  icon={<Clock size={15} color="#FBBF24" />}
                  label="Entrées"
                  value={String(trip.entriesCount ?? 0)}
                />

                <InfoTile
                  icon={<CheckCircle2 size={15} color="#4ADE80" />}
                  label="Statut"
                  value={getStatusLabel(trip.status)}
                />
              </View>
            </View>

            {hasBudget && (
              <View style={styles.budgetCard}>
                <View style={styles.budgetIcon}>
                  <Sparkles size={17} color="#4ADE80" />
                </View>

                <View style={styles.budgetContent}>
                  <Text style={styles.budgetLabel}>Budget du voyage</Text>

                  <Text style={styles.budgetTotal}>
                    {formatMoney(trip.totalBudget!, trip.currency)}
                  </Text>

                  {typeof trip.expensesTotal === "number" && (
                    <Text style={styles.budgetSpent}>
                      Dépenses enregistrées :{" "}
                      {formatMoney(trip.expensesTotal, trip.currency)}
                    </Text>
                  )}
                </View>
              </View>
            )}

            <View style={styles.infoNotice}>
              <Camera size={17} color="#A78BFA" />

              <Text style={styles.infoNoticeText}>
                Utilisez le Carnet de Voyage pour ajouter vos étapes, souvenirs
                et entrées à ce voyage.
              </Text>
            </View>
          </>
        )}

        {activeTab === "checklist" && (
          <>
            <View style={styles.sectionCard}>
              <View style={styles.checklistHeader}>
                <View>
                  <Text style={styles.sectionCardTitle}>
                    Préparation du voyage
                  </Text>

                  <Text style={styles.sectionCardSubtitle}>
                    {doneCount}/{checklist.length} éléments complétés
                  </Text>
                </View>

                <Text style={styles.progressPercentage}>{progress}%</Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.checklistList}>
              {checklist.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => toggleChecklistItem(item.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{
                    checked: item.done,
                  }}
                  style={[
                    styles.checklistItem,
                    item.done && styles.checklistItemDone,
                  ]}
                >
                  {item.done ? (
                    <CheckCircle2 size={21} color="#4ADE80" />
                  ) : (
                    <Circle size={21} color="rgba(255,255,255,0.3)" />
                  )}

                  <Text
                    style={[
                      styles.checklistText,
                      item.done && styles.checklistTextDone,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.globalTravelNotice}>
              <Sparkles size={17} color="#A78BFA" />

              <Text style={styles.globalTravelNoticeText}>
                Les formalités de voyage varient selon les pays, la nationalité,
                le motif du voyage et la situation du voyageur. Vérifiez
                toujours les exigences officielles applicables à votre
                itinéraire.
              </Text>
            </View>
          </>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

/* ============================================================================
 * INFO TILE
 * ========================================================================== */

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoTile}>
      <View style={styles.infoTileIcon}>{icon}</View>

      <View style={styles.infoTileContent}>
        <Text style={styles.infoTileLabel}>{label}</Text>

        <Text style={styles.infoTileValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

function PlanificateurInner({ onBack }: Props) {
  const tripsQuery = useQuery(api.travel.listMyTravelPlans, {});

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const [showNewTrip, setShowNewTrip] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);

  const trips = (tripsQuery ?? []) as TravelPlan[];

  const selectedTrip =
    trips.find((trip) => trip._id === selectedTripId) ?? null;

  const handleCreated = (destination: string) => {
    setNotice(`Voyage "${destination}" créé avec succès.`);

    setTimeout(() => {
      setNotice(null);
    }, 2500);
  };

  if (selectedTrip) {
    return (
      <>
        <TripDetails
          trip={selectedTrip}
          onBack={() => setSelectedTripId(null)}
        />

        {notice && (
          <View pointerEvents="none" style={styles.notice}>
            <Check size={16} color="#4ADE80" />

            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        )}
      </>
    );
  }

  return (
    <View style={styles.screen}>
      {/* ====================================================================
       * LIST HEADER
       * ================================================================== */}

      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={styles.headerButton}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerIdentity}>
          <View style={styles.headerIcon}>
            <Navigation size={18} color="#A78BFA" />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Planificateur</Text>

            <Text style={styles.headerSubtitle}>
              {trips.length} voyage
              {trips.length !== 1 ? "s" : ""} planifié
              {trips.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => setShowNewTrip(true)}
          accessibilityRole="button"
          accessibilityLabel="Créer un nouveau voyage"
          style={styles.newButton}
        >
          <Plus size={17} color="#FFFFFF" />

          <Text style={styles.newButtonText}>Nouveau</Text>
        </Pressable>
      </View>

      {/* ====================================================================
       * TRIPS
       * ================================================================== */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {tripsQuery === undefined ? (
          <>
            <Skeleton style={styles.loadingTrip} />

            <Skeleton style={styles.loadingTrip} />
          </>
        ) : trips.length === 0 ? (
          <View style={styles.noTrips}>
            <View style={styles.noTripsIcon}>
              <Navigation size={34} color="#A78BFA" />
            </View>

            <Text style={styles.noTripsTitle}>Aucun voyage planifié</Text>

            <Text style={styles.noTripsText}>
              Commencez par créer votre premier voyage. Vous pourrez ensuite
              suivre ses informations et sa préparation.
            </Text>

            <Pressable
              onPress={() => setShowNewTrip(true)}
              style={styles.emptyCreateButton}
            >
              <Plus size={18} color="#FFFFFF" />

              <Text style={styles.emptyCreateButtonText}>
                Planifier un voyage
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.listIntro}>
              <View>
                <Text style={styles.listTitle}>Mes voyages</Text>

                <Text style={styles.listSubtitle}>
                  Vos itinéraires enregistrés
                </Text>
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{trips.length}</Text>
              </View>
            </View>

            <View style={styles.tripList}>
              {trips.map((trip) => (
                <TripCard
                  key={trip._id}
                  trip={trip}
                  onPress={() => setSelectedTripId(trip._id)}
                />
              ))}
            </View>
          </>
        )}

        <View style={styles.globalCard}>
          <View style={styles.globalCardIcon}>
            <Navigation size={18} color="#60A5FA" />
          </View>

          <View style={styles.globalCardContent}>
            <Text style={styles.globalCardTitle}>
              Conçu pour voyager partout
            </Text>

            <Text style={styles.globalCardText}>
              Aucune destination n'est imposée. Organisez des voyages nationaux
              ou internationaux depuis le même espace.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* ====================================================================
       * CREATE MODAL
       * ================================================================== */}

      <NewTripModal
        visible={showNewTrip}
        onClose={() => setShowNewTrip(false)}
        onCreated={handleCreated}
      />

      {notice && (
        <View pointerEvents="none" style={styles.notice}>
          <Check size={16} color="#4ADE80" />

          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      )}
    </View>
  );
}

/* ============================================================================
 * PAGE
 * ========================================================================== */

export default function PlanificateurPage({ onBack }: Props) {
  return (
    <View style={styles.root}>
      <Unauthenticated>
        <PlannerUnauthenticated onBack={onBack} />
      </Unauthenticated>

      <AuthLoading>
        <PlannerLoading onBack={onBack} />
      </AuthLoading>

      <Authenticated>
        <PlanificateurInner onBack={onBack} />
      </Authenticated>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050812",
  },

  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingBottom: 32,
  },

  header: {
    minHeight: 72,
    paddingHorizontal: 15,
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

  headerIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  headerIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.14)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  headerSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
    fontWeight: "600",
  },

  newButton: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#4F46E5",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.25)",
  },

  newButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  listContent: {
    padding: 16,
    paddingBottom: 32,
  },

  listIntro: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  listTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },

  listSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.34)",
    fontSize: 10,
    fontWeight: "600",
  },

  countBadge: {
    minWidth: 34,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
  },

  countBadgeText: {
    color: "#C4B5FD",
    fontSize: 11,
    fontWeight: "900",
  },

  tripList: {
    gap: 12,
  },

  tripCard: {
    height: 210,
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: "#101323",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  tripCardPressed: {
    opacity: 0.86,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  tripImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  tripPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#11182C",
  },

  tripOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  tripTopBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    minHeight: 29,
    paddingHorizontal: 9,
    borderRadius: 99,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  tripTopBadgeText: {
    color: "#D1FAE5",
    fontSize: 9,
    fontWeight: "800",
  },

  tripBottom: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },

  tripBottomMain: {
    flex: 1,
  },

  tripDestination: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  tripDateRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  tripDate: {
    flex: 1,
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    fontWeight: "600",
  },

  travelersBadge: {
    minWidth: 70,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  travelersNumber: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  travelersLabel: {
    marginTop: 1,
    color: "rgba(255,255,255,0.6)",
    fontSize: 8,
    fontWeight: "700",
  },

  globalCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(96,165,250,0.055)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.12)",
  },

  globalCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(96,165,250,0.1)",
  },

  globalCardContent: {
    flex: 1,
  },

  globalCardTitle: {
    color: "#BFDBFE",
    fontSize: 11,
    fontWeight: "900",
  },

  globalCardText: {
    marginTop: 4,
    color: "rgba(255,255,255,0.34)",
    fontSize: 9,
    lineHeight: 15,
  },

  noTrips: {
    minHeight: 430,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  noTripsIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.1)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.18)",
  },

  noTripsTitle: {
    marginTop: 18,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  noTripsText: {
    maxWidth: 360,
    marginTop: 8,
    color: "rgba(255,255,255,0.38)",
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
  },

  emptyCreateButton: {
    marginTop: 20,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#4F46E5",
  },

  emptyCreateButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  /* ==========================================================================
   * DETAIL
   * ======================================================================== */

  detailHero: {
    height: 245,
    overflow: "hidden",
    backgroundColor: "#11182C",
  },

  detailHeroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  detailHeroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#11182C",
  },

  detailHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },

  heroButton: {
    position: "absolute",
    top: 16,
    left: 14,
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  heroShareButton: {
    left: undefined,
    right: 14,
  },

  detailHeroBottom: {
    position: "absolute",
    left: 15,
    right: 15,
    bottom: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },

  detailHeroIdentity: {
    flex: 1,
  },

  detailDestination: {
    color: "#FFFFFF",
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  detailDateRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
  },

  detailDate: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    fontWeight: "600",
  },

  heroSeparator: {
    width: 3,
    height: 3,
    marginHorizontal: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  entriesBadge: {
    minWidth: 64,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  entriesNumber: {
    color: "#4ADE80",
    fontSize: 15,
    fontWeight: "900",
  },

  entriesLabel: {
    marginTop: 1,
    color: "rgba(255,255,255,0.55)",
    fontSize: 8,
    fontWeight: "700",
  },

  tabs: {
    minHeight: 55,
    paddingHorizontal: 8,
    flexDirection: "row",
    backgroundColor: "rgba(10,12,25,0.98)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },

  tab: {
    flex: 1,
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },

  tabActive: {
    borderBottomColor: "#8B5CF6",
  },

  tabText: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 11,
    fontWeight: "800",
  },

  tabTextActive: {
    color: "#FFFFFF",
  },

  tabCounter: {
    minWidth: 21,
    height: 21,
    paddingHorizontal: 5,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  tabCounterText: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 8,
    fontWeight: "900",
  },

  detailContent: {
    padding: 15,
    paddingBottom: 35,
  },

  sectionCard: {
    padding: 15,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },

  sectionCardIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.11)",
  },

  sectionCardTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  sectionCardSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontWeight: "600",
  },

  infoGrid: {
    gap: 8,
  },

  infoTile: {
    minHeight: 58,
    padding: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  infoTileIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  infoTileContent: {
    flex: 1,
  },

  infoTileLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  infoTileValue: {
    marginTop: 3,
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },

  budgetCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(34,197,94,0.065)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.14)",
  },

  budgetIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.1)",
  },

  budgetContent: {
    flex: 1,
  },

  budgetLabel: {
    color: "#86EFAC",
    fontSize: 9,
    fontWeight: "800",
  },

  budgetTotal: {
    marginTop: 3,
    color: "#4ADE80",
    fontSize: 18,
    fontWeight: "900",
  },

  budgetSpent: {
    marginTop: 3,
    color: "rgba(255,255,255,0.34)",
    fontSize: 9,
  },

  infoNotice: {
    marginTop: 12,
    padding: 13,
    borderRadius: 16,
    flexDirection: "row",
    gap: 9,
    backgroundColor: "rgba(139,92,246,0.055)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.12)",
  },

  infoNoticeText: {
    flex: 1,
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
    lineHeight: 16,
  },

  checklistHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressPercentage: {
    color: "#A78BFA",
    fontSize: 18,
    fontWeight: "900",
  },

  progressTrack: {
    height: 7,
    marginTop: 13,
    overflow: "hidden",
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: "#8B5CF6",
  },

  checklistList: {
    marginTop: 12,
    gap: 8,
  },

  checklistItem: {
    minHeight: 62,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  checklistItemDone: {
    backgroundColor: "rgba(34,197,94,0.06)",
    borderColor: "rgba(34,197,94,0.15)",
  },

  checklistText: {
    flex: 1,
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "600",
  },

  checklistTextDone: {
    color: "rgba(255,255,255,0.4)",
    textDecorationLine: "line-through",
  },

  globalTravelNotice: {
    marginTop: 12,
    padding: 13,
    borderRadius: 16,
    flexDirection: "row",
    gap: 9,
    backgroundColor: "rgba(96,165,250,0.05)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.11)",
  },

  globalTravelNoticeText: {
    flex: 1,
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    lineHeight: 15,
  },

  bottomSpace: {
    height: 25,
  },

  /* ==========================================================================
   * MODAL
   * ======================================================================== */

  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  modalCard: {
    maxHeight: "90%",
    paddingTop: 10,
    paddingHorizontal: 17,
    paddingBottom: 24,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    backgroundColor: "#0E1020",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    marginBottom: 15,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  modalSubtitle: {
    marginTop: 4,
    color: "rgba(255,255,255,0.34)",
    fontSize: 10,
  },

  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  formContent: {
    paddingTop: 18,
    paddingBottom: 8,
    gap: 15,
  },

  inputGroup: {
    gap: 7,
  },

  inputLabel: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontWeight: "800",
  },

  input: {
    minHeight: 48,
    paddingHorizontal: 13,
    borderRadius: 14,
    color: "#FFFFFF",
    fontSize: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  dateRow: {
    flexDirection: "row",
    gap: 9,
  },

  dateField: {
    flex: 1,
    gap: 7,
  },

  transportGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  transportOption: {
    flex: 1,
    minWidth: "45%",
    minHeight: 62,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  transportOptionActive: {
    backgroundColor: "rgba(139,92,246,0.12)",
    borderColor: "rgba(139,92,246,0.3)",
  },

  transportText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "800",
  },

  transportTextActive: {
    color: "#C4B5FD",
  },

  contractNotice: {
    color: "rgba(255,255,255,0.26)",
    fontSize: 8,
    lineHeight: 13,
  },

  createButton: {
    minHeight: 50,
    marginTop: 3,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4F46E5",
  },

  createButtonDisabled: {
    opacity: 0.55,
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  /* ==========================================================================
   * EMPTY / AUTH
   * ======================================================================== */

  emptyCenter: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.1)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.18)",
  },

  emptyTitle: {
    marginTop: 18,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyText: {
    maxWidth: 360,
    marginTop: 8,
    color: "rgba(255,255,255,0.38)",
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
  },

  backButton: {
    marginTop: 20,
    minHeight: 44,
    paddingHorizontal: 17,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  /* ==========================================================================
   * LOADING
   * ======================================================================== */

  loadingContent: {
    padding: 16,
    gap: 12,
  },

  loadingIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  loadingTitle: {
    width: 130,
    height: 13,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  loadingSubtitle: {
    width: 90,
    height: 8,
    marginTop: 6,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  loadingTrip: {
    width: "100%",
    height: 210,
    borderRadius: 22,
  },

  loadingHero: {
    width: "100%",
    height: 210,
    borderRadius: 22,
  },

  loadingCard: {
    width: "100%",
    height: 100,
    borderRadius: 18,
  },

  /* ==========================================================================
   * NOTICE
   * ======================================================================== */

  notice: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 22,
    minHeight: 48,
    paddingHorizontal: 13,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#151827",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.2)",
  },

  noticeText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});

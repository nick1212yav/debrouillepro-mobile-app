import {
  Alert,
  Image,
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
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";

import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "@/lib/convex-auth-compat";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { SignInButton } from "@/components/ui/signin";

import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  Church,
  Clock3,
  Dumbbell,
  Eye,
  Filter,
  Globe2,
  MapPin,
  Music,
  PartyPopper,
  Plus,
  Star,
  Tag,
  Ticket,
  Trash2,
  Users,
  X,
} from "lucide-react-native";

// ============================================================================
// TYPES
// ============================================================================

type EventCategory =
  | "culturel"
  | "sportif"
  | "religieux"
  | "professionnel"
  | "communautaire"
  | "formation"
  | "festival"
  | "autre";

type EventStatus = "upcoming" | "ongoing" | "past" | "cancelled";

type MainTab = "upcoming" | "agenda" | "mine";

type EventItem = {
  _id: Id<"events">;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate?: string;
  location: string;
  address?: string;
  coverImage?: string;
  isFree: boolean;
  price?: string;
  tags: string[];
  status: string;
  authorName: string;
  authorAvatar?: string;
  attendingCount: number;
  interestedCount: number;
};

type CreateEventFormState = {
  title: string;
  description: string;
  category: EventCategory;
  startDate: string;
  endDate: string;
  location: string;
  address: string;
  isFree: boolean;
  price: string;
  tags: string;
};

interface EventsAgendaPageProps {
  onBack: () => void;
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const COLORS = {
  background: "#050812",
  surface: "rgba(255,255,255,0.055)",
  surfaceStrong: "rgba(255,255,255,0.075)",
  surfaceSoft: "rgba(255,255,255,0.035)",
  border: "rgba(255,255,255,0.09)",
  borderStrong: "rgba(255,255,255,0.14)",
  white: "#FFFFFF",
  text: "rgba(255,255,255,0.92)",
  textSecondary: "rgba(255,255,255,0.66)",
  textMuted: "rgba(255,255,255,0.43)",
  textFaint: "rgba(255,255,255,0.24)",
  primary: "#6366F1",
  primaryStrong: "#4F46E5",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
};

// ============================================================================
// CATEGORIES
// ============================================================================

const CATEGORIES: ReadonlyArray<{
  id: EventCategory;
  label: string;
  color: string;
  icon: typeof Music;
}> = [
  {
    id: "culturel",
    label: "Culturel",
    icon: Music,
    color: "#EC4899",
  },
  {
    id: "sportif",
    label: "Sportif",
    icon: Dumbbell,
    color: "#F97316",
  },
  {
    id: "religieux",
    label: "Religieux",
    icon: Church,
    color: "#8B5CF6",
  },
  {
    id: "professionnel",
    label: "Professionnel",
    icon: Briefcase,
    color: "#6366F1",
  },
  {
    id: "communautaire",
    label: "Communauté",
    icon: Users,
    color: "#22C55E",
  },
  {
    id: "formation",
    label: "Formation",
    icon: BookOpen,
    color: "#06B6D4",
  },
  {
    id: "festival",
    label: "Festival",
    icon: PartyPopper,
    color: "#F59E0B",
  },
  {
    id: "autre",
    label: "Autre",
    icon: Globe2,
    color: "#94A3B8",
  },
];

const STATUS_CONFIG: Record<
  EventStatus,
  {
    label: string;
    color: string;
    backgroundColor: string;
  }
> = {
  upcoming: {
    label: "À venir",
    color: "#60A5FA",
    backgroundColor: "rgba(59,130,246,0.14)",
  },
  ongoing: {
    label: "En cours",
    color: "#34D399",
    backgroundColor: "rgba(16,185,129,0.14)",
  },
  past: {
    label: "Terminé",
    color: "#9CA3AF",
    backgroundColor: "rgba(156,163,175,0.12)",
  },
  cancelled: {
    label: "Annulé",
    color: "#F87171",
    backgroundColor: "rgba(239,68,68,0.14)",
  },
};

function getCategoryConfig(category: string) {
  return (
    CATEGORIES.find((item) => item.id === category) ??
    CATEGORIES[CATEGORIES.length - 1]
  );
}

function getStatusConfig(status: string) {
  return (
    STATUS_CONFIG[status as EventStatus] ?? {
      label: "Statut indisponible",
      color: COLORS.textMuted,
      backgroundColor: "rgba(255,255,255,0.06)",
    }
  );
}

// ============================================================================
// DATE HELPERS
// ============================================================================

function parseDate(value: string): Date | null {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string, includeYear = true): string {
  const date = parseDate(value);

  if (!date) return "Date indisponible";

  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

function formatLongDate(value: string): string {
  const date = parseDate(value);

  if (!date) return "Date indisponible";

  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value: string): string {
  const date = parseDate(value);

  if (!date) return "—";

  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMinutesUntil(value: string): number | null {
  const date = parseDate(value);

  if (!date) return null;

  return Math.max(0, Math.floor((date.getTime() - Date.now()) / 60_000));
}

function Countdown({
  startDate,
  status,
}: {
  startDate: string;
  status?: string;
}) {
  if (status === "cancelled") {
    return (
      <Text style={[styles.countdownText, { color: COLORS.danger }]}>
        Annulé
      </Text>
    );
  }

  if (status === "ongoing") {
    return (
      <Text style={[styles.countdownText, { color: COLORS.success }]}>
        En cours
      </Text>
    );
  }

  const minutes = getMinutesUntil(startDate);

  if (minutes === null) {
    return <Text style={styles.countdownText}>Date indisponible</Text>;
  }

  if (minutes === 0) {
    return (
      <Text style={[styles.countdownText, { color: COLORS.warning }]}>
        Maintenant
      </Text>
    );
  }

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  if (days > 0) {
    return (
      <Text style={[styles.countdownText, { color: COLORS.warning }]}>
        Dans {days}j {hours}h
      </Text>
    );
  }

  if (hours > 0) {
    return (
      <Text style={[styles.countdownText, { color: "#FB923C" }]}>
        Dans {hours}h {mins}min
      </Text>
    );
  }

  return (
    <Text style={[styles.countdownText, { color: COLORS.danger }]}>
      Dans {mins}min
    </Text>
  );
}

// ============================================================================
// ERROR
// ============================================================================

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
}

// ============================================================================
// LOADING
// ============================================================================

function LoadingBlock({ height = 84 }: { height?: number }) {
  return <View style={[styles.loadingBlock, { height }]} />;
}

function PageLoading() {
  return (
    <View style={styles.loadingContainer}>
      <LoadingBlock height={190} />
      <LoadingBlock />
      <LoadingBlock />
      <LoadingBlock />
    </View>
  );
}

// ============================================================================
// EVENT CARD
// ============================================================================

function EventCard({
  event,
  onPress,
}: {
  event: EventItem;
  onPress: () => void;
}) {
  const category = getCategoryConfig(event.category);
  const CategoryIcon = category.icon;
  const status = getStatusConfig(event.status);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir l’événement ${event.title}`}
      onPress={onPress}
      style={({ pressed }) => [styles.eventCard, pressed && styles.pressed]}
    >
      {/* COVER */}
      <View style={styles.eventCover}>
        {event.coverImage ? (
          <Image
            source={{ uri: event.coverImage }}
            style={styles.eventCoverImage}
            resizeMode="cover"
            accessibilityLabel={event.title}
          />
        ) : (
          <View
            style={[
              styles.eventCoverPlaceholder,
              {
                backgroundColor: `${category.color}12`,
              },
            ]}
          >
            <CategoryIcon size={42} color={category.color} />
          </View>
        )}

        <View style={styles.eventCoverOverlay} />

        <View
          style={[
            styles.categoryBadge,
            {
              backgroundColor: category.color,
            },
          ]}
        >
          <CategoryIcon size={12} color="#FFFFFF" />

          <Text style={styles.categoryBadgeText}>{category.label}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: status.backgroundColor,
            },
          ]}
        >
          <Text style={[styles.statusBadgeText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>

      {/* BODY */}
      <View style={styles.eventBody}>
        <View style={styles.eventTitleRow}>
          <Text numberOfLines={2} style={styles.eventTitle}>
            {event.title}
          </Text>
        </View>

        <Text numberOfLines={3} style={styles.eventDescription}>
          {event.description}
        </Text>

        <View style={styles.eventDetails}>
          <DetailLine
            icon={Calendar}
            value={`${formatDate(event.startDate)} · ${formatTime(
              event.startDate,
            )}`}
            iconColor="#818CF8"
          />

          <DetailLine
            icon={MapPin}
            value={event.location}
            iconColor="#FB7185"
          />
        </View>

        <View style={styles.eventFooter}>
          <View style={styles.engagementGroup}>
            <View style={styles.engagementItem}>
              <CheckCircle2 size={14} color={COLORS.success} />

              <Text style={styles.engagementText}>{event.attendingCount}</Text>
            </View>

            <View style={styles.engagementItem}>
              <Star size={14} color={COLORS.warning} />

              <Text style={styles.engagementText}>{event.interestedCount}</Text>
            </View>
          </View>

          <View style={styles.eventFooterRight}>
            <Text
              style={[
                styles.priceText,
                event.isFree && {
                  color: COLORS.success,
                },
              ]}
            >
              {event.isFree ? "Gratuit" : (event.price ?? "Prix indisponible")}
            </Text>

            <Countdown startDate={event.startDate} status={event.status} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ============================================================================
// DETAIL LINE
// ============================================================================

function DetailLine({
  icon: Icon,
  value,
  iconColor,
}: {
  icon: typeof Calendar;
  value: string;
  iconColor: string;
}) {
  return (
    <View style={styles.detailLine}>
      <Icon size={14} color={iconColor} />

      <Text numberOfLines={2} style={styles.detailLineText}>
        {value}
      </Text>
    </View>
  );
}

// ============================================================================
// RSVP
// ============================================================================

function RsvpButtons({ eventId }: { eventId: Id<"events"> }) {
  const rsvp = useMutation(api.events.rsvp);
  const myRsvp = useQuery(api.events.getMyRsvp, {
    eventId,
  });

  const [loading, setLoading] = useState(false);

  const handleRsvp = async (
    status: "attending" | "interested" | "not_going",
  ) => {
    if (loading) return;

    setLoading(true);

    try {
      const result = await rsvp({
        eventId,
        status,
      });

      if (result.status === null) {
        Alert.alert("Participation annulée", "Votre RSVP a été retiré.");
      } else if (result.status === "attending") {
        Alert.alert(
          "Participation confirmée",
          "Vous participez à cet événement.",
        );
      } else if (result.status === "interested") {
        Alert.alert("Événement enregistré", "Vous avez indiqué votre intérêt.");
      } else {
        Alert.alert("Réponse enregistrée", "Votre réponse a été enregistrée.");
      }
    } catch (error) {
      Alert.alert("Impossible de modifier le RSVP", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (myRsvp === undefined) {
    return (
      <View style={styles.rsvpLoading}>
        <LoadingBlock height={52} />
        <LoadingBlock height={52} />
      </View>
    );
  }

  return (
    <View style={styles.rsvpContainer}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          selected: myRsvp === "attending",
          disabled: loading,
        }}
        disabled={loading}
        onPress={() => void handleRsvp("attending")}
        style={({ pressed }) => [
          styles.rsvpPrimary,
          myRsvp === "attending" && styles.rsvpPrimaryActive,
          pressed && styles.pressed,
          loading && styles.disabled,
        ]}
      >
        <Check size={17} color="#FFFFFF" />

        <Text style={styles.rsvpPrimaryText}>
          {myRsvp === "attending" ? "Je participe ✓" : "Je participe"}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          selected: myRsvp === "interested",
          disabled: loading,
        }}
        disabled={loading}
        onPress={() => void handleRsvp("interested")}
        style={({ pressed }) => [
          styles.rsvpSecondary,
          myRsvp === "interested" && styles.rsvpSecondaryActive,
          pressed && styles.pressed,
          loading && styles.disabled,
        ]}
      >
        <Star
          size={17}
          color={myRsvp === "interested" ? COLORS.warning : COLORS.textMuted}
        />

        <Text
          style={[
            styles.rsvpSecondaryText,
            myRsvp === "interested" && styles.rsvpSecondaryTextActive,
          ]}
        >
          {myRsvp === "interested" ? "Intéressé ✓" : "Intéressé"}
        </Text>
      </Pressable>
    </View>
  );
}

// ============================================================================
// EVENT DETAIL
// ============================================================================

function EventDetail({
  eventId,
  onClose,
}: {
  eventId: Id<"events">;
  onClose: () => void;
}) {
  const event = useQuery(api.events.get, {
    eventId,
  });

  const { isAuthenticated } = useConvexAuth();

  const [showAllAttendees, setShowAllAttendees] = useState(false);

  if (event === undefined) {
    return (
      <Modal
        visible
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              onPress={onClose}
              style={styles.modalClose}
            >
              <ArrowLeft size={19} color="#FFFFFF" />
            </Pressable>

            <Text style={styles.modalHeaderTitle}>Événement</Text>
          </View>

          <PageLoading />
        </View>
      </Modal>
    );
  }

  if (event === null) {
    return (
      <Modal
        visible
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.modalClose}
            >
              <ArrowLeft size={19} color="#FFFFFF" />
            </Pressable>

            <Text style={styles.modalHeaderTitle}>Événement</Text>
          </View>

          <EmptyState
            icon={Calendar}
            title="Événement introuvable"
            description="Cet événement n'est plus disponible ou n'a pas pu être chargé."
          />
        </View>
      </Modal>
    );
  }

  const category = getCategoryConfig(event.category);
  const CategoryIcon = category.icon;
  const status = getStatusConfig(event.status);

  const attendees = showAllAttendees
    ? event.attendees
    : event.attendees.slice(0, 8);

  const eventHasEnded = event.endDate
    ? new Date(event.endDate).getTime() < Date.now()
    : new Date(event.startDate).getTime() < Date.now();

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailScroll}
        >
          {/* HERO */}
          <View style={styles.detailHero}>
            {event.coverImage ? (
              <Image
                source={{
                  uri: event.coverImage,
                }}
                style={styles.detailHeroImage}
                resizeMode="cover"
                accessibilityLabel={event.title}
              />
            ) : (
              <View
                style={[
                  styles.detailHeroEmpty,
                  {
                    backgroundColor: `${category.color}12`,
                  },
                ]}
              >
                <CategoryIcon size={72} color={category.color} />
              </View>
            )}

            <View style={styles.detailHeroOverlay} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              onPress={onClose}
              style={styles.detailBackButton}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </Pressable>

            <View style={styles.detailHeroContent}>
              <View style={styles.detailBadgeRow}>
                <View
                  style={[
                    styles.categoryBadge,
                    {
                      backgroundColor: category.color,
                    },
                  ]}
                >
                  <CategoryIcon size={12} color="#FFFFFF" />

                  <Text style={styles.categoryBadgeText}>{category.label}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: status.backgroundColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color: status.color,
                      },
                    ]}
                  >
                    {status.label}
                  </Text>
                </View>
              </View>

              <Text style={styles.detailHeroTitle}>{event.title}</Text>
            </View>
          </View>

          {/* BODY */}
          <View style={styles.detailBody}>
            <Text style={styles.detailDescription}>{event.description}</Text>

            {/* INFORMATION */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Informations</Text>

              <View style={styles.infoCard}>
                <InfoRow
                  icon={Calendar}
                  label="Date"
                  value={formatLongDate(event.startDate)}
                />

                <InfoRow
                  icon={Clock3}
                  label="Horaire"
                  value={`${formatTime(event.startDate)}${
                    event.endDate ? ` → ${formatTime(event.endDate)}` : ""
                  }`}
                />

                <InfoRow icon={MapPin} label="Lieu" value={event.location} />

                {event.address ? (
                  <InfoRow
                    icon={MapPin}
                    label="Adresse"
                    value={event.address}
                  />
                ) : null}

                <InfoRow
                  icon={Users}
                  label="Participants"
                  value={`${event.attendingCount}`}
                />

                <InfoRow
                  icon={Star}
                  label="Intéressés"
                  value={`${event.interestedCount}`}
                />
              </View>
            </View>

            {/* PRICE */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Conditions</Text>

              <View style={styles.conditionCard}>
                <Tag
                  size={18}
                  color={event.isFree ? COLORS.success : COLORS.warning}
                />

                <View style={styles.conditionContent}>
                  <Text style={styles.conditionLabel}>Tarification</Text>

                  <Text
                    style={[
                      styles.conditionValue,
                      event.isFree && {
                        color: COLORS.success,
                      },
                    ]}
                  >
                    {event.isFree
                      ? "Gratuit"
                      : (event.price ?? "Prix indisponible")}
                  </Text>
                </View>

                {event.maxAttendees ? (
                  <View style={styles.capacityContainer}>
                    <Users size={15} color={COLORS.textMuted} />

                    <Text style={styles.capacityText}>
                      {event.maxAttendees}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* TAGS */}
            {event.tags.length > 0 ? (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Tags</Text>

                <View style={styles.tagsContainer}>
                  {event.tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* ORGANIZER */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Organisateur</Text>

              <View style={styles.organizerCard}>
                {event.authorAvatar ? (
                  <Image
                    source={{
                      uri: event.authorAvatar,
                    }}
                    style={styles.organizerAvatar}
                    resizeMode="cover"
                    accessibilityLabel={event.authorName}
                  />
                ) : (
                  <View style={styles.organizerAvatarFallback}>
                    <Text style={styles.organizerInitial}>
                      {event.authorName.trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.organizerText}>
                  <Text style={styles.organizerLabel}>Organisé par</Text>

                  <Text numberOfLines={1} style={styles.organizerName}>
                    {event.authorName}
                  </Text>
                </View>
              </View>
            </View>

            {/* ATTENDEES */}
            {event.attendees.length > 0 ? (
              <View style={styles.detailSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Participants</Text>

                  <Text style={styles.sectionCount}>
                    {event.attendingCount}
                  </Text>
                </View>

                <View style={styles.attendeesGrid}>
                  {attendees.map((attendee) => (
                    <View key={attendee.userId} style={styles.attendeeChip}>
                      {attendee.avatar ? (
                        <Image
                          source={{
                            uri: attendee.avatar,
                          }}
                          style={styles.attendeeAvatar}
                          resizeMode="cover"
                          accessibilityLabel={attendee.name}
                        />
                      ) : (
                        <View style={styles.attendeeFallback}>
                          <Text style={styles.attendeeInitial}>
                            {attendee.name.trim().charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}

                      <Text numberOfLines={1} style={styles.attendeeName}>
                        {attendee.name}
                      </Text>
                    </View>
                  ))}
                </View>

                {event.attendees.length > 8 ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setShowAllAttendees((current) => !current)}
                    style={styles.showMoreButton}
                  >
                    <Text style={styles.showMoreText}>
                      {showAllAttendees
                        ? "Réduire"
                        : `Voir les ${event.attendees.length} participants`}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <View style={styles.detailSection}>
                <View style={styles.emptyInline}>
                  <Users size={18} color={COLORS.textFaint} />

                  <Text style={styles.emptyInlineText}>
                    Aucun participant affichable pour le moment.
                  </Text>
                </View>
              </View>
            )}

            {/* RSVP */}
            {!eventHasEnded && event.status !== "cancelled" ? (
              <View style={styles.detailSection}>
                {isAuthenticated ? (
                  <RsvpButtons eventId={eventId} />
                ) : (
                  <View style={styles.signInCard}>
                    <Text style={styles.signInTitle}>
                      Vous souhaitez participer ?
                    </Text>

                    <Text style={styles.signInText}>
                      Connectez-vous pour enregistrer votre participation.
                    </Text>

                    <SignInButton />
                  </View>
                )}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ============================================================================
// INFO ROW
// ============================================================================

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Icon size={16} color={COLORS.textMuted} />
      </View>

      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>

        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ============================================================================
// CREATE EVENT
// ============================================================================

function CreateEventForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const createEvent = useMutation(api.events.create);

  const [form, setForm] = useState<CreateEventFormState>({
    title: "",
    description: "",
    category: "communautaire",
    startDate: "",
    endDate: "",
    location: "",
    address: "",
    isFree: true,
    price: "",
    tags: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof CreateEventFormState>(
    key: K,
    value: CreateEventFormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const validate = (): string | null => {
    if (form.title.trim().length < 3) {
      return "Le titre doit contenir au moins 3 caractères.";
    }

    if (form.description.trim().length === 0) {
      return "Veuillez renseigner une description.";
    }

    if (form.location.trim().length < 2) {
      return "Veuillez renseigner le lieu.";
    }

    const start = new Date(form.startDate.trim());

    if (!form.startDate.trim() || Number.isNaN(start.getTime())) {
      return "La date de début est invalide.";
    }

    if (start.getTime() <= Date.now()) {
      return "La date de début doit être dans le futur.";
    }

    if (form.endDate.trim()) {
      const end = new Date(form.endDate.trim());

      if (Number.isNaN(end.getTime())) {
        return "La date de fin est invalide.";
      }

      if (end.getTime() < start.getTime()) {
        return "La date de fin doit être postérieure au début.";
      }
    }

    if (!form.isFree && form.price.trim().length === 0) {
      return "Veuillez renseigner le prix.";
    }

    return null;
  };

  const submit = async () => {
    if (submitting) return;

    const validationError = validate();

    if (validationError) {
      Alert.alert("Vérification", validationError);
      return;
    }

    setSubmitting(true);

    try {
      const startDate = new Date(form.startDate.trim());

      const endDate = form.endDate.trim()
        ? new Date(form.endDate.trim())
        : undefined;

      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .filter(
          (tag, index, array) =>
            array.findIndex(
              (candidate) => candidate.toLowerCase() === tag.toLowerCase(),
            ) === index,
        )
        .slice(0, 20);

      await createEvent({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        startDate: startDate.toISOString(),
        endDate: endDate?.toISOString(),
        location: form.location.trim(),
        address: form.address.trim() || undefined,
        isFree: form.isFree,
        price:
          !form.isFree && form.price.trim() ? form.price.trim() : undefined,
        tags,
      });

      Alert.alert(
        "Événement créé",
        "L’événement a été enregistré avec succès.",
        [
          {
            text: "Voir mes événements",
            onPress: onCreated,
          },
        ],
      );
    } catch (error) {
      Alert.alert("Création impossible", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (!submitting) {
          onClose();
        }
      }}
    >
      <View style={styles.modalRoot}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* HEADER */}
          <View style={styles.createHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              disabled={submitting}
              onPress={onClose}
              style={[styles.modalClose, submitting && styles.disabled]}
            >
              <X size={19} color="#FFFFFF" />
            </Pressable>

            <View style={styles.createHeaderText}>
              <Text style={styles.createHeaderTitle}>Créer un événement</Text>

              <Text style={styles.createHeaderSubtitle}>
                Publication dans la source réelle des événements
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Publier"
              disabled={submitting}
              onPress={() => {
                void submit();
              }}
              style={[styles.publishButton, submitting && styles.disabled]}
            >
              <Text style={styles.publishButtonText}>
                {submitting ? "..." : "Publier"}
              </Text>
            </Pressable>
          </View>

          {/* FORM */}
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.createContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <FormField
              label="Titre"
              required
              value={form.title}
              onChangeText={(value) => update("title", value)}
              placeholder="Nom de l’événement"
            />

            <FormField
              label="Description"
              required
              value={form.description}
              onChangeText={(value) => update("description", value)}
              placeholder="Décrivez précisément l’événement..."
              multiline
            />

            {/* CATEGORY */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Catégorie</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {CATEGORIES.map((category) => {
                  const selected = form.category === category.id;
                  const Icon = category.icon;

                  return (
                    <Pressable
                      key={category.id}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected,
                      }}
                      onPress={() => update("category", category.id)}
                      style={[
                        styles.categoryChoice,
                        selected && {
                          backgroundColor: `${category.color}18`,
                          borderColor: `${category.color}70`,
                        },
                      ]}
                    >
                      <Icon
                        size={15}
                        color={selected ? category.color : COLORS.textMuted}
                      />

                      <Text
                        style={[
                          styles.categoryChoiceText,
                          selected && {
                            color: category.color,
                          },
                        ]}
                      >
                        {category.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <FormField
              label="Début"
              required
              value={form.startDate}
              onChangeText={(value) => update("startDate", value)}
              placeholder="2026-10-01T18:00"
              autoCapitalize="none"
            />

            <FormField
              label="Fin"
              value={form.endDate}
              onChangeText={(value) => update("endDate", value)}
              placeholder="Optionnel"
              autoCapitalize="none"
            />

            <FormField
              label="Lieu"
              required
              value={form.location}
              onChangeText={(value) => update("location", value)}
              placeholder="Ville, quartier, salle..."
            />

            <FormField
              label="Adresse"
              value={form.address}
              onChangeText={(value) => update("address", value)}
              placeholder="Adresse précise, si disponible"
            />

            {/* PRICE */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Tarification</Text>

              <View style={styles.priceSwitch}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: form.isFree,
                  }}
                  onPress={() => update("isFree", true)}
                  style={[
                    styles.priceOption,
                    form.isFree && styles.priceOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.priceOptionText,
                      form.isFree && styles.priceOptionTextActive,
                    ]}
                  >
                    Gratuit
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: !form.isFree,
                  }}
                  onPress={() => update("isFree", false)}
                  style={[
                    styles.priceOption,
                    !form.isFree && styles.priceOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.priceOptionText,
                      !form.isFree && styles.priceOptionTextActive,
                    ]}
                  >
                    Payant
                  </Text>
                </Pressable>
              </View>
            </View>

            {!form.isFree ? (
              <FormField
                label="Prix"
                required
                value={form.price}
                onChangeText={(value) => update("price", value)}
                placeholder="Ex. 2000 FC"
              />
            ) : null}

            <FormField
              label="Tags"
              value={form.tags}
              onChangeText={(value) => update("tags", value)}
              placeholder="culture, musique, formation"
            />

            <View style={styles.integrityCard}>
              <CheckCircle2 size={18} color={COLORS.success} />

              <Text style={styles.integrityText}>
                Les informations saisies sont envoyées directement à la source
                de données des événements. Aucun contenu fictif n’est ajouté.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={() => {
                void submit();
              }}
              style={[styles.primaryButton, submitting && styles.disabled]}
            >
              <Plus size={18} color="#FFFFFF" />

              <Text style={styles.primaryButtonText}>
                {submitting ? "Publication..." : "Publier l’événement"}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ============================================================================
// FORM FIELD
// ============================================================================

function FormField({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  autoCapitalize = "sentences",
}: {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? " *" : ""}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textFaint}
        autoCapitalize={autoCapitalize}
        autoCorrect
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

// ============================================================================
// AGENDA
// ============================================================================

function AgendaView({
  events,
  onSelect,
}: {
  events: EventItem[];
  onSelect: (eventId: Id<"events">) => void;
}) {
  const grouped = useMemo(() => {
    const groups = new Map<string, EventItem[]>();

    for (const event of events) {
      const date = parseDate(event.startDate);

      if (!date) continue;

      const key = date.toISOString().slice(0, 10);

      const existing = groups.get(key) ?? [];

      existing.push(event);
      groups.set(key, existing);
    }

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  if (grouped.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Aucun événement à venir"
        description="Aucune donnée réelle ne correspond actuellement à votre agenda."
      />
    );
  }

  return (
    <View style={styles.agendaList}>
      {grouped.map(([dateKey, dayEvents]) => {
        const date = parseDate(`${dateKey}T00:00:00`);

        return (
          <View key={dateKey} style={styles.agendaDay}>
            <View style={styles.agendaDayHeader}>
              <View style={styles.agendaDateBox}>
                <Text style={styles.agendaMonth}>
                  {date
                    ? date
                        .toLocaleDateString("fr-FR", {
                          month: "short",
                        })
                        .toUpperCase()
                    : "—"}
                </Text>

                <Text style={styles.agendaDayNumber}>
                  {date ? date.getDate() : "—"}
                </Text>
              </View>

              <View style={styles.agendaLine} />

              <Text style={styles.agendaWeekday}>
                {date
                  ? date.toLocaleDateString("fr-FR", {
                      weekday: "long",
                    })
                  : "Date indisponible"}
              </Text>
            </View>

            <View style={styles.agendaEvents}>
              {dayEvents.map((event) => {
                const category = getCategoryConfig(event.category);
                const Icon = category.icon;

                return (
                  <Pressable
                    key={event._id}
                    accessibilityRole="button"
                    onPress={() => onSelect(event._id)}
                    style={({ pressed }) => [
                      styles.agendaEvent,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.agendaEventIcon,
                        {
                          backgroundColor: `${category.color}18`,
                        },
                      ]}
                    >
                      <Icon size={18} color={category.color} />
                    </View>

                    <View style={styles.agendaEventContent}>
                      <Text numberOfLines={1} style={styles.agendaEventTitle}>
                        {event.title}
                      </Text>

                      <Text numberOfLines={1} style={styles.agendaEventMeta}>
                        {formatTime(event.startDate)}
                        {" · "}
                        {event.location}
                      </Text>
                    </View>

                    <View style={styles.agendaEventRight}>
                      <Countdown
                        startDate={event.startDate}
                        status={event.status}
                      />

                      <Text style={styles.agendaParticipants}>
                        {event.attendingCount} participant
                        {event.attendingCount !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ============================================================================
// MY AGENDA
// ============================================================================

function MyAgenda({ onSelect }: { onSelect: (eventId: Id<"events">) => void }) {
  const events = useQuery(api.events.listAttending, {});

  if (events === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingBlock />
        <LoadingBlock />
        <LoadingBlock />
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Ticket}
        title="Votre agenda est vide"
        description="Les événements auxquels vous participez apparaîtront ici."
      />
    );
  }

  return (
    <View style={styles.myAgendaList}>
      <View style={styles.sourceNotice}>
        <CheckCircle2 size={16} color={COLORS.success} />

        <Text style={styles.sourceNoticeText}>
          Cet agenda est alimenté par vos participations enregistrées.
        </Text>
      </View>

      {events.map((event) => {
        const category = getCategoryConfig(event.category);
        const Icon = category.icon;

        return (
          <Pressable
            key={event._id}
            accessibilityRole="button"
            onPress={() => onSelect(event._id)}
            style={({ pressed }) => [
              styles.myAgendaCard,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.myAgendaIcon,
                {
                  backgroundColor: `${category.color}18`,
                },
              ]}
            >
              <Icon size={18} color={category.color} />
            </View>

            <View style={styles.myAgendaContent}>
              <Text numberOfLines={1} style={styles.myAgendaTitle}>
                {event.title}
              </Text>

              <View style={styles.myAgendaMeta}>
                <Calendar size={12} color={COLORS.textMuted} />

                <Text style={styles.myAgendaMetaText}>
                  {formatDate(event.startDate, false)}
                  {" · "}
                  {formatTime(event.startDate)}
                </Text>
              </View>

              <View style={styles.myAgendaMeta}>
                <MapPin size={12} color={COLORS.textMuted} />

                <Text numberOfLines={1} style={styles.myAgendaMetaText}>
                  {event.location}
                </Text>
              </View>
            </View>

            <Countdown startDate={event.startDate} status={event.status} />
          </Pressable>
        );
      })}
    </View>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Calendar;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon size={30} color={COLORS.textFaint} />
      </View>

      <Text style={styles.emptyTitle}>{title}</Text>

      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function EventsAgendaPage({ onBack }: EventsAgendaPageProps) {
  const [tab, setTab] = useState<MainTab>("upcoming");

  const [filterCategory, setFilterCategory] = useState<EventCategory | null>(
    null,
  );

  const [showFilters, setShowFilters] = useState(false);

  const [showCreate, setShowCreate] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<Id<"events"> | null>(null);

  const { isAuthenticated } = useConvexAuth();

  const eventsResult = useQuery(api.events.list, {
    status: tab === "upcoming" || tab === "agenda" ? "upcoming" : undefined,
    category: filterCategory ?? undefined,
    limit: 50,
  });

  const events = useMemo<EventItem[] | undefined>(() => {
    if (eventsResult === undefined) {
      return undefined;
    }

    return eventsResult.map((event) => ({
      _id: event._id,
      title: event.title,
      description: event.description,
      category: event.category,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      coverImage: event.coverImage,
      isFree: event.isFree,
      price: event.price,
      tags: event.tags,
      status: event.status,
      authorName: event.authorName,
      authorAvatar: event.authorAvatar,
      attendingCount: event.attendingCount,
      interestedCount: event.interestedCount,
    }));
  }, [eventsResult]);

  const tabs: ReadonlyArray<{
    id: MainTab;
    label: string;
  }> = [
    {
      id: "upcoming",
      label: "À venir",
    },
    {
      id: "agenda",
      label: "Agenda",
    },
    {
      id: "mine",
      label: "Mes événements",
    },
  ];

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={onBack}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft size={19} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerIdentity}>
            <Text style={styles.headerTitle}>Événements</Text>

            <Text style={styles.headerSubtitle}>Agenda communautaire</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              showFilters ? "Masquer les filtres" : "Afficher les filtres"
            }
            accessibilityState={{
              expanded: showFilters,
            }}
            onPress={() => setShowFilters((current) => !current)}
            style={[
              styles.headerButton,
              showFilters && styles.headerButtonActive,
            ]}
          >
            <Filter size={18} color={showFilters ? "#A5B4FC" : "#FFFFFF"} />
          </Pressable>

          {isAuthenticated ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Créer un événement"
              onPress={() => setShowCreate(true)}
              style={({ pressed }) => [
                styles.createHeaderButton,
                pressed && styles.pressed,
              ]}
            >
              <Plus size={20} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>

        {/* FILTERS */}
        {showFilters ? (
          <View style={styles.filtersContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  selected: filterCategory === null,
                }}
                onPress={() => setFilterCategory(null)}
                style={[
                  styles.filterChip,
                  filterCategory === null && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterCategory === null && styles.filterChipTextActive,
                  ]}
                >
                  Tous
                </Text>
              </Pressable>

              {CATEGORIES.map((category) => {
                const active = filterCategory === category.id;

                const Icon = category.icon;

                return (
                  <Pressable
                    key={category.id}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: active,
                    }}
                    onPress={() =>
                      setFilterCategory(active ? null : category.id)
                    }
                    style={[
                      styles.filterChip,
                      active && {
                        backgroundColor: `${category.color}20`,
                        borderColor: `${category.color}60`,
                      },
                    ]}
                  >
                    <Icon
                      size={13}
                      color={active ? category.color : COLORS.textMuted}
                    />

                    <Text
                      style={[
                        styles.filterChipText,
                        active && {
                          color: category.color,
                        },
                      ]}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* TABS */}
        <View style={styles.tabs}>
          {tabs.map((item) => {
            const active = tab === item.id;

            return (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{
                  selected: active,
                }}
                onPress={() => setTab(item.id)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {tab === "upcoming" ? (
          events === undefined ? (
            <PageLoading />
          ) : events.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Aucun événement à venir"
              description={
                filterCategory
                  ? "Aucun événement réel ne correspond au filtre sélectionné."
                  : "Aucun événement à venir n'est actuellement disponible."
              }
            />
          ) : (
            <View style={styles.eventsList}>
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                  {events.length} événement
                  {events.length !== 1 ? "s" : ""}
                </Text>

                {filterCategory ? (
                  <Text style={styles.activeFilterText}>
                    {getCategoryConfig(filterCategory).label}
                  </Text>
                ) : null}
              </View>

              {events.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  onPress={() => setSelectedEvent(event._id)}
                />
              ))}

              {events.length >= 50 ? (
                <View style={styles.limitNotice}>
                  <Eye size={15} color={COLORS.textMuted} />

                  <Text style={styles.limitNoticeText}>
                    La source actuelle retourne jusqu’à 50 événements pour cette
                    vue.
                  </Text>
                </View>
              ) : null}
            </View>
          )
        ) : null}

        {tab === "agenda" ? (
          events === undefined ? (
            <PageLoading />
          ) : (
            <AgendaView events={events} onSelect={setSelectedEvent} />
          )
        ) : null}

        {tab === "mine" ? (
          <Authenticated>
            <MyAgenda onSelect={setSelectedEvent} />
          </Authenticated>
        ) : null}

        {tab === "mine" ? (
          <Unauthenticated>
            <View style={styles.authenticationState}>
              <View style={styles.authenticationIcon}>
                <Ticket size={32} color={COLORS.textFaint} />
              </View>

              <Text style={styles.authenticationTitle}>
                Votre agenda personnel
              </Text>

              <Text style={styles.authenticationText}>
                Connectez-vous pour retrouver les événements auxquels vous
                participez.
              </Text>

              <SignInButton />

              <Pressable
                accessibilityRole="button"
                onPress={onBack}
                style={styles.secondaryButton}
              >
                <ArrowLeft size={16} color={COLORS.textMuted} />

                <Text style={styles.secondaryButtonText}>Retour</Text>
              </Pressable>
            </View>
          </Unauthenticated>
        ) : null}
      </ScrollView>

      {/* DETAIL */}
      {selectedEvent ? (
        <EventDetail
          eventId={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      ) : null}

      {/* CREATE */}
      {showCreate ? (
        <CreateEventForm
          onClose={() => setShowCreate(false)}
          onCreated={() => setShowCreate(false)}
        />
      ) : null}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  flex: {
    flex: 1,
  },

  header: {
    paddingTop: Platform.OS === "ios" ? 54 : 28,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 13,
  },

  headerIdentity: {
    flex: 1,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontSize: 11,
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerButtonActive: {
    backgroundColor: "rgba(99,102,241,0.16)",
    borderColor: "rgba(99,102,241,0.38)",
  },

  createHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryStrong,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.4)",
  },

  filtersContainer: {
    marginBottom: 11,
  },

  filterScroll: {
    gap: 7,
    paddingVertical: 2,
  },

  filterChip: {
    minHeight: 34,
    paddingHorizontal: 11,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterChipActive: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: COLORS.borderStrong,
  },

  filterChipText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },

  filterChipTextActive: {
    color: COLORS.white,
  },

  tabs: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },

  tab: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },

  tabActive: {
    backgroundColor: COLORS.primaryStrong,
  },

  tabText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },

  tabTextActive: {
    color: COLORS.white,
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },

  eventsList: {
    gap: 12,
  },

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },

  listHeaderText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },

  activeFilterText: {
    color: "#A5B4FC",
    fontSize: 10,
    fontWeight: "700",
  },

  eventCard: {
    overflow: "hidden",
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  eventCover: {
    height: 165,
    position: "relative",
    overflow: "hidden",
  },

  eventCoverImage: {
    width: "100%",
    height: "100%",
  },

  eventCoverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  eventCoverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },

  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },

  categoryBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  statusBadgeText: {
    fontSize: 9,
    fontWeight: "900",
  },

  eventBody: {
    padding: 15,
  },

  eventTitleRow: {
    marginBottom: 6,
  },

  eventTitle: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },

  eventDescription: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 13,
  },

  eventDetails: {
    gap: 7,
    marginBottom: 14,
  },

  detailLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  detailLineText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 15,
  },

  eventFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  engagementGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  engagementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  engagementText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },

  eventFooterRight: {
    alignItems: "flex-end",
    gap: 3,
  },

  priceText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },

  countdownText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.72,
  },

  disabled: {
    opacity: 0.48,
  },

  loadingContainer: {
    gap: 12,
    padding: 2,
  },

  loadingBlock: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  emptyState: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 15,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyDescription: {
    marginTop: 7,
    maxWidth: 320,
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  limitNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  limitNoticeText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },

  agendaList: {
    gap: 22,
  },

  agendaDay: {
    gap: 11,
  },

  agendaDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  agendaDateBox: {
    width: 46,
    alignItems: "center",
  },

  agendaMonth: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "800",
  },

  agendaDayNumber: {
    marginTop: 1,
    color: COLORS.white,
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "900",
  },

  agendaLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  agendaWeekday: {
    maxWidth: 90,
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  agendaEvents: {
    gap: 8,
    paddingLeft: 57,
  },

  agendaEvent: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  agendaEventIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  agendaEventContent: {
    flex: 1,
  },

  agendaEventTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  agendaEventMeta: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 9,
  },

  agendaEventRight: {
    alignItems: "flex-end",
    gap: 3,
  },

  agendaParticipants: {
    color: COLORS.textFaint,
    fontSize: 8,
  },

  myAgendaList: {
    gap: 10,
  },

  sourceNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 13,
    marginBottom: 3,
    borderRadius: 16,
    backgroundColor: "rgba(16,185,129,0.06)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.14)",
  },

  sourceNoticeText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },

  myAgendaCard: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  myAgendaIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  myAgendaContent: {
    flex: 1,
    gap: 5,
  },

  myAgendaTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  myAgendaMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  myAgendaMetaText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 9,
  },

  authenticationState: {
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  authenticationIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },

  authenticationTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
  },

  authenticationText: {
    maxWidth: 310,
    marginTop: 7,
    marginBottom: 18,
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  secondaryButton: {
    marginTop: 12,
    minHeight: 45,
    paddingHorizontal: 16,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  secondaryButtonText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },

  modalRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  modalHeader: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  modalHeaderTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },

  detailScroll: {
    paddingBottom: 40,
  },

  detailHero: {
    height: 285,
    position: "relative",
    overflow: "hidden",
  },

  detailHeroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  detailHeroEmpty: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  detailHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },

  detailBackButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 18 : 14,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.52)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  detailHeroContent: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 19,
  },

  detailBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 9,
  },

  detailHeroTitle: {
    color: COLORS.white,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
  },

  detailBody: {
    paddingTop: 17,
  },

  detailDescription: {
    paddingHorizontal: 16,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },

  detailSection: {
    paddingHorizontal: 16,
    marginTop: 19,
  },

  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 9,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionCount: {
    color: COLORS.textFaint,
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 9,
  },

  infoCard: {
    padding: 14,
    gap: 14,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  infoIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  infoTextContainer: {
    flex: 1,
  },

  infoLabel: {
    color: COLORS.textFaint,
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 2,
  },

  infoValue: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  conditionCard: {
    minHeight: 62,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  conditionContent: {
    flex: 1,
  },

  conditionLabel: {
    color: COLORS.textFaint,
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  conditionValue: {
    marginTop: 3,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  capacityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  capacityText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  tag: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  tagText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  organizerCard: {
    minHeight: 68,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  organizerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 15,
  },

  organizerAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryStrong,
  },

  organizerInitial: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },

  organizerText: {
    flex: 1,
  },

  organizerLabel: {
    color: COLORS.textFaint,
    fontSize: 8,
    fontWeight: "700",
  },

  organizerName: {
    marginTop: 3,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  attendeesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  attendeeChip: {
    maxWidth: "100%",
    minHeight: 39,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  attendeeAvatar: {
    width: 25,
    height: 25,
    borderRadius: 13,
  },

  attendeeFallback: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryStrong,
  },

  attendeeInitial: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "900",
  },

  attendeeName: {
    maxWidth: 115,
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: "700",
  },

  showMoreButton: {
    marginTop: 9,
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.1)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.2)",
  },

  showMoreText: {
    color: "#A5B4FC",
    fontSize: 9,
    fontWeight: "800",
  },

  emptyInline: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyInlineText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },

  rsvpContainer: {
    gap: 9,
  },

  rsvpPrimary: {
    minHeight: 52,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primaryStrong,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.35)",
  },

  rsvpPrimaryActive: {
    backgroundColor: COLORS.success,
    borderColor: "rgba(52,211,153,0.35)",
  },

  rsvpPrimaryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  rsvpSecondary: {
    minHeight: 50,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  rsvpSecondaryActive: {
    backgroundColor: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.35)",
  },

  rsvpSecondaryText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },

  rsvpSecondaryTextActive: {
    color: COLORS.warning,
  },

  rsvpLoading: {
    gap: 9,
  },

  signInCard: {
    padding: 16,
    alignItems: "center",
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  signInTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },

  signInText: {
    marginTop: 5,
    marginBottom: 13,
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },

  createHeader: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  createHeaderText: {
    flex: 1,
  },

  createHeaderTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },

  createHeaderSubtitle: {
    marginTop: 2,
    color: COLORS.textFaint,
    fontSize: 8,
  },

  publishButton: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryStrong,
  },

  publishButtonText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
  },

  createContent: {
    padding: 16,
    gap: 17,
    paddingBottom: 45,
  },

  field: {
    gap: 8,
  },

  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },

  input: {
    minHeight: 51,
    paddingHorizontal: 14,
    borderRadius: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 12,
  },

  multilineInput: {
    minHeight: 125,
    paddingTop: 13,
  },

  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },

  categoryChoice: {
    minHeight: 42,
    paddingHorizontal: 11,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  categoryChoiceText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "800",
  },

  priceSwitch: {
    flexDirection: "row",
    gap: 8,
  },

  priceOption: {
    flex: 1,
    minHeight: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  priceOptionActive: {
    backgroundColor: "rgba(99,102,241,0.13)",
    borderColor: "rgba(99,102,241,0.4)",
  },

  priceOptionText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "800",
  },

  priceOptionTextActive: {
    color: "#A5B4FC",
  },

  integrityCard: {
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    borderRadius: 16,
    backgroundColor: "rgba(16,185,129,0.06)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.15)",
  },

  integrityText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },

  primaryButton: {
    minHeight: 54,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primaryStrong,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.35)",
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },
});

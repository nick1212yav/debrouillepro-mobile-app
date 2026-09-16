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

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { SignInButton } from "@/components/ui/signin";

import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Eye,
  List,
  MapPin,
  Plus,
  Tag,
  Trash2,
  Users,
  Zap,
} from "lucide-react-native";

// ============================================================================
// TYPES
// ============================================================================

type TabId = "mes-evenements" | "creer" | "stats";

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

interface NewEventForm {
  title: string;
  description: string;
  category: EventCategory;
  startDate: string;
  endDate: string;
  location: string;
  address: string;
  coverImage: string;
  maxAttendees: string;
  isFree: boolean;
  price: string;
  tags: string;
}

interface EvenementsProPageProps {
  onBack: () => void;
}

interface EventDetailModalProps {
  eventId: Id<"events">;
  onClose: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIES: readonly EventCategory[] = [
  "culturel",
  "sportif",
  "religieux",
  "professionnel",
  "communautaire",
  "formation",
  "festival",
  "autre",
];

const CATEGORY_LABELS: Record<EventCategory, string> = {
  culturel: "Culturel",
  sportif: "Sportif",
  religieux: "Religieux",
  professionnel: "Professionnel",
  communautaire: "Communautaire",
  formation: "Formation",
  festival: "Festival",
  autre: "Autre",
};

const CATEGORY_COLORS: Record<EventCategory, string> = {
  culturel: "#8B5CF6",
  sportif: "#3B82F6",
  religieux: "#F59E0B",
  professionnel: "#6366F1",
  communautaire: "#EC4899",
  formation: "#10B981",
  festival: "#F97316",
  autre: "#9CA3AF",
};

const STATUS_LABELS: Record<
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

const COLORS = {
  background: "#050812",
  surface: "rgba(255,255,255,0.055)",
  surfaceStrong: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.09)",
  borderStrong: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.68)",
  textMuted: "rgba(255,255,255,0.42)",
  textFaint: "rgba(255,255,255,0.25)",
  primary: "#6366F1",
  primaryStrong: "#4F46E5",
  success: "#10B981",
  danger: "#EF4444",
};

// ============================================================================
// HELPERS
// ============================================================================

function isValidDateString(value: string): boolean {
  if (!value.trim()) return false;

  const timestamp = Date.parse(value.trim());

  return Number.isFinite(timestamp);
}

function normalizeOptionalText(value: string): string | undefined {
  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

function parsePositiveInteger(value: string): number | undefined {
  const normalized = value.trim();

  if (!normalized) return undefined;

  if (!/^\d+$/.test(normalized)) return undefined;

  const parsed = Number(normalized);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function parseTags(value: string): string[] {
  const seen = new Set<string>();

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => {
      const normalized = tag.toLocaleLowerCase();

      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    })
    .slice(0, 20);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date indisponible";
  }

  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Heure indisponible";
  }

  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusConfig(status: string) {
  return (
    STATUS_LABELS[status as EventStatus] ?? {
      label: "Statut indisponible",
      color: COLORS.textMuted,
      backgroundColor: "rgba(255,255,255,0.06)",
    }
  );
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category as EventCategory] ?? COLORS.textMuted;
}

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category as EventCategory] ?? "Catégorie indisponible";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
}

// ============================================================================
// SKELETON
// ============================================================================

function LoadingSkeleton({ large = false }: { large?: boolean }) {
  return (
    <View
      style={[
        styles.skeleton,
        large ? styles.skeletonLarge : styles.skeletonSmall,
      ]}
    />
  );
}

function PageLoading() {
  return (
    <View style={styles.loadingContainer}>
      <LoadingSkeleton large />
      <LoadingSkeleton />
      <LoadingSkeleton />
      <LoadingSkeleton />
    </View>
  );
}

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Calendar;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${accent}1C` }]}>
        <Icon size={18} color={accent} />
      </View>

      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ============================================================================
// EVENT DETAIL
// ============================================================================

function EventDetailModal({ eventId, onClose }: EventDetailModalProps) {
  const event = useQuery(api.events.get, { eventId });
  const removeEvent = useMutation(api.events.remove);

  const [deleting, setDeleting] = useState(false);

  const statusConfig = event ? getStatusConfig(event.status) : null;

  const categoryColor = event
    ? getCategoryColor(event.category)
    : COLORS.primary;

  const confirmDelete = () => {
    if (deleting) return;

    Alert.alert(
      "Supprimer l’événement",
      "Cette action est définitive. Voulez-vous réellement supprimer cet événement ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            void handleDelete();
          },
        },
      ],
    );
  };

  const handleDelete = async () => {
    if (deleting) return;

    setDeleting(true);

    try {
      await removeEvent({ eventId });

      Alert.alert(
        "Événement supprimé",
        "L’événement a été supprimé avec succès.",
        [
          {
            text: "OK",
            onPress: onClose,
          },
        ],
      );
    } catch (error) {
      Alert.alert("Suppression impossible", getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        {!event ? (
          <View style={styles.detailLoading}>
            <LoadingSkeleton large />
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.detailScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* HERO */}
            <View style={styles.detailHero}>
              {event.coverImage ? (
                <Image
                  source={{ uri: event.coverImage }}
                  style={styles.detailHeroImage}
                  resizeMode="cover"
                  accessibilityLabel={event.title}
                />
              ) : (
                <View style={styles.detailHeroEmpty}>
                  <Calendar size={42} color={COLORS.textFaint} />
                </View>
              )}

              <View style={styles.detailHeroOverlay} />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                onPress={onClose}
                style={styles.backButton}
              >
                <ArrowLeft size={19} color="#FFFFFF" />
              </Pressable>

              <View style={styles.heroBottom}>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: `${categoryColor}24`,
                        borderColor: `${categoryColor}50`,
                      },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: categoryColor }]}>
                      {getCategoryLabel(event.category)}
                    </Text>
                  </View>

                  {statusConfig && (
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: statusConfig.backgroundColor,
                          borderColor: `${statusConfig.color}45`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: statusConfig.color },
                        ]}
                      >
                        {statusConfig.label}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.heroTitle}>{event.title}</Text>
              </View>
            </View>

            {/* STATS */}
            <View style={styles.section}>
              <View style={styles.statsGrid}>
                <StatCard
                  icon={Users}
                  label="Participants"
                  value={event.attendingCount}
                  accent="#6366F1"
                />

                <StatCard
                  icon={Eye}
                  label="Intéressés"
                  value={event.interestedCount}
                  accent="#F59E0B"
                />

                <StatCard
                  icon={Users}
                  label="Pas intéressés"
                  value={event.notGoingCount}
                  accent="#EF4444"
                />
              </View>
            </View>

            {/* INFORMATIONS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations</Text>

              <View style={styles.infoCard}>
                <InfoRow
                  icon={Calendar}
                  label="Date"
                  value={formatDate(event.startDate)}
                />

                <InfoRow
                  icon={Clock3}
                  label="Heure"
                  value={formatTime(event.startDate)}
                />

                {event.endDate ? (
                  <InfoRow
                    icon={Clock3}
                    label="Fin"
                    value={`${formatDate(event.endDate)} · ${formatTime(
                      event.endDate,
                    )}`}
                  />
                ) : null}

                <InfoRow icon={MapPin} label="Lieu" value={event.location} />

                {event.address ? (
                  <InfoRow
                    icon={MapPin}
                    label="Adresse"
                    value={event.address}
                  />
                ) : null}
              </View>
            </View>

            {/* DESCRIPTION */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>

              <View style={styles.contentCard}>
                <Text style={styles.description}>{event.description}</Text>
              </View>
            </View>

            {/* TAGS */}
            {event.tags.length > 0 ? (
              <View style={styles.section}>
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

            {/* TARIFICATION */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Conditions</Text>

              <View style={styles.infoCard}>
                <InfoRow
                  icon={Tag}
                  label="Tarification"
                  value={
                    event.isFree
                      ? "Gratuit"
                      : (event.price ?? "Prix indisponible")
                  }
                />

                {event.maxAttendees ? (
                  <InfoRow
                    icon={Users}
                    label="Capacité maximale"
                    value={`${event.maxAttendees} place${
                      event.maxAttendees > 1 ? "s" : ""
                    }`}
                  />
                ) : null}
              </View>
            </View>

            {/* PARTICIPANTS */}
            {event.attendees.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Participants · {event.attendingCount}
                </Text>

                <View style={styles.attendeesContainer}>
                  {event.attendees.map((attendee) => (
                    <View key={attendee.userId} style={styles.attendee}>
                      {attendee.avatar ? (
                        <Image
                          source={{ uri: attendee.avatar }}
                          style={styles.avatar}
                          resizeMode="cover"
                          accessibilityLabel={attendee.name}
                        />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarInitial}>
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
              </View>
            ) : (
              <View style={styles.emptyInline}>
                <Users size={20} color={COLORS.textFaint} />
                <Text style={styles.emptyInlineText}>
                  Aucun participant affichable pour le moment.
                </Text>
              </View>
            )}

            {/* DELETE */}
            {event.isMine ? (
              <View style={styles.dangerSection}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Supprimer cet événement"
                  disabled={deleting}
                  onPress={confirmDelete}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && styles.pressed,
                    deleting && styles.disabled,
                  ]}
                >
                  <Trash2 size={17} color="#F87171" />

                  <Text style={styles.deleteButtonText}>
                    {deleting ? "Suppression..." : "Supprimer cet événement"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        )}
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

function CreateEventForm({ onCreated }: { onCreated: () => void }) {
  const createEvent = useMutation(api.events.create);

  const [form, setForm] = useState<NewEventForm>({
    title: "",
    description: "",
    category: "culturel",
    startDate: "",
    endDate: "",
    location: "",
    address: "",
    coverImage: "",
    maxAttendees: "",
    isFree: true,
    price: "",
    tags: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateField = <K extends keyof NewEventForm>(
    key: K,
    value: NewEventForm[K],
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

    if (form.description.trim().length < 1) {
      return "Veuillez renseigner une description.";
    }

    if (!isValidDateString(form.startDate)) {
      return "La date de début est invalide.";
    }

    if (form.endDate.trim()) {
      if (!isValidDateString(form.endDate)) {
        return "La date de fin est invalide.";
      }

      if (
        new Date(form.endDate).getTime() < new Date(form.startDate).getTime()
      ) {
        return "La date de fin doit être postérieure au début.";
      }
    }

    if (form.location.trim().length < 2) {
      return "Veuillez renseigner le lieu.";
    }

    const capacity = parsePositiveInteger(form.maxAttendees);

    if (form.maxAttendees.trim() && capacity === undefined) {
      return "La capacité doit être un nombre entier positif.";
    }

    if (!form.isFree && !form.price.trim()) {
      return "Veuillez renseigner le prix de l'événement.";
    }

    return null;
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const validationError = validate();

    if (validationError) {
      Alert.alert("Formulaire incomplet", validationError);
      return;
    }

    setSubmitting(true);

    try {
      const startDate = new Date(form.startDate.trim());
      const endDate = form.endDate.trim()
        ? new Date(form.endDate.trim())
        : undefined;

      await createEvent({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        startDate: startDate.toISOString(),
        endDate: endDate?.toISOString(),
        location: form.location.trim(),
        address: normalizeOptionalText(form.address),
        coverImage: normalizeOptionalText(form.coverImage),
        maxAttendees: parsePositiveInteger(form.maxAttendees),
        isFree: form.isFree,
        price: !form.isFree ? normalizeOptionalText(form.price) : undefined,
        tags: parseTags(form.tags),
      });

      setSubmitted(true);

      Alert.alert(
        "Événement créé",
        "Votre événement a été enregistré avec succès.",
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

  if (submitted) {
    return (
      <View style={styles.successState}>
        <View style={styles.successIcon}>
          <CheckCircle2 size={34} color={COLORS.success} />
        </View>

        <Text style={styles.successTitle}>Événement créé</Text>

        <Text style={styles.successText}>
          L’événement a été enregistré. Vous pouvez maintenant le retrouver dans
          « Mes événements ».
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={onCreated}
          style={styles.primaryButton}
        >
          <List size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Mes événements</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.form}>
        <Text style={styles.formTitle}>Nouvel événement</Text>

        <Text style={styles.formSubtitle}>
          Les informations saisies seront enregistrées dans la source de données
          des événements.
        </Text>

        <Field
          label="Titre"
          required
          value={form.title}
          onChangeText={(value) => updateField("title", value)}
          placeholder="Nom de l’événement"
        />

        <Field
          label="Lieu"
          required
          value={form.location}
          onChangeText={(value) => updateField("location", value)}
          placeholder="Lieu de l’événement"
        />

        <Field
          label="Adresse"
          value={form.address}
          onChangeText={(value) => updateField("address", value)}
          placeholder="Adresse complète (optionnel)"
        />

        <View style={styles.formRow}>
          <View style={styles.formHalf}>
            <Field
              label="Début"
              required
              value={form.startDate}
              onChangeText={(value) => updateField("startDate", value)}
              placeholder="2026-10-01T18:00"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formHalf}>
            <Field
              label="Fin"
              value={form.endDate}
              onChangeText={(value) => updateField("endDate", value)}
              placeholder="Optionnel"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Catégorie</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((category) => {
              const active = form.category === category;
              const color = CATEGORY_COLORS[category];

              return (
                <Pressable
                  key={category}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: active,
                  }}
                  onPress={() => updateField("category", category)}
                  style={[
                    styles.categoryButton,
                    active && {
                      borderColor: color,
                      backgroundColor: `${color}18`,
                    },
                  ]}
                >
                  <Text
                    style={[styles.categoryButtonText, active && { color }]}
                  >
                    {CATEGORY_LABELS[category]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Tarification</Text>

          <View style={styles.priceToggleRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                selected: form.isFree,
              }}
              onPress={() => updateField("isFree", true)}
              style={[
                styles.priceToggle,
                form.isFree && styles.priceToggleActive,
              ]}
            >
              <Text
                style={[
                  styles.priceToggleText,
                  form.isFree && styles.priceToggleTextActive,
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
              onPress={() => updateField("isFree", false)}
              style={[
                styles.priceToggle,
                !form.isFree && styles.priceToggleActive,
              ]}
            >
              <Text
                style={[
                  styles.priceToggleText,
                  !form.isFree && styles.priceToggleTextActive,
                ]}
              >
                Payant
              </Text>
            </Pressable>
          </View>
        </View>

        {!form.isFree ? (
          <Field
            label="Prix"
            required
            value={form.price}
            onChangeText={(value) => updateField("price", value)}
            placeholder="Ex. 15000 FC"
          />
        ) : null}

        <Field
          label="Capacité maximale"
          value={form.maxAttendees}
          onChangeText={(value) =>
            updateField("maxAttendees", value.replace(/[^0-9]/g, ""))
          }
          placeholder="Optionnel"
          keyboardType="numeric"
        />

        <Field
          label="Image de couverture"
          value={form.coverImage}
          onChangeText={(value) => updateField("coverImage", value)}
          placeholder="URL HTTPS d’une image existante"
          autoCapitalize="none"
          keyboardType="url"
        />

        <Field
          label="Tags"
          value={form.tags}
          onChangeText={(value) => updateField("tags", value)}
          placeholder="culture, musique, formation"
        />

        <Field
          label="Description"
          required
          value={form.description}
          onChangeText={(value) => updateField("description", value)}
          placeholder="Décrivez précisément votre événement..."
          multiline
          numberOfLines={6}
        />

        <View style={styles.integrityNote}>
          <CheckCircle2 size={17} color={COLORS.success} />

          <Text style={styles.integrityText}>
            Aucun contenu fictif n’est ajouté. Après validation, les données
            sont envoyées directement à la mutation Convex de création
            d’événement.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Publier l’événement"
          disabled={submitting}
          onPress={() => {
            void handleSubmit();
          }}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
            submitting && styles.disabled,
          ]}
        >
          {submitting ? (
            <Text style={styles.primaryButtonText}>Publication...</Text>
          ) : (
            <>
              <Plus size={19} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Publier l’événement</Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// FIELD
// ============================================================================

function Field({
  label,
  required = false,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
  autoCapitalize?: React.ComponentProps<typeof TextInput>["autoCapitalize"];
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? " *" : ""}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textFaint}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={!multiline}
        style={[styles.input, multiline && styles.multilineInput]}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

// ============================================================================
// MY EVENTS
// ============================================================================

function MyEvents({
  events,
  onSelect,
}: {
  events: NonNullable<ReturnType<typeof useQuery<typeof api.events.listMine>>>;
  onSelect: (eventId: Id<"events">) => void;
}) {
  if (events.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Calendar size={30} color={COLORS.textFaint} />
        </View>

        <Text style={styles.emptyTitle}>Aucun événement créé</Text>

        <Text style={styles.emptyText}>
          Votre espace organisateur ne contient actuellement aucun événement.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      <Text style={styles.resultCount}>
        {events.length} événement
        {events.length > 1 ? "s" : ""}
      </Text>

      {events.map((event) => {
        const status = getStatusConfig(event.status);
        const categoryColor = getCategoryColor(event.category);

        return (
          <Pressable
            key={event._id}
            accessibilityRole="button"
            accessibilityLabel={`Ouvrir ${event.title}`}
            onPress={() => onSelect(event._id)}
            style={({ pressed }) => [
              styles.eventCard,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[styles.eventAccent, { backgroundColor: categoryColor }]}
            />

            <View style={styles.eventCardContent}>
              <View style={styles.eventHeader}>
                <View style={styles.eventTitleContainer}>
                  <Text numberOfLines={2} style={styles.eventTitle}>
                    {event.title}
                  </Text>

                  <Text numberOfLines={1} style={styles.eventMeta}>
                    {getCategoryLabel(event.category)}
                    {" · "}
                    {event.location}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: status.backgroundColor,
                    },
                  ]}
                >
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              </View>

              <View style={styles.eventBottom}>
                <View style={styles.eventInfoItem}>
                  <Calendar size={13} color={COLORS.textMuted} />
                  <Text style={styles.eventInfoText}>
                    {formatDate(event.startDate)}
                  </Text>
                </View>

                <View style={styles.eventInfoItem}>
                  <Clock3 size={13} color={COLORS.textMuted} />
                  <Text style={styles.eventInfoText}>
                    {formatTime(event.startDate)}
                  </Text>
                </View>

                <View style={styles.eventInfoItem}>
                  <Users size={13} color={COLORS.textMuted} />
                  <Text style={styles.eventInfoText}>
                    {event.attendingCount}
                  </Text>
                </View>

                <View style={styles.eventInfoItem}>
                  <Tag size={13} color={COLORS.textMuted} />
                  <Text style={styles.eventInfoText}>
                    {event.isFree ? "Gratuit" : (event.price ?? "Payant")}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ============================================================================
// STATISTICS
// ============================================================================

function Statistics({
  events,
}: {
  events: NonNullable<ReturnType<typeof useQuery<typeof api.events.listMine>>>;
}) {
  const statistics = useMemo(() => {
    const total = events.length;

    const upcoming = events.filter(
      (event) => event.status === "upcoming",
    ).length;

    const ongoing = events.filter((event) => event.status === "ongoing").length;

    const past = events.filter((event) => event.status === "past").length;

    const cancelled = events.filter(
      (event) => event.status === "cancelled",
    ).length;

    const free = events.filter((event) => event.isFree).length;

    const paid = events.filter((event) => !event.isFree).length;

    const categories = CATEGORIES.map((category) => ({
      category,
      count: events.filter((event) => event.category === category).length,
    })).filter((item) => item.count > 0);

    return {
      total,
      upcoming,
      ongoing,
      past,
      cancelled,
      free,
      paid,
      categories,
    };
  }, [events]);

  if (events.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <BarChart3 size={30} color={COLORS.textFaint} />
        </View>

        <Text style={styles.emptyTitle}>Statistiques indisponibles</Text>

        <Text style={styles.emptyText}>
          Les statistiques apparaîtront lorsqu’au moins un événement réel sera
          associé à votre compte.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.statistics}>
      <View style={styles.statsGrid}>
        <StatCard
          icon={Calendar}
          label="Total"
          value={statistics.total}
          accent="#EC4899"
        />

        <StatCard
          icon={Zap}
          label="À venir"
          value={statistics.upcoming}
          accent="#3B82F6"
        />

        <StatCard
          icon={Users}
          label="En cours"
          value={statistics.ongoing}
          accent="#10B981"
        />

        <StatCard
          icon={CheckCircle2}
          label="Terminés"
          value={statistics.past}
          accent="#9CA3AF"
        />
      </View>

      {statistics.cancelled > 0 ? (
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>Événements annulés</Text>

          <Text style={[styles.metricValue, { color: COLORS.danger }]}>
            {statistics.cancelled}
          </Text>
        </View>
      ) : null}

      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>Répartition par catégorie</Text>

        {statistics.categories.map(({ category, count }) => {
          const percentage =
            statistics.total > 0 ? (count / statistics.total) * 100 : 0;

          const color = CATEGORY_COLORS[category];

          return (
            <View key={category} style={styles.categoryMetric}>
              <View style={styles.categoryMetricHeader}>
                <Text style={styles.categoryMetricLabel}>
                  {CATEGORY_LABELS[category]}
                </Text>

                <Text style={styles.categoryMetricCount}>{count}</Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>Tarification</Text>

        <View style={styles.pricingRow}>
          <View style={styles.pricingItem}>
            <Text style={[styles.pricingValue, { color: COLORS.success }]}>
              {statistics.free}
            </Text>

            <Text style={styles.pricingLabel}>Gratuits</Text>
          </View>

          <View style={styles.pricingItem}>
            <Text style={[styles.pricingValue, { color: "#F59E0B" }]}>
              {statistics.paid}
            </Text>

            <Text style={styles.pricingLabel}>Payants</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// INNER PAGE
// ============================================================================

function EvenementsProInner({ onBack }: EvenementsProPageProps) {
  const [tab, setTab] = useState<TabId>("mes-evenements");

  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(
    null,
  );

  const myEvents = useQuery(api.events.listMine, {});

  const tabs = [
    {
      id: "mes-evenements" as const,
      label: "Mes événements",
      icon: List,
      color: "#EC4899",
    },
    {
      id: "creer" as const,
      label: "Créer",
      icon: CalendarPlus,
      color: "#10B981",
    },
    {
      id: "stats" as const,
      label: "Stats",
      icon: BarChart3,
      color: "#F59E0B",
    },
  ];

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButtonSmall,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft size={19} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Mes événements</Text>

            <Text style={styles.headerSubtitle}>
              Espace organisateur · Gestion & données réelles
            </Text>
          </View>
        </View>

        {/* TABS */}
        <View style={styles.tabs}>
          {tabs.map(({ id, label, icon: Icon, color }) => {
            const active = tab === id;

            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityState={{
                  selected: active,
                }}
                onPress={() => setTab(id)}
                style={[
                  styles.tab,
                  active && {
                    borderColor: `${color}55`,
                    backgroundColor: `${color}16`,
                  },
                ]}
              >
                <Icon size={16} color={active ? color : COLORS.textMuted} />

                <Text
                  style={[
                    styles.tabText,
                    active && {
                      color,
                    },
                  ]}
                >
                  {label}
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
        keyboardShouldPersistTaps="handled"
      >
        {tab === "mes-evenements" ? (
          myEvents === undefined ? (
            <PageLoading />
          ) : (
            <MyEvents events={myEvents} onSelect={setSelectedEventId} />
          )
        ) : null}

        {tab === "creer" ? (
          <CreateEventForm onCreated={() => setTab("mes-evenements")} />
        ) : null}

        {tab === "stats" ? (
          myEvents === undefined ? (
            <PageLoading />
          ) : (
            <Statistics events={myEvents} />
          )
        ) : null}
      </ScrollView>

      {/* DETAIL */}
      {selectedEventId ? (
        <EventDetailModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />
      ) : null}
    </View>
  );
}

// ============================================================================
// MAIN PAGE / AUTH
// ============================================================================

export default function EvenementsProPage({ onBack }: EvenementsProPageProps) {
  return (
    <View style={styles.root}>
      <AuthLoading>
        <PageLoading />
      </AuthLoading>

      <Unauthenticated>
        <View style={styles.authState}>
          <View style={styles.authIcon}>
            <Calendar size={36} color={COLORS.textFaint} />
          </View>

          <Text style={styles.authTitle}>Espace organisateur</Text>

          <Text style={styles.authText}>
            Connectez-vous pour créer et gérer vos événements.
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

      <Authenticated>
        <EvenementsProInner onBack={onBack} />
      </Authenticated>
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

  header: {
    paddingTop: Platform.OS === "ios" ? 54 : 28,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  backButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 12,
  },

  tabs: {
    flexDirection: "row",
    gap: 8,
  },

  tab: {
    flex: 1,
    minHeight: 58,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  tabText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },

  loadingContainer: {
    gap: 12,
    padding: 16,
  },

  detailLoading: {
    flex: 1,
    padding: 16,
    gap: 12,
    justifyContent: "center",
  },

  skeleton: {
    height: 88,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  skeletonLarge: {
    height: 220,
  },

  skeletonSmall: {
    height: 84,
  },

  list: {
    gap: 12,
  },

  resultCount: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },

  eventCard: {
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  eventAccent: {
    width: 4,
  },

  eventCardContent: {
    flex: 1,
    padding: 15,
  },

  eventHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  eventTitleContainer: {
    flex: 1,
  },

  eventTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },

  eventMeta: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 11,
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },

  eventBottom: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 14,
  },

  eventInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  eventInfoText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "600",
  },

  emptyState: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 7,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 310,
  },

  form: {
    gap: 16,
    paddingBottom: 20,
  },

  formTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
  },

  formSubtitle: {
    marginTop: -8,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },

  formRow: {
    flexDirection: "row",
    gap: 10,
  },

  formHalf: {
    flex: 1,
  },

  fieldBlock: {
    gap: 8,
  },

  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },

  input: {
    minHeight: 52,
    paddingHorizontal: 15,
    borderRadius: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 13,
  },

  multilineInput: {
    minHeight: 130,
    paddingTop: 14,
  },

  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },

  categoryButton: {
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  categoryButtonText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },

  priceToggleRow: {
    flexDirection: "row",
    gap: 8,
  },

  priceToggle: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  priceToggleActive: {
    backgroundColor: "rgba(99,102,241,0.15)",
    borderColor: "rgba(99,102,241,0.45)",
  },

  priceToggleText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },

  priceToggleTextActive: {
    color: "#A5B4FC",
  },

  integrityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "rgba(16,185,129,0.07)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.16)",
  },

  integrityText: {
    flex: 1,
    color: "rgba(255,255,255,0.56)",
    fontSize: 11,
    lineHeight: 17,
  },

  primaryButton: {
    minHeight: 54,
    paddingHorizontal: 18,
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
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  secondaryButton: {
    marginTop: 4,
    minHeight: 46,
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
    fontSize: 12,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.72,
  },

  disabled: {
    opacity: 0.48,
  },

  successState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },

  successIcon: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,185,129,0.1)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)",
    marginBottom: 18,
  },

  successTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
  },

  successText: {
    marginTop: 8,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 320,
    marginBottom: 22,
  },

  statistics: {
    gap: 14,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  statCard: {
    width: "48%",
    minHeight: 128,
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  statValue: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "900",
  },

  statLabel: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },

  metricCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  metricTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 14,
  },

  metricValue: {
    fontSize: 28,
    fontWeight: "900",
  },

  categoryMetric: {
    marginBottom: 14,
  },

  categoryMetricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  categoryMetricLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },

  categoryMetricCount: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },

  progressTrack: {
    height: 7,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  pricingRow: {
    flexDirection: "row",
    gap: 10,
  },

  pricingItem: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pricingValue: {
    fontSize: 25,
    fontWeight: "900",
  },

  pricingLabel: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 11,
  },

  modalRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  detailScroll: {
    paddingBottom: 40,
  },

  detailHero: {
    height: 270,
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
    backgroundColor: "#0C1022",
  },

  detailHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },

  backButton: {
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

  heroBottom: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
  },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 9,
  },

  badge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  badgeText: {
    fontSize: 9,
    fontWeight: "900",
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "900",
  },

  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },

  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 9,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  infoCard: {
    padding: 14,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },

  infoRow: {
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
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  infoTextContainer: {
    flex: 1,
  },

  infoLabel: {
    color: COLORS.textFaint,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 2,
  },

  infoValue: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  contentCard: {
    padding: 15,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  description: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  tag: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  tagText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },

  attendeesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  attendee: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    maxWidth: "100%",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },

  avatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
  },

  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  attendeeName: {
    flexShrink: 1,
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "600",
  },

  emptyInline: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyInlineText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },

  dangerSection: {
    paddingHorizontal: 16,
    marginTop: 22,
  },

  deleteButton: {
    minHeight: 52,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },

  deleteButtonText: {
    color: "#F87171",
    fontSize: 12,
    fontWeight: "800",
  },

  authState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  authIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },

  authTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
  },

  authText: {
    marginTop: 8,
    marginBottom: 20,
    maxWidth: 320,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});

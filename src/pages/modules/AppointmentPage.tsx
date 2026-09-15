// src/pages/modules/AppointmentPage.tsx
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image as RNImage,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  MapPin,
  Shield,
  Star,
  Stethoscope,
  Video,
  X,
} from "lucide-react-native";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { SignInButton } from "@/components/ui/signin";
import type { Id } from "@/convex/_generated/dataModel";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface AppointmentPageProps {
  onBack: () => void;
  onOpenHealth?: () => void;
}

type ConsultationType = "consultation" | "teleconsultation";

type Doctor = {
  _id: Id<"medicalProfessionals">;
  name: string;
  specialty: string;
  images?: string[];
  distance?: string;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  city?: string;
};

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */

const T = {
  bg: "#07070C",
  card: "rgba(255,255,255,0.045)",
  cardUp: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.08)",
  borderUp: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.58)",
  faint: "rgba(255,255,255,0.32)",
  ghost: "rgba(255,255,255,0.18)",
  primary: "#EF4444",
  primarySoft: "#F87171",
  success: "#10B981",
  amber: "#F59E0B",
} as const;

const SCREEN_W = Dimensions.get("window").width;

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function formatLongDate(dateStr: string): string {
  const s = new Date(`${dateStr}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Un slot peut être "09:00", "2026-02-15T09:00" ou "2026-02-15 09:00". */
function parseSlot(slot: string): { date: string | null; time: string } {
  const isoMatch = slot.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (isoMatch) return { date: isoMatch[1], time: isoMatch[2] };
  return { date: null, time: slot };
}

/* ════════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ════════════════════════════════════════════════════════════════════════════ */

function Skeleton({
  style,
}: {
  style?: React.ComponentProps<typeof Animated.View>["style"];
}) {
  const opacity = useRef(new Animated.Value(0.28)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.65,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.28,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[
        {
          backgroundColor: "rgba(255,255,255,0.06)",
          borderRadius: 16,
          opacity,
        },
        style,
      ]}
    />
  );
}

function StepIndicator({
  current,
  labels,
}: {
  current: 1 | 2 | 3;
  labels: [string, string, string];
}) {
  return (
    <View style={styles.stepWrap}>
      {[1, 2, 3].map((n) => {
        const done = current > n;
        const active = current === n;
        return (
          <View key={n} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor: done
                    ? T.success
                    : active
                      ? T.primary
                      : "rgba(255,255,255,0.06)",
                  borderColor: active ? T.primary : done ? T.success : T.border,
                },
              ]}
            >
              {done ? (
                <Check size={12} color="#fff" strokeWidth={3} />
              ) : (
                <Text
                  style={{
                    color: active ? "#fff" : T.faint,
                    fontSize: 11,
                    fontWeight: "900",
                  }}
                >
                  {n}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                {
                  color: active ? T.text : T.faint,
                  fontWeight: active ? "900" : "600",
                },
              ]}
              numberOfLines={1}
            >
              {labels[n - 1]}
            </Text>
            {n < 3 && (
              <View
                style={[
                  styles.stepLine,
                  {
                    backgroundColor: done
                      ? T.success
                      : "rgba(255,255,255,0.08)",
                  },
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DOCTOR CARD
   ════════════════════════════════════════════════════════════════════════════ */

function DoctorCard({
  doctor,
  selected,
  onPress,
}: {
  doctor: Doctor;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    onPress();
  };

  const avatar = doctor.images?.[0];

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.doctorCard,
          selected && {
            backgroundColor: alpha(T.primary, 0.1),
            borderColor: alpha(T.primary, 0.45),
          },
          { transform: [{ scale }] },
        ]}
      >
        {avatar ? (
          <RNImage
            source={{ uri: avatar }}
            style={styles.doctorAvatar}
            accessibilityLabel={doctor.name}
          />
        ) : (
          <View
            style={[
              styles.doctorAvatar,
              {
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: alpha(T.primary, 0.18),
              },
            ]}
          >
            <Stethoscope size={18} color={T.primarySoft} />
          </View>
        )}

        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text
              numberOfLines={1}
              style={styles.doctorName}
              ellipsizeMode="tail"
            >
              {doctor.name}
            </Text>
            {doctor.verified && <BadgeCheck size={13} color="#60A5FA" />}
          </View>
          <Text numberOfLines={1} style={styles.doctorSpecialty}>
            {doctor.specialty}
          </Text>

          <View style={styles.doctorMeta}>
            {doctor.rating !== undefined && (
              <View style={styles.metaItem}>
                <Star size={10} color={T.amber} fill={T.amber} />
                <Text style={styles.metaText}>{doctor.rating.toFixed(1)}</Text>
              </View>
            )}
            {doctor.distance && (
              <View style={styles.metaItem}>
                <MapPin size={10} color={T.faint} />
                <Text style={styles.metaText}>{doctor.distance}</Text>
              </View>
            )}
            {doctor.city && !doctor.distance && (
              <View style={styles.metaItem}>
                <MapPin size={10} color={T.faint} />
                <Text style={styles.metaText}>{doctor.city}</Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            styles.selectIndicator,
            selected && {
              backgroundColor: T.primary,
              borderColor: T.primary,
            },
          ]}
        >
          {selected && <Check size={12} color="#fff" strokeWidth={3} />}
        </View>
      </Animated.View>
    </Pressable>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TIME SLOT CHIP
   ════════════════════════════════════════════════════════════════════════════ */

function TimeSlotChip({
  slot,
  selected,
  onPress,
}: {
  slot: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { time } = parseSlot(slot);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.slotChip,
        {
          backgroundColor: selected
            ? alpha(T.primary, 0.16)
            : "rgba(255,255,255,0.04)",
          borderColor: selected ? alpha(T.primary, 0.5) : T.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      <Clock size={12} color={selected ? T.primarySoft : T.faint} />
      <Text
        style={{
          color: selected ? T.primarySoft : T.dim,
          fontSize: 12.5,
          fontWeight: selected ? "900" : "700",
        }}
      >
        {time}
      </Text>
    </Pressable>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CONSULTATION TYPE CARD
   ════════════════════════════════════════════════════════════════════════════ */

function ConsultTypeCard({
  icon: Icon,
  title,
  description,
  selected,
  onPress,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  accent: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.typeCard,
        {
          backgroundColor: selected
            ? alpha(accent, 0.1)
            : "rgba(255,255,255,0.03)",
          borderColor: selected ? alpha(accent, 0.45) : T.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={[styles.typeIcon, { backgroundColor: alpha(accent, 0.16) }]}>
        <Icon size={17} color={accent} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.typeTitle, { color: selected ? accent : T.text }]}>
          {title}
        </Text>
        <Text style={styles.typeDesc} numberOfLines={2}>
          {description}
        </Text>
      </View>

      <View
        style={[
          styles.selectIndicator,
          selected && {
            backgroundColor: accent,
            borderColor: accent,
          },
        ]}
      >
        {selected && <Check size={12} color="#fff" strokeWidth={3} />}
      </View>
    </Pressable>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CONFIRMATION MODAL
   ════════════════════════════════════════════════════════════════════════════ */

function ConfirmationModal({
  visible,
  doctor,
  slot,
  type,
  onClose,
  onConfirm,
  loading,
}: {
  visible: boolean;
  doctor: Doctor | null;
  slot: string | null;
  type: ConsultationType;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const slide = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  if (!doctor || !slot) return null;

  const { date, time } = parseSlot(slot);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={loading ? () => {} : onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={loading ? undefined : onClose}
        />

        <Animated.View
          style={[
            styles.confirmSheet,
            {
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 600],
                  }),
                },
              ],
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.sheetHandle} />

            {/* Icône succès animée */}
            <View style={styles.confirmIconWrap}>
              <View style={styles.confirmIcon}>
                <Calendar size={26} color={T.primarySoft} />
              </View>
            </View>

            <Text style={styles.confirmTitle}>Confirmer le rendez-vous</Text>
            <Text style={styles.confirmSubtitle}>
              Vérifie les informations avant de valider.
            </Text>

            {/* Récapitulatif */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View
                  style={[
                    styles.summaryIcon,
                    { backgroundColor: alpha("#6366F1", 0.15) },
                  ]}
                >
                  <Stethoscope size={13} color="#A5B4FC" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.summaryLabel}>Médecin</Text>
                  <Text style={styles.summaryValue} numberOfLines={1}>
                    {doctor.name}
                  </Text>
                  <Text style={styles.summarySub} numberOfLines={1}>
                    {doctor.specialty}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <View
                  style={[
                    styles.summaryIcon,
                    { backgroundColor: alpha(T.amber, 0.15) },
                  ]}
                >
                  <Clock size={13} color={T.amber} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.summaryLabel}>
                    {date ? "Date & heure" : "Heure"}
                  </Text>
                  <Text style={styles.summaryValue} numberOfLines={1}>
                    {date ? `${formatLongDate(date)} · ${time}` : time}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <View
                  style={[
                    styles.summaryIcon,
                    {
                      backgroundColor: alpha(
                        type === "consultation" ? "#10B981" : "#0EA5E9",
                        0.15,
                      ),
                    },
                  ]}
                >
                  {type === "consultation" ? (
                    <Activity size={13} color="#34D399" />
                  ) : (
                    <Video size={13} color="#38BDF8" />
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.summaryLabel}>Type</Text>
                  <Text style={styles.summaryValue} numberOfLines={1}>
                    {type === "consultation"
                      ? "Consultation en cabinet"
                      : "Téléconsultation vidéo"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.confirmActions}>
              <Pressable
                onPress={onClose}
                disabled={loading}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { opacity: loading ? 0.5 : pressed ? 0.75 : 1 },
                ]}
              >
                <Text style={styles.cancelText}>Modifier</Text>
              </Pressable>

              <Pressable
                onPress={onConfirm}
                disabled={loading}
                style={({ pressed }) => [
                  styles.confirmBtn,
                  {
                    opacity: loading ? 0.6 : pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <CheckCircle size={16} color="#fff" />
                )}
                <Text style={styles.confirmBtnText}>
                  {loading ? "Réservation…" : "Confirmer"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.confirmFoot}>
              <Shield size={10} color={T.ghost} />
              <Text style={styles.confirmFootText}>
                Annulation gratuite jusqu'à 24 h avant
              </Text>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ════════════════════════════════════════════════════════════════════════════ */

export default function AppointmentPage({
  onBack,
  onOpenHealth,
}: AppointmentPageProps) {
  const { isAuthenticated } = useFirebaseAuth();

  const [selectedDoctorId, setSelectedDoctorId] =
    useState<Id<"medicalProfessionals"> | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [type, setType] = useState<ConsultationType>("consultation");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const doctors = useQuery(api.health.listProfessionals, {}) as
    | Doctor[]
    | undefined;

  const availability = useQuery(
    api.health.getAvailability,
    selectedDoctorId ? { professionalId: selectedDoctorId } : "skip",
  );

  const bookAppointment = useMutation(api.health.bookAppointment);

  const selectedDoctor = useMemo(
    () => doctors?.find((d) => d._id === selectedDoctorId) ?? null,
    [doctors, selectedDoctorId],
  );

  /* Reset du créneau quand on change de médecin */
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDoctorId]);

  /* Étape courante du flux */
  const step: 1 | 2 | 3 = useMemo(() => {
    if (!selectedDoctorId) return 1;
    if (!selectedSlot) return 2;
    return 3;
  }, [selectedDoctorId, selectedSlot]);

  const canConfirm = !!selectedDoctorId && !!selectedSlot;

  const handleBook = async () => {
    if (!selectedDoctorId || !selectedSlot) return;
    setIsBooking(true);
    try {
      await bookAppointment({
        professionalId: selectedDoctorId,
        slot: selectedSlot,
        type,
      });
      toast.success("Rendez-vous confirmé !");
      setShowConfirm(false);

      // Petite latence pour laisser le toast respirer, puis retour
      setTimeout(() => {
        if (onOpenHealth) onOpenHealth();
        else onBack();
      }, 500);
    } catch {
      toast.error("Erreur lors de la réservation");
    } finally {
      setIsBooking(false);
    }
  };

  /* ── Gate d'authentification ─────────────────────────────────────────── */
  if (!isAuthenticated) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.authGate}>
          <View style={styles.authIcon}>
            <Calendar size={30} color={T.primarySoft} />
          </View>
          <Text style={styles.authTitle}>Connexion requise</Text>
          <Text style={styles.authText}>
            Connecte-toi pour prendre rendez-vous avec un professionnel de santé
            en quelques secondes.
          </Text>
          <View style={{ marginTop: 10 }}>
            <SignInButton />
          </View>
        </View>
      </View>
    );
  }

  /* ── Rendu principal ─────────────────────────────────────────────────── */
  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glow} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Rendez-vous</Text>
            <Text style={styles.subtitle}>
              Choisis un médecin, un créneau, c'est prêt.
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <StepIndicator
            current={step}
            labels={["Médecin", "Créneau", "Type"]}
          />
        </View>
      </View>

      {/* Contenu scrollable */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* STEP 1 — Médecin */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View
              style={[
                styles.sectionIcon,
                { backgroundColor: alpha(T.primary, 0.15) },
              ]}
            >
              <Stethoscope size={14} color={T.primarySoft} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Choisir un médecin</Text>
              <Text style={styles.sectionSubtitle}>
                {doctors?.length ?? 0} professionnel
                {(doctors?.length ?? 0) !== 1 ? "s" : ""} disponible
                {(doctors?.length ?? 0) !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          {doctors === undefined ? (
            <View style={{ gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} style={{ height: 76, borderRadius: 18 }} />
              ))}
            </View>
          ) : doctors.length === 0 ? (
            <View style={styles.emptyMini}>
              <Stethoscope size={22} color={T.faint} />
              <Text style={styles.emptyMiniText}>
                Aucun médecin disponible pour l'instant
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {doctors.map((doc) => (
                <DoctorCard
                  key={doc._id}
                  doctor={doc}
                  selected={selectedDoctorId === doc._id}
                  onPress={() => setSelectedDoctorId(doc._id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* STEP 2 — Créneau */}
        {selectedDoctorId && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View
                style={[
                  styles.sectionIcon,
                  { backgroundColor: alpha(T.amber, 0.15) },
                ]}
              >
                <Clock size={14} color={T.amber} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Choisir un créneau</Text>
                <Text style={styles.sectionSubtitle}>
                  {selectedDoctor?.name ?? "Médecin sélectionné"}
                </Text>
              </View>
            </View>

            {availability === undefined ? (
              <View style={{ gap: 10 }}>
                <Skeleton style={{ height: 44, borderRadius: 14 }} />
                <Skeleton style={{ height: 44, borderRadius: 14 }} />
              </View>
            ) : (availability?.slots?.length ?? 0) === 0 ? (
              <View style={styles.emptyMini}>
                <Clock size={22} color={T.faint} />
                <Text style={styles.emptyMiniText}>
                  Aucun créneau disponible pour ce médecin
                </Text>
              </View>
            ) : (
              <View style={styles.slotGrid}>
                {availability!.slots.map((slot: string) => (
                  <TimeSlotChip
                    key={slot}
                    slot={slot}
                    selected={selectedSlot === slot}
                    onPress={() => setSelectedSlot(slot)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* STEP 3 — Type de consultation */}
        {selectedSlot && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View
                style={[
                  styles.sectionIcon,
                  { backgroundColor: alpha(T.success, 0.15) },
                ]}
              >
                <Activity size={14} color="#34D399" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Type de consultation</Text>
                <Text style={styles.sectionSubtitle}>
                  Comment veux-tu consulter ?
                </Text>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <ConsultTypeCard
                icon={Activity}
                title="En cabinet"
                description="Rendez-vous physique au cabinet du médecin"
                accent="#10B981"
                selected={type === "consultation"}
                onPress={() => setType("consultation")}
              />
              <ConsultTypeCard
                icon={Video}
                title="Téléconsultation"
                description="Consultation vidéo sécurisée depuis ton téléphone"
                accent="#0EA5E9"
                selected={type === "teleconsultation"}
                onPress={() => setType("teleconsultation")}
              />
            </View>
          </View>
        )}

        {/* Info sécurité */}
        <View style={styles.infoBanner}>
          <Shield size={13} color={T.primarySoft} />
          <Text style={styles.infoBannerText}>
            Tes données médicales restent chiffrées et confidentielles.
          </Text>
        </View>
      </ScrollView>

      {/* Footer sticky — récapitulatif + bouton */}
      {canConfirm && (
        <View style={styles.footer}>
          <View style={styles.footerSummary}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.footerLabel}>Récapitulatif</Text>
              <Text style={styles.footerValue} numberOfLines={1}>
                {selectedDoctor?.name ?? "—"}
              </Text>
              <Text style={styles.footerSub} numberOfLines={1}>
                {parseSlot(selectedSlot!).time} ·{" "}
                {type === "consultation" ? "Cabinet" : "Vidéo"}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => setShowConfirm(true)}
            style={({ pressed }) => [
              styles.bookBtn,
              {
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Calendar size={16} color="#fff" />
            <Text style={styles.bookBtnText}>Prendre RDV</Text>
          </Pressable>
        </View>
      )}

      {/* Modal de confirmation */}
      <ConfirmationModal
        visible={showConfirm}
        doctor={selectedDoctor}
        slot={selectedSlot}
        type={type}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleBook}
        loading={isBooking}
      />
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  glow: {
    position: "absolute",
    top: -140,
    left: -80,
    right: -80,
    height: 320,
    borderRadius: 220,
    backgroundColor: alpha(T.primary, 0.1),
  },

  /* Header */
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  title: {
    color: T.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: { color: T.faint, fontSize: 11.5, marginTop: 2 },

  /* Stepper */
  stepWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  stepItem: { flexDirection: "row", alignItems: "center", flex: 1 },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  stepLabel: {
    marginLeft: 8,
    fontSize: 11,
    letterSpacing: -0.1,
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    borderRadius: 999,
  },

  /* Content */
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 120 },

  section: { marginBottom: 26 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: T.text,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    color: T.faint,
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },

  /* Doctor card */
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  doctorName: {
    color: T.text,
    fontSize: 14,
    fontWeight: "800",
    flexShrink: 1,
  },
  doctorSpecialty: {
    color: T.primarySoft,
    fontSize: 11.5,
    fontWeight: "700",
    marginTop: 3,
  },
  doctorMeta: {
    flexDirection: "row",
    gap: 12,
    marginTop: 5,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: T.faint, fontSize: 10.5, fontWeight: "700" },

  /* Select indicator (used by doctor + type) */
  selectIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: T.borderUp,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Slot chips */
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: 1,
  },

  /* Consult type card */
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  typeTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  typeDesc: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 3,
    lineHeight: 16,
    fontWeight: "600",
  },

  /* Info banner */
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: alpha(T.primary, 0.07),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.2),
  },
  infoBannerText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11.5,
    flex: 1,
    lineHeight: 16,
    fontWeight: "600",
  },

  /* Mini empty */
  emptyMini: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 10,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  emptyMiniText: {
    color: T.faint,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  /* Footer sticky */
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 32 : 20,
    backgroundColor: "rgba(10,10,15,0.96)",
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  footerSummary: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  footerLabel: {
    color: T.faint,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  footerValue: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "800",
    marginTop: 3,
  },
  footerSub: {
    color: T.dim,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 16,
    backgroundColor: T.primary,
    shadowColor: T.primary,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  bookBtnText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.1,
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  confirmSheet: {
    backgroundColor: "#0E0E14",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: T.borderUp,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginTop: 10,
    marginBottom: 18,
  },
  confirmIconWrap: { alignItems: "center", marginBottom: 16 },
  confirmIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.16),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.32),
  },
  confirmTitle: {
    color: T.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  confirmSubtitle: {
    color: T.faint,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
    fontWeight: "600",
  },
  summaryCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    gap: 4,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "800",
    marginTop: 3,
  },
  summarySub: {
    color: T.primarySoft,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginVertical: 4,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  cancelText: { color: T.dim, fontSize: 13.5, fontWeight: "800" },
  confirmBtn: {
    flex: 1.4,
    height: 50,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: T.primary,
    shadowColor: T.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  confirmBtnText: { color: "#fff", fontSize: 13.5, fontWeight: "900" },
  confirmFoot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  confirmFootText: {
    color: T.ghost,
    fontSize: 10.5,
    fontWeight: "600",
  },

  /* Auth gate */
  authGate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  authIcon: {
    width: 78,
    height: 78,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.14),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.32),
    marginBottom: 6,
  },
  authTitle: {
    color: T.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  authText: {
    color: T.dim,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 300,
  },
});

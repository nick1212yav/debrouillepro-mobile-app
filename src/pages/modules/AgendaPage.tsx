import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Bell,
  Briefcase,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Heart,
  Loader2,
  Plus,
  Tag,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react-native";
import { api } from "@/convex/_generated/api.js";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface AgendaPageProps {
  onBack: () => void;
}

type EventCategory = "Personnel" | "Travail" | "Santé" | "Communauté";
type ViewMode = "month" | "week";

type AgendaEvent = {
  _id: Id<"agendaEvents">;
  title: string;
  date: string;
  time: string;
  endTime: string;
  category: EventCategory;
  color: string;
  note?: string;
  reminder: boolean;
};

type FormState = {
  title: string;
  date: string;
  time: string;
  endTime: string;
  category: EventCategory;
  color: string;
  note: string;
  reminder: boolean;
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
  primary: "#6366F1",
  primarySoft: "#A5B4FC",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
} as const;

const CATEGORY_META: Record<
  EventCategory,
  {
    color: string;
    bg: string;
    icon: (c: string, s?: number) => React.ReactNode;
  }
> = {
  Personnel: {
    color: "#6366F1",
    bg: "rgba(99,102,241,0.15)",
    icon: (c, s = 12) => <User size={s} color={c} />,
  },
  Travail: {
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.15)",
    icon: (c, s = 12) => <Briefcase size={s} color={c} />,
  },
  Santé: {
    color: "#10B981",
    bg: "rgba(16,185,129,0.15)",
    icon: (c, s = 12) => <Heart size={s} color={c} />,
  },
  Communauté: {
    color: "#EC4899",
    bg: "rgba(236,72,153,0.15)",
    icon: (c, s = 12) => <Users size={s} color={c} />,
  },
};

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const SCREEN_W = Dimensions.get("window").width;
const GRID_PADDING = 20;
const GAP = 4;
const CELL_SIZE = Math.floor((SCREEN_W - GRID_PADDING * 2 - GAP * 6) / 7);

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS — DATE (local-safe, no UTC drift)
   ════════════════════════════════════════════════════════════════════════════ */

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayStr(): string {
  return toLocalDateStr(new Date());
}

function formatMonthYear(year: number, month: number): string {
  const s = new Date(year, month, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatLongDate(dateStr: string): string {
  const s = new Date(`${dateStr}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Grille du mois : semaines de 7 jours (lundi → dimanche), `null` = case vide. */
function buildMonthMatrix(year: number, month: number): (number | null)[][] {
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** 7 dates ISO (lun → dim) contenant `dateStr`. */
function getWeekDates(dateStr: string): string[] {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(d);
    nd.setDate(d.getDate() + i);
    return toLocalDateStr(nd);
  });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
}

/** Retourne "YYYY-MM-DD HH:MM" pour une date + heure. */
function isTimeValid(t: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t.trim());
}

/* ════════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ════════════════════════════════════════════════════════════════════════════ */

function Skeleton({
  style,
}: {
  style?: React.ComponentProps<typeof Animated.View>["style"];
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
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
          backgroundColor: "rgba(255,255,255,0.07)",
          borderRadius: 14,
          opacity,
        },
        style,
      ]}
    />
  );
}

function CategoryChip({
  category,
  size = 11,
}: {
  category: EventCategory;
  size?: number;
}) {
  const meta = CATEGORY_META[category];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: meta.bg,
      }}
    >
      {meta.icon(meta.color, size)}
      <Text
        style={{
          color: meta.color,
          fontSize: size - 0.5,
          fontWeight: "800",
          letterSpacing: 0.2,
        }}
      >
        {category}
      </Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DAY CELL — mois
   ════════════════════════════════════════════════════════════════════════════ */

function DayCell({
  day,
  dateStr,
  isSelected,
  isToday,
  dots,
  onPress,
}: {
  day: number | null;
  dateStr: string;
  isSelected: boolean;
  isToday: boolean;
  dots: string[];
  onPress: () => void;
}) {
  if (day === null) {
    return <View style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: CELL_SIZE,
          height: CELL_SIZE,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isSelected
            ? T.primary
            : isToday
              ? "rgba(99,102,241,0.15)"
              : "transparent",
          borderWidth: isToday && !isSelected ? 1 : 0,
          borderColor: isToday ? "rgba(99,102,241,0.5)" : "transparent",
          opacity: pressed ? 0.75 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
    >
      <Text
        style={{
          color: isSelected ? "#fff" : isToday ? T.primarySoft : T.text,
          fontSize: 13.5,
          fontWeight: isSelected || isToday ? "800" : "600",
        }}
      >
        {day}
      </Text>

      {dots.length > 0 && (
        <View
          style={{
            position: "absolute",
            bottom: 5,
            flexDirection: "row",
            gap: 2.5,
          }}
        >
          {dots.slice(0, 3).map((color, i) => (
            <View
              key={i}
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: isSelected ? "#fff" : color,
              }}
            />
          ))}
        </View>
      )}
    </Pressable>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   EVENT CARD — liste du jour sélectionné
   ════════════════════════════════════════════════════════════════════════════ */

function EventCard({
  event,
  onPress,
}: {
  event: AgendaEvent;
  onPress: () => void;
}) {
  const meta = CATEGORY_META[event.category] ?? CATEGORY_META.Personnel;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.eventCard,
        {
          borderColor: `${event.color}40`,
          backgroundColor: `${event.color}12`,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View
        style={{
          width: 3,
          alignSelf: "stretch",
          borderRadius: 999,
          backgroundColor: event.color,
        }}
      />

      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              color: T.text,
              fontSize: 14,
              fontWeight: "700",
              flex: 1,
            }}
          >
            {event.title}
          </Text>
          {event.reminder && <Bell size={12} color={T.warning} />}
          <Edit2 size={12} color={T.faint} />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Clock size={11} color={T.faint} />
            <Text style={{ color: T.dim, fontSize: 11.5, fontWeight: "600" }}>
              {event.time} – {event.endTime}
            </Text>
          </View>
          <CategoryChip category={event.category} />
        </View>

        {!!event.note && (
          <Text
            numberOfLines={2}
            style={{
              color: T.faint,
              fontSize: 11.5,
              lineHeight: 16,
              marginTop: 1,
            }}
          >
            {event.note}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   FORM MODAL (bottom-sheet)
   ════════════════════════════════════════════════════════════════════════════ */

function EventFormModal({
  visible,
  editing,
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  editing: boolean;
  initial: FormState;
  onClose: () => void;
  onSave: (data: FormState) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const slide = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) setForm(initial);
  }, [visible, initial]);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  const canSave =
    form.title.trim().length > 0 &&
    isTimeValid(form.time) &&
    isTimeValid(form.endTime) &&
    form.date.length === 10;

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        note: form.note.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (Platform.OS === "web") {
      const ok =
        typeof window !== "undefined" &&
        window.confirm("Supprimer cet événement ?");
      if (ok) void onDelete();
      return;
    }
    Alert.alert("Supprimer l'événement ?", "Cette action est définitive.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => void onDelete(),
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[
            styles.modalSheet,
            {
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 400],
                  }),
                },
              ],
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {/* Drag handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editing ? "Modifier l'événement" : "Nouvel événement"}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {editing
                    ? "Ajustez les détails puis enregistrez"
                    : "Planifiez en quelques secondes"}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <X size={16} color="#fff" />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 460 }}
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Titre */}
              <Text style={styles.label}>Titre *</Text>
              <TextInput
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                placeholder="Ex. Réunion client, RDV médecin…"
                placeholderTextColor={T.faint}
                style={styles.input}
                autoFocus={!editing}
              />

              {/* Date + heures */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.label}>Date</Text>
                  <TextInput
                    value={form.date}
                    onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
                    placeholder="AAAA-MM-JJ"
                    placeholderTextColor={T.faint}
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Début</Text>
                  <TextInput
                    value={form.time}
                    onChangeText={(v) => setForm((f) => ({ ...f, time: v }))}
                    placeholder="09:00"
                    placeholderTextColor={T.faint}
                    style={[
                      styles.input,
                      !isTimeValid(form.time) && styles.inputError,
                    ]}
                    autoCapitalize="none"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Fin</Text>
                  <TextInput
                    value={form.endTime}
                    onChangeText={(v) => setForm((f) => ({ ...f, endTime: v }))}
                    placeholder="10:00"
                    placeholderTextColor={T.faint}
                    style={[
                      styles.input,
                      !isTimeValid(form.endTime) && styles.inputError,
                    ]}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Catégorie */}
              <Text style={[styles.label, { marginTop: 14 }]}>Catégorie</Text>
              <View style={styles.categoryGrid}>
                {(Object.keys(CATEGORY_META) as EventCategory[]).map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const active = form.category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() =>
                        setForm((f) => ({
                          ...f,
                          category: cat,
                          color: meta.color,
                        }))
                      }
                      style={({ pressed }) => [
                        styles.categoryChip,
                        {
                          borderColor: active ? meta.color : T.border,
                          backgroundColor: active ? meta.bg : "transparent",
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      {meta.icon(active ? meta.color : T.dim, 13)}
                      <Text
                        style={{
                          color: active ? meta.color : T.dim,
                          fontSize: 12.5,
                          fontWeight: "700",
                        }}
                      >
                        {cat}
                      </Text>
                      {active && <Check size={12} color={meta.color} />}
                    </Pressable>
                  );
                })}
              </View>

              {/* Note */}
              <Text style={[styles.label, { marginTop: 14 }]}>
                Note (optionnel)
              </Text>
              <TextInput
                value={form.note}
                onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
                placeholder="Détails supplémentaires…"
                placeholderTextColor={T.faint}
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.inputMultiline]}
              />

              {/* Rappel */}
              <View style={styles.reminderRow}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Bell size={15} color={form.reminder ? T.warning : T.faint} />
                  <Text
                    style={{
                      color: form.reminder ? T.warning : T.dim,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    Activer le rappel
                  </Text>
                </View>
                <Switch
                  value={form.reminder}
                  onValueChange={(v) => setForm((f) => ({ ...f, reminder: v }))}
                  trackColor={{
                    false: "rgba(255,255,255,0.12)",
                    true: "rgba(245,158,11,0.5)",
                  }}
                  thumbColor={form.reminder ? T.warning : "#f4f4f5"}
                />
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              {editing && (
                <Pressable
                  onPress={remove}
                  style={({ pressed }) => [
                    styles.deleteBtn,
                    { opacity: pressed ? 0.75 : 1 },
                  ]}
                >
                  <Trash2 size={16} color={T.danger} />
                </Pressable>
              )}

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>

              <Pressable
                onPress={save}
                disabled={!canSave || saving}
                style={({ pressed }) => [
                  styles.saveBtn,
                  {
                    opacity: !canSave || saving ? 0.45 : pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Check size={15} color="#fff" />
                )}
                <Text style={styles.saveText}>
                  {editing ? "Enregistrer" : "Créer"}
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   AGENDA INNER
   ════════════════════════════════════════════════════════════════════════════ */

function AgendaInner({ onBack }: AgendaPageProps) {
  const now = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"agendaEvents"> | null>(null);

  const emptyForm: FormState = useMemo(
    () => ({
      title: "",
      date: todayStr(),
      time: "09:00",
      endTime: "10:00",
      category: "Personnel",
      color: CATEGORY_META.Personnel.color,
      note: "",
      reminder: false,
    }),
    [],
  );
  const [form, setForm] = useState<FormState>(emptyForm);

  /* ── Données ───────────────────────────────────────────────────────────── */
  const eventsRaw = useQuery(api.utility.listMyAgendaEvents, {});
  const events = (eventsRaw ?? []) as unknown as AgendaEvent[];
  const isLoading = eventsRaw === undefined;

  const createEvent = useMutation(api.utility.createAgendaEvent);
  const updateEvent = useMutation(api.utility.updateAgendaEvent);
  const deleteEvent = useMutation(api.utility.deleteAgendaEvent);

  /* ── Dérivés ───────────────────────────────────────────────────────────── */
  const eventsByDate = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [events]);

  const eventsOnDate = (dateStr: string) => eventsByDate.get(dateStr) ?? [];

  const todayEvents = eventsOnDate(todayStr());
  const selectedEvents = eventsOnDate(selectedDate);

  const monthMatrix = useMemo(
    () => buildMonthMatrix(year, month),
    [year, month],
  );

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  /* ── Navigation ────────────────────────────────────────────────────────── */
  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  /* ── Actions ───────────────────────────────────────────────────────────── */
  const openNew = (date?: string) => {
    setEditingId(null);
    setForm({ ...emptyForm, date: date ?? selectedDate });
    setShowForm(true);
  };

  const openEdit = (event: AgendaEvent) => {
    setEditingId(event._id);
    setForm({
      title: event.title,
      date: event.date,
      time: event.time,
      endTime: event.endTime,
      category: event.category,
      color: event.color,
      note: event.note ?? "",
      reminder: event.reminder,
    });
    setShowForm(true);
  };

  const saveEvent = async (data: FormState) => {
    try {
      const payload = {
        ...data,
        note: data.note || undefined,
      };
      if (editingId) {
        await updateEvent({ id: editingId, ...payload });
        toast.success("Événement mis à jour");
      } else {
        await createEvent(payload);
        toast.success("Événement créé");
      }
      setShowForm(false);
      setEditingId(null);
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try {
      await deleteEvent({ id: editingId });
      toast.success("Événement supprimé");
      setShowForm(false);
      setEditingId(null);
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  /* ── Rendu ─────────────────────────────────────────────────────────────── */
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
            <ArrowLeft size={19} color="#fff" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Agenda</Text>
            <Text style={styles.subtitle}>
              {events.length} événement{events.length !== 1 ? "s" : ""} ·{" "}
              {selectedEvents.length} ce jour
            </Text>
          </View>

          <Pressable
            onPress={() => openNew()}
            style={({ pressed }) => [
              styles.addBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Plus size={18} color="#fff" />
          </Pressable>
        </View>

        {/* Bandeau du jour */}
        {todayEvents.length > 0 && (
          <View style={styles.todayBanner}>
            <Bell size={14} color={T.primarySoft} />
            <Text style={styles.todayBannerText} numberOfLines={2}>
              <Text style={{ fontWeight: "900", color: T.primarySoft }}>
                {todayEvents.length} événement
                {todayEvents.length > 1 ? "s" : ""}
              </Text>{" "}
              aujourd'hui — {todayEvents.map((e) => e.title).join(", ")}
            </Text>
          </View>
        )}

        {/* Segmented Month / Week */}
        <View style={styles.segmented}>
          {(["month", "week"] as ViewMode[]).map((v) => {
            const active = viewMode === v;
            return (
              <Pressable
                key={v}
                onPress={() => setViewMode(v)}
                style={[styles.segment, active && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, active && { color: "#fff" }]}>
                  {v === "month" ? "Mois" : "Semaine"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Contenu */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} style={{ height: 46, borderRadius: 14 }} />
            ))}
          </View>
        ) : (
          <>
            {/* ── VUE MOIS ─────────────────────────────────────────────── */}
            {viewMode === "month" && (
              <View style={styles.monthWrap}>
                <View style={styles.monthNav}>
                  <Pressable onPress={prevMonth} style={styles.navBtn}>
                    <ChevronLeft size={18} color={T.dim} />
                  </Pressable>
                  <Text style={styles.monthLabel}>
                    {formatMonthYear(year, month)}
                  </Text>
                  <Pressable onPress={nextMonth} style={styles.navBtn}>
                    <ChevronRight size={18} color={T.dim} />
                  </Pressable>
                </View>

                {/* En-têtes jours */}
                <View style={styles.dayHeaderRow}>
                  {DAY_LABELS.map((d) => (
                    <View
                      key={d}
                      style={{ width: CELL_SIZE, alignItems: "center" }}
                    >
                      <Text style={styles.dayHeaderText}>{d}</Text>
                    </View>
                  ))}
                </View>

                {/* Grille */}
                <View style={{ gap: GAP }}>
                  {monthMatrix.map((week, wi) => (
                    <View key={wi} style={{ flexDirection: "row", gap: GAP }}>
                      {week.map((day, di) => {
                        const dateStr =
                          day === null
                            ? ""
                            : `${year}-${String(month + 1).padStart(
                                2,
                                "0",
                              )}-${String(day).padStart(2, "0")}`;
                        return (
                          <DayCell
                            key={di}
                            day={day}
                            dateStr={dateStr}
                            isSelected={
                              day !== null && dateStr === selectedDate
                            }
                            isToday={day !== null && dateStr === todayStr()}
                            dots={
                              day === null
                                ? []
                                : eventsOnDate(dateStr).map((e) => e.color)
                            }
                            onPress={() =>
                              day !== null && setSelectedDate(dateStr)
                            }
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── VUE SEMAINE ──────────────────────────────────────────── */}
            {viewMode === "week" && (
              <View style={styles.monthWrap}>
                <View style={styles.monthNav}>
                  <Pressable
                    onPress={() => setSelectedDate(addDays(selectedDate, -7))}
                    style={styles.navBtn}
                  >
                    <ChevronLeft size={18} color={T.dim} />
                  </Pressable>
                  <Text style={styles.monthLabel}>
                    {new Date(`${weekDates[0]}T12:00:00`).toLocaleDateString(
                      "fr-FR",
                      { day: "numeric", month: "short" },
                    )}{" "}
                    –{" "}
                    {new Date(`${weekDates[6]}T12:00:00`).toLocaleDateString(
                      "fr-FR",
                      { day: "numeric", month: "short" },
                    )}
                  </Text>
                  <Pressable
                    onPress={() => setSelectedDate(addDays(selectedDate, 7))}
                    style={styles.navBtn}
                  >
                    <ChevronRight size={18} color={T.dim} />
                  </Pressable>
                </View>

                <View style={{ gap: 8, marginTop: 4 }}>
                  {weekDates.map((dateStr, i) => {
                    const evts = eventsOnDate(dateStr);
                    const isToday = dateStr === todayStr();
                    const isSelected = dateStr === selectedDate;
                    const dayNum = new Date(`${dateStr}T12:00:00`).getDate();

                    return (
                      <Pressable
                        key={dateStr}
                        onPress={() => setSelectedDate(dateStr)}
                        style={({ pressed }) => [
                          styles.weekRow,
                          {
                            backgroundColor: isSelected
                              ? "rgba(99,102,241,0.16)"
                              : isToday
                                ? "rgba(255,255,255,0.06)"
                                : "transparent",
                            borderColor: isSelected
                              ? "rgba(99,102,241,0.5)"
                              : T.border,
                            opacity: pressed ? 0.85 : 1,
                          },
                        ]}
                      >
                        <View style={styles.weekDayBox}>
                          <Text style={styles.weekDayLabel}>
                            {DAY_LABELS[i]}
                          </Text>
                          <Text
                            style={{
                              color: isToday ? T.primarySoft : T.text,
                              fontSize: 17,
                              fontWeight: "800",
                            }}
                          >
                            {dayNum}
                          </Text>
                        </View>

                        <View style={{ flex: 1, gap: 4 }}>
                          {evts.length === 0 ? (
                            <Text
                              style={{
                                color: T.faint,
                                fontSize: 11.5,
                                fontStyle: "italic",
                              }}
                            >
                              Aucun événement
                            </Text>
                          ) : (
                            evts.slice(0, 2).map((e) => (
                              <View
                                key={e._id}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <View
                                  style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: e.color,
                                  }}
                                />
                                <Text
                                  numberOfLines={1}
                                  style={{
                                    color: T.dim,
                                    fontSize: 12,
                                    fontWeight: "600",
                                    flex: 1,
                                  }}
                                >
                                  {e.time} · {e.title}
                                </Text>
                              </View>
                            ))
                          )}
                          {evts.length > 2 && (
                            <Text
                              style={{
                                color: T.primarySoft,
                                fontSize: 11,
                                fontWeight: "800",
                              }}
                            >
                              +{evts.length - 2} autre
                              {evts.length - 2 > 1 ? "s" : ""}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── LISTE DU JOUR SÉLECTIONNÉ ───────────────────────────── */}
            <View style={{ marginTop: 22 }}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>
                  {formatLongDate(selectedDate)}
                </Text>
                <Pressable
                  onPress={() => openNew(selectedDate)}
                  style={({ pressed }) => [
                    styles.dayAddBtn,
                    { opacity: pressed ? 0.75 : 1 },
                  ]}
                >
                  <Plus size={13} color={T.primarySoft} />
                  <Text style={styles.dayAddText}>Ajouter</Text>
                </Pressable>
              </View>

              {selectedEvents.length === 0 ? (
                <View style={styles.emptyDay}>
                  <View style={styles.emptyDayIcon}>
                    <Calendar size={26} color={T.faint} />
                  </View>
                  <Text style={styles.emptyDayText}>
                    Aucun événement ce jour
                  </Text>
                  <Pressable
                    onPress={() => openNew(selectedDate)}
                    style={({ pressed }) => [
                      styles.emptyDayBtn,
                      { opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Plus size={12} color="#fff" />
                    <Text style={styles.emptyDayBtnText}>
                      Créer un événement
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {selectedEvents.map((evt) => (
                    <EventCard
                      key={evt._id}
                      event={evt}
                      onPress={() => openEdit(evt)}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Légende */}
            <View style={styles.legend}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                <Tag size={11} color={T.faint} />
                <Text style={styles.legendTitle}>Catégories</Text>
              </View>
              <View style={styles.legendItems}>
                {(Object.keys(CATEGORY_META) as EventCategory[]).map((cat) => {
                  const meta = CATEGORY_META[cat];
                  return (
                    <View key={cat} style={styles.legendItem}>
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: meta.color,
                        }}
                      />
                      <Text style={styles.legendItemText}>{cat}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.legendFooter}>
                Données synchronisées en temps réel
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal */}
      <EventFormModal
        visible={showForm}
        editing={editingId !== null}
        initial={form}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        onSave={saveEvent}
        onDelete={handleDelete}
      />
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE WRAPPER — Auth gates
   ════════════════════════════════════════════════════════════════════════════ */

export default function AgendaPage({ onBack }: AgendaPageProps) {
  return (
    <>
      <Authenticated>
        <AgendaInner onBack={onBack} />
      </Authenticated>

      <Unauthenticated>
        <View style={styles.authGate}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.authBack,
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>

          <View style={styles.authIcon}>
            <Calendar size={34} color={T.primarySoft} />
          </View>

          <Text style={styles.authTitle}>Votre agenda vous attend</Text>
          <Text style={styles.authText}>
            Connectez-vous pour planifier, suivre et synchroniser vos événements
            personnels en temps réel.
          </Text>

          <View style={{ marginTop: 8 }}>
            <SignInButton />
          </View>
        </View>
      </Unauthenticated>

      <AuthLoading>
        <View style={[styles.root, styles.center]}>
          <View style={styles.authIcon}>
            <Loader2 size={26} color={T.primarySoft} />
          </View>
          <ActivityIndicator size="small" color={T.primarySoft} />
        </View>
      </AuthLoading>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { alignItems: "center", justifyContent: "center", gap: 14 },

  glow: {
    position: "absolute",
    top: -120,
    left: -80,
    right: -80,
    height: 300,
    borderRadius: 200,
    backgroundColor: "rgba(99,102,241,0.12)",
  },

  /* Header */
  header: { paddingTop: 56, paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: T.border,
  },
  title: {
    color: T.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: { color: T.faint, fontSize: 11.5, marginTop: 2 },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.primary,
    shadowColor: T.primary,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  /* Today banner */
  todayBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: "rgba(99,102,241,0.12)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.32)",
  },
  todayBannerText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12.5,
    flex: 1,
    lineHeight: 17,
  },

  /* Segmented */
  segmented: {
    flexDirection: "row",
    gap: 3,
    marginTop: 16,
    padding: 3,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 12,
  },
  segmentActive: { backgroundColor: T.primary },
  segmentText: { color: T.faint, fontSize: 12.5, fontWeight: "800" },

  /* Content */
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 80 },

  /* Month */
  monthWrap: {
    padding: 14,
    borderRadius: 24,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  monthLabel: {
    color: T.text,
    fontSize: 14.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  dayHeaderRow: {
    flexDirection: "row",
    gap: GAP,
    marginBottom: 8,
  },
  dayHeaderText: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  /* Week rows */
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  weekDayBox: {
    width: 46,
    alignItems: "center",
  },
  weekDayLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  /* Day section */
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dayTitle: {
    color: T.text,
    fontSize: 14.5,
    fontWeight: "800",
    letterSpacing: -0.2,
    flex: 1,
  },
  dayAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(99,102,241,0.14)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.28)",
  },
  dayAddText: {
    color: T.primarySoft,
    fontSize: 11.5,
    fontWeight: "800",
  },

  /* Event card */
  eventCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },

  /* Empty day */
  emptyDay: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    gap: 12,
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  emptyDayIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
  },
  emptyDayText: { color: T.dim, fontSize: 12.5, fontWeight: "600" },
  emptyDayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: T.primary,
  },
  emptyDayBtnText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  /* Legend */
  legend: {
    marginTop: 24,
    padding: 14,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  legendTitle: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendItemText: { color: T.dim, fontSize: 12, fontWeight: "600" },
  legendFooter: {
    color: T.faint,
    fontSize: 11,
    marginTop: 12,
    fontStyle: "italic",
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#0E0E14",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: T.borderUp,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 26,
    maxHeight: "92%",
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
    elevation: 20,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    color: T.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  modalSubtitle: { color: T.faint, fontSize: 11.5, marginTop: 3 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  label: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: T.text,
    fontSize: 13.5,
    marginBottom: 12,
  },
  inputError: {
    borderColor: "rgba(239,68,68,0.6)",
    backgroundColor: "rgba(239,68,68,0.06)",
  },
  inputMultiline: { minHeight: 72 },

  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },

  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
    marginTop: 8,
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  deleteBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.14)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  cancelText: { color: T.dim, fontSize: 13.5, fontWeight: "800" },
  saveBtn: {
    flex: 1.3,
    height: 48,
    borderRadius: 14,
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
  saveText: { color: "#fff", fontSize: 13.5, fontWeight: "900" },

  /* Auth gate */
  authGate: {
    flex: 1,
    backgroundColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  authBack: {
    position: "absolute",
    top: 56,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: T.border,
  },
  authIcon: {
    width: 78,
    height: 78,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.14)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.32)",
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

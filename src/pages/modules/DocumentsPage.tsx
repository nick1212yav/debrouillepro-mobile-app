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
  TextInput,
  View,
} from "react-native";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ElementType,
} from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  Filter,
  FolderOpen,
  Heart,
  Lock,
  Plus,
  Search,
  Shield,
  SortAsc,
  SortDesc,
  Trash2,
  X,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface DocumentsPageProps {
  onBack: () => void;
}

type DocCategory = "Identité" | "Santé" | "Finances" | "Emploi" | "Autres";

type SortField = "name" | "expiry" | "category";

type ExpiryStatus = "ok" | "warning" | "expired" | "none";

type VaultDoc = {
  _id: Id<"vaultDocuments">;
  name: string;
  category: DocCategory;
  reference?: string;
  expiry?: string;
  note?: string;
  createdAt: string;
};

type FormState = {
  name: string;
  category: DocCategory;
  reference: string;
  expiry: string;
  note: string;
};

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */

const T = {
  bg: "#07070C",
  sheet: "#0E0E14",
  card: "rgba(255,255,255,0.045)",
  border: "rgba(255,255,255,0.08)",
  borderUp: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.58)",
  faint: "rgba(255,255,255,0.32)",
  ghost: "rgba(255,255,255,0.18)",
  primary: "#8B5CF6",
  primarySoft: "#C4B5FD",
  indigo: "#6366F1",
  indigoSoft: "#A5B4FC",
  success: "#10B981",
  amber: "#F59E0B",
  amberSoft: "#FCD34D",
  danger: "#EF4444",
} as const;

const CATEGORY_META: Record<
  DocCategory,
  {
    color: string;
    icon: ElementType;
  }
> = {
  Identité: {
    color: "#6366F1",
    icon: CreditCard,
  },
  Santé: {
    color: "#10B981",
    icon: Heart,
  },
  Finances: {
    color: "#F59E0B",
    icon: FileText,
  },
  Emploi: {
    color: "#8B5CF6",
    icon: Briefcase,
  },
  Autres: {
    color: "#6B7280",
    icon: FolderOpen,
  },
};

const CATEGORIES = Object.keys(CATEGORY_META) as DocCategory[];

const SORT_LABEL: Record<SortField, string> = {
  name: "Nom",
  category: "Catégorie",
  expiry: "Expiration",
};

const EMPTY_FORM: FormState = {
  name: "",
  category: "Identité",
  reference: "",
  expiry: "",
  note: "",
};

const SCREEN_W = Dimensions.get("window").width;

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

function alpha(hex: string, opacity: number): string {
  const normalized = hex.replace("#", "");

  if (normalized.length !== 6) {
    return `rgba(255,255,255,${opacity})`;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red},${green},${blue},${opacity})`;
}

function todayStr(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split("-");

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function daysUntil(dateStr: string): number | null {
  if (!isValidDateOnly(dateStr)) {
    return null;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const [yearText, monthText, dayText] = dateStr.split("-");

  const target = new Date(
    Number(yearText),
    Number(monthText) - 1,
    Number(dayText),
  );

  target.setHours(0, 0, 0, 0);

  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

function expiryStatus(expiry?: string): ExpiryStatus {
  if (!expiry) {
    return "none";
  }

  const days = daysUntil(expiry);

  if (days === null) {
    return "none";
  }

  if (days < 0) {
    return "expired";
  }

  if (days <= 30) {
    return "warning";
  }

  return "ok";
}

function formatDate(dateStr: string): string {
  if (!dateStr || !isValidDateOnly(dateStr)) {
    return "—";
  }

  const [yearText, monthText, dayText] = dateStr.split("-");

  const date = new Date(
    Number(yearText),
    Number(monthText) - 1,
    Number(dayText),
  );

  try {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function normalizeFormState(initial?: FormState): FormState {
  if (!initial) {
    return { ...EMPTY_FORM };
  }

  const category = CATEGORIES.includes(initial.category)
    ? initial.category
    : EMPTY_FORM.category;

  return {
    name: initial.name ?? "",
    category,
    reference: initial.reference ?? "",
    expiry: initial.expiry ?? "",
    note: initial.note ?? "",
  };
}

/* ════════════════════════════════════════════════════════════════════════════
   SKELETON
   ════════════════════════════════════════════════════════════════════════════ */

function Skeleton({
  style,
}: {
  style?: ComponentProps<typeof Animated.View>["style"];
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

    return () => {
      loop.stop();
    };
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

/* ════════════════════════════════════════════════════════════════════════════
   EMPTY STATE
   ════════════════════════════════════════════════════════════════════════════ */

function EmptyState({
  icon: Icon,
  title,
  message,
  ctaLabel,
  onCta,
}: {
  icon: ElementType;
  title: string;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon size={30} color={T.faint} />
      </View>

      <Text style={styles.emptyTitle}>{title}</Text>

      <Text style={styles.emptyMessage}>{message}</Text>

      {ctaLabel && onCta ? (
        <Pressable
          onPress={onCta}
          style={({ pressed }) => [
            styles.emptyCta,
            {
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <Plus size={14} color={T.primarySoft} />
          <Text style={styles.emptyCtaText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   EXPIRY BADGE
   ════════════════════════════════════════════════════════════════════════════ */

function ExpiryBadge({
  status,
  days,
}: {
  status: ExpiryStatus;
  days: number | null;
}) {
  if (status === "none" || status === "ok") {
    return null;
  }

  const isExpired = status === "expired";
  const color = isExpired ? T.danger : T.amber;

  const label = isExpired
    ? `Expiré il y a ${Math.abs(days ?? 0)} j`
    : days !== null
      ? `Expire dans ${days} j`
      : "Bientôt expiré";

  return (
    <View
      style={[
        styles.expiryBadge,
        {
          backgroundColor: alpha(color, 0.16),
          borderColor: alpha(color, 0.32),
        },
      ]}
    >
      <View style={[styles.expiryDot, { backgroundColor: color }]} />

      <Text style={[styles.expiryText, { color }]}>{label}</Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DOCUMENT CARD
   ════════════════════════════════════════════════════════════════════════════ */

function DocCard({
  doc,
  index,
  expanded,
  masked,
  confirmDelete,
  onToggle,
  onEdit,
  onDelete,
  onDeleteConfirm,
  onDeleteCancel,
  onToggleMask,
}: {
  doc: VaultDoc;
  index: number;
  expanded: boolean;
  masked: boolean;
  confirmDelete: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onToggleMask: () => void;
}) {
  const meta = CATEGORY_META[doc.category] ?? CATEGORY_META.Autres;
  const status = expiryStatus(doc.expiry);
  const Icon = meta.icon;
  const days = doc.expiry ? daysUntil(doc.expiry) : null;

  const enter = useRef(new Animated.Value(0)).current;

  const expandAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 340,
      delay: Math.min(index * 45, 400),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [expanded, expandAnim]);

  const statusColor =
    status === "expired"
      ? T.danger
      : status === "warning"
        ? T.amber
        : status === "ok"
          ? T.success
          : T.faint;

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          {
            translateY: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
        marginBottom: 10,
      }}
    >
      <View
        style={[
          styles.docCard,
          {
            borderColor: expanded ? alpha(meta.color, 0.34) : T.border,
            backgroundColor: expanded ? alpha(meta.color, 0.06) : T.card,
          },
        ]}
      >
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={`Ouvrir ${doc.name}`}
          style={({ pressed }) => [
            styles.docHeader,
            {
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.docIcon,
              {
                backgroundColor: alpha(meta.color, 0.18),
              },
            ]}
          >
            <Icon size={16} color={meta.color} />
          </View>

          <View style={styles.docHeaderMain}>
            <Text numberOfLines={1} style={styles.docName}>
              {doc.name}
            </Text>

            <View style={styles.docMetaRow}>
              <Text
                style={[
                  styles.docCategory,
                  {
                    color: meta.color,
                  },
                ]}
              >
                {doc.category}
              </Text>

              {status !== "none" ? (
                <>
                  <View style={styles.docMetaDot} />

                  {status === "expired" ? (
                    <AlertTriangle size={11} color={T.danger} />
                  ) : status === "warning" ? (
                    <CalendarClock size={11} color={T.amberSoft} />
                  ) : (
                    <CheckCircle2 size={11} color={T.success} />
                  )}

                  <Text
                    style={[
                      styles.docStatusText,
                      {
                        color: statusColor,
                      },
                    ]}
                  >
                    {status === "expired"
                      ? "Expiré"
                      : days !== null
                        ? `${days} j`
                        : "OK"}
                  </Text>
                </>
              ) : null}
            </View>
          </View>

          <View style={styles.docHeaderRight}>
            <Lock size={11} color={T.ghost} />

            <Animated.View
              style={{
                transform: [
                  {
                    rotate: expandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "180deg"],
                    }),
                  },
                ],
              }}
            >
              <ChevronDown size={15} color={T.faint} />
            </Animated.View>
          </View>
        </Pressable>

        <Animated.View
          style={{
            maxHeight: expandAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 520],
            }),
            opacity: expandAnim,
            overflow: "hidden",
          }}
        >
          <View style={styles.docBody}>
            {doc.reference ? (
              <View style={styles.docInfoRow}>
                <Text style={styles.docInfoLabel}>Référence</Text>

                <View style={styles.docRefValueWrap}>
                  <Text style={styles.docRefValue}>
                    {masked ? "••••••••••" : doc.reference}
                  </Text>

                  <Pressable
                    onPress={onToggleMask}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={
                      masked ? "Afficher la référence" : "Masquer la référence"
                    }
                  >
                    {masked ? (
                      <Eye size={13} color={T.faint} />
                    ) : (
                      <EyeOff size={13} color={T.faint} />
                    )}
                  </Pressable>
                </View>
              </View>
            ) : null}

            {doc.expiry ? (
              <View style={styles.docInfoRow}>
                <Text style={styles.docInfoLabel}>Expiration</Text>

                <View style={styles.expiryValue}>
                  <Text
                    style={[
                      styles.docInfoValue,
                      {
                        color: statusColor,
                      },
                    ]}
                  >
                    {formatDate(doc.expiry)}
                  </Text>

                  {days !== null ? (
                    <Text
                      style={[
                        styles.docInfoValue,
                        {
                          color: statusColor,
                          marginTop: 2,
                        },
                      ]}
                    >
                      {days < 0
                        ? `Dépassé de ${Math.abs(days)} j`
                        : `Dans ${days} j`}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {doc.note ? (
              <View style={styles.docInfoRow}>
                <Text style={styles.docInfoLabel}>Note</Text>

                <Text
                  style={[
                    styles.docInfoValue,
                    {
                      maxWidth: "62%",
                    },
                  ]}
                  numberOfLines={3}
                >
                  {doc.note}
                </Text>
              </View>
            ) : null}

            <View style={styles.docInfoRow}>
              <Text
                style={[
                  styles.docInfoLabel,
                  {
                    color: T.ghost,
                  },
                ]}
              >
                Ajouté le
              </Text>

              <Text
                style={[
                  styles.docInfoValue,
                  {
                    color: T.ghost,
                  },
                ]}
              >
                {formatDate(doc.createdAt)}
              </Text>
            </View>

            {!confirmDelete ? (
              <View style={styles.docActions}>
                <Pressable
                  onPress={onEdit}
                  style={({ pressed }) => [
                    styles.docActionBtn,
                    {
                      backgroundColor: "rgba(255,255,255,0.06)",
                      borderColor: T.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Edit2 size={13} color={T.dim} />

                  <Text
                    style={[
                      styles.docActionText,
                      {
                        color: T.dim,
                      },
                    ]}
                  >
                    Modifier
                  </Text>
                </Pressable>

                <Pressable
                  onPress={onDelete}
                  style={({ pressed }) => [
                    styles.docActionBtn,
                    {
                      backgroundColor: alpha(T.danger, 0.1),
                      borderColor: alpha(T.danger, 0.3),
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Trash2 size={13} color="#F87171" />

                  <Text
                    style={[
                      styles.docActionText,
                      {
                        color: "#F87171",
                      },
                    ]}
                  >
                    Supprimer
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.confirmBox}>
                <View style={styles.confirmHead}>
                  <AlertTriangle size={14} color="#F87171" />

                  <Text style={styles.confirmTitle}>
                    Supprimer définitivement ?
                  </Text>
                </View>

                <View style={styles.confirmActions}>
                  <Pressable
                    onPress={onDeleteCancel}
                    style={({ pressed }) => [
                      styles.confirmCancel,
                      {
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.confirmCancelText}>Annuler</Text>
                  </Pressable>

                  <Pressable
                    onPress={onDeleteConfirm}
                    style={({ pressed }) => [
                      styles.confirmDelete,
                      {
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Trash2 size={12} color="#fff" />

                    <Text style={styles.confirmDeleteText}>Supprimer</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   FORM MODAL
   ════════════════════════════════════════════════════════════════════════════ */

function DocumentFormModal({
  visible,
  editing,
  initial,
  onClose,
  onSave,
}: {
  visible: boolean;
  editing: boolean;
  initial?: FormState;
  onClose: () => void;
  onSave: (data: FormState) => Promise<void>;
}) {
  const safeInitial = useMemo(() => normalizeFormState(initial), [initial]);

  const [form, setForm] = useState<FormState>(safeInitial);

  const [saving, setSaving] = useState(false);

  const slide = useRef(new Animated.Value(visible ? 0 : 1)).current;

  useEffect(() => {
    if (visible) {
      setForm(safeInitial);
    }

    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [safeInitial, slide, visible]);

  const trimmedName = form.name.trim();
  const trimmedExpiry = form.expiry.trim();

  const expiryIsValid =
    trimmedExpiry.length === 0 || isValidDateOnly(trimmedExpiry);

  const canSave = trimmedName.length >= 2 && expiryIsValid;

  const submit = async () => {
    if (!canSave || saving) {
      return;
    }

    setSaving(true);

    try {
      await onSave({
        name: trimmedName,
        category: form.category,
        reference: form.reference.trim(),
        expiry: trimmedExpiry,
        note: form.note.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={saving ? undefined : onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={saving ? undefined : onClose}
        />

        <Animated.View
          style={[
            styles.modalSheet,
            {
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.max(SCREEN_W * 1.8, 800)],
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

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderIcon}>
                <Lock size={17} color={T.indigoSoft} />
              </View>

              <View style={styles.sheetHeaderMain}>
                <Text style={styles.sheetTitle}>
                  {editing ? "Modifier le document" : "Nouveau document"}
                </Text>

                <Text style={styles.sheetSubtitle}>
                  {editing
                    ? "Mets à jour les informations"
                    : "Ajoute un document à ton coffre-fort"}
                </Text>
              </View>

              <Pressable
                onPress={onClose}
                disabled={saving}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.sheetCloseBtn,
                  {
                    opacity: pressed ? 0.7 : saving ? 0.45 : 1,
                  },
                ]}
              >
                <X size={16} color="#fff" />
              </Pressable>
            </View>

            <ScrollView
              style={{
                maxHeight: 460,
              }}
              contentContainerStyle={{
                paddingBottom: 12,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formContent}>
                <View>
                  <Text style={styles.fieldLabel}>Nom du document *</Text>

                  <TextInput
                    value={form.name}
                    onChangeText={(value) =>
                      setForm((current) => ({
                        ...current,
                        name: value,
                      }))
                    }
                    placeholder="Ex. Passeport, Carnet de santé…"
                    placeholderTextColor={T.faint}
                    style={styles.input}
                    autoFocus
                    maxLength={80}
                    returnKeyType="next"
                  />
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Catégorie</Text>

                  <View style={styles.catGrid}>
                    {CATEGORIES.map((category) => {
                      const meta = CATEGORY_META[category];

                      const Icon = meta.icon;

                      const active = form.category === category;

                      return (
                        <Pressable
                          key={category}
                          onPress={() =>
                            setForm((current) => ({
                              ...current,
                              category,
                            }))
                          }
                          style={({ pressed }) => [
                            styles.catChip,
                            {
                              backgroundColor: active
                                ? alpha(meta.color, 0.16)
                                : "rgba(255,255,255,0.04)",
                              borderColor: active
                                ? alpha(meta.color, 0.5)
                                : T.border,
                              opacity: pressed ? 0.85 : 1,
                            },
                          ]}
                        >
                          <Icon
                            size={14}
                            color={active ? meta.color : T.faint}
                          />

                          <Text
                            style={{
                              color: active ? meta.color : T.dim,
                              fontSize: 12,
                              fontWeight: active ? "900" : "700",
                            }}
                          >
                            {category}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Numéro / Référence</Text>

                  <TextInput
                    value={form.reference}
                    onChangeText={(value) =>
                      setForm((current) => ({
                        ...current,
                        reference: value,
                      }))
                    }
                    placeholder="Ex. CI-2024-00123456"
                    placeholderTextColor={T.faint}
                    style={styles.input}
                    maxLength={60}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Date d'expiration</Text>

                  <TextInput
                    value={form.expiry}
                    onChangeText={(value) =>
                      setForm((current) => ({
                        ...current,
                        expiry: value,
                      }))
                    }
                    placeholder="AAAA-MM-JJ"
                    placeholderTextColor={T.faint}
                    style={[
                      styles.input,
                      !expiryIsValid && form.expiry.length > 0
                        ? styles.inputError
                        : undefined,
                    ]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                  />

                  {!expiryIsValid && form.expiry.length > 0 ? (
                    <Text style={styles.validationError}>
                      Utilise une date valide au format AAAA-MM-JJ.
                    </Text>
                  ) : null}
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Note</Text>

                  <TextInput
                    value={form.note}
                    onChangeText={(value) =>
                      setForm((current) => ({
                        ...current,
                        note: value,
                      }))
                    }
                    placeholder="Informations supplémentaires…"
                    placeholderTextColor={T.faint}
                    style={[styles.input, styles.inputMulti]}
                    multiline
                    textAlignVertical="top"
                    maxLength={400}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.sheetActions}>
              <Pressable
                onPress={onClose}
                disabled={saving}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  {
                    opacity: saving ? 0.5 : pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>

              <Pressable
                onPress={submit}
                disabled={!canSave || saving}
                style={({ pressed }) => [
                  styles.saveBtn,
                  {
                    opacity: !canSave || saving ? 0.4 : pressed ? 0.85 : 1,
                    transform: [
                      {
                        scale: pressed ? 0.98 : 1,
                      },
                    ],
                  },
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Lock size={15} color="#fff" />
                )}

                <Text style={styles.saveBtnText}>
                  {saving
                    ? "Enregistrement…"
                    : editing
                      ? "Enregistrer"
                      : "Ajouter"}
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
   INNER PAGE
   ════════════════════════════════════════════════════════════════════════════ */

function DocumentsInner({ onBack }: DocumentsPageProps) {
  const docs = useQuery(api.utility.listMyVaultDocs, {});

  const createDoc = useMutation(api.utility.createVaultDoc);

  const updateDoc = useMutation(api.utility.updateVaultDoc);

  const deleteDoc = useMutation(api.utility.deleteVaultDoc);

  const [searchInput, setSearchInput] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filterCat, setFilterCat] = useState<DocCategory | "Tout">("Tout");

  const [sortBy, setSortBy] = useState<SortField>("category");

  const [sortAsc, setSortAsc] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [editId, setEditId] = useState<Id<"vaultDocuments"> | null>(null);

  const [form, setForm] = useState<FormState>({
    ...EMPTY_FORM,
  });

  const [expandedId, setExpandedId] = useState<Id<"vaultDocuments"> | null>(
    null,
  );

  const [maskedIds, setMaskedIds] = useState<Set<string>>(
    () => new Set<string>(),
  );

  const [showFilter, setShowFilter] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] =
    useState<Id<"vaultDocuments"> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchInput]);

  const isLoading = docs === undefined;

  const docList = useMemo<VaultDoc[]>(() => docs ?? [], [docs]);

  const alerts = useMemo(
    () =>
      docList.filter((doc) => {
        const status = expiryStatus(doc.expiry);

        return status === "warning" || status === "expired";
      }),
    [docList],
  );

  const filtered = useMemo(() => {
    const query = debouncedSearch.toLowerCase();

    const list = docList.filter((doc) => {
      const matchQuery =
        !query ||
        doc.name.toLowerCase().includes(query) ||
        (doc.reference ?? "").toLowerCase().includes(query) ||
        doc.category.toLowerCase().includes(query);

      const matchCategory = filterCat === "Tout" || doc.category === filterCat;

      return matchQuery && matchCategory;
    });

    return [...list].sort((first, second) => {
      let comparison = 0;

      if (sortBy === "name") {
        comparison = first.name.localeCompare(second.name, "fr", {
          sensitivity: "base",
        });
      } else if (sortBy === "category") {
        comparison = first.category.localeCompare(second.category, "fr", {
          sensitivity: "base",
        });
      } else {
        const firstExpiry = first.expiry ?? "9999-12-31";

        const secondExpiry = second.expiry ?? "9999-12-31";

        comparison = firstExpiry.localeCompare(secondExpiry);
      }

      return sortAsc ? comparison : -comparison;
    });
  }, [docList, debouncedSearch, filterCat, sortBy, sortAsc]);

  const catGroups = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        items: filtered.filter((doc) => doc.category === category),
      })).filter((group) => group.items.length > 0),
    [filtered],
  );

  const openNew = useCallback(() => {
    setEditId(null);
    setForm({
      ...EMPTY_FORM,
    });
    setShowForm(true);
  }, []);

  const openEdit = useCallback((doc: VaultDoc) => {
    setEditId(doc._id);

    setForm({
      name: doc.name,
      category: CATEGORIES.includes(doc.category) ? doc.category : "Autres",
      reference: doc.reference ?? "",
      expiry: doc.expiry ?? "",
      note: doc.note ?? "",
    });

    setShowForm(true);
  }, []);

  const saveDoc = useCallback(
    async (data: FormState) => {
      const name = data.name.trim();
      const reference = data.reference.trim();
      const expiry = data.expiry.trim();
      const note = data.note.trim();

      if (name.length < 2) {
        toast.error("Le nom du document est trop court.");
        return;
      }

      if (expiry.length > 0 && !isValidDateOnly(expiry)) {
        toast.error("La date d'expiration est invalide.");
        return;
      }

      try {
        const payload = {
          name,
          category: data.category,
          reference: reference.length > 0 ? reference : undefined,
          expiry: expiry.length > 0 ? expiry : undefined,
          note: note.length > 0 ? note : undefined,
        };

        if (editId !== null) {
          await updateDoc({
            id: editId,
            ...payload,
          });

          toast.success("Document mis à jour.");
        } else {
          await createDoc({
            ...payload,
            createdAt: todayStr(),
          });

          toast.success("Document ajouté.");
        }

        setShowForm(false);
        setEditId(null);
      } catch {
        toast.error("Impossible d'enregistrer le document.");
      }
    },
    [createDoc, editId, updateDoc],
  );

  const handleDelete = useCallback(
    async (id: Id<"vaultDocuments">) => {
      try {
        await deleteDoc({
          id,
        });

        toast.success("Document supprimé.");

        setDeleteConfirmId(null);
        setExpandedId(null);

        setMaskedIds((current) => {
          const next = new Set(current);

          next.delete(id);

          return next;
        });
      } catch {
        toast.error("Impossible de supprimer le document.");
      }
    },
    [deleteDoc],
  );

  const toggleMask = useCallback((id: string) => {
    setMaskedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }, []);

  const toggleExpanded = useCallback((id: Id<"vaultDocuments">) => {
    setExpandedId((current) => (current === id ? null : id));

    setDeleteConfirmId(null);
  }, []);

  const handleSortChange = useCallback(
    (field: SortField) => {
      if (sortBy === field) {
        setSortAsc((current) => !current);
        return;
      }

      setSortBy(field);
      setSortAsc(true);
    },
    [sortBy],
  );

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setFilterCat("Tout");
    setShowFilter(false);
  }, []);

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glow} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={({ pressed }) => [
              styles.backBtn,
              {
                transform: [
                  {
                    scale: pressed ? 0.92 : 1,
                  },
                ],
              },
            ]}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>

          <View style={styles.headerMain}>
            <View style={styles.headerTitleRow}>
              <Lock size={16} color={T.indigoSoft} />

              <Text style={styles.title}>Coffre-fort</Text>
            </View>

            <Text style={styles.subtitle}>
              {docList.length} document
              {docList.length !== 1 ? "s" : ""} stocké
              {docList.length !== 1 ? "s" : ""}
            </Text>
          </View>

          <Pressable
            onPress={openNew}
            accessibilityRole="button"
            accessibilityLabel="Ajouter un document"
            style={({ pressed }) => [
              styles.addBtn,
              {
                transform: [
                  {
                    scale: pressed ? 0.92 : 1,
                  },
                ],
              },
            ]}
          >
            <Plus size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* SECURITY */}
        <View style={styles.securityBanner}>
          <View style={styles.securityIcon}>
            <Shield size={16} color={T.indigoSoft} />
          </View>

          <View style={styles.securityMain}>
            <Text style={styles.securityTitle}>Coffre-fort Débrouille Pro</Text>

            <Text style={styles.securitySubtitle}>
              Tes données sont accessibles uniquement depuis ton compte.
            </Text>
          </View>

          <View style={styles.securePill}>
            <View style={styles.secureDot} />

            <Text style={styles.securePillText}>Protégé</Text>
          </View>
        </View>

        {/* ALERTS */}
        {alerts.length > 0 ? (
          <View style={styles.alertsCard}>
            <View style={styles.alertsHead}>
              <AlertTriangle size={14} color={T.amberSoft} />

              <Text style={styles.alertsTitle}>
                {alerts.length} document
                {alerts.length > 1 ? "s" : ""} à renouveler
              </Text>
            </View>

            <View style={styles.alertList}>
              {alerts.map((doc) => {
                const days = doc.expiry ? daysUntil(doc.expiry) : null;

                if (days === null) {
                  return null;
                }

                const expired = days < 0;

                return (
                  <View key={doc._id} style={styles.alertRow}>
                    <Text numberOfLines={1} style={styles.alertDocName}>
                      {doc.name}
                    </Text>

                    <View
                      style={[
                        styles.alertBadge,
                        {
                          backgroundColor: expired
                            ? alpha(T.danger, 0.16)
                            : alpha(T.amber, 0.16),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.alertBadgeText,
                          {
                            color: expired ? "#F87171" : T.amberSoft,
                          },
                        ]}
                      >
                        {expired
                          ? `Expiré il y a ${Math.abs(days)} j`
                          : `Expire dans ${days} j`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* LOADING */}
        {isLoading ? (
          <View style={styles.loadingList}>
            {[0, 1, 2, 3, 4].map((index) => (
              <Skeleton
                key={index}
                style={{
                  height: 70,
                  borderRadius: 18,
                }}
              />
            ))}
          </View>
        ) : (
          <>
            {/* STATS */}
            <View style={styles.statsGrid}>
              {CATEGORIES.slice(0, 3).map((category) => {
                const meta = CATEGORY_META[category];

                const Icon = meta.icon;

                const count = docList.filter(
                  (doc) => doc.category === category,
                ).length;

                const active = filterCat === category;

                return (
                  <Pressable
                    key={category}
                    onPress={() => setFilterCat(active ? "Tout" : category)}
                    style={({ pressed }) => [
                      styles.statBox,
                      {
                        backgroundColor: active
                          ? alpha(meta.color, 0.14)
                          : T.card,
                        borderColor: active
                          ? alpha(meta.color, 0.42)
                          : T.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Icon size={16} color={meta.color} />

                    <Text style={styles.statValue}>{count}</Text>

                    <Text style={styles.statLabel} numberOfLines={1}>
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* SEARCH */}
            <View style={styles.searchRow}>
              <View style={styles.searchWrap}>
                <Search size={15} color={T.faint} />

                <TextInput
                  value={searchInput}
                  onChangeText={setSearchInput}
                  placeholder="Rechercher un document…"
                  placeholderTextColor={T.faint}
                  style={styles.searchInput}
                  autoCorrect={false}
                  returnKeyType="search"
                />

                {searchInput.length > 0 ? (
                  <Pressable
                    onPress={() => setSearchInput("")}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Effacer la recherche"
                  >
                    <X size={15} color={T.faint} />
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                onPress={() => setShowFilter((current) => !current)}
                accessibilityRole="button"
                accessibilityLabel="Afficher les filtres"
                style={({ pressed }) => [
                  styles.filterBtn,
                  showFilter
                    ? {
                        backgroundColor: alpha(T.indigo, 0.24),
                        borderColor: alpha(T.indigo, 0.5),
                      }
                    : {
                        backgroundColor: "rgba(255,255,255,0.05)",
                        borderColor: T.border,
                      },
                  {
                    opacity: pressed ? 0.85 : 1,
                    transform: [
                      {
                        scale: pressed ? 0.94 : 1,
                      },
                    ],
                  },
                ]}
              >
                <Filter size={16} color={showFilter ? T.indigoSoft : T.dim} />
              </Pressable>
            </View>

            {/* FILTER PANEL */}
            {showFilter ? (
              <View style={styles.filtersPanel}>
                <Text style={styles.filterLabel}>Catégorie</Text>

                <View style={styles.filterChipsWrap}>
                  {["Tout", ...CATEGORIES].map((category) => {
                    const active = filterCat === category;

                    const meta =
                      category !== "Tout"
                        ? CATEGORY_META[category as DocCategory]
                        : undefined;

                    const color = meta?.color ?? T.indigo;

                    return (
                      <Pressable
                        key={category}
                        onPress={() =>
                          setFilterCat(category as DocCategory | "Tout")
                        }
                        style={({ pressed }) => [
                          styles.filterChip,
                          {
                            backgroundColor: active
                              ? alpha(color, 0.16)
                              : "rgba(255,255,255,0.04)",
                            borderColor: active ? alpha(color, 0.45) : T.border,
                            opacity: pressed ? 0.85 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: active ? color : T.dim,
                            fontSize: 12,
                            fontWeight: active ? "900" : "700",
                          }}
                        >
                          {category}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text
                  style={[
                    styles.filterLabel,
                    {
                      marginTop: 14,
                    },
                  ]}
                >
                  Trier par
                </Text>

                <View style={styles.filterChipsWrap}>
                  {(["name", "category", "expiry"] as SortField[]).map(
                    (field) => {
                      const active = sortBy === field;

                      return (
                        <Pressable
                          key={field}
                          onPress={() => handleSortChange(field)}
                          style={({ pressed }) => [
                            styles.filterChip,
                            {
                              backgroundColor: active
                                ? alpha(T.indigo, 0.16)
                                : "rgba(255,255,255,0.04)",
                              borderColor: active
                                ? alpha(T.indigo, 0.45)
                                : T.border,
                              opacity: pressed ? 0.85 : 1,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: active ? T.indigoSoft : T.dim,
                              fontSize: 12,
                              fontWeight: active ? "900" : "700",
                            }}
                          >
                            {SORT_LABEL[field]}
                          </Text>

                          {active ? (
                            sortAsc ? (
                              <SortAsc size={11} color={T.indigoSoft} />
                            ) : (
                              <SortDesc size={11} color={T.indigoSoft} />
                            )
                          ) : null}
                        </Pressable>
                      );
                    },
                  )}
                </View>
              </View>
            ) : null}

            {/* DOCUMENT LIST */}
            <View style={styles.documentList}>
              {filtered.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title="Aucun document"
                  message={
                    debouncedSearch || filterCat !== "Tout"
                      ? "Essaie un autre mot-clé ou change les filtres."
                      : "Ajoute ton premier document au coffre-fort."
                  }
                  ctaLabel="Ajouter un document"
                  onCta={openNew}
                />
              ) : filterCat === "Tout" ? (
                catGroups.map((group) => {
                  const meta = CATEGORY_META[group.category];

                  const Icon = meta.icon;

                  return (
                    <View key={group.category} style={styles.categoryGroup}>
                      <View style={styles.groupHead}>
                        <View
                          style={[
                            styles.groupIcon,
                            {
                              backgroundColor: alpha(meta.color, 0.16),
                            },
                          ]}
                        >
                          <Icon size={12} color={meta.color} />
                        </View>

                        <Text
                          style={[
                            styles.groupLabel,
                            {
                              color: meta.color,
                            },
                          ]}
                        >
                          {group.category}
                        </Text>

                        <View style={styles.groupCountPill}>
                          <Text style={styles.groupCountText}>
                            {group.items.length}
                          </Text>
                        </View>
                      </View>

                      {group.items.map((doc, index) => (
                        <DocCard
                          key={doc._id}
                          doc={doc}
                          index={index}
                          expanded={expandedId === doc._id}
                          masked={maskedIds.has(doc._id)}
                          confirmDelete={deleteConfirmId === doc._id}
                          onToggle={() => toggleExpanded(doc._id)}
                          onEdit={() => openEdit(doc)}
                          onDelete={() => setDeleteConfirmId(doc._id)}
                          onDeleteConfirm={() => handleDelete(doc._id)}
                          onDeleteCancel={() => setDeleteConfirmId(null)}
                          onToggleMask={() => toggleMask(doc._id)}
                        />
                      ))}
                    </View>
                  );
                })
              ) : (
                <View>
                  {filtered.map((doc, index) => (
                    <DocCard
                      key={doc._id}
                      doc={doc}
                      index={index}
                      expanded={expandedId === doc._id}
                      masked={maskedIds.has(doc._id)}
                      confirmDelete={deleteConfirmId === doc._id}
                      onToggle={() => toggleExpanded(doc._id)}
                      onEdit={() => openEdit(doc)}
                      onDelete={() => setDeleteConfirmId(doc._id)}
                      onDeleteConfirm={() => handleDelete(doc._id)}
                      onDeleteCancel={() => setDeleteConfirmId(null)}
                      onToggleMask={() => toggleMask(doc._id)}
                    />
                  ))}
                </View>
              )}
            </View>

            {filtered.length > 0 &&
            (debouncedSearch || filterCat !== "Tout") ? (
              <Pressable
                onPress={clearFilters}
                style={({ pressed }) => [
                  styles.clearFiltersBtn,
                  {
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <X size={13} color={T.faint} />

                <Text style={styles.clearFiltersText}>
                  Réinitialiser les filtres
                </Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>

      <DocumentFormModal
        visible={showForm}
        editing={editId !== null}
        initial={form}
        onClose={() => {
          if (showForm) {
            setShowForm(false);
          }

          setEditId(null);
        }}
        onSave={saveDoc}
      />
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   EXPORT
   ════════════════════════════════════════════════════════════════════════════ */

export default function DocumentsPage({ onBack }: DocumentsPageProps) {
  return (
    <>
      <Authenticated>
        <DocumentsInner onBack={onBack} />
      </Authenticated>

      <Unauthenticated>
        <View style={styles.authGate}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={({ pressed }) => [
              styles.authBackBtn,
              {
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>

          <View style={styles.authIcon}>
            <Lock size={32} color={T.indigoSoft} />
          </View>

          <Text style={styles.authTitle}>Coffre-fort sécurisé</Text>

          <Text style={styles.authText}>
            Connecte-toi pour stocker tes informations personnelles : identité,
            santé, finances et plus.
          </Text>

          <View
            style={{
              marginTop: 10,
            }}
          >
            <SignInButton />
          </View>
        </View>
      </Unauthenticated>

      <AuthLoading>
        <View style={[styles.root, styles.center]}>
          <ActivityIndicator size="small" color={T.indigoSoft} />
        </View>
      </AuthLoading>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
  },

  glow: {
    position: "absolute",
    top: -150,
    left: -80,
    right: -80,
    height: 320,
    borderRadius: 220,
    backgroundColor: alpha(T.indigo, 0.12),
  },

  /* HEADER */

  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  headerMain: {
    flex: 1,
    minWidth: 0,
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

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

  subtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: "600",
  },

  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.indigo,
    shadowColor: T.indigo,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 6,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 60,
  },

  /* SECURITY */

  securityBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: alpha(T.indigo, 0.08),
    borderWidth: 1,
    borderColor: alpha(T.indigo, 0.24),
  },

  securityIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.indigo, 0.18),
  },

  securityMain: {
    flex: 1,
    minWidth: 0,
  },

  securityTitle: {
    color: T.indigoSoft,
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: -0.1,
  },

  securitySubtitle: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 2,
    lineHeight: 15,
  },

  securePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: alpha(T.success, 0.14),
    borderWidth: 1,
    borderColor: alpha(T.success, 0.3),
  },

  secureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },

  securePillText: {
    color: "#4ADE80",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  /* ALERTS */

  alertsCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: alpha(T.amber, 0.07),
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.28),
  },

  alertsHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  alertsTitle: {
    color: T.amberSoft,
    fontSize: 12.5,
    fontWeight: "900",
    letterSpacing: -0.1,
  },

  alertList: {
    gap: 6,
    marginTop: 10,
  },

  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 4,
  },

  alertDocName: {
    color: T.dim,
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },

  alertBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },

  alertBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  /* LOADING */

  loadingList: {
    gap: 10,
    marginTop: 18,
  },

  /* STATS */

  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },

  statValue: {
    color: T.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  statLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  /* SEARCH */

  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },

  searchInput: {
    flex: 1,
    color: T.text,
    fontSize: 13.5,
    paddingVertical: 0,
  },

  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  /* FILTERS */

  filtersPanel: {
    marginTop: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },

  filterLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  filterChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },

  /* DOCUMENT LIST */

  documentList: {
    marginTop: 18,
  },

  categoryGroup: {
    marginBottom: 20,
  },

  groupHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  groupIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  groupLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  groupCountPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  groupCountText: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "900",
  },

  /* DOCUMENT CARD */

  docCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },

  docHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },

  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  docHeaderMain: {
    flex: 1,
    minWidth: 0,
  },

  docName: {
    color: T.text,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  docMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },

  docCategory: {
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  docMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: T.ghost,
  },

  docStatusText: {
    fontSize: 10.5,
    fontWeight: "800",
  },

  docHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  docBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 12,
  },

  docInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  docInfoLabel: {
    color: T.faint,
    fontSize: 11.5,
    fontWeight: "700",
    flexShrink: 0,
  },

  docInfoValue: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    flexShrink: 1,
  },

  expiryValue: {
    alignItems: "flex-end",
    flexShrink: 1,
  },

  docRefValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },

  docRefValue: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    maxWidth: 220,
  },

  docActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },

  docActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },

  docActionText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: -0.1,
  },

  /* EXPIRY */

  expiryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },

  expiryDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  expiryText: {
    fontSize: 9.5,
    fontWeight: "900",
  },

  /* CONFIRM DELETE */

  confirmBox: {
    marginTop: 6,
    padding: 12,
    borderRadius: 14,
    backgroundColor: alpha(T.danger, 0.08),
    borderWidth: 1,
    borderColor: alpha(T.danger, 0.3),
    gap: 10,
  },

  confirmHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  confirmTitle: {
    color: "#FCA5A5",
    fontSize: 12.5,
    fontWeight: "800",
  },

  confirmActions: {
    flexDirection: "row",
    gap: 10,
  },

  confirmCancel: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  confirmCancelText: {
    color: T.dim,
    fontSize: 12,
    fontWeight: "800",
  },

  confirmDelete: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: T.danger,
  },

  confirmDeleteText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },

  /* EMPTY */

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 14,
    paddingHorizontal: 24,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 4,
  },

  emptyTitle: {
    color: T.text,
    fontSize: 15.5,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },

  emptyMessage: {
    color: T.faint,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 260,
  },

  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: alpha(T.indigo, 0.16),
    borderWidth: 1,
    borderColor: alpha(T.indigo, 0.34),
  },

  emptyCtaText: {
    color: T.indigoSoft,
    fontSize: 12.5,
    fontWeight: "900",
  },

  /* CLEAR FILTERS */

  clearFiltersBtn: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  clearFiltersText: {
    color: T.faint,
    fontSize: 11.5,
    fontWeight: "700",
  },

  /* MODAL */

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },

  modalSheet: {
    backgroundColor: T.sheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: T.borderUp,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    maxHeight: "94%",
  },

  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginTop: 10,
    marginBottom: 16,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  sheetHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.indigo, 0.2),
  },

  sheetHeaderMain: {
    flex: 1,
    minWidth: 0,
  },

  sheetTitle: {
    color: T.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  sheetSubtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: "600",
  },

  sheetCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  formContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
  },

  fieldLabel: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: T.text,
    fontSize: 13.5,
  },

  inputError: {
    borderColor: alpha(T.danger, 0.65),
    backgroundColor: alpha(T.danger, 0.06),
  },

  validationError: {
    color: "#FCA5A5",
    fontSize: 10.5,
    fontWeight: "700",
    marginTop: 6,
  },

  inputMulti: {
    minHeight: 84,
    paddingTop: 12,
  },

  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 13,
    borderWidth: 1,
  },

  sheetActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
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

  cancelText: {
    color: T.dim,
    fontSize: 13.5,
    fontWeight: "800",
  },

  saveBtn: {
    flex: 1.4,
    height: 50,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: T.indigo,
    shadowColor: T.indigo,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 6,
  },

  saveBtnText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.1,
  },

  /* AUTH */

  authGate: {
    flex: 1,
    backgroundColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },

  authBackBtn: {
    position: "absolute",
    top: 56,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },

  authIcon: {
    width: 82,
    height: 82,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.indigo, 0.16),
    borderWidth: 1,
    borderColor: alpha(T.indigo, 0.36),
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

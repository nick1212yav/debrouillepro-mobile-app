import React, {
  useMemo,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useMutation, useQuery } from "convex/react";

import {
  ArrowLeft,
  Bell,
  CheckCircle,
  ChevronRight,
  Crown,
  Globe,
  Lock,
  MapPin,
  Plus,
  Search,
  Shield,
  Users,
  X,
  Zap,
} from "lucide-react-native";

import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "@/lib/convex-auth-compat";

// ─────────────────────────────────────────────────────────────────────────────
// Theme
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = {
  background: "#050812",
  backgroundSecondary: "#0C1022",
  card: "rgba(255,255,255,0.045)",
  cardStrong: "rgba(255,255,255,0.065)",
  border: "rgba(255,255,255,0.09)",
  borderSoft: "rgba(255,255,255,0.065)",
  text: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.68)",
  textMuted: "rgba(255,255,255,0.42)",
  textFaint: "rgba(255,255,255,0.28)",
  primary: "#6366F1",
  primaryStrong: "#4F46E5",
  danger: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Role = "admin" | "moderator" | "member";

type GroupData = {
  _id: string;
  name: string;
  description: string;
  category: string;
  isPrivate: boolean;
  memberCount: number;
  city?: string;
  tags: string[];
  isMember: boolean;
  role?: string;
};

type GroupCategory =
  | "Tous"
  | "Mes groupes"
  | "Quartier"
  | "Métier"
  | "Intérêt"
  | "Famille";

type IconComponent = ElementType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES: GroupCategory[] = [
  "Tous",
  "Mes groupes",
  "Quartier",
  "Métier",
  "Intérêt",
  "Famille",
];

const CREATE_CATEGORIES = ["Quartier", "Métier", "Intérêt", "Famille"] as const;

const ROLE_COLORS: Record<Role, string> = {
  admin: "#F59E0B",
  moderator: "#8B5CF6",
  member: "#6B7280",
};

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  moderator: "Modérateur",
  member: "Membre",
};

const ROLE_ICONS: Record<Role, IconComponent> = {
  admin: Crown,
  moderator: Shield,
  member: CheckCircle,
};

const EMOJI_MAP: Record<string, string> = {
  Métier: "💼",
  Quartier: "🏘️",
  Intérêt: "💻",
  Famille: "👨‍👩‍👧‍👦",
  Agriculture: "🌾",
  Business: "💼",
};

const COLOR_MAP: Record<string, string> = {
  Métier: "#8B5CF6",
  Quartier: "#10B981",
  Intérêt: "#6366F1",
  Famille: "#F97316",
  Agriculture: "#22C55E",
  Business: "#3B82F6",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getRole(role?: string): Role | null {
  if (role === "admin" || role === "moderator" || role === "member") {
    return role;
  }

  return null;
}

function getGroupColor(category: string): string {
  return COLOR_MAP[category] ?? COLORS.primary;
}

function getGroupEmoji(category: string): string {
  return EMOJI_MAP[category] ?? "👥";
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function GroupSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonAvatar} />

      <View style={styles.skeletonContent}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonDescription} />
        <View style={styles.skeletonMeta} />
      </View>

      <View style={styles.skeletonArrow} />
    </View>
  );
}

function PageSkeleton() {
  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.loadingContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonBack} />
          <View style={styles.skeletonHeaderText}>
            <View style={styles.skeletonHeaderTitle} />
            <View style={styles.skeletonHeaderSubtitle} />
          </View>
        </View>

        {Array.from({ length: 5 }).map((_, index) => (
          <GroupSkeleton key={index} />
        ))}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Role Badge
// ─────────────────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: Role }) {
  const Icon = ROLE_ICONS[role];
  const color = ROLE_COLORS[role];

  return (
    <View
      style={[
        styles.roleBadge,
        {
          backgroundColor: `${color}20`,
          borderColor: `${color}40`,
        },
      ]}
    >
      <Icon size={9} color={color} strokeWidth={2.5} />

      <Text style={[styles.roleBadgeText, { color }]}>{ROLE_LABELS[role]}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Group Card
// ─────────────────────────────────────────────────────────────────────────────

function GroupeCard({
  groupe,
  onPress,
}: {
  groupe: GroupData;
  onPress: () => void;
}) {
  const color = getGroupColor(groupe.category);
  const emoji = getGroupEmoji(groupe.category);
  const role = getRole(groupe.role);

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "rgba(255,255,255,0.06)" }}
      style={({ pressed }) => [
        styles.groupCard,
        pressed && styles.groupCardPressed,
      ]}
    >
      <View
        style={[
          styles.groupIcon,
          {
            backgroundColor: `${color}16`,
            borderColor: `${color}30`,
          },
        ]}
      >
        <Text style={styles.groupEmoji}>{emoji}</Text>
      </View>

      <View style={styles.groupMain}>
        <View style={styles.groupTitleRow}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.groupName}>
            {groupe.name}
          </Text>

          {groupe.isPrivate ? (
            <Lock size={12} color={COLORS.textFaint} strokeWidth={2.2} />
          ) : null}

          {role ? <RoleBadge role={role} /> : null}
        </View>

        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={styles.groupDescription}
        >
          {groupe.description}
        </Text>

        <View style={styles.groupMeta}>
          <View style={styles.metaItem}>
            <Users size={11} color={COLORS.textMuted} strokeWidth={2} />

            <Text style={styles.metaText}>
              {groupe.memberCount.toLocaleString()}
            </Text>
          </View>

          {groupe.city ? (
            <View style={styles.metaItem}>
              <MapPin size={11} color={COLORS.textFaint} strokeWidth={2} />

              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.metaTextFaint}
              >
                {groupe.city}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <ChevronRight size={17} color={COLORS.textFaint} strokeWidth={2} />
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Group Detail
// ─────────────────────────────────────────────────────────────────────────────

function GroupeDetail({
  groupe,
  onBack,
}: {
  groupe: GroupData;
  onBack: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [joinPending, setJoinPending] = useState(false);

  const joinGroup = useMutation(api.community.joinGroup);

  const color = getGroupColor(groupe.category);
  const emoji = getGroupEmoji(groupe.category);
  const role = getRole(groupe.role);

  const handleJoin = async () => {
    if (joinPending) {
      return;
    }

    setJoinPending(true);

    try {
      await joinGroup({
        groupId: groupe._id as Id<"groups">,
      });

      // The list query is reactive. The UI will receive the backend truth.
    } catch {
      // Keep the current state unchanged.
      // No fake success is shown.
    } finally {
      setJoinPending(false);
    }
  };

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.detailScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.detailHeader}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={19} color={COLORS.text} strokeWidth={2.2} />
          </Pressable>

          <View
            style={[
              styles.detailAvatar,
              {
                backgroundColor: `${color}18`,
                borderColor: `${color}35`,
              },
            ]}
          >
            <Text style={styles.detailEmoji}>{emoji}</Text>
          </View>

          <View style={styles.detailTitleContainer}>
            <View style={styles.detailTitleRow}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.detailTitle}
              >
                {groupe.name}
              </Text>

              {groupe.isPrivate ? (
                <Lock size={12} color={COLORS.textFaint} strokeWidth={2.2} />
              ) : null}
            </View>

            <Text style={styles.detailMemberCount}>
              {groupe.memberCount.toLocaleString()} membres
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Notifications du groupe"
          >
            <Bell size={17} color={COLORS.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Description */}
        <View style={styles.detailDescriptionCard}>
          <Text style={styles.detailDescription}>{groupe.description}</Text>

          {groupe.tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {groupe.tags.map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: `${color}14`,
                      borderColor: `${color}30`,
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Membership */}
        <View style={styles.membershipCard}>
          <View style={styles.membershipHeader}>
            <View>
              <Text style={styles.membershipTitle}>Votre participation</Text>

              <Text style={styles.membershipSubtitle}>
                {groupe.isMember
                  ? "Vous êtes membre de ce groupe."
                  : "Vous ne faites pas encore partie de ce groupe."}
              </Text>
            </View>

            {role ? <RoleBadge role={role} /> : null}
          </View>

          <View style={styles.membershipActions}>
            {groupe.isMember ? (
              <Authenticated>
                <Pressable
                  onPress={handleJoin}
                  disabled={joinPending}
                  style={({ pressed }) => [
                    styles.secondaryAction,
                    pressed && styles.actionPressed,
                    joinPending && styles.actionDisabled,
                  ]}
                >
                  {joinPending ? (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.textSecondary}
                    />
                  ) : (
                    <Text style={styles.secondaryActionText}>
                      Quitter le groupe
                    </Text>
                  )}
                </Pressable>
              </Authenticated>
            ) : (
              <>
                <Authenticated>
                  <Pressable
                    onPress={handleJoin}
                    disabled={joinPending}
                    style={({ pressed }) => [
                      styles.primaryAction,
                      pressed && styles.actionPressed,
                      joinPending && styles.actionDisabled,
                    ]}
                  >
                    {joinPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Plus size={16} color="#FFFFFF" strokeWidth={2.4} />

                        <Text style={styles.primaryActionText}>
                          Rejoindre le groupe
                        </Text>
                      </>
                    )}
                  </Pressable>
                </Authenticated>

                <Unauthenticated>
                  <View style={styles.authHint}>
                    <Text style={styles.authHintText}>
                      Connectez-vous pour rejoindre ce groupe.
                    </Text>
                  </View>
                </Unauthenticated>
              </>
            )}
          </View>
        </View>

        {/* Group content */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Publications</Text>

            <Text style={styles.sectionSubtitle}>Espace communautaire</Text>
          </View>
        </View>

        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyIcon,
              {
                backgroundColor: `${color}14`,
                borderColor: `${color}28`,
              },
            ]}
          >
            <Text style={styles.emptyEmoji}>{emoji}</Text>
          </View>

          <Text style={styles.emptyTitle}>Publications non disponibles</Text>

          <Text style={styles.emptyDescription}>
            Les publications dans les groupes ne sont pas encore disponibles
            dans le backend actuel.
          </Text>

          <Text style={styles.emptyFootnote}>
            Aucune publication fictive n’est affichée.
          </Text>
        </View>
      </ScrollView>

      {/* Create-post UI intentionally not exposed because the backend
          mutation does not exist in the provided source. */}
      {showCreate ? (
        <Modal
          visible={showCreate}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCreate(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Publication</Text>

                <Pressable
                  onPress={() => setShowCreate(false)}
                  style={styles.modalClose}
                >
                  <X size={17} color={COLORS.textSecondary} />
                </Pressable>
              </View>

              <Text style={styles.modalInfo}>
                La création de publications de groupe n’est pas encore reliée à
                une mutation backend disponible.
              </Text>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Group Modal
// ─────────────────────────────────────────────────────────────────────────────

function CreateGroupModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] =
    useState<(typeof CREATE_CATEGORIES)[number]>("Intérêt");
  const [isPrivate, setIsPrivate] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroup = useMutation(api.community.createGroup);

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("Intérêt");
    setIsPrivate(false);
    setError(null);
  };

  const handleClose = () => {
    if (pending) {
      return;
    }

    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setError("Le nom du groupe est obligatoire.");
      return;
    }

    if (pending) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      await createGroup({
        name: trimmedName,
        description: trimmedDescription || "Groupe créé sur Débrouille Pro.",
        category,
        isPrivate,
        tags: [category],
      });

      resetForm();
      onCreated();
      onClose();
    } catch {
      setError(
        "Impossible de créer le groupe. Vérifiez votre connexion puis réessayez.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.createModalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Créer un groupe</Text>

              <Text style={styles.modalSubtitle}>
                Créez un espace pour votre communauté.
              </Text>
            </View>

            <Pressable
              onPress={handleClose}
              disabled={pending}
              style={({ pressed }) => [
                styles.modalClose,
                pressed && styles.iconButtonPressed,
              ]}
            >
              <X size={17} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.createScrollContent}
          >
            {/* Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nom du groupe</Text>

              <TextInput
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  if (error) {
                    setError(null);
                  }
                }}
                placeholder="Ex. Entrepreneurs de Kolwezi"
                placeholderTextColor={COLORS.textFaint}
                editable={!pending}
                maxLength={100}
                returnKeyType="next"
                style={styles.input}
              />

              <Text style={styles.fieldCounter}>{name.length}/100</Text>
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Description</Text>

              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez l'objectif du groupe..."
                placeholderTextColor={COLORS.textFaint}
                editable={!pending}
                maxLength={500}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={[styles.input, styles.textArea]}
              />

              <Text style={styles.fieldCounter}>{description.length}/500</Text>
            </View>

            {/* Category */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Catégorie</Text>

              <View style={styles.categoryGrid}>
                {CREATE_CATEGORIES.map((item) => {
                  const active = category === item;
                  const color = getGroupColor(item);

                  return (
                    <Pressable
                      key={item}
                      onPress={() => setCategory(item)}
                      disabled={pending}
                      style={({ pressed }) => [
                        styles.categoryOption,
                        {
                          backgroundColor: active ? `${color}20` : COLORS.card,
                          borderColor: active
                            ? `${color}60`
                            : COLORS.borderSoft,
                        },
                        pressed && styles.optionPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryEmoji,
                          { opacity: active ? 1 : 0.65 },
                        ]}
                      >
                        {getGroupEmoji(item)}
                      </Text>

                      <Text
                        style={[
                          styles.categoryText,
                          active && {
                            color,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {item}
                      </Text>

                      {active ? (
                        <CheckCircle
                          size={13}
                          color={color}
                          strokeWidth={2.5}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Privacy */}
            <Pressable
              onPress={() => setIsPrivate((value) => !value)}
              disabled={pending}
              style={({ pressed }) => [
                styles.privacyCard,
                pressed && styles.optionPressed,
              ]}
            >
              <View style={styles.privacyLeft}>
                <View
                  style={[
                    styles.privacyIcon,
                    {
                      backgroundColor: isPrivate
                        ? "rgba(245,158,11,0.12)"
                        : "rgba(16,185,129,0.12)",
                    },
                  ]}
                >
                  {isPrivate ? (
                    <Lock size={16} color={COLORS.warning} strokeWidth={2} />
                  ) : (
                    <Globe size={16} color={COLORS.success} strokeWidth={2} />
                  )}
                </View>

                <View style={styles.privacyTextContainer}>
                  <Text style={styles.privacyTitle}>
                    {isPrivate ? "Groupe privé" : "Groupe public"}
                  </Text>

                  <Text style={styles.privacyDescription}>
                    {isPrivate
                      ? "L'accès au groupe est réservé aux membres."
                      : "Le groupe peut être découvert par les utilisateurs."}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.switchTrack,
                  {
                    backgroundColor: isPrivate
                      ? COLORS.primary
                      : "rgba(255,255,255,0.13)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    {
                      alignSelf: isPrivate ? "flex-end" : "flex-start",
                    },
                  ]}
                />
              </View>
            </Pressable>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Submit */}
            <Pressable
              onPress={handleCreate}
              disabled={pending || !name.trim()}
              style={({ pressed }) => [
                styles.createButton,
                (pending || !name.trim()) && styles.createButtonDisabled,
                pressed && !pending && !!name.trim() && styles.actionPressed,
              ]}
            >
              {pending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Plus size={17} color="#FFFFFF" strokeWidth={2.5} />

                  <Text style={styles.createButtonText}>Créer le groupe</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────

function EmptyGroups({
  authenticated,
  onCreate,
}: {
  authenticated: boolean;
  onCreate: () => void;
}) {
  return (
    <View style={styles.emptyList}>
      <View style={styles.emptyListIcon}>
        <Users size={28} color={COLORS.primary} strokeWidth={1.8} />
      </View>

      <Text style={styles.emptyListTitle}>Aucun groupe trouvé</Text>

      <Text style={styles.emptyListDescription}>
        Aucun groupe ne correspond actuellement à votre recherche ou à ce
        filtre.
      </Text>

      {authenticated ? (
        <Pressable
          onPress={onCreate}
          style={({ pressed }) => [
            styles.emptyCreateButton,
            pressed && styles.actionPressed,
          ]}
        >
          <Plus size={15} color="#FFFFFF" strokeWidth={2.4} />

          <Text style={styles.emptyCreateButtonText}>Créer un groupe</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

interface GroupesPageProps {
  onBack: () => void;
}

function GroupesPageInner({ onBack }: GroupesPageProps) {
  const [category, setCategory] = useState<GroupCategory>("Tous");
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const groupsData = useQuery(api.community.listGroups, {
    category:
      category !== "Tous" && category !== "Mes groupes" ? category : undefined,
    search: search.trim() || undefined,
  });

  const groups = (groupsData ?? []) as GroupData[];

  const filteredGroups = useMemo(() => {
    if (category === "Mes groupes") {
      return groups.filter((group) => group.isMember);
    }

    return groups;
  }, [groups, category]);

  const myGroupsCount = useMemo(
    () => groups.filter((group) => group.isMember).length,
    [groups],
  );

  const availableGroupsCount = useMemo(
    () => groups.filter((group) => !group.isMember).length,
    [groups],
  );

  if (selectedGroup) {
    return (
      <GroupeDetail
        groupe={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  return (
    <View style={styles.page}>
      {/* Decorative glow */}
      <View style={styles.decorativeGlow} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={19} color={COLORS.text} strokeWidth={2.2} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.pageTitle}>Groupes & Communautés</Text>

            <Text style={styles.pageSubtitle}>
              {myGroupsCount} groupe
              {myGroupsCount !== 1 ? "s" : ""} rejoint
              {myGroupsCount !== 1 ? "s" : ""}
            </Text>
          </View>

          <Authenticated>
            <Pressable
              onPress={() => setShowCreate(true)}
              style={({ pressed }) => [
                styles.createIconButton,
                pressed && styles.iconButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Créer un groupe"
            >
              <Plus size={19} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>
          </Authenticated>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            icon={Users}
            label="Mes groupes"
            value={myGroupsCount}
            iconColor={COLORS.primary}
          />

          <StatCard
            icon={Users}
            label="Total"
            value={groups.length}
            iconColor={COLORS.warning}
          />

          <StatCard
            icon={Zap}
            label="Disponibles"
            value={availableGroupsCount}
            iconColor={COLORS.success}
          />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={17} color={COLORS.textMuted} strokeWidth={2} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un groupe..."
            placeholderTextColor={COLORS.textFaint}
            returnKeyType="search"
            clearButtonMode="never"
            style={styles.searchInput}
          />

          {search.length > 0 ? (
            <Pressable
              onPress={() => setSearch("")}
              style={styles.clearSearchButton}
              accessibilityRole="button"
              accessibilityLabel="Effacer la recherche"
            >
              <X size={15} color={COLORS.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
          style={styles.categoriesScroll}
        >
          {CATEGORIES.map((item) => {
            const active = category === item;

            return (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  active && styles.categoryChipActive,
                  pressed && styles.optionPressed,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    active && styles.categoryChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* List */}
        <View style={styles.listSection}>
          {groupsData === undefined ? (
            <>
              <GroupSkeleton />
              <GroupSkeleton />
              <GroupSkeleton />
              <GroupSkeleton />
            </>
          ) : filteredGroups.length === 0 ? (
            <EmptyGroups
              authenticated={false}
              onCreate={() => setShowCreate(true)}
            />
          ) : (
            filteredGroups.map((group) => (
              <GroupeCard
                key={group._id}
                groupe={group}
                onPress={() => setSelectedGroup(group)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Authenticated>
        <CreateGroupModal
          visible={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            // Convex listGroups is reactive; no manual refresh required.
          }}
        />
      </Authenticated>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  iconColor,
}: {
  icon: IconComponent;
  label: string;
  value: number;
  iconColor: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${iconColor}14` }]}>
        <Icon size={16} color={iconColor} strokeWidth={2.2} />
      </View>

      <Text style={styles.statValue}>{value.toLocaleString()}</Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export default function GroupesPage({ onBack }: GroupesPageProps) {
  return (
    <>
      <AuthLoading>
        <PageSkeleton />
      </AuthLoading>

      <Authenticated>
        <GroupesPageInner onBack={onBack} />
      </Authenticated>

      <Unauthenticated>
        <GroupesPageInner onBack={onBack} />
      </Unauthenticated>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  page: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  loadingContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 12,
  },

  decorativeGlow: {
    position: "absolute",
    top: -120,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(99,102,241,0.07)",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  pageTitle: {
    color: COLORS.text,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
    letterSpacing: -0.35,
  },

  pageSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  createIconButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryStrong,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.45)",
  },

  iconButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    minHeight: 104,
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },

  statValue: {
    color: COLORS.text,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "900",
  },

  statLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },

  // Search
  searchContainer: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 10,
  },

  clearSearchButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  // Categories
  categoriesScroll: {
    marginHorizontal: -20,
    marginBottom: 16,
  },

  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },

  categoryChip: {
    paddingHorizontal: 14,
    minHeight: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  categoryChipActive: {
    backgroundColor: "rgba(99,102,241,0.18)",
    borderColor: "rgba(99,102,241,0.45)",
  },

  categoryChipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },

  categoryChipTextActive: {
    color: "#A5B4FC",
  },

  // List
  listSection: {
    gap: 10,
  },

  groupCard: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  groupCardPressed: {
    backgroundColor: COLORS.cardStrong,
    transform: [{ scale: 0.992 }],
  },

  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  groupEmoji: {
    fontSize: 25,
  },

  groupMain: {
    flex: 1,
    minWidth: 0,
  },

  groupTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 20,
  },

  groupName: {
    flexShrink: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },

  groupDescription: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  groupMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 7,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
  },

  metaText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "600",
  },

  metaTextFaint: {
    flexShrink: 1,
    color: COLORS.textFaint,
    fontSize: 10,
    fontWeight: "600",
  },

  // Role
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },

  roleBadgeText: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "800",
  },

  // Skeleton
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },

  skeletonBack: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  skeletonHeaderText: {
    flex: 1,
    gap: 6,
  },

  skeletonHeaderTitle: {
    width: "62%",
    height: 17,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  skeletonHeaderSubtitle: {
    width: "38%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  skeletonCard: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  skeletonAvatar: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.065)",
  },

  skeletonContent: {
    flex: 1,
    gap: 7,
  },

  skeletonTitle: {
    width: "65%",
    height: 13,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.075)",
  },

  skeletonDescription: {
    width: "90%",
    height: 9,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  skeletonMeta: {
    width: "38%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  skeletonArrow: {
    width: 16,
    height: 16,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  // Empty
  emptyList: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 48,
  },

  emptyListIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.12)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.24)",
    marginBottom: 15,
  },

  emptyListTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 7,
  },

  emptyListDescription: {
    maxWidth: 300,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  emptyCreateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 18,
    paddingHorizontal: 17,
    minHeight: 42,
    borderRadius: 13,
    backgroundColor: COLORS.primaryStrong,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.4)",
  },

  emptyCreateButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  // Detail
  detailScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },

  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 18,
  },

  detailAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  detailEmoji: {
    fontSize: 21,
  },

  detailTitleContainer: {
    flex: 1,
    minWidth: 0,
  },

  detailTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  detailTitle: {
    flexShrink: 1,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },

  detailMemberCount: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },

  detailDescriptionCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    marginBottom: 12,
  },

  detailDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 14,
  },

  tag: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
  },

  tagText: {
    fontSize: 9,
    fontWeight: "700",
  },

  membershipCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(99,102,241,0.075)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.18)",
    marginBottom: 24,
  },

  membershipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  membershipTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },

  membershipSubtitle: {
    maxWidth: 260,
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  membershipActions: {
    marginTop: 14,
  },

  primaryAction: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 13,
    backgroundColor: COLORS.primaryStrong,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.4)",
  },

  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  secondaryAction: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(239,68,68,0.10)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.20)",
  },

  secondaryActionText: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "800",
  },

  authHint: {
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  authHintText: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },

  sectionHeader: {
    marginBottom: 11,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: COLORS.textFaint,
    fontSize: 10,
    marginTop: 2,
  },

  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 42,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 14,
  },

  emptyEmoji: {
    fontSize: 29,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 310,
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 7,
  },

  emptyFootnote: {
    color: COLORS.textFaint,
    fontSize: 9,
    textAlign: "center",
    marginTop: 12,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  modalCard: {
    width: "100%",
    padding: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#0B1020",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  createModalCard: {
    width: "100%",
    maxHeight: "91%",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#0B1020",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },

  modalTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },

  modalSubtitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  modalInfo: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },

  createScrollContent: {
    paddingBottom: 12,
  },

  // Form
  field: {
    marginBottom: 17,
  },

  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 7,
  },

  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    color: COLORS.text,
    fontSize: 13,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  textArea: {
    minHeight: 104,
  },

  fieldCounter: {
    color: COLORS.textFaint,
    fontSize: 9,
    textAlign: "right",
    marginTop: 4,
  },

  categoryGrid: {
    gap: 8,
  },

  categoryOption: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    borderRadius: 13,
    borderWidth: 1,
  },

  categoryEmoji: {
    fontSize: 18,
  },

  categoryText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },

  privacyCard: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 13,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    marginBottom: 14,
  },

  privacyLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  privacyIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  privacyTextContainer: {
    flex: 1,
  },

  privacyTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  privacyDescription: {
    color: COLORS.textMuted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 2,
  },

  switchTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 3,
  },

  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
  },

  errorBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.10)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.22)",
    marginBottom: 12,
  },

  errorText: {
    color: "#FCA5A5",
    fontSize: 11,
    lineHeight: 16,
  },

  createButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 15,
    backgroundColor: COLORS.primaryStrong,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.42)",
  },

  createButtonDisabled: {
    opacity: 0.42,
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  // Press states
  actionPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },

  actionDisabled: {
    opacity: 0.55,
  },

  optionPressed: {
    opacity: 0.78,
  },
});

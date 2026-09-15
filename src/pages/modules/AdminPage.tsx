import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  BarChart2,
  CheckCircle,
  CheckSquare,
  ChevronRight,
  Crown,
  Database,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Flag,
  Heart,
  Loader2,
  MessageSquare,
  Search,
  Shield,
  Square,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react-native";
import { toast } from "sonner";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

type Tab = "stats" | "users" | "flags" | "content" | "seed";
type FlagFilter = "all" | "publication" | "comment";
type BulkAction = "dismiss" | "remove_publication" | "hide_publication";

interface Props {
  onBack: () => void;
}

type SeedResult = {
  jobs: number;
  properties: number;
  courses: number;
  publications: number;
  events: number;
};

type StatsData = {
  totalUsers: number;
  bannedUsers: number;
  totalPublications: number;
  pendingFlags: number;
  hiddenPublications: number;
  publicationsByType: Record<string, number>;
};

type UserItem = {
  _id: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
  city?: string;
  isAdmin: boolean;
  isBanned: boolean;
};

type FlagItem = {
  _id: string;
  reason: string;
  note?: string;
  contentType: string;
  publication?: {
    _id: string;
    title: string;
    type: string;
    isHidden?: boolean;
  } | null;
  comment?: { _id: string; text: string } | null;
  reporter: { name?: string; email?: string } | null;
};

type PublicationItem = {
  _id: string;
  _creationTime: number;
  title: string;
  type: string;
  status: string;
  likeCount: number;
  viewCount: number;
  flagCount: number;
  isHidden: boolean;
};

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */

const T = {
  bg: "#07070C",
  card: "rgba(255,255,255,0.045)",
  cardUp: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)",
  borderUp: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.56)",
  faint: "rgba(255,255,255,0.32)",
  primary: "#8B5CF6",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F97316",
  gold: "#FBBF24",
  cyan: "#22D3EE",
} as const;

/** Convertit un hex #RRGGBB en rgba() avec alpha. */
function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/** Confirmation cross-platform (native Alert / web confirm). */
function confirmAction(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    const ok =
      typeof window !== "undefined" && window.confirm(`${title}\n\n${message}`);
    if (ok) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Annuler", style: "cancel" },
    { text: "Confirmer", style: "destructive", onPress: onConfirm },
  ]);
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
          borderRadius: 16,
          opacity,
        },
        style,
      ]}
    />
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: alpha(color, 0.16),
      }}
    >
      <Text
        style={{
          color,
          fontSize: 9.5,
          fontWeight: "800",
          letterSpacing: 0.4,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function ActionBtn({
  label,
  icon: Icon,
  color,
  loading,
  onPress,
}: {
  label: string;
  icon: typeof Shield;
  color: string;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.actionBtn,
        {
          backgroundColor: alpha(color, 0.14),
          borderColor: alpha(color, 0.3),
          opacity: loading ? 0.45 : pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Icon size={12} color={color} />
      )}
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function BulkBtn({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          paddingHorizontal: 10,
          paddingVertical: 7,
          borderRadius: 11,
          backgroundColor: alpha(color, 0.16),
          borderWidth: 1,
          borderColor: alpha(color, 0.32),
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      <Text style={{ color, fontSize: 10.5, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({
  icon: Icon,
  label,
  color = T.faint,
}: {
  icon: typeof Shield;
  label: string;
  color?: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View
        style={{
          width: 68,
          height: 68,
          borderRadius: 24,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255,255,255,0.04)",
          borderWidth: 1,
          borderColor: T.border,
        }}
      >
        <Icon size={28} color={color} />
      </View>
      <Text style={{ color: T.dim, fontSize: 13, fontWeight: "500" }}>
        {label}
      </Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   LOADING / ACCESS
   ════════════════════════════════════════════════════════════════════════════ */

function LoadingSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={19} color="#fff" />
          </Pressable>
          <Skeleton style={{ height: 22, width: 190, borderRadius: 10 }} />
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 18 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              style={{ height: 36, width: 92, borderRadius: 14 }}
            />
          ))}
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            style={{ height: 74, width: "100%", borderRadius: 20 }}
          />
        ))}
        <Skeleton style={{ height: 180, width: "100%", borderRadius: 26 }} />
      </View>
    </View>
  );
}

function AccessDenied({ onBack }: { onBack: () => void }) {
  return (
    <View style={[styles.root, styles.center]}>
      <View style={styles.deniedIcon}>
        <Shield size={38} color={T.danger} />
      </View>
      <Text style={styles.deniedTitle}>Accès refusé</Text>
      <Text style={styles.deniedText}>
        Cette section est strictement réservée aux administrateurs de la
        plateforme.
      </Text>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.deniedBtn,
          { opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <ArrowLeft size={15} color="#fff" />
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13.5 }}>
          Retour
        </Text>
      </Pressable>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STATS
   ════════════════════════════════════════════════════════════════════════════ */

const TYPE_LABELS: Record<string, string> = {
  immo: "Immobilier",
  job: "Emploi",
  service: "Service",
  evenement: "Événement",
  community: "Communauté",
  agri: "Agriculture",
  sante: "Santé",
  transport: "Transport",
  annonce: "Annonce",
  restauration: "Restauration",
  hebergement: "Hébergement",
  energie: "Énergie",
  ong: "ONG",
  video: "Vidéo",
  article: "Article",
  sondage: "Sondage",
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  immo: "#6366F1",
  job: "#10B981",
  service: "#F59E0B",
  evenement: "#EC4899",
  community: "#8B5CF6",
  agri: "#22C55E",
  sante: "#EF4444",
  transport: "#3B82F6",
  annonce: "#F97316",
  restauration: "#D946EF",
  hebergement: "#14B8A6",
  energie: "#FBBF24",
  ong: "#6B7280",
  video: "#E11D48",
  article: "#7C3AED",
  sondage: "#0EA5E9",
};

function StatsPanel({ stats }: { stats: StatsData }) {
  const topTypes = useMemo(
    () =>
      Object.entries(stats.publicationsByType ?? {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
    [stats.publicationsByType],
  );
  const maxCount = topTypes[0]?.[1] ?? 1;

  const cards = [
    {
      label: "Utilisateurs",
      value: stats.totalUsers,
      icon: Users,
      color: "#818CF8",
    },
    {
      label: "Publications",
      value: stats.totalPublications,
      icon: FileText,
      color: T.success,
    },
    {
      label: "Bannis",
      value: stats.bannedUsers,
      icon: Ban,
      color: T.danger,
    },
    {
      label: "Signalements",
      value: stats.pendingFlags,
      icon: Flag,
      color: T.warning,
    },
    {
      label: "Masqués auto",
      value: stats.hiddenPublications,
      icon: EyeOff,
      color: "#A78BFA",
    },
  ];

  return (
    <View style={{ gap: 14 }}>
      {/* Grille de stats */}
      <View style={styles.statGrid}>
        {cards.map(({ label, value, icon: Icon, color }) => (
          <View
            key={label}
            style={[styles.statCard, { borderColor: alpha(color, 0.18) }]}
          >
            <View
              style={[styles.statIcon, { backgroundColor: alpha(color, 0.14) }]}
            >
              <Icon size={17} color={color} />
            </View>
            <Text style={styles.statValue}>
              {value?.toLocaleString?.() ?? "0"}
            </Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Top catégories */}
      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <TrendingUp size={15} color={T.primary} />
          <Text style={styles.panelTitle}>Top catégories</Text>
        </View>

        {topTypes.length === 0 ? (
          <Text style={{ color: T.faint, fontSize: 12 }}>
            Aucune publication pour le moment
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {topTypes.map(([type, count]) => {
              const color = TYPE_BADGE_COLORS[type] ?? T.primary;
              return (
                <View key={type} style={{ gap: 6 }}>
                  <View style={styles.rowBetween}>
                    <Text
                      style={{ color: T.dim, fontSize: 12, fontWeight: "600" }}
                    >
                      {TYPE_LABELS[type] ?? type}
                    </Text>
                    <Text
                      style={{
                        color,
                        fontSize: 12,
                        fontWeight: "800",
                      }}
                    >
                      {count}
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={{
                        width: `${Math.max(4, (count / maxCount) * 100)}%`,
                        height: "100%",
                        borderRadius: 999,
                        backgroundColor: color,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   USERS
   ════════════════════════════════════════════════════════════════════════════ */

function UserRow({
  user,
  onBan,
  onToggleAdmin,
}: {
  user: UserItem;
  onBan: (ban: boolean) => Promise<void>;
  onToggleAdmin: (isAdmin: boolean) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    Animated.timing(anim, {
      toValue: next ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  };

  const handle = async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.userCard,
        user.isBanned && {
          borderColor: alpha(T.danger, 0.28),
          backgroundColor: alpha(T.danger, 0.05),
        },
      ]}
    >
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [
          styles.userHead,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        {user.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            style={styles.avatar}
            accessibilityLabel=""
          />
        ) : (
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: alpha(T.primary, 0.18),
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
          >
            <Text
              style={{
                color: "#C4B5FD",
                fontWeight: "800",
                fontSize: 15,
              }}
            >
              {initial}
            </Text>
          </View>
        )}

        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: T.text,
                fontSize: 14,
                fontWeight: "600",
                maxWidth: "62%",
              }}
            >
              {user.name ?? "Anonyme"}
            </Text>
            {user.isAdmin && <Badge label="ADMIN" color={T.gold} />}
            {user.isBanned && <Badge label="BANNI" color={T.danger} />}
          </View>
          <Text
            numberOfLines={1}
            style={{ color: T.faint, fontSize: 11.5, marginTop: 2 }}
          >
            {user.email ?? user.city ?? "—"}
          </Text>
        </View>

        <Animated.View
          style={{
            transform: [
              {
                rotate: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "90deg"],
                }),
              },
            ],
          }}
        >
          <ChevronRight size={15} color={T.faint} />
        </Animated.View>
      </Pressable>

      <Animated.View
        style={{
          maxHeight: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 120],
          }),
          opacity: anim,
          overflow: "hidden",
        }}
      >
        <View style={styles.userActions}>
          <ActionBtn
            label={user.isBanned ? "Débannir" : "Bannir"}
            icon={user.isBanned ? CheckCircle : Ban}
            color={user.isBanned ? T.success : T.danger}
            loading={loading}
            onPress={() =>
              confirmAction(
                user.isBanned
                  ? "Débannir l'utilisateur ?"
                  : "Bannir l'utilisateur ?",
                user.isBanned
                  ? `${user.name ?? "Cet utilisateur"} pourra de nouveau publier.`
                  : `${user.name ?? "Cet utilisateur"} ne pourra plus publier ni interagir.`,
                () => handle(() => onBan(!user.isBanned)),
              )
            }
          />
          <ActionBtn
            label={user.isAdmin ? "Retirer admin" : "Rendre admin"}
            icon={user.isAdmin ? XCircle : Crown}
            color={user.isAdmin ? T.warning : T.gold}
            loading={loading}
            onPress={() =>
              confirmAction(
                user.isAdmin
                  ? "Retirer le rôle admin ?"
                  : "Accorder le rôle admin ?",
                user.isAdmin
                  ? `${user.name ?? "Cet utilisateur"} perdra tous ses accès d'administration.`
                  : `${user.name ?? "Cet utilisateur"} aura un accès complet au tableau de bord.`,
                () => handle(() => onToggleAdmin(!user.isAdmin)),
              )
            }
          />
        </View>
      </Animated.View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   FLAGS
   ════════════════════════════════════════════════════════════════════════════ */

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  inappropriate: "Inapproprié",
  fake: "Faux / Trompeur",
  harassment: "Harcèlement",
  other: "Autre",
};

const REASON_COLORS: Record<string, string> = {
  spam: "#F59E0B",
  inappropriate: "#EF4444",
  fake: "#8B5CF6",
  harassment: "#F97316",
  other: "#6B7280",
};

function FlagCard({
  flag,
  isSelected,
  onSelect,
  showResolved,
  onDismiss,
  onHide,
  onRemove,
}: {
  flag: FlagItem;
  isSelected: boolean;
  onSelect: () => void;
  showResolved: boolean;
  onDismiss: () => Promise<void>;
  onHide: () => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const color = REASON_COLORS[flag.reason] ?? "#6B7280";
  const isComment = flag.contentType === "comment";

  const contentTitle = isComment
    ? (flag.comment?.text?.slice(0, 72) ?? "Commentaire supprimé")
    : (flag.publication?.title ?? "Publication supprimée");

  const handle = async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
    } catch {
      toast.error("Action impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.flagCard,
        isSelected && {
          backgroundColor: alpha(T.primary, 0.1),
          borderColor: alpha(T.primary, 0.42),
        },
      ]}
    >
      <View style={{ flexDirection: "row", gap: 11 }}>
        {!showResolved && (
          <Pressable onPress={onSelect} hitSlop={10} style={{ marginTop: 2 }}>
            {isSelected ? (
              <CheckSquare size={17} color="#A78BFA" />
            ) : (
              <Square size={17} color={T.faint} />
            )}
          </Pressable>
        )}

        <View
          style={[styles.flagIcon, { backgroundColor: alpha(color, 0.14) }]}
        >
          {isComment ? (
            <MessageSquare size={15} color={color} />
          ) : (
            <AlertTriangle size={15} color={color} />
          )}
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              flexDirection: "row",
              gap: 6,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Badge
              label={REASON_LABELS[flag.reason] ?? flag.reason}
              color={color}
            />
            <Badge
              label={isComment ? "Commentaire" : "Publication"}
              color={T.dim}
            />
            {flag.publication?.isHidden && (
              <Badge label="MASQUÉ" color={T.warning} />
            )}
          </View>

          <Text
            numberOfLines={3}
            style={{
              color: T.text,
              fontSize: 13.5,
              fontWeight: "600",
              marginTop: 7,
              lineHeight: 19,
            }}
          >
            {contentTitle}
          </Text>

          <Text style={{ color: T.faint, fontSize: 11.5, marginTop: 4 }}>
            Signalé par {flag.reporter?.name ?? "Anonyme"}
          </Text>

          {!!flag.note && (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>“{flag.note}”</Text>
            </View>
          )}
        </View>
      </View>

      {!showResolved && (
        <View style={styles.flagActions}>
          <ActionBtn
            label="Ignorer"
            icon={Eye}
            color="#6B7280"
            loading={loading}
            onPress={() => handle(onDismiss)}
          />
          {!isComment && (
            <ActionBtn
              label="Masquer"
              icon={EyeOff}
              color={T.warning}
              loading={loading}
              onPress={() => handle(onHide)}
            />
          )}
          <ActionBtn
            label="Supprimer"
            icon={Trash2}
            color={T.danger}
            loading={loading}
            onPress={() =>
              confirmAction(
                "Supprimer définitivement ?",
                isComment
                  ? "Ce commentaire sera retiré de la plateforme."
                  : "Cette publication sera retirée de la plateforme.",
                () => handle(onRemove),
              )
            }
          />
        </View>
      )}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PUBLICATIONS
   ════════════════════════════════════════════════════════════════════════════ */

function PublicationRow({
  publication,
  onToggleVisibility,
}: {
  publication: PublicationItem;
  onToggleVisibility: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const badgeColor = TYPE_BADGE_COLORS[publication.type] ?? "#6B7280";
  const isActive = publication.status === "active";

  const handleToggle = async () => {
    setLoading(true);
    try {
      await onToggleVisibility();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.pubCard,
        publication.isHidden && {
          backgroundColor: alpha(T.danger, 0.05),
          borderColor: alpha(T.danger, 0.22),
        },
      ]}
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={2}
            style={{
              color: T.text,
              fontSize: 13.5,
              fontWeight: "600",
              lineHeight: 19,
            }}
          >
            {publication.title}
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: 6,
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            <Badge
              label={TYPE_LABELS[publication.type] ?? publication.type}
              color={badgeColor}
            />
            <Badge
              label={isActive ? "actif" : publication.status}
              color={isActive ? T.success : T.faint}
            />
            {publication.isHidden && <Badge label="MASQUÉ" color={T.danger} />}
          </View>
        </View>

        <Pressable
          onPress={handleToggle}
          disabled={loading}
          style={({ pressed }) => [
            styles.visibilityBtn,
            {
              backgroundColor: publication.isHidden
                ? alpha(T.success, 0.14)
                : alpha(T.warning, 0.14),
              borderColor: publication.isHidden
                ? alpha(T.success, 0.32)
                : alpha(T.warning, 0.32),
              opacity: loading ? 0.5 : pressed ? 0.75 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={publication.isHidden ? T.success : T.warning}
            />
          ) : publication.isHidden ? (
            <Eye size={12} color={T.success} />
          ) : (
            <EyeOff size={12} color={T.warning} />
          )}
          <Text
            style={{
              fontSize: 11,
              fontWeight: "800",
              color: publication.isHidden ? T.success : T.warning,
            }}
          >
            {publication.isHidden ? "Afficher" : "Masquer"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.pubMeta}>
        <View style={styles.metaItem}>
          <Heart size={11} color={T.faint} />
          <Text style={styles.metaText}>{publication.likeCount}</Text>
        </View>
        <View style={styles.metaItem}>
          <Eye size={11} color={T.faint} />
          <Text style={styles.metaText}>{publication.viewCount}</Text>
        </View>
        {publication.flagCount > 0 && (
          <View style={styles.metaItem}>
            <Flag size={11} color={T.warning} />
            <Text style={[styles.metaText, { color: T.warning }]}>
              {publication.flagCount}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SEED
   ════════════════════════════════════════════════════════════════════════════ */

function SeedPanel({
  seedAll,
}: {
  seedAll: (args: { userId: Id<"users"> }) => Promise<SeedResult>;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);

  const currentUser = useQuery(api.users.getCurrentUser, {});

  const run = async () => {
    if (!currentUser) {
      toast.error("Utilisateur introuvable");
      return;
    }
    setLoading(true);
    try {
      const res = await seedAll({ userId: currentUser._id as Id<"users"> });
      setResult(res);
      toast.success("Données de démonstration insérées");
    } catch {
      toast.error("Erreur lors du seed des données");
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = () =>
    confirmAction(
      "Insérer les données de démo ?",
      "Des données réalistes seront ajoutées aux modules. Cette action est cumulative.",
      run,
    );

  const items = [
    { label: "Offres d'emploi", count: 3, color: "#8B5CF6" },
    { label: "Propriétés immo", count: 2, color: "#10B981" },
    { label: "Cours & formations", count: 2, color: "#6366F1" },
    { label: "Publications", count: 4, color: "#F97316" },
    { label: "Événements", count: 3, color: "#EC4899" },
  ];

  return (
    <View style={styles.panel}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: alpha(T.primary, 0.16),
          }}
        >
          <Database size={20} color="#A78BFA" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.panelTitle}>Données de démonstration</Text>
          <Text style={{ color: T.faint, fontSize: 11.5, marginTop: 2 }}>
            Pré-remplir les modules avec du contenu réaliste
          </Text>
        </View>
      </View>

      <View style={{ gap: 8, marginTop: 16 }}>
        {items.map(({ label, count, color }) => (
          <View
            key={label}
            style={[styles.seedRow, { backgroundColor: alpha(color, 0.08) }]}
          >
            <Text style={{ color, fontWeight: "900", fontSize: 15 }}>
              {count}
            </Text>
            <Text style={{ color: T.dim, fontSize: 12.5, fontWeight: "600" }}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {result && (
        <View style={styles.seedResult}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <CheckCircle size={14} color={T.success} />
            <Text
              style={{ color: T.success, fontSize: 12.5, fontWeight: "800" }}
            >
              Seed réussi
            </Text>
          </View>
          <Text
            style={{
              color: alpha(T.success, 0.75),
              fontSize: 11.5,
              marginTop: 5,
              lineHeight: 17,
            }}
          >
            {result.jobs} emplois · {result.properties} propriétés ·{" "}
            {result.courses} cours · {result.publications} publications ·{" "}
            {result.events} événements
          </Text>
        </View>
      )}

      <Pressable
        onPress={handleSeed}
        disabled={loading || !currentUser}
        style={({ pressed }) => [
          styles.primaryBtn,
          {
            opacity: loading || !currentUser ? 0.5 : pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        {loading ? (
          <Loader2 size={16} color="#fff" />
        ) : (
          <Database size={16} color="#fff" />
        )}
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13.5 }}>
          {loading ? "Insertion en cours…" : "Insérer les données de démo"}
        </Text>
      </Pressable>

      <Text
        style={{
          color: T.faint,
          fontSize: 11,
          textAlign: "center",
          marginTop: 10,
        }}
      >
        Action cumulative — les données s'ajoutent à chaque exécution.
      </Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   ADMIN PAGE
   ════════════════════════════════════════════════════════════════════════════ */

export default function AdminPage({ onBack }: Props) {
  const { isAuthenticated } = useFirebaseAuth();

  const isAdminUser = useQuery(
    api.admin.isAdmin,
    isAuthenticated ? {} : "skip",
  );

  const [activeTab, setActiveTab] = useState<Tab>("stats");
  const [userSearch, setUserSearch] = useState("");
  const [flagFilter, setFlagFilter] = useState<FlagFilter>("all");
  const [showResolved, setShowResolved] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const stats = useQuery(api.admin.getPlatformStats, isAdminUser ? {} : "skip");
  const users = useQuery(
    api.admin.listUsers,
    isAdminUser ? { search: userSearch.trim() || undefined } : "skip",
  );
  const flags = useQuery(
    api.admin.listFlags,
    isAdminUser ? { contentType: flagFilter, resolved: showResolved } : "skip",
  );
  const publications = useQuery(
    api.admin.listPublications,
    isAdminUser && activeTab === "content" ? {} : "skip",
  );

  const seedAll = useMutation(api.seed.seedAll);
  const banUser = useMutation(api.admin.banUser);
  const setAdminRole = useMutation(api.admin.setAdminRole);
  const resolveFlag = useMutation(api.admin.resolveFlag);
  const bulkResolve = useMutation(api.admin.bulkResolveFlags);
  const bulkBan = useMutation(api.admin.bulkBanAuthors);
  const hidePublication = useMutation(api.admin.hidePublication);
  const unhidePublication = useMutation(api.admin.unhidePublication);

  /* ── Garde d'accès ─────────────────────────────────────────────────────── */
  if (!isAuthenticated || isAdminUser === undefined) {
    return <LoadingSkeleton onBack={onBack} />;
  }
  if (!isAdminUser) {
    return <AccessDenied onBack={onBack} />;
  }

  /* ── Dérivés ───────────────────────────────────────────────────────────── */
  const flagList = (flags ?? []) as unknown as FlagItem[];
  const allFlagIds = flagList.map((f) => f._id);
  const allSelected =
    allFlagIds.length > 0 && allFlagIds.every((id) => selected.has(id));

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(allFlagIds));

  const clearSelection = () => setSelected(new Set());

  /* ── Actions groupées ──────────────────────────────────────────────────── */
  const handleBulkResolve = async (action: BulkAction) => {
    const ids = Array.from(selected) as Id<"contentFlags">[];
    if (!ids.length) return;
    setBulkLoading(true);
    try {
      await bulkResolve({ flagIds: ids, action });
      toast.success(`${ids.length} signalement(s) traité(s)`);
      clearSelection();
    } catch {
      toast.error("Erreur lors du traitement");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkBan = () => {
    const ids = Array.from(selected) as Id<"contentFlags">[];
    if (!ids.length) return;
    confirmAction(
      "Bannir les auteurs ?",
      `${ids.length} auteur(s) seront bannis de la plateforme.`,
      async () => {
        setBulkLoading(true);
        try {
          const count = await bulkBan({ flagIds: ids });
          toast.success(`${count} auteur(s) banni(s)`);
          clearSelection();
        } catch {
          toast.error("Erreur lors du bannissement");
        } finally {
          setBulkLoading(false);
        }
      },
    );
  };

  /* ── Tabs ──────────────────────────────────────────────────────────────── */
  const TABS: {
    id: Tab;
    label: string;
    icon: typeof Shield;
    badge?: number;
  }[] = [
    { id: "stats", label: "Stats", icon: BarChart2 },
    {
      id: "users",
      label: "Utilisateurs",
      icon: Users,
      badge: stats?.totalUsers,
    },
    {
      id: "flags",
      label: "Signalements",
      icon: Flag,
      badge: stats?.pendingFlags,
    },
    {
      id: "content",
      label: "Contenu",
      icon: FileText,
      badge: stats?.totalPublications,
    },
    { id: "seed", label: "Seed", icon: Database },
  ];

  /* ── Rendu ─────────────────────────────────────────────────────────────── */
  return (
    <View style={styles.root}>
      {/* Halo décoratif */}
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
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
            >
              <Crown size={16} color={T.gold} />
              <Text style={styles.title}>Tableau de bord</Text>
            </View>
            <Text style={styles.subtitle}>
              Gestion & modération de la plateforme
            </Text>
          </View>

          <View style={styles.adminPill}>
            <Shield size={11} color="#C4B5FD" />
            <Text
              style={{
                color: "#C4B5FD",
                fontSize: 9.5,
                fontWeight: "900",
                letterSpacing: 0.5,
              }}
            >
              ADMIN
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 14 }}
          style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            const showBadge = tab.id === "flags" && (tab.badge ?? 0) > 0;
            return (
              <Pressable
                key={tab.id}
                onPress={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== "flags") clearSelection();
                }}
                style={({ pressed }) => [
                  styles.tab,
                  active && styles.tabActive,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Icon size={13} color={active ? "#fff" : T.faint} />
                <Text style={[styles.tabText, active && { color: "#fff" }]}>
                  {tab.label}
                </Text>
                {showBadge && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>
                      {tab.badge! > 99 ? "99+" : tab.badge}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Contenu */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── STATS ─────────────────────────────────────────────────────── */}
        {activeTab === "stats" &&
          (stats ? (
            <StatsPanel stats={stats as unknown as StatsData} />
          ) : (
            <View style={{ gap: 12 }}>
              <Skeleton style={{ height: 120, borderRadius: 22 }} />
              <Skeleton style={{ height: 120, borderRadius: 22 }} />
              <Skeleton style={{ height: 200, borderRadius: 26 }} />
            </View>
          ))}

        {/* ── USERS ─────────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <View style={{ gap: 10 }}>
            <View style={styles.searchWrap}>
              <Search size={15} color={T.faint} />
              <TextInput
                value={userSearch}
                onChangeText={setUserSearch}
                placeholder="Rechercher un utilisateur…"
                placeholderTextColor={T.faint}
                autoCorrect={false}
                style={styles.searchInput}
              />
              {userSearch.length > 0 && (
                <Pressable onPress={() => setUserSearch("")} hitSlop={10}>
                  <XCircle size={15} color={T.faint} />
                </Pressable>
              )}
            </View>

            {users === undefined ? (
              [0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} style={{ height: 68, borderRadius: 20 }} />
              ))
            ) : users.length === 0 ? (
              <EmptyState icon={Users} label="Aucun utilisateur trouvé" />
            ) : (
              (users as unknown as UserItem[]).map((user) => (
                <UserRow
                  key={user._id}
                  user={user}
                  onBan={async (ban) => {
                    await banUser({
                      userId: user._id as Id<"users">,
                      ban,
                    });
                    toast.success(
                      ban ? "Utilisateur banni" : "Bannissement levé",
                    );
                  }}
                  onToggleAdmin={async (isAdm) => {
                    await setAdminRole({
                      userId: user._id as Id<"users">,
                      isAdmin: isAdm,
                    });
                    toast.success(
                      isAdm ? "Rôle admin accordé" : "Rôle admin retiré",
                    );
                  }}
                />
              ))
            )}
          </View>
        )}

        {/* ── FLAGS ─────────────────────────────────────────────────────── */}
        {activeTab === "flags" && (
          <View style={{ gap: 12 }}>
            {/* Filtres */}
            <View style={styles.filterRow}>
              <View style={styles.segmented}>
                {(["all", "publication", "comment"] as const).map((f) => {
                  const active = flagFilter === f;
                  const Icon =
                    f === "all"
                      ? Filter
                      : f === "publication"
                        ? FileText
                        : MessageSquare;
                  const label =
                    f === "all"
                      ? "Tous"
                      : f === "publication"
                        ? "Publications"
                        : "Commentaires";
                  return (
                    <Pressable
                      key={f}
                      onPress={() => {
                        setFlagFilter(f);
                        clearSelection();
                      }}
                      style={[styles.segment, active && styles.segmentActive]}
                    >
                      <Icon size={11} color={active ? "#fff" : T.faint} />
                      <Text
                        style={[
                          styles.segmentText,
                          active && { color: "#fff" },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={() => {
                  setShowResolved((r) => !r);
                  clearSelection();
                }}
                style={[
                  styles.resolvedToggle,
                  showResolved && {
                    backgroundColor: alpha(T.success, 0.14),
                    borderColor: alpha(T.success, 0.32),
                  },
                ]}
              >
                <CheckCircle
                  size={11}
                  color={showResolved ? T.success : T.faint}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: showResolved ? T.success : T.faint,
                  }}
                >
                  {showResolved ? "Résolus" : "En attente"}
                </Text>
              </Pressable>
            </View>

            {/* Barre d'actions groupées */}
            {!showResolved && flagList.length > 0 && (
              <View style={styles.bulkBar}>
                <Pressable
                  onPress={toggleAll}
                  style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
                >
                  {allSelected ? (
                    <CheckSquare size={15} color="#A78BFA" />
                  ) : (
                    <Square size={15} color={T.faint} />
                  )}
                  <Text
                    style={{
                      color: T.dim,
                      fontSize: 11.5,
                      fontWeight: "700",
                    }}
                  >
                    {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
                  </Text>
                </Pressable>

                {selected.size > 0 && (
                  <>
                    <View style={styles.selectedCount}>
                      <Text
                        style={{
                          color: "#C4B5FD",
                          fontSize: 10.5,
                          fontWeight: "900",
                        }}
                      >
                        {selected.size}
                      </Text>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 6 }}
                      style={{ flex: 1 }}
                    >
                      {bulkLoading ? (
                        <ActivityIndicator size="small" color={T.primary} />
                      ) : (
                        <>
                          <BulkBtn
                            label="Ignorer"
                            color="#6B7280"
                            onPress={() => handleBulkResolve("dismiss")}
                          />
                          <BulkBtn
                            label="Masquer"
                            color={T.warning}
                            onPress={() =>
                              handleBulkResolve("hide_publication")
                            }
                          />
                          <BulkBtn
                            label="Supprimer"
                            color={T.danger}
                            onPress={() =>
                              handleBulkResolve("remove_publication")
                            }
                          />
                          <BulkBtn
                            label="Bannir"
                            color="#DC2626"
                            onPress={handleBulkBan}
                          />
                        </>
                      )}
                    </ScrollView>
                  </>
                )}
              </View>
            )}

            {/* Liste */}
            {flags === undefined ? (
              [0, 1, 2].map((i) => (
                <Skeleton key={i} style={{ height: 118, borderRadius: 22 }} />
              ))
            ) : flagList.length === 0 ? (
              <EmptyState
                icon={showResolved ? FileText : CheckCircle}
                label={
                  showResolved
                    ? "Aucun signalement résolu"
                    : "Aucun signalement en attente"
                }
                color={showResolved ? T.faint : T.success}
              />
            ) : (
              flagList.map((flag) => (
                <FlagCard
                  key={flag._id}
                  flag={flag}
                  isSelected={selected.has(flag._id)}
                  onSelect={() => toggleSelect(flag._id)}
                  showResolved={showResolved}
                  onDismiss={async () => {
                    await resolveFlag({
                      flagId: flag._id as Id<"contentFlags">,
                      action: "dismiss",
                    });
                    toast.success("Signalement ignoré");
                  }}
                  onHide={async () => {
                    await resolveFlag({
                      flagId: flag._id as Id<"contentFlags">,
                      action: "hide_publication",
                    });
                    toast.success("Publication masquée");
                  }}
                  onRemove={async () => {
                    const action =
                      flag.contentType === "comment"
                        ? "remove_comment"
                        : "remove_publication";
                    await resolveFlag({
                      flagId: flag._id as Id<"contentFlags">,
                      action,
                    });
                    toast.success(
                      flag.contentType === "comment"
                        ? "Commentaire supprimé"
                        : "Publication supprimée",
                    );
                  }}
                />
              ))
            )}
          </View>
        )}

        {/* ── CONTENT ───────────────────────────────────────────────────── */}
        {activeTab === "content" && (
          <View style={{ gap: 10 }}>
            {publications === undefined ? (
              [0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} style={{ height: 92, borderRadius: 20 }} />
              ))
            ) : (publications as unknown as PublicationItem[]).length === 0 ? (
              <EmptyState icon={FileText} label="Aucune publication" />
            ) : (
              (publications as unknown as PublicationItem[]).map((pub) => (
                <PublicationRow
                  key={pub._id}
                  publication={pub}
                  onToggleVisibility={async () => {
                    try {
                      if (pub.isHidden) {
                        await unhidePublication({
                          publicationId: pub._id as Id<"publications">,
                        });
                        toast.success("Publication affichée");
                      } else {
                        await hidePublication({
                          publicationId: pub._id as Id<"publications">,
                        });
                        toast.success("Publication masquée");
                      }
                    } catch {
                      toast.error("Erreur lors de la modification");
                    }
                  }}
                />
              ))
            )}
          </View>
        )}

        {/* ── SEED ──────────────────────────────────────────────────────── */}
        {activeTab === "seed" && <SeedPanel seedAll={seedAll} />}
      </ScrollView>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { alignItems: "center", justifyContent: "center", padding: 32 },

  glow: {
    position: "absolute",
    top: -140,
    left: -80,
    right: -80,
    height: 320,
    borderRadius: 200,
    backgroundColor: alpha(T.primary, 0.1),
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
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  subtitle: { color: T.faint, fontSize: 11.5, marginTop: 2 },
  adminPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 11,
    backgroundColor: alpha(T.primary, 0.16),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.32),
  },

  /* Tabs */
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
  },
  tabActive: {
    backgroundColor: T.primary,
    borderColor: alpha(T.primary, 0.7),
  },
  tabText: { color: T.faint, fontSize: 12.5, fontWeight: "800" },
  tabBadge: {
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: T.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },

  /* Content */
  content: { paddingHorizontal: 20, paddingBottom: 60, paddingTop: 4 },

  /* Stats */
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "31.5%",
    minWidth: 100,
    flexGrow: 1,
    padding: 13,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    gap: 8,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: T.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  statLabel: { color: T.faint, fontSize: 10.5, fontWeight: "600" },

  panel: {
    padding: 18,
    borderRadius: 26,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  panelHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 16,
  },
  panelTitle: { color: T.text, fontSize: 13.5, fontWeight: "800" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },

  /* Users */
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 18,
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
  userCard: {
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  userHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 14 },
  userActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 12,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },

  /* Action button */
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 11.5, fontWeight: "800" },

  /* Flags */
  filterRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  segmented: {
    flex: 1,
    flexDirection: "row",
    gap: 3,
    padding: 3,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 7,
    borderRadius: 12,
  },
  segmentActive: { backgroundColor: T.primary },
  segmentText: { color: T.faint, fontSize: 11, fontWeight: "800" },
  resolvedToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
  },
  bulkBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  selectedCount: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: alpha(T.primary, 0.2),
    alignItems: "center",
    justifyContent: "center",
  },
  flagCard: {
    padding: 14,
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  flagIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  flagActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  noteBox: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderLeftWidth: 2,
    borderLeftColor: alpha(T.primary, 0.5),
  },
  noteText: {
    color: T.dim,
    fontSize: 11.5,
    fontStyle: "italic",
    lineHeight: 17,
  },

  /* Publications */
  pubCard: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  visibilityBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  pubMeta: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: T.faint, fontSize: 11, fontWeight: "700" },

  /* Seed */
  seedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 14,
  },
  seedResult: {
    marginTop: 16,
    padding: 13,
    borderRadius: 18,
    backgroundColor: alpha(T.success, 0.09),
    borderWidth: 1,
    borderColor: alpha(T.success, 0.22),
  },
  primaryBtn: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 18,
    backgroundColor: T.primary,
    shadowColor: T.primary,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  /* Empty */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 14,
  },

  /* Denied */
  deniedIcon: {
    width: 88,
    height: 88,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.danger, 0.12),
    borderWidth: 1,
    borderColor: alpha(T.danger, 0.28),
    marginBottom: 22,
  },
  deniedTitle: {
    color: T.text,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  deniedText: {
    color: T.dim,
    fontSize: 13.5,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
    marginBottom: 26,
  },
  deniedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: T.borderUp,
  },
});

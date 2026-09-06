import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image, TextInput } from "react-native";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import {
  Shield,
  Users,
  FileText,
  Flag,
  BarChart2,
  ArrowLeft,
  Search,
  Ban,
  CheckCircle,
  Trash2,
  ChevronRight,
  AlertTriangle,
  Crown,
  XCircle,
  Eye,
  TrendingUp,
  EyeOff,
  CheckSquare,
  Square,
  Filter,
  MessageSquare,
  Heart,
  EyeIcon,
  Database,
  Loader2,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

type Tab = "stats" | "users" | "flags" | "content" | "seed";
type FlagFilter = "all" | "publication" | "comment";

interface Props {
  onBack: () => void;
}

// ─── Types de résultats ────────────────────────────────────────────────────────
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

// ─── Composants ─────────────────────────────────────────────────────────────────

function LoadingSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <View
      className="h-full w-full flex flex-col px-5 pt-14 gap-4"
      style={{  }}
    >
      <View className="flex items-center gap-3">
        <Pressable
          onPress={onBack}
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft size={20} className="text-white" />
        </Pressable>
        <Skeleton className="h-6 w-48 rounded-xl" />
      </View>
      <View className="gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </View>
      <Skeleton className="h-48 w-full rounded-3xl" />
    </View>
  );
}

function StatsPanel({ stats }: { stats: StatsData }) {
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
  };
  const topTypes = Object.entries(stats.publicationsByType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const maxCount = topTypes[0]?.[1] ?? 1;

  return (
    <View className="space-y-4">
      <View className="gap-3">
        {[
          {
            label: "Utilisateurs",
            value: stats.totalUsers,
            icon: Users,
            color: "#6366F1",
          },
          {
            label: "Publications",
            value: stats.totalPublications,
            icon: FileText,
            color: "#10B981",
          },
          {
            label: "Bannis",
            value: stats.bannedUsers,
            icon: Ban,
            color: "#EF4444",
          },
          {
            label: "Signalements",
            value: stats.pendingFlags,
            icon: Flag,
            color: "#F97316",
          },
          {
            label: "Masqués auto",
            value: stats.hiddenPublications,
            icon: EyeOff,
            color: "#8B5CF6",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <View
            key={label}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <View
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}22` }}
            >
              <Icon size={18} style={{ color }} />
            </View>
            <View>
              <Text className="text-white text-xl font-bold">
                {value.toLocaleString()}
              </Text>
              <Text className="text-white/40 text-xs">{label}</Text>
            </View>
          </View>
        ))}
      </View>

      <View
        className="rounded-3xl p-5 space-y-4"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
      >
        <View className="flex items-center gap-2">
          <TrendingUp size={16} className="text-violet-400" />
          <Text className="text-white font-semibold text-sm">
            Top catégories
          </Text>
        </View>
        {topTypes.length === 0 ? (
          <Text className="text-white/30 text-xs">Aucune publication</Text>
        ) : (
          <View className="space-y-3">
            {topTypes.map(([type, count]) => (
              <View key={type} className="space-y-1">
                <View className="flex justify-between text-xs">
                  <Text className="text-white/70">
                    {TYPE_LABELS[type] ?? type}
                  </Text>
                  <Text className="text-white/50">{count}</Text>
                </View>
                <View
                  className="h-1.5 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

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
  const initial = (user.name ?? user.email ?? "?")[0].toUpperCase();
  const handle = async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(239,68,68,0.3)", borderStyle: "solid" }}
    >
      <Pressable
        className="w-full flex items-center gap-3 p-3"
        onPress={() => setExpanded((e) => !e)}
      >
        {user.avatar ? (
          <Image
           
           
            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
           source={{ uri: user.avatar }} accessibilityLabel=""/>
        ) : (
          <View
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
            style={{  }}
          >
            {initial}
          </View>
        )}
        <View className="flex-1 text-left min-w-0">
          <View className="flex items-center gap-1.5 flex-wrap">
            <Text className="text-white text-sm font-medium truncate">
              {user.name ?? "Anonyme"}
            </Text>
            {user.isAdmin && (
              <Text
                className="px-1.5 py-0.5 rounded text-[9px] font-black text-yellow-400"
                style={{ backgroundColor: "rgba(234,179,8,0.15)" }}
              >
                ADMIN
              </Text>
            )}
            {user.isBanned && (
              <Text
                className="px-1.5 py-0.5 rounded text-[9px] font-black text-red-400"
                style={{ backgroundColor: "rgba(239,68,68,0.15)" }}
              >
                BANNI
              </Text>
            )}
          </View>
          <Text className="text-white/40 text-xs truncate">
            {user.email ?? user.city ?? "—"}
          </Text>
        </View>
        <ChevronRight
          size={14}
          className={cn(
            "text-white/30 transition-transform flex-shrink-0",
            expanded && "rotate-90",
          )}
        />
      </Pressable>
      <>
        {expanded && (
          <View
            className="overflow-hidden"
          >
            <View className="px-3 pb-3 flex gap-2 flex-wrap border-t border-white/5 pt-3">
              <ActionBtn
                label={user.isBanned ? "Débannir" : "Bannir"}
                icon={user.isBanned ? CheckCircle : Ban}
                color={user.isBanned ? "#10B981" : "#EF4444"}
                loading={loading}
                onPress={() => handle(() => onBan(!user.isBanned))}
              />
              <ActionBtn
                label={user.isAdmin ? "Retirer admin" : "Rendre admin"}
                icon={user.isAdmin ? XCircle : Crown}
                color={user.isAdmin ? "#F97316" : "#FBBF24"}
                loading={loading}
                onPress={() => handle(() => onToggleAdmin(!user.isAdmin))}
              />
            </View>
          </View>
        )}
      </>
    </View>
  );
}

function ActionBtn({
  label,
  icon: Icon,
  color,
  loading,
  onClick,
}: {
  label: string;
  icon: typeof Shield;
  color: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Pressable
      onPress={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
      style={{ backgroundColor: `${color}18`, borderStyle: "solid" }}
    >
      <Icon size={12} />
      {label}
    </Pressable>
  );
}

function BulkBtn({
  label,
  color,
  onClick,
}: {
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <Pressable
      onPress={onClick}
      className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold"
      style={{ backgroundColor: `${color}18`, borderStyle: "solid" }}
    >
      {label}
    </Pressable>
  );
}

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  inappropriate: "Contenu inapproprié",
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
  const handle = async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
    } finally {
      setLoading(false);
    }
  };
  const color = REASON_COLORS[flag.reason] ?? "#6B7280";

  const isComment = flag.contentType === "comment";
  const contentTitle = isComment
    ? (flag.comment?.text?.slice(0, 60) ?? "Commentaire supprimé")
    : (flag.publication?.title ?? "Publication supprimée");

  return (
    <View
      className="rounded-2xl p-4 space-y-3"
      style={{ backgroundColor: isSelected
                ? "rgba(139,92,246,0.12)"
                : "rgba(255,255,255,0.05)", borderColor: "rgba(139,92,246,0.4)", borderStyle: "solid" }}
    >
      <View className="flex items-start gap-3">
        {!showResolved && (
          <Pressable
            onPress={onSelect}
            className="mt-0.5 flex-shrink-0"
          >
            {isSelected ? (
              <CheckSquare size={16} className="text-violet-400" />
            ) : (
              <Square size={16} className="text-white/30" />
            )}
          </Pressable>
        )}
        <View
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}22` }}
        >
          {isComment ? (
            <MessageSquare size={16} style={{ color }} />
          ) : (
            <AlertTriangle size={16} style={{ color }} />
          )}
        </View>
        <View className="flex-1 min-w-0">
          <View className="flex items-center gap-2 flex-wrap">
            <Text
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: `${color}22`, color }}
            >
              {REASON_LABELS[flag.reason] ?? flag.reason}
            </Text>
            <Text
              className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white/40"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            >
              {isComment ? "Commentaire" : "Publication"}
            </Text>
            {flag.publication?.isHidden && (
              <Text
                className="px-2 py-0.5 rounded-full text-[10px] font-bold text-orange-400"
                style={{ backgroundColor: "rgba(249,115,22,0.15)" }}
              >
                MASQUÉ
              </Text>
            )}
          </View>
          <Text className="text-white text-sm font-medium mt-1">
            {contentTitle}
          </Text>
          <Text className="text-white/40 text-xs">
            Signalé par : {flag.reporter?.name ?? "Anonyme"}
          </Text>
          {flag.note && (
            <Text className="text-white/50 text-xs mt-1 italic">{`"${flag.note}"`}</Text>
          )}
        </View>
      </View>
      {!showResolved && (
        <View className="flex gap-2 flex-wrap">
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
              color="#F97316"
              loading={loading}
              onPress={() => handle(onHide)}
            />
          )}
          <ActionBtn
            label="Supprimer"
            icon={Trash2}
            color="#EF4444"
            loading={loading}
            onPress={() => handle(onRemove)}
          />
        </View>
      )}
    </View>
  );
}

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

function PublicationRow({
  publication,
  onToggleVisibility,
}: {
  publication: PublicationItem;
  onToggleVisibility: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const badgeColor = TYPE_BADGE_COLORS[publication.type] ?? "#6B7280";

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
      className="rounded-2xl p-4 space-y-2"
      style={{ backgroundColor: publication.isHidden
                ? "rgba(239,68,68,0.06)"
                : "rgba(255,255,255,0.05)", borderColor: "rgba(239,68,68,0.2)", borderStyle: "solid" }}
    >
      <View className="flex items-start gap-3">
        <View className="flex-1 min-w-0">
          <Text className="text-white text-sm font-medium truncate">
            {publication.title}
          </Text>
          <View className="flex items-center gap-2 flex-wrap mt-1.5">
            <Text
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: `${badgeColor}22`, color: badgeColor }}
            >
              {publication.type}
            </Text>
            <Text
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium",
                publication.status === "active"
                  ? "text-green-400"
                  : "text-white/40",
              )}
              style={{ backgroundColor: publication.status === "active"
                                  ? "rgba(16,185,129,0.15)"
                                  : "rgba(255,255,255,0.06)" }}
            >
              {publication.status}
            </Text>
            {publication.isHidden && (
              <Text
                className="px-2 py-0.5 rounded-full text-[10px] font-bold text-red-400"
                style={{ backgroundColor: "rgba(239,68,68,0.15)" }}
              >
                MASQUÉ
              </Text>
            )}
          </View>
        </View>
        <Pressable
          onPress={handleToggle}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 flex-shrink-0"
          style={{ backgroundColor: publication.isHidden
                        ? "rgba(16,185,129,0.15)"
                        : "rgba(249,115,22,0.15)", borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid" }}
        >
          {publication.isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
          {publication.isHidden ? "Afficher" : "Masquer"}
        </Pressable>
      </View>
      <View className="flex items-center gap-4 text-white/40 text-xs">
        <Text className="flex items-center gap-1">
          <Heart size={11} /> {publication.likeCount}
        </Text>
        <Text className="flex items-center gap-1">
          <EyeIcon size={11} /> {publication.viewCount}
        </Text>
        {publication.flagCount > 0 && (
          <Text className="flex items-center gap-1 text-orange-400">
            <Flag size={11} /> {publication.flagCount}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Seed Panel corrigé ─────────────────────────────────────────────────────────
function SeedPanel({
  seedAll,
  email,
}: {
  seedAll: (args: { userId: Id<"users"> }) => Promise<SeedResult>;
  email?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);

  const currentUser = useQuery(api.users.getCurrentUser, {});

  const handleSeed = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await seedAll({ userId: currentUser._id });
      setResult(res);
      UIService.openToast("Données de démonstration insérées avec succès !", "success");
    } catch {
      UIService.openToast("Erreur lors du seed des données", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="space-y-4">
      <View
        className="rounded-3xl p-5 space-y-4"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center gap-3">
          <View
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(139,92,246,0.2)" }}
          >
            <Database size={20} className="text-violet-400" />
          </View>
          <View>
            <Text className="text-white font-semibold text-sm">
              Données de démonstration
            </Text>
            <Text className="text-white/40 text-xs">
              Pré-remplir les modules avec des données réalistes
            </Text>
          </View>
        </View>

        <View className="gap-2 text-xs">
          {[
            { label: "Offres d'emploi", count: 3, color: "#8b5cf6" },
            { label: "Propriétés immo", count: 2, color: "#10b981" },
            { label: "Cours & formations", count: 2, color: "#6366f1" },
            { label: "Publications", count: 4, color: "#f97316" },
            { label: "Événements", count: 3, color: "#ec4899" },
          ].map(({ label, count, color }) => (
            <View
              key={label}
              className="flex items-center gap-2 p-2.5 rounded-xl"
              style={{ backgroundColor: `${color}12`, borderStyle: "solid" }}
            >
              <Text className="font-bold text-base" style={{ color }}>
                {count}
              </Text>
              <Text className="text-white/60">{label}</Text>
            </View>
          ))}
        </View>

        {result && (
          <View
            className="p-3 rounded-2xl"
            style={{ backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)", borderStyle: "solid" }}
          >
            <Text className="text-green-400 text-sm font-semibold mb-1">
              ✓ Seed réussi
            </Text>
            <Text className="text-green-300/70 text-xs">
              {result.jobs} emplois · {result.properties} propriétés ·{" "}
              {result.courses} cours · {result.publications} publications ·{" "}
              {result.events} événements
            </Text>
          </View>
        )}

        <Pressable
          onPress={handleSeed}
          disabled={loading || !currentUser}
          className="w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{  }}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin text-white" />
          ) : (
            <Database size={16} className="text-white" />
          )}
          <Text className="text-white">
            {loading ? "Insertion en cours..." : "Insérer les données de démo"}
          </Text>
        </Pressable>
        <Text className="text-white/30 text-xs text-center">
          Cette action peut être répétée — les données s'ajoutent.
        </Text>
      </View>
    </View>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────────

export default function AdminPage({ onBack }: Props) {
  // ✅ Récupérer l'utilisateur Firebase
  const { isAuthenticated, user } = useFirebaseAuth();
  const email = user?.email;

  // ⚠️ admin.isAdmin n'accepte pas encore email → on utilise isAuthenticated
  const isAdminUser = useQuery(
    api.admin.isAdmin,
    isAuthenticated ? {} : "skip",
  );

  const [activeTab, setActiveTab] = useState<Tab>("stats");
  const [userSearch, setUserSearch] = useState("");
  const [flagFilter, setFlagFilter] = useState<FlagFilter>("all");
  const [showResolved, setShowResolved] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const stats = useQuery(api.admin.getPlatformStats, isAdminUser ? {} : "skip");
  const users = useQuery(
    api.admin.listUsers,
    isAdminUser ? { search: userSearch || undefined } : "skip",
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

  if (!isAuthenticated || isAdminUser === undefined) {
    return <LoadingSkeleton onBack={onBack} />;
  }

  if (!isAdminUser) {
    return (
      <View
        className="h-full w-full flex flex-col items-center justify-center gap-6 px-8"
        style={{  }}
      >
        <View
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{  }}
        >
          <Shield size={40} className="text-white" />
        </View>
        <View className="text-center">
          <Text className="text-white text-2xl font-bold mb-2">Accès Refusé</Text>
          <Text className="text-white/50 text-sm">
            Cette section est réservée aux administrateurs.
          </Text>
        </View>
        <Pressable
          onPress={onBack}
          className="px-6 py-3 rounded-2xl text-white font-semibold"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
        >
          <Text>Retour</Text></Pressable>
      </View>
    );
  }

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

  const allFlagIds = (flags ?? []).map((f) => f._id);
  const allSelected =
    allFlagIds.length > 0 && allFlagIds.every((id) => selected.has(id));

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allFlagIds));
  };

  const handleBulkResolve = async (
    action: "dismiss" | "remove_publication" | "hide_publication",
  ) => {
    const ids = Array.from(selected) as Id<"contentFlags">[];
    if (!ids.length) return;
    try {
      await bulkResolve({ flagIds: ids, action });
      UIService.openToast(`${ids.length} signalement(s) traité(s)`, "success");
      setSelected(new Set());
    } catch {
      UIService.openToast("Erreur lors du traitement", "error");
    }
  };

  const handleBulkBan = async () => {
    const ids = Array.from(selected) as Id<"contentFlags">[];
    if (!ids.length) return;
    try {
      const count = await bulkBan({ flagIds: ids });
      UIService.openToast(`${count} auteur(s) banni(s)`, "success");
      setSelected(new Set());
    } catch {
      UIService.openToast("Erreur lors du bannissement", "error");
    }
  };

  return (
    <View
      className="h-full w-full flex flex-col"
      style={{  }}
    >
      {/* Header */}
      <View className="flex-shrink-0 px-5 pt-14 pb-4">
        <View className="flex items-center gap-3 mb-6">
          <Pressable
            onPress={onBack}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <ArrowLeft size={20} className="text-white" />
          </Pressable>
          <View>
            <Text className="text-white text-xl font-bold flex items-center gap-2">
              <Crown size={18} className="text-yellow-400" /> Tableau de Bord
              Admin
            </Text>
            <Text className="text-white/40 text-xs">Gestion de la plateforme</Text>
          </View>
        </View>

        <View className="flex gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold cursor-pointer transition-all relative",
                  activeTab === tab.id ? "text-white" : "text-white/40",
                )}
                style={
                  activeTab === tab.id
                    ? {  }
                    : { backgroundColor: "rgba(255,255,255,0.06)" }
                }
              >
                <Icon size={14} />
                {tab.label}
                {tab.badge !== undefined &&
                  tab.badge > 0 &&
                  tab.id === "flags" && (
                    <Text className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </Text>
                  )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Content */}
      <View
        className="flex-1 overflow-y-auto px-5 pb-8"
        style={{  }}
      >
        <>
          {activeTab === "stats" && (
            <View
              key="stats"
              className="space-y-4"
            >
              {stats ? (
                <StatsPanel stats={stats} />
              ) : (
                <Skeleton className="h-64 w-full rounded-3xl" />
              )}
            </View>
          )}

          {activeTab === "users" && (
            <View
              key="users"
              className="space-y-3"
            >
              <View className="relative">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                />
                <TextInput
                  value={userSearch}
                  onChangeText={(text) => setUserSearch(text)}
                  placeholder="Rechercher un utilisateur…"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm text-white placeholder-white/30 outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
                />
              </View>
              {users === undefined
                ? Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                  ))
                : users.map((user) => (
                    <UserRow
                      key={user._id}
                      user={user}
                      onBan={async (ban) => {
                        await banUser({ userId: user._id as Id<"users">, ban });
                        UIService.openToast(ban ? "Utilisateur banni" : "Bannissement levé", "success");
                      }}
                      onToggleAdmin={async (isAdm) => {
                        await setAdminRole({
                          userId: user._id as Id<"users">,
                          isAdmin: isAdm,
                        });
                        UIService.openToast(isAdm ? "Rôle admin accordé" : "Rôle admin retiré", "success");
                      }}
                    />
                  ))}
            </View>
          )}

          {activeTab === "flags" && (
            <View
              key="flags"
              className="space-y-3"
            >
              <View className="flex gap-2 flex-wrap">
                <View
                  className="flex gap-1 rounded-xl p-1"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  {(["all", "publication", "comment"] as const).map((f) => (
                    <Pressable
                      key={f}
                      onPress={() => {
                        setFlagFilter(f);
                        setSelected(new Set());
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1",
                        flagFilter === f ? "text-white" : "text-white/40",
                      )}
                      style={
                        flagFilter === f
                          ? {  }
                          : {}
                      }
                    >
                      {f === "all" && <Filter size={11} />}
                      {f === "publication" && <FileText size={11} />}
                      {f === "comment" && <MessageSquare size={11} />}
                      {f === "all"
                        ? "Tous"
                        : f === "publication"
                          ? "Publications"
                          : "Commentaires"}
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  onPress={() => {
                    setShowResolved((r) => !r);
                    setSelected(new Set());
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1",
                    showResolved ? "text-green-400" : "text-white/40",
                  )}
                  style={{ backgroundColor: showResolved
                                        ? "rgba(16,185,129,0.15)"
                                        : "rgba(255,255,255,0.05)" }}
                >
                  <CheckCircle size={11} />
                  {showResolved ? "Résolus" : "En attente"}
                </Pressable>
              </View>

              {!showResolved && (flags ?? []).length > 0 && (
                <View
                  className="flex items-center gap-2 p-3 rounded-2xl"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
                >
                  <Pressable
                    onPress={toggleAll}
                    className="flex items-center gap-1.5 text-white/60 text-xs"
                  >
                    {allSelected ? (
                      <CheckSquare size={14} className="text-violet-400" />
                    ) : (
                      <Square size={14} />
                    )}
                    {allSelected ? "Tout désélect." : "Tout sélect."}
                  </Pressable>
                  {selected.size > 0 && (
                    <>
                      <Text className="text-white/30 text-xs ml-1">
                        {selected.size} <Text>sél.</Text></Text>
                      <View className="flex gap-1.5 ml-auto">
                        <BulkBtn
                          label="Ignorer"
                          color="#6B7280"
                          onPress={() => handleBulkResolve("dismiss")}
                        />
                        <BulkBtn
                          label="Masquer"
                          color="#F97316"
                          onPress={() => handleBulkResolve("hide_publication")}
                        />
                        <BulkBtn
                          label="Supprimer"
                          color="#EF4444"
                          onPress={() =>
                            handleBulkResolve("remove_publication")
                          }
                        />
                        <BulkBtn
                          label="Bannir auteurs"
                          color="#DC2626"
                          onPress={handleBulkBan}
                        />
                      </View>
                    </>
                  )}
                </View>
              )}

              {flags === undefined ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))
              ) : flags.length === 0 ? (
                <View className="flex flex-col items-center justify-center py-16 gap-3">
                  <CheckCircle size={40} className="text-green-400" />
                  <Text className="text-white/50 text-sm">
                    {showResolved
                      ? "Aucun signalement résolu"
                      : "Aucun signalement en attente"}
                  </Text>
                </View>
              ) : (
                flags.map((flag) => (
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
                      UIService.openToast("Signalement ignoré", "success");
                    }}
                    onHide={async () => {
                      await resolveFlag({
                        flagId: flag._id as Id<"contentFlags">,
                        action: "hide_publication",
                      });
                      UIService.openToast("Publication masquée", "success");
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
                      UIService.openToast(flag.contentType === "comment"
                          ? "Commentaire supprimé"
                          : "Publication supprimée", "success");
                    }}
                  />
                ))
              )}
            </View>
          )}

          {activeTab === "content" && (
            <View
              key="content"
              className="space-y-3"
            >
              {publications === undefined ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))
              ) : publications.length === 0 ? (
                <View className="flex flex-col items-center justify-center py-16 gap-3">
                  <FileText size={40} className="text-white/30" />
                  <Text className="text-white/50 text-sm"><Text>Aucune publication</Text></Text>
                </View>
              ) : (
                publications.map((pub) => (
                  <PublicationRow
                    key={pub._id}
                    publication={pub}
                    onToggleVisibility={async () => {
                      try {
                        if (pub.isHidden) {
                          await unhidePublication({
                            publicationId: pub._id as Id<"publications">,
                          });
                          UIService.openToast("Publication affichée", "success");
                        } else {
                          await hidePublication({
                            publicationId: pub._id as Id<"publications">,
                          });
                          UIService.openToast("Publication masquée", "success");
                        }
                      } catch {
                        UIService.openToast("Erreur lors de la modification", "error");
                      }
                    }}
                  />
                ))
              )}
            </View>
          )}

          {activeTab === "seed" && (
            <View
              key="seed"
              className="space-y-4"
            >
              {/* ✅ Correction : passer email ?? undefined pour éviter l'erreur de type */}
              <SeedPanel seedAll={seedAll} email={email ?? undefined} />
            </View>
          )}
        </>
      </View>
    </View>
  );
}

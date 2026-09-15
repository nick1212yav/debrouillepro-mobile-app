import { Pressable, View, Text, TextInput } from "react-native";

// src/pages/modules/GroupesPage.tsx
// Page temporairement simplifiée : les fonctionnalités de posts dans les groupes sont désactivées
// car les mutations correspondantes n'existent pas encore dans le backend.

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { toast } from "sonner";
import {
  ArrowLeft,
  Users,
  Search,
  Plus,
  Bell,
  Lock,
  Globe,
  Crown,
  Shield,
  CheckCircle,
  MessageCircle,
  ChevronRight,
  X,
  Star,
  Zap,
  Flame,
  TrendingUp,
  MapPin,
} from "lucide-react-native";
import { Skeleton } from "@/components/ui/skeleton.tsx";

// ── Types ─────────────────────────────────────────────────────────────────────
type Role = "admin" | "moderator" | "member";

const ROLE_COLORS: Record<Role, string> = {
  admin: "#F59E0B",
  moderator: "#8B5CF6",
  member: "#6B7280",
};
const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  moderator: "Modér.",
  member: "Membre",
};
const ROLE_ICONS: Record<Role, React.ElementType> = {
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
const CATEGORIES = [
  "Tous",
  "Mes groupes",
  "Quartier",
  "Métier",
  "Intérêt",
  "Famille",
];

// ── Sub-components ────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: Role }) {
  const Icon = ROLE_ICONS[role];
  return (
    <Text className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: `${ROLE_COLORS[role]}22`, color: ROLE_COLORS[role] }}><Icon size={8} />{ROLE_LABELS[role]}</Text>
  );
}

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

function GroupeCard({
  groupe,
  onClick,
}: {
  groupe: GroupData;
  onClick: () => void;
}) {
  const color = COLOR_MAP[groupe.category] ?? "#8B5CF6";
  const emoji = EMOJI_MAP[groupe.category] ?? "👥";
  return (
    <Pressable whileTap={{ scale: 0.97 }} onPress={onClick} className="w-full text-left rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
      <View className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: `${color}18`, borderStyle: "solid" }}>{emoji}</View>
      <View className="flex-1 min-w-0"><View className="flex items-center gap-2 flex-wrap"><Text className="text-sm font-bold text-white truncate">{groupe.name}</Text>{groupe.isPrivate && (
            <Lock size={10} className="text-white/40 flex-shrink-0" />
          )}{groupe.role && <RoleBadge accessibilityRole={groupe.role as Role} />}</View><Text className="text-[11px] text-white/50 mt-0.5">{groupe.description}</Text><View className="flex items-center gap-3 mt-1.5"><Text className="flex items-center gap-1 text-[10px] text-white/40"><Users size={9} />{groupe.memberCount.toLocaleString()}</Text>{groupe.city && (
            <Text className="flex items-center gap-1 text-[10px] text-white/30"><MapPin size={9} />{groupe.city}</Text>
          )}</View></View>
      <ChevronRight size={14} className="text-white/30 flex-shrink-0" />
    </Pressable>
  );
}

// ── Group Detail (simplifié, posts désactivés) ──────────────────────────────
function GroupeDetail({
  groupe,
  onBack,
}: {
  groupe: GroupData;
  onBack: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [postText, setPostText] = useState("");
  const joinGroup = useMutation(api.community.joinGroup);

  const color = COLOR_MAP[groupe.category] ?? "#8B5CF6";
  const emoji = EMOJI_MAP[groupe.category] ?? "👥";

  const handleJoin = async () => {
    try {
      const result = await joinGroup({ groupId: groupe._id as Id<"groups"> });
      toast.success(result.joined ? "Groupe rejoint !" : "Groupe quitté");
    } catch {
      toast.error("Erreur lors de l'action");
    }
  };

  const handlePost = async () => {
    // Fonction désactivée car `createGroupPost` n'existe pas encore.
    toast.info("Publication dans les groupes : fonctionnalité à venir");
    setShowCreate(false);
    setPostText("");
  };

  return (
    <View className="relative h-full w-full flex flex-col" style={{  }}><View className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none" style={{  }} /><View className="flex-shrink-0 px-5 pt-6 pb-4"><View className="flex items-center gap-3 mb-4"><Pressable onPress={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}><ArrowLeft size={18} className="text-white" /></Pressable><View className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${color}20` }}>{emoji}</View><View className="flex-1 min-w-0"><View className="flex items-center gap-1.5"><Text className="text-base font-black text-white truncate">{groupe.name}</Text>{groupe.isPrivate && <Lock size={11} className="text-white/40" />}</View><Text className="text-[11px] text-white/40">{groupe.memberCount.toLocaleString()}membres
            </Text></View><Pressable className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}><Bell size={16} className="text-white/60" /></Pressable></View><Text className="text-xs text-white/50 leading-relaxed mb-3">{groupe.description}</Text><View className="flex flex-wrap gap-1.5 mb-4">{groupe.tags.map((t) => (
            <Text key={t} className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: `${color}15`, color }}>#{t}</Text>
          ))}</View><View className="flex gap-2"><Authenticated>{groupe.isMember ? (
              <>
                {groupe.role && <RoleBadge accessibilityRole={groupe.role as Role} />}
                <Pressable onPress={() => setShowCreate(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white" style={{  }}><Plus size={13} /><Text>Publier</Text></Pressable>
                <Pressable onPress={handleJoin} className="px-3 py-2.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: "rgba(239,68,68,0.12)" }}><Text>Quitter</Text></Pressable>
              </>
            ) : (
              <Pressable onPress={handleJoin} className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold text-white" style={{  }}><Plus size={15} /><Text>Rejoindre le groupe</Text></Pressable>
            )}</Authenticated><Unauthenticated><Pressable onPress={() =>
                toast.info("Connectez-vous pour rejoindre le groupe")} className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold text-white" style={{  }}><Plus size={15} /><Text>Rejoindre le groupe</Text></Pressable></Unauthenticated></View></View><View className="flex-1 overflow-y-auto px-5 pb-8 flex flex-col gap-3" style={{  }}>{}<View className="flex flex-col items-center justify-center py-16 gap-3"><View className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: `${color}15` }}>{emoji}</View><Text className="text-sm text-white/40 text-center">Les publications dans les groupes sont temporairement désactivées.
            <br />Cette fonctionnalité sera bientôt disponible.
          </Text></View></View>{}<View>{showCreate && (
          <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
            <View initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} className="w-full rounded-t-3xl p-5" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
              <View className="flex items-center justify-between mb-4"><Text className="text-base font-bold text-white">Nouveau post
                </Text><Pressable onPress={() => setShowCreate(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}><X size={16} className="text-white/60" /></Pressable></View>
              <TextInput value={postText} onChangeText={(value) => setPostText(value)} placeholder="Quoi de neuf dans le groupe ?" className="w-full rounded-2xl px-4 py-3 text-sm text-white/90 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderStyle: "solid" }} multiline textAlignVertical="top" />
              <Pressable onPress={handlePost} disabled={!postText.trim()} className="w-full mt-3 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-40" style={{  }}><Text>Publier (désactivé)</Text></Pressable>
            </View>
          </View>
        )}</View></View>
  );
}

// ── Create Group Modal ─────────────────────────────────────────────────────────
function CreateGroupModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: () => void;
}) {
  const [nom, setNom] = useState("");
  const [desc, setDesc] = useState("");
  const [categorie, setCategorie] = useState("Intérêt");
  const [prive, setPrive] = useState(false);
  const createGroup = useMutation(api.community.createGroup);
  const CATS = ["Quartier", "Métier", "Intérêt", "Famille"];

  const handleCreate = async () => {
    if (!nom.trim()) return;
    try {
      await createGroup({
        name: nom.trim(),
        description: desc.trim() || "Groupe créé sur Débrouille Pro.",
        category: categorie,
        isPrivate: prive,
        tags: [categorie],
      });
      toast.success("Groupe créé !");
      onCreate();
      onClose();
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
      <View initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="w-full rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
        <View className="flex items-center justify-between mb-5"><Text className="text-base font-bold text-white">Créer un groupe
          </Text><Pressable onPress={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}><X size={16} className="text-white/60" /></Pressable></View>
        <TextInput value={nom} onChangeText={(value) => setNom(value)} placeholder="Nom du groupe*" className="w-full rounded-2xl px-4 py-3 text-sm text-white outline-none mb-3" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderStyle: "solid" }} />
        <TextInput value={desc} onChangeText={(value) => setDesc(value)} placeholder="Description (optionnel)" className="w-full rounded-2xl px-4 py-3 text-sm text-white/80 outline-none mb-3" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderStyle: "solid" }} multiline textAlignVertical="top" />
        <View className="mb-4"><Text className="text-xs text-white/50 mb-2">Catégorie</Text><View className="flex flex-wrap gap-2">{CATS.map((c) => (
              <Pressable key={c} onPress={() => setCategorie(c)} className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: categorie === c
                                    ? "rgba(139,92,246,0.25)"
                                    : "rgba(255,255,255,0.06)", borderColor: "rgba(139,92,246,0.4)", borderStyle: "solid" }}>{c}</Pressable>
            ))}</View></View>
        <Pressable onPress={() => setPrive(!prive)} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-5" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center gap-2">{prive ? (
              <Lock size={14} className="text-yellow-400" />
            ) : (
              <Globe size={14} className="text-green-400" />
            )}<Text className="text-sm text-white/80">{prive ? "Groupe privé" : "Groupe public"}</Text></View><View className="w-10 h-5 rounded-full relative" style={{ backgroundColor: prive ? "#8B5CF6" : "rgba(255,255,255,0.15)" }}><View animate={{ x: prive ? 18 : 2 }} className="absolute top-0.5 w-4 h-4 rounded-full bg-white" /></View></Pressable>
        <Pressable onPress={handleCreate} disabled={!nom.trim()} className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-40" style={{  }}><Text>Créer le groupe ✨</Text></Pressable>
      </View>
    </View>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
interface GroupesPageProps {
  onBack: () => void;
}

function GroupesPageInner({ onBack }: GroupesPageProps) {
  const [categorie, setCategorie] = useState("Tous");
  const [search, setSearch] = useState("");
  const [selectedGroupe, setSelectedGroupe] = useState<GroupData | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const groupsData = useQuery(api.community.listGroups, {
    category:
      categorie !== "Tous" && categorie !== "Mes groupes"
        ? categorie
        : undefined,
    search: search.trim() || undefined,
  });

  const groups = groupsData ?? [];

  const filtered = useMemo(() => {
    if (categorie === "Mes groupes") return groups.filter((g) => g.isMember);
    return groups;
  }, [groups, categorie]);

  if (selectedGroupe) {
    return (
      <GroupeDetail
        groupe={selectedGroupe}
        onBack={() => setSelectedGroupe(null)}
      />
    );
  }

  const mesGroupes = groups.filter((g) => g.isMember);

  return (
    <View className="relative h-full w-full flex flex-col overflow-hidden" style={{  }}><View className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{  }} /><View className="flex-shrink-0 px-5 pt-6 pb-0"><View className="flex items-center gap-3 mb-5"><Pressable onPress={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}><ArrowLeft size={18} className="text-white" /></Pressable><View><Text className="text-lg font-black text-white">Groupes & Communautés
            </Text><Text className="text-[11px] text-white/40">{mesGroupes.length}groupes rejoints
            </Text></View><Authenticated><Pressable whileTap={{ scale: 0.92 }} onPress={() => setShowCreate(true)} className="ml-auto w-9 h-9 rounded-xl flex items-center justify-center" style={{  }}><Plus size={18} className="text-white" /></Pressable></Authenticated></View><View className="gap-2 mb-4">{[
            {
              label: "Mes groupes",
              value: mesGroupes.length,
              icon: Users,
              color: "#8B5CF6",
            },
            {
              label: "Total groupes",
              value: groups.length,
              icon: Flame,
              color: "#F97316",
            },
            {
              label: "Disponibles",
              value: groups.filter((g) => !g.isMember).length,
              icon: Zap,
              color: "#10B981",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <View key={stat.label} className="rounded-2xl p-3 flex flex-col items-center gap-1" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}><Icon size={16} style={{  }} /><Text className="text-base font-black text-white">{stat.value}</Text><Text className="text-[9px] text-white/40 text-center leading-tight">{stat.label}</Text></View>
            );
          })}</View><View className="flex items-center gap-2 px-4 py-2.5 rounded-2xl mb-4" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Search size={14} className="text-white/40 flex-shrink-0" /><TextInput value={search} onChangeText={(value) => setSearch(value)} placeholder="Rechercher un groupe..." className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/30" /></View><View className="flex gap-2 overflow-x-auto pb-3" style={{  }}>{CATEGORIES.map((c) => (
            <Pressable key={c} onPress={() => setCategorie(c)} className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all" style={{  }}>{c}</Pressable>
          ))}</View></View><View className="flex-1 overflow-y-auto px-5 pb-8 flex flex-col gap-2.5" style={{  }}>{groupsData === undefined ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))
        ) : filtered.length === 0 ? (
          <View className="flex flex-col items-center py-16 gap-3">
            <View className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(139,92,246,0.12)" }}><Users size={28} className="text-purple-400" /></View>
            <Text className="text-sm text-white/40 text-center">Aucun groupe trouvé.
              <br />Créez le vôtre !
            </Text>
            <Authenticated>
              <Pressable onPress={() => setShowCreate(true)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{  }}><Plus size={13} className="inline mr-1" /><Text>Créer un groupe</Text></Pressable>
            </Authenticated>
          </View>
        ) : (
          filtered.map((g, i) => (
            <View key={g._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <GroupeCard groupe={g} onPress={() => setSelectedGroupe(g)} />
            </View>
          ))
        )}</View><View>{showCreate && (
          <Authenticated>
            <CreateGroupModal
              onClose={() => setShowCreate(false)}
              onCreate={() => {}}
            />
          </Authenticated>
        )}</View></View>
  );
}

export default function GroupesPage({ onBack }: GroupesPageProps) {
  return (
    <>
      <AuthLoading>
        <View className="h-full flex items-center justify-center" style={{  }}><View className="flex flex-col gap-3 px-5 w-full">{Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}</View></View>
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

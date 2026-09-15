import { View, Text, Pressable, TextInput } from "react-native";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton.tsx";

import {
  ArrowLeft,
  Flame,
  Trophy,
  Users,
  Plus,
  Clock,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  Camera,
  Lightbulb,
  FileText,
  Star,
  CheckCircle,
  Zap,
  Crown,
  Target,
  TrendingUp,
  Gift,
  ThumbsUp,
  Filter,
  Search,
  X,
  Upload,
  Send,
  Award,
} from "lucide-react-native";

// ── Types ─────────────────────────────────────────────────────────────────────
type ChallengeStatus = "actif" | "vote" | "terminé";
type StatusFilter = "tous" | ChallengeStatus;

type Challenge = {
  _id: Id<"coCreationChallenges">;
  _creationTime: number;
  authorId: Id<"users">;
  titre: string;
  description: string;
  categorie: string;
  emoji: string;
  couleur: string;
  rewardPoints: number;
  deadline: string;
  status: ChallengeStatus;
  participantCount: number;
};

type Entry = {
  _id: Id<"coCreationEntries">;
  _creationTime: number;
  challengeId: Id<"coCreationChallenges">;
  authorId: Id<"users">;
  content: string;
  votes: number;
  winner?: boolean;
  authorName: string;
  voted: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatusConfig(statut: ChallengeStatus) {
  switch (statut) {
    case "actif":
      return { label: "En cours", color: "#10B981", bg: "#10B98120" };
    case "vote":
      return { label: "Vote ouvert", color: "#F59E0B", bg: "#F59E0B20" };
    case "terminé":
      return { label: "Terminé", color: "#9CA3AF", bg: "#9CA3AF20" };
  }
}

function getTimeRemaining(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Terminé";
  const days = Math.ceil(diff / 86400000);
  if (days === 1) return "Dans 1 jour";
  return `Dans ${days} jours`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatPill({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <View className="flex flex-col items-center gap-0.5"><View className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}22` }}><Icon size={18} style={{ color }} /></View><Text className="text-white font-bold text-sm">{value}</Text><Text className="text-white/50 text-[10px]">{label}</Text></View>
  );
}

function EntryCard({
  entry,
  onVote,
  showWinner,
}: {
  entry: Entry;
  onVote: (id: Id<"coCreationEntries">) => void;
  showWinner: boolean;
}) {
  const initials = entry.authorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl overflow-hidden p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
      {showWinner && entry.winner && (
        <View className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full" style={{  }}><Crown size={10} className="text-black" /><Text className="text-black font-bold text-[10px]">Gagnant</Text></View>
      )}

      {/* Author */}
      <View className="flex items-center gap-2 mb-3"><View className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{  }}>{initials}</View><View><Text className="text-white font-semibold text-sm">{entry.authorName}</Text><Text className="text-white/40 text-[11px]">{new Date(entry._creationTime).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}</Text></View><Text className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: "#F59E0B22", color: "#F59E0B" }}><Lightbulb size={10} />Idée
        </Text></View>

      {/* Content */}
      <Text className="text-white/80 text-sm leading-relaxed mb-3">{entry.content}</Text>

      {/* Actions */}
      <View className="flex items-center gap-3"><Pressable onPress={() => onVote(entry._id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all active:scale-95" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><ThumbsUp size={13} className={entry.voted ? "text-white" : "text-white/60"} /><Text className={`text-xs font-bold ${entry.voted ? "text-white" : "text-white/60"}`}>{entry.votes}</Text></Pressable><Pressable className="ml-auto p-1.5 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}><Share2 size={13} className="text-white/50" /></Pressable></View>
    </View>
  );
}

function ChallengeCard({
  challenge,
  onOpen,
}: {
  challenge: Challenge;
  onOpen: (c: Challenge) => void;
}) {
  const status = getStatusConfig(challenge.status);
  const timeLabel = getTimeRemaining(challenge.deadline);

  return (
    <View whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onPress={() => onOpen(challenge)} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
      {/* Header gradient strip */}
      <View className="h-2 w-full" style={{  }} />

      <View className="p-4">{}<View className="flex items-start justify-between mb-2"><View className="flex items-center gap-2"><Text className="text-2xl">{challenge.emoji}</Text><View><Text className="text-white font-bold text-sm leading-tight">{challenge.titre}</Text><Text className="text-white/40 text-[11px]">{timeLabel}</Text></View></View><Text className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</Text></View>{}<Text className="text-white/60 text-xs leading-relaxed mb-3">{challenge.description}</Text>{}<View className="flex items-center gap-4 text-[11px] text-white/50"><Text className="flex items-center gap-1"><Users size={11} />{challenge.participantCount}participants
          </Text><Text className="flex items-center gap-1 ml-auto font-bold" style={{ color: challenge.couleur }}><Gift size={11} />{challenge.rewardPoints}pts
          </Text></View></View>
    </View>
  );
}

function ChallengesSkeleton() {
  return (
    <View className="flex flex-col gap-3 px-4 pb-6">{Array.from({ length: 3 }).map((_, i) => (
        <View key={i} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Skeleton className="h-2 w-full rounded-none" /><View className="p-4 space-y-3"><View className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><View className="space-y-1.5"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></View></View><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/4" /><View className="flex gap-4"><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-16" /></View></View></View>
      ))}</View>
  );
}

function EntriesSkeleton() {
  return (
    <View className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => (
        <View key={i} className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center gap-2 mb-3"><Skeleton className="h-8 w-8 rounded-full" /><View className="space-y-1"><Skeleton className="h-3.5 w-28" /><Skeleton className="h-2.5 w-16" /></View></View><Skeleton className="h-3 w-full mb-1.5" /><Skeleton className="h-3 w-4/5 mb-3" /><Skeleton className="h-7 w-20 rounded-xl" /></View>
      ))}</View>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
interface CoCreationPageProps {
  onBack: () => void;
}

export default function CoCreationPage({ onBack }: CoCreationPageProps) {
  const { user } = useFirebaseAuth();
  const isAuthenticated = !!user;

  const [tab, setTab] = useState<"defis" | "creer">("defis");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null,
  );
  const [showContribForm, setShowContribForm] = useState(false);
  const [contribText, setContribText] = useState("");
  const [newDefiTitle, setNewDefiTitle] = useState("");
  const [newDefiDesc, setNewDefiDesc] = useState("");

  // Seed data on mount
  const seedChallenges = useMutation(api.coCreation.seedChallenges);
  useEffect(() => {
    if (isAuthenticated) {
      seedChallenges({}).catch(() => {
        /* ignore if already seeded */
      });
    }
  }, [isAuthenticated, seedChallenges]);

  // Query challenges
  const queryStatus = statusFilter === "tous" ? undefined : statusFilter;
  const challenges = useQuery(
    api.coCreation.listChallenges,
    isAuthenticated ? { status: queryStatus } : "skip",
  );

  // Query entries for selected challenge
  const entries = useQuery(
    api.coCreation.listEntries,
    selectedChallenge ? { challengeId: selectedChallenge._id } : "skip",
  );

  // Mutations
  const submitEntry = useMutation(api.coCreation.submitEntry);
  const voteEntry = useMutation(api.coCreation.voteEntry);
  const createChallenge = useMutation(api.coCreation.createChallenge);

  // Filter by search locally
  const filteredChallenges = (challenges ?? []).filter((c) => {
    const ch = c as Challenge;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ch.titre.toLowerCase().includes(q) ||
      ch.description.toLowerCase().includes(q)
    );
  }) as Challenge[];

  const handleVote = async (entryId: Id<"coCreationEntries">) => {
    if (!isAuthenticated) {
      toast.error("Connecte-toi pour voter");
      return;
    }
    try {
      await voteEntry({ entryId });
    } catch {
      toast.error("Erreur lors du vote");
    }
  };

  const handleSubmitContribution = async () => {
    if (!selectedChallenge || !contribText.trim()) return;
    if (!isAuthenticated) {
      toast.error("Connecte-toi pour participer");
      return;
    }
    try {
      await submitEntry({
        challengeId: selectedChallenge._id,
        content: contribText.trim(),
      });
      setContribText("");
      setShowContribForm(false);
      toast.success("Contribution soumise !");
    } catch {
      toast.error("Erreur lors de la soumission");
    }
  };

  const handleCreateDefi = async () => {
    if (!newDefiTitle.trim() || !newDefiDesc.trim()) return;
    if (!isAuthenticated) {
      toast.error("Connecte-toi pour créer un défi");
      return;
    }
    try {
      await createChallenge({
        titre: newDefiTitle.trim(),
        description: newDefiDesc.trim(),
        categorie: "créativité",
        emoji: "⚡",
        couleur: "#8B5CF6",
        rewardPoints: 200,
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      setNewDefiTitle("");
      setNewDefiDesc("");
      setTab("defis");
      toast.success("Défi créé avec succès !");
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selectedChallenge) {
    const status = getStatusConfig(selectedChallenge.status);
    const typedEntries = (entries ?? []) as Entry[];

    return (
      <View className="h-full flex flex-col" style={{  }}>{}<View className="flex-shrink-0 pt-safe px-4 py-3 flex items-center gap-3" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}><Pressable onPress={() => setSelectedChallenge(null)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} className="text-white" /></Pressable><View className="flex-1"><Text className="text-white font-bold text-sm leading-tight">{selectedChallenge.titre}</Text><Text className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</Text></View><Text className="text-2xl">{selectedChallenge.emoji}</Text></View><View className="flex-1 overflow-y-auto" style={{  }}>{}<View className="mx-4 mt-4 rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Text className="text-white/70 text-sm leading-relaxed mb-4">{selectedChallenge.description}</Text><View className="gap-2"><StatPill icon={Users} value={selectedChallenge.participantCount} label="participants" color="#8B5CF6" /><StatPill icon={ThumbsUp} value={typedEntries.reduce((sum, e) => sum + e.votes, 0)} label="votes" color="#10B981" /><StatPill icon={Gift} value={`+${selectedChallenge.rewardPoints}`} label="pts à gagner" color="#F59E0B" /></View></View>{}{selectedChallenge.status === "actif" && (
            <Pressable onPress={() => {
                if (!isAuthenticated) {
                  toast.error("Connecte-toi pour participer");
                  return;
                }
                setShowContribForm(true);
              }} className="mx-4 mt-3 w-[calc(100%-2rem)] py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all" style={{ boxShadow: "0 4px 20px rgba(139,92,246,0.4)" }}><Zap size={16} className="text-white" /><Text className="text-white font-bold text-sm">Participer au défi
              </Text></Pressable>
          )}{}<View className="mx-4 mt-4 mb-6 flex flex-col gap-3"><Text className="text-white font-bold text-sm">{selectedChallenge.status === "vote"
                ? "🗳️ Vote pour la meilleure contribution"
                : "💬 Contributions"}<Text className="ml-2 text-white/40 font-normal text-xs">{typedEntries.length}</Text></Text>{entries === undefined ? (
              <EntriesSkeleton />
            ) : typedEntries.length === 0 ? (
              <View className="text-center py-8 text-white/30 text-sm"><Text>Sois le premier à contribuer !</Text></View>
            ) : (
              typedEntries.map((e) => (
                <EntryCard
                  key={e._id}
                  entry={e}
                  onVote={handleVote}
                  showWinner={selectedChallenge.status === "terminé"}
                />
              ))
            )}</View></View>{}<View>{showContribForm && (
            <>
              <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={() => setShowContribForm(false)} className="absolute inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} />
              <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl p-5" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
                <View className="flex items-center justify-between mb-4"><Text className="text-white font-bold">Soumettre ma contribution
                  </Text><Pressable onPress={() => setShowContribForm(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><X size={16} className="text-white" /></Pressable></View>

                <TextInput value={contribText} onChangeText={(value) => setContribText(value)} placeholder="Décris ta contribution..." className="w-full rounded-xl px-3 py-3 text-sm text-white placeholder-white/30 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} multiline textAlignVertical="top" />

                <Pressable onPress={handleSubmitContribution} disabled={!contribText.trim()} className="mt-3 w-full py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40" style={{  }}><Send size={15} className="text-white" /><Text className="text-white font-bold text-sm">Soumettre
                  </Text></Pressable>
              </View>
            </>
          )}</View></View>
    );
  }

  // ── Main list view ────────────────────────────────────────────────────────────
  return (
    <View className="h-full flex flex-col" style={{  }}>{}<View className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-40 pointer-events-none" style={{  }} />{}<View className="flex-shrink-0 pt-safe px-4 py-3 flex items-center gap-3" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}><Pressable onPress={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} className="text-white" /></Pressable><View className="flex-1"><Text className="text-white font-black text-lg leading-tight">Co-création
          </Text><Text className="text-white/40 text-xs">Défis collectifs & contributions
          </Text></View></View>{}<View className="flex-shrink-0 flex gap-1 px-4 py-3">{[
          { id: "defis" as const, label: "Défis", icon: Target },
          { id: "creer" as const, label: "Créer", icon: Plus },
        ].map(({ id, label, icon: Icon }) => (
          <Pressable key={id} onPress={() => setTab(id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all" style={tab === id
                ? {  }
                : { backgroundColor: "rgba(255,255,255,0.06)" }}><Icon size={13} />{label}</Pressable>
        ))}</View><View className="flex-1 overflow-y-auto" style={{  }}>{}{tab === "defis" && (
          <View className="px-4 pb-6">{}<View className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Search size={15} className="text-white/40" /><TextInput value={searchQuery} onChangeText={(value) => setSearchQuery(value)} placeholder="Rechercher un défi..." className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none" /></View>{}<View className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{  }}>{[
                { id: "tous" as StatusFilter, label: "Tous", emoji: "⚡" },
                { id: "actif" as StatusFilter, label: "Actifs", emoji: "🔥" },
                { id: "vote" as StatusFilter, label: "Vote", emoji: "🗳️" },
                {
                  id: "terminé" as StatusFilter,
                  label: "Terminés",
                  emoji: "✅",
                },
              ].map((cat) => (
                <Pressable key={cat.id} onPress={() => setStatusFilter(cat.id)} className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all" style={statusFilter === cat.id
                      ? {  }
                      : { backgroundColor: "rgba(255,255,255,0.06)" }}><Text>{cat.emoji}</Text>{cat.label}</Pressable>
              ))}</View>{}<Unauthenticated><View className="text-center py-10"><Text className="text-white/50 text-sm mb-2">Connecte-toi pour voir les défis
                </Text></View></Unauthenticated><AuthLoading><ChallengesSkeleton /></AuthLoading><Authenticated>{challenges === undefined ? (
                <ChallengesSkeleton />
              ) : (
                <>
                  {/* Hero stats banner */}
                  <View className="rounded-2xl p-4 mb-4 flex items-center gap-4" style={{ borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", borderStyle: "solid" }}><View className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: "rgba(139,92,246,0.2)" }}><Text>⚡</Text></View><View className="flex-1"><Text className="text-white font-bold text-sm">{filteredChallenges.length}défis
                      </Text><Text className="text-white/50 text-xs">{filteredChallenges.reduce(
                          (a, d) => a + d.participantCount,
                          0,
                        )}{" "}participants
                      </Text></View><View className="flex flex-col items-end"><Text className="text-yellow-400 font-black text-sm">{filteredChallenges
                          .reduce((a, d) => a + d.rewardPoints, 0)
                          .toLocaleString()}</Text><Text className="text-white/40 text-[10px]">pts à gagner
                      </Text></View></View>

                  {/* Challenge list */}
                  <View className="flex flex-col gap-3">{filteredChallenges.length === 0 ? (
                      <View className="text-center py-10 text-white/30 text-sm"><Text>Aucun défi trouvé</Text></View>
                    ) : (
                      filteredChallenges.map((c) => (
                        <ChallengeCard
                          key={c._id}
                          challenge={c}
                          onOpen={setSelectedChallenge}
                        />
                      ))
                    )}</View>
                </>
              )}</Authenticated></View>
        )}{}{tab === "creer" && (
          <View className="px-4 pb-6"><View className="rounded-2xl p-5" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center gap-3 mb-4"><View className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{  }}><Text>⚡</Text></View><View><Text className="text-white font-bold">Lancer un défi</Text><Text className="text-white/40 text-xs">Inspirez la communauté
                  </Text></View></View><View className="flex flex-col gap-3"><View><Text className="text-white/60 text-xs mb-1 block">Titre du défi *
                  </Text><TextInput value={newDefiTitle} onChangeText={(value) => setNewDefiTitle(value)} placeholder="Ex: Meilleure recette africaine" className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} /></View><View><Text className="text-white/60 text-xs mb-1 block">Description *
                  </Text><TextInput value={newDefiDesc} onChangeText={(value) => setNewDefiDesc(value)} placeholder="Décris le défi, les règles, ce qui sera récompensé..." className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} multiline textAlignVertical="top" /></View>{}<View className="gap-2">{[
                    { icon: Clock, label: "Durée", value: "7 jours" },
                    { icon: Gift, label: "Récompense", value: "200 pts" },
                    { icon: Users, label: "Ouvert à", value: "Tous" },
                    { icon: Award, label: "Gagnants", value: "Top 3" },
                  ].map(({ icon: Icon, label, value }) => (
                    <View key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}><Icon size={13} className="text-white/40" /><View><Text className="text-white/40 text-[10px]">{label}</Text><Text className="text-white/80 text-xs font-semibold">{value}</Text></View></View>
                  ))}</View><Pressable onPress={handleCreateDefi} disabled={!newDefiTitle.trim() || !newDefiDesc.trim()} className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40 mt-1" style={{ boxShadow: "0 4px 20px rgba(139,92,246,0.4)" }}><Flame size={16} className="text-white" /><Text className="text-white font-black">Lancer le défi</Text></Pressable></View></View>{}<View className="mt-4 rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", borderStyle: "solid" }}><Text className="text-white/50 text-xs font-semibold mb-2">💡 Conseils pour un bon défi
              </Text>{[
                "Sois précis sur ce qui est attendu",
                "Fixe un objectif mesurable et atteignable",
                "Propose une récompense motivante",
                "Implique ta communauté dès le lancement",
              ].map((tip) => (
                <View key={tip} className="flex items-center gap-2 py-1">
                  <Star size={10} className="text-yellow-400 flex-shrink-0" />
                  <Text className="text-white/40 text-xs">{tip}</Text>
                </View>
              ))}</View></View>
        )}</View></View>
  );
}

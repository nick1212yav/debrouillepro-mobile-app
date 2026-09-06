import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { useMutation, useQuery, usePaginatedQuery } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import {
  ArrowLeft, Trophy, Flame, Hash, Star, Users, Clock, Zap,
  ChevronRight, Plus, X, Heart, TrendingUp, Crown, Award,
} from "lucide-react-native";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  "Agriculture": "#22c55e", "Business": "#f97316", "Éducation": "#6366f1",
  "Santé": "#ef4444", "Tech": "#3b82f6", "Cuisine": "#f59e0b",
  "Restauration": "#f97316", "Culture": "#ec4899", "Autre": "#8b5cf6",
};
const CATEGORIES = Object.keys(CATEGORY_COLORS);

function catColor(cat: string) { return CATEGORY_COLORS[cat] ?? "#8b5cf6"; }

function timeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Terminé";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}j restant${days > 1 ? "s" : ""}`;
  return `${hours}h restantes`;
}

// ── Create Challenge Modal ─────────────────────────────────────────────────────

function CreateChallengeModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [cat, setCat] = useState("Culture");
  const [xp, setXp] = useState("100");
  const [days, setDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const createChallenge = useMutation(api.challenges.createChallenge);

  const submit = async () => {
    if (!title.trim() || !hashtag.trim()) return UIService.openToast("Titre et hashtag requis", "error");
    setLoading(true);
    try {
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + (parseInt(days) || 7));
      await createChallenge({
        title: title.trim(),
        description: desc.trim(),
        hashtag: hashtag.trim(),
        category: cat,
        xpReward: parseInt(xp) || 100,
        startsAt: now.toISOString(),
        endsAt: end.toISOString(),
        isOfficial: false,
      });
      UIService.openToast("Défi créé !", "success");
      onClose();
    } catch {
      UIService.openToast("Erreur lors de la création", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Pressable
        className="fixed inset-0 z-50 bg-black/70" onPress={onClose} />
      <View
        className="fixed inset-x-4 bottom-0 z-50 rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-auto"
        style={{ borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}
      >
        <View className="flex items-center justify-between mb-5">
          <Text className="text-white font-black text-lg">Lancer un défi</Text>
          <Pressable onPress={onClose} className=""><X size={18} className="text-white/40" /></Pressable>
        </View>
        <View className="space-y-3">
          <Input value={title} onChange={(text) => setTitle(text)} placeholder="Titre du défi…" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          <TextInput
            value={desc} onChangeText={(text) => setDesc(text)}
            placeholder="Description du défi…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/85 text-sm placeholder:text-white/30 outline-none"
           multiline textAlignVertical="top"/>
          <View className="relative">
            <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" />
            <Input value={hashtag} onChange={(text) => setHashtag(text)} placeholder="Hashtag (ex: MonDefi)" className="pl-7 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </View>
          <View className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <Pressable key={c} onPress={() => setCat(c)}
                className="text-xs px-3 py-1.5 rounded-full font-semibold"
                style={{ backgroundColor: cat === c ? `${catColor(c)}30` : "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
                {c}
              </Pressable>
            ))}
          </View>
          <View className="gap-2">
            <View>
              <Text className="text-[10px] text-white/30 mb-1 block">Récompense XP</Text>
              <Input value={xp} onChange={(text) => setXp(text)} type="number" className="bg-white/5 border-white/10 text-white" />
            </View>
            <View>
              <Text className="text-[10px] text-white/30 mb-1 block">Durée (jours)</Text>
              <Input value={days} onChange={(text) => setDays(text)} type="number" className="bg-white/5 border-white/10 text-white" />
            </View>
          </View>
          <Button onPress={submit} disabled={loading} className="w-full font-black" style={{  }}>
            {loading ? "Création…" : "Lancer le défi 🔥"}
          </Button>
        </View>
      </View>
    </>
  );
}

// ── Challenge Detail ───────────────────────────────────────────────────────────

function ChallengeDetail({ challengeId, onBack }: { challengeId: Id<"challenges">; onBack: () => void }) {
  const data = useQuery(api.challenges.getChallengeById, { challengeId });
  const joinChallenge = useMutation(api.challenges.joinChallenge);
  const vote = useMutation(api.challenges.voteForEntry);
  const [joining, setJoining] = useState(false);

  if (!data) return (
    <View className="p-5 space-y-4">
      <Skeleton className="h-40 w-full rounded-3xl" />
      <Skeleton className="h-6 w-2/3 rounded-xl" />
      {[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
    </View>
  );

  const color = catColor(data.category);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await joinChallenge({ challengeId });
      UIService.openToast("Tu participes au défi !", "success");
    } catch { UIService.openToast("Erreur", "error"); }
    finally { setJoining(false); }
  };

  const handleVote = async (entryId: Id<"challengeEntries">) => {
    try {
      await vote({ entryId, challengeId });
      UIService.openToast("Vote enregistré !", "success");
    } catch { UIService.openToast("Erreur", "error"); }
  };

  return (
    <View className="flex flex-col h-full overflow-auto pb-6">
      <View className="px-5 pt-5">
        <Pressable onPress={onBack} className="flex items-center gap-2 text-white/50 mb-4">
          <ArrowLeft size={16} /> <Text>Retour</Text></Pressable>
        {/* Hero */}
        <View className="rounded-3xl p-5 mb-5 relative overflow-hidden"
          style={{ borderStyle: "solid" }}>
          <View className="absolute -top-6 -right-6 w-36 h-36"
            style={{  }} />
          <View className="relative">
            {data.isOfficial && (
              <View className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full mb-2"
                style={{ backgroundColor: "rgba(245,158,11,0.2)", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)", borderStyle: "solid" }}>
                <Crown size={10} style={{ color: "#F59E0B" }} />
                <Text className="text-[9px] font-black text-amber-400">DÉFI OFFICIEL</Text>
              </View>
            )}
            <Text className="text-white font-black text-xl mb-1 text-balance">{data.title}</Text>
            <Text className="text-white/50 text-sm mb-4">{data.description}</Text>
            <View className="flex flex-wrap gap-3 mb-4">
              <View className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ backgroundColor: `${color}15`, borderStyle: "solid" }}>
                <Hash size={12} style={{ color }} />
                <Text className="text-xs font-bold" style={{ color }}>{data.hashtag}</Text>
              </View>
              <View className="flex items-center gap-1 text-xs text-white/40">
                <Users size={12} /> {data.participantCount} <Text>participant</Text>{data.participantCount > 1 ? "s" : ""}
              </View>
              <View className="flex items-center gap-1 text-xs text-white/40">
                <Zap size={12} className="text-amber-400" /> <Text>+</Text>{data.xpReward} <Text>XP</Text></View>
              <View className="flex items-center gap-1 text-xs text-white/40">
                <Clock size={12} /> {timeLeft(data.endsAt)}
              </View>
            </View>
            <Authenticated>
              {!data.myEntry ? (
                <Pressable onPress={handleJoin} disabled={joining || data.status === "ended"}
                  className="px-5 py-2.5 rounded-2xl text-sm font-black text-white disabled:opacity-50"
                  style={{  }}>
                  {joining ? "Participation…" : data.status === "ended" ? "Terminé" : "Participer 🔥"}
                </Pressable>
              ) : (
                <View className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
                  <Award size={14} className="text-amber-400" />
                  <Text className="text-sm text-white/70 font-semibold">Tu participes à ce défi</Text>
                </View>
              )}
            </Authenticated>
            <Unauthenticated>
              <Text className="text-white/35 text-xs">Connecte-toi pour participer</Text>
            </Unauthenticated>
          </View>
        </View>

        {/* Leaderboard */}
        <Text className="text-white/50 text-[11px] font-black uppercase tracking-widest mb-3">
          Classement ({data.topEntries.length})
        </Text>
      </View>

      <View className="px-5 space-y-2">
        {data.topEntries.length === 0 ? (
          <View className="flex flex-col items-center py-10 text-center">
            <Flame size={32} className="text-white/15 mb-3" />
            <Text className="text-white/40 text-sm">Aucune participation pour l'instant</Text>
            <Text className="text-white/25 text-[11px] mt-1">Sois le premier à participer !</Text>
          </View>
        ) : (
          data.topEntries.map((p, i) => {
            const isVoted = data.hasVotedFor === p._id;
            const rankColors = ["#F59E0B", "#94A3B8", "#CD7F32"];
            const rankColor = rankColors[i] ?? "rgba(255,255,255,0.2)";
            return (
              <View key={p._id}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
                <View className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ backgroundColor: i < 3 ? `${rankColor}25` : "rgba(255,255,255,0.06)" }}>
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                </View>
                <View className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                  style={{ backgroundColor: "rgba(139,92,246,0.2)" }}>
                  {(p.user?.name ?? "?")[0]}
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-white/80 text-sm font-semibold truncate">{p.user?.name ?? "Anonyme"}</Text>
                  <Text className="text-white/30 text-[10px]">{p.voteCount} vote{p.voteCount > 1 ? "s" : ""}</Text>
                </View>
                <Authenticated>
                  <Pressable onPress={() => handleVote(p._id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl"
                    style={isVoted
                      ? { backgroundColor: "rgba(239,68,68,0.2)", borderWidth: 1, borderColor: "rgba(239,68,68,0.4)", borderStyle: "solid" }
                      : { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
                    <Heart size={11} style={{ color: isVoted ? "#f87171" : "rgba(255,255,255,0.3)", fill: isVoted ? "#f87171" : "none" }} />
                    <Text className="text-[10px] font-bold" style={{ color: isVoted ? "#f87171" : "rgba(255,255,255,0.4)" }}>
                      {isVoted ? "Voté" : "Voter"}
                    </Text>
                  </Pressable>
                </Authenticated>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

// ── Challenge Card ─────────────────────────────────────────────────────────────

type ChallengeWithMeta = {
  _id: Id<"challenges">;
  title: string;
  description: string;
  category: string;
  hashtag: string;
  xpReward: number;
  participantCount: number;
  status: "upcoming" | "active" | "ended";
  isOfficial: boolean;
  endsAt: string;
  creator: { name?: string; avatar?: string } | null;
  joinedByMe: boolean;
  creatorId: Id<"users">;
  _creationTime: number;
  startsAt: string;
  coverImage?: string;
  winnerId?: Id<"users">;
};

function ChallengeCard({ c, onClick }: { c: ChallengeWithMeta; onClick: () => void }) {
  const color = catColor(c.category);
  return (
    <Pressable
      className="rounded-3xl p-4"
      style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
      onPress={onClick}>
      <View className="flex items-start gap-3">
        <View className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
          style={{ backgroundColor: `${color}15` }}>
          <Flame size={20} style={{ color }} />
        </View>
        <View className="flex-1 min-w-0">
          <View className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            {c.isOfficial && (
              <Text className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(245,158,11,0.2)", color: "#F59E0B" }}>
                OFFICIEL
              </Text>
            )}
            <Text className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}20`, color }}>
              {c.category}
            </Text>
          </View>
          <Text className="text-white/85 font-bold text-sm leading-tight mb-1 truncate">{c.title}</Text>
          <View className="flex items-center gap-2 text-[10px] text-white/35">
            <Text className="flex items-center gap-0.5"><Hash size={9} />{c.hashtag}</Text>
            <Text>·</Text>
            <Text className="flex items-center gap-0.5"><Users size={9} />{c.participantCount}</Text>
            <Text>·</Text>
            <Text className="flex items-center gap-0.5 text-amber-400"><Zap size={9} />+{c.xpReward} XP</Text>
          </View>
        </View>
        <View className="flex flex-col items-end gap-1 flex-shrink-0">
          <Text className="text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: c.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)", color: c.status === "active" ? "#34d399" : "rgba(255,255,255,0.3)" }}>
            {timeLeft(c.endsAt)}
          </Text>
          {c.joinedByMe && <Award size={11} className="text-amber-400" />}
          <ChevronRight size={13} className="text-white/20" />
        </View>
      </View>
    </Pressable>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

export default function ChallengesPage({ onBack }: Props) {
  const { isAuthenticated } = useConvexAuth();
  const [activeTab, setActiveTab] = useState<"active" | "upcoming" | "ended">("active");
  const [selectedId, setSelectedId] = useState<Id<"challenges"> | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const seedChallenges = useMutation(api.challenges.seedOfficialChallenges);
  const trending = useQuery(api.challenges.getTrendingHashtags, { limit: 8 });

  const { results, status, loadMore } = usePaginatedQuery(
    api.challenges.listChallenges,
    { status: activeTab },
    { initialNumItems: 20 }
  );

  // Seed official challenges if empty (fire-and-forget when authenticated)
  if (isAuthenticated && status === "Exhausted" && results.length === 0 && activeTab === "active") {
    seedChallenges().catch(() => null);
  }

  if (selectedId) return (
    <View className="h-full overflow-hidden flex flex-col"
      style={{  }}>
      <ChallengeDetail challengeId={selectedId} onBack={() => setSelectedId(null)} />
    </View>
  );

  return (
    <View className="h-full overflow-hidden flex flex-col"
      style={{  }}>
      {/* Header */}
      <View className="px-5 pt-5 pb-3 flex-shrink-0">
        <View className="flex items-center gap-3 mb-4">
          <Pressable onPress={onBack} className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
            <ArrowLeft size={16} className="text-white/70" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white font-black text-lg">Défis & Tendances</Text>
            <Text className="text-white/35 text-xs">Challenges créateurs et hashtags viraux</Text>
          </View>
          <Authenticated>
            <Pressable onPress={() => setShowCreate(true)}
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{  }}>
              <Plus size={16} className="text-white" />
            </Pressable>
          </Authenticated>
        </View>

        {/* Trending hashtags */}
        {trending && trending.length > 0 && (
          <View className="mb-4">
            <View className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={11} className="text-white/30" />
              <Text className="text-[10px] font-black text-white/30 uppercase tracking-widest">Tendances cette semaine</Text>
            </View>
            <View className="flex gap-2 overflow-x-auto pb-1" style={{  }}>
              {trending.map((t) => (
                <View key={t._id}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: "rgba(139,92,246,0.12)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}>
                  <Hash size={9} className="text-violet-400" />
                  <Text className="text-violet-300 text-xs font-bold">{t.hashtag.replace("#", "")}</Text>
                  <Text className="text-white/25 text-[9px]">{t.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tabs */}
        <View className="flex gap-2">
          {(["active", "upcoming", "ended"] as const).map((tab) => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={activeTab === tab
                ? {  }
                : { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
              {tab === "active" ? "Actifs" : tab === "upcoming" ? "À venir" : "Terminés"}
            </Pressable>
          ))}
        </View>
      </View>

      {/* List */}
      <View className="flex-1 overflow-auto px-5 pb-6 space-y-3">
        {status === "LoadingFirstPage" ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)
        ) : results.length === 0 ? (
          <View className="flex flex-col items-center py-16 text-center">
            <Trophy size={40} className="text-white/15 mb-3" />
            <Text className="text-white/40 text-sm font-semibold"><Text>Aucun défi</Text>{activeTab === "active" ? "actif" : activeTab === "upcoming" ? "à venir" : "terminé"}</Text>
            <Text className="text-white/25 text-xs mt-1"><Text>Lance le premier défi de la communauté !</Text></Text>
            <Authenticated>
              <Pressable onPress={() => setShowCreate(true)}
                className="mt-4 px-5 py-2.5 rounded-2xl text-sm font-black text-white"
                style={{  }}>
                <Text>Créer un défi 🔥</Text></Pressable>
            </Authenticated>
          </View>
        ) : (
          <>
            {results.map((c) => (
              <ChallengeCard key={c._id} c={c as ChallengeWithMeta} onPress={() => setSelectedId(c._id)} />
            ))}
            {status === "CanLoadMore" && (
              <Pressable onPress={() => loadMore(10)} className="w-full py-3 text-sm text-white/40 font-semibold">
                <Text>Charger plus</Text></Pressable>
            )}
          </>
        )}
      </View>

      <>
        {showCreate && <CreateChallengeModal onClose={() => setShowCreate(false)} />}
      </>
    </View>
  );
}

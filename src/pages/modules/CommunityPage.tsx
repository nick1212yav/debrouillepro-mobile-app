import { View, Pressable, Text, TextInput } from "react-native";

// src/pages/modules/CommunityPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus, Smile, Users } from "lucide-react-native";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useCommunity } from "@/features/community/hooks/useCommunity";
import { CommunityCard } from "@/features/community/components/CommunityCard";
import { CreatePostSheet } from "@/features/community/components/CreatePost";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  onBack: () => void;
}

export default function CommunityPage({ onBack }: Props) {
  const navigate = useNavigate();
  const { user } = useFirebaseAuth();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "mine">("all");
  const [showCompose, setShowCompose] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const { posts, groups, likePost, deletePost, votePoll, joinGroup } =
    useCommunity(search);

  // ── Gestionnaires ──────────────────────────────────────────────────────────

  const handleLike = async (publicationId: Id<"publications">) => {
    if (!user) {
      toast.error("Connectez-vous pour réagir");
      return;
    }
    try {
      await likePost({ publicationId });
    } catch {
      toast.error("Erreur lors du like");
    }
  };

  const handleDelete = async (publicationId: Id<"publications">) => {
    try {
      await deletePost({ publicationId });
      toast.success("Post supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleVote = async (
    publicationId: Id<"publications">,
    optionId: string,
  ) => {
    if (!user) {
      toast.error("Connectez-vous pour voter");
      return;
    }
    try {
      await votePoll({ publicationId, optionId });
      toast.success("Vote enregistré !");
    } catch {
      toast.error("Erreur lors du vote");
    }
  };

  const handleBookmark = async (publicationId: Id<"publications">) => {
    // À implémenter avec le hook useCommunityBookmarks si nécessaire
    toast.info("Fonctionnalité de favori à venir");
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) {
      toast.error("Connectez-vous pour rejoindre un groupe");
      return;
    }
    try {
      const res = await joinGroup({ groupId: groupId as Id<"groups"> });
      toast.success(res.joined ? "Groupe rejoint !" : "Groupe quitté");
    } catch {
      toast.error("Erreur lors de l'action sur le groupe");
    }
  };

  // ── Filtrage ─────────────────────────────────────────────────────────────────

  const filtered = posts
    ? posts.filter((p) => (activeFilter === "mine" ? p.isMine : true))
    : [];

  // ── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <>
      <View className="h-full flex flex-col relative" style={{  }}>{}<View initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-5 pb-3 flex-shrink-0"><View className="flex items-center gap-3 mb-4"><Pressable onPress={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} className="text-white" /></Pressable><View><Text className="text-xl font-bold text-white">Community</Text><Text className="text-xs" style={{ color: "#8B5CF6" }}>Rejoindre · Organiser · Partager
              </Text></View><Pressable onPress={() => setShowCompose(true)} className="ml-auto w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform" style={{  }}><Plus size={18} className="text-white" /></Pressable></View>{}<View className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-3" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Search size={16} className="text-white/40" /><TextInput value={search} onChangeText={(value) => setSearch(value)} placeholder="Rechercher dans les posts..." className="flex-1 bg-transparent text-white placeholder:text-white/35 text-sm outline-none" /></View>{}<View className="flex gap-2 overflow-x-auto pb-1 mb-2" style={{  }}>{groups.map((g, i) => (
              <Pressable key={g._id} onPress={() => handleJoinGroup(g._id)} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }} className="flex-shrink-0 flex flex-col items-center gap-1">
                <View className="w-12 h-12 rounded-2xl flex items-center justify-center relative" style={{ backgroundColor: g.isMember
                                      ? `${g.color}35`
                                      : "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }}><Users size={18} style={{  }} />{g.isMember && (
                    <Text className="absolute -top-1 -right-1 text-[10px]">{g.emoji}</Text>
                  )}</View>
                <Text className="text-[9px] text-white/40 text-center leading-tight w-14 truncate">{g.name}</Text>
              </Pressable>
            ))}<Pressable initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex-shrink-0 flex flex-col items-center gap-1"><View className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 2, borderColor: "rgba(255,255,255,0.15)", borderStyle: "dashed" }}><Plus size={16} className="text-white/30" /></View><Text className="text-[9px] text-white/25">Rejoindre</Text></Pressable></View>{}<View className="flex gap-2">{(["all", "mine"] as const).map((f) => (
              <Pressable key={f} onPress={() => setActiveFilter(f)} className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all" style={{ backgroundColor: activeFilter === f
                                    ? "rgba(139,92,246,0.2)"
                                    : "rgba(255,255,255,0.05)", borderColor: "rgba(139,92,246,0.4)", borderStyle: "solid" }}>{f === "all" ? "Tous les posts" : "Mes posts"}</Pressable>
            ))}</View></View>{}<View className="flex-1 overflow-y-auto px-5 pb-24 flex flex-col gap-4" style={{  }}>{posts === undefined ? (
            <View className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <View key={i} className="rounded-3xl overflow-hidden p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                  <Skeleton className="w-9 h-9 rounded-xl bg-white/10" />
                  <Skeleton className="h-3 w-24 mb-1.5 bg-white/10" />
                  <Skeleton className="h-24 w-full rounded-xl bg-white/10" />
                </View>
              ))}
            </View>
          ) : filtered.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-16 gap-3">
              <Smile size={36} className="text-white/15" />
              <Text className="text-white/30 text-sm">Aucun post trouvé</Text>
              {activeFilter === "mine" && (
                <Pressable onPress={() => setShowCompose(true)} className="text-xs text-purple-400 underline">
                  Créer votre premier post
                </Pressable>
              )}
            </View>
          ) : (
            filtered.map((post, i) => (
              <CommunityCard
                key={post._id}
                post={post}
                index={i}
                onLike={() => handleLike(post._id)}
                onComment={() => navigate(`/community/${post._id}`)}
                onShare={() => setShowShare(true)}
                onBookmark={() => handleBookmark(post._id)}
                onVote={(optionId) => handleVote(post._id, optionId)}
                onNavigate={() => navigate(`/community/${post._id}`)}
              />
            ))
          )}</View>{}<Pressable initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.4,
          }} onPress={() => setShowCompose(true)} className="absolute bottom-6 right-5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-transform" style={{ boxShadow: "0 8px 32px rgba(139,92,246,0.4)" }}><Plus size={22} className="text-white" /></Pressable></View>

      {/* Sheet de création */}
      <CreatePostSheet
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        onSuccess={() => {
          // Le toast est déjà géré dans le Sheet
        }}
      />
    </>
  );
}

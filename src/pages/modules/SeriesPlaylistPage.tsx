import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { useMutation, useQuery, usePaginatedQuery } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import {
  ArrowLeft, Plus, BookOpen, PlayCircle, Check, Bell, BellOff,
  ChevronRight, Search, Star, Users, Layers, Lock, Pencil, X,
} from "lucide-react-native";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  "Agriculture": "#22c55e", "Business": "#f97316", "Éducation": "#6366f1",
  "Santé": "#ef4444", "Tech": "#3b82f6", "Voyage": "#14b8a6",
  "Cuisine": "#f59e0b", "Autre": "#8b5cf6",
};
const CATEGORIES = Object.keys(CATEGORY_COLORS);

function categoryColor(cat: string) { return CATEGORY_COLORS[cat] ?? "#8b5cf6"; }

// ── Create Series Modal ───────────────────────────────────────────────────────

function CreateSeriesModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: Id<"series">) => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("Éducation");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const createSeries = useMutation(api.series.createSeries);

  const submit = async () => {
    if (!title.trim()) return toast.error("Titre requis");
    setLoading(true);
    try {
      const id = await createSeries({
        title: title.trim(),
        description: desc.trim(),
        category: cat,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Série créée !");
      onCreated(id);
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onPress={onClose} />
      <View initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }} transition={{ type: "spring", stiffness: 380, damping: 30 }} className="fixed inset-x-4 bottom-0 z-50 rounded-t-3xl p-6 pb-10" style={{ borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}>
        <View className="flex items-center justify-between mb-5"><Text className="text-white font-black text-lg">Nouvelle série</Text><Pressable onPress={onClose} className=""><X size={18} className="text-white/40" /></Pressable></View>
        <View className="space-y-3"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la série…" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" /><TextInput value={desc} onChangeText={(value) => setDesc(value)} placeholder="Description…" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/85 text-sm placeholder:text-white/30 outline-none focus:border-violet-500/50" multiline textAlignVertical="top" /><View className="flex gap-2 flex-wrap">{CATEGORIES.map((c) => (
              <Pressable key={c} onPress={() => setCat(c)} className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all" style={{ backgroundColor: cat === c ? `${categoryColor(c)}30` : "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>{c}</Pressable>
            ))}</View><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags séparés par virgule…" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" /><Button onPress={submit} disabled={loading} className="w-full font-black" style={{  }}>{loading ? "Création…" : "Créer la série"}</Button></View>
      </View>
    </>
  );
}

// ── Series Detail View ─────────────────────────────────────────────────────────

function SeriesDetail({ seriesId, onBack }: { seriesId: Id<"series">; onBack: () => void }) {
  const data = useQuery(api.series.getSeriesById, { seriesId });
  const toggleSub = useMutation(api.series.toggleSubscription);
  const updateProgress = useMutation(api.series.updateProgress);
  const [subLoading, setSubLoading] = useState(false);

  if (!data) return (
    <View className="p-5 space-y-4"><Skeleton className="h-48 w-full rounded-3xl" /><Skeleton className="h-6 w-2/3 rounded-xl" />{[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</View>
  );

  const color = categoryColor(data.category);
  const progress = data.progress;
  const pct = data.episodeCount > 0 ? Math.round(((progress?.completedEpisodes.length ?? 0) / data.episodeCount) * 100) : 0;

  const handleToggleSub = async () => {
    setSubLoading(true);
    try {
      const res = await toggleSub({ seriesId });
      toast.success(res.subscribed ? "Abonné !" : "Désabonné");
    } catch { toast.error("Erreur"); }
    finally { setSubLoading(false); }
  };

  return (
    <View className="flex flex-col h-full overflow-auto pb-6">{}<View className="px-5 pt-5"><Pressable onPress={onBack} className="flex items-center gap-2 text-white/50 mb-4"><ArrowLeft size={16} /><Text>Retour</Text></Pressable><View className="rounded-3xl p-5 mb-4 relative overflow-hidden" style={{ borderStyle: "solid" }}><View className="absolute top-0 right-0 w-32 h-32 pointer-events-none" style={{  }} /><View className="relative"><View className="flex items-center gap-2 mb-2"><Text className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color }}>{data.category}</Text><Text className="text-[10px] text-white/30 font-medium">{data.episodeCount}épisode{data.episodeCount > 1 ? "s" : ""}</Text><Text className="text-[10px] text-white/30">· {data.subscriberCount}abonné{data.subscriberCount > 1 ? "s" : ""}</Text></View><Text className="text-white font-black text-xl mb-1 text-balance">{data.title}</Text><Text className="text-white/50 text-sm mb-4">{data.description}</Text>{data.creator && (
              <View className="flex items-center gap-2 mb-4"><View className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{  }}>{(data.creator.name ?? "?")[0]}</View><Text className="text-white/50 text-xs">{data.creator.name ?? "Anonyme"}</Text></View>
            )}{}{(progress ?? null) !== null && (
              <View className="mb-4"><View className="flex justify-between text-[10px] text-white/30 mb-1"><Text>Progression</Text><Text>{pct}%</Text></View><View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><View className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" as const }} style={{  }} /></View></View>
            )}<Authenticated><Pressable onPress={handleToggleSub} disabled={subLoading} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm active:scale-95 transition-transform" style={data.subscribedByMe
                  ? { backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }
                  : { boxShadow: `0 4px 14px ${color}40` }}>{data.subscribedByMe ? <><BellOff size={14} /> Désabonner</> : <><Bell size={14} /> S'abonner</>}</Pressable></Authenticated></View></View>{}<Text className="text-white/50 text-[11px] font-black uppercase tracking-widest mb-3">Épisodes ({data.episodeCount})
        </Text></View><View className="px-5 space-y-2">{data.episodes.length === 0 ? (
          <View className="flex flex-col items-center py-10 text-center"><BookOpen size={32} className="text-white/15 mb-3" /><Text className="text-white/40 text-sm">Aucun épisode pour l'instant</Text></View>
        ) : (
          data.episodes.map((ep, i) => {
            const isDone = progress?.completedEpisodes.includes(ep.episodeNumber) ?? false;
            return (
              <View key={ep._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 px-4 py-3 rounded-2xl active:scale-[0.98] transition-transform" style={{ backgroundColor: isDone ? `${color}10` : "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }} onPress={() => updateProgress({ seriesId, episodeNumber: ep.episodeNumber }).catch(() => null)}>
                <View className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: isDone ? `${color}20` : "rgba(255,255,255,0.06)" }}>{isDone ? <Check size={14} style={{ color }} /> : <PlayCircle size={14} className="text-white/30" />}</View>
                <View className="flex-1 min-w-0"><Text className="text-white/80 text-sm font-semibold truncate"><Text className="text-white/30 text-xs mr-1">Ép. {ep.episodeNumber}</Text>{ep.title}</Text>{ep.publication && (
                    <Text className="text-white/35 text-[10px] truncate">{ep.publication.description.slice(0, 60)}</Text>
                  )}</View>
                <ChevronRight size={13} className="text-white/20 flex-shrink-0" />
              </View>
            );
          })
        )}</View></View>
  );
}

// ── Series Card ────────────────────────────────────────────────────────────────

type SeriesWithMeta = {
  _id: Id<"series">;
  _creationTime: number;
  title: string;
  description: string;
  category: string;
  episodeCount: number;
  subscriberCount: number;
  status: "active" | "completed" | "draft";
  creator: { name?: string; avatar?: string } | null;
  subscribedByMe: boolean;
  tags: string[];
  creatorId: Id<"users">;
  coverImage?: string;
};

function SeriesCard({ s, onClick }: { s: SeriesWithMeta; onClick: () => void }) {
  const color = categoryColor(s.category);
  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl p-4 active:scale-[0.98] transition-transform" style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }} onPress={onClick}>
      <View className="flex items-start gap-3"><View className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl" style={{ backgroundColor: `${color}15` }}><BookOpen size={20} style={{ color }} /></View><View className="flex-1 min-w-0"><View className="flex items-center gap-1.5 mb-0.5"><Text className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color }}>{s.category}</Text>{s.status === "completed" && (
              <Text className="text-[9px] text-emerald-400 font-bold">Terminée</Text>
            )}</View><Text className="text-white/85 font-bold text-sm leading-tight mb-1 truncate">{s.title}</Text><Text className="text-white/40 text-[11px] mb-2">{s.description}</Text><View className="flex items-center gap-3"><View className="flex items-center gap-1"><Layers size={10} className="text-white/25" /><Text className="text-[10px] text-white/35">{s.episodeCount}épisodes</Text></View><View className="flex items-center gap-1"><Users size={10} className="text-white/25" /><Text className="text-[10px] text-white/35">{s.subscriberCount}abonnés</Text></View></View></View><View className="flex flex-col items-end gap-1 flex-shrink-0">{s.subscribedByMe && <Bell size={12} style={{ color }} />}<ChevronRight size={14} className="text-white/20" /></View></View>
    </View>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

export default function SeriesPlaylistPage({ onBack }: Props) {
  const { isAuthenticated } = useConvexAuth();
  const [activeTab, setActiveTab] = useState<"discover" | "mine">("discover");
  const [selectedId, setSelectedId] = useState<Id<"series"> | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  const { results: allSeries, status, loadMore } = usePaginatedQuery(
    api.series.listSeries,
    { status: "active" },
    { initialNumItems: 20 }
  );

  const { results: mySubs, status: myStatus, loadMore: loadMoreMine } = usePaginatedQuery(
    api.series.getMySubscriptions,
    isAuthenticated ? {} : "skip",
    { initialNumItems: 20 }
  );

  if (selectedId) return (
    <View className="h-full overflow-hidden flex flex-col" style={{  }}><SeriesDetail seriesId={selectedId} onBack={() => setSelectedId(null)} /></View>
  );

  const filtered = allSeries.filter((s) =>
    !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="h-full overflow-hidden flex flex-col" style={{  }}>{}<View className="px-5 pt-5 pb-3 flex-shrink-0"><View className="flex items-center gap-3 mb-4"><Pressable onPress={onBack} className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><ArrowLeft size={16} className="text-white/70" /></Pressable><View className="flex-1"><Text className="text-white font-black text-lg">Séries & Playlists</Text><Text className="text-white/35 text-xs">Contenu organisé en épisodes</Text></View><Authenticated><Pressable onPress={() => setShowCreate(true)} className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{  }}><Plus size={16} className="text-white" /></Pressable></Authenticated></View>{}<View className="relative mb-3"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une série…" className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-white/30" /></View>{}<View className="flex gap-2">{(["discover", "mine"] as const).map((tab) => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} className="px-4 py-2 rounded-xl text-xs font-bold transition-all" style={activeTab === tab
                ? {  }
                : { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>{tab === "discover" ? "Découvrir" : "Mes abonnements"}</Pressable>
          ))}</View></View>{}<View className="flex-1 overflow-auto px-5 pb-6 space-y-3">{activeTab === "discover" ? (
          <>
            {status === "LoadingFirstPage" ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)
            ) : filtered.length === 0 ? (
              <View className="flex flex-col items-center py-16 text-center">
                <BookOpen size={40} className="text-white/15 mb-3" />
                <Text className="text-white/40 text-sm font-semibold">Aucune série trouvée</Text>
                <Text className="text-white/25 text-xs mt-1">Sois le premier à créer une série !</Text>
                <Authenticated>
                  <Pressable onPress={() => setShowCreate(true)} className="mt-4 px-5 py-2.5 rounded-2xl text-sm font-black text-white" style={{  }}>
                    Créer une série
                  </Pressable>
                </Authenticated>
              </View>
            ) : (
              <>
                {filtered.map((s) => (
                  <SeriesCard key={s._id} s={s as unknown as SeriesWithMeta} onPress={() => setSelectedId(s._id)} />
                ))}
                {status === "CanLoadMore" && (
                  <Pressable onPress={() => loadMore(10)} className="w-full py-3 text-sm text-white/40 font-semibold">
                    Charger plus
                  </Pressable>
                )}
              </>
            )}
          </>
        ) : (
          <Unauthenticated>
            <View className="flex flex-col items-center py-16 text-center">
              <Lock size={32} className="text-white/15 mb-3" />
              <Text className="text-white/40 text-sm">Connecte-toi pour voir tes abonnements</Text>
            </View>
          </Unauthenticated>
        )}{activeTab === "mine" && (
          <Authenticated>
            {myStatus === "LoadingFirstPage" ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)
            ) : mySubs.length === 0 ? (
              <View className="flex flex-col items-center py-16 text-center">
                <Bell size={32} className="text-white/15 mb-3" />
                <Text className="text-white/40 text-sm font-semibold">Aucun abonnement</Text>
                <Text className="text-white/25 text-xs mt-1">Abonne-toi à des séries pour les retrouver ici</Text>
                <Pressable onPress={() => setActiveTab("discover")} className="mt-4 px-5 py-2.5 rounded-2xl text-sm font-black text-white" style={{  }}>
                  Découvrir des séries
                </Pressable>
              </View>
            ) : (
              <>
                {mySubs.map((s) => (
                  <SeriesCard key={s._id} s={s as unknown as SeriesWithMeta} onPress={() => setSelectedId(s._id)} />
                ))}
                {myStatus === "CanLoadMore" && (
                  <Pressable onPress={() => loadMoreMine(10)} className="w-full py-3 text-sm text-white/40 font-semibold">
                    Charger plus
                  </Pressable>
                )}
              </>
            )}
          </Authenticated>
        )}</View>{}<View>{showCreate && (
          <CreateSeriesModal onClose={() => setShowCreate(false)} onCreated={(id) => { setShowCreate(false); setSelectedId(id); }} />
        )}</View></View>
  );
}

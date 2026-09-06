import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, Headphones, Play, Heart, Share2, Bookmark,
  ChevronRight, Clock, Eye, Radio, TrendingUp, Search, Loader2,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton";

interface MediaPageProps {
  onBack: () => void;
}

type MediaTab = "actualites" | "podcasts" | "videos";
type NewsCategory = "Tout" | "RDC" | "Afrique" | "Monde" | "Sport" | "Économie";

// ── Static fallback data for podcasts & videos (not in DB) ───────────────────

const PODCASTS = [
  { id: "1", title: "L'Afrique des startups — Episode 42", host: "Tech Africa Weekly", duration: "38 min", plays: "14K", cover: "🎙️", color: "#8B5CF6", desc: "Interview exclusive avec le fondateur de Wave, la fintech qui révolutionne les paiements en Afrique de l'Ouest." },
  { id: "2", title: "Économie verte au Congo", host: "Podcast RDC Business", duration: "52 min", plays: "6K", cover: "🌿", color: "#10B981", desc: "Comment les entrepreneurs congolais intègrent le développement durable dans leurs modèles d'affaires." },
  { id: "3", title: "Francophonie 2.0 — Langue et identité", host: "Culture & Langues", duration: "28 min", plays: "9K", cover: "🗣️", color: "#3B82F6", desc: "Débat passionné sur l'évolution du français parlé en Afrique subsaharienne et son influence mondiale." },
  { id: "4", title: "Sécurité alimentaire : enjeux 2025", host: "Agri & Développement", duration: "44 min", plays: "3K", cover: "🌾", color: "#F59E0B", desc: "Experts et agriculteurs débattent des défis climatiques et des innovations pour nourrir l'Afrique." },
];

const VIDEOS = [
  { id: "1", title: "Marché de Kinshasa : la vie en accéléré", duration: "2:14", views: "108K", thumb: "https://images.unsplash.com/photo-1587955359102-76802c3c804c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", tag: "Société" },
  { id: "2", title: "Dakar by night — les rues qui ne dorment pas", duration: "1:47", views: "87K", thumb: "https://images.unsplash.com/photo-1596959717167-156006d2a2f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", tag: "Culture" },
  { id: "3", title: "Top 5 tech africaine du mois", duration: "4:32", views: "45K", thumb: "https://images.unsplash.com/photo-1624421980204-22e40117494f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", tag: "Tech" },
  { id: "4", title: "Recette : poulet yassa en 3 minutes", duration: "3:05", views: "213K", thumb: "https://images.unsplash.com/photo-1697383904770-d46f8d63b667?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", tag: "Food" },
];

const NEWS_CATS: NewsCategory[] = ["Tout", "RDC", "Afrique", "Monde", "Sport", "Économie"];

const CAT_COLORS: Record<NewsCategory, string> = {
  "Tout": "#06B6D4",
  "RDC": "#3B82F6",
  "Afrique": "#10B981",
  "Monde": "#8B5CF6",
  "Sport": "#F97316",
  "Économie": "#F59E0B",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function MediaPage({ onBack }: MediaPageProps) {
  const [tab, setTab] = useState<MediaTab>("actualites");

  const tabs: { id: MediaTab; label: string; icon: React.ReactNode }[] = [
    { id: "actualites", label: "Actualités", icon: <Radio size={13} /> },
    { id: "podcasts", label: "Podcasts", icon: <Headphones size={13} /> },
    { id: "videos", label: "Vidéos", icon: <Play size={13} /> },
  ];

  return (
    <View
      className="h-full w-full flex flex-col"
      style={{  }}
    >
      {/* Ambient glow */}
      <View className="absolute top-0 right-0 w-80 h-80 rounded-full"
        style={{  }} />

      {/* Header */}
      <View className="px-5 pt-12 pb-3 flex items-center justify-between" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", }}>
        <View className="flex items-center gap-3">
          <Pressable onPress={onBack} className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={18} className="text-white" />
          </Pressable>
          <View>
            <Text className="text-white font-bold text-lg flex items-center gap-2">
              <Text>Débrouille</Text>
              <Text className="font-light text-cyan-400">Media</Text>
            </Text>
            <Text className="text-white/40 text-xs">L'info africaine en temps réel</Text>
          </View>
        </View>
        <View className="flex items-center gap-2">
          <View className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl" style={{ backgroundColor: "rgba(6,182,212,0.15)", borderWidth: 1, borderColor: "rgba(6,182,212,0.25)", borderStyle: "solid" }}>
            <View className="w-2 h-2 rounded-full bg-cyan-400" />
            <Text className="text-cyan-400 text-xs font-semibold">Live</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex gap-2 px-5 py-3">
        {tabs.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold"
            style={{ backgroundColor: tab === t.id ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.06)", borderColor: "rgba(6,182,212,0.4)", borderStyle: "solid" }}
          >
            {t.icon} {t.label}
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <View className="flex-1 overflow-y-auto px-5 pb-8" style={{  }}>
        <>
          {tab === "actualites" && (
            <>
              <Authenticated><ActualitesTab key="actualites-auth" /></Authenticated>
              <Unauthenticated><ActualitesTabFallback key="actualites-unauth" /></Unauthenticated>
            </>
          )}
          {tab === "podcasts" && <PodcastsTab key="podcasts" />}
          {tab === "videos" && <VideosTab key="videos" />}
        </>
      </View>
    </View>
  );
}

// ── Actualités Tab (authenticated – live data) ────────────────────────────────

function ActualitesTab() {
  const [category, setCategory] = useState<NewsCategory>("Tout");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const likeArticle = useMutation(api.media.likeArticle);

  const articles = useQuery(api.media.listPublishedArticles, {
    category: category !== "Tout" ? category : undefined,
  });

  return (
    <View className="flex flex-col gap-4 pt-2">
      <View className="flex items-center gap-2">
        <TrendingUp size={14} className="text-cyan-400" />
        <Text className="text-cyan-400 text-xs font-semibold">À la une ce soir</Text>
      </View>

      <View className="flex gap-2 overflow-x-auto -mx-1 px-1" style={{  }}>
        {NEWS_CATS.map((c) => (
          <Pressable key={c} onPress={() => setCategory(c)}
            className="px-3.5 py-1.5 rounded-2xl text-xs font-semibold"
            style={{ backgroundColor: category === c ? `${CAT_COLORS[c]}25` : "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
            {c}
          </Pressable>
        ))}
      </View>

      {articles === undefined ? (
        <View className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-3xl" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
          ))}
        </View>
      ) : articles.length === 0 ? (
        <View className="flex flex-col items-center justify-center py-12 gap-3">
          <Radio size={32} className="text-white/20" />
          <Text className="text-white/40 text-sm">Aucun article dans cette catégorie</Text>
        </View>
      ) : (
        <View className="flex flex-col gap-3">
          {articles.map((article, i) => {
            const catColor = CAT_COLORS[article.category as NewsCategory] ?? "#06B6D4";
            return (
              <View key={article._id}
                className="rounded-3xl p-4 flex gap-4"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
                {article.coverImage && (
                  <Image className="w-20 h-20 rounded-2xl object-cover shrink-0"  source={{ uri: article.coverImage }} accessibilityLabel={article.title}/>
                )}
                <View className="flex-1 min-w-0">
                  <View className="flex items-center gap-1.5 mb-1.5">
                    <Text className="text-[10px] font-bold px-2 py-0.5 rounded-xl" style={{ backgroundColor: `${catColor}20`, color: catColor }}>
                      {article.category}
                    </Text>
                  </View>
                  <Text className="text-white font-semibold text-sm leading-tight mb-2">{article.title}</Text>
                  {article.excerpt && <Text className="text-white/40 text-xs mb-1">{article.excerpt}</Text>}
                  <View className="flex items-center gap-3 mt-2">
                    <Pressable
                      onPress={() => { void likeArticle({ articleId: article._id }); UIService.openToast("Article aimé !", "success"); }}
                      className="flex items-center gap-1">
                      <Heart size={13} className="text-white/30" />
                      <Text className="text-white/30 text-[10px]">{article.likeCount}</Text>
                    </Pressable>
                    <Pressable className="flex items-center gap-1"><Share2 size={13} className="text-white/30" /></Pressable>
                    <Pressable onPress={() => { const n = new Set(saved); if (n.has(article._id)) { n.delete(article._id); } else { n.add(article._id); } setSaved(n); }} className="flex items-center gap-1">
                      <Bookmark size={13} style={{ color: saved.has(article._id) ? "#22D3EE" : "rgba(255,255,255,0.3)", fill: saved.has(article._id) ? "#22D3EE" : "none" }} />
                    </Pressable>
                    <View className="flex items-center gap-1 ml-auto">
                      <Eye size={11} className="text-white/20" />
                      <Text className="text-white/30 text-[10px]">{article.viewCount}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// Fallback for unauthenticated users
function ActualitesTabFallback() {
  return (
    <View className="flex flex-col items-center justify-center py-16 gap-4">
      <Radio size={40} className="text-cyan-400/40" />
      <Text className="text-white/50 text-sm text-center">Connectez-vous pour accéder aux actualités</Text>
    </View>
  );
}

// ── Podcasts Tab ──────────────────────────────────────────────────────────────

function PodcastsTab() {
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <View className="flex flex-col gap-3 pt-2">
      <Text className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Podcasts populaires</Text>
      {PODCASTS.map((p, i) => (
        <View key={p.id}
          className="rounded-3xl p-4"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
          <View className="flex items-start gap-4">
            <View className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: `${p.color}20`, borderStyle: "solid" }}>
              {p.cover}
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-white font-bold text-sm leading-tight">{p.title}</Text>
              <Text className="text-white/40 text-xs mt-0.5">{p.host}</Text>
              <Text className="text-white/40 text-xs leading-relaxed mt-1.5">{p.desc}</Text>
              <View className="flex items-center justify-between mt-3">
                <View className="flex items-center gap-3">
                  <View className="flex items-center gap-1"><Clock size={11} className="text-white/30" /><Text className="text-white/40 text-xs">{p.duration}</Text></View>
                  <View className="flex items-center gap-1"><Headphones size={11} className="text-white/30" /><Text className="text-white/40 text-xs">{p.plays}</Text></View>
                </View>
                <Pressable
                  onPress={() => setPlaying((prev) => prev === p.id ? null : p.id)}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: playing === p.id ? p.color : `${p.color}20`, borderStyle: "solid" }}>
                  {playing === p.id
                    ? <View className="w-2.5 h-2.5 rounded-sm bg-white" />
                    : <Play size={14} style={{ color: p.color }} />}
                </Pressable>
              </View>
            </View>
          </View>
          <>
            {playing === p.id && (
              <View className="mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", }}>
                <View className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  <View className="h-full rounded-full" style={{ backgroundColor: p.color }} />
                </View>
              </View>
            )}
          </>
        </View>
      ))}
    </View>
  );
}

// ── Videos Tab ────────────────────────────────────────────────────────────────

function VideosTab() {
  const [liked, setLiked] = useState<Set<string>>(new Set());

  return (
    <View className="flex flex-col gap-3 pt-2">
      <Text className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Vidéos tendance</Text>
      <View className="gap-3">
        {VIDEOS.map((v, i) => (
          <View key={v.id}
            className="rounded-3xl overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
            <View className="relative">
              <Image className="w-full h-28 object-cover"  source={{ uri: v.thumb }} accessibilityLabel={v.title}/>
              <View className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
                <View className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                  <Play size={16} className="text-white ml-0.5" />
                </View>
              </View>
              <View className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
                {v.duration}
              </View>
              <View className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{ backgroundColor: "rgba(6,182,212,0.3)", borderWidth: 1, borderColor: "rgba(6,182,212,0.3)", borderStyle: "solid" }}>
                {v.tag}
              </View>
            </View>
            <View className="p-3">
              <Text className="text-white text-xs font-semibold leading-tight mb-2">{v.title}</Text>
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-1"><Eye size={11} className="text-white/30" /><Text className="text-white/40 text-[10px]">{v.views}</Text></View>
                <Pressable onPress={() => { const n = new Set(liked); if (n.has(v.id)) { n.delete(v.id); } else { n.add(v.id); } setLiked(n); }} className="">
                  <Heart size={13} style={{ color: liked.has(v.id) ? "#EF4444" : "rgba(255,255,255,0.3)", fill: liked.has(v.id) ? "#EF4444" : "none" }} />
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </View>
      <View className="flex items-center justify-center py-4">
        <Pressable className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-cyan-400"
          style={{ backgroundColor: "rgba(6,182,212,0.1)", borderWidth: 1, borderColor: "rgba(6,182,212,0.2)", borderStyle: "solid" }}>
          Voir plus <ChevronRight size={14} />
        </Pressable>
      </View>
    </View>
  );
}

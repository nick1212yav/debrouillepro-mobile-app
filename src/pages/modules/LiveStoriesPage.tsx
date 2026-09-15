import { View, Pressable, Text, Image, TextInput } from "react-native";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Radio, Play, Eye, Heart, MessageCircle,
  Send, Smile, Users, Mic, MicOff,
  Plus, X,
  Zap, Crown, Clock,
  ChevronRight,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

// ── Types ─────────────────────────────────────────────────────────────────────
type ChatMessage = {
  id: string;
  auteur: string;
  avatar: string;
  texte: string;
  temps: number;
  type: "chat" | "join" | "reaction";
};

// Type for a live stream from the backend
type LiveStreamData = {
  _id: Id<"liveStreams">;
  _creationTime: number;
  hostId: Id<"users">;
  title: string;
  description?: string;
  category: string;
  thumbnailUrl?: string;
  viewerCount: number;
  peakViewers: number;
  likeCount: number;
  status: "scheduled" | "live" | "ended";
  startedAt?: string;
  endedAt?: string;
  tags: string[];
  isPublic: boolean;
  hostName: string;
  hostAvatar?: string;
};

// Type for active story groups from backend
type StoryGroup = {
  author: {
    id: Id<"users">;
    name: string;
    avatar?: string;
    city?: string;
  };
  stories: Array<{
    _id: Id<"stories">;
    _creationTime: number;
    authorId: Id<"users">;
    mediaUrl: string;
    mediaType: "image" | "video";
    caption?: string;
    duration?: number;
    viewCount: number;
    expiresAt: string;
    isHighlight: boolean;
    authorName: string;
    authorAvatar?: string;
    authorCity?: string;
  }>;
  hasUnviewed: boolean;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const FLOATING_EMOJIS = ["❤️", "🔥", "👏", "😂", "🚀", "💜", "⚡", "🎉"];

// ── Floating Reaction ─────────────────────────────────────────────────────────
function FloatingEmoji({ emoji, x }: { emoji: string; x: number }) {
  return (
    <View initial={{ opacity: 1, y: 0, scale: 1 }} animate={{ opacity: 0, y: -200, scale: 1.5 }} transition={{ duration: 2, ease: "easeOut" as const }} className="absolute bottom-24 text-3xl pointer-events-none z-50" style={{ left: `${x}%` }}>
      {emoji}
    </View>
  );
}

// ── Helper: compute time elapsed ──────────────────────────────────────────────
function timeAgo(isoOrMs: string | number): string {
  const ms = typeof isoOrMs === "string" ? new Date(isoOrMs).getTime() : isoOrMs;
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "maintenant";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}j`;
}

function formatDuration(startedAt?: string): string {
  if (!startedAt) return "00:00";
  const diff = Date.now() - new Date(startedAt).getTime();
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Extract story display data from mediaUrl encoding ─────────────────────────
function getStoryBackground(mediaUrl: string): string {
  if (mediaUrl.startsWith("data:slide/")) {
    const parts = mediaUrl.replace("data:slide/", "").split("|");
    return parts[0] ?? "linear-gradient(135deg,#667eea,#764ba2)";
  }
  if (mediaUrl.startsWith("data:text/")) {
    const parts = mediaUrl.replace("data:text/", "").split("|");
    return parts[0] ?? "#1a1a2e";
  }
  return "#1a1a2e";
}

function getStoryText(mediaUrl: string, caption?: string): string | undefined {
  if (caption) return caption;
  if (mediaUrl.startsWith("data:text/")) {
    const parts = mediaUrl.replace("data:text/", "").split("|");
    return parts[1];
  }
  return undefined;
}

// ── Story Viewer ──────────────────────────────────────────────────────────────
function StoryCard({ story, authorName, authorAvatar, onClose }: {
  story: StoryGroup["stories"][number];
  authorName: string;
  authorAvatar?: string;
  onClose: () => void;
}) {
  const bg = getStoryBackground(story.mediaUrl);
  const text = getStoryText(story.mediaUrl, story.caption);
  const isImageUrl = story.mediaUrl.startsWith("http");

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
      <View initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="relative w-full max-w-sm mx-4 rounded-3xl overflow-hidden" style={{ aspectRatio: "9/16", maxHeight: "80vh", backgroundColor: bg }}>
        {/* Background image if URL */}
        {isImageUrl && (
          <Image className="absolute inset-0 w-full h-full object-cover" source={{ uri: story.mediaUrl }} accessibilityLabel="" />
        )}
        {/* Overlay gradient */}
        <View className="absolute inset-0" style={{  }} />

        {/* Top bar */}
        <View className="absolute top-0 left-0 right-0 px-4 pt-4 flex items-center gap-3">{authorAvatar ? (
            <Image className="w-8 h-8 rounded-xl object-cover border-2 border-white/30" source={{ uri: authorAvatar }} accessibilityLabel="" />
          ) : (
            <View className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white bg-purple-600">{authorName[0]}</View>
          )}<View className="flex-1"><Text className="text-xs font-bold text-white">{authorName}</Text><Text className="text-[10px] text-white/60 flex items-center gap-1"><Eye size={9} />{story.viewCount}· {timeAgo(story._creationTime)}</Text></View><Pressable onPress={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}><X size={16} className="text-white" /></Pressable></View>

        {/* Text content */}
        <View className="absolute inset-x-0 bottom-0 px-5 pb-6 pt-16">{text && (
            <Text className="text-lg font-bold leading-snug mb-4 text-center text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>{text}</Text>
          )}</View>
      </View>
    </View>
  );
}

// ── Live Viewer ────────────────────────────────────────────────────────────────
function LiveViewer({ stream, onClose }: { stream: LiveStreamData; onClose: () => void }) {
  const { isAuthenticated } = useConvexAuth();
  const sendMessageMut = useMutation(api.liveStreams.sendMessage);
  const likeStreamMut = useMutation(api.liveStreams.likeStream);
  const streamMessages = useQuery(
    api.liveStreams.getStreamMessages,
    isAuthenticated ? { streamId: stream._id } : "skip"
  );

  const [input, setInput] = useState("");
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(stream.likeCount);
  const [floating, setFloating] = useState<Array<{ id: string; emoji: string; x: number }>>([]);
  const [muted, setMuted] = useState(false);
  const msgRef = useRef<View>(null);

  useEffect(() => {
    msgRef.current?.scrollTo({ top: msgRef.current.scrollHeight, behavior: "smooth" });
  }, [streamMessages]);

  const addFloating = (emoji: string) => {
    const id = `f-${Date.now()}-${Math.random()}`;
    const x = 10 + Math.random() * 70;
    setFloating((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => setFloating((prev) => prev.filter((f) => f.id !== id)), 2200);
  };

  const handleLike = async () => {
    setLiked(true);
    setLikes((l) => l + 1);
    addFloating("❤️");
    try {
      await likeStreamMut({ streamId: stream._id });
    } catch { /* ignore */ }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    try {
      await sendMessageMut({ streamId: stream._id, text, type: "chat" });
    } catch { /* ignore */ }
  };

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex flex-col" style={{ backgroundColor: "#000" }}>

      {/* Background image */}
      {stream.thumbnailUrl && (
        <Image className="absolute inset-0 w-full h-full object-cover opacity-40" source={{ uri: stream.thumbnailUrl }} accessibilityLabel="" />
      )}
      <View className="absolute inset-0" style={{  }} />

      {/* Floating reactions */}
      <View className="absolute inset-0 overflow-hidden pointer-events-none"><View>{floating.map((f) => <FloatingEmoji key={f.id} emoji={f.emoji} x={f.x} />)}</View></View>

      {/* Top bar */}
      <View className="relative z-10 flex items-center gap-3 px-4 pt-6 pb-3"><Pressable onPress={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}><ArrowLeft size={18} className="text-white" /></Pressable><View className="flex items-center gap-2 flex-1">{stream.hostAvatar ? (
            <Image className="w-9 h-9 rounded-xl object-cover border-2 border-red-500" source={{ uri: stream.hostAvatar }} accessibilityLabel={stream.hostName} />
          ) : (
            <View className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white bg-red-500">{stream.hostName[0]}</View>
          )}<View><Text className="text-sm font-bold text-white leading-tight">{stream.hostName}</Text><Text className="flex items-center gap-1 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full w-fit" style={{  }}><Radio size={8} />LIVE
            </Text></View></View>{}<View className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}><Eye size={12} className="text-white/80" /><Text className="text-xs font-bold text-white">{stream.viewerCount.toLocaleString()}</Text></View></View>

      {/* Title + tags */}
      <View className="relative z-10 px-4 mb-2"><Text className="text-sm font-bold text-white leading-snug">{stream.title}</Text><View className="flex gap-1.5 mt-1 flex-wrap">{stream.tags.map((t) => (
            <Text key={t} className="px-2 py-0.5 rounded-full text-[10px] text-white/70" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>#{t}</Text>
          ))}</View></View>

      {/* Chat */}
      <View ref={msgRef} className="relative z-10 flex-1 overflow-y-auto px-4 flex flex-col justify-end gap-1.5 pb-2" style={{  }}><View>{streamMessages?.map((msg) => (
            <View key={msg._id} initial={{ opacity: 0, x: -10, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.2 }} className={`flex items-start gap-2 ${msg.type === "system" ? "justify-center" : ""}`}>
              {msg.type === "system" ? (
                <Text className="text-[10px] text-white/40 px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>{msg.text}</Text>
              ) : (
                <>
                  {msg.userAvatar ? (
                    <Image className="w-6 h-6 rounded-lg object-cover flex-shrink-0 mt-0.5" source={{ uri: msg.userAvatar }} accessibilityLabel={msg.userName} />
                  ) : (
                    <View className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white bg-purple-600 flex-shrink-0 mt-0.5">{msg.userName[0]}</View>
                  )}
                  <View className="max-w-[85%] px-3 py-1.5 rounded-2xl" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}><Text className="text-[10px] font-bold text-purple-300 mb-0.5">{msg.userName}</Text><Text className="text-xs text-white/90 leading-snug">{msg.text}</Text></View>
                </>
              )}
            </View>
          ))}</View></View>

      {/* Controls */}
      <View className="relative z-10 px-4 pb-8 pt-3" style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>{}<View className="flex items-center gap-2 mb-3 overflow-x-auto" style={{  }}>{FLOATING_EMOJIS.map((e) => (
            <Pressable key={e} onPress={() => addFloating(e)} className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 active:scale-90 transition-transform" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>{e}</Pressable>
          ))}</View>{}<View className="flex items-center gap-2"><Pressable onPress={handleLike} className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-transform" style={{ backgroundColor: liked ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)" }}><Heart size={18} className={liked ? "text-red-400 fill-red-400" : "text-white/60"} /></Pressable><View className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}><TextInput value={input} onChangeText={(value) => setInput(value)} onKeyPress={(e) => { if (e.nativeEvent.key === "Enter") sendMessage(); }} placeholder="Commenter..." className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/40" /><Smile size={16} className="text-white/40" /></View><Pressable onPress={sendMessage} className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-transform" style={{  }}><Send size={15} className="text-white" /></Pressable><Pressable onPress={() => setMuted(!muted)} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>{muted ? <MicOff size={16} className="text-red-400" /> : <Mic size={16} className="text-white/60" />}</Pressable></View>{}<Text className="text-[10px] text-white/40 text-center mt-2">{likes.toLocaleString()}likes · {formatDuration(stream.startedAt)}en direct
        </Text></View>
    </View>
  );
}

// ── Loading skeletons ─────────────────────────────────────────────────────────
function LiveSkeleton() {
  return (
    <View className="flex flex-col gap-4">{Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="w-full h-[200px] rounded-3xl" />
      ))}</View>
  );
}

function StoriesSkeleton() {
  return (
    <View className="gap-3">{Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="w-full rounded-2xl" style={{ aspectRatio: "9/14" }} />
      ))}</View>
  );
}

function ReplaysSkeleton() {
  return (
    <View className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="w-full h-[100px] rounded-2xl" />
      ))}</View>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type Tab = "lives" | "stories" | "replays";

interface LiveStoriesPageProps {
  onBack: () => void;
}

export default function LiveStoriesPage({ onBack }: LiveStoriesPageProps) {
  const { isAuthenticated } = useConvexAuth();
  const [tab, setTab] = useState<Tab>("lives");
  const [activeLive, setActiveLive] = useState<LiveStreamData | null>(null);
  const [activeStoryGroup, setActiveStoryGroup] = useState<StoryGroup | null>(null);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);

  // Backend queries
  const liveStreams = useQuery(
    api.liveStreams.listLiveStreams,
    isAuthenticated ? { status: "live" } : "skip"
  );
  const endedStreams = useQuery(
    api.liveStreams.listLiveStreams,
    isAuthenticated ? { status: "ended" } : "skip"
  );
  const storyGroups = useQuery(
    api.stories.listActiveStories,
    isAuthenticated ? {} : "skip"
  );

  const isLiveLoading = liveStreams === undefined && isAuthenticated;
  const isStoriesLoading = storyGroups === undefined && isAuthenticated;
  const isReplaysLoading = endedStreams === undefined && isAuthenticated;

  const totalLive = liveStreams?.reduce((s, l) => s + l.viewerCount, 0) ?? 0;

  const TABS: { id: Tab; label: string; icon: React.ElementType; color: string }[] = [
    { id: "lives", label: "En direct", icon: Radio, color: "#EF4444" },
    { id: "stories", label: "Stories", icon: Zap, color: "#8B5CF6" },
    { id: "replays", label: "Replays", icon: Play, color: "#3B82F6" },
  ];

  return (
    <View className="relative h-full w-full flex flex-col overflow-hidden" style={{  }}>{}<View className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none" style={{  }} /><View className="absolute bottom-16 left-0 w-48 h-48 rounded-full pointer-events-none" style={{  }} />{}<View className="flex-shrink-0 px-5 pt-6 pb-0"><View className="flex items-center gap-3 mb-5"><Pressable onPress={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}><ArrowLeft size={18} className="text-white" /></Pressable><View><Text className="text-lg font-black text-white">Live & Stories</Text><Text className="text-[11px] text-white/40">{isAuthenticated ? `${totalLive.toLocaleString()} spectateurs en direct` : "Connectez-vous pour accéder"}</Text></View><Pressable whileTap={{ scale: 0.92 }} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white" style={{  }}><Radio size={12} />Lancer un Live
          </Pressable></View>{}<View className="flex gap-2 mb-4">{TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <Pressable key={t.id} onPress={() => setTab(t.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all" style={{ backgroundColor: active ? `${t.color}22` : "rgba(255,255,255,0.05)", borderColor: "transparent", borderStyle: "solid" }}><Icon size={13} />{t.label}</Pressable>
            );
          })}</View></View>{}{!isAuthenticated && (
        <View className="flex-1 flex items-center justify-center px-5"><View className="text-center"><Text className="text-white/60 text-sm mb-2">Connectez-vous pour voir les lives et stories</Text></View></View>
      )}{}{isAuthenticated && (
        <View className="flex-1 overflow-y-auto px-5 pb-8" style={{  }}><View>{}{tab === "lives" && (
              <View key="lives" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-4">
                {isLiveLoading ? (
                  <LiveSkeleton />
                ) : liveStreams && liveStreams.length > 0 ? (
                  liveStreams.map((live, i) => (
                    <Pressable key={live._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileTap={{ scale: 0.97 }} onPress={() => setActiveLive(live)} className="relative w-full rounded-3xl overflow-hidden text-left" style={{ height: 200 }}>
                      {live.thumbnailUrl ? (
                        <Image className="absolute inset-0 w-full h-full object-cover" source={{ uri: live.thumbnailUrl }} accessibilityLabel={live.title} />
                      ) : (
                        <View className="absolute inset-0" style={{  }} />
                      )}
                      <View className="absolute inset-0" style={{  }} />
                      {/* Pulsing LIVE badge */}
                      <View className="absolute top-3 left-3 flex items-center gap-1.5"><Text animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black text-white" style={{  }}><Radio size={9} />LIVE
                        </Text><Text className="px-2 py-1 rounded-full text-[10px] text-white/80" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>{formatDuration(live.startedAt)}</Text></View>
                      <View className="absolute bottom-3 left-3 right-3"><View className="flex items-center gap-2 mb-1.5">{live.hostAvatar ? (
                            <Image className="w-7 h-7 rounded-xl object-cover border border-white/30" source={{ uri: live.hostAvatar }} accessibilityLabel={live.hostName} />
                          ) : (
                            <View className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white bg-purple-600 border border-white/30">{live.hostName[0]}</View>
                          )}<Text className="text-xs font-bold text-white">{live.hostName}</Text></View><Text className="text-sm font-bold text-white leading-snug">{live.title}</Text><View className="flex items-center gap-3 mt-1.5"><Text className="flex items-center gap-1 text-[11px] text-white/70"><Eye size={11} />{live.viewerCount.toLocaleString()}</Text><Text className="flex items-center gap-1 text-[11px] text-white/70"><Heart size={11} />{live.likeCount.toLocaleString()}</Text>{live.tags.map((t) => (
                            <Text key={t} className="text-[10px] text-white/50">#{t}</Text>
                          ))}</View></View>
                    </Pressable>
                  ))
                ) : (
                  <View className="text-center py-12"><Radio size={32} className="text-white/20 mx-auto mb-3" /><Text className="text-sm text-white/40">Aucun live en cours</Text><Text className="text-xs text-white/25 mt-1">Revenez plus tard ou lancez votre propre live</Text></View>
                )}

                {/* Scheduled lives placeholder */}
                <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}><View className="flex items-center gap-2 mb-3"><Clock size={14} className="text-purple-400" /><Text className="text-sm font-bold text-white">Prochains lives</Text></View><Text className="text-xs text-white/40 text-center py-4">Aucun live programmé pour le moment</Text></View>
              </View>
            )}{}{tab === "stories" && (
              <View key="stories" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                {/* Create story CTA */}
                <Pressable whileTap={{ scale: 0.97 }} className="w-full flex items-center gap-3 p-4 rounded-2xl mb-4" style={{ borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", borderStyle: "solid" }}>
                  <View className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{  }}><Plus size={22} className="text-white" /></View>
                  <View className="text-left"><Text className="text-sm font-bold text-white">Créer une story</Text><Text className="text-[11px] text-white/50">Photo, texte, sondage ou question</Text></View>
                  <ChevronRight size={16} className="text-white/30 ml-auto" />
                </Pressable>

                {isStoriesLoading ? (
                  <StoriesSkeleton />
                ) : storyGroups && storyGroups.length > 0 ? (
                  <View className="gap-3">{storyGroups.map((group, i) => {
                      const firstStory = group.stories[0];
                      if (!firstStory) return null;
                      const bg = getStoryBackground(firstStory.mediaUrl);
                      const text = getStoryText(firstStory.mediaUrl, firstStory.caption);
                      const isImageUrl = firstStory.mediaUrl.startsWith("http");

                      return (
                        <Pressable key={group.author.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} whileTap={{ scale: 0.96 }} onPress={() => { setActiveStoryGroup(group); setActiveStoryIdx(0); }} className="relative rounded-2xl overflow-hidden text-left" style={{ aspectRatio: "9/14", backgroundColor: bg }}>
                          {isImageUrl && <Image className="absolute inset-0 w-full h-full object-cover" source={{ uri: firstStory.mediaUrl }} accessibilityLabel="" />}
                          <View className="absolute inset-0" style={{  }} />

                          {/* Unviewed indicator */}
                          {group.hasUnviewed && (
                            <View className="absolute top-2 left-2 w-2 h-2 rounded-full bg-purple-500" />
                          )}

                          <View className="absolute bottom-0 left-0 right-0 p-2.5"><View className="flex items-center gap-1.5 mb-1">{group.author.avatar ? (
                                <Image className="w-5 h-5 rounded-md object-cover" source={{ uri: group.author.avatar }} accessibilityLabel="" />
                              ) : (
                                <View className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white bg-purple-600">{group.author.name[0]}</View>
                              )}<Text className="text-[10px] font-bold text-white truncate">{group.author.name.split(" ")[0]}</Text></View>{text && <Text className="text-[10px] text-white/80 leading-tight">{text}</Text>}<View className="flex items-center gap-1.5 mt-1"><Eye size={9} className="text-white/50" /><Text className="text-[9px] text-white/50">{firstStory.viewCount}</Text><Text className="text-[9px] text-white/30 ml-auto">{timeAgo(firstStory._creationTime)}</Text></View></View>
                        </Pressable>
                      );
                    })}</View>
                ) : (
                  <View className="text-center py-12"><Zap size={32} className="text-white/20 mx-auto mb-3" /><Text className="text-sm text-white/40">Aucune story active</Text><Text className="text-xs text-white/25 mt-1">Les stories disparaissent après 24h</Text></View>
                )}
              </View>
            )}{}{tab === "replays" && (
              <View key="replays" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-3">
                {isReplaysLoading ? (
                  <ReplaysSkeleton />
                ) : endedStreams && endedStreams.length > 0 ? (
                  endedStreams.map((r, i) => (
                    <View key={r._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="relative w-full rounded-2xl overflow-hidden text-left flex gap-3 p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
                      <View className="relative w-28 h-20 rounded-xl overflow-hidden flex-shrink-0">{r.thumbnailUrl ? (
                          <Image className="w-full h-full object-cover" source={{ uri: r.thumbnailUrl }} accessibilityLabel={r.title} />
                        ) : (
                          <View className="w-full h-full" style={{  }} />
                        )}<View className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}><View className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}><Play size={14} className="text-white ml-0.5" /></View></View>{r.startedAt && r.endedAt && (
                          <Text className="absolute bottom-1 right-1 text-[9px] text-white font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>{formatDuration(r.startedAt)}</Text>
                        )}</View>
                      <View className="flex-1 min-w-0"><Text className="text-sm font-bold text-white leading-snug">{r.title}</Text><View className="flex items-center gap-1.5 mt-1.5">{r.hostAvatar ? (
                            <Image className="w-4 h-4 rounded-md object-cover" source={{ uri: r.hostAvatar }} accessibilityLabel="" />
                          ) : (
                            <View className="w-4 h-4 rounded-md flex items-center justify-center text-[8px] font-bold text-white bg-purple-600">{r.hostName[0]}</View>
                          )}<Text className="text-[10px] text-white/50">{r.hostName}</Text></View><View className="flex items-center gap-3 mt-1.5"><Text className="flex items-center gap-1 text-[10px] text-white/40"><Eye size={9} />{r.peakViewers.toLocaleString()}</Text><Text className="flex items-center gap-1 text-[10px] text-white/40"><Heart size={9} />{r.likeCount.toLocaleString()}</Text></View></View>
                    </View>
                  ))
                ) : (
                  <View className="text-center py-12">
                    <Play size={32} className="text-white/20 mx-auto mb-3" />
                    <Text className="text-sm text-white/40">Aucun replay disponible</Text>
                  </View>
                )}
              </View>
            )}</View></View>
      )}{}<View>{activeLive && <LiveViewer stream={activeLive} onClose={() => setActiveLive(null)} />}</View>{}<View>{activeStoryGroup && activeStoryGroup.stories[activeStoryIdx] && (
          <StoryCard
            story={activeStoryGroup.stories[activeStoryIdx]}
            authorName={activeStoryGroup.author.name}
            authorAvatar={activeStoryGroup.author.avatar}
            onClose={() => setActiveStoryGroup(null)}
          />
        )}</View></View>
  );
}

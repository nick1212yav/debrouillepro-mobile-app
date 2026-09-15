import { Pressable, View, Text, TextInput, Image, Share, GestureResponderEvent } from "react-native";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  ArrowLeft, Heart, MessageCircle, Share2, Bookmark,
  Plus, Hash, TrendingUp, X, Upload,
  Send, Trash2, Play, Pause, Volume2, VolumeX,
  UserPlus, UserCheck, Gauge, ChevronUp, ChevronDown,
} from "lucide-react-native";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import { toast } from "sonner";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Clipboard } from "@react-native-clipboard/clipboard";

/* __DEBROUILLEPRO_NATIVE_DOM_API_HELPERS_V8__ — scrollTo normalizer */
const __debrouilleProNativeNormalizeScrollTo = (value: unknown, y?: unknown): { x: number; y: number; animated: boolean } => {
  if (typeof value === "number") return { x: value, y: typeof y === "number" ? y : 0, animated: true };
  if (typeof value === "object" && value !== null) {
    const o = value as Record<string, unknown>;
    const x = typeof o.x === "number" ? o.x : typeof o.left === "number" ? o.left : 0;
    const y = typeof o.y === "number" ? o.y : typeof o.top === "number" ? o.top : 0;
    return { x, y, animated: o.behavior !== "auto" && o.behavior !== "instant" };
  }
  return { x: 0, y: 0, animated: true };
};

/* __DEBROUILLEPRO_NATIVE_DOM_API_HELPERS_V8__ — scrollIntoView helper */
const __debrouilleProNativeScrollIntoView = async (ref: { current?: { measure?: (cb: (x: number, y: number, w: number, h: number, px: number, py: number) => void) => void } }): Promise<void> => {
  return new Promise((resolve) => {
    ref.current?.measure?.((_x, _y, _w, _h, _px, py) => {
      console.warn('__debrouilleProNativeScrollIntoView: implement scrollTo with pageY on your ScrollView ref');
      resolve();
    });
  });
};


// ─── Types ────────────────────────────────────────────────────────────────────
type VideoItem = {
  _id: Id<"shortVideos">;
  videoUrl: string;
  thumbnailUrl?: string;
  caption: string;
  hashtags: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  authorId?: Id<"users">;
  authorName?: string;
  authorAvatar?: string;
  likedByMe: boolean;
};

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
type Speed = (typeof SPEED_OPTIONS)[number];

// ─── Demo videos ──────────────────────────────────────────────────────────────
const DEMO_VIDEOS: VideoItem[] = [
  {
    _id: "demo1" as Id<"shortVideos">,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    caption: "Bienvenue sur le fil Reels ! Partagez vos moments en vidéos courtes 🎬",
    hashtags: ["bienvenue", "debrouillePro", "afriqueDigitale"],
    likeCount: 142, commentCount: 28, shareCount: 15, viewCount: 1204,
    authorName: "Débrouille Pro", authorAvatar: undefined, likedByMe: false,
  },
  {
    _id: "demo2" as Id<"shortVideos">,
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
    caption: "Astuces business pour entrepreneurs africains 💼🚀",
    hashtags: ["business", "entrepreneur", "afrique"],
    likeCount: 89, commentCount: 14, shareCount: 7, viewCount: 620,
    authorName: "Coach Africa", authorAvatar: undefined, likedByMe: false,
  },
];

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, avatar, size = 40 }: { name?: string; avatar?: string; size?: number }) {
  if (avatar) return <Image className="rounded-full object-cover border-2 border-white/30" style={{ width: size, height: size }} source={{ uri: avatar }} accessibilityLabel={name ?? "?"} />;
  const hue = ((name ?? "?").charCodeAt(0) * 37) % 360;
  return (
    <View className="rounded-full flex items-center justify-center font-bold text-white border-2 border-white/30 flex-shrink-0" style={{ width: size, height: size, fontSize: size * 0.35, backgroundColor: `hsl(${hue},55%,35%)` }}>{(name ?? "?").slice(0, 1).toUpperCase()}</View>
  );
}

// ─── Follow Mini Button ───────────────────────────────────────────────────────
function FollowButton({ authorId }: { authorId?: Id<"users"> }) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const toggleFollow = useMutation(api.follows.toggleFollow);
  const { isAuthenticated } = useConvexAuth();

  if (!authorId || !isAuthenticated) return null;

  const handle = async () => {
    setLoading(true);
    try {
      const now = await toggleFollow({ targetUserId: authorId });
      setFollowing(now);
      toast(now ? "Abonné !" : "Abonnement retiré", { icon: now ? "✅" : "👋" });
    } catch {
      toast.error("Impossible de modifier l'abonnement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable whileTap={{ scale: 0.9 }} onPress={(e) => { void handle(); }} disabled={loading} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all" style={{ borderColor: "rgba(255,255,255,0.3)", borderStyle: "solid" }}>
      {following ? <UserCheck size={11} /> : <UserPlus size={11} />}
      {following ? "Suivi" : "Suivre"}
    </Pressable>
  );
}

// ─── Speed Picker ─────────────────────────────────────────────────────────────
function SpeedPicker({ speed, onChange, onClose }: { speed: Speed; onChange: (s: Speed) => void; onClose: () => void }) {
  return (
    <View initial={{ opacity: 0, scale: 0.85, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 10 }} className="absolute bottom-28 right-3 z-30 rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: "rgba(0,0,0,0.85)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderStyle: "solid", minWidth: 72 }} onPress={(e) => e.stopPropagation()}>
      {[...SPEED_OPTIONS].reverse().map((s) => (
        <Pressable key={s} onPress={() => { onChange(s); onClose(); }} className="px-4 py-2.5 text-xs font-bold transition-colors text-center" style={{ backgroundColor: s === speed ? "rgba(139,92,246,0.15)" : "transparent" }}>{s}<Text>x</Text></Pressable>
      ))}
    </View>
  );
}

// ─── Comments Sheet ───────────────────────────────────────────────────────────
function CommentsSheet({ videoId, onClose }: { videoId: Id<"shortVideos">; onClose: () => void }) {
  const [text, setText] = useState("");
  const { isAuthenticated } = useConvexAuth();
  const comments = useQuery(api.shortVideos.getComments, { videoId });
  const addComment = useMutation(api.shortVideos.addComment);
  const deleteComment = useMutation(api.shortVideos.deleteComment);
  const endRef = useRef<View>(null);

  useEffect(() => { __debrouilleProNativeScrollIntoView(endRef.current); }, [comments]);

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      await addComment({ videoId, text: text.trim() });
      setText("");
    } catch { toast.error("Erreur"); }
  };

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={(e) => e.target === e.currentTarget && onClose()}>
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="w-full rounded-t-3xl flex flex-col" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", maxHeight: "72vh" }}>
        <View className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" }}><Text className="text-white font-bold text-base flex items-center gap-2"><MessageCircle size={16} className="text-indigo-400" />Commentaires {comments !== undefined && `(${comments.length})`}</Text><Pressable onPress={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}><X size={16} className="text-white" /></Pressable></View>
        <View className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0" style={{  }}>{comments === undefined ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
          ) : comments.length === 0 ? (
            <View className="flex flex-col items-center py-8 gap-2"><MessageCircle size={32} className="text-white/20" /><Text className="text-white/40 text-sm">Soyez le premier à commenter</Text></View>
          ) : (
            comments.map((c) => (
              <View key={c._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 group">
                <View className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: `hsl(${c.userName.charCodeAt(0) * 13 % 360},55%,40%)` }}>{c.userName[0]?.toUpperCase()}</View>
                <View className="flex-1 min-w-0"><Text className="text-indigo-300 text-xs font-bold">{c.userName}</Text><Text className="text-white/80 text-sm leading-snug">{c.text}</Text></View>
                <Pressable onPress={() => deleteComment({ commentId: c._id as Id<"shortVideoComments"> }).catch(() => null)} className="p-1 rounded-lg opacity-0"><Trash2 size={12} className="text-white/20 transition-colors" /></Pressable>
              </View>
            ))
          )}<View ref={endRef} /></View>
        <View className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" }}>{isAuthenticated ? (
            <>
              <TextInput value={text} onChangeText={(value) => setText(value)} onKeyPress={(e) => e.nativeEvent.key === "Enter" && void handleSend()} placeholder="Ajouter un commentaire..." className="flex-1 px-4 py-2.5 rounded-2xl text-sm text-white outline-none" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }} />
              <Pressable onPress={() => void handleSend()} className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{  }}><Send size={14} className="text-white" /></Pressable>
            </>
          ) : (
            <View className="flex-1 text-center pb-1"><SignInButton /></View>
          )}</View>
      </View>
    </View>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function VideoProgress({ videoRef }: { videoRef: React.RefObject<unknown | null> }) {
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const barRef = useRef<View>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const update = () => {
      if (!dragging && el.duration) setProgress(el.currentTime / el.duration);
    };
    el.addEventListener("timeupdate", update);
    return () => el.removeEventListener("timeupdate", update);
  }, [videoRef, dragging]);

  const seek = (e: GestureResponderEvent | GestureResponderEvent) => {
    const bar = barRef.current;
    const el = videoRef.current;
    if (!bar || !el) return;
    const rect = bar.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    el.currentTime = ratio * el.duration;
    setProgress(ratio);
  };

  return (
    <View ref={barRef} className="absolute bottom-0 left-0 right-0 h-1 z-20 group" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} onTouchStart={(e) => { setDragging(true); seek(e); }} onTouchMove={(e) => { if (dragging) seek(e); }} onTouchEnd={() => setDragging(false)}><View className="h-full rounded-full transition-all" style={{ width: `${progress * 100}%` }} />{}<View className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 transition-opacity" style={{ left: `calc(${progress * 100}% - 6px)`, backgroundColor: "white", boxShadow: "0 0 6px rgba(139,92,246,0.8)" }} /></View>
  );
}

// ─── Single Reel ──────────────────────────────────────────────────────────────
function Reel({
  video, active, onSwipeUp, onSwipeDown,
}: {
  video: VideoItem;
  active: boolean;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}) {
  const videoRef = useRef<View>(null);
  const [liked, setLiked] = useState(video.likedByMe);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [showSpeed, setShowSpeed] = useState(false);
  const [commentCount, setCommentCount] = useState(video.commentCount);
  const touchStartY = useRef<number | null>(null);

  const toggleLike = useMutation(api.shortVideos.toggleLike);
  const { isAuthenticated } = useConvexAuth();

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (active && !paused) {
      el.play().catch(() => null);
    } else {
      el.pause();
      if (!active) el.currentTime = 0;
    }
  }, [active, paused]);

  useEffect(() => {
    const el = videoRef.current;
    if (el) el.playbackRate = speed;
  }, [speed]);

  const handleLike = async () => {
    if (!isAuthenticated) { toast("Connectez-vous pour liker"); return; }
    if ((video._id as string).startsWith("demo")) {
      setLiked((p) => !p);
      setLikeCount((p) => p + (liked ? -1 : 1));
      if (!liked) { setShowHeart(true); setTimeout(() => setShowHeart(false), 700); }
      return;
    }
    try {
      const now = await toggleLike({ videoId: video._id });
      setLiked(now);
      setLikeCount((p) => p + (now ? 1 : -1));
      if (now) { setShowHeart(true); setTimeout(() => setShowHeart(false), 700); }
    } catch { toast.error("Erreur"); }
  };

  const handleShare = () => {
    if (navigator.share) {
      Share.share({ message: String(video.caption), title: video.caption }).catch(() => null);
    } else {
      void Clipboard.setString(video.caption);
      toast("Copié !", { icon: "🔗" });
    }
  };

  const handleTap = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) { el.play().catch(() => null); setPaused(false); }
    else { el.pause(); setPaused(true); }
  };

  const handleDoubleTap = (e: GestureResponderEvent) => {
    e.preventDefault();
    if (!liked) void handleLike();
  };

  // Touch swipe detection
  const handleTouchStart = (e: GestureResponderEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: GestureResponderEvent) => {
    if (touchStartY.current === null) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 60) {
      if (diff > 0) onSwipeUp?.();
      else onSwipeDown?.();
    }
    touchStartY.current = null;
  };

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <View className="relative w-full h-full flex-shrink-0 bg-black overflow-hidden" style={{ scrollSnapAlign: "start" }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>{}<video ref={videoRef} src={video.videoUrl} className="absolute inset-0 w-full h-full object-cover" loop muted={muted} playsInline poster={video.thumbnailUrl} onPress={handleTap} onDoublePress={handleDoubleTap} />{}<View className="absolute inset-0 pointer-events-none" style={{  }} />{}<View>{showHeart && (
          <View key="heart" initial={{ scale: 0, opacity: 1 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 0.6, ease: "easeOut" as const }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart size={80} className="text-red-400" fill="currentColor" />
          </View>
        )}</View>{}<View>{paused && (
          <View key="play" initial={{ scale: 0.5, opacity: 0.9 }} animate={{ scale: 1, opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <View className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}><Play size={36} className="text-white ml-1" fill="currentColor" /></View>
          </View>
        )}</View>{}<View className="absolute top-5 right-4 flex flex-col gap-2 z-20">{}<Pressable onPress={(e) => { setMuted((m) => !m); }} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>{muted ? <VolumeX size={15} className="text-white" /> : <Volume2 size={15} className="text-white" />}</Pressable>{}<Pressable onPress={(e) => { setShowSpeed((s) => !s); }} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: speed !== 1 ? "rgba(139,92,246,0.6)" : "rgba(0,0,0,0.55)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><Gauge size={15} className="text-white" /></Pressable></View>{}<View>{showSpeed && (
          <SpeedPicker speed={speed} onChange={setSpeed} onClose={() => setShowSpeed(false)} />
        )}</View>{}<View className="absolute right-3 bottom-16 flex flex-col items-center gap-5 z-10">{}<Pressable onPress={(e) => { void handleLike(); }} className="flex flex-col items-center gap-1 active:scale-90 transition-transform"><View animate={liked ? { scale: [1, 1.5, 1] } : {}} transition={{ duration: 0.3 }}><Heart size={30} className={liked ? "text-red-400" : "text-white"} fill={liked ? "currentColor" : "none"} style={{  }} /></View><Text className="text-white text-xs font-black" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>{fmt(likeCount)}</Text></Pressable>{}<Pressable onPress={(e) => { setShowComments(true); setCommentCount((c) => c); }} className="flex flex-col items-center gap-1 active:scale-90 transition-transform"><MessageCircle size={28} className="text-white" /><Text className="text-white text-xs font-black" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>{fmt(commentCount)}</Text></Pressable>{}<Pressable onPress={(e) => { handleShare(); }} className="flex flex-col items-center gap-1 active:scale-90 transition-transform"><Share2 size={26} className="text-white" /><Text className="text-white text-xs font-black" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>{fmt(video.shareCount)}</Text></Pressable>{}<Pressable onPress={(e) => { setSaved((s) => !s); toast(saved ? "Retiré" : "Sauvegardé !", { icon: "🔖" }); }} className="flex flex-col items-center gap-1 active:scale-90 transition-transform"><Bookmark size={26} className={saved ? "text-yellow-400" : "text-white"} fill={saved ? "currentColor" : "none"} /></Pressable></View>{}<View className="absolute bottom-2 left-4 right-16 z-10 pb-2">{}<View className="flex items-center gap-2.5 mb-2"><Avatar name={video.authorName} avatar={video.authorAvatar} size={40} /><View className="flex-1 min-w-0"><Text className="text-white font-black text-sm leading-tight" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>{video.authorName ?? "Utilisateur"}</Text><Text className="text-white/60 text-xs">{(video.viewCount).toLocaleString()}vues</Text></View><FollowButton authorId={video.authorId} /></View>{}<Text className="text-white text-sm leading-snug mb-1.5" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>{video.caption}</Text>{video.hashtags.length > 0 && (
          <View className="flex gap-1.5 flex-wrap">{video.hashtags.slice(0, 4).map((tag) => (
              <Text key={tag} className="text-violet-300 text-xs font-bold" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>#{tag}</Text>
            ))}</View>
        )}</View>{}<VideoProgress videoRef={videoRef} />{}<View>{showComments && !(video._id as string).startsWith("demo") && (
          <CommentsSheet videoId={video._id} onClose={() => setShowComments(false)} />
        )}{showComments && (video._id as string).startsWith("demo") && (
          <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={() => setShowComments(false)}>
            <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="w-full rounded-t-3xl p-6 text-center" style={{ backgroundColor: "#0f1729", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
              <MessageCircle size={32} className="text-indigo-400 mx-auto mb-3" />
              <Text className="text-white font-bold mb-1">Commentaires disponibles sur vos vidéos</Text>
              <Text className="text-white/40 text-sm mb-4">Publiez une vidéo pour activer les commentaires en temps réel</Text>
              <Pressable onPress={() => setShowComments(false)} className="px-6 py-2 rounded-2xl text-sm font-bold text-white" style={{  }}><Text>Fermer</Text></Pressable>
            </View>
          </View>
        )}</View></View>
  );
}

// ─── Upload Sheet ─────────────────────────────────────────────────────────────
function UploadSheet({ onClose }: { onClose: () => void }) {
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const createVideo = useMutation(api.shortVideos.create);

  const handleSubmit = async () => {
    if (!videoUrl.trim() || !caption.trim()) { toast.error("URL vidéo et légende requis"); return; }
    setLoading(true);
    try {
      const tags = hashtags.split(" ").map((t) => t.replace("#", "").trim()).filter(Boolean);
      await createVideo({ videoUrl, caption, hashtags: tags });
      toast.success("Vidéo publiée !");
      onClose();
    } catch { toast.error("Erreur lors de la publication"); }
    finally { setLoading(false); }
  };

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={(e) => e.target === e.currentTarget && onClose()}>
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
        <View className="flex items-center justify-between mb-6"><Text className="text-white font-bold text-lg flex items-center gap-2"><Upload size={18} className="text-indigo-400" />Publier une vidéo
          </Text><Pressable onPress={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}><X size={16} className="text-white" /></Pressable></View>
        <View className="space-y-4"><View><Text className="text-xs text-white/50 mb-1 block">URL de la vidéo *</Text><TextInput value={videoUrl} onChangeText={(value) => setVideoUrl(value)} placeholder="https://... (MP4, WebM)" className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} /></View><View><Text className="text-xs text-white/50 mb-1 block">Légende *</Text><TextInput value={caption} onChangeText={(value) => setCaption(value)} placeholder="Décrivez votre vidéo..." className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} multiline textAlignVertical="top" /></View><View><Text className="text-xs text-white/50 mb-1 block">Hashtags</Text><TextInput value={hashtags} onChangeText={(value) => setHashtags(value)} placeholder="#afrique #business #tech" className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} /></View><Pressable onPress={() => void handleSubmit()} disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-white transition-opacity disabled:opacity-50" style={{  }}>{loading ? "Publication..." : "Publier"}</Pressable></View>
      </View>
    </View>
  );
}

// ─── Trending panel ───────────────────────────────────────────────────────────
function TrendingPanel({ onClose }: { onClose: () => void }) {
  const TAGS = ["debrouillePro", "afriqueDigitale", "entrepreneur", "business", "afrique", "tech", "sante", "emploi", "agriculture", "communaute"];
  return (
    <View initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }} transition={{ type: "spring", damping: 26, stiffness: 280 }} className="absolute inset-0 z-40 flex flex-col overflow-hidden" style={{ backgroundColor: "rgba(2,6,23,0.97)" }}>
      <View className="flex items-center gap-3 px-5 pt-14 pb-4"><Pressable onPress={onClose} className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><X size={18} className="text-white" /></Pressable><Text className="text-white font-bold text-lg">Hashtags tendance</Text></View>
      <View className="flex-1 overflow-y-auto px-5 space-y-3 pb-8">{TAGS.map((tag, i) => (
          <View key={tag} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center justify-between p-3 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
            <View className="flex items-center gap-3"><View className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(99,102,241,0.2)" }}><Hash size={14} className="text-indigo-400" /></View><Text className="text-white font-semibold text-sm">#{tag}</Text></View>
            <TrendingUp size={14} className="text-white/30" />
          </View>
        ))}</View>
    </View>
  );
}

// ─── Main ReelsPage ───────────────────────────────────────────────────────────
export default function ReelsPage({ onBack }: { onBack: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const containerRef = useRef<View>(null);

  const { results, status, loadMore } = usePaginatedQuery(api.shortVideos.list, {}, { initialNumItems: 5 });
  const videos: VideoItem[] = results.length > 0 ? (results as VideoItem[]) : status !== "LoadingFirstPage" ? DEMO_VIDEOS : [];

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setCurrentIndex(idx);
    if (idx >= videos.length - 2 && status === "CanLoadMore") loadMore(5);
  }, [videos.length, status, loadMore]);

  const scrollTo = (idx: number) => {
    const el = containerRef.current;
    if (!el) return;
    el?.scrollTo(__debrouilleProNativeNormalizeScrollTo({ top: idx * el.clientHeight, behavior: "smooth" }));
  };

  if (status === "LoadingFirstPage") {
    return (
      <View className="h-full bg-black flex items-center justify-center"><View className="flex flex-col items-center gap-3"><View className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" /><Text className="text-white/50 text-sm">Chargement des Reels...</Text></View></View>
    );
  }

  return (
    <View className="relative h-full overflow-hidden bg-black">{}<View ref={containerRef} className="h-full overflow-y-scroll" style={{ scrollSnapType: "y mandatory" }} onScroll={handleScroll}>{videos.map((video, i) => (
          <View key={video._id} className="w-full h-full" style={{ scrollSnapAlign: "start" }}><Reel video={video} active={currentIndex === i} onSwipeUp={() => scrollTo(Math.min(i + 1, videos.length - 1))} onSwipeDown={() => scrollTo(Math.max(i - 1, 0))} /></View>
        ))}</View>{}<View className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 pb-4 z-10 pointer-events-none" style={{  }}><Pressable onPress={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center pointer-events-auto" style={{ backgroundColor: "rgba(0,0,0,0.4)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><ArrowLeft size={18} className="text-white" /></Pressable><View className="flex flex-col items-center"><Text className="text-white font-black text-lg tracking-wide" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>Reels</Text>{videos.length > 0 && (
            <Text className="text-white/50 text-xs">{currentIndex + 1}/ {videos.length}</Text>
          )}</View><Pressable onPress={() => setShowTrending(true)} className="w-10 h-10 rounded-2xl flex items-center justify-center pointer-events-auto" style={{ backgroundColor: "rgba(0,0,0,0.4)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><TrendingUp size={18} className="text-white" /></Pressable></View>{}{videos.length > 1 && (
        <View className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10 pointer-events-none">{currentIndex > 0 && (
            <View initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}>
              <ChevronUp size={18} className="text-white" />
            </View>
          )}<View className="flex flex-col gap-1">{videos.slice(0, 8).map((_, i) => (
              <View key={i} className="rounded-full transition-all duration-300" style={{ width: 3, height: i === currentIndex ? 18 : 5, backgroundColor: i === currentIndex ? "rgba(139,92,246,0.9)" : "rgba(255,255,255,0.25)" }} />
            ))}</View>{currentIndex < videos.length - 1 && (
            <View initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} className="animate-bounce">
              <ChevronDown size={18} className="text-white" />
            </View>
          )}</View>
      )}{}<Authenticated><Pressable initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: "spring", stiffness: 300 }} onPress={() => setShowUpload(true)} className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-white z-10" style={{ boxShadow: "0 4px 24px rgba(99,102,241,0.6)" }}><Plus size={16} />Publier un Reel
        </Pressable></Authenticated><Unauthenticated><View className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"><SignInButton /></View></Unauthenticated>{}<View>{showUpload && <UploadSheet onClose={() => setShowUpload(false)} />}</View>{}<View>{showTrending && <TrendingPanel onClose={() => setShowTrending(false)} />}</View></View>
  );
}

import { View, Text, Image, Pressable, TextInput, Share } from "react-native";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import {
  ArrowLeft, Radio, Users, Eye, Heart, MessageSquare,
  Share2, Mic, MicOff, Video, VideoOff, Gift, Star,
  TrendingUp, Clock, Play, Plus, X, Crown, Flame,
  Send, Zap, Rocket, Diamond, Settings2,
} from "lucide-react-native";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin.tsx";

/* __DEBROUILLEPRO_NATIVE_DOM_API_HELPERS_V8__ — scrollIntoView helper */
const __debrouilleProNativeScrollIntoView = async (ref: { current?: { measure?: (cb: (x: number, y: number, w: number, h: number, px: number, py: number) => void) => void } }): Promise<void> => {
  return new Promise((resolve) => {
    ref.current?.measure?.((_x, _y, _w, _h, _px, py) => {
      console.warn('__debrouilleProNativeScrollIntoView: implement scrollTo with pageY on your ScrollView ref');
      resolve();
    });
  });
};


// ── Types ─────────────────────────────────────────────────────────────────────
type GiftType = "star" | "crown" | "fire" | "diamond" | "rocket";

type FloatingReaction = {
  id: string;
  emoji: string;
  x: number;
  color: string;
};

// ── Gift Config ───────────────────────────────────────────────────────────────
const GIFTS: { type: GiftType; emoji: string; label: string; price: number; color: string }[] = [
  { type: "star",    emoji: "⭐", label: "Étoile",    price: 10,   color: "#F59E0B" },
  { type: "fire",    emoji: "🔥", label: "Feu",       price: 50,   color: "#EF4444" },
  { type: "crown",   emoji: "👑", label: "Couronne",  price: 100,  color: "#8B5CF6" },
  { type: "diamond", emoji: "💎", label: "Diamant",   price: 500,  color: "#06B6D4" },
  { type: "rocket",  emoji: "🚀", label: "Fusée",     price: 1000, color: "#10B981" },
];

const CATEGORIES = ["Tout", "Musique", "Cuisine", "Tech", "Sport", "Beauté", "Art", "Business", "Gaming"];

// ── Floating emoji reaction component ────────────────────────────────────────
function FloatingEmoji({ emoji, x, color, onDone }: { emoji: string; x: number; color: string; onDone: () => void }) {
  return (
    <View className="absolute bottom-24 pointer-events-none text-3xl z-40" style={{ left: `${x}%` }} initial={{ y: 0, opacity: 1, scale: 0.5 }} animate={{ y: -300, opacity: 0, scale: 1.5 }} transition={{ duration: 2, ease: "easeOut" }} onAnimationComplete={onDone}>
      <Text style={{  }}>{emoji}</Text>
    </View>
  );
}

// ── Chat Message Row ──────────────────────────────────────────────────────────
function ChatRow({ msg }: {
  msg: { _id: string; text: string; type: string; amount?: number | null; userName: string; userAvatar?: string }
}) {
  const isSuperChat = msg.type === "super_chat";
  const isSystem = msg.type === "system";

  if (isSystem) {
    return (
      <View initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 py-0.5">
        <Text className="text-white/30 text-xs italic">{msg.text}</Text>
      </View>
    );
  }

  if (isSuperChat) {
    return (
      <View initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 px-3 py-2 rounded-xl my-1" style={{ borderWidth: 1, borderColor: "rgba(139,92,246,0.4)", borderStyle: "solid" }}>
        <Text className="text-lg">{msg.text.split(" ")[3] ?? "🎁"}</Text>
        <View className="flex-1 min-w-0"><Text className="text-purple-300 text-xs font-bold truncate">{msg.userName}</Text><Text className="text-white text-xs truncate">{msg.text}</Text></View>
        {msg.amount && (
          <Text className="text-yellow-400 text-xs font-black flex-shrink-0">{msg.amount}pts</Text>
        )}
      </View>
    );
  }

  return (
    <View initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-1.5 py-0.5">
      <View className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: `hsl(${msg.userName.charCodeAt(0) * 13 % 360},60%,40%)` }}>{msg.userName[0]?.toUpperCase()}</View>
      <View className="flex-1 min-w-0"><Text className="text-white/60 text-xs font-bold mr-1" style={{ color: `hsl(${msg.userName.charCodeAt(0) * 13 % 360},70%,65%)` }}>{msg.userName}</Text><Text className="text-white/80 text-xs leading-snug">{msg.text}</Text></View>
    </View>
  );
}

// ── Watch View ────────────────────────────────────────────────────────────────
function WatchView({ streamId, onClose }: { streamId: Id<"liveStreams">; onClose: () => void }) {
  const stream = useQuery(api.liveStreams.getStream, { streamId });
  const messages = useQuery(api.liveStreams.getStreamMessages, { streamId });
  const { isAuthenticated } = useConvexAuth();

  const sendMsg = useMutation(api.liveStreams.sendMessage);
  const likeStream = useMutation(api.liveStreams.likeStream);
  const joinStream = useMutation(api.liveStreams.joinStream);
  const leaveStream = useMutation(api.liveStreams.leaveStream);
  const sendGift = useMutation(api.liveStreams.sendGift);

  const [chatText, setChatText] = useState("");
  const [liked, setLiked] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const chatEndRef = useRef<View>(null);

  // Join on mount, leave on unmount
  useEffect(() => {
    if (!isAuthenticated) return;
    joinStream({ streamId }).catch(() => null);
    return () => { leaveStream({ streamId }).catch(() => null); };
  }, [streamId, isAuthenticated, joinStream, leaveStream]);

  // Auto-scroll chat
  useEffect(() => {
    __debrouilleProNativeScrollIntoView(chatEndRef.current);
  }, [messages]);

  const addReaction = useCallback((emoji: string, color: string) => {
    const id = Math.random().toString(36).slice(2);
    setReactions((p) => [...p, { id, emoji, x: 15 + Math.random() * 70, color }]);
    setTimeout(() => setReactions((p) => p.filter((r) => r.id !== id)), 2200);
  }, []);

  const handleLike = async () => {
    if (!isAuthenticated) { toast("Connectez-vous pour réagir"); return; }
    setLiked(true);
    addReaction("❤️", "#EF4444");
    try { await likeStream({ streamId }); } catch { /* ignore */ }
  };

  const handleSendMsg = async () => {
    if (!chatText.trim()) return;
    if (!isAuthenticated) { toast("Connectez-vous pour chatter"); return; }
    try {
      await sendMsg({ streamId, text: chatText, type: "chat" });
      setChatText("");
    } catch { toast.error("Erreur envoi message"); }
  };

  const handleGift = async (gift: typeof GIFTS[0]) => {
    if (!isAuthenticated) { toast("Connectez-vous pour envoyer des cadeaux"); return; }
    try {
      await sendGift({ streamId, giftType: gift.type, amount: gift.price });
      addReaction(gift.emoji, gift.color);
      for (let i = 0; i < 3; i++) {
        setTimeout(() => addReaction(gift.emoji, gift.color), i * 200);
      }
      toast.success(`${gift.emoji} Cadeau envoyé !`);
      setShowGifts(false);
    } catch { toast.error("Erreur"); }
  };

  if (!stream) {
    return (
      <View className="h-full bg-black flex items-center justify-center"><Skeleton className="w-full h-full absolute inset-0" /></View>
    );
  }

  const DEMO_THUMB = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop";

  return (
    <View className="h-full flex flex-col bg-black relative overflow-hidden">{}<View className="relative flex-1 overflow-hidden"><Image className="w-full h-full object-cover" style={{ opacity: 0.75 }} source={{ uri: stream.thumbnailUrl ?? DEMO_THUMB }} accessibilityLabel={stream.title} />{}<View className="absolute inset-0 pointer-events-none" style={{  }} />{}<View className="absolute inset-0 overflow-hidden pointer-events-none">{reactions.map((r) => (
            <FloatingEmoji key={r.id} emoji={r.emoji} x={r.x} color={r.color} onDone={() => {}} />
          ))}</View>{}<View className="absolute top-0 left-0 right-0 flex items-center gap-3 p-4 z-10"><Pressable onPress={onClose} className="p-2 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}><ArrowLeft size={18} color="white" /></Pressable><View className="flex items-center gap-2 flex-1 min-w-0"><View className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-sm" style={{  }}>{stream.hostName[0]?.toUpperCase()}</View><View className="min-w-0"><Text className="text-white text-sm font-bold truncate">{stream.hostName}</Text><Text className="text-xs text-gray-300 truncate">{stream.category}</Text></View></View><View className="flex items-center gap-2"><View className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(239,68,68,0.85)" }}><Radio size={10} color="white" className="animate-pulse" /><Text className="text-white text-xs font-black">LIVE</Text></View><View className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}><Eye size={11} color="#9CA3AF" /><Text className="text-white text-xs">{stream.viewerCount.toLocaleString()}</Text></View></View></View>{}<View className="absolute bottom-3 left-4 right-4"><Text className="text-white font-bold text-sm mb-1">{stream.title}</Text><View className="flex items-center gap-2"><Heart size={12} color="#EF4444" fill="#EF4444" /><Text className="text-white/70 text-xs">{stream.likeCount.toLocaleString()}réactions</Text></View></View>{}<View className="absolute right-3 bottom-20 flex flex-col items-center gap-4 z-10"><Pressable onPress={() => void handleLike()} className="flex flex-col items-center gap-1 active:scale-90 transition-transform"><View animate={liked ? { scale: [1, 1.5, 1] } : {}} transition={{ duration: 0.3 }}><Heart size={28} color={liked ? "#EF4444" : "white"} fill={liked ? "#EF4444" : "none"} /></View><Text className="text-white text-xs">{stream.likeCount}</Text></Pressable><Pressable onPress={() => setShowGifts(true)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform"><Gift size={28} color="#F59E0B" /><Text className="text-white text-xs">Cadeau</Text></Pressable><Pressable onPress={() => {
            Share.share({ message: String(stream.title), title: stream.title }).catch(() => null);
            addReaction("🔗", "#6366F1");
          }} className="flex flex-col items-center gap-1 active:scale-90 transition-transform"><Share2 size={26} color="white" /><Text className="text-white text-xs">Partager</Text></Pressable></View></View>{}<View className="flex-shrink-0 flex flex-col" style={{ backgroundColor: "rgba(5,5,15,0.98)", maxHeight: 220 }}><View className="flex-1 overflow-y-auto px-4 pt-3 pb-1" style={{ maxHeight: 155 }}>{(messages ?? []).map((m) => (
            <ChatRow key={m._id} msg={m} />
          ))}<View ref={chatEndRef} /></View><View className="flex items-center gap-2 px-4 py-3">{isAuthenticated ? (
            <>
              <TextInput value={chatText} onChangeText={(value) => setChatText(value)} onKeyPress={(e) => e.nativeEvent.key === "Enter" && void handleSendMsg()} placeholder="Écrire un message..." className="flex-1 px-3 py-2 rounded-full text-sm text-white outline-none" style={{ backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderStyle: "solid" }} />
              <Pressable onPress={() => void handleSendMsg()} className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0" style={{  }}><Send size={14} color="white" /></Pressable>
            </>
          ) : (
            <View className="flex-1 flex items-center justify-center py-1"><SignInButton /></View>
          )}</View></View>{}<View>{showGifts && (
          <>
            <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={() => setShowGifts(false)} className="absolute inset-0 z-50" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} />
            <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
              <View className="flex items-center justify-between mb-5"><Text className="text-white font-black text-lg flex items-center gap-2"><Gift size={18} className="text-amber-400" />Envoyer un cadeau</Text><Pressable onPress={() => setShowGifts(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}><X size={16} className="text-white" /></Pressable></View>
              <View className="gap-3 mb-4">{GIFTS.map((g) => (
                  <Pressable key={g.type} onPress={() => void handleGift(g)} className="flex flex-col items-center gap-2 p-3 rounded-2xl active:scale-90 transition-transform" style={{ backgroundColor: `${g.color}18`, borderStyle: "solid" }}><Text className="text-2xl">{g.emoji}</Text><Text className="text-white text-[10px] font-bold">{g.label}</Text><Text className="text-xs font-black" style={{ color: g.color }}>{g.price}pts</Text></Pressable>
                ))}</View>
              <Text className="text-white/30 text-xs text-center">Les cadeaux soutiennent directement le créateur</Text>
            </View>
          </>
        )}</View></View>
  );
}

// ── Go Live Form ──────────────────────────────────────────────────────────────
function GoLiveForm({ onClose, onStarted }: { onClose: () => void; onStarted: (id: Id<"liveStreams">) => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Musique");
  const [isPublic, setIsPublic] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const startStream = useMutation(api.liveStreams.startStream);

  const handleStart = async () => {
    if (!title.trim()) { toast.error("Donnez un titre à votre live"); return; }
    setLoading(true);
    try {
      const id = await startStream({ title, category, tags: [], isPublic });
      toast.success("Live démarré !");
      onStarted(id);
    } catch (e) {
      toast.error("Erreur au démarrage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={onClose} className="absolute inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.8)" }} />
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
        <View className="flex items-center justify-between mb-5"><Text className="text-white font-black text-lg flex items-center gap-2"><Radio size={18} className="text-red-400" />Lancer un Live
          </Text><Pressable onPress={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}><X size={16} className="text-white" /></Pressable></View>

        {/* Camera preview mock */}
        <View className="w-full h-36 rounded-2xl mb-5 flex items-center justify-center relative overflow-hidden" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>{camOn ? (
            <View className="flex flex-col items-center gap-2"><View className="w-16 h-16 rounded-full flex items-center justify-center" style={{  }}><Video size={28} className="text-white" /></View><Text className="text-white/50 text-xs">Aperçu caméra</Text></View>
          ) : (
            <VideoOff size={36} className="text-white/30" />
          )}<View className="absolute top-3 right-3 flex gap-2"><Pressable onPress={() => setMicOn(!micOn)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: micOn ? "rgba(99,102,241,0.4)" : "rgba(239,68,68,0.4)" }}>{micOn ? <Mic size={14} className="text-white" /> : <MicOff size={14} className="text-white" />}</Pressable><Pressable onPress={() => setCamOn(!camOn)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: camOn ? "rgba(99,102,241,0.4)" : "rgba(239,68,68,0.4)" }}>{camOn ? <Video size={14} className="text-white" /> : <VideoOff size={14} className="text-white" />}</Pressable></View></View>

        <View className="space-y-3 mb-5"><TextInput value={title} onChangeText={(value) => setTitle(value)} placeholder="Titre de votre live..." className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }} /><View className="flex gap-2 overflow-x-auto pb-1" style={{  }}>{CATEGORIES.filter(c => c !== "Tout").map((cat) => (
              <Pressable key={cat} onPress={() => setCategory(cat)} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all" style={category === cat ? {  } : { backgroundColor: "rgba(255,255,255,0.08)" }}>{cat}</Pressable>
            ))}</View><View className="flex items-center justify-between px-1"><Text className="text-white/60 text-sm">Live public</Text><View onPress={() => setIsPublic(!isPublic)} className="w-12 h-6 rounded-full flex items-center px-1 transition-all" style={{  }}><View animate={{ x: isPublic ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="w-4 h-4 rounded-full bg-white" /></View></View></View>

        <Pressable onPress={() => void handleStart()} disabled={loading} className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ boxShadow: "0 8px 30px rgba(239,68,68,0.4)" }}><Radio size={18} className="animate-pulse" />{loading ? "Démarrage..." : "Go Live !"}</Pressable>
      </View>
    </>
  );
}

// ── Stream Card ───────────────────────────────────────────────────────────────
function StreamCard({ stream, onWatch }: {
  stream: { _id: string; title: string; hostName: string; category: string; viewerCount: number; likeCount: number; thumbnailUrl?: string; status: string; startedAt?: string };
  onWatch: () => void;
}) {
  const DEMO_THUMB = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop";

  return (
    <View initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onPress={onWatch} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
      <View className="relative"><Image className="w-full h-44 object-cover" source={{ uri: stream.thumbnailUrl ?? DEMO_THUMB }} accessibilityLabel={stream.title} /><View className="absolute inset-0" style={{  }} /><View className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(239,68,68,0.9)" }}><Radio size={10} color="white" className="animate-pulse" /><Text className="text-white text-xs font-black">LIVE</Text></View><View className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}><Eye size={10} color="white" /><Text className="text-white text-xs">{stream.viewerCount.toLocaleString()}</Text></View><View className="absolute bottom-3 left-0 right-0 flex items-center justify-center"><View className="px-4 py-2 rounded-full flex items-center gap-2" style={{ backgroundColor: "rgba(99,102,241,0.9)" }}><Play size={14} color="white" fill="white" /><Text className="text-white text-sm font-bold">Rejoindre</Text></View></View></View>
      <View className="flex items-center gap-3 p-3"><View className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-sm border-2" style={{ borderColor: "#EF4444" }}>{stream.hostName[0]?.toUpperCase()}</View><View className="flex-1 min-w-0"><Text className="text-white font-semibold text-sm truncate">{stream.title}</Text><View className="flex items-center gap-2"><Text className="text-gray-400 text-xs">{stream.hostName}</Text><Text className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(99,102,241,0.15)", color: "#A5B4FC" }}>{stream.category}</Text></View></View><View className="flex items-center gap-1 text-xs text-pink-400"><Heart size={11} fill="#F472B6" /><Text>{stream.likeCount}</Text></View></View>
    </View>
  );
}

// ── My Live Banner (when hosting) ─────────────────────────────────────────────
function MyLiveBanner({ streamId, onEnterOwn, onEnd }: {
  streamId: Id<"liveStreams">;
  onEnterOwn: () => void;
  onEnd: () => void;
}) {
  const stream = useQuery(api.liveStreams.getStream, { streamId });
  const endStream = useMutation(api.liveStreams.endStream);

  if (!stream) return null;

  return (
    <View initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mx-4 mb-4 p-4 rounded-2xl flex items-center gap-3" style={{ backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "rgba(239,68,68,0.35)", borderStyle: "solid" }}>
      <View className="w-3 h-3 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
      <View className="flex-1 min-w-0"><Text className="text-white font-bold text-sm truncate">{stream.title}</Text><Text className="text-red-400 text-xs">{stream.viewerCount}spectateurs · EN DIRECT</Text></View>
      <Pressable onPress={onEnterOwn} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: "rgba(99,102,241,0.3)" }}><Text>Gérer</Text></Pressable>
      <Pressable onPress={async () => { await endStream({ streamId }); onEnd(); }} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: "rgba(239,68,68,0.3)" }}><Text>Terminer</Text></Pressable>
    </View>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LiveStreamingPage({ onBack }: { onBack: () => void }) {
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [watchingId, setWatchingId] = useState<Id<"liveStreams"> | null>(null);
  const [showGoLive, setShowGoLive] = useState(false);

  const { isAuthenticated } = useConvexAuth();
  const liveStreams = useQuery(api.liveStreams.listLiveStreams, { status: "live" });
  const myActiveStream = useQuery(api.liveStreams.getMyActiveStream, isAuthenticated ? {} : "skip");

  const filtered = (liveStreams ?? []).filter(s =>
    activeCategory === "Tout" || s.category === activeCategory
  );

  // If watching a stream
  if (watchingId) {
    return <WatchView streamId={watchingId} onClose={() => setWatchingId(null)} />;
  }

  return (
    <View className="h-full flex flex-col overflow-hidden relative" style={{  }}>{}<View className="flex-shrink-0 flex items-center gap-3 px-4 pt-12 pb-4"><Pressable onPress={onBack} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} color="white" /></Pressable><View className="flex-1"><Text className="text-white font-black text-lg">Live Streaming</Text><Text className="text-gray-400 text-xs">{liveStreams === undefined ? "Chargement..." : `${liveStreams.length} stream${liveStreams.length !== 1 ? "s" : ""} en direct`}</Text></View><Authenticated><Pressable onPress={() => setShowGoLive(true)} className="flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm" style={{ boxShadow: "0 4px 20px rgba(239,68,68,0.4)" }}><Radio size={14} color="white" className="animate-pulse" /><Text className="text-white">Go Live</Text></Pressable></Authenticated><Unauthenticated><SignInButton /></Unauthenticated></View>{}{myActiveStream && (
        <MyLiveBanner
          streamId={myActiveStream._id}
          onEnterOwn={() => setWatchingId(myActiveStream._id)}
          onEnd={() => {}}
        />
      )}{}<View className="flex gap-3 px-4 mb-4">{[
          { icon: Users, label: "En direct", value: liveStreams?.reduce((s, l) => s + l.viewerCount, 0).toLocaleString() ?? "—", color: "#6366F1" },
          { icon: Radio, label: "Créateurs", value: liveStreams?.length.toString() ?? "—", color: "#EF4444" },
          { icon: TrendingUp, label: "Ce soir", value: "+23%", color: "#10B981" },
        ].map(({ icon: Icon, label, value, color }) => (
          <View key={label} className="flex-1 p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Icon size={16} color={color} className="mx-auto mb-1" /><Text className="text-white font-bold text-sm">{value}</Text><Text className="text-gray-500 text-xs">{label}</Text></View>
        ))}</View>{}<View className="flex gap-2 px-4 mb-4 overflow-x-auto" style={{  }}>{CATEGORIES.map((cat) => (
          <Pressable key={cat} onPress={() => setActiveCategory(cat)} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex-shrink-0" style={activeCategory === cat ? {  } : { backgroundColor: "rgba(255,255,255,0.06)" }}>{cat}</Pressable>
        ))}</View>{}<View className="flex-1 overflow-y-auto px-4 pb-6 space-y-4" style={{  }}>{liveStreams === undefined ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-60 w-full rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <View className="flex flex-col items-center py-12 gap-4"><View className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.12)" }}><Radio size={32} className="text-red-400" /></View><Text className="text-white/50 text-sm">Aucun live en cours</Text><Text className="text-white/25 text-xs text-center">Soyez le premier à lancer un live !</Text><Authenticated><Pressable onPress={() => setShowGoLive(true)} className="px-6 py-3 rounded-2xl font-black text-white" style={{  }}>Démarrer un Live
              </Pressable></Authenticated></View>
        ) : (
          filtered.map((stream, i) => (
            <View key={stream._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <StreamCard stream={stream} onWatch={() => setWatchingId(stream._id as Id<"liveStreams">)} />
            </View>
          ))
        )}{}<Authenticated>{!myActiveStream && (
            <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="p-5 rounded-2xl text-center" style={{ backgroundColor: "rgba(239,68,68,0.08)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", borderStyle: "dashed" }}>
              <Radio size={28} className="text-red-400 mx-auto mb-3" />
              <Text className="text-white font-black text-base">Lancez votre live</Text>
              <Text className="text-gray-400 text-xs mt-1 mb-4">Partagez votre passion en temps réel</Text>
              <Pressable onPress={() => setShowGoLive(true)} className="px-8 py-3 rounded-full text-sm font-black" style={{  }}>
                Go Live !
              </Pressable>
            </View>
          )}</Authenticated></View>{}<View>{showGoLive && (
          <GoLiveForm
            onClose={() => setShowGoLive(false)}
            onStarted={(id) => { setShowGoLive(false); setWatchingId(id); }}
          />
        )}</View></View>
  );
}

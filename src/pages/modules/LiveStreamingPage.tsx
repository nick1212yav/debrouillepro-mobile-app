// src/pages/modules/LiveStreamingPage.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Eye,
  Gift,
  Heart,
  MessageSquare,
  Mic,
  MicOff,
  Play,
  Radio,
  Send,
  Share2,
  TrendingUp,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react-native";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Authenticated,
  Unauthenticated,
  useConvexAuth,
} from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin";

type GiftType = "star" | "crown" | "fire" | "diamond" | "rocket";

type FloatingReaction = {
  id: string;
  emoji: string;
  x: number;
};

type StreamMessage = {
  _id: string;
  text: string;
  type: string;
  amount?: number | null;
  userName: string;
  userAvatar?: string;
};

const GIFTS: {
  type: GiftType;
  emoji: string;
  label: string;
  price: number;
  color: string;
}[] = [
  {
    type: "star",
    emoji: "⭐",
    label: "Étoile",
    price: 10,
    color: "#F59E0B",
  },
  {
    type: "fire",
    emoji: "🔥",
    label: "Feu",
    price: 50,
    color: "#EF4444",
  },
  {
    type: "crown",
    emoji: "👑",
    label: "Couronne",
    price: 100,
    color: "#8B5CF6",
  },
  {
    type: "diamond",
    emoji: "💎",
    label: "Diamant",
    price: 500,
    color: "#06B6D4",
  },
  {
    type: "rocket",
    emoji: "🚀",
    label: "Fusée",
    price: 1000,
    color: "#10B981",
  },
];

const CATEGORIES = [
  "Tout",
  "Musique",
  "Cuisine",
  "Tech",
  "Sport",
  "Beauté",
  "Art",
  "Business",
  "Gaming",
];

const DEMO_THUMBNAIL =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop";

function formatNumber(value: number | undefined | null): string {
  if (typeof value !== "number") {
    return "0";
  }

  return value.toLocaleString();
}

function getAvatarColor(name: string): string {
  const code = name.charCodeAt(0) || 0;

  return `hsl(${(code * 13) % 360}, 60%, 40%)`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating reactions
// ─────────────────────────────────────────────────────────────────────────────

function FloatingReactionItem({ reaction }: { reaction: FloatingReaction }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.floatingReaction,
        {
          left: `${reaction.x}%`,
        },
      ]}
    >
      <Text style={styles.floatingReactionEmoji}>{reaction.emoji}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat row
// ─────────────────────────────────────────────────────────────────────────────

function ChatRow({ msg }: { msg: StreamMessage }) {
  const isSuperChat = msg.type === "super_chat";
  const isSystem = msg.type === "system";

  if (isSystem) {
    return (
      <View style={styles.systemMessage}>
        <Text style={styles.systemMessageText}>{msg.text}</Text>
      </View>
    );
  }

  if (isSuperChat) {
    return (
      <View style={styles.superChat}>
        <Text style={styles.superChatEmoji}>🎁</Text>

        <View style={styles.superChatContent}>
          <Text numberOfLines={1} style={styles.superChatUser}>
            {msg.userName}
          </Text>

          <Text numberOfLines={2} style={styles.superChatText}>
            {msg.text}
          </Text>
        </View>

        {typeof msg.amount === "number" && (
          <Text style={styles.superChatAmount}>{msg.amount} pts</Text>
        )}
      </View>
    );
  }

  const initial = msg.userName?.[0]?.toUpperCase() ?? "?";

  return (
    <View style={styles.chatRow}>
      <View
        style={[
          styles.chatAvatar,
          {
            backgroundColor: getAvatarColor(msg.userName),
          },
        ]}
      >
        <Text style={styles.chatAvatarText}>{initial}</Text>
      </View>

      <View style={styles.chatContent}>
        <Text style={styles.chatMessage}>
          <Text
            style={[
              styles.chatUserName,
              {
                color: getAvatarColor(msg.userName),
              },
            ]}
          >
            {msg.userName}{" "}
          </Text>

          <Text style={styles.chatMessageText}>{msg.text}</Text>
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Watch View
// ─────────────────────────────────────────────────────────────────────────────

function WatchView({
  streamId,
  onClose,
}: {
  streamId: Id<"liveStreams">;
  onClose: () => void;
}) {
  const stream = useQuery(api.liveStreams.getStream, {
    streamId,
  });

  const messages = useQuery(api.liveStreams.getStreamMessages, {
    streamId,
  });

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

  const chatListRef = useRef<FlatList<StreamMessage>>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void joinStream({
      streamId,
    }).catch(() => undefined);

    return () => {
      void leaveStream({
        streamId,
      }).catch(() => undefined);
    };
  }, [isAuthenticated, joinStream, leaveStream, streamId]);

  useEffect(() => {
    if ((messages?.length ?? 0) === 0) {
      return;
    }

    requestAnimationFrame(() => {
      chatListRef.current?.scrollToEnd({
        animated: true,
      });
    });
  }, [messages]);

  const addReaction = useCallback((emoji: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setReactions((previous) => [
      ...previous,
      {
        id,
        emoji,
        x: 15 + Math.random() * 65,
      },
    ]);

    setTimeout(() => {
      setReactions((previous) =>
        previous.filter((reaction) => reaction.id !== id),
      );
    }, 2200);
  }, []);

  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      Alert.alert("Connexion requise", "Connectez-vous pour réagir au live.");

      return;
    }

    setLiked(true);
    addReaction("❤️");

    try {
      await likeStream({
        streamId,
      });
    } catch {
      // La réaction visuelle reste volontairement locale.
    }
  }, [addReaction, isAuthenticated, likeStream, streamId]);

  const handleSendMessage = useCallback(async () => {
    const text = chatText.trim();

    if (!text) {
      return;
    }

    if (!isAuthenticated) {
      Alert.alert(
        "Connexion requise",
        "Connectez-vous pour participer au chat.",
      );

      return;
    }

    try {
      await sendMsg({
        streamId,
        text,
        type: "chat",
      });

      setChatText("");
    } catch {
      Alert.alert("Erreur", "Impossible d'envoyer le message.");
    }
  }, [chatText, isAuthenticated, sendMsg, streamId]);

  const handleGift = useCallback(
    async (gift: (typeof GIFTS)[number]) => {
      if (!isAuthenticated) {
        Alert.alert(
          "Connexion requise",
          "Connectez-vous pour envoyer un cadeau.",
        );

        return;
      }

      try {
        await sendGift({
          streamId,
          giftType: gift.type,
          amount: gift.price,
        });

        addReaction(gift.emoji);

        setTimeout(() => addReaction(gift.emoji), 200);

        setTimeout(() => addReaction(gift.emoji), 400);

        setShowGifts(false);

        Alert.alert("Cadeau envoyé", `${gift.emoji} ${gift.label} envoyé !`);
      } catch {
        Alert.alert("Erreur", "Impossible d'envoyer le cadeau.");
      }
    },
    [addReaction, isAuthenticated, sendGift, streamId],
  );

  const handleShare = useCallback(async () => {
    if (!stream) {
      return;
    }

    try {
      await Share.share({
        title: stream.title,
        message: stream.title,
      });

      addReaction("🔗");
    } catch {
      // L'utilisateur peut annuler le partage.
    }
  }, [addReaction, stream]);

  if (!stream) {
    return (
      <View style={styles.watchLoading}>
        <Radio size={32} color="#6366F1" />

        <Text style={styles.watchLoadingText}>Chargement du live...</Text>
      </View>
    );
  }

  const streamMessages = (messages ?? []) as StreamMessage[];

  return (
    <View style={styles.watchContainer}>
      <View style={styles.videoArea}>
        <Image
          source={{
            uri: stream.thumbnailUrl ?? DEMO_THUMBNAIL,
          }}
          style={styles.videoImage}
          resizeMode="cover"
        />

        <View style={styles.videoOverlay} />

        <View pointerEvents="none" style={styles.reactionsLayer}>
          {reactions.map((reaction) => (
            <FloatingReactionItem key={reaction.id} reaction={reaction} />
          ))}
        </View>

        <View style={styles.watchTopBar}>
          <Pressable onPress={onClose} style={styles.roundDarkButton}>
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.hostInfo}>
            <View style={styles.hostAvatar}>
              <Text style={styles.hostAvatarText}>
                {stream.hostName?.[0]?.toUpperCase() ?? "L"}
              </Text>
            </View>

            <View style={styles.hostText}>
              <Text numberOfLines={1} style={styles.hostName}>
                {stream.hostName}
              </Text>

              <Text numberOfLines={1} style={styles.hostCategory}>
                {stream.category}
              </Text>
            </View>
          </View>

          <View style={styles.liveInfo}>
            <View style={styles.liveBadge}>
              <Radio size={10} color="#FFFFFF" />

              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>

            <View style={styles.viewerBadge}>
              <Eye size={11} color="#9CA3AF" />

              <Text style={styles.viewerBadgeText}>
                {formatNumber(stream.viewerCount)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.videoBottomInfo}>
          <Text numberOfLines={2} style={styles.streamTitle}>
            {stream.title}
          </Text>

          <View style={styles.likesInfo}>
            <Heart size={13} color="#EF4444" fill="#EF4444" />

            <Text style={styles.likesText}>
              {formatNumber(stream.likeCount)} réactions
            </Text>
          </View>
        </View>

        <View style={styles.watchActions}>
          <Pressable
            onPress={() => void handleLike()}
            style={styles.watchAction}
          >
            <Heart
              size={28}
              color={liked ? "#EF4444" : "#FFFFFF"}
              fill={liked ? "#EF4444" : "transparent"}
            />

            <Text style={styles.watchActionText}>
              {formatNumber(stream.likeCount)}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowGifts(true)}
            style={styles.watchAction}
          >
            <Gift size={28} color="#F59E0B" />

            <Text style={styles.watchActionText}>Cadeau</Text>
          </Pressable>

          <Pressable
            onPress={() => void handleShare()}
            style={styles.watchAction}
          >
            <Share2 size={26} color="#FFFFFF" />

            <Text style={styles.watchActionText}>Partager</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.chatSection}>
        <FlatList
          ref={chatListRef}
          data={streamMessages}
          keyExtractor={(item) => String(item._id)}
          renderItem={({ item }) => <ChatRow msg={item} />}
          style={styles.chatList}
          contentContainerStyle={styles.chatListContent}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.chatInputRow}>
          {isAuthenticated ? (
            <>
              <TextInput
                value={chatText}
                onChangeText={setChatText}
                onSubmitEditing={() => void handleSendMessage()}
                placeholder="Écrire un message..."
                placeholderTextColor="#6B7280"
                style={styles.chatInput}
                returnKeyType="send"
              />

              <Pressable
                onPress={() => void handleSendMessage()}
                style={styles.sendButton}
              >
                <Send size={16} color="#FFFFFF" />
              </Pressable>
            </>
          ) : (
            <View style={styles.signInContainer}>
              <SignInButton />
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={showGifts}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGifts(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            onPress={() => setShowGifts(false)}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.giftSheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <Gift size={19} color="#F59E0B" />

                <Text style={styles.sheetTitle}>Envoyer un cadeau</Text>
              </View>

              <Pressable
                onPress={() => setShowGifts(false)}
                style={styles.sheetClose}
              >
                <X size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={styles.giftsGrid}>
              {GIFTS.map((gift) => (
                <Pressable
                  key={gift.type}
                  onPress={() => void handleGift(gift)}
                  style={[
                    styles.giftCard,
                    {
                      borderColor: `${gift.color}66`,
                      backgroundColor: `${gift.color}18`,
                    },
                  ]}
                >
                  <Text style={styles.giftEmoji}>{gift.emoji}</Text>

                  <Text style={styles.giftLabel}>{gift.label}</Text>

                  <Text
                    style={[
                      styles.giftPrice,
                      {
                        color: gift.color,
                      },
                    ]}
                  >
                    {gift.price} pts
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.giftFooter}>
              Les cadeaux soutiennent directement le créateur
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Go Live Form
// ─────────────────────────────────────────────────────────────────────────────

function GoLiveForm({
  onClose,
  onStarted,
}: {
  onClose: () => void;
  onStarted: (id: Id<"liveStreams">) => void;
}) {
  const [title, setTitle] = useState("");

  const [category, setCategory] = useState("Musique");

  const [isPublic, setIsPublic] = useState(true);

  const [micOn, setMicOn] = useState(true);

  const [camOn, setCamOn] = useState(true);

  const [loading, setLoading] = useState(false);

  const startStream = useMutation(api.liveStreams.startStream);

  const handleStart = useCallback(async () => {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      Alert.alert("Titre requis", "Donnez un titre à votre live.");

      return;
    }

    setLoading(true);

    try {
      const id = await startStream({
        title: cleanTitle,
        category,
        tags: [],
        isPublic,
      });

      Alert.alert("Live démarré", "Votre diffusion est maintenant en direct.");

      onStarted(id);
    } catch {
      Alert.alert("Erreur", "Impossible de démarrer le live.");
    } finally {
      setLoading(false);
    }
  }, [category, isPublic, onStarted, startStream, title]);

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />

        <View style={styles.goLiveSheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <Radio size={19} color="#F87171" />

              <Text style={styles.sheetTitle}>Lancer un Live</Text>
            </View>

            <Pressable onPress={onClose} style={styles.sheetClose}>
              <X size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <View
            style={[styles.cameraPreview, !camOn && styles.cameraPreviewOff]}
          >
            {camOn ? (
              <>
                <View style={styles.cameraPreviewIcon}>
                  <Video size={30} color="#FFFFFF" />
                </View>

                <Text style={styles.cameraPreviewText}>Aperçu caméra</Text>
              </>
            ) : (
              <VideoOff size={38} color="#6B7280" />
            )}

            <View style={styles.cameraControls}>
              <Pressable
                onPress={() => setMicOn((value) => !value)}
                style={[
                  styles.cameraControlButton,
                  {
                    backgroundColor: micOn
                      ? "rgba(99,102,241,0.55)"
                      : "rgba(239,68,68,0.55)",
                  },
                ]}
              >
                {micOn ? (
                  <Mic size={16} color="#FFFFFF" />
                ) : (
                  <MicOff size={16} color="#FFFFFF" />
                )}
              </Pressable>

              <Pressable
                onPress={() => setCamOn((value) => !value)}
                style={[
                  styles.cameraControlButton,
                  {
                    backgroundColor: camOn
                      ? "rgba(99,102,241,0.55)"
                      : "rgba(239,68,68,0.55)",
                  },
                ]}
              >
                {camOn ? (
                  <Video size={16} color="#FFFFFF" />
                ) : (
                  <VideoOff size={16} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          </View>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Titre de votre live..."
            placeholderTextColor="#64748B"
            style={styles.liveTitleInput}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.filter((item) => item !== "Tout").map((item) => {
              const selected = category === item;

              return (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[
                    styles.categoryChip,
                    selected && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selected && styles.categoryChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={() => setIsPublic((value) => !value)}
            style={styles.publicToggleRow}
          >
            <Text style={styles.publicToggleLabel}>Live public</Text>

            <View
              style={[styles.toggleTrack, isPublic && styles.toggleTrackActive]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  isPublic && styles.toggleThumbActive,
                ]}
              />
            </View>
          </Pressable>

          <Pressable
            disabled={loading}
            onPress={() => void handleStart()}
            style={[styles.goLiveButton, loading && styles.disabledButton]}
          >
            <Radio size={19} color="#FFFFFF" />

            <Text style={styles.goLiveButtonText}>
              {loading ? "Démarrage..." : "Go Live !"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stream Card
// ─────────────────────────────────────────────────────────────────────────────

function StreamCard({
  stream,
  onWatch,
}: {
  stream: {
    _id: string;
    title: string;
    hostName: string;
    category: string;
    viewerCount: number;
    likeCount: number;
    thumbnailUrl?: string;
    status: string;
    startedAt?: string;
  };
  onWatch: () => void;
}) {
  return (
    <Pressable onPress={onWatch} style={styles.streamCard}>
      <View style={styles.streamImageWrapper}>
        <Image
          source={{
            uri: stream.thumbnailUrl ?? DEMO_THUMBNAIL,
          }}
          style={styles.streamImage}
          resizeMode="cover"
        />

        <View style={styles.streamImageOverlay} />

        <View style={styles.streamLiveBadge}>
          <Radio size={10} color="#FFFFFF" />

          <Text style={styles.streamLiveBadgeText}>LIVE</Text>
        </View>

        <View style={styles.streamViewerBadge}>
          <Eye size={11} color="#FFFFFF" />

          <Text style={styles.streamViewerText}>
            {formatNumber(stream.viewerCount)}
          </Text>
        </View>

        <View style={styles.joinLiveButton}>
          <Play size={14} color="#FFFFFF" fill="#FFFFFF" />

          <Text style={styles.joinLiveButtonText}>Rejoindre</Text>
        </View>
      </View>

      <View style={styles.streamCardInfo}>
        <View style={styles.streamHostAvatar}>
          <Text style={styles.streamHostAvatarText}>
            {stream.hostName?.[0]?.toUpperCase() ?? "L"}
          </Text>
        </View>

        <View style={styles.streamCardTextContent}>
          <Text numberOfLines={1} style={styles.streamCardTitle}>
            {stream.title}
          </Text>

          <View style={styles.streamCardMeta}>
            <Text numberOfLines={1} style={styles.streamHostName}>
              {stream.hostName}
            </Text>

            <View style={styles.streamCategoryBadge}>
              <Text style={styles.streamCategoryText}>{stream.category}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardLikes}>
          <Heart size={12} color="#F472B6" fill="#F472B6" />

          <Text style={styles.cardLikesText}>
            {formatNumber(stream.likeCount)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// My Live Banner
// ─────────────────────────────────────────────────────────────────────────────

function MyLiveBanner({
  streamId,
  onEnterOwn,
  onEnd,
}: {
  streamId: Id<"liveStreams">;
  onEnterOwn: () => void;
  onEnd: () => void;
}) {
  const stream = useQuery(api.liveStreams.getStream, {
    streamId,
  });

  const endStream = useMutation(api.liveStreams.endStream);

  const handleEnd = useCallback(async () => {
    try {
      await endStream({
        streamId,
      });

      onEnd();
    } catch {
      Alert.alert("Erreur", "Impossible de terminer le live.");
    }
  }, [endStream, onEnd, streamId]);

  if (!stream) {
    return null;
  }

  return (
    <View style={styles.myLiveBanner}>
      <View style={styles.liveDot} />

      <View style={styles.myLiveText}>
        <Text numberOfLines={1} style={styles.myLiveTitle}>
          {stream.title}
        </Text>

        <Text style={styles.myLiveSubtitle}>
          {formatNumber(stream.viewerCount)} spectateurs · EN DIRECT
        </Text>
      </View>

      <Pressable onPress={onEnterOwn} style={styles.manageButton}>
        <Text style={styles.manageButtonText}>Gérer</Text>
      </Pressable>

      <Pressable onPress={() => void handleEnd()} style={styles.endButton}>
        <Text style={styles.endButtonText}>Terminer</Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function LiveStreamingPage({ onBack }: { onBack: () => void }) {
  const [activeCategory, setActiveCategory] = useState("Tout");

  const [watchingId, setWatchingId] = useState<Id<"liveStreams"> | null>(null);

  const [showGoLive, setShowGoLive] = useState(false);

  const { isAuthenticated } = useConvexAuth();

  const liveStreams = useQuery(api.liveStreams.listLiveStreams, {
    status: "live",
  });

  const myActiveStream = useQuery(
    api.liveStreams.getMyActiveStream,
    isAuthenticated ? {} : "skip",
  );

  const filtered = (liveStreams ?? []).filter(
    (stream) => activeCategory === "Tout" || stream.category === activeCategory,
  );

  const totalViewers =
    liveStreams
      ?.reduce((total, stream) => total + (stream.viewerCount ?? 0), 0)
      .toLocaleString() ?? "—";

  if (watchingId) {
    return (
      <WatchView streamId={watchingId} onClose={() => setWatchingId(null)} />
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Live Streaming</Text>

          <Text style={styles.headerSubtitle}>
            {liveStreams === undefined
              ? "Chargement..."
              : `${liveStreams.length} stream${
                  liveStreams.length !== 1 ? "s" : ""
                } en direct`}
          </Text>
        </View>

        <Authenticated>
          <Pressable
            onPress={() => setShowGoLive(true)}
            style={styles.headerGoLive}
          >
            <Radio size={14} color="#FFFFFF" />

            <Text style={styles.headerGoLiveText}>Go Live</Text>
          </Pressable>
        </Authenticated>

        <Unauthenticated>
          <SignInButton />
        </Unauthenticated>
      </View>

      {myActiveStream && (
        <MyLiveBanner
          streamId={myActiveStream._id}
          onEnterOwn={() => setWatchingId(myActiveStream._id)}
          onEnd={() => {
            setWatchingId(null);
          }}
        />
      )}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Users size={17} color="#6366F1" />

          <Text style={styles.statValue}>{totalViewers}</Text>

          <Text style={styles.statLabel}>En direct</Text>
        </View>

        <View style={styles.statCard}>
          <Radio size={17} color="#EF4444" />

          <Text style={styles.statValue}>{liveStreams?.length ?? "—"}</Text>

          <Text style={styles.statLabel}>Créateurs</Text>
        </View>

        <View style={styles.statCard}>
          <TrendingUp size={17} color="#10B981" />

          <Text style={styles.statValue}>+23%</Text>

          <Text style={styles.statLabel}>Ce soir</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {CATEGORIES.map((category) => {
          const selected = activeCategory === category;

          return (
            <Pressable
              key={category}
              onPress={() => setActiveCategory(category)}
              style={[
                styles.mainCategoryChip,
                selected && styles.mainCategoryChipActive,
              ]}
            >
              <Text
                style={[
                  styles.mainCategoryText,
                  selected && styles.mainCategoryTextActive,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.streamListWrapper}>
        {liveStreams === undefined ? (
          <View style={styles.loadingState}>
            <Radio size={30} color="#6366F1" />

            <Text style={styles.loadingText}>Chargement des lives...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Radio size={34} color="#F87171" />
            </View>

            <Text style={styles.emptyTitle}>Aucun live en cours</Text>

            <Text style={styles.emptySubtitle}>
              Soyez le premier à lancer un live !
            </Text>

            <Authenticated>
              <Pressable
                onPress={() => setShowGoLive(true)}
                style={styles.emptyGoLive}
              >
                <Text style={styles.emptyGoLiveText}>Démarrer un Live</Text>
              </Pressable>
            </Authenticated>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item._id)}
            renderItem={({ item }) => (
              <StreamCard
                stream={{
                  ...item,
                  _id: String(item._id),
                }}
                onWatch={() => setWatchingId(item._id as Id<"liveStreams">)}
              />
            )}
            contentContainerStyle={styles.streamList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <Authenticated>
        {!myActiveStream && (
          <View style={styles.bottomCta}>
            <Radio size={28} color="#F87171" />

            <Text style={styles.bottomCtaTitle}>Lancez votre live</Text>

            <Text style={styles.bottomCtaSubtitle}>
              Partagez votre passion en temps réel
            </Text>

            <Pressable
              onPress={() => setShowGoLive(true)}
              style={styles.bottomCtaButton}
            >
              <Text style={styles.bottomCtaButtonText}>Go Live !</Text>
            </Pressable>
          </View>
        )}
      </Authenticated>

      <Modal
        visible={showGoLive}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoLive(false)}
      >
        <GoLiveForm
          onClose={() => setShowGoLive(false)}
          onStarted={(id) => {
            setShowGoLive(false);
            setWatchingId(id);
          }}
        />
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#050716",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 58 : 28,
    paddingBottom: 16,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },

  headerSubtitle: {
    marginTop: 2,
    color: "#9CA3AF",
    fontSize: 12,
  },

  headerGoLive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#DC2626",
  },

  headerGoLiveText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  statValue: {
    marginTop: 5,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  statLabel: {
    marginTop: 2,
    color: "#6B7280",
    fontSize: 10,
  },

  categoriesContainer: {
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },

  mainCategoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  mainCategoryChipActive: {
    backgroundColor: "#6366F1",
  },

  mainCategoryText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
  },

  mainCategoryTextActive: {
    color: "#FFFFFF",
  },

  streamListWrapper: {
    flex: 1,
  },

  streamList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 14,
  },

  streamCard: {
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  streamImageWrapper: {
    height: 190,
    position: "relative",
  },

  streamImage: {
    width: "100%",
    height: "100%",
  },

  streamImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  streamLiveBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#EF4444",
  },

  streamLiveBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  streamViewerBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  streamViewerText: {
    color: "#FFFFFF",
    fontSize: 11,
  },

  joinLiveButton: {
    position: "absolute",
    bottom: 14,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "rgba(99,102,241,0.95)",
  },

  joinLiveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  streamCardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 13,
  },

  streamHostAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
    borderWidth: 2,
    borderColor: "#EF4444",
  },

  streamHostAvatarText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  streamCardTextContent: {
    flex: 1,
  },

  streamCardTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  streamCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 4,
  },

  streamHostName: {
    maxWidth: 100,
    color: "#9CA3AF",
    fontSize: 11,
  },

  streamCategoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(99,102,241,0.16)",
  },

  streamCategoryText: {
    color: "#A5B4FC",
    fontSize: 10,
  },

  cardLikes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  cardLikesText: {
    color: "#F472B6",
    fontSize: 11,
  },

  myLiveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
  },

  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },

  myLiveText: {
    flex: 1,
  },

  myLiveTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  myLiveSubtitle: {
    marginTop: 2,
    color: "#F87171",
    fontSize: 10,
  },

  manageButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(99,102,241,0.28)",
  },

  manageButtonText: {
    color: "#A5B4FC",
    fontSize: 11,
    fontWeight: "700",
  },

  endButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.25)",
  },

  endButtonText: {
    color: "#FCA5A5",
    fontSize: 11,
    fontWeight: "700",
  },

  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingText: {
    color: "#9CA3AF",
    fontSize: 13,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
  },

  emptyTitle: {
    marginTop: 16,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  emptySubtitle: {
    marginTop: 7,
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
  },

  emptyGoLive: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: "#DC2626",
  },

  emptyGoLiveText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  bottomCta: {
    margin: 16,
    padding: 20,
    borderRadius: 18,
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },

  bottomCtaTitle: {
    marginTop: 8,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  bottomCtaSubtitle: {
    marginTop: 5,
    color: "#9CA3AF",
    fontSize: 11,
  },

  bottomCtaButton: {
    marginTop: 15,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#DC2626",
  },

  bottomCtaButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  watchContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },

  watchLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#000000",
  },

  watchLoadingText: {
    color: "#FFFFFF",
    fontSize: 13,
  },

  videoArea: {
    flex: 1,
    minHeight: 360,
    position: "relative",
  },

  videoImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },

  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  reactionsLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  floatingReaction: {
    position: "absolute",
    bottom: 85,
  },

  floatingReactionEmoji: {
    fontSize: 34,
  },

  watchTopBar: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  roundDarkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  hostInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  hostAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
  },

  hostAvatarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  hostText: {
    flex: 1,
  },

  hostName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  hostCategory: {
    marginTop: 2,
    color: "#D1D5DB",
    fontSize: 10,
  },

  liveInfo: {
    alignItems: "flex-end",
    gap: 6,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#EF4444",
  },

  liveBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  viewerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  viewerBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
  },

  videoBottomInfo: {
    position: "absolute",
    left: 16,
    right: 90,
    bottom: 16,
  },

  streamTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  likesInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
  },

  likesText: {
    color: "#D1D5DB",
    fontSize: 11,
  },

  watchActions: {
    position: "absolute",
    right: 14,
    bottom: 22,
    alignItems: "center",
    gap: 18,
  },

  watchAction: {
    alignItems: "center",
    gap: 4,
  },

  watchActionText: {
    color: "#FFFFFF",
    fontSize: 10,
  },

  chatSection: {
    height: 235,
    backgroundColor: "#080A12",
  },

  chatList: {
    flex: 1,
  },

  chatListContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },

  chatRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    paddingVertical: 3,
  },

  chatAvatar: {
    width: 21,
    height: 21,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  chatAvatarText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },

  chatContent: {
    flex: 1,
  },

  chatMessage: {
    fontSize: 12,
    lineHeight: 17,
  },

  chatUserName: {
    fontWeight: "800",
  },

  chatMessageText: {
    color: "#D1D5DB",
  },

  systemMessage: {
    paddingVertical: 4,
    alignItems: "center",
  },

  systemMessageText: {
    color: "#6B7280",
    fontSize: 11,
    fontStyle: "italic",
  },

  superChat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(99,102,241,0.22)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.4)",
  },

  superChatEmoji: {
    fontSize: 20,
  },

  superChatContent: {
    flex: 1,
  },

  superChatUser: {
    color: "#C4B5FD",
    fontSize: 11,
    fontWeight: "800",
  },

  superChatText: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 11,
  },

  superChatAmount: {
    color: "#FACC15",
    fontSize: 11,
    fontWeight: "900",
  },

  chatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },

  chatInput: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 15,
    borderRadius: 22,
    color: "#FFFFFF",
    fontSize: 13,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
  },

  signInContainer: {
    flex: 1,
    alignItems: "center",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.75)",
  },

  giftSheet: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#0B1020",
  },

  goLiveSheet: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#0B1020",
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  sheetTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  giftsGrid: {
    flexDirection: "row",
    gap: 8,
  },

  giftCard: {
    flex: 1,
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },

  giftEmoji: {
    fontSize: 25,
  },

  giftLabel: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
  },

  giftPrice: {
    fontSize: 9,
    fontWeight: "900",
  },

  giftFooter: {
    marginTop: 15,
    color: "#6B7280",
    fontSize: 11,
    textAlign: "center",
  },

  cameraPreview: {
    height: 150,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#17173A",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  cameraPreviewOff: {
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  cameraPreviewIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
  },

  cameraPreviewText: {
    marginTop: 8,
    color: "#9CA3AF",
    fontSize: 12,
  },

  cameraControls: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
  },

  cameraControlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  liveTitleInput: {
    minHeight: 48,
    paddingHorizontal: 15,
    marginBottom: 14,
    borderRadius: 14,
    color: "#FFFFFF",
    fontSize: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  categoryScroll: {
    gap: 8,
    paddingBottom: 14,
  },

  categoryChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  categoryChipActive: {
    backgroundColor: "#6366F1",
  },

  categoryChipText: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "700",
  },

  categoryChipTextActive: {
    color: "#FFFFFF",
  },

  publicToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },

  publicToggleLabel: {
    color: "#D1D5DB",
    fontSize: 14,
  },

  toggleTrack: {
    width: 50,
    height: 27,
    padding: 3,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  toggleTrackActive: {
    backgroundColor: "#6366F1",
  },

  toggleThumb: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
  },

  toggleThumbActive: {
    alignSelf: "flex-end",
  },

  goLiveButton: {
    minHeight: 52,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 17,
    backgroundColor: "#DC2626",
  },

  goLiveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.5,
  },
});

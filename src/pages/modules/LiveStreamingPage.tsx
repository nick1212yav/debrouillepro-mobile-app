import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
  Easing,
} from "react-native";

import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Diamond,
  Eye,
  Flame,
  Gift,
  Heart,
  MessageCircle,
  Mic,
  MicOff,
  Play,
  Plus,
  Radio,
  Rocket,
  Send,
  Share2,
  Star,
  TrendingUp,
  Users,
  Video,
  VideoOff,
  X,
  Zap,
} from "lucide-react-native";

import { useMutation, useQuery } from "convex/react";

import { useConvexAuth } from "@/lib/convex-auth-compat";

import { api } from "@/convex/_generated/api.js";

import type { Id } from "@/convex/_generated/dataModel.js";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type GiftType = "star" | "crown" | "fire" | "diamond" | "rocket";

type FloatingReaction = {
  id: string;
  emoji: string;
  x: number;
  color: string;
};

type LiveMessage = {
  _id: string;
  text: string;
  type: string;
  amount?: number | null;
  userName: string;
  userAvatar?: string;
};

type LiveStream = {
  _id: Id<"liveStreams">;
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

type LiveStreamingPageProps = {
  onBack: () => void;
};

type GiftConfig = {
  type: GiftType;
  emoji: string;
  label: string;
  price: number;
  color: string;
};

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const BACKGROUND = "#050812";

const PANEL = "rgba(255,255,255,0.045)";

const PANEL_STRONG = "rgba(255,255,255,0.075)";

const BORDER = "rgba(255,255,255,0.08)";

const LIVE_RED = "#EF4444";

const PRIMARY = "#6366F1";

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

const GIFTS: GiftConfig[] = [
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

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function safeInitial(value?: string | null): string {
  const initial = value?.trim().charAt(0);

  return initial ? initial.toUpperCase() : "?";
}

function isHttpUrl(value?: string): boolean {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function formatDuration(startedAt?: string, endedAt?: string): string {
  if (!startedAt) {
    return "00:00";
  }

  const start = new Date(startedAt).getTime();

  const end = endedAt ? new Date(endedAt).getTime() : Date.now();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return "00:00";
  }

  const totalSeconds = Math.floor((end - start) / 1000);

  const hours = Math.floor(totalSeconds / 3600);

  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      seconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function createReactionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ============================================================================
 * AVATAR
 * ========================================================================== */

function Avatar({
  uri,
  name,
  size = 40,
  borderColor,
}: {
  uri?: string;
  name?: string;
  size?: number;
  borderColor?: string;
}) {
  if (isHttpUrl(uri)) {
    return (
      <Image
        source={{
          uri,
        }}
        accessibilityLabel={name || "Avatar"}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: Math.max(10, size * 0.28),
            borderColor: borderColor ?? "rgba(255,255,255,0.14)",
            borderWidth: borderColor ? 2 : 1,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatarFallback,
        {
          width: size,
          height: size,
          borderRadius: Math.max(10, size * 0.28),
          borderColor: borderColor ?? "rgba(255,255,255,0.12)",
        },
      ]}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: Math.max(10, size * 0.34),
          fontWeight: "900",
        }}
      >
        {safeInitial(name)}
      </Text>
    </View>
  );
}

/* ============================================================================
 * FLOATING REACTION
 * ========================================================================== */

function FloatingEmoji({
  reaction,
  onDone,
}: {
  reaction: FloatingReaction;
  onDone: () => void;
}) {
  const translateY = useRef(new Animated.Value(0)).current;

  const opacity = useRef(new Animated.Value(1)).current;

  const scale = useRef(new Animated.Value(0.65)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -280,
        duration: 2100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1.35,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onDone();
      }
    });
  }, [opacity, scale, translateY, onDone]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.floatingEmoji,
        {
          left: `${reaction.x}%`,
          transform: [
            {
              translateY,
            },
            {
              scale,
            },
          ],
          opacity,
        },
      ]}
    >
      <Text style={styles.floatingEmojiText}>{reaction.emoji}</Text>
    </Animated.View>
  );
}

/* ============================================================================
 * CHAT ROW
 * ========================================================================== */

function ChatRow({ msg }: { msg: LiveMessage }) {
  if (msg.type === "system") {
    return (
      <View style={styles.systemMessage}>
        <Text style={styles.systemMessageText}>{msg.text}</Text>
      </View>
    );
  }

  const isSuperChat = msg.type === "super_chat";

  if (isSuperChat) {
    const giftEmoji =
      msg.text
        .split(" ")
        .find((part) => GIFTS.some((gift) => gift.emoji === part)) ?? "🎁";

    return (
      <View style={styles.superChat}>
        <Text style={styles.superChatEmoji}>{giftEmoji}</Text>

        <View style={styles.superChatBody}>
          <Text style={styles.superChatAuthor} numberOfLines={1}>
            {msg.userName}
          </Text>

          <Text style={styles.superChatText} numberOfLines={2}>
            {msg.text}
          </Text>
        </View>

        {typeof msg.amount === "number" && (
          <Text style={styles.superChatAmount}>{msg.amount} pts</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.chatRow}>
      <Avatar uri={msg.userAvatar} name={msg.userName} size={25} />

      <View style={styles.chatBody}>
        <Text style={styles.chatAuthor}>{msg.userName}</Text>

        <Text style={styles.chatText}>{msg.text}</Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * WATCH VIEW
 * ========================================================================== */

function WatchView({
  streamId,
  onClose,
}: {
  streamId: Id<"liveStreams">;
  onClose: () => void;
}) {
  const { isAuthenticated } = useConvexAuth();

  const stream = useQuery(api.liveStreams.getStream, {
    streamId,
  }) as LiveStream | null | undefined;

  const messages = useQuery(api.liveStreams.getStreamMessages, {
    streamId,
  }) as LiveMessage[] | undefined;

  const sendMessage = useMutation(api.liveStreams.sendMessage);

  const likeStream = useMutation(api.liveStreams.likeStream);

  const joinStream = useMutation(api.liveStreams.joinStream);

  const leaveStream = useMutation(api.liveStreams.leaveStream);

  const sendGift = useMutation(api.liveStreams.sendGift);

  const [chatText, setChatText] = useState("");

  const [liked, setLiked] = useState(false);

  const [likePending, setLikePending] = useState(false);

  const [messagePending, setMessagePending] = useState(false);

  const [giftPending, setGiftPending] = useState(false);

  const [showGifts, setShowGifts] = useState(false);

  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  const chatScrollRef = useRef<ScrollView>(null);

  /* --------------------------------------------------------------------------
   * JOIN / LEAVE
   * ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let mounted = true;

    void joinStream({
      streamId,
    }).catch(() => {
      if (mounted) {
        // L'accès au live reste disponible même
        // si l'enregistrement de présence échoue.
      }
    });

    return () => {
      mounted = false;

      void leaveStream({
        streamId,
      }).catch(() => null);
    };
  }, [isAuthenticated, joinStream, leaveStream, streamId]);

  /* --------------------------------------------------------------------------
   * CHAT AUTO SCROLL
   * ------------------------------------------------------------------------ */

  useEffect(() => {
    requestAnimationFrame(() => {
      chatScrollRef.current?.scrollToEnd({
        animated: true,
      });
    });
  }, [messages]);

  /* --------------------------------------------------------------------------
   * REACTIONS
   * ------------------------------------------------------------------------ */

  const addReaction = useCallback((emoji: string, color: string) => {
    const id = createReactionId();

    const x = 12 + Math.random() * 70;

    setReactions((current) => [
      ...current,
      {
        id,
        emoji,
        x,
        color,
      },
    ]);
  }, []);

  const removeReaction = useCallback((id: string) => {
    setReactions((current) => current.filter((reaction) => reaction.id !== id));
  }, []);

  /* --------------------------------------------------------------------------
   * LIKE
   * ------------------------------------------------------------------------ */

  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      Alert.alert("Connexion requise", "Connectez-vous pour réagir à ce live.");
      return;
    }

    if (liked || likePending) {
      return;
    }

    setLikePending(true);

    try {
      await likeStream({
        streamId,
      });

      setLiked(true);

      addReaction("❤️", LIVE_RED);
    } catch {
      Alert.alert(
        "Action impossible",
        "Votre réaction n'a pas pu être enregistrée.",
      );
    } finally {
      setLikePending(false);
    }
  }, [addReaction, isAuthenticated, likePending, likeStream, liked, streamId]);

  /* --------------------------------------------------------------------------
   * SEND MESSAGE
   * ------------------------------------------------------------------------ */

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

    if (messagePending) {
      return;
    }

    setMessagePending(true);

    try {
      await sendMessage({
        streamId,
        text,
        type: "chat",
      });

      setChatText("");
    } catch {
      Alert.alert(
        "Message non envoyé",
        "Impossible d'envoyer votre message pour le moment.",
      );
    } finally {
      setMessagePending(false);
    }
  }, [chatText, isAuthenticated, messagePending, sendMessage, streamId]);

  /* --------------------------------------------------------------------------
   * GIFT
   * ------------------------------------------------------------------------ */

  const handleGift = useCallback(
    async (gift: GiftConfig) => {
      if (!isAuthenticated) {
        Alert.alert(
          "Connexion requise",
          "Connectez-vous pour envoyer un cadeau.",
        );
        return;
      }

      if (giftPending) {
        return;
      }

      setGiftPending(true);

      try {
        await sendGift({
          streamId,
          giftType: gift.type,
          amount: gift.price,
        });

        addReaction(gift.emoji, gift.color);

        setShowGifts(false);
      } catch {
        Alert.alert(
          "Cadeau non envoyé",
          "Le cadeau n'a pas pu être enregistré.",
        );
      } finally {
        setGiftPending(false);
      }
    },
    [addReaction, giftPending, isAuthenticated, sendGift, streamId],
  );

  /* --------------------------------------------------------------------------
   * SHARE
   * ------------------------------------------------------------------------ */

  const handleShare = useCallback(async () => {
    if (!stream) {
      return;
    }

    try {
      await Share.share({
        title: stream.title,
        message: `${stream.title} — Live sur DébrouillePro`,
      });
    } catch {
      // L'annulation native du partage
      // ne constitue pas une erreur utilisateur.
    }
  }, [stream]);

  /* --------------------------------------------------------------------------
   * LOADING
   * ------------------------------------------------------------------------ */

  if (stream === undefined) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingIndicator}>
          <Radio size={26} color={LIVE_RED} />
        </View>

        <Text style={styles.loadingTitle}>Connexion au live…</Text>

        <Text style={styles.loadingText}>
          Chargement des données de la diffusion.
        </Text>
      </View>
    );
  }

  if (!stream) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingIndicator}>
          <Radio size={26} color="#475569" />
        </View>

        <Text style={styles.loadingTitle}>Live indisponible</Text>

        <Text style={styles.loadingText}>
          Cette diffusion n'est plus disponible.
        </Text>

        <Pressable onPress={onClose} style={styles.primaryButton}>
          <ArrowLeft size={15} color="#FFFFFF" />

          <Text style={styles.primaryButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.watchScreen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ================================================================
         * VISUAL AREA
         * ============================================================ */}

        <View style={styles.watchVisual}>
          {isHttpUrl(stream.thumbnailUrl) ? (
            <Image
              source={{
                uri: stream.thumbnailUrl,
              }}
              accessibilityLabel={stream.title}
              resizeMode="cover"
              style={styles.watchImage}
            />
          ) : (
            <View style={styles.watchFallback}>
              <Radio size={64} color="rgba(255,255,255,0.12)" />
            </View>
          )}

          <View style={styles.watchShade} />

          {/* Reactions */}
          <View pointerEvents="none" style={styles.reactionLayer}>
            {reactions.map((reaction) => (
              <FloatingEmoji
                key={reaction.id}
                reaction={reaction}
                onDone={() => removeReaction(reaction.id)}
              />
            ))}
          </View>

          {/* Header */}
          <View style={styles.watchHeader}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer le live"
              style={styles.roundButton}
            >
              <ArrowLeft size={18} color="#FFFFFF" />
            </Pressable>

            <View style={styles.hostIdentity}>
              <Avatar
                uri={stream.hostAvatar}
                name={stream.hostName}
                size={38}
                borderColor={LIVE_RED}
              />

              <View style={styles.hostIdentityText}>
                <Text style={styles.hostName} numberOfLines={1}>
                  {stream.hostName}
                </Text>

                <Text style={styles.hostCategory} numberOfLines={1}>
                  {stream.category}
                </Text>
              </View>
            </View>

            <View style={styles.watchHeaderRight}>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />

                <Text style={styles.livePillText}>LIVE</Text>
              </View>

              <View style={styles.viewerPill}>
                <Eye size={11} color="#CBD5E1" />

                <Text style={styles.viewerPillText}>
                  {stream.viewerCount.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Title */}
          <View style={styles.watchTitleArea}>
            <Text style={styles.watchTitle} numberOfLines={3}>
              {stream.title}
            </Text>

            <View style={styles.watchStats}>
              <View style={styles.watchStat}>
                <Heart size={12} color={LIVE_RED} fill={LIVE_RED} />

                <Text style={styles.watchStatText}>
                  {stream.likeCount.toLocaleString()}
                </Text>
              </View>

              {stream.startedAt ? (
                <View style={styles.watchStat}>
                  <Clock size={12} color="#94A3B8" />

                  <Text style={styles.watchStatText}>
                    {formatDuration(stream.startedAt)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Action rail */}
          <View style={styles.actionRail}>
            <Pressable
              onPress={() => void handleLike()}
              disabled={liked || likePending}
              accessibilityRole="button"
              accessibilityLabel={liked ? "Live aimé" : "Aimer le live"}
              style={styles.actionItem}
            >
              <View
                style={[styles.actionCircle, liked && styles.actionCircleLiked]}
              >
                <Heart
                  size={25}
                  color={liked ? LIVE_RED : "#FFFFFF"}
                  fill={liked ? LIVE_RED : "transparent"}
                />
              </View>

              <Text style={styles.actionLabel}>
                {stream.likeCount.toLocaleString()}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowGifts(true)}
              accessibilityRole="button"
              accessibilityLabel="Envoyer un cadeau"
              style={styles.actionItem}
            >
              <View style={styles.actionCircle}>
                <Gift size={25} color="#F59E0B" />
              </View>

              <Text style={styles.actionLabel}>Cadeau</Text>
            </Pressable>

            <Pressable
              onPress={() => void handleShare()}
              accessibilityRole="button"
              accessibilityLabel="Partager le live"
              style={styles.actionItem}
            >
              <View style={styles.actionCircle}>
                <Share2 size={24} color="#FFFFFF" />
              </View>

              <Text style={styles.actionLabel}>Partager</Text>
            </Pressable>
          </View>
        </View>

        {/* ================================================================
         * CHAT
         * ============================================================ */}

        <View style={styles.chatPanel}>
          <View style={styles.chatHeader}>
            <View style={styles.chatHeaderTitle}>
              <MessageCircle size={15} color="#A5B4FC" />

              <Text style={styles.chatHeaderText}>Discussion en direct</Text>
            </View>

            <Text style={styles.chatHeaderHint}>
              {messages?.length ?? 0} message
              {(messages?.length ?? 0) !== 1 ? "s" : ""}
            </Text>
          </View>

          <ScrollView
            ref={chatScrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {(messages ?? []).map((message) => (
              <ChatRow key={message._id} msg={message} />
            ))}
          </ScrollView>

          <View style={styles.composer}>
            {isAuthenticated ? (
              <>
                <TextInput
                  value={chatText}
                  onChangeText={setChatText}
                  placeholder="Écrire un message…"
                  placeholderTextColor="rgba(255,255,255,0.34)"
                  multiline
                  maxLength={1000}
                  style={styles.chatInput}
                  returnKeyType="send"
                  onSubmitEditing={() => void handleSendMessage()}
                />

                <Pressable
                  onPress={() => void handleSendMessage()}
                  disabled={!chatText.trim() || messagePending}
                  accessibilityRole="button"
                  accessibilityLabel="Envoyer le message"
                  style={[
                    styles.sendButton,
                    (!chatText.trim() || messagePending) &&
                      styles.disabledButton,
                  ]}
                >
                  <Send size={15} color="#FFFFFF" />
                </Pressable>
              </>
            ) : (
              <View style={styles.loginPrompt}>
                <Text style={styles.loginPromptText}>
                  Connectez-vous pour participer au chat.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ================================================================
         * GIFTS
         * ============================================================ */}

        <Modal
          visible={showGifts}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGifts(false)}
        >
          <View style={styles.modalBackdrop}>
            <Pressable
              style={styles.modalDismissArea}
              onPress={() => setShowGifts(false)}
            />

            <View style={styles.giftSheet}>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleRow}>
                  <Gift size={19} color="#F59E0B" />

                  <Text style={styles.sheetTitle}>Envoyer un cadeau</Text>
                </View>

                <Pressable
                  onPress={() => setShowGifts(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer"
                  style={styles.sheetClose}
                >
                  <X size={17} color="#FFFFFF" />
                </Pressable>
              </View>

              <Text style={styles.sheetDescription}>
                Choisissez un cadeau disponible pour cette diffusion.
              </Text>

              <View style={styles.giftGrid}>
                {GIFTS.map((gift) => (
                  <Pressable
                    key={gift.type}
                    onPress={() => void handleGift(gift)}
                    disabled={giftPending}
                    accessibilityRole="button"
                    accessibilityLabel={`${gift.label}, ${gift.price} points`}
                    style={({ pressed }) => [
                      styles.giftCard,
                      {
                        backgroundColor: `${gift.color}12`,
                        borderColor: `${gift.color}28`,
                      },
                      pressed && styles.pressed,
                      giftPending && styles.disabledButton,
                    ]}
                  >
                    <Text style={styles.giftEmoji}>{gift.emoji}</Text>

                    <Text style={styles.giftName}>{gift.label}</Text>

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

              <Text style={styles.giftDisclaimer}>
                Le montant et le type de cadeau sont transmis au backend avec
                cette diffusion.
              </Text>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ============================================================================
 * GO LIVE FORM
 * ========================================================================== */

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

    if (cleanTitle.length < 3) {
      Alert.alert(
        "Titre requis",
        "Ajoutez un titre de live d'au moins 3 caractères.",
      );
      return;
    }

    if (loading) {
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

      onStarted(id);
    } catch {
      Alert.alert(
        "Démarrage impossible",
        "Le backend n'a pas pu démarrer cette diffusion.",
      );
    } finally {
      setLoading(false);
    }
  }, [category, isPublic, loading, onStarted, startStream, title]);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalDismissArea} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.goLiveSheet}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <Radio size={19} color={LIVE_RED} />

              <Text style={styles.sheetTitle}>Lancer un Live</Text>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              style={styles.sheetClose}
            >
              <X size={17} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* --------------------------------------------------------------
           * PREPARATION STATUS
           * ------------------------------------------------------------ */}

          <View style={styles.broadcastStatus}>
            <View style={styles.broadcastIcon}>
              {camOn ? (
                <Video size={23} color="#FFFFFF" />
              ) : (
                <VideoOff size={23} color="#94A3B8" />
              )}
            </View>

            <View style={styles.broadcastStatusBody}>
              <Text style={styles.broadcastStatusTitle}>
                Préparation de la diffusion
              </Text>

              <Text style={styles.broadcastStatusText}>
                Le backend va créer la diffusion. Le transport vidéo/audio doit
                être fourni par l'infrastructure de streaming native du projet.
              </Text>
            </View>
          </View>

          {/* --------------------------------------------------------------
           * TITLE
           * ------------------------------------------------------------ */}

          <Text style={styles.fieldLabel}>Titre du live</Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex. Mon émission en direct"
            placeholderTextColor="rgba(255,255,255,0.35)"
            maxLength={120}
            style={styles.titleInput}
          />

          <Text style={styles.characterCount}>{title.length}/120</Text>

          {/* --------------------------------------------------------------
           * CATEGORY
           * ------------------------------------------------------------ */}

          <Text
            style={[
              styles.fieldLabel,
              {
                marginTop: 14,
              },
            ]}
          >
            Catégorie
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.filter((item) => item !== "Tout").map((item) => {
              const active = category === item;

              return (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: active,
                  }}
                  style={[
                    styles.categoryChip,
                    active && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      active && styles.categoryChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* --------------------------------------------------------------
           * CONTROLS
           * ------------------------------------------------------------ */}

          <View style={styles.controlPanel}>
            <View style={styles.controlRow}>
              <View style={styles.controlIdentity}>
                <Mic size={17} color={micOn ? "#A5B4FC" : "#64748B"} />

                <View>
                  <Text style={styles.controlTitle}>Microphone</Text>

                  <Text style={styles.controlSubtitle}>
                    {micOn ? "Activé" : "Désactivé"}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setMicOn((value) => !value)}
                accessibilityRole="switch"
                accessibilityState={{
                  checked: micOn,
                }}
                style={[styles.switch, micOn && styles.switchActive]}
              >
                <View
                  style={[styles.switchKnob, micOn && styles.switchKnobActive]}
                />
              </Pressable>
            </View>

            <View style={styles.controlDivider} />

            <View style={styles.controlRow}>
              <View style={styles.controlIdentity}>
                {camOn ? (
                  <Video size={17} color="#A5B4FC" />
                ) : (
                  <VideoOff size={17} color="#64748B" />
                )}

                <View>
                  <Text style={styles.controlTitle}>Caméra</Text>

                  <Text style={styles.controlSubtitle}>
                    {camOn ? "Activée" : "Désactivée"}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setCamOn((value) => !value)}
                accessibilityRole="switch"
                accessibilityState={{
                  checked: camOn,
                }}
                style={[styles.switch, camOn && styles.switchActive]}
              >
                <View
                  style={[styles.switchKnob, camOn && styles.switchKnobActive]}
                />
              </Pressable>
            </View>

            <View style={styles.controlDivider} />

            <View style={styles.controlRow}>
              <View style={styles.controlIdentity}>
                <Radio size={17} color={isPublic ? "#A5B4FC" : "#64748B"} />

                <View>
                  <Text style={styles.controlTitle}>Live public</Text>

                  <Text style={styles.controlSubtitle}>
                    {isPublic ? "Visible publiquement" : "Accès restreint"}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setIsPublic((value) => !value)}
                accessibilityRole="switch"
                accessibilityState={{
                  checked: isPublic,
                }}
                style={[styles.switch, isPublic && styles.switchActive]}
              >
                <View
                  style={[
                    styles.switchKnob,
                    isPublic && styles.switchKnobActive,
                  ]}
                />
              </Pressable>
            </View>
          </View>

          {/* --------------------------------------------------------------
           * START
           * ------------------------------------------------------------ */}

          <Pressable
            onPress={() => void handleStart()}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Démarrer le Live"
            style={[styles.goLiveButton, loading && styles.disabledButton]}
          >
            <Radio size={18} color="#FFFFFF" />

            <Text style={styles.goLiveButtonText}>
              {loading ? "Démarrage…" : "Démarrer le Live"}
            </Text>
          </Pressable>

          <Text style={styles.goLiveDisclaimer}>
            La création de la diffusion utilise la mutation réelle du backend.
            Aucun flux vidéo fictif n'est affiché.
          </Text>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * MY LIVE BANNER
 * ========================================================================== */

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
  }) as LiveStream | null | undefined;

  const endStream = useMutation(api.liveStreams.endStream);

  const [ending, setEnding] = useState(false);

  const handleEnd = async () => {
    if (ending) {
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Terminer le live",
        "Voulez-vous réellement terminer cette diffusion ?",
        [
          {
            text: "Annuler",
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: "Terminer",
            style: "destructive",
            onPress: () => resolve(true),
          },
        ],
      );
    });

    if (!confirmed) {
      return;
    }

    setEnding(true);

    try {
      await endStream({
        streamId,
      });

      onEnd();
    } catch {
      Alert.alert(
        "Impossible de terminer",
        "La diffusion n'a pas pu être terminée.",
      );
    } finally {
      setEnding(false);
    }
  };

  if (!stream || stream.status !== "live") {
    return null;
  }

  return (
    <View style={styles.myLiveBanner}>
      <View style={styles.myLiveDot} />

      <View style={styles.myLiveIdentity}>
        <Text style={styles.myLiveTitle} numberOfLines={1}>
          {stream.title}
        </Text>

        <Text style={styles.myLiveMeta}>
          {stream.viewerCount.toLocaleString()} spectateur
          {stream.viewerCount !== 1 ? "s" : ""} · EN DIRECT
        </Text>
      </View>

      <Pressable
        onPress={onEnterOwn}
        accessibilityRole="button"
        accessibilityLabel="Gérer mon live"
        style={styles.manageButton}
      >
        <Text style={styles.manageButtonText}>Gérer</Text>
      </Pressable>

      <Pressable
        onPress={() => void handleEnd()}
        disabled={ending}
        accessibilityRole="button"
        accessibilityLabel="Terminer mon live"
        style={styles.endButton}
      >
        <X size={13} color="#FCA5A5" />

        <Text style={styles.endButtonText}>{ending ? "…" : "Terminer"}</Text>
      </Pressable>
    </View>
  );
}

/* ============================================================================
 * STREAM CARD
 * ========================================================================== */

function StreamCard({
  stream,
  onWatch,
}: {
  stream: LiveStream;
  onWatch: () => void;
}) {
  return (
    <Pressable
      onPress={onWatch}
      accessibilityRole="button"
      accessibilityLabel={`Rejoindre ${stream.title}`}
      style={({ pressed }) => [styles.streamCard, pressed && styles.pressed]}
    >
      <View style={styles.streamThumbnailContainer}>
        {isHttpUrl(stream.thumbnailUrl) ? (
          <Image
            source={{
              uri: stream.thumbnailUrl,
            }}
            accessibilityLabel={stream.title}
            resizeMode="cover"
            style={styles.streamThumbnail}
          />
        ) : (
          <View style={styles.streamFallback}>
            <Radio size={34} color="rgba(255,255,255,0.18)" />
          </View>
        )}

        <View style={styles.streamShade} />

        <View style={styles.streamLiveBadge}>
          <View style={styles.liveDot} />

          <Text style={styles.streamLiveText}>LIVE</Text>
        </View>

        <View style={styles.streamViewerBadge}>
          <Eye size={10} color="#FFFFFF" />

          <Text style={styles.streamViewerText}>
            {stream.viewerCount.toLocaleString()}
          </Text>
        </View>

        <View style={styles.joinButton}>
          <Play size={13} color="#FFFFFF" fill="#FFFFFF" />

          <Text style={styles.joinButtonText}>Rejoindre</Text>
        </View>
      </View>

      <View style={styles.streamCardBody}>
        <Avatar
          uri={stream.hostAvatar}
          name={stream.hostName}
          size={40}
          borderColor={LIVE_RED}
        />

        <View style={styles.streamCardIdentity}>
          <Text style={styles.streamCardTitle} numberOfLines={2}>
            {stream.title}
          </Text>

          <View style={styles.streamMeta}>
            <Text style={styles.streamHost} numberOfLines={1}>
              {stream.hostName}
            </Text>

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{stream.category}</Text>
            </View>
          </View>
        </View>

        <View style={styles.likesColumn}>
          <Heart size={12} color="#F472B6" fill="#F472B6" />

          <Text style={styles.likesText}>
            {stream.likeCount.toLocaleString()}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/* ============================================================================
 * EMPTY STATE
 * ========================================================================== */

function EmptyLiveState({
  authenticated,
  onStart,
}: {
  authenticated: boolean;
  onStart: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Radio size={31} color="#F87171" />
      </View>

      <Text style={styles.emptyTitle}>Aucun live en cours</Text>

      <Text style={styles.emptyDescription}>
        Il n'y a actuellement aucune diffusion correspondant à cette sélection.
      </Text>

      {authenticated ? (
        <Pressable
          onPress={onStart}
          accessibilityRole="button"
          accessibilityLabel="Démarrer un Live"
          style={styles.emptyButton}
        >
          <Plus size={16} color="#FFFFFF" />

          <Text style={styles.emptyButtonText}>Démarrer un Live</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * MAIN PAGE
 * ========================================================================== */

export default function LiveStreamingPage({ onBack }: LiveStreamingPageProps) {
  const [activeCategory, setActiveCategory] = useState("Tout");

  const [watchingId, setWatchingId] = useState<Id<"liveStreams"> | null>(null);

  const [showGoLive, setShowGoLive] = useState(false);

  const { isAuthenticated } = useConvexAuth();

  const liveStreams = useQuery(api.liveStreams.listLiveStreams, {
    status: "live",
  }) as LiveStream[] | undefined;

  const myActiveStream = useQuery(
    api.liveStreams.getMyActiveStream,
    isAuthenticated ? {} : "skip",
  ) as LiveStream | null | undefined;

  const filtered = useMemo(() => {
    if (!liveStreams) {
      return [];
    }

    if (activeCategory === "Tout") {
      return liveStreams;
    }

    return liveStreams.filter((stream) => stream.category === activeCategory);
  }, [activeCategory, liveStreams]);

  const totalViewers = useMemo(
    () =>
      liveStreams?.reduce((total, stream) => total + stream.viewerCount, 0) ??
      0,
    [liveStreams],
  );

  /* --------------------------------------------------------------------------
   * WATCH MODE
   * ------------------------------------------------------------------------ */

  if (watchingId) {
    return (
      <WatchView streamId={watchingId} onClose={() => setWatchingId(null)} />
    );
  }

  return (
    <View style={styles.screen}>
      {/* ================================================================
       * HEADER
       * ============================================================ */}

      <View style={styles.pageHeader}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={styles.headerBackButton}
        >
          <ArrowLeft size={19} color="#FFFFFF" />
        </Pressable>

        <View style={styles.pageHeaderIdentity}>
          <View style={styles.pageTitleRow}>
            <Radio size={17} color={LIVE_RED} />

            <Text style={styles.pageTitle}>Live Streaming</Text>
          </View>

          <Text style={styles.pageSubtitle}>
            {liveStreams === undefined
              ? "Chargement des diffusions…"
              : `${liveStreams.length} diffusion${liveStreams.length !== 1 ? "s" : ""} en direct`}
          </Text>
        </View>

        {isAuthenticated ? (
          <Pressable
            onPress={() => setShowGoLive(true)}
            accessibilityRole="button"
            accessibilityLabel="Lancer un Live"
            style={styles.headerGoLive}
          >
            <Radio size={13} color="#FFFFFF" />

            <Text style={styles.headerGoLiveText}>Go Live</Text>
          </Pressable>
        ) : (
          <View style={styles.connectionBadge}>
            <Text style={styles.connectionBadgeText}>Visiteur</Text>
          </View>
        )}
      </View>

      {/* ================================================================
       * MY ACTIVE LIVE
       * ============================================================ */}

      {myActiveStream ? (
        <MyLiveBanner
          streamId={myActiveStream._id}
          onEnterOwn={() => setWatchingId(myActiveStream._id)}
          onEnd={() => undefined}
        />
      ) : null}

      {/* ================================================================
       * REAL-TIME METRICS
       * ============================================================ */}

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <View
            style={[
              styles.metricIcon,
              {
                backgroundColor: "rgba(99,102,241,0.10)",
              },
            ]}
          >
            <Users size={16} color="#818CF8" />
          </View>

          <Text style={styles.metricValue}>
            {liveStreams === undefined ? "—" : totalViewers.toLocaleString()}
          </Text>

          <Text style={styles.metricLabel}>Spectateurs</Text>
        </View>

        <View style={styles.metricCard}>
          <View
            style={[
              styles.metricIcon,
              {
                backgroundColor: "rgba(239,68,68,0.10)",
              },
            ]}
          >
            <Radio size={16} color="#F87171" />
          </View>

          <Text style={styles.metricValue}>
            {liveStreams === undefined ? "—" : liveStreams.length}
          </Text>

          <Text style={styles.metricLabel}>Créateurs</Text>
        </View>

        <View style={styles.metricCard}>
          <View
            style={[
              styles.metricIcon,
              {
                backgroundColor: "rgba(16,185,129,0.10)",
              },
            ]}
          >
            <TrendingUp size={16} color="#34D399" />
          </View>

          <Text style={styles.metricValue}>
            {liveStreams === undefined ? "—" : filtered.length}
          </Text>

          <Text style={styles.metricLabel}>Sélection</Text>
        </View>
      </View>

      {/* ================================================================
       * CATEGORIES
       * ============================================================ */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {CATEGORIES.map((category) => {
          const active = category === activeCategory;

          return (
            <Pressable
              key={category}
              onPress={() => setActiveCategory(category)}
              accessibilityRole="button"
              accessibilityState={{
                selected: active,
              }}
              style={[
                styles.categoryChip,
                active && styles.categoryChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  active && styles.categoryChipTextSelected,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ================================================================
       * STREAM LIST
       * ============================================================ */}

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        {liveStreams === undefined ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2].map((item) => (
              <View key={item} style={styles.streamSkeleton}>
                <View style={styles.skeletonImage} />

                <View style={styles.skeletonBody} />
              </View>
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <EmptyLiveState
            authenticated={isAuthenticated}
            onStart={() => setShowGoLive(true)}
          />
        ) : (
          <View style={styles.streamList}>
            {filtered.map((stream) => (
              <StreamCard
                key={stream._id}
                stream={stream}
                onWatch={() => setWatchingId(stream._id)}
              />
            ))}
          </View>
        )}

        {/* ================================================================
         * CREATOR CTA
         * ============================================================ */}

        {isAuthenticated && !myActiveStream ? (
          <View style={styles.creatorCard}>
            <View style={styles.creatorIcon}>
              <Radio size={26} color="#F87171" />
            </View>

            <Text style={styles.creatorTitle}>Votre prochaine diffusion</Text>

            <Text style={styles.creatorText}>
              Créez une diffusion et rejoignez votre audience en temps réel.
            </Text>

            <Pressable
              onPress={() => setShowGoLive(true)}
              accessibilityRole="button"
              accessibilityLabel="Créer une diffusion"
              style={styles.creatorButton}
            >
              <Radio size={15} color="#FFFFFF" />

              <Text style={styles.creatorButtonText}>Démarrer un Live</Text>

              <ChevronRight size={15} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : null}

        {/* ================================================================
         * DATA INTEGRITY
         * ============================================================ */}

        <View style={styles.integrityCard}>
          <View style={styles.integrityIcon}>
            <Zap size={16} color="#A5B4FC" />
          </View>

          <View style={styles.integrityBody}>
            <Text style={styles.integrityTitle}>Données en temps réel</Text>

            <Text style={styles.integrityText}>
              Les diffusions et compteurs présentés ici proviennent des données
              disponibles du backend. Aucun live, compteur ou pourcentage
              artificiel n'est ajouté pour remplir l'écran.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ================================================================
       * GO LIVE
       * ============================================================ */}

      {showGoLive ? (
        <GoLiveForm
          onClose={() => setShowGoLive(false)}
          onStarted={(id) => {
            setShowGoLive(false);
            setWatchingId(id);
          }}
        />
      ) : null}
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  /* ------------------------------------------------------------------------
   * PAGE HEADER
   * ---------------------------------------------------------------------- */

  pageHeader: {
    minHeight: 77,
    paddingHorizontal: 15,
    paddingTop: 9,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(2,6,23,0.96)",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  headerBackButton: {
    width: 41,
    height: 41,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  pageHeaderIdentity: {
    flex: 1,
    minWidth: 0,
  },

  pageTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  pageTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  pageSubtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 8.5,
    fontWeight: "650",
  },

  headerGoLive: {
    minHeight: 39,
    paddingHorizontal: 12,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: LIVE_RED,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  headerGoLiveText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  connectionBadge: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  connectionBadgeText: {
    color: "#64748B",
    fontSize: 7.5,
    fontWeight: "800",
  },

  /* ------------------------------------------------------------------------
   * MY LIVE
   * ---------------------------------------------------------------------- */

  myLiveBanner: {
    marginHorizontal: 14,
    marginTop: 11,
    padding: 11,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.09)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },

  myLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: LIVE_RED,
  },

  myLiveIdentity: {
    flex: 1,
    minWidth: 0,
  },

  myLiveTitle: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "850",
  },

  myLiveMeta: {
    marginTop: 3,
    color: "#F87171",
    fontSize: 7.5,
    fontWeight: "700",
  },

  manageButton: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(99,102,241,0.18)",
  },

  manageButtonText: {
    color: "#A5B4FC",
    fontSize: 7.5,
    fontWeight: "850",
  },

  endButton: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(239,68,68,0.14)",
  },

  endButtonText: {
    color: "#FCA5A5",
    fontSize: 7.5,
    fontWeight: "850",
  },

  /* ------------------------------------------------------------------------
   * METRICS
   * ---------------------------------------------------------------------- */

  metricsRow: {
    paddingHorizontal: 14,
    paddingTop: 12,
    flexDirection: "row",
    gap: 7,
  },

  metricCard: {
    flex: 1,
    minHeight: 78,
    padding: 10,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: BORDER,
  },

  metricIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  metricValue: {
    marginTop: 5,
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "900",
  },

  metricLabel: {
    marginTop: 2,
    color: "#475569",
    fontSize: 7,
    fontWeight: "700",
  },

  /* ------------------------------------------------------------------------
   * CATEGORIES
   * ---------------------------------------------------------------------- */

  categories: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 7,
  },

  categoryChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  categoryChipSelected: {
    backgroundColor: "rgba(99,102,241,0.18)",
    borderColor: "rgba(129,140,248,0.35)",
  },

  categoryChipText: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "750",
  },

  categoryChipTextSelected: {
    color: "#C7D2FE",
  },

  /* ------------------------------------------------------------------------
   * CONTENT
   * ---------------------------------------------------------------------- */

  mainScroll: {
    flex: 1,
  },

  mainContent: {
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingBottom: 34,
  },

  streamList: {
    gap: 11,
  },

  /* ------------------------------------------------------------------------
   * STREAM CARD
   * ---------------------------------------------------------------------- */

  streamCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: BORDER,
  },

  streamThumbnailContainer: {
    height: 205,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#101625",
  },

  streamThumbnail: {
    width: "100%",
    height: "100%",
  },

  streamFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D1422",
  },

  streamShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  streamLiveBadge: {
    position: "absolute",
    top: 11,
    left: 11,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(220,38,38,0.94)",
  },

  streamLiveText: {
    color: "#FFFFFF",
    fontSize: 7.5,
    fontWeight: "950",
    letterSpacing: 0.5,
  },

  streamViewerBadge: {
    position: "absolute",
    top: 11,
    right: 11,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.58)",
  },

  streamViewerText: {
    color: "#FFFFFF",
    fontSize: 7.5,
    fontWeight: "800",
  },

  joinButton: {
    position: "absolute",
    left: "50%",
    bottom: 13,
    minHeight: 36,
    paddingHorizontal: 15,
    marginLeft: -51,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(79,70,229,0.94)",
  },

  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  streamCardBody: {
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  streamCardIdentity: {
    flex: 1,
    minWidth: 0,
  },

  streamCardTitle: {
    color: "#F8FAFC",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "850",
  },

  streamMeta: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  streamHost: {
    maxWidth: "55%",
    color: "#64748B",
    fontSize: 8,
    fontWeight: "700",
  },

  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.12)",
  },

  categoryBadgeText: {
    color: "#A5B4FC",
    fontSize: 6.5,
    fontWeight: "800",
  },

  likesColumn: {
    minWidth: 38,
    alignItems: "center",
    gap: 3,
  },

  likesText: {
    color: "#94A3B8",
    fontSize: 7.5,
    fontWeight: "750",
  },

  /* ------------------------------------------------------------------------
   * CREATOR
   * ---------------------------------------------------------------------- */

  creatorCard: {
    marginTop: 15,
    padding: 17,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.055)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.18)",
  },

  creatorIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.10)",
  },

  creatorTitle: {
    marginTop: 10,
    color: "#F8FAFC",
    fontSize: 12.5,
    fontWeight: "900",
  },

  creatorText: {
    maxWidth: 330,
    marginTop: 5,
    color: "#64748B",
    fontSize: 8.5,
    lineHeight: 14,
    textAlign: "center",
  },

  creatorButton: {
    marginTop: 12,
    minHeight: 40,
    paddingHorizontal: 15,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: LIVE_RED,
  },

  creatorButtonText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "900",
  },

  /* ------------------------------------------------------------------------
   * INTEGRITY
   * ---------------------------------------------------------------------- */

  integrityCard: {
    marginTop: 14,
    padding: 13,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(99,102,241,0.045)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.13)",
  },

  integrityIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.10)",
  },

  integrityBody: {
    flex: 1,
  },

  integrityTitle: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "850",
  },

  integrityText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 8,
    lineHeight: 13,
  },

  /* ------------------------------------------------------------------------
   * EMPTY
   * ---------------------------------------------------------------------- */

  emptyState: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 65,
    height: 65,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.15)",
  },

  emptyTitle: {
    marginTop: 13,
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "850",
  },

  emptyDescription: {
    maxWidth: 310,
    marginTop: 5,
    color: "#475569",
    fontSize: 8.5,
    lineHeight: 14,
    textAlign: "center",
  },

  emptyButton: {
    marginTop: 13,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: LIVE_RED,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },

  /* ------------------------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------------------- */

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    backgroundColor: "#000000",
  },

  loadingIndicator: {
    width: 64,
    height: 64,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.08)",
  },

  loadingTitle: {
    marginTop: 14,
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "850",
  },

  loadingText: {
    marginTop: 5,
    color: "#475569",
    fontSize: 8.5,
    textAlign: "center",
  },

  primaryButton: {
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: PRIMARY,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "900",
  },

  skeletonList: {
    gap: 11,
  },

  streamSkeleton: {
    height: 275,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  skeletonImage: {
    height: 205,
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  skeletonBody: {
    flex: 1,
    margin: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  /* ------------------------------------------------------------------------
   * WATCH
   * ---------------------------------------------------------------------- */

  watchScreen: {
    flex: 1,
    backgroundColor: "#000000",
  },

  watchVisual: {
    flex: 1,
    minHeight: 300,
    position: "relative",
    backgroundColor: "#080C15",
  },

  watchImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },

  watchFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  watchShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  reactionLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 8,
  },

  floatingEmoji: {
    position: "absolute",
    bottom: 80,
  },

  floatingEmojiText: {
    fontSize: 31,
  },

  watchHeader: {
    position: "absolute",
    top: 12,
    left: 13,
    right: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 10,
  },

  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.52)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  hostIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  hostIdentityText: {
    flex: 1,
    minWidth: 0,
  },

  hostName: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "850",
  },

  hostCategory: {
    marginTop: 3,
    color: "rgba(255,255,255,0.58)",
    fontSize: 7.5,
    fontWeight: "650",
  },

  watchHeaderRight: {
    alignItems: "flex-end",
    gap: 5,
  },

  livePill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(220,38,38,0.94)",
  },

  livePillText: {
    color: "#FFFFFF",
    fontSize: 7,
    fontWeight: "950",
  },

  viewerPill: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.58)",
  },

  viewerPillText: {
    color: "#FFFFFF",
    fontSize: 7.5,
    fontWeight: "750",
  },

  watchTitleArea: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    zIndex: 7,
  },

  watchTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },

  watchStats: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  watchStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  watchStatText: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 8,
    fontWeight: "700",
  },

  actionRail: {
    position: "absolute",
    right: 11,
    bottom: 22,
    zIndex: 12,
    alignItems: "center",
    gap: 13,
  },

  actionItem: {
    alignItems: "center",
    gap: 4,
  },

  actionCircle: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  actionCircleLiked: {
    backgroundColor: "rgba(239,68,68,0.18)",
    borderColor: "rgba(239,68,68,0.35)",
  },

  actionLabel: {
    color: "#FFFFFF",
    fontSize: 7.5,
    fontWeight: "750",
  },

  /* ------------------------------------------------------------------------
   * CHAT
   * ---------------------------------------------------------------------- */

  chatPanel: {
    height: 255,
    maxHeight: 300,
    backgroundColor: "#050711",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },

  chatHeader: {
    height: 39,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },

  chatHeaderTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  chatHeaderText: {
    color: "#CBD5E1",
    fontSize: 8.5,
    fontWeight: "850",
  },

  chatHeaderHint: {
    color: "#475569",
    fontSize: 7,
    fontWeight: "700",
  },

  chatScroll: {
    flex: 1,
  },

  chatContent: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    gap: 5,
  },

  chatRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  chatBody: {
    flex: 1,
    minWidth: 0,
  },

  chatAuthor: {
    color: "#A5B4FC",
    fontSize: 7.5,
    fontWeight: "850",
  },

  chatText: {
    marginTop: 1,
    color: "rgba(255,255,255,0.82)",
    fontSize: 8.5,
    lineHeight: 13,
  },

  systemMessage: {
    alignItems: "center",
    paddingVertical: 2,
  },

  systemMessageText: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 7.5,
    fontStyle: "italic",
  },

  superChat: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(139,92,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.28)",
  },

  superChatEmoji: {
    fontSize: 18,
  },

  superChatBody: {
    flex: 1,
    minWidth: 0,
  },

  superChatAuthor: {
    color: "#C4B5FD",
    fontSize: 7.5,
    fontWeight: "850",
  },

  superChatText: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "650",
  },

  superChatAmount: {
    color: "#FBBF24",
    fontSize: 8,
    fontWeight: "950",
  },

  composer: {
    minHeight: 52,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },

  chatInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    color: "#FFFFFF",
    fontSize: 9.5,
    backgroundColor: "rgba(255,255,255,0.075)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  sendButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
  },

  loginPrompt: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  loginPromptText: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "700",
  },

  /* ------------------------------------------------------------------------
   * MODALS
   * ---------------------------------------------------------------------- */

  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.76)",
  },

  modalDismissArea: {
    flex: 1,
  },

  giftSheet: {
    paddingHorizontal: 17,
    paddingTop: 15,
    paddingBottom: 25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: "#0A0E1B",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  goLiveSheet: {
    paddingHorizontal: 17,
    paddingTop: 15,
    paddingBottom: 24,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: "#0A0E1B",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  sheetTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  sheetDescription: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 8.5,
    lineHeight: 14,
  },

  /* ------------------------------------------------------------------------
   * GIFTS
   * ---------------------------------------------------------------------- */

  giftGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  giftCard: {
    width: "18.8%",
    minHeight: 91,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  giftEmoji: {
    fontSize: 23,
  },

  giftName: {
    marginTop: 5,
    color: "#CBD5E1",
    fontSize: 7,
    fontWeight: "800",
  },

  giftPrice: {
    marginTop: 3,
    fontSize: 7.5,
    fontWeight: "950",
  },

  giftDisclaimer: {
    marginTop: 12,
    color: "#475569",
    fontSize: 7.5,
    lineHeight: 12,
    textAlign: "center",
  },

  /* ------------------------------------------------------------------------
   * GO LIVE
   * ---------------------------------------------------------------------- */

  broadcastStatus: {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(99,102,241,0.07)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.17)",
  },

  broadcastIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.18)",
  },

  broadcastStatusBody: {
    flex: 1,
  },

  broadcastStatusTitle: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "850",
  },

  broadcastStatusText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 7.5,
    lineHeight: 12,
  },

  fieldLabel: {
    marginTop: 14,
    marginBottom: 6,
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "850",
  },

  titleInput: {
    minHeight: 45,
    paddingHorizontal: 12,
    borderRadius: 13,
    color: "#FFFFFF",
    fontSize: 10,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  characterCount: {
    marginTop: 3,
    color: "#334155",
    fontSize: 7,
    textAlign: "right",
  },

  categoryScroll: {
    gap: 6,
    paddingBottom: 2,
  },

  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  categoryChipActive: {
    backgroundColor: "rgba(99,102,241,0.18)",
    borderColor: "rgba(129,140,248,0.32)",
  },

  categoryChipText: {
    color: "#64748B",
    fontSize: 7.5,
    fontWeight: "750",
  },

  categoryChipTextActive: {
    color: "#C7D2FE",
  },

  controlPanel: {
    marginTop: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  controlRow: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  controlIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  controlTitle: {
    color: "#CBD5E1",
    fontSize: 8.5,
    fontWeight: "800",
  },

  controlSubtitle: {
    marginTop: 2,
    color: "#475569",
    fontSize: 7,
    fontWeight: "650",
  },

  controlDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  switch: {
    width: 42,
    height: 24,
    padding: 3,
    borderRadius: 999,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  switchActive: {
    backgroundColor: "rgba(99,102,241,0.75)",
  },

  switchKnob: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "#64748B",
  },

  switchKnobActive: {
    alignSelf: "flex-end",
    backgroundColor: "#FFFFFF",
  },

  goLiveButton: {
    marginTop: 14,
    minHeight: 49,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: LIVE_RED,
  },

  goLiveButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "950",
  },

  goLiveDisclaimer: {
    marginTop: 7,
    color: "#334155",
    fontSize: 7,
    lineHeight: 11,
    textAlign: "center",
  },

  /* ------------------------------------------------------------------------
   * AVATAR
   * ---------------------------------------------------------------------- */

  avatar: {
    backgroundColor: "#111827",
  },

  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5B21B6",
    borderWidth: 1,
  },

  /* ------------------------------------------------------------------------
   * GENERAL
   * ---------------------------------------------------------------------- */

  disabledButton: {
    opacity: 0.38,
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});

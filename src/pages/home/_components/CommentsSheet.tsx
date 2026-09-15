// src/pages/home/_components/CommentsSheet.tsx
import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import {
  MessageCircle,
  Send,
  Trash2,
  Reply,
  X,
  Heart,
  MoreHorizontal,
  Smile,
  Sparkles,
  CornerDownRight,
  ShieldCheck,
  Loader2,
} from "lucide-react-native";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface CommentsSheetProps {
  open: boolean;
  onClose: () => void;
  publicationId: Id<"publications"> | null;
  publicationTitle?: string;
}

interface CommentShape {
  _id: Id<"comments">;
  text: string;
  _creationTime: number;
  authorId: Id<"users">;
  author: { name?: string; avatar?: string } | null;
  parentId?: Id<"comments">;
}

/* ============================================================================
 * HELPERS
 * ========================================================================== */

const AVATAR_COLORS = [
  "#818CF8",
  "#A78BFA",
  "#F472B6",
  "#34D399",
  "#FBBF24",
  "#60A5FA",
];

function getAvatarColor(name?: string): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgoFromTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "à l'instant";
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `il y a ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `il y a ${day} j`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `il y a ${wk} sem.`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `il y a ${mo} mois`;
  return `il y a ${Math.floor(day / 365)} an${day >= 730 ? "s" : ""}`;
}

/* ============================================================================
 * AVATAR
 * ========================================================================== */

function Avatar({
  name,
  avatar,
  size = 36,
}: {
  name?: string;
  avatar?: string;
  size?: number;
}) {
  if (avatar) {
    return (
      <Image
        source={{ uri: avatar }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.1)",
        }}
        accessibilityLabel={name ?? "Avatar"}
      />
    );
  }

  const initials = name ? name.slice(0, 2).toUpperCase() : "?";
  const color = getAvatarColor(name);

  return (
    <LinearGradient
      colors={[color, `${color}AA`]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: size * 0.36,
          fontWeight: "900",
          letterSpacing: -0.3,
        }}
      >
        {initials}
      </Text>
    </LinearGradient>
  );
}

/* ============================================================================
 * COMMENT ITEM
 * ========================================================================== */

function CommentItem({
  comment,
  index,
  currentUserId,
  onDelete,
  onReply,
}: {
  comment: CommentShape;
  index: number;
  currentUserId: Id<"users"> | null;
  onDelete: (id: Id<"comments">) => void;
  onReply: (name: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwn = currentUserId === comment.authorId;
  const timeAgo = timeAgoFromTimestamp(comment._creationTime);

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay: Math.min(index * 55, 500),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  const isReply = Boolean(comment.parentId);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY }],
      }}
    >
      <View style={[styles.commentRow, isReply && styles.commentRowReply]}>
        {isReply ? (
          <View style={styles.replySpine}>
            <CornerDownRight size={12} color="rgba(255,255,255,0.18)" />
          </View>
        ) : null}

        <Avatar
          name={comment.author?.name}
          avatar={comment.author?.avatar}
          size={36}
        />

        <View style={{ flex: 1, minWidth: 0 }}>
          {/* Bubble */}
          <View style={styles.commentBubble}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor} numberOfLines={1}>
                {comment.author?.name ?? "Utilisateur"}
              </Text>
              <Text style={styles.commentTime}>{timeAgo}</Text>

              <Pressable
                onPress={() => setMenuOpen((v) => !v)}
                hitSlop={8}
                accessibilityLabel="Options"
                style={({ pressed }) => [
                  styles.menuTrigger,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MoreHorizontal size={14} color="rgba(255,255,255,0.4)" />
              </Pressable>
            </View>

            <Text style={styles.commentText}>{comment.text}</Text>
          </View>

          {/* Actions */}
          <View style={styles.commentActions}>
            <Pressable
              onPress={() => setLiked((v) => !v)}
              hitSlop={6}
              style={({ pressed }) => [
                styles.actionBtn,
                liked && styles.actionBtnLiked,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Heart
                size={11}
                color={liked ? "#FCA5A5" : "rgba(255,255,255,0.5)"}
                fill={liked ? "#FCA5A5" : "none"}
              />
              <Text
                style={[styles.actionBtnText, liked && { color: "#FCA5A5" }]}
              >
                {liked ? "Aimé" : "J'aime"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onReply(comment.author?.name ?? "Utilisateur")}
              hitSlop={6}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Reply size={11} color="rgba(255,255,255,0.5)" />
              <Text style={styles.actionBtnText}>Répondre</Text>
            </Pressable>
          </View>

          {/* Menu */}
          {menuOpen ? (
            <View style={styles.menu}>
              {isOwn ? (
                <Pressable
                  onPress={() => {
                    setMenuOpen(false);
                    onDelete(comment._id);
                  }}
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && { backgroundColor: "rgba(239,68,68,0.1)" },
                  ]}
                >
                  <Trash2 size={12} color="#FCA5A5" />
                  <Text style={styles.menuItemTextDanger}>Supprimer</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => setMenuOpen(false)}
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && { backgroundColor: "rgba(255,255,255,0.06)" },
                  ]}
                >
                  <Text style={styles.menuItemText}>Signaler</Text>
                </Pressable>
              )}
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

/* ============================================================================
 * SKELETON
 * ========================================================================== */

function SkeletonComment({ index }: { index: number }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          delay: index * 100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse, index]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.85],
  });

  return (
    <Animated.View style={[styles.skeletonRow, { opacity }]}>
      <View style={styles.skeletonAvatar} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={styles.skeletonLineShort} />
        <View style={styles.skeletonBubble} />
      </View>
    </Animated.View>
  );
}

/* ============================================================================
 * EMPTY STATE
 * ========================================================================== */

function EmptyState({ isAuthenticated }: { isAuthenticated: boolean }) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [float]);

  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  return (
    <View style={styles.emptyWrap}>
      <Animated.View
        style={[styles.emptyIconWrap, { transform: [{ translateY }] }]}
      >
        <LinearGradient
          colors={["rgba(99,102,241,0.22)", "rgba(139,92,246,0.1)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyIconGradient}
        >
          <MessageCircle size={27} color="rgba(255,255,255,0.65)" />
        </LinearGradient>
        <View style={styles.emptySparkle}>
          <Sparkles size={12} color="rgba(165,180,252,0.85)" />
        </View>
      </Animated.View>

      <Text style={styles.emptyTitle}>La discussion commence ici</Text>
      <Text style={styles.emptySub}>
        Partagez votre avis, posez une question ou apportez une information
        utile.
      </Text>

      {!isAuthenticated ? (
        <View style={{ marginTop: 20 }}>
          <SignInButton />
        </View>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * PULSING HEADER ICON
 * ========================================================================== */

function HeaderIcon({ count }: { count: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  useEffect(() => {
    countAnim.setValue(0.7);
    Animated.spring(countAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 12,
    }).start();
  }, [count, countAnim]);

  const glow = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  return (
    <View style={styles.headerIconWrap}>
      <Animated.View
        style={[styles.headerIconHalo, { transform: [{ scale: glow }] }]}
      />
      <LinearGradient
        colors={["#818CF8", "#6366F1", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerIconGradient}
      >
        <MessageCircle size={18} color="#fff" />
      </LinearGradient>

      {count > 0 ? (
        <Animated.View
          style={[styles.countBadge, { transform: [{ scale: countAnim }] }]}
        >
          <Text style={styles.countBadgeText}>
            {count > 99 ? "99+" : count}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * LOADING SPINNER
 * ========================================================================== */

function LoadingSpinner() {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotate]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
      <Loader2 size={15} color="#fff" />
    </Animated.View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function CommentsSheet({
  open,
  onClose,
  publicationId,
  publicationTitle,
}: CommentsSheetProps) {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();

  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [focused, setFocused] = useState(false);
  const [mounted, setMounted] = useState(open);

  const inputRef = useRef<TextInput>(null);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const focusAnim = useRef(new Animated.Value(0)).current;

  const { isAuthenticated } = useFirebaseAuth();

  const comments = useQuery(
    api.comments.listComments,
    publicationId ? { publicationId, limit: 50 } : "skip",
  );

  const currentUser = useQuery(api.users.getCurrentUser, {});
  const addComment = useMutation(api.comments.createComment);
  const removeComment = useMutation(api.comments.remove);

  /* ───── entrance / exit ───── */
  useEffect(() => {
    if (open) {
      setMounted(true);
      backdropAnim.setValue(0);
      slideAnim.setValue(0);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ───── focus animation ───── */
  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focused, focusAnim]);

  /* ───── actions ───── */
  const handleSend = useCallback(async () => {
    if (!text.trim() || !publicationId || sending) return;

    setSending(true);
    try {
      await addComment({ publicationId, text: text.trim() });
      setText("");
      setReplyTo(null);
    } catch {
      toast.error("Impossible d'envoyer le commentaire");
    } finally {
      setSending(false);
    }
  }, [addComment, publicationId, sending, text]);

  const handleDelete = useCallback(
    async (commentId: Id<"comments">) => {
      try {
        await removeComment({ commentId });
        toast.success("Commentaire supprimé");
      } catch {
        toast.error("Impossible de supprimer");
      }
    },
    [removeComment],
  );

  const handleReply = useCallback((name: string) => {
    setReplyTo(name);
    setText(`@${name} `);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const handleClose = useCallback(() => {
    if (sending) return;
    onClose();
  }, [onClose, sending]);

  if (!mounted) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  const commentCount = comments?.length ?? 0;

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.1)", "rgba(129,140,248,0.55)"],
  });
  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.045)", "rgba(99,102,241,0.08)"],
  });

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* ───── BACKDROP ───── */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable
          onPress={handleClose}
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Fermer"
        />
      </Animated.View>

      {/* ───── SHEET ───── */}
      <Animated.View
        style={[
          styles.sheet,
          {
            maxHeight: Math.min(SCREEN_HEIGHT * 0.88, 820),
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Base gradient */}
        <LinearGradient
          colors={["#0C0A1F", "#0A0818", "#070512"]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top ambient glow */}
        <View style={styles.topGlow} pointerEvents="none">
          <LinearGradient
            colors={["rgba(99,102,241,0.25)", "rgba(99,102,241,0)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ flex: 1, borderRadius: 999 }}
          />
        </View>

        {/* Top light line */}
        <View style={styles.topLine} pointerEvents="none" />

        {/* Border ring */}
        <View style={styles.borderRing} pointerEvents="none" />

        {/* ───── HANDLE ───── */}
        <View style={styles.handleWrap}>
          <View style={styles.handleBar} />
        </View>

        {/* ───── HEADER ───── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <HeaderIcon count={commentCount} />

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.headerTitle}>Discussion</Text>
              {publicationTitle ? (
                <Text style={styles.headerSub} numberOfLines={1}>
                  {publicationTitle}
                </Text>
              ) : null}
            </View>

            <Pressable
              onPress={handleClose}
              accessibilityLabel="Fermer"
              hitSlop={8}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && { opacity: 0.75 },
              ]}
            >
              <X size={17} color="rgba(255,255,255,0.75)" />
            </Pressable>
          </View>

          <View style={styles.headerNote}>
            <ShieldCheck size={11} color="rgba(52,211,153,0.7)" />
            <Text style={styles.headerNoteText}>
              Une conversation respectueuse et utile à tous.
            </Text>
          </View>
        </View>

        {/* ───── COMMENTS ───── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.commentsScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!comments ? (
            <View style={{ gap: 18 }}>
              {[0, 1, 2, 3].map((i) => (
                <SkeletonComment key={i} index={i} />
              ))}
            </View>
          ) : commentCount === 0 ? (
            <EmptyState isAuthenticated={isAuthenticated} />
          ) : (
            <View style={{ maxWidth: 720, width: "100%", alignSelf: "center" }}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  {commentCount} contribution{commentCount > 1 ? "s" : ""}
                </Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={{ gap: 16 }}>
                {comments.map((comment, index) => (
                  <CommentItem
                    key={comment._id}
                    comment={comment as CommentShape}
                    index={index}
                    currentUserId={currentUser?._id ?? null}
                    onDelete={handleDelete}
                    onReply={handleReply}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* ───── COMPOSER ───── */}
        <View
          style={[
            styles.composer,
            {
              paddingBottom: Platform.OS === "android" ? 16 : Math.max(16, 28),
            },
          ]}
        >
          {isAuthenticated ? (
            <View style={{ maxWidth: 720, width: "100%", alignSelf: "center" }}>
              {/* Reply banner */}
              {replyTo ? (
                <ReplyBanner
                  name={replyTo}
                  onClear={() => {
                    setReplyTo(null);
                    setText("");
                  }}
                />
              ) : null}

              <View style={styles.composerRow}>
                <Avatar
                  name={currentUser?.name}
                  avatar={currentUser?.avatar}
                  size={36}
                />

                <Animated.View
                  style={[
                    styles.inputWrapper,
                    { borderColor, backgroundColor: bgColor },
                  ]}
                >
                  <TextInput
                    ref={inputRef}
                    value={text}
                    onChangeText={setText}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onSubmitEditing={() => void handleSend()}
                    placeholder={
                      replyTo
                        ? `Répondre à ${replyTo}...`
                        : "Écrire un commentaire..."
                    }
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    maxLength={1000}
                    accessibilityLabel="Commentaire"
                    multiline
                    style={styles.input}
                    textAlignVertical="top"
                  />
                  <Pressable
                    hitSlop={8}
                    accessibilityLabel="Emoji"
                    style={styles.emojiBtn}
                  >
                    <Smile size={14} color="rgba(255,255,255,0.4)" />
                  </Pressable>
                </Animated.View>

                <Pressable
                  onPress={() => void handleSend()}
                  disabled={!text.trim() || sending}
                  accessibilityLabel="Envoyer"
                  style={({ pressed }) => [
                    styles.sendBtnOuter,
                    (!text.trim() || sending) && styles.sendBtnDisabled,
                    pressed && text.trim() && !sending && styles.pressed,
                  ]}
                >
                  <LinearGradient
                    colors={
                      text.trim() && !sending
                        ? ["#818CF8", "#6366F1", "#7C3AED"]
                        : ["#232132", "#181625"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sendBtnGradient}
                  >
                    {sending ? (
                      <LoadingSpinner />
                    ) : (
                      <Send
                        size={15}
                        color={text.trim() ? "#fff" : "rgba(255,255,255,0.3)"}
                      />
                    )}
                  </LinearGradient>
                </Pressable>
              </View>

              <View style={styles.composerHintRow}>
                <Text style={styles.composerHint}>
                  Entrée pour envoyer · Maj + Entrée = nouvelle ligne
                </Text>
                <Text
                  style={[
                    styles.composerCounter,
                    text.length > 900 && { color: "#FCD34D" },
                  ]}
                >
                  {text.length}/1000
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.signInRow}>
              <View style={styles.signInIcon}>
                <MessageCircle size={14} color="rgba(255,255,255,0.55)" />
              </View>
              <Text style={styles.signInText}>
                Connectez-vous pour participer à la discussion
              </Text>
              <SignInButton />
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

/* ============================================================================
 * REPLY BANNER
 * ========================================================================== */

function ReplyBanner({ name, onClear }: { name: string; onClear: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        styles.replyBanner,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-8, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Reply size={12} color="#A5B4FC" />
      <Text style={styles.replyBannerText} numberOfLines={1}>
        Réponse à <Text style={{ fontWeight: "900" }}>{name}</Text>
      </Text>
      <Pressable onPress={onClear} hitSlop={8}>
        <X size={12} color="rgba(255,255,255,0.55)" />
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    backgroundColor: "#0A0818",
    shadowColor: "#000",
    shadowOpacity: 0.75,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -20 },
    elevation: 24,
  },

  topGlow: {
    position: "absolute",
    top: -110,
    left: "15%",
    right: "15%",
    height: 180,
    opacity: 0.9,
  },

  topLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(129,140,248,0.35)",
  },

  borderRing: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.15)",
  },

  handleWrap: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 6,
    zIndex: 10,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  // ── HEADER
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
  },
  headerIconHalo: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(129,140,248,0.35)",
  },
  headerIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#6366F1",
    shadowOpacity: 0.7,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  countBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    paddingHorizontal: 5,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
    borderWidth: 2,
    borderColor: "#0C0A1F",
  },
  countBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerSub: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  headerNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  headerNoteText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },

  // ── COMMENTS
  commentsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 24,
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  dividerText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.3)",
  },

  // ── COMMENT ROW
  commentRow: {
    flexDirection: "row",
    gap: 12,
    position: "relative",
  },
  commentRowReply: {
    marginLeft: 28,
  },
  replySpine: {
    position: "absolute",
    left: -18,
    top: 12,
  },

  commentBubble: {
    borderRadius: 18,
    borderTopLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
    flexShrink: 1,
  },
  commentTime: {
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "600",
    flexShrink: 0,
  },
  menuTrigger: {
    marginLeft: "auto",
    padding: 4,
    borderRadius: 8,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },

  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingLeft: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    height: 26,
  },
  actionBtnLiked: {
    backgroundColor: "rgba(244,63,94,0.12)",
  },
  actionBtnText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
  },

  menu: {
    position: "absolute",
    top: 30,
    right: 0,
    minWidth: 140,
    padding: 4,
    borderRadius: 12,
    backgroundColor: "rgba(20,18,40,0.98)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    zIndex: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
  },
  menuItemTextDanger: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#FCA5A5",
  },

  // ── SKELETON
  skeletonRow: {
    flexDirection: "row",
    gap: 12,
  },
  skeletonAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  skeletonLineShort: {
    height: 11,
    width: 110,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  skeletonBubble: {
    height: 48,
    width: "82%",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  // ── EMPTY
  emptyWrap: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyIconWrap: {
    position: "relative",
    marginBottom: 20,
  },
  emptyIconGradient: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  emptySparkle: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  emptySub: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 19,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    maxWidth: 280,
    fontWeight: "500",
  },

  // ── COMPOSER
  composer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(10,8,24,0.7)",
    zIndex: 20,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    minHeight: 44,
    borderRadius: 20,
    borderWidth: 1,
    position: "relative",
    paddingRight: 40,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingRight: 44,
    fontSize: 13,
    lineHeight: 19,
    color: "#fff",
    minHeight: 44,
    maxHeight: 120,
  },
  emojiBtn: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  sendBtnOuter: {
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  sendBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnGradient: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  composerHintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingLeft: 46,
  },
  composerHint: {
    fontSize: 9,
    color: "rgba(255,255,255,0.28)",
    fontWeight: "500",
    flexShrink: 1,
  },
  composerCounter: {
    fontSize: 9,
    color: "rgba(255,255,255,0.28)",
    fontWeight: "700",
    marginLeft: 8,
  },

  // ── REPLY BANNER
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "rgba(99,102,241,0.12)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.25)",
    marginBottom: 10,
  },
  replyBannerText: {
    flex: 1,
    fontSize: 11,
    color: "rgba(196,181,253,0.95)",
    fontWeight: "600",
  },

  // ── SIGN IN PROMPT
  signInRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  signInIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  signInText: {
    flex: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
});

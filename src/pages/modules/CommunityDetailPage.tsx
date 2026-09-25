// src/pages/modules/CommunityDetailPage.tsx

import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  Image as RNImage,
} from "react-native";

import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";

import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Check,
  Copy,
  EyeOff,
  Flag,
  Heart,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  MoreVertical,
  Pencil,
  Send,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react-native";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import { Clipboard } from "@react-native-clipboard/clipboard";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

import {
  CommunityActions,
  CommunityComments,
  CommunityGallery,
  CommunityHashtags,
  CommunityHeader,
  CommunityLocation,
  CommunityMap,
  CommunityPoll,
  CommunityQuestion,
  CommunityShare,
  CommunityStatistics,
} from "@/features/community/components";

import {
  useCommunityAI,
  useCommunityBookmarks,
  useCommunityComments,
  useCommunityNotifications,
} from "@/features/community/hooks";

import { adaptCommunityPost } from "@/features/community/adapter";
import type { CommunityPost } from "@/features/community/types";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface CommunityDetailPageProps {
  id?: string;
  onBack?: () => void;
  onOpenProfile?: (userId: string) => void;
  onEdit?: (postId: string) => void;
}

type ReportReason =
  | "Spam"
  | "Contenu inapproprié"
  | "Harcèlement"
  | "Fausse information"
  | "Autre";

type CommunityMeta = {
  location?: string;
  latitude?: number;
  longitude?: number;
  pollOptions?: {
    _id: string;
    text: string;
    votes?: number;
  }[];
  eventDate?: string;
  eventLocation?: string;
  audience?: string;
  mood?: string;
  videos?: string[];
  audio?: string[];
  mentions?: string[];
  images?: string[];
  postType?: string;
};

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */

const T = {
  bg: "#07070C",
  sheet: "#0E0E14",
  card: "rgba(255,255,255,0.045)",
  cardUp: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.08)",
  borderUp: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.58)",
  faint: "rgba(255,255,255,0.32)",
  ghost: "rgba(255,255,255,0.18)",
  primary: "#8B5CF6",
  primarySoft: "#C4B5FD",
  danger: "#EF4444",
  success: "#10B981",
  amber: "#F59E0B",
  amberSoft: "#FCD34D",
  rose: "#FB7185",
} as const;

const SHARE_BASE_URL = "https://debrouille.pro";
const SCREEN_W = Dimensions.get("window").width;

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");

  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);

  return `rgba(${r},${g},${b},${a})`;
}

function buildShareUrl(postId: string): string {
  return `${SHARE_BASE_URL}/community/${postId}`;
}

/* ════════════════════════════════════════════════════════════════════════════
   ERROR BOUNDARY
   ════════════════════════════════════════════════════════════════════════════ */

class ErrorBoundary extends Component<
  {
    children: ReactNode;
    fallback: ReactNode;
    label?: string;
  },
  {
    hasError: boolean;
  }
> {
  state = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(`❌ ${this.props.label ?? "Section"} crashed:`, error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function SectionFallback({ label }: { label: string }) {
  return (
    <View style={styles.sectionFallback}>
      <Text style={styles.sectionFallbackText}>
        Impossible d'afficher cette section ({label})
      </Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ════════════════════════════════════════════════════════════════════════════ */

function Skeleton({
  style,
}: {
  style?: React.ComponentProps<typeof Animated.View>["style"];
}) {
  const opacity = useRef(new Animated.Value(0.28)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.65,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.28,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: "rgba(255,255,255,0.06)",
          borderRadius: 18,
          opacity,
        },
        style,
      ]}
    />
  );
}

function SheetBackdrop({ onPress }: { onPress: () => void }) {
  return <Pressable style={StyleSheet.absoluteFill} onPress={onPress} />;
}

function SheetHandle() {
  return <View style={styles.sheetHandle} />;
}

/* ════════════════════════════════════════════════════════════════════════════
   MENU MODAL
   ════════════════════════════════════════════════════════════════════════════ */

function MenuSheet({
  visible,
  onClose,
  canEdit,
  onEdit,
  onDelete,
  onCopyLink,
  onReport,
  onHide,
}: {
  visible: boolean;
  onClose: () => void;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
  onReport: () => void;
  onHide: () => void;
}) {
  const slide = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  const items: {
    icon: React.ElementType;
    label: string;
    color: string;
    onPress: () => void;
    destructive?: boolean;
  }[] = [
    ...(canEdit
      ? [
          {
            icon: Pencil,
            label: "Modifier",
            color: T.text,
            onPress: onEdit,
          },
        ]
      : []),

    {
      icon: LinkIcon,
      label: "Copier le lien",
      color: T.text,
      onPress: onCopyLink,
    },

    {
      icon: Flag,
      label: "Signaler",
      color: T.text,
      onPress: onReport,
    },

    {
      icon: EyeOff,
      label: "Masquer",
      color: T.text,
      onPress: onHide,
    },

    ...(canEdit
      ? [
          {
            icon: Trash2,
            label: "Supprimer",
            color: T.danger,
            onPress: onDelete,
            destructive: true,
          },
        ]
      : []),
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <SheetBackdrop onPress={onClose} />

        <Animated.View
          style={[
            styles.menuSheet,
            {
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 400],
                  }),
                },
              ],
            },
          ]}
        >
          <SheetHandle />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Options</Text>

            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={styles.sheetCloseBtn}
            >
              <X size={16} color="#fff" />
            </Pressable>
          </View>

          <View
            style={{
              gap: 4,
              paddingBottom: 12,
            }}
          >
            {items.map(({ icon: Icon, label, color, onPress, destructive }) => (
              <Pressable
                key={label}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.menuItem,
                  {
                    backgroundColor: pressed
                      ? "rgba(255,255,255,0.06)"
                      : "transparent",
                  },
                ]}
              >
                <View
                  style={[
                    styles.menuIcon,
                    {
                      backgroundColor: destructive
                        ? alpha(T.danger, 0.14)
                        : "rgba(255,255,255,0.05)",
                    },
                  ]}
                >
                  <Icon size={15} color={color} />
                </View>

                <Text
                  style={[
                    styles.menuLabel,
                    {
                      color: destructive ? T.danger : T.text,
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   REPORT MODAL
   ════════════════════════════════════════════════════════════════════════════ */

const REPORT_REASONS: ReportReason[] = [
  "Spam",
  "Contenu inapproprié",
  "Harcèlement",
  "Fausse information",
  "Autre",
];

function ReportSheet({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason) => void;
}) {
  const slide = useRef(new Animated.Value(1)).current;

  const [selected, setSelected] = useState<ReportReason | null>(null);

  useEffect(() => {
    if (visible) {
      setSelected(null);
    }

    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <SheetBackdrop onPress={onClose} />

        <Animated.View
          style={[
            styles.menuSheet,
            {
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 500],
                  }),
                },
              ],
            },
          ]}
        >
          <SheetHandle />

          <View style={styles.sheetHeader}>
            <View
              style={[
                styles.sheetHeaderIcon,
                {
                  backgroundColor: alpha(T.danger, 0.14),
                },
              ]}
            >
              <Flag size={15} color={T.danger} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Signaler ce post</Text>

              <Text style={styles.sheetSubtitle}>
                Pourquoi signales-tu ce contenu ?
              </Text>
            </View>
          </View>

          <View
            style={{
              gap: 6,
              paddingTop: 4,
            }}
          >
            {REPORT_REASONS.map((reason) => {
              const active = selected === reason;

              return (
                <Pressable
                  key={reason}
                  onPress={() => setSelected(reason)}
                  style={({ pressed }) => [
                    styles.reportRow,
                    {
                      backgroundColor: active
                        ? alpha(T.danger, 0.12)
                        : pressed
                          ? "rgba(255,255,255,0.05)"
                          : "transparent",
                      borderColor: active ? alpha(T.danger, 0.36) : T.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.reportRowText,
                      {
                        color: active ? T.danger : T.text,
                      },
                    ]}
                  >
                    {reason}
                  </Text>

                  <View
                    style={[
                      styles.radioOuter,
                      active && {
                        borderColor: T.danger,
                        backgroundColor: T.danger,
                      },
                    ]}
                  >
                    {active && <Check size={10} color="#fff" strokeWidth={3} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => selected && onSubmit(selected)}
            disabled={!selected}
            style={({ pressed }) => [
              styles.reportSubmit,
              {
                opacity: !selected ? 0.4 : pressed ? 0.85 : 1,
                transform: [
                  {
                    scale: pressed ? 0.98 : 1,
                  },
                ],
              },
            ]}
          >
            <Send size={15} color="#fff" />

            <Text style={styles.reportSubmitText}>Envoyer le signalement</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   AUTHOR HEADER FALLBACK
   ════════════════════════════════════════════════════════════════════════════ */

function AuthorSkeleton() {
  return (
    <View style={styles.authorSkeleton}>
      <Skeleton
        style={{
          width: 44,
          height: 44,
          borderRadius: 15,
        }}
      />

      <View
        style={{
          flex: 1,
          gap: 6,
        }}
      >
        <Skeleton
          style={{
            width: 140,
            height: 14,
            borderRadius: 7,
          }}
        />

        <Skeleton
          style={{
            width: 80,
            height: 10,
            borderRadius: 5,
          }}
        />
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════════════════════════════════ */

export default function CommunityDetailPage({
  id,
  onBack,
  onOpenProfile,
  onEdit,
}: CommunityDetailPageProps) {
  const router = useRouter();

  /*
   * Le parent peut fournir onBack.
   * Si le composant est monté directement par Expo Router,
   * on revient naturellement à la route précédente.
   */
  const handleBack = onBack ?? (() => router.back());

  /* ── États ───────────────────────────────────────────────────────────── */

  const [post, setPost] = useState<CommunityPost | null>(null);

  const [loading, setLoading] = useState(true);

  const [showComments, setShowComments] = useState(false);

  const [showShare, setShowShare] = useState(false);

  const [showReport, setShowReport] = useState(false);

  const [showMenu, setShowMenu] = useState(false);

  const [userReaction, setUserReaction] = useState<string | null>(null);

  const [reactions, setReactions] = useState<Record<string, number>>({});

  const [isFollowing, setIsFollowing] = useState(false);

  const entryAnim = useRef(new Animated.Value(0)).current;

  /* ── Queries / mutations ─────────────────────────────────────────────── */

  const publicationId = id as Id<"publications"> | undefined;

  const publication = useQuery(
    api.publications.getPublication,
    publicationId
      ? {
          id: publicationId,
        }
      : "skip",
  );

  const trackView = useMutation(api.publications.trackView);

  const likePost = useMutation(api.community.likePost);

  const bookmarkPost = useMutation(api.bookmarks.toggle);

  const deletePost = useMutation(api.community.deletePost);

  const votePoll = useMutation(api.community.votePoll);

  const { comments, addComment, addReply } = useCommunityComments(post?._id);

  const { addBookmark, removeBookmark } = useCommunityBookmarks();

  const { sendNotification } = useCommunityNotifications();

  const { moderateText } = useCommunityAI();

  /* ── Adapter publication ─────────────────────────────────────────────── */

  useEffect(() => {
    if (publication === undefined) {
      setLoading(true);
      return;
    }

    if (!publication) {
      setPost(null);
      setLoading(false);
      return;
    }

    try {
      const adapted = adaptCommunityPost(publication);

      setPost(adapted);

      setReactions({
        "❤️": adapted.likeCount || 0,
      });

      setUserReaction(adapted.likedByMe ? "❤️" : null);

      setLoading(false);

      trackView({
        publicationId: publication._id,
      }).catch(() => {
        /* silencieux */
      });
    } catch {
      setPost(null);
      setLoading(false);
    }
  }, [publication, trackView]);

  /* ── Animation d'entrée ──────────────────────────────────────────────── */

  useEffect(() => {
    if (!loading && post) {
      Animated.timing(entryAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, post, entryAnim]);

  /* ── Données dérivées ────────────────────────────────────────────────── */

  const canEdit = useMemo(() => {
    return false;
  }, []);

  const safeMeta = useMemo<CommunityMeta>(() => {
    const meta =
      (
        post as unknown as {
          meta?: CommunityMeta;
        }
      )?.meta ?? {};

    return {
      location: meta.location ?? "",

      latitude: meta.latitude,

      longitude: meta.longitude,

      pollOptions: meta.pollOptions ?? [],

      eventDate: meta.eventDate,

      eventLocation: meta.eventLocation ?? "",

      audience: meta.audience ?? "public",

      mood: meta.mood,

      videos: meta.videos ?? [],

      audio: meta.audio ?? [],

      mentions: meta.mentions ?? [],

      images: meta.images ?? [],

      postType: meta.postType ?? "text",
    };
  }, [post]);

  const images = useMemo(() => {
    if (!post) {
      return [];
    }

    return safeMeta.images && safeMeta.images.length > 0
      ? safeMeta.images
      : (post.images ?? []);
  }, [post, safeMeta.images]);

  /* ── Handlers ────────────────────────────────────────────────────────── */

  const handleLike = useCallback(async () => {
    if (!post) {
      return;
    }

    try {
      await likePost({
        publicationId: post._id,
      });

      setPost((prev) =>
        prev
          ? {
              ...prev,
              likedByMe: !prev.likedByMe,
              likeCount: prev.likedByMe
                ? prev.likeCount - 1
                : prev.likeCount + 1,
            }
          : prev,
      );

      setReactions((current) => ({
        ...current,
        "❤️": Math.max(0, (current["❤️"] ?? 0) + (post.likedByMe ? -1 : 1)),
      }));
    } catch {
      toast.error("Erreur lors du like");
    }
  }, [post, likePost]);

  const handleBookmark = useCallback(async () => {
    if (!post) {
      return;
    }

    try {
      await bookmarkPost({
        publicationId: post._id,
      });

      const wasBookmarked = post.bookmarkedByMe;

      setPost((prev) =>
        prev
          ? {
              ...prev,
              bookmarkedByMe: !prev.bookmarkedByMe,
            }
          : prev,
      );

      if (wasBookmarked) {
        removeBookmark(post._id);
        toast.success("Retiré des favoris");
      } else {
        addBookmark(post._id);
        toast.success("Ajouté aux favoris");
      }
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  }, [post, bookmarkPost, addBookmark, removeBookmark]);

  const handleShare = useCallback(() => {
    setShowShare(true);
  }, []);

  const handleReport = useCallback(() => {
    setShowMenu(false);
    setShowReport(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (!post) {
      return;
    }

    Alert.alert(
      "Supprimer ce post ?",
      "Cette action est définitive et ne peut pas être annulée.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePost({
                publicationId: post._id,
              });

              toast.success("Post supprimé");

              handleBack();
            } catch {
              toast.error("Erreur lors de la suppression");
            }
          },
        },
      ],
    );
  }, [post, deletePost, handleBack]);

  const handleCopyLink = useCallback(() => {
    if (!post) {
      return;
    }

    Clipboard.setString(buildShareUrl(post._id));

    toast.success("Lien copié");
    setShowMenu(false);
  }, [post]);

  const handleHide = useCallback(() => {
    toast.info("Post masqué");
    setShowMenu(false);
  }, []);

  const handleEdit = useCallback(() => {
    setShowMenu(false);

    if (!post) {
      return;
    }

    if (onEdit) {
      onEdit(post._id);
    } else {
      toast.info("Édition bientôt disponible");
    }
  }, [post, onEdit]);

  const handleComment = useCallback(
    async (text: string) => {
      if (!post) {
        return;
      }

      try {
        await addComment(text);

        toast.success("Commentaire ajouté");
      } catch {
        toast.error("Erreur lors de l'ajout du commentaire");
      }
    },
    [post, addComment],
  );

  const handleReply = useCallback(
    async (text: string, parentId: string) => {
      try {
        await addReply(text, parentId as Id<"comments">);

        toast.success("Réponse ajoutée");
      } catch {
        toast.error("Erreur lors de l'ajout de la réponse");
      }
    },
    [addReply],
  );

  const handleReportSubmit = useCallback(
    async (reason: ReportReason) => {
      if (!post) {
        return;
      }

      try {
        await moderateText(reason);

        await sendNotification({
          recipientId: post.authorId,
          type: "community",
          title: "Signalement de publication",
          body: reason,
          link: `/community/${post._id}`,
        });

        toast.success("Signalement envoyé");

        setShowReport(false);
      } catch {
        toast.error("Erreur lors du signalement");
      }
    },
    [post, moderateText, sendNotification],
  );

  const handleVote = useCallback(
    async (optionId: string) => {
      if (!post) {
        return;
      }

      try {
        await votePoll({
          publicationId: post._id,
          optionId,
        });

        toast.success("Vote enregistré");
      } catch {
        toast.error("Erreur lors du vote");
      }
    },
    [post, votePoll],
  );

  const handleReaction = useCallback(
    (emoji: string) => {
      if (!post) {
        return;
      }

      if (emoji === userReaction) {
        setUserReaction(null);

        setReactions((prev) => {
          const next = {
            ...prev,
          };

          if (next[emoji] && next[emoji] > 0) {
            next[emoji] -= 1;

            if (next[emoji] === 0) {
              delete next[emoji];
            }
          }

          return next;
        });

        void handleLike();
        return;
      }

      setUserReaction(emoji);

      setReactions((prev) => ({
        ...prev,
        [emoji]: (prev[emoji] || 0) + 1,
      }));

      if (!post.likedByMe) {
        void handleLike();
      }

      toast.success(`Réaction ${emoji} ajoutée`);
    },
    [post, userReaction, handleLike],
  );

  const handleFollow = useCallback(() => {
    setIsFollowing(true);

    toast.success("Tu suis maintenant cet auteur");
  }, []);

  const handleUnfollow = useCallback(() => {
    setIsFollowing(false);

    toast.info("Tu ne suis plus cet auteur");
  }, []);

  const handleAuthorClick = useCallback(
    (authorId: string) => {
      if (onOpenProfile) {
        onOpenProfile(authorId);
      } else {
        toast.info("Profil bientôt disponible");
      }
    },
    [onOpenProfile],
  );

  const handleNativeShare = useCallback(async () => {
    if (!post) {
      return;
    }

    try {
      await Share.share(
        {
          title: post.title ?? "Publication",

          message: `${post.title ?? "Publication"}\n${buildShareUrl(post._id)}`,

          url: buildShareUrl(post._id),
        },
        {
          dialogTitle: "Partager cette publication",
        },
      );
    } catch {
      toast.info("Partage annulé");
    }
  }, [post]);

  /* ── États de chargement ─────────────────────────────────────────────── */

  if (!id) {
    return (
      <View style={styles.root}>
        <Header onBack={handleBack} onMenu={() => {}} />

        <View style={styles.centerState}>
          <Text style={styles.centerStateText}>
            Identifiant de publication manquant
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <Header onBack={handleBack} onMenu={() => {}} />

        <View style={styles.content}>
          <AuthorSkeleton />

          <Skeleton
            style={{
              height: 260,
              borderRadius: 22,
            }}
          />

          <Skeleton
            style={{
              height: 26,
              width: "75%",
              borderRadius: 12,
            }}
          />

          <Skeleton
            style={{
              height: 18,
              width: "50%",
              borderRadius: 10,
            }}
          />

          <Skeleton
            style={{
              height: 130,
              borderRadius: 18,
            }}
          />
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.root}>
        <Header onBack={handleBack} onMenu={() => {}} />

        <View style={styles.centerState}>
          <View style={styles.centerIcon}>
            <EyeOff size={28} color={T.faint} />
          </View>

          <Text style={styles.centerTitle}>Publication introuvable</Text>

          <Text style={styles.centerText}>
            Elle a peut-être été supprimée ou masquée.
          </Text>
        </View>
      </View>
    );
  }

  /* ── Rendu principal ─────────────────────────────────────────────────── */

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glow} />

      <Header onBack={handleBack} onMenu={() => setShowMenu(true)} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={{
            opacity: entryAnim,
            transform: [
              {
                translateY: entryAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
            gap: 18,
          }}
        >
          {/* Auteur */}

          <ErrorBoundary label="AuthorHeader" fallback={<AuthorSkeleton />}>
            <CommunityHeader
              authorId={post.authorId}
              authorName={post.authorName || "Anonyme"}
              authorAvatar={post.authorAvatar}
              createdAt={post._creationTime}
              isVerified={false}
              isFollowing={isFollowing}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
              onViewProfile={() => handleAuthorClick(post.authorId)}
            />
          </ErrorBoundary>

          {/* Galerie */}

          {images.length > 0 && (
            <ErrorBoundary
              label="Gallery"
              fallback={<SectionFallback label="Galerie" />}
            >
              <CommunityGallery images={images} title={post.title || "Post"} />
            </ErrorBoundary>
          )}

          {/* Titre + description */}

          <View style={{ gap: 10 }}>
            {!!post.title && <Text style={styles.postTitle}>{post.title}</Text>}

            {!!post.description && (
              <Text style={styles.postDescription}>{post.description}</Text>
            )}
          </View>

          {/* Tags */}

          {post.tags.length > 0 && (
            <ErrorBoundary
              label="Hashtags"
              fallback={<SectionFallback label="Tags" />}
            >
              <CommunityHashtags tags={post.tags} />
            </ErrorBoundary>
          )}

          {/* Localisation */}

          {!!safeMeta.location && (
            <ErrorBoundary
              label="Location"
              fallback={<SectionFallback label="Localisation" />}
            >
              <CommunityLocation location={safeMeta.location} />
            </ErrorBoundary>
          )}

          {/* Carte */}

          {safeMeta.latitude !== undefined &&
            safeMeta.longitude !== undefined && (
              <ErrorBoundary
                label="Map"
                fallback={<SectionFallback label="Carte" />}
              >
                <CommunityMap
                  latitude={safeMeta.latitude}
                  longitude={safeMeta.longitude}
                />
              </ErrorBoundary>
            )}

          {/* Événement */}

          {post.type === "evenement" && safeMeta.eventDate && (
            <View style={styles.eventCard}>
              <View style={styles.eventIcon}>
                <Calendar size={15} color={T.primarySoft} />
              </View>

              <View
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Text style={styles.eventLabel}>Événement</Text>

                <Text style={styles.eventDate}>
                  {new Date(safeMeta.eventDate).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </Text>

                {!!safeMeta.eventLocation && (
                  <View style={styles.eventLocationRow}>
                    <MapPin size={11} color={T.faint} />

                    <Text style={styles.eventLocationText} numberOfLines={1}>
                      {safeMeta.eventLocation}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Sondage */}

          {post.type === "poll" &&
            safeMeta.pollOptions &&
            safeMeta.pollOptions.length > 0 && (
              <ErrorBoundary
                label="Poll"
                fallback={<SectionFallback label="Sondage" />}
              >
                <CommunityPoll
                  options={safeMeta.pollOptions.map((option) => ({
                    id: option._id,
                    text: option.text,
                    votes: option.votes ?? 0,
                  }))}
                  votedOptionId={post.votedOptionId}
                  onVote={handleVote}
                />
              </ErrorBoundary>
            )}

          {/* Question */}

          {post.type === "question" && (
            <ErrorBoundary
              label="Question"
              fallback={<SectionFallback label="Question" />}
            >
              <CommunityQuestion
                question={post.title || "Question"}
                onAnswer={async () => {
                  toast.info("Réponse bientôt disponible");
                }}
              />
            </ErrorBoundary>
          )}

          {/* Statistiques */}

          <ErrorBoundary
            label="Statistics"
            fallback={<SectionFallback label="Statistiques" />}
          >
            <CommunityStatistics
              views={post.viewCount}
              likes={post.likeCount}
              comments={post.commentCount}
              shares={post.shareCount || 0}
              bookmarks={post.bookmarkCount || 0}
              onLikesClick={() => toast.info("Liste des likes à venir")}
              onCommentsClick={() => setShowComments((value) => !value)}
              onSharesClick={() => setShowShare(true)}
              onBookmarksClick={() => toast.info("Liste des favoris à venir")}
            />
          </ErrorBoundary>

          {/* Actions */}

          <ErrorBoundary
            label="Actions"
            fallback={<SectionFallback label="Actions" />}
          >
            <CommunityActions
              onLike={handleLike}
              onComment={() => setShowComments((value) => !value)}
              onShare={handleShare}
              onBookmark={handleBookmark}
              onReport={handleReport}
              onReaction={handleReaction}
              isLiked={post.likedByMe}
              isBookmarked={post.bookmarkedByMe}
              likeCount={post.likeCount}
              commentCount={post.commentCount}
              shareCount={post.shareCount || 0}
              reactions={reactions}
              userReaction={userReaction || undefined}
            />
          </ErrorBoundary>

          {/* Commentaires */}

          {showComments && (
            <ErrorBoundary
              label="Comments"
              fallback={<SectionFallback label="Commentaires" />}
            >
              <CommunityComments
                postId={post._id}
                comments={comments || []}
                onAddComment={handleComment}
                onReply={handleReply}
                onLikeComment={async () => {
                  toast.info("Like des commentaires bientôt disponible");
                }}
                onAuthorClick={handleAuthorClick}
              />
            </ErrorBoundary>
          )}
        </Animated.View>
      </ScrollView>

      {/* Barre d'actions rapides */}

      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleLike}
          style={({ pressed }) => [
            styles.bottomAction,
            {
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Heart
            size={18}
            color={post.likedByMe ? T.rose : T.dim}
            fill={post.likedByMe ? T.rose : "transparent"}
          />

          <Text
            style={[
              styles.bottomActionText,
              {
                color: post.likedByMe ? T.rose : T.dim,
              },
            ]}
          >
            {post.likeCount}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setShowComments((value) => !value)}
          style={({ pressed }) => [
            styles.bottomAction,
            {
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MessageCircle size={18} color={T.dim} />

          <Text style={styles.bottomActionText}>{post.commentCount}</Text>
        </Pressable>

        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [
            styles.bottomAction,
            {
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Share2 size={18} color={T.dim} />
        </Pressable>

        <Pressable
          onPress={handleBookmark}
          style={({ pressed }) => [
            styles.bottomAction,
            {
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Bookmark
            size={18}
            color={post.bookmarkedByMe ? T.primarySoft : T.dim}
            fill={post.bookmarkedByMe ? T.primarySoft : "transparent"}
          />
        </Pressable>
      </View>

      {/* Modales */}

      <MenuSheet
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        canEdit={canEdit}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCopyLink={handleCopyLink}
        onReport={handleReport}
        onHide={handleHide}
      />

      <ReportSheet
        visible={showReport}
        onClose={() => setShowReport(false)}
        onSubmit={handleReportSubmit}
      />

      {showShare && (
        <CommunityShare
          title={post.title || "Post"}
          description={post.description}
          url={buildShareUrl(post._id)}
          onClose={() => {
            setShowShare(false);
            void handleNativeShare();
          }}
        />
      )}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   HEADER
   ════════════════════════════════════════════════════════════════════════════ */

function Header({
  onBack,
  onMenu,
}: {
  onBack: () => void;
  onMenu: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.headerBtn,
          {
            transform: [
              {
                scale: pressed ? 0.92 : 1,
              },
            ],
          },
        ]}
        hitSlop={10}
      >
        <ArrowLeft size={19} color="#fff" />
      </Pressable>

      <View
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <Text style={styles.headerTitle}>Publication</Text>

        <Text style={styles.headerSubtitle}>Détail du post</Text>
      </View>

      <Pressable
        onPress={onMenu}
        style={({ pressed }) => [
          styles.headerBtn,
          {
            transform: [
              {
                scale: pressed ? 0.92 : 1,
              },
            ],
          },
        ]}
        hitSlop={10}
      >
        <MoreVertical size={19} color="#fff" />
      </Pressable>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },

  glow: {
    position: "absolute",
    top: -150,
    left: -80,
    right: -80,
    height: 320,
    borderRadius: 220,
    backgroundColor: alpha(T.primary, 0.1),
  },

  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },

  headerTitle: {
    color: T.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  headerSubtitle: {
    color: T.faint,
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
  },

  postTitle: {
    color: T.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 27,
  },

  postDescription: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
  },

  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: alpha(T.primary, 0.07),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.22),
  },

  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.16),
  },

  eventLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  eventDate: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "800",
    marginTop: 3,
    letterSpacing: -0.2,
  },

  eventLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },

  eventLocationText: {
    color: T.faint,
    fontSize: 11.5,
    fontWeight: "600",
    flex: 1,
  },

  sectionFallback: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: alpha(T.danger, 0.07),
    borderWidth: 1,
    borderColor: alpha(T.danger, 0.22),
  },

  sectionFallbackText: {
    color: alpha(T.danger, 0.85),
    fontSize: 12,
    fontWeight: "600",
  },

  authorSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 4,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 18,
    paddingHorizontal: 20,
    backgroundColor: "rgba(10,10,15,0.96)",
    borderTopWidth: 1,
    borderTopColor: T.border,
  },

  bottomAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  bottomActionText: {
    color: T.dim,
    fontSize: 12.5,
    fontWeight: "800",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },

  menuSheet: {
    backgroundColor: T.sheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: T.borderUp,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },

  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginTop: 10,
    marginBottom: 16,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  sheetHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  sheetTitle: {
    color: T.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  sheetSubtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: "600",
  },

  sheetCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
    borderRadius: 14,
  },

  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  menuLabel: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.border,
  },

  reportRowText: {
    fontSize: 13.5,
    fontWeight: "700",
    flex: 1,
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: T.borderUp,
    alignItems: "center",
    justifyContent: "center",
  },

  reportSubmit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 16,
    backgroundColor: T.danger,
    marginTop: 16,
    shadowColor: T.danger,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 6,
  },

  reportSubmitText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.1,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },

  centerStateText: {
    color: T.dim,
    fontSize: 13.5,
    fontWeight: "600",
    textAlign: "center",
  },

  centerIcon: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 6,
  },

  centerTitle: {
    color: T.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },

  centerText: {
    color: T.dim,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 300,
  },
});

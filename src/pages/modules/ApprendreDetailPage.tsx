// src/pages/modules/ApprendreDetailPage.tsx
import {
  ActivityIndicator,
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
  TextInput,
  View,
  Image as RNImage,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Heart,
  Info,
  Link2,
  Lock,
  MessageCircle,
  Pause,
  Play,
  Send,
  Share2,
  Star,
  ThumbsUp,
  Trophy,
  Users,
  X,
} from "lucide-react-native";
import { api } from "@/convex/_generated/api.js";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface ApprendreDetailPageProps {
  courseId: string;
  onBack: () => void;
  onOpenCourse?: (courseId: string) => void;
}

type Level = "Débutant" | "Intermédiaire" | "Avancé";
type Category = "Tech" | "Business" | "Agriculture" | "Santé" | "Langues";

type Chapter = {
  _id: string;
  title: string;
  duration: string;
  videoUrl?: string;
  resources?: { name: string; url: string; size?: string }[];
  completed: boolean;
  locked: boolean;
  order: number;
};

type Review = {
  _id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: number;
};

type Question = {
  _id: string;
  authorName: string;
  question: string;
  answer?: string;
  answeredBy?: string;
  createdAt: number;
};

type CourseDetail = {
  _id: string;
  title: string;
  description: string;
  longDescription?: string;
  category: Category;
  level: Level;
  duration: string;
  rating: number;
  enrollmentCount: number;
  coverImage?: string;
  instructorName: string;
  instructorBio?: string;
  instructorAvatar?: string;
  chapters: Chapter[];
  resources?: { name: string; url: string; size?: string }[];
  requirements?: string[];
  whatYouWillLearn?: string[];
  reviews?: Review[];
  questions?: Question[];
};

type TabId = "content" | "resources" | "reviews" | "qa";

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
  primary: "#F59E0B",
  primarySoft: "#FCD34D",
  success: "#10B981",
  danger: "#EF4444",
} as const;

const CATEGORY_COLORS: Record<string, string> = {
  Tech: "#8B5CF6",
  Business: "#F97316",
  Agriculture: "#22C55E",
  Santé: "#EF4444",
  Langues: "#06B6D4",
};

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1000&q=80";

const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;

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

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  return `il y a ${Math.floor(months / 12)} an${Math.floor(months / 12) > 1 ? "s" : ""}`;
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
          borderRadius: 16,
          opacity,
        },
        style,
      ]}
    />
  );
}

function ProgressBar({
  value,
  color,
  height = 6,
}: {
  value: number;
  color: string;
  height?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(100, Math.max(0, value)),
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [anim, value]);

  return (
    <View
      style={{
        height,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={{
          height: "100%",
          borderRadius: 999,
          backgroundColor: color,
          width: anim.interpolate({
            inputRange: [0, 100],
            outputRange: ["0%", "100%"],
          }),
        }}
      />
    </View>
  );
}

function RatingStars({ rating, size = 11 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <View style={{ flexDirection: "row", gap: 1 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={size}
          color={T.primarySoft}
          fill={
            i < full || (i === full && hasHalf) ? T.primarySoft : "transparent"
          }
        />
      ))}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   VIDEO PLAYER MODAL
   ════════════════════════════════════════════════════════════════════════════ */

function VideoPlayerModal({
  visible,
  chapter,
  courseColor,
  onClose,
  onComplete,
  onProgress,
}: {
  visible: boolean;
  chapter: Chapter | null;
  courseColor: string;
  onClose: () => void;
  onComplete: () => void;
  onProgress: (seconds: number) => void;
}) {
  const slide = useRef(new Animated.Value(1)).current;
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 280,
      useNativeDriver: true,
    }).start();

    if (!visible) {
      videoRef.current?.stopAsync().catch(() => {});
      setHasCompleted(false);
    }
  }, [visible, slide]);

  if (!chapter) return null;

  const isPlaying = status?.isLoaded && status.isPlaying;
  const durationSec = status?.isLoaded
    ? (status.durationMillis ?? 0) / 1000
    : 0;
  const positionSec = status?.isLoaded
    ? (status.positionMillis ?? 0) / 1000
    : 0;
  const progress = durationSec > 0 ? (positionSec / durationSec) * 100 : 0;

  const handleStatus = (s: AVPlaybackStatus) => {
    setStatus(s);
    if (s.isLoaded) {
      onProgress(s.positionMillis / 1000);
      // Marque comme complété à 90% de lecture
      if (
        !hasCompleted &&
        s.durationMillis &&
        s.positionMillis >= s.durationMillis * 0.9
      ) {
        setHasCompleted(true);
        onComplete();
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <Animated.View
        style={[
          styles.videoRoot,
          {
            transform: [
              {
                translateY: slide.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, SCREEN_H],
                }),
              },
            ],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.videoHeader}>
          <Pressable onPress={onClose} style={styles.videoBackBtn}>
            <ArrowLeft size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.videoHeaderEyebrow}>CHAPITRE</Text>
            <Text numberOfLines={1} style={styles.videoHeaderTitle}>
              {chapter.title}
            </Text>
          </View>
        </View>

        {/* Player */}
        <View style={styles.videoWrap}>
          {chapter.videoUrl ? (
            <Video
              ref={videoRef}
              source={{ uri: chapter.videoUrl }}
              style={styles.video}
              useNativeControls={false}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              onPlaybackStatusUpdate={handleStatus}
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Info size={28} color={T.faint} />
              <Text style={styles.videoPlaceholderText}>
                Vidéo en cours de préparation
              </Text>
            </View>
          )}

          {/* Play overlay */}
          {chapter.videoUrl && !isPlaying && (
            <Pressable
              onPress={() => videoRef.current?.playAsync()}
              style={styles.videoPlayOverlay}
            >
              <View
                style={[
                  styles.videoPlayBtn,
                  { backgroundColor: alpha(courseColor, 0.92) },
                ]}
              >
                <Play size={28} color="#fff" fill="#fff" />
              </View>
            </Pressable>
          )}
        </View>

        {/* Controls custom */}
        {chapter.videoUrl && (
          <View style={styles.videoControls}>
            <Pressable
              onPress={() =>
                isPlaying
                  ? videoRef.current?.pauseAsync()
                  : videoRef.current?.playAsync()
              }
              style={[
                styles.videoControlBtn,
                { backgroundColor: alpha(courseColor, 0.92) },
              ]}
            >
              {isPlaying ? (
                <Pause size={18} color="#fff" fill="#fff" />
              ) : (
                <Play size={18} color="#fff" fill="#fff" />
              )}
            </Pressable>

            <View style={{ flex: 1, gap: 6 }}>
              <View style={styles.videoProgressTrack}>
                <View
                  style={[
                    styles.videoProgressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: courseColor,
                    },
                  ]}
                />
              </View>
              <View style={styles.videoTimeRow}>
                <Text style={styles.videoTimeText}>
                  {Math.floor(positionSec / 60)}:
                  {String(Math.floor(positionSec % 60)).padStart(2, "0")}
                </Text>
                <Text style={styles.videoTimeText}>
                  {Math.floor(durationSec / 60)}:
                  {String(Math.floor(durationSec % 60)).padStart(2, "0")}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.videoFooter}>
          <View style={styles.videoFooterMeta}>
            <Clock size={12} color={T.faint} />
            <Text style={styles.videoFooterMetaText}>{chapter.duration}</Text>
            {hasCompleted && (
              <>
                <View style={styles.videoDot} />
                <CheckCircle2 size={12} color={T.success} />
                <Text
                  style={[styles.videoFooterMetaText, { color: T.success }]}
                >
                  Terminé
                </Text>
              </>
            )}
          </View>

          <Pressable
            onPress={() => {
              if (!chapter.completed) onComplete();
              onClose();
            }}
            style={({ pressed }) => [
              styles.videoCompleteBtn,
              {
                backgroundColor: courseColor,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            {chapter.completed ? (
              <Check size={15} color="#fff" />
            ) : (
              <CheckCircle2 size={15} color="#fff" />
            )}
            <Text style={styles.videoCompleteText}>
              {chapter.completed ? "Terminé" : "Marquer comme terminé"}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CERTIFICATE MODAL
   ════════════════════════════════════════════════════════════════════════════ */

function CertificateModal({
  visible,
  course,
  userName,
  onClose,
}: {
  visible: boolean;
  course: CourseDetail | null;
  userName: string;
  onClose: () => void;
}) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 70,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      scale.setValue(0.7);
      opacity.setValue(0);
      glow.setValue(0);
    }
  }, [visible, scale, opacity, glow]);

  if (!course) return null;

  const color = CATEGORY_COLORS[course.category] ?? T.primary;
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleShare = async () => {
    try {
      await Share.share(
        {
          title: "Mon certificat",
          message: `J'ai complété "${course.title}" sur Debrouille Pro 🎓`,
        },
        { dialogTitle: "Partager mon certificat" },
      );
    } catch {
      toast.info("Partage annulé");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.certBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[styles.certCard, { opacity, transform: [{ scale }] }]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.certGlow,
              {
                backgroundColor: color,
                opacity: glow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.14, 0.32],
                }),
              },
            ]}
          />

          <View style={styles.certHeader}>
            <View
              style={[
                styles.certTrophy,
                {
                  backgroundColor: alpha(color, 0.22),
                  borderColor: alpha(color, 0.5),
                },
              ]}
            >
              <Trophy size={40} color={color} />
            </View>
            <Text style={styles.certEyebrow}>FÉLICITATIONS !</Text>
            <Text style={styles.certTitle}>Certificat obtenu</Text>
          </View>

          <View style={styles.certBody}>
            <View style={styles.certPlaque}>
              <Award size={26} color={T.primarySoft} />
              <Text numberOfLines={2} style={styles.certCourseTitle}>
                {course.title}
              </Text>
              <Text style={styles.certRecipient}>
                {userName} — {today}
              </Text>
              <View style={styles.certStars}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    size={12}
                    color={T.primarySoft}
                    fill={T.primarySoft}
                  />
                ))}
              </View>
            </View>

            <Text style={styles.certDescription}>
              Ce certificat atteste que vous avez complété 100% du cours avec
              succès.
            </Text>

            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                styles.certShareBtn,
                {
                  backgroundColor: color,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Share2 size={15} color="#fff" />
              <Text style={styles.certShareText}>Partager le certificat</Text>
            </Pressable>

            <Pressable onPress={onClose} style={styles.certCloseBtn}>
              <Text style={styles.certCloseText}>Fermer</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CHAPTER ROW
   ════════════════════════════════════════════════════════════════════════════ */

function ChapterRow({
  chapter,
  index,
  color,
  onPlay,
}: {
  chapter: Chapter;
  index: number;
  color: string;
  onPlay: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const locked = chapter.locked;

  const handlePress = () => {
    if (locked) {
      toast.info("Termine le chapitre précédent pour débloquer");
      return;
    }
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.985,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    onPlay();
  };

  return (
    <Pressable onPress={handlePress} disabled={false}>
      <Animated.View
        style={[
          styles.chapterRow,
          {
            backgroundColor: chapter.completed
              ? alpha(color, 0.08)
              : "rgba(255,255,255,0.03)",
            borderColor: chapter.completed
              ? alpha(color, 0.22)
              : "rgba(255,255,255,0.05)",
            opacity: locked ? 0.5 : 1,
            transform: [{ scale }],
          },
        ]}
      >
        <View
          style={[
            styles.chapterIndex,
            {
              backgroundColor: chapter.completed
                ? alpha(color, 0.18)
                : "rgba(255,255,255,0.05)",
            },
          ]}
        >
          {locked ? (
            <Lock size={13} color={T.faint} />
          ) : chapter.completed ? (
            <CheckCircle2 size={15} color={color} />
          ) : (
            <Text style={styles.chapterIndexText}>{index + 1}</Text>
          )}
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={styles.chapterTitle}>
            {chapter.title}
          </Text>
          <View style={styles.chapterMeta}>
            <Clock size={9} color={T.faint} />
            <Text style={styles.chapterMetaText}>{chapter.duration}</Text>
            {chapter.resources && chapter.resources.length > 0 && (
              <>
                <View style={styles.chapterDot} />
                <FileText size={9} color={T.faint} />
                <Text style={styles.chapterMetaText}>
                  {chapter.resources.length} ressource
                  {chapter.resources.length > 1 ? "s" : ""}
                </Text>
              </>
            )}
          </View>
        </View>

        {!locked && (
          <View
            style={[
              styles.chapterPlayBtn,
              {
                backgroundColor: chapter.completed
                  ? alpha(color, 0.18)
                  : "rgba(255,255,255,0.06)",
              },
            ]}
          >
            {chapter.completed ? (
              <Check size={13} color={color} />
            ) : (
              <Play size={12} color={T.text} fill={T.text} />
            )}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   REVIEW CARD
   ════════════════════════════════════════════════════════════════════════════ */

function ReviewCard({ review }: { review: Review }) {
  const [liked, setLiked] = useState(false);
  const initial = review.authorName.charAt(0).toUpperCase();

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.reviewAuthor} numberOfLines={1}>
            {review.authorName}
          </Text>
          <View style={styles.reviewMeta}>
            <RatingStars rating={review.rating} size={10} />
            <Text style={styles.reviewDate}>{timeAgo(review.createdAt)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.reviewComment}>{review.comment}</Text>

      <Pressable
        onPress={() => setLiked((v) => !v)}
        style={styles.reviewLikeBtn}
        hitSlop={8}
      >
        <ThumbsUp
          size={12}
          color={liked ? T.primarySoft : T.faint}
          fill={liked ? T.primarySoft : "transparent"}
        />
        <Text
          style={{
            color: liked ? T.primarySoft : T.faint,
            fontSize: 11,
            fontWeight: "700",
          }}
        >
          Utile
        </Text>
      </Pressable>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   QUESTION CARD
   ════════════════════════════════════════════════════════════════════════════ */

function QuestionCard({ question }: { question: Question }) {
  return (
    <View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <MessageCircle size={13} color={T.primarySoft} />
        <Text style={styles.questionAuthor} numberOfLines={1}>
          {question.authorName}
        </Text>
        <Text style={styles.questionDate}>{timeAgo(question.createdAt)}</Text>
      </View>

      <Text style={styles.questionText}>{question.question}</Text>

      {question.answer && (
        <View style={styles.answerBox}>
          <View style={styles.answerHeader}>
            <CheckCircle2 size={12} color={T.success} />
            <Text style={styles.answerAuthor}>
              {question.answeredBy ?? "Instructeur"}
            </Text>
          </View>
          <Text style={styles.answerText}>{question.answer}</Text>
        </View>
      )}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════════════════ */

export default function ApprendreDetailPage({
  courseId,
  onBack,
  onOpenCourse,
}: ApprendreDetailPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>("content");
  const [playingChapter, setPlayingChapter] = useState<Chapter | null>(null);
  const [showCert, setShowCert] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [postingQuestion, setPostingQuestion] = useState(false);

  /* Queries */
  const course = useQuery(api.education.getCourseDetail, {
    courseId: courseId as Id<"courses">,
  }) as CourseDetail | undefined;

  const enrollment = useQuery(api.education.getMyEnrollment, {
    courseId: courseId as Id<"courses">,
  });

  const relatedCourses = useQuery(api.education.getRelatedCourses, {
    courseId: courseId as Id<"courses">,
  });

  /* Mutations */
  const enrollInCourse = useMutation(api.education.enrollInCourse);
  const completeChapter = useMutation(api.education.completeChapter);
  const updateProgress = useMutation(api.education.updateChapterProgress);
  const askQuestion = useMutation(api.education.askCourseQuestion);

  /* Dérivés */
  const progress = enrollment?.progressPct ?? 0;
  const isEnrolled = !!enrollment;
  const isCompleted = progress >= 100;

  const color = useMemo(
    () => CATEGORY_COLORS[course?.category ?? ""] ?? T.primary,
    [course?.category],
  );

  const completedChapters = useMemo(
    () => course?.chapters?.filter((c) => c.completed).length ?? 0,
    [course?.chapters],
  );

  /* Handlers */
  const handleEnroll = async () => {
    try {
      await enrollInCourse({ courseId: courseId as Id<"courses"> });
      toast.success("Inscription réussie !");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data.message ?? "Erreur lors de l'inscription");
      } else {
        toast.error("Erreur lors de l'inscription");
      }
    }
  };

  const handleCompleteChapter = async (chapterId: string) => {
    try {
      await completeChapter({
        courseId: courseId as Id<"courses">,
        chapterId: chapterId as Id<"courseChapters">,
      });
      toast.success("Chapitre terminé");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleChapterProgress = useCallback(
    (chapterId: string, seconds: number) => {
      updateProgress({
        courseId: courseId as Id<"courses">,
        chapterId: chapterId as Id<"courseChapters">,
        seconds: Math.floor(seconds),
      }).catch(() => {
        /* silencieux */
      });
    },
    [courseId, updateProgress],
  );

  const handleShare = async () => {
    if (!course) return;
    try {
      await Share.share(
        {
          title: course.title,
          message: `Découvre "${course.title}" sur Debrouille Pro\nhttps://debrouille.pro/cours/${course._id}`,
        },
        { dialogTitle: "Partager ce cours" },
      );
    } catch {
      toast.info("Partage annulé");
    }
  };

  const handleAskQuestion = async () => {
    const q = newQuestion.trim();
    if (q.length < 4) {
      toast.error("Ta question est trop courte");
      return;
    }
    setPostingQuestion(true);
    try {
      await askQuestion({
        courseId: courseId as Id<"courses">,
        question: q,
      });
      setNewQuestion("");
      toast.success("Question envoyée !");
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setPostingQuestion(false);
    }
  };

  /* ── États de chargement ──────────────────────────────────────────── */
  if (course === undefined) {
    return (
      <View style={styles.root}>
        <View style={styles.loadingHeader}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={17} color={T.text} />
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          <Skeleton style={{ height: 240, borderRadius: 24 }} />
          <Skeleton style={{ height: 32, width: "80%" }} />
          <Skeleton style={{ height: 20, width: "60%" }} />
          <Skeleton style={{ height: 120, borderRadius: 20 }} />
          <Skeleton style={{ height: 80, borderRadius: 18 }} />
          <Skeleton style={{ height: 80, borderRadius: 18 }} />
        </View>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.root}>
        <View style={styles.loadingHeader}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={17} color={T.text} />
          </Pressable>
        </View>
        <View style={styles.centerState}>
          <View style={styles.centerIcon}>
            <BookOpen size={28} color={T.faint} />
          </View>
          <Text style={styles.centerTitle}>Cours introuvable</Text>
          <Text style={styles.centerText}>
            Ce cours a peut-être été retiré. Découvre d'autres formations dans
            la liste.
          </Text>
        </View>
      </View>
    );
  }

  /* ── Rendu principal ──────────────────────────────────────────────── */
  const chapters = course.chapters ?? [];
  const resources = course.resources ?? [];
  const reviews = course.reviews ?? [];
  const questions = course.questions ?? [];

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "content", label: "Contenu", count: chapters.length },
    { id: "resources", label: "Ressources", count: resources.length },
    { id: "reviews", label: "Avis", count: reviews.length },
    { id: "qa", label: "Q&R", count: questions.length },
  ];

  return (
    <View style={styles.root}>
      <View
        pointerEvents="none"
        style={[styles.glow, { backgroundColor: alpha(color, 0.1) }]}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HERO */}
        <View style={styles.hero}>
          <RNImage
            source={{ uri: course.coverImage || FALLBACK_COVER }}
            style={styles.heroImage}
            accessibilityLabel={course.title}
          />
          <View pointerEvents="none" style={styles.heroOverlay} />

          <Pressable onPress={onBack} style={styles.heroBackBtn}>
            <ArrowLeft size={17} color="#fff" />
          </Pressable>

          <View style={styles.heroActions}>
            <Pressable onPress={handleShare} style={styles.heroActionBtn}>
              <Share2 size={15} color="#fff" />
            </Pressable>
            {isCompleted && (
              <Pressable
                onPress={() => setShowCert(true)}
                style={[
                  styles.heroActionBtn,
                  { borderColor: alpha(T.primary, 0.5) },
                ]}
              >
                <Trophy size={15} color={T.primarySoft} />
              </Pressable>
            )}
          </View>

          <View style={styles.heroBottom}>
            <View
              style={[
                styles.heroCategory,
                { backgroundColor: alpha(color, 0.92) },
              ]}
            >
              <Text style={styles.heroCategoryText}>{course.category}</Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={3}>
              {course.title}
            </Text>
            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <Star size={11} color={T.primarySoft} fill={T.primarySoft} />
                <Text style={styles.heroMetaText}>
                  {course.rating.toFixed(1)}
                </Text>
              </View>
              <View style={styles.heroMetaDot} />
              <View style={styles.heroMetaItem}>
                <Users size={11} color="rgba(255,255,255,0.72)" />
                <Text style={styles.heroMetaText}>
                  {formatNumber(course.enrollmentCount)}
                </Text>
              </View>
              <View style={styles.heroMetaDot} />
              <View style={styles.heroMetaItem}>
                <Clock size={11} color="rgba(255,255,255,0.72)" />
                <Text style={styles.heroMetaText}>{course.duration}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* BODY */}
        <View style={styles.body}>
          {/* Progress card */}
          {isEnrolled && (
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Ta progression</Text>
                <Text style={[styles.progressValue, { color }]}>
                  {progress}%
                </Text>
              </View>
              <ProgressBar value={progress} color={color} />
              <Text style={styles.progressFoot}>
                {completedChapters}/{chapters.length} chapitres terminés
              </Text>
            </View>
          )}

          {/* Instructor */}
          <View style={styles.instructorCard}>
            <View
              style={[
                styles.instructorAvatar,
                { backgroundColor: alpha(color, 0.18) },
              ]}
            >
              {course.instructorAvatar ? (
                <RNImage
                  source={{ uri: course.instructorAvatar }}
                  style={styles.instructorAvatarImg}
                />
              ) : (
                <Text style={[styles.instructorInitial, { color }]}>
                  {course.instructorName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.instructorLabel}>INSTRUCTEUR</Text>
              <Text style={styles.instructorName} numberOfLines={1}>
                {course.instructorName}
              </Text>
              {course.instructorBio && (
                <Text style={styles.instructorBio} numberOfLines={2}>
                  {course.instructorBio}
                </Text>
              )}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>À propos du cours</Text>
            <Text style={styles.description}>
              {course.longDescription || course.description}
            </Text>
          </View>

          {/* Ce que tu vas apprendre */}
          {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ce que tu vas apprendre</Text>
              <View style={{ gap: 8, marginTop: 10 }}>
                {course.whatYouWillLearn.map((item, i) => (
                  <View key={i} style={styles.learningRow}>
                    <View
                      style={[
                        styles.learningIcon,
                        { backgroundColor: alpha(color, 0.15) },
                      ]}
                    >
                      <Check size={11} color={color} strokeWidth={3} />
                    </View>
                    <Text style={styles.learningText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Prérequis */}
          {course.requirements && course.requirements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Prérequis</Text>
              <View style={{ gap: 6, marginTop: 10 }}>
                {course.requirements.map((req, i) => (
                  <View key={i} style={styles.requirementRow}>
                    <View style={styles.requirementDot} />
                    <Text style={styles.requirementText}>{req}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tabs */}
          <View style={styles.tabsRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 20 }}
              style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
            >
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    style={({ pressed }) => [
                      styles.tab,
                      {
                        backgroundColor: active
                          ? alpha(color, 0.16)
                          : "rgba(255,255,255,0.05)",
                        borderColor: active ? alpha(color, 0.42) : T.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? color : T.dim,
                        fontSize: 12.5,
                        fontWeight: active ? "900" : "700",
                      }}
                    >
                      {tab.label}
                    </Text>
                    {typeof tab.count === "number" && tab.count > 0 && (
                      <View
                        style={[
                          styles.tabCount,
                          {
                            backgroundColor: active
                              ? alpha(color, 0.3)
                              : "rgba(255,255,255,0.1)",
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: active ? color : T.faint,
                            fontSize: 10,
                            fontWeight: "900",
                          }}
                        >
                          {tab.count}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Tab: CONTENT */}
          {activeTab === "content" && (
            <View style={{ gap: 8 }}>
              {chapters.length === 0 ? (
                <View style={styles.emptySection}>
                  <Info size={24} color={T.faint} />
                  <Text style={styles.emptySectionTitle}>
                    Chapitres en préparation
                  </Text>
                  <Text style={styles.emptySectionText}>
                    Le contenu détaillé sera bientôt disponible.
                  </Text>
                </View>
              ) : (
                chapters.map((ch, i) => (
                  <ChapterRow
                    key={ch._id}
                    chapter={ch}
                    index={i}
                    color={color}
                    onPlay={() => setPlayingChapter(ch)}
                  />
                ))
              )}
            </View>
          )}

          {/* Tab: RESOURCES */}
          {activeTab === "resources" && (
            <View style={{ gap: 10 }}>
              {resources.length === 0 ? (
                <View style={styles.emptySection}>
                  <Download size={24} color={T.faint} />
                  <Text style={styles.emptySectionTitle}>Aucune ressource</Text>
                  <Text style={styles.emptySectionText}>
                    Les documents et liens apparaîtront ici.
                  </Text>
                </View>
              ) : (
                resources.map((r, i) => (
                  <Pressable
                    key={i}
                    onPress={() =>
                      toast.info("Ouverture du document bientôt disponible")
                    }
                    style={({ pressed }) => [
                      styles.resourceRow,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.resourceIcon,
                        { backgroundColor: alpha(color, 0.15) },
                      ]}
                    >
                      <FileText size={15} color={color} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={styles.resourceName}>
                        {r.name}
                      </Text>
                      {r.size && (
                        <Text style={styles.resourceSize}>{r.size}</Text>
                      )}
                    </View>
                    <Download size={14} color={T.faint} />
                  </Pressable>
                ))
              )}
            </View>
          )}

          {/* Tab: REVIEWS */}
          {activeTab === "reviews" && (
            <View style={{ gap: 10 }}>
              {reviews.length === 0 ? (
                <View style={styles.emptySection}>
                  <Star size={24} color={T.faint} />
                  <Text style={styles.emptySectionTitle}>
                    Aucun avis pour l'instant
                  </Text>
                  <Text style={styles.emptySectionText}>
                    Sois le premier à donner ton retour sur ce cours.
                  </Text>
                </View>
              ) : (
                reviews.map((r) => <ReviewCard key={r._id} review={r} />)
              )}
            </View>
          )}

          {/* Tab: QA */}
          {activeTab === "qa" && (
            <View style={{ gap: 12 }}>
              {/* Formulaire de question */}
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
              >
                <View style={styles.askBox}>
                  <TextInput
                    value={newQuestion}
                    onChangeText={setNewQuestion}
                    placeholder="Pose une question à l'instructeur…"
                    placeholderTextColor={T.faint}
                    multiline
                    textAlignVertical="top"
                    maxLength={400}
                    style={styles.askInput}
                  />
                  <View style={styles.askFooter}>
                    <Text style={styles.askCounter}>
                      {newQuestion.trim().length}/400
                    </Text>
                    <Pressable
                      onPress={handleAskQuestion}
                      disabled={
                        postingQuestion || newQuestion.trim().length < 4
                      }
                      style={({ pressed }) => [
                        styles.askBtn,
                        {
                          backgroundColor: color,
                          opacity:
                            postingQuestion || newQuestion.trim().length < 4
                              ? 0.4
                              : pressed
                                ? 0.85
                                : 1,
                        },
                      ]}
                    >
                      {postingQuestion ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Send size={13} color="#fff" />
                      )}
                      <Text style={styles.askBtnText}>Envoyer</Text>
                    </Pressable>
                  </View>
                </View>
              </KeyboardAvoidingView>

              {questions.length === 0 ? (
                <View style={styles.emptySection}>
                  <MessageCircle size={24} color={T.faint} />
                  <Text style={styles.emptySectionTitle}>Aucune question</Text>
                  <Text style={styles.emptySectionText}>
                    Pose la première question sur ce cours.
                  </Text>
                </View>
              ) : (
                questions.map((q) => <QuestionCard key={q._id} question={q} />)
              )}
            </View>
          )}

          {/* Related courses */}
          {relatedCourses && relatedCourses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cours similaires</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  gap: 12,
                  paddingTop: 12,
                  paddingRight: 20,
                }}
                style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
              >
                {relatedCourses.map((rc) => {
                  const rcColor = CATEGORY_COLORS[rc.category] ?? T.primary;
                  return (
                    <Pressable
                      key={rc._id}
                      onPress={() =>
                        onOpenCourse?.(rc._id as string) ??
                        toast.info("Cours bientôt disponible")
                      }
                      style={({ pressed }) => [
                        styles.relatedCard,
                        { opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <RNImage
                        source={{ uri: rc.coverImage || FALLBACK_COVER }}
                        style={styles.relatedImage}
                      />
                      <View style={styles.relatedBody}>
                        <View
                          style={[
                            styles.relatedDot,
                            { backgroundColor: rcColor },
                          ]}
                        />
                        <Text numberOfLines={2} style={styles.relatedTitle}>
                          {rc.title}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={styles.relatedInstructor}
                        >
                          {rc.instructorName}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FOOTER STICKY */}
      <View style={styles.footer}>
        {!isEnrolled ? (
          <Pressable
            onPress={handleEnroll}
            style={({ pressed }) => [
              styles.footerCta,
              {
                backgroundColor: color,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <BookOpen size={16} color="#fff" />
            <Text style={styles.footerCtaText}>S'inscrire au cours</Text>
          </Pressable>
        ) : isCompleted ? (
          <Pressable
            onPress={() => setShowCert(true)}
            style={({ pressed }) => [
              styles.footerCta,
              {
                backgroundColor: T.primary,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Trophy size={16} color="#fff" />
            <Text style={styles.footerCtaText}>Voir mon certificat</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              const next = chapters.find((c) => !c.completed && !c.locked);
              if (next) setPlayingChapter(next);
              else toast.info("Choisis un chapitre ci-dessus");
            }}
            style={({ pressed }) => [
              styles.footerCta,
              {
                backgroundColor: color,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Play size={16} color="#fff" fill="#fff" />
            <Text style={styles.footerCtaText}>Reprendre le cours</Text>
          </Pressable>
        )}
      </View>

      {/* Modals */}
      <VideoPlayerModal
        visible={playingChapter !== null}
        chapter={playingChapter}
        courseColor={color}
        onClose={() => setPlayingChapter(null)}
        onComplete={() => {
          if (playingChapter) handleCompleteChapter(playingChapter._id);
        }}
        onProgress={(sec) => {
          if (playingChapter) handleChapterProgress(playingChapter._id, sec);
        }}
      />

      <CertificateModal
        visible={showCert}
        course={course}
        userName="Utilisateur"
        onClose={() => setShowCert(false)}
      />
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  glow: {
    position: "absolute",
    top: -140,
    left: -80,
    right: -80,
    height: 320,
    borderRadius: 220,
  },

  /* Loading & center states */
  loadingHeader: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
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
  },
  centerTitle: {
    color: T.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  centerText: {
    color: T.dim,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 300,
  },

  /* Hero */
  hero: { position: "relative", height: 320 },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  heroBackBtn: {
    position: "absolute",
    top: 56,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  heroActions: {
    position: "absolute",
    top: 56,
    right: 20,
    flexDirection: "row",
    gap: 8,
  },
  heroActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  heroBottom: { position: "absolute", left: 20, right: 20, bottom: 22 },
  heroCategory: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  heroCategoryText: {
    color: "#fff",
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.7,
    lineHeight: 31,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  heroMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroMetaText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 11.5,
    fontWeight: "800",
  },
  heroMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
  },

  /* Body */
  body: {
    paddingHorizontal: 20,
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: T.bg,
    paddingTop: 24,
    gap: 22,
  },

  /* Progress card */
  progressCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    gap: 10,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: T.dim,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  progressValue: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  progressFoot: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },

  /* Instructor */
  instructorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  instructorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  instructorAvatarImg: { width: "100%", height: "100%" },
  instructorInitial: { fontSize: 20, fontWeight: "900" },
  instructorLabel: {
    color: T.faint,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  instructorName: {
    color: T.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
    letterSpacing: -0.2,
  },
  instructorBio: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 4,
    lineHeight: 16,
    fontWeight: "600",
  },

  /* Section */
  section: { gap: 10 },
  sectionTitle: {
    color: T.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  description: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13.5,
    lineHeight: 21,
  },

  /* Learning list */
  learningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  learningIcon: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  learningText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
    fontWeight: "600",
  },

  /* Requirements */
  requirementRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  requirementDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: T.faint,
    marginTop: 8,
  },
  requirementText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12.5,
    lineHeight: 19,
    flex: 1,
    fontWeight: "600",
  },

  /* Tabs */
  tabsRow: { marginTop: 4 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    minWidth: 20,
    alignItems: "center",
  },

  /* Chapter row */
  chapterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  chapterIndex: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterIndexText: {
    color: T.dim,
    fontSize: 12,
    fontWeight: "900",
  },
  chapterTitle: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "700",
  },
  chapterMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  chapterMetaText: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "600",
  },
  chapterDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: T.faint,
    marginHorizontal: 4,
  },
  chapterPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Resource row */
  resourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  resourceName: {
    color: T.text,
    fontSize: 13,
    fontWeight: "700",
  },
  resourceSize: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },

  /* Review card */
  reviewCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    gap: 10,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.16),
  },
  reviewAvatarText: {
    color: T.primarySoft,
    fontSize: 14,
    fontWeight: "900",
  },
  reviewAuthor: {
    color: T.text,
    fontSize: 13,
    fontWeight: "800",
  },
  reviewMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  reviewDate: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "600",
  },
  reviewComment: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12.5,
    lineHeight: 19,
  },
  reviewLikeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
  },

  /* Question card */
  questionCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    gap: 10,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  questionAuthor: {
    color: T.text,
    fontSize: 12.5,
    fontWeight: "800",
    flex: 1,
  },
  questionDate: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "600",
  },
  questionText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  answerBox: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: alpha(T.success, 0.07),
    borderLeftWidth: 2,
    borderLeftColor: T.success,
    gap: 6,
  },
  answerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  answerAuthor: {
    color: T.success,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  answerText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12.5,
    lineHeight: 18,
  },

  /* Ask box */
  askBox: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    gap: 12,
  },
  askInput: {
    color: T.text,
    fontSize: 13.5,
    minHeight: 68,
    padding: 0,
  },
  askFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  askCounter: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "600",
  },
  askBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  askBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: -0.1,
  },

  /* Empty section */
  emptySection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: T.border,
  },
  emptySectionTitle: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "800",
  },
  emptySectionText: {
    color: T.faint,
    fontSize: 11.5,
    textAlign: "center",
    lineHeight: 17,
    maxWidth: 240,
  },

  /* Related */
  relatedCard: {
    width: 200,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  relatedImage: { width: "100%", height: 100 },
  relatedBody: { padding: 12, gap: 6 },
  relatedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  relatedTitle: {
    color: T.text,
    fontSize: 12.5,
    fontWeight: "800",
    lineHeight: 17,
  },
  relatedInstructor: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "600",
  },

  /* Footer */
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 34 : 22,
    backgroundColor: "rgba(10,10,15,0.96)",
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  footerCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    height: 52,
    borderRadius: 18,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  footerCtaText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.1,
  },

  /* Video player modal */
  videoRoot: { flex: 1, backgroundColor: "#000" },
  videoHeader: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  videoBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  videoHeaderEyebrow: {
    color: T.faint,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1,
  },
  videoHeaderTitle: {
    color: T.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginTop: 3,
  },
  videoWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  video: { width: "100%", height: "100%" },
  videoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  videoPlaceholderText: {
    color: T.faint,
    fontSize: 13,
    fontWeight: "700",
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  videoPlayBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  videoControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  videoControlBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  videoProgressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  videoProgressFill: { height: "100%" },
  videoTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  videoTimeText: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "700",
  },
  videoFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    backgroundColor: "rgba(10,10,15,0.92)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    gap: 14,
  },
  videoFooterMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  videoFooterMetaText: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "700",
  },
  videoDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: T.faint,
  },
  videoCompleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 16,
  },
  videoCompleteText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.1,
  },

  /* Certificate modal */
  certBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  certCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 28,
    backgroundColor: T.sheet,
    borderWidth: 1,
    borderColor: T.borderUp,
    overflow: "hidden",
  },
  certGlow: {
    position: "absolute",
    top: -80,
    left: -40,
    right: -40,
    height: 200,
    borderRadius: 200,
  },
  certHeader: {
    paddingTop: 32,
    paddingBottom: 20,
    alignItems: "center",
    gap: 10,
  },
  certTrophy: {
    width: 88,
    height: 88,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginBottom: 6,
  },
  certEyebrow: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 2,
  },
  certTitle: {
    color: T.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  certBody: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: "center",
    gap: 14,
  },
  certPlaque: {
    width: "100%",
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    gap: 8,
  },
  certCourseTitle: {
    color: T.text,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 19,
  },
  certRecipient: {
    color: T.faint,
    fontSize: 11.5,
    fontWeight: "600",
    textAlign: "center",
  },
  certStars: { flexDirection: "row", gap: 3, marginTop: 2 },
  certDescription: {
    color: T.faint,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 17,
    maxWidth: 280,
  },
  certShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    width: "100%",
    borderRadius: 16,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  certShareText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.1,
  },
  certCloseBtn: { paddingVertical: 8 },
  certCloseText: {
    color: T.ghost,
    fontSize: 12,
    fontWeight: "700",
  },
});

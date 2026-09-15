// src/pages/modules/ApprendrePage.tsx
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image as RNImage,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Award,
  BarChart2,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  GraduationCap,
  Info,
  Lock,
  LogIn,
  Play,
  Search,
  Sparkles,
  Star,
  Trophy,
  X,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { SignInButton } from "@/components/ui/signin.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface ApprendrePageProps {
  onBack: () => void;
}

type Level = "Débutant" | "Intermédiaire" | "Avancé";
type Category = "Tech" | "Business" | "Agriculture" | "Santé" | "Langues";

type Chapter = {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
};

type Course = {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorAvatar?: string;
  category: Category;
  level: Level;
  duration: string;
  rating: number;
  students: number;
  progress: number;
  image: string;
  color: string;
  chapters: Chapter[];
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
  amber: "#F59E0B",
  amberSoft: "#FCD34D",
  success: "#10B981",
} as const;

const CATEGORY_COLORS: Record<string, string> = {
  Tech: "#8B5CF6",
  Business: "#F97316",
  Agriculture: "#22C55E",
  Santé: "#EF4444",
  Langues: "#06B6D4",
};

const LEVEL_MAP: Record<string, Level> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

const CATEGORIES: (Category | "Tous")[] = [
  "Tous",
  "Tech",
  "Business",
  "Agriculture",
  "Santé",
  "Langues",
];

const LEVELS: (Level | "Tous niveaux")[] = [
  "Tous niveaux",
  "Débutant",
  "Intermédiaire",
  "Avancé",
];

const DEFAULT_COURSE_IMAGE =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80";

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

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
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

function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon size={28} color={T.faint} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STAT CARD
   ════════════════════════════════════════════════════════════════════════════ */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor: alpha(color, 0.16) }]}>
      <View style={[styles.statIcon, { backgroundColor: alpha(color, 0.14) }]}>
        <Icon size={15} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PROGRESS BAR (animée)
   ════════════════════════════════════════════════════════════════════════════ */

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

/* ════════════════════════════════════════════════════════════════════════════
   COURSE CARD
   ════════════════════════════════════════════════════════════════════════════ */

function CourseCard({
  course,
  onPress,
}: {
  course: Course;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
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
    onPress();
  };

  const isCompleted = course.progress === 100;
  const inProgress = course.progress > 0 && course.progress < 100;

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={styles.cardImageWrap}>
          <RNImage
            source={{ uri: course.image }}
            style={styles.cardImage}
            accessibilityLabel={course.title}
          />
          <View pointerEvents="none" style={styles.cardImageOverlay} />

          {/* Badge catégorie */}
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: alpha(course.color, 0.92) },
            ]}
          >
            <Text style={styles.categoryBadgeText}>{course.category}</Text>
          </View>

          {/* Badge complété */}
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Trophy size={10} color={T.amberSoft} />
              <Text style={styles.completedBadgeText}>Complété</Text>
            </View>
          )}

          {/* Progression en bas */}
          {inProgress && (
            <View style={styles.cardProgressTrack}>
              <View
                style={[
                  styles.cardProgressFill,
                  {
                    width: `${course.progress}%`,
                    backgroundColor: course.color,
                  },
                ]}
              />
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text numberOfLines={2} style={styles.cardTitle}>
            {course.title}
          </Text>
          <Text numberOfLines={1} style={styles.cardInstructor}>
            {course.instructor}
          </Text>

          <View style={styles.cardMetaRow}>
            <View style={styles.metaItem}>
              <Star size={10} color={T.amber} fill={T.amber} />
              <Text style={[styles.metaText, { color: T.amberSoft }]}>
                {course.rating.toFixed(1)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={10} color={T.faint} />
              <Text style={styles.metaText}>{course.duration}</Text>
            </View>
            <View style={styles.cardLevelPill}>
              <Text style={styles.cardLevelPillText}>{course.level}</Text>
            </View>
          </View>

          {inProgress && (
            <View style={styles.cardProgressRow}>
              <View style={{ flex: 1 }}>
                <ProgressBar
                  value={course.progress}
                  color={course.color}
                  height={5}
                />
              </View>
              <Text style={[styles.cardProgressText, { color: course.color }]}>
                {course.progress}%
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   CERTIFICATE MODAL — le chef-d'œuvre
   ════════════════════════════════════════════════════════════════════════════ */

function CertificateModal({
  visible,
  course,
  userName,
  onClose,
}: {
  visible: boolean;
  course: Course | null;
  userName: string;
  onClose: () => void;
}) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;

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

      // Effet lumineux pulsant
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(sparkle, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(sparkle, {
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
      sparkle.setValue(0);
    }
  }, [visible, scale, opacity, sparkle]);

  if (!course) return null;

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
          style={[
            styles.certCard,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          {/* Halo lumineux pulsant */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.certGlow,
              {
                backgroundColor: course.color,
                opacity: sparkle.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.15, 0.35],
                }),
              },
            ]}
          />

          <View style={styles.certHeader}>
            <Animated.View
              style={[
                styles.certTrophy,
                {
                  backgroundColor: alpha(course.color, 0.22),
                  borderColor: alpha(course.color, 0.5),
                },
              ]}
            >
              <Trophy size={38} color={course.color} />
            </Animated.View>
            <Text style={styles.certEyebrow}>FÉLICITATIONS !</Text>
            <Text style={styles.certTitle}>Certificat obtenu</Text>
          </View>

          <View style={styles.certBody}>
            <View style={styles.certPlaque}>
              <Award size={24} color={T.amberSoft} />
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
                    size={11}
                    color={T.amberSoft}
                    fill={T.amberSoft}
                  />
                ))}
              </View>
            </View>

            <Text style={styles.certDescription}>
              Ce certificat atteste que vous avez complété 100% du cours avec
              succès.
            </Text>

            <Pressable
              onPress={() => {
                toast.success("Certificat prêt à être partagé");
                onClose();
              }}
              style={({ pressed }) => [
                styles.certShareBtn,
                {
                  backgroundColor: course.color,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Award size={15} color="#fff" />
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
   COURSE DETAIL — plein écran
   ════════════════════════════════════════════════════════════════════════════ */

function CourseDetailModal({
  visible,
  course,
  isAuthenticated,
  onClose,
  onEnroll,
}: {
  visible: boolean;
  course: Course | null;
  isAuthenticated: boolean;
  onClose: () => void;
  onEnroll: (courseId: string) => void;
}) {
  const [showCert, setShowCert] = useState(false);
  const slide = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  if (!course) return null;

  const completedCount = course.chapters.filter((c) => c.completed).length;
  const isCompleted = course.progress === 100;

  return (
    <>
      <Modal
        visible={visible}
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
        presentationStyle="overFullScreen"
      >
        <Animated.View
          style={[
            styles.detailRoot,
            {
              transform: [
                {
                  translateX: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, SCREEN_W],
                  }),
                },
              ],
            },
          ]}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <View style={styles.detailHero}>
              <RNImage
                source={{ uri: course.image }}
                style={styles.detailHeroImage}
                accessibilityLabel={course.title}
              />
              <View pointerEvents="none" style={styles.detailHeroOverlay} />

              <Pressable onPress={onClose} style={styles.detailBackBtn}>
                <ArrowLeft size={17} color="#fff" />
              </Pressable>

              {isCompleted && (
                <Pressable
                  onPress={() => setShowCert(true)}
                  style={styles.detailCertBtn}
                >
                  <Trophy size={12} color={T.amberSoft} />
                  <Text style={styles.detailCertBtnText}>Certificat</Text>
                </Pressable>
              )}
            </View>

            {/* Contenu */}
            <View style={styles.detailBody}>
              {/* Chips meta */}
              <View style={styles.detailChips}>
                <View
                  style={[
                    styles.detailCategoryChip,
                    { backgroundColor: alpha(course.color, 0.16) },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailCategoryChipText,
                      { color: course.color },
                    ]}
                  >
                    {course.category}
                  </Text>
                </View>
                <View style={styles.detailLevelChip}>
                  <Text style={styles.detailLevelChipText}>{course.level}</Text>
                </View>
                <View style={styles.detailLevelChip}>
                  <Clock size={10} color={T.faint} />
                  <Text style={styles.detailLevelChipText}>
                    {course.duration}
                  </Text>
                </View>
              </View>

              <Text style={styles.detailTitle}>{course.title}</Text>
              <Text style={styles.detailDesc}>{course.description}</Text>

              {/* Instructeur */}
              <View style={styles.detailInstructorRow}>
                <View
                  style={[
                    styles.detailInstructorAvatar,
                    { backgroundColor: alpha(course.color, 0.18) },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailInstructorInitial,
                      { color: course.color },
                    ]}
                  >
                    {course.instructor.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.detailInstructorName} numberOfLines={1}>
                  {course.instructor}
                </Text>
                <View style={styles.detailRating}>
                  <Star size={11} color={T.amber} fill={T.amber} />
                  <Text style={styles.detailRatingText}>
                    {course.rating.toFixed(1)}
                  </Text>
                  <Text style={styles.detailStudents}>
                    ({formatNumber(course.students)})
                  </Text>
                </View>
              </View>

              {/* Progression */}
              <View style={styles.detailProgressCard}>
                <View style={styles.detailProgressHead}>
                  <Text style={styles.detailProgressLabel}>Progression</Text>
                  <Text
                    style={[
                      styles.detailProgressValue,
                      { color: course.color },
                    ]}
                  >
                    {course.progress}%
                  </Text>
                </View>
                <ProgressBar value={course.progress} color={course.color} />
                <Text style={styles.detailProgressFoot}>
                  {completedCount}/{course.chapters.length} chapitres terminés
                </Text>
              </View>

              {/* Chapitres */}
              <Text style={styles.detailSectionTitle}>Chapitres</Text>

              {course.chapters.length === 0 ? (
                <View style={styles.detailEmptyChapters}>
                  <Info size={22} color={T.faint} />
                  <Text style={styles.detailEmptyChaptersTitle}>
                    Cours en cours de création
                  </Text>
                  <Text style={styles.detailEmptyChaptersText}>
                    Le contenu détaillé sera bientôt disponible.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {course.chapters.map((ch, idx) => (
                    <View
                      key={ch.id}
                      style={[
                        styles.chapterRow,
                        {
                          backgroundColor: ch.completed
                            ? alpha(course.color, 0.08)
                            : "rgba(255,255,255,0.03)",
                          opacity: ch.locked ? 0.5 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.chapterIcon,
                          {
                            backgroundColor: ch.completed
                              ? alpha(course.color, 0.18)
                              : "rgba(255,255,255,0.05)",
                          },
                        ]}
                      >
                        {ch.locked ? (
                          <Lock size={13} color={T.faint} />
                        ) : ch.completed ? (
                          <CheckCircle2 size={15} color={course.color} />
                        ) : (
                          <Play size={13} color={T.dim} />
                        )}
                      </View>

                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={styles.chapterTitle}>
                          {idx + 1}. {ch.title}
                        </Text>
                        <View style={styles.chapterMeta}>
                          <Clock size={9} color={T.faint} />
                          <Text style={styles.chapterMetaText}>
                            {ch.duration}
                          </Text>
                        </View>
                      </View>

                      {!ch.locked && !ch.completed && (
                        <View
                          style={[
                            styles.chapterPlayBtn,
                            { backgroundColor: alpha(course.color, 0.18) },
                          ]}
                        >
                          <ChevronRight size={13} color={course.color} />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* CTA sticky */}
          {!isCompleted && (
            <View style={styles.detailFooter}>
              <Pressable
                onPress={() => onEnroll(course.id)}
                style={({ pressed }) => [
                  styles.detailCta,
                  {
                    backgroundColor: course.color,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                {!isAuthenticated ? (
                  <LogIn size={16} color="#fff" />
                ) : (
                  <Play size={16} color="#fff" />
                )}
                <Text style={styles.detailCtaText}>
                  {!isAuthenticated
                    ? "Se connecter pour commencer"
                    : course.progress > 0
                      ? "Continuer le cours"
                      : "Commencer le cours"}
                </Text>
              </Pressable>
            </View>
          )}

          {isCompleted && (
            <View style={styles.detailFooter}>
              <Pressable
                onPress={() => setShowCert(true)}
                style={({ pressed }) => [
                  styles.detailCta,
                  {
                    backgroundColor: T.amber,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <Trophy size={16} color="#fff" />
                <Text style={styles.detailCtaText}>Voir mon certificat</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </Modal>

      <CertificateModal
        visible={showCert}
        course={course}
        userName="Utilisateur"
        onClose={() => setShowCert(false)}
      />
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ════════════════════════════════════════════════════════════════════════════ */

export default function ApprendrePage({ onBack }: ApprendrePageProps) {
  const [selectedCat, setSelectedCat] = useState<Category | "Tous">("Tous");
  const [selectedLevel, setSelectedLevel] = useState<Level | "Tous niveaux">(
    "Tous niveaux",
  );
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /* Debounce */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* Queries */
  const dbCourses = useQuery(
    api.education.listPublishedCourses,
    selectedCat === "Tous" ? {} : { category: selectedCat },
  );
  const enrollments = useQuery(api.education.getMyEnrollments, {});
  const stats = useQuery(api.education.getEducationStats, {});

  const enrollInCourse = useMutation(api.education.enrollInCourse);

  /* Progress map */
  const progressMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of enrollments ?? []) {
      if (e && "courseId" in e && "progressPct" in e) {
        map.set(
          e.courseId as string,
          (e as unknown as { progressPct: number }).progressPct,
        );
      }
    }
    return map;
  }, [enrollments]);

  /* Mapping DB → Course */
  const courses: Course[] = useMemo(() => {
    if (!dbCourses) return [];
    return dbCourses.map((c) => {
      const cat = (
        CATEGORY_COLORS[c.category] ? c.category : "Tech"
      ) as Category;
      return {
        id: c._id as string,
        title: c.title,
        description: c.description,
        category: cat,
        level: LEVEL_MAP[c.level ?? "debutant"] ?? "Débutant",
        duration: c.duration ?? "—",
        rating: c.rating ?? 0,
        students: c.enrollmentCount ?? 0,
        progress: progressMap.get(c._id as string) ?? 0,
        image: c.coverImage || DEFAULT_COURSE_IMAGE,
        color: CATEGORY_COLORS[c.category] ?? "#8B5CF6",
        instructor: c.instructorName ?? "Instructeur",
        chapters: [],
      };
    });
  }, [dbCourses, progressMap]);

  /* Filtre local */
  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return courses.filter((c) => {
      const matchLevel =
        selectedLevel === "Tous niveaux" || c.level === selectedLevel;
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q);
      return matchLevel && matchSearch;
    });
  }, [courses, selectedLevel, debouncedSearch]);

  const inProgress = useMemo(
    () => courses.filter((c) => c.progress > 0 && c.progress < 100),
    [courses],
  );

  const completedCount = stats?.certificates ?? 0;
  const enrolledCount = stats?.coursesEnrolled ?? 0;
  const totalCount = courses.length;

  const isLoading = dbCourses === undefined;
  const isEmpty = !isLoading && courses.length === 0;

  /* Handlers */
  const handleEnroll = useCallback(
    async (courseId: string) => {
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
    },
    [enrollInCourse],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Course }) => (
      <CourseCard course={item} onPress={() => setSelectedCourse(item)} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: Course) => item.id, []);

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glow} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <ArrowLeft size={17} color={T.text} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
            >
              <GraduationCap size={17} color={T.amberSoft} />
              <Text style={styles.title}>Apprendre</Text>
            </View>
            <Text style={styles.subtitle}>
              {totalCount} cours disponible{totalCount !== 1 ? "s" : ""}
            </Text>
          </View>

          <Pressable
            onPress={() => setShowFilters((v) => !v)}
            style={({ pressed }) => [
              styles.filterBtn,
              {
                backgroundColor: showFilters
                  ? alpha(T.amber, 0.18)
                  : "rgba(255,255,255,0.05)",
                borderColor: showFilters ? alpha(T.amber, 0.4) : T.border,
                transform: [{ scale: pressed ? 0.92 : 1 }],
              },
            ]}
          >
            <Filter size={14} color={showFilters ? T.amberSoft : T.faint} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Search size={15} color={T.faint} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Chercher un cours, un instructeur…"
            placeholderTextColor={T.faint}
            style={styles.searchInput}
            autoCorrect={false}
          />
          {searchInput.length > 0 && (
            <Pressable onPress={() => setSearchInput("")} hitSlop={10}>
              <X size={15} color={T.faint} />
            </Pressable>
          )}
        </View>

        {/* Filtres niveau (repliables) */}
        {showFilters && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingTop: 10, paddingRight: 20 }}
            style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
          >
            {LEVELS.map((l) => {
              const active = selectedLevel === l;
              return (
                <Pressable
                  key={l}
                  onPress={() => setSelectedLevel(l)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: active
                        ? alpha(T.amber, 0.18)
                        : "rgba(255,255,255,0.05)",
                      borderColor: active ? alpha(T.amber, 0.42) : T.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? T.amberSoft : T.dim,
                      fontSize: 11.5,
                      fontWeight: active ? "800" : "600",
                    }}
                  >
                    {l}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Catégories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingTop: 12, paddingRight: 20 }}
          style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
        >
          {CATEGORIES.map((c) => {
            const active = selectedCat === c;
            const color =
              c === "Tous" ? T.amber : (CATEGORY_COLORS[c] ?? T.amber);
            return (
              <Pressable
                key={c}
                onPress={() => setSelectedCat(c)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: active
                      ? alpha(color, 0.18)
                      : "rgba(255,255,255,0.05)",
                    borderColor: active ? alpha(color, 0.42) : T.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? color : T.dim,
                    fontSize: 12,
                    fontWeight: active ? "800" : "600",
                  }}
                >
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Contenu */}
      {isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 12, paddingTop: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} style={{ height: 220, borderRadius: 22 }} />
          ))}
        </View>
      ) : isEmpty ? (
        <EmptyState
          icon={BookOpen}
          title="Aucun cours disponible"
          message="Les cours apparaîtront ici dès qu'ils seront publiés."
        />
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 80,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={T.amberSoft}
              colors={[T.amber]}
            />
          }
          ListHeaderComponent={
            <View style={{ gap: 16, marginBottom: 14 }}>
              {/* Bandeau connexion si déconnecté */}
              <Unauthenticated>
                <View style={styles.authBanner}>
                  <LogIn size={16} color={T.amberSoft} />
                  <Text style={styles.authBannerText}>
                    Connecte-toi pour suivre ta progression
                  </Text>
                  <SignInButton />
                </View>
              </Unauthenticated>

              {/* Stats */}
              <Authenticated>
                <View style={styles.statGrid}>
                  <StatCard
                    icon={BookOpen}
                    label="En cours"
                    value={enrolledCount - completedCount}
                    color="#8B5CF6"
                  />
                  <StatCard
                    icon={CheckCircle2}
                    label="Complétés"
                    value={completedCount}
                    color={T.success}
                  />
                  <StatCard
                    icon={BarChart2}
                    label="Total"
                    value={totalCount}
                    color={T.amber}
                  />
                </View>
              </Authenticated>

              <Unauthenticated>
                <View style={styles.statGrid}>
                  <StatCard
                    icon={BookOpen}
                    label="En cours"
                    value={inProgress.length}
                    color="#8B5CF6"
                  />
                  <StatCard
                    icon={CheckCircle2}
                    label="Complétés"
                    value={courses.filter((c) => c.progress === 100).length}
                    color={T.success}
                  />
                  <StatCard
                    icon={BarChart2}
                    label="Total"
                    value={totalCount}
                    color={T.amber}
                  />
                </View>
              </Unauthenticated>

              {/* Reprendre */}
              {inProgress.length > 0 &&
                selectedCat === "Tous" &&
                !debouncedSearch && (
                  <View>
                    <View style={styles.sectionHead}>
                      <Sparkles size={13} color={T.amberSoft} />
                      <Text style={styles.sectionTitle}>Continuer</Text>
                    </View>
                  </View>
                )}
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon={BookOpen}
              title="Aucun résultat"
              message={
                debouncedSearch
                  ? "Essaie un autre mot-clé ou change de filtre."
                  : "Aucun cours dans cette catégorie pour le moment."
              }
            />
          }
        />
      )}

      {/* Modal cours */}
      <CourseDetailModal
        visible={selectedCourse !== null}
        course={selectedCourse}
        isAuthenticated
        onClose={() => setSelectedCourse(null)}
        onEnroll={handleEnroll}
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
    backgroundColor: alpha(T.amber, 0.08),
  },

  /* Header */
  header: { paddingTop: 56, paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
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
  title: {
    color: T.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: { color: T.faint, fontSize: 11.5, marginTop: 2 },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  /* Search */
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  searchInput: {
    flex: 1,
    color: T.text,
    fontSize: 13.5,
    paddingVertical: 0,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 13,
    borderWidth: 1,
  },

  /* Stat grid */
  statGrid: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    gap: 8,
    alignItems: "center",
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: T.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  statLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  /* Auth banner */
  authBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: alpha(T.amber, 0.08),
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.24),
  },
  authBannerText: {
    color: T.dim,
    fontSize: 12,
    flex: 1,
    fontWeight: "600",
  },

  /* Section */
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 4,
  },
  sectionTitle: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  /* Course card */
  card: {
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  cardImageWrap: { position: "relative", height: 150 },
  cardImage: { width: "100%", height: "100%" },
  cardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  categoryBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  completedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.4),
  },
  completedBadgeText: {
    color: T.amberSoft,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  cardProgressTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  cardProgressFill: { height: "100%" },
  cardBody: { padding: 14, gap: 8 },
  cardTitle: {
    color: T.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  cardInstructor: { color: T.faint, fontSize: 11.5, fontWeight: "600" },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: T.faint, fontSize: 11, fontWeight: "700" },
  cardLevelPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginLeft: "auto",
  },
  cardLevelPillText: {
    color: T.dim,
    fontSize: 10,
    fontWeight: "800",
  },
  cardProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  cardProgressText: {
    fontSize: 11,
    fontWeight: "900",
    minWidth: 32,
    textAlign: "right",
  },

  /* Empty */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
    gap: 14,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
  },
  emptyTitle: {
    color: T.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  emptyMessage: {
    color: T.faint,
    fontSize: 12.5,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 18,
  },

  /* Certificate modal */
  certBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  certCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 28,
    backgroundColor: "#0E0E14",
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
    width: 84,
    height: 84,
    borderRadius: 30,
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
    fontSize: 21,
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

  /* Course detail */
  detailRoot: { flex: 1, backgroundColor: T.bg },
  detailHero: { position: "relative", height: 260 },
  detailHeroImage: { width: "100%", height: "100%" },
  detailHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  detailBackBtn: {
    position: "absolute",
    top: 56,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  detailCertBtn: {
    position: "absolute",
    top: 56,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: alpha(T.amber, 0.5),
  },
  detailCertBtnText: {
    color: T.amberSoft,
    fontSize: 11.5,
    fontWeight: "900",
  },
  detailBody: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 14,
    marginTop: -22,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: T.bg,
  },
  detailChips: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    paddingTop: 4,
  },
  detailCategoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  detailCategoryChipText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  detailLevelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  detailLevelChipText: {
    color: T.dim,
    fontSize: 10,
    fontWeight: "800",
  },
  detailTitle: {
    color: T.text,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  detailDesc: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13.5,
    lineHeight: 21,
  },
  detailInstructorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailInstructorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  detailInstructorInitial: {
    fontSize: 14,
    fontWeight: "900",
  },
  detailInstructorName: {
    color: T.text,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  detailRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailRatingText: {
    color: T.amberSoft,
    fontSize: 12,
    fontWeight: "900",
  },
  detailStudents: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "700",
  },
  detailProgressCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    gap: 10,
  },
  detailProgressHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailProgressLabel: {
    color: T.dim,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  detailProgressValue: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  detailProgressFoot: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  detailSectionTitle: {
    color: T.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginTop: 4,
  },
  detailEmptyChapters: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    gap: 8,
  },
  detailEmptyChaptersTitle: {
    color: T.text,
    fontSize: 13,
    fontWeight: "800",
  },
  detailEmptyChaptersText: {
    color: T.faint,
    fontSize: 11.5,
    textAlign: "center",
    lineHeight: 17,
    maxWidth: 240,
  },
  chapterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  chapterIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterTitle: {
    color: T.text,
    fontSize: 13,
    fontWeight: "700",
  },
  chapterMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  chapterMetaText: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "600",
  },
  chapterPlayBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  detailFooter: {
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
  detailCta: {
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
  detailCtaText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.1,
  },
});

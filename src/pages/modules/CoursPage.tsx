// src/pages/modules/CoursPage.tsx
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
  BookOpen,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Code2,
  FileText,
  Flame,
  FlaskConical,
  Languages,
  Lock,
  Palette,
  Play,
  PlayCircle,
  Search,
  Star,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface CoursPageProps {
  onBack: () => void;
}

type Level = "débutant" | "intermédiaire" | "avancé";
type Category = "tech" | "business" | "langues" | "arts" | "science";
type LessonType = "video" | "text" | "quiz";

type Lesson = {
  _id: string;
  title: string;
  type: LessonType;
  duration: string;
  done: boolean;
  locked: boolean;
};

type CourseModule = {
  _id: string;
  title: string;
  lessons: Lesson[];
};

type Course = {
  _id: Id<"courses">;
  title: string;
  instructorName: string;
  instructorAvatar?: string;
  category: string;
  level: string;
  duration: string;
  lessonCount: number;
  rating: number;
  enrollmentCount: number;
  coverImage?: string;
  description: string;
  tags: string[];
  enrolled: boolean;
  progress: number;
  modules: CourseModule[];
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
  amber: "#F59E0B",
  amberSoft: "#FCD34D",
  success: "#10B981",
  danger: "#EF4444",
  cyan: "#22D3EE",
} as const;

const CATEGORY_CONFIG: Record<
  Category,
  { label: string; icon: React.ElementType; color: string }
> = {
  tech: { label: "Technologie", icon: Code2, color: "#3B82F6" },
  business: { label: "Business", icon: Briefcase, color: "#A855F7" },
  langues: { label: "Langues", icon: Languages, color: "#10B981" },
  arts: { label: "Arts & Design", icon: Palette, color: "#F97316" },
  science: { label: "Science", icon: FlaskConical, color: "#EF4444" },
};

const LEVEL_META: Record<Level, { label: string; color: string }> = {
  débutant: { label: "Débutant", color: "#10B981" },
  intermédiaire: { label: "Intermédiaire", color: "#F59E0B" },
  avancé: { label: "Avancé", color: "#EF4444" },
};

const LESSON_ICONS: Record<LessonType, React.ElementType> = {
  video: PlayCircle,
  text: FileText,
  quiz: Zap,
};

const LESSON_COLORS: Record<LessonType, string> = {
  video: "#3B82F6",
  text: "#10B981",
  quiz: "#A855F7",
};

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1000&q=80";

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

function normalizeCategory(raw: string): Category {
  const lower = raw.toLowerCase();
  if (lower in CATEGORY_CONFIG) return lower as Category;
  return "tech";
}

function normalizeLevel(raw: string): Level {
  const lower = raw.toLowerCase();
  if (lower.includes("avanc")) return "avancé";
  if (lower.includes("inter")) return "intermédiaire";
  return "débutant";
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

function EmptyState({
  icon: Icon,
  title,
  message,
  ctaLabel,
  onCta,
  accent = T.primary,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
  accent?: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon size={28} color={T.faint} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {ctaLabel && onCta && (
        <Pressable
          onPress={onCta}
          style={({ pressed }) => [
            styles.emptyCta,
            {
              backgroundColor: accent,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <Text style={styles.emptyCtaText}>{ctaLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

function CategoryPill({
  category,
  size = "sm",
}: {
  category: Category;
  size?: "sm" | "md";
}) {
  const cfg = CATEGORY_CONFIG[category];
  const Icon = cfg.icon;
  const isMd = size === "md";
  return (
    <View
      style={[
        styles.categoryPill,
        {
          backgroundColor: alpha(cfg.color, 0.16),
          borderColor: alpha(cfg.color, 0.32),
          paddingHorizontal: isMd ? 11 : 8,
          paddingVertical: isMd ? 6 : 4,
        },
      ]}
    >
      <Icon size={isMd ? 12 : 10} color={cfg.color} />
      <Text
        style={{
          color: cfg.color,
          fontSize: isMd ? 11.5 : 10.5,
          fontWeight: "900",
        }}
      >
        {cfg.label}
      </Text>
    </View>
  );
}

function LevelPill({ level }: { level: Level }) {
  const meta = LEVEL_META[level];
  return (
    <View
      style={[
        styles.levelPill,
        {
          backgroundColor: alpha(meta.color, 0.16),
          borderColor: alpha(meta.color, 0.32),
        },
      ]}
    >
      <View style={[styles.levelDot, { backgroundColor: meta.color }]} />
      <Text
        style={{
          color: meta.color,
          fontSize: 10,
          fontWeight: "900",
          letterSpacing: 0.3,
        }}
      >
        {meta.label.toUpperCase()}
      </Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   COURSE CARD (catalogue)
   ════════════════════════════════════════════════════════════════════════════ */

function CourseCard({
  course,
  onPress,
  index,
}: {
  course: Course;
  onPress: () => void;
  index: number;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const category = normalizeCategory(course.category);
  const cfg = CATEGORY_CONFIG[category];

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 340,
      delay: Math.min(index * 55, 400),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

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

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          {
            translateY: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [14, 0],
            }),
          },
        ],
      }}
    >
      <Pressable onPress={handlePress}>
        <Animated.View style={[styles.courseCard, { transform: [{ scale }] }]}>
          <View style={styles.courseCoverWrap}>
            <RNImage
              source={{ uri: course.coverImage || FALLBACK_COVER }}
              style={styles.courseCover}
              accessibilityLabel={course.title}
            />
            <View pointerEvents="none" style={styles.courseCoverOverlay} />

            {/* Badges top */}
            <View style={styles.courseTopBadges}>
              <LevelPill level={normalizeLevel(course.level)} />
            </View>

            {course.enrolled && (
              <View style={styles.enrolledBadge}>
                <Award size={10} color="#4ADE80" />
                <Text style={styles.enrolledBadgeText}>Inscrit</Text>
              </View>
            )}

            {/* Titre en bas */}
            <View style={styles.courseCoverBottom}>
              <Text numberOfLines={2} style={styles.courseCoverTitle}>
                {course.title}
              </Text>
            </View>

            {/* Strip de progression */}
            {course.enrolled && course.progress > 0 && (
              <View style={styles.courseStrip}>
                <View
                  style={[
                    styles.courseStripFill,
                    {
                      width: `${course.progress}%`,
                      backgroundColor: cfg.color,
                    },
                  ]}
                />
              </View>
            )}
          </View>

          <View style={styles.courseBody}>
            <View style={styles.courseInstructorRow}>
              <View
                style={[
                  styles.courseInstructorAvatar,
                  { backgroundColor: alpha(cfg.color, 0.18) },
                ]}
              >
                <Text
                  style={[styles.courseInstructorInitial, { color: cfg.color }]}
                >
                  {initials(course.instructorName)}
                </Text>
              </View>
              <Text numberOfLines={1} style={styles.courseInstructorName}>
                {course.instructorName}
              </Text>
              <View style={styles.courseMetaRow}>
                <View style={styles.courseMetaItem}>
                  <Star size={11} color={T.amberSoft} fill={T.amberSoft} />
                  <Text style={styles.courseMetaText}>
                    {course.rating.toFixed(1)}
                  </Text>
                </View>
                <View style={styles.courseMetaItem}>
                  <Clock size={11} color={T.faint} />
                  <Text style={styles.courseMetaText}>{course.duration}</Text>
                </View>
              </View>
            </View>

            {course.enrolled && course.progress > 0 && (
              <View style={{ gap: 8, marginTop: 4 }}>
                <ProgressBar value={course.progress} color={cfg.color} />
                <Text style={styles.courseProgressText}>
                  {course.progress}% complété
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   ENROLLED CARD (en cours)
   ════════════════════════════════════════════════════════════════════════════ */

function EnrolledCard({
  course,
  onPress,
  index,
}: {
  course: Course;
  onPress: () => void;
  index: number;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const category = normalizeCategory(course.category);
  const cfg = CATEGORY_CONFIG[category];

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 340,
      delay: Math.min(index * 55, 400),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          {
            translateX: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [-12, 0],
            }),
          },
        ],
      }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.enrolledCard,
          {
            borderColor: alpha(cfg.color, 0.22),
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        <RNImage
          source={{ uri: course.coverImage || FALLBACK_COVER }}
          style={styles.enrolledCover}
          accessibilityLabel={course.title}
        />

        <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
          <Text numberOfLines={1} style={styles.enrolledTitle}>
            {course.title}
          </Text>
          <Text numberOfLines={1} style={styles.enrolledInstructor}>
            {course.instructorName}
          </Text>

          <ProgressBar value={course.progress} color={cfg.color} height={5} />
          <Text style={styles.enrolledProgressText}>
            {course.progress}% complété
          </Text>
        </View>

        <ChevronRight size={16} color={T.faint} />
      </Pressable>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   COURSE DETAIL MODAL (plein écran)
   ════════════════════════════════════════════════════════════════════════════ */

function CourseDetailModal({
  visible,
  course,
  onClose,
  onOpenLesson,
  onEnroll,
  onCompleteLesson,
}: {
  visible: boolean;
  course: Course | null;
  onClose: () => void;
  onOpenLesson: (lesson: Lesson) => void;
  onEnroll: (courseId: string) => void;
  onCompleteLesson: (courseId: string, lessonId: string) => void;
}) {
  const slide = useRef(new Animated.Value(1)).current;
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  useEffect(() => {
    if (course && visible) {
      // Ouvre automatiquement le premier module avec une leçon non terminée
      const firstIncomplete = course.modules.find((m) =>
        m.lessons.some((l) => !l.done),
      );
      setExpandedModules(new Set(firstIncomplete ? [firstIncomplete._id] : []));
    }
  }, [course, visible]);

  if (!course) return null;

  const category = normalizeCategory(course.category);
  const cfg = CATEGORY_CONFIG[category];
  const level = normalizeLevel(course.level);

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const doneLessons = allLessons.filter((l) => l.done).length;
  const nextLesson = allLessons.find((l) => !l.done && !l.locked);

  const toggleModule = (id: string) =>
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

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
          contentContainerStyle={{ paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO */}
          <View style={styles.detailHero}>
            <RNImage
              source={{ uri: course.coverImage || FALLBACK_COVER }}
              style={styles.detailHeroImage}
              accessibilityLabel={course.title}
            />
            <View pointerEvents="none" style={styles.detailHeroOverlay} />

            <Pressable onPress={onClose} style={styles.detailBackBtn}>
              <ArrowLeft size={18} color="#fff" />
            </Pressable>

            <View style={styles.detailHeroText}>
              <View style={styles.detailHeroChips}>
                <LevelPill level={level} />
                <CategoryPill category={category} />
              </View>
              <Text numberOfLines={3} style={styles.detailHeroTitle}>
                {course.title}
              </Text>
              <View style={styles.detailHeroMeta}>
                <View style={styles.detailHeroMetaItem}>
                  <Star size={11} color={T.amberSoft} fill={T.amberSoft} />
                  <Text style={styles.detailHeroMetaText}>
                    {course.rating.toFixed(1)}
                  </Text>
                </View>
                <View style={styles.detailHeroMetaDot} />
                <View style={styles.detailHeroMetaItem}>
                  <Users size={11} color="rgba(255,255,255,0.72)" />
                  <Text style={styles.detailHeroMetaText}>
                    {formatNumber(course.enrollmentCount)}
                  </Text>
                </View>
                <View style={styles.detailHeroMetaDot} />
                <View style={styles.detailHeroMetaItem}>
                  <Clock size={11} color="rgba(255,255,255,0.72)" />
                  <Text style={styles.detailHeroMetaText}>
                    {course.duration}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* BODY */}
          <View style={styles.detailBody}>
            {/* Instructor */}
            <View style={styles.detailInstructorRow}>
              <View
                style={[
                  styles.detailInstructorAvatar,
                  { backgroundColor: alpha(cfg.color, 0.18) },
                ]}
              >
                <Text
                  style={[styles.detailInstructorInitial, { color: cfg.color }]}
                >
                  {initials(course.instructorName)}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.detailInstructorLabel}>INSTRUCTEUR</Text>
                <Text numberOfLines={1} style={styles.detailInstructorName}>
                  {course.instructorName}
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.detailDescription}>{course.description}</Text>

            {/* Tags */}
            {course.tags.length > 0 && (
              <View style={styles.detailTags}>
                {course.tags.map((tag) => (
                  <View key={tag} style={styles.detailTagPill}>
                    <Text style={styles.detailTagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Progression */}
            {course.enrolled && totalLessons > 0 && (
              <View style={styles.detailProgressCard}>
                <View style={styles.detailProgressHead}>
                  <Text style={styles.detailProgressLabel}>Ma progression</Text>
                  <Text
                    style={[styles.detailProgressValue, { color: cfg.color }]}
                  >
                    {course.progress}%
                  </Text>
                </View>
                <ProgressBar value={course.progress} color={cfg.color} />
                <Text style={styles.detailProgressFoot}>
                  {doneLessons}/{totalLessons} leçons complétées
                </Text>
              </View>
            )}

            {/* Modules */}
            {course.modules.length > 0 && (
              <View style={{ gap: 10, marginTop: 4 }}>
                <Text style={styles.detailSectionTitle}>Contenu du cours</Text>

                {course.modules.map((mod) => {
                  const isExpanded = expandedModules.has(mod._id);
                  const modDone = mod.lessons.filter((l) => l.done).length;
                  const modTotal = mod.lessons.length;

                  return (
                    <View key={mod._id} style={styles.moduleCard}>
                      <Pressable
                        onPress={() => toggleModule(mod._id)}
                        style={({ pressed }) => [
                          styles.moduleHead,
                          { opacity: pressed ? 0.85 : 1 },
                        ]}
                      >
                        <View
                          style={[
                            styles.moduleIcon,
                            { backgroundColor: alpha(cfg.color, 0.18) },
                          ]}
                        >
                          <BookOpen size={14} color={cfg.color} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text numberOfLines={1} style={styles.moduleTitle}>
                            {mod.title}
                          </Text>
                          <Text style={styles.moduleMeta}>
                            {modDone}/{modTotal} leçons
                          </Text>
                        </View>
                        <Animated.View
                          style={{
                            transform: [
                              {
                                rotate: isExpanded ? "90deg" : "0deg",
                              },
                            ],
                          }}
                        >
                          <ChevronRight size={16} color={T.faint} />
                        </Animated.View>
                      </Pressable>

                      {isExpanded && (
                        <View style={styles.moduleBody}>
                          {mod.lessons.map((lesson) => {
                            const Icon = LESSON_ICONS[lesson.type];
                            const lessonColor = LESSON_COLORS[lesson.type];
                            return (
                              <Pressable
                                key={lesson._id}
                                onPress={() =>
                                  !lesson.locked && onOpenLesson(lesson)
                                }
                                disabled={lesson.locked}
                                style={({ pressed }) => [
                                  styles.lessonRow,
                                  {
                                    opacity: lesson.locked
                                      ? 0.42
                                      : pressed
                                        ? 0.75
                                        : 1,
                                  },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.lessonIcon,
                                    {
                                      backgroundColor: alpha(lessonColor, 0.16),
                                    },
                                  ]}
                                >
                                  <Icon size={13} color={lessonColor} />
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                  <Text
                                    numberOfLines={1}
                                    style={[
                                      styles.lessonTitle,
                                      lesson.done && {
                                        color: T.faint,
                                        textDecorationLine: "line-through",
                                      },
                                    ]}
                                  >
                                    {lesson.title}
                                  </Text>
                                  <Text style={styles.lessonMeta}>
                                    {lesson.duration}
                                  </Text>
                                </View>
                                {lesson.locked ? (
                                  <Lock size={14} color={T.faint} />
                                ) : lesson.done ? (
                                  <CheckCircle2 size={16} color={T.success} />
                                ) : (
                                  <Circle size={16} color={T.faint} />
                                )}
                              </Pressable>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* FOOTER CTA */}
        <View style={styles.detailFooter}>
          {course.enrolled ? (
            <Pressable
              onPress={() => {
                if (nextLesson) {
                  onOpenLesson(nextLesson);
                } else {
                  toast.success("Cours terminé, bravo !");
                }
              }}
              disabled={!nextLesson}
              style={({ pressed }) => [
                styles.detailCta,
                {
                  backgroundColor: cfg.color,
                  opacity: !nextLesson ? 0.5 : pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Play size={16} color="#fff" fill="#fff" />
              <Text style={styles.detailCtaText}>
                {nextLesson ? "Continuer le cours" : "Cours terminé"}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => onEnroll(course._id)}
              style={({ pressed }) => [
                styles.detailCta,
                {
                  backgroundColor: cfg.color,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <BookOpen size={16} color="#fff" />
              <Text style={styles.detailCtaText}>S'inscrire gratuitement</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   LESSON VIEWER MODAL
   ════════════════════════════════════════════════════════════════════════════ */

function LessonViewerModal({
  visible,
  course,
  lesson,
  onClose,
  onComplete,
}: {
  visible: boolean;
  course: Course | null;
  lesson: Lesson | null;
  onClose: () => void;
  onComplete: () => void;
}) {
  const slide = useRef(new Animated.Value(1)).current;
  const [quizSelection, setQuizSelection] = useState<Record<number, number>>(
    {},
  );

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  useEffect(() => {
    if (visible) setQuizSelection({});
  }, [visible, lesson?._id]);

  if (!course || !lesson) return null;

  const category = normalizeCategory(course.category);
  const cfg = CATEGORY_CONFIG[category];
  const LessonIcon = LESSON_ICONS[lesson.type];
  const lessonColor = LESSON_COLORS[lesson.type];

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
          styles.lessonRoot,
          {
            transform: [
              {
                translateY: slide.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 800],
                }),
              },
            ],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.lessonHeader}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.lessonBackBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={styles.lessonHeaderCourse}>
              {course.title}
            </Text>
            <Text numberOfLines={1} style={styles.lessonHeaderTitle}>
              {lesson.title}
            </Text>
          </View>

          <View
            style={[
              styles.lessonTypePill,
              {
                backgroundColor: alpha(lessonColor, 0.16),
                borderColor: alpha(lessonColor, 0.34),
              },
            ]}
          >
            <LessonIcon size={11} color={lessonColor} />
            <Text style={[styles.lessonTypePillText, { color: lessonColor }]}>
              {lesson.type.toUpperCase()}
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* VIDEO */}
          {lesson.type === "video" && (
            <View style={styles.videoPlaceholder}>
              <RNImage
                source={{ uri: course.coverImage || FALLBACK_COVER }}
                style={styles.videoPlaceholderImage}
              />
              <View
                pointerEvents="none"
                style={styles.videoPlaceholderOverlay}
              />
              <View style={styles.videoPlaceholderCenter}>
                <View
                  style={[
                    styles.videoPlayBtn,
                    { backgroundColor: alpha(cfg.color, 0.92) },
                  ]}
                >
                  <Play size={28} color="#fff" fill="#fff" />
                </View>
                <Text style={styles.videoPlaceholderDuration}>
                  {lesson.duration}
                </Text>
              </View>
            </View>
          )}

          {/* CONTENT */}
          <View style={styles.lessonContent}>
            <Text style={styles.lessonContentTitle}>{lesson.title}</Text>

            {/* TEXT lesson */}
            {lesson.type === "text" && (
              <View style={{ gap: 14 }}>
                <Text style={styles.lessonParagraph}>
                  Dans cette leçon, nous explorons les concepts fondamentaux
                  liés à{" "}
                  <Text style={styles.lessonParagraphStrong}>
                    {lesson.title.toLowerCase()}
                  </Text>
                  .
                </Text>

                <Text style={styles.lessonParagraph}>
                  Les points clés à retenir :
                </Text>

                <View style={{ gap: 10 }}>
                  {[
                    "Comprendre la théorie de base",
                    "Appliquer les concepts à des exemples concrets",
                    "Identifier les erreurs courantes",
                    "Mettre en pratique avec des exercices guidés",
                  ].map((point, i) => (
                    <View key={i} style={styles.lessonBulletRow}>
                      <View
                        style={[
                          styles.lessonBullet,
                          { backgroundColor: cfg.color },
                        ]}
                      />
                      <Text style={styles.lessonBulletText}>{point}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.lessonParagraph}>
                  Prends le temps d'assimiler chaque concept avant de continuer
                  — la pratique régulière fait toute la différence.
                </Text>
              </View>
            )}

            {/* QUIZ lesson */}
            {lesson.type === "quiz" && (
              <View style={{ gap: 16 }}>
                <View style={styles.quizIntro}>
                  <Zap size={14} color={T.primarySoft} />
                  <Text style={styles.quizIntroText}>
                    Quiz de validation — 3 questions
                  </Text>
                </View>

                {[
                  "Quelle est la principale utilité de cette fonctionnalité ?",
                  "Dans quel cas utilise-t-on cette approche ?",
                  "Quelle est la bonne syntaxe ?",
                ].map((q, qi) => (
                  <View key={qi} style={styles.quizCard}>
                    <Text style={styles.quizQuestion}>
                      Q{qi + 1}. {q}
                    </Text>
                    <View style={{ gap: 8, marginTop: 12 }}>
                      {["Option A", "Option B", "Option C", "Option D"].map(
                        (opt, oi) => {
                          const selected = quizSelection[qi] === oi;
                          return (
                            <Pressable
                              key={oi}
                              onPress={() =>
                                setQuizSelection((s) => ({
                                  ...s,
                                  [qi]: oi,
                                }))
                              }
                              style={({ pressed }) => [
                                styles.quizOption,
                                {
                                  backgroundColor: selected
                                    ? alpha(cfg.color, 0.14)
                                    : "rgba(255,255,255,0.04)",
                                  borderColor: selected
                                    ? alpha(cfg.color, 0.45)
                                    : T.border,
                                  opacity: pressed ? 0.85 : 1,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.quizOptionText,
                                  selected && {
                                    color: "#fff",
                                    fontWeight: "800",
                                  },
                                ]}
                              >
                                {opt}
                              </Text>
                              {selected && (
                                <Check size={14} color={cfg.color} />
                              )}
                            </Pressable>
                          );
                        },
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.lessonFooter}>
          <Pressable
            onPress={onComplete}
            style={({ pressed }) => [
              styles.lessonCompleteBtn,
              {
                backgroundColor: cfg.color,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <CheckCircle2 size={17} color="#fff" />
            <Text style={styles.lessonCompleteText}>
              {lesson.done ? "Leçon terminée" : "Marquer comme terminé"}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE — Inner (auth handled)
   ════════════════════════════════════════════════════════════════════════════ */

function CoursPageInner({ onBack }: CoursPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">(
    "all",
  );
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /* Debounce */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 320);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* Queries */
  const catalogRaw = useQuery(
    api.education.listPublishedCourses,
    selectedCategory === "all" ? {} : { category: selectedCategory },
  );
  const enrollments = useQuery(api.education.getMyEnrollments, {});

  /* Mutations */
  const enrollMutation = useMutation(api.education.enrollInCourse);
  const completeLessonMutation = useMutation(api.education.completeLesson);

  /* Progression map */
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

  /* Enrolled course ids */
  const enrolledIds = useMemo(() => {
    const s = new Set<string>();
    for (const e of enrollments ?? []) {
      if (e && "courseId" in e) s.add(e.courseId as string);
    }
    return s;
  }, [enrollments]);

  /* Map DB → Course */
  const courses: Course[] = useMemo(() => {
    if (!catalogRaw) return [];
    return catalogRaw.map((c) => ({
      _id: c._id as Id<"courses">,
      title: c.title,
      instructorName: c.instructorName ?? "Instructeur",
      instructorAvatar: c.instructorAvatar,
      category: c.category,
      level: c.level,
      duration: c.duration ?? "—",
      lessonCount: c.lessonCount ?? 0,
      rating: c.rating ?? 0,
      enrollmentCount: c.enrollmentCount ?? 0,
      coverImage: c.coverImage,
      description: c.description,
      tags: c.tags ?? [],
      enrolled: enrolledIds.has(c._id as string),
      progress: progressMap.get(c._id as string) ?? 0,
      modules: [], // rempli par getCourseDetail au clic
    }));
  }, [catalogRaw, enrolledIds, progressMap]);

  /* Filtre local (recherche) */
  const filtered = useMemo(() => {
    if (!debouncedSearch) return courses;
    const q = debouncedSearch.toLowerCase();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        c.instructorName.toLowerCase().includes(q),
    );
  }, [courses, debouncedSearch]);

  /* Enrolled list */
  const enrolled = useMemo(() => courses.filter((c) => c.enrolled), [courses]);

  /* Stats globales */
  const stats = useMemo(() => {
    const totalDone = 0; // dérivé d'un éventuel endpoint de stats
    return {
      enrolled: enrolled.length,
      total: courses.length,
      doneLessons: totalDone,
    };
  }, [enrolled.length, courses.length]);

  /* Handlers */
  const handleEnroll = useCallback(
    async (courseId: string) => {
      try {
        await enrollMutation({ courseId: courseId as Id<"courses"> });
        // Met à jour localement la sélection pour un feedback immédiat
        setSelectedCourse((prev) =>
          prev && prev._id === courseId ? { ...prev, enrolled: true } : prev,
        );
        toast.success("Inscription réussie !");
      } catch {
        toast.error("Erreur lors de l'inscription");
      }
    },
    [enrollMutation],
  );

  const handleCompleteLesson = useCallback(
    async (courseId: string, lessonId: string) => {
      try {
        await completeLessonMutation({
          courseId: courseId as Id<"courses">,
          lessonId: lessonId as Id<"courseLessons">,
        });
        toast.success("Leçon terminée");
        setActiveLesson(null);
      } catch {
        toast.error("Erreur lors de la validation");
      }
    },
    [completeLessonMutation],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  /* Render item */
  const renderCourse = useCallback(
    ({ item, index }: { item: Course; index: number }) => (
      <CourseCard
        course={item}
        index={index}
        onPress={() => setSelectedCourse(item)}
      />
    ),
    [],
  );

  const keyExtractor = useCallback((item: Course) => item._id as string, []);

  const isLoading = catalogRaw === undefined;

  /* ── Rendu ─────────────────────────────────────────────────────────── */
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
            <ArrowLeft size={18} color="#fff" />
          </Pressable>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title}>Cours</Text>
            <Text style={styles.subtitle}>
              {courses.length} cours disponible
              {courses.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Recherche */}
        <View style={styles.searchWrap}>
          <Search size={15} color={T.faint} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Rechercher un cours, un tag, un formateur…"
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

        {/* Catégories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 20, paddingTop: 2 }}
          style={{
            marginHorizontal: -20,
            paddingHorizontal: 20,
            marginTop: 14,
          }}
        >
          <Pressable
            onPress={() => setSelectedCategory("all")}
            style={({ pressed }) => [
              styles.categoryChip,
              {
                backgroundColor:
                  selectedCategory === "all"
                    ? "rgba(255,255,255,0.16)"
                    : "rgba(255,255,255,0.05)",
                borderColor: selectedCategory === "all" ? "#fff" : T.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.categoryChipText,
                {
                  color: selectedCategory === "all" ? "#fff" : T.dim,
                  fontWeight: selectedCategory === "all" ? "900" : "700",
                },
              ]}
            >
              Tous
            </Text>
          </Pressable>

          {(Object.keys(CATEGORY_CONFIG) as Category[]).map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const Icon = cfg.icon;
            const active = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  {
                    backgroundColor: active
                      ? alpha(cfg.color, 0.18)
                      : "rgba(255,255,255,0.05)",
                    borderColor: active ? alpha(cfg.color, 0.45) : T.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Icon size={12} color={active ? cfg.color : T.faint} />
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color: active ? cfg.color : T.dim,
                      fontWeight: active ? "900" : "700",
                    },
                  ]}
                >
                  {cfg.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Liste */}
      {isLoading ? (
        <View style={styles.listPad}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} style={{ height: 220, borderRadius: 22 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderCourse}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 80,
            gap: 14,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={T.primarySoft}
              colors={[T.primary]}
            />
          }
          ListHeaderComponent={
            <View style={{ gap: 20, marginBottom: 4 }}>
              {/* Stats */}
              {!debouncedSearch && selectedCategory === "all" && (
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <View
                      style={[
                        styles.statIcon,
                        { backgroundColor: alpha(T.primary, 0.15) },
                      ]}
                    >
                      <BookOpen size={14} color={T.primarySoft} />
                    </View>
                    <Text style={styles.statValue}>{stats.enrolled}</Text>
                    <Text style={styles.statLabel}>Inscrits</Text>
                  </View>
                  <View style={styles.statBox}>
                    <View
                      style={[
                        styles.statIcon,
                        { backgroundColor: alpha(T.success, 0.15) },
                      ]}
                    >
                      <CheckCircle2 size={14} color="#6EE7B7" />
                    </View>
                    <Text style={styles.statValue}>{stats.doneLessons}</Text>
                    <Text style={styles.statLabel}>Leçons finies</Text>
                  </View>
                  <View style={styles.statBox}>
                    <View
                      style={[
                        styles.statIcon,
                        { backgroundColor: alpha(T.amber, 0.15) },
                      ]}
                    >
                      <Flame size={14} color={T.amberSoft} />
                    </View>
                    <Text style={styles.statValue}>7j</Text>
                    <Text style={styles.statLabel}>Streak</Text>
                  </View>
                </View>
              )}

              {/* En cours */}
              {enrolled.length > 0 &&
                !debouncedSearch &&
                selectedCategory === "all" && (
                  <View>
                    <View style={styles.sectionHead}>
                      <View
                        style={[
                          styles.sectionIcon,
                          { backgroundColor: alpha(T.amber, 0.15) },
                        ]}
                      >
                        <Flame size={14} color={T.amberSoft} />
                      </View>
                      <Text style={styles.sectionTitle}>En cours</Text>
                    </View>
                    <View style={{ gap: 10, marginTop: 12 }}>
                      {enrolled.slice(0, 3).map((c, i) => (
                        <EnrolledCard
                          key={c._id as string}
                          course={c}
                          index={i}
                          onPress={() => setSelectedCourse(c)}
                        />
                      ))}
                    </View>
                  </View>
                )}

              {/* Titre catalogue */}
              {!debouncedSearch && selectedCategory === "all" && (
                <View style={styles.sectionHead}>
                  <View
                    style={[
                      styles.sectionIcon,
                      { backgroundColor: alpha(T.cyan, 0.15) },
                    ]}
                  >
                    <TrendingUp size={14} color={T.cyan} />
                  </View>
                  <Text style={styles.sectionTitle}>Catalogue</Text>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon={BookOpen}
              title={debouncedSearch ? "Aucun cours trouvé" : "Catalogue vide"}
              message={
                debouncedSearch
                  ? "Essaie un autre mot-clé ou change de catégorie."
                  : "Les cours apparaîtront ici dès leur publication."
              }
            />
          }
        />
      )}

      {/* Modales */}
      <CourseDetailModal
        visible={selectedCourse !== null && activeLesson === null}
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
        onOpenLesson={(lesson) => setActiveLesson(lesson)}
        onEnroll={handleEnroll}
        onCompleteLesson={handleCompleteLesson}
      />

      <LessonViewerModal
        visible={activeLesson !== null}
        course={selectedCourse}
        lesson={activeLesson}
        onClose={() => setActiveLesson(null)}
        onComplete={() => {
          if (selectedCourse && activeLesson) {
            void handleCompleteLesson(
              selectedCourse._id as string,
              activeLesson._id,
            );
          }
        }}
      />
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   EXPORT — auth gates
   ════════════════════════════════════════════════════════════════════════════ */

export default function CoursPage({ onBack }: CoursPageProps) {
  return (
    <>
      <Authenticated>
        <CoursPageInner onBack={onBack} />
      </Authenticated>
      <Unauthenticated>
        <CoursPageInner onBack={onBack} />
      </Unauthenticated>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  glow: {
    position: "absolute",
    top: -150,
    left: -80,
    right: -80,
    height: 320,
    borderRadius: 220,
    backgroundColor: alpha(T.primary, 0.1),
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
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: "600",
  },

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

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 13,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 12 },

  /* List */
  listPad: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 14,
  },

  /* Stats */
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    gap: 8,
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
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  statLabel: {
    color: T.faint,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  /* Section */
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: T.text,
    fontSize: 14.5,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  /* Course card */
  courseCard: {
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  courseCoverWrap: { position: "relative", height: 150 },
  courseCover: { width: "100%", height: "100%" },
  courseCoverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  courseTopBadges: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    gap: 6,
  },
  enrolledBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: alpha(T.success, 0.92),
  },
  enrolledBadgeText: {
    color: "#fff",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  courseCoverBottom: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },
  courseCoverTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  courseStrip: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  courseStripFill: { height: "100%" },

  courseBody: { padding: 14, gap: 10 },
  courseInstructorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  courseInstructorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  courseInstructorInitial: { fontSize: 10, fontWeight: "900" },
  courseInstructorName: {
    color: T.dim,
    fontSize: 11.5,
    fontWeight: "700",
    flex: 1,
  },
  courseMetaRow: { flexDirection: "row", gap: 12 },
  courseMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  courseMetaText: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "800",
  },
  courseProgressText: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "700",
  },

  /* Enrolled card */
  enrolledCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  enrolledCover: {
    width: 62,
    height: 62,
    borderRadius: 15,
  },
  enrolledTitle: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  enrolledInstructor: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "600",
  },
  enrolledProgressText: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "700",
  },

  /* Category / Level pills */
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  levelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  levelDot: { width: 5, height: 5, borderRadius: 2.5 },

  /* Detail modal */
  detailRoot: { flex: 1, backgroundColor: T.bg },
  detailHero: { position: "relative", height: 300 },
  detailHeroImage: { width: "100%", height: "100%" },
  detailHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  detailBackBtn: {
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
  detailHeroText: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 22,
    gap: 10,
  },
  detailHeroChips: { flexDirection: "row", gap: 8 },
  detailHeroTitle: {
    color: "#fff",
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  detailHeroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  detailHeroMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  detailHeroMetaText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 11.5,
    fontWeight: "800",
  },
  detailHeroMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  detailBody: {
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 20,
    marginTop: -22,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: T.bg,
  },
  detailInstructorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  detailInstructorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  detailInstructorInitial: { fontSize: 17, fontWeight: "900" },
  detailInstructorLabel: {
    color: T.faint,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  detailInstructorName: {
    color: T.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 3,
    letterSpacing: -0.2,
  },
  detailDescription: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 13.5,
    lineHeight: 21,
  },
  detailTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailTagPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
  },
  detailTagText: {
    color: T.dim,
    fontSize: 11.5,
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
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  detailProgressValue: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  detailProgressFoot: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "600",
  },
  detailSectionTitle: {
    color: T.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  moduleCard: {
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  moduleHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  moduleIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleTitle: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  moduleMeta: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  moduleBody: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    padding: 10,
    gap: 4,
  },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 11,
    borderRadius: 14,
  },
  lessonIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  lessonTitle: {
    color: T.text,
    fontSize: 13,
    fontWeight: "700",
  },
  lessonMeta: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 3,
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
    height: 54,
    borderRadius: 18,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  detailCtaText: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "900",
    letterSpacing: -0.1,
  },

  /* Lesson viewer */
  lessonRoot: { flex: 1, backgroundColor: T.bg },
  lessonHeader: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  lessonBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  lessonHeaderCourse: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  lessonHeaderTitle: {
    color: T.text,
    fontSize: 14.5,
    fontWeight: "900",
    marginTop: 3,
    letterSpacing: -0.2,
  },
  lessonTypePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  lessonTypePillText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  videoPlaceholder: {
    width: "100%",
    aspectRatio: 16 / 9,
    position: "relative",
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlaceholderImage: {
    width: "100%",
    height: "100%",
    opacity: 0.42,
  },
  videoPlaceholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  videoPlaceholderCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  videoPlayBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  videoPlaceholderDuration: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  lessonContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 16,
  },
  lessonContentTitle: {
    color: T.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 27,
  },
  lessonParagraph: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 22,
  },
  lessonParagraphStrong: {
    color: T.text,
    fontWeight: "800",
  },
  lessonBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  lessonBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  lessonBulletText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13.5,
    lineHeight: 21,
    flex: 1,
  },

  /* Quiz */
  quizIntro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: alpha(T.primary, 0.1),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.24),
  },
  quizIntroText: {
    color: T.primarySoft,
    fontSize: 12.5,
    fontWeight: "800",
  },
  quizCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  quizQuestion: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "800",
    lineHeight: 19,
  },
  quizOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  quizOptionText: {
    color: T.dim,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  lessonFooter: {
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
  lessonCompleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    height: 54,
    borderRadius: 18,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  lessonCompleteText: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "900",
    letterSpacing: -0.1,
  },

  /* Empty */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
    gap: 14,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 4,
  },
  emptyTitle: {
    color: T.text,
    fontSize: 15.5,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptyMessage: {
    color: T.faint,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 280,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 16,
    marginTop: 6,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  emptyCtaText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "900",
  },
});

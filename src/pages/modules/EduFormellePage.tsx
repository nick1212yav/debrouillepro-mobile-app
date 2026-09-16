import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GraduationCap,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "@/lib/convex-auth-compat";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

interface EduFormellePageProps {
  onBack: () => void;
}

type TabKey = "cours" | "bourses" | "programmes";

const TABS: Array<{
  key: TabKey;
  label: string;
}> = [
  {
    key: "cours",
    label: "Cours",
  },
  {
    key: "bourses",
    label: "Bourses",
  },
  {
    key: "programmes",
    label: "Programmes",
  },
];

const LEVEL_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

const ACCENT = "#A78BFA";
const SUCCESS = "#10B981";
const WARNING = "#F59E0B";

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View
      className="flex-row items-center px-5 pb-4 pt-4"
      style={{
        backgroundColor: "rgba(2,6,23,0.97)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
      }}
    >
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Retour"
        className="h-11 w-11 items-center justify-center rounded-2xl"
        style={({ pressed }) => ({
          backgroundColor: pressed
            ? "rgba(255,255,255,0.11)"
            : "rgba(255,255,255,0.055)",
          transform: [{ scale: pressed ? 0.94 : 1 }],
        })}
      >
        <ArrowLeft size={19} color="rgba(255,255,255,0.9)" strokeWidth={2.3} />
      </Pressable>

      <View className="ml-3 flex-1">
        <Text className="text-[18px] font-black text-white">Éducation</Text>

        <Text className="mt-0.5 text-[11px] text-white/35">
          Apprendre · Progresser · Se former
        </Text>
      </View>

      <View
        className="h-10 w-10 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: `${ACCENT}16`,
          borderWidth: 1,
          borderColor: `${ACCENT}28`,
        }}
      >
        <GraduationCap size={18} color={ACCENT} strokeWidth={2.1} />
      </View>
    </View>
  );
}

function Hero() {
  return (
    <View className="mx-5 mt-5">
      <View className="flex-row items-center">
        <View
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: ACCENT,
          }}
        />

        <Text
          className="ml-2 text-[10px] font-black uppercase"
          style={{
            color: ACCENT,
            letterSpacing: 1.8,
          }}
        >
          ÉDUCATION FORMELLE
        </Text>
      </View>

      <Text className="mt-2 text-[25px] font-black leading-8 text-white">
        Construis ton avenir
        {"\n"}
        par l'apprentissage.
      </Text>

      <Text className="mt-2 text-[12px] leading-5 text-white/35">
        Découvre les formations disponibles et gère tes inscriptions depuis un
        seul espace.
      </Text>
    </View>
  );
}

function StatCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <View
      className="flex-1 rounded-2xl p-3"
      style={{
        backgroundColor: "rgba(255,255,255,0.035)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.065)",
      }}
    >
      <View
        className="mb-2 h-8 w-8 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${accent}14`,
        }}
      >
        {icon}
      </View>

      <Text className="text-[17px] font-black text-white">{value}</Text>

      <Text numberOfLines={1} className="mt-0.5 text-[9px] text-white/30">
        {label}
      </Text>
    </View>
  );
}

function Stats({
  coursesCount,
  enrolledCount,
}: {
  coursesCount: number;
  enrolledCount: number;
}) {
  return (
    <View className="mx-5 mt-5 flex-row gap-2">
      <StatCard
        icon={<BookOpen size={15} color={ACCENT} strokeWidth={2} />}
        value={String(coursesCount)}
        label="Cours disponibles"
        accent={ACCENT}
      />

      <StatCard
        icon={<CheckCircle2 size={15} color={SUCCESS} strokeWidth={2} />}
        value={String(enrolledCount)}
        label="Mes inscriptions"
        accent={SUCCESS}
      />

      <StatCard
        icon={<Sparkles size={15} color={WARNING} strokeWidth={2} />}
        value="—"
        label="Progression"
        accent={WARNING}
      />
    </View>
  );
}

function TabBar({
  activeTab,
  onChange,
}: {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  return (
    <View
      className="mx-5 mt-5 flex-row rounded-2xl p-1"
      style={{
        backgroundColor: "rgba(255,255,255,0.035)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.055)",
      }}
    >
      {TABS.map((tab) => {
        const active = tab.key === activeTab;

        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{
              selected: active,
            }}
            className="flex-1 items-center justify-center rounded-xl py-2.5"
            style={({ pressed }) => ({
              opacity: pressed ? 0.72 : 1,
              backgroundColor: active
                ? "rgba(167,139,250,0.14)"
                : "transparent",
            })}
          >
            <Text
              className="text-[11px] font-bold"
              style={{
                color: active ? "#FFFFFF" : "rgba(255,255,255,0.35)",
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View
      className="mb-4 flex-row items-center rounded-2xl px-3.5"
      style={{
        minHeight: 46,
        backgroundColor: "rgba(255,255,255,0.035)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.065)",
      }}
    >
      <Search size={16} color="rgba(255,255,255,0.35)" strokeWidth={2} />

      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Rechercher un cours ou une catégorie…"
        placeholderTextColor="rgba(255,255,255,0.25)"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        className="ml-3 flex-1 text-[13px] text-white"
      />

      {value.length > 0 ? (
        <Pressable
          onPress={() => onChange("")}
          accessibilityRole="button"
          accessibilityLabel="Effacer la recherche"
          className="h-7 w-7 items-center justify-center rounded-full"
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
          }}
        >
          <X size={13} color="rgba(255,255,255,0.5)" />
        </Pressable>
      ) : null}
    </View>
  );
}

function LoadingCourses() {
  return (
    <View
      className="items-center rounded-[24px] px-6 py-12"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <ActivityIndicator size="small" color={ACCENT} />

      <Text className="mt-3 text-[12px] text-white/35">
        Chargement des formations…
      </Text>
    </View>
  );
}

function EmptyCourses({ searching }: { searching: boolean }) {
  return (
    <View
      className="items-center rounded-[24px] px-6 py-11"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <View
        className="h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: `${ACCENT}12`,
        }}
      >
        <BookOpen size={23} color={`${ACCENT}CC`} strokeWidth={2} />
      </View>

      <Text className="mt-4 text-center text-[15px] font-black text-white">
        {searching ? "Aucun résultat" : "Aucun cours disponible"}
      </Text>

      <Text className="mt-2 max-w-[310px] text-center text-[12px] leading-5 text-white/30">
        {searching
          ? "Aucun cours publié ne correspond à votre recherche."
          : "Aucun cours publié n'est actuellement disponible dans les données connectées."}
      </Text>
    </View>
  );
}

function CourseCard({
  course,
  enrolled,
  enrolling,
  onEnroll,
}: {
  course: {
    _id: Id<"courses">;
    title: string;
    description: string;
    category: string;
    level: string;
    lessonCount: number;
    duration?: string;
    enrollmentCount: number;
    rating?: number;
    isFree: boolean;
    price: number;
    currency: string;
    coverImage?: string;
  };
  enrolled: boolean;
  enrolling: boolean;
  onEnroll: () => void;
}) {
  return (
    <View
      className="overflow-hidden rounded-[24px]"
      style={{
        backgroundColor: "rgba(255,255,255,0.035)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      {course.coverImage ? (
        <View className="relative h-44">
          <View
            className="absolute inset-0"
            style={{
              backgroundColor: "rgba(2,4,18,0.18)",
              zIndex: 1,
            }}
          />

          <Image
            source={{
              uri: course.coverImage,
            }}
            className="h-full w-full"
            resizeMode="cover"
            accessibilityLabel={course.title}
          />

          <View
            className="absolute left-3 top-3 rounded-full px-2.5 py-1"
            style={{
              backgroundColor: "rgba(2,4,18,0.78)",
              zIndex: 2,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
            }}
          >
            <Text className="text-[9px] font-bold text-white">
              {course.category}
            </Text>
          </View>
        </View>
      ) : (
        <View
          className="h-36 items-center justify-center"
          style={{
            backgroundColor: `${ACCENT}10`,
          }}
        >
          <View
            className="h-16 w-16 items-center justify-center rounded-3xl"
            style={{
              backgroundColor: `${ACCENT}12`,
              borderWidth: 1,
              borderColor: `${ACCENT}22`,
            }}
          >
            <GraduationCap size={31} color={ACCENT} strokeWidth={1.8} />
          </View>

          <View
            className="absolute left-3 top-3 rounded-full px-2.5 py-1"
            style={{
              backgroundColor: "rgba(2,4,18,0.72)",
            }}
          >
            <Text className="text-[9px] font-bold text-white">
              {course.category}
            </Text>
          </View>
        </View>
      )}

      <View className="p-4">
        <Text
          numberOfLines={2}
          className="text-[16px] font-black leading-5 text-white"
        >
          {course.title}
        </Text>

        {course.description ? (
          <Text
            numberOfLines={3}
            className="mt-2 text-[11px] leading-4 text-white/35"
          >
            {course.description}
          </Text>
        ) : null}

        <View
          className="mt-4 flex-row flex-wrap items-center"
          style={{
            columnGap: 12,
            rowGap: 7,
          }}
        >
          <Meta
            icon={<BookOpen size={12} color="rgba(255,255,255,0.38)" />}
            label={`${course.lessonCount} ${
              course.lessonCount > 1 ? "leçons" : "leçon"
            }`}
          />

          {course.duration ? (
            <Meta
              icon={<Clock3 size={12} color="rgba(255,255,255,0.38)" />}
              label={course.duration}
            />
          ) : null}

          <Meta
            icon={<Users size={12} color="rgba(255,255,255,0.38)" />}
            label={String(course.enrollmentCount)}
          />

          {course.rating !== undefined ? (
            <Meta
              icon={<Sparkles size={12} color={WARNING} />}
              label={course.rating.toFixed(1)}
            />
          ) : null}
        </View>

        <View
          className="mt-4 flex-row items-center justify-between"
          style={{
            gap: 10,
          }}
        >
          <View className="flex-1 flex-row flex-wrap items-center">
            <View
              className="rounded-full px-2.5 py-1"
              style={{
                backgroundColor: `${ACCENT}13`,
              }}
            >
              <Text
                className="text-[9px] font-bold"
                style={{
                  color: ACCENT,
                }}
              >
                {LEVEL_LABELS[course.level] ?? course.level}
              </Text>
            </View>

            <Text
              className="ml-2 text-[11px] font-bold"
              style={{
                color: course.isFree ? SUCCESS : WARNING,
              }}
            >
              {course.isFree
                ? "Gratuit"
                : `${course.price.toLocaleString()} ${course.currency}`}
            </Text>
          </View>

          {enrolled ? (
            <View
              className="flex-row items-center rounded-xl px-3 py-2"
              style={{
                backgroundColor: "rgba(16,185,129,0.11)",
                borderWidth: 1,
                borderColor: "rgba(16,185,129,0.16)",
              }}
            >
              <CheckCircle2 size={14} color={SUCCESS} strokeWidth={2} />

              <Text className="ml-1.5 text-[10px] font-bold text-emerald-400">
                Inscrit
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={onEnroll}
              disabled={enrolling}
              accessibilityRole="button"
              accessibilityLabel={`S'inscrire à ${course.title}`}
              className="flex-row items-center rounded-xl px-3.5 py-2.5"
              style={({ pressed }) => ({
                opacity: enrolling ? 0.55 : pressed ? 0.78 : 1,
                backgroundColor: ACCENT,
              })}
            >
              {enrolling ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-[10px] font-black text-white">
                    S'inscrire
                  </Text>

                  <ChevronRight
                    size={13}
                    color="#FFFFFF"
                    strokeWidth={2.5}
                    style={{
                      marginLeft: 3,
                    }}
                  />
                </>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function Meta({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center">
      {icon}

      <Text className="ml-1 text-[10px] text-white/35">{label}</Text>
    </View>
  );
}

function CoursesTab() {
  const courses = useQuery(api.education.listPublishedCourses, {});

  const enrollments = useQuery(api.education.getMyEnrollments, {});

  const enrollInCourse = useMutation(api.education.enrollInCourse);

  const [search, setSearch] = useState("");
  const [enrollingId, setEnrollingId] = useState<Id<"courses"> | null>(null);

  const enrolledCourseIds = useMemo(() => {
    return new Set(
      (enrollments ?? [])
        .filter((item) => item !== null)
        .map((item) => {
          return (
            item as {
              courseId: Id<"courses">;
            }
          ).courseId;
        }),
    );
  }, [enrollments]);

  const filteredCourses = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!courses) {
      return [];
    }

    if (!normalized) {
      return courses;
    }

    return courses.filter((course) => {
      return (
        course.title.toLowerCase().includes(normalized) ||
        course.category.toLowerCase().includes(normalized) ||
        course.description.toLowerCase().includes(normalized)
      );
    });
  }, [courses, search]);

  const handleEnroll = async (courseId: Id<"courses">) => {
    if (enrollingId !== null) {
      return;
    }

    setEnrollingId(courseId);

    try {
      await enrollInCourse({
        courseId,
      });
    } finally {
      setEnrollingId(null);
    }
  };

  if (courses === undefined) {
    return <LoadingCourses />;
  }

  return (
    <View>
      <SearchBar value={search} onChange={setSearch} />

      {filteredCourses.length === 0 ? (
        <EmptyCourses searching={search.trim().length > 0} />
      ) : (
        <View className="gap-4">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              enrolled={enrolledCourseIds.has(course._id)}
              enrolling={enrollingId === course._id}
              onEnroll={() => void handleEnroll(course._id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function ComingSoonTab({ type }: { type: "bourses" | "programmes" }) {
  const isScholarship = type === "bourses";

  return (
    <View>
      <View
        className="mb-4 flex-row items-center rounded-2xl px-4 py-3.5"
        style={{
          backgroundColor: `${ACCENT}09`,
          borderWidth: 1,
          borderColor: `${ACCENT}18`,
        }}
      >
        {isScholarship ? (
          <Award size={17} color={ACCENT} strokeWidth={2} />
        ) : (
          <GraduationCap size={17} color={ACCENT} strokeWidth={2} />
        )}

        <Text className="ml-3 flex-1 text-[11px] leading-4 text-white/40">
          Cette section est prête pour être connectée à ses véritables données
          backend.
        </Text>
      </View>

      <View
        className="items-center rounded-[24px] px-6 py-12"
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <View
          className="h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: `${ACCENT}12`,
          }}
        >
          {isScholarship ? (
            <Award size={23} color={`${ACCENT}CC`} strokeWidth={2} />
          ) : (
            <GraduationCap size={23} color={`${ACCENT}CC`} strokeWidth={2} />
          )}
        </View>

        <Text className="mt-4 text-center text-[15px] font-black text-white">
          {isScholarship
            ? "Bourses non connectées"
            : "Programmes non connectés"}
        </Text>

        <Text className="mt-2 max-w-[310px] text-center text-[12px] leading-5 text-white/30">
          Aucune donnée réelle de cette catégorie n'est actuellement disponible
          dans les sources utilisées par cette page.
        </Text>
      </View>
    </View>
  );
}

function AuthLoadingScreen({ onBack }: EduFormellePageProps) {
  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: "#020412",
      }}
    >
      <Header onBack={onBack} />

      <View className="flex-1 items-center justify-center px-6">
        <View
          className="h-16 w-16 items-center justify-center rounded-3xl"
          style={{
            backgroundColor: `${ACCENT}12`,
          }}
        >
          <ActivityIndicator size="small" color={ACCENT} />
        </View>

        <Text className="mt-4 text-[14px] font-bold text-white">
          Préparation de votre espace
        </Text>

        <Text className="mt-1 text-center text-[11px] text-white/30">
          Vérification de votre session…
        </Text>
      </View>
    </View>
  );
}

function UnauthenticatedScreen({ onBack }: EduFormellePageProps) {
  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: "#020412",
      }}
    >
      <Header onBack={onBack} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="items-center rounded-[30px] px-6 py-10"
          style={{
            backgroundColor: "rgba(255,255,255,0.035)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <View
            className="h-20 w-20 items-center justify-center rounded-[28px]"
            style={{
              backgroundColor: `${ACCENT}12`,
              borderWidth: 1,
              borderColor: `${ACCENT}20`,
            }}
          >
            <GraduationCap size={35} color={ACCENT} strokeWidth={1.8} />
          </View>

          <Text className="mt-5 text-center text-[21px] font-black text-white">
            Votre espace éducatif
          </Text>

          <Text className="mt-2 max-w-[330px] text-center text-[12px] leading-5 text-white/35">
            Connectez-vous pour accéder à vos formations et gérer vos
            inscriptions.
          </Text>

          <View
            className="mt-5 flex-row items-center rounded-2xl px-4 py-3"
            style={{
              backgroundColor: "rgba(255,255,255,0.035)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <Check size={14} color={SUCCESS} strokeWidth={2.5} />

            <Text className="ml-2 flex-1 text-[10px] leading-4 text-white/35">
              Vos données éducatives restent liées à votre compte.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function AuthenticatedContent({ onBack }: EduFormellePageProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("cours");

  const courses = useQuery(api.education.listPublishedCourses, {});

  const enrollments = useQuery(api.education.getMyEnrollments, {});

  const { width } = useWindowDimensions();

  const maxWidth = Math.min(width - 32, 920);

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: "#020412",
      }}
    >
      <Header onBack={onBack} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          width: maxWidth,
          alignSelf: "center",
          paddingBottom: 45,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Hero />

        <Stats
          coursesCount={courses?.length ?? 0}
          enrolledCount={enrollments?.length ?? 0}
        />

        <TabBar activeTab={activeTab} onChange={setActiveTab} />

        <View className="mt-5 px-5">
          {activeTab === "cours" ? <CoursesTab /> : null}

          {activeTab === "bourses" ? <ComingSoonTab type="bourses" /> : null}

          {activeTab === "programmes" ? (
            <ComingSoonTab type="programmes" />
          ) : null}
        </View>

        <View className="mx-5 mt-7 flex-row items-center justify-center">
          <View
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: SUCCESS,
            }}
          />

          <Text className="ml-2 text-[9px] text-white/20">
            Données affichées depuis les sources connectées
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default function EduFormellePage({ onBack }: EduFormellePageProps) {
  return (
    <>
      <AuthLoading>
        <AuthLoadingScreen onBack={onBack} />
      </AuthLoading>

      <Authenticated>
        <AuthenticatedContent onBack={onBack} />
      </Authenticated>

      <Unauthenticated>
        <UnauthenticatedScreen onBack={onBack} />
      </Unauthenticated>
    </>
  );
}

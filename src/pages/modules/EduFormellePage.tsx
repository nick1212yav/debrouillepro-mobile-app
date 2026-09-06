import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image, TextInput } from "react-native";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  DollarSign,
  MapPin,
  Calendar,
  Star,
  ChevronRight,
  Search,
  Award,
  CheckCircle,
  Clock,
  Users,
} from "lucide-react-native";
import type { Id } from "@/convex/_generated/dataModel.d";

// ─── Static fallback data ────────────────────────────────────────────────────

const SCHOOLS_STATIC = [
  {
    id: 1,
    name: "Université Félix Houphouët-Boigny",
    type: "Université publique",
    city: "Abidjan",
    rating: 4.2,
    students: 80000,
    programs: 120,
    tuition: "Gratuit (publique)",
    img: "https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop",
    color: "#6366F1",
  },
  {
    id: 2,
    name: "INPHB Yamoussoukro",
    type: "Grande école",
    city: "Yamoussoukro",
    rating: 4.7,
    students: 12000,
    programs: 45,
    tuition: "250 000 FCFA/an",
    img: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=200&fit=crop",
    color: "#F97316",
  },
  {
    id: 3,
    name: "ESCA École de Management",
    type: "École privée",
    city: "Abidjan",
    rating: 4.5,
    students: 3000,
    programs: 18,
    tuition: "1 500 000 FCFA/an",
    img: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=200&fit=crop",
    color: "#10B981",
  },
  {
    id: 4,
    name: "IAI – Institut Africain",
    type: "Institut tech",
    city: "Abidjan",
    rating: 4.6,
    students: 5000,
    programs: 22,
    tuition: "800 000 FCFA/an",
    img: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=400&h=200&fit=crop",
    color: "#8B5CF6",
  },
];

const SCHOLARSHIPS_STATIC = [
  {
    name: "Bourse d'Excellence CGECI",
    amount: "500 000 FCFA",
    deadline: "30 Juil 2025",
    level: "Licence",
    field: "Toutes filières",
    status: "Ouvert",
  },
  {
    name: "Bourse BAD – Ingénierie",
    amount: "2 000 000 FCFA",
    deadline: "15 Août 2025",
    level: "Master",
    field: "Ingénierie & Tech",
    status: "Ouvert",
  },
  {
    name: "AFD Mobilité Internationale",
    amount: "5 000 €",
    deadline: "1 Sept 2025",
    level: "Master/Doctorat",
    field: "Sciences sociales",
    status: "Bientôt",
  },
  {
    name: "Bourse Gouvernement Marocain",
    amount: "Couverture totale",
    deadline: "31 Juil 2025",
    level: "Licence",
    field: "Toutes filières",
    status: "Ouvert",
  },
];

const PROGRAMS_STATIC = [
  {
    name: "Informatique & IA",
    school: "IAI",
    duration: "3 ans (Licence)",
    level: "Bac+3",
    demand: "Très élevée",
  },
  {
    name: "Finance & Comptabilité",
    school: "ESCA",
    duration: "2 ans (Master)",
    level: "Bac+5",
    demand: "Élevée",
  },
  {
    name: "Génie Civil",
    school: "INPHB",
    duration: "5 ans (Ingénieur)",
    level: "Bac+5",
    demand: "Élevée",
  },
  {
    name: "Médecine Générale",
    school: "UFHB",
    duration: "7 ans",
    level: "Bac+7",
    demand: "Très élevée",
  },
  {
    name: "Droit des Affaires",
    school: "UFHB",
    duration: "3 ans (Licence)",
    level: "Bac+3",
    demand: "Moyenne",
  },
];

// ─── Level label mapping ─────────────────────────────────────────────────────

const LEVEL_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

// ─── Inner authenticated content ─────────────────────────────────────────────

function EduFormelleContent({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("Écoles");
  const [searchQ, setSearchQ] = useState("");
  const [savedSchools, setSavedSchools] = useState<Set<number>>(new Set());
  const [appliedScholarships, setAppliedScholarships] = useState<Set<number>>(
    new Set(),
  );
  const [enrollingId, setEnrollingId] = useState<Id<"courses"> | null>(null);

  // Convex queries
  const courses = useQuery(api.education.listPublishedCourses, {});
  const enrollments = useQuery(api.education.getMyEnrollments, {});
  const enrollInCourse = useMutation(api.education.enrollInCourse);

  // Determine enrolled course IDs for visual state
  const enrolledCourseIds = new Set(
    (enrollments ?? [])
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .map((e) => {
        const enrollment = e as { courseId: Id<"courses"> };
        return enrollment.courseId;
      }),
  );

  const handleEnroll = async (courseId: Id<"courses">) => {
    setEnrollingId(courseId);
    try {
      await enrollInCourse({ courseId });
      UIService.openToast("Inscription réussie !", "success");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Erreur lors de l'inscription";
      UIService.openToast(msg, "error");
    } finally {
      setEnrollingId(null);
    }
  };

  // Use courses from Convex if available, otherwise show static schools
  const hasCourses = courses !== undefined && courses.length > 0;
  const filteredSchools = SCHOOLS_STATIC.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQ.toLowerCase()),
  );
  const filteredCourses = (courses ?? []).filter(
    (c) =>
      c.title.toLowerCase().includes(searchQ.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQ.toLowerCase()),
  );

  // Stats
  const coursesCount = hasCourses ? courses.length : SCHOOLS_STATIC.length;
  const scholCount = SCHOLARSHIPS_STATIC.length;
  const enrolledCount = enrollments?.length ?? 0;

  return (
    <View
      className="h-full flex flex-col overflow-hidden"
      style={{  }}
    >
      {/* Header */}
      <View className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Pressable
          onPress={onBack}
          className="p-2 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft size={18} color="white" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-white font-bold text-lg">Éducation Formelle</Text>
          <Text className="text-gray-400 text-xs">Écoles · Bourses · Programmes</Text>
        </View>
        <View
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(167,139,250,0.15)" }}
        >
          <GraduationCap size={16} color="#A78BFA" />
        </View>
      </View>

      {/* Stats Row */}
      <View className="flex gap-2 px-4 mb-4">
        {[
          {
            icon: BookOpen,
            label: "Cours",
            value: String(coursesCount),
            color: "#A78BFA",
          },
          {
            icon: DollarSign,
            label: "Bourses actives",
            value: String(scholCount),
            color: "#10B981",
          },
          {
            icon: Users,
            label: "Mes inscriptions",
            value: String(enrolledCount),
            color: "#F97316",
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <View
            key={label}
            className="flex-1 p-3 rounded-xl text-center"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <Icon size={14} color={color} className="mx-auto mb-1" />
            <Text className="text-white font-bold text-sm">{value}</Text>
            <Text className="text-gray-500 text-xs">{label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View
        className="flex gap-1 mx-4 mb-4 p-1 rounded-xl"
        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
      >
        {["Écoles", "Bourses", "Programmes"].map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-lg text-xs font-medium"
            style={{ backgroundColor: activeTab === tab ? "rgba(255,255,255,0.1)" : "transparent" }}
          >
            {tab}
          </Pressable>
        ))}
      </View>

      <View className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
        {/* Écoles / Courses tab */}
        {activeTab === "Écoles" && (
          <>
            <View
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
            >
              <Search size={14} color="#9CA3AF" />
              <TextInput
                value={searchQ}
                onChangeText={(text) => setSearchQ(text)}
                placeholder={
                  hasCourses
                    ? "Rechercher un cours..."
                    : "Rechercher une école..."
                }
                className="flex-1 bg-transparent text-white text-sm outline-none"
              />
            </View>

            {/* Loading skeleton */}
            {courses === undefined && (
              <View className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                ))}
              </View>
            )}

            {/* Convex courses */}
            {hasCourses &&
              filteredCourses.map((course, i) => {
                const isEnrolled = enrolledCourseIds.has(course._id);
                const colors = [
                  "#6366F1",
                  "#F97316",
                  "#10B981",
                  "#8B5CF6",
                  "#EC4899",
                ];
                const cardColor = colors[i % colors.length];

                return (
                  <View
                    key={course._id}
                    className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
                  >
                    {course.coverImage && (
                      <View className="relative">
                        <Image
                         
                         
                          className="w-full h-32 object-cover"
                         source={{ uri: course.coverImage }} accessibilityLabel={course.title}/>
                        <View
                          className="absolute inset-0"
                          style={{  }}
                        />
                        <Text
                          className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full"
                          style={{ backgroundColor: `${cardColor}CC`, color: "white" }}
                        >
                          {course.category}
                        </Text>
                      </View>
                    )}
                    {!course.coverImage && (
                      <View
                        className="relative h-32 flex items-center justify-center"
                        style={{ backgroundColor: `${cardColor}20` }}
                      >
                        <GraduationCap size={40} color={cardColor} />
                        <Text
                          className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full"
                          style={{ backgroundColor: `${cardColor}CC`, color: "white" }}
                        >
                          {course.category}
                        </Text>
                      </View>
                    )}
                    <View className="p-3">
                      <Text className="text-white font-bold text-sm">
                        {course.title}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-0.5">
                        {course.description}
                      </Text>
                      <View className="flex items-center gap-3 mt-2 mb-2">
                        <View className="flex items-center gap-1">
                          <BookOpen size={10} color="#9CA3AF" />
                          <Text className="text-gray-400 text-xs">
                            {course.lessonCount} leçons
                          </Text>
                        </View>
                        {course.duration && (
                          <View className="flex items-center gap-1">
                            <Clock size={10} color="#9CA3AF" />
                            <Text className="text-gray-400 text-xs">
                              {course.duration}
                            </Text>
                          </View>
                        )}
                        <View className="flex items-center gap-1">
                          <Users size={10} color="#9CA3AF" />
                          <Text className="text-gray-400 text-xs">
                            {course.enrollmentCount}
                          </Text>
                        </View>
                        {course.rating && (
                          <View className="flex items-center gap-1">
                            <Star size={10} color="#F59E0B" fill="#F59E0B" />
                            <Text className="text-white text-xs">
                              {course.rating.toFixed(1)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View className="flex items-center justify-between">
                        <View className="flex items-center gap-2">
                          <Text
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "rgba(167,139,250,0.15)", color: "#A78BFA" }}
                          >
                            {LEVEL_LABELS[course.level] ?? course.level}
                          </Text>
                          <Text
                            className="text-xs"
                            style={{
                              color: course.isFree ? "#10B981" : "#F59E0B",
                            }}
                          >
                            {course.isFree
                              ? "Gratuit"
                              : `${course.price.toLocaleString()} ${course.currency}`}
                          </Text>
                        </View>
                        {isEnrolled ? (
                          <View
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl"
                            style={{ backgroundColor: "rgba(16,185,129,0.15)" }}
                          >
                            <CheckCircle size={12} color="#10B981" />
                            <Text className="text-green-400 text-xs font-medium">
                              Inscrit
                            </Text>
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => handleEnroll(course._id)}
                            disabled={enrollingId === course._id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-50"
                            style={{ backgroundColor: cardColor }}
                          >
                            {enrollingId === course._id ? "..." : "S'inscrire"}
                            <ChevronRight size={10} />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}

            {/* Static fallback when no courses in Convex */}
            {courses !== undefined &&
              courses.length === 0 &&
              filteredSchools.map((school, i) => (
                <View
                  key={school.id}
                  className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
                >
                  <View className="relative">
                    <Image
                     
                     
                      className="w-full h-32 object-cover"
                     source={{ uri: school.img }} accessibilityLabel={school.name}/>
                    <View
                      className="absolute inset-0"
                      style={{  }}
                    />
                    <Text
                      className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${school.color}CC`, color: "white" }}
                    >
                      {school.type}
                    </Text>
                    <Pressable
                      onPress={() =>
                        setSavedSchools((p) => {
                          const n = new Set(p);
                          if (n.has(school.id)) {
                            n.delete(school.id);
                          } else {
                            n.add(school.id);
                          }
                          return n;
                        })
                      }
                      className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                    >
                      <Star
                        size={14}
                        color={
                          savedSchools.has(school.id) ? "#F59E0B" : "white"
                        }
                        fill={savedSchools.has(school.id) ? "#F59E0B" : "none"}
                      />
                    </Pressable>
                  </View>
                  <View className="p-3">
                    <Text className="text-white font-bold text-sm">
                      {school.name}
                    </Text>
                    <View className="flex items-center gap-3 mt-1 mb-2">
                      <View className="flex items-center gap-1">
                        <MapPin size={10} color="#9CA3AF" />
                        <Text className="text-gray-400 text-xs">
                          {school.city}
                        </Text>
                      </View>
                      <View className="flex items-center gap-1">
                        <Star size={10} color="#F59E0B" fill="#F59E0B" />
                        <Text className="text-white text-xs">
                          {school.rating}
                        </Text>
                      </View>
                      <View className="flex items-center gap-1">
                        <Users size={10} color="#9CA3AF" />
                        <Text className="text-gray-400 text-xs">
                          {school.students.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <View className="flex items-center justify-between">
                      <Text className="text-xs" style={{ color: "#10B981" }}>
                        {school.tuition}
                      </Text>
                      <Pressable
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={{ backgroundColor: school.color }}
                      >
                        <Text>Voir détails</Text><ChevronRight size={10} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
          </>
        )}

        {/* Bourses */}
        {activeTab === "Bourses" && (
          <>
            <View
              className="p-3 rounded-xl flex items-center gap-2"
              style={{ backgroundColor: "rgba(16,185,129,0.08)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)", borderStyle: "solid" }}
            >
              <Award size={14} color="#10B981" />
              <Text className="text-green-400 text-xs">
                {
                  SCHOLARSHIPS_STATIC.filter((s) => s.status === "Ouvert")
                    .length
                }{" "}
                bourses ouvertes – Candidatez maintenant !
              </Text>
            </View>
            {SCHOLARSHIPS_STATIC.map((s, i) => (
              <View
                key={i}
                className="p-4 rounded-2xl"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
              >
                <View className="flex items-start justify-between gap-2 mb-2">
                  <Text className="text-white font-semibold text-sm flex-1">
                    {s.name}
                  </Text>
                  <Text
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: s.status === "Ouvert"
                                              ? "rgba(16,185,129,0.15)"
                                              : "rgba(245,158,11,0.15)", color: s.status === "Ouvert" ? "#10B981" : "#F59E0B" }}
                  >
                    {s.status}
                  </Text>
                </View>
                <View className="gap-1 mb-3">
                  <View className="flex items-center gap-1">
                    <DollarSign size={10} color="#10B981" />
                    <Text className="text-green-400 text-xs font-medium">
                      {s.amount}
                    </Text>
                  </View>
                  <View className="flex items-center gap-1">
                    <Clock size={10} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs">
                      Avant {s.deadline}
                    </Text>
                  </View>
                  <View className="flex items-center gap-1">
                    <GraduationCap size={10} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs">{s.level}</Text>
                  </View>
                  <View className="flex items-center gap-1">
                    <BookOpen size={10} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs">{s.field}</Text>
                  </View>
                </View>
                {s.status === "Ouvert" &&
                  (appliedScholarships.has(i) ? (
                    <View
                      className="w-full py-2 rounded-xl flex items-center justify-center gap-2"
                      style={{ backgroundColor: "rgba(16,185,129,0.15)" }}
                    >
                      <CheckCircle size={14} color="#10B981" />
                      <Text className="text-green-400 text-sm font-medium">
                        Candidature envoyée
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() =>
                        setAppliedScholarships((p) => new Set([...p, i]))
                      }
                      className="w-full py-2 rounded-xl text-sm font-bold"
                      style={{ backgroundColor: "#A78BFA" }}
                    >
                      <Text>Postuler maintenant</Text></Pressable>
                  ))}
              </View>
            ))}
          </>
        )}

        {/* Programmes */}
        {activeTab === "Programmes" && (
          <>
            {PROGRAMS_STATIC.map((p, i) => (
              <View
                key={i}
                className="flex items-center gap-3 p-4 rounded-2xl"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
              >
                <View
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(167,139,250,0.15)" }}
                >
                  <GraduationCap size={18} color="#A78BFA" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-sm">{p.name}</Text>
                  <View className="flex items-center gap-2 mt-0.5">
                    <Text className="text-gray-400 text-xs">{p.school}</Text>
                    <Text className="text-gray-500 text-xs">·</Text>
                    <Text className="text-gray-400 text-xs">{p.duration}</Text>
                  </View>
                </View>
                <View className="text-right">
                  <Text
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: p.demand === "Très élevée"
                                              ? "rgba(239,68,68,0.15)"
                                              : "rgba(245,158,11,0.15)", color: p.demand === "Très élevée" ? "#EF4444" : "#F59E0B" }}
                  >
                    {p.demand}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">{p.level}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </View>
    </View>
  );
}

// ─── Unauthenticated fallback (static data only) ─────────────────────────────

function EduFormelleStatic({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("Écoles");
  const [searchQ, setSearchQ] = useState("");
  const { isAuthenticated } = useFirebaseAuth();
  const filteredSchools = SCHOOLS_STATIC.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQ.toLowerCase()),
  );

  return (
    <View
      className="h-full flex flex-col overflow-hidden"
      style={{  }}
    >
      {/* Header */}
      <View className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Pressable
          onPress={onBack}
          className="p-2 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft size={18} color="white" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-white font-bold text-lg">Éducation Formelle</Text>
          <Text className="text-gray-400 text-xs">Écoles · Bourses · Programmes</Text>
        </View>
        <View
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(167,139,250,0.15)" }}
        >
          <GraduationCap size={16} color="#A78BFA" />
        </View>
      </View>

      {/* Sign-in banner */}
      <View
        className="mx-4 mb-4 p-3 rounded-xl flex items-center gap-3"
        style={{ backgroundColor: "rgba(167,139,250,0.08)", borderWidth: 1, borderColor: "rgba(167,139,250,0.2)", borderStyle: "solid" }}
      >
        <GraduationCap size={16} color="#A78BFA" />
        <View className="flex-1">
          <Text className="text-white text-xs font-medium">
            Connectez-vous pour vous inscrire aux cours
          </Text>
        </View>
        <Pressable
          onPress={() => {
            undefined.reload();
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{ backgroundColor: "#A78BFA" }}
        >
          <Text>Connexion</Text></Pressable>
      </View>

      {/* Stats Row */}
      <View className="flex gap-2 px-4 mb-4">
        {[
          {
            icon: BookOpen,
            label: "Établissements",
            value: "400+",
            color: "#A78BFA",
          },
          {
            icon: DollarSign,
            label: "Bourses actives",
            value: "24",
            color: "#10B981",
          },
          { icon: Users, label: "Étudiants", value: "250K+", color: "#F97316" },
        ].map(({ icon: Icon, label, value, color }) => (
          <View
            key={label}
            className="flex-1 p-3 rounded-xl text-center"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <Icon size={14} color={color} className="mx-auto mb-1" />
            <Text className="text-white font-bold text-sm">{value}</Text>
            <Text className="text-gray-500 text-xs">{label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View
        className="flex gap-1 mx-4 mb-4 p-1 rounded-xl"
        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
      >
        {["Écoles", "Bourses", "Programmes"].map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-lg text-xs font-medium"
            style={{ backgroundColor: activeTab === tab ? "rgba(255,255,255,0.1)" : "transparent" }}
          >
            {tab}
          </Pressable>
        ))}
      </View>

      <View className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
        {activeTab === "Écoles" && (
          <>
            <View
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
            >
              <Search size={14} color="#9CA3AF" />
              <TextInput
                value={searchQ}
                onChangeText={(text) => setSearchQ(text)}
                placeholder="Rechercher une école..."
                className="flex-1 bg-transparent text-white text-sm outline-none"
              />
            </View>
            {filteredSchools.map((school, i) => (
              <View
                key={school.id}
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
              >
                <View className="relative">
                  <Image
                   
                   
                    className="w-full h-32 object-cover"
                   source={{ uri: school.img }} accessibilityLabel={school.name}/>
                  <View
                    className="absolute inset-0"
                    style={{  }}
                  />
                  <Text
                    className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${school.color}CC`, color: "white" }}
                  >
                    {school.type}
                  </Text>
                </View>
                <View className="p-3">
                  <Text className="text-white font-bold text-sm">{school.name}</Text>
                  <View className="flex items-center gap-3 mt-1 mb-2">
                    <View className="flex items-center gap-1">
                      <MapPin size={10} color="#9CA3AF" />
                      <Text className="text-gray-400 text-xs">
                        {school.city}
                      </Text>
                    </View>
                    <View className="flex items-center gap-1">
                      <Star size={10} color="#F59E0B" fill="#F59E0B" />
                      <Text className="text-white text-xs">
                        {school.rating}
                      </Text>
                    </View>
                    <View className="flex items-center gap-1">
                      <Users size={10} color="#9CA3AF" />
                      <Text className="text-gray-400 text-xs">
                        {school.students.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View className="flex items-center justify-between">
                    <Text className="text-xs" style={{ color: "#10B981" }}>
                      {school.tuition}
                    </Text>
                    <Pressable
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{ backgroundColor: school.color }}
                    >
                      <Text>Voir détails</Text><ChevronRight size={10} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === "Bourses" &&
          SCHOLARSHIPS_STATIC.map((s, i) => (
            <View
              key={i}
              className="p-4 rounded-2xl"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
            >
              <Text className="text-white font-semibold text-sm mb-2">{s.name}</Text>
              <View className="gap-1">
                <View className="flex items-center gap-1">
                  <DollarSign size={10} color="#10B981" />
                  <Text className="text-green-400 text-xs">{s.amount}</Text>
                </View>
                <View className="flex items-center gap-1">
                  <Clock size={10} color="#9CA3AF" />
                  <Text className="text-gray-400 text-xs">{s.deadline}</Text>
                </View>
                <View className="flex items-center gap-1">
                  <GraduationCap size={10} color="#9CA3AF" />
                  <Text className="text-gray-400 text-xs">{s.level}</Text>
                </View>
                <View className="flex items-center gap-1">
                  <BookOpen size={10} color="#9CA3AF" />
                  <Text className="text-gray-400 text-xs">{s.field}</Text>
                </View>
              </View>
            </View>
          ))}

        {activeTab === "Programmes" &&
          PROGRAMS_STATIC.map((p, i) => (
            <View
              key={i}
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
            >
              <View
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(167,139,250,0.15)" }}
              >
                <GraduationCap size={18} color="#A78BFA" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-sm">{p.name}</Text>
                <Text className="text-gray-400 text-xs">
                  {p.school} · {p.duration}
                </Text>
              </View>
              <Text
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: p.demand === "Très élevée"
                                      ? "rgba(239,68,68,0.15)"
                                      : "rgba(245,158,11,0.15)", color: p.demand === "Très élevée" ? "#EF4444" : "#F59E0B" }}
              >
                {p.demand}
              </Text>
            </View>
          ))}
      </View>
    </View>
  );
}

// ─── Main export with auth handling ──────────────────────────────────────────

export default function EduFormellePage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <AuthLoading>
        <View
          className="h-full flex flex-col overflow-hidden"
          style={{  }}
        >
          <View className="flex items-center gap-3 px-4 pt-12 pb-4">
            <Pressable
              onPress={onBack}
              className="p-2 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <ArrowLeft size={18} color="white" />
            </Pressable>
            <Skeleton className="h-6 w-48" />
          </View>
          <View className="flex gap-2 px-4 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="flex-1 h-20 rounded-xl" />
            ))}
          </View>
          <View className="px-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </View>
        </View>
      </AuthLoading>
      <Authenticated>
        <EduFormelleContent onBack={onBack} />
      </Authenticated>
      <Unauthenticated>
        <EduFormelleStatic onBack={onBack} />
      </Unauthenticated>
    </>
  );
}

import { UIService } from "@/core/sdk/ui/UIService";
import { View, Pressable, Text, Image, TextInput } from "react-native";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Play,
  CheckCircle2,
  Clock,
  Star,
  Award,
  ChevronRight,
  Lock,
  Search,
  Filter,
  Trophy,
  X,
  Sparkles,
  BarChart2,
  LogIn,
  Info,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton } from "@/components/ui/signin";
import { ConvexError } from "convex/values";
import type { Id } from "@/convex/_generated/dataModel.d";

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Tous",
  "Tech",
  "Business",
  "Agriculture",
  "Santé",
  "Langues",
];
const LEVELS = ["Tous niveaux", "Débutant", "Intermédiaire", "Avancé"];

type Level = "Débutant" | "Intermédiaire" | "Avancé";
type Category = "Tech" | "Business" | "Agriculture" | "Santé" | "Langues";

interface Chapter {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
}

interface Course {
  id: string;
  title: string;
  instructor: string;
  category: Category;
  level: Level;
  duration: string;
  rating: number;
  students: number;
  progress: number;
  image: string;
  color: string;
  chapters: Chapter[];
  description: string;
  isFromDb: boolean;
}

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

const DEFAULT_COURSE_IMAGE =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600";

const STATIC_COURSES: Course[] = [
  {
    id: "c1",
    title: "Développement Web avec React",
    instructor: "Kwame Asante",
    category: "Tech",
    level: "Intermédiaire",
    duration: "12h",
    rating: 4.8,
    students: 2340,
    progress: 65,
    image:
      "https://images.unsplash.com/photo-1528901166007-3784c7dd3653?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    color: "#8B5CF6",
    description:
      "Maîtrisez React pour créer des applications web modernes et réactives, de zéro à déployées.",
    isFromDb: false,
    chapters: [
      {
        id: "ch1",
        title: "Introduction à React",
        duration: "45 min",
        completed: true,
        locked: false,
      },
      {
        id: "ch2",
        title: "Composants & Props",
        duration: "1h",
        completed: true,
        locked: false,
      },
      {
        id: "ch3",
        title: "State & Hooks",
        duration: "1h30",
        completed: true,
        locked: false,
      },
      {
        id: "ch4",
        title: "Routing & Navigation",
        duration: "1h",
        completed: false,
        locked: false,
      },
      {
        id: "ch5",
        title: "APIs & Fetch",
        duration: "1h15",
        completed: false,
        locked: false,
      },
      {
        id: "ch6",
        title: "Déploiement",
        duration: "45 min",
        completed: false,
        locked: true,
      },
    ],
  },
  {
    id: "c2",
    title: "Marketing Digital en Afrique",
    instructor: "Aminata Diallo",
    category: "Business",
    level: "Débutant",
    duration: "8h",
    rating: 4.9,
    students: 5120,
    progress: 0,
    image:
      "https://images.unsplash.com/photo-1620829813573-7c9e1877706f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    color: "#F97316",
    description:
      "Stratégies de croissance adaptées aux marchés africains : réseaux sociaux, WhatsApp marketing, SEO local.",
    isFromDb: false,
    chapters: [
      {
        id: "ch1",
        title: "Le marché africain digital",
        duration: "30 min",
        completed: false,
        locked: false,
      },
      {
        id: "ch2",
        title: "WhatsApp Business avancé",
        duration: "1h",
        completed: false,
        locked: false,
      },
      {
        id: "ch3",
        title: "Publicité Facebook & Instagram",
        duration: "1h30",
        completed: false,
        locked: true,
      },
      {
        id: "ch4",
        title: "SEO pour l'Afrique",
        duration: "1h",
        completed: false,
        locked: true,
      },
    ],
  },
  {
    id: "c3",
    title: "Agriculture Bio & Rentable",
    instructor: "Théodore Nkosi",
    category: "Agriculture",
    level: "Débutant",
    duration: "6h",
    rating: 4.7,
    students: 3800,
    progress: 100,
    image:
      "https://images.unsplash.com/photo-1622294763041-40e2e4932eda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    color: "#22C55E",
    description:
      "Techniques d'agriculture bio adaptées aux sols africains pour maximiser rendement et revenus.",
    isFromDb: false,
    chapters: [
      {
        id: "ch1",
        title: "Préparation du sol",
        duration: "45 min",
        completed: true,
        locked: false,
      },
      {
        id: "ch2",
        title: "Semences & Cultures",
        duration: "1h",
        completed: true,
        locked: false,
      },
      {
        id: "ch3",
        title: "Irrigation durable",
        duration: "1h",
        completed: true,
        locked: false,
      },
      {
        id: "ch4",
        title: "Marchés & Vente",
        duration: "1h15",
        completed: true,
        locked: false,
      },
    ],
  },
  {
    id: "c4",
    title: "Santé Communautaire",
    instructor: "Dr. Fatou Mbaye",
    category: "Santé",
    level: "Débutant",
    duration: "5h",
    rating: 4.6,
    students: 4200,
    progress: 30,
    image:
      "https://images.unsplash.com/photo-1620831468075-db24ca183258?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    color: "#EF4444",
    description:
      "Premiers secours, prévention des maladies tropicales et hygiène pour communautés rurales.",
    isFromDb: false,
    chapters: [
      {
        id: "ch1",
        title: "Premiers secours essentiels",
        duration: "1h",
        completed: true,
        locked: false,
      },
      {
        id: "ch2",
        title: "Maladies tropicales",
        duration: "1h30",
        completed: false,
        locked: false,
      },
      {
        id: "ch3",
        title: "Hygiène & Prévention",
        duration: "1h",
        completed: false,
        locked: false,
      },
      {
        id: "ch4",
        title: "Nutrition de base",
        duration: "45 min",
        completed: false,
        locked: true,
      },
    ],
  },
  {
    id: "c5",
    title: "Parler Français Professionnel",
    instructor: "Claire Dumont",
    category: "Langues",
    level: "Intermédiaire",
    duration: "10h",
    rating: 4.8,
    students: 6700,
    progress: 0,
    image:
      "https://images.unsplash.com/photo-1532708059644-5590ed51ce4c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    color: "#06B6D4",
    description:
      "Maîtrisez le français des affaires : emails, réunions, négociations et présentations professionnelles.",
    isFromDb: false,
    chapters: [
      {
        id: "ch1",
        title: "Rédaction d'emails pro",
        duration: "1h",
        completed: false,
        locked: false,
      },
      {
        id: "ch2",
        title: "Vocabulaire des affaires",
        duration: "1h30",
        completed: false,
        locked: false,
      },
      {
        id: "ch3",
        title: "Réunions efficaces",
        duration: "1h",
        completed: false,
        locked: true,
      },
      {
        id: "ch4",
        title: "Présentations percutantes",
        duration: "1h30",
        completed: false,
        locked: true,
      },
    ],
  },
  {
    id: "c6",
    title: "Création d'Entreprise en Afrique",
    instructor: "Ibrahima Koné",
    category: "Business",
    level: "Avancé",
    duration: "15h",
    rating: 4.9,
    students: 2900,
    progress: 10,
    image:
      "https://images.unsplash.com/photo-1627423893729-3a79f48ff473?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    color: "#EC4899",
    description:
      "De l'idée au lancement : business plan, financement, réglementation et croissance dans les marchés africains.",
    isFromDb: false,
    chapters: [
      {
        id: "ch1",
        title: "Valider son idée",
        duration: "1h",
        completed: true,
        locked: false,
      },
      {
        id: "ch2",
        title: "Business Plan",
        duration: "2h",
        completed: false,
        locked: false,
      },
      {
        id: "ch3",
        title: "Financement & Investisseurs",
        duration: "2h",
        completed: false,
        locked: true,
      },
      {
        id: "ch4",
        title: "Aspects juridiques",
        duration: "1h30",
        completed: false,
        locked: true,
      },
      {
        id: "ch5",
        title: "Croissance & Scaling",
        duration: "2h",
        completed: false,
        locked: true,
      },
    ],
  },
];

// ─── Certificate Modal ────────────────────────────────────────────────────────

function CertificateModal({
  course,
  onClose,
}: {
  course: Course;
  onClose: () => void;
}) {
  return (
    <Pressable
      className="absolute inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onPress={onClose}
    >
      <Pressable
        onPress={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }}
      >
        {/* Sparkle header */}
        <View
          className="relative px-6 pt-8 pb-6 flex flex-col items-center"
          style={{  }}
        >
          <View
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{  }}
          >
            <Trophy size={36} className="text-white" />
          </View>
          <Text className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">
            Félicitations !
          </Text>
          <Text className="text-xl font-black text-white text-center leading-tight">
            Certificat Obtenu
          </Text>
        </View>

        <View className="px-6 pb-8 flex flex-col items-center gap-4">
          {/* Certificate card */}
          <View
            className="w-full rounded-2xl p-4 flex flex-col items-center gap-2"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", borderStyle: "solid" }}
          >
            <Award size={24} style={{ color: course.color }} />
            <Text className="text-sm font-bold text-white text-center">
              {course.title}
            </Text>
            <Text className="text-xs text-white/40">
              Marc Mutombo —{" "}
              {new Date().toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
            <View className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className="fill-yellow-400 text-yellow-400"
                />
              ))}
            </View>
          </View>

          <Text className="text-xs text-white/40 text-center">
            Ce certificat atteste que vous avez complété 100% du cours avec
            succès.
          </Text>

          <Pressable
            onPress={onClose}
            className="w-full py-3 rounded-2xl font-bold text-sm text-white"
            style={{  }}
          >
            <Text>Partager le Certificat</Text></Pressable>
          <Pressable
            onPress={onClose}
            className="text-xs text-white/30"
          >
            <Text>Fermer</Text></Pressable>
        </View>
      </Pressable>
    </Pressable>
  );
}

// ─── Course Detail / Player ───────────────────────────────────────────────────

function CourseDetail({
  course,
  onBack,
  onEnroll,
  isAuthenticated,
}: {
  course: Course;
  onBack: () => void;
  onEnroll: (courseId: string) => void;
  isAuthenticated: boolean;
}) {
  const [showCert, setShowCert] = useState(false);
  const completedCount = course.chapters.filter((c) => c.completed).length;
  const isCompleted = course.progress === 100;

  return (
    <View
      className="absolute inset-0 z-20 overflow-y-auto"
      style={{ backgroundColor: "#07070f" }}
    >
      {/* Hero */}
      <View className="relative h-52 flex-shrink-0">
        <Image
         
         
          className="w-full h-full object-cover"
         source={{ uri: course.image }} accessibilityLabel={course.title}/>
        <View
          className="absolute inset-0"
          style={{  }}
        />
        <Pressable
          onPress={onBack}
          className="absolute top-4 left-4 w-9 h-9 rounded-2xl flex items-center justify-center z-10"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
        >
          <ArrowLeft size={16} className="text-white" />
        </Pressable>
        {isCompleted && (
          <Pressable
            onPress={() => setShowCert(true)}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl z-10"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 1, borderColor: "rgba(245,158,11,0.4)", borderStyle: "solid" }}
          >
            <Trophy size={12} className="text-yellow-400" />
            <Text className="text-[11px] font-bold text-yellow-400">
              Certificat
            </Text>
          </Pressable>
        )}
      </View>

      <View className="px-4 pb-24">
        {/* Meta */}
        <View className="flex items-center gap-2 mb-2 mt-3">
          <Text
            className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${course.color}22`, color: course.color }}
          >
            {course.category}
          </Text>
          <Text className="text-[10px] font-bold text-white/40">
            {course.level}
          </Text>
          <Text className="text-[10px] font-bold text-white/40">·</Text>
          <Clock size={10} className="text-white/40" />
          <Text className="text-[10px] font-bold text-white/40">
            {course.duration}
          </Text>
        </View>

        <Text className="text-xl font-black text-white mb-1 leading-tight">
          {course.title}
        </Text>
        <Text className="text-sm text-white/50 mb-3">{course.description}</Text>

        <View className="flex items-center gap-2 mb-5">
          <Image
           
           
            className="w-7 h-7 rounded-full"
           source={{ uri: `https://api.dicebear.com/7.x/thumbs/svg?seed=${course.instructor}` }} accessibilityLabel={course.instructor}/>
          <Text className="text-xs text-white/60">{course.instructor}</Text>
          <View className="flex items-center gap-0.5 ml-auto">
            <Star size={11} className="fill-yellow-400 text-yellow-400" />
            <Text className="text-xs font-bold text-yellow-400">
              {course.rating}
            </Text>
            <Text className="text-xs text-white/30 ml-1">
              ({course.students.toLocaleString()} élèves)
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View
          className="rounded-2xl p-4 mb-5"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
        >
          <View className="flex items-center justify-between mb-2">
            <Text className="text-xs font-bold text-white/70">Progression</Text>
            <Text
              className="text-xs font-black"
              style={{ color: course.color }}
            >
              {course.progress}%
            </Text>
          </View>
          <View
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <View
              className="h-full rounded-full"
              style={{  }}
            />
          </View>
          <Text className="text-[11px] text-white/30 mt-2">
            {completedCount}/{course.chapters.length} chapitres terminés
          </Text>
        </View>

        {/* Chapters */}
        <Text className="text-base font-black text-white mb-3">Chapitres</Text>
        {course.chapters.length === 0 ? (
          <View
            className="rounded-2xl p-6 flex flex-col items-center gap-3 text-center"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
          >
            <Info size={24} className="text-white/20" />
            <Text className="text-sm text-white/40">Cours en cours de création</Text>
            <Text className="text-xs text-white/25">
              Le contenu détaillé sera bientôt disponible.
            </Text>
          </View>
        ) : (
          <View className="flex flex-col gap-2">
            {course.chapters.map((ch, idx) => (
              <View
                key={ch.id}
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ backgroundColor: ch.completed
                                    ? `${course.color}14`
                                    : "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.05)", borderStyle: "solid", opacity: ch.locked ? 0.45 : 1 }}
              >
                <View
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: ch.completed
                                        ? `${course.color}22`
                                        : "rgba(255,255,255,0.05)" }}
                >
                  {ch.locked ? (
                    <Lock size={13} className="text-white/30" />
                  ) : ch.completed ? (
                    <CheckCircle2 size={15} style={{ color: course.color }} />
                  ) : (
                    <Play size={13} className="text-white/60" />
                  )}
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-semibold text-white truncate">
                    {idx + 1}. {ch.title}
                  </Text>
                  <View className="flex items-center gap-1">
                    <Clock size={9} className="text-white/30" />
                    <Text className="text-[10px] text-white/30">
                      {ch.duration}
                    </Text>
                  </View>
                </View>
                {!ch.locked && !ch.completed && (
                  <View
                    className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${course.color}22` }}
                  >
                    <ChevronRight size={12} style={{ color: course.color }} />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* CTA */}
        {!isCompleted && (
          <Pressable
            onPress={() => onEnroll(course.id)}
            className="w-full mt-6 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2"
            style={{  }}
          >
            {!isAuthenticated ? (
              <>
                <LogIn size={16} />
                <Text>Se connecter pour commencer</Text></>
            ) : (
              <>
                <Play size={16} />
                {course.progress > 0
                  ? "Continuer le cours"
                  : "Commencer le cours"}
              </>
            )}
          </Pressable>
        )}
        {isCompleted && (
          <Pressable
            onPress={() => setShowCert(true)}
            className="w-full mt-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2"
            style={{  }}
          >
            <Trophy size={16} />
            <Text>Voir mon Certificat</Text></Pressable>
        )}
      </View>

      <>
        {showCert && (
          <CertificateModal
            course={course}
            onClose={() => setShowCert(false)}
          />
        )}
      </>
    </View>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({
  course,
  onOpen,
}: {
  course: Course;
  onOpen: () => void;
}) {
  return (
    <Pressable
      onPress={onOpen}
      className="w-full text-left rounded-2xl overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
    >
      <View className="relative h-32">
        <Image
         
         
          className="w-full h-full object-cover"
         source={{ uri: course.image }} accessibilityLabel={course.title}/>
        <View
          className="absolute inset-0"
          style={{  }}
        />
        {course.progress === 100 && (
          <View
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          >
            <Trophy size={9} className="text-yellow-400" />
            <Text className="text-[9px] font-black text-yellow-400">
              Complété
            </Text>
          </View>
        )}
        {course.progress > 0 && course.progress < 100 && (
          <View
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <View
              className="h-full"
              style={{ width: `${course.progress}%`, backgroundColor: course.color }}
            />
          </View>
        )}
        <View className="absolute bottom-2 left-3">
          <Text
            className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${course.color}cc`, color: "white" }}
          >
            {course.category}
          </Text>
        </View>
      </View>

      <View className="p-3">
        <Text className="text-sm font-bold text-white leading-tight mb-1">
          {course.title}
        </Text>
        <Text className="text-[11px] text-white/40 mb-2">{course.instructor}</Text>
        <View className="flex items-center gap-3">
          <View className="flex items-center gap-0.5">
            <Star size={10} className="fill-yellow-400 text-yellow-400" />
            <Text className="text-[11px] font-bold text-yellow-400">
              {course.rating}
            </Text>
          </View>
          <View className="flex items-center gap-0.5">
            <Clock size={10} className="text-white/30" />
            <Text className="text-[11px] text-white/30">{course.duration}</Text>
          </View>
          <Text
            className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
          >
            {course.level}
          </Text>
        </View>
        {course.progress > 0 && course.progress < 100 && (
          <View className="mt-2 flex items-center gap-2">
            <View
              className="flex-1 h-1 rounded-full overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <View
                className="h-full rounded-full"
                style={{ width: `${course.progress}%`, backgroundColor: course.color }}
              />
            </View>
            <Text
              className="text-[10px] font-bold"
              style={{ color: course.color }}
            >
              {course.progress}%
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── Loading Skeletons ───────────────────────────────────────────────────────

function CourseCardSkeleton() {
  return (
    <View
      className="w-full rounded-2xl overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
    >
      <Skeleton className="h-32 w-full rounded-none" />
      <View className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </View>
    </View>
  );
}

function StatsStripSkeleton() {
  return (
    <View className="gap-2 mb-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <View
          key={i}
          className="rounded-2xl p-3 flex flex-col items-center gap-1"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
        >
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-6 w-8" />
          <Skeleton className="h-3 w-12" />
        </View>
      ))}
    </View>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface ApprendrePageProps {
  onBack: () => void;
}

export default function ApprendrePage({ onBack }: ApprendrePageProps) {
  const { user, loading: authLoading } = useFirebaseAuth();
  const isAuthenticated = !!user;

  const [selectedCat, setSelectedCat] = useState("Tous");
  const [selectedLevel, setSelectedLevel] = useState("Tous niveaux");
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // ─── Convex Queries ──────────────────────────────────────────────────────
  const dbCourses = useQuery(
    api.education.listPublishedCourses,
    selectedCat === "Tous" ? {} : { category: selectedCat },
  );

  const enrollments = useQuery(
    api.education.getMyEnrollments,
    isAuthenticated ? {} : "skip",
  );

  const stats = useQuery(
    api.education.getEducationStats,
    isAuthenticated ? {} : "skip",
  );

  const enrollInCourseMutation = useMutation(api.education.enrollInCourse);

  // ─── Build progress lookup from enrollments ──────────────────────────────
  const progressMap = new Map<string, number>();
  if (enrollments) {
    for (const enrollment of enrollments) {
      if (enrollment && "courseId" in enrollment) {
        progressMap.set(
          enrollment.courseId as string,
          enrollment.progressPct as number,
        );
      }
    }
  }

  // ─── Map DB courses to display format ────────────────────────────────────
  const isLoading = dbCourses === undefined;
  const usingDbData = dbCourses !== undefined && dbCourses.length > 0;

  const courses: Course[] = usingDbData
    ? dbCourses.map((c) => ({
        id: c._id as string,
        title: c.title,
        description: c.description,
        category: (CATEGORY_COLORS[c.category]
          ? c.category
          : "Tech") as Category,
        level: LEVEL_MAP[c.level] ?? "Débutant",
        duration: c.duration ?? "—",
        rating: c.rating ?? 4.5,
        students: c.enrollmentCount,
        progress: progressMap.get(c._id as string) ?? 0,
        image: c.coverImage || DEFAULT_COURSE_IMAGE,
        color: CATEGORY_COLORS[c.category] ?? "#8B5CF6",
        chapters: [],
        instructor: "Instructeur",
        isFromDb: true,
      }))
    : STATIC_COURSES;

  // ─── Filter courses (client-side for level/search when using all categories from DB)
  const filtered = courses.filter((c) => {
    const matchCat = selectedCat === "Tous" || c.category === selectedCat;
    const matchLevel =
      selectedLevel === "Tous niveaux" || c.level === selectedLevel;
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchLevel && matchSearch;
  });

  const inProgress = courses.filter((c) => c.progress > 0 && c.progress < 100);
  const completedCourses = courses.filter((c) => c.progress === 100);

  // ─── Stats ───────────────────────────────────────────────────────────────
  const statsInProgress = stats
    ? stats.coursesEnrolled - (stats.certificates ?? 0)
    : inProgress.length;
  const statsCompleted = stats ? stats.certificates : completedCourses.length;
  const statsTotal = courses.length;

  // ─── Enroll handler ──────────────────────────────────────────────────────
  const handleEnroll = async (courseId: string) => {
    if (!isAuthenticated) {
      UIService.openToast("Connectez-vous pour vous inscrire à un cours", "info");
      return;
    }
    if (!usingDbData) {
      UIService.openToast("Inscription simulée (données de démonstration)", "success");
      return;
    }
    try {
      await enrollInCourseMutation({ courseId: courseId as Id<"courses"> });
      UIService.openToast("Inscription réussie !", "success");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string; code: string };
        UIService.openToast(data.message, "error");
      } else {
        UIService.openToast("Erreur lors de l'inscription", "error");
      }
    }
  };

  return (
    <View
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ backgroundColor: "#07070f" }}
    >
      {/* Header */}
      <View
        className="flex-shrink-0 px-4 pt-4 pb-3"
        style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", borderBottomStyle: "solid" }}
      >
        <View className="flex items-center gap-3 mb-3">
          <Pressable
            onPress={onBack}
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <ArrowLeft size={16} className="text-white/70" />
          </Pressable>
          <View className="flex items-center gap-2 flex-1 min-w-0">
            <View
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(245,158,11,0.2)" }}
            >
              <BookOpen size={15} className="text-amber-400" />
            </View>
            <View className="min-w-0">
              <Text className="text-base font-black text-white leading-none">
                Apprendre
              </Text>
              <Text className="text-[10px] text-white/40">
                {courses.length} cours disponibles
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => setShowFilters(!showFilters)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: showFilters
                            ? "rgba(245,158,11,0.2)"
                            : "rgba(255,255,255,0.06)", borderColor: "rgba(245,158,11,0.3)", borderStyle: "solid" }}
          >
            <Filter
              size={14}
              className={showFilters ? "text-amber-400" : "text-white/50"}
            />
          </Pressable>
        </View>

        {/* Search */}
        <View
          className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          <Search size={14} className="text-white/30 flex-shrink-0" />
          <TextInput
            value={search}
            onChangeText={(text) => setSearch(text)}
            placeholder="Chercher un cours..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
          />
          {search && (
            <Pressable onPress={() => setSearch("")} className="">
              <X size={12} className="text-white/30" />
            </Pressable>
          )}
        </View>

        {/* Level filter */}
        <>
          {showFilters && (
            <View
              className="overflow-hidden"
            >
              <View
                className="flex gap-2 overflow-x-auto pt-3 pb-0.5"
                style={{  }}
              >
                {LEVELS.map((l) => (
                  <Pressable
                    key={l}
                    onPress={() => setSelectedLevel(l)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold"
                    style={{ backgroundColor: selectedLevel === l
                                              ? "rgba(245,158,11,0.2)"
                                              : "rgba(255,255,255,0.05)", borderColor: "rgba(245,158,11,0.3)", borderStyle: "solid" }}
                  >
                    {l}
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </>

        {/* Category chips */}
        <View
          className="flex gap-2 overflow-x-auto pt-3 pb-0.5"
          style={{  }}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setSelectedCat(cat)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold"
              style={{ backgroundColor: selectedCat === cat
                                  ? "rgba(245,158,11,0.2)"
                                  : "rgba(255,255,255,0.05)", borderColor: "rgba(245,158,11,0.3)", borderStyle: "solid" }}
            >
              {cat}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content */}
      <View
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{  }}
      >
        {/* Unauthenticated banner */}
        <Unauthenticated>
          <View
            className="rounded-2xl p-3 mb-4 flex items-center gap-3"
            style={{ backgroundColor: "rgba(245,158,11,0.08)", borderWidth: 1, borderColor: "rgba(245,158,11,0.2)", borderStyle: "solid" }}
          >
            <LogIn size={16} className="text-amber-400 flex-shrink-0" />
            <Text className="text-xs text-white/60 flex-1">
              Connectez-vous pour suivre votre progression
            </Text>
            <SignInButton />
          </View>
        </Unauthenticated>

        {/* Stats strip */}
        <AuthLoading>
          <StatsStripSkeleton />
        </AuthLoading>
        <Authenticated>
          {stats === undefined ? (
            <StatsStripSkeleton />
          ) : (
            <View className="gap-2 mb-5">
              {[
                {
                  icon: BookOpen,
                  label: "En cours",
                  value: statsInProgress,
                  color: "#8B5CF6",
                },
                {
                  icon: CheckCircle2,
                  label: "Complétés",
                  value: statsCompleted,
                  color: "#22C55E",
                },
                {
                  icon: BarChart2,
                  label: "Total",
                  value: statsTotal,
                  color: "#F59E0B",
                },
              ].map(({ icon: Icon, label, value, color }) => (
                <View
                  key={label}
                  className="rounded-2xl p-3 flex flex-col items-center gap-1"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
                >
                  <Icon size={14} style={{ color }} />
                  <Text className="text-lg font-black text-white">{value}</Text>
                  <Text className="text-[10px] text-white/30">{label}</Text>
                </View>
              ))}
            </View>
          )}
        </Authenticated>
        <Unauthenticated>
          <View className="gap-2 mb-5">
            {[
              {
                icon: BookOpen,
                label: "En cours",
                value: inProgress.length,
                color: "#8B5CF6",
              },
              {
                icon: CheckCircle2,
                label: "Complétés",
                value: completedCourses.length,
                color: "#22C55E",
              },
              {
                icon: BarChart2,
                label: "Total",
                value: courses.length,
                color: "#F59E0B",
              },
            ].map(({ icon: Icon, label, value, color }) => (
              <View
                key={label}
                className="rounded-2xl p-3 flex flex-col items-center gap-1"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
              >
                <Icon size={14} style={{ color }} />
                <Text className="text-lg font-black text-white">{value}</Text>
                <Text className="text-[10px] text-white/30">{label}</Text>
              </View>
            ))}
          </View>
        </Unauthenticated>

        {/* Loading state */}
        {isLoading ? (
          <View className="gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </View>
        ) : (
          <>
            {/* Continue learning */}
            {inProgress.length > 0 && selectedCat === "Tous" && !search && (
              <View className="mb-5">
                <View className="flex items-center gap-2 mb-3">
                  <Sparkles size={13} className="text-amber-400" />
                  <Text className="text-sm font-black text-white">Continuer</Text>
                </View>
                <View className="flex flex-col gap-2">
                  {inProgress.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onOpen={() => setSelectedCourse(course)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* All / filtered courses */}
            <View>
              <Text className="text-sm font-black text-white mb-3">
                {selectedCat === "Tous" && !search
                  ? "Tous les cours"
                  : `Résultats (${filtered.length})`}
              </Text>
              {filtered.length === 0 ? (
                <View className="flex flex-col items-center gap-3 py-12 text-center">
                  <BookOpen size={32} className="text-white/15" />
                  <Text className="text-sm text-white/30"><Text>Aucun cours trouvé</Text></Text>
                </View>
              ) : (
                <View className="gap-3">
                  {filtered.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onOpen={() => setSelectedCourse(course)}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </View>

      {/* Course detail overlay */}
      <>
        {selectedCourse && (
          <View
            key={selectedCourse.id}
            className="absolute inset-0 z-20"
          >
            <CourseDetail
              course={selectedCourse}
              onBack={() => setSelectedCourse(null)}
              onEnroll={handleEnroll}
              isAuthenticated={isAuthenticated}
            />
          </View>
        )}
      </>
    </View>
  );
}

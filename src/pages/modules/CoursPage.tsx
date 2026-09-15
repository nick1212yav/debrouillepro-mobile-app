import { View, Pressable, Text, Image, TextInput } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, Search, Play, BookOpen, Clock, Star, Users,
  ChevronRight, CheckCircle2, Circle, Lock, Flame,
  Code2, Briefcase, Languages, Palette, FlaskConical,
  TrendingUp, Award, X, PlayCircle, FileText, Zap,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

type Level = "débutant" | "intermédiaire" | "avancé";
type Category = "tech" | "business" | "langues" | "arts" | "science";

type Lesson = {
  id: string;
  title: string;
  type: "video" | "text" | "quiz";
  duration: string;
  done: boolean;
  locked: boolean;
};

type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

type Course = {
  id: string;
  title: string;
  instructor: string;
  instructorAvatar: string;
  category: Category;
  level: Level;
  duration: string;
  lessons: number;
  rating: number;
  students: number;
  cover: string;
  description: string;
  tags: string[];
  enrolled: boolean;
  progress: number;
  modules: Module[];
};

const CATEGORY_CONFIG: Record<Category, { label: string; icon: typeof Code2; color: string; gradient: string }> = {
  tech:     { label: "Technologie",  icon: Code2,         color: "text-blue-400",   gradient: "from-blue-500 to-cyan-500"     },
  business: { label: "Business",     icon: Briefcase,     color: "text-purple-400", gradient: "from-purple-500 to-pink-500"   },
  langues:  { label: "Langues",      icon: Languages,     color: "text-green-400",  gradient: "from-green-500 to-teal-500"    },
  arts:     { label: "Arts & Design",icon: Palette,       color: "text-orange-400", gradient: "from-orange-500 to-yellow-500" },
  science:  { label: "Science",      icon: FlaskConical,  color: "text-red-400",    gradient: "from-red-500 to-rose-500"      },
};

const LEVEL_COLOR: Record<Level, string> = {
  "débutant":      "bg-green-500/20 text-green-400 border-green-500/30",
  "intermédiaire": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "avancé":        "bg-red-500/20 text-red-400 border-red-500/30",
};

const COURSES: Course[] = [
  {
    id: "c1",
    title: "Python pour les Débutants",
    instructor: "Moussa Diallo",
    instructorAvatar: "MD",
    category: "tech",
    level: "débutant",
    duration: "12h",
    lessons: 48,
    rating: 4.8,
    students: 12400,
    cover: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
    description: "Apprends Python de zéro avec des projets concrets. Variables, fonctions, POO, et ton premier projet web avec Flask.",
    tags: ["python", "programmation", "débutant", "backend"],
    enrolled: true,
    progress: 62,
    modules: [
      {
        id: "m1", title: "Les Fondamentaux",
        lessons: [
          { id: "l1", title: "Introduction à Python", type: "video",  duration: "8min",  done: true,  locked: false },
          { id: "l2", title: "Variables et types",    type: "text",   duration: "12min", done: true,  locked: false },
          { id: "l3", title: "Conditions et boucles", type: "video",  duration: "15min", done: true,  locked: false },
          { id: "l4", title: "Quiz : les bases",      type: "quiz",   duration: "5min",  done: true,  locked: false },
        ],
      },
      {
        id: "m2", title: "Fonctions & Modules",
        lessons: [
          { id: "l5", title: "Définir une fonction",   type: "video", duration: "10min", done: true,  locked: false },
          { id: "l6", title: "Arguments et retours",   type: "text",  duration: "8min",  done: false, locked: false },
          { id: "l7", title: "Modules standards",      type: "video", duration: "14min", done: false, locked: false },
          { id: "l8", title: "Quiz : fonctions",       type: "quiz",  duration: "5min",  done: false, locked: false },
        ],
      },
      {
        id: "m3", title: "Programmation Orientée Objet",
        lessons: [
          { id: "l9",  title: "Classes et objets",     type: "video", duration: "18min", done: false, locked: true  },
          { id: "l10", title: "Héritage",              type: "text",  duration: "12min", done: false, locked: true  },
          { id: "l11", title: "Quiz : POO",            type: "quiz",  duration: "8min",  done: false, locked: true  },
        ],
      },
    ],
  },
  {
    id: "c2",
    title: "Marketing Digital Avancé",
    instructor: "Fatou Camara",
    instructorAvatar: "FC",
    category: "business",
    level: "intermédiaire",
    duration: "18h",
    lessons: 64,
    rating: 4.9,
    students: 8700,
    cover: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
    description: "SEO, SEA, réseaux sociaux, email marketing, analytics. Maîtrise tous les leviers du marketing digital.",
    tags: ["marketing", "seo", "social media", "analytics"],
    enrolled: true,
    progress: 28,
    modules: [
      {
        id: "m4", title: "Fondamentaux du Marketing Digital",
        lessons: [
          { id: "l12", title: "L'écosystème digital",   type: "video", duration: "12min", done: true,  locked: false },
          { id: "l13", title: "Définir sa cible",        type: "text",  duration: "10min", done: true,  locked: false },
          { id: "l14", title: "Quiz : fondamentaux",     type: "quiz",  duration: "5min",  done: false, locked: false },
        ],
      },
    ],
  },
  {
    id: "c3",
    title: "Anglais des Affaires",
    instructor: "James Okonkwo",
    instructorAvatar: "JO",
    category: "langues",
    level: "intermédiaire",
    duration: "20h",
    lessons: 80,
    rating: 4.7,
    students: 15200,
    cover: "https://images.unsplash.com/photo-1434030216411-0b793f4b6f72?w=600&q=80",
    description: "Emails professionnels, présentations, négociations. Parle anglais avec confiance dans un contexte professionnel.",
    tags: ["anglais", "business", "communication", "rédaction"],
    enrolled: false,
    progress: 0,
    modules: [],
  },
  {
    id: "c4",
    title: "UI/UX Design Fondamentaux",
    instructor: "Aïcha Touré",
    instructorAvatar: "AT",
    category: "arts",
    level: "débutant",
    duration: "15h",
    lessons: 55,
    rating: 4.8,
    students: 9300,
    cover: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80",
    description: "Principes du design, wireframing, prototypage avec Figma. Crée des interfaces qui convertissent.",
    tags: ["design", "figma", "ux", "ui", "wireframe"],
    enrolled: false,
    progress: 0,
    modules: [],
  },
  {
    id: "c5",
    title: "Data Science avec Python",
    instructor: "Kwame Asante",
    instructorAvatar: "KA",
    category: "science",
    level: "avancé",
    duration: "30h",
    lessons: 120,
    rating: 4.9,
    students: 6800,
    cover: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    description: "Pandas, NumPy, Matplotlib, Machine Learning avec Scikit-learn. De l'analyse de données à la prédiction.",
    tags: ["data", "python", "ml", "pandas", "visualisation"],
    enrolled: false,
    progress: 0,
    modules: [],
  },
  {
    id: "c6",
    title: "Excel pour les Professionnels",
    instructor: "Aminata Koné",
    instructorAvatar: "AK",
    category: "business",
    level: "intermédiaire",
    duration: "10h",
    lessons: 40,
    rating: 4.6,
    students: 22100,
    cover: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80",
    description: "Tableaux croisés dynamiques, formules avancées, Power Query, dashboards. Maîtrise Excel de A à Z.",
    tags: ["excel", "données", "finance", "analyse"],
    enrolled: false,
    progress: 0,
    modules: [],
  },
];

const LESSON_ICONS = { video: PlayCircle, text: FileText, quiz: Zap };

type Props = { onBack: () => void };

function CoursPageInner({ onBack }: Props) {
  const [courses, setCourses] = useState(COURSES);
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(["m1", "m4"]));

  const myEnrollments = useQuery(api.education.getMyEnrollments, {});
  const enrollMutation = useMutation(api.education.enrollInCourse);
  const completeLessonMutation = useMutation(api.education.completeLesson);

  // Merge Convex enrollment data into local courses
  const enrolledCourseIds = new Set(myEnrollments?.map((e) => e?.course?.title ?? "") ?? []);

  const filtered = courses.filter(c => {
    const matchCat = selectedCategory === "all" || c.category === selectedCategory;
    const matchSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.tags.some(t => t.includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const enrolled = courses.filter(c => c.enrolled);

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleEnroll = (courseId: string) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, enrolled: true } : c));
    setSelectedCourse(prev => prev ? { ...prev, enrolled: true } : prev);
    toast.success("Inscription réussie !");
  };

  const handleCompleteLesson = (courseId: string, lessonId: string) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      const updatedModules = c.modules.map(m => ({
        ...m,
        lessons: m.lessons.map(l => l.id === lessonId ? { ...l, done: true } : l),
      }));
      const total = updatedModules.flatMap(m => m.lessons).length;
      const done = updatedModules.flatMap(m => m.lessons).filter(l => l.done).length;
      return { ...c, modules: updatedModules, progress: Math.round((done / total) * 100) };
    }));
    setActiveLesson(null);
    toast.success("Leçon terminée !");
  };

  // Lesson viewer
  if (activeLesson && selectedCourse) {
    const LessonIcon = LESSON_ICONS[activeLesson.type];
    return (
      <View className="h-full flex flex-col bg-gray-950 text-white overflow-hidden"><View className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-white/10"><Pressable onPress={() => setActiveLesson(null)} className="p-2 rounded-xl bg-white/10 transition-colors"><ArrowLeft size={20} /></Pressable><View className="flex-1 min-w-0"><Text className="text-xs text-gray-400 truncate">{selectedCourse.title}</Text><Text className="text-sm font-bold truncate">{activeLesson.title}</Text></View><Text className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${activeLesson.type === "video" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : activeLesson.type === "quiz" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}`}><LessonIcon size={11} />{activeLesson.type}</Text></View><View className="flex-1 overflow-y-auto p-4 pb-8 space-y-4">{}{activeLesson.type === "video" && (
            <View className="relative rounded-2xl overflow-hidden bg-gray-900 border border-white/10"><Image className="w-full h-48 object-cover opacity-40" source={{ uri: selectedCourse.cover }} accessibilityLabel="" /><View className="absolute inset-0 flex flex-col items-center justify-center gap-3"><View className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"><Play size={28} className="text-white ml-1" /></View><Text className="text-sm text-white/80">{activeLesson.duration}</Text></View></View>
          )}{}<View className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4"><Text className="text-lg font-bold">{activeLesson.title}</Text>{activeLesson.type === "text" && (
              <View className="space-y-3 text-sm text-gray-300 leading-relaxed"><Text>Dans cette leçon, nous allons explorer les concepts fondamentaux liés à <strong className="text-white">{activeLesson.title.toLowerCase()}</strong>.</Text><Text>Les points clés à retenir :</Text><View className="space-y-2 pl-4">{["Comprendre la théorie de base", "Appliquer les concepts à des exemples concrets", "Identifier les erreurs courantes et les éviter", "Mettre en pratique avec des exercices guidés"].map((point, i) => (
                    <View key={i} className="flex items-start gap-2"><View className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />{point}</View>
                  ))}</View><Text>Cette leçon est essentielle pour progresser vers les modules suivants. Prenez le temps de bien assimiler chaque concept avant de continuer.</Text></View>
            )}{activeLesson.type === "quiz" && (
              <View className="space-y-3"><Text className="text-sm text-gray-400">Quiz de validation — 3 questions pour tester vos connaissances</Text>{["Quelle est la principale utilité de cette fonctionnalité ?", "Dans quel cas utilise-t-on cette approche ?", "Quelle est la bonne syntaxe ?"].map((q, i) => (
                  <View key={i} className="bg-white/5 rounded-xl p-3 border border-white/10"><Text className="text-sm font-medium mb-3">Q{i + 1}. {q}</Text><View className="space-y-2">{["Option A", "Option B", "Option C", "Option D"].map((opt, j) => (
                        <Pressable key={j} className="w-full text-left text-xs py-2 px-3 rounded-lg bg-white/5 transition-colors border border-white/10">{opt}</Pressable>
                      ))}</View></View>
                ))}</View>
            )}</View></View><View className="p-4 border-t border-white/10"><Pressable onPress={() => handleCompleteLesson(selectedCourse.id, activeLesson.id)} className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-semibold transition-opacity flex items-center justify-center gap-2"><CheckCircle2 size={18} /><Text>Marquer comme terminé</Text></Pressable></View></View>
    );
  }

  // Course detail view
  if (selectedCourse) {
    const cfg = CATEGORY_CONFIG[selectedCourse.category];
    const totalLessons = selectedCourse.modules.flatMap(m => m.lessons).length;
    const doneLessons = selectedCourse.modules.flatMap(m => m.lessons).filter(l => l.done).length;

    return (
      <View className="h-full flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">{}<View className="relative h-52 flex-shrink-0"><Image className="w-full h-full object-cover" source={{ uri: selectedCourse.cover }} accessibilityLabel={selectedCourse.title} /><View className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/85" /><Pressable onPress={() => setSelectedCourse(null)} className="absolute top-12 left-4 p-2 rounded-xl bg-black/40 backdrop-blur-md"><ArrowLeft size={20} /></Pressable><View className="absolute bottom-4 left-4 right-4"><View className="flex items-center gap-2 mb-2"><Text className={`text-xs px-2 py-1 rounded-full border font-medium ${LEVEL_COLOR[selectedCourse.level]}`}>{selectedCourse.level}</Text><Text className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${cfg.gradient} text-white font-medium`}>{cfg.label}</Text></View><Text className="text-xl font-bold leading-tight">{selectedCourse.title}</Text><View className="flex items-center gap-3 mt-1 text-xs text-white/70"><Text className="flex items-center gap-1"><Star size={12} className="text-yellow-400 fill-yellow-400" />{selectedCourse.rating}</Text><Text className="flex items-center gap-1"><Users size={12} />{selectedCourse.students.toLocaleString("fr-FR")}</Text><Text className="flex items-center gap-1"><Clock size={12} />{selectedCourse.duration}</Text></View></View></View><View className="flex-1 overflow-y-auto pb-24">{}<View className="px-4 pt-4 space-y-3"><View className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10"><View className={`w-10 h-10 rounded-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-sm font-bold flex-shrink-0`}>{selectedCourse.instructorAvatar}</View><View><Text className="text-xs text-gray-400">Instructeur</Text><Text className="text-sm font-semibold">{selectedCourse.instructor}</Text></View></View><Text className="text-sm text-gray-300 leading-relaxed">{selectedCourse.description}</Text>{}<View className="flex flex-wrap gap-2">{selectedCourse.tags.map(t => (
                <Text key={t} className="text-xs bg-white/10 rounded-full px-3 py-1 text-gray-300">#{t}</Text>
              ))}</View>{}{selectedCourse.enrolled && totalLessons > 0 && (
              <View className="bg-white/5 rounded-2xl p-4 border border-white/10"><View className="flex items-center justify-between mb-2"><Text className="text-sm font-semibold">Ma progression</Text><Text className={`text-sm font-bold ${cfg.color}`}>{selectedCourse.progress}%</Text></View><View className="h-2 bg-white/10 rounded-full overflow-hidden"><View className={`h-full rounded-full bg-gradient-to-r ${cfg.gradient}`} initial={{ width: 0 }} animate={{ width: `${selectedCourse.progress}%` }} transition={{ duration: 0.8, ease: "easeOut" as const }} /></View><Text className="text-xs text-gray-500 mt-1">{doneLessons}/{totalLessons}leçons complétées</Text></View>
            )}</View>{}{selectedCourse.modules.length > 0 && (
            <View className="px-4 mt-4 space-y-2"><Text className="text-sm font-semibold mb-1">Contenu du cours</Text>{selectedCourse.modules.map((mod) => {
                const isExpanded = expandedModules.has(mod.id);
                const modDone = mod.lessons.filter(l => l.done).length;
                return (
                  <View key={mod.id} className="bg-white/5 rounded-2xl overflow-hidden border border-white/10"><Pressable onPress={() => toggleModule(mod.id)} className="w-full flex items-center gap-3 p-4"><View className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0`}><BookOpen size={14} className="text-white" /></View><View className="flex-1 text-left"><Text className="text-sm font-semibold">{mod.title}</Text><Text className="text-xs text-gray-400">{modDone}/{mod.lessons.length}leçons</Text></View><ChevronRight size={16} className={`text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} /></Pressable><View>{isExpanded && (
                        <View initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-white/10">
                          <View className="p-3 space-y-1">{mod.lessons.map((lesson) => {
                              const LIcon = LESSON_ICONS[lesson.type];
                              return (
                                <Pressable key={lesson.id} onPress={() => !lesson.locked && setActiveLesson(lesson)} disabled={lesson.locked} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${lesson.locked ? "opacity-40 cursor-not-allowed" : "hover:bg-white/10 cursor-pointer"}`}><LIcon size={16} className={lesson.type === "video" ? "text-blue-400" : lesson.type === "quiz" ? "text-purple-400" : "text-green-400"} /><View className="flex-1 min-w-0"><Text className={`text-sm truncate ${lesson.done ? "line-through text-gray-500" : "text-white"}`}>{lesson.title}</Text><Text className="text-xs text-gray-500">{lesson.duration}</Text></View>{lesson.locked
                                    ? <Lock size={14} className="text-gray-600 flex-shrink-0" />
                                    : lesson.done
                                      ? <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                                      : <Circle size={16} className="text-gray-600 flex-shrink-0" />}</Pressable>
                              );
                            })}</View>
                        </View>
                      )}</View></View>
                );
              })}</View>
          )}</View>{}<View className="absolute bottom-0 left-0 right-0 p-4 bg-gray-950/90 backdrop-blur-md border-t border-white/10">{selectedCourse.enrolled ? (
            <Pressable onPress={() => {
                const nextLesson = selectedCourse.modules.flatMap(m => m.lessons).find(l => !l.done && !l.locked);
                if (nextLesson) setActiveLesson(nextLesson);
              }} className={`w-full py-3 bg-gradient-to-r ${cfg.gradient} rounded-xl font-semibold cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}><Play size={18} /><Text>Continuer le cours</Text></Pressable>
          ) : (
            <Pressable onPress={() => handleEnroll(selectedCourse.id)} className={`w-full py-3 bg-gradient-to-r ${cfg.gradient} rounded-xl font-semibold cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}><BookOpen size={18} /><Text>S'inscrire gratuitement</Text></Pressable>
          )}</View></View>
    );
  }

  // Main catalogue view
  return (
    <View className="h-full flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">{}<View className="px-4 pt-12 pb-3 flex-shrink-0"><View className="flex items-center gap-3 mb-4"><Pressable onPress={onBack} className="p-2 rounded-xl bg-white/10 transition-colors"><ArrowLeft size={20} /></Pressable><View className="flex-1"><Text className="text-xl font-bold">Cours & Catalogue</Text><Text className="text-xs text-gray-400">{courses.length}cours disponibles</Text></View></View>{}<View className="relative mb-3"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><TextInput value={searchQuery} onChangeText={value => setSearchQuery(value)} placeholder="Rechercher un cours, tag..." className="w-full bg-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none border border-white/10 focus:border-white/30 transition-colors" />{searchQuery && (
            <Pressable onPress={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={14} className="text-gray-400" /></Pressable>
          )}</View>{}<View className="flex gap-2 overflow-x-auto pb-1"><Pressable onPress={() => setSelectedCategory("all")} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${selectedCategory === "all" ? "bg-white text-gray-900" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}><Text>Tous</Text></Pressable>{(Object.keys(CATEGORY_CONFIG) as Category[]).map(cat => {
            const cfg = CATEGORY_CONFIG[cat];
            const sel = selectedCategory === cat;
            return (
              <Pressable key={cat} onPress={() => setSelectedCategory(cat)} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${sel ? `bg-gradient-to-r ${cfg.gradient} text-white` : "bg-white/10 text-gray-400 hover:bg-white/20"}`}><cfg.icon size={12} />{cfg.label}</Pressable>
            );
          })}</View></View><View className="flex-1 overflow-y-auto px-4 pb-8 space-y-5">{}{enrolled.length > 0 && !searchQuery && selectedCategory === "all" && (
          <View><Text className="text-sm font-semibold mb-3 flex items-center gap-2"><Flame size={16} className="text-orange-400" />En cours
            </Text><View className="space-y-3">{enrolled.map((course, i) => {
                const cfg = CATEGORY_CONFIG[course.category];
                return (
                  <Pressable key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} onPress={() => setSelectedCourse(course)} className="w-full flex items-center gap-3 bg-white/5 rounded-2xl p-3 border border-white/10 transition-colors text-left">
                    <Image className="w-16 h-16 rounded-xl object-cover flex-shrink-0" source={{ uri: course.cover }} accessibilityLabel="" />
                    <View className="flex-1 min-w-0"><Text className="text-sm font-semibold">{course.title}</Text><Text className="text-xs text-gray-400 mb-2">{course.instructor}</Text><View className="h-1.5 bg-white/10 rounded-full overflow-hidden"><View className={`h-full rounded-full bg-gradient-to-r ${cfg.gradient}`} style={{ width: `${course.progress}%` }} /></View><Text className="text-xs text-gray-500 mt-1">{course.progress}% complété</Text></View>
                    <ChevronRight size={16} className="text-gray-500 flex-shrink-0" />
                  </Pressable>
                );
              })}</View></View>
        )}{}{!searchQuery && selectedCategory === "all" && (
          <View className="gap-2">{[
              { label: "Inscrits", value: enrolled.length, icon: BookOpen, color: "text-blue-400" },
              { label: "Leçons faites", value: courses.flatMap(c => c.modules.flatMap(m => m.lessons)).filter(l => l.done).length, icon: CheckCircle2, color: "text-green-400" },
              { label: "Streak", value: "7j", icon: Flame, color: "text-orange-400" },
            ].map((s, i) => (
              <View key={s.label} className="bg-white/5 rounded-xl p-3 border border-white/10 text-center"><s.icon size={16} className={`mx-auto mb-1 ${s.color}`} /><Text className={`text-lg font-bold ${s.color}`}>{s.value}</Text><Text className="text-[10px] text-gray-500">{s.label}</Text></View>
            ))}</View>
        )}{}<View>{!searchQuery && selectedCategory === "all" && (
            <Text className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-cyan-400" />Catalogue
            </Text>
          )}{filtered.length === 0 && (
            <View className="flex flex-col items-center justify-center py-16 text-gray-500"><Search size={40} className="mb-3 opacity-40" /><Text className="text-sm">Aucun cours trouvé</Text></View>
          )}<View className="space-y-3">{filtered.map((course, i) => {
              const cfg = CATEGORY_CONFIG[course.category];
              return (
                <Pressable key={course.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} onPress={() => setSelectedCourse(course)} className="w-full bg-white/5 rounded-2xl overflow-hidden border border-white/10 transition-colors text-left">
                  <View className="relative h-36"><Image className="w-full h-full object-cover" source={{ uri: course.cover }} accessibilityLabel={course.title} /><View className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" /><View className="absolute top-2 left-2 flex gap-1"><Text className={`text-xs px-2 py-0.5 rounded-full border font-medium ${LEVEL_COLOR[course.level]}`}>{course.level}</Text></View>{course.enrolled && (
                      <View className="absolute top-2 right-2 bg-green-500/30 border border-green-500/50 rounded-full px-2 py-0.5 text-[10px] text-green-400 font-medium flex items-center gap-1"><Award size={10} /><Text>Inscrit</Text></View>
                    )}<View className="absolute bottom-2 left-3 right-3"><Text className="text-sm font-bold">{course.title}</Text></View></View>
                  <View className="p-3"><View className="flex items-center justify-between"><View className="flex items-center gap-1 text-xs text-gray-400"><View className={`w-5 h-5 rounded-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-[9px] font-bold`}>{course.instructorAvatar}</View>{course.instructor}</View><View className="flex items-center gap-3 text-xs text-gray-400"><Text className="flex items-center gap-1"><Star size={11} className="text-yellow-400 fill-yellow-400" />{course.rating}</Text><Text className="flex items-center gap-1"><Clock size={11} />{course.duration}</Text></View></View>{course.enrolled && (
                      <View className="mt-2"><View className="h-1.5 bg-white/10 rounded-full overflow-hidden"><View className={`h-full rounded-full bg-gradient-to-r ${cfg.gradient}`} style={{ width: `${course.progress}%` }} /></View><Text className="text-xs text-gray-500 mt-1">{course.progress}% complété</Text></View>
                    )}</View>
                </Pressable>
              );
            })}</View></View></View></View>
  );
}

export default function CoursPage({ onBack }: Props) {
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

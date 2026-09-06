import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, Star, MessageCircle, Users, BookOpen, Search,
  CheckCircle, Clock, Video, ChevronRight, Send, X, Heart,
  Flame, Award, TrendingUp, ThumbsUp, Pin, PlusCircle,
  Calendar, Globe, Zap, Crown, Filter
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";

type Props = { onBack: () => void };

type Mentor = {
  id: string;
  name: string;
  avatar: string;
  title: string;
  specialties: string[];
  rating: number;
  reviews: number;
  sessions: number;
  price: string;
  available: boolean;
  languages: string[];
  bio: string;
  badges: string[];
  responseTime: string;
  color: string;
};

type ForumPost = {
  id: string;
  author: string;
  avatar: string;
  category: string;
  title: string;
  content: string;
  likes: number;
  replies: number;
  time: string;
  pinned?: boolean;
  tags: string[];
};

const MENTORS: Mentor[] = [
  {
    id: "m1",
    name: "Dr. Aminata Diallo",
    avatar: "👩🏾‍💻",
    title: "Senior Software Engineer · Google",
    specialties: ["Développement Web", "React", "TypeScript"],
    rating: 4.9,
    reviews: 128,
    sessions: 340,
    price: "Gratuit",
    available: true,
    languages: ["Français", "Anglais", "Wolof"],
    bio: "10 ans d'expérience en développement web. Passionnée par la transmission des savoirs et l'accompagnement de la prochaine génération de développeurs africains.",
    badges: ["Top Mentor", "Expert Certifié"],
    responseTime: "< 2h",
    color: "#6366F1",
  },
  {
    id: "m2",
    name: "Kofi Mensah",
    avatar: "🧑🏿‍🏫",
    title: "Coach Fitness & Nutritionniste",
    specialties: ["Fitness", "Nutrition", "Bien-être"],
    rating: 4.8,
    reviews: 95,
    sessions: 210,
    price: "500 FCFA/h",
    available: true,
    languages: ["Français", "Anglais"],
    bio: "Certifié NSCA et ISSA, j'accompagne mes apprenants vers une santé optimale à travers des programmes personnalisés adaptés à chaque individu.",
    badges: ["Certifié", "Populaire"],
    responseTime: "< 1h",
    color: "#10B981",
  },
  {
    id: "m3",
    name: "Fatima Zahra Benali",
    avatar: "👩🏽‍🎓",
    title: "Expert Finance & Investissement",
    specialties: ["Finance", "Investissement", "Entrepreneuriat"],
    rating: 4.7,
    reviews: 76,
    sessions: 180,
    price: "1000 FCFA/h",
    available: false,
    languages: ["Français", "Arabe"],
    bio: "MBA Finance, 8 ans en banque d'investissement. J'aide les entrepreneurs africains à structurer leur financement et à maximiser leurs rendements.",
    badges: ["Expert Finance"],
    responseTime: "< 4h",
    color: "#F59E0B",
  },
  {
    id: "m4",
    name: "Ibrahima Sow",
    avatar: "🧑🏾‍💼",
    title: "Digital Marketing Manager",
    specialties: ["Marketing Digital", "SEO", "Réseaux Sociaux"],
    rating: 4.6,
    reviews: 54,
    sessions: 130,
    price: "750 FCFA/h",
    available: true,
    languages: ["Français", "Anglais"],
    bio: "Spécialiste Growth Hacking avec des résultats prouvés pour des startups africaines. Je t'aide à construire ta présence en ligne de zéro.",
    badges: ["Growth Hacker"],
    responseTime: "< 3h",
    color: "#EF4444",
  },
  {
    id: "m5",
    name: "Mariama Camara",
    avatar: "👩🏿‍🌾",
    title: "Agronome & Experte Agriculture",
    specialties: ["Agriculture", "Agro-business", "Environnement"],
    rating: 4.9,
    reviews: 41,
    sessions: 95,
    price: "Gratuit",
    available: true,
    languages: ["Français", "Peulh"],
    bio: "Docteure en agronomie, je mets mon expertise au service des agriculteurs africains pour améliorer leurs rendements et adopter des pratiques durables.",
    badges: ["Top Mentor", "Bénévole"],
    responseTime: "< 6h",
    color: "#84CC16",
  },
];

const FORUM_POSTS: ForumPost[] = [
  {
    id: "p1",
    author: "Moussa Traoré",
    avatar: "🧑🏾",
    category: "Développement Web",
    title: "Comment débuter avec React en 2025 ?",
    content: "Je viens de terminer le cours JavaScript fondamentaux et je cherche les meilleures ressources pour commencer React. Des suggestions ?",
    likes: 34,
    replies: 12,
    time: "2h",
    pinned: true,
    tags: ["React", "Débutant", "Ressources"],
  },
  {
    id: "p2",
    author: "Aisha Bah",
    avatar: "👩🏽",
    category: "Fitness",
    title: "Programme pour perdre 5 kg sans matériel ?",
    content: "Je suis en appartement sans accès à une salle de sport. Quelqu'un a un programme efficace à partager ? Merci d'avance !",
    likes: 28,
    replies: 9,
    time: "4h",
    tags: ["Fitness", "Maison", "Programme"],
  },
  {
    id: "p3",
    author: "Oumar Diop",
    avatar: "🧑🏿",
    category: "Finance",
    title: "Meilleure façon d'investir 50 000 FCFA ?",
    content: "J'ai économisé 50 000 FCFA et je veux les faire fructifier. Je suis débutant en investissement. Quelles options recommandez-vous ?",
    likes: 45,
    replies: 18,
    time: "6h",
    tags: ["Finance", "Investissement", "Débutant"],
  },
  {
    id: "p4",
    author: "Kadiatou Balde",
    avatar: "👩🏾",
    category: "Marketing",
    title: "Comment augmenter ses abonnés Instagram organiquement ?",
    content: "Mon compte business est stagnant à 200 abonnés depuis 3 mois. Quelqu'un a des stratégies qui ont marché ?",
    likes: 22,
    replies: 7,
    time: "1j",
    tags: ["Instagram", "Croissance", "Marketing"],
  },
  {
    id: "p5",
    author: "Seydou Koné",
    avatar: "🧑🏽",
    category: "Général",
    title: "Partage : j'ai obtenu ma certification Web ! 🎉",
    content: "Après 3 mois de travail acharné, j'ai finalement décroché ma certification en développement web. Merci à tout le forum pour le soutien !",
    likes: 67,
    replies: 24,
    time: "2j",
    tags: ["Succès", "Certif", "Motivation"],
  },
];

const FORUM_CATEGORIES = ["Tout", "Développement Web", "Fitness", "Finance", "Marketing", "Agriculture", "Général"];

const TABS = ["Mentors", "Forum", "Tableau de Bord"] as const;
type Tab = typeof TABS[number];

const MY_PROGRESS = [
  { course: "Développement Web", progress: 50, color: "#6366F1", icon: "💻" },
  { course: "Coach Fitness", progress: 75, color: "#10B981", icon: "🏋️" },
  { course: "Guide Voyageur", progress: 50, color: "#06B6D4", icon: "✈️" },
];

const MY_SESSIONS = [
  { mentor: "Dr. Aminata Diallo", avatar: "👩🏾‍💻", topic: "Introduction à React Hooks", date: "Demain 15h00", color: "#6366F1" },
  { mentor: "Kofi Mensah", avatar: "🧑🏿‍🏫", topic: "Plan nutritionnel personnalisé", date: "Sam 10h00", color: "#10B981" },
];

export default function MentoratPage({ onBack }: Props) {
  const [tab, setTab] = useState<Tab>("Mentors");
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [forumFilter, setForumFilter] = useState("Tout");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showNewPost, setShowNewPost] = useState(false);
  const [specialtyFilter, setSpecialtyFilter] = useState("Tous");
  const [showRequestModal, setShowRequestModal] = useState(false);

  const convexMentors = useQuery(api.education.listMentors, {});
  const myMentorSessions = useQuery(api.education.getMyMentorSessions, {});
  const stats = useQuery(api.education.getEducationStats, {});

  // Use static data as default, supplement with Convex data
  const specialties = ["Tous", "Développement Web", "Fitness", "Finance", "Marketing", "Agriculture"];

  const filteredMentors = MENTORS.filter((m) => {
    const matchSpec = specialtyFilter === "Tous" || m.specialties.some((s) => s === specialtyFilter);
    const matchSearch = searchQuery === "" || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSpec && matchSearch;
  });

  const filteredPosts = FORUM_POSTS.filter((p) =>
    forumFilter === "Tout" || p.category === forumFilter
  );

  const toggleLike = (id: string) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  return (
    <View className="h-full flex flex-col overflow-hidden" style={{  }}>
      {/* Header */}
      <View className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Pressable onPress={onBack} className="p-2 rounded-xl text-white/60">
          <ArrowLeft size={20} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-white font-bold text-xl">Mentorat & Communauté</Text>
          <Text className="text-white/50 text-xs">Apprenez ensemble, grandissez ensemble</Text>
        </View>
        <View className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(99,102,241,0.15)" }}>
          <Users size={13} className="text-indigo-400" />
          <Text className="text-indigo-400 font-bold text-sm">2.4k</Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex gap-1 px-4 pb-3">
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold"
            style={{ backgroundColor: tab === t ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)", borderColor: "rgba(99,102,241,0.5)", borderStyle: "solid" }}>
            {t}
          </Pressable>
        ))}
      </View>

      <View className="flex-1 overflow-y-auto px-4 pb-6">

        {/* ── MENTORS ── */}
        {tab === "Mentors" && (
          <View className="space-y-4">
            {/* Search */}
            <View className="flex items-center gap-2 px-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
              <Search size={15} className="text-white/40 flex-shrink-0" />
              <TextInput
                value={searchQuery}
                onChangeText={(text) => setSearchQuery(text)}
                placeholder="Rechercher un mentor ou une spécialité…"
                className="flex-1 bg-transparent text-white text-sm py-3 outline-none placeholder:text-white/30"
              />
              {searchQuery && (
                <Pressable onPress={() => setSearchQuery("")} className="text-white/40"><X size={14} /></Pressable>
              )}
            </View>

            {/* Specialty filter */}
            <View className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {specialties.map((s) => (
                <Pressable key={s} onPress={() => setSpecialtyFilter(s)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: specialtyFilter === s ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.06)", borderColor: "rgba(99,102,241,0.5)", borderStyle: "solid" }}>
                  {s}
                </Pressable>
              ))}
            </View>

            {/* Featured banner */}
            <View className="rounded-2xl p-4 flex items-center gap-3" style={{ borderWidth: 1, borderColor: "rgba(99,102,241,0.3)", borderStyle: "solid" }}>
              <Crown size={22} className="text-amber-400 flex-shrink-0" />
              <View>
                <View className="text-white font-semibold text-sm"><Text>Mentor de la semaine</Text></View>
                <View className="text-white/60 text-xs mt-0.5"><Text>Dr. Aminata Diallo · 4.9 ⭐ · 340 sessions</Text></View>
              </View>
              <ChevronRight size={16} className="text-white/40 ml-auto flex-shrink-0" />
            </View>

            {/* Mentor cards */}
            {filteredMentors.map((mentor, i) => (
              <Pressable key={mentor.id}
                onPress={() => setSelectedMentor(mentor)}
                className="rounded-2xl p-4"
                style={{ backgroundColor: `${mentor.color}10`, borderStyle: "solid" }}>
                <View className="flex items-start gap-3">
                  <View className="relative flex-shrink-0">
                    <View className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: `${mentor.color}20` }}>
                      {mentor.avatar}
                    </View>
                    {mentor.available && (
                      <View className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#0a0a1a] bg-emerald-400" />
                    )}
                  </View>
                  <View className="flex-1 min-w-0">
                    <View className="flex items-center gap-2 flex-wrap">
                      <Text className="text-white font-semibold text-sm">{mentor.name}</Text>
                      {mentor.badges.slice(0, 1).map((b) => (
                        <Badge key={b} className="text-xs border-0 px-1.5 py-0" style={{ backgroundColor: `${mentor.color}25`, color: mentor.color }}>{b}</Badge>
                      ))}
                    </View>
                    <View className="text-white/50 text-xs mt-0.5 truncate">{mentor.title}</View>
                    <View className="flex flex-wrap gap-1 mt-1.5">
                      {mentor.specialties.map((s) => (
                        <Text key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}>{s}</Text>
                      ))}
                    </View>
                    <View className="flex items-center gap-3 mt-2">
                      <View className="flex items-center gap-1 text-amber-400 text-xs">
                        <Star size={11} className="fill-amber-400" /><Text className="font-bold">{mentor.rating}</Text>
                        <Text className="text-white/30">({mentor.reviews})</Text>
                      </View>
                      <View className="flex items-center gap-1 text-white/40 text-xs">
                        <Video size={11} /><Text>{mentor.sessions} sessions</Text>
                      </View>
                      <View className="ml-auto font-semibold text-sm" style={{  }}>
                        {mentor.price}
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}

            {filteredMentors.length === 0 && (
              <View className="text-center py-12 text-white/40">
                <Users size={36} className="mx-auto mb-3 opacity-40" />
                <View className="text-sm"><Text>Aucun mentor trouvé</Text></View>
              </View>
            )}
          </View>
        )}

        {/* ── FORUM ── */}
        {tab === "Forum" && (
          <View className="space-y-4">
            {/* New post button */}
            <Pressable onPress={() => setShowNewPost(true)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl"
              style={{ backgroundColor: "rgba(99,102,241,0.12)", borderWidth: 1, borderColor: "rgba(99,102,241,0.4)", borderStyle: "dashed" }}>
              <PlusCircle size={18} className="text-indigo-400" />
              <Text className="text-indigo-300 text-sm">Poser une question ou partager…</Text>
            </Pressable>

            {/* Category filter */}
            <View className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {FORUM_CATEGORIES.map((cat) => (
                <Pressable key={cat} onPress={() => setForumFilter(cat)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: forumFilter === cat ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.06)", borderColor: "rgba(99,102,241,0.5)", borderStyle: "solid" }}>
                  {cat}
                </Pressable>
              ))}
            </View>

            {/* Posts */}
            {filteredPosts.map((post, i) => (
              <View key={post.id}
                className="rounded-2xl p-4"
                style={{ backgroundColor: post.pinned ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.04)", borderColor: "rgba(99,102,241,0.3)", borderStyle: "solid" }}>
                <View className="flex items-center gap-2 mb-2">
                  <View className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                    {post.avatar}
                  </View>
                  <View>
                    <View className="text-white text-xs font-semibold">{post.author}</View>
                    <View className="text-white/30 text-xs"><Text>il y a</Text>{post.time}</View>
                  </View>
                  <View className="ml-auto flex items-center gap-2">
                    {post.pinned && <Pin size={12} className="text-indigo-400" />}
                    <Badge className="text-xs border-0 px-2 py-0" style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>{post.category}</Badge>
                  </View>
                </View>
                <Text className="text-white font-semibold text-sm mb-1">{post.title}</Text>
                <Text className="text-white/50 text-xs leading-relaxed mb-3">{post.content}</Text>
                <View className="flex flex-wrap gap-1 mb-3">
                  {post.tags.map((tag) => (
                    <Text key={tag} className="text-xs px-2 py-0.5 rounded-full text-indigo-300" style={{ backgroundColor: "rgba(99,102,241,0.15)" }}>#{tag}</Text>
                  ))}
                </View>
                <View className="flex items-center gap-4">
                  <Pressable onPress={() => toggleLike(post.id)} className="flex items-center gap-1.5"
                    style={{  }}>
                    <Heart size={14} className={likedPosts.has(post.id) ? "fill-red-500" : ""} />
                    <Text className="text-xs">{post.likes + (likedPosts.has(post.id) ? 1 : 0)}</Text>
                  </Pressable>
                  <Pressable className="flex items-center gap-1.5 text-white/40"
                    onPress={() => UIService.openToast("Ouverture du fil de discussion…", "info")}>
                    <MessageCircle size={14} /><Text className="text-xs">{post.replies}</Text>
                  </Pressable>
                  <Pressable className="ml-auto text-white/30"
                    onPress={() => UIService.openToast("Post partagé !", "success")}>
                    <TrendingUp size={14} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── TABLEAU DE BORD ── */}
        {tab === "Tableau de Bord" && (
          <View className="space-y-5">
            {/* Stats row */}
            <View className="gap-2">
              {[
                { icon: <BookOpen size={14} className="text-indigo-400" />, value: stats?.coursesEnrolled?.toString() ?? "—",    label: "Cours actifs" },
                { icon: <Award size={14} className="text-amber-400" />,    value: stats?.certificates?.toString() ?? "—",    label: "Certifs" },
                { icon: <Users size={14} className="text-emerald-400" />,  value: stats?.mentorSessions?.toString() ?? "—",    label: "Sessions" },
              ].map((s) => (
                <View key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
                  <View className="flex justify-center mb-1">{s.icon}</View>
                  <View className="text-white font-bold text-lg">{s.value}</View>
                  <View className="text-white/40 text-xs">{s.label}</View>
                </View>
              ))}
            </View>

            {/* Active courses */}
            <View>
              <View className="flex items-center justify-between mb-3">
                <Text className="text-white/70 text-sm font-semibold uppercase tracking-wider">Mes Cours en cours</Text>
                <ChevronRight size={14} className="text-white/30" />
              </View>
              <View className="space-y-3">
                {MY_PROGRESS.map((c) => (
                  <View key={c.course} className="rounded-xl p-3" style={{ backgroundColor: `${c.color}12`, borderStyle: "solid" }}>
                    <View className="flex items-center gap-2 mb-2">
                      <Text className="text-lg">{c.icon}</Text>
                      <Text className="text-white font-medium text-sm">{c.course}</Text>
                      <Text className="ml-auto text-xs font-bold" style={{ color: c.color }}>{c.progress}%</Text>
                    </View>
                    <Progress value={c.progress} className="h-1.5" />
                  </View>
                ))}
              </View>
            </View>

            {/* Upcoming sessions */}
            <View>
              <View className="flex items-center justify-between mb-3">
                <Text className="text-white/70 text-sm font-semibold uppercase tracking-wider">Prochaines sessions</Text>
                <Zap size={14} className="text-amber-400" />
              </View>
              <View className="space-y-3">
                {MY_SESSIONS.map((s) => (
                  <View key={s.topic} className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: `${s.color}10`, borderStyle: "solid" }}>
                    <View className="text-2xl">{s.avatar}</View>
                    <View className="flex-1 min-w-0">
                      <View className="text-white font-medium text-sm">{s.mentor}</View>
                      <View className="text-white/50 text-xs truncate">{s.topic}</View>
                    </View>
                    <View className="flex items-center gap-1 text-xs" style={{  }}>
                      <Calendar size={11} />
                      <Text>{s.date}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Recent badges */}
            <View>
              <Text className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-3">Derniers badges</Text>
              <View className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  { icon: "🎯", label: "Premier Pas", color: "#94A3B8" },
                  { icon: "💯", label: "Perfectionniste", color: "#A855F7" },
                  { icon: "🔥", label: "En Série", color: "#6366F1" },
                  { icon: "🧘", label: "Équilibre", color: "#6366F1" },
                  { icon: "🎨", label: "Créateur", color: "#94A3B8" },
                ].map((b) => (
                  <View key={b.label} className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-2xl"
                    style={{ backgroundColor: `${b.color}15`, borderStyle: "solid", minWidth: 72 }}>
                    <Text className="text-2xl">{b.icon}</Text>
                    <Text className="text-white/60 text-xs text-center leading-tight">{b.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Leaderboard teaser */}
            <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(245,158,11,0.1)", borderWidth: 1, borderColor: "rgba(245,158,11,0.25)", borderStyle: "solid" }}>
              <View className="flex items-center gap-2 mb-2">
                <Crown size={16} className="text-amber-400" />
                <Text className="text-white font-semibold text-sm">Classement hebdomadaire</Text>
              </View>
              <View className="flex items-center gap-3 mb-3">
                <View className="text-center">
                  <View className="text-2xl"><Text>🥇</Text></View>
                  <View className="text-white/60 text-xs"><Text>Amadou K.</Text></View>
                </View>
                <View className="text-center">
                  <View className="text-2xl"><Text>🥈</Text></View>
                  <View className="text-white/60 text-xs"><Text>Fatou D.</Text></View>
                </View>
                <View className="text-center">
                  <View className="text-2xl"><Text>🥉</Text></View>
                  <View className="text-white/60 text-xs"><Text>Moussa T.</Text></View>
                </View>
                <View className="ml-auto text-right">
                  <View className="text-white/50 text-xs"><Text>Votre rang</Text></View>
                  <View className="text-white font-bold text-lg"><Text>#5</Text></View>
                </View>
              </View>
              <Progress value={32} className="h-1.5" />
              <View className="text-white/40 text-xs mt-1"><Text>+3 positions possibles cette semaine</Text></View>
            </View>
          </View>
        )}
      </View>

      {/* ── MENTOR DETAIL MODAL ── */}
      <>
        {selectedMentor && (
          <Pressable
            className="absolute inset-0 z-50 flex items-end"
            style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
            onPress={() => setSelectedMentor(null)}>
            <Pressable
              className="w-full max-h-[88vh] overflow-y-auto rounded-t-3xl pb-8"
              style={{  }}
              onPress={(e) => e.stopPropagation()}>
              <View className="p-5">
                <View className="w-12 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />

                {/* Mentor profile */}
                <View className="flex items-start gap-4 mb-4">
                  <View className="relative flex-shrink-0">
                    <View className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl" style={{ backgroundColor: `${selectedMentor.color}20` }}>
                      {selectedMentor.avatar}
                    </View>
                    {selectedMentor.available && (
                      <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0f0f1e] bg-emerald-400 flex items-center justify-center">
                        <CheckCircle size={10} color="white" />
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-lg">{selectedMentor.name}</Text>
                    <View className="text-white/50 text-sm">{selectedMentor.title}</View>
                    <View className="flex gap-2 mt-2 flex-wrap">
                      {selectedMentor.badges.map((b) => (
                        <Badge key={b} className="text-xs border-0" style={{ backgroundColor: `${selectedMentor.color}25`, color: selectedMentor.color }}>{b}</Badge>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Stats */}
                <View className="gap-3 mb-4">
                  {[
                    { label: "Note",     value: `${selectedMentor.rating}⭐` },
                    { label: "Avis",     value: selectedMentor.reviews },
                    { label: "Sessions", value: selectedMentor.sessions },
                  ].map((s) => (
                    <View key={s.label} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: `${selectedMentor.color}12`, borderStyle: "solid" }}>
                      <View className="text-white font-bold text-sm">{s.value}</View>
                      <View className="text-white/40 text-xs">{s.label}</View>
                    </View>
                  ))}
                </View>

                {/* Bio */}
                <Text className="text-white/60 text-sm leading-relaxed mb-4">{selectedMentor.bio}</Text>

                {/* Details */}
                <View className="space-y-2 mb-5">
                  <View className="flex items-center gap-2 text-sm">
                    <Clock size={14} className="text-white/40" />
                    <Text className="text-white/60">Temps de réponse :</Text>
                    <Text className="text-white">{selectedMentor.responseTime}</Text>
                  </View>
                  <View className="flex items-center gap-2 text-sm">
                    <Globe size={14} className="text-white/40" />
                    <Text className="text-white/60">Langues :</Text>
                    <Text className="text-white">{selectedMentor.languages.join(", ")}</Text>
                  </View>
                  <View className="flex items-center gap-2 text-sm">
                    <Filter size={14} className="text-white/40" />
                    <Text className="text-white/60">Spécialités :</Text>
                    <Text className="text-white">{selectedMentor.specialties.join(", ")}</Text>
                  </View>
                </View>

                {/* Message area */}
                <View className="rounded-xl p-3 mb-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                  <TextInput
                    value={messageText}
                    onChangeText={(text) => setMessageText(text)}
                    placeholder={`Écrivez un message à ${selectedMentor.name.split(" ")[0]}…`}
                   
                    className="w-full bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                   multiline textAlignVertical="top"/>
                </View>

                {/* Actions */}
                <View className="gap-3">
                  <Button className="flex items-center gap-2"
                    style={{ backgroundColor: `${selectedMentor.color}35`, color: "white" }}
                    onPress={() => {
                      setShowRequestModal(true);
                    }}>
                    <Video size={15} /> <Text>Réserver session</Text></Button>
                  <Button className="flex items-center gap-2"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "white" }}
                    onPress={() => {
                      if (!messageText.trim()) { UIService.openToast("Écrivez un message d'abord", "error"); return; }
                      UIService.openToast(`Message envoyé à ${selectedMentor.name.split(" ")[0]} !`, "success");
                      setMessageText("");
                      setSelectedMentor(null);
                    }}>
                    <Send size={15} /> <Text>Envoyer</Text></Button>
                </View>
              </View>
            </Pressable>
          </Pressable>
        )}
      </>

      {/* ── SESSION REQUEST CONFIRMATION ── */}
      <>
        {showRequestModal && selectedMentor && (
          <Pressable
            className="absolute inset-0 z-[60] flex items-center justify-center px-6"
            style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
            onPress={() => setShowRequestModal(false)}>
            <Pressable
              className="w-full max-w-sm rounded-3xl p-6 text-center"
              style={{ borderStyle: "solid" }}
              onPress={(e) => e.stopPropagation()}>
              <View className="text-5xl mb-3">{selectedMentor.avatar}</View>
              <Text className="text-white font-bold text-lg mb-1">Demande de session</Text>
              <Text className="text-white/60 text-sm mb-5">
                Confirmer votre demande de session avec <Text className="text-white font-semibold">{selectedMentor.name}</Text> ?
                <br />
                <Text className="text-xs mt-1 inline-block" style={{ color: selectedMentor.price === "Gratuit" ? "#10B981" : selectedMentor.color }}>
                  Tarif : {selectedMentor.price}
                </Text>
              </Text>
              <View className="gap-3">
                <Button className="" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
                  onPress={() => setShowRequestModal(false)}>
                  <Text>Annuler</Text></Button>
                <Button className="flex items-center justify-center gap-2"
                  style={{ backgroundColor: `${selectedMentor.color}35`, color: "white" }}
                  onPress={() => {
                    UIService.openToast(`Demande envoyée à ${selectedMentor.name.split(" ")[0]} ! Réponse sous ${selectedMentor.responseTime}`, "success");
                    setShowRequestModal(false);
                    setSelectedMentor(null);
                  }}>
                  <CheckCircle size={15} /> <Text>Confirmer</Text></Button>
              </View>
            </Pressable>
          </Pressable>
        )}
      </>

      {/* ── NEW POST MODAL ── */}
      <>
        {showNewPost && (
          <Pressable
            className="absolute inset-0 z-50 flex items-end"
            style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
            onPress={() => setShowNewPost(false)}>
            <Pressable
              className="w-full rounded-t-3xl pb-8"
              style={{  }}
              onPress={(e) => e.stopPropagation()}>
              <View className="p-5">
                <View className="w-12 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
                <Text className="text-white font-bold text-lg mb-4">Nouvelle discussion</Text>
                <View className="space-y-3">
                  <TextInput placeholder="Titre de votre question…" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none placeholder:text-white/30" />
                  <TextInput placeholder="Décrivez votre question ou partagez votre expérience…"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none placeholder:text-white/30"  multiline textAlignVertical="top"/>
                </View>
                <Button className="w-full mt-4 flex items-center justify-center gap-2" style={{ backgroundColor: "rgba(99,102,241,0.35)", color: "white" }}
                  onPress={() => {
                    UIService.openToast("Post publié dans le forum !", "success");
                    setShowNewPost(false);
                  }}>
                  <Send size={15} /> <Text>Publier</Text></Button>
              </View>
            </Pressable>
          </Pressable>
        )}
      </>
    </View>
  );
}

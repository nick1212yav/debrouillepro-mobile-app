import { UIService } from "@/core/sdk/ui/UIService";
import { View, Pressable, Text } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, Award, Star, Trophy, Medal, CheckCircle, Lock,
  Share2, Download, TrendingUp, Users, Zap, Target, BookOpen,
  Brain, Dumbbell, Heart, Globe, Flame, Crown, X, ChevronRight
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";

type Props = { onBack: () => void };

type BadgeRarity = "common" | "rare" | "epic" | "legendary";
type BadgeStatus = "locked" | "in_progress" | "earned";

type AppBadge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  status: BadgeStatus;
  progress?: number;
  maxProgress?: number;
  earnedDate?: string;
  xp: number;
  category: string;
};

type Certification = {
  id: string;
  title: string;
  issuer: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  milestones: { label: string; done: boolean }[];
  progress: number;
  status: "locked" | "in_progress" | "completed";
  earnedDate?: string;
  xp: number;
  level: string;
};

const RARITY_CONFIG: Record<BadgeRarity, { label: string; color: string; glow: string }> = {
  common:    { label: "Commun",    color: "#94A3B8", glow: "rgba(148,163,184,0.3)" },
  rare:      { label: "Rare",      color: "#6366F1", glow: "rgba(99,102,241,0.4)" },
  epic:      { label: "Épique",    color: "#A855F7", glow: "rgba(168,85,247,0.45)" },
  legendary: { label: "Légendaire",color: "#F59E0B", glow: "rgba(245,158,11,0.5)" },
};

const BADGES: AppBadge[] = [
  { id: "first_quiz",    name: "Premier Pas",      description: "Compléter votre premier quiz",             icon: "🎯", rarity: "common",    status: "earned",      earnedDate: "2025-01-10", xp: 50,  category: "Quiz" },
  { id: "perfect",       name: "Perfectionniste",  description: "Obtenir 100% à un quiz",                   icon: "💯", rarity: "epic",      status: "earned",      earnedDate: "2025-01-15", xp: 200, category: "Quiz" },
  { id: "streak3",       name: "En Série",         description: "Réussir 3 quiz de suite",                  icon: "🔥", rarity: "rare",      status: "earned",      earnedDate: "2025-01-18", xp: 100, category: "Quiz" },
  { id: "speed",         name: "Speed Runner",     description: "Terminer un défi chrono en moins de 5s/q", icon: "⚡", rarity: "rare",      status: "in_progress", progress: 2, maxProgress: 1, xp: 150, category: "Quiz" },
  { id: "explorer",      name: "Explorateur",      description: "Compléter les 4 catégories de quiz",       icon: "🗺️", rarity: "epic",     status: "in_progress", progress: 3, maxProgress: 4, xp: 250, category: "Quiz" },
  { id: "legend",        name: "Légende",          description: "Atteindre le niveau 10",                   icon: "👑", rarity: "legendary", status: "locked",                                   xp: 500, category: "Niveau" },
  { id: "wellness",      name: "Équilibre",        description: "Utiliser Fitness, Nutrition et Méditation", icon: "🧘", rarity: "rare",     status: "earned",      earnedDate: "2025-02-01", xp: 120, category: "Bien-être" },
  { id: "traveler",      name: "Globe-Trotter",    description: "Ajouter 5 destinations au bucket-list",    icon: "✈️", rarity: "rare",     status: "in_progress", progress: 3, maxProgress: 5, xp: 130, category: "Voyage" },
  { id: "creator",       name: "Créateur",         description: "Publier 3 contenus",                       icon: "🎨", rarity: "common",   status: "earned",      earnedDate: "2025-01-22", xp: 80,  category: "Création" },
  { id: "community",     name: "Communautaire",    description: "Rejoindre 2 groupes actifs",               icon: "🤝", rarity: "common",   status: "earned",      earnedDate: "2025-02-05", xp: 60,  category: "Social" },
  { id: "scholar",       name: "Érudit",           description: "Terminer 3 cours complets",                icon: "📚", rarity: "epic",     status: "in_progress", progress: 1, maxProgress: 3, xp: 300, category: "Cours" },
  { id: "champion",      name: "Champion",         description: "Top 10 du classement hebdomadaire",        icon: "🏆", rarity: "legendary",status: "locked",                                   xp: 400, category: "Classement" },
];

const CERTIFICATIONS: Certification[] = [
  {
    id: "web-dev",
    title: "Développement Web",
    issuer: "Débrouille Pro Academy",
    description: "Maîtrisez les fondamentaux du développement web moderne : HTML, CSS, JavaScript et React.",
    color: "#6366F1",
    icon: <Brain size={22} />,
    milestones: [
      { label: "Bases HTML & CSS",         done: true },
      { label: "JavaScript Fondamentaux",  done: true },
      { label: "React & Composants",       done: false },
      { label: "Projet Final",             done: false },
    ],
    progress: 50,
    status: "in_progress",
    xp: 1000,
    level: "Intermédiaire",
  },
  {
    id: "fitness-coach",
    title: "Coach Fitness Personnel",
    issuer: "Débrouille Pro Wellness",
    description: "Obtenez votre certification en coaching sportif et bien-être.",
    color: "#10B981",
    icon: <Dumbbell size={22} />,
    milestones: [
      { label: "Anatomie & Physiologie", done: true },
      { label: "Programmation sportive", done: true },
      { label: "Nutrition sportive",     done: true },
      { label: "Coaching pratique",      done: false },
    ],
    progress: 75,
    status: "in_progress",
    xp: 800,
    level: "Avancé",
  },
  {
    id: "finance",
    title: "Gestion Financière",
    issuer: "Débrouille Pro Finance",
    description: "Apprenez à gérer votre budget, investir et planifier votre avenir financier.",
    color: "#F59E0B",
    icon: <TrendingUp size={22} />,
    milestones: [
      { label: "Budget & Épargne",      done: true },
      { label: "Investissements",       done: false },
      { label: "Planification fiscale", done: false },
      { label: "Portefeuille final",    done: false },
    ],
    progress: 25,
    status: "in_progress",
    xp: 900,
    level: "Débutant",
  },
  {
    id: "digital-marketing",
    title: "Marketing Digital",
    issuer: "Débrouille Pro Business",
    description: "Stratégies réseaux sociaux, SEO, publicité en ligne et analytics.",
    color: "#EF4444",
    icon: <Target size={22} />,
    milestones: [
      { label: "Stratégie Social Media",  done: false },
      { label: "SEO & Contenu",          done: false },
      { label: "Publicité Payante",      done: false },
      { label: "Analytics & Reporting",  done: false },
    ],
    progress: 0,
    status: "locked",
    xp: 1200,
    level: "Avancé",
  },
  {
    id: "travel-guide",
    title: "Guide Voyageur Expert",
    issuer: "Débrouille Pro Travel",
    description: "Maîtrisez l'art du voyage : planification, budget, cultures et aventure.",
    color: "#06B6D4",
    icon: <Globe size={22} />,
    milestones: [
      { label: "Planification de voyage", done: true },
      { label: "Budget & Devises",        done: true },
      { label: "Cultures & Langues",      done: false },
      { label: "Guide de Terrain",        done: false },
    ],
    progress: 50,
    status: "in_progress",
    xp: 750,
    level: "Intermédiaire",
  },
];

const LEADERBOARD = [
  { rank: 1,  name: "Amadou K.",   avatar: "🧑🏾", xp: 4850, badges: 18, streak: 24, crown: true },
  { rank: 2,  name: "Fatou D.",    avatar: "👩🏾", xp: 4200, badges: 15, streak: 18 },
  { rank: 3,  name: "Moussa T.",   avatar: "🧑🏿", xp: 3980, badges: 14, streak: 12 },
  { rank: 4,  name: "Aisha B.",    avatar: "👩🏽", xp: 3650, badges: 12, streak: 9  },
  { rank: 5,  name: "Vous",        avatar: "⭐",   xp: 1560, badges: 6,  streak: 3, isUser: true },
  { rank: 6,  name: "Ibrahim S.",  avatar: "🧑🏾", xp: 1340, badges: 5,  streak: 2  },
  { rank: 7,  name: "Mariama C.",  avatar: "👩🏿", xp: 1180, badges: 4,  streak: 1  },
];

const TABS = ["Certifications", "Badges", "Classement"] as const;
type Tab = typeof TABS[number];

function XPBar({ current, max }: { current: number; max: number }) {
  const pct = Math.min((current / max) * 100, 100);
  const level = Math.floor(current / 500) + 1;
  const nextLevelXp = level * 500;
  const prevLevelXp = (level - 1) * 500;
  const levelPct = ((current - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100;
  return (
    <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
      <View className="flex items-center justify-between mb-2">
        <View className="flex items-center gap-2">
          <View className="w-8 h-8 rounded-xl flex items-center justify-center text-amber-400 font-black text-sm" style={{ backgroundColor: "rgba(245,158,11,0.2)" }}>
            {level}
          </View>
          <View>
            <View className="text-white font-semibold text-sm"><Text>Niveau</Text>{level}</View>
            <View className="text-white/40 text-xs">{current} <Text>XP total</Text></View>
          </View>
        </View>
        <View className="text-right">
          <View className="text-white/50 text-xs"><Text>Prochain niveau</Text></View>
          <View className="text-white text-sm font-bold">{nextLevelXp - current} <Text>XP</Text></View>
        </View>
      </View>
      <Progress value={levelPct} className="h-2" />
      <View className="flex justify-between mt-1">
        <Text className="text-white/30 text-xs">{prevLevelXp} XP</Text>
        <Text className="text-white/30 text-xs">{nextLevelXp} XP</Text>
      </View>
      {pct > 0 && <View className="mt-2 text-center text-white/40 text-xs">{Math.round(pct)}<Text>% du chemin parcouru</Text></View>}
    </View>
  );
}

export default function CertificationsPage({ onBack }: Props) {
  const [tab, setTab] = useState<Tab>("Certifications");
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<AppBadge | null>(null);
  const [badgeFilter, setBadgeFilter] = useState("Tous");

  const convexCerts = useQuery(api.education.getMyCertificates, {});
  const stats = useQuery(api.education.getEducationStats, {});

  // Merge real certificates with static ones
  const earnedCertTitles = new Set(convexCerts?.map((c) => c.title) ?? []);

  const totalXP = BADGES.filter((b) => b.status === "earned").reduce((s, b) => s + b.xp, 0) + 1560 + (stats?.certificates ?? 0) * 100;
  const earnedBadges = BADGES.filter((b) => b.status === "earned");
  const completedCerts = CERTIFICATIONS.filter((c) => c.status === "completed" || earnedCertTitles.has(c.title));

  const badgeCategories = ["Tous", ...Array.from(new Set(BADGES.map((b) => b.category)))];
  const filteredBadges = badgeFilter === "Tous" ? BADGES : BADGES.filter((b) => b.category === badgeFilter);

  return (
    <View className="h-full flex flex-col overflow-hidden" style={{  }}>
      {/* Header */}
      <View className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Pressable onPress={onBack} className="p-2 rounded-xl text-white/60">
          <ArrowLeft size={20} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-white font-bold text-xl">Certifications & Badges</Text>
          <Text className="text-white/50 text-xs">Votre parcours d'apprentissage</Text>
        </View>
        <View className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(245,158,11,0.15)" }}>
          <Star size={13} className="text-amber-400" />
          <Text className="text-amber-400 font-bold text-sm">{totalXP.toLocaleString()} XP</Text>
        </View>
      </View>

      {/* XP Bar */}
      <View className="px-4 pb-3">
        <XPBar current={totalXP} max={5000} />
      </View>

      {/* Quick stats */}
      <View className="px-4 pb-3 gap-2">
        {[
          { icon: <Award size={15} className="text-indigo-400" />, value: earnedBadges.length, label: "Badges" },
          { icon: <Trophy size={15} className="text-amber-400" />, value: completedCerts.length, label: "Certifs" },
          { icon: <Flame size={15} className="text-orange-400" />, value: "3", label: "Série" },
        ].map((s) => (
          <View key={s.label} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
            <View className="flex justify-center mb-0.5">{s.icon}</View>
            <View className="text-white font-bold text-base">{s.value}</View>
            <View className="text-white/40 text-xs">{s.label}</View>
          </View>
        ))}
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
        {/* ── CERTIFICATIONS ── */}
        {tab === "Certifications" && (
          <View className="space-y-3">
            {CERTIFICATIONS.map((cert, i) => (
              <Pressable key={cert.id}
                onPress={() => setSelectedCert(cert)}
                className="rounded-2xl p-4"
                style={{ backgroundColor: cert.status === "locked" ? "rgba(255,255,255,0.03)" : `${cert.color}12`, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
                <View className="flex items-start gap-3">
                  <View className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: cert.status === "locked" ? "rgba(255,255,255,0.06)" : `${cert.color}25` }}>
                    {cert.status === "locked" ? <Lock size={20} /> : cert.icon}
                  </View>
                  <View className="flex-1 min-w-0">
                    <View className="flex items-center gap-2 flex-wrap">
                      <Text className="text-white font-semibold text-sm">{cert.title}</Text>
                      <Badge className="text-xs border-0 px-2 py-0" style={{ backgroundColor: `${cert.color}25`, color: cert.color }}>{cert.level}</Badge>
                      {cert.status === "completed" && <CheckCircle size={14} color="#10B981" />}
                    </View>
                    <View className="text-white/40 text-xs mt-0.5">{cert.issuer}</View>
                    <View className="mt-2">
                      <View className="flex justify-between items-center mb-1">
                        <Text className="text-white/40 text-xs">{cert.milestones.filter((m) => m.done).length}/{cert.milestones.length} jalons</Text>
                        <Text className="text-xs font-bold" style={{ color: cert.color }}>{cert.progress}%</Text>
                      </View>
                      <Progress value={cert.progress} className="h-1.5" />
                    </View>
                    <View className="flex items-center gap-3 mt-2">
                      <View className="flex items-center gap-1 text-amber-400 text-xs">
                        <Star size={11} /><Text>{cert.xp} XP</Text>
                      </View>
                      <ChevronRight size={13} className="text-white/30 ml-auto" />
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── BADGES ── */}
        {tab === "Badges" && (
          <View>
            {/* Filter pills */}
            <View className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
              {badgeCategories.map((cat) => (
                <Pressable key={cat} onPress={() => setBadgeFilter(cat)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: badgeFilter === cat ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.06)", borderColor: "rgba(99,102,241,0.5)", borderStyle: "solid" }}>
                  {cat}
                </Pressable>
              ))}
            </View>

            <View className="gap-3">
              {filteredBadges.map((badge, i) => {
                const rarity = RARITY_CONFIG[badge.rarity];
                const isEarned = badge.status === "earned";
                const isProgress = badge.status === "in_progress";
                return (
                  <Pressable key={badge.id}
                    onPress={() => setSelectedBadge(badge)}
                    className="p-3 rounded-2xl flex flex-col items-center gap-1.5"
                    style={{ backgroundColor: isEarned ? `${rarity.color}18` : "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", opacity: badge.status === "locked" ? 0.45 : 1 }}>
                    <View className="text-3xl" style={{  }}>
                      {badge.status === "locked" ? "🔒" : badge.icon}
                    </View>
                    <View className="text-center">
                      <View className="text-white text-xs font-semibold leading-tight">{badge.name}</View>
                      <View className="text-xs font-bold mt-0.5" style={{  }}>{rarity.label}</View>
                    </View>
                    {isProgress && badge.maxProgress && (
                      <View className="w-full">
                        <Progress value={(badge.progress! / badge.maxProgress) * 100} className="h-1" />
                        <View className="text-center text-white/30 text-xs mt-0.5">{badge.progress}<Text>/</Text>{badge.maxProgress}</View>
                      </View>
                    )}
                    {isEarned && <CheckCircle size={12} color="#10B981" />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ── CLASSEMENT ── */}
        {tab === "Classement" && (
          <View className="space-y-2">
            <View className="flex items-center justify-between mb-3">
              <Text className="text-white/60 text-sm">Semaine en cours</Text>
              <View className="flex items-center gap-1 text-white/40 text-xs">
                <Users size={12} /><Text>Top apprenants</Text>
              </View>
            </View>
            {LEADERBOARD.map((entry, i) => (
              <View key={entry.rank}
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ backgroundColor: entry.isUser ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)", borderColor: "rgba(99,102,241,0.4)", borderStyle: "solid" }}>
                <View className="w-8 text-center font-black text-sm"
                  style={{  }}>
                  {entry.rank <= 3 ? ["🥇","🥈","🥉"][entry.rank - 1] : `#${entry.rank}`}
                </View>
                <View className="w-9 h-9 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                  {entry.avatar}
                </View>
                <View className="flex-1 min-w-0">
                  <View className="flex items-center gap-1">
                    <Text className="text-white font-semibold text-sm">{entry.name}</Text>
                    {entry.crown && <Crown size={12} className="text-amber-400" />}
                    {entry.isUser && <Badge className="text-xs border-0 px-1.5 py-0" style={{ backgroundColor: "rgba(99,102,241,0.3)", color: "#A5B4FC" }}><Text>Vous</Text></Badge>}
                  </View>
                  <View className="flex items-center gap-3 mt-0.5">
                    <Text className="text-white/40 text-xs">{entry.xp.toLocaleString()} XP</Text>
                    <Text className="text-white/40 text-xs">🏅 {entry.badges}</Text>
                    <Text className="text-white/40 text-xs">🔥 {entry.streak}</Text>
                  </View>
                </View>
                {entry.rank <= 3 && (
                  <Zap size={14} className="text-amber-400" />
                )}
              </View>
            ))}

            {/* Motivation banner */}
            <View className="mt-4 rounded-2xl p-4 text-center" style={{ backgroundColor: "rgba(99,102,241,0.1)", borderWidth: 1, borderColor: "rgba(99,102,241,0.25)", borderStyle: "solid" }}>
              <View className="text-2xl mb-1"><Text>🚀</Text></View>
              <View className="text-white font-semibold text-sm"><Text>Montez dans le classement !</Text></View>
              <View className="text-white/50 text-xs mt-1"><Text>Complétez des quiz et des cours pour gagner des XP et grimper dans le top.</Text></View>
              <Button className="mt-3 text-xs" size="sm" style={{ backgroundColor: "rgba(99,102,241,0.4)", color: "white" }}
                onPress={() => UIService.openToast("Continuez votre apprentissage !", "success")}>
                <Text>Gagner des XP</Text><ChevronRight size={13} />
              </Button>
            </View>
          </View>
        )}
      </View>

      {/* ── CERTIFICATION DETAIL MODAL ── */}
      <>
        {selectedCert && (
          <Pressable
            className="absolute inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            onPress={() => setSelectedCert(null)}>
            <Pressable
              className="w-full max-h-[85vh] overflow-y-auto rounded-t-3xl pb-8"
              style={{  }}
              onPress={(e) => e.stopPropagation()}>
              <View className="p-5">
                {/* Handle */}
                <View className="w-12 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />

                {/* Cert header */}
                <View className="flex items-center gap-3 mb-4">
                  <View className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${selectedCert.color}25` }}>
                    {selectedCert.status === "locked" ? <Lock size={24} /> : selectedCert.icon}
                  </View>
                  <View>
                    <Text className="text-white font-bold text-lg">{selectedCert.title}</Text>
                    <View className="text-white/50 text-sm">{selectedCert.issuer}</View>
                    <View className="flex gap-2 mt-1">
                      <Badge className="text-xs border-0" style={{ backgroundColor: `${selectedCert.color}25`, color: selectedCert.color }}>{selectedCert.level}</Badge>
                      <Badge className="text-xs border-0" style={{ backgroundColor: "rgba(245,158,11,0.2)", color: "#F59E0B" }}>{selectedCert.xp} <Text>XP</Text></Badge>
                    </View>
                  </View>
                </View>

                <Text className="text-white/60 text-sm leading-relaxed mb-5">{selectedCert.description}</Text>

                {/* Progress */}
                <View className="mb-5">
                  <View className="flex justify-between mb-2">
                    <Text className="text-white/60 text-sm font-medium">Progression</Text>
                    <Text className="font-bold text-sm" style={{ color: selectedCert.color }}>{selectedCert.progress}%</Text>
                  </View>
                  <Progress value={selectedCert.progress} className="h-2 mb-4" />
                  <View className="space-y-2">
                    {selectedCert.milestones.map((m, i) => (
                      <View key={i} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ backgroundColor: m.done ? `${selectedCert.color}12` : "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
                        <View className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: m.done ? `${selectedCert.color}30` : "rgba(255,255,255,0.07)" }}>
                          {m.done ? <CheckCircle size={14} style={{ color: selectedCert.color }} /> : <View className="w-2 h-2 rounded-full bg-white/20" />}
                        </View>
                        <Text className="text-sm" style={{ color: m.done ? "white" : "rgba(255,255,255,0.4)" }}>{m.label}</Text>
                        {i === selectedCert.milestones.filter((x) => x.done).length && !m.done && (
                          <Badge className="ml-auto text-xs border-0" style={{ backgroundColor: `${selectedCert.color}25`, color: selectedCert.color }}><Text>Suivant</Text></Badge>
                        )}
                      </View>
                    ))}
                  </View>
                </View>

                {/* Actions */}
                {selectedCert.status === "completed" ? (
                  <View className="gap-3">
                    <Button className="flex items-center gap-2" style={{ backgroundColor: `${selectedCert.color}35`, color: "white" }}
                      onPress={() => { UIService.openToast("Certificat partagé sur le feed !", "success"); setSelectedCert(null); }}>
                      <Share2 size={15} /> <Text>Partager</Text></Button>
                    <Button className="flex items-center gap-2" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "white" }}
                      onPress={() => { UIService.openToast("Téléchargement du certificat PDF…", "success"); }}>
                      <Download size={15} /> <Text>Télécharger</Text></Button>
                  </View>
                ) : selectedCert.status === "locked" ? (
                  <Button disabled className="w-full flex items-center gap-2" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}>
                    <Lock size={15} /> <Text>Prérequis non remplis</Text></Button>
                ) : (
                  <Button className="w-full flex items-center gap-2" style={{ backgroundColor: `${selectedCert.color}35`, color: "white" }}
                    onPress={() => { UIService.openToast("Continuez votre parcours !", "success"); setSelectedCert(null); }}>
                    <BookOpen size={15} /> <Text>Continuer le parcours</Text><ChevronRight size={15} />
                  </Button>
                )}
              </View>
            </Pressable>
          </Pressable>
        )}
      </>

      {/* ── BADGE DETAIL MODAL ── */}
      <>
        {selectedBadge && (
          <Pressable
            className="absolute inset-0 z-50 flex items-center justify-center px-6"
            style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
            onPress={() => setSelectedBadge(null)}>
            <Pressable
              className="w-full max-w-sm rounded-3xl p-6 text-center"
              style={{ borderStyle: "solid" }}
              onPress={(e) => e.stopPropagation()}>
              <Pressable onPress={() => setSelectedBadge(null)} className="absolute top-4 right-4 text-white/40">
                <X size={18} />
              </Pressable>

              {/* Glow + icon */}
              <View className="relative inline-flex items-center justify-center mb-4">
                <View className="absolute w-24 h-24 rounded-full" style={{ backgroundColor: RARITY_CONFIG[selectedBadge.rarity].glow }} />
                <View className="relative text-6xl"
                  style={{  }}>
                  {selectedBadge.status === "locked" ? "🔒" : selectedBadge.icon}
                </View>
              </View>

              <Text className="text-white font-bold text-xl mb-1">{selectedBadge.name}</Text>
              <View className="flex justify-center gap-2 mb-3">
                <Badge className="border-0" style={{ backgroundColor: `${RARITY_CONFIG[selectedBadge.rarity].color}25`, color: RARITY_CONFIG[selectedBadge.rarity].color }}>
                  {RARITY_CONFIG[selectedBadge.rarity].label}
                </Badge>
                <Badge className="border-0" style={{ backgroundColor: "rgba(245,158,11,0.2)", color: "#F59E0B" }}>
                  <Text>+</Text>{selectedBadge.xp} <Text>XP</Text></Badge>
              </View>
              <Text className="text-white/60 text-sm mb-4">{selectedBadge.description}</Text>

              {selectedBadge.status === "in_progress" && selectedBadge.maxProgress && (
                <View className="mb-4">
                  <View className="flex justify-between text-xs text-white/50 mb-1">
                    <Text><Text>Progression</Text></Text>
                    <Text>{selectedBadge.progress}<Text>/</Text>{selectedBadge.maxProgress}</Text>
                  </View>
                  <Progress value={(selectedBadge.progress! / selectedBadge.maxProgress) * 100} className="h-2" />
                </View>
              )}

              {selectedBadge.earnedDate && (
                <View className="text-white/30 text-xs mb-4">
                  <Text>Obtenu le</Text>{new Date(selectedBadge.earnedDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </View>
              )}

              {selectedBadge.status === "earned" && (
                <Button className="w-full flex items-center justify-center gap-2" style={{ backgroundColor: `${RARITY_CONFIG[selectedBadge.rarity].color}30`, color: "white" }}
                  onPress={() => { UIService.openToast(`Badge "${selectedBadge.name}" partagé !`, "success"); setSelectedBadge(null); }}>
                  <Share2 size={15} /> <Text>Partager ce badge</Text></Button>
              )}
            </Pressable>
          </Pressable>
        )}
      </>
    </View>
  );
}

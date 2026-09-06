import { View, Pressable, Text, TextInput } from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, Wind, Moon, Waves, CloudRain, TreePine, Play, Pause,
  SkipForward, Volume2, VolumeX, Heart, Star, Flame, CheckCircle2,
  BookOpen, Smile, Meh, Frown, Zap, Sun, ChevronRight, Plus
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin";

type Tab = "sessions" | "respiration" | "journal" | "sons" | "stats";

interface Session {
  id: string;
  title: string;
  duration: number; // minutes
  category: string;
  description: string;
  color: string;
  icon: string;
  level: "débutant" | "intermédiaire" | "avancé";
}

interface BreathingExercise {
  id: string;
  name: string;
  pattern: { inhale: number; hold1: number; exhale: number; hold2: number };
  color: string;
  benefit: string;
  cycles: number;
}

interface JournalEntry {
  date: string;
  mood: number; // 1-5
  gratitude: string[];
  note: string;
  meditated: boolean;
}

interface AmbientSound {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const SESSIONS: Session[] = [
  { id: "s1", title: "Début de journée", duration: 5, category: "Énergie", description: "Réveillez-vous en douceur avec cette méditation matinale guidée pour démarrer la journée avec sérénité.", color: "#F97316", icon: "☀️", level: "débutant" },
  { id: "s2", title: "Pleine conscience", duration: 10, category: "Concentration", description: "Ancrez-vous dans le moment présent et développez votre capacité d'attention.", color: "#8B5CF6", icon: "🧘", level: "intermédiaire" },
  { id: "s3", title: "Gestion du stress", duration: 15, category: "Stress", description: "Libérez les tensions accumulées grâce à des techniques de relaxation profonde.", color: "#3B82F6", icon: "🌊", level: "débutant" },
  { id: "s4", title: "Sommeil profond", duration: 20, category: "Sommeil", description: "Préparez votre corps et votre esprit pour une nuit de sommeil réparateur.", color: "#6366F1", icon: "🌙", level: "débutant" },
  { id: "s5", title: "Compassion envers soi", duration: 10, category: "Émotions", description: "Cultivez la bienveillance envers vous-même et développez votre résilience émotionnelle.", color: "#EC4899", icon: "💗", level: "intermédiaire" },
  { id: "s6", title: "Visualisation positive", duration: 15, category: "Énergie", description: "Programmez votre esprit pour le succès grâce à des visualisations guidées puissantes.", color: "#10B981", icon: "✨", level: "avancé" },
];

const BREATHING_EXERCISES: BreathingExercise[] = [
  { id: "b1", name: "Cohérence cardiaque", pattern: { inhale: 5, hold1: 0, exhale: 5, hold2: 0 }, color: "#10B981", benefit: "Réduit le stress et régule le système nerveux", cycles: 6 },
  { id: "b2", name: "4-7-8 Relaxation", pattern: { inhale: 4, hold1: 7, exhale: 8, hold2: 0 }, color: "#8B5CF6", benefit: "Favorise l'endormissement et calme l'anxiété", cycles: 4 },
  { id: "b3", name: "Respiration carrée", pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 }, color: "#3B82F6", benefit: "Améliore la concentration et la clarté mentale", cycles: 5 },
  { id: "b4", name: "Énergie & Vitalité", pattern: { inhale: 2, hold1: 1, exhale: 2, hold2: 1 }, color: "#F97316", benefit: "Booste l'énergie et la vigilance naturellement", cycles: 8 },
];

const AMBIENT_SOUNDS: AmbientSound[] = [
  { id: "rain", name: "Pluie douce", icon: "🌧️", color: "#3B82F6" },
  { id: "forest", name: "Forêt", icon: "🌲", color: "#22C55E" },
  { id: "ocean", name: "Océan", icon: "🌊", color: "#0EA5E9" },
  { id: "fire", name: "Feu de camp", icon: "🔥", color: "#F97316" },
  { id: "wind", name: "Vent léger", icon: "💨", color: "#8B5CF6" },
  { id: "night", name: "Nuit étoilée", icon: "⭐", color: "#6366F1" },
];

const MOODS = [
  { value: 1, icon: Frown, label: "Difficile", color: "#EF4444" },
  { value: 2, icon: Meh, label: "Moyen", color: "#F97316" },
  { value: 3, icon: Smile, label: "Bien", color: "#F59E0B" },
  { value: 4, icon: Sun, label: "Super", color: "#10B981" },
  { value: 5, icon: Zap, label: "Excellent", color: "#8B5CF6" },
];

const LS_KEY = "meditation_data";

type MeditationData = {
  completedSessions: string[];
  streak: number;
  lastDate: string;
  totalMinutes: number;
  journal: JournalEntry[];
  activeSounds: string[];
};

function loadData(): MeditationData {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as MeditationData;
  } catch { /* empty */ }
  return { completedSessions: [], streak: 3, lastDate: new Date().toISOString().split("T")[0], totalMinutes: 95, journal: [], activeSounds: [] };
}

function saveData(data: MeditationData) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

// ──────────────────────────────────────────────────────────────────────────────
// Breathing Circle Component
// ──────────────────────────────────────────────────────────────────────────────
function BreathingCircle({ exercise, onDone }: { exercise: BreathingExercise; onDone: () => void }) {
  const { pattern, cycles } = exercise;
  const phases = [
    { label: "Inspirez", duration: pattern.inhale, color: "#10B981" },
    ...(pattern.hold1 > 0 ? [{ label: "Retenez", duration: pattern.hold1, color: "#F59E0B" }] : []),
    { label: "Expirez", duration: pattern.exhale, color: "#3B82F6" },
    ...(pattern.hold2 > 0 ? [{ label: "Pause", duration: pattern.hold2, color: "#8B5CF6" }] : []),
  ];

  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(0);

  const currentPhase = phases[phaseIdx];

  const advance = useCallback(() => {
    tickRef.current += 0.1;
    const phaseDur = phases[phaseIdx].duration;
    setProgress(Math.min(tickRef.current / phaseDur, 1));
    if (tickRef.current >= phaseDur) {
      tickRef.current = 0;
      const nextPhase = (phaseIdx + 1) % phases.length;
      if (nextPhase === 0) {
        const nextCycle = cycleCount + 1;
        if (nextCycle >= cycles) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          setCycleCount(nextCycle);
          onDone();
          return;
        }
        setCycleCount(nextCycle);
      }
      setPhaseIdx(nextPhase);
    }
  }, [phaseIdx, cycleCount, cycles, phases, onDone]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(advance, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, advance]);

  const toggle = () => {
    if (!running) { tickRef.current = 0; setPhaseIdx(0); setCycleCount(0); setProgress(0); }
    setRunning(p => !p);
  };

  const scale = currentPhase.label === "Inspirez" ? 1 + progress * 0.4
    : currentPhase.label === "Expirez" ? 1.4 - progress * 0.4
    : 1.4;

  return (
    <View className="flex flex-col items-center gap-6 py-6">
      <View className="text-center">
        <Text className="text-lg font-bold text-white">{exercise.name}</Text>
        <Text className="text-sm text-white/50">{exercise.benefit}</Text>
      </View>

      <View className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
        {/* Outer pulse */}
        <View
          className="absolute inset-0 rounded-full"
          style={{  }}
        />
        {/* Main circle */}
        <View
          className="w-36 h-36 rounded-full flex flex-col items-center justify-center"
          style={{ borderStyle: "solid" }}
        >
          <Text className="text-2xl font-bold text-white">{currentPhase.label}</Text>
          <Text className="text-sm text-white/70">{currentPhase.duration}s</Text>
        </View>
        {/* Progress ring */}
        <svg className="absolute inset-0 -rotate-90" width={220} height={220}>
          <circle cx={110} cy={110} r={100} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
          <circle cx={110} cy={110} r={100} fill="none" stroke={exercise.color} strokeWidth={3}
            strokeDasharray={`${2 * Math.PI * 100}`}
            strokeDashoffset={`${2 * Math.PI * 100 * (1 - progress)}`}
            strokeLinecap="round" />
        </svg>
      </View>

      <Text className="text-white/50 text-sm">Cycle {Math.min(cycleCount + 1, cycles)} / {cycles}</Text>

      <Pressable onPress={toggle} className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{  }}>
        {running ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white ml-1" />}
      </Pressable>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Session Timer Component
// ──────────────────────────────────────────────────────────────────────────────
function SessionTimer({ session, onComplete, onClose }: { session: Session; onComplete: () => void; onClose: () => void }) {
  const totalSeconds = session.duration * 60;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running && elapsed < totalSeconds) {
      intervalRef.current = setInterval(() => {
        setElapsed(p => {
          if (p + 1 >= totalSeconds) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            onComplete();
            return totalSeconds;
          }
          return p + 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, elapsed, totalSeconds, onComplete]);

  const remaining = totalSeconds - elapsed;
  const mins = Math.floor(remaining / 60).toString().padStart(2, "0");
  const secs = (remaining % 60).toString().padStart(2, "0");
  const progress = elapsed / totalSeconds;

  return (
    <View
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{  }}>
      <View className="absolute top-4 right-4">
        <Pressable onPress={onClose} className="text-white/50 p-2">
          <SkipForward size={20} />
        </Pressable>
      </View>

      <Text className="text-4xl mb-2">{session.icon}</Text>
      <Text className="text-xl font-bold text-white mb-1">{session.title}</Text>
      <Text className="text-sm text-white/50 mb-10">{session.category}</Text>

      <View className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
        <svg className="absolute -rotate-90" width={240} height={240}>
          <circle cx={120} cy={120} r={108} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
          <circle cx={120} cy={120} r={108} fill="none" stroke={session.color} strokeWidth={4}
            strokeDasharray={`${2 * Math.PI * 108}`}
            strokeDashoffset={`${2 * Math.PI * 108 * (1 - progress)}`}
            strokeLinecap="round" />
        </svg>
        <View className="flex flex-col items-center">
          <Text className="text-5xl font-bold text-white tracking-widest">{mins}:{secs}</Text>
          <Text className="text-white/40 text-sm mt-1">restant</Text>
        </View>
      </View>

      <View className="flex gap-4 mt-10">
        <Pressable onPress={() => setRunning(p => !p)}
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{  }}>
          {running ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white ml-1" />}
        </Pressable>
      </View>

      {/* Ambient particles */}
      {[...Array(6)].map((_, i) => (
        <View key={i}
          className="absolute bottom-20 w-2 h-2 rounded-full"
          style={{ backgroundColor: session.color, left: "50%" }}
        />
      ))}
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────────────────────
export default function MeditationPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("sessions");
  const [data, setData] = useState<MeditationData>(loadData);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [sessionDone, setSessionDone] = useState(false);
  const [activeBreathing, setActiveBreathing] = useState<BreathingExercise | null>(null);
  const [soundMuted, setSoundMuted] = useState(false);
  const [mood, setMood] = useState<number | null>(null);
  const [gratitude, setGratitude] = useState(["", "", ""]);
  const [journalNote, setJournalNote] = useState("");

  // Convex mutations
  const logMeditation = useMutation(api.health.logMeditation);
  const meditationHistory = useQuery(api.health.getMeditationHistory, { limit: 30 }) ?? [];

  // Derive stats from Convex data when available
  const totalMinutesConvex = meditationHistory.reduce((s, m) => s + m.durationMinutes, 0);
  const totalMinutes = totalMinutesConvex > 0 ? totalMinutesConvex : data.totalMinutes;

  const update = (patch: Partial<MeditationData>) => {
    const next = { ...data, ...patch };
    setData(next);
    saveData(next);
  };

  const startSession = (s: Session) => { setActiveSession(s); setSessionDone(false); };

  const completeSession = () => {
    if (!activeSession) return;
    setSessionDone(true);
    const alreadyDone = data.completedSessions.includes(activeSession.id);
    update({
      completedSessions: alreadyDone ? data.completedSessions : [...data.completedSessions, activeSession.id],
      totalMinutes: data.totalMinutes + (alreadyDone ? 0 : activeSession.duration),
      streak: data.streak + (alreadyDone ? 0 : 1),
    });
    // Persist to Convex
    logMeditation({
      type: activeSession.category,
      durationMinutes: activeSession.duration,
      date: new Date().toISOString(),
      moodAfter: mood ?? undefined,
      notes: activeSession.title,
    }).catch(() => {/* non-blocking */});
  };

  const saveJournal = () => {
    if (!mood) return;
    const entry: JournalEntry = {
      date: new Date().toISOString().split("T")[0],
      mood,
      gratitude: gratitude.filter(g => g.trim()),
      note: journalNote,
      meditated: data.completedSessions.length > 0,
    };
    update({ journal: [entry, ...data.journal].slice(0, 30) });
    setMood(null);
    setGratitude(["", "", ""]);
    setJournalNote("");
  };

  const toggleSound = (id: string) => {
    const active = data.activeSounds.includes(id)
      ? data.activeSounds.filter(s => s !== id)
      : [...data.activeSounds, id];
    update({ activeSounds: active });
  };

  const tabs: { id: Tab; label: string; icon: typeof Wind }[] = [
    { id: "sessions", label: "Sessions", icon: Moon },
    { id: "respiration", label: "Respiration", icon: Wind },
    { id: "sons", label: "Sons", icon: Volume2 },
    { id: "journal", label: "Journal", icon: BookOpen },
    { id: "stats", label: "Stats", icon: Star },
  ];

  const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <View className="h-full flex flex-col" style={{  }}>
      {/* Header */}
      <View className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Pressable onPress={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
          <ArrowLeft size={20} className="text-white" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-white">Méditation & Mindfulness</Text>
          <Text className="text-xs text-white/50">Calme, focus et bien-être intérieur</Text>
        </View>
        <View className="flex items-center gap-1 px-3 py-1.5 rounded-xl" style={{ backgroundColor: "rgba(249,115,22,0.15)", borderWidth: 1, borderColor: "rgba(249,115,22,0.3)", borderStyle: "solid" }}>
          <Flame size={14} className="text-orange-400" />
          <Text className="text-sm font-bold text-orange-300">{data.streak}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="px-4 pb-2 overflow-x-auto">
        <View className="flex gap-2">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <Pressable key={t.id} onPress={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
                style={active
                  ? {  }
                  : { backgroundColor: "rgba(255,255,255,0.06)" }}>
                <Icon size={14} />
                {t.label}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 overflow-y-auto px-4 pb-6">
        <>

          {/* SESSIONS TAB */}
          {tab === "sessions" && (
            <View key="sessions" className="space-y-4 pt-2">
              {/* Hero card */}
              <View className="rounded-2xl p-5 relative overflow-hidden"
                style={{ borderWidth: 1, borderColor: "rgba(139,92,246,0.3)", borderStyle: "solid" }}>
                <View className="absolute top-0 right-0 text-6xl opacity-20 p-4"><Text>🧘</Text></View>
                <Text className="text-white/60 text-xs mb-1">Aujourd'hui</Text>
                <Text className="text-white font-bold text-lg mb-2">Moment de calme</Text>
                <Text className="text-white/60 text-sm">Choisissez une session pour commencer</Text>
                <View className="flex gap-4 mt-4">
                  <View className="text-center">
                    <Text className="text-2xl font-bold text-purple-300">{Math.floor(totalMinutes / 60)}h{totalMinutes % 60}m</Text>
                    <Text className="text-xs text-white/40">Total médité</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-2xl font-bold text-orange-300">{data.streak}</Text>
                    <Text className="text-xs text-white/40">Jours consécutifs</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-2xl font-bold text-green-300">{data.completedSessions.length}</Text>
                    <Text className="text-xs text-white/40">Sessions</Text>
                  </View>
                </View>
              </View>

              {/* Session cards */}
              <Text className="text-white font-semibold text-sm">Sessions guidées</Text>
              <View className="space-y-3">
                {SESSIONS.map(s => {
                  const done = data.completedSessions.includes(s.id);
                  return (
                    <Pressable key={s.id} onPress={() => startSession(s)}
                      className="w-full text-left rounded-2xl p-4"
                      style={{ borderStyle: "solid" }}>
                      <View className="flex items-center gap-3">
                        <View className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ backgroundColor: `${s.color}20` }}>
                          {s.icon}
                        </View>
                        <View className="flex-1 min-w-0">
                          <View className="flex items-center gap-2">
                            <Text className="text-white font-semibold text-sm">{s.title}</Text>
                            {done && <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />}
                          </View>
                          <Text className="text-white/50 text-xs truncate">{s.description}</Text>
                          <View className="flex items-center gap-2 mt-1">
                            <Text className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${s.color}20`, color: s.color }}>{s.duration} min</Text>
                            <Text className="text-xs text-white/40">{s.category}</Text>
                            <Text className="text-xs text-white/30">· {s.level}</Text>
                          </View>
                        </View>
                        <ChevronRight size={16} className="text-white/30" />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* RESPIRATION TAB */}
          {tab === "respiration" && (
            <View key="respiration" className="space-y-4 pt-2">
              {activeBreathing ? (
                <>
                  <Pressable onPress={() => setActiveBreathing(null)} className="flex items-center gap-2 text-white/50 text-sm">
                    <ArrowLeft size={16} /> <Text>Retour</Text></Pressable>
                  <BreathingCircle exercise={activeBreathing} onDone={() => {}} />
                </>
              ) : (
                <>
                  <View className="rounded-2xl p-4 text-center" style={{ backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)", borderStyle: "solid" }}>
                    <Text className="text-3xl mb-2">🌬️</Text>
                    <Text className="text-white font-semibold">Exercices de respiration</Text>
                    <Text className="text-white/50 text-sm">Réglez votre souffle, réglez votre vie</Text>
                  </View>
                  <View className="space-y-3">
                    {BREATHING_EXERCISES.map(ex => (
                      <Pressable key={ex.id} onPress={() => setActiveBreathing(ex)}
                        className="w-full text-left rounded-2xl p-4"
                        style={{ backgroundColor: `${ex.color}10`, borderStyle: "solid" }}>
                        <View className="flex items-center justify-between">
                          <View>
                            <Text className="text-white font-semibold">{ex.name}</Text>
                            <Text className="text-white/50 text-xs mt-0.5">{ex.benefit}</Text>
                            <View className="flex gap-2 mt-2">
                              {ex.pattern.inhale > 0 && <Text className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">↑ {ex.pattern.inhale}s</Text>}
                              {ex.pattern.hold1 > 0 && <Text className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">⏸ {ex.pattern.hold1}s</Text>}
                              {ex.pattern.exhale > 0 && <Text className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">↓ {ex.pattern.exhale}s</Text>}
                              {ex.pattern.hold2 > 0 && <Text className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">⏸ {ex.pattern.hold2}s</Text>}
                            </View>
                          </View>
                          <View className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${ex.color}20`, borderStyle: "solid" }}>
                            <Play size={18} style={{ color: ex.color }} className="ml-0.5" />
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {/* SONS TAB */}
          {tab === "sons" && (
            <View key="sons" className="space-y-4 pt-2">
              <View className="flex items-center justify-between">
                <Text className="text-white font-semibold">Sons ambiants</Text>
                <Pressable onPress={() => setSoundMuted(m => !m)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                  {soundMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  {soundMuted ? "Muet" : "Actif"}
                </Pressable>
              </View>

              <View className="gap-3">
                {AMBIENT_SOUNDS.map(sound => {
                  const active = data.activeSounds.includes(sound.id);
                  return (
                    <Pressable key={sound.id} onPress={() => toggleSound(sound.id)}
                      className="rounded-2xl p-4 flex flex-col items-center gap-2"
                      style={active
                        ? { borderStyle: "solid" }
                        : { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                      <Text className="text-3xl">{sound.icon}</Text>
                      <Text className={`text-sm font-medium ${active ? "text-white" : "text-white/50"}`}>{sound.name}</Text>
                      {active && (
                        <View
                          className="flex gap-1">
                          {[1, 2, 3].map(i => (
                            <View key={i}
                              className="w-1 rounded-full" style={{ backgroundColor: sound.color }} />
                          ))}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <Text className="text-white/60 text-sm text-center">
                  {data.activeSounds.length === 0
                    ? "Sélectionnez un ou plusieurs sons pour créer votre ambiance"
                    : `${data.activeSounds.length} son${data.activeSounds.length > 1 ? "s" : ""} actif${data.activeSounds.length > 1 ? "s" : ""}`}
                </Text>
              </View>
            </View>
          )}

          {/* JOURNAL TAB */}
          {tab === "journal" && (
            <View key="journal" className="space-y-4 pt-2">
              <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <Text className="text-white font-semibold mb-3">Comment vous sentez-vous ?</Text>
                <View className="flex gap-2 justify-between mb-4">
                  {MOODS.map(m => {
                    const Icon = m.icon;
                    return (
                      <Pressable key={m.value} onPress={() => setMood(m.value)}
                        className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl"
                        style={mood === m.value
                          ? { backgroundColor: `${m.color}25`, borderStyle: "solid" }
                          : { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}>
                        <Icon size={20} style={{ color: m.color }} />
                        <Text className="text-xs text-white/50">{m.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text className="text-white/70 text-sm font-medium mb-2">3 choses dont je suis reconnaissant(e)</Text>
                {gratitude.map((g, i) => (
                  <View key={i} className="flex items-center gap-2 mb-2">
                    <Text className="text-yellow-400 text-sm">✦</Text>
                    <TextInput value={g} onChangeText={text => { const arr = [...gratitude]; arr[i] = text; setGratitude(arr); }}
                      placeholder={`Gratitude ${i + 1}...`}
                      className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30 border-b border-white/10 pb-1" />
                  </View>
                ))}

                <Text className="text-white/70 text-sm font-medium mb-2 mt-4">Note du jour</Text>
                <TextInput value={journalNote} onChangeText={text => setJournalNote(text)}
                  placeholder="Comment s'est passée votre journée ?"
                  className="w-full bg-white/5 rounded-xl p-3 text-white text-sm outline-none placeholder:text-white/30 border border-white/08"
                   multiline textAlignVertical="top"/>

                <Pressable onPress={saveJournal} disabled={!mood}
                  className="w-full mt-3 py-3 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{  }}>
                  <Text>Enregistrer l'entrée</Text></Pressable>
              </View>

              {data.journal.length > 0 && (
                <View className="space-y-2">
                  <Text className="text-white/60 text-sm font-medium">Entrées récentes</Text>
                  {data.journal.slice(0, 5).map((entry, i) => {
                    const m = MOODS.find(x => x.value === entry.mood);
                    const Icon = m?.icon ?? Smile;
                    return (
                      <View key={i} className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}>
                        <Icon size={20} style={{ color: m?.color ?? "#8B5CF6" }} />
                        <View className="flex-1 min-w-0">
                          <Text className="text-white/70 text-sm">{entry.date}</Text>
                          {entry.note && <Text className="text-white/40 text-xs truncate">{entry.note}</Text>}
                        </View>
                        {entry.meditated && <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* STATS TAB */}
          {tab === "stats" && (
            <View key="stats" className="space-y-4 pt-2">
              {/* Streak calendar */}
              <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(249,115,22,0.1)", borderWidth: 1, borderColor: "rgba(249,115,22,0.2)", borderStyle: "solid" }}>
                <View className="flex items-center gap-2 mb-3">
                  <Flame size={16} className="text-orange-400" />
                  <Text className="text-white font-semibold">{data.streak} jours de suite</Text>
                </View>
                <View className="flex gap-2">
                  {weekDays.map((d, i) => {
                    const active = i < (data.streak % 7);
                    return (
                      <View key={i} className="flex-1 flex flex-col items-center gap-1">
                        <View className="w-full aspect-square rounded-lg flex items-center justify-center"
                          style={active ? {  } : { backgroundColor: "rgba(255,255,255,0.06)" }}>
                          {active && <Flame size={12} className="text-white" />}
                        </View>
                        <Text className="text-xs text-white/40">{d}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Stats grid */}
              <View className="gap-3">
                {[
                  { label: "Minutes méditées", value: `${totalMinutes}`, unit: "min", color: "#8B5CF6", icon: "🧘" },
                  { label: "Sessions complètes", value: `${data.completedSessions.length}`, unit: "sessions", color: "#10B981", icon: "✅" },
                  { label: "Exercices de souffle", value: "12", unit: "exercices", color: "#3B82F6", icon: "🌬️" },
                  { label: "Entrées journal", value: `${data.journal.length}`, unit: "entrées", color: "#EC4899", icon: "📖" },
                ].map(stat => (
                  <View key={stat.label} className="rounded-2xl p-4" style={{ backgroundColor: `${stat.color}12`, borderStyle: "solid" }}>
                    <Text className="text-2xl mb-1">{stat.icon}</Text>
                    <Text className="text-2xl font-bold text-white">{stat.value}</Text>
                    <Text className="text-xs text-white/50">{stat.label}</Text>
                  </View>
                ))}
              </View>

              {/* Badges */}
              <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <Text className="text-white font-semibold mb-3">Badges gagnés</Text>
                <View className="flex gap-3 flex-wrap">
                  {[
                    { emoji: "🌱", label: "Premier pas", unlocked: data.completedSessions.length >= 1 },
                    { emoji: "🔥", label: "Flamme", unlocked: data.streak >= 3 },
                    { emoji: "🧘", label: "Méditant", unlocked: data.totalMinutes >= 60 },
                    { emoji: "⭐", label: "Étoile", unlocked: data.completedSessions.length >= 5 },
                    { emoji: "💎", label: "Diamant", unlocked: data.streak >= 7 },
                  ].map(badge => (
                    <View key={badge.label} className="flex flex-col items-center gap-1">
                      <View className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                        style={badge.unlocked ? { backgroundColor: "rgba(255,215,0,0.15)", borderWidth: 1, borderColor: "rgba(255,215,0,0.4)", borderStyle: "solid" } : { backgroundColor: "rgba(255,255,255,0.05)", opacity: 0.4 }}>
                        {badge.emoji}
                      </View>
                      <Text className="text-xs text-white/40">{badge.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </>
      </View>

      {/* Session Timer Overlay */}
      <>
        {activeSession && !sessionDone && (
          <SessionTimer
            session={activeSession}
            onComplete={completeSession}
            onClose={() => setActiveSession(null)}
          />
        )}
        {sessionDone && activeSession && (
          <View
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
            style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
            <View className="text-6xl"><Text>🌟</Text></View>
            <Text className="text-2xl font-bold text-white">Session terminée !</Text>
            <Text className="text-white/60 text-center">{activeSession.title} <Text>·</Text>{activeSession.duration} <Text>min</Text></Text>
            <View className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: "rgba(249,115,22,0.2)", borderWidth: 1, borderColor: "rgba(249,115,22,0.4)", borderStyle: "solid" }}>
              <Flame size={16} className="text-orange-400" />
              <Text className="text-orange-300 font-medium"><Text>Série :</Text>{data.streak} <Text>jours</Text></Text>
            </View>
            <Pressable onPress={() => { setActiveSession(null); setSessionDone(false); }}
              className="px-8 py-3 rounded-2xl font-semibold"
              style={{  }}>
              <Text>Continuer</Text></Pressable>
          </View>
        )}
      </>
    </View>
  );
}

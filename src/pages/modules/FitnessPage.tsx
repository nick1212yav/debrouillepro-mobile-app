import { UIService } from "@/core/sdk/ui/UIService";
import { View, Pressable, Text } from "react-native";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Play, Pause, RotateCcw, Flame, Clock, Dumbbell,
  ChevronRight, CheckCircle, Star, Trophy, Zap, Heart,
  BarChart2, Calendar, Target, Plus, X, ChevronDown, ChevronUp,
  Activity,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";

// ── Types ──────────────────────────────────────────────────────────────────
type Level = "débutant" | "intermédiaire" | "avancé";
type MuscleGroup = "full" | "haut" | "bas" | "cardio" | "core";
type Tab = "programmes" | "exercices" | "historique" | "stats";

type Exercise = {
  id: string;
  name: string;
  muscle: MuscleGroup;
  sets: number;
  reps: string;
  restSec: number;
  calories: number;
  description: string;
  emoji: string;
};

type Program = {
  id: string;
  name: string;
  level: Level;
  days: number;
  durationMin: number;
  calories: number;
  muscle: MuscleGroup;
  exercises: string[]; // exercise ids
  color: string;
  emoji: string;
  description: string;
};

type SessionRecord = {
  id: string;
  programId: string;
  programName: string;
  date: string; // ISO
  durationMin: number;
  calories: number;
  exercisesDone: number;
};

// ── Data ───────────────────────────────────────────────────────────────────
const EXERCISES: Exercise[] = [
  { id: "e1",  name: "Pompes",                muscle: "haut",  sets: 3, reps: "12-15", restSec: 60,  calories: 8,  emoji: "💪", description: "Position planche, mains à largeur d'épaules. Descendre la poitrine vers le sol." },
  { id: "e2",  name: "Squats",                muscle: "bas",   sets: 3, reps: "15-20", restSec: 60,  calories: 10, emoji: "🦵", description: "Pieds écartés, dos droit. Descendre comme pour s'asseoir, cuisses parallèles au sol." },
  { id: "e3",  name: "Gainage planche",       muscle: "core",  sets: 3, reps: "30-60s",restSec: 45,  calories: 5,  emoji: "🏋️", description: "Position planche sur les avant-bras. Maintenir le corps aligné et les abdos contractés." },
  { id: "e4",  name: "Burpees",               muscle: "full",  sets: 3, reps: "10-12", restSec: 90,  calories: 15, emoji: "🔥", description: "Depuis debout: descendre en squat, planche, pompe, retour squat, saut avec les bras en l'air." },
  { id: "e5",  name: "Fentes marchées",       muscle: "bas",   sets: 3, reps: "12/jambe",restSec:60, calories: 9,  emoji: "🚶", description: "Avancer en faisant une grande enjambée, genou arrière proche du sol. Alterner les jambes." },
  { id: "e6",  name: "Dips sur chaise",       muscle: "haut",  sets: 3, reps: "10-15", restSec: 60,  calories: 7,  emoji: "🪑", description: "Mains sur le bord d'une chaise. Descendre le corps en pliant les coudes à 90°." },
  { id: "e7",  name: "Mountain climbers",     muscle: "cardio",sets: 3, reps: "30s",   restSec: 45,  calories: 12, emoji: "⛰️", description: "Position planche. Ramener alternativement les genoux vers la poitrine le plus vite possible." },
  { id: "e8",  name: "Abdos crunchs",         muscle: "core",  sets: 3, reps: "20-25", restSec: 45,  calories: 6,  emoji: "💫", description: "Allongé sur le dos, genoux fléchis. Décoller les épaules en contractant les abdos." },
  { id: "e9",  name: "Jumping jacks",         muscle: "cardio",sets: 3, reps: "40s",   restSec: 30,  calories: 11, emoji: "⚡", description: "Sauter en écartant les jambes et les bras simultanément. Revenir position initiale." },
  { id: "e10", name: "Hip thrust au sol",     muscle: "bas",   sets: 3, reps: "15-20", restSec: 45,  calories: 7,  emoji: "🍑", description: "Allongé sur le dos, pieds à plat. Pousser les hanches vers le haut en contractant les fessiers." },
  { id: "e11", name: "Superman",              muscle: "haut",  sets: 3, reps: "12-15", restSec: 45,  calories: 5,  emoji: "🦸", description: "Allongé face au sol, bras tendus. Lever simultanément bras et jambes." },
  { id: "e12", name: "Saut à la corde",       muscle: "cardio",sets: 4, reps: "1 min", restSec: 60,  calories: 18, emoji: "🪢", description: "Sauter à la corde à rythme modéré. Atterrir sur la pointe des pieds." },
];

const EXERCISE_MAP: Record<string, Exercise> = Object.fromEntries(EXERCISES.map(e => [e.id, e]));

const PROGRAMS: Program[] = [
  { id: "p1", name: "Corps Complet Débutant", level: "débutant",       days: 3, durationMin: 25, calories: 180, muscle: "full",  exercises: ["e1","e2","e3","e9"],        color: "#00B894", emoji: "🌱", description: "Programme idéal pour débuter, 3 séances/semaine sans équipement." },
  { id: "p2", name: "Brûle-graisse Express",  level: "intermédiaire",  days: 4, durationMin: 35, calories: 280, muscle: "cardio",exercises: ["e4","e7","e9","e12","e2"],   color: "#E17055", emoji: "🔥", description: "Circuit HIIT intensif pour brûler un maximum de calories." },
  { id: "p3", name: "Force & Muscle",         level: "avancé",         days: 5, durationMin: 50, calories: 350, muscle: "haut",  exercises: ["e1","e6","e11","e3","e8"],   color: "#6C5CE7", emoji: "💪", description: "Programme de renforcement musculaire progressif sur 5 jours." },
  { id: "p4", name: "Jambes & Fessiers",      level: "intermédiaire",  days: 3, durationMin: 40, calories: 250, muscle: "bas",   exercises: ["e2","e5","e10","e7","e3"],   color: "#FD79A8", emoji: "🦵", description: "Tonifier et sculpter les jambes et les fessiers." },
  { id: "p5", name: "Gainage & Core",         level: "débutant",       days: 3, durationMin: 20, calories: 130, muscle: "core",  exercises: ["e3","e8","e11","e7"],        color: "#FDCB6E", emoji: "⚡", description: "Renforcer les abdominaux et stabilisateurs du dos." },
  { id: "p6", name: "Cardio Warrior",         level: "avancé",         days: 5, durationMin: 45, calories: 400, muscle: "cardio",exercises: ["e4","e7","e12","e9","e2","e5"],color:"#0984E3", emoji: "🏃", description: "Programme cardio intensif pour améliorer l'endurance et l'explosivité." },
];

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  full: "Corps complet", haut: "Haut du corps", bas: "Bas du corps", cardio: "Cardio", core: "Core / Abdos",
};
const LEVEL_COLORS: Record<Level, string> = {
  débutant: "#00B894", intermédiaire: "#FDCB6E", avancé: "#E17055",
};

const STORAGE_KEY = "fitness_sessions_v1";

function loadSessions(): SessionRecord[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as SessionRecord[]; }
  catch { return []; }
}
function saveSessions(s: SessionRecord[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

// ── Timer component ─────────────────────────────────────────────────────────
function WorkoutTimer({ program, onFinish, onClose }: { program: Program; onFinish: (dur: number) => void; onClose: () => void }) {
  const exercises = program.exercises.map(id => EXERCISE_MAP[id]).filter(Boolean);
  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [phase, setPhase] = useState<"work" | "rest" | "done">("work");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    totalRef.current = setInterval(() => setTotalElapsed(t => t + 1), 1000);
    return () => { if (totalRef.current) clearInterval(totalRef.current); };
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(t => t + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const currentEx = exercises[exIdx];
  const totalSets = currentEx?.sets ?? 3;
  const restSec = currentEx?.restSec ?? 60;

  const handleNext = () => {
    setElapsed(0);
    setRunning(false);
    if (phase === "work") {
      setPhase("rest");
    } else {
      // next set or next exercise
      if (setIdx + 1 < totalSets) {
        setSetIdx(s => s + 1);
        setPhase("work");
      } else if (exIdx + 1 < exercises.length) {
        setExIdx(i => i + 1);
        setSetIdx(0);
        setPhase("work");
      } else {
        setPhase("done");
        if (totalRef.current) clearInterval(totalRef.current);
        onFinish(Math.round(totalElapsed / 60));
      }
    }
  };

  if (phase === "done") return (
    <View className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
      <View className="text-center p-8">
        <View className="text-6xl mb-4"><Text>🏆</Text></View>
        <Text className="text-white text-2xl font-bold mb-2">Séance terminée !</Text>
        <Text className="text-gray-400 mb-1">{Math.round(totalElapsed / 60)} min • {program.calories} kcal</Text>
        <Text className="text-gray-400 mb-6">{exercises.length} exercices complétés</Text>
        <Pressable className="px-8 py-3 rounded-2xl font-bold text-white" style={{  }} onPress={onClose}>
          <Text>Voir mes stats</Text></Pressable>
      </View>
    </View>
  );

  const progress = exIdx / exercises.length;

  return (
    <View className="fixed inset-0 z-50 flex flex-col" style={{  }}>
      {/* Header */}
      <View className="flex items-center gap-3 p-4 pt-12">
        <Pressable className="p-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} onPress={onClose}>
          <X size={20} className="text-white" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-gray-400 text-xs">{program.name}</Text>
          <Text className="text-white text-sm font-semibold">Exercice {exIdx + 1}/{exercises.length}</Text>
        </View>
        <View className="flex items-center gap-1">
          <Clock size={14} className="text-gray-400" />
          <Text className="text-white font-mono">{Math.floor(totalElapsed/60).toString().padStart(2,"0")}:{(totalElapsed%60).toString().padStart(2,"0")}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View className="mx-4 h-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
        <View className="h-full rounded-full" style={{ backgroundColor: program.color, width: `${progress * 100}%` }} />
      </View>

      {/* Main */}
      <View className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Phase indicator */}
        <View
          key={phase}
          className="px-4 py-1.5 rounded-full text-sm font-bold mb-6"
          style={phase === "work"
            ? { backgroundColor: `${program.color}22`, borderStyle: "solid" }
            : { backgroundColor: "rgba(253,203,110,0.15)", borderWidth: 1, borderColor: "rgba(253,203,110,0.3)", borderStyle: "solid" }}
        >
          {phase === "work" ? "EXERCICE" : `REPOS — ${restSec}s`}
        </View>

        {/* Exercise name */}
        <>
          <View key={exIdx} className="text-center mb-4">
            <View className="text-6xl mb-3">{currentEx?.emoji}</View>
            <Text className="text-white text-2xl font-bold">{currentEx?.name}</Text>
            <Text className="text-gray-400 text-sm mt-1">{currentEx?.reps} reps</Text>
          </View>
        </>

        {/* Sets */}
        <View className="flex gap-2 mb-6">
          {Array.from({ length: totalSets }).map((_, i) => (
            <View key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={i < setIdx ? { backgroundColor: program.color }
                : i === setIdx ? { backgroundColor: `${program.color}33`, borderStyle: "solid" }
                : { backgroundColor: "rgba(255,255,255,0.08)" }}>
              {i < setIdx ? "✓" : i + 1}
            </View>
          ))}
        </View>

        {/* Elapsed */}
        <View className="text-5xl font-mono font-bold mb-8" style={{  }}>
          {Math.floor(elapsed/60).toString().padStart(2,"0")}<Text>:</Text>{(elapsed%60).toString().padStart(2,"0")}
        </View>

        {/* Controls */}
        <View className="flex gap-4">
          <Pressable className="p-4 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            onPress={() => { setRunning(r => !r); }}>
            {running ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white" />}
          </Pressable>
          <Pressable className="px-8 py-4 rounded-2xl font-bold text-white text-lg" style={{  }} onPress={handleNext}>
            {phase === "work" ? `Repos →` : setIdx + 1 < totalSets ? `Série ${setIdx + 2} →` : exIdx + 1 < exercises.length ? "Suivant →" : "Terminer 🏆"}
          </Pressable>
          <Pressable className="p-4 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            onPress={() => setElapsed(0)}>
            <RotateCcw size={20} className="text-white" />
          </Pressable>
        </View>

        {/* Description */}
        {phase === "work" && (
          <Text className="text-gray-500 text-xs text-center mt-6 max-w-xs">{currentEx?.description}</Text>
        )}
      </View>
    </View>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function FitnessPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("programmes");
  const [selectedLevel, setSelectedLevel] = useState<Level | "all">("all");
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | "all">("all");
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [expandedEx, setExpandedEx] = useState<string | null>(null);

  // Real Convex data
  const workoutHistory = useQuery(api.health.getWorkoutHistory, { limit: 30 }) ?? [];
  const logWorkout = useMutation(api.health.logWorkout);

  // Keep localStorage fallback for streak calculation
  const [localSessions, setLocalSessions] = useState<SessionRecord[]>(() => loadSessions());
  const sessions = localSessions;

  const streak = (() => {
    if (!workoutHistory.length && !sessions.length) return 0;
    const dates = [...new Set(workoutHistory.map(s => s.date.split("T")[0]))].sort().reverse();
    if (!dates.length) return 0;
    let count = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
      if (diff === i || diff === i + 1) count++;
      else break;
    }
    return count;
  })();

  const totalCals = workoutHistory.reduce((s, r) => s + (r.caloriesBurned ?? 0), 0);
  const totalMin  = workoutHistory.reduce((s, r) => s + r.durationMinutes, 0);

  const filteredPrograms = PROGRAMS.filter(p => {
    const lvl = selectedLevel === "all" || p.level === selectedLevel;
    const mus = selectedMuscle === "all" || p.muscle === selectedMuscle;
    return lvl && mus;
  });

  const filteredExercises = EXERCISES.filter(e =>
    selectedMuscle === "all" || e.muscle === selectedMuscle
  );

  const handleFinish = async (durationMin: number) => {
    if (!activeProgram) return;
    // Save local record for immediate UI feedback
    const record: SessionRecord = {
      id: Date.now().toString(),
      programId: activeProgram.id,
      programName: activeProgram.name,
      date: new Date().toISOString(),
      durationMin,
      calories: activeProgram.calories,
      exercisesDone: activeProgram.exercises.length,
    };
    const updated = [record, ...localSessions];
    setLocalSessions(updated);
    saveSessions(updated);
    // Also persist to Convex
    try {
      await logWorkout({
        name: activeProgram.name,
        type: activeProgram.muscle,
        durationMinutes: durationMin,
        caloriesBurned: activeProgram.calories,
        exercises: activeProgram.exercises.map(id => ({ name: EXERCISE_MAP[id]?.name ?? id })),
        date: new Date().toISOString(),
      });
    } catch {
      // Non-blocking: local session already saved
    }
    UIService.openToast(`Séance terminée ! ${activeProgram.calories} kcal brûlées 🔥`, "success");
    setActiveProgram(null);
    setTab("historique");
  };

  return (
    <View className="min-h-screen text-white" style={{  }}>
      {/* Workout overlay */}
      <>
        {activeProgram && (
          <WorkoutTimer
            program={activeProgram}
            onFinish={handleFinish}
            onClose={() => setActiveProgram(null)}
          />
        )}
      </>

      {/* Header */}
      <View className="sticky top-0 z-30 px-4 pt-12 pb-3" style={{ backgroundColor: "rgba(10,10,26,0.95)" }}>
        <View className="flex items-center gap-3 mb-4">
          <Pressable className="p-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} onPress={onBack}>
            <ArrowLeft size={20} />
          </Pressable>
          <View>
            <Text className="text-xl font-bold">Fitness & Sport</Text>
            <Text className="text-xs text-gray-400">Entraîne-toi sans équipement</Text>
          </View>
          <View className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ backgroundColor: "rgba(255,100,50,0.15)", borderWidth: 1, borderColor: "rgba(255,100,50,0.3)", borderStyle: "solid" }}>
            <Flame size={14} style={{ color: "#FF6B35" }} />
            <Text className="text-xs font-bold" style={{ color: "#FF6B35" }}>{streak}j streak</Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
          {(["programmes","exercices","historique","stats"] as Tab[]).map(t => (
            <Pressable key={t} className="flex-1 py-2 rounded-lg text-xs font-semibold"
              style={tab === t ? {  } : {  }} onPress={() => setTab(t)}>
              {t === "programmes" ? "Programmes" : t === "exercices" ? "Exercices" : t === "historique" ? "Historique" : "Stats"}
            </Pressable>
          ))}
        </View>
      </View>

      <View className="px-4 pb-24">
        {/* ── PROGRAMMES ────────────────────────────────────────────────── */}
        {tab === "programmes" && (
          <View>
            {/* KPIs */}
            <View className="gap-2 my-4">
              {[
                { label: "Séances", value: sessions.length, icon: Activity, color: "#E17055" },
                { label: "Calories", value: `${totalCals}`, icon: Flame, color: "#FF6B35" },
                { label: "Minutes", value: totalMin, icon: Clock, color: "#6C5CE7" },
              ].map(s => (
                <View key={s.label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: `${s.color}11`, borderStyle: "solid" }}>
                  <s.icon size={16} style={{ color: s.color }} className="mx-auto mb-1" />
                  <Text className="text-white font-bold text-base">{s.value}</Text>
                  <Text className="text-gray-500 text-[10px]">{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Filters */}
            <View className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
              {(["all","débutant","intermédiaire","avancé"] as const).map(l => (
                <Pressable key={l} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={selectedLevel === l
                    ? { backgroundColor: l === "all" ? "#E17055" : LEVEL_COLORS[l as Level] }
                    : { backgroundColor: "rgba(255,255,255,0.07)" }} onPress={() => setSelectedLevel(l)}>
                  {l === "all" ? "Tous niveaux" : l.charAt(0).toUpperCase() + l.slice(1)}
                </Pressable>
              ))}
            </View>

            {/* Programs */}
            <View className="space-y-3">
              {filteredPrograms.map((p, i) => (
                <View key={p.id} className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                  {/* Color bar */}
                  <View className="h-1.5 w-full" style={{  }} />
                  <View className="p-4">
                    <View className="flex items-start gap-3">
                      <View className="text-3xl">{p.emoji}</View>
                      <View className="flex-1 min-w-0">
                        <View className="flex items-center gap-2">
                          <Text className="text-white font-bold text-base">{p.name}</Text>
                          <Text className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${LEVEL_COLORS[p.level]}22`, color: LEVEL_COLORS[p.level] }}>
                            {p.level}
                          </Text>
                        </View>
                        <Text className="text-gray-400 text-xs mt-0.5">{p.description}</Text>
                        <View className="flex gap-3 mt-2">
                          <View className="flex items-center gap-1"><Calendar size={11} className="text-gray-500" /><Text className="text-gray-400 text-xs">{p.days}j/sem</Text></View>
                          <View className="flex items-center gap-1"><Clock size={11} className="text-gray-500" /><Text className="text-gray-400 text-xs">{p.durationMin} min</Text></View>
                          <View className="flex items-center gap-1"><Flame size={11} className="text-gray-500" /><Text className="text-gray-400 text-xs">{p.calories} kcal</Text></View>
                        </View>
                      </View>
                    </View>

                    {/* Exercises preview */}
                    <View className="flex gap-1.5 mt-3 flex-wrap">
                      {p.exercises.map(id => {
                        const ex = EXERCISE_MAP[id];
                        return ex ? (
                          <Text key={id} className="px-2 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "#aaa" }}>
                            {ex.emoji} {ex.name}
                          </Text>
                        ) : null;
                      })}
                    </View>

                    <Pressable
                      className="w-full py-3 rounded-xl font-bold text-white mt-3 flex items-center justify-center gap-2"
                      style={{  }}
                      onPress={() => { setActiveProgram(p); UIService.openToast(`Démarrage : ${p.name} 💪`, "info"); }}
                    >
                      <Play size={16} /><Text>Commencer la séance</Text></Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── EXERCICES ─────────────────────────────────────────────────── */}
        {tab === "exercices" && (
          <View>
            {/* Filter by muscle */}
            <View className="flex gap-2 my-4 overflow-x-auto scrollbar-hide">
              {(["all","full","haut","bas","cardio","core"] as const).map(m => (
                <Pressable key={m} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={selectedMuscle === m
                    ? { backgroundColor: "#E17055" }
                    : { backgroundColor: "rgba(255,255,255,0.07)" }} onPress={() => setSelectedMuscle(m)}>
                  {m === "all" ? "Tous" : MUSCLE_LABELS[m]}
                </Pressable>
              ))}
            </View>

            <View className="space-y-2">
              {filteredExercises.map((ex, i) => (
                <View key={ex.id} className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                  <Pressable
                    className="w-full flex items-center gap-3 p-3 text-left"
                    onPress={() => setExpandedEx(expandedEx === ex.id ? null : ex.id)}
                  >
                    <View className="text-2xl w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "rgba(225,112,85,0.15)" }}>
                      {ex.emoji}
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-white font-semibold text-sm">{ex.name}</Text>
                      <Text className="text-gray-500 text-xs">{MUSCLE_LABELS[ex.muscle]}</Text>
                    </View>
                    <View className="flex items-center gap-3 mr-2">
                      <Text className="text-gray-400 text-xs">{ex.sets} × {ex.reps}</Text>
                      <Text className="text-xs" style={{ color: "#FF6B35" }}>{ex.calories * ex.sets} kcal</Text>
                    </View>
                    {expandedEx === ex.id ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </Pressable>
                  <>
                    {expandedEx === ex.id && (
                      <View className="px-4 pb-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        <Text className="text-gray-300 text-sm mt-3 leading-relaxed">{ex.description}</Text>
                        <View className="flex gap-3 mt-3">
                          <View className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                            <Dumbbell size={12} className="text-gray-400" /><Text className="text-gray-300">{ex.sets} séries</Text>
                          </View>
                          <View className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                            <Clock size={12} className="text-gray-400" /><Text className="text-gray-300">{ex.restSec}s repos</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── HISTORIQUE ────────────────────────────────────────────────── */}
        {tab === "historique" && (
          <View className="mt-4">
            {sessions.length === 0 ? (
              <View className="flex flex-col items-center py-16">
                <View className="text-5xl mb-4"><Text>🏋️</Text></View>
                <Text className="text-gray-400 font-semibold">Aucune séance enregistrée</Text>
                <Text className="text-gray-600 text-sm mt-1">Complète ta première séance pour voir l'historique</Text>
                <Pressable className="mt-4 px-6 py-2.5 rounded-xl font-semibold text-white text-sm"
                  style={{  }}
                  onPress={() => setTab("programmes")}>
                  <Text>Voir les programmes</Text></Pressable>
              </View>
            ) : (
              <View className="space-y-2">
                {sessions.map((s, i) => {
                  const prog = PROGRAMS.find(p => p.id === s.programId);
                  return (
                    <View key={s.id} className="flex items-center gap-3 rounded-xl p-3"
                      style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                      <View className="text-2xl">{prog?.emoji ?? "💪"}</View>
                      <View className="flex-1 min-w-0">
                        <Text className="text-white text-sm font-semibold truncate">{s.programName}</Text>
                        <Text className="text-gray-500 text-xs">{new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</Text>
                      </View>
                      <View className="text-right">
                        <Text className="text-xs font-semibold" style={{ color: "#FF6B35" }}>{s.calories} kcal</Text>
                        <Text className="text-gray-500 text-xs">{s.durationMin} min</Text>
                      </View>
                      <CheckCircle size={16} style={{ color: "#00B894" }} />
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ── STATS ─────────────────────────────────────────────────────── */}
        {tab === "stats" && (
          <View className="mt-4">
            {/* Streak */}
            <View className="rounded-2xl p-5 mb-4 flex items-center gap-4"
              style={{ borderWidth: 1, borderColor: "rgba(255,107,53,0.3)", borderStyle: "solid" }}>
              <View className="text-4xl"><Text>🔥</Text></View>
              <View>
                <Text className="text-3xl font-black text-white">{streak} jours</Text>
                <Text className="text-gray-400 text-sm">Streak consécutifs</Text>
              </View>
              <View className="ml-auto">
                <Trophy size={28} style={{ color: "#FDCB6E" }} />
              </View>
            </View>

            {/* Big stats */}
            <View className="gap-3 mb-4">
              {[
                { label: "Total séances", value: sessions.length, icon: Activity, color: "#E17055" },
                { label: "Total calories", value: `${totalCals} kcal`, icon: Flame, color: "#FF6B35" },
                { label: "Temps total", value: `${totalMin} min`, icon: Clock, color: "#6C5CE7" },
                { label: "Exercices faits", value: sessions.reduce((s, r) => s + r.exercisesDone, 0), icon: Dumbbell, color: "#00B894" },
              ].map(s => (
                <View key={s.label} className="rounded-2xl p-4"
                  style={{ backgroundColor: `${s.color}11`, borderStyle: "solid" }}>
                  <s.icon size={20} style={{ color: s.color }} className="mb-2" />
                  <Text className="text-white font-bold text-xl">{s.value}</Text>
                  <Text className="text-gray-400 text-xs">{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Programs done */}
            <Text className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <Star size={15} style={{ color: "#FDCB6E" }} />Programmes réalisés
            </Text>
            {sessions.length === 0 ? (
              <Text className="text-gray-500 text-sm text-center py-4">Aucune donnée pour l'instant</Text>
            ) : (
              <View className="space-y-2">
                {Object.entries(
                  sessions.reduce((acc, s) => { acc[s.programName] = (acc[s.programName] ?? 0) + 1; return acc; }, {} as Record<string, number>)
                ).sort((a, b) => b[1] - a[1]).map(([name, count], i) => {
                  const prog = PROGRAMS.find(p => p.name === name);
                  return (
                    <View key={name} className="flex items-center gap-3 rounded-xl p-3"
                      style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
                      <Text className="text-xl">{prog?.emoji ?? "💪"}</Text>
                      <View className="flex-1 min-w-0">
                        <Text className="text-white text-sm font-semibold truncate">{name}</Text>
                        <View className="h-1 rounded-full mt-1.5" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                          <View className="h-full rounded-full" style={{ width: `${(count / sessions.length) * 100}%`, backgroundColor: prog?.color ?? "#E17055" }} />
                        </View>
                      </View>
                      <Text className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#ddd" }}>{count}<Text>×</Text></Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* CTA */}
            <Pressable className="w-full py-3 rounded-2xl font-bold text-white mt-5 flex items-center justify-center gap-2"
              style={{  }}
              onPress={() => setTab("programmes")}>
              <Plus size={18} /><Text>Nouvelle séance</Text></Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

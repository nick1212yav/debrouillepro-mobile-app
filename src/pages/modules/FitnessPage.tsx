import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart2,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Flame,
  Heart,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Star,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";

/* ============================================================================
 * FITNESS — DÉBROUILLEPRO
 * ----------------------------------------------------------------------------
 * Native-first / React Native / Expo
 *
 * Principes :
 * - aucune API DOM
 * - aucun localStorage
 * - aucune notification Web
 * - aucune donnée utilisateur fictive
 * - historique persistant via Convex
 * - statistiques basées uniquement sur les données réellement retournées
 * - timer local uniquement pour piloter une séance en cours
 * - interface accessible aux débutants comme aux utilisateurs avancés
 * ========================================================================== */

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
  exercises: string[];
  color: string;
  emoji: string;
  description: string;
};

type WorkoutHistoryItem = {
  _id?: string;
  name: string;
  type: string;
  durationMinutes: number;
  caloriesBurned?: number;
  exercises?: Array<{
    name: string;
  }>;
  date: string;
};

/* ============================================================================
 * CONSTANTES
 * ========================================================================== */

const COLORS = {
  background: "#050812",
  surface: "rgba(255,255,255,0.055)",
  surfaceStrong: "rgba(255,255,255,0.085)",
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.16)",
  text: "#FFFFFF",
  textSecondary: "#B8C0D0",
  textMuted: "#737C90",
  primary: "#E17055",
  orange: "#FF6B35",
  green: "#00B894",
  yellow: "#FDCB6E",
  purple: "#6C5CE7",
  blue: "#0984E3",
  pink: "#FD79A8",
  danger: "#FF6B6B",
};

const EXERCISES: Exercise[] = [
  {
    id: "e1",
    name: "Pompes",
    muscle: "haut",
    sets: 3,
    reps: "12-15",
    restSec: 60,
    calories: 8,
    emoji: "💪",
    description:
      "Position planche, mains à largeur d'épaules. Descendre la poitrine vers le sol.",
  },
  {
    id: "e2",
    name: "Squats",
    muscle: "bas",
    sets: 3,
    reps: "15-20",
    restSec: 60,
    calories: 10,
    emoji: "🦵",
    description:
      "Pieds écartés, dos droit. Descendre comme pour s'asseoir, cuisses parallèles au sol.",
  },
  {
    id: "e3",
    name: "Gainage planche",
    muscle: "core",
    sets: 3,
    reps: "30-60s",
    restSec: 45,
    calories: 5,
    emoji: "🏋️",
    description:
      "Position planche sur les avant-bras. Maintenir le corps aligné et les abdos contractés.",
  },
  {
    id: "e4",
    name: "Burpees",
    muscle: "full",
    sets: 3,
    reps: "10-12",
    restSec: 90,
    calories: 15,
    emoji: "🔥",
    description:
      "Depuis debout : descendre en squat, planche, pompe, retour squat puis saut.",
  },
  {
    id: "e5",
    name: "Fentes marchées",
    muscle: "bas",
    sets: 3,
    reps: "12/jambe",
    restSec: 60,
    calories: 9,
    emoji: "🚶",
    description:
      "Avancer en faisant une grande enjambée, genou arrière proche du sol. Alterner les jambes.",
  },
  {
    id: "e6",
    name: "Dips sur chaise",
    muscle: "haut",
    sets: 3,
    reps: "10-15",
    restSec: 60,
    calories: 7,
    emoji: "🪑",
    description:
      "Mains sur le bord d'une chaise stable. Descendre le corps en contrôlant le mouvement.",
  },
  {
    id: "e7",
    name: "Mountain climbers",
    muscle: "cardio",
    sets: 3,
    reps: "30s",
    restSec: 45,
    calories: 12,
    emoji: "⛰️",
    description:
      "Position planche. Ramener alternativement les genoux vers la poitrine.",
  },
  {
    id: "e8",
    name: "Abdos crunchs",
    muscle: "core",
    sets: 3,
    reps: "20-25",
    restSec: 45,
    calories: 6,
    emoji: "💫",
    description:
      "Allongé sur le dos, genoux fléchis. Décoller les épaules en contractant les abdominaux.",
  },
  {
    id: "e9",
    name: "Jumping jacks",
    muscle: "cardio",
    sets: 3,
    reps: "40s",
    restSec: 30,
    calories: 11,
    emoji: "⚡",
    description:
      "Sauter en écartant jambes et bras simultanément puis revenir à la position initiale.",
  },
  {
    id: "e10",
    name: "Hip thrust au sol",
    muscle: "bas",
    sets: 3,
    reps: "15-20",
    restSec: 45,
    calories: 7,
    emoji: "🍑",
    description:
      "Allongé sur le dos, pieds à plat. Pousser les hanches vers le haut en contractant les fessiers.",
  },
  {
    id: "e11",
    name: "Superman",
    muscle: "haut",
    sets: 3,
    reps: "12-15",
    restSec: 45,
    calories: 5,
    emoji: "🦸",
    description:
      "Allongé face au sol, bras tendus. Lever simultanément bras et jambes.",
  },
  {
    id: "e12",
    name: "Saut à la corde",
    muscle: "cardio",
    sets: 4,
    reps: "1 min",
    restSec: 60,
    calories: 18,
    emoji: "🪢",
    description:
      "Sauter à la corde à rythme modéré. Atterrir de manière contrôlée.",
  },
];

const EXERCISE_MAP: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((exercise) => [exercise.id, exercise]),
);

const PROGRAMS: Program[] = [
  {
    id: "p1",
    name: "Corps Complet Débutant",
    level: "débutant",
    days: 3,
    durationMin: 25,
    calories: 180,
    muscle: "full",
    exercises: ["e1", "e2", "e3", "e9"],
    color: COLORS.green,
    emoji: "🌱",
    description: "Programme accessible pour commencer sans équipement.",
  },
  {
    id: "p2",
    name: "Brûle-graisse Express",
    level: "intermédiaire",
    days: 4,
    durationMin: 35,
    calories: 280,
    muscle: "cardio",
    exercises: ["e4", "e7", "e9", "e12", "e2"],
    color: COLORS.primary,
    emoji: "🔥",
    description: "Circuit cardio dynamique à intensité intermédiaire.",
  },
  {
    id: "p3",
    name: "Force & Muscle",
    level: "avancé",
    days: 5,
    durationMin: 50,
    calories: 350,
    muscle: "haut",
    exercises: ["e1", "e6", "e11", "e3", "e8"],
    color: COLORS.purple,
    emoji: "💪",
    description: "Programme de renforcement musculaire progressif.",
  },
  {
    id: "p4",
    name: "Jambes & Fessiers",
    level: "intermédiaire",
    days: 3,
    durationMin: 40,
    calories: 250,
    muscle: "bas",
    exercises: ["e2", "e5", "e10", "e7", "e3"],
    color: COLORS.pink,
    emoji: "🦵",
    description: "Travail ciblé du bas du corps.",
  },
  {
    id: "p5",
    name: "Gainage & Core",
    level: "débutant",
    days: 3,
    durationMin: 20,
    calories: 130,
    muscle: "core",
    exercises: ["e3", "e8", "e11", "e7"],
    color: COLORS.yellow,
    emoji: "⚡",
    description: "Renforcement du centre du corps et de la stabilité.",
  },
  {
    id: "p6",
    name: "Cardio Warrior",
    level: "avancé",
    days: 5,
    durationMin: 45,
    calories: 400,
    muscle: "cardio",
    exercises: ["e4", "e7", "e12", "e9", "e2", "e5"],
    color: COLORS.blue,
    emoji: "🏃",
    description: "Séance cardio avancée axée sur l'endurance.",
  },
];

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  full: "Corps complet",
  haut: "Haut du corps",
  bas: "Bas du corps",
  cardio: "Cardio",
  core: "Core / Abdos",
};

const LEVEL_COLORS: Record<Level, string> = {
  débutant: COLORS.green,
  intermédiaire: COLORS.yellow,
  avancé: COLORS.primary,
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function formatDate(date: string): string {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date inconnue";
  }

  return parsed.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatClock(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));

  const minutes = Math.floor(safeSeconds / 60);

  const remaining = safeSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${remaining
    .toString()
    .padStart(2, "0")}`;
}

function getWorkoutTypeLabel(type: string): string {
  const normalized = type.toLowerCase();

  if (normalized === "full") {
    return "Corps complet";
  }

  return MUSCLE_LABELS[normalized as MuscleGroup] ?? type;
}

/* ============================================================================
 * WORKOUT TIMER
 * ========================================================================== */

type WorkoutTimerProps = {
  program: Program;
  onFinish: (durationMin: number) => void;
  onClose: () => void;
};

function WorkoutTimer({ program, onFinish, onClose }: WorkoutTimerProps) {
  const exercises = useMemo(
    () =>
      program.exercises
        .map((id) => EXERCISE_MAP[id])
        .filter((exercise): exercise is Exercise => Boolean(exercise)),
    [program],
  );

  const [exerciseIndex, setExerciseIndex] = useState(0);

  const [setIndex, setSetIndex] = useState(0);

  const [phase, setPhase] = useState<"work" | "rest" | "done">("work");

  const [elapsed, setElapsed] = useState(0);

  const [running, setRunning] = useState(false);

  const [totalElapsed, setTotalElapsed] = useState(0);

  const [startedAt, setStartedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!running) {
      return;
    }

    const interval = setInterval(() => {
      if (startedAt === null) {
        return;
      }

      const now = Date.now();

      setElapsed(Math.max(0, Math.floor((now - startedAt) / 1000)));

      setTotalElapsed(Math.max(0, Math.floor((now - startedAt) / 1000)));
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, [running, startedAt]);

  const currentExercise = exercises[exerciseIndex];

  const totalSets = currentExercise?.sets ?? 0;

  const restSeconds = currentExercise?.restSec ?? 60;

  const progress = exercises.length > 0 ? exerciseIndex / exercises.length : 0;

  const startOrPause = useCallback(() => {
    if (phase === "done") {
      return;
    }

    if (running) {
      setRunning(false);
      return;
    }

    const now = Date.now();

    if (startedAt === null) {
      setStartedAt(now);
    } else {
      const alreadyElapsed = totalElapsed;

      setStartedAt(now - alreadyElapsed * 1000);
    }

    setRunning(true);
  }, [phase, running, startedAt, totalElapsed]);

  const resetExerciseTimer = useCallback(() => {
    if (startedAt === null) {
      setElapsed(0);
      return;
    }

    const now = Date.now();

    setStartedAt(now - totalElapsed * 1000);

    setElapsed(0);
  }, [startedAt, totalElapsed]);

  const handleNext = useCallback(() => {
    setElapsed(0);
    setRunning(false);

    if (phase === "work") {
      setPhase("rest");
      return;
    }

    if (setIndex + 1 < totalSets) {
      setSetIndex((value) => value + 1);
      setPhase("work");
      return;
    }

    if (exerciseIndex + 1 < exercises.length) {
      setExerciseIndex((value) => value + 1);
      setSetIndex(0);
      setPhase("work");
      return;
    }

    setPhase("done");

    const durationMin = Math.max(1, Math.round(totalElapsed / 60));

    onFinish(durationMin);
  }, [
    phase,
    setIndex,
    totalSets,
    exerciseIndex,
    exercises.length,
    totalElapsed,
    onFinish,
  ]);

  if (phase === "done") {
    return (
      <View style={styles.timerOverlay}>
        <View style={styles.completedCard}>
          <Text style={styles.completedEmoji}>🏆</Text>

          <Text style={styles.completedTitle}>Séance terminée</Text>

          <Text style={styles.completedSubtitle}>
            Tu as terminé le programme sélectionné.
          </Text>

          <View style={styles.completedStats}>
            <View style={styles.completedStat}>
              <Clock size={18} color={COLORS.purple} />
              <Text style={styles.completedStatValue}>
                {formatClock(totalElapsed)}
              </Text>
              <Text style={styles.completedStatLabel}>Durée</Text>
            </View>

            <View style={styles.completedStat}>
              <Dumbbell size={18} color={COLORS.green} />
              <Text style={styles.completedStatValue}>{exercises.length}</Text>
              <Text style={styles.completedStatLabel}>Exercices</Text>
            </View>

            <View style={styles.completedStat}>
              <Flame size={18} color={COLORS.orange} />
              <Text style={styles.completedStatValue}>{program.calories}</Text>
              <Text style={styles.completedStatLabel}>kcal*</Text>
            </View>
          </View>

          <Text style={styles.calorieDisclaimer}>
            * Estimation indicative du programme, pas une mesure physiologique
            individuelle.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer la séance"
            onPress={onClose}
            style={[
              styles.primaryButton,
              {
                backgroundColor: program.color,
              },
            ]}
          >
            <Text style={styles.primaryButtonText}>Voir mon historique</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.timerOverlay,
        {
          backgroundColor: COLORS.background,
        },
      ]}
    >
      <View style={styles.timerHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer la séance"
          hitSlop={10}
          onPress={onClose}
          style={styles.iconButton}
        >
          <X size={21} color={COLORS.text} />
        </Pressable>

        <View style={styles.timerHeaderCenter}>
          <Text numberOfLines={1} style={styles.timerProgramName}>
            {program.name}
          </Text>

          <Text style={styles.timerExerciseCount}>
            Exercice {exerciseIndex + 1}/{exercises.length}
          </Text>
        </View>

        <View style={styles.timerClockPill}>
          <Clock size={15} color={COLORS.textSecondary} />
          <Text style={styles.timerClockText}>{formatClock(totalElapsed)}</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(100, progress * 100)}%`,
              backgroundColor: program.color,
            },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.timerContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.phaseBadge,
            phase === "work"
              ? {
                  backgroundColor: `${program.color}22`,
                  borderColor: `${program.color}55`,
                }
              : {
                  backgroundColor: "rgba(253,203,110,0.12)",
                  borderColor: "rgba(253,203,110,0.35)",
                },
          ]}
        >
          <Text
            style={[
              styles.phaseBadgeText,
              {
                color: phase === "work" ? program.color : COLORS.yellow,
              },
            ]}
          >
            {phase === "work" ? "EXERCICE" : `REPOS · ${restSeconds}s`}
          </Text>
        </View>

        <Text style={styles.exerciseEmoji}>
          {currentExercise?.emoji ?? "🏋️"}
        </Text>

        <Text style={styles.activeExerciseName}>
          {currentExercise?.name ?? "Exercice"}
        </Text>

        <Text style={styles.activeExerciseReps}>
          {currentExercise?.reps ?? "—"} répétitions
        </Text>

        <View style={styles.setsRow}>
          {Array.from({
            length: totalSets,
          }).map((_, index) => {
            const completed = index < setIndex;

            const current = index === setIndex;

            return (
              <View
                key={index}
                style={[
                  styles.setCircle,
                  completed
                    ? {
                        backgroundColor: program.color,
                        borderColor: program.color,
                      }
                    : current
                      ? {
                          backgroundColor: `${program.color}22`,
                          borderColor: program.color,
                        }
                      : {
                          backgroundColor: "rgba(255,255,255,0.06)",
                          borderColor: COLORS.border,
                        },
                ]}
              >
                <Text
                  style={[
                    styles.setCircleText,
                    {
                      color:
                        completed || current ? COLORS.text : COLORS.textMuted,
                    },
                  ]}
                >
                  {completed ? "✓" : index + 1}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.timerDisplayCard}>
          <Text style={styles.timerDisplayLabel}>TEMPS</Text>

          <Text style={styles.timerDisplay}>{formatClock(elapsed)}</Text>
        </View>

        <View style={styles.timerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={running ? "Mettre en pause" : "Démarrer"}
            onPress={startOrPause}
            style={styles.roundButton}
          >
            {running ? (
              <Pause size={22} color={COLORS.text} />
            ) : (
              <Play size={22} color={COLORS.text} />
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handleNext}
            style={[
              styles.nextButton,
              {
                backgroundColor: program.color,
              },
            ]}
          >
            <Text style={styles.nextButtonText}>
              {phase === "work"
                ? "Repos"
                : setIndex + 1 < totalSets
                  ? `Série ${setIndex + 2}`
                  : exerciseIndex + 1 < exercises.length
                    ? "Suivant"
                    : "Terminer"}
            </Text>

            <Text style={styles.nextButtonArrow}>→</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Réinitialiser le chronomètre"
            onPress={resetExerciseTimer}
            style={styles.roundButton}
          >
            <RotateCcw size={20} color={COLORS.text} />
          </Pressable>
        </View>

        {phase === "work" && currentExercise ? (
          <View style={styles.exerciseInstruction}>
            <Text style={styles.exerciseInstructionText}>
              {currentExercise.description}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

/* ============================================================================
 * MAIN PAGE
 * ========================================================================== */

export default function FitnessPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("programmes");

  const [selectedLevel, setSelectedLevel] = useState<Level | "all">("all");

  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | "all">(
    "all",
  );

  const [activeProgram, setActiveProgram] = useState<Program | null>(null);

  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const workoutHistory = useQuery(api.health.getWorkoutHistory, {
    limit: 30,
  });

  const logWorkout = useMutation(api.health.logWorkout);

  const [savingWorkout, setSavingWorkout] = useState(false);

  /* --------------------------------------------------------------------------
   * DATA
   * ------------------------------------------------------------------------ */

  const history = (workoutHistory ?? []) as WorkoutHistoryItem[];

  const isLoading = workoutHistory === undefined;

  const filteredPrograms = useMemo(
    () =>
      PROGRAMS.filter((program) => {
        const levelMatches =
          selectedLevel === "all" || program.level === selectedLevel;

        const muscleMatches =
          selectedMuscle === "all" || program.muscle === selectedMuscle;

        return levelMatches && muscleMatches;
      }),
    [selectedLevel, selectedMuscle],
  );

  const filteredExercises = useMemo(
    () =>
      EXERCISES.filter(
        (exercise) =>
          selectedMuscle === "all" || exercise.muscle === selectedMuscle,
      ),
    [selectedMuscle],
  );

  const totalCalories = history.reduce(
    (sum, session) => sum + (session.caloriesBurned ?? 0),
    0,
  );

  const totalMinutes = history.reduce(
    (sum, session) => sum + (session.durationMinutes ?? 0),
    0,
  );

  const totalExercises = history.reduce(
    (sum, session) => sum + (session.exercises?.length ?? 0),
    0,
  );

  /* --------------------------------------------------------------------------
   * STREAK
   * ------------------------------------------------------------------------ */

  const streak = useMemo(() => {
    if (history.length === 0) {
      return 0;
    }

    const uniqueDates = Array.from(
      new Set(
        history
          .map((session) => {
            const date = new Date(session.date);

            if (Number.isNaN(date.getTime())) {
              return null;
            }

            return date.toISOString().slice(0, 10);
          })
          .filter((date): date is string => date !== null),
      ),
    ).sort((a, b) => b.localeCompare(a));

    if (uniqueDates.length === 0) {
      return 0;
    }

    const today = new Date();

    const todayKey = today.toISOString().slice(0, 10);

    const yesterday = new Date(today);

    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayKey = yesterday.toISOString().slice(0, 10);

    if (uniqueDates[0] !== todayKey && uniqueDates[0] !== yesterdayKey) {
      return 0;
    }

    let count = 0;

    let cursor = uniqueDates[0] === todayKey ? todayKey : yesterdayKey;

    for (let index = 0; index < uniqueDates.length; index += 1) {
      if (uniqueDates[index] !== cursor) {
        break;
      }

      count += 1;

      const previous = new Date(cursor);

      previous.setDate(previous.getDate() - 1);

      cursor = previous.toISOString().slice(0, 10);
    }

    return count;
  }, [history]);

  /* --------------------------------------------------------------------------
   * SAVE WORKOUT
   * ------------------------------------------------------------------------ */

  const handleFinish = useCallback(
    async (durationMin: number) => {
      if (!activeProgram) {
        return;
      }

      if (savingWorkout) {
        return;
      }

      setSavingWorkout(true);

      try {
        await logWorkout({
          name: activeProgram.name,
          type: activeProgram.muscle,
          durationMinutes: durationMin,
          caloriesBurned: activeProgram.calories,
          exercises: activeProgram.exercises
            .map((id) => EXERCISE_MAP[id])
            .filter((exercise): exercise is Exercise => Boolean(exercise))
            .map((exercise) => ({
              name: exercise.name,
            })),
          date: new Date().toISOString(),
        });

        setActiveProgram(null);
        setTab("historique");
      } finally {
        setSavingWorkout(false);
      }
    },
    [activeProgram, savingWorkout, logWorkout],
  );

  /* --------------------------------------------------------------------------
   * TIMER OVERLAY
   * ------------------------------------------------------------------------ */

  if (activeProgram) {
    return (
      <WorkoutTimer
        program={activeProgram}
        onFinish={handleFinish}
        onClose={() => setActiveProgram(null)}
      />
    );
  }

  /* --------------------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------------------ */

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={10}
            onPress={onBack}
            style={styles.iconButton}
          >
            <ArrowLeft size={21} color={COLORS.text} />
          </Pressable>

          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Fitness & Sport</Text>

            <Text style={styles.headerSubtitle}>
              Bouger, progresser, prendre soin de soi.
            </Text>
          </View>

          <View style={styles.streakPill}>
            <Flame size={15} color={COLORS.orange} />

            <Text style={styles.streakText}>{streak} j</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {(
            [
              ["programmes", "Programmes"],
              ["exercices", "Exercices"],
              ["historique", "Historique"],
              ["stats", "Statistiques"],
            ] as Array<[Tab, string]>
          ).map(([value, label]) => {
            const selected = tab === value;

            return (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityState={{
                  selected,
                }}
                onPress={() => setTab(value)}
                style={[styles.tabButton, selected && styles.tabButtonActive]}
              >
                <Text
                  style={[styles.tabText, selected && styles.tabTextActive]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {tab === "programmes" && (
          <ProgramsTab
            isLoading={isLoading}
            history={history}
            totalCalories={totalCalories}
            totalMinutes={totalMinutes}
            selectedLevel={selectedLevel}
            setSelectedLevel={setSelectedLevel}
            filteredPrograms={filteredPrograms}
            onStartProgram={setActiveProgram}
          />
        )}

        {tab === "exercices" && (
          <ExercisesTab
            selectedMuscle={selectedMuscle}
            setSelectedMuscle={setSelectedMuscle}
            filteredExercises={filteredExercises}
            expandedExercise={expandedExercise}
            setExpandedExercise={setExpandedExercise}
          />
        )}

        {tab === "historique" && (
          <HistoryTab
            isLoading={isLoading}
            history={history}
            onPrograms={() => setTab("programmes")}
          />
        )}

        {tab === "stats" && (
          <StatsTab
            isLoading={isLoading}
            history={history}
            streak={streak}
            totalCalories={totalCalories}
            totalMinutes={totalMinutes}
            totalExercises={totalExercises}
            onNewWorkout={() => setTab("programmes")}
          />
        )}

        <View style={styles.bottomSpacing} />

        {savingWorkout ? (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color={COLORS.primary} />

            <Text style={styles.savingText}>Enregistrement de la séance…</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

/* ============================================================================
 * PROGRAMS TAB
 * ========================================================================== */

type ProgramsTabProps = {
  isLoading: boolean;
  history: WorkoutHistoryItem[];
  totalCalories: number;
  totalMinutes: number;
  selectedLevel: Level | "all";
  setSelectedLevel: (value: Level | "all") => void;
  filteredPrograms: Program[];
  onStartProgram: (program: Program) => void;
};

function ProgramsTab({
  isLoading,
  history,
  totalCalories,
  totalMinutes,
  selectedLevel,
  setSelectedLevel,
  filteredPrograms,
  onStartProgram,
}: ProgramsTabProps) {
  return (
    <View>
      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />

        <View style={styles.heroIconContainer}>
          <Heart size={22} color={COLORS.primary} />
        </View>

        <Text style={styles.heroTitle}>Ton espace mouvement</Text>

        <Text style={styles.heroDescription}>
          Des séances structurées pour différents niveaux, avec ton historique
          conservé dans ton compte.
        </Text>

        <View style={styles.heroMetrics}>
          <Metric
            icon={<Activity size={16} color={COLORS.primary} />}
            value={isLoading ? "—" : String(history.length)}
            label="Séances"
          />

          <Metric
            icon={<Flame size={16} color={COLORS.orange} />}
            value={isLoading ? "—" : String(totalCalories)}
            label="kcal enregistrées"
          />

          <Metric
            icon={<Clock size={16} color={COLORS.purple} />}
            value={isLoading ? "—" : String(totalMinutes)}
            label="minutes"
          />
        </View>
      </View>

      <SectionHeader
        icon={<Target size={18} color={COLORS.primary} />}
        title="Choisir son niveau"
        subtitle="Adapte le programme à ton expérience."
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalFilters}
      >
        {(["all", "débutant", "intermédiaire", "avancé"] as const).map(
          (level) => {
            const selected = selectedLevel === level;

            const label =
              level === "all"
                ? "Tous"
                : level.charAt(0).toUpperCase() + level.slice(1);

            return (
              <Pressable
                key={level}
                onPress={() => setSelectedLevel(level)}
                style={[
                  styles.filterChip,
                  selected && styles.filterChipActive,
                  selected &&
                    level !== "all" && {
                      backgroundColor: LEVEL_COLORS[level],
                    },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selected && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          },
        )}
      </ScrollView>

      <SectionHeader
        icon={<Dumbbell size={18} color={COLORS.green} />}
        title="Programmes"
        subtitle={`${filteredPrograms.length} programme${
          filteredPrograms.length > 1 ? "s" : ""
        } disponible${filteredPrograms.length > 1 ? "s" : ""}`}
      />

      {filteredPrograms.length === 0 ? (
        <EmptyState
          emoji="🔎"
          title="Aucun programme"
          description="Aucun programme ne correspond aux filtres sélectionnés."
        />
      ) : (
        <View>
          {filteredPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onStart={() => onStartProgram(program)}
            />
          ))}
        </View>
      )}

      <View style={styles.safetyNotice}>
        <Text style={styles.safetyNoticeTitle}>À retenir</Text>

        <Text style={styles.safetyNoticeText}>
          Les programmes proposés sont des contenus d'entraînement généraux.
          Adapte l'intensité à ta situation et arrête l'exercice en cas de
          douleur inhabituelle ou de malaise.
        </Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * PROGRAM CARD
 * ========================================================================== */

function ProgramCard({
  program,
  onStart,
}: {
  program: Program;
  onStart: () => void;
}) {
  return (
    <View style={styles.programCard}>
      <View
        style={[
          styles.programAccent,
          {
            backgroundColor: program.color,
          },
        ]}
      />

      <View style={styles.programBody}>
        <View style={styles.programTopRow}>
          <View style={styles.programEmojiContainer}>
            <Text style={styles.programEmoji}>{program.emoji}</Text>
          </View>

          <View style={styles.programMain}>
            <View style={styles.programTitleRow}>
              <Text numberOfLines={2} style={styles.programName}>
                {program.name}
              </Text>

              <View
                style={[
                  styles.levelBadge,
                  {
                    backgroundColor: `${LEVEL_COLORS[program.level]}22`,
                    borderColor: `${LEVEL_COLORS[program.level]}44`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.levelBadgeText,
                    {
                      color: LEVEL_COLORS[program.level],
                    },
                  ]}
                >
                  {program.level}
                </Text>
              </View>
            </View>

            <Text style={styles.programDescription}>{program.description}</Text>
          </View>
        </View>

        <View style={styles.programMetaRow}>
          <MetaItem
            icon={<Calendar size={14} color={COLORS.textMuted} />}
            value={`${program.days} j/sem`}
          />

          <MetaItem
            icon={<Clock size={14} color={COLORS.textMuted} />}
            value={`${program.durationMin} min`}
          />

          <MetaItem
            icon={<Flame size={14} color={COLORS.orange} />}
            value={`${program.calories} kcal*`}
          />
        </View>

        <View style={styles.exerciseTags}>
          {program.exercises.map((id) => {
            const exercise = EXERCISE_MAP[id];

            if (!exercise) {
              return null;
            }

            return (
              <View key={id} style={styles.exerciseTag}>
                <Text style={styles.exerciseTagText}>
                  {exercise.emoji} {exercise.name}
                </Text>
              </View>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Commencer ${program.name}`}
          onPress={onStart}
          style={[
            styles.programButton,
            {
              backgroundColor: program.color,
            },
          ]}
        >
          <Play size={16} color={COLORS.text} fill={COLORS.text} />

          <Text style={styles.programButtonText}>Commencer la séance</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================================
 * EXERCISES TAB
 * ========================================================================== */

type ExercisesTabProps = {
  selectedMuscle: MuscleGroup | "all";
  setSelectedMuscle: (value: MuscleGroup | "all") => void;
  filteredExercises: Exercise[];
  expandedExercise: string | null;
  setExpandedExercise: (value: string | null) => void;
};

function ExercisesTab({
  selectedMuscle,
  setSelectedMuscle,
  filteredExercises,
  expandedExercise,
  setExpandedExercise,
}: ExercisesTabProps) {
  return (
    <View>
      <SectionHeader
        icon={<Dumbbell size={18} color={COLORS.green} />}
        title="Bibliothèque d'exercices"
        subtitle="Explore les mouvements disponibles."
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalFilters}
      >
        {(["all", "full", "haut", "bas", "cardio", "core"] as const).map(
          (muscle) => {
            const selected = selectedMuscle === muscle;

            return (
              <Pressable
                key={muscle}
                onPress={() => setSelectedMuscle(muscle)}
                style={[styles.filterChip, selected && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selected && styles.filterChipTextActive,
                  ]}
                >
                  {muscle === "all" ? "Tous" : MUSCLE_LABELS[muscle]}
                </Text>
              </Pressable>
            );
          },
        )}
      </ScrollView>

      {filteredExercises.map((exercise) => {
        const expanded = expandedExercise === exercise.id;

        return (
          <View key={exercise.id} style={styles.exerciseCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                expanded,
              }}
              onPress={() => setExpandedExercise(expanded ? null : exercise.id)}
              style={styles.exerciseHeader}
            >
              <View style={styles.exerciseIcon}>
                <Text style={styles.exerciseIconText}>{exercise.emoji}</Text>
              </View>

              <View style={styles.exerciseMain}>
                <Text numberOfLines={2} style={styles.exerciseName}>
                  {exercise.name}
                </Text>

                <Text style={styles.exerciseMuscle}>
                  {MUSCLE_LABELS[exercise.muscle]}
                </Text>
              </View>

              <View style={styles.exerciseSummary}>
                <Text style={styles.exerciseReps}>
                  {exercise.sets} × {exercise.reps}
                </Text>

                <Text style={styles.exerciseCalories}>
                  {exercise.calories * exercise.sets} kcal*
                </Text>
              </View>

              {expanded ? (
                <ChevronUp size={18} color={COLORS.textMuted} />
              ) : (
                <ChevronDown size={18} color={COLORS.textMuted} />
              )}
            </Pressable>

            {expanded ? (
              <View style={styles.exerciseDetails}>
                <Text style={styles.exerciseDescription}>
                  {exercise.description}
                </Text>

                <View style={styles.exerciseDetailRow}>
                  <View style={styles.detailPill}>
                    <Dumbbell size={13} color={COLORS.textSecondary} />

                    <Text style={styles.detailPillText}>
                      {exercise.sets} séries
                    </Text>
                  </View>

                  <View style={styles.detailPill}>
                    <Clock size={13} color={COLORS.textSecondary} />

                    <Text style={styles.detailPillText}>
                      {exercise.restSec}s de repos
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}

      <Text style={styles.disclaimer}>
        * Les calories affichées sont des estimations associées au contenu du
        programme et ne constituent pas une mesure individuelle.
      </Text>
    </View>
  );
}

/* ============================================================================
 * HISTORY TAB
 * ========================================================================== */

function HistoryTab({
  isLoading,
  history,
  onPrograms,
}: {
  isLoading: boolean;
  history: WorkoutHistoryItem[];
  onPrograms: () => void;
}) {
  if (isLoading) {
    return <LoadingState label="Chargement de ton historique…" />;
  }

  return (
    <View>
      <SectionHeader
        icon={<Calendar size={18} color={COLORS.purple} />}
        title="Mon historique"
        subtitle="Les séances enregistrées sur ton compte."
      />

      {history.length === 0 ? (
        <EmptyState
          emoji="🏋️"
          title="Aucune séance enregistrée"
          description="Tes séances apparaîtront ici après leur enregistrement."
          actionLabel="Voir les programmes"
          onAction={onPrograms}
        />
      ) : (
        history.map((session, index) => (
          <View
            key={session._id ?? `${session.date}-${session.name}-${index}`}
            style={styles.historyCard}
          >
            <View style={styles.historyIcon}>
              <CheckCircle size={19} color={COLORS.green} />
            </View>

            <View style={styles.historyMain}>
              <Text numberOfLines={2} style={styles.historyName}>
                {session.name}
              </Text>

              <Text style={styles.historyDate}>{formatDate(session.date)}</Text>

              <Text style={styles.historyType}>
                {getWorkoutTypeLabel(session.type)}
              </Text>
            </View>

            <View style={styles.historyMetrics}>
              <Text style={styles.historyCalories}>
                {session.caloriesBurned ?? 0} kcal*
              </Text>

              <Text style={styles.historyDuration}>
                {session.durationMinutes} min
              </Text>

              <Text style={styles.historyExercises}>
                {session.exercises?.length ?? 0} exercices
              </Text>
            </View>
          </View>
        ))
      )}

      {history.length > 0 ? (
        <Text style={styles.disclaimer}>
          Les données affichées correspondent à l'historique actuellement
          disponible dans ton compte.
        </Text>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * STATS TAB
 * ========================================================================== */

function StatsTab({
  isLoading,
  history,
  streak,
  totalCalories,
  totalMinutes,
  totalExercises,
  onNewWorkout,
}: {
  isLoading: boolean;
  history: WorkoutHistoryItem[];
  streak: number;
  totalCalories: number;
  totalMinutes: number;
  totalExercises: number;
  onNewWorkout: () => void;
}) {
  if (isLoading) {
    return <LoadingState label="Calcul de tes statistiques…" />;
  }

  const programCounts = history.reduce(
    (accumulator, session) => {
      accumulator[session.name] = (accumulator[session.name] ?? 0) + 1;

      return accumulator;
    },
    {} as Record<string, number>,
  );

  const programs = Object.entries(programCounts).sort((a, b) => b[1] - a[1]);

  return (
    <View>
      <SectionHeader
        icon={<BarChart2 size={18} color={COLORS.blue} />}
        title="Mes statistiques"
        subtitle="Une lecture simple de ton activité enregistrée."
      />

      <View style={styles.streakCard}>
        <View style={styles.streakIconLarge}>
          <Text style={styles.streakEmoji}>🔥</Text>
        </View>

        <View style={styles.streakMain}>
          <Text style={styles.streakValue}>
            {streak} {streak === 1 ? "jour" : "jours"}
          </Text>

          <Text style={styles.streakLabel}>Série actuelle</Text>
        </View>

        <Trophy size={29} color={COLORS.orange} />
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon={<Activity size={20} color={COLORS.primary} />}
          value={String(history.length)}
          label="Séances"
        />

        <StatCard
          icon={<Flame size={20} color={COLORS.orange} />}
          value={`${totalCalories}`}
          label="kcal*"
        />

        <StatCard
          icon={<Clock size={20} color={COLORS.purple} />}
          value={`${totalMinutes}`}
          label="minutes"
        />

        <StatCard
          icon={<Dumbbell size={20} color={COLORS.green} />}
          value={String(totalExercises)}
          label="exercices"
        />
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <Star size={17} color={COLORS.yellow} />

          <Text style={styles.sectionCardTitle}>Programmes réalisés</Text>
        </View>

        {programs.length === 0 ? (
          <Text style={styles.emptyInline}>Aucune donnée pour l'instant.</Text>
        ) : (
          programs.map(([name, count]) => {
            const percentage =
              history.length > 0 ? (count / history.length) * 100 : 0;

            const program = PROGRAMS.find((item) => item.name === name);

            return (
              <View key={name} style={styles.programStatRow}>
                <Text style={styles.programStatEmoji}>
                  {program?.emoji ?? "🏋️"}
                </Text>

                <View style={styles.programStatMain}>
                  <Text numberOfLines={1} style={styles.programStatName}>
                    {name}
                  </Text>

                  <View style={styles.programStatTrack}>
                    <View
                      style={[
                        styles.programStatFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: program?.color ?? COLORS.primary,
                        },
                      ]}
                    />
                  </View>
                </View>

                <Text style={styles.programStatCount}>{count}×</Text>
              </View>
            );
          })
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onNewWorkout}
        style={styles.primaryWideButton}
      >
        <Plus size={18} color={COLORS.text} />

        <Text style={styles.primaryButtonText}>Nouvelle séance</Text>
      </Pressable>

      <Text style={styles.disclaimer}>
        * Les calories sont des estimations fournies par les données du
        programme et ne doivent pas être interprétées comme une mesure médicale.
      </Text>
    </View>
  );
}

/* ============================================================================
 * SMALL COMPONENTS
 * ========================================================================== */

function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.metric}>
      {icon}

      <Text style={styles.metricValue}>{value}</Text>

      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function MetaItem({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <View style={styles.metaItem}>
      {icon}

      <Text style={styles.metaText}>{value}</Text>
    </View>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderIcon}>{icon}</View>

      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionHeaderTitle}>{title}</Text>

        <Text style={styles.sectionHeaderSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>

      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={COLORS.primary} />

      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

function EmptyState({
  emoji,
  title,
  description,
  actionLabel,
  onAction,
}: {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>

      <Text style={styles.emptyTitle}>{title}</Text>

      <Text style={styles.emptyDescription}>{description}</Text>

      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(5,8,18,0.97)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },

  headerSubtitle: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 12,
  },

  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 13,
    backgroundColor: "rgba(255,107,53,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.25)",
  },

  streakText: {
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: "800",
  },

  tabsContent: {
    gap: 7,
  },

  tabButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },

  tabButtonActive: {
    backgroundColor: "rgba(225,112,85,0.18)",
    borderColor: "rgba(225,112,85,0.35)",
  },

  tabText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },

  tabTextActive: {
    color: COLORS.text,
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },

  heroCard: {
    position: "relative",
    overflow: "hidden",
    padding: 20,
    marginBottom: 22,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  heroGlow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    right: -80,
    top: -70,
    backgroundColor: "rgba(225,112,85,0.10)",
  },

  heroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    backgroundColor: "rgba(225,112,85,0.12)",
    borderWidth: 1,
    borderColor: "rgba(225,112,85,0.25)",
  },

  heroTitle: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: "900",
  },

  heroDescription: {
    marginTop: 7,
    maxWidth: 360,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },

  heroMetrics: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },

  metric: {
    flex: 1,
    padding: 11,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  metricValue: {
    marginTop: 7,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },

  metricLabel: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontSize: 9,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginTop: 6,
    marginBottom: 11,
  },

  sectionHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionHeaderTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },

  sectionHeaderSubtitle: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontSize: 11,
  },

  horizontalFilters: {
    gap: 8,
    paddingBottom: 14,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterChipActive: {
    backgroundColor: "rgba(225,112,85,0.20)",
    borderColor: "rgba(225,112,85,0.40)",
  },

  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },

  filterChipTextActive: {
    color: COLORS.text,
  },

  programCard: {
    overflow: "hidden",
    marginBottom: 12,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  programAccent: {
    height: 4,
    width: "100%",
  },

  programBody: {
    padding: 15,
  },

  programTopRow: {
    flexDirection: "row",
    gap: 12,
  },

  programEmojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  programEmoji: {
    fontSize: 26,
  },

  programMain: {
    flex: 1,
    minWidth: 0,
  },

  programTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  programName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },

  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },

  levelBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },

  programDescription: {
    marginTop: 5,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },

  programMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 14,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metaText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "600",
  },

  exerciseTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 13,
  },

  exerciseTag: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  exerciseTagText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: "600",
  },

  programButton: {
    minHeight: 46,
    marginTop: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  programButtonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  safetyNotice: {
    marginTop: 10,
    padding: 15,
    borderRadius: 17,
    backgroundColor: "rgba(253,203,110,0.07)",
    borderWidth: 1,
    borderColor: "rgba(253,203,110,0.18)",
  },

  safetyNoticeTitle: {
    color: COLORS.yellow,
    fontSize: 12,
    fontWeight: "800",
  },

  safetyNoticeText: {
    marginTop: 5,
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },

  exerciseCard: {
    overflow: "hidden",
    marginBottom: 9,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  exerciseHeader: {
    minHeight: 72,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  exerciseIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(225,112,85,0.13)",
  },

  exerciseIconText: {
    fontSize: 22,
  },

  exerciseMain: {
    flex: 1,
    minWidth: 0,
  },

  exerciseName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "750",
  },

  exerciseMuscle: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 10,
  },

  exerciseSummary: {
    alignItems: "flex-end",
  },

  exerciseReps: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },

  exerciseCalories: {
    marginTop: 3,
    color: COLORS.orange,
    fontSize: 9,
    fontWeight: "700",
  },

  exerciseDetails: {
    padding: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },

  exerciseDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },

  exerciseDetailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  detailPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  detailPillText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "600",
  },

  disclaimer: {
    marginTop: 15,
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },

  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 9,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,184,148,0.10)",
  },

  historyMain: {
    flex: 1,
    minWidth: 0,
  },

  historyName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  historyDate: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 10,
  },

  historyType: {
    marginTop: 2,
    color: COLORS.textSecondary,
    fontSize: 9,
  },

  historyMetrics: {
    alignItems: "flex-end",
  },

  historyCalories: {
    color: COLORS.orange,
    fontSize: 10,
    fontWeight: "800",
  },

  historyDuration: {
    marginTop: 3,
    color: COLORS.textSecondary,
    fontSize: 10,
  },

  historyExercises: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontSize: 9,
  },

  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 18,
    marginBottom: 12,
    borderRadius: 21,
    backgroundColor: "rgba(255,107,53,0.075)",
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.22)",
  },

  streakIconLarge: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,107,53,0.12)",
  },

  streakEmoji: {
    fontSize: 28,
  },

  streakMain: {
    flex: 1,
  },

  streakValue: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "900",
  },

  streakLabel: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontSize: 11,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 12,
  },

  statCard: {
    width: "48%",
    flexGrow: 1,
    padding: 15,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  statValue: {
    marginTop: 10,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
  },

  statLabel: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 10,
  },

  sectionCard: {
    padding: 15,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 13,
  },

  sectionCardTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },

  programStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  programStatEmoji: {
    fontSize: 19,
  },

  programStatMain: {
    flex: 1,
    minWidth: 0,
  },

  programStatName: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },

  programStatTrack: {
    height: 5,
    marginTop: 7,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  programStatFill: {
    height: "100%",
    borderRadius: 999,
  },

  programStatCount: {
    minWidth: 30,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  primaryWideButton: {
    minHeight: 48,
    marginTop: 14,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
  },

  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  secondaryButton: {
    marginTop: 15,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 55,
    paddingHorizontal: 25,
  },

  emptyEmoji: {
    fontSize: 42,
  },

  emptyTitle: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 320,
    marginTop: 6,
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  emptyInline: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: "center",
    paddingVertical: 18,
  },

  loadingState: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },

  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },

  savingText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },

  bottomSpacing: {
    height: 25,
  },

  timerOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    flex: 1,
  },

  timerHeader: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  timerHeaderCenter: {
    flex: 1,
    minWidth: 0,
  },

  timerProgramName: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "600",
  },

  timerExerciseCount: {
    marginTop: 2,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },

  timerClockPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  timerClockText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },

  progressTrack: {
    height: 4,
    marginHorizontal: 16,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  timerContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    paddingBottom: 45,
  },

  phaseBadge: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },

  phaseBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  exerciseEmoji: {
    marginTop: 28,
    fontSize: 62,
  },

  activeExerciseName: {
    marginTop: 14,
    color: COLORS.text,
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center",
  },

  activeExerciseReps: {
    marginTop: 5,
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  setsRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 23,
  },

  setCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  setCircleText: {
    fontSize: 11,
    fontWeight: "800",
  },

  timerDisplayCard: {
    alignItems: "center",
    marginTop: 25,
    paddingHorizontal: 35,
    paddingVertical: 18,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  timerDisplayLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  timerDisplay: {
    marginTop: 5,
    color: COLORS.text,
    fontSize: 43,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },

  timerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 22,
  },

  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  nextButton: {
    minWidth: 145,
    height: 48,
    paddingHorizontal: 17,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  nextButtonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
  },

  nextButtonArrow: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },

  exerciseInstruction: {
    maxWidth: 350,
    marginTop: 20,
    padding: 14,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  exerciseInstructionText: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  completedCard: {
    width: "90%",
    maxWidth: 420,
    padding: 23,
    alignItems: "center",
    borderRadius: 25,
    backgroundColor: "rgba(12,16,34,0.98)",
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },

  completedEmoji: {
    fontSize: 58,
  },

  completedTitle: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
  },

  completedSubtitle: {
    marginTop: 6,
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },

  completedStats: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    marginTop: 22,
  },

  completedStat: {
    flex: 1,
    alignItems: "center",
    padding: 11,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  completedStatValue: {
    marginTop: 7,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },

  completedStatLabel: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontSize: 9,
  },

  calorieDisclaimer: {
    marginTop: 14,
    color: COLORS.textMuted,
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
  },

  completedCard: {
    width: "90%",
    maxWidth: 420,
    padding: 23,
    alignItems: "center",
    borderRadius: 25,
    backgroundColor: "rgba(12,16,34,0.98)",
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
});

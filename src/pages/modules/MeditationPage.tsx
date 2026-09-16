// src/pages/modules/MeditationPage.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flame,
  Frown,
  Meh,
  Microscope,
  Moon,
  Pause,
  Play,
  SkipForward,
  Star,
  Sun,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  Zap,
  Smile,
  CloudRain,
  TreePine,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { SignInButton } from "@/components/ui/signin";

type Tab = "sessions" | "respiration" | "journal" | "sons" | "stats";

type Session = {
  id: string;
  title: string;
  duration: number;
  category: string;
  description: string;
  color: string;
  icon: string;
  level: "débutant" | "intermédiaire" | "avancé";
};

type BreathingExercise = {
  id: string;
  name: string;
  pattern: {
    inhale: number;
    hold1: number;
    exhale: number;
    hold2: number;
  };
  color: string;
  benefit: string;
  cycles: number;
};

type JournalEntry = {
  date: string;
  mood: number;
  gratitude: string[];
  note: string;
  meditated: boolean;
};

type AmbientSound = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

type Mood = {
  value: number;
  label: string;
  color: string;
  icon: typeof Frown;
};

const SESSIONS: Session[] = [
  {
    id: "s1",
    title: "Début de journée",
    duration: 5,
    category: "Énergie",
    description:
      "Réveillez-vous en douceur avec cette méditation matinale guidée pour démarrer la journée avec sérénité.",
    color: "#F97316",
    icon: "☀️",
    level: "débutant",
  },
  {
    id: "s2",
    title: "Pleine conscience",
    duration: 10,
    category: "Concentration",
    description:
      "Ancrez-vous dans le moment présent et développez votre capacité d'attention.",
    color: "#8B5CF6",
    icon: "🧘",
    level: "intermédiaire",
  },
  {
    id: "s3",
    title: "Gestion du stress",
    duration: 15,
    category: "Stress",
    description:
      "Libérez les tensions accumulées grâce à des techniques de relaxation profonde.",
    color: "#3B82F6",
    icon: "🌊",
    level: "débutant",
  },
  {
    id: "s4",
    title: "Sommeil profond",
    duration: 20,
    category: "Sommeil",
    description:
      "Préparez votre corps et votre esprit pour une nuit de sommeil réparateur.",
    color: "#6366F1",
    icon: "🌙",
    level: "débutant",
  },
  {
    id: "s5",
    title: "Compassion envers soi",
    duration: 10,
    category: "Émotions",
    description:
      "Cultivez la bienveillance envers vous-même et développez votre résilience émotionnelle.",
    color: "#EC4899",
    icon: "💗",
    level: "intermédiaire",
  },
  {
    id: "s6",
    title: "Visualisation positive",
    duration: 15,
    category: "Énergie",
    description:
      "Programmez votre esprit pour le succès grâce à des visualisations guidées puissantes.",
    color: "#10B981",
    icon: "✨",
    level: "avancé",
  },
];

const BREATHING_EXERCISES: BreathingExercise[] = [
  {
    id: "b1",
    name: "Cohérence cardiaque",
    pattern: {
      inhale: 5,
      hold1: 0,
      exhale: 5,
      hold2: 0,
    },
    color: "#10B981",
    benefit: "Exercice respiratoire guidé pour favoriser le calme.",
    cycles: 6,
  },
  {
    id: "b2",
    name: "4-7-8 Relaxation",
    pattern: {
      inhale: 4,
      hold1: 7,
      exhale: 8,
      hold2: 0,
    },
    color: "#8B5CF6",
    benefit: "Respiration structurée orientée vers la relaxation.",
    cycles: 4,
  },
  {
    id: "b3",
    name: "Respiration carrée",
    pattern: {
      inhale: 4,
      hold1: 4,
      exhale: 4,
      hold2: 4,
    },
    color: "#3B82F6",
    benefit: "Rythme respiratoire régulier pour une pratique attentive.",
    cycles: 5,
  },
  {
    id: "b4",
    name: "Énergie & Vitalité",
    pattern: {
      inhale: 2,
      hold1: 1,
      exhale: 2,
      hold2: 1,
    },
    color: "#F97316",
    benefit: "Séquence courte pour pratiquer une respiration rythmée.",
    cycles: 8,
  },
];

const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: "rain",
    name: "Pluie douce",
    icon: "🌧️",
    color: "#3B82F6",
  },
  {
    id: "forest",
    name: "Forêt",
    icon: "🌲",
    color: "#22C55E",
  },
  {
    id: "ocean",
    name: "Océan",
    icon: "🌊",
    color: "#0EA5E9",
  },
  {
    id: "fire",
    name: "Feu de camp",
    icon: "🔥",
    color: "#F97316",
  },
  {
    id: "wind",
    name: "Vent léger",
    icon: "💨",
    color: "#8B5CF6",
  },
  {
    id: "night",
    name: "Nuit étoilée",
    icon: "⭐",
    color: "#6366F1",
  },
];

const MOODS: Mood[] = [
  {
    value: 1,
    icon: Frown,
    label: "Difficile",
    color: "#EF4444",
  },
  {
    value: 2,
    icon: Meh,
    label: "Moyen",
    color: "#F97316",
  },
  {
    value: 3,
    icon: Smile,
    label: "Bien",
    color: "#F59E0B",
  },
  {
    value: 4,
    icon: Sun,
    label: "Super",
    color: "#10B981",
  },
  {
    value: 5,
    icon: Zap,
    label: "Excellent",
    color: "#8B5CF6",
  },
];

const TABS: Array<{
  id: Tab;
  label: string;
  icon: typeof Wind;
}> = [
  {
    id: "sessions",
    label: "Sessions",
    icon: Moon,
  },
  {
    id: "respiration",
    label: "Respiration",
    icon: Wind,
  },
  {
    id: "sons",
    label: "Sons",
    icon: Volume2,
  },
  {
    id: "journal",
    label: "Journal",
    icon: BookOpen,
  },
  {
    id: "stats",
    label: "Stats",
    icon: Star,
  },
];

function formatMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }

  return `${minutes} min`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function BreathingCircle({
  exercise,
  onDone,
}: {
  exercise: BreathingExercise;
  onDone: () => void;
}) {
  const phases = useMemo(
    () => [
      {
        label: "Inspirez",
        duration: exercise.pattern.inhale,
      },
      ...(exercise.pattern.hold1 > 0
        ? [
            {
              label: "Retenez",
              duration: exercise.pattern.hold1,
            },
          ]
        : []),
      {
        label: "Expirez",
        duration: exercise.pattern.exhale,
      },
      ...(exercise.pattern.hold2 > 0
        ? [
            {
              label: "Pause",
              duration: exercise.pattern.hold2,
            },
          ]
        : []),
    ],
    [exercise],
  );

  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [phaseElapsed, setPhaseElapsed] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phase = phases[phaseIndex];

  const reset = useCallback(() => {
    setRunning(false);
    setPhaseIndex(0);
    setCycleCount(0);
    setPhaseElapsed(0);
  }, []);

  const finish = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setRunning(false);
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      return;
    }

    intervalRef.current = setInterval(() => {
      setPhaseElapsed((current) => {
        const next = current + 0.1;

        if (next < phase.duration) {
          return next;
        }

        const nextPhase = (phaseIndex + 1) % phases.length;

        if (nextPhase === 0) {
          const nextCycle = cycleCount + 1;

          if (nextCycle >= exercise.cycles) {
            finish();
            return 0;
          }

          setCycleCount(nextCycle);
        }

        setPhaseIndex(nextPhase);

        return 0;
      });
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    running,
    phase.duration,
    phaseIndex,
    cycleCount,
    phases.length,
    exercise.cycles,
    finish,
  ]);

  const progress = Math.min(phaseElapsed / phase.duration, 1);

  const scale =
    phase.label === "Inspirez"
      ? 1 + progress * 0.18
      : phase.label === "Expirez"
        ? 1.18 - progress * 0.18
        : 1.18;

  return (
    <View style={styles.breathingContainer}>
      <View style={styles.centerText}>
        <Text style={styles.exerciseTitle}>{exercise.name}</Text>

        <Text style={styles.exerciseBenefit}>{exercise.benefit}</Text>
      </View>

      <View
        style={[
          styles.breathCircleOuter,
          {
            borderColor: `${exercise.color}35`,
          },
        ]}
      >
        <View
          style={[
            styles.breathCircle,
            {
              backgroundColor: `${exercise.color}18`,
              borderColor: exercise.color,
              transform: [
                {
                  scale,
                },
              ],
            },
          ]}
        >
          <Text style={styles.breathPhase}>{phase.label}</Text>

          <Text style={styles.breathSeconds}>{phase.duration}s</Text>
        </View>
      </View>

      <Text style={styles.cycleText}>
        Cycle {Math.min(cycleCount + 1, exercise.cycles)} / {exercise.cycles}
      </Text>

      <View style={styles.timerControls}>
        <Pressable
          onPress={() => setRunning((value) => !value)}
          style={[
            styles.primaryCircleButton,
            {
              backgroundColor: exercise.color,
            },
          ]}
        >
          {running ? (
            <Pause size={25} color="#FFFFFF" />
          ) : (
            <Play
              size={25}
              color="#FFFFFF"
              style={{
                marginLeft: 2,
              }}
            />
          )}
        </Pressable>

        <Pressable onPress={reset} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Réinitialiser</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SessionTimer({
  session,
  onComplete,
  onClose,
}: {
  session: Session;
  onComplete: () => void;
  onClose: () => void;
}) {
  const totalSeconds = session.duration * 60;

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setElapsed(totalSeconds);
    setRunning(false);
    onComplete();
  }, [onComplete, totalSeconds]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsed((current) => {
        const next = current + 1;

        if (next >= totalSeconds) {
          finish();
          return totalSeconds;
        }

        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, totalSeconds, finish]);

  const remaining = totalSeconds - elapsed;

  const minutes = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");

  const seconds = (remaining % 60).toString().padStart(2, "0");

  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.sessionModal,
          {
            backgroundColor: "#050812",
          },
        ]}
      >
        <View style={styles.modalTopBar}>
          <Pressable
            onPress={onClose}
            style={styles.modalCloseButton}
            accessibilityRole="button"
            accessibilityLabel="Fermer la session"
          >
            <SkipForward size={20} color="#CBD5E1" />
          </Pressable>
        </View>

        <View style={styles.sessionContent}>
          <Text style={styles.sessionEmoji}>{session.icon}</Text>

          <Text style={styles.sessionTitle}>{session.title}</Text>

          <Text style={styles.sessionCategory}>{session.category}</Text>

          <View
            style={[
              styles.sessionCircle,
              {
                borderColor: `${session.color}35`,
              },
            ]}
          >
            <View
              style={[
                styles.sessionProgressRing,
                {
                  borderColor: session.color,
                  opacity: 0.35 + progress * 0.65,
                },
              ]}
            >
              <Text style={styles.sessionTimerText}>
                {minutes}:{seconds}
              </Text>

              <Text style={styles.sessionRemaining}>restant</Text>
            </View>
          </View>

          <Text style={styles.sessionProgressLabel}>
            {Math.round(progress * 100)} % de la session
          </Text>

          <Pressable
            onPress={() => setRunning((value) => !value)}
            style={[
              styles.primaryCircleButton,
              {
                backgroundColor: session.color,
              },
            ]}
          >
            {running ? (
              <Pause size={25} color="#FFFFFF" />
            ) : (
              <Play
                size={25}
                color="#FFFFFF"
                style={{
                  marginLeft: 2,
                }}
              />
            )}
          </Pressable>

          <Text style={styles.sessionHint}>
            {running
              ? "Respirez naturellement et restez attentif."
              : "Session en pause."}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon size={28} color="#64748B" />
      </View>

      <Text style={styles.emptyTitle}>{title}</Text>

      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

export default function MeditationPage({ onBack }: { onBack: () => void }) {
  const { isAuthenticated, loading: authLoading } = useFirebaseAuth();

  const [tab, setTab] = useState<Tab>("sessions");

  const [activeSession, setActiveSession] = useState<Session | null>(null);

  const [sessionDone, setSessionDone] = useState(false);

  const [activeBreathing, setActiveBreathing] =
    useState<BreathingExercise | null>(null);

  const [soundMuted, setSoundMuted] = useState(false);

  const [selectedSounds, setSelectedSounds] = useState<string[]>([]);

  const [mood, setMood] = useState<number | null>(null);

  const [gratitude, setGratitude] = useState(["", "", ""]);

  const [journalNote, setJournalNote] = useState("");

  /*
   * Journal:
   * aucun endpoint de journal n'a été fourni
   * dans le contrat source.
   *
   * On le conserve donc uniquement en mémoire
   * pendant cette ouverture de l'écran.
   */
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  const logMeditation = useMutation(api.health.logMeditation);

  const meditationHistory = useQuery(
    api.health.getMeditationHistory,
    isAuthenticated ? { limit: 30 } : "skip",
  );

  const history = meditationHistory ?? [];

  const totalMinutes = useMemo(
    () =>
      history.reduce(
        (sum, item) =>
          sum +
          (typeof item.durationMinutes === "number" ? item.durationMinutes : 0),
        0,
      ),
    [history],
  );

  const completedSessions = history.length;

  const latestMeditationDate = history.length > 0 ? history[0] : undefined;

  const startSession = (session: Session) => {
    setSessionDone(false);
    setActiveSession(session);
  };

  const completeSession = useCallback(async () => {
    if (!activeSession) {
      return;
    }

    setSessionDone(true);

    try {
      await logMeditation({
        type: activeSession.category,
        durationMinutes: activeSession.duration,
        date: new Date().toISOString(),
        moodAfter: mood ?? undefined,
        notes: activeSession.title,
      });
    } catch {
      /*
       * La session reste terminée localement,
       * mais aucune statistique locale n'est
       * inventée. La persistance dépend du backend.
       */
    }
  }, [activeSession, logMeditation, mood]);

  const saveJournal = () => {
    if (!mood) {
      return;
    }

    const entry: JournalEntry = {
      date: new Date().toISOString(),
      mood,
      gratitude: gratitude.filter((value) => value.trim().length > 0),
      note: journalNote.trim(),
      meditated: history.length > 0,
    };

    setJournalEntries((current) => [entry, ...current]);

    setMood(null);
    setGratitude(["", "", ""]);
    setJournalNote("");
  };

  const toggleSound = (id: string) => {
    setSelectedSounds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const daysActive = useMemo(() => {
    const dates = new Set<string>();

    history.forEach((item) => {
      if (!item.date) {
        return;
      }

      const parsed = new Date(item.date);

      if (Number.isNaN(parsed.getTime())) {
        return;
      }

      dates.add(parsed.toISOString().slice(0, 10));
    });

    return dates.size;
  }, [history]);

  if (authLoading) {
    return (
      <View style={styles.authLoading}>
        <ActivityIndicator size="large" color="#8B5CF6" />

        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.authScreen}>
        <View style={styles.authIcon}>
          <Moon size={32} color="#A78BFA" />
        </View>

        <Text style={styles.authTitle}>Connexion requise</Text>

        <Text style={styles.authDescription}>
          Connectez-vous pour accéder à votre espace Méditation & Mindfulness.
        </Text>

        <SignInButton />

        <Pressable onPress={onBack} style={styles.backLink}>
          <ArrowLeft size={15} color="#64748B" />

          <Text style={styles.backLinkText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Méditation & Mindfulness</Text>

          <Text style={styles.headerSubtitle}>
            Calme, focus et bien-être intérieur
          </Text>
        </View>

        <View style={styles.headerBadge}>
          <Moon size={14} color="#C4B5FD" />

          <Text style={styles.headerBadgeText}>{daysActive}</Text>
        </View>
      </View>

      {/* TABS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
        style={styles.tabsScroll}
      >
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;

          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              style={[styles.tab, active && styles.tabActive]}
              accessibilityRole="tab"
              accessibilityState={{
                selected: active,
              }}
            >
              <Icon size={14} color={active ? "#FFFFFF" : "#64748B"} />

              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* SESSIONS */}
        {tab === "sessions" && (
          <View style={styles.section}>
            <View style={styles.heroCard}>
              <View>
                <Text style={styles.heroEyebrow}>VOTRE ESPACE</Text>

                <Text style={styles.heroTitle}>Moment de calme</Text>

                <Text style={styles.heroDescription}>
                  Choisissez une session adaptée à votre moment.
                </Text>
              </View>

              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text
                    style={[
                      styles.heroStatValue,
                      {
                        color: "#C4B5FD",
                      },
                    ]}
                  >
                    {formatMinutes(totalMinutes)}
                  </Text>

                  <Text style={styles.heroStatLabel}>Total</Text>
                </View>

                <View style={styles.heroStat}>
                  <Text
                    style={[
                      styles.heroStatValue,
                      {
                        color: "#34D399",
                      },
                    ]}
                  >
                    {completedSessions}
                  </Text>

                  <Text style={styles.heroStatLabel}>Sessions</Text>
                </View>

                <View style={styles.heroStat}>
                  <Text
                    style={[
                      styles.heroStatValue,
                      {
                        color: "#FB923C",
                      },
                    ]}
                  >
                    {daysActive}
                  </Text>

                  <Text style={styles.heroStatLabel}>Jours actifs</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Sessions guidées</Text>

                <Text style={styles.sectionSubtitle}>
                  Une pratique à votre rythme
                </Text>
              </View>
            </View>

            <View style={styles.cardList}>
              {SESSIONS.map((session) => {
                const completed = history.some(
                  (item) => item.notes === session.title,
                );

                return (
                  <Pressable
                    key={session.id}
                    onPress={() => startSession(session)}
                    style={({ pressed }) => [
                      styles.sessionCard,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.sessionIcon,
                        {
                          backgroundColor: `${session.color}18`,
                        },
                      ]}
                    >
                      <Text style={styles.sessionIconText}>{session.icon}</Text>
                    </View>

                    <View style={styles.sessionInfo}>
                      <View style={styles.titleRow}>
                        <Text style={styles.sessionCardTitle} numberOfLines={1}>
                          {session.title}
                        </Text>

                        {completed && (
                          <CheckCircle2 size={15} color="#34D399" />
                        )}
                      </View>

                      <Text
                        style={styles.sessionCardDescription}
                        numberOfLines={2}
                      >
                        {session.description}
                      </Text>

                      <View style={styles.metaRow}>
                        <View
                          style={[
                            styles.metaBadge,
                            {
                              backgroundColor: `${session.color}18`,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.metaBadgeText,
                              {
                                color: session.color,
                              },
                            ]}
                          >
                            {session.duration} min
                          </Text>
                        </View>

                        <Text style={styles.metaText}>{session.category}</Text>

                        <Text style={styles.metaText}>·</Text>

                        <Text style={styles.metaText}>{session.level}</Text>
                      </View>
                    </View>

                    <ChevronRight size={17} color="#475569" />
                  </Pressable>
                );
              })}
            </View>

            {latestMeditationDate && (
              <View style={styles.lastActivity}>
                <Text style={styles.lastActivityTitle}>Dernière activité</Text>

                <Text style={styles.lastActivityText}>
                  {formatDate(latestMeditationDate.date)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* RESPIRATION */}
        {tab === "respiration" && (
          <View style={styles.section}>
            {activeBreathing ? (
              <>
                <Pressable
                  onPress={() => setActiveBreathing(null)}
                  style={styles.inlineBack}
                >
                  <ArrowLeft size={16} color="#94A3B8" />

                  <Text style={styles.inlineBackText}>Exercices</Text>
                </Pressable>

                <BreathingCircle
                  exercise={activeBreathing}
                  onDone={() => setActiveBreathing(null)}
                />
              </>
            ) : (
              <>
                <View style={styles.breathingHero}>
                  <Text style={styles.breathingEmoji}>🌬️</Text>

                  <Text style={styles.breathingHeroTitle}>
                    Exercices de respiration
                  </Text>

                  <Text style={styles.breathingHeroText}>
                    Prenez quelques minutes pour pratiquer une respiration
                    guidée.
                  </Text>
                </View>

                <View style={styles.cardList}>
                  {BREATHING_EXERCISES.map((exercise) => (
                    <Pressable
                      key={exercise.id}
                      onPress={() => setActiveBreathing(exercise)}
                      style={({ pressed }) => [
                        styles.breathingCard,
                        {
                          borderColor: `${exercise.color}25`,
                          backgroundColor: `${exercise.color}09`,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.breathingCardTop}>
                        <View style={styles.breathingInfo}>
                          <Text style={styles.breathingName}>
                            {exercise.name}
                          </Text>

                          <Text
                            style={styles.breathingBenefit}
                            numberOfLines={2}
                          >
                            {exercise.benefit}
                          </Text>

                          <View style={styles.patternRow}>
                            <Text style={styles.patternText}>
                              ↑ {exercise.pattern.inhale}s
                            </Text>

                            {exercise.pattern.hold1 > 0 && (
                              <Text style={styles.patternText}>
                                ⏸ {exercise.pattern.hold1}s
                              </Text>
                            )}

                            <Text style={styles.patternText}>
                              ↓ {exercise.pattern.exhale}s
                            </Text>

                            {exercise.pattern.hold2 > 0 && (
                              <Text style={styles.patternText}>
                                ⏸ {exercise.pattern.hold2}s
                              </Text>
                            )}
                          </View>
                        </View>

                        <View
                          style={[
                            styles.playCircle,
                            {
                              backgroundColor: `${exercise.color}20`,
                            },
                          ]}
                        >
                          <Play
                            size={18}
                            color={exercise.color}
                            style={{
                              marginLeft: 2,
                            }}
                          />
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* SONS */}
        {tab === "sons" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Sons ambiants</Text>

                <Text style={styles.sectionSubtitle}>
                  Ambiances disponibles
                </Text>
              </View>

              <Pressable
                onPress={() => setSoundMuted((value) => !value)}
                style={styles.soundToggle}
              >
                {soundMuted ? (
                  <VolumeX size={15} color="#94A3B8" />
                ) : (
                  <Volume2 size={15} color="#94A3B8" />
                )}

                <Text style={styles.soundToggleText}>
                  {soundMuted ? "Muet" : "Actif"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.audioNotice}>
              <VolumeX size={17} color="#64748B" />

              <Text style={styles.audioNoticeText}>
                Le moteur audio n'est pas encore connecté à des fichiers ou flux
                réels dans le backend fourni. Aucun son fictif n'est lancé.
              </Text>
            </View>

            <View style={styles.soundGrid}>
              {AMBIENT_SOUNDS.map((sound) => {
                const active = selectedSounds.includes(sound.id);

                return (
                  <Pressable
                    key={sound.id}
                    onPress={() => toggleSound(sound.id)}
                    style={[
                      styles.soundCard,
                      active && styles.soundCardActive,
                      active && {
                        borderColor: `${sound.color}55`,
                      },
                    ]}
                  >
                    <Text style={styles.soundEmoji}>{sound.icon}</Text>

                    <Text
                      style={[
                        styles.soundName,
                        active && styles.soundNameActive,
                      ]}
                    >
                      {sound.name}
                    </Text>

                    <Text style={styles.soundStatus}>
                      {active ? "Sélectionné" : "Disponible"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* JOURNAL */}
        {tab === "journal" && (
          <View style={styles.section}>
            <View style={styles.journalCard}>
              <Text style={styles.sectionTitle}>
                Comment vous sentez-vous ?
              </Text>

              <Text style={styles.sectionSubtitle}>
                Prenez un instant pour noter votre état du jour.
              </Text>

              <View style={styles.moodRow}>
                {MOODS.map((item) => {
                  const Icon = item.icon;
                  const selected = mood === item.value;

                  return (
                    <Pressable
                      key={item.value}
                      onPress={() => setMood(item.value)}
                      style={[
                        styles.moodButton,
                        selected && {
                          backgroundColor: `${item.color}18`,
                          borderColor: `${item.color}55`,
                        },
                      ]}
                    >
                      <Icon
                        size={22}
                        color={selected ? item.color : "#64748B"}
                      />

                      <Text
                        style={[
                          styles.moodLabel,
                          selected && {
                            color: item.color,
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>
                3 choses dont je suis reconnaissant(e)
              </Text>

              {gratitude.map((value, index) => (
                <View key={index} style={styles.gratitudeRow}>
                  <Text style={styles.gratitudeBullet}>✦</Text>

                  <TextInput
                    value={value}
                    onChangeText={(next) => {
                      setGratitude((current) => {
                        const copy = [...current];

                        copy[index] = next;

                        return copy;
                      });
                    }}
                    placeholder={`Gratitude ${index + 1}...`}
                    placeholderTextColor="#475569"
                    style={styles.textInput}
                  />
                </View>
              ))}

              <Text
                style={[
                  styles.inputLabel,
                  {
                    marginTop: 16,
                  },
                ]}
              >
                Note du jour
              </Text>

              <TextInput
                value={journalNote}
                onChangeText={setJournalNote}
                placeholder="Comment s'est passée votre journée ?"
                placeholderTextColor="#475569"
                multiline
                textAlignVertical="top"
                style={[styles.textInput, styles.noteInput]}
              />

              <Pressable
                onPress={saveJournal}
                disabled={!mood}
                style={[styles.saveButton, !mood && styles.saveButtonDisabled]}
              >
                <Text style={styles.saveButtonText}>Enregistrer l'entrée</Text>
              </Pressable>
            </View>

            {journalEntries.length > 0 && (
              <View style={styles.journalHistory}>
                <Text style={styles.sectionTitle}>Entrées récentes</Text>

                {journalEntries.slice(0, 5).map((entry, index) => {
                  const moodData = MOODS.find(
                    (item) => item.value === entry.mood,
                  );

                  const Icon = moodData?.icon ?? Smile;

                  return (
                    <View
                      key={`${entry.date}-${index}`}
                      style={styles.journalEntry}
                    >
                      <Icon size={20} color={moodData?.color ?? "#94A3B8"} />

                      <View style={styles.journalEntryContent}>
                        <Text style={styles.journalDate}>
                          {formatDate(entry.date)}
                        </Text>

                        {entry.note ? (
                          <Text style={styles.journalNote} numberOfLines={2}>
                            {entry.note}
                          </Text>
                        ) : null}
                      </View>

                      {entry.meditated && (
                        <CheckCircle2 size={15} color="#34D399" />
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* STATS */}
        {tab === "stats" && (
          <View style={styles.section}>
            <View style={styles.statsHero}>
              <Flame size={22} color="#FB923C" />

              <Text style={styles.statsHeroTitle}>Votre pratique</Text>

              <Text style={styles.statsHeroDescription}>
                Les statistiques ci-dessous proviennent des sessions
                enregistrées dans votre historique.
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <View
                style={[
                  styles.statCard,
                  {
                    borderColor: "rgba(139,92,246,0.20)",
                  },
                ]}
              >
                <Moon size={20} color="#A78BFA" />

                <Text style={styles.statValue}>{totalMinutes}</Text>

                <Text style={styles.statLabel}>Minutes méditées</Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    borderColor: "rgba(52,211,153,0.20)",
                  },
                ]}
              >
                <CheckCircle2 size={20} color="#34D399" />

                <Text style={styles.statValue}>{completedSessions}</Text>

                <Text style={styles.statLabel}>Sessions enregistrées</Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    borderColor: "rgba(59,130,246,0.20)",
                  },
                ]}
              >
                <Wind size={20} color="#60A5FA" />

                <Text style={styles.statValue}>{daysActive}</Text>

                <Text style={styles.statLabel}>Jours avec activité</Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    borderColor: "rgba(236,72,153,0.20)",
                  },
                ]}
              >
                <BookOpen size={20} color="#F472B6" />

                <Text style={styles.statValue}>{journalEntries.length}</Text>

                <Text style={styles.statLabel}>Entrées du journal</Text>
              </View>
            </View>

            <View style={styles.integrityNotice}>
              <Star size={17} color="#94A3B8" />

              <Text style={styles.integrityText}>
                Aucun score, streak ou compteur artificiel n'est ajouté lorsque
                le backend ne fournit pas la donnée.
              </Text>
            </View>

            {history.length === 0 && (
              <EmptyState
                icon={Star}
                title="Pas encore de statistiques"
                description="Terminez une session pour commencer à construire votre historique."
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* SESSION */}
      {activeSession && !sessionDone && (
        <SessionTimer
          session={activeSession}
          onComplete={completeSession}
          onClose={() => {
            setActiveSession(null);
            setSessionDone(false);
          }}
        />
      )}

      {/* SESSION TERMINÉE */}
      {activeSession && sessionDone && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => {
            setActiveSession(null);
            setSessionDone(false);
          }}
        >
          <View style={styles.completionBackdrop}>
            <View style={styles.completionCard}>
              <Text style={styles.completionEmoji}>🌟</Text>

              <Text style={styles.completionTitle}>Session terminée</Text>

              <Text style={styles.completionDescription}>
                {activeSession.title} · {activeSession.duration} min
              </Text>

              <View style={styles.completionBadge}>
                <CheckCircle2 size={16} color="#34D399" />

                <Text style={styles.completionBadgeText}>
                  Session enregistrée
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  setActiveSession(null);
                  setSessionDone(false);
                }}
                style={styles.continueButton}
              >
                <Text style={styles.continueButtonText}>Continuer</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050812",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerText: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 3,
  },

  headerBadge: {
    minWidth: 40,
    height: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
  },

  headerBadgeText: {
    color: "#C4B5FD",
    fontSize: 11,
    fontWeight: "900",
  },

  tabsScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  tabsContent: {
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  tab: {
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  tabActive: {
    backgroundColor: "rgba(139,92,246,0.22)",
    borderColor: "rgba(139,92,246,0.42)",
  },

  tabText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
  },

  tabTextActive: {
    color: "#FFFFFF",
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 42,
  },

  section: {
    gap: 14,
  },

  heroCard: {
    padding: 19,
    borderRadius: 21,
    backgroundColor: "rgba(139,92,246,0.075)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
  },

  heroEyebrow: {
    color: "#A78BFA",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 5,
  },

  heroDescription: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  heroStats: {
    flexDirection: "row",
    marginTop: 18,
    gap: 9,
  },

  heroStat: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  heroStatValue: {
    fontSize: 15,
    fontWeight: "900",
  },

  heroStatLabel: {
    color: "#64748B",
    fontSize: 8,
    marginTop: 3,
    textAlign: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 3,
  },

  cardList: {
    gap: 10,
  },

  sessionCard: {
    minHeight: 91,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  sessionIcon: {
    width: 49,
    height: 49,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },

  sessionIconText: {
    fontSize: 24,
  },

  sessionInfo: {
    flex: 1,
    marginHorizontal: 11,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  sessionCardTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  sessionCardDescription: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 7,
  },

  metaBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },

  metaBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  metaText: {
    color: "#475569",
    fontSize: 8,
  },

  pressed: {
    opacity: 0.7,
  },

  lastActivity: {
    padding: 13,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  lastActivityTitle: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "900",
  },

  lastActivityText: {
    color: "#64748B",
    fontSize: 9,
    marginTop: 4,
  },

  inlineBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 4,
  },

  inlineBackText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
  },

  breathingHero: {
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    backgroundColor: "rgba(16,185,129,0.07)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.18)",
  },

  breathingEmoji: {
    fontSize: 32,
    marginBottom: 7,
  },

  breathingHeroTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  breathingHeroText: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 5,
  },

  breathingCard: {
    padding: 15,
    borderRadius: 17,
    borderWidth: 1,
  },

  breathingCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  breathingInfo: {
    flex: 1,
    paddingRight: 12,
  },

  breathingName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  breathingBenefit: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },

  patternRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },

  patternText: {
    color: "#94A3B8",
    fontSize: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  playCircle: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
  },

  breathingContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },

  centerText: {
    alignItems: "center",
    paddingHorizontal: 20,
  },

  exerciseTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  exerciseBenefit: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 5,
  },

  breathCircleOuter: {
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 26,
    borderRadius: 120,
    borderWidth: 2,
  },

  breathCircle: {
    width: 178,
    height: 178,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 89,
    borderWidth: 2,
  },

  breathPhase: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  breathSeconds: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 5,
  },

  cycleText: {
    color: "#64748B",
    fontSize: 10,
    marginBottom: 15,
  },

  timerControls: {
    alignItems: "center",
    gap: 12,
  },

  primaryCircleButton: {
    width: 66,
    height: 66,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 33,
  },

  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  secondaryButtonText: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "800",
  },

  soundToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  soundToggleText: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "800",
  },

  audioNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  audioNoticeText: {
    flex: 1,
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
  },

  soundGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  soundCard: {
    width: "48%",
    minHeight: 118,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  soundCardActive: {
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  soundEmoji: {
    fontSize: 28,
  },

  soundName: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 7,
  },

  soundNameActive: {
    color: "#FFFFFF",
  },

  soundStatus: {
    color: "#475569",
    fontSize: 8,
    marginTop: 4,
  },

  journalCard: {
    padding: 16,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  moodRow: {
    flexDirection: "row",
    gap: 7,
    marginTop: 16,
  },

  moodButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  moodLabel: {
    color: "#64748B",
    fontSize: 7,
    marginTop: 5,
    textAlign: "center",
  },

  inputLabel: {
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 17,
    marginBottom: 7,
  },

  gratitudeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  gratitudeBullet: {
    color: "#FBBF24",
    fontSize: 12,
  },

  textInput: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: 2,
    paddingVertical: 7,
    color: "#FFFFFF",
    fontSize: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.09)",
  },

  noteInput: {
    minHeight: 105,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  saveButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 45,
    marginTop: 13,
    borderRadius: 13,
    backgroundColor: "#6D28D9",
  },

  saveButtonDisabled: {
    opacity: 0.4,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  journalHistory: {
    gap: 9,
  },

  journalEntry: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  journalEntryContent: {
    flex: 1,
  },

  journalDate: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "800",
  },

  journalNote: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  statsHero: {
    padding: 17,
    borderRadius: 18,
    backgroundColor: "rgba(249,115,22,0.06)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.15)",
  },

  statsHeroTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 7,
  },

  statsHeroDescription: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  statCard: {
    width: "48%",
    minHeight: 120,
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
  },

  statValue: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 12,
  },

  statLabel: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 13,
  },

  integrityNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  integrityText: {
    flex: 1,
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 38,
    paddingHorizontal: 25,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  emptyIcon: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 11,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  emptyDescription: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
    marginTop: 5,
  },

  sessionModal: {
    flex: 1,
  },

  modalTopBar: {
    alignItems: "flex-end",
    paddingTop: 16,
    paddingHorizontal: 16,
  },

  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  sessionContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 70,
  },

  sessionEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },

  sessionTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },

  sessionCategory: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 4,
  },

  sessionCircle: {
    width: 255,
    height: 255,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 28,
    borderRadius: 128,
    borderWidth: 3,
  },

  sessionProgressRing: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 110,
    borderWidth: 4,
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  sessionTimerText: {
    color: "#FFFFFF",
    fontSize: 47,
    fontWeight: "900",
    letterSpacing: 2,
  },

  sessionRemaining: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 2,
  },

  sessionProgressLabel: {
    color: "#64748B",
    fontSize: 9,
    marginBottom: 18,
  },

  sessionHint: {
    color: "#475569",
    fontSize: 9,
    marginTop: 14,
    textAlign: "center",
  },

  completionBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  completionCard: {
    width: "100%",
    maxWidth: 390,
    alignItems: "center",
    padding: 27,
    borderRadius: 24,
    backgroundColor: "#0B1020",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.25)",
  },

  completionEmoji: {
    fontSize: 52,
    marginBottom: 12,
  },

  completionTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },

  completionDescription: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 5,
  },

  completionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(52,211,153,0.09)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.18)",
  },

  completionBadgeText: {
    color: "#6EE7B7",
    fontSize: 9,
    fontWeight: "800",
  },

  continueButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    marginTop: 22,
    borderRadius: 13,
    backgroundColor: "#6D28D9",
  },

  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  authLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050812",
  },

  loadingText: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 10,
  },

  authScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#050812",
  },

  authIcon: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "rgba(139,92,246,0.10)",
    marginBottom: 17,
  },

  authTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  authDescription: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 19,
  },

  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 15,
    padding: 10,
  },

  backLinkText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
  },
});

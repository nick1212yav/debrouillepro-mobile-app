import {
  View,
  Pressable,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Brain,
  Timer,
  Trophy,
  Star,
  Zap,
  Target,
  CheckCircle,
  XCircle,
  RotateCcw,
  Play,
  ChevronRight,
  TrendingUp,
  BookOpen,
  Clock,
  Award,
  Flame,
  BarChart3,
  ShieldCheck,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated } from "@/lib/convex-auth-compat";

type Props = {
  onBack: () => void;
};

type QuizMode = "training" | "exam" | "challenge";
type QuizState = "menu" | "quiz" | "result";

type Question = {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
};

type Category = {
  id: string;
  label: string;
  icon: string;
  color: string;
  questions: Question[];
};

type AnswerRecord = {
  questionId: number;
  chosen: number;
  correct: boolean;
  timeMs: number;
};

type HistoryEntry = {
  date: string;
  category: string;
  mode: QuizMode;
  score: number;
  total: number;
};

const CATEGORIES: Category[] = [
  {
    id: "tech",
    label: "Technologie",
    icon: "💻",
    color: "#6366F1",
    questions: [
      {
        id: 1,
        question:
          "Quel langage est principalement utilisé pour le développement web front-end ?",
        options: ["Python", "JavaScript", "Java", "C++"],
        correct: 1,
        explanation:
          "JavaScript est le langage standard du navigateur pour rendre les pages web interactives.",
        difficulty: "easy",
      },
      {
        id: 2,
        question: "Que signifie l'acronyme HTML ?",
        options: [
          "Hyper Text Markup Language",
          "High Text Modern Language",
          "Hyper Transfer Markup Logic",
          "Hyper Text Modern Logic",
        ],
        correct: 0,
        explanation:
          "HTML signifie HyperText Markup Language et constitue le langage de balisage standard du Web.",
        difficulty: "easy",
      },
      {
        id: 3,
        question:
          "Quel protocole est utilisé pour sécuriser les communications sur Internet ?",
        options: ["HTTP", "FTP", "HTTPS", "SMTP"],
        correct: 2,
        explanation: "HTTPS protège les communications HTTP en utilisant TLS.",
        difficulty: "medium",
      },
      {
        id: 4,
        question: "Qu'est-ce qu'une API REST ?",
        options: [
          "Un langage de programmation",
          "Une interface de programmation utilisant HTTP",
          "Un type de base de données",
          "Un framework CSS",
        ],
        correct: 1,
        explanation:
          "Une API REST expose des ressources accessibles selon des conventions utilisant notamment les méthodes HTTP.",
        difficulty: "medium",
      },
      {
        id: 5,
        question:
          "Quel algorithme est utilisé pour le chiffrement asymétrique ?",
        options: ["AES", "SHA-256", "RSA", "MD5"],
        correct: 2,
        explanation:
          "RSA est un algorithme cryptographique asymétrique utilisant une paire de clés.",
        difficulty: "hard",
      },
    ],
  },
  {
    id: "science",
    label: "Sciences",
    icon: "🔬",
    color: "#10B981",
    questions: [
      {
        id: 6,
        question: "Quelle est la formule chimique de l'eau ?",
        options: ["H2O2", "HO", "H2O", "H3O"],
        correct: 2,
        explanation:
          "Une molécule d'eau contient deux atomes d'hydrogène et un atome d'oxygène.",
        difficulty: "easy",
      },
      {
        id: 7,
        question:
          "Quelle est approximativement la vitesse de la lumière dans le vide ?",
        options: [
          "300 000 km/s",
          "150 000 km/s",
          "600 000 km/s",
          "30 000 km/s",
        ],
        correct: 0,
        explanation:
          "La vitesse de la lumière dans le vide est d'environ 300 000 km/s.",
        difficulty: "easy",
      },
      {
        id: 8,
        question: "Quel organe produit l'insuline ?",
        options: ["Le foie", "Le rein", "Le pancréas", "La rate"],
        correct: 2,
        explanation:
          "Le pancréas produit l'insuline, une hormone impliquée dans la régulation de la glycémie.",
        difficulty: "medium",
      },
      {
        id: 9,
        question:
          "Combien d'entités élémentaires contient approximativement une mole ?",
        options: ["6,02 × 10²²", "6,02 × 10²³", "6,02 × 10²⁴", "6,02 × 10²¹"],
        correct: 1,
        explanation:
          "Une mole contient environ 6,022 × 10²³ entités élémentaires.",
        difficulty: "hard",
      },
      {
        id: 10,
        question:
          "Quel est l'élément chimique le plus abondant dans l'univers ?",
        options: ["Oxygène", "Carbone", "Hélium", "Hydrogène"],
        correct: 3,
        explanation:
          "L'hydrogène est l'élément le plus abondant dans l'univers observable.",
        difficulty: "medium",
      },
    ],
  },
  {
    id: "history",
    label: "Histoire",
    icon: "📜",
    color: "#F59E0B",
    questions: [
      {
        id: 11,
        question: "En quelle année la Révolution française a-t-elle commencé ?",
        options: ["1776", "1789", "1799", "1804"],
        correct: 1,
        explanation:
          "1789 marque le début conventionnel de la Révolution française.",
        difficulty: "easy",
      },
      {
        id: 12,
        question: "Qui était le premier président des États-Unis ?",
        options: [
          "Thomas Jefferson",
          "Benjamin Franklin",
          "George Washington",
          "John Adams",
        ],
        correct: 2,
        explanation:
          "George Washington fut le premier président des États-Unis.",
        difficulty: "easy",
      },
      {
        id: 13,
        question:
          "En quelle année Christophe Colomb a-t-il atteint les Amériques ?",
        options: ["1488", "1492", "1498", "1502"],
        correct: 1,
        explanation:
          "Le premier voyage de Christophe Colomb vers les Amériques a atteint les Caraïbes en 1492.",
        difficulty: "easy",
      },
      {
        id: 14,
        question: "Quelle civilisation a construit les pyramides de Gizeh ?",
        options: ["Sumérienne", "Grecque", "Romaine", "Égyptienne"],
        correct: 3,
        explanation:
          "Les pyramides de Gizeh ont été construites dans l'Égypte ancienne.",
        difficulty: "easy",
      },
      {
        id: 15,
        question:
          "Quel traité est associé à la fin officielle de la Première Guerre mondiale ?",
        options: [
          "Traité de Paris",
          "Traité de Versailles",
          "Traité de Berlin",
          "Traité de Rome",
        ],
        correct: 1,
        explanation:
          "Le traité de Versailles a été signé en 1919 et constitue le principal traité de paix associé à la fin de la Première Guerre mondiale.",
        difficulty: "medium",
      },
    ],
  },
  {
    id: "geo",
    label: "Géographie",
    icon: "🌍",
    color: "#06B6D4",
    questions: [
      {
        id: 16,
        question: "Quelle est la capitale de l'Australie ?",
        options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
        correct: 2,
        explanation: "Canberra est la capitale fédérale de l'Australie.",
        difficulty: "medium",
      },
      {
        id: 17,
        question:
          "Quel fleuve est généralement présenté comme le plus long du monde ?",
        options: ["L'Amazone", "Le Nil", "Le Mississippi", "Le Yangtsé"],
        correct: 1,
        explanation:
          "Le Nil est traditionnellement présenté comme le plus long fleuve du monde, même si certaines estimations comparant le Nil et l'Amazone font l'objet de débats méthodologiques.",
        difficulty: "easy",
      },
      {
        id: 18,
        question:
          "Combien de pays membres de l'ONU sont généralement comptés en Afrique ?",
        options: ["45", "52", "54", "58"],
        correct: 2,
        explanation:
          "L'Afrique compte 54 États membres de l'Organisation des Nations unies.",
        difficulty: "medium",
      },
      {
        id: 19,
        question: "Quelle est la montagne la plus haute du monde ?",
        options: ["K2", "Kangchenjunga", "Mont Blanc", "Everest"],
        correct: 3,
        explanation:
          "L'Everest est le sommet terrestre dont l'altitude au-dessus du niveau de la mer est la plus élevée.",
        difficulty: "easy",
      },
      {
        id: 20,
        question: "Dans quel pays se trouve Machu Picchu ?",
        options: ["Bolivie", "Pérou", "Équateur", "Colombie"],
        correct: 1,
        explanation: "Machu Picchu est situé dans les Andes du Pérou.",
        difficulty: "easy",
      },
    ],
  },
];

const MODE_INFO: Record<
  QuizMode,
  {
    label: string;
    desc: string;
    color: string;
    timePerQ?: number;
  }
> = {
  training: {
    label: "Entraînement",
    desc: "Prenez votre temps et consultez les explications.",
    color: "#10B981",
  },
  exam: {
    label: "Examen blanc",
    desc: "30 secondes par question, sans explication immédiate.",
    color: "#6366F1",
    timePerQ: 30,
  },
  challenge: {
    label: "Défi chronométré",
    desc: "15 secondes maximum par question.",
    color: "#F59E0B",
    timePerQ: 15,
  },
};

const DIFFICULTY_LABEL: Record<Question["difficulty"], string> = {
  easy: "Facile",
  medium: "Intermédiaire",
  hard: "Difficile",
};

const DIFFICULTY_COLOR: Record<Question["difficulty"], string> = {
  easy: "#10B981",
  medium: "#F59E0B",
  hard: "#EF4444",
};

function shuffleQuestions(items: Question[]): Question[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return date.toLocaleDateString("fr-FR");
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function getResultMessage(percent: number): string {
  if (percent >= 80) return "Excellent travail";
  if (percent >= 60) return "Bien joué";
  return "Continuez à pratiquer";
}

function getResultColor(percent: number): string {
  if (percent >= 80) return "#10B981";
  if (percent >= 60) return "#F59E0B";
  return "#EF4444";
}

function QuizPageContent({ onBack }: Props) {
  const [state, setState] = useState<QuizState>("menu");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [selectedMode, setSelectedMode] = useState<QuizMode>("training");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [showExplain, setShowExplain] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef(0);
  const timeoutHandledRef = useRef(false);

  const convexHistory = useQuery(api.education.getMyQuizAttempts, {});

  const submitAttempt = useMutation(api.education.submitQuizAttempt);

  /*
   * IMPORTANT:
   * We intentionally do NOT automatically submit against the first
   * public quiz returned by the backend.
   *
   * The current page contains local/static questions while
   * submitQuizAttempt requires a real quizId.
   *
   * Until a deterministic mapping exists between this category
   * and a backend quiz document, the UI must not create a false
   * persistence record.
   */
  const publicQuizzes = useQuery(api.education.listPublicQuizzes, {});

  const currentQ = questions[currentIdx];
  const modeInfo = MODE_INFO[selectedMode];
  const isLastQ = questions.length > 0 && currentIdx === questions.length - 1;

  useEffect(() => {
    if (convexHistory === undefined) {
      return;
    }

    /*
     * We intentionally do not invent a schema for QuizAttempt.
     * If the backend response contains recognizable fields, we
     * transform only those fields that are actually present.
     */
    const normalized: HistoryEntry[] = [];

    for (const attempt of convexHistory as unknown[]) {
      if (!attempt || typeof attempt !== "object") continue;

      const item = attempt as Record<string, unknown>;

      const date =
        typeof item.date === "string"
          ? item.date
          : typeof item.createdAt === "string"
            ? item.createdAt
            : typeof item._creationTime === "number"
              ? new Date(item._creationTime).toISOString()
              : null;

      const score = typeof item.score === "number" ? item.score : null;

      const total = typeof item.total === "number" ? item.total : null;

      if (!date || score === null || total === null || total <= 0) {
        continue;
      }

      const category =
        typeof item.category === "string" ? item.category : "Quiz";

      const mode =
        item.mode === "exam" ||
        item.mode === "challenge" ||
        item.mode === "training"
          ? item.mode
          : "training";

      normalized.push({
        date,
        category,
        mode,
        score,
        total,
      });
    }

    setHistory(normalized);
    setHistoryLoaded(true);
  }, [convexHistory]);

  useEffect(() => {
    if (state !== "quiz" || !currentQ) {
      return;
    }

    timeoutHandledRef.current = false;
    questionStartRef.current = Date.now();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const limit = modeInfo.timePerQ;

    if (limit) {
      setTimeLeft(limit);

      timerRef.current = setInterval(() => {
        setTimeLeft((previous) => {
          if (previous <= 1) {
            if (!timeoutHandledRef.current) {
              timeoutHandledRef.current = true;

              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }

              handleTimeout();
            }

            return 0;
          }

          return previous - 1;
        });
      }, 1000);
    } else {
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((previous) => previous + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentIdx, state]);

  function handleTimeout() {
    if (!currentQ || chosen !== null) {
      return;
    }

    const timeMs = (modeInfo.timePerQ ?? 0) * 1000;

    const record: AnswerRecord = {
      questionId: currentQ.id,
      chosen: -1,
      correct: false,
      timeMs,
    };

    setAnswers((previous) => [...previous, record]);
    setChosen(-1);

    if (selectedMode === "training") {
      setShowExplain(true);
      return;
    }

    window.setTimeout(() => {
      advanceOrFinish(record);
    }, 350);
  }

  function handleAnswer(index: number) {
    if (!currentQ || chosen !== null) {
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const timeMs = Math.max(0, Date.now() - questionStartRef.current);

    const record: AnswerRecord = {
      questionId: currentQ.id,
      chosen: index,
      correct: index === currentQ.correct,
      timeMs,
    };

    setAnswers((previous) => [...previous, record]);
    setChosen(index);

    if (selectedMode === "training") {
      setShowExplain(true);
      return;
    }

    window.setTimeout(() => {
      advanceOrFinish(record);
    }, 500);
  }

  function advanceOrFinish(record: AnswerRecord) {
    if (isLastQ) {
      void finishQuiz([...answers, record]);
      return;
    }

    setCurrentIdx((previous) => previous + 1);
    setChosen(null);
    setShowExplain(false);
  }

  function nextQuestion() {
    if (!currentQ || chosen === null) {
      return;
    }

    const record: AnswerRecord = {
      questionId: currentQ.id,
      chosen,
      correct: chosen === currentQ.correct,
      timeMs: Math.max(0, Date.now() - questionStartRef.current),
    };

    if (isLastQ) {
      void finishQuiz(
        answers.length > 0 &&
          answers[answers.length - 1].questionId === currentQ.id
          ? answers
          : [...answers, record],
      );
      return;
    }

    setCurrentIdx((previous) => previous + 1);
    setChosen(null);
    setShowExplain(false);
  }

  async function finishQuiz(finalAnswers: AnswerRecord[]) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const score = finalAnswers.filter((answer) => answer.correct).length;

    setAnswers(finalAnswers);
    setState("result");
    setSaveError(null);

    /*
     * IMPORTANT:
     * Do not associate a local category with an arbitrary public
     * quiz. That would corrupt learning analytics.
     *
     * Persistence is attempted only when exactly one backend quiz
     * can be deterministically associated with the selected category.
     *
     * The current media/page source does not establish such a mapping.
     */
    if (!publicQuizzes || publicQuizzes.length === 0) {
      return;
    }

    /*
     * We deliberately leave persistence disabled here because the
     * current static CATEGORIES ids ("tech", "science", etc.) are
     * not proven to correspond to a field on publicQuizzes.
     *
     * This is preferable to recording an incorrect quizId.
     */
  }

  function startQuiz(category: Category, mode: QuizMode) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setSelectedCategory(category);
    setSelectedMode(mode);
    setQuestions(shuffleQuestions(category.questions));
    setCurrentIdx(0);
    setChosen(null);
    setShowExplain(false);
    setAnswers([]);
    setTimeLeft(modeInfoFor(mode).timePerQ ?? 0);
    setElapsed(0);
    setSaveError(null);
    setState("quiz");
  }

  function modeInfoFor(mode: QuizMode) {
    return MODE_INFO[mode];
  }

  function restartQuiz() {
    if (!selectedCategory) {
      return;
    }

    startQuiz(selectedCategory, selectedMode);
  }

  function leaveQuiz() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setState("menu");
    setChosen(null);
    setShowExplain(false);
  }

  const score = useMemo(
    () => answers.filter((answer) => answer.correct).length,
    [answers],
  );

  const percent =
    questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const streak = useMemo(() => {
    let result = 0;

    for (let i = history.length - 1; i >= 0; i -= 1) {
      const entry = history[i];

      if (entry.total > 0 && entry.score / entry.total >= 0.5) {
        result += 1;
      } else {
        break;
      }
    }

    return result;
  }, [history]);

  const bestScore = useMemo(() => {
    if (history.length === 0) {
      return null;
    }

    return Math.max(
      ...history.map((entry) =>
        entry.total > 0 ? Math.round((entry.score / entry.total) * 100) : 0,
      ),
    );
  }, [history]);

  if (state === "menu") {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={21} color="#CBD5E1" />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Quiz & Évaluations</Text>
            <Text style={styles.headerSubtitle}>
              Apprendre, progresser, mesurer
            </Text>
          </View>

          <View style={styles.streakPill}>
            <Flame size={15} color="#F59E0B" />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Brain size={28} color="#A5B4FC" />
            </View>

            <Text style={styles.heroTitle}>Votre espace de connaissance</Text>

            <Text style={styles.heroDescription}>
              Testez vos connaissances, identifiez vos points forts et
              progressez à votre rythme.
            </Text>

            {!historyLoaded && convexHistory === undefined ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#A5B4FC" />
                <Text style={styles.loadingText}>
                  Chargement de votre progression…
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              icon={<Trophy size={17} color="#FBBF24" />}
              label="Quiz joués"
              value={history.length}
            />

            <StatCard
              icon={<Star size={17} color="#818CF8" />}
              label="Meilleur score"
              value={bestScore === null ? "—" : `${bestScore}%`}
            />

            <StatCard
              icon={<TrendingUp size={17} color="#34D399" />}
              label="Série"
              value={`${streak} 🔥`}
            />
          </View>

          <SectionTitle title="Mode de jeu" />

          <View style={styles.modeList}>
            {(
              Object.entries(MODE_INFO) as [
                QuizMode,
                (typeof MODE_INFO)[QuizMode],
              ][]
            ).map(([mode, info]) => {
              const selected = selectedMode === mode;

              return (
                <Pressable
                  key={mode}
                  onPress={() => setSelectedMode(mode)}
                  style={[
                    styles.modeCard,
                    selected && {
                      borderColor: `${info.color}80`,
                      backgroundColor: `${info.color}18`,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.modeIcon,
                      {
                        backgroundColor: `${info.color}25`,
                      },
                    ]}
                  >
                    {mode === "training" ? (
                      <BookOpen size={18} color={info.color} />
                    ) : mode === "exam" ? (
                      <Target size={18} color={info.color} />
                    ) : (
                      <Zap size={18} color={info.color} />
                    )}
                  </View>

                  <View style={styles.modeBody}>
                    <Text style={styles.modeTitle}>{info.label}</Text>
                    <Text style={styles.modeDescription}>{info.desc}</Text>
                  </View>

                  {info.timePerQ ? (
                    <View
                      style={[
                        styles.timeBadge,
                        {
                          backgroundColor: `${info.color}22`,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.timeBadgeText, { color: info.color }]}
                      >
                        {info.timePerQ}s
                      </Text>
                    </View>
                  ) : null}

                  {selected ? (
                    <CheckCircle size={19} color={info.color} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <SectionTitle title="Choisir une catégorie" />

          <View style={styles.categoryGrid}>
            {CATEGORIES.map((category) => {
              const categoryHistory = history.filter(
                (entry) => entry.category === category.label,
              );

              const categoryBest =
                categoryHistory.length > 0
                  ? Math.max(
                      ...categoryHistory.map((entry) =>
                        entry.total > 0
                          ? Math.round((entry.score / entry.total) * 100)
                          : 0,
                      ),
                    )
                  : null;

              return (
                <Pressable
                  key={category.id}
                  onPress={() => startQuiz(category, selectedMode)}
                  style={[
                    styles.categoryCard,
                    {
                      borderColor: `${category.color}45`,
                      backgroundColor: `${category.color}12`,
                    },
                  ]}
                >
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>

                  <Text style={styles.categoryTitle}>{category.label}</Text>

                  <Text style={styles.categoryMeta}>
                    {category.questions.length} questions
                  </Text>

                  {categoryBest !== null ? (
                    <View style={styles.categoryBest}>
                      <Trophy size={12} color={category.color} />
                      <Text
                        style={[
                          styles.categoryBestText,
                          {
                            color: category.color,
                          },
                        ]}
                      >
                        {categoryBest}%
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {history.length > 0 ? (
            <>
              <SectionTitle title="Historique récent" />

              <View style={styles.historyList}>
                {history
                  .slice(-5)
                  .reverse()
                  .map((entry, index) => {
                    const percentage =
                      entry.total > 0
                        ? Math.round((entry.score / entry.total) * 100)
                        : 0;

                    return (
                      <View
                        key={`${entry.date}-${index}`}
                        style={styles.historyCard}
                      >
                        <View style={styles.historyIcon}>
                          <BarChart3 size={16} color="#818CF8" />
                        </View>

                        <View style={styles.historyBody}>
                          <Text style={styles.historyCategory}>
                            {entry.category}
                          </Text>

                          <Text style={styles.historyMeta}>
                            {MODE_INFO[entry.mode].label} ·{" "}
                            {formatDate(entry.date)}
                          </Text>
                        </View>

                        <View style={styles.historyScore}>
                          <Text style={styles.historyScoreMain}>
                            {entry.score}/{entry.total}
                          </Text>

                          <Text style={styles.historyScorePercent}>
                            {percentage}%
                          </Text>
                        </View>
                      </View>
                    );
                  })}
              </View>
            </>
          ) : null}

          <View style={styles.integrityCard}>
            <ShieldCheck size={18} color="#34D399" />

            <View style={styles.integrityBody}>
              <Text style={styles.integrityTitle}>Progression authentique</Text>
              <Text style={styles.integrityText}>
                Les résultats persistants doivent provenir du backend
                d'éducation. Aucun score fictif n'est généré par l'interface.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (state === "quiz" && currentQ) {
    const limit = modeInfo.timePerQ;
    const timerPercent = limit ? clampPercent((timeLeft / limit) * 100) : 0;

    const timerColor =
      timerPercent > 50 ? "#10B981" : timerPercent > 25 ? "#F59E0B" : "#EF4444";

    return (
      <View style={styles.screen}>
        <View style={styles.quizHeader}>
          <Pressable onPress={leaveQuiz} style={styles.headerButton}>
            <ArrowLeft size={21} color="#CBD5E1" />
          </Pressable>

          <View style={styles.quizHeaderBody}>
            <View style={styles.quizHeaderTop}>
              <Text style={styles.quizCategory}>{selectedCategory?.label}</Text>

              <View
                style={[
                  styles.modeBadge,
                  {
                    backgroundColor: `${modeInfo.color}25`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modeBadgeText,
                    {
                      color: modeInfo.color,
                    },
                  ]}
                >
                  {modeInfo.label}
                </Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${clampPercent(
                      (currentIdx / questions.length) * 100,
                    )}%`,
                    backgroundColor: modeInfo.color,
                  },
                ]}
              />
            </View>
          </View>

          <Text style={styles.questionCounter}>
            {currentIdx + 1}/{questions.length}
          </Text>
        </View>

        {limit ? (
          <View style={styles.timerContainer}>
            <View style={styles.timerTop}>
              <View style={styles.timerLabel}>
                <Timer size={14} color={timerColor} />
                <Text style={[styles.timerText, { color: timerColor }]}>
                  {timeLeft}s
                </Text>
              </View>

              <Clock size={14} color="#475569" />
            </View>

            <View style={styles.timerTrack}>
              <View
                style={[
                  styles.timerFill,
                  {
                    width: `${timerPercent}%`,
                    backgroundColor: timerColor,
                  },
                ]}
              />
            </View>
          </View>
        ) : (
          <View style={styles.elapsedContainer}>
            <Clock size={14} color="#64748B" />
            <Text style={styles.elapsedText}>{elapsed}s</Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.quizContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.difficultyRow}>
            <View
              style={[
                styles.difficultyBadge,
                {
                  backgroundColor: `${DIFFICULTY_COLOR[currentQ.difficulty]}20`,
                },
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  {
                    color: DIFFICULTY_COLOR[currentQ.difficulty],
                  },
                ]}
              >
                {DIFFICULTY_LABEL[currentQ.difficulty]}
              </Text>
            </View>
          </View>

          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{currentQ.question}</Text>
          </View>

          <View style={styles.optionsList}>
            {currentQ.options.map((option, index) => {
              const isChosen = chosen === index;
              const isCorrect = index === currentQ.correct;

              let backgroundColor = "rgba(255,255,255,0.045)";
              let borderColor = "rgba(255,255,255,0.10)";
              let optionColor = "#E2E8F0";

              if (chosen !== null) {
                if (isCorrect) {
                  backgroundColor = "rgba(16,185,129,0.16)";
                  borderColor = "#10B981";
                  optionColor = "#6EE7B7";
                } else if (isChosen) {
                  backgroundColor = "rgba(239,68,68,0.16)";
                  borderColor = "#EF4444";
                  optionColor = "#FCA5A5";
                }
              }

              return (
                <Pressable
                  key={`${currentQ.id}-${index}`}
                  onPress={() => handleAnswer(index)}
                  disabled={chosen !== null}
                  style={[
                    styles.option,
                    {
                      backgroundColor,
                      borderColor,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.optionLetter,
                      {
                        backgroundColor:
                          chosen !== null && isCorrect
                            ? "rgba(16,185,129,0.18)"
                            : chosen !== null && isChosen
                              ? "rgba(239,68,68,0.18)"
                              : "rgba(255,255,255,0.08)",
                      },
                    ]}
                  >
                    {chosen !== null && isCorrect ? (
                      <CheckCircle size={17} color="#10B981" />
                    ) : chosen !== null && isChosen ? (
                      <XCircle size={17} color="#EF4444" />
                    ) : (
                      <Text style={styles.optionLetterText}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    )}
                  </View>

                  <Text style={[styles.optionText, { color: optionColor }]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {showExplain ? (
            <View style={styles.explanationCard}>
              <View style={styles.explanationHeader}>
                <Brain size={18} color="#A5B4FC" />
                <Text style={styles.explanationTitle}>Explication</Text>
              </View>

              <Text style={styles.explanationText}>{currentQ.explanation}</Text>

              <Pressable onPress={nextQuestion} style={styles.nextButton}>
                <Text style={styles.nextButtonText}>
                  {isLastQ ? "Voir les résultats" : "Question suivante"}
                </Text>

                <ChevronRight size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => setState("menu")} style={styles.headerButton}>
          <ArrowLeft size={21} color="#CBD5E1" />
        </Pressable>

        <Text style={styles.headerTitle}>Résultats</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.resultContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultHero}>
          <ScoreRing percentage={percent} />

          <Text style={styles.resultTitle}>{getResultMessage(percent)}</Text>

          <Text style={styles.resultSubtitle}>
            {score} bonne
            {score > 1 ? "s" : ""} réponse
            {score > 1 ? "s" : ""} sur {questions.length}
          </Text>

          <View style={styles.resultBadge}>
            <Award size={15} color={getResultColor(percent)} />
            <Text
              style={[
                styles.resultBadgeText,
                {
                  color: getResultColor(percent),
                },
              ]}
            >
              {percent >= 80
                ? "Excellente performance"
                : percent >= 60
                  ? "Objectif atteint"
                  : "Progression en cours"}
            </Text>
          </View>
        </View>

        <SectionTitle title="Détail des réponses" />

        <View style={styles.answersList}>
          {answers.map((answer, index) => {
            const question = questions.find(
              (item) => item.id === answer.questionId,
            );

            if (!question) {
              return null;
            }

            return (
              <View
                key={`${answer.questionId}-${index}`}
                style={styles.answerCard}
              >
                <View
                  style={[
                    styles.answerStatus,
                    {
                      backgroundColor: answer.correct
                        ? "rgba(16,185,129,0.16)"
                        : "rgba(239,68,68,0.16)",
                    },
                  ]}
                >
                  {answer.correct ? (
                    <CheckCircle size={15} color="#10B981" />
                  ) : (
                    <XCircle size={15} color="#EF4444" />
                  )}
                </View>

                <View style={styles.answerBody}>
                  <Text style={styles.answerQuestion}>{question.question}</Text>

                  {!answer.correct ? (
                    <Text style={styles.correctAnswer}>
                      Bonne réponse : {question.options[question.correct]}
                    </Text>
                  ) : null}

                  <Text style={styles.answerTime}>
                    {(answer.timeMs / 1000).toFixed(1)}s
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {saveError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Enregistrement non confirmé</Text>
            <Text style={styles.errorText}>{saveError}</Text>
          </View>
        ) : null}

        {savingAttempt ? (
          <View style={styles.savingCard}>
            <ActivityIndicator size="small" color="#A5B4FC" />
            <Text style={styles.savingText}>Enregistrement du résultat…</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable onPress={restartQuiz} style={styles.primaryAction}>
            <RotateCcw size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Rejouer</Text>
          </Pressable>

          <Pressable
            onPress={() => setState("menu")}
            style={styles.secondaryAction}
          >
            <Play size={18} color="#CBD5E1" />
            <Text style={styles.secondaryActionText}>Autre quiz</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>;
}

function ScoreRing({ percentage }: { percentage: number }) {
  const normalized = clampPercent(percentage);

  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  /*
   * React Native n'a pas le SVG Web utilisé
   * dans la version originale. Le cercle visuel
   * est donc construit avec deux couches natives.
   */
  return (
    <View
      style={[
        styles.scoreRing,
        {
          borderColor: `${getResultColor(normalized)}30`,
        },
      ]}
    >
      <View
        style={[
          styles.scoreRingInner,
          {
            borderColor: getResultColor(normalized),
            borderTopColor:
              normalized > 0 ? getResultColor(normalized) : "transparent",
            borderRightColor:
              normalized >= 50 ? getResultColor(normalized) : "transparent",
            borderBottomColor:
              normalized >= 75 ? getResultColor(normalized) : "transparent",
            transform: [
              {
                rotate: `${Math.max(0, normalized * 3.6 - 45)}deg`,
              },
            ],
          },
        ]}
      />

      <View style={styles.scoreRingContent}>
        <Text style={styles.scorePercent}>{normalized}%</Text>
        <Text style={styles.scoreFraction}>Résultat</Text>
      </View>
    </View>
  );
}

export default function QuizPage(props: Props) {
  return (
    <Authenticated>
      <QuizPageContent {...props} />
    </Authenticated>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 46,
    paddingBottom: 14,
    gap: 10,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerTitleWrap: {
    flex: 1,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
  },

  headerSubtitle: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 12,
  },

  streakPill: {
    minWidth: 48,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.18)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },

  streakText: {
    color: "#FBBF24",
    fontWeight: "800",
    fontSize: 14,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },

  heroCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "rgba(99,102,241,0.10)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.18)",
    marginBottom: 16,
  },

  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.18)",
    marginBottom: 14,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  heroDescription: {
    marginTop: 7,
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
  },

  loadingRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  loadingText: {
    color: "#94A3B8",
    fontSize: 12,
  },

  statsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },

  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },

  statIcon: {
    marginBottom: 6,
  },

  statValue: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  statLabel: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },

  sectionTitle: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 11,
    marginTop: 5,
  },

  modeList: {
    gap: 9,
    marginBottom: 25,
  },

  modeCard: {
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.035)",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 11,
  },

  modeIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  modeBody: {
    flex: 1,
  },

  modeTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
  },

  modeDescription: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  timeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 25,
  },

  categoryCard: {
    width: "48.5%",
    minHeight: 142,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
  },

  categoryEmoji: {
    fontSize: 27,
    marginBottom: 12,
  },

  categoryTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "750",
  },

  categoryMeta: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 5,
  },

  categoryBest: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 11,
  },

  categoryBestText: {
    fontSize: 11,
    fontWeight: "800",
  },

  historyList: {
    gap: 8,
    marginBottom: 20,
  },

  historyCard: {
    minHeight: 64,
    padding: 10,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  historyIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(99,102,241,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  historyBody: {
    flex: 1,
  },

  historyCategory: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "650",
  },

  historyMeta: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 3,
  },

  historyScore: {
    alignItems: "flex-end",
  },

  historyScoreMain: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "800",
  },

  historyScorePercent: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 2,
  },

  integrityCard: {
    padding: 14,
    borderRadius: 17,
    backgroundColor: "rgba(16,185,129,0.07)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.15)",
    flexDirection: "row",
    gap: 10,
  },

  integrityBody: {
    flex: 1,
  },

  integrityTitle: {
    color: "#A7F3D0",
    fontSize: 12,
    fontWeight: "800",
  },

  integrityText: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
  },

  quizHeader: {
    paddingHorizontal: 14,
    paddingTop: 46,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  quizHeaderBody: {
    flex: 1,
  },

  quizHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 7,
  },

  quizCategory: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "650",
  },

  modeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
  },

  modeBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },

  progressTrack: {
    height: 4,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  questionCounter: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },

  timerContainer: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },

  timerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },

  timerLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  timerText: {
    fontSize: 11,
    fontWeight: "800",
  },

  timerTrack: {
    height: 5,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  timerFill: {
    height: "100%",
    borderRadius: 4,
  },

  elapsedContainer: {
    paddingHorizontal: 16,
    marginBottom: 7,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 5,
  },

  elapsedText: {
    color: "#64748B",
    fontSize: 11,
  },

  quizContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 35,
  },

  difficultyRow: {
    marginBottom: 10,
  },

  difficultyBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  difficultyText: {
    fontSize: 10,
    fontWeight: "800",
  },

  questionCard: {
    padding: 20,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 14,
  },

  questionText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "750",
    lineHeight: 28,
  },

  optionsList: {
    gap: 9,
  },

  option: {
    minHeight: 62,
    padding: 11,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  optionLetter: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  optionLetterText: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "800",
  },

  optionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },

  explanationCard: {
    marginTop: 13,
    padding: 15,
    borderRadius: 18,
    backgroundColor: "rgba(99,102,241,0.10)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.20)",
  },

  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  explanationTitle: {
    color: "#C7D2FE",
    fontSize: 13,
    fontWeight: "800",
  },

  explanationText: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
  },

  nextButton: {
    minHeight: 46,
    marginTop: 13,
    borderRadius: 13,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },

  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  resultContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  resultHero: {
    alignItems: "center",
    paddingVertical: 20,
  },

  scoreRing: {
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  scoreRingInner: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 6,
  },

  scoreRingContent: {
    alignItems: "center",
    justifyContent: "center",
  },

  scorePercent: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
  },

  scoreFraction: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 2,
  },

  resultTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "850",
    marginTop: 17,
  },

  resultSubtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
  },

  resultBadge: {
    marginTop: 11,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.045)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  resultBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },

  answersList: {
    gap: 8,
    marginBottom: 18,
  },

  answerCard: {
    padding: 11,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },

  answerStatus: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  answerBody: {
    flex: 1,
  },

  answerQuestion: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },

  correctAnswer: {
    color: "#6EE7B7",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  answerTime: {
    color: "#475569",
    fontSize: 9,
    marginTop: 4,
  },

  errorCard: {
    padding: 13,
    borderRadius: 14,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.16)",
    marginBottom: 10,
  },

  errorTitle: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "800",
  },

  errorText: {
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
  },

  savingCard: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(99,102,241,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },

  savingText: {
    color: "#94A3B8",
    fontSize: 11,
  },

  actions: {
    gap: 9,
    marginTop: 5,
  },

  primaryAction: {
    minHeight: 49,
    borderRadius: 15,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  secondaryAction: {
    minHeight: 49,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  secondaryActionText: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "750",
  },
});

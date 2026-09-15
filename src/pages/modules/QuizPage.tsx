import { View, Pressable, Text } from "react-native";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "motion/react";
import {
  ArrowLeft, Brain, Timer, Trophy, Star, Zap, Target, CheckCircle,
  XCircle, RotateCcw, Play, ChevronRight, Medal, TrendingUp, BookOpen,
  Clock, Award, Flame, BarChart2
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated } from "@/lib/convex-auth-compat";

type Props = { onBack: () => void };

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

const CATEGORIES: Category[] = [
  {
    id: "tech",
    label: "Technologie",
    icon: "💻",
    color: "#6366F1",
    questions: [
      {
        id: 1,
        question: "Quel langage est principalement utilisé pour le développement web front-end ?",
        options: ["Python", "JavaScript", "Java", "C++"],
        correct: 1,
        explanation: "JavaScript est le langage standard du navigateur, utilisé pour rendre les pages web interactives.",
        difficulty: "easy",
      },
      {
        id: 2,
        question: "Que signifie l'acronyme HTML ?",
        options: ["Hyper Text Markup Language", "High Text Modern Language", "Hyper Transfer Markup Logic", "Hyper Text Modern Logic"],
        correct: 0,
        explanation: "HTML (HyperText Markup Language) est le langage de balisage standard pour créer des pages web.",
        difficulty: "easy",
      },
      {
        id: 3,
        question: "Quel protocole est utilisé pour sécuriser les communications sur Internet ?",
        options: ["HTTP", "FTP", "HTTPS", "SMTP"],
        correct: 2,
        explanation: "HTTPS (HTTP Secure) utilise le chiffrement TLS/SSL pour sécuriser la transmission des données.",
        difficulty: "medium",
      },
      {
        id: 4,
        question: "Qu'est-ce qu'une API REST ?",
        options: ["Un langage de programmation", "Une interface de programmation utilisant HTTP", "Un type de base de données", "Un framework CSS"],
        correct: 1,
        explanation: "Une API REST est une interface qui utilise les méthodes HTTP (GET, POST, PUT, DELETE) pour communiquer.",
        difficulty: "medium",
      },
      {
        id: 5,
        question: "Quel algorithme est utilisé pour le chiffrement asymétrique ?",
        options: ["AES", "SHA-256", "RSA", "MD5"],
        correct: 2,
        explanation: "RSA est un algorithme de chiffrement asymétrique largement utilisé pour sécuriser les communications.",
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
        explanation: "L'eau est composée de deux atomes d'hydrogène et un atome d'oxygène, soit H₂O.",
        difficulty: "easy",
      },
      {
        id: 7,
        question: "Quelle est la vitesse de la lumière dans le vide ?",
        options: ["300 000 km/s", "150 000 km/s", "600 000 km/s", "30 000 km/s"],
        correct: 0,
        explanation: "La vitesse de la lumière dans le vide est d'environ 299 792 458 m/s, soit ~300 000 km/s.",
        difficulty: "easy",
      },
      {
        id: 8,
        question: "Quel organe produit l'insuline ?",
        options: ["Le foie", "Le rein", "Le pancréas", "La rate"],
        correct: 2,
        explanation: "Le pancréas produit l'insuline, une hormone qui régule le taux de glucose dans le sang.",
        difficulty: "medium",
      },
      {
        id: 9,
        question: "Combien d'atomes y a-t-il dans une mole de substance ?",
        options: ["6,02 × 10²²", "6,02 × 10²³", "6,02 × 10²⁴", "6,02 × 10²¹"],
        correct: 1,
        explanation: "Le nombre d'Avogadro est 6,022 × 10²³ entités par mole.",
        difficulty: "hard",
      },
      {
        id: 10,
        question: "Quel est l'élément chimique le plus abondant dans l'univers ?",
        options: ["Oxygène", "Carbone", "Hélium", "Hydrogène"],
        correct: 3,
        explanation: "L'hydrogène représente environ 75% de la masse baryonique de l'univers.",
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
        explanation: "La Révolution française a commencé en 1789 avec la prise de la Bastille le 14 juillet.",
        difficulty: "easy",
      },
      {
        id: 12,
        question: "Qui était le premier président des États-Unis ?",
        options: ["Thomas Jefferson", "Benjamin Franklin", "George Washington", "John Adams"],
        correct: 2,
        explanation: "George Washington fut le premier président des États-Unis, de 1789 à 1797.",
        difficulty: "easy",
      },
      {
        id: 13,
        question: "En quelle année Christophe Colomb a-t-il découvert l'Amérique ?",
        options: ["1488", "1492", "1498", "1502"],
        correct: 1,
        explanation: "Christophe Colomb a atteint les Amériques le 12 octobre 1492.",
        difficulty: "easy",
      },
      {
        id: 14,
        question: "Quelle civilisation a construit les pyramides de Gizeh ?",
        options: ["Sumérienne", "Grecque", "Romaine", "Égyptienne"],
        correct: 3,
        explanation: "Les pyramides de Gizeh ont été construites par les anciens Égyptiens il y a environ 4500 ans.",
        difficulty: "easy",
      },
      {
        id: 15,
        question: "Quel traité a mis fin à la Première Guerre mondiale ?",
        options: ["Traité de Paris", "Traité de Versailles", "Traité de Berlin", "Traité de Rome"],
        correct: 1,
        explanation: "Le Traité de Versailles, signé le 28 juin 1919, a officiellement mis fin à la Première Guerre mondiale.",
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
        explanation: "Canberra est la capitale fédérale de l'Australie depuis 1913.",
        difficulty: "medium",
      },
      {
        id: 17,
        question: "Quel est le plus long fleuve du monde ?",
        options: ["L'Amazone", "Le Nil", "Le Mississippi", "Le Yangtsé"],
        correct: 1,
        explanation: "Le Nil, avec environ 6650 km de longueur, est généralement considéré comme le plus long fleuve du monde.",
        difficulty: "easy",
      },
      {
        id: 18,
        question: "Combien de pays composent le continent africain ?",
        options: ["45", "52", "54", "58"],
        correct: 2,
        explanation: "L'Afrique est composée de 54 pays reconnus par les Nations Unies.",
        difficulty: "medium",
      },
      {
        id: 19,
        question: "Quelle est la montagne la plus haute du monde ?",
        options: ["K2", "Kangchenjunga", "Mont Blanc", "Everest"],
        correct: 3,
        explanation: "L'Everest, avec 8848 m d'altitude, est le plus haut sommet du monde.",
        difficulty: "easy",
      },
      {
        id: 20,
        question: "Dans quel pays se trouve Machu Picchu ?",
        options: ["Bolivie", "Pérou", "Équateur", "Colombie"],
        correct: 1,
        explanation: "Machu Picchu est une cité inca située dans les Andes péruviennes.",
        difficulty: "easy",
      },
    ],
  },
];

const MODE_INFO: Record<QuizMode, { label: string; desc: string; color: string; icon: React.ReactNode; timePerQ?: number }> = {
  training: { label: "Entraînement", desc: "Prenez votre temps, lisez les explications", color: "#10B981", icon: <BookOpen size={16} />, timePerQ: undefined },
  exam: { label: "Examen Blanc", desc: "30 secondes par question, pas d'indices", color: "#6366F1", icon: <Target size={16} />, timePerQ: 30 },
  challenge: { label: "Défi Chronométré", desc: "15 secondes max ! Répondez vite", color: "#F59E0B", icon: <Zap size={16} />, timePerQ: 15 },
};

type AnswerRecord = { questionId: number; chosen: number; correct: boolean; timeMs: number };

const HISTORY_KEY = "quiz_history";
type HistoryEntry = { date: string; category: string; mode: QuizMode; score: number; total: number };

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as HistoryEntry[]; }
  catch { return []; }
}
function saveHistory(h: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-50)));
}

export default function QuizPage({ onBack }: Props) {
  const [state, setState] = useState<QuizState>("menu");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedMode, setSelectedMode] = useState<QuizMode>("training");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [showExplain, setShowExplain] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  const convexHistory = useQuery(api.education.getMyQuizAttempts, {});
  const submitAttempt = useMutation(api.education.submitQuizAttempt);
  const publicQuizzes = useQuery(api.education.listPublicQuizzes, {});

  const currentQ = questions[currentIdx];
  const modeInfo = MODE_INFO[selectedMode];
  const isLastQ = currentIdx === questions.length - 1;

  // Timer logic
  useEffect(() => {
    if (state !== "quiz") return;
    startRef.current = Date.now();
    const limit = modeInfo.timePerQ;
    if (limit) {
      setTimeLeft(limit);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            // Auto-advance on timeout
            handleTimeout();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, state]);

  function handleTimeout() {
    if (timerRef.current) clearInterval(timerRef.current);
    const timeMs = (modeInfo.timePerQ ?? 0) * 1000;
    setAnswers((prev) => [...prev, { questionId: currentQ.id, chosen: -1, correct: false, timeMs }]);
    setChosen(-1);
    if (selectedMode === "challenge") advanceOrFinish(-1, timeMs);
  }

  function handleAnswer(idx: number) {
    if (chosen !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const timeMs = Date.now() - startRef.current;
    const isCorrect = idx === currentQ.correct;
    const record: AnswerRecord = { questionId: currentQ.id, chosen: idx, correct: isCorrect, timeMs };
    setAnswers((prev) => [...prev, record]);
    setChosen(idx);
    if (selectedMode === "training") {
      setShowExplain(true);
    } else {
      setTimeout(() => advanceOrFinish(idx, timeMs), 800);
    }
  }

  function advanceOrFinish(idx: number, _timeMs: number) {
    if (isLastQ) {
      finishQuiz([...answers, { questionId: currentQ.id, chosen: idx, correct: idx === currentQ.correct, timeMs: _timeMs }]);
    } else {
      setCurrentIdx((i) => i + 1);
      setChosen(null);
      setShowExplain(false);
    }
  }

  function nextQuestion() {
    if (isLastQ) {
      finishQuiz(answers);
    } else {
      setCurrentIdx((i) => i + 1);
      setChosen(null);
      setShowExplain(false);
    }
  }

  function finishQuiz(finalAnswers: AnswerRecord[]) {
    if (timerRef.current) clearInterval(timerRef.current);
    const score = finalAnswers.filter((a) => a.correct).length;
    const entry: HistoryEntry = {
      date: new Date().toISOString(),
      category: selectedCategory?.label ?? "",
      mode: selectedMode,
      score,
      total: questions.length,
    };
    const updated = [...history, entry];
    setHistory(updated);
    saveHistory(updated);
    setAnswers(finalAnswers);
    setState("result");
    // Persist to Convex using the first public quiz if available
    if (publicQuizzes && publicQuizzes.length > 0) {
      const pctScore = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
      submitAttempt({
        quizId: publicQuizzes[0]._id,
        answers: finalAnswers.map((a) => a.chosen),
        score: pctScore,
        passed: pctScore >= 60,
      }).catch(() => { /* graceful */ });
    }
  }

  function startQuiz(cat: Category, mode: QuizMode) {
    setSelectedCategory(cat);
    setSelectedMode(mode);
    const shuffled = [...cat.questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIdx(0);
    setChosen(null);
    setShowExplain(false);
    setAnswers([]);
    setState("quiz");
  }

  function restartQuiz() {
    if (!selectedCategory) return;
    startQuiz(selectedCategory, selectedMode);
  }

  const score = answers.filter((a) => a.correct).length;
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;

  // Streak from history
  const streak = (() => {
    let s = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].score / history[i].total >= 0.5) s++;
      else break;
    }
    return s;
  })();

  // --- MENU ---
  if (state === "menu") {
    return (
      <View className="h-full flex flex-col overflow-hidden" style={{  }}>{}<View className="flex items-center gap-3 px-4 pt-12 pb-4"><Pressable onPress={onBack} className="p-2 rounded-xl text-white/60"><ArrowLeft size={20} /></Pressable><View className="flex-1"><Text className="text-white font-bold text-xl">Quiz & Évaluations</Text><Text className="text-white/50 text-xs">Testez vos connaissances</Text></View><View className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(251,191,36,0.15)" }}><Flame size={14} className="text-amber-400" /><Text className="text-amber-400 font-bold text-sm">{streak}</Text></View></View><View className="flex-1 overflow-y-auto px-4 pb-6 space-y-6">{}<View className="gap-3">{[
              { icon: <Trophy size={16} className="text-yellow-400" />, label: "Quiz joués", value: history.length },
              { icon: <Star size={16} className="text-indigo-400" />, label: "Meilleur score", value: history.length ? `${Math.max(...history.map((h) => Math.round((h.score / h.total) * 100)))}%` : "—" },
              { icon: <TrendingUp size={16} className="text-emerald-400" />, label: "Série", value: `${streak} 🔥` },
            ].map((s) => (
              <View key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <View className="flex justify-center mb-1">{s.icon}</View>
                <View className="text-white font-bold text-lg">{s.value}</View>
                <View className="text-white/40 text-xs">{s.label}</View>
              </View>
            ))}</View>{}<View><Text className="text-white/70 text-sm font-semibold mb-3 uppercase tracking-wider">Mode de jeu</Text><View className="space-y-2">{(Object.entries(MODE_INFO) as [QuizMode, typeof MODE_INFO[QuizMode]][]).map(([mode, info]) => (
                <Pressable key={mode} whileTap={{ scale: 0.98 }} onPress={() => setSelectedMode(mode)} className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all" style={{ backgroundColor: selectedMode === mode ? `${info.color}22` : "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                  <View className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${info.color}33` }}><Text style={{ color: info.color }}>{info.icon}</Text></View>
                  <View className="flex-1 text-left"><View className="text-white font-semibold text-sm">{info.label}</View><View className="text-white/40 text-xs">{info.desc}</View></View>
                  {info.timePerQ && (
                    <Badge style={{ backgroundColor: `${info.color}33` }} className="text-xs border-0">
                      {info.timePerQ}s
                    </Badge>
                  )}
                  {selectedMode === mode && <CheckCircle size={16} style={{  }} />}
                </Pressable>
              ))}</View></View>{}<View><Text className="text-white/70 text-sm font-semibold mb-3 uppercase tracking-wider">Choisir une catégorie</Text><View className="gap-3">{CATEGORIES.map((cat) => {
                const catHistory = history.filter((h) => h.category === cat.label);
                const best = catHistory.length ? Math.max(...catHistory.map((h) => Math.round((h.score / h.total) * 100))) : null;
                return (
                  <Pressable key={cat.id} whileTap={{ scale: 0.96 }} onPress={() => startQuiz(cat, selectedMode)} className="p-4 rounded-2xl text-left" style={{ backgroundColor: `${cat.color}15`, borderStyle: "solid" }}>
                    <View className="text-3xl mb-2">{cat.icon}</View>
                    <View className="text-white font-semibold text-sm">{cat.label}</View>
                    <View className="text-white/40 text-xs mt-0.5">{cat.questions.length}<Text>questions</Text></View>
                    {best !== null && (
                      <View className="mt-2 flex items-center gap-1"><Trophy size={10} style={{  }} /><Text className="text-xs font-bold" style={{ color: cat.color }}>{best}%</Text></View>
                    )}
                  </Pressable>
                );
              })}</View></View>{}{history.length > 0 && (
            <View><Text className="text-white/70 text-sm font-semibold mb-3 uppercase tracking-wider">Historique récent</Text><View className="space-y-2">{history.slice(-5).reverse().map((h, i) => (
                  <View key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}><View className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(99,102,241,0.2)" }}><BarChart2 size={14} className="text-indigo-400" /></View><View className="flex-1 min-w-0"><View className="text-white text-sm font-medium">{h.category}</View><View className="text-white/40 text-xs">{MODE_INFO[h.mode].label}<Text>·</Text>{new Date(h.date).toLocaleDateString("fr-FR")}</View></View><View className="text-right"><View className="text-white font-bold text-sm">{h.score}<Text>/</Text>{h.total}</View><View className="text-white/40 text-xs">{Math.round((h.score / h.total) * 100)}<Text>%</Text></View></View></View>
                ))}</View></View>
          )}</View></View>
    );
  }

  // --- QUIZ ---
  if (state === "quiz" && currentQ) {
    const limit = modeInfo.timePerQ;
    const timerPct = limit ? (timeLeft / limit) * 100 : 0;
    const timerColor = timerPct > 50 ? "#10B981" : timerPct > 25 ? "#F59E0B" : "#EF4444";

    return (
      <View className="h-full flex flex-col overflow-hidden" style={{  }}>{}<View className="flex items-center gap-3 px-4 pt-12 pb-3"><Pressable onPress={() => setState("menu")} className="p-2 rounded-xl text-white/60"><ArrowLeft size={20} /></Pressable><View className="flex-1"><View className="flex items-center gap-2"><Text className="text-white/60 text-sm">{selectedCategory?.label}</Text><Badge className="text-xs border-0" style={{ backgroundColor: `${modeInfo.color}33` }}>{modeInfo.label}</Badge></View><Progress value={((currentIdx) / questions.length) * 100} className="h-1 mt-1.5" /></View><View className="text-white/60 text-sm font-mono">{currentIdx + 1}<Text>/</Text>{questions.length}</View></View>{}{limit ? (
          <View className="px-4 mb-2"><View className="flex items-center justify-between mb-1"><View className="flex items-center gap-1 text-xs" style={{  }}><Timer size={12} /><Text>{timeLeft}s</Text></View><Clock size={12} className="text-white/30" /></View><View className="h-1.5 rounded-full bg-white/10 overflow-hidden"><View className="h-full rounded-full" style={{ width: `${timerPct}%`, backgroundColor: timerColor }} transition={{ duration: 0.5 }} /></View></View>
        ) : (
          <View className="px-4 mb-2 flex justify-end"><View className="flex items-center gap-1 text-white/30 text-xs"><Clock size={12} /><Text>{elapsed}s</Text></View></View>
        )}<View className="flex-1 overflow-y-auto px-4 pb-6"><View><View key={currentIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>{}<View className="flex gap-2 mb-4"><Badge className="text-xs border-0" style={{ backgroundColor: currentQ.difficulty === "easy" ? "#10B98133" : currentQ.difficulty === "medium" ? "#F59E0B33" : "#EF444433" }}>{currentQ.difficulty === "easy" ? "Facile" : currentQ.difficulty === "medium" ? "Intermédiaire" : "Difficile"}</Badge></View>{}<View className="rounded-2xl p-5 mb-5" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><Text className="text-white font-semibold text-lg leading-relaxed">{currentQ.question}</Text></View>{}<View className="space-y-3">{currentQ.options.map((opt, i) => {
                  const isChosen = chosen === i;
                  const isCorrect = i === currentQ.correct;
                  let bg = "rgba(255,255,255,0.05)";
                  let border = "rgba(255,255,255,0.1)";
                  let textColor = "rgba(255,255,255,0.85)";
                  if (chosen !== null) {
                    if (isCorrect) { bg = "rgba(16,185,129,0.2)"; border = "#10B981"; textColor = "#10B981"; }
                    else if (isChosen) { bg = "rgba(239,68,68,0.2)"; border = "#EF4444"; textColor = "#EF4444"; }
                  }
                  return (
                    <Pressable key={i} whileTap={{ scale: 0.98 }} onPress={() => handleAnswer(i)} disabled={chosen !== null} className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all" style={{ backgroundColor: bg, borderStyle: "solid" }}>
                      <View className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ backgroundColor: chosen !== null && isCorrect ? "#10B98133" : chosen !== null && isChosen ? "#EF444433" : "rgba(255,255,255,0.1)" }}>{chosen !== null ? (isCorrect ? <CheckCircle size={16} color="#10B981" /> : isChosen ? <XCircle size={16} color="#EF4444" /> : String.fromCharCode(65 + i)) : String.fromCharCode(65 + i)}</View>
                      <Text className="font-medium">{opt}</Text>
                    </Pressable>
                  );
                })}</View>{}<AnimatePresence>{showExplain && (
                  <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: "rgba(99,102,241,0.15)", borderWidth: 1, borderColor: "rgba(99,102,241,0.3)", borderStyle: "solid" }}>
                    <View className="flex items-start gap-2"><Brain size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" /><Text className="text-white/80 text-sm leading-relaxed">{currentQ.explanation}</Text></View>
                    <Button onPress={nextQuestion} className="mt-3 w-full"
                      style={{ backgroundColor: "rgba(99,102,241,0.4)" }}>
                      {isLastQ ? "Voir les résultats" : "Question suivante"} <ChevronRight size={16} />
                    </Button>
                  </View>
                )}</AnimatePresence></View></View></View></View>
    );
  }

  // --- RESULT ---
  const badges = [
    pct === 100 && { icon: "🏆", label: "Parfait !", color: "#F59E0B" },
    pct >= 80 && pct < 100 && { icon: "⭐", label: "Excellent", color: "#6366F1" },
    pct >= 60 && pct < 80 && { icon: "👍", label: "Bien joué", color: "#10B981" },
    pct < 60 && { icon: "📚", label: "Continue !", color: "#06B6D4" },
  ].filter(Boolean);

  return (
    <View className="h-full flex flex-col overflow-hidden" style={{  }}><View className="flex items-center gap-3 px-4 pt-12 pb-4"><Pressable onPress={() => setState("menu")} className="p-2 rounded-xl text-white/60"><ArrowLeft size={20} /></Pressable><Text className="text-white font-bold text-xl">Résultats</Text></View><View className="flex-1 overflow-y-auto px-4 pb-6 space-y-5">{}<View initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" as const, stiffness: 200 }} className="flex flex-col items-center py-6"><View className="relative w-32 h-32"><svg className="w-full h-full -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" /><circle cx="50" cy="50" r="40" fill="none" stroke={pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444"} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${pct * 2.51} 251`} style={{  }} /></svg><View className="absolute inset-0 flex flex-col items-center justify-center"><Text className="text-white font-black text-3xl">{pct}%</Text><Text className="text-white/40 text-xs">{score}/{questions.length}</Text></View></View><View className="mt-3 text-white font-semibold text-lg">{pct >= 80 ? "Excellent travail !" : pct >= 60 ? "Bien joué !" : "Continuez à pratiquer"}</View><View className="flex gap-2 mt-2">{badges.map((b) => b && (
              <Text key={b.label} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${b.color}22`, color: b.color }}>{b.icon}{b.label}</Text>
            ))}</View></View>{}<View><Text className="text-white/70 text-sm font-semibold mb-3 uppercase tracking-wider">Détail des réponses</Text><View className="space-y-2">{answers.map((a, i) => {
              const q = questions.find((q) => q.id === a.questionId);
              if (!q) return null;
              return (
                <View key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}><View className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg mt-0.5" style={{ backgroundColor: a.correct ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)" }}>{a.correct ? <CheckCircle size={14} color="#10B981" /> : <XCircle size={14} color="#EF4444" />}</View><View className="flex-1 min-w-0"><Text className="text-white/80 text-sm leading-snug">{q.question}</Text>{!a.correct && (
                      <Text className="text-emerald-400 text-xs mt-1">Bonne réponse : {q.options[q.correct]}</Text>
                    )}<Text className="text-white/30 text-xs mt-0.5">{(a.timeMs / 1000).toFixed(1)}s</Text></View></View>
              );
            })}</View></View>{}<View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(99,102,241,0.1)", borderWidth: 1, borderColor: "rgba(99,102,241,0.2)", borderStyle: "solid" }}><View className="flex items-center gap-2 mb-3"><Award size={16} className="text-indigo-400" /><Text className="text-white font-semibold text-sm">Badges débloqués</Text></View><View className="flex flex-wrap gap-2">{pct >= 60 && <Text className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: "#10B98133", color: "#10B981" }}>🎯 Vainqueur</Text>}{pct === 100 && <Text className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: "#F59E0B33", color: "#F59E0B" }}>💯 Perfect Score</Text>}{selectedMode === "challenge" && <Text className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: "#F59E0B33", color: "#F59E0B" }}>⚡ Speed Runner</Text>}{selectedMode === "exam" && pct >= 70 && <Text className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: "#6366F133", color: "#6366F1" }}>📋 Certifié</Text>}{streak >= 3 && <Text className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: "#EF444433", color: "#EF4444" }}>🔥 En série</Text>}</View></View>{}<View className="gap-3"><Button onPress={restartQuiz} className="flex items-center gap-2" style={{ backgroundColor: "rgba(99,102,241,0.3)" }}><RotateCcw size={16} />Rejouer
          </Button><Button onPress={() => setState("menu")} className="flex items-center gap-2" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><Play size={16} />Autre quiz
          </Button></View></View></View>
  );
}

import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { Brain, Check, X, ChevronRight, Trophy, Loader2 } from "lucide-react-native";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface Props {
  quiz: {
    id: string;
    title: string;
    description?: string;
    questions: QuizQuestion[];
  };
  onComplete: (results: { score: number; total: number }) => Promise<void>;
}

export function CommunityQuiz({ quiz, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const handleSelectOption = (index: number) => {
    if (selectedOption !== null || isCompleted) return;
    setSelectedOption(index);
    const correct = index === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    if (correct) setScore(score + 1);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Fin du quiz
      setIsCompleted(true);
      setIsSubmitting(true);
      onComplete({ score, total: totalQuestions }).finally(() => {
        setIsSubmitting(false);
      });
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsCorrect(null);
      setShowExplanation(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setScore(0);
    setIsCompleted(false);
    setShowExplanation(false);
  };

  if (isCompleted) {
    const percentage = Math.round((score / totalQuestions) * 100);
    const isPassed = percentage >= 70;

    return (
      <View className="space-y-4"><View className="flex items-center gap-2"><Trophy size={16} className="text-yellow-400" /><Text className="text-sm font-medium text-white/50">Résultats</Text></View><View className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center"><View className="text-4xl font-bold text-white mb-2">{score}<Text>/</Text>{totalQuestions}</View><View className="text-lg font-medium text-white/80 mb-1">{percentage}<Text>%</Text></View><View className="text-sm text-white/50">{isPassed
              ? "✅ Félicitations, vous avez réussi !"
              : "❌ Vous pouvez réessayer pour améliorer votre score"}</View>{isSubmitting && (
            <View className="flex items-center justify-center gap-2 mt-3"><Loader2 size={16} className="animate-spin text-white/40" /><Text className="text-white/40 text-sm">Enregistrement...</Text></View>
          )}<Pressable onPress={handleRestart} className="mt-4 px-6 py-2 rounded-xl text-sm font-medium text-white bg-purple-500/20 transition-colors"><Text>Recommencer</Text></Pressable></View></View>
    );
  }

  return (
    <View className="space-y-3"><View className="flex items-center justify-between"><View className="flex items-center gap-2"><Brain size={16} className="text-white/30" /><Text className="text-sm font-medium text-white/50">{quiz.title}</Text></View><Text className="text-xs text-white/30">{currentIndex + 1}/{totalQuestions}</Text></View><View className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3"><Text className="text-white font-medium text-sm">{currentQuestion.question}</Text><View className="space-y-2">{currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrectAnswer =
              isCorrect !== null && idx === currentQuestion.correctAnswer;
            const isWrongAnswer = isSelected && !isCorrect;

            return (
              <Pressable key={idx} onPress={() => handleSelectOption(idx)} disabled={selectedOption !== null} className={`w-full flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all cursor-pointer ${
                  isSelected
                    ? isCorrect
                      ? "bg-green-500/20 border-green-500/50"
                      : "bg-red-500/20 border-red-500/50"
                    : isCorrect !== null &&
                        idx === currentQuestion.correctAnswer
                      ? "bg-green-500/20 border-green-500/50"
                      : selectedOption !== null
                        ? "bg-white/5 border-white/5 opacity-50"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                } border`}>
                <Text className="text-white/60 text-xs font-mono">
                  {String.fromCharCode(65 + idx)}.
                </Text>
                <Text className={
                    isSelected || isCorrectAnswer
                      ? "text-white"
                      : "text-white/70"
                  }>
                  {option}
                </Text>
                {isSelected && isCorrect && (
                  <Check size={16} className="text-green-400 ml-auto" />
                )}
                {isSelected && !isCorrect && (
                  <X size={16} className="text-red-400 ml-auto" />
                )}
                {!isSelected &&
                  isCorrect !== null &&
                  idx === currentQuestion.correctAnswer && (
                    <Check size={16} className="text-green-400 ml-auto" />
                  )}
              </Pressable>
            );
          })}</View>{showExplanation && currentQuestion.explanation && (
          <View initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-white/5 border border-white/5">
            <Text className="text-xs text-white/50">
              {currentQuestion.explanation}
            </Text>
          </View>
        )}</View>{selectedOption !== null && (
        <Pressable onPress={handleNext} className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-500 transition-opacity flex items-center justify-center gap-2">
          {isLastQuestion ? "Voir les résultats" : "Question suivante"}
          <ChevronRight size={16} />
        </Pressable>
      )}</View>
  );
}

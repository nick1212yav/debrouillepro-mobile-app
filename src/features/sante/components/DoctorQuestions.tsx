import { View, Text, Pressable, TextInput } from "react-native";

// src/features/sante/components/DoctorQuestions.tsx
import { useState } from "react";
import { MessageCircle, ThumbsUp, Send } from "lucide-react-native";

export interface Question {
  id: string;
  patientName: string;
  question: string;
  date: Date;
  likes: number;
  answers: {
    id: string;
    author: string;
    content: string;
    date: Date;
  }[];
}

interface DoctorQuestionsProps {
  questions: Question[];
  onAsk?: (question: string) => void;
  onAnswer?: (questionId: string, answer: string) => void;
  onLikeQuestion?: (questionId: string) => void;
}

export function DoctorQuestions({
  questions,
  onAsk,
  onAnswer,
  onLikeQuestion,
}: DoctorQuestionsProps) {
  const [showAskForm, setShowAskForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [showAnswerForm, setShowAnswerForm] = useState<Record<string, boolean>>(
    {},
  );

  const handleAsk = () => {
    if (onAsk && newQuestion.trim()) {
      onAsk(newQuestion);
      setNewQuestion("");
      setShowAskForm(false);
    }
  };

  const handleAnswer = (questionId: string) => {
    if (onAnswer && answerText[questionId]?.trim()) {
      onAnswer(questionId, answerText[questionId]);
      setAnswerText((prev) => ({ ...prev, [questionId]: "" }));
      setShowAnswerForm((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10"><View className="flex items-center justify-between mb-4"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2"><MessageCircle size={14} />Questions ({questions.length})
        </Text>{onAsk && (
          <Pressable onPress={() => setShowAskForm(!showAskForm)} className="text-xs text-red-400 font-medium transition-colors">{showAskForm ? "Annuler" : "Poser une question"}</Pressable>
        )}</View>{showAskForm && onAsk && (
        <View className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10"><TextInput value={newQuestion} onChangeText={(value) => setNewQuestion(value)} placeholder="Votre question..." className="w-full p-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50" multiline textAlignVertical="top" /><Pressable onPress={handleAsk} disabled={!newQuestion.trim()} className="mt-2 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-red-500 transition-colors disabled:opacity-50"><Text>Envoyer</Text></Pressable></View>
      )}<View className="space-y-3 max-h-60 overflow-y-auto" style={{  }}>{questions.length === 0 ? (
          <Text className="text-xs text-white/30 text-center py-4">Aucune question
          </Text>
        ) : (
          questions.map((q) => (
            <View key={q.id} className="p-3 rounded-xl bg-white/5 border border-white/10"><View className="flex items-start justify-between"><View><Text className="text-white text-sm font-medium">{q.patientName}</Text><Text className="text-white/70 text-sm mt-0.5">{q.question}</Text></View><Text className="text-[10px] text-white/30">{q.date.toLocaleDateString("fr-FR")}</Text></View><View className="flex items-center gap-3 mt-1 text-xs">{onLikeQuestion && (
                  <Pressable onPress={() => onLikeQuestion(q.id)} className="text-white/30 transition-colors flex items-center gap-1">
                    <ThumbsUp size={12} /> {q.likes}
                  </Pressable>
                )}<Pressable onPress={() =>
                    setShowAnswerForm((prev) => ({
                      ...prev,
                      [q.id]: !prev[q.id],
                    }))
                  } className="text-white/30 transition-colors">Répondre ({q.answers.length})
                </Pressable></View>{q.answers.length > 0 && (
                <View className="mt-2 pl-3 border-l-2 border-white/10 space-y-2">
                  {q.answers.map((a) => (
                    <View key={a.id} className="text-xs">
                      <Text className="text-white font-medium">{a.author}</Text>
                      <Text className="text-white/60 ml-1">: {a.content}</Text>
                    </View>
                  ))}
                </View>
              )}{showAnswerForm[q.id] && onAnswer && (
                <View className="mt-2 flex gap-2">
                  <TextInput value={answerText[q.id] || ""} onChangeText={(value) =>
                      setAnswerText((prev) => ({
                        ...prev,
                        [q.id]: value,
                      }))} placeholder="Votre réponse..." className="flex-1 p-1.5 rounded-lg bg-white/10 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-red-500/50" />
                  <Pressable onPress={() => handleAnswer(q.id)} disabled={!answerText[q.id]?.trim()} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium disabled:opacity-50">
                    <Send size={12} />
                  </Pressable>
                </View>
              )}</View>
          ))
        )}</View></View>
  );
}

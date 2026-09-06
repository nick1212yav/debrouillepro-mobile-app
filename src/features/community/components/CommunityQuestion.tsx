import { View, Text, TextInput } from "react-native";
import { useState } from "react";
import { HelpCircle, Send, Loader2 } from "lucide-react-native";

interface Props {
  question: string;
  onAnswer: (answer: string) => Promise<void>;
  onAskQuestion?: (question: string) => Promise<void>;
  isAnswered?: boolean;
  answer?: string;
  canAsk?: boolean;
}

export function CommunityQuestion({
  question,
  onAnswer,
  onAskQuestion,
  isAnswered = false,
  answer,
  canAsk = true,
}: Props) {
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAskForm, setShowAskForm] = useState(false);

  const handleAskQuestion = async () => {
    if (!newQuestion.trim() || !onAskQuestion) return;
    setIsSubmitting(true);
    try {
      await onAskQuestion(newQuestion.trim());
      setNewQuestion("");
      setShowAskForm(false);
    } catch {
      // error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswer = async () => {
    if (!newAnswer.trim()) return;
    setIsSubmitting(true);
    try {
      await onAnswer(newAnswer.trim());
      setNewAnswer("");
    } catch {
      // error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="space-y-3">
      <View className="flex items-center gap-2">
        <HelpCircle size={16} className="text-white/30" />
        <Text className="text-sm font-medium text-white/50">Question</Text>
        {isAnswered && (
          <Text className="text-xs text-green-400">✓ Répondu</Text>
        )}
      </View>

      <View className="p-4 rounded-xl bg-white/5 border border-white/10">
        <Text className="text-white/80 text-sm">{question}</Text>
      </View>

      {isAnswered && answer && (
        <View className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
          <Text className="text-sm font-medium text-green-400"><Text>Réponse</Text></Text>
          <Text className="text-white/70 text-sm mt-1">{answer}</Text>
        </View>
      )}

      {!isAnswered && canAsk && (
        <View className="space-y-2">
          {!showAskForm ? (
            <Pressable
              onPress={() => setShowAskForm(true)}
              className="w-full py-2 rounded-xl text-sm font-medium text-purple-400 bg-purple-500/10"
            >
              <Text>Répondre à cette question</Text></Pressable>
          ) : (
            <View className="flex gap-2">
              <TextInput
                value={newAnswer}
                onChangeText={(text) => setNewAnswer(text)}
                placeholder="Votre réponse..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/30"
                onKeyDown={(e) => e.key === "Enter" && handleAnswer()}
              />
              <Pressable
                onPress={handleAnswer}
                disabled={!newAnswer.trim() || isSubmitting}
                className="px-4 py-2 rounded-xl text-white font-medium disabled:opacity-40"
                style={{  }}
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </Pressable>
            </View>
          )}
        </View>
      )}

      {canAsk && onAskQuestion && (
        <View className="space-y-2">
          <Pressable
            onPress={() => setShowAskForm(!showAskForm)}
            className="text-xs text-white/40"
          >
            {showAskForm ? "Annuler" : "Poser une question"}
          </Pressable>
          {showAskForm && (
            <View className="flex gap-2">
              <TextInput
                value={newQuestion}
                onChangeText={(text) => setNewQuestion(text)}
                placeholder="Votre question..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/30"
                onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
              />
              <Pressable
                onPress={handleAskQuestion}
                disabled={!newQuestion.trim() || isSubmitting}
                className="px-4 py-2 rounded-xl text-white font-medium disabled:opacity-40"
                style={{  }}
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

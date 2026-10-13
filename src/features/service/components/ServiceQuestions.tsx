import { View, Text, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { User, Send } from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  providerId: Id<"serviceProviders">;
  canAsk?: boolean;
}

export function ServiceQuestions({ providerId, canAsk = true }: Props) {
  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questionsData = useQuery(api.services.questions.getQuestions, {
    providerId,
  });
  const ask = useMutation(api.services.questions.askQuestion);

  const handleSubmit = async () => {
    if (!newQuestion.trim()) return;
    setIsSubmitting(true);
    try {
      await ask({ providerId, question: newQuestion.trim() });
      toast.success("Question posée !");
      setNewQuestion("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'envoi",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (questionsData === undefined) {
    return (
      <View className="py-2">
        <Text className="text-sm text-white/40">Chargement...</Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <Text className="text-sm font-medium text-white/50">Questions</Text>

      {questionsData.length === 0 && (
        <Text className="text-sm italic text-white/30">Aucune question</Text>
      )}

      {questionsData.map((q) => (
        <View
          key={q._id}
          className="rounded-xl border border-white/5 bg-white/5 p-3"
        >
          <View className="flex-row items-center gap-2">
            <User size={14} color="rgba(255,255,255,0.3)" />
            <Text className="text-sm text-white/80">{q.askerName}</Text>
          </View>
          <Text className="mt-1 text-sm text-white/80">{q.question}</Text>
          {q.answer && (
            <View className="mt-2 rounded-lg bg-emerald-500/5 p-2">
              <Text className="text-xs text-white/50">
                Réponse{q.answererName ? ` de ${q.answererName}` : ""}
              </Text>
              <Text className="mt-1 text-sm text-white/70">{q.answer}</Text>
            </View>
          )}
        </View>
      ))}

      {canAsk && (
        <View className="flex-row gap-2">
          <TextInput
            value={newQuestion}
            onChangeText={setNewQuestion}
            placeholder="Poser une question..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            editable={!isSubmitting}
          />
          <Pressable
            onPress={handleSubmit}
            disabled={!newQuestion.trim() || isSubmitting}
            className={`flex-row items-center gap-1.5 rounded-xl px-4 py-2 ${
              !newQuestion.trim() || isSubmitting
                ? "bg-orange-500/50"
                : "bg-orange-500 active:bg-orange-600"
            }`}
          >
            <Send size={14} color="white" />
            <Text className="text-sm font-medium text-white">Envoyer</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

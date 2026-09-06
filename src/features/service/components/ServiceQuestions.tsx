import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, TextInput } from "react-native";
import { useState } from "react";
import {
  MessageSquare,
  User,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  providerId: Id<"serviceProviders">;
  canAsk?: boolean;
}

export function ServiceQuestions({ providerId, canAsk = true }: Props) {
  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questionsData = useQuery(api.serviceProviders.getQuestions, {
    providerId,
  });
  const ask = useMutation(api.serviceProviders.askQuestion);

  const handleSubmit = async () => {
    if (!newQuestion.trim()) return;
    setIsSubmitting(true);
    try {
      await ask({ providerId, question: newQuestion.trim() });
      UIService.openToast("Question posée !", "success");
      setNewQuestion("");
    } catch (error) {
      UIService.openToast(error instanceof Error ? error.message : "Erreur", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (questionsData === undefined)
    return <View className="text-white/40 text-sm"><Text>Chargement...</Text></View>;

  return (
    <View className="space-y-3">
      <Text className="text-sm font-medium text-white/50">Questions</Text>
      {questionsData.length === 0 && (
        <Text className="text-white/30 text-sm italic">Aucune question</Text>
      )}
      {questionsData.map((q: any) => (
        <View
          key={q._id}
          className="rounded-xl bg-white/5 border border-white/5 p-3"
        >
          <View className="flex items-center gap-2">
            <User size={14} className="text-white/30" />
            <Text className="text-white/80 text-sm">{q.askerName}</Text>
          </View>
          <Text className="text-white/80 text-sm mt-1">{q.question}</Text>
          {q.answer && (
            <Text className="text-white/60 text-sm mt-1"><Text>Réponse :</Text>{q.answer}</Text>
          )}
        </View>
      ))}
      {canAsk && (
        <View className="flex gap-2">
          <TextInput
            value={newQuestion}
            onChangeText={(text) => setNewQuestion(text)}
            placeholder="Poser une question..."
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none"
           
           editable={!(isSubmitting)}/>
          <Pressable
            onPress={handleSubmit}
            disabled={!newQuestion.trim() || isSubmitting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 disabled:opacity-50"
          >
            <Send size={14} /> <Text>Envoyer</Text></Pressable>
        </View>
      )}
    </View>
  );
}

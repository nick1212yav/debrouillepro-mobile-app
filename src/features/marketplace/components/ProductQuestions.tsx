import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image, TextInput } from "react-native";
// src/features/marketplace/components/ProductQuestions.tsx
import { useState } from "react";
import { MessageCircle, Send, User } from "lucide-react-native";
import { formatDate } from "../utils/formatter";

interface Question {
  id: string;
  question: string;
  answer?: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: number;
  answeredAt?: number;
}

interface Props {
  questions: Question[];
  onAsk: (question: string) => Promise<void>;
}

export function ProductQuestions({ questions, onAsk }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      await onAsk(input);
      setInput("");
      UIService.openToast("Question posée !", "success");
    } catch {
      UIService.openToast("Erreur", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="space-y-3">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Questions & Réponses
      </Text>
      <View className="flex gap-2">
        <TextInput
          value={input}
          onChangeText={(text) => setInput(text)}
          placeholder="Poser une question..."
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/25"
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
        />
        <Pressable
          onPress={handleAsk}
          disabled={!input.trim() || loading}
          className="px-4 py-3 rounded-xl bg-purple-500 text-white disabled:opacity-40"
        >
          <Send size={16} />
        </Pressable>
      </View>
      <View
        className="space-y-3 max-h-48 overflow-y-auto"
        style={{  }}
      >
        {questions.length === 0 && (
          <Text className="text-white/30 text-sm text-center py-4">
            Aucune question
          </Text>
        )}
        {questions.map((q) => (
          <View
            key={q.id}
            className="p-3 rounded-xl bg-white/5 border border-white/5"
          >
            <View className="flex items-center gap-2 mb-1">
              {q.authorAvatar ? (
                <Image
                 
                 
                  className="w-6 h-6 rounded-full object-cover"
                 source={{ uri: q.authorAvatar }} accessibilityLabel={q.authorName}/>
              ) : (
                <User size={14} className="text-white/30" />
              )}
              <Text className="text-white text-xs font-medium">
                {q.authorName}
              </Text>
              <Text className="text-white/20 text-[10px]">
                {formatDate(q.createdAt)}
              </Text>
            </View>
            <Text className="text-white/80 text-sm">{q.question}</Text>
            {q.answer && (
              <View className="mt-2 pl-3 border-l-2 border-purple-500/30">
                <Text className="text-white/60 text-sm">{q.answer}</Text>
                <Text className="text-white/20 text-[10px] mt-0.5">
                  <Text>Répondu le</Text>{formatDate(q.answeredAt!)}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

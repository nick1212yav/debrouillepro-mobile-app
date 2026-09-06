import { View, Text, TextInput } from "react-native";
// src/features/sante/components/DoctorAIAssistant.tsx
import { useState } from "react";
import { Bot, Send, Loader2 } from "lucide-react-native";

interface DoctorAIAssistantProps {
  doctorId: string;
  onAsk?: (question: string) => Promise<string>;
}

export function DoctorAIAssistant({ doctorId, onAsk }: DoctorAIAssistantProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  const handleSubmit = async () => {
    if (!question.trim() || !onAsk) return;
    setLoading(true);
    const userMessage = { role: "user" as const, content: question };
    setMessages((prev) => [...prev, userMessage]);
    try {
      const response = await onAsk(question);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
      setAnswer(response);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Désolé, une erreur est survenue." },
      ]);
    } finally {
      setLoading(false);
      setQuestion("");
    }
  };

  return (
    <View className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
      <View className="flex items-center gap-2 mb-3">
        <Bot size={18} className="text-indigo-400" />
        <Text className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
          Assistant IA Santé
        </Text>
      </View>

      <View
        className="space-y-2 max-h-40 overflow-y-auto mb-3"
        style={{  }}
      >
        {messages.length === 0 ? (
          <Text className="text-white/30 text-xs">
            Posez vos questions médicales à l'assistant
          </Text>
        ) : (
          messages.map((msg, idx) => (
            <View
              key={idx}
              className={`p-2 rounded-xl text-xs ${
                msg.role === "user"
                  ? "bg-white/10 text-white/70 ml-auto max-w-[80%]"
                  : "bg-indigo-500/20 text-white/80 max-w-[85%]"
              }`}
            >
              {msg.content}
            </View>
          ))
        )}
        {loading && (
          <View className="flex items-center gap-2 text-indigo-400 text-xs">
            <Loader2 size={12} className="animate-spin" />
            <Text>Réflexion en cours...</Text></View>
        )}
      </View>

      <View className="flex gap-2">
        <TextInput
          value={question}
          onChangeText={(text) => setQuestion(text)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Posez votre question..."
          className="flex-1 p-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder:text-white/30"
        />
        <Pressable
          onPress={handleSubmit}
          disabled={!question.trim() || loading || !onAsk}
          className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-medium disabled:opacity-50"
        >
          <Send size={14} />
        </Pressable>
      </View>
    </View>
  );
}

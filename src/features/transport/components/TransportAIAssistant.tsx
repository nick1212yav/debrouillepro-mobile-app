import { View, Text } from "react-native";
// src/features/transport/components/TransportAIAssistant.tsx
import { useState } from "react";
import { Cpu, Send, Loader2, ArrowRight, Sparkles } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatbotAssistant } from "../ai/ChatbotAssistant";

export function TransportAIAssistant() {
  const [messages, setMessages] = useState<
    { sender: "user" | "ai"; text: string }[]
  >([
    {
      sender: "ai",
      text: "Bonjour ! Je suis l'assistant Débrouille Transport [2]. Posez-moi vos questions sur ce trajet (prix, animaux, bagages...) [2].",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: unknown) => {
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInputValue("");
    setLoading(true);

    try {
      const response = await ChatbotAssistant.processQuery(userText);
      setMessages((prev) => [...prev, { sender: "ai", text: response.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Je rencontre des difficultés pour analyser votre demande.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
      <View className="flex items-center gap-2">
        <Cpu size={16} className="text-violet-400" />
        <Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-1">
          Débrouille AI Mobilité [2]
          <Sparkles size={10} className="text-violet-400 animate-pulse" />
        </Text>
      </View>

      {/* Zone de chat */}
      <View
        className="h-44 rounded-2xl bg-black/40 p-3.5 overflow-y-auto space-y-3.5 border border-white/5"
        style={{  }}
      >
        {messages.map((m, i) => (
          <View
            key={i}
            className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <View
              className={`p-3 rounded-2xl text-[11px] leading-relaxed max-w-[85%] ${
                m.sender === "user"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold"
                  : "bg-white/5 text-white/80 border border-white/5 font-semibold"
              }`}
            >
              {m.text}
            </View>
          </View>
        ))}
        {loading && (
          <View className="flex justify-start">
            <View className="p-3 rounded-2xl text-[11px] bg-white/5 border border-white/5 text-white/50 flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin text-violet-400" />
              <Text><Text>Analyse de votre demande... [2]</Text></Text>
            </View>
          </View>
        )}
      </View>

      {/* Input de saisie */}
      <View className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(text) => setInputValue(text)}
          placeholder="Ex : Le chauffeur accepte-t-il les bagages ? [2]"
          className="flex-1 h-10 rounded-xl bg-white/5 border-white/10 text-xs placeholder:text-white/20"
          disabled={loading}
        />
        <Button
          size="icon"
          className="w-10 h-10 rounded-xl bg-violet-600"
          disabled={loading}
        >
          <Send size={14} className="text-white" />
        </Button>
      </View>
    </View>
  );
}

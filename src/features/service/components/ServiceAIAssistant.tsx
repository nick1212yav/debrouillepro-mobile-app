import { UIService } from "@/core/sdk/ui/UIService";
import { Pressable, View, Text, TextInput } from "react-native";
import { useState } from "react";
import { Bot, Send } from "lucide-react-native";

export function ServiceAIAssistant({ providerId }: { providerId: string }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const askAI = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      // Appel à l'IA (à implémenter)
      UIService.openToast("Réponse IA (simulée)", "info");
    } finally {
      setLoading(false);
    }
  };
  return (
    <View className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
      <View className="flex items-center gap-2 mb-2">
        <Bot size={16} className="text-purple-400" />
        <Text className="text-sm font-medium text-white/70">Assistant IA</Text>
      </View>
      <View className="flex gap-2">
        <TextInput
          value={message}
          onChangeText={(text) => setMessage(text)}
          placeholder="Posez une question..."
          className="flex-1 rounded-xl p-2 bg-white/5 border border-white/10 text-white text-sm"
        />
        <Pressable
          onPress={askAI}
          disabled={loading}
          className="p-2 rounded-xl bg-purple-500/20 text-purple-400"
        >
          <Send size={16} />
        </Pressable>
      </View>
    </View>
  );
}

import { View, Text } from "react-native";
import { useState } from "react";
import { Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react-native";

interface Props {
  content: string;
  onModerate: (
    content: string,
  ) => Promise<{ isSafe: boolean; flags: string[]; score: number }>;
}

export function CommunityAIModeration({ content, onModerate }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    isSafe: boolean;
    flags: string[];
    score: number;
  } | null>(null);

  const handleModerate = async () => {
    setIsLoading(true);
    try {
      const res = await onModerate(content);
      setResult(res);
    } catch {
      // error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <View
        className={`p-3 rounded-xl ${
          result.isSafe
            ? "bg-green-500/10 border-green-500/20"
            : "bg-red-500/10 border-red-500/20"
        } border`}
      >
        <View className="flex items-center gap-2">
          {result.isSafe ? (
            <CheckCircle size={16} className="text-green-400" />
          ) : (
            <AlertCircle size={16} className="text-red-400" />
          )}
          <Text
            className={`text-sm font-medium ${result.isSafe ? "text-green-400" : "text-red-400"}`}
          >
            {result.isSafe ? "Contenu sûr" : "Alerte de sécurité"}
          </Text>
          <Text className="text-xs text-white/30 ml-auto">
            <Text>Score:</Text>{Math.round(result.score * 100)}<Text>%</Text></Text>
        </View>
        {result.flags.length > 0 && (
          <View className="flex flex-wrap gap-1 mt-2">
            {result.flags.map((flag) => (
              <Text
                key={flag}
                className="text-[10px] text-red-400/70 bg-red-500/10 px-2 py-0.5 rounded-full"
              >
                {flag}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <Pressable
      onPress={handleModerate}
      disabled={isLoading || !content.trim()}
      className="flex items-center gap-1.5 text-xs font-medium text-white/40 disabled:opacity-30"
    >
      {isLoading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Shield size={12} />
      )}
      {isLoading ? "Analyse en cours..." : "Vérifier le contenu"}
    </Pressable>
  );
}

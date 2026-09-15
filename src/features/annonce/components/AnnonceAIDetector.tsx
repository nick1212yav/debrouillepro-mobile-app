import { View, Pressable, Text } from "react-native";
import { useState } from "react";
import { Shield, AlertCircle, CheckCircle, Loader2 } from "lucide-react-native";

interface Props {
  images?: string[];
  description?: string;
  onAnalyze: (
    data: any,
  ) => Promise<{ isFraud: boolean; flags: string[]; score: number }>;
}

export function AnnonceAIDetector({ images, description, onAnalyze }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    isFraud: boolean;
    flags: string[];
    score: number;
  } | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await onAnalyze({ images, description });
      setResult(res);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <View className={`p-3 rounded-xl flex items-start gap-3 ${
          result.isFraud
            ? "bg-red-500/10 border-red-500/20"
            : "bg-emerald-500/10 border-emerald-500/20"
        } border`}>{result.isFraud ? (
          <AlertCircle
            size={18}
            className="text-red-400 flex-shrink-0 mt-0.5"
          />
        ) : (
          <CheckCircle
            size={18}
            className="text-emerald-400 flex-shrink-0 mt-0.5"
          />
        )}<View className="flex-1"><Text className="text-sm font-medium text-white">{result.isFraud ? "⚠️ Alerte de sécurité" : "✅ Annonce sécurisée"}</Text><Text className="text-xs text-white/50 mt-1">Score de confiance: {Math.round(result.score * 100)}%
          </Text>{result.flags.length > 0 && (
            <View className="flex flex-wrap gap-1 mt-1">
              {result.flags.map((flag) => (
                <Text key={flag} className="text-[10px] text-red-400/70 bg-red-500/10 px-2 py-0.5 rounded-full">
                  {flag}
                </Text>
              ))}
            </View>
          )}</View></View>
    );
  }

  return (
    <Pressable onPress={handleAnalyze} disabled={loading} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-white/60 bg-white/5 transition-colors disabled:opacity-50">
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Shield size={14} />
      )}
      {loading ? "Analyse en cours..." : "Vérifier la fiabilité"}
    </Pressable>
  );
}

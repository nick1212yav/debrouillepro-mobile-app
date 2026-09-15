import { View, Text, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Loader2 } from "lucide-react-native";
import { formatPrice } from "@/lib/utils";

interface Props {
  title: string;
  description: string;
  category: string;
  onEstimate: (
    params: any,
  ) => Promise<{ min: number; max: number; confidence: number }>;
}

export function AnnonceAIEstimator({
  title,
  description,
  category,
  onEstimate,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<{
    min: number;
    max: number;
    confidence: number;
  } | null>(null);

  const handleEstimate = async () => {
    setLoading(true);
    try {
      const result = await onEstimate({ title, description, category });
      setEstimate(result);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 space-y-2"><View className="flex items-center gap-2"><Sparkles size={14} className="text-purple-400" /><Text className="text-sm font-medium text-white/70">Estimation IA du prix
        </Text></View>{!estimate && !loading && (
        <Pressable onPress={handleEstimate} className="w-full py-2 rounded-lg text-xs font-medium text-white/70 bg-white/5 transition-colors"><Text>Estimer le prix</Text></Pressable>
      )}{loading && (
        <View className="flex items-center gap-2 text-white/40 text-sm"><Loader2 size={16} className="animate-spin" /><Text>Analyse en cours...</Text></View>
      )}{estimate && (
        <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
          <View className="flex items-center justify-between"><Text className="text-xs text-white/40">Prix estimé</Text><Text className="text-white font-bold">{formatPrice(estimate.min)}– {formatPrice(estimate.max)}</Text></View>
          <View className="flex items-center gap-2"><View className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden"><View className="h-full rounded-full bg-purple-400" style={{ width: `${estimate.confidence * 100}%` }} /></View><Text className="text-[10px] text-white/30">{Math.round(estimate.confidence * 100)}% confiance
            </Text></View>
          <TrendingUp
            size={12}
            className="text-emerald-400 inline-block mr-1"
          />
          <Text className="text-[10px] text-white/30">
            Basé sur des annonces similaires
          </Text>
        </View>
      )}</View>
  );
}

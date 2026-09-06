import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";

// src/features/community/components/CommunityBoost.tsx
import { useState } from "react";
import { X, TrendingUp, Send } from "lucide-react-native";

interface Props {
  onBoost: (duration: number, budget: number) => Promise<void>;
  onClose?: () => void; // ✅ ajout de onClose
}

const DURATIONS = [
  { label: "1 jour", value: 1 },
  { label: "3 jours", value: 3 },
  { label: "7 jours", value: 7 },
];

const BUDGETS = [
  { label: "5 000 FCFA", value: 5000 },
  { label: "10 000 FCFA", value: 10000 },
  { label: "25 000 FCFA", value: 25000 },
  { label: "50 000 FCFA", value: 50000 },
];

export function CommunityBoost({ onBoost, onClose }: Props) {
  const [duration, setDuration] = useState(3);
  const [budget, setBudget] = useState(10000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onBoost(duration, budget);
      UIService.openToast(`Post boosté pour ${duration} jours avec un budget de ${budget} FCFA`, "success");
      onClose?.();
    } catch (error) {
      UIService.openToast("Erreur lors du boost", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Pressable
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        onPress={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <View
          className="w-full max-w-lg rounded-t-3xl overflow-hidden"
          style={{ backgroundColor: "rgba(15,15,30,0.98)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", maxHeight: "90vh" }}
        >
          <View className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <Text className="text-white font-bold text-lg">Booster le post</Text>
            <Pressable
              onPress={() => onClose?.()}
              className="p-1 rounded-full"
            >
              <X size={20} className="text-white/50" />
            </Pressable>
          </View>

          <View
            className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-5"
            style={{  }}
          >
            <View className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <TrendingUp size={24} className="text-purple-400" />
              <View>
                <Text className="text-white font-semibold">
                  Augmentez votre visibilité
                </Text>
                <Text className="text-white/40 text-xs">
                  Votre post sera mis en avant auprès de plus de personnes
                </Text>
              </View>
            </View>

            <View>
              <Text className="text-white/60 text-sm font-medium mb-2">Durée</Text>
              <View className="flex gap-2">
                {DURATIONS.map((d) => (
                  <Pressable
                    key={d.value}
                    onPress={() => setDuration(d.value)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                      duration === d.value
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "bg-white/5 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    {d.label}
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-white/60 text-sm font-medium mb-2">Budget</Text>
              <View className="gap-2">
                {BUDGETS.map((b) => (
                  <Pressable
                    key={b.value}
                    onPress={() => setBudget(b.value)}
                    className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                      budget === b.value
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "bg-white/5 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    {b.label}
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <Text className="text-white/40 text-xs"><Text>Estimation de portée</Text></Text>
              <Text className="text-white font-bold text-lg">
                <Text>~</Text>{(budget / 1000) * 200} <Text>personnes</Text></Text>
            </View>
          </View>

          <View className="px-5 pb-5">
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{  }}
            >
              <Send size={15} className="text-white" />
              <Text className="text-white">
                {isSubmitting ? "Boost en cours..." : "Booster maintenant"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </>
  );
}

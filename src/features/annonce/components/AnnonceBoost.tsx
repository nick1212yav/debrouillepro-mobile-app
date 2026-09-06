import { UIService } from "@/core/sdk/ui/UIService";
import { Pressable, View, Text } from "react-native";
import { useState } from "react";
import { Zap, TrendingUp, Clock, DollarSign, Loader2 } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  publicationId: Id<"publications">;
  isPromoted: boolean;
  promotionEnd?: number;
}

const BOOST_OPTIONS = [
  { days: 3, price: 5, label: "3 jours", popular: false },
  { days: 7, price: 10, label: "7 jours", popular: true },
  { days: 30, price: 30, label: "30 jours", popular: false },
];

export function AnnonceBoost({
  publicationId,
  isPromoted,
  promotionEnd,
}: Props) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const boostMutation = useMutation(api.publications.boost);

  const handleBoost = async () => {
    if (selectedOption === null) return;
    setLoading(true);
    try {
      await boostMutation({ publicationId });
      UIService.openToast("Annonce boostée avec succès ! ⚡", "success");
    } catch {
      UIService.openToast("Erreur lors du boost", "error");
    } finally {
      setLoading(false);
    }
  };

  if (isPromoted) {
    return (
      <View className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
        <View className="flex items-center gap-2">
          <Zap size={16} className="text-purple-400" />
          <View className="flex-1">
            <Text className="text-sm font-medium text-white/80">
              Annonce boostée ⚡
            </Text>
            {promotionEnd && (
              <Text className="text-xs text-white/40">
                Jusqu'au {new Date(promotionEnd).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="space-y-3 p-3 rounded-xl bg-white/5 border border-white/5">
      <View className="flex items-center gap-2">
        <TrendingUp size={16} className="text-orange-400" />
        <Text className="text-sm font-medium text-white/70">
          Booster cette annonce
        </Text>
      </View>

      <Text className="text-xs text-white/40">
        Augmentez la visibilité de votre annonce jusqu'à 5x plus !
      </Text>

      <View className="gap-2">
        {BOOST_OPTIONS.map((option, index) => (
          <Pressable
            key={index}
            onPress={() => setSelectedOption(index)}
            className={`p-2 rounded-xl text-center transition-all cursor-pointer ${
              selectedOption === index
                ? "bg-orange-500/20 border-orange-400/50"
                : "bg-white/5 border-white/5 hover:bg-white/10"
            } border`}
          >
            <Text className="text-white font-bold text-sm">{option.price}<Text>$</Text></Text>
            <Text className="text-white/40 text-[10px]">{option.label}</Text>
            {option.popular && (
              <Text className="text-[8px] text-orange-400 uppercase">
                <Text>Populaire</Text></Text>
            )}
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={handleBoost}
        disabled={selectedOption === null || loading}
        className="w-full py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 flex items-center justify-center gap-2"
        style={{  }}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          "Booster maintenant"
        )}
      </Pressable>
    </View>
  );
}

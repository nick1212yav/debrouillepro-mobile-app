import { View, Text, TextInput, Pressable } from "react-native";

// src/features/marketplace/components/DeliveryEstimator.tsx
import { useState } from "react";
import { MapPin, Truck, Zap, Loader2 } from "lucide-react-native";
import { toast } from "sonner";

interface Props {
  productId: string;
  location?: string;
}

export function DeliveryEstimator({ productId, location }: Props) {
  const [address, setAddress] = useState(location || "");
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState<null | {
    method: string;
    cost: number;
    days: number;
    currency: string;
  }>(null);

  const handleEstimate = async () => {
    if (!address.trim()) {
      toast.error("Veuillez saisir une adresse");
      return;
    }
    setEstimating(true);
    try {
      // Simulation d'estimation de livraison
      await new Promise((resolve) => setTimeout(resolve, 800));
      setEstimate({
        method: "Standard",
        cost: 2000,
        days: 3,
        currency: "FCFA",
      });
    } catch {
      toast.error("Erreur lors de l'estimation");
    } finally {
      setEstimating(false);
    }
  };

  return (
    <View className="space-y-3"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Estimation de livraison
      </Text><View className="flex items-center gap-2"><MapPin size={14} className="text-purple-400 flex-shrink-0" /><TextInput value={address} onChangeText={(value) => setAddress(value)} placeholder="Votre adresse de livraison" className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder-white/25" /><Pressable onPress={handleEstimate} disabled={estimating} className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40" style={{  }}>{estimating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            "Estimer"
          )}</Pressable></View>{estimate && (
        <View className="p-3 rounded-xl bg-white/5 border border-white/5"><View className="flex items-center justify-between"><View><Text className="text-white font-medium text-sm">{estimate.method}</Text><Text className="text-white/40 text-xs">Livraison sous {estimate.days}jours
              </Text></View><View className="text-right"><Text className="text-purple-400 font-bold text-sm">{estimate.cost === 0
                  ? "Gratuit"
                  : `${estimate.cost} ${estimate.currency}`}</Text><Text className="text-[10px] text-white/30">Frais de livraison
              </Text></View></View></View>
      )}</View>
  );
}

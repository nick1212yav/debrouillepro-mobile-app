import { View, Pressable, Text } from "react-native";

// src/features/marketplace/components/DeliveryInsurance.tsx
import { useState } from "react";
import { Shield, Check } from "lucide-react-native";
import { toast } from "sonner";

interface Props {
  productPrice: number;
  currency: string;
}

export function DeliveryInsurance({ productPrice, currency }: Props) {
  const [selected, setSelected] = useState(false);
  const insuranceCost = Math.round(productPrice * 0.02);

  const handleToggle = () => {
    setSelected(!selected);
    if (!selected) {
      toast.success(
        `Assurance livraison ajoutée (+${insuranceCost} ${currency})`,
      );
    }
  };

  return (
    <View className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"><Shield size={16} className={selected ? "text-emerald-400" : "text-white/30"} /><View className="flex-1"><Text className="text-white text-sm font-medium">Assurance livraison</Text><Text className="text-white/40 text-xs">Protection contre la perte ou les dommages
          {selected && <Text className="text-emerald-400 ml-1">✓ Active</Text>}</Text></View><Pressable onPress={handleToggle} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
          selected
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/30"
            : "bg-white/5 text-white/60 border border-white/10"
        }`}>{selected ? "Actif" : `+${insuranceCost} ${currency}`}</Pressable></View>
  );
}

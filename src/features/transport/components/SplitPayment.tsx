import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text } from "react-native";
// src/features/transport/components/SplitPayment.tsx
import { useState } from "react";
import { Users, Plus, Minus, Check } from "lucide-react-native";
import { Button } from "@/components/ui/button";

interface SplitPaymentProps {
  totalAmount: number;
  currency: string;
}

export function SplitPayment({ totalAmount, currency }: SplitPaymentProps) {
  const [passengerCount, setPassengerCount] = useState(2);
  const [sentRequests, setSentRequests] = useState(false);

  const sharedPrice = parseFloat((totalAmount / passengerCount).toFixed(0));

  const handleSendSplitRequest = () => {
    setSentRequests(true);
    UIService.openToast(`Demandes de partage de frais envoyées à vos ${passengerCount - 1} co-voyageurs ! [2]`, "success");
  };

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
      <View className="flex items-center gap-2">
        <Users size={16} className="text-violet-400" />
        <Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
          Partager les frais (Covoiturage) [2]
        </Text>
      </View>

      <View className="flex items-center justify-between">
        <Text className="text-xs text-white/50">
          Nombre total de voyageurs :
        </Text>
        <View className="flex items-center gap-3">
          <Button
            size="icon"
            variant="outline"
            className="w-8 h-8 rounded-lg"
            onPress={() => setPassengerCount((c) => Math.max(2, c - 1))}
            disabled={sentRequests}
          >
            <Minus size={12} />
          </Button>
          <Text className="text-sm font-black w-6 text-center text-white">
            {passengerCount}
          </Text>
          <Button
            size="icon"
            variant="outline"
            className="w-8 h-8 rounded-lg"
            onPress={() => setPassengerCount((c) => Math.min(6, c + 1))}
            disabled={sentRequests}
          >
            <Plus size={12} />
          </Button>
        </View>
      </View>

      <View className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
        <Text className="text-white/40"><Text>Tarif par passager :</Text></Text>
        <strong className="text-white font-black text-sm">
          {sharedPrice.toLocaleString()} {currency} <Text>[2]</Text></strong>
      </View>

      <Button
        onPress={handleSendSplitRequest}
        disabled={sentRequests}
        className={`w-full h-11 rounded-xl text-xs font-bold gap-1.5 transition-all ${sentRequests ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 border border-white/10 hover:bg-white/10 text-white"}`}
      >
        {sentRequests ? (
          <>
            <Check size={14} /> <Text>Demandes envoyées [2]</Text></>
        ) : (
          "Envoyer les demandes de partage [2]"
        )}
      </Button>
    </View>
  );
}

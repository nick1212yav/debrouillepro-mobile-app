import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text } from "react-native";
// src/features/transport/components/EscrowPayment.tsx
import { useState } from "react";
import { ShieldCheck, ArrowRight, Lock, Unlock, Loader2 } from "lucide-react-native";
import { Button } from "@/components/ui/button";

interface EscrowPaymentProps {
  amount: number;
  currency: string;
  cargoName: string;
  onReleased: () => void;
}

export function EscrowPayment({
  amount,
  currency,
  cargoName,
  onReleased,
}: EscrowPaymentProps) {
  const [status, setStatus] = useState<"locked" | "releasing" | "released">(
    "locked",
  );

  const handleRelease = () => {
    setStatus("releasing");
    // Simuler la transaction blockchain ou le déblocage DébrouillePay [2]
    setTimeout(() => {
      setStatus("released");
      UIService.openToast("Fonds débloqués au transporteur ! [2]", "success");
      onReleased();
    }, 2500);
  };

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4 max-w-sm mx-auto shadow-2xl">
      <View className="flex items-center justify-between">
        <Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
          Sécurité Séquestre [2]
        </Text>
        {status === "locked" ? (
          <Text className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <Lock size={10} /> Fonds bloqués [2]
          </Text>
        ) : (
          <Text className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Unlock size={10} /> Débloqué [2]
          </Text>
        )}
      </View>

      <View className="space-y-1.5 text-center">
        <View className="w-10 h-10 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mx-auto text-violet-400 shadow-inner">
          {status === "released" ? <Unlock size={18} /> : <Lock size={18} />}
        </View>
        <Text className="text-white font-black text-sm">
          Garantie Livraison de Fret [2]
        </Text>
        <Text className="text-[10px] text-white/40 leading-relaxed max-w-xs mx-auto">
          <Text>Les fonds de</Text>{" "}
          <strong className="text-white font-bold">
            {amount.toLocaleString()} {currency}
          </strong>{" "}
          <Text>pour le transport de :</Text><strong><Text>"</Text>{cargoName}<Text>"</Text></strong> <Text>sont conservés en lieu sûr [2].</Text></Text>
      </View>

      {status === "locked" && (
        <Button
          onPress={handleRelease}
          className="w-full h-11 rounded-xl text-xs font-bold gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
        >
          <Text>Confirmer la réception (Débloquer le chauffeur) [2]</Text></Button>
      )}

      {status === "releasing" && (
        <Button
          disabled
          className="w-full h-11 rounded-xl text-xs font-bold gap-1.5"
        >
          <Loader2 size={12} className="animate-spin" />
          <Text>Déblocage des fonds en cours... [2]</Text></Button>
      )}

      {status === "released" && (
        <View className="p-3.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-center text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1.5">
          <ShieldCheck size={12} /> <Text>Transaction finalisée. Chauffeur payé [2].</Text></View>
      )}
    </View>
  );
}

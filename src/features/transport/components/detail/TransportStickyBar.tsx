import { Pressable, View, Text } from "react-native";

// src/features/transport/components/detail/TransportStickyBar.tsx
import { useState } from "react";
import {
  Loader2,
  Landmark,
  Wallet,
  DollarSign,
  Smartphone,
} from "lucide-react-native";

interface TransportStickyBarProps {
  price: number;
  currency: string;
  seatsAvailable: number;
  isLoading: boolean;
  onBook: (paymentMethod: string) => void;
}

export function TransportStickyBar({
  price,
  currency,
  seatsAvailable,
  isLoading,
  onBook,
}: TransportStickyBarProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("momo");

  const methods = [
    { id: "momo", label: "MoMo RDC", icon: <Smartphone size={13} /> },
    { id: "wallet", label: "Portefeuille", icon: <Wallet size={13} /> },
    { id: "card", label: "Carte", icon: <Landmark size={13} /> },
    { id: "crypto", label: "USDT", icon: <DollarSign size={13} /> },
  ];

  return (
    <View className="fixed bottom-0 left-0 right-0 z-40 bg-[#020412]/90 backdrop-blur-xl border-t border-white/10 px-4 pt-4 pb-6 max-w-lg mx-auto rounded-t-[32px] shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">{}<View className="gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-2xl mb-4">{methods.map((m) => (
          <Pressable key={m.id} onPress={() => setSelectedMethod(m.id)} className={`flex flex-col items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold transition-all ${
              selectedMethod === m.id
                ? "bg-violet-600 text-white shadow-lg"
                : "text-white/40 hover:text-white/70"
            }`}>{m.icon}{m.label}</Pressable>
        ))}</View>{}<View className="flex items-center justify-between gap-4"><View><View className="flex items-center gap-1.5"><Text className="text-xs text-white/50">Total</Text><Text className="text-[9px] bg-amber-500/10 text-amber-400 font-bold px-1 rounded">{seatsAvailable}places restantes
            </Text></View><Text className="text-xl font-black text-white mt-0.5">{price.toLocaleString()}{" "}<Text className="text-xs font-normal text-white/60">{currency}</Text></Text></View><Pressable whileTap={{ scale: 0.97 }} disabled={isLoading} onPress={() => onBook(selectedMethod)} className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 font-black text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 disabled:opacity-50 transition-all">{isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            "Confirmer la réservation"
          )}</Pressable></View></View>
  );
}

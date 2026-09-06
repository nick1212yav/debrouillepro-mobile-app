import { View, Text } from "react-native";
// src/features/transport/components/StickyBookingBar.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coins, CreditCard, Wallet, Loader2 } from "lucide-react-native";

interface StickyBookingBarProps {
  price: number;
  currency: string;
  seatsAvailable: number;
  onBook: (paymentMethod: string) => Promise<void> | void;
  isLoading?: boolean;
}

export function StickyBookingBar({
  price,
  currency,
  seatsAvailable,
  onBook,
  isLoading = false,
}: StickyBookingBarProps) {
  const [paymentMethod, setPaymentMethod] = useState("momo");

  const handleBook = () => {
    onBook(paymentMethod);
  };

  return (
    <View className="fixed bottom-0 inset-x-0 p-4 border-t border-white/5 bg-[#0a0c1a]/95 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 z-40">
      {/* Informations de tarification */}
      <View className="flex items-center justify-between md:justify-start gap-6">
        <View>
          <Text className="text-[10px] text-white/40 uppercase tracking-widest font-black">
            Prix [2]
          </Text>
          <Text className="text-xl font-black text-white">
            {price.toLocaleString()} {currency}
          </Text>
        </View>
        <View className="text-right md:text-left">
          <Text className="text-[10px] text-white/40 uppercase tracking-widest font-black">
            Disponibilité
          </Text>
          <Text className="text-xs font-bold text-emerald-400">
            {seatsAvailable} place{seatsAvailable > 1 ? "s" : ""} libre
            {seatsAvailable > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Selecteur de Paiement et Bouton de validation */}
      <View className="flex items-center gap-3">
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="w-40 h-12 rounded-2xl bg-white/5 border-white/5 text-xs font-bold">
            <SelectValue placeholder="Mode de Paiement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="momo">
              <View className="flex items-center gap-2">
                <Wallet size={12} className="text-amber-400" />
                <Text><Text>Mobile Money</Text></Text>
              </View>
            </SelectItem>
            <SelectItem value="card">
              <View className="flex items-center gap-2">
                <CreditCard size={12} className="text-blue-400" />
                <Text><Text>Visa / Mastercard</Text></Text>
              </View>
            </SelectItem>
            <SelectItem value="crypto">
              <View className="flex items-center gap-2">
                <Coins size={12} className="text-violet-400" />
                <Text><Text>Crypto (USDT)</Text></Text>
              </View>
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          onPress={handleBook}
          disabled={isLoading || seatsAvailable === 0}
          className="flex-1 md:flex-none px-8 h-12 rounded-2xl font-black text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_4px_25px_rgba(139,92,246,0.35)]"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Réserver ma place [2]"
          )}
        </Button>
      </View>
    </View>
  );
}

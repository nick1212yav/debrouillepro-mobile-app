import { View, Text, Alert } from "react-native";
import { useState, useEffect } from "react";
import { Coins, Copy, RefreshCw, AlertTriangle } from "lucide-react-native";

interface CryptoPaymentProps {
  cryptoPayload: {
    address: string;
    amountCrypto: number;
    currency: string;
    expiryTimestamp: number;
  };
  onVerify: () => void;
  isVerifying: boolean;
}

export function CryptoPayment({
  cryptoPayload,
  onVerify,
  isVerifying,
}: CryptoPaymentProps) {
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.round((cryptoPayload.expiryTimestamp - Date.now()) / 1000),
      );
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [cryptoPayload]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  const handleCopy = () => {
    undefined.writeText(cryptoPayload.address);
    Alert.alert("Adresse copiée dans le presse-papiers.");
  };

  return (
    <View className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-left space-y-4">
      <View className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-400 text-xs">
        <View className="flex items-center gap-2">
          <AlertTriangle size={15} />
          <Text className="font-semibold">Transaction à l'adresse réseau</Text>
        </View>
        <Text className="font-mono font-black">{formatTime(timeLeft)}</Text>
      </View>

      <View className="text-center py-3 bg-white/[0.01] border border-dashed border-white/10 rounded-xl space-y-2">
        <Coins size={36} className="text-amber-400 mx-auto" />
        <Text className="block text-2xl font-black text-white">
          {cryptoPayload.amountCrypto} {cryptoPayload.currency}
        </Text>
        <Text className="block text-[9px] text-white/30 uppercase font-bold">
          Réseau ERC-20 ou TRC-20
        </Text>
      </View>

      <View>
        <Text className="block text-[10px] text-white/40 uppercase font-bold mb-1">
          Adresse de réception
        </Text>
        <View className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/90">
          <Text className="font-mono truncate">{cryptoPayload.address}</Text>
          <Pressable
            onPress={handleCopy}
            className="text-white/40 shrink-0"
          >
            <Copy size={14} />
          </Pressable>
        </View>
      </View>

      <Pressable
        type="button"
        onPress={onVerify}
        disabled={isVerifying || timeLeft === 0}
        className="w-full py-4 rounded-xl bg-amber-500 disabled:bg-white/5 disabled:text-white/20 text-[#020617] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-amber-500/10"
      >
        <RefreshCw size={14} className={isVerifying ? "animate-spin" : ""} />
        {isVerifying
          ? "Interrogation de la blockchain..."
          : "Vérifier la transaction"}
      </Pressable>
    </View>
  );
}

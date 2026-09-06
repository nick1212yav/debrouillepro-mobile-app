import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text } from "react-native";

// src/features/transport/components/CryptoPayment.tsx
import { useState } from "react";
import { Coins, Loader2, CheckCircle2, Copy } from "lucide-react-native";
import { Button } from "@/components/ui/button";

interface CryptoPaymentProps {
  amount: number;
  currency: string;
  onSuccess: (txId: string) => void;
  onCancel: () => void;
}

export function CryptoPayment({
  amount,
  currency,
  onSuccess,
  onCancel,
}: CryptoPaymentProps) {
  const [step, setStep] = useState<"qr_scan" | "success">("qr_scan");
  const [verifying, setVerifying] = useState(false);
  const cryptoWalletAddress = "0x89223a3F30a6886eD6F9a71011119AA77771234a"; // Exemple d'adresse de dépôt multi-chaîne DébrouillePro [2]

  const handleCopyAddress = () => {
    undefined.writeText(cryptoWalletAddress);
    UIService.openToast("Adresse copiée dans le presse-papiers ! [2]", "success");
  };

  const handleVerifyTransaction = () => {
    setVerifying(true);
    // Simulation de vérification et d'interrogation de la blockchain [2]
    setTimeout(() => {
      setVerifying(false);
      setStep("success");
      setTimeout(() => {
        onSuccess(
          `CRYPTO-TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        );
      }, 1500);
    }, 3000); // 3 secondes de polling blockchain [2]
  };

  return (
    <View className="space-y-6">
      <>
        {step === "qr_scan" ? (
          <View
            key="qr-step"
            className="space-y-4 text-center"
          >
            <View className="space-y-1">
              <Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
                DébrouillePay [2]
              </Text>
              <Text className="text-sm font-bold text-white/60">
                Paiement Web3 (USDT / USDC) [2]
              </Text>
            </View>

            {/* Simuler un QR code de dépôt en CSS pur */}
            <View className="w-32 h-32 bg-white p-2 rounded-2xl mx-auto flex items-center justify-center relative border border-white/10 shadow-2xl">
              {/* Dessin géométrique fictif de QR Code */}
              <View className="w-full h-full border-4 border-black flex flex-col justify-between p-1.5">
                <View className="flex justify-between">
                  <View className="w-5 h-5 bg-black" />
                  <View className="w-5 h-5 bg-black" />
                </View>
                <View className="w-4 h-4 bg-black mx-auto" />
                <View className="flex justify-between">
                  <View className="w-5 h-5 bg-black" />
                  <View className="w-3 h-3 bg-black" />
                </View>
              </View>
            </View>

            {/* Adresse publique et bouton de copie */}
            <View className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4">
              <Text className="text-[10px] font-mono text-white/40 truncate flex-1 text-left">
                {cryptoWalletAddress}
              </Text>
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 rounded-lg flex-shrink-0"
                onPress={handleCopyAddress}
              >
                <Copy size={12} className="text-violet-400" />
              </Button>
            </View>

            <Text className="text-[10px] text-white/40 leading-relaxed max-w-xs mx-auto">
              <Text>Veuillez transférer exactement</Text>{" "}
              <strong className="text-violet-400">
                {(amount / 2500).toFixed(2)} <Text>USDT</Text></strong>{" "}
              <Text>(réseau TRC-20 / ERC-20) à l'adresse ci-dessus, puis cliquez sur Vérifier [2].</Text></Text>

            {/* Actions */}
            <View className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onPress={onCancel}
                className="flex-1 h-11 rounded-xl"
                disabled={verifying}
              >
                <Text>Annuler</Text></Button>
              <Button
                onPress={handleVerifyTransaction}
                disabled={verifying}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-white flex items-center justify-center gap-1.5 shadow-[0_4px_20px_rgba(139,92,246,0.3)]"
              >
                {verifying ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <Text>Vérification...</Text></>
                ) : (
                  <>
                    <Coins size={14} />
                    <Text>Vérifier le dépôt [2]</Text></>
                )}
              </Button>
            </View>
          </View>
        ) : (
          <View
            key="crypto-success"
            className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-3"
          >
            <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
            <Text className="text-emerald-400 font-black text-sm">
              Dépôt détecté sur la blockchain ! [2]
            </Text>
            <Text className="text-[10px] text-emerald-400/50">
              <Text>Votre clé d'embarquement DébrouillePro a été émise [2].</Text></Text>
          </View>
        )}
      </>
    </View>
  );
}

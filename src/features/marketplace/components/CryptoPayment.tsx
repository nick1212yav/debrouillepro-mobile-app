import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";
// src/features/marketplace/components/CryptoPayment.tsx
import { useState } from "react";
import { Bitcoin, Copy, Check, Loader2 } from "lucide-react-native";

interface Props {
  amount: number;
  currency: string;
  cryptoCurrency: "BTC" | "ETH" | "USDT";
  onConfirm: (txHash: string) => Promise<void>;
}

const CRYPTO_ICONS = {
  BTC: "₿",
  ETH: "⟠",
  USDT: "₮",
};

const CRYPTO_LABELS = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  USDT: "Tether (USDT)",
};

const WALLET_ADDRESSES = {
  BTC: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  ETH: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
};

export function CryptoPayment({
  amount,
  currency,
  cryptoCurrency,
  onConfirm,
}: Props) {
  const [address, setAddress] = useState(WALLET_ADDRESSES[cryptoCurrency]);
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    undefined.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    UIService.openToast("Adresse copiée", "success");
  };

  const handleConfirm = async () => {
    if (!txHash) {
      UIService.openToast("Veuillez entrer le hash de la transaction", "error");
      return;
    }
    setLoading(true);
    try {
      await onConfirm(txHash);
      UIService.openToast("Paiement en cours de validation", "success");
    } catch {
      UIService.openToast("Erreur lors de la vérification", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="space-y-4">
      <View className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <Bitcoin size={18} className="text-yellow-400" />
        <Text className="text-white font-medium">
          {CRYPTO_LABELS[cryptoCurrency]}
        </Text>
        <Text className="ml-auto text-white/60 text-sm">
          {amount} {currency}
        </Text>
      </View>
      <View>
        <Text className="text-xs text-white/40 mb-1">Adresse du portefeuille</Text>
        <View className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
          <code className="flex-1 text-white text-xs font-mono">
            {address}
          </code>
          <Pressable
            onPress={copyAddress}
            className="p-1.5 rounded-lg bg-white/5"
          >
            {copied ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <Copy size={14} className="text-white/40" />
            )}
          </Pressable>
        </View>
      </View>
      <View>
        <Text className="text-xs text-white/40 mb-1"><Text>Hash de la transaction</Text></Text>
        <TextInput
          value={txHash}
          onChangeText={(text) => setTxHash(text)}
          placeholder="0x..."
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/25"
        />
      </View>
      <Pressable
        onPress={handleConfirm}
        disabled={loading || !txHash}
        className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
        style={{  }}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Bitcoin size={16} />
        )}
        {loading ? "Vérification..." : "Confirmer le paiement"}
      </Pressable>
    </View>
  );
}

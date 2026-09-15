import { View, Text, TextInput, Pressable } from "react-native";

// src/features/marketplace/components/MobileMoneyPayment.tsx
import { useState } from "react";
import { Smartphone, Check, Loader2 } from "lucide-react-native";
import { toast } from "sonner";

interface Props {
  amount: number;
  currency: string;
  onConfirm: (provider: string, phone: string) => Promise<void>;
}

const PROVIDERS = [
  { id: "orange_money", label: "Orange Money", color: "#FF7900" },
  { id: "mtn_money", label: "MTN Mobile Money", color: "#FFCC00" },
  { id: "airtel_money", label: "Airtel Money", color: "#ED1C24" },
  { id: "moov_money", label: "Moov Money", color: "#00A651" },
];

export function MobileMoneyPayment({ amount, currency, onConfirm }: Props) {
  const [provider, setProvider] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleConfirm = async () => {
    if (!provider || !phone) {
      toast.error("Veuillez choisir un opérateur et saisir un numéro");
      return;
    }
    setLoading(true);
    try {
      await onConfirm(provider, phone);
      setDone(true);
      toast.success("Paiement en cours de validation");
    } catch {
      toast.error("Erreur lors du paiement");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View className="text-center py-6"><Check size={40} className="mx-auto mb-3 text-green-400" /><Text className="text-white font-bold text-lg">Paiement initié</Text><Text className="text-white/40 text-sm">Vous recevrez une confirmation par SMS
        </Text></View>
    );
  }

  return (
    <View className="space-y-4"><View className="flex gap-2 flex-wrap">{PROVIDERS.map((p) => (
          <Pressable key={p.id} onPress={() => setProvider(p.id)} className="flex-1 min-w-[80px] p-3 rounded-xl text-center transition-all" style={{ backgroundColor: provider === p.id ? `${p.color}22` : "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
            <Smartphone
              size={16}
              style={{  }}
              className="mx-auto mb-1"
            />
            <Text className="text-[10px] text-white/70">{p.label}</Text>
          </Pressable>
        ))}</View><TextInput value={phone} onChangeText={(value) => setPhone(value)} placeholder="Numéro de téléphone" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/25" keyboardType="phone-pad" /><Pressable onPress={handleConfirm} disabled={loading || !provider || !phone} className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40" style={{  }}>{loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Smartphone size={16} />
        )}{loading ? "Traitement..." : `Payer ${amount} ${currency}`}</Pressable></View>
  );
}

import { View, Text } from "react-native";

// src/features/transport/components/CardPayment.tsx
import { useState } from "react";
import { CreditCard, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CardPaymentProps {
  amount: number;
  currency: string;
  onSuccess: (txId: string) => void;
  onCancel: () => void;
}

export function CardPayment({
  amount,
  currency,
  onSuccess,
  onCancel,
}: CardPaymentProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Espacement automatique pour le numéro de carte bancaire
  const handleCardNumberChange = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(" "));
    } else {
      setCardNumber(v);
    }
  };

  const handleExpiryChange = (value: string) => {
    let clean = value.replace(/[^0-9]/g, "");
    if (clean.length > 2) {
      clean = `${clean.substring(0, 2)}/${clean.substring(2, 4)}`;
    }
    setExpiry(clean.substring(0, 5));
  };

  const handleSubmit = (e: unknown) => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onSuccess(
          `CARD-TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        );
      }, 1500);
    }, 2500); // 2.5 secondes de traitement de paiement par carte [2]
  };

  return (
    <View className="space-y-6">
      <>
        {!success ? (
          <motion.form
            key="card-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <View className="text-center space-y-1">
              <Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
                DébrouillePay [2]
              </Text>
              <Text className="text-sm font-bold text-white/60">
                Paiement par Carte Bancaire [2]
              </Text>
            </View>

            {/* Titulaire de la carte */}
            <View className="space-y-1">
              <Text className="text-xs text-white/40">
                Nom du titulaire *
              </Text>
              <Input
                required
                value={cardName}
                onChange={(text) => setCardName(text)}
                placeholder="Ex: Jean Mukendi"
                className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20"
              />
            </View>

            {/* Numéro de carte */}
            <View className="space-y-1">
              <Text className="text-xs text-white/40">Numéro de carte *</Text>
              <View className="relative">
                <View className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                  <CreditCard size={16} />
                </View>
                <Input
                  required
                  value={cardNumber}
                  onChange={(text) => handleCardNumberChange(text)}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className="pl-11 h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20"
                />
              </View>
            </View>

            {/* Expiration et CVC */}
            <View className="gap-4">
              <View className="space-y-1">
                <Text className="text-xs text-white/40">
                  Expiration (MM/AA) *
                </Text>
                <Input
                  required
                  value={expiry}
                  onChange={(text) => handleExpiryChange(text)}
                  placeholder="MM/AA"
                  maxLength={5}
                  className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20 text-center"
                />
              </View>
              <View className="space-y-1">
                <Text className="text-xs text-white/40">CVC *</Text>
                <Input
                  required
                  type="password"
                  value={cvc}
                  onChange={(text) =>
                    setCvc(
                      text.replace(/[^0-9]/g, "").substring(0, 3),
                    )
                  }
                  placeholder="•••"
                  maxLength={3}
                  className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20 text-center font-mono"
                />
              </View>
            </View>

            {/* Sécurité */}
            <View className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/15">
              <ShieldCheck size={14} className="flex-shrink-0" />
              <Text><Text>Chiffrement AES-256 standard de l'industrie [2]</Text></Text>
            </View>

            {/* Actions */}
            <View className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onPress={onCancel}
                className="flex-1 h-11 rounded-xl"
                disabled={loading}
              >
                <Text>Annuler</Text></Button>
              <Button
                type="submit"
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-white"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  `Débiter ${amount.toLocaleString()} ${currency} [2]`
                )}
              </Button>
            </View>
          </motion.form>
        ) : (
          <View
            key="card-success"
            className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-3"
          >
            <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
            <Text className="text-emerald-400 font-black text-sm">
              Paiement autorisé avec succès ! [2]
            </Text>
            <Text className="text-[10px] text-emerald-400/50">
              <Text>Traitement de votre réservation de trajet en cours [2]...</Text></Text>
          </View>
        )}
      </>
    </View>
  );
}

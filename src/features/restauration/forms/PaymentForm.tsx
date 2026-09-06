import { View, Text, TextInput } from "react-native";
import { useState } from "react";
import {
  Smartphone,
  CreditCard,
  Lock,
  ShieldCheck,
  AlertCircle,
  Coins,
} from "lucide-react-native";
import { PaymentValidator } from "../validators/payment.validator";

interface PaymentFormProps {
  gateway: "mobile_money" | "card" | "crypto";
  amount: number;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export function PaymentForm({
  gateway,
  amount,
  onSubmit,
  isSubmitting,
}: PaymentFormProps) {
  // Coordonnées Mobile Money
  const [phoneNumber, setPhoneNumber] = useState("");

  // Coordonnées Cartes
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Coordonnées Crypto
  const [cryptoCurrency, setCryptoCurrency] = useState<"USDT" | "USDC" | "BTC">(
    "USDT",
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFormSubmit = (e: unknown) => {
    const payload: any = { gateway };
    if (gateway === "mobile_money") payload.phoneNumber = phoneNumber;
    if (gateway === "card") {
      payload.cardNumber = cardNumber;
      payload.cardExpiry = cardExpiry;
      payload.cardCvv = cardCvv;
    }
    if (gateway === "crypto") payload.cryptoCurrency = cryptoCurrency;

    const validation = PaymentValidator.validate(payload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    onSubmit(payload);
  };

  return (
    <View
     
      className="space-y-4 text-left p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04]"
    >
      {/* Rendu dynamique : Passerelle MOBILE MONEY */}
      {gateway === "mobile_money" && (
        <View className="space-y-4">
          <View className="space-y-1.5">
            <Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">
              Numéro Mobile Money (Avec indicatif)
            </Text>
            <View className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
              <Smartphone size={15} className="text-white/40 shrink-0" />
              <TextInput
               
                placeholder="Ex: +225 07 08 09 10 11"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (errors.phoneNumber)
                    setErrors((prev) => ({ ...prev, phoneNumber: "" }));
                }}
               
                className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20"
                keyboardType="phone-pad" editable={!(isSubmitting)}/>
            </View>
            {errors.phoneNumber && (
              <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold">
                <AlertCircle size={10} />
                {errors.phoneNumber}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Rendu dynamique : Passerelle CARTES BANCAIRES */}
      {gateway === "card" && (
        <View className="space-y-4">
          <View className="space-y-1.5">
            <Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">
              Numéro de carte
            </Text>
            <View className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
              <CreditCard size={15} className="text-white/40 shrink-0" />
              <TextInput
               
                placeholder="4000 1234 5678 9010"
                value={cardNumber}
                onChangeText={(text) => {
                  setCardNumber(text);
                  if (errors.cardNumber)
                    setErrors((prev) => ({ ...prev, cardNumber: "" }));
                }}
               
                className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20"
                maxLength={19}
                editable={!(isSubmitting)}/>
            </View>
            {errors.cardNumber && (
              <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold">
                <AlertCircle size={10} />
                {errors.cardNumber}
              </Text>
            )}
          </View>

          <View className="gap-3">
            <View className="space-y-1.5">
              <Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">
                Date d'expiration
              </Text>
              <TextInput
               
                placeholder="MM/AA"
                value={cardExpiry}
                onChangeText={(text) => {
                  setCardExpiry(text);
                  if (errors.cardExpiry)
                    setErrors((prev) => ({ ...prev, cardExpiry: "" }));
                }}
               
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none placeholder:text-white/20"
                maxLength={5}
                editable={!(isSubmitting)}/>
              {errors.cardExpiry && (
                <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold">
                  <AlertCircle size={10} />
                  {errors.cardExpiry}
                </Text>
              )}
            </View>

            <View className="space-y-1.5">
              <Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">
                Code sécurité CVV
              </Text>
              <View className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
                <Lock size={14} className="text-white/40 shrink-0 mr-1.5" />
                <TextInput
                 
                  placeholder="123"
                  value={cardCvv}
                  onChangeText={(text) => {
                    setCardCvv(text);
                    if (errors.cardCvv)
                      setErrors((prev) => ({ ...prev, cardCvv: "" }));
                  }}
                 
                  className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20"
                  maxLength={4}
                  secureTextEntry editable={!(isSubmitting)}/>
              </View>
              {errors.cardCvv && (
                <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold">
                  <AlertCircle size={10} />
                  {errors.cardCvv}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Rendu dynamique : RÈGLEMENT CRYPTO */}
      {gateway === "crypto" && (
        <View className="space-y-4">
          <View className="space-y-1.5">
            <Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">
              Sélectionner un jeton stable (Token)
            </Text>
            <View className="flex gap-2">
              {(["USDT", "USDC", "BTC"] as const).map((curr) => (
                <Pressable
                  key={curr}
                  type="button"
                  onPress={() => setCryptoCurrency(curr)}
                  disabled={isSubmitting}
                  className={`flex-1 p-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer ${
                    cryptoCurrency === curr
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : "bg-white/5 border-white/5 text-white/40"
                  }`}
                >
                  <Coins size={13} />
                  {curr}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}

      <Pressable
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 rounded-xl bg-orange-500 disabled:bg-white/5 disabled:text-white/20 text-[#020617] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-orange-500/10"
      >
        <Lock size={14} />
        {isSubmitting
          ? "Exécution de la passerelle..."
          : `Payer ${amount.toLocaleString()} FCFA`}
      </Pressable>
    </View>
  );
}

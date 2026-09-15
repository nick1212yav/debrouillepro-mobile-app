import { Picker } from "@react-native-picker/picker";
import { View, Text, TextInput, NativeSyntheticEvent, Pressable } from "react-native";
import { useState } from "react";
import {
  MapPin,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Tag,
} from "lucide-react-native";
import { OrderValidator } from "../validators/order.validator";

interface OrderFormProps {
  onSubmit: (data: {
    deliveryAddress: string;
    paymentMethod: string;
    couponCode?: string;
  }) => void;
  isSubmitting: boolean;
}

export function OrderForm({ onSubmit, isSubmitting }: OrderFormProps) {
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mobile_money");
  const [couponCode, setCouponCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFormSubmit = (e: NativeSyntheticEvent<any>) => {
    e.preventDefault();
    const payload = {
      deliveryAddress,
      paymentMethod,
      couponCode: couponCode.trim().toUpperCase(),
    };

    const validation = OrderValidator.validate({
      items: [
        { name: "Validateur_Sécurité_Interne", quantity: 1, unitPrice: 100 },
      ], // Item fictif pour le validateur strict
      deliveryAddress,
      paymentMethod,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    onSubmit(payload);
  };

  return (
    <View className="space-y-4 text-left"><View className="space-y-1.5"><Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">Adresse exacte de livraison
        </Text><View className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10"><MapPin size={15} className="text-white/40 shrink-0" /><TextInput placeholder="Ex: Riviera 3, Rue de la Pharmacie des Allées, Villa 45" value={deliveryAddress} onChangeText={(value) => {
              setDeliveryAddress(value);
              if (errors.deliveryAddress)
                setErrors((prev) => ({ ...prev, deliveryAddress: "" }));
            }} className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20" required editable={!(isSubmitting)} /></View>{errors.deliveryAddress && (
          <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold"><AlertCircle size={10} />{errors.deliveryAddress}</Text>
        )}</View><View className="space-y-1.5"><Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">Moyen de règlement
        </Text><Picker onValueChange={(value) => setPaymentMethod(value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none" selectedValue={paymentMethod} enabled={!(isSubmitting)}><Picker.Item label="Mobile Money / Wave" value="mobile_money" /><Picker.Item label="Carte de Crédit (Visa / Mastercard)" value="card" /><Picker.Item label="Stablecoin Crypto (USDT)" value="crypto" /><Picker.Item label="Paiement Cash à la livraison" value="cash" /></Picker>{errors.paymentMethod && (
          <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold"><AlertCircle size={10} />{errors.paymentMethod}</Text>
        )}</View><View className="space-y-1.5"><Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">Code Coupon de réduction (Optionnel)
        </Text><View className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10"><Tag size={15} className="text-white/40 shrink-0" /><TextInput placeholder="Ex: MAMA225" value={couponCode} onChangeText={(value) => setCouponCode(value.toUpperCase())} className="flex-1 bg-transparent text-xs text-white font-mono outline-none placeholder:text-white/20" editable={!(isSubmitting)} /></View></View><Pressable disabled={isSubmitting || !deliveryAddress} className="w-full py-4 rounded-xl bg-orange-500 disabled:bg-white/5 disabled:text-white/20 text-[#020617] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-500/10"><ShieldCheck size={14} />{isSubmitting ? "Traitement de l'achat..." : "Enregistrer la Commande"}</Pressable></View>
  );
}

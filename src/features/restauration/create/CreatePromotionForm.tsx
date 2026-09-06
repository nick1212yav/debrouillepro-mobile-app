import { Picker } from "@react-native-picker/picker";
import { Pressable, View, Text, TextInput } from "react-native";
import { useState } from "react";
import { Tag, ShieldCheck, AlertCircle, Calendar } from "lucide-react-native";

interface CreatePromotionFormProps {
  onSubmit: (data: any) => Promise<boolean>;
  isSubmitting: boolean;
}

export function CreatePromotionForm({
  onSubmit,
  isSubmitting,
}: CreatePromotionFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // États du formulaire
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(
    "percent",
  );
  const [discountValue, setDiscountValue] = useState<number>(15);
  const [minPurchaseRequired, setMinPurchaseRequired] = useState<number>(5000);
  const [expiryDate, setExpiryDate] = useState("");

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!code.trim()) newErrors.code = "Le code promotionnel est obligatoire.";
    if (discountValue <= 0)
      newErrors.discountValue = "La valeur de réduction doit être positive.";
    if (discountType === "percent" && discountValue > 100) {
      newErrors.discountValue =
        "Un pourcentage de réduction ne peut pas excéder 100%.";
    }
    if (!expiryDate)
      newErrors.expiryDate =
        "La date d'expiration de la campagne est obligatoire.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: unknown) => {
    if (!validateForm()) return;

    const payload = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue,
      minPurchaseRequired,
      expiryDate,
      active: true,
    };

    const success = await onSubmit(payload);
    if (success) {
      setCode("");
      setExpiryDate("");
    }
  };

  return (
    <View
     
      className="max-w-md mx-auto p-6 rounded-3xl bg-slate-900/50 border border-slate-800 text-left space-y-5"
    >
      <View className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <Tag className="text-orange-500 w-5 h-5" />
        <View>
          <Text className="text-base font-black text-white">
            Générer une Offre Promotionnelle
          </Text>
          <Text className="text-[10px] text-slate-400">
            Émettez des bons d'achats pour fidéliser vos clients
          </Text>
        </View>
      </View>

      <View className="space-y-1.5">
        <Text className="block text-[10px] text-slate-400 uppercase font-bold">
          Code Promotionnel (CODE UNIQUE)
        </Text>
        <TextInput
         
          placeholder="Ex: MAMA225, PROMOFREE"
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-mono outline-none"
         />
        {errors.code && (
          <Text className="text-[10px] text-rose-500 flex items-center gap-1">
            <AlertCircle size={10} />
            {errors.code}
          </Text>
        )}
      </View>

      <View className="gap-3">
        <View className="space-y-1.5">
          <Text className="block text-[10px] text-slate-400 uppercase font-bold">
            Type de réduction
          </Text>
          <Picker
           
            onValueChange={(val) => setDiscountType(val as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none"
           selectedValue={discountType}>
            <Picker.Item label="Pourcentage (%)" value="percent" />
            <Picker.Item label="Montant Fixe (FCFA)" value="fixed" />
          </Picker>
        </View>

        <View className="space-y-1.5">
          <Text className="block text-[10px] text-slate-400 uppercase font-bold">
            Valeur
          </Text>
          <TextInput
           
            value={discountValue}
            onChangeText={(text) => setDiscountValue(Number(text))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none"
            min={1}
            keyboardType="numeric"/>
          {errors.discountValue && (
            <Text className="text-[10px] text-rose-500 flex items-center gap-1">
              <AlertCircle size={10} />
              {errors.discountValue}
            </Text>
          )}
        </View>
      </View>

      <View className="space-y-1.5">
        <Text className="block text-[10px] text-slate-400 uppercase font-bold">
          Achat Minimum Requis (FCFA)
        </Text>
        <TextInput
         
          value={minPurchaseRequired}
          onChangeText={(text) => setMinPurchaseRequired(Number(text))}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none"
          min={0}
         keyboardType="numeric"/>
      </View>

      <View className="space-y-1.5">
        <Text className="block text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
          <Calendar size={11} /> Date d'expiration
        </Text>
        <TextInput
         
          value={expiryDate}
          onChangeText={(text) => setExpiryDate(text)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none"
         />
        {errors.expiryDate && (
          <Text className="text-[10px] text-rose-500 flex items-center gap-1">
            <AlertCircle size={10} />
            {errors.expiryDate}
          </Text>
        )}
      </View>

      <Pressable
        disabled={isSubmitting || !code.trim() || !expiryDate}
        className="w-full py-4 rounded-xl bg-orange-500 disabled:bg-slate-800 disabled:text-white/20 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-orange-500/10"
      >
        <ShieldCheck size={14} />
        {isSubmitting
          ? "Création du coupon..."
          : "Activer l'Offre de Réduction"}
      </Pressable>
    </View>
  );
}

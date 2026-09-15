import { Picker } from "@react-native-picker/picker";
import { View, Text, TextInput, NativeSyntheticEvent, Pressable } from "react-native";
import { useState } from "react";
import {
  ChefHat,
  ShieldCheck,
  AlertCircle,
  MapPin,
  DollarSign,
  Clock,
} from "lucide-react-native";
import { RestaurantValidator } from "../validators/restaurant.validator";
import { CUISINES } from "../constants/cuisines";

interface RestaurantFormProps {
  initialData?: {
    name: string;
    cuisine: string;
    location: string;
    minOrder: number;
    description?: string;
  };
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export function RestaurantForm({
  initialData,
  onSubmit,
  isSubmitting,
}: RestaurantFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [cuisine, setCuisine] = useState(
    initialData?.cuisine || CUISINES[0]?.label || "Africaine",
  );
  const [location, setLocation] = useState(initialData?.location || "");
  const [minOrder, setMinOrder] = useState<number>(
    initialData?.minOrder || 2000,
  );
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTriggerSubmit = (e: NativeSyntheticEvent<any>) => {
    e.preventDefault();
    const payload = { name, cuisine, location, minOrder, description };

    const validation = RestaurantValidator.validate(payload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    onSubmit(payload);
  };

  return (
    <View className="space-y-4 text-left"><View className="space-y-1.5"><Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">Nom de l'établissement
        </Text><View className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10"><ChefHat size={15} className="text-white/40 shrink-0" /><TextInput placeholder="Ex: Chez Mama Africa" value={name} onChangeText={(value) => {
              setName(value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }} className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20" editable={!(isSubmitting)} /></View>{errors.name && (
          <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold"><AlertCircle size={10} />{errors.name}</Text>
        )}</View><View className="space-y-1.5"><Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">Type de cuisine
        </Text><Picker onValueChange={(value) => setCuisine(value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none" selectedValue={cuisine} enabled={!(isSubmitting)}>{CUISINES.map((c) => (
            <Picker.Item label={c.label} value={c.label} />
          ))}</Picker></View><View className="space-y-1.5"><Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">Adresse exacte de l'établissement
        </Text><View className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10"><MapPin size={15} className="text-white/40 shrink-0" /><TextInput placeholder="Ex: Boulevard Hassan II, Cocody, Abidjan" value={location} onChangeText={(value) => {
              setLocation(value);
              if (errors.location)
                setErrors((prev) => ({ ...prev, location: "" }));
            }} className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20" editable={!(isSubmitting)} /></View>{errors.location && (
          <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold">
            <AlertCircle size={10} />
            {errors.location}
          </Text>
        )}</View><View className="space-y-1.5"><Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider flex items-center gap-1"><DollarSign size={11} />Minimum de commande (FCFA)
        </Text><TextInput value={minOrder} onChangeText={(value) => {
            setMinOrder(Number(value));
            if (errors.minOrder)
              setErrors((prev) => ({ ...prev, minOrder: "" }));
          }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none" keyboardType="numeric" editable={!(isSubmitting)} />{errors.minOrder && (
          <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold">
            <AlertCircle size={10} />
            {errors.minOrder}
          </Text>
        )}</View><View className="space-y-1.5"><Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">Description de votre univers culinaire
        </Text><TextInput placeholder="Racontez-nous l'authenticité de vos plats emblématiques..." value={description} onChangeText={(value) => setDescription(value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-500/50 placeholder:text-white/20" multiline textAlignVertical="top" editable={!(isSubmitting)} /></View><Pressable disabled={isSubmitting} className="w-full py-4 rounded-xl bg-orange-500 disabled:bg-white/5 disabled:text-white/20 text-[#020617] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-500/10"><ShieldCheck size={14} />{isSubmitting ? "Traitement..." : "Enregistrer l'Établissement"}</Pressable></View>
  );
}

import { Pressable, View, Text, TextInput, NativeSyntheticEvent } from "react-native";
import React, { useState, useEffect } from "react";
import { X, Edit3 } from "lucide-react-native";
import { toast } from "sonner";
import type { Accommodation } from "../types/accommodation.types";

interface EditAccommodationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  accommodation: Accommodation;
  onUpdate: (data: any) => Promise<void>;
}

export const EditAccommodationSheet: React.FC<EditAccommodationSheetProps> = ({
  isOpen,
  onClose,
  accommodation,
  onUpdate,
}) => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accommodation) {
      setTitle(accommodation.title);
      setPrice(String(accommodation.pricing.amount));
    }
  }, [accommodation]);

  if (!isOpen) return null;

  const handleSubmit = async (e: NativeSyntheticEvent<any>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdate({
        ...accommodation,
        title,
        pricing: { ...accommodation.pricing, amount: Number(price) },
      });
      toast.success("Mise à jour effectuée !");
      onClose();
    } catch {
      toast.error("Erreur de mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }} className="w-full max-w-lg rounded-t-[32px] p-6 text-white flex flex-col max-h-[85vh] overflow-y-auto bg-slate-950 border-t border-white/10">
        <View className="flex items-center justify-between mb-5">
          <Text className="text-base font-bold flex items-center gap-2"><Edit3 size={18} className="text-indigo-400" /><Text>Modifier l'Annonce</Text></Text>
          <Pressable onPress={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60">
            <X size={16} />
          </Pressable>
        </View>

        <View className="flex flex-col gap-4 text-xs"><View><Text className="text-white/40 font-bold block mb-1 uppercase tracking-wider text-[10px]">Titre de l'annonce
            </Text><TextInput required value={title} onChangeText={(value) => setTitle(value)} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white" /></View><View><Text className="text-white/40 font-bold block mb-1 uppercase tracking-wider text-[10px]">Prix par nuit (FCFA)
            </Text><TextInput required value={price} onChangeText={(value) => setPrice(value)} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white" keyboardType="numeric" /></View><Pressable disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs">{loading ? "Sauvegarde..." : "Enregistrer les modifications"}</Pressable></View>
      </View>
    </View>
  );
};

import { Pressable, View, Text, TextInput } from "react-native";
import { useState } from "react";
import { Tag, ShieldCheck, AlertCircle } from "lucide-react-native";

interface MenuFormProps {
  onSubmit: (categoryName: string) => void;
  isSubmitting: boolean;
}

export function MenuForm({ onSubmit, isSubmitting }: MenuFormProps) {
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState("");

  const handleFormSubmit = (e: unknown) => {
    if (!categoryName.trim()) {
      setError("Le nom de la catégorie de menu est obligatoire.");
      return;
    }
    setError("");
    onSubmit(categoryName.trim());
    setCategoryName("");
  };

  return (
    <View
     
      className="space-y-4 text-left p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04]"
    >
      <View className="space-y-1.5">
        <Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">
          Nom de la catégorie de menu
        </Text>
        <View className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
          <Tag size={15} className="text-white/40 shrink-0" />
          <TextInput
           
            placeholder="Ex: Grillades, Softs, Tapas..."
            value={categoryName}
            onChangeText={(text) => {
              setCategoryName(text);
              if (error) setError("");
            }}
           
            className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20"
            editable={!(isSubmitting)}/>
        </View>
        {error && (
          <Text className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold">
            <AlertCircle size={10} />
            {error}
          </Text>
        )}
      </View>

      <Pressable
        disabled={isSubmitting || !categoryName.trim()}
        className="w-full py-3.5 rounded-xl bg-orange-500 disabled:bg-white/5 disabled:text-white/20 text-[#020617] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
      >
        <ShieldCheck size={14} />
        {isSubmitting ? "Création..." : "Ajouter au Menu"}
      </Pressable>
    </View>
  );
}

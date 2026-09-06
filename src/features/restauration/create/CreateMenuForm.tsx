import { View, Text, TextInput } from "react-native";
import { useState } from "react";
import { Sparkles, ShieldCheck, AlertCircle } from "lucide-react-native";

interface CreateMenuFormProps {
  onSubmit: (categoryName: string) => Promise<boolean>;
  isSubmitting: boolean;
}

export function CreateMenuForm({
  onSubmit,
  isSubmitting,
}: CreateMenuFormProps) {
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState("");

  const handleFormSubmit = async (e: unknown) => {
    if (!categoryName.trim()) {
      setError("Le nom de la catégorie de menu est obligatoire.");
      return;
    }
    setError("");
    const success = await onSubmit(categoryName.trim());
    if (success) {
      setCategoryName("");
    }
  };

  return (
    <View
     
      className="max-w-md mx-auto p-6 rounded-3xl bg-slate-900/50 border border-slate-800 text-left space-y-5"
    >
      <View className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <Sparkles className="text-orange-500 w-5 h-5" />
        <View>
          <Text className="text-base font-black text-white">
            Ajouter une Catégorie de Menu
          </Text>
          <Text className="text-[10px] text-slate-400">
            <Text>Structurez et organisez l'affichage de votre carte</Text></Text>
        </View>
      </View>

      <View className="space-y-1.5">
        <Text className="block text-[10px] text-slate-400 uppercase font-bold">
          Nom de la catégorie
        </Text>
        <TextInput
         
          placeholder="Ex: Entrées & Tapas, Plats Signatures, Boissons..."
          value={categoryName}
          onChangeText={(text) => {
            setCategoryName(text);
            if (error) setError("");
          }}
         
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none"
          editable={!(isSubmitting)}/>
        {error && (
          <Text className="text-[10px] text-rose-500 flex items-center gap-1">
            <AlertCircle size={10} />
            {error}
          </Text>
        )}
      </View>

      <Pressable
        type="submit"
        disabled={isSubmitting || !categoryName.trim()}
        className="w-full py-4 rounded-xl bg-orange-500 disabled:bg-slate-800 disabled:text-white/20 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-orange-500/10"
      >
        <ShieldCheck size={14} />
        {isSubmitting ? "Création..." : "Enregistrer la Catégorie"}
      </Pressable>
    </View>
  );
}

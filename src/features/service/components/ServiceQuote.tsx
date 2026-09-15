import { Pressable, View, TextInput } from "react-native";
import { useState } from "react";
import { toast } from "sonner";

export function ServiceQuote({
  onRequest,
}: {
  onRequest: (data: { description: string; budget?: string }) => void;
}) {
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const handleSubmit = () => {
    if (!description) {
      toast.error("Décrivez votre besoin");
      return;
    }
    onRequest({ description, budget: budget || undefined });
  };
  return (
    <View className="space-y-3">
      <TextInput value={description} onChangeText={(value) => setDescription(value)} placeholder="Décrivez votre projet..." className="w-full rounded-xl p-3 bg-white/5 border border-white/10 text-white" multiline textAlignVertical="top" />
      <TextInput value={budget} onChangeText={(value) => setBudget(value)} placeholder="Budget estimé" className="w-full rounded-xl p-3 bg-white/5 border border-white/10 text-white" />
      <Pressable onPress={handleSubmit} className="w-full py-3 rounded-xl text-white bg-orange-500">
        Demander un devis
      </Pressable>
    </View>
  );
}

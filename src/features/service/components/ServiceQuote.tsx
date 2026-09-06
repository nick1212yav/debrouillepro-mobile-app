import { UIService } from "@/core/sdk/ui/UIService";
import { Pressable, View, TextInput } from "react-native";
import { useState } from "react";

export function ServiceQuote({
  onRequest,
}: {
  onRequest: (data: { description: string; budget?: string }) => void;
}) {
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const handleSubmit = () => {
    if (!description) {
      UIService.openToast("Décrivez votre besoin", "error");
      return;
    }
    onRequest({ description, budget: budget || undefined });
  };
  return (
    <View className="space-y-3">
      <TextInput
        value={description}
        onChangeText={(text) => setDescription(text)}
        placeholder="Décrivez votre projet..."
        className="w-full rounded-xl p-3 bg-white/5 border border-white/10 text-white" multiline textAlignVertical="top"
      />
      <TextInput
        value={budget}
        onChangeText={(text) => setBudget(text)}
        placeholder="Budget estimé"
        className="w-full rounded-xl p-3 bg-white/5 border border-white/10 text-white"
      />
      <Pressable
        onPress={handleSubmit}
        className="w-full py-3 rounded-xl text-white bg-orange-500"
      >
        Demander un devis
      </Pressable>
    </View>
  );
}

import { View } from "react-native";

// src/features/marketplace/create/VisibilitySection.tsx
import { FieldSwitch } from "./shared";

interface Props {
  form: {
    visible: boolean;
    allowComments: boolean;
    allowQuestions: boolean;
  };
  update: (key: string, value: any) => void;
  color: string;
}

export function VisibilitySection({ form, update, color }: Props) {
  return (
    <View className="pt-2 space-y-4">
      <FieldSwitch
        label="Produit visible sur la boutique"
        checked={form.visible !== false}
        onChange={(v) => update("visible", v)}
      />
      <FieldSwitch
        label="Autoriser les commentaires"
        checked={form.allowComments !== false}
        onChange={(v) => update("allowComments", v)}
      />
      <FieldSwitch
        label="Autoriser les questions"
        checked={form.allowQuestions !== false}
        onChange={(v) => update("allowQuestions", v)}
      />
    </View>
  );
}

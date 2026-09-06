import { View } from "react-native";

// src/features/marketplace/create/WarrantySection.tsx
import { FieldInput, TagsInput } from "./shared";

interface Props {
  form: {
    warrantyMonths?: number;
    warrantyCoverage?: string[];
  };
  update: (key: string, value: any) => void;
}

export function WarrantySection({ form, update }: Props) {
  return (
    <View className="pt-2 space-y-4">
      <FieldInput
        label="Garantie (mois)"
        placeholder="Ex: 12"
        value={form.warrantyMonths?.toString() || ""}
        onChange={(v) => update("warrantyMonths", parseInt(v) || 0)}
        type="number"
      />
      <TagsInput
        tags={form.warrantyCoverage || []}
        onChange={(tags) => update("warrantyCoverage", tags)}
        label="Couverture de la garantie"
        placeholder="Ex: Pièces, Main d'œuvre..."
      />
    </View>
  );
}

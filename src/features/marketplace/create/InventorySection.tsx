import { View } from "react-native";

// src/features/marketplace/create/InventorySection.tsx
import { FieldInput, FieldSelect } from "./shared";

interface Props {
  form: {
    stock: number;
    unit: string;
    minOrder?: number;
    maxOrder?: number;
  };
  update: (key: string, value: any) => void;
}

const UNIT_OPTIONS = [
  { value: "pièce", label: "Pièce" },
  { value: "kg", label: "Kilogramme" },
  { value: "lot", label: "Lot" },
  { value: "litre", label: "Litre" },
  { value: "mètre", label: "Mètre" },
];

export function InventorySection({ form, update }: Props) {
  return (
    <View className="pt-2 space-y-4">
      <FieldInput
        label="Quantité en stock"
        placeholder="Ex: 50"
        value={form.stock.toString()}
        onChange={(v) => update("stock", parseInt(v) || 0)}
        type="number"
        required
      />

      <FieldSelect
        label="Unité"
        value={form.unit}
        onChange={(v) => update("unit", v)}
        options={UNIT_OPTIONS}
      />

      <FieldInput
        label="Quantité minimum par commande (optionnel)"
        placeholder="Ex: 2"
        value={form.minOrder?.toString() || ""}
        onChange={(v) => update("minOrder", parseInt(v) || undefined)}
        type="number"
      />

      <FieldInput
        label="Quantité maximum par commande (optionnel)"
        placeholder="Ex: 100"
        value={form.maxOrder?.toString() || ""}
        onChange={(v) => update("maxOrder", parseInt(v) || undefined)}
        type="number"
      />
    </View>
  );
}

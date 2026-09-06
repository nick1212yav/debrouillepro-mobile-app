import { View } from "react-native";

// src/features/marketplace/create/PricingSection.tsx
import { PriceInput, FieldSwitch } from "./shared";

interface Props {
  form: {
    price: number;
    currency: string;
    isDigital: boolean;
  };
  update: (key: string, value: any) => void;
  color: string;
}

export function PricingSection({ form, update, color }: Props) {
  return (
    <View className="pt-2 space-y-4">
      <PriceInput
        label="Prix"
        value={form.price}
        onChange={(v) => update("price", v)}
        currency={form.currency}
        onCurrencyChange={(c) => update("currency", c)}
        required
      />

      <FieldSwitch
        label="Produit digital (pas de livraison physique)"
        checked={form.isDigital}
        onChange={(v) => update("isDigital", v)}
      />
    </View>
  );
}

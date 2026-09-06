import { View } from "react-native";

// src/features/marketplace/create/ShippingSection.tsx
import { FieldInput, FieldSwitch } from "./shared";

interface Props {
  form: {
    deliveryAvailable: boolean;
    deliveryDays?: number;
    shippingCost?: number;
    pickupAvailable: boolean;
  };
  update: (key: string, value: any) => void;
}

export function ShippingSection({ form, update }: Props) {
  return (
    <View className="pt-2 space-y-4">
      <FieldSwitch
        label="Livraison disponible"
        checked={form.deliveryAvailable}
        onChange={(v) => update("deliveryAvailable", v)}
      />

      {form.deliveryAvailable && (
        <>
          <FieldInput
            label="Délai de livraison (jours)"
            placeholder="Ex: 3"
            value={form.deliveryDays?.toString() || ""}
            onChange={(v) => update("deliveryDays", parseInt(v) || 0)}
            type="number"
          />
          <FieldInput
            label="Frais de livraison (optionnel)"
            placeholder="Ex: 2000"
            value={form.shippingCost?.toString() || ""}
            onChange={(v) => update("shippingCost", parseFloat(v) || 0)}
            type="number"
          />
          <FieldSwitch
            label="Retrait en magasin disponible"
            checked={form.pickupAvailable || false}
            onChange={(v) => update("pickupAvailable", v)}
          />
        </>
      )}
    </View>
  );
}

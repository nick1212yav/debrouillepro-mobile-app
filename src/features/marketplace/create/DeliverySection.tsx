import { View } from "react-native";

// src/features/marketplace/create/DeliverySection.tsx
import { FieldInput, TagsInput, FieldSwitch } from "./shared";

interface Props {
  form: {
    deliveryAreas?: string[];
    deliveryCost?: number;
    freeDeliveryThreshold?: number;
    expressDelivery: boolean;
  };
  update: (key: string, value: any) => void;
}

export function DeliverySection({ form, update }: Props) {
  return (
    <View className="pt-2 space-y-4">
      <TagsInput
        tags={form.deliveryAreas || []}
        onChange={(tags) => update("deliveryAreas", tags)}
        label="Zones de livraison"
        placeholder="Ex: Kinshasa, Dakar, Abidjan..."
      />
      <FieldInput
        label="Frais de livraison (optionnel)"
        placeholder="Ex: 2000"
        value={form.deliveryCost?.toString() || ""}
        onChange={(v) => update("deliveryCost", parseFloat(v) || 0)}
        type="number"
      />
      <FieldInput
        label="Livraison gratuite à partir de (optionnel)"
        placeholder="Ex: 50000"
        value={form.freeDeliveryThreshold?.toString() || ""}
        onChange={(v) => update("freeDeliveryThreshold", parseFloat(v) || 0)}
        type="number"
      />
      <FieldSwitch
        label="Livraison express disponible"
        checked={form.expressDelivery || false}
        onChange={(v) => update("expressDelivery", v)}
      />
    </View>
  );
}

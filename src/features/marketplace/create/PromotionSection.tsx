import { View } from "react-native";

// src/features/marketplace/create/PromotionSection.tsx
import { FieldInput, FieldSwitch } from "./shared";

interface Props {
  form: {
    discountPercent?: number;
    discountStart?: string;
    discountEnd?: string;
    isFeatured: boolean;
    flashSale: boolean;
  };
  update: (key: string, value: any) => void;
}

export function PromotionSection({ form, update }: Props) {
  return (
    <View className="pt-2 space-y-4"><FieldInput label="Pourcentage de réduction" placeholder="Ex: 20" value={form.discountPercent?.toString() || ""} onChange={(v) => update("discountPercent", parseFloat(v) || 0)} type="number" min={0} max={100} /><View className="gap-3"><FieldInput label="Date de début de la promotion" value={form.discountStart || ""} onChange={(v) => update("discountStart", v)} type="text" placeholder="YYYY-MM-DD" /><FieldInput label="Date de fin" value={form.discountEnd || ""} onChange={(v) => update("discountEnd", v)} type="text" placeholder="YYYY-MM-DD" /></View><FieldSwitch label="Produit mis en avant" checked={form.isFeatured || false} onChange={(v) => update("isFeatured", v)} /><FieldSwitch label="Vente flash (affichage spécial)" checked={form.flashSale || false} onChange={(v) => update("flashSale", v)} /></View>
  );
}

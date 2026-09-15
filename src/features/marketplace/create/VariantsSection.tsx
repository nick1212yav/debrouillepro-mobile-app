import { View } from "react-native";

// src/features/marketplace/create/VariantsSection.tsx
import { VariantEditor } from "./shared";

interface Props {
  variants: Array<{ id: string; name: string; options: string[] }>;
  onChange: (variants: any[]) => void;
  color: string;
}

export function VariantsSection({ variants, onChange, color }: Props) {
  return (
    <View className="pt-2">
      <VariantEditor
        variants={variants}
        onChange={onChange}
        label="Variantes du produit"
      />
    </View>
  );
}

import { Text, View } from "react-native";

// src/features/marketplace/create/SEOSection.tsx
import { FieldInput, FieldTextarea } from "./shared";

interface Props {
  form: {
    seoTitle?: string;
    seoDescription?: string;
    slug?: string;
  };
  update: (key: string, value: any) => void;
}

export function SEOSection({ form, update }: Props) {
  return (
    <View className="pt-2 space-y-4">
      <FieldInput
        label="Titre SEO"
        placeholder="Titre pour les moteurs de recherche"
        value={form.seoTitle || ""}
        onChange={(v) => update("seoTitle", v)}
      />
      <FieldTextarea
        label="Description SEO"
        placeholder="Description pour les moteurs de recherche (max 160 caractères)"
        value={form.seoDescription || ""}
        onChange={(v) => update("seoDescription", v)}
        rows={2}
      />
      <FieldInput
        label="Slug (URL personnalisée)"
        placeholder="ex: iphone-15-pro-max"
        value={form.slug || ""}
        onChange={(v) => update("slug", v)}
      />
      <Text className="text-[10px] text-white/30">
        Laissez vide pour une génération automatique
      </Text>
    </View>
  );
}

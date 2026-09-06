import { View } from "react-native";

// src/features/marketplace/create/GeneralSection.tsx
import { Tag, FileText, MapPin } from "lucide-react-native";
import { FieldInput, FieldTextarea, FieldSelect, TagsInput } from "./shared";
import type { ProductFormData } from "../types";

interface Props {
  form: ProductFormData;
  update: (key: keyof ProductFormData, value: any) => void;
}

const CATEGORIES = [
  { value: "Alimentation", label: "Alimentation" },
  { value: "Artisanat", label: "Artisanat" },
  { value: "Tech", label: "Technologie" },
  { value: "Mode", label: "Mode" },
  { value: "Services", label: "Services" },
  { value: "Beauté", label: "Beauté & Santé" },
  { value: "Maison", label: "Maison & Jardin" },
  { value: "Véhicules", label: "Véhicules" },
  { value: "Autre", label: "Autre" },
];

export function GeneralSection({ form, update }: Props) {
  return (
    <View className="pt-2 space-y-3">
      <FieldInput
        icon={Tag}
        label="Titre du produit"
        placeholder="Ex: iPhone 15 Pro Max"
        value={form.title}
        onChange={(v) => update("title", v)}
        required
      />

      <FieldTextarea
        icon={FileText}
        label="Description"
        placeholder="Décrivez votre produit en détail..."
        value={form.description}
        onChange={(v) => update("description", v)}
        rows={4}
        required
      />

      <FieldSelect
        icon={Tag}
        label="Catégorie"
        value={form.category}
        onChange={(v) => update("category", v)}
        options={CATEGORIES}
        placeholder="Sélectionnez une catégorie"
        required
      />

      <TagsInput
        tags={form.tags || []}
        onChange={(tags) => update("tags", tags)}
        label="Tags"
        placeholder="Ex: premium, bio, fait main"
      />

      <FieldInput
        icon={MapPin}
        label="Localisation"
        placeholder="Ville, quartier..."
        value={form.location || ""}
        onChange={(v) => update("location", v)}
      />
    </View>
  );
}

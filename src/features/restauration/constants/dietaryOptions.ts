export interface DietaryOption {
  id: string;
  label: string;
  description: string;
  allowedTags: string[];
  medicalNotes?: string;
}

export const DIETARY_OPTIONS: DietaryOption[] = [
  {
    id: "vegan",
    label: "Végétalien (Vegan)",
    description:
      "Exclut tout produit d'origine animale (viande, poisson, lait, œufs, miel).",
    allowedTags: ["vege", "vegan", "végétalien", "vegetal"],
    medicalNotes: "Convient aux personnes intolérantes au lactose.",
  },
  {
    id: "vegetarian",
    label: "Végétarien",
    description:
      "Sans viande ni poisson, mais autorise les produits laitiers et les œufs.",
    allowedTags: ["vegetarian", "végétarien", "sans-viande"],
  },
  {
    id: "halal",
    label: "Certifié Halal",
    description:
      "Plats préparés conformément aux prescriptions confessionnelles islamiques.",
    allowedTags: ["halal", "conforme-halal"],
  },
  {
    id: "gluten-free",
    label: "Sans Gluten",
    description: "Recettes élaborées sans blé, orge, avoine ou seigle.",
    allowedTags: ["gluten-free", "sans-gluten", "coeliaque"],
    medicalNotes:
      "Fortement recommandé pour les personnes atteintes de la maladie cœliaque.",
  },
  {
    id: "diabetic-friendly",
    label: "Indice Glycémique Bas",
    description: "Plats pauvres en sucres rapides et glucides raffinés.",
    allowedTags: ["low-sugar", "diabetique", "glycemic-control"],
    medicalNotes:
      "Adapté pour la régulation nutritionnelle des personnes diabétiques.",
  },
];

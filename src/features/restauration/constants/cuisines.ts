export interface CuisineMetadata {
  id: string;
  label: string;
  description: string;
  popularDishes: string[];
  iconKey: string;
}

export const CUISINES: CuisineMetadata[] = [
  {
    id: "africaine",
    label: "Africaine Traditionnelle",
    description:
      "Plats mijotés authentiques, grillades au charbon de bois et accompagnements locaux.",
    popularDishes: [
      "Attiéké poisson braisé",
      "Garba complet",
      "Sauce graine",
      "Placali",
      "Saka-Saka",
    ],
    iconKey: "Leaf",
  },
  {
    id: "fusion",
    label: "Fusion Afro-Gastronomique",
    description:
      "L'art de marier les saveurs du terroir ouest-africain avec les techniques culinaires mondiales.",
    popularDishes: [
      "Risotto au gombo et homard",
      "Tiramisu au kinkeliba",
      "Filet de capitaine glacé au miel de savane",
    ],
    iconKey: "ChefHat",
  },
  {
    id: "pizza",
    label: "Pizzas Artisanales",
    description:
      "Pizzas cuites au feu de bois intégrant des garnitures locales créatives.",
    popularDishes: [
      "Pizza Margherita",
      "Pizza Afrique (Poulet, Plantain rissolé)",
      "Pizza 4 fromages locaux",
    ],
    iconKey: "Pizza",
  },
  {
    id: "snack",
    label: "Café & Snack",
    description:
      "Brunchs tropicaux, pâtisseries fraîches et sélections de cafés de spécialité d'Afrique de l'Est.",
    popularDishes: [
      "Café filtre de Man",
      "Croissant au beurre de cacao",
      "Smoothie papaye-mangue",
    ],
    iconKey: "Coffee",
  },
  {
    id: "grillades",
    label: "Grillades & Maquis",
    description:
      "Choukouya, brochettes épicées et viandes marinées saisies à la braise.",
    popularDishes: [
      "Brochettes de bœuf d'animaux élevés en plein air",
      "Choukouya de mouton parfumé",
      "Demi-poulet braisé",
    ],
    iconKey: "Flame",
  },
  {
    id: "asiatique",
    label: "Asiatique",
    description:
      "Woks, nouilles sautées et nems revisités aux herbes aromatiques locales.",
    popularDishes: [
      "Wok de poulet aux oignons doux",
      "Nems au poisson capitaine",
      "Riz sauté à la citronnelle",
    ],
    iconKey: "Compass",
  },
];

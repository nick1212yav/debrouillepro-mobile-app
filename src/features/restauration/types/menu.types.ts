import { DietType } from "./enums";

export interface NutritionValues {
  calories: number;
  proteins: number; // en grammes
  carbohydrates: number; // en grammes
  lipids: number; // en grammes
  sodium: number; // en milligrammes
  fiber: number; // en grammes
}

export interface MenuItem {
  name: string;
  price: number;
  description: string;
  tag: string; // "Bestseller", "Chef's Touch" etc.
  calories: number;
  prepTime: string; // "15 min"
  allergens: string[];
  dietaryRestrictions: DietType[] | string[];
  isVeggie?: boolean;
  category: string;
  nutrition?: NutritionValues;
  costToProduce?: number; // Coût d'achat/matière première
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}

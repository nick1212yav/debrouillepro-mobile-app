import { z } from "zod";

// 1. Définition et export du schéma de validation Zod
export const restaurantFormSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  cuisine: z.string().min(2, "La spécialité de cuisine est requise."),
  location: z.string().min(3, "La localisation est requise."),
  priceRange: z.string().optional().default("$$"),
  deliveryTime: z.string().optional().default("20-30 min"),
  description: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
});

// 2. Export du type déduit pour RHF (React Hook Form)
export type RestaurantFormValues = z.infer<typeof restaurantFormSchema>;

export interface RestaurantFormInput {
  name: string;
  cuisine: string;
  location: string;
  minOrder: number;
  description?: string;
}

export class RestaurantValidator {
  /**
   * Valide les données d'un établissement de restauration (compatibilité adaptateurs et services)
   */
  public static validate(input: Partial<RestaurantFormInput>): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    if (!input.name || input.name.trim() === "") {
      errors.name = "Le nom de l'établissement est requis.";
    } else if (input.name.trim().length < 3) {
      errors.name = "Le nom doit comporter au moins 3 caractères.";
    }

    if (!input.cuisine || input.cuisine.trim() === "") {
      errors.cuisine = "La catégorie de cuisine est requise.";
    }

    if (!input.location || input.location.trim() === "") {
      errors.location = "L'adresse physique de l'établissement est requise.";
    } else if (input.location.trim().length < 8) {
      errors.location =
        "Veuillez fournir une adresse plus précise (min. 8 caractères).";
    }

    if (input.minOrder === undefined || input.minOrder === null) {
      errors.minOrder = "Le montant minimum de commande est requis.";
    } else if (isNaN(input.minOrder) || input.minOrder < 0) {
      errors.minOrder = "Le minimum de commande doit être un nombre positif.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

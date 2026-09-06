// src/features/sante/adapter.ts
import type { ModuleAdapter } from "@/core/sdk/types/manifest.types";
import type { Doctor, Hospital, Pharmacy, Laboratory } from "./types";
import { SANTE_SUBTYPES } from "./subtypes";

// Définition des méthodes d'adaptation spécifiques
export const SANTE_ADAPTER: ModuleAdapter & {
  doctor: (data: any) => Doctor;
  hospital: (data: any) => Hospital;
  pharmacy: (data: any) => Pharmacy;
  laboratory: (data: any) => Laboratory;
  adapt: (data: any, type: string) => any;
} = {
  /**
   * Adapte les données d'un médecin pour l'affichage
   */
  doctor: (data: any): Doctor => ({
    ...data,
    displayName: `${data.name} (${data.specialty})`,
    fullAddress: [data.address, data.city, data.country]
      .filter(Boolean)
      .join(", "),
    priceDisplay: `${data.fees} ${data.currency}`,
  }),

  /**
   * Adapte les données d'un hôpital
   */
  hospital: (data: any): Hospital => ({
    ...data,
    displayName: `${data.name} - ${data.type}`,
    fullAddress: [data.address, data.city, data.country]
      .filter(Boolean)
      .join(", "),
    occupancyRate: data.beds > 0 ? data.occupiedBeds / data.beds : 0,
  }),

  /**
   * Adapte les données d'une pharmacie
   */
  pharmacy: (data: any): Pharmacy => ({
    ...data,
    displayName: data.name,
    fullAddress: [data.address, data.city, data.country]
      .filter(Boolean)
      .join(", "),
  }),

  /**
   * Adapte les données d'un laboratoire
   */
  laboratory: (data: any): Laboratory => ({
    ...data,
    displayName: data.name,
    fullAddress: [data.address, data.city, data.country]
      .filter(Boolean)
      .join(", "),
  }),

  /**
   * Adapter générique selon le type (correspond à ModuleAdapter.adapt ?)
   */
  adapt: (data: any, type: string) => {
    const subtype = SANTE_SUBTYPES.find((s) => s.value === type);
    if (!subtype) return data;
    const adapter =
      SANTE_ADAPTER[
        type as keyof Pick<
          typeof SANTE_ADAPTER,
          "doctor" | "hospital" | "pharmacy" | "laboratory"
        >
      ];
    return adapter ? adapter(data) : data;
  },

  // Implémentation de ModuleAdapter (toModel, fromModel)
  toModel: (formData: any) => {
    // Par défaut, on renvoie les données telles quelles
    // On peut ajouter des transformations globales si nécessaire
    return formData;
  },

  fromModel: (model: any) => {
    // Idem, on peut adapter pour l'affichage
    return model;
  },

  // Optionnel : validate, normalize, serialize, deserialize
  normalize: (data: any) => data,
  validate: (data: any) => ({ valid: true, errors: [] }),
  serialize: (data: any) => data,
  deserialize: (data: any) => data,
};

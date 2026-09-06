import type { ModuleLifecycle } from "@/core/sdk/types";

export const lifecycle: ModuleLifecycle = {
  beforeCreate: async (data) => {
    // Normaliser le prix
    if (data.price && typeof data.price === "string") {
      data.price = parseFloat(data.price);
    }
    if (data.surface && typeof data.surface === "string") {
      data.surface = parseFloat(data.surface);
    }
    if (data.rooms && typeof data.rooms === "string") {
      data.rooms = parseInt(data.rooms, 10);
    }
    if (data.bathrooms && typeof data.bathrooms === "string") {
      data.bathrooms = parseInt(data.bathrooms, 10);
    }
    return data;
  },
  afterCreate: async (publication) => {
    console.log("🏠 Nouveau bien immobilier publié:", publication.title);
  },
  beforeUpdate: async (data, existing) => data,
  afterUpdate: async (publication) => {
    console.log("📝 Bien immobilier mis à jour:", publication.title);
  },
};

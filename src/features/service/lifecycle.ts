import { UIService } from "@/core/sdk/ui/UIService";

export const lifecycle = {
  beforeCreate: async (data: any) => {
    if (!data.name || !data.specialty || !data.price) {
      throw new Error("Champs obligatoires manquants");
    }
    return data;
  },
  afterCreate: async (data: any) => {
    UIService.openToast("Prestataire créé avec succès !", "success");
    return data;
  },
  beforeUpdate: async (data: any) => {
    return data;
  },
  afterUpdate: async (data: any) => {
    UIService.openToast("Modifications enregistrées", "success");
  },
  beforeDelete: async (data: any) => {
    return true;
  },
  afterDelete: async () => {
    UIService.openToast("Prestataire supprimé", "success");
  },
};

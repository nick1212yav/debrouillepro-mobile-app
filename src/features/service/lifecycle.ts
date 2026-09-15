import { toast } from "sonner";

export const lifecycle = {
  beforeCreate: async (data: any) => {
    if (!data.name || !data.specialty || !data.price) {
      throw new Error("Champs obligatoires manquants");
    }
    return data;
  },
  afterCreate: async (data: any) => {
    toast.success("Prestataire créé avec succès !");
    return data;
  },
  beforeUpdate: async (data: any) => {
    return data;
  },
  afterUpdate: async (data: any) => {
    toast.success("Modifications enregistrées");
  },
  beforeDelete: async (data: any) => {
    return true;
  },
  afterDelete: async () => {
    toast.success("Prestataire supprimé");
  },
};

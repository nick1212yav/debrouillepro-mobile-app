import type { ModuleLifecycle } from "../../core/sdk/types";

export const lifecycle: ModuleLifecycle = {
  beforeCreate: async (data: any) => {
    if (data.salary && typeof data.salary === "string") {
      data.salary = parseFloat(data.salary);
    }
    return data;
  },
  afterCreate: async (publication: any) => {
    console.log("📢 Nouvelle offre d'emploi publiée:", publication.title);
  },
  beforeUpdate: async (data: any, existing: any) => data,
  afterUpdate: async (publication: any) => {
    console.log("📝 Offre d'emploi mise à jour:", publication.title);
  },
  beforeDelete: async (publication: any) => {
    console.log("🗑️ Suppression:", publication.title);
    return true;
  },
  afterDelete: async (publication: any) => {
    console.log("🗑️ Supprimé:", publication.title);
  },
  beforeView: async (publication: any) => {
    console.log("👁️ Visualisation:", publication.title);
  },
  afterView: async (publication: any) => {
    console.log("👁️ Visualisation terminée:", publication.title);
  },
  beforeShare: async (publication: any) => {
    console.log("📤 Partage:", publication.title);
  },
  afterShare: async (publication: any) => {
    console.log("📤 Partage terminé:", publication.title);
  },
};

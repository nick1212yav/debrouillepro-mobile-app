export const immoPolicy = {
  // Vérifie si un bien peut être affiché
  canView: (publication: any, user: any) => {
    const meta = publication.meta || {};
    const status = meta.status || "available";
    return status === "available" || (user && user.roles?.includes("admin"));
  },
  // Vérifie si un bien peut être contacté
  canContact: (publication: any, user: any) => {
    return !!user;
  },
  // Vérifie si un bien peut être visité
  canVisit: (publication: any, user: any) => {
    const meta = publication.meta || {};
    return !!user && meta.status === "available";
  },
};

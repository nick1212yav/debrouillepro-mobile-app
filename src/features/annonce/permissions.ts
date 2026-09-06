export const permissions = {
  view: true, // public
  create: ["user"], // seulement les utilisateurs connectés
  edit: ["user"],
  delete: ["admin"],
};

// convex/index.ts

// ✅ Exporter tous les modules (après les renommages)
export * from "./employment"; // contient getJobByPublication
export * from "./publications";
export * from "./users";
export * from "./feed";
export * from "./notifications"; // contient markNotificationRead
export * from "./messages"; // contient markMessageRead
export * from "./bookmarks";

// ✅ Si tu as un fichier storage, exporte-le aussi
// export * from "./storage";

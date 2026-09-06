// src/features/voyages/index.ts
export * from "./sheets";

// ✅ Correction : Exports nommés explicites des hooks pour éviter les collisions (*) [1]
export { useVoyage } from "./hooks/useVoyage";
export { useVoyageBooking } from "./hooks/useVoyageBooking";
export { useVoyageFavorites } from "./hooks/useVoyageFavorites";
export { useVoyageGallery } from "./hooks/useVoyageGallery";
export { useVoyageRecommendations } from "./hooks/useVoyageRecommendations";
export { useVoyageReviews } from "./hooks/useVoyageReviews";
export { useVoyageSeats } from "./hooks/useVoyageSeats";
export { useVoyageShare } from "./hooks/useVoyageShare";

// ✅ Correction : Exports unifiés du SDK [1]
export { registerVoyagesModule } from "./register";
export { voyagesManifest } from "./manifest";
export { voyageFieldsList } from "./fields";
export { voyagesSubtypes } from "./subtypes";
export { VoyagesAdapter } from "./adapter";
export { VoyagesLifecycle } from "./lifecycle";
export { VoyagesPermissions } from "./permissions";

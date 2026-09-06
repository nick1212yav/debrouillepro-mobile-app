// src/features/network/index.ts
export * from "./types";
export * from "./constants";
export * from "./services";
export * from "./integrations";
export * from "./sheets";

// ✅ Correction : Exports nommés explicites des hooks pour éviter les collisions (*) [1]
export { useNetwork } from "./hooks/useNetwork";
export { useNetworkAnalytics } from "./hooks/useNetworkAnalytics";
export { useNetworkEducation } from "./hooks/useNetworkEducation";
export { useNetworkExperience } from "./hooks/useNetworkExperience";
export { useNetworkFollowers } from "./hooks/useNetworkFollowers";
export { useNetworkFollowing } from "./hooks/useNetworkFollowing";
export { useNetworkPosts } from "./hooks/useNetworkPosts";
export { useNetworkProfile } from "./hooks/useNetworkProfile";
export { useNetworkRecommendations } from "./hooks/useNetworkRecommendations";
export { useNetworkSearch } from "./hooks/useNetworkSearch";
export { useNetworkServices } from "./hooks/useNetworkServices";
export { useNetworkSkills } from "./hooks/useNetworkSkills";
export { useNetworkSuggestions } from "./hooks/useNetworkSuggestions";

export {
  registerNetworkInCore,
  initNetworkIntegrations,
} from "./integrations/NetworkRegistry";
export { networkManifest } from "./manifest";
export { networkFields } from "./fields";
export { networkSubtypes } from "./subtypes";
export { NetworkAdapter } from "./adapter";
export { NetworkLifecycle } from "./lifecycle";
export { NetworkPermissions } from "./permissions";

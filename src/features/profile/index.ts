// src/features/profile/index.ts

export type {
  ProfileTab,
  UserProfile,
  FollowStats,
  LeaderboardEntry,
} from "./types";
export { QRCardModal } from "./components/QRCardModal";
export { EditProfileSheet } from "./components/EditProfileSheet";
export { CompletionBar } from "./components/CompletionBar";
export { ActivityTimeline } from "./components/ActivityTimeline";
export { RecentsTab } from "./components/RecentsTab";

// Sous-composants pour les profils publics et abonnements
export { Avatar } from "./components/Avatar";
export { FollowButton } from "./components/FollowButton";
export { MiniPubCard } from "./components/MiniPubCard";
export { FollowersList } from "./components/FollowersList";

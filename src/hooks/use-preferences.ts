import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.js";
import { useCallback } from "react";

export type UserPreferences = Doc<"userPreferences">;

const DEFAULTS: Omit<UserPreferences, "_id" | "_creationTime" | "userId"> = {
  theme: "dark",
  language: "fr",
  notifMessages: true,
  notifPublications: true,
  notifSystem: true,
  notifSounds: true,
  feedCategories: [],
  favoriteModules: [],
  profilePublic: true,
  showEmail: false,
  reducedMotion: false,
  compactMode: false,
};

export function usePreferences() {
  const prefs = useQuery(api.preferences.get);
  const upsert = useMutation(api.preferences.upsert);
  const toggleFavorite = useMutation(api.preferences.toggleFavoriteModule);

  // Merge with defaults so consumers always get a full object
  const effective = prefs ?? (DEFAULTS as UserPreferences);

  const update = useCallback(
    (patch: Partial<Omit<UserPreferences, "_id" | "_creationTime" | "userId">>) => {
      return upsert(patch);
    },
    [upsert],
  );

  return {
    prefs: effective,
    isLoading: prefs === undefined,
    update,
    toggleFavoriteModule: (moduleId: string) => toggleFavorite({ moduleId }),
  };
}

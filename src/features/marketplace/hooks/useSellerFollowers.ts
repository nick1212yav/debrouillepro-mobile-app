// src/features/marketplace/hooks/useSellerFollowers.ts
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useSellerFollowers(sellerId: Id<"users"> | undefined) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);

  // Stub : on ne fait pas de vraie requête pour l'instant
  // const followersData = useQuery(api.commerce.getSellerFollowers, sellerId ? { sellerId } : "skip");

  const toggleFollow = async () => {
    if (!sellerId) return;
    setIsFollowing((prev) => !prev);
    setFollowers((prev) =>
      prev.map((f) => ({ ...f, isFollowing: !isFollowing })),
    );
    console.log("[useSellerFollowers] toggleFollow stub", sellerId);
  };

  return { followers, isFollowing, toggleFollow, isLoading: false };
}

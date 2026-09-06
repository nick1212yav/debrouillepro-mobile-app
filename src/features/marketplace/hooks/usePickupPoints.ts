// src/features/marketplace/hooks/usePickupPoints.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function usePickupPoints(location: string) {
  const points = useQuery(api.commerce.getPickupPoints, { location });

  return {
    points: points ?? [],
    isLoading: points === undefined,
  };
}

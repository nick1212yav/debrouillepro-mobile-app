// src/features/sante/services/pharmacy.service.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Pharmacy, PharmacyFilters } from "../types/pharmacy.types";

export function usePharmacy(id: Id<"pharmacies"> | null) {
  const pharmacy = useQuery(api.health.getPharmacy, id ? { id } : "skip");
  return {
    pharmacy: pharmacy as Pharmacy | null | undefined,
    isLoading: pharmacy === undefined,
  };
}

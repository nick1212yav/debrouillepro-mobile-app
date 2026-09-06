// src/features/sante/hooks/usePharmacies.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Pharmacy, PharmacyFilters } from "../types/pharmacy.types";

export function usePharmacies(filters?: PharmacyFilters) {
  const pharmacies = useQuery(api.health.listPharmacies, filters || {});
  return {
    pharmacies: pharmacies as Pharmacy[] | null | undefined,
    isLoading: pharmacies === undefined,
  };
}

export function usePharmacy(id: string | null) {
  const pharmacy = useQuery(
    api.health.getPharmacy,
    id ? { id: id as any } : "skip",
  );
  return {
    pharmacy: pharmacy as Pharmacy | null | undefined,
    isLoading: pharmacy === undefined,
  };
}

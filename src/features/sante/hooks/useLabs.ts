// src/features/sante/hooks/useLabs.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Laboratory } from "../types/laboratory.types";

export function useLabs(filters?: any) {
  const labs = useQuery(api.health.listLaboratories, filters || {});
  return {
    labs: labs as Laboratory[] | null | undefined,
    isLoading: labs === undefined,
  };
}

export function useLab(id: string | null) {
  const lab = useQuery(
    api.health.getLaboratory,
    id ? { id: id as any } : "skip",
  );
  return {
    lab: lab as Laboratory | null | undefined,
    isLoading: lab === undefined,
  };
}

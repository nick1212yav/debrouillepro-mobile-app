// src/features/sante/services/laboratory.service.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Laboratory } from "../types/laboratory.types";

export function useLaboratory(id: Id<"laboratories"> | null) {
  const lab = useQuery(api.health.getLaboratory, id ? { id } : "skip");
  return {
    laboratory: lab as Laboratory | null | undefined,
    isLoading: lab === undefined,
  };
}

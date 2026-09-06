import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Annonce } from "../types";
import { adaptAnnonce } from "../adapter";

export function useAnnonce(id: string | undefined) {
  const publication = useQuery(
    api.publications.getPublication,
    id ? { id: id as Id<"publications"> } : "skip",
  );
  if (!publication) return null;
  return adaptAnnonce(publication);
}

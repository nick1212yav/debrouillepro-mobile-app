import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { adaptServiceProvider } from "../adapter";

export function useService(providerId: Id<"serviceProviders"> | undefined) {
  const doc = useQuery(
    api.serviceProviders.get,
    providerId ? { id: providerId } : "skip",
  );
  if (!doc) return null;
  return adaptServiceProvider(doc);
}

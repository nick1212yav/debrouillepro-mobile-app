import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptServiceProvider } from "../adapter";
import type { ServiceCategory } from "../types";

export function useServiceSearch(params: {
  category?: ServiceCategory;
  search?: string;
  urgent?: boolean;
  available?: boolean;
  minRating?: number;
  maxPrice?: number;
}) {
  const docs = useQuery(api.serviceProviders.search, params);
  if (!docs) return { providers: [], loading: true };
  return { providers: docs.map(adaptServiceProvider), loading: false };
}

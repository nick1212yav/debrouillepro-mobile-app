import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useServicePricing(providerId: Id<"serviceProviders">) {
  const pricing = useQuery(api.serviceProviders.getPricing, { providerId });
  return { pricing, loading: pricing === undefined };
}

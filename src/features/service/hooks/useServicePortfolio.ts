import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useServicePortfolio(providerId: Id<"serviceProviders">) {
  const portfolio = useQuery(api.serviceProviders.getPortfolio, { providerId });
  return { portfolio: portfolio || [], loading: portfolio === undefined };
}

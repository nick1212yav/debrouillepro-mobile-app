import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useServiceAvailability(providerId: Id<"serviceProviders">) {
  const slots = useQuery(api.serviceProviders.getAvailability, { providerId });
  return { slots: slots || [], loading: slots === undefined };
}

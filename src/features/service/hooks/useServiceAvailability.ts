import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export interface UseServiceAvailabilityOptions {
  allowDemo?: boolean;
  fromDate?: string;
  toDate?: string;
}

export function useServiceAvailability(
  providerId: Id<"serviceProviders">,
  options: UseServiceAvailabilityOptions = {},
) {
  const slots = useQuery(api.services.availability.getAvailability, {
    providerId,
    ...(options.allowDemo === undefined
      ? {}
      : { allowDemo: options.allowDemo }),
    ...(options.fromDate === undefined ? {} : { fromDate: options.fromDate }),
    ...(options.toDate === undefined ? {} : { toDate: options.toDate }),
  });

  return {
    slots: slots ?? [],
    loading: slots === undefined,
  };
}

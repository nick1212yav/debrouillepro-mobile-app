// src/features/transport/hooks/useTransport.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { TransportRoute } from "../types";

export function useTransport(id?: string | null) {
  const route = useQuery(
    api.transport.getTransportRoute, // ✅ Redirection vers api.transport
    id ? { id: id as Id<"transportRoutes"> } : "skip",
  );

  return {
    route: route as TransportRoute | null | undefined,
    isLoading: route === undefined,
  };
}

export function useTransportMutations() {
  const bookRoute = useMutation(api.transport.bookTransportRoute); // ✅ Redirection
  const createRoute = useMutation(api.transport.createTransportRoute); // ✅ Redirection

  return {
    bookRoute,
    createRoute,
  };
}

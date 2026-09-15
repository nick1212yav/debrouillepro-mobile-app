import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export function useServiceBooking(providerId: Id<"serviceProviders">) {
  const book = useMutation(api.serviceProviders.book);
  const handleBook = async (message: string, scheduledAt?: string) => {
    try {
      await book({ providerId, message, scheduledAt });
      toast.success("Réservation envoyée !");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la réservation",
      );
      throw error;
    }
  };
  return { book: handleBook };
}

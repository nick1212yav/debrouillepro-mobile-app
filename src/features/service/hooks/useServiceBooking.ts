import { UIService } from "@/core/sdk/ui/UIService";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useServiceBooking(providerId: Id<"serviceProviders">) {
  const book = useMutation(api.serviceProviders.book);
  const handleBook = async (message: string, scheduledAt?: string) => {
    try {
      await book({ providerId, message, scheduledAt });
      UIService.openToast("Réservation envoyée !", "success");
    } catch (error) {
      UIService.openToast(error instanceof Error
          ? error.message
          : "Erreur lors de la réservation", "error");
      throw error;
    }
  };
  return { book: handleBook };
}

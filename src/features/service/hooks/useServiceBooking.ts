import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export interface BookServiceOptions {
  quoteId?: Id<"serviceQuotes">;
  serviceAddress?: string;
  attachments?: string[];
  notes?: string;
}

export function useServiceBooking(providerId: Id<"serviceProviders">) {
  const bookMutation = useMutation(api.services.bookings.book);

  const book = async (
    message: string,
    scheduledAt?: string,
    options: BookServiceOptions = {},
  ) => {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) {
      toast.error("Ajoute un message pour décrire ta demande.");
      throw new Error("Le message de réservation est obligatoire.");
    }

    try {
      const result = await bookMutation({
        providerId,
        message: normalizedMessage,
        ...(scheduledAt ? { scheduledAt } : {}),
        ...(options.quoteId ? { quoteId: options.quoteId } : {}),
        ...(options.serviceAddress
          ? { serviceAddress: options.serviceAddress }
          : {}),
        ...(options.attachments?.length
          ? { attachments: options.attachments }
          : {}),
        ...(options.notes ? { notes: options.notes } : {}),
      });
      toast.success("Réservation envoyée !");
      return result;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la réservation",
      );
      throw error;
    }
  };

  return { book };
}

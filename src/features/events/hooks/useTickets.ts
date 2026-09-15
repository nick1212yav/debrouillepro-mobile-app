// src/features/events/hooks/useTickets.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptEventTicket } from "../adapter";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export function useTickets(eventId?: Id<"events">) {
  const ticketsData = useQuery(
    api.events.listTickets,
    eventId ? { eventId } : "skip",
  );

  const purchaseTicket = useMutation(api.events.purchaseTicket);
  const validateTicket = useMutation(api.events.validateTicket);

  const tickets = ticketsData?.map(adaptEventTicket) ?? [];

  const purchase = async () => {
    if (!eventId) return;
    try {
      const result = await purchaseTicket({ eventId });
      toast.success("Billet acheté !");
      return result;
    } catch (error) {
      toast.error("Erreur lors de l'achat");
      throw error;
    }
  };

  const validate = async (ticketId: string) => {
    try {
      const result = await validateTicket({
        ticketId: ticketId as Id<"eventTickets">,
      });
      toast.success("Billet validé");
      return result;
    } catch (error) {
      toast.error("Erreur lors de la validation");
      throw error;
    }
  };

  return { tickets, purchase, validate };
}

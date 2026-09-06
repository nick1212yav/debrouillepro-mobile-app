import { useState, useCallback } from "react";
import { EscrowService } from "../payments/EscrowService";

export interface ChefBookingPayload {
  chefId: string;
  userId: string;
  eventDate: string;
  guestsCount: number;
  menuSelected: string;
  totalCost: number;
}

export function useChef() {
  const [isProcessing, setIsProcessing] = useState(false);

  const bookChef = useCallback(
    async (
      payload: ChefBookingPayload,
    ): Promise<{ success: boolean; bookingId?: string; escrowId?: string }> => {
      setIsProcessing(true);
      try {
        const bookingId = `CHEF-BK-${Date.now().toString().slice(-4)}`;
        // Verrouillage des honoraires du chef en séquestre financier
        const escrowId = await EscrowService.holdFunds(
          bookingId,
          payload.totalCost,
        );

        return {
          success: true,
          bookingId,
          escrowId,
        };
      } catch {
        return { success: false };
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  return { bookChef, isProcessing };
}

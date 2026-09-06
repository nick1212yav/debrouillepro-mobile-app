import { useState } from "react";

export function useAccommodationPricing() {
  const calculateTotal = (
    amount: number,
    periods: number,
    cleaningFee = 15000,
    deposit = 50000,
  ) => {
    const subtotal = amount * periods;
    const serviceFee = Math.round(subtotal * 0.05);
    return {
      subtotal,
      serviceFee,
      cleaningFee,
      deposit,
      total: subtotal + serviceFee + cleaningFee + deposit,
    };
  };

  return { calculateTotal };
}

import { useState } from "react";

export function useAccommodationAvailability(accommodationId?: string) {
  const [checking, setChecking] = useState(false);

  const checkAvailability = async (
    checkIn: string,
    checkOut: string,
  ): Promise<boolean> => {
    if (!accommodationId || !checkIn || !checkOut) return false;
    setChecking(true);
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        setChecking(false);
        resolve(true);
      }, 600);
    });
  };

  return { checkAvailability, checking };
}

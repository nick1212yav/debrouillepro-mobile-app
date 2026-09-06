import { useState, useEffect } from "react";
import type { Accommodation } from "../types/accommodation.types";
import { MOCK_ACCOMMODATIONS } from "./useAccommodation";

interface UseAccommodationsFilters {
  type?: string;
  maxPrice?: number;
  city?: string;
}

export function useAccommodations(filters?: UseAccommodationsFilters) {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        let results = [...MOCK_ACCOMMODATIONS];

        if (filters?.type && filters.type !== "Tout") {
          results = results.filter(
            (a) => a.type.toLowerCase() === filters.type?.toLowerCase(),
          );
        }

        if (filters?.maxPrice) {
          results = results.filter(
            (a) => a.pricing.amount <= (filters.maxPrice || Infinity),
          );
        }

        if (filters?.city) {
          results = results.filter(
            (a) =>
              a.location.city.toLowerCase() === filters.city?.toLowerCase(),
          );
        }

        setAccommodations(results);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [filters?.type, filters?.maxPrice, filters?.city]);

  return { accommodations, loading, error };
}

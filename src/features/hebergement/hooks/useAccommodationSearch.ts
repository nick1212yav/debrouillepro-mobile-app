import { useState } from "react";
import type { Accommodation } from "../types/accommodation.types";
import { MOCK_ACCOMMODATIONS } from "./useAccommodation";

export function useAccommodationSearch() {
  const [searchResults, setSearchResults] = useState<Accommodation[]>([]);
  const [searching, setSearching] = useState(false);

  const search = async (query: string) => {
    setSearching(true);
    return new Promise<Accommodation[]>((resolve) => {
      setTimeout(() => {
        const results = MOCK_ACCOMMODATIONS.filter(
          (a) =>
            a.title.toLowerCase().includes(query.toLowerCase()) ||
            a.location.city.toLowerCase().includes(query.toLowerCase()) ||
            a.type.toLowerCase().includes(query.toLowerCase()),
        );
        setSearchResults(results);
        setSearching(false);
        resolve(results);
      }, 400);
    });
  };

  return { searchResults, searching, search };
}

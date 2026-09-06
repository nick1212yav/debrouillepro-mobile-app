import { useState, useEffect, useCallback } from "react";
import type { RestaurantDetail } from "../types/restaurant.types";
import { RestaurantService } from "../services/RestaurantService";
import type { GeoCoordinates } from "../types/common.types";

export interface UseRestaurantsFilter {
  cuisine?: string;
  openOnly?: boolean;
  searchQuery?: string;
  location?: GeoCoordinates;
  maxDistanceKm?: number;
}

export function useRestaurants(initialFilters?: UseRestaurantsFilter) {
  const [restaurants, setRestaurants] = useState<RestaurantDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UseRestaurantsFilter>(
    initialFilters || {},
  );

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await RestaurantService.list(filters);
      setRestaurants(list);
    } catch (err) {
      setError("Erreur de récupération de la liste des restaurants.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const updateFilters = (newFilters: Partial<UseRestaurantsFilter>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return {
    restaurants,
    loading,
    error,
    filters,
    updateFilters,
    refetch: fetchRestaurants,
  };
}

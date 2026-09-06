import { useState, useEffect, useCallback } from "react";
import type { RestaurantDetail } from "../types/restaurant.types";
import { RestaurantService } from "../services/RestaurantService";

export function useRestaurant(restaurantId?: number) {
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurant = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await RestaurantService.getById(restaurantId);
      if (data) {
        setRestaurant(data);
      } else {
        setError("Établissement de restauration introuvable.");
      }
    } catch (err) {
      setError("Échec lors de la récupération des données de l'établissement.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  return { restaurant, loading, error, refetch: fetchRestaurant };
}

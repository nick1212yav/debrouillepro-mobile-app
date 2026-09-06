import type { RestaurantDetail } from "../types/restaurant.types";
import type { GeoCoordinates } from "../types/common.types";
import { RestaurationSearchEngine } from "../search";
import { RestaurantValidator } from "../validators/restaurant.validator";

export class RestaurantService {
  private static restaurantsCache: RestaurantDetail[] = [];

  public static seedCache(restaurants: RestaurantDetail[]): void {
    this.restaurantsCache = restaurants;
  }

  public static async getById(id: number): Promise<RestaurantDetail | null> {
    const restaurant = this.restaurantsCache.find((r) => r.id === id);
    return restaurant || null;
  }

  public static async list(filter?: {
    cuisine?: string;
    openOnly?: boolean;
    searchQuery?: string;
    location?: GeoCoordinates;
    maxDistanceKm?: number;
  }): Promise<RestaurantDetail[]> {
    let list = [...this.restaurantsCache];

    if (filter?.cuisine && filter.cuisine !== "Tout") {
      list = list.filter(
        (r) => r.cuisine.toLowerCase() === filter.cuisine?.toLowerCase(),
      );
    }

    if (filter?.openOnly) {
      list = list.filter((r) => r.open);
    }

    if (filter?.searchQuery) {
      list = RestaurationSearchEngine.queryRestaurants(
        list,
        filter.searchQuery,
        filter.location,
        filter.maxDistanceKm,
      );
    }

    return list;
  }

  public static async create(data: Partial<RestaurantDetail>): Promise<{
    success: boolean;
    restaurant?: RestaurantDetail;
    errors?: Record<string, string>;
  }> {
    const validation = RestaurantValidator.validate(data as any);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const newRestaurant: RestaurantDetail = {
      id: Math.floor(1000 + Math.random() * 9000),
      name: data.name!,
      cuisine: data.cuisine!,
      location: data.location!,
      coordinates: data.coordinates,
      rating: 5.0,
      reviewsCount: 0,
      priceRange: data.priceRange || "$$",
      deliveryTime: data.deliveryTime || "25-35 min",
      deliveryFee: data.deliveryFee || 1000,
      image: data.image || "",
      gallery: data.gallery || [],
      tags: data.tags || ["Nouveau"],
      open: data.open ?? true,
      openingHours: data.openingHours || "11:00 - 23:30",
      minOrder: data.minOrder || 2000,
      speciality: data.speciality || "Cuisine du terroir",
      description: data.description || "",
      menu: [],
    };

    this.restaurantsCache.push(newRestaurant);
    return { success: true, restaurant: newRestaurant };
  }
}

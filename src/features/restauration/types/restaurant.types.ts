import { CuisineType } from "./enums";
import type { GeoCoordinates, DaySchedule } from "./common.types";
import type { MenuCategory } from "./menu.types";
import type { ChefProfile } from "./chef.types";

export interface RestaurantDetail {
  id: number;
  name: string;
  cuisine: CuisineType | string;
  location: string;
  coordinates?: GeoCoordinates;
  rating: number;
  reviewsCount: number;
  priceRange: string;
  deliveryTime: string;
  deliveryFee: number;
  image: string;
  gallery: string[];
  tags: string[];
  open: boolean;
  openingHours: string;
  schedules?: DaySchedule[];
  minOrder: number;
  speciality: string;
  description: string;
  chef?: ChefProfile;
  menu: MenuCategory[];
}

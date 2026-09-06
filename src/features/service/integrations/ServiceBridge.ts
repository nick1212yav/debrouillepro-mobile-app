import type { ServiceProvider } from "../types";

export function serviceBridge(provider: ServiceProvider) {
  return {
    id: provider._id,
    title: provider.name,
    subtitle: provider.specialty,
    description: provider.description,
    image: provider.imageUrl,
    location: provider.location,
    price: provider.price,
    rating: provider.rating,
  };
}

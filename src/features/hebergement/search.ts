import type { Accommodation } from "./types/accommodation.types";

export const searchIndex = {
  indexName: "hebergement",
  searchFields: [
    "title",
    "description",
    "location.city",
    "location.district",
    "type",
  ],

  filter: (items: Accommodation[], query: string): Accommodation[] => {
    if (!query) return items;
    const q = query.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.city.toLowerCase().includes(q) ||
        (item.location.district &&
          item.location.district.toLowerCase().includes(q)) ||
        item.type.toLowerCase().includes(q),
    );
  },
};

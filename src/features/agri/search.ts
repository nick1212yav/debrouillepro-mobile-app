// src/features/agri/search.ts
import type { AgriProduct } from "./types/agri.types";

export class AgriSearchEngine {
  static scoreMatch(product: AgriProduct, query: string): number {
    const q = query.toLowerCase().trim();
    if (!q) return 1;

    let score = 0;
    if (product.title.toLowerCase().includes(q)) score += 10;
    if (product.variety?.toLowerCase().includes(q)) score += 7;
    if (product.description.toLowerCase().includes(q)) score += 3;
    if (product.location.city.toLowerCase().includes(q)) score += 5;
    return score;
  }
}

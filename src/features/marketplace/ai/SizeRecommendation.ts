// src/features/marketplace/ai/SizeRecommendation.ts
export interface SizeRecommendation {
  recommendSize: string;
  confidence: number;
  alternativeSizes: string[];
  advice: string;
  compareWithStock: (size: string) => boolean;
}

export function getSizeRecommendation(
  height: number,
  weight: number,
  gender: string,
  availableSizes: string[],
): SizeRecommendation {
  // Simuler une recommandation
  const size = "M";
  return {
    recommendSize: size,
    confidence: 0.85,
    alternativeSizes: ["S", "L"],
    advice: "Cette taille devrait vous convenir parfaitement.",
    compareWithStock: (s: string) => availableSizes.includes(s),
  };
}

export interface MenuItemSalesStat {
  name: string;
  category: string;
  unitsSold: number;
  costToProduce: number;
  unitSalePrice: number;
}

export type BCGMatrixClass = "STAR" | "PLOWHORSE" | "PUZZLE" | "DOG";

export interface BCGItemResult {
  name: string;
  margin: number;
  classification: BCGMatrixClass;
  actionRequired: string;
}

export class MenuPerformance {
  public static compileBCGMatrix(items: MenuItemSalesStat[]): BCGItemResult[] {
    if (items.length === 0) return [];

    const totalSold = items.reduce((acc, i) => acc + i.unitsSold, 0);
    const avgVolumeSold = totalSold / items.length;

    const calculatedItems = items.map((i) => ({
      name: i.name,
      margin: i.unitSalePrice - i.costToProduce,
      unitsSold: i.unitsSold,
    }));

    const totalMargin = calculatedItems.reduce((acc, i) => acc + i.margin, 0);
    const avgMargin = totalMargin / items.length;

    return calculatedItems.map((item) => {
      const isHighVolume = item.unitsSold >= avgVolumeSold;
      const isHighMargin = item.margin >= avgMargin;

      let classification: BCGMatrixClass = "DOG";
      let actionRequired = "Retirer du menu ou réadapter la recette";

      if (isHighVolume && isHighMargin) {
        classification = "STAR";
        actionRequired = "Mettre en avant sur la page d'accueil";
      } else if (isHighVolume && !isHighMargin) {
        classification = "PLOWHORSE";
        actionRequired =
          "Augmenter légèrement le prix ou négocier les ingrédients";
      } else if (!isHighVolume && isHighMargin) {
        classification = "PUZZLE";
        actionRequired = "Créer une offre promotionnelle temporaire";
      }

      return {
        name: item.name,
        margin: item.margin,
        classification,
        actionRequired,
      };
    });
  }
}

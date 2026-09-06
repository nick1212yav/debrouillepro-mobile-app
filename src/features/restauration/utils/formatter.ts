export class FormatterUtils {
  /**
   * Coupe une chaîne de caractères trop longue et y ajoute des points de suspension
   */
  public static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength).trim()}...`;
  }

  /**
   * Transforme un nom de catégorie brut en format normalisé capitalisé
   */
  public static capitalizeFirstLetter(str: string): string {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Formate un compteur de commentaires (ex: "847 avis" ou "1.2k avis")
   */
  public static formatReviewCount(count: number): string {
    if (count < 1000) {
      return `${count} avis`;
    }
    const thousands = (count / 1000).toFixed(1);
    return `${thousands}k avis`;
  }
}

export class Formatter {
  static formatPrice(amount: number, currency = "FCFA"): string {
    return `${new Intl.NumberFormat("fr-FR").format(amount)} ${currency}`;
  }

  static formatDate(dateStr: string): string {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  static formatShortDate(dateStr: string): string {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  }
}

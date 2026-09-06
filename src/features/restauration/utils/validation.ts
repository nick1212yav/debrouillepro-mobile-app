export class ValidationUtils {
  /**
   * Vérifie la conformité structurelle d'une adresse email
   */
  public static isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Neutralise les caractères dangereux d'une saisie pour prévenir les injections de code (XSS)
   */
  public static sanitizeString(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  /**
   * Supprime les espaces superflus et met en forme le texte
   */
  public static cleanTextInput(str: string): string {
    return str.replace(/\s+/g, " ").trim();
  }
}

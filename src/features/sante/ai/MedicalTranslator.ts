// src/features/sante/ai/MedicalTranslator.ts

/**
 * Traducteur médical – convertit des termes techniques en langage compréhensible.
 */
export class MedicalTranslator {
  private dictionary: Record<string, string> = {
    hypertension: "pression artérielle élevée",
    hyperglycémie: "taux de sucre dans le sang élevé",
    hypoglycémie: "taux de sucre dans le sang bas",
    arythmie: "rythme cardiaque irrégulier",
    infarctus: "crise cardiaque",
    "angine de poitrine":
      "douleur thoracique due à un manque d'oxygène du cœur",
    bronchite: "inflammation des bronches",
    pneumonie: "infection des poumons",
    gastrite: "inflammation de l'estomac",
    ulcère: "plaie de l'estomac ou du duodénum",
    hépatite: "inflammation du foie",
    "insuffisance rénale": "les reins ne fonctionnent plus correctement",
    anémie: "manque de globules rouges",
    leucémie: "cancer du sang",
    tumeur: "masse anormale de cellules",
    métastase: "propagation d'un cancer",
  };

  /**
   * Traduit un terme ou une phrase médicale en langage courant.
   */
  translate(text: string): string {
    let result = text;
    for (const [key, value] of Object.entries(this.dictionary)) {
      const regex = new RegExp(`\\b${key}\\b`, "gi");
      result = result.replace(regex, value);
    }
    return result;
  }

  /**
   * Traduit un texte médical complet en langage patient.
   */
  translateParagraph(paragraph: string): string {
    // Découpage en phrases et traduction mot par mot
    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    return sentences.map((s) => this.translate(s)).join(" ");
  }

  /**
   * Génère une version simplifiée d'un compte-rendu médical.
   */
  simplifyReport(report: string): string {
    // On retire les acronymes complexes et on traduit
    let simplified = report.replace(
      /\b(ECG|IRM|Scanner|CRP|VS|SGOT|SGPT)\b/g,
      (match) => {
        const map: Record<string, string> = {
          ECG: "électrocardiogramme",
          IRM: "imagerie par résonance magnétique",
          Scanner: "tomodensitométrie",
          CRP: "protéine C réactive",
          VS: "vitesse de sédimentation",
          SGOT: "transaminases (ASAT)",
          SGPT: "transaminases (ALAT)",
        };
        return map[match] || match;
      },
    );
    return this.translateParagraph(simplified);
  }
}

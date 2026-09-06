// src/features/sante/ai/EmergencyAdvisor.ts

export interface EmergencySituation {
  type:
    | "bleeding"
    | "burn"
    | "fracture"
    | "cardiac"
    | "stroke"
    | "choking"
    | "allergy"
    | "other";
  severity: "mild" | "moderate" | "severe" | "critical";
  description: string;
}

export interface EmergencyAdvice {
  immediateActions: string[];
  doNot: string[];
  whenToCall: string;
  resources: string[];
}

/**
 * Conseils en situation d'urgence.
 */
export class EmergencyAdvisor {
  /**
   * Fournit des conseils étape par étape pour gérer une urgence.
   */
  advise(situation: EmergencySituation): EmergencyAdvice {
    const base: EmergencyAdvice = {
      immediateActions: [],
      doNot: [],
      whenToCall: "Appelez le 15 immédiatement.",
      resources: ["SAMU 15", "Pompiers 18"],
    };

    switch (situation.type) {
      case "bleeding":
        base.immediateActions = [
          "Comprimez la plaie avec un linge propre.",
          "Surélevez le membre si possible.",
          "N'enlevez pas un objet planté.",
        ];
        base.doNot = [
          "N'appliquez pas de garrot sauf en cas d'hémorragie massive.",
          "Ne retirez pas les caillots.",
        ];
        base.whenToCall =
          "Appelez le 15 si le saignement ne s'arrête pas après 10 minutes de compression, ou si la personne perd connaissance.";
        break;
      case "burn":
        base.immediateActions = [
          "Refroidissez la brûlure sous l'eau froide (15-20 min).",
          "Retirez les bijoux et vêtements sauf s'ils collent.",
          "Couvrez avec un linge propre non adhérent.",
        ];
        base.doNot = [
          "N'appliquez pas de glace directement.",
          "Ne percez pas les ampoules.",
          "N'utilisez pas de beurre ou crème.",
        ];
        base.whenToCall =
          "Appelez le 15 si brûlure étendue, profonde, ou sur le visage/mains/genitaux.";
        break;
      case "cardiac":
        base.immediateActions = [
          "Allongez la personne en position demi-assise.",
          "Appelez le 15 immédiatement.",
          "Si la personne ne répond pas, commencez le massage cardiaque (100-120 compressions/min).",
        ];
        base.doNot = [
          "Ne donnez pas à manger ou boire.",
          "Ne laissez pas la personne s'agiter.",
        ];
        base.whenToCall = "Appelez immédiatement le 15. Toute minute compte.";
        break;
      case "stroke":
        base.immediateActions = [
          "Vérifiez les signes : paralysie faciale, faiblesse d'un bras, trouble de la parole.",
          "Notez l'heure des premiers symptômes.",
          "Allongez la personne avec la tête légèrement surélevée.",
        ];
        base.doNot = [
          "Ne lui donnez rien à boire ou manger.",
          "Ne lui donnez pas d'aspirine sans avis médical.",
        ];
        base.whenToCall =
          "Appelez le 15 dès que possible. Le temps est critique.";
        break;
      default:
        base.immediateActions = [
          "Rassurez la personne.",
          "Appelez les secours.",
          "Surveillez l'état.",
        ];
        base.doNot = ["Ne laissez pas la personne seule."];
        base.whenToCall = "Si vous avez un doute, appelez le 15.";
    }

    return base;
  }

  /**
   * Vérifie si une situation est critique et nécessite un appel d'urgence.
   */
  isCritical(situation: EmergencySituation): boolean {
    return (
      situation.severity === "critical" ||
      situation.type === "cardiac" ||
      situation.type === "stroke" ||
      situation.type === "choking"
    );
  }
}

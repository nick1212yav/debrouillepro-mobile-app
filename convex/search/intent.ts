// convex/search/intent.ts
//
// Détection des intentions (actions) à partir des tokens.

import type { ActionId } from "./types";
import { normalize, tokenize, meaningfulTokens } from "./normalize";

/* ============================================================================
 * DICTIONNAIRE DES ACTIONS
 * ========================================================================== */

interface ActionDefinition {
  id: ActionId;
  /** Synonymes directs (verbe à l'infinitif ou conjugué commun) */
  synonyms: string[];
}

export const ACTIONS: ActionDefinition[] = [
  {
    id: "acheter",
    synonyms: ["acheter", "achat", "acquerir", "commander", "prendre"],
  },
  {
    id: "vendre",
    synonyms: ["vendre", "vente", "ceder", "brader"],
  },
  {
    id: "louer",
    synonyms: ["louer", "location", "loyer", "locataire", "loue"],
  },
  {
    id: "chercher",
    synonyms: [
      "chercher",
      "trouver",
      "rechercher",
      "besoin",
      "veux",
      "voudrais",
      "aimerais",
      "souhaite",
    ],
  },
  {
    id: "trouver",
    synonyms: ["trouver", "denicher"],
  },
  {
    id: "visiter",
    synonyms: ["visiter", "visite", "voir"],
  },
  {
    id: "reserver",
    synonyms: ["reserver", "reservation", "booking", "booker", "reserve"],
  },
  {
    id: "apprendre",
    synonyms: [
      "apprendre",
      "etudier",
      "formation",
      "cours",
      "etudiant",
      "etudiante",
      "apprentissage",
    ],
  },
  {
    id: "travailler",
    synonyms: [
      "travailler",
      "emploi",
      "job",
      "poste",
      "travail",
      "carriere",
      "profession",
      "metier",
    ],
  },
  {
    id: "recruter",
    synonyms: ["recruter", "embaucher", "recrutement", "recruteur"],
  },
  {
    id: "postuler",
    synonyms: ["postuler", "candidater", "candidature"],
  },
  {
    id: "publier",
    synonyms: ["publier", "publication", "poster", "annoncer", "annonce"],
  },
  {
    id: "consulter",
    synonyms: ["consulter", "consultation", "avis", "conseil", "conseils"],
  },
  {
    id: "voyager",
    synonyms: [
      "voyager",
      "voyage",
      "aller",
      "trajet",
      "deplacement",
      "billet",
      "trajet",
      "destination",
    ],
  },
  {
    id: "envoyer",
    synonyms: ["envoyer", "transfert", "transferer", "envoi", "depot"],
  },
  {
    id: "payer",
    synonyms: ["payer", "paiement", "regler", "facture", "reglement"],
  },
  {
    id: "reparer",
    synonyms: ["reparer", "reparation", "depanner", "depannage", "entretien"],
  },
  {
    id: "construire",
    synonyms: ["construire", "construction", "batir", "renover", "renovation"],
  },
  {
    id: "investir",
    synonyms: ["investir", "investissement", "placement", "placement"],
  },
  {
    id: "contacter",
    synonyms: ["contacter", "appeler", "joindre", "telephoner", "telephone"],
  },
  {
    id: "commander",
    synonyms: ["commander", "commande", "order", "achat"],
  },
  {
    id: "participer",
    synonyms: [
      "participer",
      "participation",
      "rejoindre",
      "inscrire",
      "inscription",
    ],
  },
];

/* ============================================================================
 * INDEX DÉRIVÉ : synonyme → ActionId
 * ========================================================================== */

const ACTION_INDEX: Map<string, ActionId> = (() => {
  const map = new Map<string, ActionId>();
  for (const action of ACTIONS) {
    for (const syn of action.synonyms) {
      map.set(normalize(syn), action.id);
    }
  }
  return map;
})();

/* ============================================================================
 * DÉTECTION
 * ========================================================================== */

/**
 * Détecte toutes les actions présentes dans une requête.
 * Les actions sont retournées dans l'ordre d'apparition.
 */
export function detectActions(rawQuery: string): ActionId[] {
  const tokens = tokenize(rawQuery);
  const found: ActionId[] = [];
  const seen = new Set<ActionId>();

  for (const token of tokens) {
    const action = ACTION_INDEX.get(token);
    if (action && !seen.has(action)) {
      found.push(action);
      seen.add(action);
    }
  }

  return found;
}

/**
 * Action dominante : première détectée.
 * Si aucune, on considère qu'il s'agit d'une recherche passive ("chercher").
 */
export function primaryAction(actions: ActionId[]): ActionId | null {
  return actions[0] ?? null;
}

/* ============================================================================
 * UTILS INTERNES (exposés pour tests)
 * ========================================================================== */

export const __internal = {
  ACTION_INDEX,
  meaningfulTokens,
};

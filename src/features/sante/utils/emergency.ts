// src/features/sante/utils/emergency.ts

export interface EmergencyNumber {
  label: string;
  number: string;
  icon: string;
  color: string;
  description: string;
}

/**
 * Liste des numéros d'urgence standards (Côte d'Ivoire / Afrique de l'Ouest)
 */
export const EMERGENCY_NUMBERS: EmergencyNumber[] = [
  {
    label: "SAMU",
    number: "15",
    icon: "🚑",
    color: "#EF4444",
    description: "Urgences médicales",
  },
  {
    label: "Pompiers",
    number: "18",
    icon: "🔥",
    color: "#F97316",
    description: "Secours & incendie",
  },
  {
    label: "Police",
    number: "17",
    icon: "🚔",
    color: "#3B82F6",
    description: "Sécurité publique",
  },
  {
    label: "Croix-Rouge",
    number: "1515",
    icon: "❤️",
    color: "#EF4444",
    description: "Aide humanitaire",
  },
  {
    label: "Gendarmerie",
    number: "10",
    icon: "👮",
    color: "#8B5CF6",
    description: "Gendarmerie nationale",
  },
  {
    label: "SOS Médecins",
    number: "1313",
    icon: "💊",
    color: "#10B981",
    description: "Médecins de garde",
  },
];

/**
 * Trouve le numéro d'urgence par label
 */
export function getEmergencyNumber(label: string): EmergencyNumber | undefined {
  return EMERGENCY_NUMBERS.find(
    (n) => n.label.toLowerCase() === label.toLowerCase(),
  );
}

/**
 * Vérifie si un texte contient des mots-clés d'urgence
 */
export function isEmergencySituation(text: string): boolean {
  const keywords = [
    "urgence",
    "danger",
    "vital",
    "accident",
    "perte de connaissance",
    "hémorragie",
    "brûlure",
    "douleur intense",
    "difficulté respiratoire",
    "crise cardiaque",
    "AVC",
    "arrêt cardiaque",
  ];
  const normalized = text.toLowerCase();
  return keywords.some((k) => normalized.includes(k));
}

/**
 * Retourne le conseil d'urgence approprié selon le type
 */
export function getEmergencyAdvice(type: string): string {
  const adviceMap: Record<string, string> = {
    cardiac:
      "Appelez le 15 immédiatement. Commencez le massage cardiaque (100-120 compressions/min) si la personne ne répond pas.",
    bleeding:
      "Comprimez la plaie avec un linge propre. Surélevez le membre. N'enlevez pas un objet planté.",
    burn: "Refroidissez la brûlure sous l'eau froide (15-20 min). Ne percez pas les ampoules.",
    stroke:
      "Notez l'heure des premiers symptômes. Allongez la personne avec la tête surélevée. Ne lui donnez rien à boire.",
    choking:
      "Effectuez la manœuvre de Heimlich. Si la personne ne respire plus, appelez le 15.",
  };
  return (
    adviceMap[type.toLowerCase()] ||
    "Appelez les secours. Rassurez la personne. Surveillez l'état."
  );
}

/**
 * Génère un message d'alerte d'urgence
 */
export function generateEmergencyMessage(
  type: string,
  location: { lat: number; lng: number; address?: string },
  description: string,
): string {
  const address =
    location.address ||
    `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  return (
    `🚨 ALERTE URGENCE - ${type.toUpperCase()}\n\n` +
    `📍 ${address}\n` +
    `📝 ${description}\n\n` +
    `Appelez le 15 pour assistance immédiate.`
  );
}

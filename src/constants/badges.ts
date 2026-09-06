export type BadgeCategory =
  | "publication"
  | "social"
  | "exploration"
  | "engagement"
  | "special";

export interface BadgeDef {
  id: string;
  label: string;
  description: string;
  emoji: string;
  color: string;
  xpReward: number;
  category: BadgeCategory;
}

export const BADGE_DEFINITIONS: BadgeDef[] = [
  {
    id: "first_publication",
    label: "Premier Post",
    description: "Publier pour la première fois",
    emoji: "✨",
    color: "#10b981",
    xpReward: 50,
    category: "publication",
  },
];

export const LEVELS = [
  {
    name: "Débutant",
    min: 0,
    color: "#94a3b8",
    emoji: "🌱",
  },
  {
    name: "Explorateur",
    min: 300,
    color: "#10b981",
    emoji: "🗺️",
  },
  {
    name: "Pro",
    min: 800,
    color: "#6366f1",
    emoji: "⭐",
  },
  {
    name: "Expert",
    min: 2000,
    color: "#f59e0b",
    emoji: "💎",
  },
  {
    name: "Légende",
    min: 5000,
    color: "#ef4444",
    emoji: "🆙",
  },
] as const;

export type LevelName = (typeof LEVELS)[number]["name"];

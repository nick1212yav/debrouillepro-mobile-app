// src/features/network/constants/network.constants.ts
import { INDUSTRIES, INDUSTRY_LABELS, INDUSTRY_ICONS } from "./industries";
import {
  PROFESSIONS,
  PROFESSION_LABELS,
  PROFESSION_CATEGORIES,
} from "./professions";
import { SKILLS, SKILL_LABELS, SKILL_CATEGORIES } from "./skills";

export const NETWORK_CONSTANTS = {
  industries: INDUSTRIES,
  industryLabels: INDUSTRY_LABELS,
  industryIcons: INDUSTRY_ICONS,

  professions: PROFESSIONS,
  professionLabels: PROFESSION_LABELS,
  professionCategories: PROFESSION_CATEGORIES,

  skills: SKILLS,
  skillLabels: SKILL_LABELS,
  skillCategories: SKILL_CATEGORIES,
} as const;

// ─── User roles ───────────────────────────────────────────────────────────────

export const USER_ROLES = [
  { id: "particulier", label: "Particulier", icon: "👤" },
  { id: "professionnel", label: "Professionnel", icon: "💼" },
  { id: "entreprise", label: "Entreprise", icon: "🏢" },
  { id: "artisan", label: "Artisan", icon: "🔧" },
  { id: "recruteur", label: "Recruteur", icon: "🎯" },
  { id: "etudiant", label: "Étudiant", icon: "🎓" },
  { id: "enseignant", label: "Enseignant", icon: "📚" },
  { id: "fonctionnaire", label: "Fonctionnaire", icon: "🏛️" },
  { id: "entrepreneur", label: "Entrepreneur", icon: "🚀" },
  { id: "freelance", label: "Freelance", icon: "💻" },
  { id: "independant", label: "Indépendant", icon: "⚡" },
  { id: "autre", label: "Autre", icon: "📌" },
] as const;

export type UserRoleId = (typeof USER_ROLES)[number]["id"];

export const USER_ROLE_LABELS: Record<UserRoleId, string> = USER_ROLES.reduce(
  (acc, role) => ({ ...acc, [role.id]: role.label }),
  {} as Record<UserRoleId, string>,
);

// ─── Availability ────────────────────────────────────────────────────────────

export const AVAILABILITY_OPTIONS = [
  { id: "available", label: "Disponible", color: "#10B981" },
  { id: "limited", label: "Disponibilité limitée", color: "#F59E0B" },
  { id: "unavailable", label: "Indisponible", color: "#EF4444" },
] as const;

export type AvailabilityId = (typeof AVAILABILITY_OPTIONS)[number]["id"];

// ─── Connection status ──────────────────────────────────────────────────────

export const CONNECTION_STATUS = {
  FOLLOWING: "following",
  NOT_FOLLOWING: "not_following",
  REQUESTED: "requested",
  BLOCKED: "blocked",
} as const;

// ─── Network feed types ─────────────────────────────────────────────────────

export const FEED_TYPES = [
  { id: "all", label: "Tous" },
  { id: "posts", label: "Publications" },
  { id: "jobs", label: "Offres d'emploi" },
  { id: "services", label: "Services" },
  { id: "connections", label: "Connexions" },
] as const;

// ─── Job types ──────────────────────────────────────────────────────────────

export const JOB_TYPES = [
  { id: "fulltime", label: "CDI", color: "#10B981" },
  { id: "parttime", label: "Temps partiel", color: "#3B82F6" },
  { id: "contract", label: "CDD", color: "#F59E0B" },
  { id: "freelance", label: "Freelance", color: "#8B5CF6" },
  { id: "internship", label: "Stage", color: "#EC4899" },
] as const;

export type JobTypeId = (typeof JOB_TYPES)[number]["id"];

// ─── Visibility ─────────────────────────────────────────────────────────────

export const VISIBILITY_OPTIONS = [
  { id: "public", label: "Public", description: "Visible par tous" },
  {
    id: "network",
    label: "Réseau",
    description: "Visible par vos abonnés uniquement",
  },
  { id: "private", label: "Privé", description: "Visible par vous uniquement" },
] as const;

export type VisibilityId = (typeof VISIBILITY_OPTIONS)[number]["id"];

// ─── Re-export all constants for convenience ─────────────────────────────

export {
  INDUSTRIES,
  INDUSTRY_LABELS,
  INDUSTRY_ICONS,
  PROFESSIONS,
  PROFESSION_LABELS,
  PROFESSION_CATEGORIES,
  SKILLS,
  SKILL_LABELS,
  SKILL_CATEGORIES,
};

/**
 * Schéma de la table `users` dans Convex.
 * Ce fichier sert de documentation et de référence pour l'équipe.
 *
 * @see convex/schema.ts pour l'implémentation réelle
 */
export const UserSchema = {
  uid: "string (unique, Firebase UID)",
  tokenIdentifier: "string (unique, Convex token)",
  email: "string (optional)",
  phone: "string (optional)",
  name: "string",
  avatar: "string (optional)",
  roles: "array of strings (ex: ['particulier', 'vendeur'])",
  permissions: "array of strings (ex: ['admin.dashboard', 'commerce.create'])",
  emailVerified: "boolean",
  onboardingCompleted: "boolean",
  reputationScore: "number",
  city: "string (optional)",
  country: "string (optional)",
  language: "string (optional)",
  profession: "string (optional)",
  interests: "array of strings (optional)",
  isAdmin: "boolean (déprécié, utiliser permissions à la place)",
} as const;

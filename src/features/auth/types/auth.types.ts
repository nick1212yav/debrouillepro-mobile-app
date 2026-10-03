export type UserRole =
  | "particulier"
  | "professionnel"
  | "entreprise"
  | "association"
  | "ong"
  | "artisan"
  | "mine"
  | "administration";

export type AuthError = {
  code: string;
  message: string;
};

export type PhoneAuthStep = "phone" | "code" | "profile";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  emailVerified: boolean;
};

export type ConvexUser = {
  _id: string;
  uid: string;
  tokenIdentifier: string;

  email?: string;
  phone?: string;

  name: string;
  avatar?: string;

  roles: string[];
  permissions?: string[];

  emailVerified: boolean;
  onboardingCompleted: boolean;
  reputationScore: number;

  city?: string;
  country?: string;
  language?: string;
  profession?: string;
  interests?: string[];

  /**
   * @deprecated
   * Conservé uniquement pour la rétrocompatibilité.
   * Utiliser `permissions` pour les contrôles d'accès.
   */
  isAdmin?: boolean;
};

export type UserSyncData = {
  uid: string;
  tokenIdentifier: string;

  email?: string;
  phone?: string;

  name: string;
  avatar?: string;

  roles: string[];
  permissions?: string[];

  emailVerified: boolean;

  city?: string;
  country?: string;
  language?: string;
  profession?: string;
  interests?: string[];
};

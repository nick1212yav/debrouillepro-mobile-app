import type { ModuleId } from "@/config/modules/moduleRegistry";

/**
 * ============================================================
 * HOME — CONTEXT TYPES
 * ============================================================
 */

export type HomeContextSource =
  | "device"
  | "profile"
  | "session"
  | "location"
  | "weather"
  | "activity"
  | "preferences"
  | "system";

/**
 * Contexte géographique.
 */
export interface HomeLocationContext {
  latitude?: number;

  longitude?: number;

  city?: string;

  country?: string;

  countryCode?: string;

  region?: string;

  district?: string;

  neighborhood?: string;

  address?: string;

  /**
   * Distance approximative de l'utilisateur
   * par rapport à un élément.
   */
  radiusKm?: number;

  source?: HomeContextSource;

  updatedAt?: number | Date;
}

/**
 * Contexte météo.
 *
 * Toutes les propriétés sont optionnelles car
 * la météo peut être indisponible.
 */
export interface HomeWeatherContext {
  available: boolean;

  condition?:
    | "clear"
    | "cloudy"
    | "partly_cloudy"
    | "rain"
    | "storm"
    | "snow"
    | "fog"
    | "wind"
    | "unknown";

  temperature?: number;

  feelsLike?: number;

  humidity?: number;

  windSpeed?: number;

  precipitationProbability?: number;

  description?: string;

  icon?: string;

  unit?: "celsius" | "fahrenheit";

  updatedAt?: number | Date;
}

/**
 * Contexte appareil.
 */
export interface HomeDeviceContext {
  platform?: "web" | "android" | "ios";

  language?: string;

  locale?: string;

  timezone?: string;

  screenWidth?: number;

  screenHeight?: number;

  connectionType?: "wifi" | "cellular" | "ethernet" | "offline" | "unknown";

  isOnline?: boolean;

  reducedMotion?: boolean;
}

/**
 * Contexte de session.
 */
export interface HomeSessionContext {
  sessionId?: string;

  startedAt?: number | Date;

  lastActiveAt?: number | Date;

  isAuthenticated: boolean;

  userId?: string;

  anonymous?: boolean;
}

/**
 * Contexte d'activité.
 */
export interface HomeActivityContext {
  recentSearches?: string[];

  recentModules?: ModuleId[];

  recentItems?: string[];

  recentlyViewed?: string[];

  recentActions?: string[];

  lastActivityAt?: number | Date;
}

/**
 * Contexte utilisateur.
 */
export interface HomeUserContext {
  userId?: string;

  profileComplete?: boolean;

  preferredModules?: ModuleId[];

  categories?: string[];

  interests?: string[];

  language?: string;
}

/**
 * Contexte complet utilisé par Home.
 */
export interface HomeContext {
  user?: HomeUserContext;

  location?: HomeLocationContext;

  weather?: HomeWeatherContext;

  device?: HomeDeviceContext;

  session?: HomeSessionContext;

  activity?: HomeActivityContext;

  currentTime?: number | Date;

  dayOfWeek?: number;

  hour?: number;

  isDaytime?: boolean;

  isWeekend?: boolean;

  source?: HomeContextSource;

  metadata?: Record<string, unknown>;
}

/**
 * Entrée du moteur de contexte.
 */
export interface HomeContextInput {
  userId?: string;

  location?: HomeLocationContext;

  device?: HomeDeviceContext;

  session?: HomeSessionContext;

  activity?: HomeActivityContext;

  user?: HomeUserContext;
}

/**
 * Résultat du moteur de contexte.
 */
export interface HomeContextResult {
  context: HomeContext;

  generatedAt: Date;

  sources: HomeContextSource[];

  errors?: string[];
}

import type { FieldConfig } from "./field.types";
import type { ActionConfig } from "./action.types";
import type { ModuleCapabilities } from "./capability.types";

// ─── Interfaces de base ─────────────────────────────────────

export interface ModuleInfo {
  id: string;
  label: string;
  icon: string;
  color: string;
  gradient?: string;
  badge?: string;
  description?: string;
  version: string;
}

export interface ModuleSubtype {
  value: string;
  label: string;
  icon?: string;
  fields?: FieldConfig[];
}

export interface ModuleMetric {
  key: string;
  label: string;
  icon?: string;
  unit?: string;
  format?: (value: any) => string;
}

export type PermissionRule = string[] | ((context: any) => boolean);

export interface ModulePermissions {
  view?: PermissionRule;
  create?: PermissionRule;
  edit?: PermissionRule;
  delete?: PermissionRule;
}

export interface ModuleAI {
  category: string;
  matchingFields?: string[];
  embeddingFields?: string[];
  promptTemplate?: string;
}

export interface ModuleSEO {
  shareTitle?: (data: any) => string;
  shareDescription?: (data: any) => string;
  shareImage?: (data: any) => string;
}

export interface ModuleAnalytics {
  trackView?: boolean;
  trackCTA?: boolean;
  trackShare?: boolean;
  trackContact?: boolean;
  trackSave?: boolean;
  customEvents?: Record<string, (data: any) => void>;
}

export interface ModuleRoutes {
  detail: string;
  list?: string;
}

export interface CardLayout {
  hero?: string;
  sections?: string[];
  metrics?: string[];
  footer?: string[];
}

export interface ModuleDependencies {
  required: string[];
  optional?: string[];
  recommended?: string[];
}

export interface ModuleCompatibility {
  sdk: string;
  database?: string;
  api?: string;
}

export interface ModuleSearchConfig {
  filters: {
    key: string;
    label: string;
    type: "select" | "range" | "checkbox" | "text";
    options?: { label: string; value: string }[];
    min?: number;
    max?: number;
  }[];
  sorts?: { key: string; label: string }[];
  boosts?: { field: string; weight: number }[];
  facets?: {
    key: string;
    label: string;
    aggregation: "count" | "sum" | "avg";
  }[];
  suggestions?: string[];
  autocomplete?: boolean;
  ranking?: string[];
  aiRanking?: boolean;
  semanticSearch?: boolean;
  vectorFields?: string[];
  embeddingFields?: string[];
}

export interface ModuleLifecycle {
  beforeCreate?: (data: any) => Promise<any> | any;
  afterCreate?: (data: any) => Promise<void> | void;
  beforeUpdate?: (data: any, existing: any) => Promise<any> | any;
  afterUpdate?: (data: any) => Promise<void> | void;
  beforeDelete?: (data: any) => Promise<boolean> | boolean;
  afterDelete?: (data: any) => Promise<void> | void;
  beforeView?: (data: any) => Promise<void> | void;
  afterView?: (data: any) => Promise<void> | void;
  beforeShare?: (data: any) => Promise<void> | void;
  afterShare?: (data: any) => Promise<void> | void;
}

export interface ModuleAdapter {
  toModel: (formData: any) => any;
  fromModel: (model: any) => any;
  normalize?: (data: any) => Promise<any> | any;
  validate?: (data: any) => { valid: boolean; errors?: string[] };
  serialize?: (data: any) => any;
  deserialize?: (data: any) => any;
}

// ─── Manifeste principal ────────────────────────────────────

export interface ModuleManifest {
  info: ModuleInfo;
  subtypes: ModuleSubtype[];
  fields: FieldConfig[];
  actions: ActionConfig[];
  metrics: ModuleMetric[];
  routes?: ModuleRoutes;
  capabilities: ModuleCapabilities | ((context: any) => ModuleCapabilities);
  card: CardLayout;
  permissions?: ModulePermissions;
  ai?: ModuleAI;
  seo?: ModuleSEO;
  analytics?: ModuleAnalytics;
  search: ModuleSearchConfig;
  dependencies?: ModuleDependencies;
  compatibility?: ModuleCompatibility;
  defaults?: Record<string, any> | ((context: any) => Record<string, any>);
  featureFlags?: Record<string, boolean>;
  migration?: { from: string; migrate: (data: any) => any };
  lifecycle?: ModuleLifecycle;
  adapter?: ModuleAdapter;
  plugins?: string[];
  queries?: Record<string, string>;
  mutations?: Record<string, string>;
}
